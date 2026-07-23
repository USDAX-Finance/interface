# 🏛️ ArchonX Protocol — Official Documentation

**Version:** 1.0.0  
**Blockchain:** Robinhood Chain (EVM-Compatible, Arbitrum Orbit)  
**Chain ID:** `4663` (Mainnet) / `46630` (Testnet)  
**Last Updated:** July 2026

---

## 📑 Table of Contents

1. [Introduction](#1-introduction)
2. [Protocol Overview](#2-protocol-overview)
3. [Tokenomics](#3-tokenomics)
   - [3.1 USDAX (Stablecoin)](#31-usdax-stablecoin)
   - [3.2 AKX (Governance Token)](#32-akx-governance-token)
4. [System Architecture](#4-system-architecture)
   - [4.1 Smart Contract Interaction Flow](#41-smart-contract-interaction-flow)
   - [4.2 Oracle & Price Feeds](#42-oracle--price-feeds)
5. [Core Mechanics](#5-core-mechanics)
   - [5.1 Overcollateralization & Minting](#51-overcollateralization--minting)
   - [5.2 Health Factor](#52-health-factor)
   - [5.3 Liquidation Mechanism](#53-liquidation-mechanism)
   - [5.4 Staking & APY](#54-staking--apy)
6. [User Guides](#6-user-guides)
   - [6.1 How to Mint USDAX](#61-how-to-mint-usdax)
   - [6.2 How to Redeem Collateral](#62-how-to-redeem-collateral)
   - [6.3 How to Stake AKX](#63-how-to-stake-akx)
   - [6.4 How to Claim Staking Rewards](#64-how-to-claim-staking-rewards)
   - [6.5 How to Liquidate an Underwater Position](#65-how-to-liquidate-an-underwater-position)
7. [Developer API Reference](#7-developer-api-reference)
   - [7.1 DSCEngine.sol](#71-dscenginesol)
   - [7.2 Staking.sol](#72-stakingsol)
   - [7.3 OracleLib.sol](#73-oraclelibsol)
   - [7.4 USDAX.sol & AKX.sol](#74-usdaxsol--akxsol)
8. [Deployment Addresses](#8-deployment-addresses)
9. [Security & Audits](#9-security--audits)
10. [Glossary](#10-glossary)

---

## 1. Introduction

**ArchonX** is a decentralized dual-token protocol built on the Robinhood Chain. It provides a stable, overcollateralized digital dollar (`USDAX`) backed by crypto assets (WETH / WBTC), while rewarding long-term participants through a governance token (`AKX`) with a variable staking APY.

ArchonX is designed around three core principles:

| Principle | Description |
| :--- | :--- |
| **Stability** | USDAX maintains a 1:1 peg with USD through robust 150% overcollateralization. |
| **Efficiency** | Low gas fees and fast finality via the Arbitrum Orbit stack of Robinhood Chain. |
| **Governance** | AKX holders vote on protocol parameters — APY, collateral types, fees, and more. |

---

## 2. Protocol Overview

The protocol consists of five primary smart contracts working in harmony:

| Contract | Purpose |
| :--- | :--- |
| `USDAX.sol` | ERC-20 stablecoin pegged to $1. Minted and burned exclusively by `DSCEngine`. |
| `AKX.sol` | ERC-20 governance token with voting (ERC20Votes). Hard-capped at 100 M supply. |
| `DSCEngine.sol` | Core engine. Handles collateral deposits, debt tracking, health factors, and liquidations. |
| `OracleLib.sol` | Wraps Chainlink price feeds with a 3-hour stale-price timeout and decimal normalization. |
| `Staking.sol` | Manages AKX staking, variable APY calculation, and the 7-day cooldown enforcement. |

---

## 3. Tokenomics

### 3.1 USDAX (Stablecoin)

| Property | Value |
| :--- | :--- |
| **Ticker** | USDAX |
| **Full Name** | USDArch |
| **Type** | Overcollateralized Stablecoin |
| **Peg** | 1 USDAX = $1.00 USD |
| **Max Supply** | Algorithmically capped by available collateral — no hard cap. |
| **Usage** | Medium of exchange, collateral for external DeFi protocols, stable store of value. |

### 3.2 AKX (Governance Token)

| Property | Value |
| :--- | :--- |
| **Ticker** | AKX |
| **Full Name** | Archon Key |
| **Type** | ERC-20 + ERC20Votes |
| **Max Supply** | 100,000,000 AKX (immutable hard cap) |
| **Initial Supply** | 10,000,000 AKX (liquidity, team vesting, ecosystem fund) |

**Utility:**
- Stake to earn variable APY (rewards paid in AKX).
- On-chain voting power for protocol proposals (e.g., changing `baseAPY`, adding collateral types).
- Revenue sharing (planned for future implementation).

---

## 4. System Architecture

### 4.1 Smart Contract Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         END USER (EOA)                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DApp / UI                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DSCEngine.sol  (Core)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  depositCollateralAndMintUSDX()  →  USDAX Minted         │   │
│  │  redeemCollateralAndBurnUSDX()   →  USDAX Burned         │   │
│  │  liquidate()                     →  Liquidator Rewarded  │   │
│  │  getHealthFactor()               →  View (read-only)     │   │
│  └────────────────────┬─────────────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
┌───────────────────┐      ┌────────────────────────┐
│    USDAX.sol      │      │     OracleLib.sol       │
│   (Mint / Burn)   │      │  (Chainlink Aggregator) │
└───────────────────┘      └────────────┬────────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │       CHAINLINK         │
                           │    (Off-chain Oracles)  │
                           └────────────────────────┘
```

> **Staking** is a separate flow: users interact with `Staking.sol` directly, which reads AKX balances and mints reward tokens independently of `DSCEngine`.

### 4.2 Oracle & Price Feeds

ArchonX uses **Chainlink Price Feeds** to determine the real-time USD value of collateral assets.

- **Stale Price Protection:** Any price data older than **3 hours** is rejected, reverting the transaction.
- **Decimal Normalization:** Chainlink returns 8-decimal prices (e.g., `200000000000` for $2,000). `OracleLib` normalizes these to 18 decimals for internal math consistency.

| Asset | Chainlink Feed (Reference) |
| :--- | :--- |
| WETH / USD | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |
| WBTC / USD | `0xF4030086522a5bEEa4988f8cA5B36dbC97BeE88c` |

> ⚠️ Replace feed addresses above with the actual Robinhood Chain Chainlink deployments once available.

---

## 5. Core Mechanics

### 5.1 Overcollateralization & Minting

To mint USDAX, a user must deposit a supported collateral asset. The protocol enforces a **150% collateralization ratio** (equivalent to ~66.7% LTV).

**Formula:**

```
Max Mintable USDAX = Collateral Value (USD) / 1.5
```

**Example:**

| Step | Value |
| :--- | :--- |
| User deposits | 1 WETH |
| Current WETH price | $3,000 |
| Collateral Value | $3,000 |
| Max USDAX mintable | $3,000 / 1.5 = **$2,000 USDAX** |

### 5.2 Health Factor

The **Health Factor (HF)** determines whether a position is at risk of liquidation. It is calculated as:

```
Health Factor = (Total Collateral Value USD × 1e18) / (Total USDAX Minted USD × 1e18)
```

| Health Factor | Status |
| :--- | :--- |
| `∞` (infinite) | No debt — fully safe. |
| `> 1.0` | ✅ Safe. Position is overcollateralized. |
| `= 1.0` | ⚠️ At threshold. Minimum safe collateralization. |
| `< 1.0` | 🔴 Undercollateralized. Eligible for immediate liquidation. |

### 5.3 Liquidation Mechanism

When a user's Health Factor drops below `1.0`, any external account can call `liquidate()` to repay that user's debt in exchange for their collateral **plus a 10% bonus**.

**Liquidation Example:**

| | Value |
| :--- | :--- |
| User A collateral | $90 (WETH) |
| User A debt | $100 (USDAX) |
| User A Health Factor | 0.9 — eligible |
| Liquidator repays | $100 USDAX (burned) |
| Liquidator receives | $100 collateral + 10% bonus = **$110 WETH** |
| Liquidator net profit | **$10** |

> **Cap:** A single liquidation call can cover at most **50%** of the outstanding debt per transaction, preventing over-liquidation.

### 5.4 Staking & APY

Users stake AKX to earn rewards denominated in AKX.

**Base APY:** 15% annualized.

**Variable APY Formula:**

```
User Effective APY = Base APY × (Total Staked AKX / User Staked AKX)
```

This rewards early or large stakers with proportionally higher yields, incentivizing long-term commitment.

**Cooldown Period:** 7 days from the most recent stake deposit. Users cannot call `unstake()` until the cooldown has elapsed. This stabilizes governance voting power and prevents bank-run dynamics.

---

## 6. User Guides

### 6.1 How to Mint USDAX

1. Open the ArchonX DApp and connect your wallet (MetaMask) to **Robinhood Chain** (Chain ID: `46630` for testnet).
2. Navigate to **Vaults → Open New Vault**.
3. Select your collateral asset (WETH or WBTC).
4. Enter the amount of collateral to deposit. The UI shows your projected Health Factor and max mintable USDAX in real time.
5. Enter the amount of USDAX to mint (must keep Health Factor ≥ 1.0).
6. Click **Approve** to allow the protocol to spend your collateral, then **Confirm Deposit**.
7. Wait for the transaction to finalize. USDAX appears in your wallet.

### 6.2 How to Redeem Collateral

1. Go to **Vaults** and locate your active position.
2. Click **Redeem / Close**.
3. Enter the amount of USDAX to burn and the amount of collateral to withdraw.
4. The UI validates that your Health Factor remains ≥ 1.0 after the operation.
5. Confirm the transaction. Collateral is returned to your wallet.

### 6.3 How to Stake AKX

1. Navigate to the **Staking** page.
2. Enter the amount of AKX you wish to stake.
3. Click **Approve** for the AKX token, then **Stake**.
4. Staking rewards begin accumulating from the next block. Your cooldown timer starts now.

### 6.4 How to Claim Staking Rewards

1. Visit the **Staking** page. Your pending rewards are displayed on your staking card.
2. Click **Claim Rewards**.
3. Confirm the transaction. Rewards are transferred directly to your wallet in AKX.

> Claiming rewards does **not** reset your cooldown timer.

### 6.5 How to Liquidate an Underwater Position

1. Go to the **Liquidations** page. Positions with Health Factor `< 1.0` are highlighted in red.
2. Select a position and click **Liquidate**.
3. Enter the debt amount you wish to cover (up to 50% of outstanding debt per call).
4. Review the projected collateral bonus you will receive (+10%).
5. Confirm the transaction. Collateral plus bonus is sent to your wallet instantly.

---

## 7. Developer API Reference

### 7.1 DSCEngine.sol

#### `depositCollateralAndMintUSDX`

```solidity
function depositCollateralAndMintUSDX(
    address tokenCollateralAddress,
    uint256 amountCollateral,
    uint256 amountUSDXToMint
) external nonReentrant onlyCollateralToken
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `tokenCollateralAddress` | `address` | Address of the ERC-20 collateral token (WETH or WBTC). |
| `amountCollateral` | `uint256` | Amount of collateral to deposit (in token decimals). |
| `amountUSDXToMint` | `uint256` | Amount of USDAX to mint (18 decimals). |

**Reverts if:** Resulting Health Factor < 1.0 (`DSCEngine__BreaksHealthFactor`).

---

#### `redeemCollateralAndBurnUSDX`

```solidity
function redeemCollateralAndBurnUSDX(
    address tokenCollateralAddress,
    uint256 amountCollateral,
    uint256 amountUSDXToBurn
) external nonReentrant onlyCollateralToken
```

**Reverts if:** Burn amount is insufficient for the requested collateral, or resulting Health Factor < 1.0.

---

#### `liquidate`

```solidity
function liquidate(
    address user,
    address tokenCollateralAddress,
    uint256 debtToCover
) external
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `user` | `address` | Address of the undercollateralized position owner. |
| `tokenCollateralAddress` | `address` | Collateral token to seize. |
| `debtToCover` | `uint256` | Amount of USDAX debt to repay (max 50% of outstanding). |

**Requirements:** `getHealthFactor(user) < 1e18`.

---

#### `getHealthFactor`

```solidity
function getHealthFactor(address user) public view returns (uint256)
```

Returns the health factor scaled by `1e18`. A value of `1e18` equals a Health Factor of `1.0`.

---

### 7.2 Staking.sol

#### `stake`

```solidity
function stake(uint256 amount) external nonReentrant
```

Stakes `amount` of AKX tokens. Resets the cooldown timer to `block.timestamp`.

---

#### `unstake`

```solidity
function unstake(uint256 amount) external nonReentrant
```

Withdraws `amount` of staked AKX.  
**Requirements:** `block.timestamp >= stakeTimestamp + 7 days`.

---

#### `claimRewards`

```solidity
function claimRewards() external nonReentrant
```

Transfers all accumulated AKX rewards to the caller's wallet.

---

#### `getPendingRewards`

```solidity
function getPendingRewards(address user) external view returns (uint256)
```

Returns the total pending reward amount for `user`, including unclaimed compounded interest.

---

### 7.3 OracleLib.sol

#### `getPrice`

```solidity
function getPrice(address token) external view returns (uint256)
```

Returns the USD price of `token` normalized to **18 decimals**.  
**Reverts if:** Feed is stale (> 3 hours old) or price ≤ 0.

---

#### `setPriceFeed`

```solidity
function setPriceFeed(address token, address feed) external
```

Sets the Chainlink aggregator address for a given token.  
**Permission:** Contract owner only.

---

### 7.4 USDAX.sol & AKX.sol

**USDAX.sol**
- Standard ERC-20 with `mint()` and `burn()`.
- Both functions are restricted to `DSCEngine` only via `onlyOwner` (DSCEngine is set as owner post-deploy).

**AKX.sol**
- Standard ERC-20 with `ERC20Votes` extension for on-chain snapshot voting.
- `delegate()` must be called before voting power is active.
- `MAX_SUPPLY = 100_000_000 * 1e18` — immutable hard cap enforced in the `mint()` override.

---

## 8. Deployment Addresses

> **Note:** Addresses below are placeholders. Replace them with your actual deployed contract addresses after running the Forge deployment script.

### Robinhood Chain Testnet (Chain ID: `46630`)

| Contract | Address |
| :--- | :--- |
| USDAX (Stablecoin) | `0x...` |
| AKX (Governance) | `0x...` |
| DSCEngine (Core) | `0x...` |
| OracleLib | `0x...` |
| Staking | `0x...` |

### Robinhood Chain Mainnet (Chain ID: `4663`)

_Coming soon after testnet validation and external audit completion._

---

## 9. Security & Audits

### 9.1 Security Considerations

| Mechanism | Description |
| :--- | :--- |
| **Reentrancy Guard** | All state-changing functions in `DSCEngine` and `Staking` use OpenZeppelin's `ReentrancyGuard`. |
| **Stale Price Protection** | Oracle prices are rejected if older than 3 hours, preventing manipulation during feed outages. |
| **Overcollateralization** | 150% collateral ratio provides a buffer against sharp market volatility. |
| **Liquidation Cap** | Maximum 50% of debt per liquidation call prevents flash-loan-based over-liquidation. |
| **Access Control** | `mint()` and `burn()` on USDAX are restricted to `DSCEngine`. Oracle feeds restricted to owner. |

### 9.2 Audit Status

| Stage | Status |
| :--- | :--- |
| Internal Review | ✅ Completed by core development team. |
| External Audit | 🔄 Scheduled with a third-party auditor before Mainnet launch. |
| Bug Bounty | 📅 Public program planned on Immunefi post-mainnet. |

---

## 10. Glossary

| Term | Definition |
| :--- | :--- |
| **USDAX** | The stablecoin native to ArchonX, pegged 1:1 to the US Dollar. |
| **AKX** | The governance and staking token of ArchonX. |
| **Overcollateralized** | A debt position where the collateral value exceeds the borrowed value (150% in ArchonX). |
| **Health Factor (HF)** | A numeric metric representing the safety of a loan position. Must be ≥ 1.0 to avoid liquidation. |
| **Liquidation** | The process of forcibly repaying a user's debt to claim their collateral when undercollateralized. |
| **Cooldown Period** | A mandatory 7-day waiting period before staked AKX can be withdrawn. |
| **Chainlink Oracle** | A decentralized network providing reliable real-time off-chain price data to smart contracts. |
| **ERC20Votes** | An OpenZeppelin extension that adds on-chain snapshot-based voting power to an ERC-20 token. |
| **LTV** | Loan-to-Value ratio. At 150% collateralization, the effective LTV cap is ~66.7%. |
| **Arbitrum Orbit** | The L2/L3 stack Robinhood Chain is built on, providing Ethereum-compatible execution with low fees. |

---

## 📥 Quick Reference by Role

| Role | Read These Sections |
| :--- | :--- |
| **End User** | §1 Introduction, §3 Tokenomics, §6 User Guides |
| **Developer / Integrator** | §4 Architecture, §5 Core Mechanics, §7 API Reference, §8 Deployment |
| **Security Auditor** | §5 Core Mechanics, §7 API Reference, §9 Security & Audits |
| **Governance Participant** | §3.2 AKX Tokenomics, §5.4 Staking & APY |

---

*This document is maintained alongside the codebase and updated after every significant protocol upgrade.*

© 2026 ArchonX Protocol. All rights reserved.
