# MiniMate — Submission Materials

## 📝 Proof of Ship Submission

### Project Name
MiniMate — AI Finance Assistant on Celo

### One-liner
Chat with your money. An AI-powered finance assistant for MiniPay that lets users check balances, track spending, set goals, and send payments through natural language.

### Problem
MiniPay has 10M+ users in emerging markets. Most think in dollars, not crypto. Managing stablecoins requires understanding addresses, gas tokens, and complex interfaces. This creates friction for everyday users.

### Solution
MiniMate replaces complex DeFi interfaces with a simple chat. Users type what they want — "check my balance", "send 10 USDm to mom", "how much did I spend this month?" — and MiniMate handles the rest.

### Key Features
1. **Balance Check** — Real-time CELO, USDm, USDC, USDT balances via on-chain reads
2. **Spending Analysis** — Auto-categorized breakdown from Blockscout transaction history
3. **Savings Goals** — Set targets with visual progress tracking (localStorage)
4. **Send Payments** — Step-by-step flow: amount → token → address → confirm
5. **Fee Abstraction** — Gas paid in USDm for MiniPay users (no CELO needed)
6. **Auto Chain Switch** — Seamlessly switches to Celo from any network
7. **Farcaster Mini App** — Works as a Farcaster Mini App too

### Technical Highlights
- **Real on-chain data** — Not mock. Uses Blockscout API v2 for transaction history and viem for balance reads
- **Fee abstraction** — `feeCurrency` parameter for MiniPay gas-in-stablecoin
- **Multi-environment** — Auto-detects MiniPay, Farcaster, or regular browser wallet
- **Smart categorization** — Transactions categorized by known contracts, method type, and amount ranges
- **Serverless** — Vercel serverless API, no backend server needed

### Links
- **Live Demo:** https://minimate-green.vercel.app
- **GitHub:** https://github.com/ulsreall/minimate
- **Smart Contracts:**
  - MiniMateVault: https://celoscan.io/address/0x8d8527F7F8c1D8Ef231007677e663948393bF9B7
  - MiniMateRouter: https://celoscan.io/address/0xc891546024Dcd2fE3CD2Fc6cEFdB30cBd27e5b61

### Wallet Address (for rewards)
`0x721e885BE237Ef193807d7a912C201c6a53dA522`

---

## 📱 MiniPay App Listing Submission

### App Name
MiniMate

### Category
Finance / AI

### Short Description (50 words)
AI-powered finance assistant for MiniPay. Check balances, track spending by category, set savings goals, and send payments through natural language chat. Gas paid in USDm — no CELO needed.

### Long Description (150 words)
MiniMate is a conversational AI finance assistant built specifically for MiniPay users. Instead of complex DeFi interfaces, users simply chat to manage their stablecoins.

**What you can do:**
- Check your CELO, USDm, USDC, and USDT balances instantly
- See where your money goes with auto-categorized spending analysis
- Create savings goals and track progress with visual bars
- Send payments in 3 easy steps: amount → token → address
- All powered by natural language — just type what you want

**Why MiniMate?**
- No CELO needed — gas is paid in USDm via fee abstraction
- Works seamlessly inside MiniPay — auto-connects, no extra setup
- Real on-chain data, not mock — your actual transaction history
- Built for emerging markets — simple, fast, mobile-first

### URL
https://minimate-green.vercel.app

### Icon
(512x512 PNG — green robot mascot on black background)

### Screenshots
1. Chat interface with balance check
2. Spending breakdown view
3. Send payment flow
4. Savings goal with progress bar

---

## 🎬 Demo Video Script (60 seconds)

**[0:00-0:05] Hook**
"Meet MiniMate — your AI finance assistant on Celo. Just chat to manage your money."

**[0:05-0:15] Balance Check**
Open MiniMate in MiniPay. Type "What's my balance?"
→ Shows real-time CELO, USDm, USDC, USDT balances
"Instant balance check for all your stablecoins."

**[0:15-0:25] Spending Analysis**
Type "Show my spending this month"
→ Shows categorized breakdown with percentages
"See exactly where your money goes — auto-categorized from your on-chain transactions."

**[0:25-0:35] Savings Goal**
Type "Save 100 for vacation"
→ Shows goal created with progress bar
"Set savings goals and track your progress visually."

**[0:35-0:50] Send Payment**
Click "Send" → Enter 10 → Select USDm → Paste address → Confirm
→ Wallet popup → Transaction confirmed
"Send payments in 3 steps. Gas paid in USDm — no CELO needed."

**[0:50-0:55] MiniPay Integration**
Show MiniPay app with MiniMate loaded
"Built natively for MiniPay. 10M+ users, one chat away."

**[0:55-0:60] CTA**
"Try MiniMate now at minimate-green.vercel.app"
