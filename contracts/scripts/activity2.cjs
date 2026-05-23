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
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (msg) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${msg}`);
  console.log(`${'='.repeat(50)}`);
};

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Savings', 'Other'];

async function main() {
  const vault = new ethers.Contract(VAULT, VAULT_ABI, wallet);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);

  log('INITIAL BALANCE');
  const initialCelo = await provider.getBalance(wallet.address);
  console.log(`  CELO: ${ethers.formatEther(initialCelo)}`);

  // Check current goals
  const goalCount = await vault.getGoalCount(wallet.address);
  console.log(`  Goals: ${goalCount}`);
  const goalIds = [];
  for (let i = 0; i < Number(goalCount); i++) goalIds.push(BigInt(i));

  // ========================================
  // AUTO-SAVE #3 for Goal #2 (1 hour, not 30 min)
  // ========================================
  log('AUTO-SAVE 3: 0.05 CELO / 1h → Goal #2 (Vacation Bali)');
  try {
    const tx = await vault.setAutoSave(goalIds[2], ethers.parseEther('0.05'), 3600);
    await tx.wait();
    console.log('  ✅ Auto-save configured');
  } catch (e) {
    console.log('  ⚠️ Already configured or error:', e.reason || e.message);
  }
  await sleep(1500);

  // ========================================
  // EXECUTE AUTO-SAVE (all 3 goals)
  // ========================================
  const autoSaves = [
    { goalIdx: 0, amount: '0.1' },
    { goalIdx: 1, amount: '0.2' },
    { goalIdx: 2, amount: '0.05' },
  ];

  for (let i = 0; i < autoSaves.length; i++) {
    const a = autoSaves[i];
    log(`EXECUTE AUTO-SAVE ${i + 1}: Goal #${a.goalIdx}`);
    try {
      const tx = await vault.executeAutoSave(wallet.address, goalIds[a.goalIdx], { value: ethers.parseEther(a.amount) });
      await tx.wait();
      console.log(`  ✅ Auto-save executed: ${a.amount} CELO`);
    } catch (e) {
      console.log('  ⚠️ Error:', e.reason || e.message);
    }
    await sleep(1500);
  }

  // ========================================
  // PAYMENTS (10 different categories)
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
    try {
      const tx = await router.pay(MAIN_WALLET, p.category, p.desc, { value: ethers.parseEther(p.amount) });
      await tx.wait();
      console.log(`  ✅ "${p.desc}" → ${MAIN_WALLET.slice(0, 8)}...`);
    } catch (e) {
      console.log('  ⚠️ Error:', e.reason || e.message);
    }
    await sleep(1500);
  }

  // ========================================
  // WITHDRAW (partial from Goal #0)
  // ========================================
  log('WITHDRAW: 0.2 CELO from Goal #0 (Gaming Setup)');
  try {
    const tx = await vault.withdraw(goalIds[0], ethers.parseEther('0.2'));
    await tx.wait();
    console.log('  ✅ Withdrawn 0.2 CELO');
  } catch (e) {
    console.log('  ⚠️ Error:', e.reason || e.message);
  }
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
    if (breakdown[i] > 0n) {
      console.log(`  ${CATEGORIES[i]}: ${ethers.formatEther(breakdown[i])} CELO`);
      totalSpent += breakdown[i];
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
