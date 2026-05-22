import { useState, useRef, useEffect } from 'react';
import { isMiniPay, getAccount, getAllBalances, sendToken, sendNative, waitForTx, onAccountChange } from './lib/celo';
import './index.css';

const API_URL = '/api/chat';
const USDm = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

const QUICK_ACTIONS = [
  { label: '💰 Check balance', msg: 'What\'s my balance?' },
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
            <button className="minipay-btn" style={{ marginTop: 8 }} onClick={message.onPay}>
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
          <a href={`https://celoscan.io/tx/${tx.hash}`} target="_blank" rel="noopener" style={{ color: '#10B981' }}>
            View on Celoscan ↗
          </a>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isMiniPay()
        ? "Hey! I'm MiniMate, your AI finance assistant on Celo. 🤖\n\nI can help you:\n• Check balances & spending\n• Send payments\n• Create savings goals\n• Analyze your finances\n\nWhat would you like to do?"
        : "Hey! I'm MiniMate. 👋\n\nFor the best experience, open this app in MiniPay.\n\nYou can still explore in view-only mode. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-connect if MiniPay
  useEffect(() => {
    async function connect() {
      if (isMiniPay()) {
        const addr = await getAccount();
        if (addr) {
          setWallet({ address: addr });
          const balances = await getAllBalances(addr);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `✅ Connected!\n\n💰 **Your Balances:**\n• Native CELO: ${parseFloat(balances.native.formatted).toFixed(4)}\n• USDm: ${parseFloat(balances.usdm.formatted).toFixed(2)}\n• USDC: ${parseFloat(balances.usdc.formatted).toFixed(2)}\n• USDT: ${parseFloat(balances.usdt.formatted).toFixed(2)}`,
            },
          ]);
        }
      }
    }
    connect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    onAccountChange((addr) => {
      if (addr) {
        setWallet({ address: addr });
      } else {
        setWallet(null);
      }
    });
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '...' }]);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].filter((m) => m.content !== '...'),
          wallet: wallet,
        }),
      });

      const data = await res.json();

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
      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [...clean, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }];
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
      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [...clean, { role: 'assistant', content: `❌ Payment failed: ${err.message}` }];
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chat-container">
      <div className="header">
        <div className="header-icon">🤖</div>
        <div className="header-info">
          <h1>MiniMate</h1>
          <p>AI Finance on Celo {isMiniPay() ? '(MiniPay)' : ''}</p>
        </div>
        {wallet ? (
          <div className="wallet-badge">
            <span className="wallet-dot"></span>
            {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
          </div>
        ) : (
          <button className="quick-btn" onClick={() => sendMessage('Connect my wallet')} style={{ marginLeft: 'auto' }}>
            Connect
          </button>
        )}
      </div>

      <div className="messages">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
