// Trusted static HTML; retain IDs used by the homepage scripts.
export const openingMarkup = `<div id="scrollbar" aria-hidden="true"></div>
<a class="skip-link" href="#top">Skip to content</a>

<header>
  <div class="wrap nav">
    <a class="wordmark" href="#top" aria-label="Bitcat home">
      <img class="nav-pfp" id="navPfp" alt="">
      BITCAT
    </a>
    <button class="nav-menu-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="Open site menu">☰</button>
    <nav class="nav-links" id="siteNav" aria-label="Site">
      <a class="nav-play" href="/games/flap">Play <span class="nav-play-badge">NEW</span></a>
      <a href="#make">Make a meme</a>
      <a href="#contribute">Contribute</a>
      <a href="#how">Rewards</a>
      <a href="#market">Market</a>
      <a href="#vault">Vault</a>
      <a href="#story">Story</a>
      <a href="#faq">FAQ</a>
    </nav>
    <button class="eye-btn" id="themeBtn" type="button" aria-pressed="false" title="Switch to night mode" aria-label="Switch to night mode">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle class="eye-face" cx="20" cy="20" r="20"/>
          <g class="eye-open">
            <circle class="eye-ball" cx="13" cy="20" r="7.4"/>
            <circle class="eye-ball" cx="27.4" cy="20" r="6.6"/>
            <circle class="eye-pupil" cx="13.6" cy="20.4" r="2.7"/>
            <circle class="eye-pupil" cx="27.8" cy="20.4" r="2.4"/>
          </g>
          <g class="eye-shut">
            <path d="M6.6 19 Q13 24.4 19.4 19"/>
            <path d="M21.4 19 Q27.4 23.8 33.4 19"/>
          </g>
        </svg>
    </button>
    <a class="btn-buy" href="https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">Buy on Flap</a>
  </div>
</header>

<main id="top" tabindex="-1">
`;

export const closingMarkup = `</main>

<footer class="dark">
  <div class="wrap foot">
    <div>
      <div class="wordmark" style="margin-bottom:12px">BITCAT</div>
      <p class="disclaimer">
        An independent home for BITCAT on BNB Chain, built and maintained by one holder.
        There is no formal team and no promise of token recovery. BTCB rewards depend on
        trading activity and contract operation. BTCB is not native Bitcoin. Nothing here is financial advice.
      </p>
    </div>
    <nav class="foot-links" aria-label="External links">
      <a href="/games/flap">Play Flap</a>
      <a href="#contribute">Help build the site</a>
      <a href="#story">History &amp; account status</a>
      <a href="https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">Flap</a>
      <a href="https://dexscreener.com/bsc/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">DexScreener</a>
      <a href="https://bscscan.com/token/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">BscScan</a>
    </nav>
  </div>
</footer>

<button class="daily-mouse" id="dailyMouse" type="button" aria-label="Catch today's hidden mouse" hidden>
  <img src="/assets/daily-mouse.png" alt="">
</button>
<div class="mouse-toast" id="mouseToast" role="status" aria-live="polite" aria-atomic="true">
  <span id="mouseToastText">Mouse caught.</span>
  <button id="shareMouse" type="button">Share streak</button>
</div>

<div class="lucky-overlay" id="luckyOverlay" role="dialog" aria-modal="true" aria-labelledby="luckyTitle" aria-hidden="true">
  <div class="lucky-card">
    <img src="/assets/bitcat-mascot-transparent.png" alt="A rare golden Bitcat">
    <strong id="luckyTitle">LUCKY 7777</strong>
    <p id="luckyReason">The gold cat has appeared.</p>
    <button id="luckyClose" type="button">Return to the hunt</button>
  </div>
</div>

<nav class="mobile-actions" aria-label="Quick actions">
  <a href="/games/flap">Play</a>
  <a href="#bowl">Rewards</a>
  <a href="https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777" target="_blank" rel="noopener">Buy BITCAT</a>
</nav>`;
