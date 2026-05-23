import { createPublicClient, http, formatEther, getContract } from 'viem';
import { celo } from 'viem/chains';

// Celo Mainnet configuration
const CELO_RPC = 'https://forno.celo.org';
const BLOCKSCOUT_API = 'https://celo.blockscout.com/api/v2';

// Stablecoin addresses (MiniPay compatible)
const USDm_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const USDC_ADDRESS = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
const USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Known Celo protocol addresses for auto-categorization
const KNOWN_CONTRACTS = {
  // Mento (DEX) — swap = shopping/exchange
  '0xE3d6Af48a3DE95816971bC64763302A2bD5C0B37': 'Shopping',
  '0x621ABa270a8F43f8e8a2D0F2f8c8B7E5e4b6c8A1': 'Shopping',
  // GoodDollar — UBI claims
  '0x6f4A6262E0Be1B84eC7b7D4E6C09c0C0c8B1C123': 'Savings',
  // ImpactMarket — UBI
  '0x0D0E364aa78b32e7F3B6d5F2D5C5A6b4A3E2F1A0': 'Savings',
};

// Category emoji mapping
const CATEGORY_EMOJI = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Bills: '💡',
  Entertainment: '🎮',
  Health: '🏥',
  Education: '📚',
  Savings: '💰',
  DeFi: '🔄',
  Other: '📦',
};

// Category mapping
const CATEGORIES = Object.keys(CATEGORY_EMOJI);

// Minimal ERC20 ABI
const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
];

// Create public client for server-side reads
const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC),
});

// ─── Blockscout API ────────────────────────────────────────────────

async function fetchTransactions(address, limit = 50) {
  try {
    const res = await fetch(
      `${BLOCKSCOUT_API}/addresses/${address}/transactions?limit=${limit}&order=desc`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('[Blockscout] Fetch tx error:', err.message);
    return [];
  }
}

// ─── Categorization Engine ─────────────────────────────────────────

function categorizeTx(tx, userAddress) {
  const to = tx.to?.toLowerCase();
  const from = tx.from?.toLowerCase();
  const user = userAddress.toLowerCase();

  // Known contract → auto category
  if (to && KNOWN_CONTRACTS[to]) return KNOWN_CONTRACTS[to];

  // Self-transfer (internal move)
  if (from === to) return 'Savings';

  // Token transfer detection
  if (tx.method === 'transfer' || tx.method === 'transferFrom') {
    // If receiving money, categorize as income/savings
    if (to === user) return 'Other';
    // Sending = spending by default
    return 'Other';
  }

  // Swap on DEX
  if (tx.method === 'swap' || tx.method === 'swapExactTokens') return 'Shopping';

  // Approve = DeFi interaction
  if (tx.method === 'approve') return 'DeFi';

  // Small amount transfers = likely daily spending
  const value = parseFloat(tx.value || '0');
  if (value > 0 && value < 1) return 'Transport'; // small CELO = gas/tips
  if (value >= 1 && value < 10) return 'Food';
  if (value >= 10 && value < 50) return 'Shopping';
  if (value >= 50) return 'Bills';

  return 'Other';
}

async function analyzeSpending(address) {
  const txs = await fetchTransactions(address, 100);
  if (txs.length === 0) return null;

  const user = address.toLowerCase();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter outgoing txs this month
  const outgoingTxs = txs.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return tx.from?.toLowerCase() === user && txDate >= monthStart;
  });

  // Categorize and sum
  const breakdown = {};
  let totalSpent = 0;

  for (const tx of outgoingTxs) {
    const category = categorizeTx(tx, address);
    const value = parseFloat(formatEther(BigInt(tx.value || '0')));
    if (value > 0) {
      breakdown[category] = (breakdown[category] || 0) + value;
      totalSpent += value;
    }
  }

  return {
    totalTx: outgoingTxs.length,
    totalSpent: totalSpent.toFixed(4),
    breakdown,
    recentTxs: outgoingTxs.slice(0, 5).map(tx => ({
      hash: tx.hash,
      to: tx.to,
      value: formatEther(BigInt(tx.value || '0')),
      timestamp: tx.timestamp,
      category: categorizeTx(tx, address),
      method: tx.method,
    })),
  };
}

