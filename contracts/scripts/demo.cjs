const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// New contract addresses (CELO native)
const VAULT = '0x8d8527F7F8c1D8Ef231007677e663948393bF9B7';
const ROUTER = '0xc891546024Dcd2fE3CD2Fc6cEFdB30cBd27e5b61';

const VAULT_ABI = [
  'function createGoal(string, uint256, uint256) returns (uint256)',
  'function deposit(uint256) payable',
  'function setAutoSave(uint256, uint256, uint256)',
  'function executeAutoSave(address, uint256) payable',
  'function withdraw(uint256, uint256)',
  'function getGoals(address) view returns (tuple(string name, uint256 targetAmount, uint256 savedAmount, uint256 deadline, uint256 autoSaveAmount, uint256 autoSaveInterval, uint256 lastAutoSave, bool active, bool completed)[])',
  'function getGoalCount(address) view returns (uint256)',
];

const ROUTER_ABI = [
  'function pay(address, uint8, string) payable',
  'function getSpendingBreakdown(address) view returns (uint256[9])',
  'function getTransactionCount(address) view returns (uint256)',
  'function getRecentTransactions(address, uint256) view returns (tuple(address from, address to, uint256 amount, uint8 category, string description, uint256 timestamp)[])',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function log(msg) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${msg}`);
  console.log(`${'='.repeat(50)}`);
}

async function main() {
  console.log('\n🤖 MiniMate Demo Script');
  console.log(`📍 Wallet: ${wallet.address}`);
  console.log(`🔗 Network: Celo Mainnet (42220)`);
  console.log(`💰 Token: Native CELO\n`);

  // Initial balance
  await log('INITIAL BALANCE');
  const initialCelo = await provider.getBalance(wallet.address);
  console.log(`  CELO: ${ethers.formatEther(initialCelo)}`);

  // ========================================
  // STEP 1: Create Savings Goal
  // ========================================
  await log('STEP 1: Create Savings Goal');
  
  const vault = new ethers.Contract(VAULT, VAULT_ABI, wallet);
  
  const goalName = 'New Gaming Setup';
  const targetAmount = ethers.parseEther('5'); // 5 CELO
  const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  
  console.log(`  Goal: ${goalName}`);
  console.log(`  Target: 5 CELO`);
  console.log(`  Deadline: 30 days`);
  
  let tx = await vault.createGoal(goalName, targetAmount, deadline);
  await tx.wait();
  console.log('  ✅ Goal created!');
  
  const goalCount = await vault.getGoalCount(wallet.address);
  const goalId = goalCount - 1n;
  console.log(`  Goal ID: ${goalId}`);
  
  await sleep(2000);

  // ========================================
  // STEP 2: Deposit to Goal
  // ========================================
  await log('STEP 2: Deposit to Goal');
  
  const depositAmount = ethers.parseEther('1'); // 1 CELO
  console.log(`  Depositing: 1 CELO`);
  
  tx = await vault.deposit(goalId, { value: depositAmount });
  await tx.wait();
  console.log('  ✅ Deposited 1 CELO to goal');
  
  await sleep(2000);

  // ========================================
  // STEP 3: Set Auto-Save
  // ========================================
  await log('STEP 3: Set Auto-Save');
  
  const autoSaveAmount = ethers.parseEther('0.1'); // 0.1 CELO
  const autoSaveInterval = 3600; // 1 hour
  
  console.log(`  Auto-save: 0.1 CELO every hour`);
  
  tx = await vault.setAutoSave(goalId, autoSaveAmount, autoSaveInterval);
  await tx.wait();
  console.log('  ✅ Auto-save configured');
  
  await sleep(2000);

  // ========================================
  // STEP 4: Execute Auto-Save
  // ========================================
  await log('STEP 4: Execute Auto-Save');
  
  tx = await vault.executeAutoSave(wallet.address, goalId, { value: autoSaveAmount });
  await tx.wait();
  console.log('  ✅ Auto-save executed! (0.1 CELO)');
  
  await sleep(2000);

  // ========================================
  // STEP 5: Send Payment via Router
  // ========================================
  await log('STEP 5: Send Payment via Router');
  
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);
  const recipient = '0x1F98F5DEB986f37ccCFfCc17977A2D2C41dd63f7'; // Old wallet
  const payAmount = ethers.parseEther('0.5'); // 0.5 CELO
  const category = 0; // Food
  const description = 'Coffee and snacks';
  
  console.log(`  To: ${recipient.slice(0, 8)}...`);
  console.log(`  Amount: 0.5 CELO`);
  console.log(`  Category: Food`);
  
  tx = await router.pay(recipient, category, description, { value: payAmount });
  await tx.wait();
  console.log('  ✅ Payment sent!');
  
  await sleep(2000);

  // ========================================
  // STEP 6: Check Spending Breakdown
  // ========================================
  await log('STEP 6: Spending Breakdown');
  
  const breakdown = await router.getSpendingBreakdown(wallet.address);
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Savings', 'Other'];
  
  console.log('\n  Category Breakdown:');
  for (let i = 0; i < 9; i++) {
    const amount = ethers.formatEther(breakdown[i]);
    if (parseFloat(amount) > 0) {
      console.log(`    ${categories[i]}: ${amount} CELO`);
    }
  }
  
  const txCount = await router.getTransactionCount(wallet.address);
  console.log(`\n  Total Transactions: ${txCount}`);

  // ========================================
  // FINAL: Check Goal Status
  // ========================================
  await log('FINAL: Goal Status');
  
  const goals = await vault.getGoals(wallet.address);
  const goal = goals[Number(goalId)];
  
  console.log(`  Goal: ${goal.name}`);
  console.log(`  Target: ${ethers.formatEther(goal.targetAmount)} CELO`);
  console.log(`  Saved: ${ethers.formatEther(goal.savedAmount)} CELO`);
  console.log(`  Progress: ${((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100).toFixed(1)}%`);
  console.log(`  Auto-save: ${ethers.formatEther(goal.autoSaveAmount)} CELO / ${goal.autoSaveInterval}s`);
  console.log(`  Active: ${goal.active}`);
  console.log(`  Completed: ${goal.completed}`);

  // Final balance
  await log('FINAL BALANCE');
  const finalCelo = await provider.getBalance(wallet.address);
  console.log(`  CELO: ${ethers.formatEther(finalCelo)}`);
  const used = parseFloat(ethers.formatEther(initialCelo)) - parseFloat(ethers.formatEther(finalCelo));
  console.log(`  Used (gas + tx): ~${used.toFixed(4)} CELO`);
  
  console.log('\n✅ Demo Complete!\n');
}

main().catch(console.error);
