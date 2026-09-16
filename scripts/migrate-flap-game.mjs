import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourcePath = "/Users/bobby/Downloads/bitcat-5.html";
const source = await readFile(sourcePath, "utf8");
const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/);
const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
const imageMatch = source.match(/const CAT_SRC = "data:image\/png;base64,([A-Za-z0-9+/=]+)";/);

if (!styleMatch || !scriptMatch || !imageMatch) {
  throw new Error("Could not locate the game stylesheet, script, or embedded image");
}

let script = scriptMatch[1].trimStart();
script = script.replace(
  /const API = qs\.get\("api"\)[^;]+;/,
  'const API = "/api/games/flap";',
);
script = script.replace(/const qs = new URLSearchParams\(location\.search\);\n/, "");
script = script.replace(/const CAT_SRC = "data:image\/png;base64,[A-Za-z0-9+/=]+";/, 'const CAT_SRC = "/assets/flap-cat.png";');
script = script.replace('let submitNote="";', `let submitNote="";
  let runPromise=null;
  function beginRun(){
    runPromise=fetch(API+"/runs",{method:"POST"})
      .then((res)=>res.ok?res.json():Promise.reject(new Error("run unavailable")))
      .catch(()=>null);
  }`);
script = script.replace(
  'const res=await fetch(API+"/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({wallet:playerWallet,mcap:score})});',
  `const run=await runPromise;
      if(!run||!run.runId){ submitNote="score service unavailable"; return; }
      const res=await fetch(API+"/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runId:run.runId,wallet:playerWallet,mcap:score})});`,
);
script = script.replace(
  'if(data&&data.ok){ lastBoard=data.board||[]; submitNote=data.rank?("rank #"+data.rank):"saved"; }',
  'if(data&&data.ok){ submitNote=data.rank?("rank #"+data.rank):"saved"; loadBoard(); }',
);
script = script.replace('offline — start bitcat-server.py', 'score service unavailable');
script = script.replace(
  'walletMsg.textContent=v?"need a valid 0x BNB address (42 chars)":"Required. This is how the site leaderboard knows it’s you.";',
  'walletMsg.textContent=v?"need a valid 0x BNB address (42 chars)":"Guest mode ready. Add a public address after a run to publish.";',
);
script = script.replace('walletMsg.style.color="#00ff7a";', 'walletMsg.style.color="#246c40";');
script = script.replace('walletMsg.style.color=v?"#ff4d4d":"#889";', 'walletMsg.style.color=v?"#a43227":"#6d655a";');
script = script.replace(
  /let lastBoard=\[\];[\s\S]*?loadBoard\(\);\n\n  const CAT_SRC/,
  `const flapButton=document.getElementById("flapButton");
  const publishButton=document.getElementById("publishButton");
  const serviceBadge=document.getElementById("serviceBadge");
  const leaderboardList=document.getElementById("leaderboardList");
  const gameStatus=document.getElementById("gameStatus");
  let lastBoard=[];
  let submitNote="";
  let lastScore=0;
  let runPromise=null;

  function announce(message){ gameStatus.textContent=message; }
  function renderBoard(){
    if(!lastBoard.length){
      leaderboardList.innerHTML='<li class="leaderboard-empty">No published scores yet. Be the first cat on the board.</li>';
      return;
    }
    leaderboardList.innerHTML=lastBoard.slice(0,5).map((row)=>
      '<li><span class="leaderboard-rank">#'+row.rank+'</span><span>'+shortAddr(row.wallet)+'</span><strong>'+fmtMcap(row.mcap)+'</strong></li>'
    ).join("");
  }
  function updateControls(){
    flapButton.textContent=state===STATE.READY?"Start game":state===STATE.PLAY?"Flap":"Play again";
    publishButton.disabled=state!==STATE.OVER||lastScore<=0||!validWallet(walletEl.value);
  }
  function beginRun(){
    runPromise=fetch(API+"/runs",{method:"POST"})
      .then((res)=>res.ok?res.json():Promise.reject(new Error("run unavailable")))
      .catch(()=>null);
  }
  async function submitScore(){
    if(!validWallet(walletEl.value)){
      submitNote="add a public wallet to publish";
      announce("Add a valid public BNB address to publish your score.");
      updateControls();
      return;
    }
    syncWallet();
    submitNote="saving score…";
    publishButton.disabled=true;
    announce("Publishing your score.");
    try{
      const run=await runPromise;
      if(!run||!run.runId){ throw new Error("run unavailable"); }
      const res=await fetch(API+"/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runId:run.runId,wallet:playerWallet,mcap:lastScore})});
      const data=await res.json();
      if(!res.ok||!data?.ok){ throw new Error(data?.error||"score unavailable"); }
      submitNote=data.rank?("saved · rank #"+data.rank):"score saved";
      announce("Score published"+(data.rank?" at rank "+data.rank:"")+".");
      await loadBoard();
    }catch(e){
      submitNote="score service unavailable";
      announce("Your local score is safe, but the leaderboard is temporarily unavailable.");
    }
    updateControls();
  }
  async function loadBoard(){
    serviceBadge.textContent="Checking leaderboard…";
    serviceBadge.className="service-badge";
    try{
      const res=await fetch(API+"/leaderboard");
      const data=await res.json();
      if(!res.ok||!data?.ok) throw new Error("leaderboard unavailable");
      lastBoard=data.board||[];
      serviceBadge.textContent="Leaderboard online";
      serviceBadge.className="service-badge online";
      renderBoard();
    }catch(e){
      serviceBadge.textContent="Leaderboard unavailable";
      serviceBadge.className="service-badge offline";
      leaderboardList.innerHTML='<li class="leaderboard-empty">Scores are unavailable right now. Guest play still works.</li>';
    }
  }
  publishButton.addEventListener("click",submitScore);
  document.getElementById("refreshBoard")?.addEventListener("click",loadBoard);
  walletEl.addEventListener("input",()=>setTimeout(updateControls,0));
  loadBoard();

  const CAT_SRC`,
);
script = script.replace('cat.y = H * 0.42;\n    cat.vy = 0;', 'cat.y = H * 0.42;\n    runPromise = null;\n    cat.vy = 0;');
script = script.replace('state = STATE.PLAY;\n      startedAt', 'beginRun();\n      state = STATE.PLAY;\n      startedAt');
script = script.replace(
  `if (!syncWallet()){
        walletEl.focus();
        walletMsg.textContent="enter your BNB address first";
        walletMsg.style.color="#ff4d4d";
        return;
      }
      beginRun();`,
  `beginRun();`,
);
script = script.replace(
  'cat.vy = FLAP;\n      burst(cat.x + 10, cat.y + 40, "#00ff7a");',
  'cat.vy = FLAP;\n      submitNote="";\n      lastScore=0;\n      updateControls();\n      announce("Game started. Current market cap is zero.");\n      burst(cat.x + 10, cat.y + 40, "#00ff7a");',
);
script = script.replace(
  'reset();\n      state = STATE.READY;',
  'reset();\n      state = STATE.READY;\n      updateControls();\n      flap();',
);
script = script.replace('playerWallet ? "tap to start" : "enter BNB address below first"', '"tap Start game — no wallet required"');
script = script.replace('playerWallet ? shortAddr(playerWallet) : "player id required"', 'playerWallet ? shortAddr(playerWallet) : "guest mode ready"');
script = script.replace('playerWallet || "no wallet"', 'playerWallet || "guest score — add wallet to publish"');
script = script.replaceAll(
  'scoreEl.textContent = fmtMcap(score);',
  'scoreEl.textContent = fmtMcap(score);\n        announce("Market cap "+fmtMcap(score)+".");',
);
script = script.replace(
  'submitScore();\n  }',
  `lastScore=score;
    updateControls();
    if(validWallet(walletEl.value)) submitScore();
    else {
      submitNote="guest score · add wallet to publish";
      announce("Game over. Peak market cap "+fmtMcap(score)+". Add a public BNB address to publish, or play again.");
    }
  }`,
);
script = script.replace(
  'canvas.addEventListener("pointerdown", onInput);',
  'canvas.addEventListener("pointerdown", onInput);\n  document.getElementById("flapButton")?.addEventListener("click", onInput);',
);
script = script.replace(
  'requestAnimationFrame(loop);\n})();',
  'requestAnimationFrame(loop);\n  updateControls();\n  announce("Game ready. Press Start game, Space, or Arrow Up. A wallet is only needed to publish a score.");\n})();',
);

