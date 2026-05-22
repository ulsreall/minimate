import { ethers } from 'ethers';

// Celo configuration
const CELO_RPC = 'https://forno.celo.org';
const CHAIN_ID = 42220;
const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Contract ABIs (minimal)
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const VAULT_ABI = [
  'function createGoal(string name, uint256 targetAmount, uint256 deadline) returns (uint256)',
  'function deposit(uint256 goalId, uint256 amount)',
  'function withdraw(uint256 goalId, uint256 amount)',
  'function setAutoSave(uint256 goalId, uint256 amount, uint256 interval)',
  'function getGoals(address user) view returns (tuple(string name, uint256 targetAmount, uint256 savedAmount, uint256 deadline, uint256 autoSaveAmount, uint256 autoSaveInterval, uint256 lastAutoSave, bool active, bool completed)[])',
  'function getGoalCount(address user) view returns (uint256)',
];

const ROUTER_ABI = [
  'function pay(address to, uint256 amount, uint8 category, string description)',
  'function batchPay(address[] recipients, uint256[] amounts, uint8 category, string description)',
  'function getTransactions(address user) view returns (tuple(address from, address to, uint256 amount, uint8 category, string description, uint256 timestamp)[])',
  'function getSpendingBreakdown(address user) view returns (uint256[9])',
  'function getTransactionCount(address user) view returns (uint256)',
];

// Contract addresses (will be updated after deployment)
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '';
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || '';

const provider = new ethers.JsonRpcProvider(CELO_RPC);

// Category mapping
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Savings', 'Other'];

// AI System prompt
const SYSTEM_PROMPT = `You are MiniMate, an AI finance assistant on Celo blockchain. You help users manage their finances through MiniPay.

You can:
1. Check CELO and cUSD balances
2. Send payments to addresses or contacts
3. Create and manage savings goals
4. Track and categorize spending
5. Provide financial insights and tips

Rules:
- Always be concise and helpful
- Use emojis sparingly
- When showing amounts, use cUSD (Celo's stablecoin)
- For payments, always confirm details before executing
- Suggest MiniPay for mobile payments
- Categories: Food, Transport, Shopping, Bills, Entertainment, Health, Education, Savings, Other

When you need to perform an action, respond with a JSON block:
\`\`\`json
{
  "action": "ACTION_NAME",
  "params": { ... }
}
\`\`\`

Available actions:
- check_balance: { "address": "0x..." }
- send_payment: { "to": "0x...", "amount": "10", "category": "Food", "description": "Lunch" }
- create_goal: { "name": "Vacation", "target": "500", "deadline": "2025-12-31" }
- deposit_goal: { "goalId": 0, "amount": "50" }
- get_goals: { "address": "0x..." }
- get_transactions: { "address": "0x..." }
- get_spending: { "address": "0x..." }
`;

