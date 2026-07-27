# USDAX Finance — Access Control Matrix

> **Audit version:** v1.5  
> **Chain:** Robinhood Chain Testnet (46630) / Mainnet (4663)  
> **Generated:** July 2026

---

## Actor Definitions

| Actor | Address (testnet) | Description |
|---|---|---|
| **TimelockController** | `0x652E73...Ab8` | OZ TimelockController, 24 h min delay. Owns 4 of 5 contracts. |
| **Deployer EOA** | `0xD1f324...B2` | Contract deployer. Proposer + Executor on TimelockController. |
| **Oracle Updater** | `0xD1f324...B2` (same as deployer on testnet) | Holds `updater` role on ChainlinkPriceOracle. Keeper bot pushes CoinGecko prices every 30 min. On mainnet: separate hot-wallet. |
| **Keeper Bot** | `0xfBA117...ce` | Off-chain liquidation bot. Calls `liquidate()` when HF < 1. Holds no privileged on-chain role — only calls public functions. |
| **VaultEngine** | `0xdb994C...15` | Immutable reference in USDAxToken. The only address allowed to mint/burn USDAX. |
| **Any User** | — | Any EOA or contract that interacts with user-facing functions. |

---

## VaultEngine

| Function | Modifier(s) | Caller | Notes |
|---|---|---|---|
| `depositCollateral` | `nonReentrant`, `whenNotPaused` | Any User | Token must be enabled in CollateralManager |
| `mintUsdax` | `nonReentrant`, `whenNotPaused` | Any User | Drips stability fee first; LTV check; debt ceiling check |
| `repayUsdax` | `nonReentrant` | Any User | Allowed while paused (withdraw path must remain open) |
| `withdrawCollateral` | `nonReentrant` | Any User | Allowed while paused; post-withdrawal HF check |
| `liquidate` | `nonReentrant`, `whenNotPaused` | Any User (incl. Keeper Bot) | HF must be < WAD; cannot self-liquidate |
| `drip` | `public` | Any User (or internal) | Accrues stability fee for a single user; idempotent |
| `healthFactor` | `view` | Any | Read-only |
| `adjustedCollateralValue` | `view` | Any | Read-only |
| `rawCollateralValue` | `view` | Any | Read-only |
| `maxMintable` | `view` | Any | Read-only |
| `vaultOwnerCount` | `view` | Any | Read-only |
| `getVaultOwnersPaginated` | `view` | Any | Read-only; preferred for large sets |
| `getVaultOwners` | `view` | Any | Read-only; ⚠ unbounded — see pagination note |
| `currentDebt` | `view` | Any | Read-only |
| `pendingFee` | `view` | Any | Read-only |
| `pause` | `onlyOwner` | **TimelockController** | Blocks deposit/mint/liquidate |
| `unpause` | `onlyOwner` | **TimelockController** | — |
| `setDebtCeiling` | `onlyOwner` | **TimelockController** | 0 = uncapped |
| `setStabilityFee` | `onlyOwner` | **TimelockController** | Max 2000 bps (20%) enforced |
| `setFeeRecipient` | `onlyOwner` | **TimelockController** | Must be non-zero |
| `setOracle` | `onlyOwner` | **TimelockController** | Pending: v1.5 oracle via scheduled proposal |

---

## USDAxToken (ERC-20)

| Function | Modifier(s) | Caller | Notes |
|---|---|---|---|
| Standard ERC-20 reads | `view` | Any | — |
| `transfer`, `transferFrom`, `approve` | — | Any User | Standard ERC-20 |
| `mint` | `onlyVaultEngine` | **VaultEngine** | Reverts if caller ≠ vaultEngine slot |
| `burn` | `onlyVaultEngine` | **VaultEngine** | Same guard |
| `setVaultEngine` | `onlyOwner` | **TimelockController** | One-time; reverts if already set |
| `updateVaultEngine` | `onlyOwner` | **TimelockController** | Replaces existing vaultEngine slot; no time-lock beyond the 24 h timelock |

> **Risk note:** `updateVaultEngine` allows the timelock to swap the VaultEngine address. A malicious proposal could redirect mint/burn to an attacker-controlled contract. Mitigated by the 24 h delay + deployer-only proposer on testnet. Mainnet: replace proposer with multisig.

