// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {USDAxSavings} from "../src/USDAxSavings.sol";
import {USDAxToken}   from "../src/USDAxToken.sol";

/**
 * @title USDAxSavings Tests
 * @notice Covers: deposit/withdraw, reward accrual, claimRewards (including
 *         empty-pool and partial-pool scenarios from our v1.4 fix), APY update,
 *         and access control.
 */
contract USDAxSavingsTest is Test {

    USDAxSavings internal savings;
    USDAxToken   internal usdax;

    address internal owner = address(0xDEAD);
    address internal alice = address(0xA11CE);
    address internal bob   = address(0xB0B);

    uint256 internal constant APY_BPS   = 1_000;  // 10% APY for easy maths
    uint256 internal constant YEAR      = 365 days;

    // ── Setup ────────────────────────────────────────────────────────────────

    function setUp() public {
        // Warp to a safe start so time-delta math never underflows
        vm.warp(1 days);

        vm.startPrank(owner);
        usdax   = new USDAxToken(owner);
        savings = new USDAxSavings(address(usdax), APY_BPS, owner);

        // Give owner VaultEngine-level mint rights so tests can fund accounts
        usdax.setVaultEngine(owner);

        // Mint USDAX to test users
        usdax.mint(alice, 10_000e18);
        usdax.mint(bob,   10_000e18);

        // Fund reward pool with 1_000 USDAX
        usdax.mint(owner, 1_000e18);
        usdax.approve(address(savings), 1_000e18);
        savings.addRewards(1_000e18);

        vm.stopPrank();
    }

    // ── Deposit / Withdraw ───────────────────────────────────────────────────

    function test_DepositUpdatesBalance() public {
        vm.startPrank(alice);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        vm.stopPrank();

        assertEq(savings.totalDeposited(), 1_000e18, "totalDeposited");
        // positions() returns (principal, checkpoint, accrued) — index 0 is principal
        (uint256 principal,,) = savings.positions(alice);
        assertEq(principal, 1_000e18, "alice principal");
    }

    function test_WithdrawReturnsTokens() public {
        vm.startPrank(alice);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        savings.withdraw(1_000e18);
        vm.stopPrank();

        assertEq(savings.totalDeposited(), 0, "totalDeposited after withdraw");
        assertEq(usdax.balanceOf(alice), 10_000e18, "alice balance restored");
    }

    function test_CannotWithdrawMoreThanDeposited() public {
        vm.startPrank(alice);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        vm.expectRevert();
        savings.withdraw(2_000e18);
        vm.stopPrank();
    }

    function test_CannotDepositZero() public {
        vm.startPrank(alice);
        usdax.approve(address(savings), 100e18);
        vm.expectRevert();
        savings.deposit(0);
        vm.stopPrank();
    }

    // ── Reward accrual ───────────────────────────────────────────────────────

    function test_RewardsAccrueOverTime() public {
        vm.startPrank(alice);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + YEAR);

        // pendingRewards() returns principal-based accrual + stored accrued
        uint256 pending = savings.pendingRewards(alice);
        // 10% APY on 1_000 USDAX for 1 year = 100 USDAX
        assertApproxEqRel(pending, 100e18, 0.01e18, "pending ~100 USDAX");
    }

    function test_TwoDepositorsBothEarnIndependently() public {
        // The APY is applied PER USER on their own principal (not split across the pool).
        // Each depositor with 1_000 USDAX at 10% APY earns ~100 USDAX/year independently.
        vm.startPrank(alice);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        vm.stopPrank();

        vm.startPrank(bob);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + YEAR);

        uint256 alicePending = savings.pendingRewards(alice);
        uint256 bobPending   = savings.pendingRewards(bob);
        // Each independently earns 10% APY on their own 1_000 USDAX = ~100 USDAX
        assertApproxEqRel(alicePending, 100e18, 0.02e18, "alice ~100 USDAX");
        assertApproxEqRel(bobPending,   100e18, 0.02e18, "bob ~100 USDAX");
    }

    // ── claimRewards (v1.4 non-reverting fixes) ──────────────────────────────

    function test_ClaimRewardsTransfersToUser() public {
        vm.startPrank(alice);
        usdax.approve(address(savings), 1_000e18);
        savings.deposit(1_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + YEAR);

        uint256 balanceBefore = usdax.balanceOf(alice);
        vm.startPrank(alice);
        savings.claimRewards();
        vm.stopPrank();

        uint256 gained = usdax.balanceOf(alice) - balanceBefore;
        assertApproxEqRel(gained, 100e18, 0.02e18, "received ~100 USDAX");
    }

    function test_ClaimRewardsNothingAccruedIsNoOp() public {
        // Alice has no deposit — claimRewards must not revert
        vm.startPrank(alice);
        savings.claimRewards();
        vm.stopPrank();
    }

    function test_ClaimRewardsEmptyPoolDoesNotRevert() public {
        // Deploy a fresh savings with an empty reward pool
        vm.startPrank(owner);
        USDAxSavings emptySavings = new USDAxSavings(address(usdax), APY_BPS, owner);
        vm.stopPrank();

        vm.startPrank(alice);
        usdax.approve(address(emptySavings), 1_000e18);
        emptySavings.deposit(1_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + YEAR); // ~100 USDAX accrued

        // Pool is empty — claimRewards must NOT revert
        uint256 balanceBefore = usdax.balanceOf(alice);
        vm.startPrank(alice);
        emptySavings.claimRewards();
        vm.stopPrank();

        // Balance unchanged — nothing paid
        assertEq(usdax.balanceOf(alice), balanceBefore, "no payout when pool empty");

        // Accrued amount preserved — positions()[2] is accrued
        (,, uint256 accrued) = emptySavings.positions(alice);
        assertGt(accrued, 0, "accrued preserved when pool empty");
    }

    function test_ClaimRewardsPartialPoolPaysPartial() public {
        // Deposit enough that after ~13 months alice accrues > rewardPool (1_000 USDAX)
        // 10% APY on 10_000 for 395 days ≈ 1_082 USDAX
        vm.startPrank(alice);
        usdax.approve(address(savings), 10_000e18);
        savings.deposit(10_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 395 days);

        uint256 poolBefore = savings.rewardPool();
        uint256 balBefore  = usdax.balanceOf(alice);

        vm.startPrank(alice);
        savings.claimRewards(); // must not revert
        vm.stopPrank();

        uint256 paid = usdax.balanceOf(alice) - balBefore;
        // Should receive exactly what was in the pool (partial payment)
        assertEq(paid, poolBefore, "received exactly pool balance");
        assertEq(savings.rewardPool(), 0, "pool drained");

        // Remaining shortfall preserved in positions accrued (index 2)
        (,, uint256 remaining) = savings.positions(alice);
        assertGt(remaining, 0, "shortfall preserved in accrued");
    }

    function test_AfterPoolRefundClaimPaysRemainder() public {
        // Deploy a fresh savings with an empty reward pool
        vm.startPrank(owner);
        USDAxSavings emptySavings2 = new USDAxSavings(address(usdax), APY_BPS, owner);
        vm.stopPrank();

        vm.startPrank(alice);
        usdax.approve(address(emptySavings2), 1_000e18);
        emptySavings2.deposit(1_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + YEAR); // ~100 USDAX accrued

        // Empty pool — claim is no-op
        vm.prank(alice);
        emptySavings2.claimRewards();

        (,, uint256 accrued) = emptySavings2.positions(alice);
        assertGt(accrued, 0, "shortfall preserved after empty-pool claim");

        // Owner funds the pool
        vm.startPrank(owner);
        usdax.mint(owner, 500e18); // owner USDAX was spent in outer setUp
        usdax.approve(address(emptySavings2), 500e18);
        emptySavings2.addRewards(500e18);
        vm.stopPrank();

        // Alice can now claim
        uint256 balBefore = usdax.balanceOf(alice);
        vm.prank(alice);
        emptySavings2.claimRewards();

        assertGt(usdax.balanceOf(alice), balBefore, "rewards paid after pool funded");
    }

    // ── APY update ───────────────────────────────────────────────────────────

    function test_OnlyOwnerCanUpdateApy() public {
        vm.startPrank(alice);
        vm.expectRevert();
        savings.setApy(500);
        vm.stopPrank();
    }

    function test_ApyUpdateCapEnforced() public {
        vm.startPrank(owner);
        vm.expectRevert();
        savings.setApy(5_001); // > 50% APY cap (contract enforces apyBps <= 5_000)
        vm.stopPrank();
    }

    function test_ApyUpdateEmitsEvent() public {
        vm.startPrank(owner);
        vm.expectEmit(true, false, false, true);
        emit ApyUpdated(APY_BPS, 500);
        savings.setApy(500);
        vm.stopPrank();
    }

    // ── addRewards access ────────────────────────────────────────────────────

    function test_AddRewardsIncreasesPool() public {
        uint256 before = savings.rewardPool();
        vm.startPrank(owner);
        usdax.mint(owner, 200e18); // owner's setUp supply is spent; mint fresh
        usdax.approve(address(savings), 200e18);
        savings.addRewards(200e18);
        vm.stopPrank();
        assertEq(savings.rewardPool(), before + 200e18, "pool increased");
    }

    event ApyUpdated(uint256 oldBps, uint256 newBps);
}
