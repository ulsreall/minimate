import { useState, useRef, useEffect } from 'react';
import './index.css';

const API_URL = '/api/chat';

const QUICK_ACTIONS = [
  { label: '💰 Check balance', msg: 'What\'s my balance?' },
  { label: '📊 Spending summary', msg: 'Show my spending this month' },
  { label: '🎯 Create savings goal', msg: 'I want to create a savings goal' },
  { label: '💸 Send payment', msg: 'I want to send a payment' },
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message ${message.role}`}>
      {!isUser && message.content === '...' ? (
        <div className="typing">
          <span></span><span></span><span></span>
        </div>
      ) : (
        <>
          <div>{message.content}</div>
          {message.tx && <TransactionCard tx={message.tx} />}
          {message.action === 'minipay' && (
            <button className="minipay-btn" style={{ marginTop: 8 }}>
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
        <span className="tx-amount">{tx.amount} cUSD</span>
        <span className="tx-status">{tx.status || 'Confirmed'}</span>
      </div>
      <div className="tx-detail">
        <span>To: {tx.to?.slice(0, 6)}...{tx.to?.slice(-4)}</span>
        <span>{tx.category}</span>
      </div>
      {tx.hash && (
        <div className="tx-detail">
          <span>TX: {tx.hash.slice(0, 10)}...</span>
          <span>{new Date(tx.timestamp * 1000).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm MiniMate, your AI finance assistant on Celo. 🤖\n\nI can help you:\n• Check balances & spending\n• Send payments\n• Create savings goals\n• Analyze your finances\n\nWhat would you like to do?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Add typing indicator
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

      // Remove typing indicator, add real response
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.content !== '...');
        return [
          ...withoutTyping,
          {
            role: 'assistant',
            content: data.message,
            tx: data.tx,
            action: data.action,
          },
        ];
      });

      if (data.wallet) setWallet(data.wallet);
    } catch (err) {
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.content !== '...');
        return [
          ...withoutTyping,
          {
            role: 'assistant',
            content: "Sorry, something went wrong. Please try again.",
          },
        ];
      });
    }

    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="header">
        <div className="header-icon">🤖</div>
        <div className="header-info">
          <h1>MiniMate</h1>
          <p>AI Finance Assistant on Celo</p>
        </div>
        {wallet ? (
          <div className="wallet-badge">
            <span className="wallet-dot"></span>
            {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
          </div>
        ) : (
          <button
            className="quick-btn"
            onClick={() => sendMessage('Connect my wallet')}
            style={{ marginLeft: 'auto' }}
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            className="quick-btn"
            onClick={() => sendMessage(action.msg)}
            disabled={loading}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
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
