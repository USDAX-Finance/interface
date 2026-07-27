// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {USDAxToken} from "./USDAxToken.sol";
import {CollateralManager} from "./CollateralManager.sol";
import {IUSDAxOracle} from "./interfaces/IUSDAxOracle.sol";

/// @title  VaultEngine v1.4
/// @author USDAX Finance
/// @notice Core CDP (Collateralised Debt Position) engine for the USDAX protocol.
///         Users deposit whitelisted collateral tokens to open a vault, then mint
///         USDAX stablecoin up to their maximum loan-to-value (LTV) ratio.
///         Ongoing debt accrues a continuously-compounded stability fee that flows
///         to the fee recipient. Undercollateralised vaults can be liquidated by any
///         address that holds enough USDAX to repay the debt.
///
/// @dev    Architecture overview
///         ─────────────────────
///         • CollateralManager — stores per-token risk params (LTV, liq threshold,
///           liq bonus, decimals). Immutable reference set at construction.
///         • IUSDAxOracle      — price feed. Mutable via setOracle() to allow
///           seamless oracle upgrades. VaultEngine adds its own staleness guard
///           (MAX_ORACLE_STALENESS) as defence-in-depth on top of the oracle's own check.
///         • USDAxToken        — ERC-20 with restricted mint/burn (only this contract).
///           Immutable reference set at construction.
///
///         Emergency pause (OpenZeppelin Pausable)
///         ────────────────────────────────────────
///         pause()   — owner only; blocks depositCollateral, mintUsdax, liquidate.
///         unpause() — owner only; restores normal operation.
///         repayUsdax and withdrawCollateral are intentionally NOT paused so users
///         can always exit their vault regardless of protocol state.
///
///         Debt ceiling
///         ────────────
///         debtCeiling == 0 means uncapped (default). When > 0, mintUsdax checks
///         that usdax.totalSupply() + amount does not exceed the ceiling.
///
///         Stability fee / drip mechanics
///         ───────────────────────────────
///         Interest is computed as simple linear interest (not compound) per second:
///         fee = principal × stabilityFeePerYear × elapsed / (365 days × 10_000)
///         The drip() function settles pending interest into the stored debt and mints
///         fresh USDAX to the fee recipient. Any action that reads or modifies a vault's
///         debt calls drip() first so the LTV check always uses the true current debt.
contract VaultEngine is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Divisor used for all basis-point calculations (10 000 = 100%).
    uint256 public constant BASIS_POINTS = 10_000;

    /// @notice 1 WAD = 1e18. Used as the fixed-point base for health factor values.
    ///         A health factor of exactly 1 WAD means the vault is at the liquidation boundary.
    uint256 public constant WAD = 1e18;

    /// @notice One-time minting fee charged when USDAX is minted (basis points).
    ///         50 bps = 0.5%. Deducted from the amount the borrower receives; the full
    ///         `amount` parameter is recorded as debt so the fee is effectively pre-paid.
    uint256 public constant MINT_FEE_BPS = 50;

    /// @notice Minimum USDAX debt required to open or maintain a vault position.
    ///         Prevents dust vaults that cannot be economically liquidated.
    uint256 public constant MIN_DEBT = 10e18;

    /// @notice Hard cap on the stability fee rate (basis points per year).
    ///         2 000 bps = 20% APY. setStabilityFee() reverts above this value.
    uint256 public constant MAX_STABILITY_FEE = 2_000;

    /// @notice Seconds per year used in linear interest calculations (365 days).
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    /// @notice Maximum acceptable age for oracle prices consumed inside this contract.
    ///         VaultEngine validates `updatedAt` independently of the oracle's own check
    ///         as defence-in-depth: even a swapped oracle without staleness guards is caught.
    ///         2 hours is chosen to tolerate keeper downtime while bounding price risk.
    uint256 public constant MAX_ORACLE_STALENESS = 2 hours;

    // ─── Immutable dependencies ───────────────────────────────────────────────

    /// @notice The USDAX stablecoin token. Only this contract may mint or burn.
    USDAxToken public immutable usdax;

    /// @notice Registry of whitelisted collateral tokens and their risk parameters.
    CollateralManager public immutable collateralManager;

    // ─── Mutable state ────────────────────────────────────────────────────────

    /// @notice Active price oracle. Can be replaced via setOracle() to upgrade feeds.
    IUSDAxOracle public oracle;

    /// @notice Address that receives minting fees and accrued stability fees.
    address public feeRecipient;

    /// @notice Annual stability fee rate in basis points (e.g. 500 = 5% APY).
    ///         Applied continuously to outstanding vault debt. 0 = no fee.
    uint256 public stabilityFeePerYear;

    /// @notice Timestamp of the last drip() settlement for each vault owner.
    ///         0 = vault has never had debt; first mint sets this to block.timestamp.
    mapping(address => uint256) public lastDripTime;

    /// @notice Maximum USDAX (18 decimals) that may be outstanding through this engine.
    ///         Compared against usdax.totalSupply() at mint time. 0 = no ceiling.
    uint256 public debtCeiling;

    /// @notice Amount of each collateral token held in each user's vault.
    ///         collateralDeposits[vaultOwner][collateralToken] = raw token amount.
    mapping(address => mapping(address => uint256)) public collateralDeposits;

    /// @notice Recorded principal debt for each vault owner (18 decimals, denominated in USDAX).
    ///         This is the *stored* debt last written by drip(). Pending (undripped) interest
    ///         is not included — use currentDebt() for the live value.
    mapping(address => uint256) public debt;

    /// @notice Ordered list of every address that has ever opened a vault.
    ///         Used by the keeper to enumerate vaults for liquidation scanning.
    address[] private _vaultOwners;

    /// @notice True if an address has ever deposited collateral (vault registered).
    mapping(address => bool) private _hasVault;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a user deposits collateral into their vault.
    /// @param user   The vault owner.
    /// @param token  The collateral ERC-20 token address.
    /// @param amount Raw token amount deposited (token's native decimals).
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a user withdraws collateral from their vault.
    /// @param user   The vault owner.
    /// @param token  The collateral ERC-20 token address.
    /// @param amount Raw token amount withdrawn (token's native decimals).
    event CollateralWithdrawn(address indexed user, address indexed token, uint256 amount);

    /// @notice Emitted when a user mints USDAX against their collateral.
    /// @param user   The vault owner and USDAX recipient.
    /// @param amount USDAX minted and recorded as debt (before fee deduction from received amount).
    /// @param fee    One-time mint fee (USDAX) sent to feeRecipient.
    event USDAxMinted(address indexed user, uint256 amount, uint256 fee);

    /// @notice Emitted when a user repays USDAX debt.
    /// @param user   The vault owner.
    /// @param amount USDAX repaid and burned (capped at outstanding debt).
    event USDAxRepaid(address indexed user, uint256 amount);

    /// @notice Emitted when a vault is liquidated.
    /// @param liquidator      Address that triggered the liquidation and received collateral.
    /// @param vaultOwner      Address of the under-collateralised vault.
    /// @param collateralToken The collateral token seized.
    /// @param debtRepaid      USDAX burned by the liquidator.
    /// @param collateralSeized Raw token amount transferred to the liquidator (principal + bonus).
    event Liquidated(
        address indexed liquidator,
        address indexed vaultOwner,
        address indexed collateralToken,
        uint256 debtRepaid,
        uint256 collateralSeized
    );

    /// @notice Emitted when the fee recipient address is updated.
    /// @param newRecipient New fee recipient address.
    event FeeRecipientUpdated(address indexed newRecipient);

    /// @notice Emitted when the active price oracle is replaced.
    /// @param oldOracle Previous oracle address.
    /// @param newOracle Replacement oracle address.
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    /// @notice Emitted when the annual stability fee rate is changed.
    /// @param oldFeeBps Previous rate in basis points.
    /// @param newFeeBps New rate in basis points.
    event StabilityFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    /// @notice Emitted each time drip() settles pending interest for a vault.
    /// @param user    The vault owner whose debt was increased.
    /// @param fee     USDAX minted as interest and sent to feeRecipient.
    /// @param newDebt Updated total principal debt after fee accrual.
    event InterestAccrued(address indexed user, uint256 fee, uint256 newDebt);

    /// @notice Emitted when the global debt ceiling is updated.
    /// @param oldCeiling Previous ceiling (0 = uncapped).
    /// @param newCeiling New ceiling (0 = uncapped).
    event DebtCeilingUpdated(uint256 oldCeiling, uint256 newCeiling);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @notice Deploy the VaultEngine.
    /// @param usdax_               Address of the USDAxToken contract. This contract must
    ///                             subsequently be registered as its vault engine via
    ///                             USDAxToken.updateVaultEngine(address(this)).
    /// @param collateralManager_   Address of the CollateralManager that lists whitelisted
    ///                             collateral tokens and their risk parameters.
    /// @param oracle_              Address of the initial IUSDAxOracle implementation.
    /// @param feeRecipient_        Address to receive minting fees and stability-fee interest.
    /// @param owner_               Initial contract owner (receives Ownable access control).
    /// @param stabilityFeePerYear_ Annual stability fee in basis points (0–2000, e.g. 500 = 5%).
    constructor(
        address usdax_,
        address collateralManager_,
        address oracle_,
        address feeRecipient_,
        address owner_,
        uint256 stabilityFeePerYear_
    ) Ownable(owner_) {
        usdax             = USDAxToken(usdax_);
        collateralManager = CollateralManager(collateralManager_);
        oracle            = IUSDAxOracle(oracle_);
        feeRecipient      = feeRecipient_;
        require(stabilityFeePerYear_ <= MAX_STABILITY_FEE, "fee too high");
        stabilityFeePerYear = stabilityFeePerYear_;
        // debtCeiling defaults to 0 (uncapped); set via setDebtCeiling()
    }

    // ─── Stability fee: drip ──────────────────────────────────────────────────

    /// @notice Settle accrued stability-fee interest for a vault.
    ///         Computes linear interest since the last settlement, increases the vault's
    ///         recorded debt, mints the fee amount to feeRecipient, and updates
    ///         lastDripTime to block.timestamp.
    ///
    ///         Called automatically by every state-mutating vault action. Safe to call
    ///         externally (e.g. by keepers) to keep debt records up to date.
    ///
    /// @param user The vault owner whose interest should be settled.
    function drip(address user) public {
        uint256 principal = debt[user];
        uint256 last      = lastDripTime[user];
        uint256 now_      = block.timestamp;

        if (last == 0) { lastDripTime[user] = now_; return; }
        if (principal == 0 || stabilityFeePerYear == 0 || now_ <= last) {
            lastDripTime[user] = now_; return;
        }

        uint256 elapsed = now_ - last;
        uint256 fee = (principal * stabilityFeePerYear * elapsed) /
                      (SECONDS_PER_YEAR * BASIS_POINTS);

        if (fee > 0) {
            debt[user] += fee;
            usdax.mint(feeRecipient, fee);
            emit InterestAccrued(user, fee, debt[user]);
        }
        lastDripTime[user] = now_;
    }

    /// @notice Current total debt for a vault, including interest not yet dripped.
    /// @dev    Pure view — does not write state. To persist the interest on-chain, call drip().
    ///         Result may differ from `debt[user]` by the pending stability fee.
    /// @param  user   The vault owner.
    /// @return Total outstanding USDAX debt (18 decimals) including accrued but undripped interest.
    function currentDebt(address user) public view returns (uint256) {
        uint256 principal = debt[user];
        if (principal == 0 || stabilityFeePerYear == 0) return principal;
        uint256 last = lastDripTime[user];
        if (last == 0) return principal;
        uint256 elapsed = block.timestamp > last ? block.timestamp - last : 0;
        if (elapsed == 0) return principal;
        uint256 pendingInterest = (principal * stabilityFeePerYear * elapsed) /
                                  (SECONDS_PER_YEAR * BASIS_POINTS);
        return principal + pendingInterest;
    }

    /// @notice Stability-fee interest accrued for a vault since the last drip.
    /// @dev    Equivalent to currentDebt(user) - debt[user]. Returns 0 if fee is zero or
    ///         no time has elapsed since last settlement.
    /// @param  user   The vault owner.
    /// @return Undripped interest (18 decimals, USDAX).
    function pendingFee(address user) external view returns (uint256) {
        uint256 d = currentDebt(user);
        return d > debt[user] ? d - debt[user] : 0;
    }

    // ─── User Actions ─────────────────────────────────────────────────────────

    /// @notice Deposit whitelisted collateral into the caller's vault.
    ///         The token must be enabled in CollateralManager.
    ///         Blocked when the protocol is paused.
    /// @param token  ERC-20 address of the collateral token to deposit. Must be whitelisted.
    /// @param amount Raw token amount to transfer (token's native decimals). Must be > 0.
    function depositCollateral(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(collateralManager.isEnabled(token), "token not whitelisted");
        require(amount > 0, "amount zero");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        collateralDeposits[msg.sender][token] += amount;

        _registerOwner(msg.sender);
        emit CollateralDeposited(msg.sender, token, amount);
    }

    /// @notice Mint USDAX against the caller's deposited collateral.
    ///         Blocked when the protocol is paused.
    ///
    ///         Fee mechanics: `amount` is recorded as new debt. The caller receives
    ///         `amount - fee` USDAX; `fee` (0.5% of `amount`) is minted to feeRecipient.
    ///         The debt ceiling (if set) is checked against total supply before minting.
    ///         Pending stability-fee interest is settled first so the LTV check is exact.
    ///
    /// @param amount USDAX to record as new debt (18 decimals). Must be ≥ MIN_DEBT.
    ///               Caller receives `amount - mintFee`; the full `amount` enters debt.
    function mintUsdax(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_DEBT, "below min debt");

        // Debt ceiling check: total supply after mint must not exceed ceiling.
        // debtCeiling == 0 means uncapped.
        if (debtCeiling > 0) {
            require(
                usdax.totalSupply() + amount <= debtCeiling,
                "debt ceiling reached"
            );
        }

        // Settle any accrued interest first so the LTV check uses true debt.
        drip(msg.sender);

        uint256 fee     = (amount * MINT_FEE_BPS) / BASIS_POINTS;
        uint256 newDebt = debt[msg.sender] + amount;
        debt[msg.sender] = newDebt;

        require(_maxMintable(msg.sender) >= newDebt, "exceeds max LTV");

        usdax.mint(msg.sender, amount - fee);
        if (fee > 0) usdax.mint(feeRecipient, fee);

        emit USDAxMinted(msg.sender, amount, fee);
    }

    /// @notice Repay USDAX debt for the caller's vault.
    ///         Intentionally NOT paused — users must always be able to reduce or clear
    ///         their debt regardless of protocol state.
    ///         If `amount` exceeds outstanding debt the repayment is capped at the debt.
    /// @param amount USDAX to burn (18 decimals). Capped at currentDebt(caller). Must be > 0.
    function repayUsdax(uint256 amount) external nonReentrant {
        require(amount > 0, "amount zero");
        drip(msg.sender);

        uint256 owed = debt[msg.sender];
        require(owed > 0, "no debt");

        uint256 repay = amount > owed ? owed : amount;
        debt[msg.sender] = owed - repay;
        usdax.burn(msg.sender, repay);

        emit USDAxRepaid(msg.sender, repay);
    }

    /// @notice Withdraw collateral from the caller's vault.
    ///         Intentionally NOT paused — users must always be able to reclaim collateral
    ///         after repaying debt.
    ///         If the caller still has outstanding debt, the post-withdrawal health factor
    ///         must remain ≥ 1.05 (a 5% buffer above the liquidation threshold).
    /// @param token  ERC-20 address of the collateral token to withdraw.
    /// @param amount Raw token amount to withdraw (token's native decimals). Must be > 0.
    function withdrawCollateral(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount zero");
        require(collateralDeposits[msg.sender][token] >= amount, "insufficient collateral");

        drip(msg.sender);
        collateralDeposits[msg.sender][token] -= amount;

        if (debt[msg.sender] > 0) {
            require(_healthFactor(msg.sender) >= (WAD * 105) / 100, "would be near liquidation");
        }

        IERC20(token).safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, token, amount);
    }

    // ─── Liquidation ──────────────────────────────────────────────────────────

    /// @notice Liquidate an undercollateralised vault.
    ///         The caller burns `debtToRepay` USDAX and receives the equivalent value of
    ///         `collToken` plus a liquidation bonus. Blocked when the protocol is paused.
    ///
    ///         Dust-vault edge case: if available collateral is so small that the fixed-point
    ///         division rounds the repayable debt to zero, the engine seizes all remaining
    ///         collateral for a nominal 1-wei debt repayment, ensuring dust positions can
    ///         always be cleared and never become permanent bad debt.
    ///
    ///         Partial liquidation: if `collWithBonus` exceeds available collateral the engine
    ///         automatically caps `debtToRepay` to the maximum supportable by the available
    ///         collateral.
    ///
    /// @param vaultOwner  Address of the vault to liquidate. Must not equal msg.sender.
    /// @param debtToRepay USDAX (18 decimals) the liquidator wants to repay. Capped internally
    ///                    if it exceeds available collateral capacity.
    /// @param collToken   Collateral token address to seize in exchange for the repaid debt.
    function liquidate(
        address vaultOwner,
        uint256 debtToRepay,
        address collToken
    ) external nonReentrant whenNotPaused {
        require(vaultOwner != msg.sender, "cannot self-liquidate");

        drip(vaultOwner);

        require(debt[vaultOwner] > 0, "no debt");
        require(_healthFactor(vaultOwner) < WAD, "vault is healthy");

        uint256 userDebt = debt[vaultOwner];
        require(debtToRepay > 0 && debtToRepay <= userDebt, "invalid debtToRepay");

        CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(collToken);
        require(cfg.enabled, "collateral not whitelisted");

        uint256 tokenPrice    = _safePrice(collToken);
        uint256 collAmount    = (debtToRepay * (10 ** cfg.tokenDecimals)) / tokenPrice;
        uint256 collWithBonus = collAmount + (collAmount * cfg.liquidationBonus / BASIS_POINTS);

        uint256 available = collateralDeposits[vaultOwner][collToken];
        if (collWithBonus > available) {
            uint256 maxDebt = (available * tokenPrice) / (10 ** cfg.tokenDecimals);
            maxDebt         = (maxDebt * BASIS_POINTS) / (BASIS_POINTS + cfg.liquidationBonus);
            if (maxDebt == 0) {
                // Dust vault: collateral value rounds to 0 in fixed-point division.
                // Seize all remaining collateral for a nominal 1-wei debt repayment so
                // dust positions can always be cleared and never become permanent bad debt.
                debtToRepay   = 1;
                collWithBonus = available;
            } else {
                debtToRepay   = maxDebt;
                collAmount    = (debtToRepay * (10 ** cfg.tokenDecimals)) / tokenPrice;
                collWithBonus = collAmount + (collAmount * cfg.liquidationBonus / BASIS_POINTS);
                if (collWithBonus > available) collWithBonus = available;
            }
        }

        debt[vaultOwner]                          -= debtToRepay;
        collateralDeposits[vaultOwner][collToken] -= collWithBonus;

        usdax.burn(msg.sender, debtToRepay);
        IERC20(collToken).safeTransfer(msg.sender, collWithBonus);

        emit Liquidated(msg.sender, vaultOwner, collToken, debtToRepay, collWithBonus);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /// @notice Health factor for a vault (WAD-scaled).
    ///         healthFactor = adjustedCollateralValue × WAD / currentDebt.
    ///         Values ≥ WAD (1e18) are healthy; < WAD is liquidatable.
    ///         Returns type(uint256).max for zero-debt vaults.
    /// @param  user   The vault owner.
    /// @return Health factor (18 decimals). ≥ 1e18 = healthy, < 1e18 = liquidatable.
    function healthFactor(address user) external view returns (uint256) {
        return _healthFactor(user);
    }

    /// @notice Total USD value of a vault's collateral, weighted by each token's
    ///         liquidation threshold (≤ maxLTV). Used as the numerator in health factor.
    /// @param  user   The vault owner.
    /// @return USD value (18 decimals) after applying liquidation-threshold discounts.
    function adjustedCollateralValue(address user) external view returns (uint256) {
        return _adjustedCollateralValue(user);
    }

    /// @notice Raw USD value of a vault's collateral at current oracle prices,
    ///         without any risk discount applied.
    /// @param  user   The vault owner.
    /// @return USD value (18 decimals) at spot prices, undiscounted.
    function rawCollateralValue(address user) external view returns (uint256) {
        return _rawCollateralValue(user);
    }

    /// @notice Maximum USDAX the caller can mint given current collateral and maxLTV ratios.
    ///         The returned value is the total LTV capacity; subtract currentDebt(user) to
    ///         get the remaining headroom.
    /// @param  user   The vault owner.
    /// @return Maximum USDAX (18 decimals) mintable in total against current collateral.
    function maxMintable(address user) external view returns (uint256) {
        return _maxMintable(user);
    }

    /// @notice Enumeration of all vault owner addresses (including those with zero current debt).
    ///         Used by the keeper to scan all positions for liquidation eligibility.
    /// @return Array of every address that has ever deposited collateral.
    function getVaultOwners() external view returns (address[] memory) {
        return _vaultOwners;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Pause the protocol. Blocks depositCollateral, mintUsdax, and liquidate.
    ///         repayUsdax and withdrawCollateral remain available so users can always exit.
    ///         Only callable by the contract owner.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the protocol, restoring all blocked operations.
    ///         Only callable by the contract owner.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Set the global USDAX debt ceiling.
    ///         Only callable by the contract owner (or timelock on production).
    /// @param ceiling Maximum outstanding USDAX (18 decimals). 0 = no ceiling.
    function setDebtCeiling(uint256 ceiling) external onlyOwner {
        uint256 old = debtCeiling;
        debtCeiling = ceiling;
        emit DebtCeilingUpdated(old, ceiling);
    }

    /// @notice Set the annual stability fee rate.
    ///         Only callable by the contract owner (or timelock on production).
    /// @param feeBps New rate in basis points (0–2 000, i.e. 0–20% APY).
    function setStabilityFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= MAX_STABILITY_FEE, "fee too high (max 20%)");
        uint256 old = stabilityFeePerYear;
        stabilityFeePerYear = feeBps;
        emit StabilityFeeUpdated(old, feeBps);
    }

    /// @notice Update the fee recipient address.
    ///         Only callable by the contract owner (or timelock on production).
    /// @param recipient New address to receive minting fees and stability interest. Must be non-zero.
    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "zero address");
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    /// @notice Replace the active price oracle.
    ///         The new oracle must implement IUSDAxOracle. All subsequent price reads
    ///         will use the new oracle immediately. Emits OracleUpdated.
    ///         Only callable by the contract owner (or timelock on production).
    /// @param newOracle Address of the replacement IUSDAxOracle implementation. Must be non-zero.
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "zero address");
        address old = address(oracle);
        oracle = IUSDAxOracle(newOracle);
        emit OracleUpdated(old, newOracle);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Fetch oracle price for `token` and revert if the price is older than
    ///      MAX_ORACLE_STALENESS (2 hours). This check is independent of any staleness
    ///      guard the oracle contract itself applies (defence-in-depth).
    /// @param  token   Collateral token address.
    /// @return price   USD price of 1 full token (18 decimals).
    function _safePrice(address token) internal view returns (uint256 price) {
        uint256 updatedAt;
        (price, updatedAt) = oracle.getPrice(token);
        require(
            block.timestamp <= updatedAt + MAX_ORACLE_STALENESS,
            "VaultEngine: oracle stale"
        );
    }

    /// @dev Compute the health factor for a vault.
    ///      healthFactor = (_adjustedCollateralValue × WAD) / currentDebt.
    ///      Returns type(uint256).max for vaults with zero debt.
    /// @param  user   The vault owner.
    /// @return Health factor (WAD-scaled). ≥ WAD is healthy; < WAD is liquidatable.
    function _healthFactor(address user) internal view returns (uint256) {
        uint256 userDebt = currentDebt(user);
        if (userDebt == 0) return type(uint256).max;
        uint256 adjValue = _adjustedCollateralValue(user);
        return (adjValue * WAD) / userDebt;
    }

    /// @dev Compute the liquidation-threshold-weighted USD value of all collateral in a vault.
    ///      Iterates all whitelisted tokens; tokens with zero balance are skipped.
    ///      Calls _safePrice() for each non-zero position — reverts on stale oracle.
    /// @param  user   The vault owner.
    /// @return total  Sum of (tokenUsdValue × liquidationThreshold / BASIS_POINTS) across tokens.
    function _adjustedCollateralValue(address user) internal view returns (uint256 total) {
        address[] memory tokens = collateralManager.getCollateralList();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token  = tokens[i];
            uint256 amount = collateralDeposits[user][token];
            if (amount == 0) continue;
            CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(token);
            uint256 price    = _safePrice(token);
            uint256 usdValue = (amount * price) / (10 ** cfg.tokenDecimals);
            total += (usdValue * cfg.liquidationThreshold) / BASIS_POINTS;
        }
    }

    /// @dev Compute the maximum total USDAX mintable against a vault's collateral.
    ///      Iterates all whitelisted tokens and sums (tokenUsdValue × maxLTV / BASIS_POINTS).
    ///      To get remaining headroom, subtract currentDebt(user) from the return value.
    /// @param  user   The vault owner.
    /// @return total  Maximum mintable USDAX (18 decimals) given current deposits and prices.
    function _maxMintable(address user) internal view returns (uint256 total) {
        address[] memory tokens = collateralManager.getCollateralList();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token  = tokens[i];
            uint256 amount = collateralDeposits[user][token];
            if (amount == 0) continue;
            CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(token);
            uint256 price    = _safePrice(token);
            uint256 usdValue = (amount * price) / (10 ** cfg.tokenDecimals);
            total += (usdValue * cfg.maxLTV) / BASIS_POINTS;
        }
    }

    /// @dev Compute the raw (undiscounted) USD value of all collateral in a vault.
    ///      No risk-parameter weighting applied — used for informational display.
    /// @param  user   The vault owner.
    /// @return total  Sum of (tokenAmount × tokenPrice / 10^decimals) across tokens (18 dec).
    function _rawCollateralValue(address user) internal view returns (uint256 total) {
        address[] memory tokens = collateralManager.getCollateralList();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token  = tokens[i];
            uint256 amount = collateralDeposits[user][token];
            if (amount == 0) continue;
            CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(token);
            uint256 price = _safePrice(token);
            total += (amount * price) / (10 ** cfg.tokenDecimals);
        }
    }

    /// @dev Register a new vault owner in the enumeration array on first deposit.
    ///      No-op if the address has already been registered.
    /// @param user Address to register as a vault owner.
    function _registerOwner(address user) internal {
        if (!_hasVault[user]) {
            _hasVault[user] = true;
            _vaultOwners.push(user);
        }
    }
}
