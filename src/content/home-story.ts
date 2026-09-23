// Trusted static HTML; retain IDs used by the homepage scripts.
export const marqueeMarkup = `  <div class="marquee dark" aria-hidden="true">
    <div class="marquee-track" id="marqueeTrack">
      <span>🐈‍⬛ a black cat crossing your path — <b>probably looking for a mouse</b></span>
      <span>"why is it so heavy? <b>pull pull pull !!</b>"</span>
      <span>"me and my owner <b>just staring at the chart all day</b>"</span>
      <span>one more round. <b>one more ridiculous meme.</b></span>
      <span>the cat is <b>still here.</b></span>
      <span>CA ends in <b>7777</b> — even the address landed on its feet</span>
      <span><b>meow meow</b></span>
    </div>
  </div>

`;

export const storyMarkup = `  <section id="story">
    <div class="wrap">
      <p class="sec-eyebrow">Origin story</p>
      <h2>Bitcat spawned in these conditions.</h2>
      <p class="sec-lede">Inspired by a cat posted by @Bitcoin. This token and website are independent; the post is not an endorsement.</p>
      <div class="timeline">
        <div class="beat">
          <div class="dot">🐦</div>
          <div>
            <div class="when">Sept 9, 2026</div>
            <h3>The tweet</h3>
            <a class="tweet-card" href="https://x.com/Bitcoin/status/2097486083734884435" target="_blank" rel="noopener"
               aria-label="Open the original post by @Bitcoin from September 9, 2026 on X">
              <span class="tweet-head">
                <img class="tweet-av" src="/assets/bitcoin-avatar.jpg" alt="">
                <span class="tweet-who">
                  <b>Bitcoin</b>
                  <svg class="tweet-badge" viewBox="0 0 24 24" aria-label="Verified account"><path fill="#1D9BF0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>
                  <span>@Bitcoin</span>
                </span>
                <span class="tweet-x">𝕏</span>
              </span>
              <span class="tweet-body">$78,573.43 <em>#Bitcoin</em></span>
              <img class="tweet-media" src="/assets/bitcat-pfp.jpg" alt="The image attached to the post: a tall black cat sitting beside a gold Bitcoin coin.">
              <span class="tweet-meta">00:43 UTC · Sep 9, 2026 · 324.7K views</span>
              <span class="tweet-stats">335 replies · 434 reposts · 1,681 likes <span class="tweet-asof">(Sep 12)</span><span class="tweet-open">View on X ↗</span></span>
            </a>
            <p>A price post, a black cat, a Bitcoin at its side. The community reads the omen instantly: <q>sooo that means the cat has $BTC rewards for us 👀</q></p>
          </div>
        </div>
        <div class="beat">
          <div class="dot">🚀</div>
          <div>
            <div class="when">Sept 9, 2026 · 00:43 UTC</div>
            <h3>The launch, one second later</h3>
            <p>The BITCAT/BTCB pool is created at <strong>00:43:47 UTC</strong> — one second after the post — with a programmable vault wired in: 1% on every buy, 1% on every sell, 100% of it paid back to holders in BTCB. <span class="beat-src">pool creation timestamp: DexScreener &amp; GeckoTerminal</span></p>
          </div>
        </div>
        <div class="beat dead">
          <div class="dot">🪦</div>
          <div>
            <div class="when">Shortly after</div>
            <h3>The original developer leaves</h3>
            <p>According to the site maintainer, the developer sold and left after launch. Contract ownership is renounced. That does not put the website, social accounts, or liquidity under community control.</p>
          </div>
        </div>
        <div class="beat">
          <div class="dot">🤝</div>
          <div>
            <div class="when">The takeover</div>
            <h3>The community adopts the cat</h3>
            <p>A major holder organized a community takeover (CTO) after the developer left. This was a later effort, separate from the original launch.</p>
          </div>
        </div>
        <div class="beat">
          <div class="dot">📈</div>
          <div>
            <div class="when">After the takeover</div>
            <h3>A second departure</h3>
            <p>The maintainer reports that access to the main X account was lost, the CTO lead sold and left, and other large holders followed. Trust and activity fell. The former account is not controlled by this website’s maintainer.</p>
          </div>
        </div>
        <div class="beat">
          <div class="dot">06</div>
          <div>
            <div class="when">Current chapter · September 23, 2026</div>
            <h3>One person is still building</h3>
            <p>One holder built and deployed this website and continues to maintain it. The Flap game was contributed by a community member while the CTO was active; it is part of the community’s work, not a solo creation. There is no active team behind the site today. Anyone can play, make a meme, test a feature, or offer a small contribution.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="banner-band">
    <img src="/assets/bitcat-banner.jpg" alt="The community's BITCAT CTO banner: the cat on a black-marble throne surrounded by gold Bitcoin, city skyline behind.">
  </div>

`;

