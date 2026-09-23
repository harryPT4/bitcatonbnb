// Trusted static HTML; retain IDs used by the homepage scripts.
export const marketMarkup = `  <section id="market" class="term-sec">
    <div class="wrap">
      <div class="terminal">
        <div class="term-head">
          <div class="term-pair">BITCAT / BTCB · PancakeSwap v2</div>
          <div class="term-price">
            <span class="big" id="termPrice">$0.000388</span>
            <span class="chip" id="termChg">24h</span>
          </div>
          <div class="term-tabs">
            <button class="ttab on" data-range="24h" type="button" aria-pressed="true">24H</button>
            <button class="ttab" data-range="7d" type="button" aria-pressed="false">SINCE BIRTH</button>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas id="chart" height="240" aria-label="BITCAT price chart"></canvas>
          <div class="chart-tip" id="chartTip" hidden></div>
        </div>
        <div class="term-foot">
          <span id="chartTag">snapshot · sept 12</span>
          <span>data: geckoterminal · <a href="https://dexscreener.com/bsc/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">full chart ↗</a></span>
        </div>
      </div>
    </div>
  </section>

`;

export const howMarkup = `  <section id="how" class="alt">
    <div class="wrap">
      <p class="sec-eyebrow">How it pays</p>
      <h2>The cat hunts. You get fed.</h2>
      <p class="sec-lede">The mechanism is dead simple and fully on-chain — verifiable on the Flap vault page any time.</p>
      <div class="steps">
        <div class="step">
          <div class="glyph">🐾</div>
          <h3>1 · Adopt</h3>
          <p>Buy and hold at least <strong>10,000 BITCAT</strong>. That's your adoption paper — it makes your wallet dividend-eligible.</p>
          <div class="fine" id="adoptCost">≈ $3.88 at today’s price · anyone can adopt.</div>
        </div>
        <div class="step">
          <div class="glyph">🎯</div>
          <h3>2 · The cat hunts</h3>
          <p>Every buy and every sell pays a <strong>1% tax</strong>. 100% of it — not a slice — goes to the dividend vault. No team cut, no marketing wallet.</p>
          <div class="fine">verified on flap.sh vault page</div>
        </div>
        <div class="step">
          <div class="glyph">🍣</div>
          <h3>3 · You get fed</h3>
          <p>The vault pays out in <strong>BTCB — Bitcoin on BNB Chain</strong>. Payouts over ~$4 land automatically; smaller crumbs claimable any time, down to $0.001.</p>
          <div class="fine">no staking · no lockups · smaller payouts may need a claim</div>
        </div>
      </div>
    </div>
  </section>

`;

export const calculatorMarkup = `  <section id="calc" class="alt">
    <div class="wrap">
      <p class="sec-eyebrow">Sats calculator</p>
      <h2>How many sats does your cat bring home?</h2>
      <p class="sec-lede">Try your bag size. The estimate uses the full 1B supply, so it stays conservative when only eligible wallets share rewards.</p>
      <div class="calc">
        <div>
          <div class="field">
            <label for="hold">Your BITCAT bag</label>
            <input type="number" id="hold" value="1000000" min="0" step="10000" inputmode="numeric">
            <input type="range" id="holdRange" min="0" max="20000000" step="100000" value="1000000" aria-label="BITCAT bag size">
          </div>
          <div class="field">
            <label for="vol">24h volume (USD)</label>
            <input type="number" id="vol" value="197405" min="0" step="10000" inputmode="decimal">
          </div>
          <div class="field">
            <label for="btcp">BTC price (USD)</label>
            <input type="number" id="btcp" value="77218" min="1" step="500" inputmode="decimal">
          </div>
        </div>
        <div class="calc-out" aria-live="polite">
          <div class="big"><span id="outBtcb">0.00005860</span> <small>BTCB/day</small></div>
          <div class="mid">≈ <span id="outSats">5,860</span> sats · $<span id="outUsd">4.60</span>/day · $<span id="outMo">138</span>/mo</div>
          <div class="eligible yes" id="eligible">✓ eligible threshold met</div>
          <div class="calc-guidance" id="calcGuidance">Your bag clears the 10,000 BITCAT eligibility threshold.</div>
          <div class="calc-actions">
            <a id="calcBuy" href="https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">Adopt more</a>
            <button id="shareCalc" type="button">Download sats postcard</button>
          </div>
          <div class="postcard-status" id="postcardStatus" aria-live="polite"></div>
          <div class="note">
            Illustrative only: daily payout ≈ total traded volume × 1% per trade × your share of the 1B supply.
            Buys and sells are already included in total volume. Below 10,000 BITCAT the estimate is zero. Actual rewards depend on eligible supply, distribution timing, and contract operation.
          </div>
        </div>
      </div>
    </div>
  </section>

`;

