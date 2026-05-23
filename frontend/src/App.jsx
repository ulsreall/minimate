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
const USDC = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
const USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';
const TOKEN_MAP = { usdm: USDm, usdc: USDC, usdt: USDT };

// ─── Savings Goals (localStorage) ──────────────────────────────────
const GOALS_KEY = 'minimate_goals';

function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY)) || [];
  } catch { return []; }
}

function saveGoal(goal) {
  const goals = loadGoals();
  goals.push({ ...goal, id: Date.now(), saved: 0, createdAt: new Date().toISOString() });
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  return goals;
}

function formatGoals(goals, currentBalance) {
  if (goals.length === 0) return "🎯 **Your Savings Goals**\n\nNo goals yet. Try \"Save 100 for vacation\"!";
  return goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, ((g.saved || 0) / g.target * 100)).toFixed(0) : 0;
    const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
    const remaining = Math.max(0, g.target - (g.saved || 0));
    return `🎯 **${g.name}**\n   Target: ${g.target} USDm | Saved: ${(g.saved || 0).toFixed(2)} USDm\n   ${bar} ${pct}% | ${remaining.toFixed(2)} to go\n   Deadline: ${g.deadline || 'No deadline'}`;
  }).join('\n\n');
}

const QUICK_ACTIONS = [
  { icon: '💰', label: 'Balance', sub: 'View tokens', msg: "What's my balance?" },
  { icon: '📋', label: 'History', sub: 'Recent txs', msg: 'Show my recent transactions' },
  { icon: '🎯', label: 'Set Goal', sub: 'Save up', msg: 'I want to create a savings goal' },
  { icon: '💸', label: 'Send', sub: 'Transfer', msg: 'I want to send a payment' },
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
        <span className="tx-amount">{tx.amount} {tx.token?.toUpperCase() === 'CELO' ? 'CELO' : tx.token || 'USDm'}</span>
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
          <a href={`https://celo.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noopener">
            Blockscout ↗
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
  const [sendFlow, setSendFlow] = useState(null); // { step, amount, token, to }
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

    // ─── Send Flow Interception ─────────────────────────────────
    if (sendFlow) {
      const step = sendFlow.step;
      const msg = text.trim();

      if (step === 'amount') {
        const num = parseFloat(msg);
        if (isNaN(num) || num <= 0) {
          setMessages(prev => [...prev,
            { role: 'user', content: msg },
            { role: 'assistant', content: '⚠️ Please enter a valid amount (e.g. 10, 0.5, 100)' }
          ]);
          setInput('');
          return;
        }
        const newFlow = { ...sendFlow, amount: num, step: 'token' };
        setSendFlow(newFlow);
        const isMiniPayEnv = env === 'minipay';
        const tokenPrompt = isMiniPayEnv
          ? `💰 Amount: **${num}**\n\nWhich token?\n\n• **USDm** — Celo Dollar ⭐\n• **USDC** — USD Coin\n• **USDT** — Tether\n\nType the token name (e.g. "USDm")`
          : `💰 Amount: **${num}**\n\nWhich token?\n\n• **CELO** — native token\n• **USDm** — Celo Dollar\n• **USDC** — USD Coin\n• **USDT** — Tether\n\nType the token name (e.g. "CELO" or "USDm")`;
        setMessages(prev => [...prev,
          { role: 'user', content: msg },
          { role: 'assistant', content: tokenPrompt }
        ]);
        setInput('');
        return;
      }

      if (step === 'token') {
        const token = msg.toUpperCase().replace(/[^A-Z]/g, '');
        const valid = ['CELO', 'USDM', 'USDm', 'USDC', 'USDT'];
        const matched = valid.find(v => v.toUpperCase() === token);
        if (!matched) {
          setMessages(prev => [...prev,
            { role: 'user', content: msg },
            { role: 'assistant', content: '⚠️ Invalid token. Choose: **CELO**, **USDm**, **USDC**, or **USDT**' }
          ]);
          setInput('');
          return;
        }
        const displayToken = matched === 'USDM' ? 'USDm' : matched;
        const newFlow = { ...sendFlow, token: displayToken, step: 'to' };
        setSendFlow(newFlow);
        setMessages(prev => [...prev,
          { role: 'user', content: msg },
          { role: 'assistant', content: `🪙 Token: **${displayToken}**\n\nNow paste the recipient address:\n\n(e.g. \`0x721e...A522\`)` }
        ]);
        setInput('');
        return;
      }

      if (step === 'to') {
        const addr = msg.trim();
        if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
          setMessages(prev => [...prev,
            { role: 'user', content: addr },
            { role: 'assistant', content: '⚠️ Invalid address. Must be `0x` + 40 hex characters.\n\nPlease paste a valid Celo address.' }
          ]);
          setInput('');
          return;
        }
        const { amount, token } = sendFlow;
        setSendFlow(null);
        setMessages(prev => [...prev,
          { role: 'user', content: addr },
          {
            role: 'assistant',
            content: `✅ **Confirm Payment**\n\n• Amount: **${amount} ${token}**\n• To: \`${addr.slice(0, 8)}...${addr.slice(-6)}\`\n\nTap below to send:`,
            action: 'minipay',
            tx: { to: addr, amount: String(amount), token: token.toLowerCase() === 'celo' ? 'celo' : 'usdm', status: 'Ready' },
            onPay: () => executePayment({ to: addr, amount: String(amount), token: token.toLowerCase() === 'celo' ? 'celo' : 'usdm' }),
          }
        ]);
        setInput('');
        return;
      }
    }

    // ─── Detect "send" trigger ──────────────────────────────────
    const lowerText = text.toLowerCase();
    if (lowerText === 'send' || lowerText === 'kirim' || lowerText === 'bayar' ||
        lowerText === 'i want to send a payment' || lowerText === 'send a payment' ||
        lowerText === 'transfer') {
      setSendFlow({ step: 'amount', amount: null, token: null, to: null });
      setShowWelcome(false);
      setMessages(prev => [...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: '💸 **Send Payment**\n\nStep 1/3 — How much do you want to send?\n\nType an amount (e.g. `10`, `0.5`, `100`)' }
      ]);
      setInput('');
      return;
    }

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

      // Handle goal actions client-side
      let responseContent = data.message;
      let responseAction = data.action;

      if (data.action === 'create_goal' && data.data) {
        saveGoal({
          name: data.data.name,
          target: parseFloat(data.data.target),
          deadline: data.data.deadline,
        });
      }

      if (data.action === 'get_goals') {
        const goals = loadGoals();
        responseContent = formatGoals(goals, balances);
        responseAction = null; // Don't show action button
      }

      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [
          ...clean,
          {
            role: 'assistant',
            content: responseContent,
            tx: data.tx,
            action: responseAction,
            onPay: data.action === 'minipay' ? () => executePayment(data.tx) : undefined,
          },
        ];
      });

      if (data.wallet) setWallet(data.wallet);
    } catch (err) {
      console.error('[MiniMate] Send message error:', err.message, err.stack);
      let friendly = '';
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        friendly = '🌐 **Connection issue.** Could not reach MiniMate server. Please check your internet and try again.';
      } else if (err.message?.includes('500')) {
        friendly = '⚙️ **Server error.** Something went wrong on our end. Please try again in a moment.';
      } else if (err.message?.includes('429')) {
        friendly = '⏳ **Too many requests.** Please wait a moment before trying again.';
      } else {
        friendly = `❌ **Something went wrong.** ${err.message?.slice(0, 100) || 'Unknown error'}\n\nPlease try again.`;
      }
      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [...clean, { role: 'assistant', content: friendly }];
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
        const tokenAddr = TOKEN_MAP[tx.token] || USDm;
        hash = await sendToken(tokenAddr, tx.to, tx.amount);
      }

      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return [
          ...clean,
          {
            role: 'assistant',
            content: `✅ **Payment Sent!**\n\n• Amount: **${tx.amount} ${tx.token || 'USDm'}**\n• To: \`${tx.to}\`\n• Time: ${now}\n• TX: \`${hash}\``,
            tx: { ...tx, hash, status: 'Confirmed', timestamp: now },
          },
        ];
      });
    } catch (err) {
      console.error('[MiniMate] Payment error:', err);
      const errMsg = err.message || '';
      let friendly = '';
      if (errMsg.includes('user rejected') || errMsg.includes('User rejected') || errMsg.includes('denied')) {
        friendly = '🚫 **Transaction cancelled.** You rejected the transaction in your wallet.';
      } else if (errMsg.includes('insufficient') || errMsg.includes('balance') || errMsg.includes('exceeds')) {
        friendly = '💸 **Insufficient balance.** You don't have enough tokens for this transaction.\n\nTry a smaller amount or check your balance first.';
      } else if (errMsg.includes('network') || errMsg.includes('fetch') || errMsg.includes('timeout')) {
        friendly = '🌐 **Network error.** Could not reach Celo network. Please check your connection and try again.';
      } else if (errMsg.includes('chain') || errMsg.includes('switch')) {
        friendly = '🔗 **Wrong network.** Please switch to Celo mainnet in your wallet.';
      } else {
        friendly = `❌ **Payment failed.** ${errMsg.slice(0, 120)}\n\nPlease try again. If this keeps happening, try refreshing the app.`;
      }
      setMessages((prev) => {
        const clean = prev.filter((m) => m.content !== '...');
        return [...clean, { role: 'assistant', content: friendly }];
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
        ) : env === 'minipay' ? null : (
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
            <span className="quick-icon">{action.icon}</span>
            <span className="quick-text">
              <span className="quick-label">{action.label}</span>
              <span className="quick-sub">{action.sub}</span>
            </span>
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
