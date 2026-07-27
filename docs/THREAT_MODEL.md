# USDAX Finance — Threat Model

> **Audit version:** v1.5  
> **Protocol:** CDP stablecoin on Robinhood Chain (testnet 46630 / mainnet 4663)  
> **Prepared for:** Trail of Bits engagement  
> **Date:** July 2026

---

## 1. Protocol Overview

USDAX Finance is a Collateralised Debt Position (CDP) stablecoin protocol. Users lock whitelisted collateral (stETH, WBTC, RWA tokens) and mint USDAX, a soft-pegged USD stablecoin. The system enforces solvency via:

- **LTV limits** per collateral (set by governance via CollateralManager)
- **Health factor monitoring** — positions with HF < 1.0 are liquidatable
- **Stability fee** — accrued continuously, increasing debt over time
- **Oracle price feeds** — two-tier: Chainlink on-chain + CoinGecko fallback (keeper-refreshed)

### Contracts in scope

| Contract | Role |
|---|---|
| `VaultEngine.sol` | Core CDP logic: deposit, mint, repay, withdraw, liquidate |
| `USDAxToken.sol` | ERC-20 stablecoin; mint/burn gated to VaultEngine |
| `USDAxSavings.sol` | Savings module; deposit USDAX, earn rewards from reward pool |
| `ChainlinkPriceOracle.sol` | Two-tier price oracle; Chainlink preferred, fallback for testnet |
| `CollateralManager.sol` | Collateral whitelist and risk params (LTV, liqThreshold, liqBonus) |

**Out of scope:** `APXStaking.sol`, `MockERC20.sol`, `MockPriceOracle.sol`, deployment scripts.

---

## 2. Assets at Risk

| Asset | Location | Value at Risk |
|---|---|---|
| Collateral tokens (stETH, WBTC, RWA-TB, RWA-RE, RWA-CB) | `VaultEngine.collateralDeposits` | All collateral locked by users |
| USDAX supply | `USDAxToken` total supply | Pegged purchasing power of all holders |
| Savings reward pool | `USDAxSavings.rewardPool` | USDAX seeded for depositor rewards |
| Protocol fee revenue | `feeRecipient` balance | Accumulated mint + stability fees |

---

## 3. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  TRUSTED                                                    │
│  - TimelockController (24 h governance delay)               │
│  - Deployer EOA (testnet only; mainnet: multisig)           │
│  - Oracle Updater EOA (keeper hot-wallet; price push only)  │
└─────────────────────────────────────────────────────────────┘
         │ calls
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PROTOCOL CONTRACTS (in-scope)                              │
│  VaultEngine / USDAxToken / USDAxSavings /                  │
│  ChainlinkPriceOracle / CollateralManager                   │
└─────────────────────────────────────────────────────────────┘
         │ interacts with
         ▼
┌─────────────────────────────────────────────────────────────┐
│  UNTRUSTED                                                  │
│  - Arbitrary ERC-20 collateral tokens                       │
│  - Any external user / liquidator bot                       │
│  - CoinGecko HTTP feed (off-chain, keeper-mediated)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Threat Actors

| Actor | Capability | Goal |
|---|---|---|
| **Malicious user** | Can open vaults, repay, liquidate, interact with savings | Steal collateral, mint unbacked USDAX, avoid liquidation |
| **Rogue keeper** | Has Oracle Updater role; pushes fallback prices | Manipulate prices to trigger or prevent liquidations |
| **Governance attacker** | Compromises Deployer EOA; proposes via TimelockController | Swap VaultEngine, drain fee wallet, disable all collateral |
| **Flash loan attacker** | No flash loan primitive on Robinhood Chain currently | Oracle price manipulation via spot DEX (no DEX deployed yet) |
| **Griefing attacker** | Can call public functions at will | DoS via dust vaults, gas exhaustion, spamming events |

---

## 5. Attack Scenarios

### 5.1 Oracle Price Manipulation

**Threat:** Rogue updater EOA pushes an artificially low collateral price to make otherwise-healthy vaults liquidatable (forced liquidation attack), or pushes artificially high prices to allow minting against inflated collateral (undercollateralised mint).

**Mitigations:**
- `ChainlinkPriceOracle._safePrice()` — VaultEngine additionally checks `block.timestamp ≤ updatedAt + MAX_ORACLE_STALENESS (2 h)`. If the oracle is stale, VaultEngine reverts.
- Chainlink feeds (mainnet) serve as primary source; fallback only used when Chainlink is stale or unregistered.
- The `updater` role cannot change `maxStaleness`, register/remove feeds, or modify any parameter — only push prices.
- **Residual risk:** On testnet, there are no Chainlink feeds; fallback is the only source. A compromised updater EOA can manipulate prices with a 30-min update cycle.

### 5.2 Reentrancy via Collateral Token Callbacks

**Threat:** A malicious ERC-777 or hook-bearing ERC-20 token used as collateral could re-enter `VaultEngine` during `safeTransferFrom` (deposit) or `safeTransfer` (withdrawal/liquidation).

**Mitigations:**
- All state-mutating functions use the `nonReentrant` modifier (OpenZeppelin `ReentrancyGuard`).
- `CollateralManager.isEnabled(token)` gates which tokens can be deposited; governance (TimelockController) controls the whitelist.
- Current testnet collaterals are MockERC20 (no hooks).
- **Residual risk:** If governance approves a malicious token, nonReentrant prevents cross-function reentrancy but not single-function read-only reentrancy used for price/HF checks. Chainlink or mock oracle prices are not fetched inside the transfer callback path, so the attack surface is minimal.

### 5.3 Liquidation Sandwich / MEV

**Threat:** A liquidator front-runs a price oracle update to liquidate vaults milliseconds before the on-chain price settles, capturing the liquidation bonus at minimal risk.