const additionalCss = `

.game-page {
  --page: #fcfbf7;
  --paper: #ffffff;
  --line: #e4ddcd;
  --ink: #15120e;
  --muted: #6d655a;
  min-height: 100svh;
  padding: 1rem clamp(1rem, 3vw, 2.5rem) 2.5rem;
  background:
    radial-gradient(800px 400px at 50% -10%, #fbf1d6, transparent 65%),
    var(--page);
  color: var(--ink);
  user-select: auto;
}

html, body {
  height: auto;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #fcfbf7;
  color: #15120e;
  user-select: auto;
}

.game-topbar {
  width: min(1120px, 100%);
  margin: 0 auto 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}
.game-topbar > div { display: grid; }
.game-topbar strong { font-size: clamp(1rem, 2vw, 1.25rem); }
.game-kicker, .panel-eyebrow {
  color: #8a5b00;
  font: 800 0.68rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.14em;
}
.game-back {
  color: #15120e;
  border: 1px solid #d9c38f;
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  background: #fff;
  text-decoration: none;
  font-weight: 800;
}
.service-badge {
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  background: #f3efe4;
  color: #6d655a;
  font-size: 0.75rem;
  font-weight: 700;
}
.service-badge.online { background: #e7f4eb; color: #246c40; }
.service-badge.offline { background: #fcf2f0; color: #a43227; }

.game-shell {
  width: min(1120px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(300px, 480px) minmax(300px, 390px);
  align-items: start;
  justify-content: center;
  gap: clamp(1rem, 3vw, 2rem);
}
.game-stage {
  min-width: 0;
  border-radius: 24px;
  padding: 0.75rem;
  background: #0d0f14;
  color: #fff;
  box-shadow: 0 22px 60px rgba(21,18,14,.2);
}
#hud { width: 100%; }
canvas {
  width: auto;
  height: min(68svh, 660px);
  max-width: 100%;
  margin: 0 auto;
}
#flapButton {
  width: 100%;
  margin-top: 0.65rem;
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1rem;
  background: #f7931a;
  color: #0d0f14;
  font: 800 1rem system-ui, sans-serif;
  cursor: pointer;
}
.game-hint { margin: 0.55rem 0 0; color: #b7bdc5; text-align: center; font-size: 0.78rem; }

.game-panel { display: grid; gap: 0.85rem; }
.panel-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 1.1rem;
  background: var(--paper);
  box-shadow: 0 12px 30px rgba(21,18,14,.07);
}
.panel-card h2 { margin: 0.15rem 0 0.35rem; font-size: 1.1rem; }
.panel-copy { margin: 0 0 0.85rem; color: var(--muted); font-size: 0.88rem; line-height: 1.45; }
#walletBox { width: 100%; margin: 0; }
#walletBox label { color: #5b5348; }
#walletBox label span { color: #6d655a; font-weight: 500; letter-spacing: 0; }
#wallet { background: #f8f4ea; color: #15120e; border-color: #d8d0c0; }
#wallet:focus { border-color: #8a5b00; box-shadow: 0 0 0 3px rgba(168,115,8,.14); }
#walletMsg { color: #6d655a; }
#walletPrivacy { margin: 0.35rem 0 0; color: #6d655a; font-size: 0.72rem; line-height: 1.4; }
#publishButton {
  width: 100%;
  margin-top: 0.8rem;
  border: 1px solid #15120e;
  border-radius: 999px;
  padding: 0.7rem 0.9rem;
  background: #15120e;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
#publishButton:disabled { cursor: not-allowed; opacity: 0.42; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
#refreshBoard {
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: #fff;
  color: #15120e;
  cursor: pointer;
}
.leaderboard-list { list-style: none; display: grid; gap: 0.45rem; margin: 0.7rem 0 0; padding: 0; }
.leaderboard-list li { display: grid; grid-template-columns: 2.2rem 1fr auto; gap: 0.6rem; align-items: center; color: #5b5348; font: 0.78rem ui-monospace, SFMono-Regular, Menlo, monospace; }
.leaderboard-list strong { color: #15120e; }
.leaderboard-rank { color: #8a5b00; font-weight: 800; }
.leaderboard-list .leaderboard-empty { display: block; color: #6d655a; line-height: 1.45; }
.rules-card ul { display: grid; gap: 0.45rem; margin: 0.65rem 0 0; padding: 0; list-style: none; color: #5b5348; font-size: 0.85rem; }
.rules-card li strong { color: #8a5b00; }
#ca { width: 100%; margin-top: 0.9rem; text-align: left; }
.ca-label { color: #8a5b00; }
.ca-addr { color: #246c40; background: #f8f4ea; border-color: #d8d0c0; }

#flapButton:focus-visible, .game-back:focus-visible, #publishButton:focus-visible, #refreshBoard:focus-visible {
  outline: 3px solid #8a5b00;
  outline-offset: 3px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 820px) {
  .game-page { padding: 0.75rem 0.75rem 2rem; }
  .game-topbar { grid-template-columns: auto 1fr; }
  .service-badge { grid-column: 1 / -1; justify-self: start; }
  .game-shell { grid-template-columns: 1fr; max-width: 520px; }
  canvas { height: min(66svh, 660px); }
  .game-panel { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
`;

await mkdir("src/app/games/flap", { recursive: true });
await mkdir("public/scripts", { recursive: true });
await mkdir("public/assets", { recursive: true });
await writeFile("src/app/games/flap/flap.css", styleMatch[1].trimStart() + additionalCss);
await writeFile("public/scripts/flap-game.js", script);
await writeFile("public/assets/flap-cat.png", Buffer.from(imageMatch[1], "base64"));

console.log("Migrated the Flap game into the Next.js source tree.");
