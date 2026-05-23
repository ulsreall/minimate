# 🤖 MiniMate — AI Finance Assistant on Celo

<p align="center">
  <img src="frontend/public/logo.png" alt="MiniMate Logo" width="200" />
</p>

> Your AI-powered financial companion built for MiniPay on Celo blockchain.

## 🚀 Live Demo

**[minimate-green.vercel.app](https://minimate-green.vercel.app/)**

## ✨ Features

- 💰 **Balance Check** — View CELO, USDm, USDC, USDT balances
- 📊 **Spending Analysis** — AI-powered spending breakdown by category
- 🎯 **Savings Goals** — Create and track savings goals with auto-save
- 💸 **Send Payments** — Send tokens via natural language
- 🤖 **AI Chat** — Ask anything about your finances
- 📱 **MiniPay Native** — Built specifically for MiniPay wallet

## 🏗️ Architecture

```
minimate/
├── frontend/          # React + Vite + viem
│   ├── src/
│   │   ├── App.jsx    # Main chat interface
│   │   ├── lib/
│   │   │   └── celo.js  # Celo/MiniPay utilities
│   │   └── contracts.json  # Deployed contract addresses
│   └── api/
│       └── chat.js    # AI chat endpoint
├── contracts/         # Solidity smart contracts
│   ├── contracts/
│   │   ├── MiniMateVault.sol   # Savings vault
│   │   └── MiniMateRouter.sol  # Payment router
│   └── scripts/
│       └── deploy.cjs  # Deployment script
└── agent/             # AI agent logic
```

## 🔗 Smart Contracts (Celo Mainnet)

| Contract | Address |
|----------|---------|
| MiniMateVault | [`0xdd2C761D010c205CC61Ef5931Dde8AB54F00f788`](https://celoscan.io/address/0xdd2C761D010c205CC61Ef5931Dde8AB54F00f788) |
| MiniMateRouter | [`0xfC7367Ab2E82fE46Fa5A8543E6582800Eeb765B7`](https://celoscan.io/address/0xfC7367Ab2E82fE46Fa5A8543E6582800Eeb765B7) |

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Blockchain:** viem, Celo Mainnet
- **Smart Contracts:** Solidity 0.8.20, OpenZeppelin
- **AI:** Custom AI agent for financial assistance
- **Wallet:** MiniPay (native integration)

## 📦 Stablecoins Supported

| Token | Address |
|-------|---------|
| cUSD (USDm) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` |
| CELO | `0x471EcE3750Da237f93B8E339c536989b8978a438` |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/ulsreall/minimate.git
cd minimate

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Deploy Contracts

```bash
cd contracts

# Install dependencies
npm install

# Create .env file
echo "PRIVATE_KEY=your_private_key_here" > .env

# Compile contracts
npx hardhat compile

# Deploy to Celo Mainnet
npx hardhat run scripts/deploy.cjs --network celo
```

## 🌐 Deployment

### Vercel (Frontend)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `ulsreall/minimate`
3. Set **Root Directory** to `frontend`
4. Deploy!

### Environment Variables

No environment variables needed for frontend. Contract addresses are hardcoded in `contracts.json`.

## 📱 MiniPay Integration

MiniMate automatically detects MiniPay wallet:

```javascript
const isMiniPay = () => 
  typeof window !== 'undefined' && 
  window.ethereum?.isMiniPay === true;
```

When opened in MiniPay:
- Auto-connects wallet
- Shows real balances
- Enables direct transactions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Celo](https://celo.org/) for the blockchain infrastructure
- [MiniPay](https://minipay.celo.org/) for the mobile wallet
- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [viem](https://viem.sh/) for TypeScript Ethereum library

---

**Built with ❤️ for Celo Proof of Ship**