**Mitigations:**
- No protection implemented — this is accepted behaviour common to all CDP protocols.
- The 5% liquidation bonus is the incentive for liquidators; sandwiching is bounded by the bonus itself.
- **Acknowledged:** Mempool privacy / commit-reveal for liquidations is not in scope for v1.

### 5.4 Governance Takeover via TimelockController

**Threat:** If the Deployer EOA is compromised, an attacker can schedule proposals to:
- Call `USDAxToken.updateVaultEngine(attacker)` → attacker can mint USDAX freely.
- Call `VaultEngine.setFeeRecipient(attacker)` → steal fee revenue.
- Call `CollateralManager.disableCollateral(all)` → prevent new deposits.

**Mitigations:**
- 24 h minimum delay on all proposals; the community/team has 24 h to observe and respond.
- **Residual risk (testnet):** Deployer EOA is the sole proposer and executor. On mainnet this MUST be replaced with a Gnosis Safe multisig (recommend 3-of-5).

### 5.5 Unbacked USDAX via Undercollateralised Vault

**Threat:** User mints USDAX, price drops below liquidation threshold faster than the keeper can liquidate, leaving a shortfall.

**Mitigations:**
- `liquidationThreshold > LTV` creates a buffer (e.g. LTV 80%, liqThreshold 85% for stETH).
- Liquidation bonus (5%) incentivises liquidators to act quickly.
- Stability fee continuously increases debt, improving incentive to close positions early.
- Keeper bot runs every 5 minutes; scans all vaults each cycle.
- **Residual risk:** Extreme price velocity (> 15% drop in < 5 min) can outpace the keeper. No bad-debt socialisation mechanism exists in v1.

### 5.6 Dust Vault DoS

**Threat:** Attacker opens thousands of tiny vaults (exactly `MIN_DEBT = 10 USDAX`) to bloat `_vaultOwners`, making keeper scans prohibitively expensive and slowing liquidations.

**Mitigations:**
- `MIN_DEBT = 10e18` prevents zero-value vaults.
- `getVaultOwnersPaginated(offset, limit)` (v1.5) allows keeper to process owners in bounded batches of 200.
- Keeper uses paginated scanner; total scan time scales linearly with owner count.
- **Residual risk:** Creating 10,000 dust vaults costs ~10,000 × 10 USDAX = 100,000 USDAX + gas. Economically expensive; no penalty beyond gas for attacker.

### 5.7 Savings Reward Pool Drain

**Threat:** User deposits USDAX, accrues rewards faster than the pool replenishes, eventually draining `rewardPool` to zero.

**Mitigations:**
- `claimRewards()` caps payout to `min(pending, rewardPool)` — never reverts, never over-pays.
- APY is governance-controlled (max 50% cap enforced on-chain).
- **Residual risk:** Pool depletion gives APY of 0% effectively. No auto-refill from stability fees in v1. Acknowledged.

### 5.8 Integer Overflow / Precision Loss

**Threat:** WAD arithmetic errors lead to under-counted debt or over-counted collateral.

**Mitigations:**
- Solidity 0.8.24 built-in overflow checks on all arithmetic.
- All prices in 18-decimal WAD; collateral amounts normalised per token decimals.
- Stability fee uses `(principal × feeBps × elapsed) / (SECONDS_PER_YEAR × BASIS_POINTS)` — no division before multiplication.
- Fuzz tests (`VaultEngine.fuzz.t.sol`) cover fee exactness and HF monotonicity with random inputs (257 runs each).

---

## 6. Known Issues / Acknowledged Risks

These are intentional design decisions or accepted limitations disclosed to auditors:

| # | Issue | Severity | Acknowledged |
|---|---|---|---|
| K1 | `_vaultOwners` grows unbounded — paginated access mitigates gas risk but array never shrinks | Low | ✅ |
| K2 | No bad-debt socialisation — shortfalls not covered by insurance module in v1 | Medium | ✅ |
| K3 | Deployer EOA is sole TimelockController proposer/executor (testnet) | Medium | ✅ Mainnet: multisig |
| K4 | ChainlinkPriceOracle not owned by TimelockController | Low | ✅ Operational requirement |
| K5 | No slippage protection in `liquidate()` | Low | ✅ Accepted CDP norm |
| K6 | `collateralList` never shrinks — includes disabled tokens | Informational | ✅ |
| K7 | Savings reward pool not auto-refilled from stability fees | Medium | ✅ Manual refill v1 |
| K8 | No DEX liquidity on testnet; no flash-loan protection | Low | ✅ No DEX deployed |

---

## 7. Invariants

Formally stated invariants — also encoded as Foundry invariant tests (`Invariants.t.sol`):

1. **Supply backed by collateral:** `USDAX.totalSupply ≤ Σ(collateralDeposits[u][t] × price[t] / 10^dec[t])` for all vaults with HF ≥ 1.
2. **Debt ceiling never breached:** If `debtCeiling > 0`, `USDAX.totalSupply ≤ debtCeiling` always.
3. **Fee wallet monotonically non-decreasing:** `feeRecipient` USDAX balance never decreases (fees only accrue, never clawed back).
4. **No vault exceeds LTV at time of mint:** For any vault after `mintUsdax`: `debt / adjustedCollateralValue ≤ 1.0`.

---

## 8. Out-of-Scope Attack Surfaces

- Frontend / off-chain keeper infrastructure
- APXStaking contract (APX token not yet deployed on mainnet)
- Cross-chain bridge risk (Robinhood Chain is an L2; bridge security is out of scope)
- Centralization risk of Robinhood Chain itself (sequencer, validator set)
- CoinGecko API availability / correctness (accepted off-chain dependency)
