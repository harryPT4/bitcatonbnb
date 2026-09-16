import { mkdir, readFile, writeFile } from "node:fs/promises";

const source = await readFile("legacy/index.html", "utf8");
const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);
const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const bodyStart = source.indexOf("<div id=\"scrollbar\"");
const finalScriptStart = source.lastIndexOf("<script>");

if (!styleMatch || scripts.length < 2 || bodyStart < 0 || finalScriptStart < 0) {
  throw new Error("Could not locate the legacy homepage sections");
}

let markup = source.slice(bodyStart, finalScriptStart).trim();
const landingEnhancements = `

/* Next.js integration: game discovery */
#huntList li.fresh { animation: none; }
.nav-play { display: inline-flex; align-items: center; gap: 0.4rem; }
.nav-play-badge {
  border-radius: 999px;
  padding: 0.15rem 0.4rem;
  background: var(--gold-b);
  color: #15120e;
  font: 700 0.58rem/1 var(--mono);
  letter-spacing: 0.06em;
}
.game-promo { padding: 0 0 3.5rem; }
.game-promo-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.25rem;
  align-items: center;
  padding: 1.35rem 1.5rem;
  border: 1px solid var(--gold-edge);
  border-radius: 18px;
  background: linear-gradient(120deg, var(--card), var(--hero-glow));
  box-shadow: 0 14px 38px var(--shade);
}
.game-promo-icon {
  width: 58px;
  height: 58px;
  object-fit: contain;
  border-radius: 14px;
  background: #0d0f14;
  padding: 7px;
}
.game-promo-copy strong { display: block; font-family: var(--display); font-size: clamp(1.05rem, 2vw, 1.35rem); }
.game-promo-copy span { color: var(--ink-dim); font-size: 0.92rem; }
.game-promo-cta {
  white-space: nowrap;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--display);
  font-size: 0.82rem;
  text-decoration: none;
}
.game-promo-cta:hover { background: var(--gold-b); color: #15120e; }
@media (max-width: 700px) {
  .game-promo { padding-bottom: 2.5rem; }
  .game-promo-card { grid-template-columns: auto 1fr; padding: 1rem; gap: 0.85rem; }
  .game-promo-icon { width: 48px; height: 48px; }
  .game-promo-cta { grid-column: 1 / -1; text-align: center; }
}
`;

const styles = styleMatch[1]
  .trimStart()
  .replace("--ink-faint:#8C8477;", "--ink-faint:#6D655A;")
  .replace("--gold:#A87308;", "--gold:#8A5B00;")
  .replace("--good:#2E7D4F;", "--good:#246C40;") + landingEnhancements;
const homeScript = scripts.at(-1)[1].trimStart().replaceAll("#A87308", "#8A5B00");
const embeddedImages = [...markup.matchAll(/src="data:image\/[^;]+;base64,[^"]+"/g)];
const replacements = [
  'src="/assets/bitcat-pfp.jpg"',
  'src="/assets/bitcoin-avatar.jpg"',
  'src="/assets/bitcat-pfp.jpg"',
  'src="/assets/bitcat-banner.jpg"',
];

if (embeddedImages.length !== replacements.length) {
  throw new Error(`Expected ${replacements.length} embedded homepage images, found ${embeddedImages.length}`);
}

embeddedImages.forEach((match, index) => {
  markup = markup.replace(match[0], replacements[index]);
});
markup = markup.replaceAll('src="assets/', 'src="/assets/');
markup = markup.replaceAll('src="media/', 'src="/media/');
markup = markup.replace(
  '<nav class="nav-links" id="siteNav" aria-label="Site">',
  '<nav class="nav-links" id="siteNav" aria-label="Site">\n      <a class="nav-play" href="/games/flap">Play <span class="nav-play-badge">NEW</span></a>',
);
markup = markup.replace(
  '  <section id="market" class="term-sec">',
  `  <section class="game-promo" aria-labelledby="gamePromoTitle">
    <div class="wrap">
      <div class="game-promo-card">
        <img class="game-promo-icon" src="/assets/flap-cat.png" alt="">
        <div class="game-promo-copy">
          <strong id="gamePromoTitle">Flap through the candles</strong>
          <span>Play instantly, build your market cap and publish your best run to the community leaderboard.</span>
        </div>
        <a class="game-promo-cta" href="/games/flap">Play BITCAT Flap →</a>
      </div>
    </div>
  </section>

  <section id="market" class="term-sec">`,
);
markup = markup.replace(
  '<nav class="foot-links" aria-label="External links">',
  '<nav class="foot-links" aria-label="External links">\n      <a href="/games/flap">Play Flap</a>',
);
markup = markup.replace(
  '<a href="#market">Chart</a>\n  <a href="#bowl">Rewards</a>',
  '<a href="/games/flap">Play</a>\n  <a href="#bowl">Rewards</a>',
);

await mkdir("src/content", { recursive: true });
await mkdir("src/styles", { recursive: true });
await mkdir("public/scripts", { recursive: true });
await mkdir("legacy", { recursive: true });

await writeFile(
  "src/content/home-markup.ts",
  `// Generated from the original static homepage. Keep dynamic data out of this trusted markup.\nexport const homeMarkup = ${JSON.stringify(markup)};\n`,
);
await writeFile("src/styles/home.css", styles);
await writeFile("public/scripts/home.js", homeScript);
await writeFile("public/scripts/theme-init.js", scripts[0][1].trimStart());

console.log("Migrated the legacy homepage into the Next.js source tree.");
