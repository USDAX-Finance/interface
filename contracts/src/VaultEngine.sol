// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {USDAxToken} from "./USDAxToken.sol";
import {CollateralManager} from "./CollateralManager.sol";
import {IUSDAxOracle} from "./interfaces/IUSDAxOracle.sol";

/// @title VaultEngine v1.2 — with Stability Fee
/// @notice Core CDP engine for USDAX protocol.
///         Users deposit collateral, mint USDAX, repay debt, and withdraw.
///         Undercollateralized positions can be liquidated by anyone.
///
/// @dev Stability fee accrues continuously per vault (linear approximation).
///      Call drip(user) before any state-mutating vault operation.
///      currentDebt(user) returns debt including pending fee (no state change).
contract VaultEngine is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant BASIS_POINTS         = 10_000;
    uint256 public constant WAD                  = 1e18;
    uint256 public constant MINT_FEE_BPS         = 50;     // 0.5% one-time minting fee
    uint256 public constant MIN_DEBT             = 10e18;  // min 10 USDAX to open a vault
    uint256 public constant MAX_STABILITY_FEE    = 2_000;  // 20% APY hard cap
    uint256 public constant SECONDS_PER_YEAR     = 365 days;

    // ─── Dependencies ─────────────────────────────────────────────────────────
    USDAxToken         public immutable usdax;
    CollateralManager  public immutable collateralManager;
    IUSDAxOracle       public oracle;   // mutable — can be swapped via setOracle()

    address public feeRecipient;

    // ─── Stability fee ────────────────────────────────────────────────────────
    /// @notice Annual stability fee in basis points (e.g. 500 = 5% APY).
    ///         Accrues continuously on outstanding debt. Minted to feeRecipient.
    uint256 public stabilityFeePerYear;

    /// @notice Timestamp of last interest settlement per vault.
    mapping(address => uint256) public lastDripTime;

    // ─── State ────────────────────────────────────────────────────────────────
    // owner => token => amount deposited
    mapping(address => mapping(address => uint256)) public collateralDeposits;
    // owner => USDAX principal debt (not including pending fee — use currentDebt() for that)
    mapping(address => uint256) public debt;

    // Track all unique vault owners (for enumeration)
    address[] private _vaultOwners;
    mapping(address => bool) private _hasVault;

    // ─── Events ───────────────────────────────────────────────────────────────
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event CollateralWithdrawn(address indexed user, address indexed token, uint256 amount);
    event USDAxMinted(address indexed user, uint256 amount, uint256 fee);
    event USDAxRepaid(address indexed user, uint256 amount);
    event Liquidated(
        address indexed liquidator,
        address indexed vaultOwner,
        address indexed collateralToken,
        uint256 debtRepaid,
        uint256 collateralSeized
    );
    event FeeRecipientUpdated(address indexed newRecipient);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event StabilityFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event InterestAccrued(address indexed user, uint256 fee, uint256 newDebt);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address usdax_,
        address collateralManager_,
        address oracle_,
        address feeRecipient_,
        address owner_,
        uint256 stabilityFeePerYear_  // BPS, e.g. 500 = 5%
    ) Ownable(owner_) {
        usdax              = USDAxToken(usdax_);
        collateralManager  = CollateralManager(collateralManager_);
        oracle             = IUSDAxOracle(oracle_);
        feeRecipient       = feeRecipient_;
        require(stabilityFeePerYear_ <= MAX_STABILITY_FEE, "fee too high");
        stabilityFeePerYear = stabilityFeePerYear_;
    }

    // ─── Stability fee: drip ──────────────────────────────────────────────────

    /// @notice Settle accrued interest for a vault.
    ///         Increases debt[user] by the accrued fee and mints that amount to feeRecipient.
    ///         Called internally before every state-mutating vault operation.
    ///         Safe to call externally (e.g., by bots to keep state current).
    function drip(address user) public {
        uint256 principal = debt[user];
        uint256 last      = lastDripTime[user];
        uint256 now_      = block.timestamp;

        // Initialize timestamp on first call
        if (last == 0) {
            lastDripTime[user] = now_;
            return;
        }

        // Nothing to accrue
        if (principal == 0 || stabilityFeePerYear == 0 || now_ <= last) {
            lastDripTime[user] = now_;
            return;
        }

        uint256 elapsed = now_ - last;
        // Linear approximation: fee = principal * rate * elapsed / year
        // Safe for rates ≤ 20% APY — error vs. compound is negligible over short periods
        uint256 fee = (principal * stabilityFeePerYear * elapsed) /
                      (SECONDS_PER_YEAR * BASIS_POINTS);

        if (fee > 0) {
            debt[user] += fee;
            // Mint fee directly to feeRecipient — this is protocol revenue
            usdax.mint(feeRecipient, fee);
            emit InterestAccrued(user, fee, debt[user]);
        }

        lastDripTime[user] = now_;
    }

    /// @notice View-only: current debt including pending (undripped) interest.
    ///         Use this for UI display and health factor estimates.
    ///         Does NOT update state.
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

    /// @notice View-only: pending interest not yet dripped.
    function pendingFee(address user) external view returns (uint256) {
        uint256 d = currentDebt(user);
        return d > debt[user] ? d - debt[user] : 0;
    }

    // ─── User Actions ─────────────────────────────────────────────────────────

    /// @notice Deposit whitelisted collateral into your vault
    function depositCollateral(address token, uint256 amount) external nonReentrant {
        require(collateralManager.isEnabled(token), "token not whitelisted");
        require(amount > 0, "amount zero");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        collateralDeposits[msg.sender][token] += amount;

        _registerOwner(msg.sender);
        emit CollateralDeposited(msg.sender, token, amount);
    }

    /// @notice Mint USDAX against deposited collateral
    /// @param amount Amount of USDAX to mint (before fee)
    function mintUsdax(uint256 amount) external nonReentrant {
        require(amount >= MIN_DEBT, "below min debt");

        // Settle any accrued interest first so LTV check uses true debt
        drip(msg.sender);

        uint256 fee     = (amount * MINT_FEE_BPS) / BASIS_POINTS;
        uint256 newDebt = debt[msg.sender] + amount;
        debt[msg.sender] = newDebt;

        // Check: new debt must not exceed maxLTV-adjusted collateral value
        require(_maxMintable(msg.sender) >= newDebt, "exceeds max LTV");

        // Mint: user gets (amount - fee), fee goes to feeRecipient
        usdax.mint(msg.sender, amount - fee);
        if (fee > 0) usdax.mint(feeRecipient, fee);

        emit USDAxMinted(msg.sender, amount, fee);
    }

    /// @notice Repay USDAX debt (including any accrued stability fee)
    function repayUsdax(uint256 amount) external nonReentrant {
        require(amount > 0, "amount zero");

        // Settle interest before repayment so user repays true total owed
        drip(msg.sender);

        uint256 owed = debt[msg.sender];
        require(owed > 0, "no debt");

        uint256 repay = amount > owed ? owed : amount;
        debt[msg.sender] = owed - repay;
        usdax.burn(msg.sender, repay);

        emit USDAxRepaid(msg.sender, repay);
    }

    /// @notice Withdraw collateral (only if HF stays safe after withdrawal)
    function withdrawCollateral(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount zero");
        require(collateralDeposits[msg.sender][token] >= amount, "insufficient collateral");

        // Settle interest so health factor check uses true debt
        drip(msg.sender);

        collateralDeposits[msg.sender][token] -= amount;

        // If user has debt, require HF >= 1.05 (5% buffer above liquidation)
        if (debt[msg.sender] > 0) {
            require(_healthFactor(msg.sender) >= (WAD * 105) / 100, "would be near liquidation");
        }

        IERC20(token).safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, token, amount);
    }

    // ─── Liquidation ──────────────────────────────────────────────────────────

    /// @notice Liquidate an undercollateralized vault.
    ///         Liquidator repays `debtToRepay` USDAX and receives collateral + bonus.
    /// @param vaultOwner  Address of the vault to liquidate
    /// @param debtToRepay Amount of USDAX the liquidator repays (≤ full debt)
    /// @param collToken   Which collateral token to seize
    function liquidate(
        address vaultOwner,
        uint256 debtToRepay,
        address collToken
    ) external nonReentrant {
        require(vaultOwner != msg.sender, "cannot self-liquidate");

        // Settle interest on target vault before checking HF — stale debt could miss liquidations
        drip(vaultOwner);

        require(debt[vaultOwner] > 0, "no debt");
        require(_healthFactor(vaultOwner) < WAD, "vault is healthy");

        uint256 userDebt = debt[vaultOwner];
        require(debtToRepay > 0 && debtToRepay <= userDebt, "invalid debtToRepay");

        CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(collToken);
        require(cfg.enabled, "collateral not whitelisted");

        // How much collateral (in token units) equals debtToRepay USD?
        (uint256 tokenPrice,) = oracle.getPrice(collToken);
        uint256 collAmount    = (debtToRepay * (10 ** cfg.tokenDecimals)) / tokenPrice;

        // Apply liquidation bonus
        uint256 collWithBonus = collAmount + (collAmount * cfg.liquidationBonus / BASIS_POINTS);

        // Cap at vault's available collateral; scale down debtToRepay if needed
        uint256 available = collateralDeposits[vaultOwner][collToken];
        if (collWithBonus > available) {
            uint256 maxDebt = (available * tokenPrice) / (10 ** cfg.tokenDecimals);
            maxDebt         = (maxDebt * BASIS_POINTS) / (BASIS_POINTS + cfg.liquidationBonus);
            require(maxDebt > 0, "vault fully drained");
            debtToRepay   = maxDebt;
            collAmount    = (debtToRepay * (10 ** cfg.tokenDecimals)) / tokenPrice;
            collWithBonus = collAmount + (collAmount * cfg.liquidationBonus / BASIS_POINTS);
            if (collWithBonus > available) collWithBonus = available;
        }

        // Update state
        debt[vaultOwner]                          -= debtToRepay;
        collateralDeposits[vaultOwner][collToken] -= collWithBonus;

        // Burn liquidator's USDAX and send them the collateral
        usdax.burn(msg.sender, debtToRepay);
        IERC20(collToken).safeTransfer(msg.sender, collWithBonus);

        emit Liquidated(msg.sender, vaultOwner, collToken, debtToRepay, collWithBonus);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    /// @notice Health factor: WAD = 1.0. Below WAD = liquidatable.
    ///         Uses currentDebt (includes pending interest) for accurate real-time value.
    function healthFactor(address user) external view returns (uint256) {
        return _healthFactor(user);
    }

    /// @notice Total collateral value in USD (18 decimals), adjusted by liqThreshold
    function adjustedCollateralValue(address user) external view returns (uint256) {
        return _adjustedCollateralValue(user);
    }

    /// @notice Raw (unadjusted) collateral value in USD (18 decimals)
    function rawCollateralValue(address user) external view returns (uint256) {
        return _rawCollateralValue(user);
    }

    /// @notice Max USDAX mintable given current collateral (before fee)
    function maxMintable(address user) external view returns (uint256) {
        return _maxMintable(user);
    }

    /// @notice Get all vault owners (for off-chain indexing)
    function getVaultOwners() external view returns (address[] memory) {
        return _vaultOwners;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Set the annual stability fee in basis points (0–2000 = 0–20% APY).
    ///         Takes effect immediately on future drip() calls.
    function setStabilityFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= MAX_STABILITY_FEE, "fee too high (max 20%)");
        uint256 old = stabilityFeePerYear;
        stabilityFeePerYear = feeBps;
        emit StabilityFeeUpdated(old, feeBps);
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "zero address");
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    /// @notice Swap the price oracle (owner only — for oracle upgrades/migrations).
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "zero address");
        address old = address(oracle);
        oracle = IUSDAxOracle(newOracle);
        emit OracleUpdated(old, newOracle);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Uses currentDebt (includes pending fee) so HF stays accurate between drips.
    function _healthFactor(address user) internal view returns (uint256) {
        uint256 userDebt = currentDebt(user);
        if (userDebt == 0) return type(uint256).max;
        uint256 adjValue = _adjustedCollateralValue(user);
        return (adjValue * WAD) / userDebt;
    }

    /// @dev Collateral value weighted by each token's liquidationThreshold
    function _adjustedCollateralValue(address user) internal view returns (uint256 total) {
        address[] memory tokens = collateralManager.getCollateralList();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token  = tokens[i];
            uint256 amount = collateralDeposits[user][token];
            if (amount == 0) continue;

            CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(token);
            (uint256 price,) = oracle.getPrice(token);

            uint256 usdValue = (amount * price) / (10 ** cfg.tokenDecimals);
            total += (usdValue * cfg.liquidationThreshold) / BASIS_POINTS;
        }
    }

    /// @dev Collateral value weighted by each token's maxLTV (for mint check)
    function _maxMintable(address user) internal view returns (uint256 total) {
        address[] memory tokens = collateralManager.getCollateralList();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token  = tokens[i];
            uint256 amount = collateralDeposits[user][token];
            if (amount == 0) continue;

            CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(token);
            (uint256 price,) = oracle.getPrice(token);

            uint256 usdValue = (amount * price) / (10 ** cfg.tokenDecimals);
            total += (usdValue * cfg.maxLTV) / BASIS_POINTS;
        }
    }

    /// @dev Raw USD value with no threshold adjustment
    function _rawCollateralValue(address user) internal view returns (uint256 total) {
        address[] memory tokens = collateralManager.getCollateralList();
        for (uint256 i = 0; i < tokens.length; i++) {
            address token  = tokens[i];
            uint256 amount = collateralDeposits[user][token];
            if (amount == 0) continue;

            CollateralManager.CollateralConfig memory cfg = collateralManager.getConfig(token);
            (uint256 price,) = oracle.getPrice(token);

            total += (amount * price) / (10 ** cfg.tokenDecimals);
        }
    }

    function _registerOwner(address user) internal {
        if (!_hasVault[user]) {
            _hasVault[user] = true;
            _vaultOwners.push(user);
        }
    }
}
