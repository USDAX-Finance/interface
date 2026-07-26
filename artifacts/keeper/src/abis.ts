/**
 * Minimal ABIs — only the functions the keeper bot calls.
 */

export const VAULT_ENGINE_ABI = [
  {
    "type": "function",
    "name": "getVaultOwners",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "debt",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "healthFactor",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "collateralDeposits",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "liquidate",
    "inputs": [
      { "name": "vaultOwner",  "type": "address", "internalType": "address" },
      { "name": "debtToRepay", "type": "uint256", "internalType": "uint256" },
      { "name": "collToken",   "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Liquidated",
    "inputs": [
      { "name": "liquidator",     "type": "address", "indexed": true,  "internalType": "address" },
      { "name": "vaultOwner",     "type": "address", "indexed": true,  "internalType": "address" },
      { "name": "collateralToken","type": "address", "indexed": true,  "internalType": "address" },
      { "name": "debtRepaid",     "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "collateralSeized","type": "uint256","indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  }
] as const;

export const USDAX_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      { "name": "owner",   "type": "address", "internalType": "address" },
      { "name": "spender", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address", "internalType": "address" },
      { "name": "amount",  "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "nonpayable"
  }
] as const;

export const ORACLE_ABI = [
  {
    "type": "function",
    "name": "getPrice",
    "inputs": [{ "name": "token", "type": "address", "internalType": "address" }],
    "outputs": [
      { "name": "price",     "type": "uint256", "internalType": "uint256" },
      { "name": "updatedAt", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  }
] as const;
