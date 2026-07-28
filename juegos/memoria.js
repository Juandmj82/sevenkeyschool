// --- DATA & CONFIG ---
// Same note/color mapping used by Atrapa Notas, for visual consistency.
const PAD_DEFS = [
  { id: "C4", name: "DO",  color: "#ef4444", freq: 261.63 },
  { id: "D4", name: "RE",  color: "#f97316", freq: 293.66 },
  { id: "E4", name: "MI",  color: "#eab308", freq: 329.63 },
  { id: "F4", name: "FA",  color: "#22c55e", freq: 349.23 },
  { id: "G4", name: "SOL", color: "#00e5ff", freq: 392.00 },
  { id: "A4", name: "LA",  color: "#3b82f6", freq: 440.00 },
  { id: "B4", name: "SI",  color: "#a855f7", freq: 493.88 },
  { id: "C5", name: "DO",  color: "#ec4899", freq: 523.25 }
];

const SPEED_CONFIGS = {
  slow: { noteDuration: 620, gap: 260 },
  medium: { noteDuration: 460, gap: 180 },
  fast: { noteDuration: 340, gap: 110 }
};

const WIN_ROUND = 10;
const MAX_LIVES = 3;
const PROGRESS_KEY = "sevenkeys_memoria_best";

// --- STATE ---
let chosenPadCount = 4;
let chosenSpeed = "slow";
let activePads = [];
let sequence = [];
let playerStep = 0;
let round = 1;
let lives = MAX_LIVES;
let bestRound = 0;
let isGameActive = false;
let isPlayingSequence = false;
let audioCtx = null;

// --- DOM ---
const padBoard = document.getElementById("pad-board");
const hudRound = document.getElementById("hud-round");
const hudBest = document.getElementById("hud-best");
const heartsBox = document.getElementById("hearts-box");
const feedbackBox = document.getElementById("feedback-box");
const startOverlay = document.getElementById("start-overlay");
const btnStart = document.getElementById("btn-start");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const btnContinue = document.getElementById("btn-continue");
const btnRestart = document.getElementById("btn-restart");