// Execute blockchain actions
async function executeAction(action, params, walletAddress) {
  try {
    switch (action) {
      case 'check_balance': {
        const address = params.address || walletAddress;
        const cusd = new ethers.Contract(CUSD_ADDRESS, ERC20_ABI, provider);
        const celo = new ethers.Contract(CELO_ADDRESS, ERC20_ABI, provider);
        
        const [cusdBalance, celoBalance, ethBalance] = await Promise.all([
          cusd.balanceOf(address),
          celo.balanceOf(address),
          provider.getBalance(address),
        ]);
        
        return {
          message: `💰 **Your Balances**\n\n• cUSD: ${ethers.formatUnits(cusdBalance, 18)}\n• CELO: ${ethers.formatUnits(celoBalance, 18)}\n• Native: ${ethers.formatUnits(ethBalance, 18)} CELO`,
          data: {
            cusd: ethers.formatUnits(cusdBalance, 18),
            celo: ethers.formatUnits(celoBalance, 18),
            native: ethers.formatUnits(ethBalance, 18),
          },
        };
      }

      case 'send_payment': {
        const { to, amount, category, description } = params;
        if (!to || !amount) {
          return { message: "I need the recipient address and amount. Who would you like to pay?" };
        }
        
        const catIndex = CATEGORIES.indexOf(category || 'Other');
        const amountWei = ethers.parseUnits(amount, 18);
        
        return {
          message: `💸 **Payment Ready**\n\n• To: \`${to}\`\n• Amount: ${amount} cUSD\n• Category: ${CATEGORIES[catIndex]}\n• Note: ${description || 'Payment'}\n\nTap below to confirm with MiniPay:`,
          action: 'minipay',
          tx: {
            to,
            amount,
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
        
        const deadlineTs = deadline 
          ? Math.floor(new Date(deadline).getTime() / 1000)
          : Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60; // 90 days default
        
        return {
          message: `🎯 **Savings Goal Created!**\n\n• Goal: ${name}\n• Target: ${target} cUSD\n• Deadline: ${new Date(deadlineTs * 1000).toLocaleDateString()}\n\nWould you like to set up auto-save? I can automatically save a small amount for you regularly.`,
          action: 'create_goal',
          data: { name, target, deadline: deadlineTs },
        };
      }

      case 'deposit_goal': {
        const { goalId, amount } = params;
        return {
          message: `💵 **Deposit Ready**\n\n• Goal #${goalId || 0}\n• Amount: ${amount} cUSD\n\nConfirm with MiniPay to save:`,
          action: 'minipay',
          tx: { amount, status: 'Ready' },
        };
      }

      case 'get_goals': {
        // This would normally fetch from contract
        return {
          message: `🎯 **Your Savings Goals**\n\nYou haven't created any goals yet. Would you like to start saving? I can help you set up a goal!`,
        };
      }

      case 'get_transactions': {
        return {
          message: `📋 **Recent Transactions**\n\nNo transactions found yet. Start using MiniPay to see your activity here!`,
        };
      }

      case 'get_spending': {
        return {
          message: `📊 **Spending Breakdown**\n\nNo spending data yet. Your transactions will be automatically categorized:\n\n🍔 Food | 🚗 Transport | 🛍️ Shopping\n💡 Bills | 🎮 Entertainment | 🏥 Health\n📚 Education | 💰 Savings | 📦 Other`,
        };
      }

      default:
        return { message: "I'm not sure how to do that yet. Try asking me to check your balance, send a payment, or create a savings goal!" };
    }
  } catch (err) {
    console.error('Action error:', err);
    return { message: `Something went wrong: ${err.message}. Please try again.` };
  }
}

// Simple response generation (no external LLM needed for MVP)
function generateResponse(userMessage, walletAddress) {
  const msg = userMessage.toLowerCase();
  
  // Balance check
  if (msg.includes('balance') || msg.includes('berapa') || msg.includes('how much')) {
    return executeAction('check_balance', {}, walletAddress);
  }
  
  // Payment
  if (msg.includes('send') || msg.includes('pay') || msg.includes('kirim') || msg.includes('bayar')) {
    // Extract amount if present
    const amountMatch = msg.match(/(\d+\.?\d*)\s*(cusd|celo)?/);
    if (amountMatch) {
      return executeAction('send_payment', { 
        amount: amountMatch[1], 
        category: 'Other',
        description: 'Payment'
      }, walletAddress);
    }
    return Promise.resolve({ message: "I'd be happy to help you send a payment! How much would you like to send, and to which address?" });
  }
  
  // Savings
  if (msg.includes('save') || msg.includes('goal') || msg.includes('tabung') || msg.includes('sisih')) {
    return executeAction('create_goal', { name: 'My Savings', target: '100' }, walletAddress);
  }
  
  // Spending
  if (msg.includes('spend') || msg.includes('expense') || msg.includes('habis') || msg.includes('pengeluaran')) {
    return executeAction('get_spending', {}, walletAddress);
  }
  
  // Transactions
  if (msg.includes('transaction') || msg.includes('history') || msg.includes('riwayat')) {
    return executeAction('get_transactions', {}, walletAddress);
  }
  
  // Connect wallet
  if (msg.includes('connect') || msg.includes('wallet')) {
    return Promise.resolve({ 
      message: "🔗 **Connect Your Wallet**\n\nTo use MiniMate, connect your MiniPay or Celo wallet:\n\n1. Open MiniPay on your phone\n2. Scan the QR code\n3. Approve the connection\n\nOr paste your wallet address to view-only mode.",
      action: 'connect',
    });
  }
  
  // Help
  if (msg.includes('help') || msg.includes('bantuan') || msg.includes('what can')) {
    return Promise.resolve({
      message: "🤖 **What I Can Do**\n\n• 💰 **Check balance** — View your CELO & cUSD\n• 💸 **Send payments** — Pay anyone on Celo\n• 🎯 **Savings goals** — Set & track goals\n• 📊 **Spending analysis** — See where your money goes\n• 💡 **Financial tips** — Personalized advice\n\nJust ask me in natural language!",
    });
  }
  
  // Default
  return Promise.resolve({
    message: "I'm here to help with your Celo finances! Try:\n\n• \"Check my balance\"\n• \"Send 10 cUSD to 0x...\"\n• \"Create a savings goal\"\n• \"Show my spending\"\n\nWhat would you like to do?",
  });
}

// Vercel serverless handler
export default async function handler(req, res) {
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
