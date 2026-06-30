// --- GAME STATE ---
let currentPhase = 1;
let activeChallenge = 1;
let score = 0;
let lives = 3;
let isGameActive = false;
let audioCtx = null;

// Metronome & Audio engine configuration
const TEMPO_BPM = 80; 
const BEAT_DURATION_MS = (60 / TEMPO_BPM) * 1000; // ~750ms

// Phase 1 (Balanza) State
let phase1PlacedFigures = [];
const PHASE1_CHALLENGES = {
  1: { signature: "4/4", targetValue: 4, label: "Completa 4 tiempos para equilibrar la balanza" },
  2: { signature: "3/4", targetValue: 3, label: "Esta vez necesitamos exactamente 3 tiempos" },
  3: { signature: "2/4", targetValue: 2, label: "Un compás corto: busca 2 tiempos en total" },
  4: { signature: "4/4", targetValue: 4, label: "Completa 4 tiempos usando al menos un silencio" },
  5: { signature: "3/4", targetValue: 3, label: "Completa 3 tiempos usando corcheas" }
};

// Phase 2 (El Eco) State
let phase2UserSequence = [];
const PHASE2_CHALLENGES = {
  1: {
    pattern: ["negra", "negra", "blanca"],
    label: "Escucha el ritmo básico y repítelo"
  },
  2: {
    pattern: ["negra", "silencio-negra", "negra", "negra"],
    label: "¡Presta atención al silencio en medio!"
  },
  3: {
    pattern: ["corcheas", "negra", "corcheas", "negra"],
    label: "Ritmo rápido con corcheas"
  },
  4: {
    pattern: ["blanca", "corcheas", "negra"],
    label: "Combina una blanca con corcheas y negra"
  },
  5: {
    pattern: ["corcheas", "silencio-negra", "negra", "corcheas"],
    label: "El reto rítmico final de oído"
  }
};

// Phase 3 (Sigue el Ritmo) State
let metronomeTimer = null;
let gameLoopTimer = null;
let currentBeat = 0;
let trackNotes = [];
let tapScores = [];
let metronomeActive = false;

// Reading track figures database for Phase 3 (5 progressive challenges)
const PHASE3_CHALLENGES = {
  1: {
    pattern: ["negra", "negra", "silencio-negra", "negra"],
    label: "Sigue el compás de 4 tiempos. ¡No toques en los silencios!"
  },
  2: {
    pattern: ["negra", "corcheas", "negra", "silencio-negra"],
    label: "¡Cuidado con las corcheas rápidas y el silencio al final!"
  },
  3: {
    pattern: ["blanca", "negra", "negra"],
    label: "La blanca dura 2 tiempos. ¡Púlsala al inicio y mantén el tempo!"
  },
  4: {
    pattern: ["corcheas", "silencio-negra", "corcheas", "negra"],
    label: "Desafío rítmico sincopado: corcheas y silencios alternados"
  },
  5: {
    pattern: ["blanca", "silencio-negra", "corcheas"],
    label: "¡El reto rítmico final con Teacher Juan Di!"
  }
};

