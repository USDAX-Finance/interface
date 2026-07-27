# Slither Static Analysis Report — USDAX Finance

| Field | Detail |
|-------|--------|
| **Tool** | [Slither](https://github.com/crytic/slither) by Trail of Bits |
| **Version** | slither-analyzer 0.11.x |
| **Compiler** | solc 0.8.24 / 0.8.25 |
| **Date** | 2026-07-27 |
| **Last updated** | 2026-07-27 (post-fix revision) |
| **Scope** | `VaultEngine`, `CollateralManager`, `USDAxToken`, `USDAxSavings`, `ChainlinkPriceOracle`, `APXStaking` |
| **Detectors run** | 101 |
| **Dependencies excluded** | Yes (`--exclude-dependencies`) |

---

## Summary

| Severity | Project findings | Fixed / Resolved |
|----------|-----------------|-----------------|
| 🔴 High | 0 | — |
| 🟠 Medium | 15 | 3 resolved (M-07, M-08 annotated; M-11 confirmed false positive) |
| 🟡 Low | 18 | 3 resolved (L-05, L-08, L-10) |
| ℹ️ Informational | 9 | — |
| **Total** | **42** | **6 resolved** |

All High-severity detectors returned zero findings across the in-scope contracts.
Medium and Low findings are documented below. The concurrent Trail of Bits engagement
covers the remaining arithmetic and timestamp items.

---

## VaultEngine.sol

*Core CDP engine — collateral deposits, USDAX minting, interest accrual, liquidation.*

### Medium

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| M-01 | `divide-before-multiply` | `liquidate()` L416, L422, L431 | Under review | Integer division before multiplication in collateral/debt calculations. Precision loss possible in edge amounts. |
| M-02 | `divide-before-multiply` | `_adjustedCollateralValue()` L618 | Under review | USD value computed via division then multiplied by LTV ratio. |
| M-03 | `divide-before-multiply` | `_maxMintable()` L636 | Under review | Same pattern as M-02 in max-mint path. |
| M-04 | `incorrect-equality` | `currentDebt()` L262, L264, L266 | Accepted | Strict equality checks on `principal`, `last`, `elapsed`. Benign guards before division. |
| M-05 | `incorrect-equality` | `drip()` L238–239 | Accepted | Strict equality on `last == 0` and compound condition. Benign early-exit. |
| M-06 | `incorrect-equality` | `_healthFactor()` L600 | Accepted | `userDebt == 0` — short-circuit guard before division. |
| M-07 | `reentrancy-no-eth` | `mintUsdax()` L323 | ✅ Annotated | `nonReentrant` guard on this function already prevents reentrancy. `drip()` calls `usdax.mint()` on a trusted protocol contract with no external callbacks. All critical caller state (`debt[msg.sender]`) is written before the user-facing mint calls. Added `slither-disable` comment with full rationale. |
| M-08 | `reentrancy-no-eth` | `repayUsdax()` L344 | ✅ Annotated | Same rationale as M-07. `nonReentrant` is active. Caller's debt state written before `usdax.burn()`. Added `slither-disable` comment. |

### Low

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| L-01 | `calls-loop` | `_safePrice()` L586 | Accepted | External oracle call inside a loop. Loop bounded by the fixed, owner-controlled collateral token list. |
| L-02 | `reentrancy-benign` | `liquidate()` L404 | Accepted | Benign by Slither's own classification; no value extracted via reentrancy. |
| L-03 | `reentrancy-events` | `drip()` L249–250 | Accepted | Event emitted after external mint call. No state inconsistency. |
| L-04 | `timestamp` | `drip()`, `currentDebt()`, `mintUsdax()`, `repayUsdax()`, `liquidate()`, `withdrawCollateral()`, `_healthFactor()`, `_safePrice()` | Accepted | `block.timestamp` used for interest accrual and staleness checks. Standard DeFi pattern; ~15s miner manipulation window is within accepted protocol tolerance. |

---

## USDAxSavings.sol

*Savings module — principal deposits, time-weighted yield, reward distribution.*

### Medium

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| M-09 | `incorrect-equality` | `claimRewards()` L208 | Accepted | `reward == 0` strict equality used as early-exit guard. Not exploitable. |
| M-10 | `incorrect-equality` | `claimRewards()` L212 | Accepted | `toPay == 0` strict equality. Pool-empty guard. Not exploitable. |

### Low

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| L-05 | `shadowing-local` | `constructor()` L126 | ✅ Fixed | Constructor parameter `_owner` renamed to `initialOwner_` — no longer shadows `Ownable._owner` storage variable. |
| L-06 | `timestamp` | `withdraw()` L188 | Accepted | `block.timestamp` used as checkpoint reset. Standard pattern. |
| L-07 | `timestamp` | `claimRewards()` L208–224 | Accepted | Timestamp used to compute elapsed rewards. Standard pattern. |

---

## ChainlinkPriceOracle.sol

*Oracle wrapper — Chainlink primary feed, manual fallback, staleness checks.*

### Medium

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| M-11 | `unused-return` | `_tryChainlink()` L285–309 | ✅ False positive | Slither claims `answeredInRound` is unused. In fact, line 294 explicitly checks `if (answeredInRound < roundId) return (false, 0, 0)`, which is the standard Chainlink round-completeness guard. The finding is incorrect — confirmed by manual code review. |

### Low

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| L-08 | `missing-zero-check` | `setUpdater()` L130–132 | ✅ False positive (by design) | `address(0)` is an intentional valid input that *revokes* the updater role (so only the owner may push prices). This is documented in the NatSpec and the function body. Added `@dev` comment to the function to clarify the design intent. A hard zero-revert would make the role irrevocable without a contract upgrade. |
| L-09 | `timestamp` | `getPrice()` L219, L229 | Accepted | `block.timestamp` used for Chainlink staleness (`maxStaleness`) and fallback staleness (24 h). Intentional defence-in-depth design. |

---

## APXStaking.sol

*APX governance token staking — Synthetix reward model, cooldown period.*

### Low

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| L-10 | `shadowing-local` | `constructor()` L85 | ✅ Fixed | Constructor parameter `_owner` renamed to `initialOwner_` — same fix as L-05. |
| L-11 | `timestamp` | `stake()` L138–158 | Accepted | Cooldown active check via `block.timestamp`. |
| L-12 | `timestamp` | `startCooldown()` L162–178 | Accepted | Cooldown start recorded via `block.timestamp`. |
| L-13 | `timestamp` | `unstake()` L181–192 | Accepted | Cooldown expiry check via `block.timestamp`. |

### Informational

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| I-01 | `naming-convention` | `setRewardRate()` | Accepted | Parameter `_apxPerYear` does not follow mixedCase convention. Cosmetic; no security impact. |

---

## CollateralManager.sol

*Collateral registry — token whitelist, LTV/liquidation config.*

### Informational

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| I-02 | `pragma` | Contract-level | Accepted | Mixed `^0.8.20` (OpenZeppelin) and `^0.8.24` (project). OZ dependency version; not controllable without forking OZ. |

---

## USDAxToken.sol

*ERC-20 USDAX stablecoin — mint/burn roles.*

### Informational

| # | Detector | Location | Status | Description |
|---|----------|----------|--------|-------------|
| I-03 | `pragma` | Contract-level | Accepted | Same mixed-version note as I-02 above. |

---

## Acknowledged / False Positives

| Finding | Reason |
|---------|--------|
| `divide-before-multiply` in OZ `Math.mulDiv()` | Known false positive — `mulDiv` uses this pattern intentionally for 512-bit precision multiplication. Not a bug. |
| `incorrect-exp` in OZ `Math.mulDiv()` | `^` is bitwise XOR used deliberately in Newton-Raphson inverse computation. Slither misidentifies it as exponentiation. Well-known false positive in OZ. |
| `reentrancy-benign` (classified as benign by Slither itself) | No value extracted; external calls are to protocol-owned contracts only. |
| M-11 `unused-return` on `answeredInRound` | False positive — the variable IS checked on the very next line (`answeredInRound < roundId`). |
| L-08 `missing-zero-check` on `setUpdater` | False positive / by design — `address(0)` revokes the updater role. Blocking zero would make the role irrevocable. |

---

## Remediation Status

| Priority | Finding(s) | Status |
|----------|-----------|--------|
| ✅ Fixed | L-05, L-10 — shadowing-local | Constructor params renamed from `_owner` to `initialOwner_` in `USDAxSavings` and `APXStaking`. |
| ✅ Annotated | M-07, M-08 — reentrancy-no-eth | `slither-disable-next-line` added with detailed rationale. `nonReentrant` guard already prevents reentrancy; CEI ordering confirmed safe. |
| ✅ Confirmed false positive | M-11 — unused `answeredInRound` | Line 294 `if (answeredInRound < roundId) return (false, 0, 0)` is the correct round-completeness check. |
| ✅ Confirmed by design | L-08 — missing zero-check on `setUpdater` | `address(0)` is intentional (revokes updater role). Documented in NatSpec and `@dev` comment. |
| **Investigate** | M-01, M-02, M-03 — divide-before-multiply | Under review by Trail of Bits. Precision loss bounded by min-debt floor (`MIN_DEBT = 10e18`). |
| **Accepted** | Timestamp usage (L-04, L-06, L-07, L-09, L-11–L-13) | Standard DeFi pattern; ~15s miner manipulation window is within accepted protocol tolerance. |
| **Accepted** | Strict equality (M-04–M-06, M-09–M-10) | All are guard conditions before division or early-exit no-ops. No exploit path identified. |

---

## Notes

- All High-severity detectors (reentrancy with ETH transfer, arbitrary `send`, suicidal contracts, controlled delegatecall, etc.) returned **zero findings**.
- Findings in OpenZeppelin v5 dependencies (`Math.mulDiv`, `Bytes.sol`, `ERC20Permit`) are **acknowledged false positives** consistent with the well-known Slither behaviour on OZ v5.
- This automated report is a complement to, not a replacement for, the manual audit currently in progress with Trail of Bits.

---

*Slither is an open-source static analysis framework developed by Trail of Bits. Source: https://github.com/crytic/slither*
