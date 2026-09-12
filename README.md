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

## Updating the numbers

All market figures are hardcoded snapshots (static hosting can't call market APIs
without CORS/proxy work). To refresh, edit these spots in `index.html`:

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

- The global pet counter uses the claude.ai artifact runtime (`window.claude`); on
  normal hosting that API doesn't exist and the code silently degrades — pets still
  count per-visitor in the page session. Safe to leave as is, or rip out the
  `claude.use('db')` block and just keep the local counter.
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
