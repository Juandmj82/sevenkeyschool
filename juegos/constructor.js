// --- DATA & CONFIG ---
// Real vector G-clef glyph from the Bravura (SMuFL) music font (same one
// used in atrapa.js/game.js/pesca.js/teoria.html), so the clef renders
// identically on every device.
const GCLEF_PATH = "M376 415l25 -145c3 -18 3 -18 29 -18c147 0 241 -113 241 -241c0 -113 -67 -198 -168 -238c-14 -6 -15 -5 -13 -17c11 -62 29 -157 29 -214c0 -170 -130 -200 -197 -200c-151 0 -190 98 -190 163c0 62 40 115 107 115c61 0 96 -47 96 -102c0 -58 -36 -85 -67 -94c-23 -7 -32 -10 -32 -17c0 -13 26 -29 80 -29c59 0 159 18 159 166c0 47 -15 134 -27 201c-2 12 -4 11 -15 9c-20 -4 -46 -6 -69 -6c-245 0 -364 165 -364 339c0 202 153 345 297 464c12 10 11 12 9 24c-7 41 -14 106 -14 164c0 104 24 229 98 311c20 22 51 48 65 48c11 0 37 -28 52 -50c41 -60 65 -146 65 -233c0 -153 -82 -280 -190 -381c-6 -6 -8 -7 -6 -19zM470 943c-61 0 -133 -96 -133 -252c0 -32 2 -66 6 -92c2 -13 6 -14 13 -8c79 69 174 159 174 270c0 55 -27 82 -60 82zM361 262l-21 128c-2 11 -4 12 -14 4c-47 -38 -93 -75 -153 -142c-83 -94 -93 -173 -93 -232c0 -139 113 -236 288 -236c20 0 40 2 56 5c15 3 16 3 14 14l-50 298c-2 11 -4 12 -20 8c-61 -17 -100 -60 -100 -117c0 -46 30 -89 72 -107c7 -3 15 -6 15 -13c0 -6 -4 -11 -12 -11c-7 0 -19 3 -27 6c-68 23 -115 87 -115 177c0 85 57 164 145 194c18 6 18 5 15 24zM430 103l49 -285c2 -12 4 -12 16 -6c56 28 94 79 94 142c0 88 -67 156 -148 163c-12 1 -13 -2 -11 -14z";

// Same 8-note diatonic range and Y mapping already validated in game.js
// (Clave de Sol, C4-C5). Staff lines at Y = 60, 80, 100, 120, 140.
const NOTE_Y_MAP = {
  "C4": 160, "D4": 150, "E4": 140, "F4": 130,
  "G4": 120, "A4": 110, "B4": 100, "C5": 90
};
const NOTE_ORDER = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const NOTE_NAMES_ES = { C: "DO", D: "RE", E: "MI", F: "FA", G: "SOL", A: "LA", B: "SI" };

const NOTE_FREQS = {
  "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23,
  "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25
};

const STAFF_X_START = 100;
const STAFF_X_END = 480;
const MAX_BEATS_LIBRE = 8; // total "tiempos" available in Modo Libre
const BEAT_WIDTH = (STAFF_X_END - STAFF_X_START) / MAX_BEATS_LIBRE;
const BEAT_MS = 420; // playback duration of one "tiempo" (negra)

// negra = 1 tiempo, blanca = 2 tiempos, corchea = 1/2 tiempo
const DURATION_BEATS = { negra: 1, blanca: 2, corchea: 0.5 };
const DURATION_LABELS = { negra: "Negra", blanca: "Blanca", corchea: "Corchea" };

const RETO_MELODY_LENGTH = 4;
const RETO_TARGET_SCORE = 8;
const MAX_LIVES = 3;

// --- STATE ---
let chosenMode = "libre"; // "libre" | "reto"
let selectedDuration = "negra"; // "negra" | "blanca" | "corchea" (Modo Libre only)
let melody = []; // array of { note, duration }
let targetMelody = [];
let score = 0;
let lives = MAX_LIVES;
let isGameActive = false;
let audioCtx = null;
let isPlaying = false;