async function getTransactionHistory(address, limit = 10) {
  const txs = await fetchTransactions(address, limit);
  return txs.map(tx => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: formatEther(BigInt(tx.value || '0')),
    timestamp: tx.timestamp,
    method: tx.method,
    status: tx.status,
    block: tx.block,
  }));
}

// Execute blockchain actions
async function executeAction(action, params, walletAddress) {
  try {
    switch (action) {
      case 'check_balance': {
        let address = (params.address || walletAddress)?.toLowerCase();
        if (address && !/^0x[0-9a-f]{40}$/.test(address)) {
          return { message: "⚠️ **Invalid address.** That doesn't look like a valid Celo wallet address.\n\nMake sure it starts with `0x` and is 42 characters long." };
        }
        if (!address) {
          return { message: "🔗 **No wallet connected.**\n\nTo check your balance:\n• Open this app in MiniPay\n• Or connect a wallet\n• Or paste your address: `0x...`" };
        }

        const [nativeBalance, usdmBalance, usdcBalance, usdtBalance] = await Promise.all([
          publicClient.getBalance({ address }),
          getBalance(USDm_ADDRESS, address),
          getBalance(USDC_ADDRESS, address),
          getBalance(USDT_ADDRESS, address),
        ]);

        return {
          message: `💰 **Your Balances**\n\n• CELO: ${parseFloat(formatEther(nativeBalance)).toFixed(4)}\n• USDm: ${parseFloat(formatEther(usdmBalance)).toFixed(2)}\n• USDC: ${parseFloat(formatEther(usdcBalance)).toFixed(2)}\n• USDT: ${parseFloat(formatEther(usdtBalance)).toFixed(2)}`,
          data: {
            celo: formatEther(nativeBalance),
            usdm: formatEther(usdmBalance),
            usdc: formatEther(usdcBalance),
            usdt: formatEther(usdtBalance),
          },
        };
      }

      case 'send_payment': {
        const { to, amount, category, description } = params;
        if (!to || !amount) {
          return { message: "I need the recipient address and amount. Who would you like to pay?" };
        }

        const catIndex = CATEGORIES.indexOf(category || 'Other');

        return {
          message: `💸 **Payment Ready**\n\n• To: \`${to}\`\n• Amount: ${amount} USDm\n• Category: ${CATEGORIES[catIndex]}\n• Note: ${description || 'Payment'}\n\nTap the button below to confirm:`,
          action: 'minipay',
          tx: {
            to,
            amount,
            token: 'usdm',
            category: CATEGORIES[catIndex],
            status: 'Ready',
          },
        };
      }

      case 'create_goal': {
        const { name, target, deadline } = params;
        if (!name || !target) {
          return { message: "What would you like to save for? Tell me the goal name and target amount." };
        }

        const deadlineDate = deadline
          ? new Date(deadline).toLocaleDateString()
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString();

        return {
          message: `🎯 **Savings Goal Created!**\n\n• Goal: ${name}\n• Target: ${target} USDm\n• Deadline: ${deadlineDate}\n\nI'll track your progress automatically. You can check anytime by asking "Show my goals".`,
          action: 'create_goal',
          data: { name, target, deadline: deadlineDate },
        };
      }

      case 'get_goals': {
        // Goals are managed client-side via localStorage
        // This message is a fallback — frontend will override with actual goals
        return {
          message: `🎯 **Your Savings Goals**\n\nNo goals saved yet. Try "Create a savings goal for vacation targeting 50 USDm" to get started!`,
          action: 'get_goals',
        };
      }

      case 'get_transactions': {
        const address = (params.address || walletAddress)?.toLowerCase();
        if (!address || !/^0x[0-9a-f]{40}$/.test(address)) {
          return { message: "Please connect your wallet to view transactions." };
        }

        const txs = await getTransactionHistory(address, 10);
        if (txs.length === 0) {
          return { message: "📋 **Recent Transactions**\n\nNo transactions yet! Here's what will show up here:\n\n• 💸 Payments you send\n• 💰 Tokens you receive\n• 🔄 DEX swaps\n• 📊 All on-chain activity\n\nTry sending a payment to see your history grow!" };
        }

        const txLines = txs.map(tx => {
          const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isIncoming = tx.to?.toLowerCase() === address;
          const arrow = isIncoming ? '←' : '→';
          const shortTo = isIncoming
            ? `from ${tx.from?.slice(0, 6)}...`
            : `to ${tx.to?.slice(0, 6)}...`;
          return `• ${date} ${arrow} ${parseFloat(tx.value).toFixed(4)} CELO ${shortTo}`;
        }).join('\n');

        return {
          message: `📋 **Recent Transactions**\n\n${txLines}\n\nView all on [Celoscan](https://celoscan.io/address/${address})`,
          data: { transactions: txs },
        };
      }

      case 'get_spending': {
        const address = (params.address || walletAddress)?.toLowerCase();
        if (!address || !/^0x[0-9a-f]{40}$/.test(address)) {
          return { message: "Please connect your wallet to see spending analysis." };
        }

        const analysis = await analyzeSpending(address);
        if (!analysis || analysis.totalTx === 0) {
          return {
            message: `📊 **Spending Breakdown**\n\nNo spending data this month yet! Once you start transacting, I'll automatically categorize your spending:\n\n${CATEGORIES.map(c => `${CATEGORY_EMOJI[c]} ${c}`).join(' | ')}\n\n💡 **Tip:** Send a payment or swap tokens to see your breakdown.`,
          };
        }

        // Build breakdown lines sorted by amount
        const sorted = Object.entries(analysis.breakdown)
          .sort((a, b) => b[1] - a[1]);

        const breakdownLines = sorted.map(([cat, amount]) => {
          const emoji = CATEGORY_EMOJI[cat] || '📦';
          const pct = analysis.totalSpent > 0
            ? ((amount / parseFloat(analysis.totalSpent)) * 100).toFixed(0)
            : 0;
          return `${emoji} **${cat}**: ${amount.toFixed(4)} CELO (${pct}%)`;
        }).join('\n');

        // Recent tx lines
        const recentLines = analysis.recentTxs.map(tx => {
          const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const emoji = CATEGORY_EMOJI[tx.category] || '📦';
          return `• ${date} ${emoji} ${parseFloat(tx.value).toFixed(4)} CELO → ${tx.to?.slice(0, 6)}...`;
        }).join('\n');

        return {
          message: `📊 **Spending Breakdown — This Month**\n\n💰 **Total**: ${analysis.totalSpent} CELO across ${analysis.totalTx} transactions\n\n${breakdownLines}\n\n**Recent spending:**\n${recentLines}`,
          data: { analysis },
        };
      }

      default:
        return { message: "I'm not sure how to do that yet. Try asking me to check your balance, send a payment, or create a savings goal!" };
    }
  } catch (err) {
    console.error('Action error:', err);
    const msg = err.message || '';
    if (msg.includes('rate limit') || msg.includes('429')) {
      return { message: "⏳ **Rate limited.** Too many requests to Celo network. Please wait a moment and try again." };
    }
    if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
      return { message: "⏰ **Request timed out.** The Celo network is taking too long to respond. Please try again." };
    }
    if (msg.includes('network') || msg.includes('fetch failed')) {
      return { message: "🌐 **Network error.** Could not reach Celo RPC. Please try again in a moment." };
    }
    return { message: `❌ **Something went wrong.** ${msg.slice(0, 100)}\n\nPlease try again.` };
  }
}