// Visual config for figure symbols
const FIGURE_VALUES = {
  "negra": 1,
  "blanca": 2,
  "corcheas": 1,
  "silencio-negra": 1
};
const FIGURE_SYMBOLS = {
  "negra": `<svg viewBox="0 0 24 36" width="20" height="30" style="display:block; margin:auto;"><ellipse cx="8" cy="28" rx="7" ry="5" transform="rotate(-20 8 28)" fill="currentColor"/><path d="M14 28 V 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  "blanca": `<svg viewBox="0 0 24 36" width="20" height="30" style="display:block; margin:auto;"><ellipse cx="8" cy="28" rx="7" ry="5" transform="rotate(-20 8 28)" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14 28 V 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  "corcheas": `<svg viewBox="0 0 36 36" width="30" height="30" style="display:block; margin:auto;"><ellipse cx="8" cy="28" rx="6" ry="4" transform="rotate(-20 8 28)" fill="currentColor"/><path d="M13 28 V 5" stroke="currentColor" stroke-width="2.5"/><ellipse cx="26" cy="28" rx="6" ry="4" transform="rotate(-20 26 28)" fill="currentColor"/><path d="M31 28 V 5" stroke="currentColor" stroke-width="2.5"/><path d="M13 5 L 31 5" stroke="currentColor" stroke-width="5" stroke-linecap="square"/></svg>`,
  "silencio-negra": `<svg viewBox="0 0 24 36" width="16" height="26" fill="currentColor" style="display:block; margin:auto;"><path d="M12.5,3.7 C11.5,3.7 10.5,4.3 10,5.2 L7.1,10.2 C6.8,10.7 7,11.3 7.5,11.6 C8,11.9 8.6,11.7 8.9,11.2 L11.8,6.2 C12,5.8 12.3,5.7 12.5,5.7 C12.8,5.7 13.1,5.9 13.2,6.3 L15,13.5 C15.1,13.9 14.9,14.3 14.5,14.5 L6.8,17.7 C6.2,17.9 5.8,18.5 6,19.2 C6.2,19.8 6.8,20.2 7.5,20 L13.5,17.5 C12,19.5 11,21.5 11,23.5 C11,27.5 14.5,30.5 18,29 C18.5,28.8 18.8,28.2 18.6,27.7 C18.4,27.2 17.8,26.9 17.3,27.1 C14.8,28.1 12.8,26.1 12.8,23.5 C12.8,22 13.5,20.2 14.8,18.5 L16.8,17.7 C17.4,17.5 17.8,16.9 17.6,16.2 L15,6 C14.7,4.6 13.7,3.7 12.5,3.7 Z"/></svg>`
};

// Teacher Phrases
const encouragementPhrases = [
  "¡El ritmo está en ti! Inténtalo de nuevo 🥁",
  "¡No te preocupes! El metrónomo te guiará 🌟",
  "¡Siente el pulso constante! Vamos otra vez 🎹",
  "¡Mucha atención al tiempo de cada figura! ✨"
];

// Confetti System
let confetti = [];
let confettiActive = false;
let confettiCanvas = null;
let confettiCtx = null;
let confettiAnimId = null;

// --- DOM ELEMENTS ---
const hudPhaseNum = document.getElementById("hud-phase-num");
const hudChallengeDesc = document.getElementById("hud-challenge-desc");
const hudScore = document.getElementById("hud-score");
const heartsBox = document.getElementById("hearts-box");
const feedbackBox = document.getElementById("feedback-box");
const startOverlay = document.getElementById("start-overlay");
const overlayPhaseTitle = document.getElementById("overlay-phase-title");
const overlayPhaseDesc = document.getElementById("overlay-phase-desc");
const btnStart = document.getElementById("btn-start");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const btnNextPhase = document.getElementById("btn-next-phase");

// --- AUDIO SYNTH ENGINE ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Play synthetic woodblock/chime sound
function playWoodblockTone(freq = 600, duration = 0.08, volume = 0.4) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playErrorTone() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(140, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.35);
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.35);
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Set up event listeners
  btnStart.addEventListener("click", handleStartClick);
  
  // Close toast trigger if clicked
  document.getElementById("profe-toast").addEventListener("click", () => {
    document.getElementById("profe-toast").classList.remove("show");
  });

  // Setup tapping pad pointerdown event (unified for mouse & touch to prevent double-tap issues)
  const tapPad = document.getElementById("tap-pad-trigger");
  tapPad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handleTapInput();
  });

  // Spacebar tapping support with auto-repeat prevention
  let isSpacePressed = false;
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && currentPhase === 3 && isGameActive) {
      e.preventDefault();
      if (!isSpacePressed) {
        isSpacePressed = true;
        handleTapInput();
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      isSpacePressed = false;
    }
  });

  // Show phase 1 preview inicialmente
  loadPhasePreview(1);
});