export const receiptsMarkup = `  <section id="receipts">
    <div class="wrap">
      <p class="sec-eyebrow">Receipts</p>
      <h2>Where the cat has been spotted.</h2>
      <p class="sec-lede">No screenshots, no claims you have to take on faith. Every tile opens the source.</p>
      <div class="receipts">
        <a class="receipt" href="https://x.com/Bitcoin/status/2097486083734884435" target="_blank" rel="noopener">
          <span class="src"><span>𝕏 · @Bitcoin</span><span>↗</span></span>
          <h3>The post that spawned it</h3>
          <p>A price update, a black cat, a Bitcoin at its side. The community read it as an omen and launched within the minute.</p>
          <div class="meta">Sep 9, 2026 · 324.7K views</div>
        </a>
        <a class="receipt" href="https://x.com/bsc_daily/status/2097626072443453698" target="_blank" rel="noopener">
          <span class="src"><span>𝕏 · @bsc_daily</span><span>↗</span></span>
          <h3>First on BSCDaily’s 24h memecoin spotlight</h3>
          <p>“Spotlight Memecoin on BNB CHAIN Last 24H” — BITCAT listed at the top, then featured again in the same account’s 7-day spotlight two days later.</p>
          <div class="meta">Sep 9 &amp; Sep 11, 2026 · 27.6K views on the first</div>
        </a>
        <a class="receipt" href="https://flap.sh/bnb/0x7d1a8dbb40b7b5518ef69b93a6faeba91eea7777/taxinfo" target="_blank" rel="noopener">
          <span class="src"><span>Flap launchpad</span><span>↗</span></span>
          <h3>The vault, in public</h3>
          <p>Tax rates, dividend share and every BTCB distribution, on the launchpad’s own page — not on ours.</p>
          <div class="meta">1% / 1% · 100% to holders · BTCB</div>
        </a>
        <a class="receipt" href="https://bscscan.com/token/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777#balances" target="_blank" rel="noopener">
          <span class="src"><span>BscScan · DexScreener · GeckoTerminal</span><span>↗</span></span>
          <h3>Check the numbers yourself</h3>
          <p>Supply, taxes, holders, every trade and every payout are public. This page reads the same sources you can.</p>
          <div class="meta">contract 0x7d1A…7777 · vault 0xec5f…18c1</div>
        </a>
      </div>
      <p class="receipts-note">the cat prefers evidence to adjectives.</p>
    </div>
  </section>

`;

export const faqMarkup = `  <section id="faq">
    <div class="wrap">
      <p class="sec-eyebrow">Straight answers</p>
      <h2>Before you adopt the cat.</h2>
      <p class="sec-lede">The useful details, without making you hunt through the whole page.</p>
      <div class="faq">
        <details>
          <summary>Who runs this site?</summary>
          <p>One holder independently built, deployed, and maintains it. Bitcat has no formal team. The original developer and later CTO lead have left, and the maintainer does not control the former main X account.</p>
        </details>
        <details>
          <summary>Does renounced ownership mean the token is safe?</summary>
          <p>No. Renouncing ownership does not guarantee liquidity, prevent large holders from selling, or guarantee rewards. This website does not control the token contract or promise recovery.</p>
        </details>
        <details>
          <summary>What is BTCB?</summary>
          <p>BTCB is a tokenized form of Bitcoin used on BNB Chain. BITCAT’s dividend vault distributes BTCB, not native Bitcoin on the Bitcoin network.</p>
        </details>
        <details>
          <summary>Who is eligible for rewards?</summary>
          <p>Wallets holding at least 10,000 BITCAT are dividend-eligible. There is no staking or lockup; eligibility and payouts are handled by the on-chain dividend system.</p>
        </details>
        <details>
          <summary>Are dividends guaranteed?</summary>
          <p>No. Rewards depend on trading volume, eligible supply and the contract’s operation. The calculator is illustrative, and the token itself has no guaranteed value.</p>
        </details>
        <details>
          <summary>Do I need to connect my wallet here?</summary>
          <p>No. This page never asks for a wallet connection. The bowl checker only builds links to Flap and BscScan in your browser so you can verify holdings and rewards there.</p>
        </details>
        <details>
          <summary>Where can I verify the numbers?</summary>
          <p>Use the linked Flap vault, BscScan contract, DexScreener and GeckoTerminal pages. They are the same public sources used by this site’s live-data panels.</p>
        </details>
      </div>
    </div>
  </section>

`;

export const livesMarkup = `  <section id="lives">
    <div class="wrap">
      <p class="sec-eyebrow">The build board</p>
      <h2>Nine lives</h2>
      <p class="sec-lede">Small things that make this a better place to spend a few minutes. Live features and possible next steps, maintained by one person.</p>
      <div class="lives">
        <div class="life done"><h3>A home for the cat</h3><p>Available: an independently maintained website, in paper and night themes.</p></div>
        <div class="life done"><h3>Flap through candles</h3><p>Available: instant guest play and a public score board.</p></div>
        <div class="life done"><h3>The daily mouse</h3><p>Available: find the hidden mouse and keep your local streak.</p></div>
        <div class="life done"><h3>Make a little chaos</h3><p>Available: caption the cat and download your meme.</p></div>
        <div class="life done"><h3>Follow the receipts</h3><p>Available: market and vault panels linked to public sources.</p></div>
        <div class="life done"><h3>A fresh challenge</h3><p>Available: weekly Flap layout and leaderboard; wallet verification is only needed to submit a ranked score.</p></div>
        <div class="life"><h3>Your cat, your style</h3><p>Exploring: cosmetic game rewards earned through play.</p></div>
        <div class="life"><h3>A wall of good weirdness</h3><p>Exploring: a credited gallery of community art and memes.</p></div>
        <div class="life"><h3>More hands</h3><p>Open invitation: a drawing, a bug report, an idea, or a little code.</p></div>
      </div>
      <p class="lives-note">Ideas are not scheduled releases. There is no team, prize fund, or promised token outcome.</p>
    </div>
  </section>

`;
