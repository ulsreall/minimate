<p align="center">
  <img src="frontend/public/logo.png" alt="MiniMate Logo" width="128" />
</p>

<h1 align="center">🤖 MiniMate</h1>
<p align="center"><strong>AI Finance Assistant on Celo — Built for MiniPay</strong></p>

<p align="center">
  <a href="https://minimate-green.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-green?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/ulsreall/minimate/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
  <img src="https://img.shields.io/badge/Celo-42220-FCFF52?style=for-the-badge&logo=celo&logoColor=black" alt="Celo Chain">
  <img src="https://img.shields.io/badge/MiniPay-Ready-00C853?style=for-the-badge" alt="MiniPay">
</p>

---

> Chat with your money. MiniMate lets MiniPay users check balances, track spending, set savings goals, and send payments — all through natural language, with zero gas friction.

## 🎯 Why MiniMate?

MiniPay has **10M+ users** in emerging markets. Most aren't crypto-native — they think in dollars, not gas tokens. MiniMate bridges that gap:

- **No CELO needed** — gas paid in USDm via fee abstraction
- **Natural language** — "Send 10 USDm to mom" instead of copy-pasting addresses
- **Real-time insights** — on-chain spending breakdown by category
- **Goal-based saving** — set targets, track progress visually

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 💰 **Balance** | View CELO, USDm, USDC, USDT in real-time | ✅ Live |
| 📊 **Spending** | Auto-categorized breakdown from on-chain txs | ✅ Live |
| 📋 **History** | Recent transactions with Celoscan links | ✅ Live |
| 🎯 **Goals** | Save toward targets with progress tracking | ✅ Live |
| 💸 **Send** | Step-by-step payment flow with token picker | ✅ Live |
| ⛽ **Fee Abstraction** | Gas paid in USDm for MiniPay users | ✅ Live |
| 🔄 **Chain Switch** | Auto-switch to Celo from any network | ✅ Live |

## 🏗️ Architecture

```
minimate/
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Chat UI + send flow state machine
│   │   ├── lib/celo.js     # Wallet, chain, tx utilities
│   │   └── index.css       # Dark theme styling
│   └── api/
│       └── chat.js         # Serverless API — NLP + Blockscout
├── contracts/
│   ├── MiniMateVault.sol   # Savings vault (on-chain goals)
│   └── MiniMateRouter.sol  # Payment router
└── README.md
```

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, viem 2 |
| Blockchain | Celo Mainnet (42220) |
| Contracts | Solidity 0.8.20, OpenZeppelin |
| Data | Blockscout API v2 |
| Wallet | MiniPay (native), Farcaster, MetaMask |
| Deploy | Vercel Serverless |

## 📦 Stablecoins

| Token | Address |
|-------|---------|
| USDm (cUSD) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| CELO | `0x471EcE3750Da237f93B8E339c536989b8978a438` |

## 🔗 Smart Contracts (Celo Mainnet)

- **MiniMateVault** — [`0x8d85...9B7`](https://celoscan.io/address/0x8d8527F7F8c1D8Ef231007677e663948393bF9B7)
- **MiniMateRouter** — [`0xc891...5b61`](https://celoscan.io/address/0xc891546024Dcd2fE3CD2Fc6cEFdB30cBd27e5b61)

## 📱 MiniPay Integration

```javascript
// Auto-detect MiniPay
const isMiniPay = window.ethereum?.isMiniPay === true;

// Fee abstraction — pay gas in USDm
if (isMiniPay) {
  txParams.feeCurrency = '0x765DE816845861e75A25fCA122bb6898B8B1282a';
}
```

When opened in MiniPay:
- ✅ Auto-connects (no "Connect Wallet" button)
- ✅ Stablecoin-first UI (USDm, USDC, USDT)
- ✅ Gas paid in USDm (no CELO needed)
- ✅ Legacy tx format (MiniPay compatible)

## 🚀 Quick Start

```bash
git clone https://github.com/ulsreall/minimate.git
cd minimate/frontend
npm install
npm run dev
```

### Test in MiniPay

1. Install [MiniPay](https://play.google.com/store/apps/details?id=com.opera.minipay)
2. Settings → About → tap Version 7x → Developer Mode
3. Developer Settings → Load Test Page
4. Enter URL: `https://minimate-green.vercel.app`

## 🗺️ Roadmap

- [x] Balance checking (CELO, USDm, USDC, USDT)
- [x] On-chain spending analysis via Blockscout
- [x] Savings goals with localStorage persistence
- [x] Step-by-step send flow with token picker
- [x] MiniPay fee abstraction (gas in USDm)
- [x] Auto chain switch to Celo
- [x] Farcaster Mini App support
- [ ] On-chain savings vault (smart contract)
- [ ] Token swaps via Mento DEX
- [ ] Multi-language (Bahasa Indonesia, Swahili)
- [ ] Recurring payments / auto-save
- [ ] Push notifications for goals

## 📄 License

MIT License — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- [Celo](https://celo.org/) — blockchain infrastructure
- [MiniPay](https://www.opera.com/products/minipay) — mobile wallet
- [Blockscout](https://celo.blockscout.com/) — on-chain data API
- [viem](https://viem.sh/) — TypeScript Ethereum library

---

<p align="center">
  <strong>Built with ❤️ for Celo Proof of Ship</strong>
</p>
