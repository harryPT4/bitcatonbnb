import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { authMessage, newNonce, normalizeWallet } from "@/features/flap/auth";
import { walletSchema } from "@/features/flap/schemas";
import { enforceRateLimit, jsonProblem, readSmallJson, RequestProblem } from "@/server/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "flap-auth", 10);
    const body = await readSmallJson(request, 2048) as { wallet?: string };
    const parsed = walletSchema.safeParse(body.wallet);
    if (!parsed.success) throw new RequestProblem(400, "Invalid wallet address");
    const wallet = normalizeWallet(parsed.data);
    const nonce = newNonce();
    const issuedAt = new Date().toISOString();
    const message = authMessage(wallet, nonce, issuedAt);
    await getDatabase().execute(sql`INSERT INTO flap_wallet_challenges (nonce, wallet, message, expires_at) VALUES (${nonce}, ${wallet}, ${message}, now() + interval '10 minutes')`);
    return Response.json({ ok: true, nonce, message, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return jsonProblem(error); }
}
