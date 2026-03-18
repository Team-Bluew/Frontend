# NovaDEX

A full-featured AMM DEX UI built with **Next.js 14** (App Router) + **TypeScript**.  
Models a Uniswap v1-style ETH ↔ ERC-20 single-pair exchange.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
nova-dex/
├── app/
│   ├── globals.css        # All design tokens & utility classes
│   ├── layout.tsx         # Root layout + metadata
│   └── page.tsx           # Main orchestrator (tabs, wallet, toast)
├── components/
│   ├── SwapCard.tsx        # ETH ↔ Token swap with live AMM pricing
│   ├── LiquidityCard.tsx   # Add / Remove / Init Pool tabs
│   ├── PoolStats.tsx       # Full pool dashboard + activity feed
│   ├── Sidebar.tsx         # Live pool stats + compact activity
│   ├── ActivityFeed.tsx    # Reusable on-chain event list
│   ├── SettingsModal.tsx   # Slippage tolerance + deadline picker
│   └── Toast.tsx           # Slide-in error/success notifications
└── lib/
    └── amm.ts             # AMM math, formatters, constants, error map
```

---

## Connecting to a Real Contract

1. **Install ethers / viem + wagmi:**
   ```bash
   npm install wagmi viem @tanstack/react-query
   ```

2. **Replace mock constants in `lib/amm.ts`** with live contract reads using the ABI's:
   - `getSpotPrice()` → spot price
   - `totalLiquidity()` → total LP supply
   - `getLiquidity(address)` → user's LP balance
   - Pool ETH balance via `provider.getBalance(contractAddress)`
   - Pool token balance via `token().balanceOf(contractAddress)`

3. **Wire up write calls** in each component:
   - `SwapCard` → `ethToToken()` / `tokenToEth()` with slippage + deadline
   - `LiquidityCard` (Add) → `deposit(maxTokenAmount, deadline)`
   - `LiquidityCard` (Remove) → `withdraw(amount, minEth, minToken, deadline)`
   - `LiquidityCard` (Init) → `init(tokens)` payable
   - Map revert reasons using `CONTRACT_ERRORS` in `lib/amm.ts`

4. **Listen to contract events** and feed them into `ActivityFeed`:
   - `EthToTokenSwap`, `TokenToEthSwap`, `LiquidityProvided`, `LiquidityRemoved`

---

## Design System

- **Fonts:** Chakra Petch (headings) · JetBrains Mono (data) · DM Sans (body)
- **Palette:** Deep navy bg · Electric blue (#00d4ff) · Violet (#8b5cf6) accents
- **Style:** Glassmorphism panels · Dot-grid background · CSS-only animations
- **Responsive:** Two-column desktop → single-column mobile

---

## Contract Errors Handled

| Error | UI Message |
|---|---|
| `DeadlineExpired` | Transaction window expired, please retry. |
| `SlippageExceeded` | Price moved too much — increase slippage tolerance. |
| `InsufficientLiquidity` | Not enough liquidity in the pool. |
| `TokenDepositExceedsMax` | Token amount exceeds your set maximum. |
| `EthTransferFailed` | ETH transfer failed — check your balance. |
| `TokenTransferFailed` | Token transfer failed — check your allowance. |
| `ZeroReserves` | Pool has no reserves yet. |
| `DexAlreadyInitialized` | Pool is already active. |
| `ReentrancyGuardReentrantCall` | Please wait before retrying. |
