import { randomBytes } from "crypto";

/**
 * Generate a testnet transaction hash.
 * Uses Node's crypto module for cryptographically random bytes.
 * In production this is replaced by the real on-chain tx hash.
 */
export function generateTxHash(): string {
  return "0x" + randomBytes(32).toString("hex");
}
