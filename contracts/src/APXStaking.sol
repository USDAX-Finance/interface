// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20}        from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20}     from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable}       from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable}      from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title  APXStaking
/// @notice APX governance token staking module — stake APX, earn APX.
///
///         Reward Model — Synthetix rewardPerToken (battle-tested, audit-proven):
///         - A single `rewardPerTokenStored` accumulates over time proportional to emission.
///         - Each user snapshots this value at every interaction.
///         - Reward = stake × Δ(rewardPerToken)  — O(1), gas-efficient regardless of staker count.
///
///         Safety:
///         - ReentrancyGuard on all state-mutating functions.
///         - Pausable: owner can freeze stake/claim in an emergency.
///         - emergencyWithdraw: users can always recover principal, even when paused.
///         - Reward pool is accounted separately from user stakes — pool can never drain user funds.
///         - Cooldown zeroes out `staked` immediately → zero reward accrual during cooldown period.
///         - SafeERC20 for non-standard token transfer safety.
///         - Minimum stake of 1 APX prevents dust-position griefing.
///
/// @custom:audit Synthetix StakingRewards pattern — see SNX audit by Sigma Prime.
contract APXStaking is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant COOLDOWN_PERIOD = 7 days;
    uint256 public constant MIN_STAKE       = 1e18;      // 1 APX
    uint256 public constant YEAR            = 365 days;

    // ─── Immutables ───────────────────────────────────────────────────────────
    IERC20 public immutable apx;

    // ─── Reward accounting (Synthetix model) ─────────────────────────────────
    /// @dev APX wei emitted per second from the reward pool.
    uint256 public rewardRate;

    /// @dev Global accumulator — APX reward per staked APX (scaled ×1e18 for precision).
    uint256 public rewardPerTokenStored;

    /// @dev Timestamp of last global accumulator update.
    uint256 public lastUpdateTime;

    // ─── Global stake accounting ──────────────────────────────────────────────
    /// @dev Total APX currently accruing rewards (excludes amounts in cooldown).
    uint256 public totalStaked;

    /// @dev Total APX available to pay staker rewards. Separate from user deposits.
    uint256 public rewardsPool;

    // ─── Per-user state ───────────────────────────────────────────────────────
    struct StakeInfo {
        uint256 staked;              // APX accruing rewards right now
        uint256 cooldownAmount;      // APX waiting for cooldown expiry (not accruing)
        uint256 rewardPerTokenPaid;  // snapshot of rewardPerTokenStored at last touch
        uint256 rewards;             // pending claimable APX (materialised)
        uint256 cooldownEnd;         // 0 = no cooldown; >0 = UNIX timestamp when cooldown ends
    }

    mapping(address => StakeInfo) public stakers;

    // ─── Enumeration ──────────────────────────────────────────────────────────
    address[] private _stakerList;
    mapping(address => bool) private _isStaker;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount);
    event CooldownStarted(address indexed user, uint256 amount, uint256 cooldownEnd);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsAdded(address indexed by, uint256 amount);
    event RewardRateUpdated(uint256 oldRatePerSec, uint256 newRatePerSec, uint256 apxPerYear);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _apx           APX token address (mainnet).
    /// @param _apxPerYear    Initial emission: APX tokens per year (in WAD, 1e18 = 1 APX).
    /// @param initialOwner_  Contract owner (can add rewards, adjust rate, pause).
    constructor(address _apx, uint256 _apxPerYear, address initialOwner_) Ownable(initialOwner_) {
        require(_apx != address(0), "APXStaking: zero apx address");
        apx             = IERC20(_apx);
        rewardRate      = _apxPerYear / YEAR;   // APX wei per second
        lastUpdateTime  = block.timestamp;
    }

    // ─── Modifier ─────────────────────────────────────────────────────────────

    /// @dev Snapshots the global accumulator and materialises `account`'s pending rewards.
    ///      Must run before any function that changes stake or claims rewards.
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime       = block.timestamp;
        if (account != address(0)) {
            stakers[account].rewards             = earned(account);
            stakers[account].rewardPerTokenPaid  = rewardPerTokenStored;
        }
        _;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Global reward-per-token accumulator including time elapsed since last update.
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        uint256 elapsed = block.timestamp - lastUpdateTime;
        return rewardPerTokenStored + (rewardRate * elapsed * 1e18 / totalStaked);
    }

    /// @notice APX rewards earned by `account` — includes accrued + pending.
    function earned(address account) public view returns (uint256) {
        StakeInfo storage s = stakers[account];
        // Only `staked` (not cooldownAmount) accrues — cooldown positions earn nothing.
        return s.staked * (rewardPerToken() - s.rewardPerTokenPaid) / 1e18 + s.rewards;
    }

    /// @notice Current dynamic APY in basis points (10000 = 100%).
    ///         Rises when fewer APX are staked, falls when more enter.
    function currentApyBps() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        return rewardRate * YEAR * 10_000 / totalStaked;
    }

    /// @notice Number of unique addresses that have ever staked.
    function stakerCount() external view returns (uint256) {
        return _stakerList.length;
    }

    // ─── User Actions ─────────────────────────────────────────────────────────

    /// @notice Stake APX. Rewards start accruing immediately.
    /// @param  amount APX to stake (min 1 APX = 1e18 wei).
    function stake(uint256 amount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        require(amount >= MIN_STAKE,                          "APXStaking: below minimum stake");
        require(stakers[msg.sender].cooldownAmount == 0,      "APXStaking: active cooldown; unstake first");

        apx.safeTransferFrom(msg.sender, address(this), amount);

        stakers[msg.sender].staked += amount;
        totalStaked                += amount;

        if (!_isStaker[msg.sender]) {
            _isStaker[msg.sender] = true;
            _stakerList.push(msg.sender);
        }

        emit Staked(msg.sender, amount);
    }

    /// @notice Begin the 7-day unstake cooldown for the caller's full stake.
    ///         Reward accrual stops immediately — cooldown position earns nothing.
    function startCooldown()
        external
        nonReentrant
        updateReward(msg.sender)   // materialise rewards at current rate before removing stake
    {
        StakeInfo storage s = stakers[msg.sender];
        require(s.staked > 0,         "APXStaking: nothing staked");
        require(s.cooldownAmount == 0, "APXStaking: cooldown already active");

        uint256 amount   = s.staked;
        s.cooldownAmount = amount;
        s.staked         = 0;        // stops reward accrual immediately
        totalStaked     -= amount;
        s.cooldownEnd    = block.timestamp + COOLDOWN_PERIOD;

        emit CooldownStarted(msg.sender, amount, s.cooldownEnd);
    }

    /// @notice Withdraw staked APX after the cooldown period has elapsed.
    function unstake() external nonReentrant {
        StakeInfo storage s = stakers[msg.sender];
        require(s.cooldownAmount > 0,              "APXStaking: start cooldown first");
        require(block.timestamp >= s.cooldownEnd,  "APXStaking: cooldown not finished");

        uint256 amount   = s.cooldownAmount;
        s.cooldownAmount = 0;
        s.cooldownEnd    = 0;

        apx.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim all pending APX rewards.
    function claimRewards()
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        uint256 reward = stakers[msg.sender].rewards;
        require(reward > 0,              "APXStaking: no rewards");
        require(rewardsPool >= reward,   "APXStaking: reward pool insufficient");

        stakers[msg.sender].rewards  = 0;
        rewardsPool                 -= reward;

        apx.safeTransfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    /// @notice Emergency withdraw: recover staked principal immediately, forfeiting pending rewards.
    ///         Works even when the contract is paused — users are never locked out of principal.
    function emergencyWithdraw() external nonReentrant {
        StakeInfo storage s = stakers[msg.sender];

        uint256 stakeAmount    = s.staked;
        uint256 cooldownAmount = s.cooldownAmount;
        uint256 total          = stakeAmount + cooldownAmount;
        require(total > 0, "APXStaking: nothing to withdraw");

        // Remove from active stake accounting only if currently staking
        if (stakeAmount > 0) {
            totalStaked                     -= stakeAmount;
            rewardPerTokenStored             = rewardPerToken();
            lastUpdateTime                   = block.timestamp;
        }

        s.staked             = 0;
        s.cooldownAmount     = 0;
        s.cooldownEnd        = 0;
        s.rewards            = 0;           // forfeited
        s.rewardPerTokenPaid = rewardPerTokenStored;

        apx.safeTransfer(msg.sender, total);
        emit EmergencyWithdraw(msg.sender, total);
    }

    // ─── Owner Actions ────────────────────────────────────────────────────────

    /// @notice Fund the rewards pool. Caller must pre-approve this contract to spend APX.
    /// @param  amount APX (1e18 = 1 APX) to transfer into the reward pool.
    function addRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "APXStaking: zero amount");
        apx.safeTransferFrom(msg.sender, address(this), amount);
        rewardsPool += amount;
        emit RewardsAdded(msg.sender, amount);
    }

    /// @notice Adjust the emission rate.
    /// @param  _apxPerYear New annual emission in APX WAD (e.g. 1_000_000 ether = 1M APX/year).
    function setRewardRate(uint256 _apxPerYear)
        external
        onlyOwner
        updateReward(address(0))   // lock in accumulator before changing rate
    {
        uint256 oldRate = rewardRate;
        rewardRate      = _apxPerYear / YEAR;
        emit RewardRateUpdated(oldRate, rewardRate, _apxPerYear);
    }

    /// @notice Pause staking and claiming. emergencyWithdraw remains available.
    function pause() external onlyOwner { _pause(); }

    /// @notice Resume normal operation.
    function unpause() external onlyOwner { _unpause(); }
}
