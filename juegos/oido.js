// --- GAME CONFIGURATIONS ---
// Each phase trains a different ear-training skill. "type" drives which
// generateQuestion_* / renderAnswers_* pair is used at runtime.
const PHASES = {
  1: {
    title: "Fase 1: ¿Sube o Baja?",
    description: "Escucha dos notas seguidas. ¿La segunda nota suena más aguda (sube) o más grave (baja) que la primera? ¡Consigue 8 aciertos para pasar a la Fase 2!",
    type: "direction",
    targetScore: 8,
    timeLimit: null
  },
  2: {
    title: "Fase 2: Nombra el Intervalo",
    description: "Ahora escucharás dos notas y deberás identificar la distancia entre ellas: Segunda, Tercera, Cuarta o Quinta. ¡Afina el oído!",
    type: "interval",
    targetScore: 8,
    timeLimit: null
  },
  3: {
    title: "Fase 3: ¿Mayor o Menor?",
    description: "Dos notas sonarán al mismo tiempo. Los acordes Mayores suenan alegres y los Menores suenan más tristes o misteriosos. ¡Descubre cuál es cuál!",
    type: "quality",
    targetScore: 8,
    timeLimit: null
  },
  4: {
    title: "Fase 4: ¿Cuántas Notas Escuchas?",
    description: "Sonarán varias notas al mismo tiempo, formando un acorde. Cuenta cuántas notas distintas puedes distinguir: 1, 2 o 3.",
    type: "count",
    targetScore: 8,
    timeLimit: null
  },
  5: {
    title: "Fase 5: Desafío Mixto Contrarreloj",
    description: "¡El reto final! Se mezclarán al azar los 4 tipos de ejercicio anteriores, y tendrás solo 6 segundos para responder cada uno. ¡Demuestra que tienes el mejor oído de la escuela!",
    type: "mixed",
    targetScore: 12,
    timeLimit: 6000
  }
};

// --- STATE VARIABLES ---
let currentPhaseNum = 1;
let currentPhase = PHASES[1];
let score = 0;
let lives = 3;
let audioCtx = null;
let isGameActive = false;
let questionTimer = null;
let currentQuestion = null; // { type, correctAnswer, play() }

// --- DOM ELEMENTS ---
const hudLevelNum = document.getElementById("hud-level-num");
const hudExerciseName = document.getElementById("hud-exercise-name");
const hudScore = document.getElementById("hud-score");
const heartsBox = document.getElementById("hearts-box");
const feedbackBox = document.getElementById("feedback-box");
const startOverlay = document.getElementById("start-overlay");
const overlayLevelTitle = document.getElementById("overlay-level-title");
const overlayLevelDesc = document.getElementById("overlay-level-desc");
const btnStart = document.getElementById("btn-start");
const btnListen = document.getElementById("btn-listen");
const waveBars = document.getElementById("wave-bars");
const answerQuestion = document.getElementById("answer-question");
const answerGrid = document.getElementById("answer-grid");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const btnNextLevel = document.getElementById("btn-next-level");
const btnRestart = document.getElementById("btn-restart");

const EXERCISE_LABELS = {
  direction: "Sube o Baja",
  interval: "Intervalo",
  quality: "Mayor o Menor",
  count: "Cuenta las Notas",
  mixed: "Mixto"
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const lvlParam = parseInt(params.get("phase"));
  if (lvlParam && PHASES[lvlParam]) {
    currentPhaseNum = lvlParam;
    currentPhase = PHASES[lvlParam];
  }

  hudLevelNum.textContent = currentPhaseNum;
  hudExerciseName.textContent = EXERCISE_LABELS[currentPhase.type];
  overlayLevelTitle.textContent = currentPhase.title;
  overlayLevelDesc.textContent = currentPhase.description;

  btnStart.addEventListener("click", handleStartClick);
  btnRestart.addEventListener("click", startGame);
  btnListen.addEventListener("click", playCurrentQuestion);
  btnNextLevel.addEventListener("click", () => {
    window.location.href = `oido.html?phase=${currentPhaseNum + 1}`;
  });
});

// --- AUDIO SYNTHESIS (self-contained synth, no network dependency) ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playTone(freq, startOffset = 0, duration = 0.9) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime + startOffset;

  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.35, now + 0.008);
  masterGain.gain.exponentialRampToValueAtTime(0.15, now + 0.22);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(freq * 4, now);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.35);
  filter.connect(masterGain);

  const osc1 = audioCtx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, now);
  const gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0.8, now);
  osc1.connect(gain1);
  gain1.connect(filter);

  const osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, now);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.22, now);
  osc2.connect(gain2);
  gain2.connect(filter);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
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