document.addEventListener("DOMContentLoaded", () => {
  bestRound = parseInt(localStorage.getItem(PROGRESS_KEY)) || 0;
  hudBest.textContent = bestRound;

  document.querySelectorAll("#difficulty-selector .btn-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      chosenPadCount = parseInt(btn.dataset.pads);
      document.querySelectorAll("#difficulty-selector .btn-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  document.querySelectorAll("#speed-selector .btn-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      chosenSpeed = btn.dataset.speed;
      document.querySelectorAll("#speed-selector .btn-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  btnStart.addEventListener("click", handleStartClick);
  btnRestart.addEventListener("click", startGame);
  btnContinue.addEventListener("click", continueAfterWin);
});

// --- AUDIO (self-contained synth) ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playPadSound(freq, duration = 0.5) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  const osc2 = audioCtx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2, now);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.2, now);

  osc.connect(masterGain);
  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + duration);
  osc2.stop(now + duration);
}

function playErrorSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

// --- BOARD SETUP ---
function buildBoard() {
  activePads = PAD_DEFS.slice(0, chosenPadCount);
  padBoard.innerHTML = "";
  padBoard.className = "pad-board" + (chosenPadCount === 6 ? " pads-6" : "");

  activePads.forEach((pad, index) => {
    const btn = document.createElement("button");
    btn.className = "pad";
    btn.style.background = pad.color;
    btn.style.color = pad.color;
    btn.textContent = pad.name;
    btn.dataset.index = index;
    btn.disabled = true;
    btn.addEventListener("click", () => handlePadClick(index));
    padBoard.appendChild(btn);
  });
}

function litUpPad(index, duration) {
  const btn = padBoard.querySelector(`.pad[data-index="${index}"]`);
  if (!btn) return;
  btn.classList.add("lit");
  playPadSound(activePads[index].freq, duration / 1000);
  setTimeout(() => btn.classList.remove("lit"), duration * 0.85);
}

// --- GAME FLOW ---
function handleStartClick() {
  initAudio();
  startGame();
}

function startGame() {
  buildBoard();
  isGameActive = true;
  round = 1;
  lives = MAX_LIVES;
  sequence = [];
  playerStep = 0;

  confettiActive = false;
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  const cCanvas = document.getElementById("confetti-canvas");
  if (cCanvas) {
    const cCtx = cCanvas.getContext("2d");
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  }

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  updateHeartsDisplay();
  hudRound.textContent = round;

  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";

  addNoteToSequence();
  playSequence();
}

function continueAfterWin() {
  winModal.style.display = "none";
  isGameActive = true;
  playSequence();
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

function addNoteToSequence() {
  const nextIndex = Math.floor(Math.random() * activePads.length);
  sequence.push(nextIndex);
}

function setPadsEnabled(enabled) {
  padBoard.querySelectorAll(".pad").forEach(btn => {
    btn.disabled = !enabled;
  });
}

function playSequence() {
  if (!isGameActive) return;
  isPlayingSequence = true;
  playerStep = 0;
  setPadsEnabled(false);
  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "Observa la secuencia...";

  const cfg = SPEED_CONFIGS[chosenSpeed];
  const stepTime = cfg.noteDuration + cfg.gap;

  sequence.forEach((padIndex, i) => {
    setTimeout(() => {
      litUpPad(padIndex, cfg.noteDuration);
    }, i * stepTime);
  });

  setTimeout(() => {
    isPlayingSequence = false;
    setPadsEnabled(true);
    feedbackBox.className = "feedback-box";
    feedbackBox.textContent = "¡Tu turno! Repite la secuencia.";
  }, sequence.length * stepTime + 150);
}

function handlePadClick(index) {
  if (!isGameActive || isPlayingSequence) return;

  const cfg = SPEED_CONFIGS[chosenSpeed];
  litUpPad(index, cfg.noteDuration * 0.7);

  if (index === sequence[playerStep]) {
    playerStep++;
    if (playerStep === sequence.length) {
      handleRoundComplete();
    }
  } else {
    handleMistake();
  }
}

function handleRoundComplete() {
  setPadsEnabled(false);
  feedbackBox.className = "feedback-box feedback-correct";
  feedbackBox.textContent = "¡Correcto!";

  round++;
  hudRound.textContent = round;

  if (round > bestRound) {
    bestRound = round;
    hudBest.textContent = bestRound;
    localStorage.setItem(PROGRESS_KEY, String(bestRound));
  }

  if (round > WIN_ROUND) {
    handleWin();
    return;
  }

  addNoteToSequence();
  setTimeout(playSequence, 900);
}

function handleMistake() {
  setPadsEnabled(false);
  lives--;
  updateHeartsDisplay();
  playErrorSound();

  feedbackBox.className = "feedback-box feedback-wrong";
  feedbackBox.textContent = "¡Esa no era! Inténtalo de nuevo.";

  if (lives <= 0) {
    handleLose();
  } else {
    showEncouragementToast();
    setTimeout(playSequence, 1200);
  }
}

const encouragementPhrases = [
  "¡Uy, casi! Presta mucha atención al orden 💪",
  "¡No pasa nada! Observa bien los colores y repite 🌟",
  "¡Vamos, concéntrate! Cuenta las notas mentalmente 🎶",
  "¡Ojo! Recuerda el inicio de la secuencia 🎹",
  "¡Tú puedes! Respira hondo e inténtalo otra vez ✨"
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

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  setTimeout(() => {
    winModal.style.display = "flex";
    createConfetti();
    updateAndDrawConfetti();
    document.getElementById("win-message").textContent = `¡Impresionante memoria musical! Has llegado a la ronda ${WIN_ROUND}. ¿Te animas a seguir y superar tu récord?`;
  }, 500);
}

function handleLose() {
  isGameActive = false;

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  setTimeout(() => {
    document.getElementById("lose-message").textContent = `"¡Ouch, nos quedamos sin vidas! ⚡ Llegaste hasta la ronda ${round}. La memoria musical se entrena poco a poco. ¿Lo intentamos otra vez?"`;
    loseModal.style.display = "flex";
  }, 500);
}
