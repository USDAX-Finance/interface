/**
 * Mainnet blockchain reader — reads APXStaking live data from Robinhood Chain Mainnet (4663).
 * Completely separate from the testnet client in blockchain.ts.
 */
import { createPublicClient, http, formatUnits } from "viem";
import ABIS from "./abis.json" assert { type: "json" };

const MAINNET_RPC  = process.env.MAINNET_RPC_URL  ?? "https://rpc.mainnet.chain.robinhood.com/rpc";
const MAINNET_ID   = Number(process.env.MAINNET_CHAIN_ID ?? 4663);

const CONTRACT_APX_STAKING = (process.env.CONTRACT_APX_STAKING ?? "") as `0x${string}`;
const CONTRACT_APX         = (process.env.CONTRACT_APX         ?? "") as `0x${string}`;

const robinhoodMainnet = {
  id:   MAINNET_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [MAINNET_RPC] } },
} as const;

export const mainnetClient = createPublicClient({
  chain:     robinhoodMainnet,
  transport: http(MAINNET_RPC, { timeout: 10_000 }),
});

const stakingAbi = ABIS.APXStaking as readonly unknown[];

// ─── APXStaking reads ────────────────────────────────────────────────────────

export interface StakingStats {
  totalStaked:      number;   // APX tokens staked (human units)
  rewardsPool:      number;   // APX available to pay rewards (human units)
  rewardRate:       number;   // APX wei per second
  currentApyBps:    number;   // dynamic APY in basis points (10000 = 100%)
  stakerCount:      number;
  paused:           boolean;
}

export async function getStakingStats(): Promise<StakingStats> {
  if (!CONTRACT_APX_STAKING) throw new Error("CONTRACT_APX_STAKING not configured");

  const [totalStaked, rewardsPool, rewardRate, apyBps, stakerCount, paused] = await Promise.all([
    mainnetClient.readContract({ address: CONTRACT_APX_STAKING, abi: stakingAbi, functionName: "totalStaked" }) as Promise<bigint>,
    mainnetClient.readContract({ address: CONTRACT_APX_STAKING, abi: stakingAbi, functionName: "rewardsPool" }) as Promise<bigint>,
    mainnetClient.readContract({ address: CONTRACT_APX_STAKING, abi: stakingAbi, functionName: "rewardRate" }) as Promise<bigint>,
    mainnetClient.readContract({ address: CONTRACT_APX_STAKING, abi: stakingAbi, functionName: "currentApyBps" }) as Promise<bigint>,
    mainnetClient.readContract({ address: CONTRACT_APX_STAKING, abi: stakingAbi, functionName: "stakerCount" }) as Promise<bigint>,
    mainnetClient.readContract({ address: CONTRACT_APX_STAKING, abi: stakingAbi, functionName: "paused" }) as Promise<boolean>,
  ]);

  return {
    totalStaked:   Number(formatUnits(totalStaked, 18)),
    rewardsPool:   Number(formatUnits(rewardsPool, 18)),
    rewardRate:    Number(rewardRate),
    currentApyBps: Number(apyBps),
    stakerCount:   Number(stakerCount),
    paused,
  };
}

export interface UserStakingInfo {
  staked:           number;   // APX currently staking (accruing rewards)
  cooldownAmount:   number;   // APX in cooldown (not accruing)
  cooldownEnd:      number;   // UNIX timestamp (0 = no cooldown)
  rewards:          number;   // APX earned, claimable
  earned:           number;   // live earned() — includes accrued since last interaction
}

export async function getUserStakingInfo(user: `0x${string}`): Promise<UserStakingInfo> {
  if (!CONTRACT_APX_STAKING) throw new Error("CONTRACT_APX_STAKING not configured");

  const [stakerInfo, earnedRaw] = await Promise.all([
    mainnetClient.readContract({
      address: CONTRACT_APX_STAKING,
      abi: stakingAbi,
      functionName: "stakers",
      args: [user],
    }) as Promise<[bigint, bigint, bigint, bigint, bigint]>,
    mainnetClient.readContract({
      address: CONTRACT_APX_STAKING,
      abi: stakingAbi,
      functionName: "earned",
      args: [user],
    }) as Promise<bigint>,
  ]);

  const [staked, cooldownAmount, , rewards, cooldownEnd] = stakerInfo;

  return {
    staked:         Number(formatUnits(staked, 18)),
    cooldownAmount: Number(formatUnits(cooldownAmount, 18)),
    cooldownEnd:    Number(cooldownEnd),
    rewards:        Number(formatUnits(rewards, 18)),
    earned:         Number(formatUnits(earnedRaw, 18)),
  };
}
