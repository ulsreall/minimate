import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther, getContract } from 'viem';
import { celo } from 'viem/chains';
import { sdk } from '@farcaster/miniapp-sdk';

// Celo Mainnet stablecoin addresses
const USDm_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a'; // cUSD
const USDC_ADDRESS = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
const USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';

// Minimal ERC20 ABI
const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
];

// ─── Environment Detection ───────────────────────────────────────────

let _env = null; // cached: 'farcaster' | 'minipay' | 'browser'

/**
 * Detect the current environment.
 * - 'farcaster': running inside Farcaster Mini App
 * - 'minipay': running inside MiniPay (Opera Mini / standalone app)
 * - 'browser': regular browser with injected wallet (MetaMask, etc.)
 */
export async function detectEnvironment() {
  if (_env) return _env;

  // Check Farcaster first (iframe-based detection)
  try {
    const inFarcaster = await sdk.isInMiniApp();
    if (inFarcaster) {
      _env = 'farcaster';
      console.log('[MiniMate] Environment: Farcaster Mini App');
      return _env;
    }
  } catch {
    // Not Farcaster
  }

  // Check MiniPay (injected provider with isMiniPay flag)
  if (typeof window !== 'undefined' && window.ethereum?.isMiniPay === true) {
    _env = 'minipay';
    console.log('[MiniMate] Environment: MiniPay');
    return _env;
  }

  // Regular browser
  _env = 'browser';
  console.log('[MiniMate] Environment: Browser');
  return _env;
}

export async function isFarcaster() {
  return (await detectEnvironment()) === 'farcaster';
}

export function isMiniPay() {
  return typeof window !== 'undefined' && window.ethereum?.isMiniPay === true;
}

// ─── Provider Layer ──────────────────────────────────────────────────

let _farcasterProvider = null;

/**
 * Get the Farcaster ethereum provider (cached).
 * Returns null if not in Farcaster or provider unavailable.
 */
async function getFarcasterProvider() {
  if (_farcasterProvider) return _farcasterProvider;

  try {
    const provider = await sdk.wallet.getEthereumProvider();
    if (provider) {
      _farcasterProvider = provider;
      console.log('[MiniMate] Farcaster wallet provider obtained');
      return provider;
    }
  } catch (e) {
    console.warn('[MiniMate] Farcaster getEthereumProvider failed:', e.message);
  }

  return null;
}

/**
 * Get the best available provider based on environment.
 * Priority: Farcaster SDK > MiniPay window.ethereum > any window.ethereum
 */
async function getProvider() {
  const env = await detectEnvironment();

  if (env === 'farcaster') {
    const provider = await getFarcasterProvider();
    if (provider) return provider;
    console.warn('[MiniMate] Farcaster provider unavailable, falling back to window.ethereum');
  }

  // MiniPay or browser fallback
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum;
  }

  return null;
}

// ─── Client Factories ────────────────────────────────────────────────

/** Read-only client (no wallet needed) */
export function getPublicClient() {
  return createPublicClient({
    chain: celo,
    transport: http(),
  });
}

/** Wallet client (requires active provider) */
export async function getWalletClient() {
  const provider = await getProvider();
  if (!provider) {
    const env = await detectEnvironment();
    if (env === 'farcaster') {
      throw new Error('Farcaster wallet not available. Make sure you opened this in a Farcaster client that supports wallet.');
    }
    throw new Error('No wallet detected. Open this app in MiniPay or connect a wallet.');
  }

  return createWalletClient({
    chain: celo,
    transport: custom(provider),
  });
}

// ─── Account Management ──────────────────────────────────────────────

/**
 * Request and return the connected account address (lowercased).
 * Handles eth_requestAccounts for all environments.
 */
export async function getAccount() {
  const provider = await getProvider();
  if (!provider) return null;

  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
      params: [],
    });

    const addr = accounts?.[0];
    if (!addr) return null;

    // Normalize: lowercase for Celo RPC compatibility
    const normalized = addr.toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
      console.error('[MiniMate] Invalid address from provider:', addr);
      return null;
    }

    console.log('[MiniMate] Connected account:', normalized.slice(0, 8) + '...');
    return normalized;
  } catch (err) {
    console.error('[MiniMate] Failed to get account:', err.message);
    return null;
  }
}

// ─── Balance Queries ─────────────────────────────────────────────────

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
    formatted: formatEther(balance),
    decimals,
  };
}

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
    usdm,
    usdc,
    usdt,
  };
}

// ─── Transactions ────────────────────────────────────────────────────

export async function sendToken(tokenAddress, to, amount) {
  const walletClient = await getWalletClient();
  const account = await getAccount();

  if (!account) throw new Error('No account connected');

  const amountWei = parseEther(amount);

  // Simulate first
  const { request } = await getPublicClient().simulateContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [to, amountWei],
    account,
  });

  // Execute
  const hash = await walletClient.writeContract(request);
  return hash;
}

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

export async function waitForTx(hash) {
  const publicClient = getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt;
}

// ─── Event Listeners ─────────────────────────────────────────────────

export function onAccountChange(callback) {
  if (typeof window === 'undefined' || !window.ethereum) return;

  window.ethereum.on('accountsChanged', (accounts) => {
    callback(accounts[0] || null);
  });
}

export function onChainChange(callback) {
  if (typeof window === 'undefined' || !window.ethereum) return;

  window.ethereum.on('chainChanged', (chainId) => {
    callback(chainId);
  });
}

// ─── Farcaster Lifecycle ─────────────────────────────────────────────

/**
 * Signal to Farcaster that the Mini App is ready.
 * Call this AFTER the UI is rendered (hides splash screen).
 */
export async function signalFarcasterReady() {
  try {
    if (await isFarcaster()) {
      await sdk.actions.ready();
      console.log('[MiniMate] Farcaster Mini App ready signal sent');
    }
  } catch (e) {
    console.warn('[MiniMate] Failed to signal Farcaster ready:', e.message);
  }
}

/**
 * Get Farcaster context (user info, etc.)
 */
export async function getFarcasterContext() {
  try {
    if (await isFarcaster()) {
      return await sdk.context;
    }
  } catch {}
  return null;
}
