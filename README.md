<p align="center">
  <img src="frontend/public/logo.png" alt="MiniMate Logo" width="120" />
</p>

<h1 align="center">🤖 MiniMate</h1>
<p align="center"><strong>AI Finance Assistant on Celo — Built for MiniPay</strong></p>

<p align="center">
  <a href="https://minimate-green.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-green?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/ulsreall/minimate/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
  <a href="https://github.com/ulsreall/minimate/stargazers"><img src="https://img.shields.io/github/stars/ulsreall/minimate?style=for-the-badge&logo=github" alt="Stars"></a>
  <a href="https://github.com/ulsreall/minimate/network/members"><img src="https://img.shields.io/github/forks/ulsreall/minimate?style=for-the-badge&logo=github" alt="Forks"></a>
  <a href="https://github.com/ulsreall/minimate/issues"><img src="https://img.shields.io/github/issues/ulsreall/minimate?style=for-the-badge&logo=github" alt="Issues"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Celo-FCFF52?style=for-the-badge&logo=celo&logoColor=black" alt="Celo">
  <img src="https://img.shields.io/badge/MiniPay-000?style=for-the-badge&logo=minipay&logoColor=white" alt="MiniPay">
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

---

> Your AI-powered financial companion built for MiniPay on Celo blockchain. Check balances, analyze spending, set savings goals, and send payments — all through natural language.

## 🚀 Live Demo

**[minimate-green.vercel.app](https://minimate-green.vercel.app/)**

## ✨ Features

- 💰 **Balance Check** — View CELO, cUSD, USDC, USDT balances
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
│       ├── deploy.cjs  # Deployment script
│       └── demo.cjs    # Demo script
└── agent/             # AI agent logic
```

## 🔗 Smart Contracts (Celo Mainnet)

- **MiniMateVault** — [`0x8d8527F7F8c1D8Ef231007677e663948393bF9B7`](https://celoscan.io/address/0x8d8527F7F8c1D8Ef231007677e663948393bF9B7)
- **MiniMateRouter** — [`0xc891546024Dcd2fE3CD2Fc6cEFdB30cBd27e5b61`](https://celoscan.io/address/0xc891546024Dcd2fE3CD2Fc6cEFdB30cBd27e5b61)

> **Token:** Native CELO (no ERC20 dependency)

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Blockchain:** viem, Celo Mainnet
- **Smart Contracts:** Solidity 0.8.20, OpenZeppelin
- **AI:** Custom AI agent for financial assistance
- **Wallet:** MiniPay (native integration)

## 📦 Stablecoins Supported

- **cUSD (USDm)** — `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **USDC** — `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`
- **USDT** — `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e`
- **CELO** — `0x471EcE3750Da237f93B8E339c536989b8978a438`

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

## 🗺️ Roadmap

- [x] Balance checking for CELO and stablecoins
- [x] AI-powered spending analysis
- [x] Savings goals with MiniMateVault
- [x] Token transfers via natural language
- [ ] Transaction history view ([#1](https://github.com/ulsreall/minimate/issues/1))
- [ ] Multi-language support ([#2](https://github.com/ulsreall/minimate/issues/2))
- [ ] Token swaps via AI chat ([#6](https://github.com/ulsreall/minimate/issues/6))
- [ ] Dark mode ([#7](https://github.com/ulsreall/minimate/issues/7))
- [ ] CI/CD pipeline ([#10](https://github.com/ulsreall/minimate/issues/10))

> See the [Issues](https://github.com/ulsreall/minimate/issues) tab for full roadmap. Contributions welcome!

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Good First Issues
Looking for ways to contribute? Check out our [good first issues](https://github.com/ulsreall/minimate/labels/good%20first%20issue)!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Celo](https://celo.org/) for the blockchain infrastructure
- [MiniPay](https://minipay.celo.org/) for the mobile wallet
- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [viem](https://viem.sh/) for TypeScript Ethereum library

---

<p align="center">
  <strong>Built with ❤️ for Celo Proof of Ship</strong>
</p>

<p align="center">
  <a href="https://minimate-green.vercel.app">🌐 Live Demo</a> •
  <a href="https://github.com/ulsreall/minimate/issues">📋 Issues</a> •
  <a href="https://github.com/users/ulsreall/projects/2">📊 Roadmap</a> •
  <a href="https://github.com/ulsreall/minimate/discussions">💬 Discussions</a>
</p>