// --- QUESTION GENERATORS ---
// Each returns { correctAnswer, play(), options: [{label, value}] }

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion_direction() {
  const base = randInt(60, 72); // C4 - C5
  const goingUp = Math.random() < 0.5;
  const gap = randInt(2, 9);
  const second = goingUp ? base + gap : base - gap;
  const correctAnswer = goingUp ? "up" : "down";

  return {
    correctAnswer,
    play: () => {
      playTone(midiToFreq(base), 0, 0.55);
      playTone(midiToFreq(second), 0.65, 0.55);
    },
    options: [
      { label: "⬆️ Subió", value: "up" },
      { label: "⬇️ Bajó", value: "down" }
    ]
  };
}

const INTERVAL_STEPS = [
  { value: "2da", label: "2da (Segunda)", semitones: 2 },
  { value: "3ra", label: "3ra (Tercera)", semitones: 4 },
  { value: "4ta", label: "4ta (Cuarta)", semitones: 5 },
  { value: "5ta", label: "5ta (Quinta)", semitones: 7 }
];

function generateQuestion_interval() {
  const base = randInt(60, 67);
  const chosen = INTERVAL_STEPS[randInt(0, INTERVAL_STEPS.length - 1)];
  const second = base + chosen.semitones;

  return {
    correctAnswer: chosen.value,
    play: () => {
      playTone(midiToFreq(base), 0, 0.55);
      playTone(midiToFreq(second), 0.65, 0.55);
    },
    options: INTERVAL_STEPS.map(s => ({ label: s.label, value: s.value }))
  };
}

function generateQuestion_quality() {
  const base = randInt(58, 66);
  const isMajor = Math.random() < 0.5;
  const third = base + (isMajor ? 4 : 3);
  const correctAnswer = isMajor ? "major" : "minor";

  return {
    correctAnswer,
    play: () => {
      playTone(midiToFreq(base), 0, 1.1);
      playTone(midiToFreq(third), 0, 1.1);
    },
    options: [
      { label: "😊 Mayor", value: "major" },
      { label: "😢 Menor", value: "minor" }
    ]
  };
}

function generateQuestion_count() {
  const numNotes = randInt(1, 3);
  const base = randInt(58, 68);
  const intervals = [0, randInt(3, 7), randInt(8, 12)];
  const notes = intervals.slice(0, numNotes).map(iv => base + iv);

  return {
    correctAnswer: String(numNotes),
    play: () => {
      notes.forEach(n => playTone(midiToFreq(n), 0, 1.1));
    },
    options: [
      { label: "1 nota", value: "1" },
      { label: "2 notas", value: "2" },
      { label: "3 notas", value: "3" }
    ]
  };
}

const MIXED_GENERATORS = [generateQuestion_direction, generateQuestion_interval, generateQuestion_quality, generateQuestion_count];

function generateQuestion_mixed() {
  const generator = MIXED_GENERATORS[randInt(0, MIXED_GENERATORS.length - 1)];
  return generator();
}

const GENERATORS = {
  direction: generateQuestion_direction,
  interval: generateQuestion_interval,
  quality: generateQuestion_quality,
  count: generateQuestion_count,
  mixed: generateQuestion_mixed
};

// --- GAME FLOW ---
function handleStartClick() {
  initAudio();
  startGame();
}

function startGame() {
  isGameActive = true;
  score = 0;
  lives = 3;

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  confettiActive = false;
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  const cCanvas = document.getElementById("confetti-canvas");
  if (cCanvas) {
    const cCtx = cCanvas.getContext("2d");
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  }

  hudScore.textContent = `0 / ${currentPhase.targetScore}`;
  updateHeartsDisplay();

  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";

  generateNextQuestion();
}

function updateHeartsDisplay() {
  heartsBox.innerHTML = "";
  for (let i = 0; i < 3; i++) {
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

function generateNextQuestion() {
  if (!isGameActive) return;

  currentQuestion = GENERATORS[currentPhase.type]();

  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "";

  renderAnswerButtons(currentQuestion.options);

  // Auto-play the question once it's ready
  setTimeout(playCurrentQuestion, 400);

  if (currentPhase.timeLimit) {
    startQuestionTimer();
  }
}

function renderAnswerButtons(options) {
  answerGrid.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "btn-answer";
    btn.textContent = opt.label;
    btn.dataset.value = opt.value;
    btn.addEventListener("click", () => handleAnswerClick(opt.value, btn));
    answerGrid.appendChild(btn);
  });
}

