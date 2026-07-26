# USDAX Finance — Protocol Documentation

**Version:** 1.1.0 (Security Release)
**Blockchain:** Robinhood Chain (EVM-Compatible, Arbitrum Orbit)
**Chain ID:** `46630` (Testnet) · `4663` (Mainnet, coming soon)
**Last Updated:** July 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Protocol Overview](#2-protocol-overview)
3. [Tokenomics](#3-tokenomics)
   - [3.1 USDAX (Stablecoin)](#31-usdax-stablecoin)
   - [3.2 APX (Governance Token)](#32-apx-governance-token)
4. [System Architecture](#4-system-architecture)
   - [4.1 Smart Contract Interaction Flow](#41-smart-contract-interaction-flow)
   - [4.2 Oracle & Price Feeds](#42-oracle--price-feeds)
5. [Core Mechanics](#5-core-mechanics)
   - [5.1 Overcollateralization & Minting](#51-overcollateralization--minting)
   - [5.2 Minting Fee](#52-minting-fee)
   - [5.3 Health Factor](#53-health-factor)
   - [5.4 Withdrawal Safety Buffer](#54-withdrawal-safety-buffer)
   - [5.5 Liquidation Mechanism](#55-liquidation-mechanism)
   - [5.6 Staking & APY](#56-staking--apy)
6. [User Guides](#6-user-guides)
   - [6.1 How to Mint USDAX](#61-how-to-mint-usdax)
   - [6.2 How to Repay Debt & Close a Vault](#62-how-to-repay-debt--close-a-vault)
   - [6.3 How to Stake APX](#63-how-to-stake-apx)
   - [6.4 How to Claim Staking Rewards](#64-how-to-claim-staking-rewards)
   - [6.5 How to Liquidate an Underwater Vault](#65-how-to-liquidate-an-underwater-vault)
7. [Smart Contract Reference](#7-smart-contract-reference)
   - [7.1 VaultEngine.sol](#71-vaultenginesol)
   - [7.2 USDAxToken.sol](#72-usdaxtokensol)
   - [7.3 CollateralManager.sol](#73-collateralmanagersol)
   - [7.4 MockPriceOracle.sol](#74-mockpriceoraclesol)
8. [Deployment Addresses](#8-deployment-addresses)
9. [Security & Audits](#9-security--audits)
10. [Risk Parameters](#10-risk-parameters)
11. [Glossary](#11-glossary)

---

## 1. Introduction

**USDAX Finance** is a decentralized, overcollateralized stablecoin protocol built on Robinhood Chain. Users deposit crypto assets as collateral to mint **USDAX** — a USD-pegged stablecoin — at a safe loan-to-value ratio. The protocol enforces solvency through on-chain health factor monitoring and permissionless liquidations.

Core design principles:

| Principle | Description |
| :--- | :--- |
| **Capital Efficiency** | Per-asset LTV and liquidation thresholds tuned to each collateral's risk profile. |
| **User Protection** | Withdrawal safety buffer (HF ≥ 1.05) prevents users from unknowingly approaching the liquidation boundary. |
| **Fairness to Liquidators** | Proportional scaling ensures liquidators always receive the full liquidation bonus relative to the debt they cover, even on near-empty vaults. |
| **Immutability** | Critical references (VaultEngine address in USDAxToken) are set once and cannot be changed after deployment. |

---

## 2. Protocol Overview

Five primary smart contracts work together:

| Contract | Purpose |
| :--- | :--- |
| `VaultEngine.sol` | Core CDP engine. Handles collateral deposits, debt tracking, minting, repayment, withdrawal, and liquidations. |
| `USDAxToken.sol` | ERC-20 stablecoin. Mint and burn are restricted exclusively to `VaultEngine`. |
| `CollateralManager.sol` | Stores per-asset risk parameters: maxLTV, liquidationThreshold, liquidationBonus, and token decimals. |
| `MockPriceOracle.sol` | On-chain price feed. Prices are admin-set. Reverts if any price is older than 24 hours (stale price protection). |
| `MockERC20.sol` | Faucet-mintable test tokens (WETH, WBTC, stETH) used for testnet experimentation. |

---

## 3. Tokenomics

### 3.1 USDAX (Stablecoin)

| Property | Value |
| :--- | :--- |
| **Ticker** | USDAX |
| **Type** | Overcollateralized Stablecoin |
| **Peg** | 1 USDAX = $1.00 USD |
| **Max Supply** | Algorithmically limited by available collateral — no hard cap. |
| **Minting Fee** | 0.5% of the requested mint amount (deducted at mint time, sent to protocol fee recipient). |
| **Usage** | Stable medium of exchange, collateral for external DeFi protocols, stable store of value. |

> **Minting fee note:** When a user requests to mint `N` USDAX, they receive `N × 0.995` in their wallet. Their on-chain debt is recorded as `N` (full amount). The remaining `N × 0.005` is minted to the protocol fee recipient. This origination fee is intentional and visible in the UI.

### 3.2 APX (Governance Token)

| Property | Value |
| :--- | :--- |
| **Ticker** | APX |
| **Type** | ERC-20 governance token |
| **Max Supply** | 100,000,000 APX (immutable hard cap) |
| **Status** | Not yet deployed — activates H2 2026 |

**Planned utility:**
- Stake to earn variable APY (rewards paid in APX).
- On-chain voting power for protocol parameter changes.
- Revenue sharing and protocol fee distribution.

---

## 4. System Architecture

### 4.1 Smart Contract Interaction Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                          END USER (EOA)                           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     USDAX Finance DApp                            │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     VaultEngine.sol  (Core CDP)                   │
│                                                                   │
│  depositCollateral()   → Records collateral, registers owner      │
│  mintUsdax()           → Checks LTV, mints USDAX (minus 0.5%)    │
│  repayUsdax()          → Burns debt, reduces balance              │
│  withdrawCollateral()  → Enforces HF ≥ 1.05 after withdrawal     │
│  liquidate()           → Burns liquidator's USDAX, seizes coll.  │
└───────────┬───────────────────┬───────────────────────────────────┘
            │                   │
            ▼                   ▼
┌─────────────────┐   ┌──────────────────────────────────────────┐
│  USDAxToken.sol │   │  CollateralManager.sol + PriceOracle.sol │
│  (Mint / Burn)  │   │  (Risk params + USD prices)              │
└─────────────────┘   └──────────────────────────────────────────┘
```

### 4.2 Oracle & Price Feeds

USDAX Finance uses a **MockPriceOracle** on testnet. Prices are set by the protocol deployer via `setPrices()`.

- **Stale Price Protection:** Any price older than **24 hours** causes `getPrice()` to revert, blocking all vault operations until prices are refreshed.
- **Decimal Format:** All prices are stored and returned in **18 decimal** USD notation (e.g., `2000e18` = $2,000).

> On mainnet, the oracle will be replaced by a decentralized feed (e.g., Chainlink or a TWAP-based system).

---

## 5. Core Mechanics

### 5.1 Overcollateralization & Minting

Each collateral asset has its own **maxLTV** and **liquidationThreshold** (stored in `CollateralManager`). The LTV cap determines the maximum USDAX mintable:

```
Max Mintable USDAX = Σ (collateral_amount_i × price_i × maxLTV_i)
```

**Example with WETH (maxLTV = 80%):**

| Step | Value |
| :--- | :--- |
| User deposits | 1 WETH |
| WETH price | $2,000 |
| Collateral value | $2,000 |
| Max USDAX mintable | $2,000 × 80% = **$1,600 USDAX** |
| User receives (after 0.5% fee) | **$1,592 USDAX** |
| On-chain debt recorded | **$1,600 USDAX** |

### 5.2 Minting Fee

A **0.5% origination fee** is deducted at mint time:

```
Fee = amount × 0.005
User receives = amount − fee
Debt recorded = amount (full)
```

This fee is sent to the protocol fee recipient address. It is non-refundable and displayed in the UI before confirmation.

### 5.3 Health Factor

The **Health Factor (HF)** determines whether a vault is safe or eligible for liquidation:

```
Health Factor = (Σ collateral_value_i × liquidationThreshold_i) / total_debt
```

| Health Factor | Status |
| :--- | :--- |
| `> 1.05` | ✅ Safe — comfortably above both the liquidation boundary and the withdrawal buffer. |
| `1.0 < HF < 1.05` | ⚠️ Near liquidation — withdrawal blocked, repay debt to restore safety margin. |
| `= 1.0` | 🔴 At liquidation boundary — eligible for liquidation at next price tick. |
| `< 1.0` | 🔴 Undercollateralized — eligible for immediate liquidation. |

### 5.4 Withdrawal Safety Buffer

When withdrawing collateral, the protocol enforces a **5% safety buffer**:

```
Post-withdrawal Health Factor must be ≥ 1.05
```

**Why this matters:** Without the buffer, a user could withdraw collateral until HF = 1.0 exactly. A single oracle price tick would then immediately make their vault eligible for liquidation — leaving no time to react. The 1.05 buffer provides a grace window between the withdrawal limit and the liquidation trigger.

### 5.5 Liquidation Mechanism

When a vault's Health Factor drops below `1.0`, any external account can call `liquidate()` to repay part of that vault's debt in exchange for collateral plus a liquidation bonus.

**Liquidation parameters (per asset):**

| Asset | Liquidation Threshold | Liquidation Bonus |
| :--- | :--- | :--- |
| WETH | 85% | 5% |
| WBTC | 80% | 5% |
| stETH | 80% | 5% |

**How it works:**

1. Liquidator calls `liquidate(vaultOwner, debtToRepay, collateralToken)`.
2. Protocol calculates collateral equivalent to `debtToRepay` at current price, plus a 5% bonus.
3. If the vault does not have enough collateral to cover the full bonus:
   - `debtToRepay` is **scaled down proportionally** so the liquidator always receives the full 5% bonus on the amount they cover.
   - The liquidator is never shorted — they always get exactly the bonus they are entitled to.
4. `debtToRepay` USDAX is burned from the liquidator's wallet.
5. `collateralWithBonus` tokens are transferred to the liquidator.

**Example:**

| | Value |
| :--- | :--- |
| Vault collateral | 0.5 WETH ($1,000) |
| Vault debt | $1,100 USDAX |
| Health Factor | 1,000 × 0.85 / 1,100 = **0.773** — liquidatable |
| Liquidator sends | $952.38 USDAX |
| Liquidator receives | 0.5 WETH ($1,000) — exactly 5% bonus on $952.38 covered |

> **Single-call cap:** One `liquidate()` call can cover at most **100% of outstanding debt** (no cap below that) — liquidators choose how much to cover, up to the full debt amount.

### 5.6 Staking & APY

Staking uses the **APX governance token**, which is not yet deployed. Once APX launches (H2 2026):

- **Base APY:** 15% annualized.
- **Cooldown Period:** 7 days from unstake initiation before tokens can be withdrawn.
- **Reward accrual:** Continuous, second-by-second accumulation based on staked balance.

---

## 6. User Guides

### 6.1 How to Mint USDAX

1. Open the USDAX Finance app and connect your wallet to **Robinhood Chain Testnet** (Chain ID: `46630`).
2. Claim testnet tokens from the **Faucet** page (WETH, WBTC, or stETH).
3. Navigate to **Vaults → Open New Vault**.
4. Select your collateral asset and enter the deposit amount.
5. Enter the amount of USDAX to mint. The UI shows your projected Health Factor, minting fee, and actual amount received in real time.
6. Approve the collateral token spend, then confirm the vault transaction.
7. USDAX appears in your wallet. Your Health Factor must remain above 1.05 to withdraw collateral later.

### 6.2 How to Repay Debt & Close a Vault

1. Go to **Vaults** and locate your active position.
2. Click **Close Vault**.
3. Approve USDAX spend (equal to your full outstanding debt), then confirm.
4. Your collateral is returned to your wallet and the vault is closed.

> Partial repayment: use the **Repay** action to reduce debt without closing the vault.

### 6.3 How to Stake APX

> APX staking activates at APX token launch (H2 2026).

1. Navigate to the **Staking** page.
2. Enter the amount of APX to stake and confirm.
3. Rewards begin accruing immediately. Your 7-day cooldown timer starts on unstake initiation.

### 6.4 How to Claim Staking Rewards

1. Visit the **Staking** page.
2. Click **Claim Rewards** on your position card.
3. Rewards transfer directly to your wallet in APX. Claiming does not reset your cooldown.

### 6.5 How to Liquidate an Underwater Vault

1. Go to the **Liquidations** page. Vaults with Health Factor `< 1.0` are shown.
2. Select a vault and review the debt, collateral, and projected bonus.
3. Enter the amount of USDAX debt to cover (any amount up to the vault's full debt).
4. Confirm the transaction. No prior approval needed — VaultEngine burns USDAX directly from your wallet via its mint/burn authority.
5. Collateral plus the 5% bonus transfers to your wallet on the same transaction.

---

## 7. Smart Contract Reference

### 7.1 VaultEngine.sol

#### `depositCollateral`

```solidity
function depositCollateral(address token, uint256 amount) external nonReentrant
```

Deposits `amount` of `token` into the caller's vault. Token must be whitelisted in `CollateralManager`.

---

#### `mintUsdax`

```solidity
function mintUsdax(uint256 amount) external nonReentrant
```

Mints `amount` of USDAX against deposited collateral. A 0.5% fee is deducted — the user receives `amount × 0.995`, but debt is recorded as `amount`.

**Reverts if:** `_maxMintable(msg.sender) < newDebt` (exceeds maxLTV).

---

#### `repayUsdax`

```solidity
function repayUsdax(uint256 amount) external nonReentrant
```

Burns `amount` USDAX from the caller and reduces their debt. Caps at full outstanding debt.

---

#### `withdrawCollateral`

```solidity
function withdrawCollateral(address token, uint256 amount) external nonReentrant
```

Withdraws collateral. If the caller has any debt, enforces that the post-withdrawal Health Factor is **≥ 1.05**.

**Reverts if:** `_healthFactor(msg.sender) < WAD × 1.05` after withdrawal.

---

#### `liquidate`

```solidity
function liquidate(
    address vaultOwner,
    uint256 debtToRepay,
    address collToken
) external nonReentrant
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `vaultOwner` | `address` | Address of the undercollateralized vault. |
| `debtToRepay` | `uint256` | USDAX debt amount the liquidator covers. Automatically scaled down if vault collateral is insufficient to pay the full bonus. |
| `collToken` | `address` | Collateral token to seize. |

**Reverts if:** `_healthFactor(vaultOwner) >= WAD` (vault is healthy).

---

#### `healthFactor`

```solidity
function healthFactor(address user) external view returns (uint256)
```

Returns the health factor scaled by `1e18`. Values below `1e18` (= 1.0) are eligible for liquidation.

---

### 7.2 USDAxToken.sol

#### `setVaultEngine`

```solidity
function setVaultEngine(address engine) external onlyOwner
```

Sets the VaultEngine address — **callable once only**. After the first call, `vaultEngine` is permanently set and cannot be changed. This prevents the owner from redirecting mint/burn authority to a malicious contract after deployment.

**Reverts if:** `vaultEngine != address(0)` (already set).

---

#### `mint` / `burn`

```solidity
function mint(address to, uint256 amount) external onlyVaultEngine
function burn(address from, uint256 amount) external onlyVaultEngine
```

Both restricted to `VaultEngine` only via the `onlyVaultEngine` modifier.

---

### 7.3 CollateralManager.sol

Stores per-asset risk parameters set at deployment:

| Parameter | Description |
| :--- | :--- |
| `maxLTV` | Maximum loan-to-value ratio for minting (basis points, e.g., 8000 = 80%). |
| `liquidationThreshold` | Threshold used in Health Factor calculation (basis points). |
| `liquidationBonus` | Bonus paid to liquidators (basis points, e.g., 500 = 5%). |
| `tokenDecimals` | ERC-20 decimals of the collateral token (used for price conversion). |

---

### 7.4 MockPriceOracle.sol

```solidity
function getPrice(address token) external view returns (uint256 price, uint256 updatedAt)
```

Returns the USD price of `token` in 18-decimal format. Reverts if the price was last set more than 24 hours ago.

```solidity
function setPrices(address[] calldata tokens, uint256[] calldata prices) external onlyOwner
```

Sets prices for multiple tokens in one call. Only the deployer can call this.

---

## 8. Deployment Addresses

### Robinhood Chain Testnet (Chain ID: `46630`)

> Deployed July 24, 2026. All contracts verified on [explorer.testnet.chain.robinhood.com](https://explorer.testnet.chain.robinhood.com).

| Contract | Address |
| :--- | :--- |
| USDAX Token | `0x89F2c042def8719930904A474FF999A0F8fddd64` |
| VaultEngine | `0xB5d971d69728B0C31b19A8f184d31813F29EEA20` |
| CollateralManager | `0x2472DCBA450e0AA2f81e69AaCD33f91528343854` |
| Price Oracle | `0xe5211fF6a85F51b290600B4807d0ee5F978cEC2D` |
| WETH (testnet) | `0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc` |
| WBTC (testnet) | `0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34` |
| stETH (testnet) | `0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e` |

**Deployer:** `0xD1f324DfFdf49d81eEd4419edF0515E5d99887B2`
**Compiler:** `v0.8.24+commit.e11b9ed9` · Optimizer: 200 runs

### Robinhood Chain Mainnet (Chain ID: `4663`)

Pending testnet validation and external security audit completion.

---

## 9. Security & Audits

### 9.1 Security Mechanisms

| Mechanism | Implementation |
| :--- | :--- |
| **Reentrancy Guard** | All state-changing functions use OpenZeppelin `ReentrancyGuard`. |
| **Stale Price Protection** | `getPrice()` reverts if the price is more than 24 hours old. |
| **Withdrawal Safety Buffer** | `withdrawCollateral()` requires post-withdrawal HF ≥ 1.05 (not just ≥ 1.0). |
| **Fair Liquidation Scaling** | When vault collateral is insufficient for the full bonus, `debtToRepay` is scaled down proportionally — liquidators are never shortchanged. |
| **Immutable Engine Reference** | `USDAxToken.setVaultEngine()` is one-time-only; the address cannot be replaced after deployment. |
| **Access Control** | `mint()` and `burn()` on USDAX restricted to `VaultEngine`. Oracle `setPrices()` restricted to owner. |
| **Per-Asset Risk Params** | LTV and liquidation thresholds tuned per collateral rather than a single protocol-wide value. |

### 9.2 Security Changelog — v1.1.0 (July 2026)

Three issues identified in the v1.0.0 deployment were fixed and redeployed:

| Severity | Contract | Issue | Fix |
| :--- | :--- | :--- | :--- |
| Medium | `VaultEngine` | Partial liquidation shortchanged liquidators when vault collateral was insufficient to pay the full bonus. | `debtToRepay` is now scaled proportionally from available collateral — liquidators always receive the full 5% bonus on what they repay. |
| Medium | `VaultEngine` | `withdrawCollateral` allowed HF to reach exactly 1.0 — the liquidation boundary — leaving no safety margin. | Now requires post-withdrawal HF ≥ 1.05 (5% buffer). |
| Low | `USDAxToken` | `setVaultEngine()` could be called multiple times by the owner, allowing the mint/burn target to be redirected. | Added `require(vaultEngine == address(0))` — the engine address can only be set once. |

### 9.3 Audit Status

| Stage | Status |
| :--- | :--- |
| Internal Review | ✅ Completed — July 2026 |
| External Audit | 🔄 Scheduled with third-party auditor prior to mainnet launch |
| Bug Bounty | 📅 Public program planned on Immunefi post-mainnet |

---

## 10. Risk Parameters

### Collateral Risk Configuration (Testnet)

| Asset | Max LTV | Liquidation Threshold | Liquidation Bonus | Token Decimals |
| :--- | :--- | :--- | :--- | :--- |
| WETH | 80% | 85% | 5% | 18 |
| WBTC | 75% | 80% | 5% | 8 |
| stETH | 75% | 80% | 5% | 18 |

**How to read this table:**
- **Max LTV:** The maximum ratio of debt to collateral value at which USDAX can be minted.
- **Liquidation Threshold:** The collateral value ratio used to compute the Health Factor. A vault becomes liquidatable when HF = `(collateral × liqThreshold) / debt` drops below 1.0.
- **Liquidation Bonus:** The extra collateral percentage paid to the liquidator as an incentive.

---

## 11. Glossary

| Term | Definition |
| :--- | :--- |
| **USDAX** | The overcollateralized stablecoin of USDAX Finance, pegged 1:1 to USD. |
| **APX** | The governance and staking token of USDAX Finance (not yet deployed). |
| **CDP** | Collateralized Debt Position — a vault where a user deposits collateral and borrows against it. |
| **Health Factor (HF)** | A numeric ratio representing vault safety. Below 1.0 = liquidatable. Below 1.05 = withdrawal blocked. |
| **MaxLTV** | Maximum loan-to-value ratio — caps how much USDAX can be minted per unit of collateral. |
| **Liquidation Threshold** | The collateral adjustment factor used in HF calculation. Higher = stricter safety requirement. |
| **Liquidation Bonus** | Extra collateral percentage awarded to the liquidator as compensation and protocol incentive. |
| **Stale Price** | An oracle price older than 24 hours. All vault operations revert until prices are refreshed. |
| **Origination Fee** | 0.5% fee charged at mint time. Deducted from received USDAX; full amount recorded as debt. |
| **Cooldown Period** | 7-day waiting period after initiating an APX unstake before tokens can be withdrawn. |
| **Arbitrum Orbit** | The L2/L3 stack Robinhood Chain is built on — Ethereum-compatible with low fees. |

---

## Quick Reference

| Role | Sections to Read |
| :--- | :--- |
| End User | §1, §3, §6 |
| Developer / Integrator | §4, §5, §7, §8, §10 |
| Security Auditor | §5, §7, §9 |
| Governance Participant | §3.2, §5.6 |

---

*This document is maintained alongside the codebase and updated after every significant protocol upgrade.*

*© 2026 USDAX Finance. All rights reserved.*
