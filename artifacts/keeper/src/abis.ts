/**
 * Minimal ABIs — only the functions the keeper bot calls.
 * Includes paginated vault-owner enumeration (v1.5) to prevent gas DoS at scale.
 */

export const VAULT_ENGINE_ABI = [
  // ── Paginated enumeration (preferred) ──────────────────────────────────────
  {
    "type": "function",
    "name": "vaultOwnerCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVaultOwnersPaginated",
    "inputs": [
      { "name": "offset", "type": "uint256", "internalType": "uint256" },
      { "name": "limit",  "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "page", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  // ── Legacy full-array (fallback for small sets) ───────────────────────────
  {
    "type": "function",
    "name": "getVaultOwners",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  // ── Per-vault reads ────────────────────────────────────────────────────────
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
  // ── Write: liquidate ──────────────────────────────────────────────────────
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
  // ── Event ─────────────────────────────────────────────────────────────────
  {
    "type": "event",
    "name": "Liquidated",
    "inputs": [
      { "name": "liquidator",      "type": "address", "indexed": true,  "internalType": "address" },
      { "name": "vaultOwner",      "type": "address", "indexed": true,  "internalType": "address" },
      { "name": "collateralToken", "type": "address", "indexed": true,  "internalType": "address" },
      { "name": "debtRepaid",      "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "collateralSeized","type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
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
  },
  {
    "type": "function",
    "name": "setFallbackPrices",
    "inputs": [
      { "name": "tokens", "type": "address[]", "internalType": "address[]" },
      { "name": "prices", "type": "uint256[]", "internalType": "uint256[]" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  // ── Updater role (v1.5) ───────────────────────────────────────────────────
  {
    "type": "function",
    "name": "updater",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setUpdater",
    "inputs": [{ "name": "newUpdater", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;