export const vaultMarkup = `  <section id="vault" class="dark">
    <div class="wrap">
      <p class="sec-eyebrow">Rewards vault</p>
      <h2>The vault never sleeps.</h2>
      <p class="sec-lede">Read straight from the dividend contract on BNB Chain — no middleman. Every number here is verifiable on-chain.</p>
      <div class="vault-grid">
        <div class="vault-tiles">
          <div class="vault-tile">
            <div class="k"><span class="live-dot off" id="vaultDot"></span> In the vault</div>
            <div class="v" id="vaultBal">0.08551274 BTCB</div>
            <div class="sub" id="vaultBalSub">not yet in holders’ wallets</div>
          </div>
          <div class="vault-tile">
            <div class="k">Distributed all-time</div>
            <div class="v" id="vaultTotal">0.73096688 BTCB</div>
            <div class="sub" id="vaultTotalSub">≈ 73,096,688 sats · every sat on-chain</div>
          </div>
        </div>
        <div class="vault-feed">
          <h3>Latest feedings</h3>
          <ul class="payList" id="payList">
            <li><span class="who">chain data unavailable in this preview</span><span class="when">see BscScan ↓</span></li>
          </ul>
          <div class="vault-foot">
            BTCB leaving the vault to holders, straight from Transfer events ·
            <a href="https://bscscan.com/address/0xec5f57fde4e02cf83bcbe26c6e7f9a1c456518c1" target="_blank" rel="noopener">vault on BscScan ↗</a>
          </div>
        </div>
      </div>
    </div>
  </section>

`;

export const huntMarkup = `  <section id="hunt">
    <div class="wrap">
      <p class="sec-eyebrow">Field report</p>
      <h2>The hunt log</h2>
      <p class="sec-lede">Real trades from the BITCAT/BTCB pool, as a cat would report them. Every one of these paid the vault.</p>
      <div class="hunt-grid">
        <div class="hunt">
          <div class="hunt-head">
            <h3>Recent catches</h3>
            <span class="tag" id="huntTag">snapshot · 06:14 UTC sept 12</span>
          </div>
          <div class="hunt-theatre" id="huntTheatre" aria-live="polite">
            <span class="hunt-scene-label" id="huntSceneLabel">watching for the next catch…</span>
            <span class="hunt-actor hunt-mouse" aria-hidden="true">🐭</span>
            <span class="hunt-actor hunt-hairball" aria-hidden="true"></span>
            <span class="hunt-actor hunt-crumb" aria-hidden="true">₿</span>
            <span class="hunt-bowl" aria-hidden="true"></span>
          </div>
          <ul id="huntList"></ul>
          <div class="hunt-foot">
            <span id="huntFootNote">live data unavailable here — showing a real snapshot from sept 12.</span>
            full feed: <a href="https://dexscreener.com/bsc/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">DexScreener ↗</a>
          </div>
        </div>
        <div class="purr">
          <h3>Purr-o-meter</h3>
          <p class="sub">24h volume, measured in purr intensity</p>
          <svg id="purrGauge" viewBox="0 0 300 190" width="100%" style="max-width:300px" aria-label="Purr gauge: the needle shows 24-hour trading volume against an auto-scaled maximum">
            <g id="gZones"></g>
            <g id="gTicks" font-family="IBM Plex Mono, monospace" font-size="11" fill="#8C8477"></g>
            <line id="needle" x1="150" y1="158" x2="150" y2="66" stroke="#15120E" stroke-width="4" stroke-linecap="round"/>
            <circle class="g-hub" cx="150" cy="158" r="8"/>
            <circle class="g-hub-dot" cx="150" cy="158" r="3"/>
          </svg>
          <div class="purr-read" id="purrRead"></div>
          <div class="purr-fine">
            soft purr · steady purr · deep rumble · MEGA&nbsp;PURR<br>
            The model assumes a 1% fee on each trade, allocated to the rewards vault
          </div>
        </div>
      </div>
    </div>
  </section>

`;

