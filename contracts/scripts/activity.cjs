const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const VAULT = '0x8d8527F7F8c1D8Ef231007677e663948393bF9B7';
const ROUTER = '0xc891546024Dcd2fE3CD2Fc6cEFdB30cBd27e5b61';
const MAIN_WALLET = '0xd5F0988574931B55A42002A82A41a5F594eb1f45';

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
const log = (msg) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${msg}`);
  console.log(`${'='.repeat(50)}`);
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Savings', 'Other'];

async function main() {
  console.log('\n🤖 MiniMate On-Chain Activity Generator');
  console.log(`📍 Deploy Wallet: ${wallet.address}`);
  console.log(`📍 Main Wallet: ${MAIN_WALLET}`);
  console.log(`🔗 Network: Celo Mainnet (42220)\n`);

  const vault = new ethers.Contract(VAULT, VAULT_ABI, wallet);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);

  // ========================================
  // INITIAL BALANCE
  // ========================================
  log('INITIAL BALANCE');
  const initialCelo = await provider.getBalance(wallet.address);
  console.log(`  CELO: ${ethers.formatEther(initialCelo)}`);

  // ========================================
  // SAVINGS GOALS (3 different goals)
  // ========================================
  const goals = [
    { name: 'New Gaming Setup', target: '5', deadline: 30 },
    { name: 'Emergency Fund', target: '10', deadline: 90 },
    { name: 'Vacation Bali', target: '3', deadline: 60 },
  ];

  const goalIds = [];

  for (let i = 0; i < goals.length; i++) {
    const g = goals[i];
    log(`GOAL ${i + 1}: ${g.name}`);

    const target = ethers.parseEther(g.target);
    const deadline = Math.floor(Date.now() / 1000) + g.deadline * 24 * 60 * 60;

    const tx = await vault.createGoal(g.name, target, deadline);
    await tx.wait();
    const count = await vault.getGoalCount(wallet.address);
    const goalId = count - 1n;
    goalIds.push(goalId);
    console.log(`  ✅ Created goal #${goalId} — Target: ${g.target} CELO, Deadline: ${g.deadline} days`);
    await sleep(1500);
  }

  // ========================================
  // DEPOSITS (varying amounts to each goal)
  // ========================================
  const deposits = [
    { goalIdx: 0, amount: '1.0' },
    { goalIdx: 1, amount: '2.0' },
    { goalIdx: 2, amount: '0.5' },
    { goalIdx: 0, amount: '0.3' },
    { goalIdx: 1, amount: '0.7' },
  ];

  for (let i = 0; i < deposits.length; i++) {
    const d = deposits[i];
    log(`DEPOSIT ${i + 1}: ${d.amount} CELO → Goal #${d.goalIdx} (${goals[d.goalIdx].name})`);

    const tx = await vault.deposit(goalIds[d.goalIdx], { value: ethers.parseEther(d.amount) });
    await tx.wait();
    console.log(`  ✅ Deposited ${d.amount} CELO`);
    await sleep(1500);
  }

  // ========================================
  // AUTO-SAVE SETUP (on all goals)
  // ========================================
  const autoSaves = [
    { goalIdx: 0, amount: '0.1', interval: 3600 },
    { goalIdx: 1, amount: '0.2', interval: 7200 },
    { goalIdx: 2, amount: '0.05', interval: 1800 },
  ];

  for (let i = 0; i < autoSaves.length; i++) {
    const a = autoSaves[i];
    log(`AUTO-SAVE ${i + 1}: ${a.amount} CELO / ${a.interval / 3600}h → Goal #${a.goalIdx}`);

    const tx = await vault.setAutoSave(goalIds[a.goalIdx], ethers.parseEther(a.amount), a.interval);
    await tx.wait();
    console.log(`  ✅ Auto-save configured`);
    await sleep(1500);
  }

  // ========================================
  // EXECUTE AUTO-SAVE (trigger each)
  // ========================================
  for (let i = 0; i < autoSaves.length; i++) {
    const a = autoSaves[i];
    log(`EXECUTE AUTO-SAVE ${i + 1}: Goal #${a.goalIdx} (${goals[a.goalIdx].name})`);

    const tx = await vault.executeAutoSave(wallet.address, goalIds[a.goalIdx], { value: ethers.parseEther(a.amount) });
    await tx.wait();
    console.log(`  ✅ Auto-save executed: ${a.amount} CELO`);
    await sleep(1500);
  }

  // ========================================
  // PAYMENTS (different categories)
  // ========================================
  const payments = [
    { category: 0, desc: 'Coffee and snacks', amount: '0.15' },
    { category: 1, desc: 'Grab to office', amount: '0.25' },
    { category: 2, desc: 'New headphones', amount: '0.8' },
    { category: 3, desc: 'Electricity bill', amount: '1.0' },
    { category: 4, desc: 'Netflix subscription', amount: '0.3' },
    { category: 5, desc: 'Pharmacy vitamins', amount: '0.2' },
    { category: 6, desc: 'Udemy course', amount: '0.5' },
    { category: 0, desc: 'Lunch nasi goreng', amount: '0.1' },
    { category: 1, desc: 'MRT to mall', amount: '0.08' },
    { category: 4, desc: 'Spotify premium', amount: '0.15' },
  ];

  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    log(`PAYMENT ${i + 1}: ${p.amount} CELO — ${CATEGORIES[p.category]}`);

    const tx = await router.pay(MAIN_WALLET, p.category, p.desc, { value: ethers.parseEther(p.amount) });
    await tx.wait();
    console.log(`  ✅ "${p.desc}" → ${MAIN_WALLET.slice(0, 8)}...`);
    await sleep(1500);
  }

  // ========================================
  // WITHDRAW (partial, from Goal #0)
  // ========================================
  log('WITHDRAW: 0.2 CELO from Goal #0 (Gaming Setup)');
  const tx = await vault.withdraw(goalIds[0], ethers.parseEther('0.2'));
  await tx.wait();
  console.log('  ✅ Withdrawn 0.2 CELO');
  await sleep(1500);

  // ========================================
  // FINAL STATUS
  // ========================================
  log('FINAL: All Goals Status');

  const allGoals = await vault.getGoals(wallet.address);
  for (let i = 0; i < allGoals.length; i++) {
    const g = allGoals[i];
    const progress = ((Number(g.savedAmount) / Number(g.targetAmount)) * 100).toFixed(1);
    console.log(`\n  Goal #${i}: ${g.name}`);
    console.log(`    Target: ${ethers.formatEther(g.targetAmount)} CELO`);
    console.log(`    Saved: ${ethers.formatEther(g.savedAmount)} CELO`);
    console.log(`    Progress: ${progress}%`);
    console.log(`    Auto-save: ${ethers.formatEther(g.autoSaveAmount)} CELO / ${g.autoSaveInterval}s`);
    console.log(`    Active: ${g.active}`);
  }

  log('FINAL: Spending Breakdown');
  const breakdown = await router.getSpendingBreakdown(wallet.address);
  let totalSpent = 0n;
  for (let i = 0; i < 9; i++) {
    const amount = breakdown[i];
    if (amount > 0n) {
      console.log(`  ${CATEGORIES[i]}: ${ethers.formatEther(amount)} CELO`);
      totalSpent += amount;
    }
  }
  console.log(`\n  TOTAL SPENT: ${ethers.formatEther(totalSpent)} CELO`);

  const txCount = await router.getTransactionCount(wallet.address);
  console.log(`  TOTAL PAYMENTS: ${txCount}`);

  log('FINAL BALANCE');
  const finalCelo = await provider.getBalance(wallet.address);
  console.log(`  CELO: ${ethers.formatEther(finalCelo)}`);
  const used = parseFloat(ethers.formatEther(initialCelo)) - parseFloat(ethers.formatEther(finalCelo));
  console.log(`  Used (gas + deposits + payments): ~${used.toFixed(4)} CELO`);

  console.log('\n✅ Activity generation complete!\n');
}

main().catch(console.error);
