export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ANCHOR = Date.UTC(1970, 0, 5);
export type WeeklyChallenge = { key: string; label: string; weekStartsAt: string; nextStartsAt: string; seed: number };
export function seedFromChallengeKey(key: string) {
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) || 1;
}
export function getWeeklyChallenge(now = new Date()): WeeklyChallenge {
  const start = new Date(ANCHOR + Math.floor((now.getTime() - ANCHOR) / WEEK_MS) * WEEK_MS);
  const next = new Date(start.getTime() + WEEK_MS);
  const key = start.toISOString().slice(0, 10);
  return { key, label: `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`, weekStartsAt: start.toISOString(), nextStartsAt: next.toISOString(), seed: seedFromChallengeKey(key) };
}
