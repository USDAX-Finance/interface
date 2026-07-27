// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title  USDAxSavings
/// @author USDAX Finance
/// @notice USDAX Savings Rate (USR) module.
///         Users deposit USDAX to earn a configurable APY funded from a pre-loaded
///         reward pool (filled by the protocol with stability-fee revenue).
///
///         Design principles
///         ─────────────────
///         • Linear per-second accrual: rewards = principal × apyBps × elapsed / (10_000 × 365d).
///         • No lock-up: principal and accrued rewards can be withdrawn at any time independently.
///         • Non-reverting claims (v1.4): if the reward pool is exhausted, claimRewards() pays
///           whatever is available, stores the shortfall in `accrued`, and emits
///           RewardPoolInsufficient rather than reverting. The shortfall is claimable when the
///           pool is next refunded via addRewards().
///         • Per-user accounting: APY changes affect future accrual only. Outstanding accrued
///           rewards are snapshotted (settled) before any state change via _settle().
///
/// @dev    Reward accounting flow
///         ────────────────────────
///         Each user's Position stores:
///           principal  — USDAX deposited (not including rewards).
///           checkpoint — block.timestamp of the last _settle() call.
///           accrued    — pending rewards snapshotted but not yet transferred.
///
///         On deposit/withdraw/claim → _settle() computes
///           earned = principal × apyBps × (block.timestamp − checkpoint) / (10_000 × 365d)
///         and adds it to `accrued`. Then `checkpoint` is reset to block.timestamp so future
///         accrual starts from zero elapsed time.
contract USDAxSavings is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Divisor for basis-point calculations (10 000 = 100%).
    uint256 public constant BASIS_POINTS = 10_000;

    /// @notice Seconds per year used in linear reward calculations (365 days).
    uint256 public constant YEAR = 365 days;

    // ─── Immutable ────────────────────────────────────────────────────────────

    /// @notice USDAX token deposited by users and paid out as rewards.
    IERC20 public immutable usdax;

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Current savings APY in basis points (e.g. 420 = 4.20%).
    ///         Changes only affect future accrual; outstanding rewards are snapshotted first.
    uint256 public apyBps;

    /// @notice USDAX held in this contract earmarked for reward payments.
    ///         Reduced by successful reward claims; increased by addRewards().
    uint256 public rewardPool;

    /// @notice Total USDAX principal deposited across all users (excludes reward pool).
    uint256 public totalDeposited;

    /// @notice Per-user savings position.
    struct Position {
        /// @dev USDAX deposited by the user (principal, 18 decimals). Excludes rewards.
        uint256 principal;
        /// @dev block.timestamp of the last _settle() call. Used to compute elapsed time.
        uint256 checkpoint;
        /// @dev Snapshotted rewards not yet claimed. Includes shortfalls from prior claims.
        uint256 accrued;
    }

    /// @notice Savings position for each depositor.
    mapping(address => Position) public positions;

    /// @notice Ordered list of every address that has ever deposited (for enumeration).
    address[] private _depositors;

    /// @notice True if an address has ever opened a savings position.
    mapping(address => bool) private _hasPosition;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a user deposits USDAX into the savings module.
    /// @param user   The depositor.
    /// @param amount USDAX deposited (18 decimals).
    event Deposited(address indexed user, uint256 amount);

    /// @notice Emitted when a user withdraws principal USDAX.
    /// @param user   The depositor.
    /// @param amount Principal USDAX withdrawn (18 decimals). Does not include rewards.
    event Withdrawn(address indexed user, uint256 amount);

    /// @notice Emitted when a user successfully claims rewards.
    /// @param user        The claimant.
    /// @param rewardUsdax USDAX transferred to the user from the reward pool.
    event RewardsClaimed(address indexed user, uint256 rewardUsdax);

    /// @notice Emitted when USDAX is added to the reward pool.
    /// @param by     Address that funded the pool (anyone may call addRewards()).
    /// @param amount USDAX added to rewardPool (18 decimals).
    event RewardsAdded(address indexed by, uint256 amount);

    /// @notice Emitted when the savings APY is updated.
    /// @param oldBps Previous APY in basis points.
    /// @param newBps New APY in basis points.
    event ApyUpdated(uint256 oldBps, uint256 newBps);

    /// @notice Emitted when a claim cannot be fully satisfied by the reward pool.
    ///         The user receives up to `paid` USDAX; `shortfall` remains in their
    ///         `accrued` balance and is claimable once the pool is refunded.
    /// @param user      The claimant.
    /// @param shortfall USDAX owed but not paid (preserved in accrued).
    /// @param paid      USDAX actually transferred to the user.
    event RewardPoolInsufficient(address indexed user, uint256 shortfall, uint256 paid);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @notice Deploy the savings module.
    /// @param _usdax        Address of the USDAX ERC-20 token. Must be non-zero.
    /// @param _apyBps       Initial savings APY in basis points. Must be ≤ 5 000 (50%).
    /// @param initialOwner_ Initial contract owner (Ownable). Typically the deployer or a timelock.
    constructor(address _usdax, uint256 _apyBps, address initialOwner_) Ownable(initialOwner_) {
        require(_usdax  != address(0), "zero usdax");
        require(_apyBps <= 5_000,      "APY > 50%");
        usdax  = IERC20(_usdax);
        apyBps = _apyBps;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /// @notice Total USDAX rewards accrued by `user` and not yet claimed.
    ///         Includes both the snapshotted `accrued` balance and newly earned rewards
    ///         since the last _settle(). Does not modify state.
    /// @param  user   The depositor to query.
    /// @return Total pending rewards (18 decimals, USDAX) available to claim.
    function pendingRewards(address user) public view returns (uint256) {
        Position storage p = positions[user];
        if (p.principal == 0) return p.accrued;

        uint256 elapsed = block.timestamp - p.checkpoint;
        uint256 earned  = p.principal * apyBps * elapsed / (BASIS_POINTS * YEAR);
        return p.accrued + earned;
    }

    /// @notice Total number of unique addresses that have ever deposited.
    /// @return Count of depositors (including those that have fully withdrawn).
    function depositorCount() external view returns (uint256) {
        return _depositors.length;
    }

    // ─── User actions ─────────────────────────────────────────────────────────

    /// @notice Deposit USDAX into the savings module to begin earning rewards.
    ///         Outstanding rewards are settled before the principal is updated so the
    ///         new deposit does not back-date reward accrual.
    ///         Caller must approve this contract to transfer `amount` USDAX first.
    /// @param amount USDAX to deposit (18 decimals). Must be > 0.
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "zero amount");

        _settle(msg.sender);

        usdax.safeTransferFrom(msg.sender, address(this), amount);

        positions[msg.sender].principal += amount;
        totalDeposited                  += amount;

        if (!_hasPosition[msg.sender]) {
            _hasPosition[msg.sender] = true;
            _depositors.push(msg.sender);
        }

        emit Deposited(msg.sender, amount);
    }

    /// @notice Withdraw principal USDAX from the savings module.
    ///         Does NOT auto-claim accrued rewards — call claimRewards() separately.
    ///         Outstanding rewards are settled before the principal is reduced to preserve
    ///         the accrued balance accurately.
    /// @param amount Principal USDAX to withdraw (18 decimals). Must be ≤ deposited principal.
    function withdraw(uint256 amount) external nonReentrant {
        Position storage p = positions[msg.sender];
        require(amount > 0,            "zero amount");
        require(p.principal >= amount, "insufficient principal");

        _settle(msg.sender);

        p.principal    -= amount;
        totalDeposited -= amount;

        usdax.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Claim pending USDAX rewards accumulated since the last claim or deposit.
    ///         Non-reverting (v1.4): if the reward pool is insufficient, the contract pays
    ///         whatever is available and records the remaining shortfall in `accrued`.
    ///         Shortfalls are claimable once the pool is refunded via addRewards().
    ///         If nothing has accrued, the call is a silent no-op.
    function claimRewards() external nonReentrant {
        _settle(msg.sender);

        uint256 reward = positions[msg.sender].accrued;
        if (reward == 0) return; // nothing accrued — silent no-op

        uint256 toPay = reward > rewardPool ? rewardPool : reward;

        if (toPay == 0) {
            // Pool empty — rewards remain accrued; emit warning so protocol can refund pool.
            emit RewardPoolInsufficient(msg.sender, reward, 0);
            return;
        }

        positions[msg.sender].accrued -= toPay;
        rewardPool -= toPay;

        usdax.safeTransfer(msg.sender, toPay);
        emit RewardsClaimed(msg.sender, toPay);

        if (toPay < reward) {
            // Partial payment — remaining shortfall preserved in accrued.
            emit RewardPoolInsufficient(msg.sender, reward - toPay, toPay);
        }
    }

    // ─── Owner / Protocol actions ─────────────────────────────────────────────

    /// @notice Fund the reward pool with USDAX.
    ///         Callable by anyone — the protocol typically funds this from stability-fee
    ///         revenue, but external parties may also contribute.
    ///         Caller must approve this contract to transfer `amount` USDAX first.
    /// @param amount USDAX to add to the reward pool (18 decimals). Must be > 0.
    function addRewards(uint256 amount) external {
        require(amount > 0, "zero amount");
        usdax.safeTransferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardsAdded(msg.sender, amount);
    }

    /// @notice Update the savings APY. Outstanding rewards for all users are NOT retroactively
    ///         recalculated — the new rate applies to future accrual only.
    ///         Only callable by the contract owner (or timelock on production).
    /// @param newApyBps New APY in basis points. Must be ≤ 5 000 (50%).
    function setApy(uint256 newApyBps) external onlyOwner {
        require(newApyBps <= 5_000, "APY > 50%");
        emit ApyUpdated(apyBps, newApyBps);
        apyBps = newApyBps;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Snapshot pending rewards into `position.accrued` and reset `checkpoint` to
    ///      block.timestamp. Must be called before any state change that affects a user's
    ///      principal or the APY, so rewards are correctly attributed to the period they
    ///      accrued in.
    ///
    ///      Formula: earned = principal × apyBps × elapsed / (BASIS_POINTS × YEAR)
    ///      Note: integer division truncates; up to 1 wei per call may be lost to rounding.
    /// @param user Address whose rewards should be settled.
    function _settle(address user) internal {
        Position storage p = positions[user];
        if (p.principal > 0) {
            uint256 elapsed = block.timestamp - p.checkpoint;
            uint256 earned  = p.principal * apyBps * elapsed / (BASIS_POINTS * YEAR);
            p.accrued += earned;
        }
        p.checkpoint = block.timestamp;
    }
}