function playCurrentQuestion() {
  if (!currentQuestion || !audioCtx) return;
  initAudio();
  btnListen.classList.add("playing");
  waveBars.classList.add("active");
  setTimeout(() => {
    btnListen.classList.remove("playing");
    waveBars.classList.remove("active");
  }, 900);
  currentQuestion.play();
}

function startQuestionTimer() {
  if (questionTimer) clearTimeout(questionTimer);
  questionTimer = setTimeout(() => {
    handleAnswerResult(false, true);
  }, currentPhase.timeLimit);
}

function handleAnswerClick(value, btnEl) {
  if (!isGameActive || !currentQuestion) return;

  const allButtons = answerGrid.querySelectorAll(".btn-answer");
  allButtons.forEach(b => b.setAttribute("disabled", "true"));

  const isCorrect = value === currentQuestion.correctAnswer;
  if (isCorrect) {
    btnEl.classList.add("correct-flash");
  } else {
    btnEl.classList.add("wrong-flash");
    const correctBtn = Array.from(allButtons).find(b => b.dataset.value === currentQuestion.correctAnswer);
    if (correctBtn) correctBtn.classList.add("correct-flash");
  }

  handleAnswerResult(isCorrect, false);
}

function handleAnswerResult(isCorrect, isTimeout) {
  if (currentPhase.timeLimit) clearTimeout(questionTimer);

  if (isCorrect) {
    score++;
    hudScore.textContent = `${score} / ${currentPhase.targetScore}`;
    feedbackBox.className = "feedback-box feedback-correct";
    feedbackBox.textContent = "¡Excelente oído!";

    if (score >= currentPhase.targetScore) {
      handleWin();
    } else {
      setTimeout(generateNextQuestion, 900);
    }
  } else {
    lives--;
    updateHeartsDisplay();
    feedbackBox.className = "feedback-box feedback-wrong";
    feedbackBox.textContent = isTimeout ? "¡Tiempo agotado!" : "¡Casi! Escucha con más calma.";
    playErrorSound();

    if (lives <= 0) {
      handleLose();
    } else {
      showEncouragementToast();
      setTimeout(generateNextQuestion, 1100);
    }
  }
}

const encouragementPhrases = [
  "¡Uy, casi! Vuelve a escuchar con calma, tú puedes 💪",
  "¡No pasa nada! El oído se entrena con la práctica 🌟",
  "¡Vamos, concéntrate! Cierra los ojos y escucha bien 🎶",
  "¡Ojo! Compara con atención el sonido inicial y el final 🎹",
  "¡Tú puedes hacerlo! Respira hondo e inténtalo de nuevo ✨"
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
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 1200);
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
  if (currentPhase.timeLimit) clearTimeout(questionTimer);

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  let progress = JSON.parse(localStorage.getItem("sevenkeys_oido_progress")) || { unlocked: [1] };
  if (!progress.unlocked) progress.unlocked = [1];
  if (currentPhaseNum < 5 && !progress.unlocked.includes(currentPhaseNum + 1)) {
    progress.unlocked.push(currentPhaseNum + 1);
  }
  localStorage.setItem("sevenkeys_oido_progress", JSON.stringify(progress));

  setTimeout(() => {
    winModal.style.display = "flex";
    createConfetti();
    updateAndDrawConfetti();

    if (currentPhaseNum === 5) {
      btnNextLevel.style.display = "none";
      document.getElementById("win-message").textContent = `¡Felicidades! Has completado el Desafío Mixto con ${score} aciertos. ¡Tienes un oído musical excepcional!`;
    } else {
      btnNextLevel.style.display = "block";
      document.getElementById("win-message").textContent = `¡Excelente oído! Has completado la Fase ${currentPhaseNum} y desbloqueado la siguiente.`;
    }
  }, 600);
}

function handleLose() {
  isGameActive = false;
  if (currentPhase.timeLimit) clearTimeout(questionTimer);

  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  setTimeout(() => {
    loseModal.style.display = "flex";
  }, 600);
}
