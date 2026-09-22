import { fmtMcap } from "@/features/flap/format";

export type ShareDetails = { score: number; newAth: boolean; rank: number | null; weekly?: boolean; challengeLabel?: string; verified?: boolean };

export function buildShareText({ score, newAth, rank, weekly, challengeLabel, verified }: ShareDetails) {
  const ranked = rank ? ` and ranked #${rank} on the leaderboard` : "";
  const challenge = weekly ? ` in the BITCAT Flap weekly challenge${challengeLabel ? ` (${challengeLabel})` : ""}` : " on BITCAT Flap";
  const proof = weekly && verified ? " Verified run." : "";
  return `${newAth ? "New ATH! " : ""}I hit ${fmtMcap(score)} MCAP flapping through the candles${challenge} 🐱${ranked}.${proof} Can you beat it?`;
}

export function xIntentUrl(text: string, url: string) {
  return "https://x.com/intent/post?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(url);
}
