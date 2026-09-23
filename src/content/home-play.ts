// Trusted static HTML; retain IDs used by the homepage scripts.
export const heroMarkup = `  <div class="hero">
    <div class="wrap hero-inner">
      <div>
        <p class="eyebrow">BITCAT · BNB Chain · independently built</p>
        <h1>Still here.<br>Still <em>Bitcat.</em></h1>
        <p class="hero-sub">
          A strange little cat. A rough start. A home worth building.
          Play a round, make something ridiculous, and follow what one holder is building next.
        </p>
        <p class="hero-meow">"meow meow" — the cat, on most subjects</p>
        <div class="hero-ctas">
          <a class="btn-primary" href="/games/flap">Play BITCAT Flap</a>
          <a class="btn-ghost" href="#make">Make a meme</a>
        </div>
        <p class="hero-fine">Free to explore and play. No token purchase needed.</p>
      </div>
      <div>
        <div class="cat-stage" id="catStage">
          <div class="cat-tilt" id="catTilt">
            <div class="cat-wrap">
          <img id="catImg" src="/assets/bitcat-pfp.jpg" alt="Bitcat — the official profile art: a tall black cat with googly eyes and a Bitcoin at its side. Click to pet.">
            <div class="callout co-l" aria-hidden="true">THE MASCOT<span class="co-line"></span></div>
            <div class="callout co-r" aria-hidden="true"><span class="co-line"></span>STILL HERE</div>
          </div>
            <button class="cat-hotspot head" type="button" data-cat-action="head" aria-label="Pet Bitcat's head"></button>
            <button class="cat-hotspot belly" type="button" data-cat-action="belly" aria-label="Poke Bitcat's belly"></button>
            <button class="cat-hotspot bitcoin" type="button" data-cat-action="bitcoin" aria-label="Tap Bitcat's Bitcoin"></button>
          </div>
          <div class="cat-speech" id="catSpeech" role="status" aria-live="polite"></div>
        </div>
        <div class="pet-row">
          <span class="pet-hint">pet once daily · <strong><span id="petCount">0</span> pets</strong> worldwide</span>
          <span class="streak-chip" id="streakChip"></span>
          <span class="mood-chip" id="catMood" aria-live="polite">live mood · <b>steady purr</b></span>
          <button class="mouse-streak-chip" id="mouseHint" type="button">daily mouse hunt · ready</button>
          <p class="companion-hint" id="companionHint">move nearby · pet the head · poke the belly · tap the Bitcoin</p>
        </div>
      </div>
    </div>

    <div class="wrap">
      <aside class="status-note" aria-label="Current project status">
        <strong>Current status · independently maintained</strong>
        <p>There is no active team. The original developer and later CTO lead have left, and access to the former main X account was lost. One holder maintains this site. Trading activity is currently very low; market cap and volume can change sharply and third-party figures may lag. This site makes no promise of a price recovery or future token outcome.</p>
        <nav class="status-links" aria-label="Verify Bitcat information">
          <a href="https://bscscan.com/token/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777#balances" target="_blank" rel="noopener">Contract &amp; holders ↗</a>
          <a href="https://dexscreener.com/bsc/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">Market feed ↗</a>
          <a href="https://flap.sh/bnb/0x7d1a8dbb40b7b5518ef69b93a6fAEba91eea7777/taxinfo" target="_blank" rel="noopener">Rewards vault ↗</a>
          <a href="#story">Project history ↓</a>
        </nav>
      </aside>
      <div class="stat-band">
        <div class="stat">
          <div class="k">BTCB paid to holders</div>
          <div class="v orange" id="satsOdo">0.73096688 BTCB</div>
          <div class="sub" id="odoSub">≈ 73,096,688 sats distributed</div>
        </div>
        <div class="stat">
          <div class="k">Trade tax → holders</div>
          <div class="v">1% / 1% → 100%</div>
          <div class="sub">every buy &amp; sell feeds the cat</div>
        </div>
        <div class="stat">
          <div class="k">Holders</div>
          <div class="v" id="statHolders">1,961</div>
          <div class="sub" id="statHoldersSub">eligible above 10,000 BITCAT</div>
        </div>
        <div class="stat">
          <div class="k">Market cap estimate</div>
          <div class="v" id="statMcap">—</div>
          <div class="sub" id="statMcapSub">checking the live market feed</div>
        </div>
      </div>
      <p class="asof" id="asofLine">Checking public data sources. Figures can be delayed; verify using the linked sources above.</p>
    </div>
  </div>

`;

export const gamePromoMarkup = `  <section class="game-promo" aria-labelledby="gamePromoTitle">
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

`;
