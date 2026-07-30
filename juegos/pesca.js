// --- DATA & CONFIG ---
// Same note/color mapping used by Atrapa Notas and Memoria Musical, for
// visual consistency across the three "arcade" games.
const NOTE_DEFS = [
  { id: "C4", name: "DO",  color: "#ef4444", freq: 261.63, staffY: 117 },
  { id: "D4", name: "RE",  color: "#f97316", freq: 293.66, staffY: 109 },
  { id: "E4", name: "MI",  color: "#eab308", freq: 329.63, staffY: 101 },
  { id: "F4", name: "FA",  color: "#22c55e", freq: 349.23, staffY: 93 },
  { id: "G4", name: "SOL", color: "#00e5ff", freq: 392.00, staffY: 85 },
  { id: "A4", name: "LA",  color: "#3b82f6", freq: 440.00, staffY: 77 },
  { id: "B4", name: "SI",  color: "#a855f7", freq: 493.88, staffY: 69 },
  { id: "C5", name: "DO",  color: "#ec4899", freq: 523.25, staffY: 61 }
];

// Real vector G-clef glyph from the Bravura (SMuFL) music font (same one
// used in atrapa.js/game.js/teoria.html), so the mini staff renders
// identically on every device.
const GCLEF_PATH = "M376 415l25 -145c3 -18 3 -18 29 -18c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8c79 69 174 159 174 270c0 55 -27 82 -60 82zM361 262l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24zM430 103l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163c-12 1 -13 -2 -11 -14z";
const MINI_STAFF_LINE_YS = [37, 53, 69, 85, 101]; // 16px spacing, matches NOTE_DEFS.staffY table

const TARGET_CATCHES = 12;
const MAX_LIVES = 3;

// --- STATE ---
let chosenMode = "ver"; // "ver" | "escuchar"
let chosenFishCount = 4;
let activeNotes = [];
let fishes = [];
let targetNoteId = null;
let score = 0;
let lives = MAX_LIVES;
let isGameActive = false;
let audioCtx = null;
let animationId = null;

// --- DOM ---
const canvas = document.getElementById("pond-canvas");
const ctx = canvas.getContext("2d");
const hudMode = document.getElementById("hud-mode");
const hudScore = document.getElementById("hud-score");
const heartsBox = document.getElementById("hearts-box");
const feedbackBox = document.getElementById("feedback-box");
const startOverlay = document.getElementById("start-overlay");
const btnStart = document.getElementById("btn-start");
const promptOverlay = document.getElementById("prompt-overlay");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const btnRestartWin = document.getElementById("btn-restart-win");
const btnRestartLose = document.getElementById("btn-restart-lose");

const MODE_LABELS = { ver: "Ver y Pescar", escuchar: "Escuchar y Pescar" };

document.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  document.querySelectorAll("#mode-selector .btn-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      chosenMode = btn.dataset.mode;
      document.querySelectorAll("#mode-selector .btn-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.querySelectorAll("#difficulty-selector .btn-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      chosenFishCount = parseInt(btn.dataset.fish);
      document.querySelectorAll("#difficulty-selector .btn-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  btnStart.addEventListener("click", handleStartClick);
  btnRestartWin.addEventListener("click", startGame);
  btnRestartLose.addEventListener("click", startGame);
  canvas.addEventListener("click", handleCanvasClick);
});

function resizeCanvas() {
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

// --- AUDIO (self-contained synth) ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playNoteSound(freq, duration = 0.6) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.35, now + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  const osc2 = audioCtx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2, now);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.18, now);

  osc.connect(masterGain);
  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + duration);
  osc2.stop(now + duration);
}

function playSplashSound(isGood) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = isGood ? "sine" : "sawtooth";
  osc.frequency.setValueAtTime(isGood ? 500 : 140, now);
  osc.frequency.exponentialRampToValueAtTime(isGood ? 900 : 40, now + 0.3);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

// --- MINI STAFF (for "ver" mode) ---
function renderMiniStaff(noteDef) {
  const lines = MINI_STAFF_LINE_YS.map(y => `<line x1="15" y1="${y}" x2="115" y2="${y}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />`).join("");

  const clef = `<g transform="translate(20, 85) scale(${16 / 250})"><g transform="scale(1,-1)"><path fill="var(--color-gold)" d="${GCLEF_PATH}" /></g></g>`;

  let ledger = "";
  if (noteDef.staffY >= 117 || noteDef.staffY <= 61) {
    ledger = `<line x1="76" y1="${noteDef.staffY}" x2="94" y2="${noteDef.staffY}" stroke="#ffffff" stroke-width="1.5" />`;
  }

  const noteHead = `<ellipse cx="85" cy="${noteDef.staffY}" rx="7" ry="4.5" fill="${noteDef.color}" transform="rotate(-20, 85, ${noteDef.staffY})" />`;
  const stemDir = noteDef.staffY > 85 ? -22 : 22;
  const stemX = noteDef.staffY > 85 ? 91 : 79;
  const stem = `<line x1="${stemX}" y1="${noteDef.staffY}" x2="${stemX}" y2="${noteDef.staffY + stemDir}" stroke="#ffffff" stroke-width="1.5" />`;

  return `<svg id="mini-staff-svg" viewBox="0 0 130 130">${lines}${clef}${ledger}${noteHead}${stem}</svg>`;
}