---

## USDAxSavings

| Function | Modifier(s) | Caller | Notes |
|---|---|---|---|
| `deposit` | `nonReentrant` | Any User | Transfers USDAX in; accrues rewards from deposit time |
| `withdraw` | `nonReentrant` | Any User | Partial or full; leaves unclaimed rewards |
| `claimRewards` | `nonReentrant` | Any User | Never reverts (no reward = no-op) |
| `pendingRewards` | `view` | Any | Read-only |
| `setApy` | `onlyOwner` | **TimelockController** | Max 5000 bps (50%) enforced |

---

## ChainlinkPriceOracle

| Function | Modifier(s) | Caller | Notes |
|---|---|---|---|
| `getPrice` | `view` | Any (mainly VaultEngine) | Two-tier: Chainlink → fallback; reverts if both stale |
| `getPriceUnsafe` | `view` | Any | Same as getPrice but no staleness revert |
| `hasFeed` | `view` | Any | Read-only |
| `setFallbackPrice` | `onlyUpdaterOrOwner` | **Oracle Updater** or **Deployer EOA** | Keeper calls this every 30 min on testnet |
| `setFallbackPrices` | `onlyUpdaterOrOwner` | **Oracle Updater** or **Deployer EOA** | Batch version |
| `setUpdater` | `onlyOwner` | **Deployer EOA** | Grants/revokes updater role |
| `registerFeed` | `onlyOwner` | **Deployer EOA** | Mainnet: register live Chainlink feeds |
| `removeFeed` | `onlyOwner` | **Deployer EOA** | — |
| `setMaxStaleness` | `onlyOwner` | **Deployer EOA** | Default 1 h; adjust per feed cadence |

> **Note:** ChainlinkPriceOracle is **not** owned by the TimelockController on testnet — the oracle updater role requires frequent calls (every 30 min) incompatible with a 24 h governance delay. On mainnet, ownership should transfer to the TimelockController while the updater role stays as a separate hot-wallet.

---

## CollateralManager

| Function | Modifier(s) | Caller | Notes |
|---|---|---|---|
| `isEnabled` | `view` | Any (mainly VaultEngine) | Read-only |
| `getConfig` | `view` | Any | Read-only |
| `getCollateralList` | `view` | Any | All ever-added tokens incl. disabled |
| `addCollateral` | `onlyOwner` | **TimelockController** | Sets LTV, liqThreshold, liqBonus, decimals |
| `updateCollateral` | `onlyOwner` | **TimelockController** | Modifies existing token config |
| `disableCollateral` | `onlyOwner` | **TimelockController` | Blocks new deposits; existing vaults unaffected |

---

## Privilege Escalation Paths

```
Deployer EOA
  ├─► TimelockController (proposer + executor, 24h delay)
  │     ├─► VaultEngine.pause/unpause/setDebtCeiling/setStabilityFee/setFeeRecipient/setOracle
  │     ├─► USDAxToken.setVaultEngine / updateVaultEngine
  │     ├─► USDAxSavings.setApy
  │     └─► CollateralManager.addCollateral / updateCollateral / disableCollateral
  │
  └─► ChainlinkPriceOracle (direct owner, no timelock)
        ├─► setUpdater / registerFeed / removeFeed / setMaxStaleness (owner-only)
        └─► setFallbackPrice / setFallbackPrices (updater or owner)
              └─► Oracle Updater (keeper bot hot-wallet)
```

**Critical path:** The only way to mint USDAX outside normal vault flow is via `USDAxToken.mint()`, which requires `msg.sender == vaultEngine`. Changing `vaultEngine` requires a TimelockController proposal (24 h delay + deployer must schedule + execute). There is no backdoor.

---

## Pause Behaviour

| State | deposit | mint | repay | withdraw | liquidate |
|---|---|---|---|---|---|
| Normal | ✅ | ✅ | ✅ | ✅ | ✅ |
| Paused | ❌ | ❌ | ✅ | ✅ | ❌ |

Repay and withdraw remain open when paused to allow users to exit positions safely.
