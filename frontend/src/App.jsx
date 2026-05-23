import { useState, useRef, useEffect } from 'react';
import {
  detectEnvironment,
  isMiniPay,
  isFarcaster,
  getAccount,
  getAllBalances,
  sendToken,
  sendNative,
  waitForTx,
  onAccountChange,
  signalFarcasterReady,
} from './lib/celo';
import './index.css';

const API_URL = '/api/chat';
const USDm = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

const QUICK_ACTIONS = [
  { label: '💰 Check balance', msg: "What's my balance?" },
  { label: '📊 Spending summary', msg: 'Show my spending this month' },
  { label: '🎯 Create savings goal', msg: 'I want to create a savings goal' },
  { label: '💸 Send payment', msg: 'I want to send a payment' },
];

function MessageBubble({ message }) {
  return (
    <div className={`message ${message.role}`}>
      {message.content === '...' ? (
        <div className="typing">
          <span></span><span></span><span></span>
        </div>
      ) : (
        <>
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          {message.tx && <TransactionCard tx={message.tx} />}
          {message.action === 'minipay' && (
            <button className="minipay-btn" style={{ marginTop: 12 }} onClick={message.onPay}>
              🟡 Pay with MiniPay
            </button>
          )}
        </>
      )}
    </div>
  );
}

function TransactionCard({ tx }) {
  return (
    <div className="tx-card">
      <div className="tx-card-header">
        <span className="tx-amount">{tx.amount} USDm</span>
        <span className="tx-status">{tx.status || 'Confirmed'}</span>
      </div>
      {tx.to && (
        <div className="tx-detail">
          <span>To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
          <span>{tx.category || ''}</span>
        </div>
      )}
      {tx.hash && (
        <div className="tx-detail">
          <a href={`https://celoscan.io/tx/${tx.hash}`} target="_blank" rel="noopener">
            View on Celoscan ↗
          </a>
        </div>
      )}
    </div>
  );
}