// --- AUDIO (real piano samples with synth fallback, same as Pesca Notas / Atrapa Notas) ---
const sampleCache = {};
let samplesLoaded = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function loadPianoSamples(callback) {
  initAudio();
  const notesToLoad = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

  const originalText = btnStart.textContent;
  btnStart.setAttribute("disabled", "true");
  btnStart.textContent = "Cargando piano real...";

  const promises = notesToLoad.map(note => {
    if (sampleCache[note]) return Promise.resolve();
    const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/${note}.mp3`;
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Fetch failed");
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => { sampleCache[note] = audioBuffer; })
      .catch(err => {
        console.warn(`Error al cargar piano real para ${note}, usando sintetizador de respaldo.`, err);
      });
  });

  Promise.all(promises).finally(() => {
    btnStart.removeAttribute("disabled");
    btnStart.textContent = originalText;
    samplesLoaded = true;
    callback();
  });
}

function playNoteSound(noteId, duration = 0.6) {
  if (!audioCtx) return;
  const buffer = sampleCache[noteId];
  if (buffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } else {
    playTone(NOTE_FREQS[noteId], duration);
  }
}

function playTone(freq, duration = 0.6) {
  if (!audioCtx || !freq) return;
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

function playMelody(notes, onDone) {
  if (isPlaying || notes.length === 0) return;
  isPlaying = true;
  let elapsedMs = 0;
  notes.forEach(({ note, duration }) => {
    const beats = DURATION_BEATS[duration] || 1;
    const noteMs = beats * BEAT_MS;
    setTimeout(() => playNoteSound(note, noteMs / 1000 * 0.9), elapsedMs);
    elapsedMs += noteMs;
  });
  setTimeout(() => {
    isPlaying = false;
    if (onDone) onDone();
  }, elapsedMs + 200);
}

// --- DOM ---
const staffSvg = document.getElementById("builder-staff-svg");
const hudMode = document.getElementById("hud-mode");
const hudScoreItem = document.getElementById("hud-score-item");
const hudScore = document.getElementById("hud-score");
const hudLivesItem = document.getElementById("hud-lives-item");
const heartsBox = document.getElementById("hearts-box");
const feedbackBox = document.getElementById("feedback-box");
const startOverlay = document.getElementById("start-overlay");
const overlayDesc = document.getElementById("overlay-desc");
const btnStart = document.getElementById("btn-start");
const btnPlay = document.getElementById("btn-play");
const btnUndo = document.getElementById("btn-undo");
const btnClear = document.getElementById("btn-clear");
const btnCheck = document.getElementById("btn-check");
const noteCounter = document.getElementById("note-counter");
const durationSelector = document.getElementById("duration-selector");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const btnRestartWin = document.getElementById("btn-restart-win");
const btnRestartLose = document.getElementById("btn-restart-lose");

const MODE_LABELS = { libre: "Modo Libre", reto: "Modo Reto" };
const MODE_DESCRIPTIONS = {
  libre: `"¡Toca el pentagrama para ir colocando notas y componer tu propia melodía! Después la puedes escuchar tocando el botón de reproducir."`,
  reto: `"¡Aquí viene el reto! Voy a tocarte una melodía corta. Escúchala con atención y luego reconstrúyela tocando las notas en el pentagrama, en el mismo orden."`
};

document.addEventListener("DOMContentLoaded", () => {
  drawStaffBase();

  document.querySelectorAll("#mode-selector .btn-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      chosenMode = btn.dataset.mode;
      document.querySelectorAll("#mode-selector .btn-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      overlayDesc.textContent = MODE_DESCRIPTIONS[chosenMode];
    });
  });

  document.querySelectorAll("#duration-selector .duration-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedDuration = btn.dataset.duration;
      document.querySelectorAll("#duration-selector .duration-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  btnStart.addEventListener("click", handleStartClick);
  btnRestartWin.addEventListener("click", startGame);
  btnRestartLose.addEventListener("click", startGame);
  btnPlay.addEventListener("click", handlePlayClick);
  btnUndo.addEventListener("click", handleUndoClick);
  btnClear.addEventListener("click", handleClearClick);
  btnCheck.addEventListener("click", handleCheckClick);
  staffSvg.addEventListener("click", handleStaffClick);
});

// --- STAFF DRAWING ---
function drawStaffBase() {
  staffSvg.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const y = 60 + i * 20;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "40");
    line.setAttribute("y1", y);
    line.setAttribute("x2", "490");
    line.setAttribute("y2", y);
    line.setAttribute("class", "staff-line");
    line.setAttribute("stroke", "rgba(255, 255, 255, 0.25)");
    line.setAttribute("stroke-width", "2");
    staffSvg.appendChild(line);
  }

  const clefGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  clefGroup.setAttribute("class", "clef-glyph");
  clefGroup.setAttribute("transform", "translate(20, 120) scale(0.08)");
  const flip = document.createElementNS("http://www.w3.org/2000/svg", "g");
  flip.setAttribute("transform", "scale(1,-1)");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "var(--color-gold)");
  path.setAttribute("d", GCLEF_PATH);
  flip.appendChild(path);
  clefGroup.appendChild(flip);
  staffSvg.appendChild(clefGroup);
}

function totalBeats(items) {
  return items.reduce((sum, item) => sum + (DURATION_BEATS[item.duration] || 1), 0);
}

function redrawMelody() {
  const linesAndClef = Array.from(staffSvg.querySelectorAll("line.staff-line, g.clef-glyph"));
  staffSvg.innerHTML = "";
  linesAndClef.forEach(el => staffSvg.appendChild(el));

  let cumulativeBeats = 0;
  melody.forEach(({ note, duration }) => {
    const beats = DURATION_BEATS[duration] || 1;
    const x = STAFF_X_START + (cumulativeBeats + beats / 2) * BEAT_WIDTH;
    drawNoteAt(x, NOTE_Y_MAP[note], duration);
    cumulativeBeats += beats;
  });
}

function drawNoteAt(x, y, duration = "negra") {
  if (y >= 160 || y <= 90) {
    const ledger = document.createElementNS("http://www.w3.org/2000/svg", "line");
    ledger.setAttribute("x1", x - 14);
    ledger.setAttribute("y1", y);
    ledger.setAttribute("x2", x + 14);
    ledger.setAttribute("y2", y);
    ledger.setAttribute("stroke", "white");
    ledger.setAttribute("stroke-width", "2");
    staffSvg.appendChild(ledger);
  }

  const isHollow = duration === "blanca";
  const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  head.setAttribute("cx", x);
  head.setAttribute("cy", y);
  head.setAttribute("rx", "10");
  head.setAttribute("ry", "7");
  if (isHollow) {
    head.setAttribute("fill", "var(--bg-dark)");
    head.setAttribute("stroke", "var(--color-cyan)");
    head.setAttribute("stroke-width", "2.5");
  } else {
    head.setAttribute("fill", "var(--color-cyan)");
  }
  head.setAttribute("transform", `rotate(-20, ${x}, ${y})`);
  head.setAttribute("filter", "drop-shadow(0px 0px 4px var(--color-cyan-glow))");
  staffSvg.appendChild(head);

  const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const stemLength = 42;
  const stemUp = y >= 100;
  const stemX = stemUp ? x + 9 : x - 9;
  const stemY1 = stemUp ? y - 2 : y + 2;
  const stemY2 = stemUp ? y - stemLength : y + stemLength;
  stem.setAttribute("x1", stemX);
  stem.setAttribute("y1", stemY1);
  stem.setAttribute("x2", stemX);
  stem.setAttribute("y2", stemY2);
  stem.setAttribute("stroke", "var(--text-main)");
  stem.setAttribute("stroke-width", "2.2");
  staffSvg.appendChild(stem);

  if (duration === "corchea") {
    const flag = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const flagD = stemUp
      ? `M ${stemX} ${stemY2} q 12 4 12 18 q -6 -8 -12 -8 Z`
      : `M ${stemX} ${stemY2} q -12 -4 -12 -18 q 6 8 12 8 Z`;
    flag.setAttribute("d", flagD);
    flag.setAttribute("fill", "var(--text-main)");
    staffSvg.appendChild(flag);
  }
}

function nearestNoteFromY(clickY) {
  let closestNote = NOTE_ORDER[0];
  let closestDist = Infinity;
  for (const noteId of NOTE_ORDER) {
    const dist = Math.abs(NOTE_Y_MAP[noteId] - clickY);
    if (dist < closestDist) {
      closestDist = dist;
      closestNote = noteId;
    }
  }
  return closestNote;
}

function handleStaffClick(e) {
  if (!isGameActive || isPlaying) return;

  if (chosenMode === "reto") {
    if (melody.length >= RETO_MELODY_LENGTH) return;
  } else {
    const duration = selectedDuration;
    if (totalBeats(melody) + (DURATION_BEATS[duration] || 1) > MAX_BEATS_LIBRE) return;
  }

  const point = staffSvg.createSVGPoint();
  point.x = e.clientX;
  point.y = e.clientY;
  const svgPoint = point.matrixTransform(staffSvg.getScreenCTM().inverse());

  if (svgPoint.x < 95) return; // ignore clicks on the clef area

  const noteId = nearestNoteFromY(svgPoint.y);
  const duration = chosenMode === "reto" ? "negra" : selectedDuration;
  melody.push({ note: noteId, duration });
  redrawMelody();
  playNoteSound(noteId, 0.4);
  updateToolbarState();
}

// --- TOOLBAR ACTIONS ---
function handlePlayClick() {
  if (melody.length === 0) return;
  initAudio();
  playMelody(melody);
}

function handleUndoClick() {
  if (melody.length === 0) return;
  melody.pop();
  redrawMelody();
  updateToolbarState();
}

function handleClearClick() {
  melody = [];
  redrawMelody();
  updateToolbarState();
  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "";
}

function updateToolbarState() {
  if (chosenMode === "reto") {
    noteCounter.textContent = `${melody.length} / ${RETO_MELODY_LENGTH} notas`;
    btnCheck.hidden = false;
    btnCheck.disabled = melody.length !== RETO_MELODY_LENGTH;
  } else {
    const used = totalBeats(melody);
    const usedLabel = Number.isInteger(used) ? used : used.toFixed(1);
    noteCounter.textContent = `${usedLabel} / ${MAX_BEATS_LIBRE} tiempos`;
    btnCheck.hidden = true;
  }
  btnUndo.disabled = melody.length === 0;
  btnClear.disabled = melody.length === 0;
  btnPlay.disabled = melody.length === 0;
}

// --- GAME FLOW ---
function handleStartClick() {
  initAudio();
  if (!samplesLoaded) {
    loadPianoSamples(startGame);
  } else {
    startGame();
  }
}

function startGame() {
  isGameActive = true;
  melody = [];
  score = 0;
  lives = MAX_LIVES;

  hudMode.textContent = MODE_LABELS[chosenMode];
  hudScoreItem.hidden = chosenMode !== "reto";
  hudLivesItem.hidden = chosenMode !== "reto";
  hudScore.textContent = `0 / ${RETO_TARGET_SCORE}`;
  updateHeartsDisplay();

  durationSelector.hidden = chosenMode === "reto";
  selectedDuration = "negra";
  document.querySelectorAll("#duration-selector .duration-chip").forEach(b => b.classList.remove("active"));
  document.querySelector('#duration-selector .duration-chip[data-duration="negra"]').classList.add("active");

  confettiActive = false;
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";

  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "";

  drawStaffBase();
  redrawMelody();
  updateToolbarState();

  if (chosenMode === "reto") {
    startNewRound();
  }
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

// --- MODO RETO ---
function generateTargetMelody() {
  const notes = [];
  for (let i = 0; i < RETO_MELODY_LENGTH; i++) {
    const note = NOTE_ORDER[Math.floor(Math.random() * NOTE_ORDER.length)];
    notes.push({ note, duration: "negra" });
  }
  return notes;
}

function startNewRound() {
  targetMelody = generateTargetMelody();
  melody = [];
  redrawMelody();
  updateToolbarState();
  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "Escucha la melodía y luego reconstrúyela...";

  setTimeout(() => {
    initAudio();
    playMelody(targetMelody, () => {
      feedbackBox.textContent = "¡Tu turno! Toca las notas en el pentagrama.";
    });
  }, 500);
}

function handleCheckClick() {
  if (melody.length !== RETO_MELODY_LENGTH) return;

  const isCorrect = melody.every((item, i) => item.note === targetMelody[i].note);

  if (isCorrect) {
    score++;
    hudScore.textContent = `${score} / ${RETO_TARGET_SCORE}`;
    feedbackBox.className = "feedback-box feedback-correct";
    feedbackBox.textContent = "¡Melodía correcta!";

    if (score >= RETO_TARGET_SCORE) {
      handleWin();
    } else {
      setTimeout(startNewRound, 1000);
    }
  } else {
    lives--;
    updateHeartsDisplay();
    playErrorSound();
    feedbackBox.className = "feedback-box feedback-wrong";
    feedbackBox.textContent = "Esa no era la melodía. ¡Escucha de nuevo!";

    if (lives <= 0) {
      handleLose();
    } else {
      showEncouragementToast();
      melody = [];
      setTimeout(() => {
        redrawMelody();
        updateToolbarState();
        initAudio();
        playMelody(targetMelody, () => {
          feedbackBox.textContent = "¡Tu turno! Toca las notas en el pentagrama.";
        });
      }, 1200);
    }
  }
}

const encouragementPhrases = [
  "¡Uy, casi! Escucha con calma cada nota 💪",
  "¡No pasa nada! Presta atención si sube o baja 🌟",
  "¡Vamos, concéntrate! Cuenta las notas mentalmente 🎶",
  "¡Ojo! Compara con el sonido anterior 🎹",
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
    document.getElementById("win-message").textContent = `¡Reconstruiste ${RETO_TARGET_SCORE} melodías correctas! Tu oído y tu lectura van de la mano.`;
  }, 500);
}

function handleLose() {
  isGameActive = false;

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  setTimeout(() => {
    loseModal.style.display = "flex";
  }, 500);
}
