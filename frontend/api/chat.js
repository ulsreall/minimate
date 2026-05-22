import { createPublicClient, http, formatEther, getContract } from 'viem';
import { celo } from 'viem/chains';

// Celo Mainnet configuration
const CELO_RPC = 'https://forno.celo.org';

// Stablecoin addresses (MiniPay compatible)
const USDm_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
const USDC_ADDRESS = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
const USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Contract addresses (update after deployment)
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '';
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || '';

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

// Category mapping
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Savings', 'Other'];

// Execute blockchain actions
async function executeAction(action, params, walletAddress) {
  try {
    switch (action) {
      case 'check_balance': {
        const address = params.address || walletAddress;
        if (!address) {
          return { message: "Please connect your wallet first, or tell me your address." };
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
          message: `🎯 **Savings Goal Created!**\n\n• Goal: ${name}\n• Target: ${target} USDm\n• Deadline: ${deadlineDate}\n\nWould you like to set up auto-save? I can automatically save a small amount for you regularly.`,
          action: 'create_goal',
          data: { name, target, deadline },
        };
      }

      case 'get_goals': {
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

  if (msg.includes('save') || msg.includes('goal') || msg.includes('tabung') || msg.includes('sisih')) {
    return executeAction('create_goal', { name: 'My Savings', target: '100' }, walletAddress);
  }

  if (msg.includes('spend') || msg.includes('expense') || msg.includes('habis') || msg.includes('pengeluaran')) {
    return executeAction('get_spending', {}, walletAddress);
  }

  if (msg.includes('transaction') || msg.includes('history') || msg.includes('riwayat')) {
    return executeAction('get_transactions', {}, walletAddress);
  }

  if (msg.includes('connect') || msg.includes('wallet')) {
    return Promise.resolve({
      message: "🔗 **Connect Your Wallet**\n\nTo use MiniMate, open this app in MiniPay:\n\n1. Open MiniPay on your phone\n2. Go to Mini Apps\n3. Find MiniMate\n4. Start chatting!\n\nOr paste your wallet address to view-only mode.",
      action: 'connect',
    });
  }

  if (msg.includes('help') || msg.includes('bantuan') || msg.includes('what can')) {
    return Promise.resolve({
      message: "🤖 **What I Can Do**\n\n• 💰 **Check balance** — View your CELO, USDm, USDC, USDT\n• 💸 **Send payments** — Pay anyone on Celo\n• 🎯 **Savings goals** — Set & track goals\n• 📊 **Spending analysis** — See where your money goes\n• 💡 **Financial tips** — Personalized advice\n\nJust ask me in natural language!",
    });
  }

  return Promise.resolve({
    message: "I'm here to help with your Celo finances! Try:\n\n• \"Check my balance\"\n• \"Send 10 USDm to 0x...\"\n• \"Create a savings goal\"\n• \"Show my spending\"\n\nWhat would you like to do?",
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
