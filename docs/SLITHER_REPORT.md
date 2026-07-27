# Slither Static Analysis Report — USDAX Finance

| Field | Detail |
|-------|--------|
| **Tool** | [Slither](https://github.com/crytic/slither) by Trail of Bits |
| **Version** | slither-analyzer 0.11.x |
| **Compiler** | solc 0.8.24 / 0.8.25 |
| **Date** | 2026-07-27 |
| **Scope** | `VaultEngine`, `CollateralManager`, `USDAxToken`, `USDAxSavings`, `ChainlinkPriceOracle`, `APXStaking` |
| **Detectors run** | 101 |
| **Dependencies excluded** | Yes (`--exclude-dependencies`) |

---

## Summary

| Severity | Project findings |
|----------|-----------------|
| 🔴 High | 0 |
| 🟠 Medium | 15 |
| 🟡 Low | 18 |
| ℹ️ Informational | 9 |
| **Total** | **42** |

All High-severity detectors returned zero findings across the in-scope contracts.  
Medium and Low findings are documented below. The majority are well-known patterns in DeFi arithmetic (precision ordering) and timestamp usage, which are being reviewed in the concurrent Trail of Bits engagement.

---

## VaultEngine.sol

*Core CDP engine — collateral deposits, USDAX minting, interest accrual, liquidation.*

### Medium

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| M-01 | `divide-before-multiply` | `liquidate()` L416, L422, L431 | Integer division before multiplication in collateral/debt calculations. Precision loss possible in edge amounts. |
| M-02 | `divide-before-multiply` | `_adjustedCollateralValue()` L618 | USD value computed via division then multiplied by LTV ratio. |
| M-03 | `divide-before-multiply` | `_maxMintable()` L636 | Same pattern as M-02 in max-mint path. |
| M-04 | `incorrect-equality` | `currentDebt()` L262, L264, L266 | Strict equality checks on `principal`, `last`, `elapsed`. Benign guards but Slither flags exact-zero comparisons. |
| M-05 | `incorrect-equality` | `drip()` L238–239 | Strict equality on `last == 0` and compound condition. |
| M-06 | `incorrect-equality` | `_healthFactor()` L600 | `userDebt == 0` — used as a short-circuit guard before division. |
| M-07 | `reentrancy-no-eth` | `mintUsdax()` L323 | State (`debt[user]`) written after external call to `drip()` → `usdax.mint()`. No ETH involved; all calls to trusted contracts. Under review. |
| M-08 | `reentrancy-no-eth` | `repayUsdax()` L344 | Same pattern as M-07. |

### Low

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| L-01 | `calls-loop` | `_safePrice()` L586 | External oracle call inside a loop (reachable via `withdrawCollateral`). Loop bounded by number of collateral tokens. |
| L-02 | `reentrancy-benign` | `liquidate()` L404 | State written after external call; no value extracted — benign by Slither's own classification. |
| L-03 | `reentrancy-events` | `drip()` L249–250 | Event emitted after external mint call. No state inconsistency. |
| L-04 | `timestamp` | `drip()`, `currentDebt()`, `mintUsdax()`, `repayUsdax()`, `liquidate()`, `withdrawCollateral()`, `_healthFactor()`, `_safePrice()` | `block.timestamp` used for interest accrual and staleness checks. Standard DeFi pattern; miners cannot manipulate timestamp by more than ~15s. |

---

## USDAxSavings.sol

*Savings module — principal deposits, time-weighted yield, reward distribution.*

### Medium

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| M-09 | `incorrect-equality` | `claimRewards()` L208 | `reward == 0` strict equality used as early-exit guard. |
| M-10 | `incorrect-equality` | `claimRewards()` L212 | `toPay == 0` strict equality. |

### Low

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| L-05 | `shadowing-local` | `constructor()` L126 | Parameter `_owner` shadows `Ownable._owner` state variable. Rename to `owner_` or `initialOwner`. |
| L-06 | `timestamp` | `withdraw()` L188 | `block.timestamp` used in principal comparison (guards against partial withdrawals only). |
| L-07 | `timestamp` | `claimRewards()` L208–224 | Timestamp used to compute elapsed rewards. Standard pattern. |

---

## ChainlinkPriceOracle.sol

*Oracle wrapper — Chainlink primary feed, manual fallback, staleness checks.*

### Medium

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| M-11 | `unused-return` | `_tryChainlink()` L285–309 | `latestRoundData()` return values `roundId` and `answeredInRound` are captured but `answeredInRound` is not used to validate round completeness. Should check `answeredInRound >= roundId`. |

### Low

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| L-08 | `missing-zero-check` | `setUpdater()` L130–132 | `newUpdater` address not checked against `address(0)`. Zero updater would brick manual fallback. |
| L-09 | `timestamp` | `getPrice()` L219, L229 | `block.timestamp` used for Chainlink staleness (`maxStaleness`) and fallback staleness (24 h). Intentional design. |

---

## APXStaking.sol

*APX token staking — cooldown period, reward accrual.*

### Low

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| L-10 | `shadowing-local` | `constructor()` L85 | Parameter `_owner` shadows `Ownable._owner`. Same pattern as L-05. |
| L-11 | `timestamp` | `stake()` L138–158 | Cooldown active check via `block.timestamp`. |
| L-12 | `timestamp` | `startCooldown()` L162–178 | Cooldown start recorded via `block.timestamp`. |
| L-13 | `timestamp` | `unstake()` L181–192 | Cooldown expiry check via `block.timestamp`. |

### Informational

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| I-01 | `naming-convention` | `setRewardRate()` | Parameter `_apxPerYear` does not follow mixedCase convention. |

---

## CollateralManager.sol

*Collateral registry — token whitelist, LTV/liquidation config.*

### Informational

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| I-02 | `pragma` | Contract-level | Mixed `^0.8.20` (OpenZeppelin) and `^0.8.24` (project). OZ dependency version; not controllable without forking OZ. |

---

## USDAxToken.sol

*ERC-20 USDAX stablecoin — mint/burn roles.*

### Informational

| # | Detector | Location | Description |
|---|----------|----------|-------------|
| I-03 | `pragma` | Contract-level | Same mixed-version note as I-02 above. |

---

## Acknowledged / False Positives

| Finding | Reason |
|---------|--------|
| `divide-before-multiply` in OZ `Math.mulDiv()` | Known false positive — `mulDiv` uses this pattern intentionally for 512-bit precision multiplication. Not a bug. |
| `incorrect-exp` in OZ `Math.mulDiv()` | `^` is bitwise XOR used deliberately in Newton-Raphson inverse computation. Slither misidentifies it as exponentiation. Well-known false positive in OZ. |
| `reentrancy-benign` (classified as benign by Slither itself) | No value extracted; external calls are to protocol-owned contracts only. |

---

## Remediation Priorities

| Priority | Finding(s) | Action |
|----------|-----------|--------|
| **Investigate** | M-01, M-02, M-03 — divide-before-multiply | Verify precision loss is within acceptable bounds for minimum debt/collateral amounts. Consider scaling order. |
| **Fix** | M-11 — unused `answeredInRound` | Add `require(answeredInRound >= roundId)` in `_tryChainlink()`. |
| **Fix** | L-08 — missing zero-check | Add `require(newUpdater != address(0))` to `setUpdater()`. |
| **Fix** | L-05, L-10 — shadowing-local | Rename constructor parameters from `_owner` to `initialOwner_`. |
| **Review** | M-07, M-08 — reentrancy-no-eth | Confirm CEI (Checks-Effects-Interactions) ordering or add `nonReentrant` guard. |
| **Accepted** | Timestamp usage (L-04, L-06, L-07, L-09, L-11–L-13) | Standard DeFi pattern; ~15s miner manipulation window is within acceptable protocol tolerance. |

---

## Notes

- All High-severity detectors (reentrancy with ETH transfer, arbitrary `send`, suicidal contracts, controlled delegatecall, etc.) returned **zero findings**.
- Findings in OpenZeppelin v5 dependencies (`Math.mulDiv`, `Bytes.sol`, `ERC20Permit`) are **acknowledged false positives** consistent with the well-known Slither behaviour on OZ v5.
- This automated report is a complement to, not a replacement for, the manual audit currently in progress with Trail of Bits.

---

*Slither is an open-source static analysis framework developed by Trail of Bits. Source: https://github.com/crytic/slither*
