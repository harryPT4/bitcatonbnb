import { createHash, randomBytes } from "node:crypto";
import { getAddress, recoverMessageAddress } from "viem";
import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";

export const WALLET_SESSION_COOKIE = "bitcat_flap_wallet";
export const AUTH_DOMAIN = "bitcatbnb.family";
export function normalizeWallet(wallet: string) { return getAddress(wallet).toLowerCase(); }
export function newNonce() { return randomBytes(24).toString("hex"); }
export function newSession() { return randomBytes(32).toString("hex"); }
export function hashSession(value: string) { return createHash("sha256").update(`bitcat-wallet:${value}`).digest("hex"); }
export function authMessage(wallet: string, nonce: string, issuedAt: string) {
  return `BITCAT Weekly Flap authentication\nDomain: ${AUTH_DOMAIN}\nWallet: ${normalizeWallet(wallet)}\nChain ID: 56\nNonce: ${nonce}\nIssued at: ${issuedAt}`;
}
export async function recoverWallet(message: string, signature: `0x${string}`) {
  return normalizeWallet(await recoverMessageAddress({ message, signature }));
}
export async function getVerifiedWallet(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const raw = cookie.match(new RegExp(`(?:^|;\\s*)${WALLET_SESSION_COOKIE}=([^;]+)`))?.[1];
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  const result = await getDatabase().execute<{ wallet: string }>(sql`SELECT wallet FROM flap_wallet_challenges WHERE session_hash = ${hashSession(raw)} AND session_expires_at > now() AND used_at IS NOT NULL ORDER BY session_expires_at DESC LIMIT 1`);
  return result.rows[0]?.wallet ?? null;
}