// --- CONFETTI SYSTEM ---
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
    
    if (c.y < confettiCanvas.height + 20) {
      activeConfetti++;
    }
    
    confettiCtx.save();
    confettiCtx.translate(c.x, c.y);
    confettiCtx.rotate(c.rotation * Math.PI / 180);
    confettiCtx.fillStyle = c.color;
    confettiCtx.fillRect(-c.width/2, -c.height/2, c.width, c.height);
    confettiCtx.restore();
  }
  
  if (activeConfetti > 0 && confettiActive) {
    confettiAnimId = requestAnimationFrame(updateAndDrawConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// --- PHASE LOADING ---

function switchPhase(phaseNum) {
  // Stop active loops
  stopPhase3Loop();
  
  currentPhase = phaseNum;
  activeChallenge = 1;
  isGameActive = false;
  
  // Update active tab styling
  document.querySelectorAll(".btn-phase-tab").forEach(t => t.classList.remove("active"));
  document.getElementById(`tab-${phaseNum}`).classList.add("active");
  
  // Show active board container
  document.querySelectorAll(".phase-board").forEach(b => b.classList.remove("active"));
  document.getElementById(`board-${phaseNum}`).classList.add("active");
  
  loadPhasePreview(phaseNum);
}

function loadPhasePreview(phaseNum) {
  startOverlay.style.display = "flex";
  winModal.style.display = "none";
  loseModal.style.display = "none";
  
  // Update HUD
  hudPhaseNum.textContent = `Fase ${phaseNum}`;
  hudChallengeDesc.textContent = `Reto 1 / 5`;
  
  // Custom description messages from Teacher Juan Di
  if (phaseNum === 1) {
    overlayPhaseTitle.textContent = "Fase 1: Balanza de Tiempos";
    overlayPhaseDesc.textContent = "¡Hola! En esta fase aprenderemos las equivalencias. Debes agregar figuras al compás hasta equilibrar la balanza con los tiempos correctos. ¡Vamos con toda!";
  } else if (phaseNum === 2) {
    overlayPhaseTitle.textContent = "Fase 2: El Eco del Teacher";
    overlayPhaseDesc.textContent = "¡Excelente! Ahora entrenaremos tu oído. Escucha el ritmo que tocaré y arrastra las figuras en el orden correcto para repetirlo como un eco.";
  } else if (phaseNum === 3) {
    overlayPhaseTitle.textContent = "Fase 3: Sigue el Ritmo";
    overlayPhaseDesc.textContent = "¡El desafío de precisión en tiempo real! Un metrónomo marcará el pulso y deberás presionar la barra espaciadora o el botón cuando las notas pasen por la línea azul.";
    hudChallengeDesc.textContent = `Desafío Único`;
  }
}

function handleStartClick() {
  initAudio();
  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";
  feedbackBox.textContent = "";
  feedbackBox.className = "feedback-box";
  isGameActive = true;
  score = 0;
  lives = 3;
  updateHUD();
  
  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");

  // Reset confetti loop
  confettiActive = false;
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  const cCanvas = document.getElementById("confetti-canvas");
  if (cCanvas) {
    const cCtx = cCanvas.getContext("2d");
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  }
  
  if (currentPhase === 1) {
    setupPhase1Challenge();
  } else if (currentPhase === 2) {
    setupPhase2Challenge();
  } else if (currentPhase === 3) {
    setupPhase3Challenge();
  }
}

function updateHUD() {
  hudScore.textContent = score;
  let heartsStr = "";
  for (let i = 0; i < 3; i++) {
    heartsStr += i < lives ? "❤️" : "🖤";
  }
  heartsBox.textContent = heartsStr;
}

let toastTimeout = null;
function showEncouragementToast() {
  const toast = document.getElementById("profe-toast");
  const toastText = document.getElementById("profe-toast-text");
  if (!toast || !toastText) return;
  
  const phrase = encouragementPhrases[Math.floor(Math.random() * encouragementPhrases.length)];
  toastText.textContent = `"${phrase}"`;
  
  toast.classList.add("show");
  
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// --- FASE 1: BALANZA LOGIC ---

function setupPhase1Challenge() {
  phase1PlacedFigures = [];
  hudChallengeDesc.textContent = `${activeChallenge} / 5`;
  
  const cfg = PHASE1_CHALLENGES[activeChallenge];
  document.getElementById("hud-challenge-desc").textContent = `${activeChallenge} / 5`;
  
  // Set fraction signature
  const sigNumerator = cfg.targetValue;
  const fractionDiv = document.getElementById("compas-fraction");
  fractionDiv.innerHTML = `<span>${sigNumerator}</span><span>4</span>`;
  
  // Set meta plate label
  document.getElementById("balance-plate-right").querySelector(".balance-plate-label").textContent = `${sigNumerator} tiempos`;
  
  updatePhase1Display();
  tiltBalance(0); // Level scale
}

function updatePhase1Display() {
  const container = document.getElementById("compas-slots-container");
  container.innerHTML = "";
  
  let currentTotal = 0;
  
  if (phase1PlacedFigures.length === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Haz clic en una figura para agregarla...</span>`;
  } else {
    phase1PlacedFigures.forEach((fig, index) => {
      currentTotal += FIGURE_VALUES[fig];
      const item = document.createElement("div");
      item.className = "placed-note-item";
      item.innerHTML = `<span>${FIGURE_SYMBOLS[fig]}</span>`;
      item.addEventListener("click", () => removeFigureFromCompas(index));
      container.appendChild(item);
    });
  }
  
  const cfg = PHASE1_CHALLENGES[activeChallenge];
  document.getElementById("balance-status-label").textContent = `Tiempos: ${currentTotal} / ${cfg.targetValue}`;
  
  // Dynamic balance tilting based on weights
  const diff = currentTotal - cfg.targetValue;
  if (diff === 0) {
    tiltBalance(0);
  } else if (diff < 0) {
    tiltBalance(-1); // Left plate (placed) is lighter (tilted left-up)
  } else {
    tiltBalance(1); // Left plate is heavier (tilted left-down)
  }
}

function addFigureToCompas(figType) {
  if (!isGameActive) return;
  initAudio();
  
  // Synthesize soft woodblock play tone
  playWoodblockTone(500, 0.05, 0.3);
  
  phase1PlacedFigures.push(figType);
  updatePhase1Display();
}

function removeFigureFromCompas(index) {
  if (!isGameActive) return;
  initAudio();
  playWoodblockTone(350, 0.05, 0.2);
  phase1PlacedFigures.splice(index, 1);
  updatePhase1Display();
}

function tiltBalance(direction) {
  const beam = document.getElementById("balance-beam");
  const leftPlate = document.getElementById("balance-plate-left");
  const rightPlate = document.getElementById("balance-plate-right");
  
  if (!beam || !leftPlate || !rightPlate) return;
  
  let angle = 0;
  let leftY = 0;
  let rightY = 0;
  
  if (direction === -1) { // Left is lighter -> tilts left UP, right DOWN
    angle = -12;
    leftY = -25;
    rightY = 25;
  } else if (direction === 1) { // Left is heavier -> tilts left DOWN, right UP
    angle = 12;
    leftY = 25;
    rightY = -25;
  }
  
  beam.style.transform = `rotate(${angle}deg)`;
  leftPlate.style.transform = `translateY(${leftY}px)`;
  rightPlate.style.transform = `translateY(${rightY}px)`;
}

function validateBalanceCompas() {
  if (!isGameActive) return;
  
  const cfg = PHASE1_CHALLENGES[activeChallenge];
  let sum = 0;
  phase1PlacedFigures.forEach(f => sum += FIGURE_VALUES[f]);
  
  // Custom validations
  let passesCustomValidation = true;
  let customErrorMsg = "";
  
  if (activeChallenge === 4) { // Needs a rest
    const hasRest = phase1PlacedFigures.includes("silencio-negra");
    if (!hasRest) {
      passesCustomValidation = false;
      customErrorMsg = "¡Debes incluir al menos un silencio en este compás!";
    }
  } else if (activeChallenge === 5) { // Needs corcheas
    const hasCorcheas = phase1PlacedFigures.includes("corcheas");
    if (!hasCorcheas) {
      passesCustomValidation = false;
      customErrorMsg = "¡Debes incluir corcheas en este compás!";
    }
  }

  if (sum === cfg.targetValue && passesCustomValidation) {
    // CORRECT
    playWoodblockTone(800, 0.15, 0.5);
    score += 20;
    updateHUD();
    
    feedbackBox.className = "feedback-box feedback-correct";
    feedbackBox.textContent = "¡Equilibrio perfecto! Compás correcto.";
    
    tiltBalance(0);
    
    if (activeChallenge >= 5) {
      handlePhaseComplete();
    } else {
      activeChallenge++;
      setTimeout(setupPhase1Challenge, 1200);
    }
  } else {
    // INCORRECT
    playErrorTone();
    lives--;
    updateHUD();
    
    feedbackBox.className = "feedback-box feedback-wrong";
    if (sum !== cfg.targetValue) {
      feedbackBox.textContent = sum < cfg.targetValue ? "¡El compás está incompleto! Falta peso." : "¡Te has pasado! El compás pesa demasiado.";
    } else {
      feedbackBox.textContent = customErrorMsg;
    }
    
    if (lives <= 0) {
      handleLose();
    } else {
      showEncouragementToast();
    }
  }
}

// --- FASE 2: EL ECO LOGIC ---

function setupPhase2Challenge() {
  phase2UserSequence = [];
  document.getElementById("hud-challenge-desc").textContent = `${activeChallenge} / 5`;
  
  updatePhase2Display();
}

function updatePhase2Display() {
  const container = document.getElementById("dictation-slots-container");
  container.innerHTML = "";
  
  if (phase2UserSequence.length === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Escucha el ritmo arriba y arma la secuencia aquí...</span>`;
  } else {
    phase2UserSequence.forEach((fig, index) => {
      const item = document.createElement("div");
      item.className = "placed-note-item";
      item.innerHTML = `<span>${FIGURE_SYMBOLS[fig]}</span>`;
      item.addEventListener("click", () => removeFigureFromDictation(index));
      container.appendChild(item);
    });
  }
}

function addFigureToDictation(figType) {
  if (!isGameActive) return;
  initAudio();
  playWoodblockTone(500, 0.05, 0.3);
  
  if (phase2UserSequence.length >= 6) return; // Limit slots
  
  phase2UserSequence.push(figType);
  updatePhase2Display();
}

function removeFigureFromDictation(index) {
  if (!isGameActive) return;
  initAudio();
  playWoodblockTone(350, 0.05, 0.2);
  phase2UserSequence.splice(index, 1);
  updatePhase2Display();
}

// Play target rhythm sequence audibly
function playTargetRhythm() {
  initAudio();
  const cfg = PHASE2_CHALLENGES[activeChallenge];
  if (!cfg) return;
  
  const playBtn = document.getElementById("btn-play-sound");
  playBtn.setAttribute("disabled", "true");
  playBtn.textContent = "🔊 Sonando...";
  
  let timeOffset = 0;
  
  cfg.pattern.forEach((fig) => {
    setTimeout(() => {
      if (fig === "negra") {
        playWoodblockTone(600, 0.08, 0.5);
      } else if (fig === "blanca") {
        playWoodblockTone(600, 0.25, 0.5);
      } else if (fig === "corcheas") {
        playWoodblockTone(800, 0.04, 0.5);
        setTimeout(() => playWoodblockTone(800, 0.04, 0.5), BEAT_DURATION_MS / 2);
      } else if (fig === "silencio-negra") {
        // Wait, silence doesn't play
      }
    }, timeOffset);
    
    timeOffset += BEAT_DURATION_MS * (fig === "blanca" ? 2 : 1);
  });
  
  // Re-enable button after playback completes
  setTimeout(() => {
    playBtn.removeAttribute("disabled");
    playBtn.textContent = "🔊 Escuchar Ritmo";
  }, timeOffset + 200);
}

function validateDictation() {
  if (!isGameActive) return;
  
  const cfg = PHASE2_CHALLENGES[activeChallenge];
  const target = cfg.pattern;
  
  let isMatch = true;
  if (phase2UserSequence.length !== target.length) {
    isMatch = false;
  } else {
    for (let i = 0; i < target.length; i++) {
      if (phase2UserSequence[i] !== target[i]) {
        isMatch = false;
        break;
      }
    }
  }

  if (isMatch) {
    // CORRECT
    playWoodblockTone(850, 0.15, 0.5);
    score += 25;
    updateHUD();
    
    feedbackBox.className = "feedback-box feedback-correct";
    feedbackBox.textContent = "¡Eco perfecto! Ritmo correcto.";
    
    if (activeChallenge >= 5) {
      handlePhaseComplete();
    } else {
      activeChallenge++;
      setTimeout(setupPhase2Challenge, 1200);
    }
  } else {
    // INCORRECT
    playErrorTone();
    lives--;
    updateHUD();
    
    feedbackBox.className = "feedback-box feedback-wrong";
    feedbackBox.textContent = "¡El eco no coincide! Escucha con cuidado el ritmo.";
    
    if (lives <= 0) {
      handleLose();
    } else {
      showEncouragementToast();
    }
  }
}

// --- FASE 3: SIGUE EL RITMO (LECTURA DE COMPÁS ESTÁTICO) LOGIC ---

let metronomeIntervalId = null;
let targetNotes = [];
let isPreRolling = true;
let preRollCount = 0;
let phase3StartTime = 0;

function setupPhase3Challenge() {
  document.getElementById("hud-challenge-desc").textContent = `${activeChallenge} / 5`;
  
  const container = document.getElementById("reading-slots-container");
  container.innerHTML = "";
  
  const countdownDiv = document.getElementById("countdown-display");
  if (countdownDiv) {
    countdownDiv.textContent = "";
    countdownDiv.style.color = "var(--color-gold)";
  }
  
  const cfg = PHASE3_CHALLENGES[activeChallenge];
  const pattern = cfg.pattern;
  
  // Render figures statically
  pattern.forEach((fig, index) => {
    const item = document.createElement("div");
    item.className = "placed-note-item";
    item.id = `reading-slot-${index}`;
    item.innerHTML = `<span>${FIGURE_SYMBOLS[fig]}</span>`;
    container.appendChild(item);
  });
  
  currentBeat = -1; 
  isPreRolling = true;
  preRollCount = 0;
  metronomeActive = true;
  
  // Build target note timestamps relative to phase3StartTime
  targetNotes = [];
  let currentOffset = BEAT_DURATION_MS; // starts after 4 beats of pre-roll
  
  pattern.forEach((fig, index) => {
    if (fig === "negra" || fig === "blanca") {
      targetNotes.push({
        time: currentOffset,
        beatIndex: index,
        tapped: false,
        type: fig
      });
    } else if (fig === "corcheas") {
      // First corchea on the beat
      targetNotes.push({
        time: currentOffset,
        beatIndex: index,
        subIndex: 0,
        tapped: false,
        type: fig
      });
      // Second corchea half beat later
      targetNotes.push({
        time: currentOffset + BEAT_DURATION_MS / 2,
        beatIndex: index,
        subIndex: 1,
        tapped: false,
        type: fig
      });
    }
    currentOffset += BEAT_DURATION_MS;
  });
  
  // Reset metronome dots
  document.querySelectorAll(".metronome-dot").forEach(d => d.classList.remove("active"));
  
  const tickPeriod = BEAT_DURATION_MS;
  let nextExpectedTick = Date.now();
  
  function metronomeTick() {
    if (!metronomeActive || !isGameActive) return;
    
    if (isPreRolling) {
      // 4 Intro clicks
      playWoodblockTone(preRollCount === 0 ? 900 : 600, 0.03, 0.2);
      
      // Update visual metronome dots
      document.querySelectorAll(".metronome-dot").forEach((d, idx) => {
        if (idx === preRollCount) d.classList.add("active");
        else d.classList.remove("active");
      });
      
      const countVal = 4 - preRollCount;
      if (countdownDiv) {
        countdownDiv.textContent = countVal;
      }
      
      feedbackBox.className = "feedback-box";
      feedbackBox.textContent = `¡Sigue el pulso! Prepárate...`;
      
      preRollCount++;
      if (preRollCount >= 4) {
        isPreRolling = false;
        currentBeat = -1;
        phase3StartTime = Date.now(); // starts exactly now
        setTimeout(() => {
          if (countdownDiv) {
            countdownDiv.textContent = "¡TOCA!";
            countdownDiv.style.color = "var(--color-cyan)";
          }
        }, 100);
      }
    } else {
      // Gameplay clicks
      if (countdownDiv && currentBeat >= 0) {
        countdownDiv.textContent = ""; // Clear countdown during play
      }
      
      // 1. Evaluate the PREVIOUS beat's taps
      if (currentBeat >= 0 && currentBeat < pattern.length) {
        const figType = pattern[currentBeat];
        const isNote = figType !== "silencio-negra";
        
        if (isNote) {
          // Check if all target notes inside this beat were tapped
          const beatNotes = targetNotes.filter(n => n.beatIndex === currentBeat);
          const allTapped = beatNotes.every(n => n.tapped);
          
          if (!allTapped) {
            handleTapMiss();
            if (lives <= 0) return; // Stop if dead
          } else {
            // Correct hit! Add score
            score += 25;
            updateHUD();
            feedbackBox.className = "feedback-box feedback-correct";
            feedbackBox.textContent = "⭐ ¡Excelente!";
          }
        } else {
          // Silence: evaluated in real-time on tap, so if we reached here without errors, it's a success
          score += 15;
          updateHUD();
          feedbackBox.className = "feedback-box feedback-correct";
          feedbackBox.textContent = "🤫 ¡Buen silencio!";
        }
      }
      
      // 2. Advance beat
      if (currentBeat >= 0) {
        // Remove highlight from previous slot
        const prevSlot = document.getElementById(`reading-slot-${currentBeat}`);
        if (prevSlot) prevSlot.classList.remove("highlighted");
      }
      
      currentBeat++;
      
      if (currentBeat >= pattern.length) {
        // Complete this challenge!
        stopPhase3Loop();
        
        if (activeChallenge >= 5) {
          handlePhaseComplete();
        } else {
          // Flash board success, load next challenge
          feedbackBox.className = "feedback-box feedback-correct";
          feedbackBox.textContent = "¡Compás completado con éxito!";
          activeChallenge++;
          setTimeout(setupPhase3Challenge, 1500);
        }
        return;
      }
      
      // Highlight current slot
      const currentSlot = document.getElementById(`reading-slot-${currentBeat}`);
      if (currentSlot) currentSlot.classList.add("highlighted");
      
      // Highlight metronome dot
      document.querySelectorAll(".metronome-dot").forEach((d, idx) => {
        if (idx === currentBeat) d.classList.add("active");
        else d.classList.remove("active");
      });
      
      // Play guide tick sound
      playWoodblockTone(currentBeat === 0 ? 900 : 600, 0.05, 0.25);
    }
    
    // Constant metronome sound scheduling to avoid timing drift
    nextExpectedTick += tickPeriod;
    const now = Date.now();
    const drift = now - nextExpectedTick;
    metronomeIntervalId = setTimeout(metronomeTick, Math.max(0, tickPeriod - drift));
  }
  
  // Start the tick loop
  nextExpectedTick = Date.now();
  metronomeTick();
}

function handleTapInput() {
  if (currentPhase !== 3 || !isGameActive) return;
  initAudio();
  
  // Play a completely different tone for the user's tap (bright chime bell!)
  playWoodblockTone(1200, 0.04, 0.35); 
  
  // Flash trigger button visual state
  const btn = document.getElementById("tap-pad-trigger");
  if (btn) {
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 100);
  }
  
  if (isPreRolling) return;
  
  const tapTime = Date.now();
  const relativeTapTime = tapTime - phase3StartTime;
  
  // Find which note in targetNotes is closest to this tap
  let closestNote = null;
  let minDiff = Infinity;
  
  targetNotes.forEach(note => {
    const diff = Math.abs(relativeTapTime - note.time);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  });
  
  if (closestNote) {
    // 180ms tolerance window (safe for corcheas which are 375ms apart)
    if (minDiff < 185) {
      if (!closestNote.tapped) {
        closestNote.tapped = true;
        // Trigger visual feedback on the note slot card
        const slot = document.getElementById(`reading-slot-${closestNote.beatIndex}`);
        if (slot) {
          slot.style.transform = "scale(1.15)";
          setTimeout(() => {
            if (slot) slot.style.transform = "";
          }, 120);
        }
      }
    } else {
      // Tapped too far from any note (e.g. in the middle of a silence, or double tap in no-man's land)
      handleTapMiss();
    }
  } else {
    handleTapMiss();
  }
}

function handleTapMiss() {
  playErrorTone();
  lives--;
  updateHUD();
  
  feedbackBox.className = "feedback-box feedback-wrong";
  feedbackBox.textContent = "❌ ¡Fallo en el ritmo!";
  
  if (lives <= 0) {
    stopPhase3Loop();
    handleLose();
  } else {
    showEncouragementToast();
  }
}

function stopPhase3Loop() {
  metronomeActive = false;
  if (metronomeIntervalId) clearTimeout(metronomeIntervalId);
}

// --- GAME STATE HANDLERS ---

function handlePhaseComplete() {
  isGameActive = false;
  
  // Save progress locally
  let progress = JSON.parse(localStorage.getItem("sevenkeys_rhythm_progress")) || { unlockedPhases: [1] };
  if (currentPhase < 3 && !progress.unlockedPhases.includes(currentPhase + 1)) {
    progress.unlockedPhases.push(currentPhase + 1);
  }
  localStorage.setItem("sevenkeys_rhythm_progress", JSON.stringify(progress));
  
  // Enable next tab visually
  const nextTab = document.getElementById(`tab-${currentPhase + 1}`);
  if (nextTab) {
    nextTab.classList.remove("locked");
    nextTab.removeAttribute("disabled");
  }

  // Show win modal
  setTimeout(() => {
    document.getElementById("win-modal-title").textContent = `¡Fase ${currentPhase} Completada!`;
    
    if (currentPhase === 3) {
      btnNextPhase.style.display = "none";
      document.getElementById("win-message").textContent = `¡Felicidades! Has completado toda la Aventura Rítmica con Teacher Juan Di. ¡Tienes un sentido del ritmo extraordinario!`;
    } else {
      btnNextPhase.style.display = "block";
      document.getElementById("win-message").textContent = `¡Excelente sentido del ritmo! Completaste la Fase ${currentPhase} y desbloqueaste la siguiente fase.`;
    }
    
    winModal.style.display = "flex";
    
    createConfetti();
    updateAndDrawConfetti();
  }, 600);
}

function handleLose() {
  isGameActive = false;
  stopPhase3Loop();
  
  setTimeout(() => {
    loseModal.style.display = "flex";
  }, 600);
}

function restartGame() {
  handleStartClick();
}

function loadNextPhase() {
  switchPhase(currentPhase + 1);
}

// Wrap helper because Performance.now offset sync is required
const originalStart = handleStartClick;
handleStartClick = function() {
  window.gameStartTime = Date.now();
  originalStart();
};
