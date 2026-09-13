# BITCAT — bitcatbnb.site

Landing page for **$BITCAT**, the community-run (CTO) "official Bitcoin Cat" on BNB Chain.
Hold 10,000+ BITCAT → earn BTCB dividends from the 1%/1% trade tax (100% redistributed via the Flap vault).

- CA: `0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777`
- X: [@BitcatBNB](https://x.com/bitcatbnb) · [Bitcat x BTC community](https://x.com/i/communities/1845350529490403676)
- Trade: [Flap](https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777) · [DexScreener](https://dexscreener.com/bsc/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777)

## Structure

Everything is one self-contained file — **`index.html`** — with the pfp and banner
embedded as data URIs (no external requests except Google Fonts).
`assets/` holds the source images for reference; the page doesn't load them at runtime.

The favicon is `assets/favicon.png` — the pfp circle-masked to 128×128 with transparent
corners and a thin gold rim, generated with:

```
ffmpeg -i assets/bitcat-pfp.jpg -vf "scale=128:128,format=rgba,geq=\
r='if(gte(hypot(X-63.5,Y-63.5),60),227,r(X,Y))':\
g='if(gte(hypot(X-63.5,Y-63.5),60),162,g(X,Y))':\
b='if(gte(hypot(X-63.5,Y-63.5),60),26,b(X,Y))':\
a='clip((63.0-hypot(X-63.5,Y-63.5))*255,0,255)'" assets/favicon.png
```

The apple-touch-icon stays the square JPEG on purpose — iOS applies its own rounded
mask and paints transparency black.

## The origin tweet card

The card in the origin story reproduces the real post that started BITCAT —
[x.com/Bitcoin/status/2097486083734884435](https://x.com/Bitcoin/status/2097486083734884435) —
and the whole card links there. Text, timestamp, view count and engagement were read
off the post on Sept 12, 2026; the counts are a **snapshot** and will drift. The
attached picture is the same cat artwork as the pfp, so the card reuses that embedded
image rather than hotlinking X's CDN (which blocks cross-origin use).

## Theme

Taken straight from the pfp art: **paper white, cat black, bitcoin gold.** All colors
are CSS custom properties on `:root` (`--paper`, `--card`, `--ink`, `--gold`,
`--gold-b` bright, `--gold-edge` borders). Nothing is hardcoded in components, so
retinting the whole site means editing that one block.

Black bands are the same components with the tokens inverted: put `class="dark"` on a
section (the marquee, the vault, the contract strip and the footer use it) and every
card, border and label inside flips automatically.

### Two skins, one switch

The button in the header switches between **paper** (default — the pfp palette) and
**night** (the original after-dark skin: near-black with Bitcoin orange). It's the
mascot's own pair of googly eyes: wide open by day, and they blink shut when you put
the page to sleep.

- Night is `:root[data-theme="night"]`, which just re-points the same tokens; `.dark`
  bands get their own night values so they still read as bands on an already-dark page.
- The choice persists in `localStorage` under `bitcat-theme`, and a tiny script at the
  top of the file applies it before first paint so the skin never flashes.
- Canvas and generated SVG can't inherit CSS tokens, so `TC()` in the script returns the
  matching palette for the chart and the purr gauge; the switch repaints both.
- To restyle either skin, edit only the `:root` / `:root[data-theme="night"]` blocks and
  the two palettes in `TC()`.

## Promo clip

`media/bitcat-promo-square.mp4` (1080×1080) and `media/bitcat-promo-vertical.mp4`
(1080×1920) — 8s, 30fps, silent, loop-friendly.

Deliberately **no price or performance figures**: a clip outlives any day's candle, and
for a dividend token the durable pitch is the payout, not the chart. The only number in
it is cumulative BTCB distributed, which is read from the dividend contract at render
time and only ever goes up.

To re-render with fresh numbers:

```
python3 tools/render-server.py            # serves the repo, collects frames/
# open http://localhost:8779/tools/promo-video.html   (?w=1080&h=1920 for 9:16)
# run renderAll() in the page — it fetches live data, draws 240 frames, POSTs each
ffmpeg -framerate 30 -i frames/%04d.jpg -c:v libx264 -preset slow -crf 19 \
       -pix_fmt yuv420p -movflags +faststart media/bitcat-promo-square.mp4
```

## Live data

On normal hosting the page fetches live data on load and every 60s (tab visible):

- **DexScreener** (`api.dexscreener.com`): market cap, 24h volume → stat band, purr-o-meter, calculator default
- **GeckoTerminal** (`api.geckoterminal.com`): recent trades → hunt log; holders count → stat band; OHLCV candles → the price terminal chart (24H = 15-min candles, "since birth" = 4-hour candles). All chart times are UTC; the axis date-stamps its ends whenever the window spans more than one day, so a rolling 24h window doesn't read backwards.

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

### Accuracy rules this page follows

Numbers here are the whole pitch, so the code is deliberately conservative about them:

- **"live" is only claimed over data that is live.** The stat band says "live" only when
  all three of its sources (DexScreener, GeckoTerminal, the BNB Chain RPC) answered,
  "partly live" when some did, and keeps the snapshot wording otherwise.
- **Block time is measured, never assumed.** BSC has gone 3s → 1.5s → 0.75s → 0.45s; the
  payout feed derives seconds-per-block from two live block timestamps, so "N min ago"
  stays true after the next upgrade.
- **Quiet ≠ unreachable.** An empty payout window says "no payouts in the last ~N min",
  not "chain data unavailable".
- **"Since birth" really reaches birth.** The long chart sizes its candle request from the
  on-chain pool-creation time (2026-09-09 00:43:47 UTC) and switches to daily candles
  once 4-hour ones no longer span the token's life.
- **The chain value always beats the animation.** The hero odometer stops animating the
  moment the real figure lands, and settles even if rAF is throttled.
- **Prose avoids hardcoded counts** that would drift out from under the live ones above it.

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
