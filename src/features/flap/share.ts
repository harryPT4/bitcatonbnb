import { fmtMcap } from "@/features/flap/format";

export type ShareDetails = { score: number; newAth: boolean; rank: number | null };

export function buildShareText({ score, newAth, rank }: ShareDetails) {
  const ranked = rank ? ` and ranked #${rank} on the leaderboard` : "";
  return `${newAth ? "New ATH! " : ""}I hit ${fmtMcap(score)} MCAP flapping through the candles on BITCAT Flap 🐱${ranked}. Can you beat it?`;
}

export function xIntentUrl(text: string, url: string) {
  return "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
}
