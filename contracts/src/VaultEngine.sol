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

/// @title VaultEngine v1.3 — Stability Fee + Debt Ceiling + Emergency Pause
/// @notice Core CDP engine for USDAX protocol.
///
/// @dev v1.3 additions over v1.2:
///   - debtCeiling: global cap on total USDAX mintable through this engine.
///       0 = uncapped (default). Set via setDebtCeiling(). Checked in mintUsdax.
///   - Emergency pause (OpenZeppelin Pausable):
///       pause()   — owner only. Blocks depositCollateral, mintUsdax, liquidate.
///       unpause() — owner only. Restores normal operation.
///       repayUsdax + withdrawCollateral intentionally stay UNPAUSED so users
///       can always exit their vault regardless of protocol state.
contract VaultEngine is ReentrancyGuard, Pausable, Ownable {
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
    uint256 public stabilityFeePerYear;

    /// @notice Timestamp of last interest settlement per vault.
    mapping(address => uint256) public lastDripTime;

    // ─── Debt Ceiling ─────────────────────────────────────────────────────────
    /// @notice Maximum USDAX (18-decimal) that may be outstanding through this engine.
    ///         0 = no ceiling. Compared against usdax.totalSupply() at mint time.
    uint256 public debtCeiling;

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
    event DebtCeilingUpdated(uint256 oldCeiling, uint256 newCeiling);

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
        // debtCeiling defaults to 0 (uncapped); set via setDebtCeiling()
    }

    // ─── Stability fee: drip ──────────────────────────────────────────────────

    /// @notice Settle accrued interest for a vault.
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

    /// @notice View-only: current debt including pending (undripped) interest.
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

    /// @notice Deposit whitelisted collateral into your vault.
    ///         Blocked when protocol is paused.
    function depositCollateral(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(collateralManager.isEnabled(token), "token not whitelisted");
        require(amount > 0, "amount zero");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        collateralDeposits[msg.sender][token] += amount;

        _registerOwner(msg.sender);
        emit CollateralDeposited(msg.sender, token, amount);
    }

    /// @notice Mint USDAX against deposited collateral.
    ///         Blocked when protocol is paused.
    ///         Reverts if minting would exceed the debt ceiling.
    /// @param amount Amount of USDAX to mint (before fee)
    function mintUsdax(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_DEBT, "below min debt");

        // Debt ceiling check: total supply after mint must not exceed ceiling
        // debtCeiling == 0 means uncapped
        if (debtCeiling > 0) {
            require(
                usdax.totalSupply() + amount <= debtCeiling,
                "debt ceiling reached"
            );
        }

        // Settle any accrued interest first so LTV check uses true debt
        drip(msg.sender);

        uint256 fee     = (amount * MINT_FEE_BPS) / BASIS_POINTS;
        uint256 newDebt = debt[msg.sender] + amount;
        debt[msg.sender] = newDebt;

        require(_maxMintable(msg.sender) >= newDebt, "exceeds max LTV");

        usdax.mint(msg.sender, amount - fee);
        if (fee > 0) usdax.mint(feeRecipient, fee);

        emit USDAxMinted(msg.sender, amount, fee);
    }

    /// @notice Repay USDAX debt. Intentionally NOT paused — users must always be
    ///         able to reduce or clear their debt.
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

    /// @notice Withdraw collateral. Intentionally NOT paused — users must always
    ///         be able to reclaim collateral after repaying.
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

    /// @notice Liquidate an undercollateralized vault.
    ///         Blocked when protocol is paused (new liquidations frozen during shutdown).
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

        (uint256 tokenPrice,) = oracle.getPrice(collToken);
        uint256 collAmount    = (debtToRepay * (10 ** cfg.tokenDecimals)) / tokenPrice;
        uint256 collWithBonus = collAmount + (collAmount * cfg.liquidationBonus / BASIS_POINTS);

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

        debt[vaultOwner]                          -= debtToRepay;
        collateralDeposits[vaultOwner][collToken] -= collWithBonus;

        usdax.burn(msg.sender, debtToRepay);
        IERC20(collToken).safeTransfer(msg.sender, collWithBonus);

        emit Liquidated(msg.sender, vaultOwner, collToken, debtToRepay, collWithBonus);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function healthFactor(address user) external view returns (uint256) {
        return _healthFactor(user);
    }

    function adjustedCollateralValue(address user) external view returns (uint256) {
        return _adjustedCollateralValue(user);
    }

    function rawCollateralValue(address user) external view returns (uint256) {
        return _rawCollateralValue(user);
    }

    function maxMintable(address user) external view returns (uint256) {
        return _maxMintable(user);
    }

    function getVaultOwners() external view returns (address[] memory) {
        return _vaultOwners;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Pause the protocol. Blocks deposit, mint, and liquidate.
    ///         repay and withdraw remain available so users can always exit.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the protocol and resume normal operation.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Set the global debt ceiling (18-decimal USDAX amount).
    ///         0 = no ceiling (uncapped).
    function setDebtCeiling(uint256 ceiling) external onlyOwner {
        uint256 old = debtCeiling;
        debtCeiling = ceiling;
        emit DebtCeilingUpdated(old, ceiling);
    }

    /// @notice Set the annual stability fee in basis points (0–2000 = 0–20% APY).
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

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "zero address");
        address old = address(oracle);
        oracle = IUSDAxOracle(newOracle);
        emit OracleUpdated(old, newOracle);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _healthFactor(address user) internal view returns (uint256) {
        uint256 userDebt = currentDebt(user);
        if (userDebt == 0) return type(uint256).max;
        uint256 adjValue = _adjustedCollateralValue(user);
        return (adjValue * WAD) / userDebt;
    }

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