function renderPromptOverlay() {
  const noteDef = NOTE_DEFS.find(n => n.id === targetNoteId);
  if (!noteDef) return;

  if (chosenMode === "ver") {
    promptOverlay.innerHTML = `${renderMiniStaff(noteDef)}<span class="prompt-hint">Pesca esta nota</span>`;
  } else {
    promptOverlay.innerHTML = `
      <button class="btn-listen-small" id="btn-listen-pond">🔊</button>
      <span class="prompt-hint">Escucha y pesca</span>
    `;
    document.getElementById("btn-listen-pond").addEventListener("click", () => playNoteSound(noteDef.freq, 0.7));
  }
}

// --- FISH SETUP ---
function buildFishes() {
  activeNotes = NOTE_DEFS.slice(0, chosenFishCount);
  fishes = activeNotes.map((noteDef, i) => createFish(noteDef, i));
}

function createFish(noteDef, laneIndex) {
  const margin = 40;
  const w = canvas.width || 600;
  const h = canvas.height || 300;
  const laneHeight = h / (chosenFishCount);
  const y = laneHeight * laneIndex + laneHeight / 2;
  const dir = Math.random() < 0.5 ? 1 : -1;

  return {
    note: noteDef,
    x: margin + Math.random() * (w - margin * 2),
    baseY: y,
    y: y,
    vx: dir * (0.5 + Math.random() * 0.4),
    phase: Math.random() * Math.PI * 2,
    radius: 26,
    caught: false,
    caughtAnim: 0
  };
}

function pickNewTarget() {
  const noteDef = activeNotes[Math.floor(Math.random() * activeNotes.length)];
  targetNoteId = noteDef.id;
  renderPromptOverlay();

  if (chosenMode === "escuchar") {
    setTimeout(() => playNoteSound(noteDef.freq, 0.7), 350);
  }
}

// --- GAME FLOW ---
function handleStartClick() {
  initAudio();
  startGame();
}

function startGame() {
  resizeCanvas();
  buildFishes();
  isGameActive = true;
  score = 0;
  lives = MAX_LIVES;

  hudMode.textContent = MODE_LABELS[chosenMode];
  hudScore.textContent = `0 / ${TARGET_CATCHES}`;
  updateHeartsDisplay();

  confettiActive = false;
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";

  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "";

  pickNewTarget();

  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
}

function updateHeartsDisplay() {
  heartsBox.innerHTML = "";
  for (let i = 0; i < MAX_LIVES; i++) {
    const heart = document.createElement("span");
    if (i < lives) {
      heart.className = "heart-filled";
      heart.textContent = "❤️";
    } else {
      heart.className = "heart-empty";
      heart.textContent = "🖤";
    }
    heartsBox.appendChild(heart);
  }
}

function handleCanvasClick(e) {
  if (!isGameActive) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
  const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

  let hitFish = null;
  for (const fish of fishes) {
    if (fish.caught) continue;
    const dx = clickX - fish.x;
    const dy = clickY - fish.y;
    if (Math.sqrt(dx * dx + dy * dy) <= fish.radius) {
      hitFish = fish;
      break;
    }
  }

  if (!hitFish) return; // miss the water, no penalty

  if (hitFish.note.id === targetNoteId) {
    handleCatchCorrect(hitFish);
  } else {
    handleCatchWrong(hitFish);
  }
}

function handleCatchCorrect(fish) {
  fish.caught = true;
  fish.caughtAnim = 1;
  playSplashSound(true);

  score++;
  hudScore.textContent = `${score} / ${TARGET_CATCHES}`;
  feedbackBox.className = "feedback-box feedback-correct";
  feedbackBox.textContent = "¡Pez pescado!";

  setTimeout(() => {
    // Respawn this fish slot with a fresh (possibly different) note from the pool
    const idx = fishes.indexOf(fish);
    if (idx !== -1) {
      const newNoteDef = activeNotes[Math.floor(Math.random() * activeNotes.length)];
      fishes[idx] = createFish(newNoteDef, idx);
    }
  }, 500);

  if (score >= TARGET_CATCHES) {
    handleWin();
  } else {
    setTimeout(pickNewTarget, 700);
  }
}

function handleCatchWrong(fish) {
  fish.caughtAnim = 1;
  playSplashSound(false);

  lives--;
  updateHeartsDisplay();
  feedbackBox.className = "feedback-box feedback-wrong";
  feedbackBox.textContent = "¡Ese pez no era! Fíjate bien.";

  if (lives <= 0) {
    handleLose();
  } else {
    showEncouragementToast();
  }
}

const encouragementPhrases = [
  "¡Uy, casi! Fíjate bien en el color y la nota 💪",
  "¡No pasa nada! Vuelve a mirar/escuchar con calma 🌟",
  "¡Vamos, concéntrate! Cada pez tiene su propia nota 🎶",
  "¡Ojo! Revisa bien antes de lanzar el anzuelo 🎣",
  "¡Tú puedes! Respira hondo e inténtalo de nuevo ✨"
];

