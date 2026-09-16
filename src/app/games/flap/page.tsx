import type { Metadata } from "next";
import { ClientScript } from "@/components/client-script";
import "./flap.css";

export const metadata: Metadata = {
  title: "Flap",
  description: "Flap through the candles and put your peak market cap on the BITCAT leaderboard.",
};

/** A black cat asleep on a giant Bitcoin coin that doubles as its bed: the way home. */
function CatBedIcon() {
  return (
    <svg className="cat-bed" viewBox="0 0 44 34" aria-hidden="true">
      <text className="cat-bed-z" x="35" y="8">z</text>
      <text className="cat-bed-z cat-bed-z-small" x="39.5" y="3.8">z</text>
      {/* coin face the cat sleeps on */}
      <ellipse cx="22" cy="18" rx="18.5" ry="5" fill="#F7C85A" stroke="#15120E" strokeWidth="1.6" />
      <ellipse cx="22" cy="18" rx="14.5" ry="3.4" fill="none" stroke="#E3A21A" strokeWidth="1.1" />
      {/* curled cat */}
      <path d="M11 18.5c-4.2-.6-5-4.4-1.6-5.6" fill="none" stroke="#15120E" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="19.5" cy="16" rx="9.5" ry="5.2" fill="#15120E" />
      <circle cx="29.5" cy="13.2" r="4.6" fill="#15120E" />
      <path d="M26.2 10.4 26.7 5.9l3 3.1ZM30.6 9l3.4-2.4-.1 4.3Z" fill="#15120E" />
      <path d="M27.8 13.8q1.1.9 2.2 0M31.3 13.6q.8.7 1.6 0" fill="none" stroke="#F7F3EA" strokeWidth=".9" strokeLinecap="round" />
      {/* coin edge with milling and the ₿ mark */}
      <path d="M3.5 18h37c0 7.7-8.3 12.5-18.5 12.5S3.5 25.7 3.5 18Z" fill="#F7931A" stroke="#15120E" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5.6 21.2c2 5.4 8.4 8.3 16.4 8.3s14.4-2.9 16.4-8.3" fill="none" stroke="#B86A00" strokeWidth="1.8" strokeDasharray="1.1 1.9" />
      <text className="cat-bed-btc" x="22" y="27.4">₿</text>
    </svg>
  );
}

export default function FlapPage() {
  return (
    <>
      <header className="game-header">
        <div className="wrap nav">
          {/* Full navigation stops the standalone canvas loop cleanly. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="wordmark game-home" href="/" aria-label="BITCAT home">
            <CatBedIcon />
            BITCAT
          </a>
          <span className="game-crumb">
            <span aria-hidden="true">/</span> Arcade <span className="game-crumb-sub">· Flap</span>
          </span>
          <a
            className="btn-buy"
            href="https://flap.sh/coin/0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777"
            target="_blank"
            rel="noopener"
          >
            Buy on Flap
          </a>
        </div>
      </header>

      <main className="game-page">
        <div className="game-shell">
          <section className="game-stage" aria-labelledby="gameHeading">
            <h1 className="sr-only" id="gameHeading">BITCAT Flap</h1>
            <div id="hud">
              <div id="best">
                ATH <span id="bestVal">$0</span>
              </div>
              <div className="hud-actions">
                <div id="scorebox" aria-live="polite">
                  MCAP <span id="scoreVal">$0</span>
                </div>
                <button id="muteButton" type="button" aria-label="Mute sound" aria-pressed="false">
                  <svg className="icon-sound-on" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                    <path className="icon-stroke" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
                  </svg>
                  <svg className="icon-sound-off" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
                    <path className="icon-stroke" d="m15.5 9.5 5 5m0-5-5 5" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="canvas-slot">
              <canvas
                id="game"
                width="600"
                height="853"
                tabIndex={0}
                aria-label="BITCAT Flap game. Press Space or Arrow Up to flap, P or Escape to pause."
              />
            </div>

            <button id="flapButton" type="button">Start game</button>
            <p className="game-hint">Space / ↑ / tap to flap · P to pause</p>
          </section>

          <aside className="game-panel" aria-label="Game details and leaderboard">
            <section className="panel-card player-card">
              <span className="panel-eyebrow">PLAYER</span>
              <h2>Play now. Publish later.</h2>
              <p className="panel-copy">Guest play is instant. Add a public BNB address only when you want your score on the board.</p>
              <div id="walletBox">
                <label htmlFor="wallet">Public BNB address <span>optional</span></label>
                <input
                  id="wallet"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="0x…"
                  maxLength={42}
                  aria-describedby="walletMsg walletPrivacy"
                />
                <div id="walletMsg">Guest mode ready.</div>
                <p id="walletPrivacy">Public addresses and scores are visible to everyone. Never enter a private key or seed phrase.</p>
              </div>
              <button id="publishButton" type="button" disabled>Publish last score</button>
            </section>

            <section className="panel-card leaderboard-card" aria-labelledby="leaderboardTitle">
              <div className="panel-heading">
                <div>
                  <span className="panel-eyebrow">COMMUNITY</span>
                  <h2 id="leaderboardTitle">Top market caps</h2>
                </div>
                <div className="panel-heading-actions">
                  <span className="service-badge" id="serviceBadge">Checking…</span>
                  <button id="refreshBoard" type="button" aria-label="Refresh leaderboard">↻</button>
                </div>
              </div>
              <ol id="leaderboardList" className="leaderboard-list" aria-live="polite">
                <li className="leaderboard-empty">Loading leaderboard…</li>
              </ol>
            </section>

            <section className="panel-card rules-card">
              <span className="panel-eyebrow">HOW MCAP WORKS</span>
              <ul>
                <li><strong>+$100K</strong> for every candle cleared</li>
                <li><strong>+$50K</strong> for every Bitcoin collected</li>
                <li><strong>REKT</strong> records your peak market cap</li>
              </ul>
              <div id="ca">
                <div className="ca-label">BNB CONTRACT</div>
                <div className="ca-addr" id="caAddr">0x7d1a8dbb40b7b5518ef69b93a6faeba91eea7777</div>
              </div>
            </section>
          </aside>

          <p className="sr-only" id="gameStatus" role="status" aria-live="polite" />
        </div>
        <ClientScript src="/scripts/flap-game.js" />
      </main>
    </>
  );
}