export const milestonesMarkup = `  <section id="milestones" class="alt">
    <div class="wrap">
      <p class="sec-eyebrow">Community scoreboard</p>
      <h2>The cat is collecting milestones.</h2>
      <p class="sec-lede">Live where a public source is available, and plainly labeled when the number is an indexed snapshot.</p>
      <div class="milestone-board">
        <article class="milestone-card">
          <div class="milestone-top"><h3>Sats distributed</h3><span class="milestone-value" id="mileSatsValue">73,096,688 / 100M</span></div>
          <div class="milestone-track marked" style="--marker:75%"><span class="milestone-fill" id="mileSatsFill"></span></div>
          <div class="milestone-source">markers: 75M then 100M · <a href="https://bscscan.com/address/0xec5f57fde4e02cf83bcbe26c6e7f9a1c456518c1" target="_blank" rel="noopener">BNB Chain vault ↗</a></div>
        </article>
        <article class="milestone-card">
          <div class="milestone-top"><h3>Holder goal</h3><span class="milestone-value" id="mileHoldersValue">1,961 / 5,000*</span></div>
          <div class="milestone-track marked" style="--marker:40%"><span class="milestone-fill" id="mileHoldersFill"></span></div>
          <div class="milestone-source">markers: 2,000 then 5,000 · <a href="https://www.geckoterminal.com/bsc/pools/0xd09e60fb451cdc6e1fcd0e1dee6db553e89dafa9" target="_blank" rel="noopener">GeckoTerminal index ↗</a></div>
        </article>
        <article class="milestone-card">
          <div class="milestone-top"><h3>One full BTCB paid</h3><span class="milestone-value" id="mileBtcbValue">0.73096688 / 1</span></div>
          <div class="milestone-track"><span class="milestone-fill" id="mileBtcbFill"></span></div>
          <div class="milestone-source">same on-chain distributed total · one BTCB = 100,000,000 sats</div>
        </article>
        <article class="milestone-card">
          <div class="milestone-top"><h3>Community pets</h3><span class="milestone-value" id="milePetsValue">0 / 1,000</span></div>
          <div class="milestone-track"><span class="milestone-fill" id="milePetsFill"></span></div>
          <div class="milestone-source">shared site pet counter · next goals: 1K, 2.5K, 5K</div>
        </article>
      </div>
      <p class="milestone-note">*The public token feed supplies an indexed holder count. The ≥10,000 BITCAT eligibility rule comes from the vault; an exact eligible-wallet count needs a separate indexed balance query.</p>
    </div>
  </section>

`;

export const bowlMarkup = `  <section id="bowl" class="alt">
    <div class="wrap">
      <p class="sec-eyebrow">Dividend check</p>
      <h2>Check your bowl</h2>
      <p class="sec-lede">Paste your wallet address to jump straight to your BTCB dividends and holdings.</p>
      <div class="bowl">
        <label for="addr">Your BNB Chain address</label>
        <div class="bowl-row">
          <input type="text" id="addr" placeholder="0x…" spellcheck="false" autocomplete="off">
        </div>
        <div class="bowl-err" id="bowlErr">That doesn't look like a BNB Chain address — expected 0x followed by 40 hex characters.</div>
        <div class="bowl-links" id="bowlLinks" hidden>
          <a id="bowlFlap" href="#" target="_blank" rel="noopener">🍜 Your bowl on Flap</a>
          <a id="bowlScan" href="#" target="_blank" rel="noopener">🔎 Holdings on BscScan</a>
        </div>
        <p class="bowl-fine">
          Flap's vault page shows pending &amp; paid BTCB once you connect — including a "claim for another user" option.
          Your address stays in your browser; this page sends nothing anywhere.
        </p>
      </div>
    </div>
  </section>

`;

export const contractMarkup = `  <section class="dark">
    <div class="wrap">
      <div class="ca-strip">
        <p class="sec-eyebrow" style="margin-bottom:8px">Contract address</p>
        <h2>Lucky sevens, on-chain.</h2>
        <p class="lucky">The contract itself ends in 7777. Even the address landed on its feet.</p>
        <div class="ca-box">
          <code id="caText">0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea<b>7777</b></code>
          <button class="copy-btn" id="copyBtn" type="button">Copy CA</button>
        </div>
      </div>
    </div>
  </section>
`;