// Helper: get ERC20 balance via viem
async function getBalance(tokenAddress, userAddress) {
  try {
    const contract = getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: publicClient,
    });
    return await contract.read.balanceOf([userAddress]);
  } catch {
    return 0n;
  }
}

// Generate response based on user message
function generateResponse(userMessage, walletAddress) {
  const msg = userMessage.toLowerCase();

  if (msg.includes('balance') || msg.includes('berapa') || msg.includes('how much')) {
    return executeAction('check_balance', {}, walletAddress);
  }

  if (msg.includes('send') || msg.includes('pay') || msg.includes('kirim') || msg.includes('bayar')) {
    const amountMatch = msg.match(/(\d+\.?\d*)\s*(cusd|usdm|celo|usdc|usdt)?/);
    if (amountMatch) {
      return executeAction('send_payment', {
        amount: amountMatch[1],
        category: 'Other',
        description: 'Payment'
      }, walletAddress);
    }
    return Promise.resolve({ message: "I'd be happy to help you send a payment! How much would you like to send, and to which address?" });
  }

  // Savings goal — parse name and target from natural language
  if (msg.includes('goal') || msg.includes('save') || msg.includes('tabung') || msg.includes('sisih')) {
    // Try to extract: "save 100 for vacation" or "goal 50 USDm emergency fund"
    const targetMatch = msg.match(/(\d+\.?\d*)/);
    const target = targetMatch ? targetMatch[1] : '100';

    // Extract goal name (everything after "for" or "named" or just use default)
    let name = 'My Savings';
    const forMatch = msg.match(/(?:for|named?|buat)\s+(.+?)(?:\s*$|\s*\d)/);
    if (forMatch) name = forMatch[1].trim();
    else if (msg.includes('vacation') || msg.includes('liburan')) name = 'Vacation';
    else if (msg.includes('emergency') || msg.includes('darurat')) name = 'Emergency Fund';
    else if (msg.includes('phone') || msg.includes('hp')) name = 'New Phone';
    else if (msg.includes('laptop')) name = 'Laptop';

    return executeAction('create_goal', { name, target }, walletAddress);
  }

  if (msg.includes('spend') || msg.includes('expense') || msg.includes('habis') || msg.includes('pengeluaran') || msg.includes('breakdown')) {
    return executeAction('get_spending', {}, walletAddress);
  }

  if (msg.includes('transaction') || msg.includes('history') || msg.includes('riwayat') || msg.includes('activity')) {
    return executeAction('get_transactions', {}, walletAddress);
  }

  if (msg.includes('my goal') || msg.includes('show goal') || msg.includes('goal progress') || msg.includes('tabunganku')) {
    return executeAction('get_goals', {}, walletAddress);
  }

  if (msg.includes('connect') || msg.includes('wallet')) {
    return Promise.resolve({
      message: "🔗 **Connect Your Wallet**\n\nTo use MiniMate, open this app in MiniPay:\n\n1. Open MiniPay on your phone\n2. Go to Mini Apps\n3. Find MiniMate\n4. Start chatting!\n\nOr paste your wallet address to view-only mode.",
      action: 'connect',
    });
  }

  if (msg.includes('help') || msg.includes('bantuan') || msg.includes('what can')) {
    return Promise.resolve({
      message: "🤖 **What I Can Do**\n\n• 💰 **Check balance** — View your CELO, USDm, USDC, USDT\n• 💸 **Send payments** — Pay anyone on Celo\n• 🎯 **Savings goals** — Set & track goals\n• 📊 **Spending analysis** — See where your money goes\n• 📋 **Transaction history** — View your recent activity\n\n**How it works:**\n1. Connect your wallet (MiniPay auto-connects)\n2. Ask me anything in natural language\n3. I'll execute on Celo blockchain\n\nAll transactions are on-chain. Gas fees in USDm (MiniPay) or CELO.",
    });
  }

  return Promise.resolve({
    message: "Hey! 👋 I'm MiniMate, your AI finance assistant on Celo.\n\nHere's what I can help with:\n\n• 💰 **Balance** — \"What's my balance?\"\n• 💸 **Send** — \"Send 10 USDm to 0x...\"\n• 🎯 **Goals** — \"Save 100 for vacation\"\n• 📊 **Spending** — \"Show my spending\"\n• 📋 **History** — \"Show my transactions\"\n\nJust ask in natural language!",
  });
}

// Vercel serverless handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, wallet } = req.body;
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== 'user') {
      return res.status(400).json({ error: 'No user message' });
    }

    const result = await generateResponse(lastMessage.content, wallet?.address);

    return res.status(200).json({
      message: result.message,
      action: result.action || null,
      tx: result.tx || null,
      data: result.data || null,
      wallet: wallet || null,
    });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({
      message: "⚙️ **Server error.** Something went wrong on our end. Please try again in a moment.",
      action: null,
      tx: null,
      data: null,
    });
  }
}
