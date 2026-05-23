import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther, getContract } from 'viem';
import { celo } from 'viem/chains';
import { sdk } from '@farcaster/miniapp-sdk';

// Celo Mainnet stablecoin addresses (from MiniPay docs)
const USDm_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a'; // Also cUSD on Celo
const USDC_ADDRESS = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
const USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Minimal ERC20 ABI
const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
];

// Cache Farcaster context
let _isFarcaster = null;

// Detect Farcaster Mini App
export async function isFarcaster() {
  if (_isFarcaster !== null) return _isFarcaster;
  try {
    _isFarcaster = await sdk.isInMiniApp();
  } catch {
    _isFarcaster = false;
  }
  return _isFarcaster;
}

// Detect MiniPay
export function isMiniPay() {
  return typeof window !== 'undefined' && window.ethereum?.isMiniPay === true;
}

// Get the best available provider (Farcaster > MiniPay > injected)
async function getProvider() {
  // Priority 1: Farcaster wallet
  if (await isFarcaster()) {
    try {
      const provider = await sdk.wallet.getEthereumProvider();
      if (provider) return provider;
    } catch (e) {
      console.warn('[MiniMate] Farcaster provider failed:', e);
    }
  }

  // Priority 2: MiniPay / injected
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }

  return null;
}

// Create public client (read-only, no wallet needed)
export function getPublicClient() {
  return createPublicClient({
    chain: celo,
    transport: http(),
  });
}

// Create wallet client (Farcaster > MiniPay > injected)
export async function getWalletClient() {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('No wallet detected. Open in MiniPay or Farcaster.');
  }

  return createWalletClient({
    chain: celo,
    transport: custom(provider),
  });
}

// Get connected account address
export async function getAccount() {
  const provider = await getProvider();
  if (!provider) return null;

  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
      params: [],
    });
    return accounts[0] || null;
  } catch (err) {
    console.error('[MiniMate] Failed to get account:', err);
    return null;
  }
}

// Check balance of any ERC20 token
export async function getTokenBalance(tokenAddress, userAddress) {
  const publicClient = getPublicClient();

  const contract = getContract({
    address: tokenAddress,
    abi: erc20Abi,
    client: publicClient,
  });

  const balance = await contract.read.balanceOf([userAddress]);
  const decimals = await contract.read.decimals();

  return {
    raw: balance,
    formatted: formatEther(balance), // Most Celo tokens use 18 decimals
    decimals,
  };
}

// Get all balances for a user
export async function getAllBalances(address) {
  const publicClient = getPublicClient();

  const [nativeBalance, usdm, usdc, usdt] = await Promise.all([
    publicClient.getBalance({ address }),
    getTokenBalance(USDm_ADDRESS, address),
    getTokenBalance(USDC_ADDRESS, address),
    getTokenBalance(USDT_ADDRESS, address),
  ]);

  return {
    native: { raw: nativeBalance, formatted: formatEther(nativeBalance) },
    usdm: usdm,
    usdc: usdc,
    usdt: usdt,
  };
}

// Send ERC20 token transfer
export async function sendToken(tokenAddress, to, amount) {
  const walletClient = await getWalletClient();
  const account = await getAccount();

  if (!account) throw new Error('No account connected');

  const amountWei = parseEther(amount);

  // Simulate the transaction first
  const { request } = await getPublicClient().simulateContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, amountWei],
    account,
  });

  // Execute the transaction
  const hash = await walletClient.writeContract(request);

  return hash;
}

// Send native CELO
export async function sendNative(to, amount) {
  const walletClient = await getWalletClient();
  const account = await getAccount();

  if (!account) throw new Error('No account connected');

  const hash = await walletClient.sendTransaction({
    account,
    to,
    value: parseEther(amount),
  });

  return hash;
}

// Wait for transaction confirmation
export async function waitForTx(hash) {
  const publicClient = getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt;
}

// Subscribe to account changes (MiniPay only — Farcaster handles this differently)
export function onAccountChange(callback) {
  if (typeof window === 'undefined' || !window.ethereum) return;

  window.ethereum.on('accountsChanged', (accounts) => {
    callback(accounts[0] || null);
  });
}

// Subscribe to chain changes
export function onChainChange(callback) {
  if (typeof window === 'undefined' || !window.ethereum) return;

  window.ethereum.on('chainChanged', (chainId) => {
    callback(chainId);
  });
}
