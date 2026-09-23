import {
  attachSeed,
  createSimulation,
  currentSpeed,
  encodeFlaps,
  FIRST_SPAWN_TICK,
  flap as flapSimulation,
  FLAP_HEIGHT as H,
  FLAP_WIDTH as W,
  GROUND_HEIGHT,
  PIPE_WIDTH,
  seedFromRunId,
  step,
  TICK_MS,
  TICKS_PER_SECOND,
  type Coin,
  type Simulation,
} from "@/features/flap/simulation";
import { fmtMcap } from "@/features/flap/format";
import { buildShareText, xIntentUrl } from "@/features/flap/share";
import { getWeeklyChallenge, seedFromChallengeKey } from "@/features/flap/challenge";

type GameState = "ready" | "play" | "paused" | "over";
type BoardRow = { rank: number; wallet: string; mcap: number };
type RunToken = { runId: string; expiresAt: number; mode: "classic" | "weekly"; challengeKey?: string; label?: string; seed?: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
/** Everything needed to publish a finished run, kept until the next game starts. */
type FinishedRun = { token: RunToken | null; score: number; ticks: number; flaps: number[] };

const API = "/api/games/flap";
const WALLET_KEY = "bitcat_wallet";
const BEST_KEY = "bitcat_best_mcap";
const MUTE_KEY = "bitcat_muted";
const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const BOARD_ROWS = 10;
const MAX_FRAME_MS = 50;
const RESTART_DELAY_MS = 500;
const GRAVITY = 0.38;
const IDLE_SPEED = 3.15;
/** Don't start a game on a token that could expire before a long run is submitted. */
const TOKEN_MIN_LIFETIME_MS = 45 * 60_000;
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Storage can throw (Safari private mode, blocked site data); the game must still run.
function storageGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function shortAddr(address: string) {
  return address ? address.slice(0, 6) + "…" + address.slice(-4) : "";
}

function validWallet(value: string | null | undefined) {
  return ADDR_RE.test((value ?? "").trim());
}

function byId<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Flap game element #${id} is missing`);
  return element as T;
}

