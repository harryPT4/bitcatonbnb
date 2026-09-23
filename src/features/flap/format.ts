export function fmtMcap(n: number) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(n >= 1e10 ? 1 : 2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  return "$" + n;
}