function BalanceCards({ balances }) {
  if (!balances) return null;

  const tokens = [
    { name: 'CELO', value: balances.native?.formatted },
    { name: 'USDm', value: balances.usdm?.formatted },
    { name: 'USDC', value: balances.usdc?.formatted },
    { name: 'USDT', value: balances.usdt?.formatted },
  ];

  return (
    <div className="balance-grid">
      {tokens.map(token => (
        <div key={token.name} className="balance-card">
          <div className="token">{token.name}</div>
          <div className="amount">{parseFloat(token.value || 0).toFixed(token.name === 'CELO' ? 4 : 2)}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [env, setEnv] = useState(null); // 'farcaster' | 'minipay' | 'browser'
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize: detect environment + auto-connect
  useEffect(() => {
    async function init() {
      try {
        // 1. Detect environment
        const environment = await detectEnvironment();
        setEnv(environment);

        // 2. Signal Farcaster ready (hides splash)
        if (environment === 'farcaster') {
          await signalFarcasterReady();
        }

        // 3. Auto-connect if MiniPay or Farcaster
        if (environment === 'farcaster' || environment === 'minipay') {
          const addr = await getAccount();
          if (addr) {
            setWallet({ address: addr });
            try {
              const bal = await getAllBalances(addr);
              setBalances(bal);
            } catch (e) {
              console.warn('[MiniMate] Failed to load balances:', e.message);
            }
            setShowWelcome(false);
            setMessages([{
              role: 'assistant',
              content: `✅ Connected!\n\nI'm MiniMate, your AI finance assistant on Celo. 🤖\n\nWhat would you like to do?`,
            }]);
          }
        }
      } catch (e) {
        console.error('[MiniMate] Init error:', e);
      }
    }
    init();
  }, []);

  // Listen for account changes (MiniPay)
  useEffect(() => {
    onAccountChange(async (addr) => {
      if (addr) {
        setWallet({ address: addr });
        try {
          const bal = await getAllBalances(addr);
          setBalances(bal);
        } catch {}
      } else {
        setWallet(null);
        setBalances(null);
      }
    });
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    setShowWelcome(false);
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '...' }]);

    try {
      const payload = {
        messages: [...messages, userMsg].filter((m) => m.content !== '...'),
        wallet: wallet,
      };

      console.log('[MiniMate] Sending to API:', API_URL, 'wallet:', wallet?.address);

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[MiniMate] API response status:', res.status);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown');
        console.error('[MiniMate] API error body:', errText);
        throw new Error(`API error ${res.status}: ${errText.slice(0, 100)}`);
      }

      const data = await res.json();
      console.log('[MiniMate] API response OK, action:', data.action);

      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [
          ...clean,
          {
            role: 'assistant',
            content: data.message,
            tx: data.tx,
            action: data.action,
            onPay: data.action === 'minipay' ? () => executePayment(data.tx) : undefined,
          },
        ];
      });

      if (data.wallet) setWallet(data.wallet);
    } catch (err) {
      console.error('[MiniMate] Send message error:', err.message, err.stack);
      const errorMsg = err.message || 'Unknown error';
      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [...clean, { role: 'assistant', content: `❌ ${errorMsg}` }];
      });
    }

    setLoading(false);
  };

  const executePayment = async (tx) => {
    if (!tx || !tx.to || !tx.amount) return;

    setMessages((prev) => [...prev, { role: 'assistant', content: '...' }]);

    try {
      let hash;
      if (tx.token === 'celo') {
        hash = await sendNative(tx.to, tx.amount);
      } else {
        hash = await sendToken(USDm, tx.to, tx.amount);
      }

      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [
          ...clean,
          {
            role: 'assistant',
            content: `✅ **Payment Sent!**\n\n• Amount: ${tx.amount} ${tx.token || 'USDm'}\n• To: ${tx.to.slice(0, 8)}...\n• TX: ${hash.slice(0, 16)}...`,
            tx: { ...tx, hash, status: 'Confirmed' },
          },
        ];
      });
    } catch (err) {
      console.error('[MiniMate] Payment error:', err);
      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [...clean, { role: 'assistant', content: `❌ Payment failed: ${err.message}` }];
      });
    }
  };

  const handleManualConnect = async () => {
    try {
      const addr = await getAccount();
      if (addr) {
        setWallet({ address: addr });
        const bal = await getAllBalances(addr);
        setBalances(bal);
        setShowWelcome(false);
        setMessages([{
          role: 'assistant',
          content: `✅ Connected!\n\nI'm MiniMate, your AI finance assistant on Celo. 🤖\n\nWhat would you like to do?`,
        }]);
      }
    } catch (err) {
      setMessages([{
        role: 'assistant',
        content: `❌ Could not connect wallet: ${err.message}`,
      }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const envLabel = env === 'farcaster' ? 'Farcaster' : env === 'minipay' ? 'MiniPay' : '';

  return (
    <div className="chat-container">
      <div className="header">
        <div className="header-icon">
          <img src="/logo.png" alt="MiniMate" />
        </div>
        <div className="header-info">
          <h1>MiniMate</h1>
          <p>AI Finance on Celo {envLabel ? `(${envLabel})` : ''}</p>
        </div>
        {wallet ? (
          <div className="wallet-badge">
            <span className="wallet-dot"></span>
            {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
          </div>
        ) : (
          <button className="quick-btn" onClick={handleManualConnect} style={{ marginLeft: 'auto' }}>
            Connect
          </button>
        )}
      </div>

      <div className="messages">
        {showWelcome && messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-hero">
              <div className="welcome-logo">
                <img src="/logo.png" alt="MiniMate" />
              </div>
              <h2>MiniMate</h2>
              <p className="welcome-tagline">AI-powered finance on Celo. Chat to manage your crypto.</p>
            </div>

            <div className="feature-grid">
              <div className="feature-card" onClick={() => sendMessage("What's my balance?")}>
                <span className="feature-icon">💰</span>
                <span className="feature-label">Balance</span>
                <span className="feature-desc">Check all tokens</span>
              </div>
              <div className="feature-card" onClick={() => sendMessage("Send a payment")}>
                <span className="feature-icon">💸</span>
                <span className="feature-label">Pay</span>
                <span className="feature-desc">Send via chat</span>
              </div>
              <div className="feature-card" onClick={() => sendMessage("Create a savings goal")}>
                <span className="feature-icon">🎯</span>
                <span className="feature-label">Save</span>
                <span className="feature-desc">Goals + auto-save</span>
              </div>
              <div className="feature-card" onClick={() => sendMessage("Show my spending")}>
                <span className="feature-icon">📊</span>
                <span className="feature-label">Track</span>
                <span className="feature-desc">Spending breakdown</span>
              </div>
            </div>

            {balances && <BalanceCards balances={balances} />}

            <div className="welcome-footer">
              <span className="powered-badge">
                <span className="powered-dot"></span>
                Powered by Celo
              </span>
            </div>
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-actions">
        {QUICK_ACTIONS.map((action, i) => (
          <button key={i} className="quick-btn" onClick={() => sendMessage(action.msg)} disabled={loading}>
            {action.label}
          </button>
        ))}
      </div>

      <form className="input-container" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your finances..."
            disabled={loading}
          />
          <button className="send-btn" type="submit" disabled={loading || !input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
