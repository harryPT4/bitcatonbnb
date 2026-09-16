import type { Metadata } from "next";
import { ClientScript } from "@/components/client-script";
import "./flap.css";

export const metadata: Metadata = {
  title: "Flap",
  description: "Flap through the candles and put your peak market cap on the BITCAT leaderboard.",
};

export default function FlapPage() {
  return (
    <main className="game-page">
      <header className="game-topbar">
        {/* Full navigation stops the standalone canvas loop cleanly. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="game-back" href="/">
          ← BITCAT
        </a>
        <div>
          <span className="game-kicker">BITCAT ARCADE</span>
          <strong>Flap through the candles</strong>
        </div>
        <span className="service-badge" id="serviceBadge">Checking leaderboard…</span>
      </header>

      <div className="game-shell">
        <section className="game-stage" aria-labelledby="gameHeading">
          <h1 className="sr-only" id="gameHeading">BITCAT Flap</h1>
          <div id="hud">
            <div>
              <div id="title">BITCAT</div>
              <div id="best">
                ATH <span id="bestVal">$0</span>
              </div>
            </div>
            <div id="scorebox" aria-live="polite">
              MCAP <span id="scoreVal">$0</span>
            </div>
          </div>

          <canvas
            id="game"
            width="480"
            height="853"
            tabIndex={0}
            aria-label="BITCAT Flap game. Press Space or Arrow Up to flap."
          />

          <button id="flapButton" type="button">Start game</button>
          <p className="game-hint">Click, tap, Space or Arrow Up to flap.</p>
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
              <button id="refreshBoard" type="button" aria-label="Refresh leaderboard">↻</button>
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
  );
}
