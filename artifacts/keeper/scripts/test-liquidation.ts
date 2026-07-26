/**
 * test-liquidation.ts — End-to-end keeper liquidation test on Robinhood Chain Testnet
 *
 * Validates the real keeper execution path (scanVaults → executeLiquidations) against
 * a purpose-built test vault, not a hand-rolled contract call.
 *
 * Steps:
 *  1. Read current oracle prices + keeper USDAX balance
 *  2. Ensure keeper wallet has USDAX (mint via deployer's own vault if < 200 USDAX)
 *  3. Create throwaway test vault: deposit WETH, mint USDAX at ~maxLTV
 *  4. Verify HF > 1.0 (healthy before price drop)
 *  5. Drop oracle WETH price so HF < 1.0 — wrapped in try/finally to ALWAYS restore
 *  6. Run keeper scanVaults() → executeLiquidations() (the real keeper path)
 *  7. Assert: liquidation result shows success, vault debt reduced, keeper got WETH bonus
 *  8. (finally) Restore oracle WETH price — runs even on test failures
 *
 * Run:
 *   node --enable-source-maps --import tsx/esm scripts/test-liquidation.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  parseEther,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Import real keeper modules — this is what validates the keeper path end-to-end
import { scanVaults } from "../src/scanner.js";
import { executeLiquidations } from "../src/executor.js";

// ── Network / chain ───────────────────────────────────────────────────────────

const RPC_URL  = "https://rpc.testnet.chain.robinhood.com/rpc";
const CHAIN_ID = 46630;

const chain = {
  id: CHAIN_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

const transport = http(RPC_URL, { timeout: 30_000 });
const publicClient = createPublicClient({ chain, transport });

// ── Contract addresses ────────────────────────────────────────────────────────

const CONTRACTS = {
  oracle:      "0xfE07515418B6f7239e9b4ecE21f49a75656Ba1a3" as `0x${string}`,
  usdax:       "0x1988D89F5E7339394C20f93e982188c70eC4e5D3" as `0x${string}`,
  vaultEngine: "0xC45F02DE20928198B3a4A24c5822474755D3d4FF" as `0x${string}`,
  collMgr:     "0x2472DCBA450e0AA2f81e69AaCD33f91528343854" as `0x${string}`,
  WETH:        "0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc" as `0x${string}`,
};

// ── ABIs (minimal) ────────────────────────────────────────────────────────────

const ERC20_ABI = [
  { type: "function", name: "balanceOf",  inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve",    inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "mint",       inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "allowance",  inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

const ORACLE_ABI = [
  { type: "function", name: "getPrice",        inputs: [{ name: "token", type: "address" }], outputs: [{ name: "price", type: "uint256" }, { name: "updatedAt", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "setFallbackPrice", inputs: [{ name: "token", type: "address" }, { name: "usdPrice18", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
] as const;

const VAULT_ABI = [
  { type: "function", name: "depositCollateral", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "mintUsdax",         inputs: [{ name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "debt",              inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "healthFactor",      inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "maxMintable",       inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "collateralDeposits",inputs: [{ name: "user", type: "address" }, { name: "token", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  {
    type: "event",
    name: "Liquidated",
    inputs: [
      { name: "liquidator",      type: "address", indexed: true },
      { name: "vaultOwner",      type: "address", indexed: true },
      { name: "collateralToken", type: "address", indexed: true },
      { name: "debtRepaid",      type: "uint256", indexed: false },
      { name: "collateralSeized",type: "uint256", indexed: false },
    ],
  },
] as const;

const COLLATERAL_MGR_ABI = [
  { type: "function", name: "getConfig", inputs: [{ name: "token", type: "address" }], outputs: [{ name: "", type: "tuple", components: [
    { name: "enabled",              type: "bool"    },
    { name: "maxLTV",               type: "uint256" },
    { name: "liquidationThreshold", type: "uint256" },
    { name: "liquidationBonus",     type: "uint256" },
    { name: "tokenDecimals",        type: "uint8"   },
  ]}], stateMutability: "view" },
] as const;

// ── Throwaway test wallet ─────────────────────────────────────────────────────
// Foundry/Anvil test key #1 — publicly known, zero real value, testnet only.
// Replace with TEST_WALLET_PRIVATE_KEY env var to use a different key.
const TEST_WALLET_KEY: `0x${string}` = process.env.TEST_WALLET_PRIVATE_KEY
  ? (process.env.TEST_WALLET_PRIVATE_KEY.startsWith("0x")
    ? process.env.TEST_WALLET_PRIVATE_KEY as `0x${string}`
    : `0x${process.env.TEST_WALLET_PRIVATE_KEY}` as `0x${string}`)
  : "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(step: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const extra = data ? " " + JSON.stringify(data) : "";
  console.log(`[${ts}] ${step}${extra}`);
}

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function waitTx(hash: `0x${string}`, label: string) {
  log(`  ⏳ waiting for ${label}…`, { hash });
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 90_000 });
  if (receipt.status !== "success") throw new Error(`${label} reverted — tx ${hash}`);
  log(`  ✅ ${label} confirmed`, { block: receipt.blockNumber.toString() });
  return receipt;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("  USDAX Finance — Keeper End-to-End Liquidation Test");
  console.log("════════════════════════════════════════════════════════════\n");

  // ── 0. Load accounts ────────────────────────────────────────────────────────

  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY ?? "";
  if (!deployerKey) throw new Error("DEPLOYER_PRIVATE_KEY env var not set");
  const keeperKey: `0x${string}` = deployerKey.startsWith("0x")
    ? (deployerKey as `0x${string}`) : (`0x${deployerKey}` as `0x${string}`);

  const keeper = privateKeyToAccount(keeperKey);
  const tester = privateKeyToAccount(TEST_WALLET_KEY);

  assert(
    keeper.address.toLowerCase() !== tester.address.toLowerCase(),
    "Keeper and test wallet are the same address — self-liquidation is blocked by the contract"
  );

  const keeperWallet = createWalletClient({ account: keeper, chain, transport });
  const testerWallet = createWalletClient({ account: tester, chain, transport });

  log("0. Accounts loaded", {
    keeper: keeper.address,
    tester: tester.address,
  });

  // ── 1. Read current chain state ─────────────────────────────────────────────

  log("\n1. Reading on-chain state…");

  const [[wethPriceRaw], wethCfgRaw, keeperUsdax, keeperEth, testerEth] = await Promise.all([
    publicClient.readContract({ address: CONTRACTS.oracle, abi: ORACLE_ABI, functionName: "getPrice", args: [CONTRACTS.WETH] }) as Promise<[bigint, bigint]>,
    publicClient.readContract({ address: CONTRACTS.collMgr, abi: COLLATERAL_MGR_ABI, functionName: "getConfig", args: [CONTRACTS.WETH] }) as Promise<{ enabled: boolean; maxLTV: bigint; liquidationThreshold: bigint; liquidationBonus: bigint; tokenDecimals: number }>,
    publicClient.readContract({ address: CONTRACTS.usdax, abi: ERC20_ABI, functionName: "balanceOf", args: [keeper.address] }) as Promise<bigint>,
    publicClient.getBalance({ address: keeper.address }),
    publicClient.getBalance({ address: tester.address }),
  ]);

  const WETH_PRICE_USD = Number(formatUnits(wethPriceRaw, 18));
  const MAX_LTV        = Number(wethCfgRaw.maxLTV);

  log("  WETH oracle price", { priceUsd: WETH_PRICE_USD.toFixed(2) });
  log("  Collateral config", {
    maxLTV: `${MAX_LTV / 100}%`,
    liqThreshold: `${Number(wethCfgRaw.liquidationThreshold) / 100}%`,
    liqBonus: `${Number(wethCfgRaw.liquidationBonus) / 100}%`,
  });
  log("  Keeper state", {
    eth:   formatUnits(keeperEth, 18) + " ETH",
    usdax: formatUnits(keeperUsdax, 18) + " USDAX",
  });

  // ── 2. Ensure keeper has USDAX ──────────────────────────────────────────────

  const MIN_KEEPER_USDAX = parseUnits("200", 18);

  if (keeperUsdax < MIN_KEEPER_USDAX) {
    log("\n2. Keeper USDAX insufficient — minting via keeper's own vault…");

    const wethToMint = parseUnits("2", 18);
    await waitTx(
      await keeperWallet.writeContract({ address: CONTRACTS.WETH, abi: ERC20_ABI, functionName: "mint", args: [keeper.address, wethToMint] }),
      "mint WETH to keeper"
    );
    await waitTx(
      await keeperWallet.writeContract({ address: CONTRACTS.WETH, abi: ERC20_ABI, functionName: "approve", args: [CONTRACTS.vaultEngine, wethToMint] }),
      "approve WETH for keeper vault"
    );
    await waitTx(
      await keeperWallet.writeContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "depositCollateral", args: [CONTRACTS.WETH, wethToMint] }),
      "deposit WETH into keeper vault"
    );

    // Mint at 70% of maxLTV — conservative so keeper's vault doesn't become liquidatable
    const keeperMintAmt = BigInt(Math.floor(2 * WETH_PRICE_USD * (MAX_LTV / 10000) * 0.70 * 1e18));
    await waitTx(
      await keeperWallet.writeContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "mintUsdax", args: [keeperMintAmt] }),
      "mint USDAX for keeper"
    );

    const newBal = await publicClient.readContract({ address: CONTRACTS.usdax, abi: ERC20_ABI, functionName: "balanceOf", args: [keeper.address] }) as bigint;
    log("  Keeper USDAX balance now", { usdax: formatUnits(newBal, 18) });
  } else {
    log("\n2. Keeper already has sufficient USDAX", { balance: formatUnits(keeperUsdax, 18) });
  }

  // ── 3. Fund test wallet with ETH for gas ────────────────────────────────────

  log("\n3. Funding test wallet with ETH for gas…");
  if (testerEth < parseEther("0.01")) {
    await waitTx(
      await keeperWallet.sendTransaction({ to: tester.address, value: parseEther("0.05") }),
      "fund test wallet with ETH"
    );
  } else {
    log("  Test wallet already has ETH", { eth: formatUnits(testerEth, 18) });
  }

  // ── 4. Set up test vault at near-maxLTV ──────────────────────────────────────

  log("\n4. Setting up test vault near liquidation threshold…");

  // Always top up: mint 1 fresh WETH + deposit it so we have a clean collateral baseline.
  // This also handles re-runs where the test wallet already has a vault from a prior run.
  const testWethAmount = parseUnits("1", 18);
  await waitTx(
    await testerWallet.writeContract({ address: CONTRACTS.WETH, abi: ERC20_ABI, functionName: "mint", args: [tester.address, testWethAmount] }),
    "mint 1 WETH to test wallet"
  );
  await waitTx(
    await testerWallet.writeContract({ address: CONTRACTS.WETH, abi: ERC20_ABI, functionName: "approve", args: [CONTRACTS.vaultEngine, testWethAmount] }),
    "test wallet approve WETH"
  );
  await waitTx(
    await testerWallet.writeContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "depositCollateral", args: [CONTRACTS.WETH, testWethAmount] }),
    "test wallet deposit 1 WETH"
  );

  // Read current state: maxMintable (ceiling) and existing debt (already borrowed).
  // Remaining capacity = maxMintable − existingDebt.
  // Mint at 95% of remaining capacity so HF lands comfortably above 1.0 pre-price-drop.
  const [maxMintableRaw, existingDebtRaw] = await Promise.all([
    publicClient.readContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "maxMintable", args: [tester.address] }) as Promise<bigint>,
    publicClient.readContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "debt",        args: [tester.address] }) as Promise<bigint>,
  ]);

  const remainingCapacity = maxMintableRaw > existingDebtRaw ? maxMintableRaw - existingDebtRaw : 0n;
  // Mint at 95% of remaining headroom (or skip if already near-max)
  const mintAmount = (remainingCapacity * 95n) / 100n;

  if (mintAmount >= parseUnits("10", 18)) {
    await waitTx(
      await testerWallet.writeContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "mintUsdax", args: [mintAmount] }),
      `test wallet mint ${Number(formatUnits(mintAmount, 18)).toFixed(2)} USDAX`
    );
  } else {
    log("  Skipping additional mint — vault already near maxLTV", {
      maxMintable:      formatUnits(maxMintableRaw, 18),
      existingDebt:     formatUnits(existingDebtRaw, 18),
      remainingCapacity: formatUnits(remainingCapacity, 18),
    });
  }

  const [hfRaw, debtRaw] = await Promise.all([
    publicClient.readContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "healthFactor", args: [tester.address] }) as Promise<bigint>,
    publicClient.readContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "debt",        args: [tester.address] }) as Promise<bigint>,
  ]);
  const hf = Number(formatUnits(hfRaw, 18));

  assert(debtRaw > 0n, "Test vault has no debt after setup — cannot test liquidation");
  log("  Test vault state", {
    owner:        tester.address,
    debtUsd:      formatUnits(debtRaw, 18),
    healthFactor: hf.toFixed(4),
  });
  assert(hf >= 1.0, `Vault already undercollateralized before price drop (HF=${hf.toFixed(4)})`);

  // ── 5. Manipulate oracle — wrapped in try/finally so price is always restored ─

  log("\n5. Dropping oracle WETH price to trigger liquidation…");

  // Target post-drop HF ≈ 0.75
  const newPriceUsd = WETH_PRICE_USD * (0.75 / hf);
  const newPrice18  = BigInt(Math.floor(newPriceUsd * 1e18));

  log("  Oracle price drop", {
    from:    `$${WETH_PRICE_USD.toFixed(2)}`,
    to:      `$${newPriceUsd.toFixed(2)}`,
    dropPct: `${((1 - newPriceUsd / WETH_PRICE_USD) * 100).toFixed(1)}%`,
  });

  await waitTx(
    await keeperWallet.writeContract({ address: CONTRACTS.oracle, abi: ORACLE_ABI, functionName: "setFallbackPrice", args: [CONTRACTS.WETH, newPrice18] }),
    "oracle.setFallbackPrice (low)"
  );

  // All assertions and keeper execution are inside try/finally so oracle is always restored
  try {
    const hfAfterRaw = await publicClient.readContract({
      address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "healthFactor", args: [tester.address],
    }) as bigint;
    const hfAfter = Number(formatUnits(hfAfterRaw, 18));
    log("  Test vault HF after price drop", { healthFactor: hfAfter.toFixed(4) });
    assert(hfAfter < 1.0, `Price drop insufficient — HF still ${hfAfter.toFixed(4)} ≥ 1.0`);

    // ── 6. Run the real keeper scan + execute path ──────────────────────────────

    log("\n6. Running keeper scanVaults() → executeLiquidations()…");

    const candidates = await scanVaults();
    log("  scanVaults() result", {
      total: candidates.length,
      owners: candidates.map(c => ({
        addr: c.owner.slice(0, 10) + "…",
        hf:   c.healthFactor.toFixed(4),
        debtUsd: c.debtUsd.toFixed(2),
      })),
    });
    assert(candidates.length > 0, "scanVaults() found no liquidatable vaults — test vault not detected");

    const testVaultCandidate = candidates.find(
      c => c.owner.toLowerCase() === tester.address.toLowerCase()
    );
    assert(testVaultCandidate !== undefined, `Test vault (${tester.address}) not found in scanVaults() output`);

    log("  Test vault detected by scanner", {
      hf:      testVaultCandidate.healthFactor.toFixed(4),
      debtUsd: testVaultCandidate.debtUsd.toFixed(2),
      collaterals: testVaultCandidate.collaterals.map(c => `${c.symbol}: $${c.valueUsd.toFixed(2)}`),
    });

    const keeperUsdaxBefore = await publicClient.readContract({
      address: CONTRACTS.usdax, abi: ERC20_ABI, functionName: "balanceOf", args: [keeper.address],
    }) as bigint;
    const keeperWethBefore = await publicClient.readContract({
      address: CONTRACTS.WETH, abi: ERC20_ABI, functionName: "balanceOf", args: [keeper.address],
    }) as bigint;

    const results = await executeLiquidations(candidates, (msg, data) => {
      log(`  [keeper] ${msg}`, data as Record<string, unknown> | undefined);
    });

    log("  executeLiquidations() returned", {
      count: results.length,
      results: results.map(r => ({
        owner:    r.owner.slice(0, 10) + "…",
        skipped:  r.skipped,
        skipReason: r.skipReason,
        txHash:   r.txHash,
        error:    r.error,
      })),
    });

    // ── 7. Assert liquidation succeeded ──────────────────────────────────────────

    log("\n7. Verifying on-chain results…");

    const testVaultResult = results.find(
      r => r.owner.toLowerCase() === tester.address.toLowerCase()
    );
    assert(testVaultResult !== undefined, "No result entry for test vault in executeLiquidations() output");
    assert(!testVaultResult.error, `Keeper reported error: ${testVaultResult.error}`);
    assert(!testVaultResult.skipped, `Keeper skipped test vault: ${testVaultResult.skipReason}`);
    assert(testVaultResult.txHash !== null, "Keeper returned null txHash — liquidation tx not sent");

    log("  Keeper liquidation result", {
      txHash:          testVaultResult.txHash,
      debtRepaidUsd:   testVaultResult.debtRepaid.toFixed(2),
      collSeizedUsd:   testVaultResult.collSeizedUsd.toFixed(2),
      estimatedProfit: `$${testVaultResult.estimatedProfit.toFixed(2)}`,
    });

    // Verify on-chain token balances changed
    const [keeperUsdaxAfter, keeperWethAfter, testerDebtAfter, testerCollAfter] = await Promise.all([
      publicClient.readContract({ address: CONTRACTS.usdax, abi: ERC20_ABI, functionName: "balanceOf", args: [keeper.address] }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.WETH, abi: ERC20_ABI, functionName: "balanceOf", args: [keeper.address] }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "debt", args: [tester.address] }) as Promise<bigint>,
      publicClient.readContract({ address: CONTRACTS.vaultEngine, abi: VAULT_ABI, functionName: "collateralDeposits", args: [tester.address, CONTRACTS.WETH] }) as Promise<bigint>,
    ]);

    const usdaxSpent  = keeperUsdaxBefore - keeperUsdaxAfter;
    const wethGained  = keeperWethAfter   - keeperWethBefore;

    assert(usdaxSpent > 0n, "Keeper USDAX balance unchanged — liquidation did not fire");
    assert(wethGained > 0n, "Keeper received no WETH — collateral transfer did not occur");
    assert(testerDebtAfter < debtRaw, "Test vault debt not reduced after liquidation");

    log("  ✅ On-chain assertions passed", {
      usdaxSpent:    formatUnits(usdaxSpent, 18) + " USDAX",
      wethGained:    formatUnits(wethGained, 18) + " WETH",
      debtBefore:    formatUnits(debtRaw, 18),
      debtAfter:     formatUnits(testerDebtAfter, 18),
      wethCollAfter: formatUnits(testerCollAfter, 18),
    });

    // Parse Liquidated event from tx receipt to verify exact amounts
    const receipt = await publicClient.getTransactionReceipt({ hash: testVaultResult.txHash! });
    for (const rawLog of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: VAULT_ABI, eventName: "Liquidated", data: rawLog.data, topics: rawLog.topics });
        log("  📋 Liquidated event (on-chain)", {
          liquidator:       decoded.args.liquidator,
          vaultOwner:       decoded.args.vaultOwner,
          collateralToken:  decoded.args.collateralToken,
          debtRepaid:       formatUnits(decoded.args.debtRepaid as bigint, 18) + " USDAX",
          collateralSeized: formatUnits(decoded.args.collateralSeized as bigint, 18) + " WETH",
        });
      } catch { /* not a Liquidated event */ }
    }

  } finally {
    // ── 8. Always restore oracle price — runs even if assertions throw ──────────

    log("\n8. Restoring oracle WETH price to $" + WETH_PRICE_USD.toFixed(2) + "…");
    try {
      const restoreHash = await keeperWallet.writeContract({
        address: CONTRACTS.oracle, abi: ORACLE_ABI, functionName: "setFallbackPrice",
        args: [CONTRACTS.WETH, wethPriceRaw],
      });
      await waitTx(restoreHash, "oracle.setFallbackPrice (restored)");

      const [restoredPrice] = await publicClient.readContract({
        address: CONTRACTS.oracle, abi: ORACLE_ABI, functionName: "getPrice", args: [CONTRACTS.WETH],
      }) as [bigint, bigint];
      log("  Oracle WETH price restored", { priceUsd: "$" + formatUnits(restoredPrice, 18) });
    } catch (restoreErr) {
      console.error("  ⚠️  CRITICAL: oracle price restoration FAILED:", restoreErr);
      console.error("  Manual fix: cast send", CONTRACTS.oracle,
        `"setFallbackPrice(address,uint256)"`, CONTRACTS.WETH, wethPriceRaw.toString(),
        "--rpc-url", RPC_URL, `--private-key "0x$DEPLOYER_PRIVATE_KEY"`, "--legacy");
    }
  }

  // ── Summary (only reached on full success) ─────────────────────────────────

  console.log("\n════════════════════════════════════════════════════════════");
  console.log("  ✅  END-TO-END KEEPER LIQUIDATION TEST PASSED");
  console.log("════════════════════════════════════════════════════════════\n");
}

main().catch(err => {
  console.error("\n💥 Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