let toastTimeout = null;
function showEncouragementToast() {
  const toast = document.getElementById("profe-toast");
  const toastText = document.getElementById("profe-toast-text");
  if (!toast || !toastText) return;

  const phrase = encouragementPhrases[Math.floor(Math.random() * encouragementPhrases.length)];
  toastText.textContent = `"${phrase}"`;
  toast.classList.add("show");

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 1400);
}

// --- RENDERING ---
function drawFish(fish) {
  const bob = Math.sin(fish.phase) * 6;
  const y = fish.baseY + bob;
  fish.y = y;

  const facingRight = fish.vx > 0;
  const scaleX = facingRight ? 1 : -1;
  const shrink = fish.caughtAnim > 0 ? 1 - fish.caughtAnim * 0.6 : 1;

  ctx.save();
  ctx.translate(fish.x, y);
  ctx.scale(scaleX * shrink, shrink);
  ctx.globalAlpha = fish.caughtAnim > 0 ? 1 - fish.caughtAnim : 1;

  // Tail
  ctx.beginPath();
  ctx.moveTo(-fish.radius, 0);
  ctx.lineTo(-fish.radius - 14, -12);
  ctx.lineTo(-fish.radius - 14, 12);
  ctx.closePath();
  ctx.fillStyle = fish.note.color;
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.radius, fish.radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = fish.note.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Eye
  ctx.beginPath();
  ctx.arc(fish.radius * 0.45, -fish.radius * 0.25, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#0b0d19";
  ctx.fill();

  ctx.restore();

  // Note label (not mirrored)
  ctx.save();
  ctx.globalAlpha = fish.caughtAnim > 0 ? 1 - fish.caughtAnim : 1;
  ctx.fillStyle = "#0b0d19";
  ctx.font = "800 13px 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(fish.note.name, fish.x, y);
  ctx.restore();
}

function gameLoop() {
  if (!isGameActive) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pond background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "rgba(0, 150, 199, 0.12)");
  grad.addColorStop(1, "rgba(0, 60, 90, 0.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fishes.forEach(fish => {
    if (fish.caughtAnim > 0) {
      fish.caughtAnim += 0.06;
      if (fish.caughtAnim >= 1) return;
    } else {
      fish.x += fish.vx;
      fish.phase += 0.05;
      const margin = fish.radius + 10;
      if (fish.x < margin) { fish.x = margin; fish.vx *= -1; }
      if (fish.x > canvas.width - margin) { fish.x = canvas.width - margin; fish.vx *= -1; }
    }
    drawFish(fish);
  });

  animationId = requestAnimationFrame(gameLoop);
}

// --- CONFETTI (win screen) ---
let confetti = [];
let confettiActive = false;
let confettiCanvas = null;
let confettiCtx = null;
let confettiAnimId = null;

function createConfetti() {
  confettiCanvas = document.getElementById("confetti-canvas");
  if (!confettiCanvas) return;
  confettiCtx = confettiCanvas.getContext("2d");

  const container = document.querySelector(".game-container");
  confettiCanvas.width = container.clientWidth;
  confettiCanvas.height = container.clientHeight;

  confetti = [];
  confettiActive = true;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#1d4ed8", "#a855f7", "#ec4899"];
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height - 20,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 2.5,
      width: Math.random() * 7 + 4,
      height: Math.random() * 12 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8
    });
  }
}

function updateAndDrawConfetti() {
  if (!confettiActive || !confettiCanvas || !confettiCtx) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  let activeConfetti = 0;
  for (let i = 0; i < confetti.length; i++) {
    let c = confetti[i];
    c.y += c.vy;
    c.x += c.vx;
    c.rotation += c.rotationSpeed;
    if (c.x < -10) c.x = confettiCanvas.width + 10;
    if (c.x > confettiCanvas.width + 10) c.x = -10;
    if (c.y < confettiCanvas.height + 20) activeConfetti++;

    confettiCtx.save();
    confettiCtx.translate(c.x, c.y);
    confettiCtx.rotate(c.rotation * Math.PI / 180);
    confettiCtx.fillStyle = c.color;
    confettiCtx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
    confettiCtx.restore();
  }

  if (activeConfetti > 0 && confettiActive) {
    confettiAnimId = requestAnimationFrame(updateAndDrawConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// --- WIN / LOSE ---
function handleWin() {
  isGameActive = false;
  if (animationId) cancelAnimationFrame(animationId);

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  setTimeout(() => {
    winModal.style.display = "flex";
    createConfetti();
    updateAndDrawConfetti();
    document.getElementById("win-message").textContent = `¡Pescaste ${TARGET_CATCHES} notas correctas! Tienes muy buen ojo (y oído) musical.`;
  }, 500);
}

function handleLose() {
  isGameActive = false;
  if (animationId) cancelAnimationFrame(animationId);

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  setTimeout(() => {
    loseModal.style.display = "flex";
  }, 500);
}
