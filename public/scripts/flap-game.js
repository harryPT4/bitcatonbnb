(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  // Keep game coordinates at 480x853 but render at device resolution so it stays sharp on retina/phones.
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  const scoreEl = document.getElementById("scoreVal");
  const bestEl = document.getElementById("bestVal");
  const walletEl = document.getElementById("wallet");
  const walletMsg = document.getElementById("walletMsg");
  const WALLET_KEY = "bitcat_wallet";
  const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
  const API = "/api/games/flap";
  // Storage can throw (Safari private mode, blocked site data); the game must still run.
  function storageGet(key){ try { return localStorage.getItem(key); } catch { return null; } }
  function storageSet(key, value){ try { localStorage.setItem(key, value); } catch { /* ignore */ } }
  let playerWallet = storageGet(WALLET_KEY) || "";
  if (playerWallet) walletEl.value = playerWallet;
  function shortAddr(a){ return a ? a.slice(0,6)+"…"+a.slice(-4) : ""; }
  function validWallet(v){ return ADDR_RE.test((v||"").trim()); }
  function syncWallet(){
    const v=(walletEl.value||"").trim();
    if (validWallet(v)){
      playerWallet=v;
      storageSet(WALLET_KEY,v);
      walletEl.className="ok";
      walletMsg.textContent="player id  "+shortAddr(v);
      walletMsg.style.color="#246c40";
      return true;
    }
    playerWallet="";
    walletEl.className=v?"bad":"";
    walletMsg.textContent=v?"need a valid 0x BNB address (42 chars)":"Guest mode ready. Add a public address after a run to publish.";
    walletMsg.style.color=v?"#a43227":"#6d655a";
    return false;
  }
  walletEl.addEventListener("input", syncWallet);
  walletEl.addEventListener("change", syncWallet);
  syncWallet();
  const flapButton=document.getElementById("flapButton");
  const publishButton=document.getElementById("publishButton");
  const serviceBadge=document.getElementById("serviceBadge");
  const leaderboardList=document.getElementById("leaderboardList");
  const gameStatus=document.getElementById("gameStatus");
  let lastBoard=[];
  let submitNote="";
  let lastScore=0;
  let runPromise=null;
  // A run token is single-use, so a saved score can't be published again.
  let publishing=false;
  let scorePublished=false;

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
    flapButton.textContent=state===STATE.READY?"Start game":state===STATE.PLAY?"Flap":state===STATE.PAUSED?"Resume":"Play again";
    publishButton.disabled=state!==STATE.OVER||lastScore<=0||publishing||scorePublished||!validWallet(walletEl.value);
    publishButton.textContent=scorePublished?"Score published":publishing?"Publishing…":"Publish last score";
  }
  function beginRun(){
    runPromise=fetch(API+"/runs",{method:"POST"})
      .then((res)=>res.ok?res.json():Promise.reject(new Error("run unavailable")))
      .catch(()=>null);
  }
  async function submitScore(){
    if(publishing||scorePublished) return;
    if(!validWallet(walletEl.value)){
      submitNote="add a public wallet to publish";
      announce("Add a valid public BNB address to publish your score.");
      updateControls();
      return;
    }
    syncWallet();
    submitNote="saving score…";
    publishing=true;
    updateControls();
    announce("Publishing your score.");
    try{
      const run=await runPromise;
      if(!run||!run.runId){ throw new Error("run unavailable"); }
      const res=await fetch(API+"/scores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({runId:run.runId,wallet:playerWallet,mcap:lastScore})});
      const data=await res.json();
      if(!res.ok||!data?.ok){ throw new Error(data?.error||"score unavailable"); }
      scorePublished=true;
      publishing=false;
      updateControls();
      submitNote=data.rank?("saved · rank #"+data.rank):"score saved";
      announce("Score published"+(data.rank?" at rank "+data.rank:"")+".");
      await loadBoard();
    }catch(e){
      submitNote="score service unavailable";
      announce("Your local score is safe, but the leaderboard is temporarily unavailable.");
    }
    publishing=false;
    updateControls();
  }
  async function loadBoard(){
    serviceBadge.textContent="Checking…";
    serviceBadge.className="service-badge";
    try{
      const res=await fetch(API+"/leaderboard");
      const data=await res.json();
      if(!res.ok||!data?.ok) throw new Error("leaderboard unavailable");
      lastBoard=data.board||[];
      serviceBadge.textContent="Live";
      serviceBadge.className="service-badge online";
      renderBoard();
    }catch(e){
      serviceBadge.textContent="Offline";
      serviceBadge.className="service-badge offline";
      leaderboardList.innerHTML='<li class="leaderboard-empty">Scores are unavailable right now. Guest play still works.</li>';
    }
  }
  publishButton.addEventListener("click",submitScore);
  document.getElementById("refreshBoard")?.addEventListener("click",loadBoard);
  walletEl.addEventListener("input",()=>setTimeout(updateControls,0));
  loadBoard();

  const CAT_SRC = "/assets/flap-cat.png";

  const catImg = new Image();
  catImg.src = CAT_SRC;

  const BEST_KEY = "bitcat_best_mcap";
  const MCAP_CANDLE = 100000;
  const MCAP_COIN = 50000;
  let best = parseInt(storageGet(BEST_KEY) || "0", 10) || 0;
  bestEl.textContent = fmtMcap(best);

  function fmtMcap(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(n >= 1e10 ? 1 : 2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + "M";
    if (n >= 1e3) return "$" + (n / 1e3).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
    return "$" + n;
  }

  const STATE = { READY: 0, PLAY: 1, OVER: 2, PAUSED: 3 };
  let state = STATE.READY;

  const GRAVITY = 0.38;
  const FLAP = -8.2;
  const PIPE_W = 78;
  const GAP = 210;
  const SPEED = 3.15;
  // Spawn timing stays fixed so MCAP per second (and the server's plausibility cap) is unchanged by the ramp.
  const SPAWN_EVERY = 1600;
  const CANDLES_PER_LEVEL = 10;
  const MAX_LEVEL = 5;
  const SPEED_PER_LEVEL = 0.2;
  const GAP_SHRINK_PER_LEVEL = 8;
  // Physics constants are tuned per 60Hz tick; a fixed step keeps speed identical on 120Hz+ displays.
  const STEP_MS = 1000 / 60;
  const MAX_FRAME_MS = 50;
  const RESTART_DELAY_MS = 500;

  const cat = {
    x: 86,
    y: H * 0.42,
    w: 108,
    h: 76,
    vy: 0,
    rot: 0
  };

  let pipes = [];
  let particles = [];
  let coins = [];
  let score = 0;
  let lastSpawn = 0;
  let groundOff = 0;
  let simTime = 0;
  let overAt = 0;
  let cleared = 0;
  let level = 0;
  let levelFlashUntil = 0;
  let newAth = false;

  function currentSpeed() { return SPEED + level * SPEED_PER_LEVEL; }
  function currentGap() { return GAP - level * GAP_SHRINK_PER_LEVEL; }

  const MUTE_KEY = "bitcat_muted";
  const muteButton = document.getElementById("muteButton");
  let muted = storageGet(MUTE_KEY) === "1";
  let audio = null;

  function syncMute() {
    if (!muteButton) return;
    muteButton.setAttribute("aria-pressed", String(muted));
  }
  muteButton?.addEventListener("click", () => {
    muted = !muted;
    storageSet(MUTE_KEY, muted ? "1" : "0");
    syncMute();
  });
  syncMute();

  // Tiny synthesized effects: no audio files to load. The context is created on the first input gesture.
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch { /* audio unsupported */ }
  }
  const sfx = {
    flap: () => tone(420, 0.09, "triangle", 0.05, 680),
    candle: () => tone(880, 0.06, "square", 0.02),
    coin: () => { tone(988, 0.06, "square", 0.03); setTimeout(() => tone(1319, 0.12, "square", 0.03), 60); },
    level: () => { tone(660, 0.08, "triangle", 0.04); setTimeout(() => tone(990, 0.14, "triangle", 0.04), 80); },
    crash: () => tone(260, 0.35, "sawtooth", 0.05, 55),
    ath: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.14, "triangle", 0.045), 90 * i)),
  };
  function vibrate(pattern) {
    if (!muted) navigator.vibrate?.(pattern);
  }

  function reset() {
    cat.y = H * 0.42;
    runPromise = null;
    cat.vy = 0;
    cat.rot = 0;
    pipes = [];
    particles = [];
    coins = [];
    score = 0;
    cleared = 0;
    level = 0;
    levelFlashUntil = 0;
    newAth = false;
    lastSpawn = 0;
    scoreEl.textContent = fmtMcap(0);
  }

  function pause() {
    if (state !== STATE.PLAY) return;
    state = STATE.PAUSED;
    updateControls();
    announce("Paused. Press Space, Arrow Up or Resume to continue.");
  }

  function flap() {
    if (state === STATE.READY) {
      beginRun();
      state = STATE.PLAY;
      lastSpawn = simTime - SPAWN_EVERY + 400;
      cat.vy = FLAP;
      submitNote="";
      lastScore=0;
      publishing=false;
      scorePublished=false;
      updateControls();
      announce("Game started. Current market cap is zero.");
      sfx.flap();
      burst(cat.x + 10, cat.y + 40, "#00ff7a");
      return;
    }
    if (state === STATE.PAUSED) {
      state = STATE.PLAY;
      updateControls();
      announce("Resumed.");
    }
    if (state === STATE.PLAY) {
      cat.vy = FLAP;
      sfx.flap();
      burst(cat.x + 8, cat.y + 50, "#f7931a");
      return;
    }
    if (state === STATE.OVER) {
      // Ignore taps still in flight from the crash so the result screen isn't skipped.
      if (performance.now() - overAt < RESTART_DELAY_MS) return;
      reset();
      state = STATE.READY;
      updateControls();
      flap();
    }
  }

  function burst(x, y, color, count = 10) {
    if (reducedMotion?.matches) return;
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 3 - 2.5,
        life: 1,
        color
      });
    }
  }

  function spawnPipe(now) {
    const gap = currentGap();
    const minTop = 90;
    const maxTop = H - 160 - gap;
    const topH = minTop + Math.random() * (maxTop - minTop);
    pipes.push({
      x: W + 20,
      top: topH,
      gap,
      passed: false,
      wick: 18 + Math.random() * 22
    });
    // occasional bitcoin coin in the gap
    if (Math.random() < 0.45) {
      coins.push({
        x: W + 20 + PIPE_W / 2,
        y: topH + gap / 2,
        r: 16,
        taken: false
      });
    }
    lastSpawn = now;
  }

  function hitRect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  bgGradient.addColorStop(0, "#14161c");
  bgGradient.addColorStop(1, "#0a0b0e");

  function drawBg() {
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // faint grid like a chart, stroked as a single path
    ctx.strokeStyle = "rgba(0,255,122,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 40; y < H; y += 48) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    for (let x = -((groundOff * 0.3) % 48); x < W; x += 48) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    ctx.stroke();
  }

  function drawGround() {
    const gy = H - 78;
    ctx.fillStyle = "#0f1116";
    ctx.fillRect(0, gy, W, 78);
    ctx.fillStyle = "#00ff7a";
    ctx.fillRect(0, gy, W, 3);

    ctx.fillStyle = "#f7931a";
    const dash = 28;
    for (let x = -((groundOff) % (dash * 2)); x < W; x += dash * 2) {
      ctx.fillRect(x, gy + 10, dash, 4);
    }

    ctx.fillStyle = "#222";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("BITCAT  •  HODL THE FLAP", 16, H - 22);
  }

  function drawCandle(x, topH, gap, wick) {
    const botY = topH + gap;
    const botH = H - 78 - botY;
    const rekt = state === STATE.OVER;
    const glow = rekt ? "#ff4d4d" : "#00ff7a";
    const wickC = rekt ? "#ff8a8a" : "#7CFFB2";
    const bodyC = rekt ? "#e23d3d" : "#00e86c";

    // Layered translucent halos instead of shadowBlur, which is very slow on phones at 2x resolution.
    drawHalo(x, 0, PIPE_W, topH, glow);
    drawHalo(x, botY, PIPE_W, botH, glow);

    ctx.fillStyle = wickC;
    ctx.fillRect(x + PIPE_W / 2 - 3, topH - wick, 6, wick);
    ctx.fillRect(x + PIPE_W / 2 - 3, botY + botH, 6, Math.min(wick, 24));
    ctx.fillStyle = bodyC;
    roundRect(ctx, x, 0, PIPE_W, topH, 6);
    ctx.fill();
    roundRect(ctx, x, botY, PIPE_W, botH, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + 10, 8, 8, Math.max(0, topH - 16));

    // ₿ stamp
    ctx.fillStyle = "rgba(13,15,20,0.55)";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    if (topH > 70) ctx.fillText("₿", x + PIPE_W / 2, topH - 18);
    if (botH > 70) ctx.fillText("₿", x + PIPE_W / 2, botY + 42);
    ctx.textAlign = "left";
  }

  function drawHalo(x, y, w, h, color) {
    if (h <= 0) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.08;
    roundRect(ctx, x - 9, y - 9, w + 18, h + 18, 14);
    ctx.fill();
    ctx.globalAlpha = 0.14;
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCoin(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = "#f7931a";
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, c.r + 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, c.r - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffcc4d";
    ctx.fill();
    ctx.fillStyle = "#7a4a00";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("₿", 0, 1);
    ctx.restore();
  }

  function drawCat() {
    ctx.save();
    ctx.translate(cat.x + cat.w / 2, cat.y + cat.h / 2);
    ctx.rotate(cat.rot);
    if (catImg.complete && catImg.naturalWidth) {
      ctx.drawImage(catImg, -cat.w / 2, -cat.h / 2, cat.w, cat.h);
    } else {
      ctx.fillStyle = "#111";
      ctx.fillRect(-cat.w / 2, -cat.h / 2, cat.w, cat.h);
    }
    ctx.restore();
  }

  function drawOverlay() {
    if (state === STATE.PLAY && simTime < levelFlashUntil) {
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.min(1, (levelFlashUntil - simTime) / 400);
      const label = "BULL RUN · LVL " + (level + 1);
      ctx.font = "bold 26px sans-serif";
      ctx.lineJoin = "round";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(8,10,14,0.9)";
      ctx.strokeText(label, W / 2, H * 0.2);
      ctx.fillStyle = "#f7931a";
      ctx.fillText(label, W / 2, H * 0.2);
      ctx.globalAlpha = 1;
    }
    if (state === STATE.PAUSED) {
      ctx.fillStyle = "rgba(8,10,14,0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f7931a";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("PAUSED", W / 2, H * 0.42);
      ctx.fillStyle = "#cfd3d8";
      ctx.font = "15px sans-serif";
      ctx.fillText("tap or press Space to resume", W / 2, H * 0.47);
    }
    if (state === STATE.READY) {
      ctx.fillStyle = "rgba(8,10,14,0.45)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f7931a";
      ctx.font = "bold 54px sans-serif";
      ctx.fillText("BITCAT", W / 2, H * 0.28);
      ctx.fillStyle = "#00ff7a";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("FLAP THROUGH THE CANDLES", W / 2, H * 0.34);
      ctx.fillStyle = "#cfd3d8";
      ctx.font = "13px sans-serif";
      ctx.fillText("HOW MCAP WORKS", W / 2, H * 0.54);
      ctx.fillStyle = "#9aa3ad";
      ctx.font = "12px sans-serif";
      ctx.fillText("each green candle you clear  =  +$100K", W / 2, H * 0.57);
      ctx.fillText("each Bitcoin coin you grab   =  +$50K", W / 2, H * 0.595);
      ctx.fillText("REKT locks your peak mcap on the board", W / 2, H * 0.62);
      ctx.fillStyle = "#f7931a";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("BNB NETWORK", W / 2, H * 0.66);
      ctx.fillStyle = "#00ff7a";
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.fillText("0x7d1a8dbb40b7b5518ef69b93a6faeba91eea7777", W / 2, H * 0.685);
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText("tap Start game — no wallet required", W / 2, H * 0.735);
      const bob = reducedMotion?.matches ? 0 : Math.sin(performance.now() / 250) * 8;
      ctx.fillStyle = "#889";
      ctx.font = "13px sans-serif";
      ctx.fillText(playerWallet ? shortAddr(playerWallet) : "guest mode ready", W / 2, H * 0.775 + bob);
    }
    if (state === STATE.OVER) {
      ctx.fillStyle = "rgba(8,10,14,0.62)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff4d4d";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("REKT", W / 2, H * 0.36);
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText("PEAK MCAP", W / 2, H * 0.40);
      ctx.fillStyle = "#00ff7a";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(fmtMcap(score), W / 2, H * 0.445);
      if (newAth) {
        ctx.fillStyle = "#f7931a";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("NEW ATH 🚀", W / 2, H * 0.482);
      } else {
        ctx.fillStyle = "#f7931a";
        ctx.font = "14px sans-serif";
        ctx.fillText("ath  " + fmtMcap(best), W / 2, H * 0.48);
      }
      if (playerWallet) {
        ctx.fillStyle = "#9aa3ad";
        ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
        ctx.fillText(playerWallet, W / 2, H * 0.505);
      }
      if (submitNote) {
        ctx.fillStyle = "#00ff7a";
        ctx.font = "12px sans-serif";
        ctx.fillText(submitNote, W / 2, H * 0.528);
      }
      if (lastBoard.length) {
        ctx.fillStyle = "#f7931a";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("LEADERBOARD", W / 2, H * 0.56);
        lastBoard.slice(0,5).forEach((row,i)=>{
          ctx.fillStyle = row.wallet.toLowerCase()===(playerWallet||"").toLowerCase() ? "#00ff7a" : "#cfd3d8";
          ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
          ctx.fillText("#"+row.rank+"  "+shortAddr(row.wallet)+"  "+fmtMcap(row.mcap), W/2, H*0.585+i*16);
        });
      }
      if (performance.now() - overAt >= RESTART_DELAY_MS) {
        ctx.fillStyle = "#cfd";
        ctx.font = "15px sans-serif";
        ctx.fillText("tap to try again", W / 2, H * 0.70);
      }
    }
    ctx.textAlign = "left";
  }

  function updateParticles() {
    for (const pt of particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.12;
      pt.life -= 0.03;
    }
    particles = particles.filter(p => p.life > 0);
  }

  function update(now) {
    if (state === STATE.PAUSED) return;
    groundOff += state === STATE.PLAY ? currentSpeed() : SPEED;
    updateParticles();

    if (state !== STATE.PLAY) {
      const sway = reducedMotion?.matches ? 0 : Math.sin(now / 350);
      cat.y = H * 0.42 + sway * 10;
      cat.rot = sway * 0.08;
      return;
    }

    cat.vy += GRAVITY;
    cat.y += cat.vy;
    cat.rot = Math.max(-0.5, Math.min(0.9, cat.vy / 12));

    if (now - lastSpawn > SPAWN_EVERY) spawnPipe(now);

    const speed = currentSpeed();
    for (const p of pipes) p.x -= speed;
    for (const c of coins) c.x -= speed;

    pipes = pipes.filter(p => p.x > -PIPE_W - 10);
    coins = coins.filter(c => c.x > -40 && !c.taken);

    // tighter box on body, ignore tail/coin a bit
    const cx = cat.x + 28;
    const cy = cat.y + 14;
    const cw = cat.w - 40;
    const ch = cat.h - 28;

    for (const p of pipes) {
      const botY = p.top + p.gap;
      const botH = H - 78 - botY;
      const hitTop = hitRect(cx, cy, cw, ch, p.x, 0, PIPE_W, p.top);
      const hitBot = hitRect(cx, cy, cw, ch, p.x, botY, PIPE_W, botH);
      if (hitTop || hitBot) gameOver();

      if (!p.passed && p.x + PIPE_W < cat.x) {
        p.passed = true;
        cleared += 1;
        score += MCAP_CANDLE;
        scoreEl.textContent = fmtMcap(score);
        announce("Market cap "+fmtMcap(score)+".");
        burst(cat.x + 40, cat.y + 20, "#00ff7a");
        const nextLevel = Math.min(MAX_LEVEL, Math.floor(cleared / CANDLES_PER_LEVEL));
        if (nextLevel > level) {
          level = nextLevel;
          levelFlashUntil = now + 1200;
          sfx.level();
        } else {
          sfx.candle();
        }
      }
    }

    for (const c of coins) {
      const dx = (cat.x + cat.w / 2) - c.x;
      const dy = (cat.y + cat.h / 2) - c.y;
      if (dx * dx + dy * dy < (c.r + 28) * (c.r + 28)) {
        c.taken = true;
        score += MCAP_COIN;
        scoreEl.textContent = fmtMcap(score);
        announce("Market cap "+fmtMcap(score)+".");
        sfx.coin();
        burst(c.x, c.y, "#f7931a");
      }
    }

    if (cat.y + cat.h > H - 78 || cat.y < -20) gameOver();
  }

  function gameOver() {
    if (state !== STATE.PLAY) return;
    state = STATE.OVER;
    overAt = performance.now();
    burst(cat.x + cat.w / 2, cat.y + cat.h / 2, "#ff4d4d");
    vibrate(120);
    newAth = score > best;
    if (newAth) {
      best = score;
      storageSet(BEST_KEY, String(best));
      bestEl.textContent = fmtMcap(best);
      sfx.ath();
      burst(W / 2, H * 0.42, "#f7931a", 40);
    } else {
      sfx.crash();
    }
    lastScore=score;
    updateControls();
    if(validWallet(walletEl.value)) submitScore();
    else {
      submitNote="guest score · add wallet to publish";
      announce("Game over. Peak market cap "+fmtMcap(score)+". Add a public BNB address to publish, or play again.");
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  let accumulator = 0;
  function loop(now) {
    // Clamp long frames (e.g. returning from a background tab) so the run doesn't fast-forward.
    accumulator += Math.min(MAX_FRAME_MS, Math.max(0, now - last));
    last = now;
    while (accumulator >= STEP_MS) {
      simTime += STEP_MS;
      update(simTime);
      accumulator -= STEP_MS;
    }
    drawBg();
    for (const p of pipes) drawCandle(p.x, p.top, p.gap, p.wick);
    for (const c of coins) drawCoin(c);
    drawGround();
    drawParticles();
    drawCat();
    drawOverlay();
    requestAnimationFrame(loop);
  }

  function onInput(e) {
    e.preventDefault();
    flap();
  }
  canvas.addEventListener("pointerdown", onInput);
  document.getElementById("flapButton")?.addEventListener("click", onInput);
  // Leave keys alone on other controls (links, Publish, Refresh, inputs) so they keep working.
  function ownsKeyboard(target) {
    if (target === canvas || target === flapButton) return true;
    return !(target instanceof Element && target.closest("a, button, input, textarea, select, [contenteditable]"));
  }
  window.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !ownsKeyboard(e.target)) return;
    if ((e.code === "KeyP" || e.code === "Escape") && state === STATE.PLAY) {
      e.preventDefault();
      pause();
      return;
    }
    if (e.code !== "Space" && e.code !== "ArrowUp") return;
    e.preventDefault();
    if (!e.repeat) flap();
  });
  // Pause when the tab is hidden (app switch, notification, tab change) instead of crashing unseen.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("blur", pause);
  // Stop Space from also "clicking" the focused flap button on keyup (a second flap).
  flapButton.addEventListener("keyup", (e) => {
    if (e.code === "Space") e.preventDefault();
  });

  requestAnimationFrame(loop);
  updateControls();
  announce("Game ready. Press Start game, Space, or Arrow Up. A wallet is only needed to publish a score.");
})();
