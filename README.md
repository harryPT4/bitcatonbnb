# BITCAT — bitcatbnb.site

Landing page for **$BITCAT**, the community-run (CTO) "official Bitcoin Cat" on BNB Chain.
Hold 10,000+ BITCAT → earn BTCB dividends from the 1%/1% trade tax (100% redistributed via the Flap vault).

- CA: `0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777`
- X: [@BitcatBNB](https://x.com/bitcatbnb) · [Bitcat x BTC community](https://x.com/i/communities/1845350529490403676)
- Trade: [Flap](https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777) · [DexScreener](https://dexscreener.com/bsc/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777)

## Structure

Everything is one self-contained file — **`index.html`** — with the pfp and banner
embedded as data URIs (no external requests except Google Fonts).
`assets/` holds the original images for reference only; the page doesn't load them.

## Live data

On normal hosting the page fetches live data on load and every 60s (tab visible):

- **DexScreener** (`api.dexscreener.com`): market cap, 24h volume → stat band, purr-o-meter, calculator default
- **GeckoTerminal** (`api.geckoterminal.com`): recent trades → hunt log; holders count → stat band; OHLCV candles → the price terminal chart (24H = 15-min candles, "since birth" = 4-hour candles)

- **BNB Chain RPC** (publicnode, bsc-dataseed fallback): the rewards vault section —
  `totalDividendsDistributed()` (`0x85a6b3ae`) on the dividend contract
  `0xec5f57fde4e02cf83bcbe26c6e7f9a1c456518c1` (found via the token's
  `dividendContract()` getter — both token and vault are EIP-1167 minimal proxies to
  Flap's shared implementations), the vault's pending BTCB balance, and the payout
  feed from BTCB `Transfer` events out of the vault (last ~8,000 blocks; public
  nodes reject older ranges). BTC's USD price is derived from the pool's own
  priceUsd/priceNative ratio.

When those calls fail or are blocked (e.g. the claude.ai artifact preview), the page
falls back to the baked-in snapshot below and keeps its "at last check" labels.

## Updating the snapshot fallbacks

Not live (no public API): BTCB distributed (Flap vault) and the tax terms.
Fallback values to refresh occasionally in `index.html`:

| What | Where |
|---|---|
| 24h volume (drives the purr-o-meter scale, zones, needle, mood) | `var VOL24 = 230000;` |
| BTCB distributed (hero odometer) | `var TARGET_BTCB = 0.72525425;` and the two lines in the "Bitcoin paid to holders" stat card |
| Market cap / holders / stat cards | the `.stat-band` markup |
| Hunt log trades | the `trades` array |
| Calculator defaults (volume, BTC price) | the `#vol` and `#btcp` input `value` attributes |
| "figures at last check" date | the `.asof` line |

Current data sources: the Flap vault page (`/bnb/<CA>/taxinfo`) for distributed BTCB,
DexScreener/GeckoTerminal for price, volume, and trades.

## Notes

- The global pet counter picks its backend automatically: the claude.ai artifact
  database when the page runs as an artifact, otherwise the free
  [Abacus](https://abacus.jasoncameron.dev) counter API
  (`/get|/hit/bitcat-site/pets` — the key is created on first hit). If both are
  unreachable, pets still count per-visitor locally. Check the public count any
  time: `curl https://abacus.jasoncameron.dev/get/bitcat-site/pets`
- The pfp/banner are the community's X art. If this becomes the official site, get
  the original files from whoever made them.
- Purr-o-meter zone thresholds live in `var bounds = [0, .15, .40, .75, 1]`
  (soft purr / steady purr / deep rumble / MEGA PURR as fractions of the gauge max).

## Hosting

Any static host works — it's a single HTML file:

- **GitHub Pages**: push, then Settings → Pages → deploy from branch (`/` root).
- **Netlify / Vercel**: drag the folder in, or connect the repo — no build step, output dir is the repo root.
- **Cloudflare Pages**: connect repo, framework "None", build command empty, output `/`.

Not financial advice. It's a cat.