/** Starts the game on the Flap page markup. Returns a cleanup function that fully stops it. */
export function startFlapGame(): () => void {
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const on = <K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ) => target.addEventListener(type, listener, { signal });
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  const canvas = byId<HTMLCanvasElement>("game");
  const ctx = canvas.getContext("2d")!;
  // Game coordinates stay 600x853; render at device resolution so it stays sharp on retina/phones.
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  const scoreEl = byId("scoreVal");
  const bestEl = byId("bestVal");
  const walletEl = byId<HTMLInputElement>("wallet");
  const walletMsg = byId("walletMsg");
  const verifyWalletButton = byId<HTMLButtonElement>("verifyWallet");
  const flapButton = byId<HTMLButtonElement>("flapButton");
  const publishButton = byId<HTMLButtonElement>("publishButton");
  const serviceBadge = byId("serviceBadge");
  const leaderboardList = byId("leaderboardList");
  const challengeTitle = byId("challengeTitle");
  const challengeMeta = byId("challengeMeta");
  const gameStatus = byId("gameStatus");
  const muteButton = byId<HTMLButtonElement>("muteButton");
  const copyButton = byId<HTMLButtonElement>("copyContract");
  const caAddr = byId("caAddr");
  const shareButton = byId<HTMLButtonElement>("shareButton");
  const shareLabel = shareButton.querySelector(".share-label")!;
  const shareX = byId<HTMLAnchorElement>("shareX");
  const shareCardButton = byId<HTMLButtonElement>("shareCardButton");

  let state: GameState = "ready";
  let sim: Simulation = createSimulation();
  let particles: Particle[] = [];
  let groundOff = 0;
  let idleTick = 0;
  let catRot = 0;
  let overAt = 0;
  let levelFlashUntil = 0;
  let newAth = false;
  let best = Number.parseInt(storageGet(BEST_KEY) || "0", 10) || 0;

  // Run tokens: fetched ahead of a game so the seed is ready before the first candle spawns.
  let nextRun: RunToken | null = null;
  let runRequest: Promise<void> | null = null;
  let currentRun: RunToken | null = null;
  let flapTicks: number[] = [];
  const telemetry: { type: "pause" | "resume" | "hidden" | "visible" | "blur" | "focus"; tick: number; atMs: number }[] = [];
  const recordTelemetry = (type: (typeof telemetry)[number]["type"]) => {
    if (telemetry.length < 256) telemetry.push({ type, tick: sim.tick, atMs: Math.round(performance.now()) });
  };
  let lastRun: FinishedRun | null = null;
  const mode: "classic" | "weekly" = "weekly";
  let challengeLabel = getWeeklyChallenge().label;

  let playerWallet = storageGet(WALLET_KEY) || "";
  let lastBoard: BoardRow[] = [];
  let submitNote = "";
  let publishing = false;
  let scorePublished = false;
  // Rank returned by the last publish, so players outside the visible rows still see where they landed.
  let myRank: BoardRow | null = null;

  const announce = (message: string) => {
    gameStatus.textContent = message;
  };

  // ---------- wallet ----------
  if (playerWallet) walletEl.value = playerWallet;
  function syncWallet() {
    const value = walletEl.value.trim();
    if (validWallet(value)) {
      playerWallet = value;
      storageSet(WALLET_KEY, value);
      walletEl.className = "ok";
      walletMsg.textContent = "player id  " + shortAddr(value);
      walletMsg.style.color = "#246c40";
      return true;
    }
    playerWallet = "";
    walletEl.className = value ? "bad" : "";
    walletMsg.textContent = value
      ? "need a valid 0x BNB address (42 chars)"
      : "Guest mode ready. Add a public address after a run to publish.";
    walletMsg.style.color = value ? "#a43227" : "#6d655a";
    return false;
  }
  on(walletEl, "input", syncWallet);
  on(walletEl, "change", syncWallet);
  syncWallet();

  async function verifyWallet() {
    if (!validWallet(walletEl.value)) { announce("Enter a valid wallet address first."); return; }
    const ethereum = (window as unknown as { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> } }).ethereum;
    if (!ethereum) { announce("A browser wallet is required for weekly verification."); return; }
    verifyWalletButton.disabled = true;
    verifyWalletButton.textContent = "Preparing signature…";
    try {
      const challengeRes = await fetch(API + "/auth/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet: walletEl.value.trim() }), signal });
      const challenge = await challengeRes.json();
      if (!challengeRes.ok) throw new Error(challenge.error ?? "Challenge unavailable");
      const signature = await ethereum.request({ method: "personal_sign", params: [challenge.message, walletEl.value.trim()] });
      const verifyRes = await fetch(API + "/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet: walletEl.value.trim(), nonce: challenge.nonce, signature }), signal });
      const verified = await verifyRes.json();
      if (!verifyRes.ok || !verified.ok) throw new Error(verified.error ?? "Verification failed");
      walletMsg.textContent = "verified player  " + shortAddr(verified.wallet);
      walletMsg.style.color = "#246c40";
      verifyWalletButton.textContent = "Wallet verified ✓";
      announce("Wallet verified. Weekly ranked play is unlocked.");
      prefetchRun();
    } catch (error) {
      if (!signal.aborted) announce(error instanceof Error ? error.message : "Wallet verification failed.");
      verifyWalletButton.disabled = false;
      verifyWalletButton.textContent = "Verify wallet for weekly play";
    }
  }
  on(verifyWalletButton, "click", verifyWallet);

  // ---------- run tokens ----------
  function prefetchRun() {
    if (runRequest || (nextRun && nextRun.expiresAt - Date.now() > TOKEN_MIN_LIFETIME_MS)) return;
    runRequest = fetch(API + "/runs?mode=" + mode, { method: "POST", signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { runId?: string; expiresAt?: string; mode?: "classic" | "weekly"; challengeKey?: string; key?: string; label?: string; seed?: number } | null) => {
        if (!data?.runId) return;
        const expiresAt = data.expiresAt ? Date.parse(data.expiresAt) : Number.NaN;
        nextRun = { runId: data.runId, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 60 * 60_000, mode: data.mode ?? mode, challengeKey: data.key ?? data.challengeKey, label: data.label, seed: data.seed };
        if (data.label) challengeLabel = data.label;
      })
      .catch(() => {})
      .finally(() => {
        runRequest = null;
      });
  }
  function takeRun() {
    const run = nextRun && nextRun.expiresAt - Date.now() > TOKEN_MIN_LIFETIME_MS ? nextRun : null;
    nextRun = null;
    return run;
  }
  /** Seeds the simulation from a run token, or falls back to an unpublishable local seed if none arrived in time. */
  function ensureSeed() {
    if (sim.rng !== null) return;
    const run = takeRun();
    if (run) {
      currentRun = run;
      attachSeed(sim, run.mode === "weekly" && run.challengeKey ? run.seed ?? seedFromChallengeKey(run.challengeKey) : seedFromRunId(run.runId));
    } else if (sim.tick >= FIRST_SPAWN_TICK - 1) {
      attachSeed(sim, Math.floor(Math.random() * 2 ** 32));
    }
  }

  // ---------- leaderboard ----------
  function boardRow(row: BoardRow, isYou: boolean) {
    const li = document.createElement("li");
    if (isYou) li.className = "is-you";
    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    rank.textContent = "#" + row.rank;
    const wallet = document.createElement("span");
    wallet.textContent = shortAddr(row.wallet) + (isYou ? " · you" : "");
    const mcap = document.createElement("strong");
    mcap.textContent = fmtMcap(row.mcap);
    li.append(rank, wallet, mcap);
    return li;
  }
  function renderBoard() {
    if (!lastBoard.length) {
      leaderboardList.innerHTML = '<li class="leaderboard-empty">No published scores yet. Be the first cat on the board.</li>';
      return;
    }
    const me = playerWallet.toLowerCase();
    const rows = lastBoard.slice(0, BOARD_ROWS).map((row) => boardRow(row, !!me && row.wallet.toLowerCase() === me));
    // Outside the visible rows: pin the player's own entry underneath.
    const mine = me ? lastBoard.find((row) => row.wallet.toLowerCase() === me) : undefined;
    const pinned = mine ? (mine.rank > BOARD_ROWS ? mine : null) : me && myRank?.wallet === me ? myRank : null;
    if (pinned) {
      const gap = document.createElement("li");
      gap.className = "leaderboard-gap";
      gap.setAttribute("aria-hidden", "true");
      gap.textContent = "⋯";
      rows.push(gap, boardRow(pinned, true));
    }
    leaderboardList.replaceChildren(...rows);
  }
  // The API allows 15s of HTTP caching; after publishing or a manual refresh, bypass it so new scores show up.
  async function loadBoard({ fresh = false } = {}) {
    serviceBadge.textContent = "Checking…";
    serviceBadge.className = "service-badge";
    try {
      const res = fresh
        ? await fetch(API + "/leaderboard?mode=" + mode + "&t=" + Date.now(), { cache: "no-store", signal })
        : await fetch(API + "/leaderboard?mode=" + mode, { signal });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error("leaderboard unavailable");
      lastBoard = data.board || [];
      if (data.label) {
        challengeLabel = data.label;
        challengeTitle.textContent = challengeLabel;
      }
      if (data.nextStartsAt) {
        const nextStart = new Date(data.nextStartsAt);
        const resetLabel = Number.isNaN(nextStart.getTime())
          ? "Monday at 00:00 UTC"
          : `${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(nextStart)} UTC`;
        challengeMeta.textContent = `Same layout for everyone · resets ${resetLabel}. Guest play is free; wallet verification is only needed to rank.`;
      }
      serviceBadge.textContent = "Live";
      serviceBadge.className = "service-badge online";
      renderBoard();
    } catch {
      if (signal.aborted) return;
      serviceBadge.textContent = "Offline";
      serviceBadge.className = "service-badge offline";
      leaderboardList.innerHTML = '<li class="leaderboard-empty">Scores are unavailable right now. Guest play still works.</li>';
    }
  }

  // ---------- publishing ----------
  function canPublish() {
    return state === "over" && !!lastRun?.token && lastRun.score > 0 && !publishing && !scorePublished && validWallet(walletEl.value);
  }
  function updateControls() {
    flapButton.textContent =
      state === "ready" ? "Start game" : state === "play" ? "Flap" : state === "paused" ? "Resume" : "Play again";
    publishButton.disabled = !canPublish();
    publishButton.textContent = scorePublished ? "Score published" : publishing ? "Publishing…" : "Publish last score";
    updateShare();
  }
  async function submitScore() {
    if (publishing || scorePublished || !lastRun) return;
    if (!lastRun.token) {
      submitNote = "offline run · can't be published";
      updateControls();
      return;
    }
    if (!validWallet(walletEl.value)) {
      submitNote = "add a public wallet to publish";
      announce("Add a valid public BNB address to publish your score.");
      updateControls();
      return;
    }
    syncWallet();
    const run = lastRun;
    submitNote = "verifying run…";
    publishing = true;
    updateControls();
    try {
      const res = await fetch(API + "/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: run.token!.runId,
          wallet: playerWallet,
          mcap: run.score,
          ticks: run.ticks,
          flaps: encodeFlaps(run.flaps),
          mode: run.token!.mode,
          challengeKey: run.token!.challengeKey ?? null,
          telemetry,
        }),
        signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        submitNote = res.status === 422 ? "run couldn't be verified" : res.status === 409 ? "run token expired" : "score service unavailable";
        announce(res.status === 422 ? "Your run couldn't be verified, so it wasn't published." : "Your score couldn't be published right now.");
      } else {
        scorePublished = true;
        if (data.rank) myRank = { rank: data.rank, wallet: playerWallet.toLowerCase(), mcap: data.mcap ?? run.score };
        submitNote = data.rank ? "verified · rank #" + data.rank : "score saved";
        announce("Game over. Peak market cap " + fmtMcap(run.score) + ". Score verified and published" + (data.rank ? " at rank " + data.rank : "") + ".");
        publishing = false;
        updateControls();
        await loadBoard({ fresh: true });
      }
    } catch {
      if (signal.aborted) return;
      submitNote = "score service unavailable";
      announce("Your local score is safe, but the leaderboard is temporarily unavailable.");
    }
    publishing = false;
    updateControls();
  }
  on(publishButton, "click", submitScore);
  on(byId("refreshBoard"), "click", () => loadBoard({ fresh: true }));
  on(walletEl, "change", renderBoard);
  on(walletEl, "input", () => later(updateControls, 0));

  // ---------- sharing ----------
  const shareUrl = () => location.origin + "/games/flap";
  const shareText = () =>
    lastRun ? buildShareText({ score: lastRun.score, newAth, rank: scorePublished && myRank ? myRank.rank : null, weekly: lastRun.token?.mode === "weekly", challengeLabel, verified: scorePublished }) : "";
  function updateShare() {
    const visible = state === "over" && !!lastRun && lastRun.score > 0;
    shareButton.hidden = !visible;
    shareX.hidden = !visible;
    shareCardButton.hidden = !visible;
    if (visible) {
      shareX.href = xIntentUrl(shareText(), shareUrl());
    }
  }
  let shareReset: ReturnType<typeof setTimeout> | undefined;
  on(shareButton, "click", async () => {
    const text = shareText();
    const url = shareUrl();
    // Phones (and browsers with a share sheet) get the native picker; everything else copies the message.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "BITCAT Flap", text, url });
        announce("Score shared.");
      } catch {
        /* share sheet dismissed */
      }
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      copied = true;
    } catch {
      /* clipboard blocked */
    }
    shareLabel.textContent = copied ? "Copied ✓" : "Copy failed";
    shareButton.classList.toggle("is-copied", copied);
    announce(copied ? "Score message copied. Paste it anywhere to share." : "Couldn't copy the message. Use the X button to post your score.");
    if (shareReset) clearTimeout(shareReset);
    shareReset = later(() => {
      shareLabel.textContent = "Share";
      shareButton.classList.remove("is-copied");
    }, 1800);
  });

  on(shareCardButton, "click", async () => {
    if (!lastRun) return;
    const card = document.createElement("canvas"); card.width = 1200; card.height = 630;
    const cardCtx = card.getContext("2d")!;
    cardCtx.fillStyle = "#15120e"; cardCtx.fillRect(0, 0, card.width, card.height);
    cardCtx.fillStyle = "#f7931a"; cardCtx.fillRect(0, 0, 18, card.height);
    cardCtx.fillStyle = "#f7f3ea"; cardCtx.font = "700 42px ui-monospace, monospace"; cardCtx.fillText("BITCAT FLAP", 72, 108);
    cardCtx.fillStyle = "#f7931a"; cardCtx.font = "700 30px ui-monospace, monospace"; cardCtx.fillText(lastRun.token?.mode === "weekly" ? "WEEKLY CHALLENGE" : "ARCADE RUN", 72, 164);
    cardCtx.fillStyle = "#f7f3ea"; cardCtx.font = "700 112px ui-monospace, monospace"; cardCtx.fillText(fmtMcap(lastRun.score), 72, 330);
    cardCtx.fillStyle = "#b9b0a3"; cardCtx.font = "28px ui-monospace, monospace"; cardCtx.fillText(challengeLabel, 76, 390);
    cardCtx.fillText(scorePublished && myRank ? `Verified · Rank #${myRank.rank}` : "Guest run · play to verify", 76, 452);
    cardCtx.fillStyle = "#f7931a"; cardCtx.font = "700 34px ui-monospace, monospace"; cardCtx.fillText("bitcatbnb.family/games/flap", 76, 555);
    const blob = await new Promise<Blob | null>((resolve) => card.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], "bitcat-flap-share-card.png", { type: "image/png" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ title: "BITCAT Flap", text: shareText(), files: [file] }); announce("Share card shared."); return; }
    } catch { /* dismissed */ }
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = file.name; link.click(); URL.revokeObjectURL(link.href);
    announce("Share card downloaded.");
  });

  // ---------- contract copy ----------
  let copyReset: ReturnType<typeof setTimeout> | undefined;
  on(copyButton, "click", async () => {
    const address = (caAddr.textContent ?? "").trim();
    let copied = false;
    try {
      await navigator.clipboard.writeText(address);
      copied = true;
    } catch {
      // Fallback for browsers without clipboard access: select the address so it can be copied manually.
      const range = document.createRange();
      range.selectNodeContents(caAddr);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    copyButton.textContent = copied ? "Copied ✓" : "Selected";
    copyButton.classList.toggle("is-copied", copied);
    announce(copied ? "Contract address copied." : "Contract address selected. Press Command or Control C to copy.");
    if (copyReset) clearTimeout(copyReset);
    copyReset = later(() => {
      copyButton.textContent = "Copy";
      copyButton.classList.remove("is-copied");
    }, 1600);
  });

  // ---------- sound ----------
  let muted = storageGet(MUTE_KEY) === "1";
  let audio: AudioContext | null = null;
  const syncMute = () => muteButton.setAttribute("aria-pressed", String(muted));
  on(muteButton, "click", () => {
    muted = !muted;
    storageSet(MUTE_KEY, muted ? "1" : "0");
    syncMute();
  });
  syncMute();

  // Tiny synthesized effects: no audio files to load. The context is created on the first input gesture.
  function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
    if (muted) return;
    try {
      const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      audio ??= new AudioCtor();
      if (audio.state === "suspended") void audio.resume();
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
    } catch {
      /* audio unsupported */
    }
  }
  const sfx = {
    flap: () => tone(420, 0.09, "triangle", 0.05, 680),
    candle: () => tone(880, 0.06, "square", 0.02),
    coin: () => {
      tone(988, 0.06, "square", 0.03);
      later(() => tone(1319, 0.12, "square", 0.03), 60);
    },
    level: () => {
      tone(660, 0.08, "triangle", 0.04);
      later(() => tone(990, 0.14, "triangle", 0.04), 80);
    },
    crash: () => tone(260, 0.35, "sawtooth", 0.05, 55),
    ath: () => [523, 659, 784, 1047].forEach((f, i) => later(() => tone(f, 0.14, "triangle", 0.045), 90 * i)),
  };
  const vibrate = (ms: number) => {
    if (!muted) navigator.vibrate?.(ms);
  };

  // ---------- game flow ----------
  bestEl.textContent = fmtMcap(best);

  function burst(x: number, y: number, color: string, count = 10) {
    if (reducedMotion?.matches) return;
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, vx: Math.random() * 4 - 2, vy: Math.random() * 3 - 2.5, life: 1, color });
    }
  }

  function recordFlap() {
    if (flapTicks[flapTicks.length - 1] !== sim.tick) flapTicks.push(sim.tick);
    flapSimulation(sim);
  }

  function startRun() {
    sim = createSimulation();
    currentRun = null;
    flapTicks = [];
    telemetry.length = 0;
    lastRun = null;
    particles = [];
    catRot = 0;
    levelFlashUntil = 0;
    newAth = false;
    submitNote = "";
    publishing = false;
    scorePublished = false;
    scoreEl.textContent = fmtMcap(0);
    state = "play";
    ensureSeed();
    if (sim.rng === null) prefetchRun();
    recordFlap();
    updateControls();
    announce("Game started. Current market cap is zero.");
    sfx.flap();
    burst(sim.cat.x + 10, sim.cat.y + 40, "#1fa35a");
  }

  function pause() {
    if (state !== "play") return;
    state = "paused";
    recordTelemetry("pause");
    updateControls();
    announce("Paused. Press Space, Arrow Up or Resume to continue.");
  }

  function flap() {
    if (state === "ready") return startRun();
    if (state === "over") {
      // Ignore taps still in flight from the crash so the result screen isn't skipped.
      if (performance.now() - overAt < RESTART_DELAY_MS) return;
      return startRun();
    }
    if (state === "paused") {
      state = "play";
      recordTelemetry("resume");
      updateControls();
      announce("Resumed.");
    }
    recordFlap();
    sfx.flap();
    burst(sim.cat.x + 8, sim.cat.y + 50, "#f7931a");
  }

  function gameOver() {
    state = "over";
    overAt = performance.now();
    const cat = sim.cat;
    burst(cat.x + cat.w / 2, cat.y + cat.h / 2, "#ff4d4d");
    cat.vy = Math.max(cat.vy, -3);
    vibrate(120);
    newAth = sim.score > best;
    if (newAth) {
      best = sim.score;
      storageSet(BEST_KEY, String(best));
      bestEl.textContent = fmtMcap(best);
      sfx.ath();
      burst(W / 2, H * 0.42, "#f7931a", 40);
    } else {
      sfx.crash();
    }
    lastRun = { token: currentRun, score: sim.score, ticks: sim.tick, flaps: flapTicks };
    prefetchRun();
    updateControls();
    const peak = "Game over. Peak market cap " + fmtMcap(sim.score) + ".";
    if (!currentRun) {
      submitNote = sim.score > 0 ? "offline run · can't be published" : "";
      announce(peak + " This run started offline, so it can't be published.");
    } else if (validWallet(walletEl.value)) {
      announce(peak + " Verifying and publishing your score.");
      void submitScore();
    } else {
      submitNote = "guest score · add wallet to publish";
      announce(peak + " Add a public BNB address to publish, or play again.");
    }
  }

  function tick() {
    if (state === "paused") return;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.03;
    }
    particles = particles.filter((p) => p.life > 0);

    if (state === "ready") {
      groundOff += IDLE_SPEED;
      idleTick += 1;
      return;
    }

    const cat = sim.cat;
    if (state === "over") {
      // Visual only: the crashed simulation is final, so the cat can tumble to the ground.
      const restY = H - GROUND_HEIGHT - cat.h + 12;
      if (cat.y < restY) {
        cat.vy = Math.min(cat.vy + GRAVITY, 12);
        cat.y = Math.min(restY, cat.y + cat.vy);
      }
      catRot += (1.25 - catRot) * 0.12;
      return;
    }

    ensureSeed();
    const events = step(sim);
    groundOff += currentSpeed(sim);
    catRot = Math.max(-0.5, Math.min(0.9, cat.vy / 12));

    if (events.candles) {
      scoreEl.textContent = fmtMcap(sim.score);
      burst(cat.x + 40, cat.y + 20, "#1fa35a");
      if (events.levelUp) {
        levelFlashUntil = sim.tick + Math.round(1.2 * TICKS_PER_SECOND);
        sfx.level();
        announce("Level " + (sim.level + 1) + ". Speed up. Market cap " + fmtMcap(sim.score) + ".");
      } else {
        sfx.candle();
      }
    }
    for (const coin of events.coins) {
      scoreEl.textContent = fmtMcap(sim.score);
      sfx.coin();
      burst(coin.x, coin.y, "#f7931a");
    }
    if (events.crashed) gameOver();
  }

  // ---------- drawing ----------
  const catImg = new Image();
  catImg.src = "/assets/flap-cat.png";
  const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
  // Light "day chart" paper: the mascot is a black cat, so a dark sky hid it.
  bgGradient.addColorStop(0, "#fffaf0");
  bgGradient.addColorStop(1, "#f5e6c3");

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBg() {
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
    // faint grid like a chart, stroked as a single path
    ctx.strokeStyle = "rgba(138,91,0,0.09)";
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
    const gy = H - GROUND_HEIGHT;
    ctx.fillStyle = "#15120e";
    ctx.fillRect(0, gy, W, GROUND_HEIGHT);
    ctx.fillStyle = "#1fa35a";
    ctx.fillRect(0, gy, W, 3);
    ctx.fillStyle = "#f7931a";
    const dash = 28;
    for (let x = -(groundOff % (dash * 2)); x < W; x += dash * 2) ctx.fillRect(x, gy + 10, dash, 4);
    ctx.fillStyle = "#6d655a";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("BITCAT  •  HODL THE FLAP", 16, H - 22);
  }

  function drawHalo(x: number, y: number, w: number, h: number, color: string) {
    if (h <= 0) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.08;
    roundRect(x - 9, y - 9, w + 18, h + 18, 14);
    ctx.fill();
    ctx.globalAlpha = 0.14;
    roundRect(x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
    ctx.restore();
  }

  function drawCandle(x: number, topH: number, gap: number, wick: number) {
    const botY = topH + gap;
    const botH = H - GROUND_HEIGHT - botY;
    const rekt = state === "over";
    const bodyC = rekt ? "#e0473a" : "#22b35e";
    const wickC = rekt ? "#a8281e" : "#12783a";
    // Layered translucent halos instead of shadowBlur, which is very slow on phones at 2x resolution.
    drawHalo(x, 0, PIPE_WIDTH, topH, bodyC);
    drawHalo(x, botY, PIPE_WIDTH, botH, bodyC);
    ctx.fillStyle = wickC;
    ctx.fillRect(x + PIPE_WIDTH / 2 - 3, topH - wick, 6, wick);
    ctx.fillRect(x + PIPE_WIDTH / 2 - 3, botY + botH, 6, Math.min(wick, 24));
    ctx.fillStyle = bodyC;
    roundRect(x, 0, PIPE_WIDTH, topH, 6);
    ctx.fill();
    roundRect(x, botY, PIPE_WIDTH, botH, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x + 10, 8, 8, Math.max(0, topH - 16));
    // ₿ stamp
    ctx.fillStyle = "rgba(13,15,20,0.3)";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    if (topH > 70) ctx.fillText("₿", x + PIPE_WIDTH / 2, topH - 18);
    if (botH > 70) ctx.fillText("₿", x + PIPE_WIDTH / 2, botY + 42);
    ctx.textAlign = "left";
  }

  function drawCoin(coin: Coin) {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.fillStyle = "#f7931a";
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r + 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8a5b00";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, coin.r - 4, 0, Math.PI * 2);
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
    const cat = sim.cat;
    let y = cat.y;
    let rot = catRot;
    if (state === "ready") {
      const sway = reducedMotion?.matches ? 0 : Math.sin((idleTick * TICK_MS) / 350);
      y = H * 0.42 + sway * 10;
      rot = sway * 0.08;
    }
    ctx.save();
    ctx.translate(cat.x + cat.w / 2, y + cat.h / 2);
    ctx.rotate(rot);
    if (catImg.complete && catImg.naturalWidth) {
      ctx.drawImage(catImg, -cat.w / 2, -cat.h / 2, cat.w, cat.h);
    } else {
      ctx.fillStyle = "#111";
      ctx.fillRect(-cat.w / 2, -cat.h / 2, cat.w, cat.h);
    }
    ctx.restore();
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

  function drawResultPanel(top: number, bottom: number) {
    ctx.fillStyle = "rgba(13,15,20,0.9)";
    roundRect(44, H * top, W - 88, H * (bottom - top), 24);
    ctx.fill();
  }

  function drawOverlay() {
    ctx.textAlign = "center";
    if (state === "play" && sim.tick < levelFlashUntil) {
      ctx.globalAlpha = Math.min(1, (levelFlashUntil - sim.tick) / 24);
      const label = "BULL RUN · LVL " + (sim.level + 1);
      ctx.font = "bold 26px sans-serif";
      ctx.lineJoin = "round";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(8,10,14,0.9)";
      ctx.strokeText(label, W / 2, H * 0.2);
      ctx.fillStyle = "#f7931a";
      ctx.fillText(label, W / 2, H * 0.2);
      ctx.globalAlpha = 1;
    }
    if (state === "paused") {
      drawResultPanel(0.35, 0.52);
      ctx.fillStyle = "#f7931a";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("PAUSED", W / 2, H * 0.42);
      ctx.fillStyle = "#cfd3d8";
      ctx.font = "22px sans-serif";
      ctx.fillText("tap or press Space to resume", W / 2, H * 0.48);
    }
    if (state === "ready") {
      ctx.fillStyle = "#15120e";
      ctx.font = "bold 72px sans-serif";
      ctx.fillText("BITCAT", W / 2, H * 0.25);
      ctx.fillStyle = "#1a8f4c";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("FLAP THROUGH THE CANDLES", W / 2, H * 0.305);
      ctx.fillStyle = "#15120e";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("tap or press Space to start", W / 2, H * 0.645);
      if (best > 0) {
        ctx.fillStyle = "#a86100";
        ctx.font = "20px sans-serif";
        ctx.fillText("your ATH  " + fmtMcap(best), W / 2, H * 0.695);
      }
      const bob = reducedMotion?.matches ? 0 : Math.sin(performance.now() / 250) * 6;
      ctx.fillStyle = "#6d655a";
      ctx.font = "18px sans-serif";
      ctx.fillText(
        playerWallet ? "playing as " + shortAddr(playerWallet) : "guest mode · no wallet needed",
        W / 2,
        H * (best > 0 ? 0.745 : 0.705) + bob,
      );
    }
    if (state === "over") {
      drawResultPanel(0.295, 0.83);
      ctx.fillStyle = "#ff4d4d";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("REKT", W / 2, H * 0.36);
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.fillText("PEAK MCAP", W / 2, H * 0.4);
      ctx.fillStyle = "#00ff7a";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(fmtMcap(sim.score), W / 2, H * 0.445);
      // Result details: sized to stay readable when the canvas is scaled down on shorter screens.
      ctx.fillStyle = "#f7931a";
      if (newAth) {
        ctx.font = "bold 25px sans-serif";
        ctx.fillText("NEW ATH 🚀", W / 2, H * 0.492);
      } else {
        ctx.font = "20px sans-serif";
        ctx.fillText("ath  " + fmtMcap(best), W / 2, H * 0.49);
      }
      if (playerWallet) {
        ctx.fillStyle = "#9aa3ad";
        ctx.font = "15px " + MONO;
        ctx.fillText(shortAddr(playerWallet), W / 2, H * 0.523);
      }
      if (submitNote) {
        ctx.fillStyle = "#00ff7a";
        ctx.font = "18px sans-serif";
        ctx.fillText(submitNote, W / 2, H * 0.555);
      }
      if (lastBoard.length) {
        ctx.fillStyle = "#f7931a";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("LEADERBOARD", W / 2, H * 0.6);
        const me = playerWallet.toLowerCase();
        lastBoard.slice(0, 5).forEach((row, i) => {
          ctx.fillStyle = me && row.wallet.toLowerCase() === me ? "#00ff7a" : "#cfd3d8";
          ctx.font = "16px " + MONO;
          ctx.fillText("#" + row.rank + "  " + shortAddr(row.wallet) + "  " + fmtMcap(row.mcap), W / 2, H * 0.634 + i * 25);
        });
      }
      if (performance.now() - overAt >= RESTART_DELAY_MS) {
        ctx.fillStyle = "#cfd";
        ctx.font = "22px sans-serif";
        ctx.fillText("tap to try again", W / 2, H * 0.795);
      }
    }
    ctx.textAlign = "left";
  }

  // ---------- loop and input ----------
  let frame = 0;
  let last = performance.now();
  let accumulator = 0;
  function loop(now: number) {
    // Fixed 60Hz steps keep speed identical on 120Hz+ displays and match the server replay exactly.
    // Long frames are clamped (e.g. returning from a background tab) so the run doesn't fast-forward.
    accumulator += Math.min(MAX_FRAME_MS, Math.max(0, now - last));
    last = now;
    while (accumulator >= TICK_MS) {
      tick();
      accumulator -= TICK_MS;
    }
    drawBg();
    for (const pipe of sim.pipes) drawCandle(pipe.x, pipe.top, pipe.gap, pipe.wick);
    for (const coin of sim.coins) drawCoin(coin);
    drawGround();
    drawParticles();
    drawCat();
    drawOverlay();
    frame = requestAnimationFrame(loop);
  }

  const onInput = (event: Event) => {
    event.preventDefault();
    flap();
  };
  on(canvas, "pointerdown", onInput);
  on(flapButton, "click", onInput);
  // Stop Space from also "clicking" the focused flap button on keyup (a second flap).
  on(flapButton, "keyup", (event) => {
    if (event.code === "Space") event.preventDefault();
  });
  // Leave keys alone on other controls (links, Publish, Refresh, inputs) so they keep working.
  const ownsKeyboard = (target: EventTarget | null) =>
    target === canvas ||
    target === flapButton ||
    !(target instanceof Element && target.closest("a, button, input, textarea, select, [contenteditable]"));
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || !ownsKeyboard(event.target)) return;
      if ((event.code === "KeyP" || event.code === "Escape") && state === "play") {
        event.preventDefault();
        pause();
        return;
      }
      if (event.code !== "Space" && event.code !== "ArrowUp") return;
      event.preventDefault();
      if (!event.repeat) flap();
    },
    { signal },
  );
  // Pause when the tab is hidden (app switch, notification, tab change) instead of crashing unseen.
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) { recordTelemetry("hidden"); pause(); }
      else { recordTelemetry("visible"); if (state !== "play") prefetchRun(); }
    },
    { signal },
  );
  window.addEventListener("blur", () => { recordTelemetry("blur"); pause(); }, { signal });
  window.addEventListener("focus", () => recordTelemetry("focus"), { signal });

  if (process.env.NODE_ENV !== "production") {
    // Development-only test hook (stripped from production builds): end the run with a chosen score.
    (window as unknown as { __flapTest?: object }).__flapTest = {
      finishRun(score: number) {
        if (state !== "play") return;
        sim.score = score;
        sim.crashed = true;
        gameOver();
      },
    };
  }

  loadBoard();
  prefetchRun();
  frame = requestAnimationFrame(loop);
  updateControls();
  announce("Game ready. Press Start game, Space, or Arrow Up. A wallet is only needed to publish a score.");

  return () => {
    lifetime.abort();
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    void audio?.close().catch(() => {});
  };
}
