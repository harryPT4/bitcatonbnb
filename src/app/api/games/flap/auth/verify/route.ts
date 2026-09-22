import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { hashSession, newSession, normalizeWallet, recoverWallet, WALLET_SESSION_COOKIE } from "@/features/flap/auth";
import { walletSchema } from "@/features/flap/schemas";
import { enforceRateLimit, jsonProblem, readSmallJson, RequestProblem } from "@/server/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "flap-auth-verify", 10);
    const body = await readSmallJson(request, 4096) as { wallet?: string; nonce?: string; signature?: string };
    const parsed = walletSchema.safeParse(body.wallet);
    if (!parsed.success || !body.nonce || !/^0x[a-fA-F0-9]{130,}$/.test(body.signature ?? "")) throw new RequestProblem(400, "Invalid authentication payload");
    const db = getDatabase();
    const rows = await db.execute<{ wallet: string; message: string }>(sql`SELECT wallet, message FROM flap_wallet_challenges WHERE nonce = ${body.nonce} AND used_at IS NULL AND expires_at > now()`);
    const challenge = rows.rows[0];
    if (!challenge || normalizeWallet(challenge.wallet) !== normalizeWallet(parsed.data)) throw new RequestProblem(401, "Authentication challenge is invalid or expired");
    const recovered = await recoverWallet(challenge.message, body.signature as `0x${string}`);
    if (recovered !== normalizeWallet(parsed.data)) throw new RequestProblem(401, "Wallet signature does not match the wallet address");
    const session = newSession();
    await db.execute(sql`UPDATE flap_wallet_challenges SET used_at = now(), session_hash = ${hashSession(session)}, session_expires_at = now() + interval '30 days' WHERE nonce = ${body.nonce}`);
    await db.execute(sql`INSERT INTO flap_profiles (wallet, verified_at, updated_at) VALUES (${recovered}, now(), now()) ON CONFLICT (wallet) DO UPDATE SET verified_at = now(), updated_at = now()`);
    const headers = new Headers({ "Cache-Control": "no-store", "Set-Cookie": `${WALLET_SESSION_COOKIE}=${session}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax` });
    return Response.json({ ok: true, wallet: recovered }, { headers });
  } catch (error) { return jsonProblem(error); }
}
