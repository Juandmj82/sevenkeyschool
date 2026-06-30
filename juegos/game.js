// --- GAME CONFIGURATIONS ---
const LEVELS = {
  1: {
    title: "Nivel 1: Clave de Sol Inicial",
    description: "Aprende las primeras 5 notas básicas: Do, Re, Mi, Fa, Sol. ¡Consigue 10 aciertos para pasar al Nivel 2!",
    clef: "sol",
    notes: ["C4", "D4", "E4", "F4", "G4"],
    targetScore: 10,
    timeLimit: null
  },
  2: {
    title: "Nivel 2: Clave de Sol Completa",
    description: "Octava completa en la Clave de Sol: Do4 a Do5. ¡Lee con agilidad y consigue 10 aciertos!",
    clef: "sol",
    notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    targetScore: 10,
    timeLimit: null
  },
  3: {
    title: "Nivel 3: Clave de Fa Inicial",
    description: "Lee las primeras notas fundamentales del registro grave: Do3, Re3, Mi3, Fa3, Sol3. ¡Obtén 10 aciertos!",
    clef: "fa",
    notes: ["C3", "D3", "E3", "F3", "G3"],
    targetScore: 10,
    timeLimit: null
  },
  4: {
    title: "Nivel 4: Clave de Fa Completa",
    description: "Octava completa en la Clave de Fa: Do3 a Do4. ¡Desbloquea el gran desafío final!",
    clef: "fa",
    notes: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"],
    targetScore: 10,
    timeLimit: null
  },
  5: {
    title: "Nivel 5: Desafío Mixto Contrarreloj",
    description: "El reto absoluto: Claves de Sol y Fa mezcladas aleatoriamente, con solo 4 segundos para responder por nota.",
    clef: "mixed",
    notes: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    targetScore: 15,
    timeLimit: 4000 // 4 seconds
  }
};

// Frequency map for note synthesis
const NOTE_FREQS = {
  "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00, "B3": 246.94,
  "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88,
  "C5": 523.25
};

// Map note names to display names in Spanish
const NOTE_NAMES_ES = {
  "C": "DO", "D": "RE", "E": "MI", "F": "FA", "G": "SOL", "A": "LA", "B": "SI"
};

// --- STATE VARIABLES ---
let currentLevelNum = 1;
let currentLevel = LEVELS[1];
let score = 0;
let lives = 3;
let currentNote = null;
let currentClef = "sol"; // "sol" or "fa"
let audioCtx = null;
let isGameActive = false;
let noteTimer = null;
let timeLeft = 0;
const sampleCache = {};
let samplesLoaded = false;

// --- DOM ELEMENTS ---
const hudLevelNum = document.getElementById("hud-level-num");
const hudClefName = document.getElementById("hud-clef-name");
const hudScore = document.getElementById("hud-score");
const heartsBox = document.getElementById("hearts-box");
const feedbackBox = document.getElementById("feedback-box");
const startOverlay = document.getElementById("start-overlay");
const overlayLevelTitle = document.getElementById("overlay-level-title");
const overlayLevelDesc = document.getElementById("overlay-level-desc");
const btnStart = document.getElementById("btn-start");
const pianoKeyboard = document.getElementById("piano-keyboard");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const btnNextLevel = document.getElementById("btn-next-level");
const btnRestart = document.getElementById("btn-restart");
const staffSvg = document.getElementById("staff-svg");

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Parse level from URL query string
  const params = new URLSearchParams(window.location.search);
  const lvlParam = params.get("level");
  
  if (lvlParam === "custom") {
    currentLevelNum = "custom";
    const customConfig = JSON.parse(sessionStorage.getItem("sevenkeys_custom_config"));
    if (customConfig) {
      // Map base note names to Spanish for the description listing
      const spanishNotes = customConfig.notes.map(n => NOTE_NAMES_ES[n.slice(0, -1)] + n.slice(-1));
      currentLevel = {
        title: "Práctica Personalizada",
        description: `Practica a tu propio ritmo con las notas que has configurado: ${spanishNotes.join(", ")}.`,
        clef: customConfig.clef,
        notes: customConfig.notes,
        targetScore: customConfig.targetScore,
        timeLimit: customConfig.timeLimit
      };
    } else {
      currentLevel = LEVELS[1];
    }
  } else {
    const lvl = parseInt(lvlParam);
    if (lvl && LEVELS[lvl]) {
      currentLevelNum = lvl;
      currentLevel = LEVELS[lvl];
    }
  }

  // Update HUD & Start Overlay texts
  hudLevelNum.textContent = currentLevelNum;
  hudClefName.textContent = currentLevel.clef === "mixed" ? "Mixta" : (currentLevel.clef === "sol" ? "Sol" : "Fa");
  overlayLevelTitle.textContent = currentLevel.title;
  overlayLevelDesc.textContent = currentLevel.description;

  // Generate piano keys based on level's note range
  generatePianoKeys();

  // Setup event listeners
  btnStart.addEventListener("click", handleStartClick);
  btnRestart.addEventListener("click", restartGame);
  btnNextLevel.addEventListener("click", () => {
    window.location.href = `game.html?level=${currentLevelNum + 1}`;
  });

  // Render static background staff initially
  drawStaffLines(currentLevel.clef === "mixed" ? "sol" : currentLevel.clef);
});

// --- AUDIO SYNTHESIS & SAMPLING ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function handleStartClick() {
  initAudio();
  if (!samplesLoaded) {
    loadSamplesAndStart();
  } else {
    startGame();
  }
}

function loadSamplesAndStart() {
  const notesToLoad = Object.keys(NOTE_FREQS);
  
  btnStart.setAttribute("disabled", "true");
  btnStart.textContent = "Cargando piano real...";
  
  // Show a mini loading text below the button
  const loaderText = document.createElement("p");
  loaderText.id = "sample-loader-status";
  loaderText.style.cssText = "color: var(--color-cyan); font-size: 0.9rem; margin-top: 10px;";
  loaderText.textContent = "Obteniendo muestras de sonido real...";
  btnStart.parentNode.appendChild(loaderText);
  
  const promises = notesToLoad.map(note => {
    if (sampleCache[note]) return Promise.resolve();
    // Fetch individual piano note mp3 files from open source midi-js-soundfonts project
    const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/${note}.mp3`;
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Could not load sample");
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        sampleCache[note] = audioBuffer;
      })
      .catch(err => {
        console.warn(`Error al cargar la nota ${note}, usando sintetizador de respaldo.`, err);
      });
  });
  
  Promise.all(promises).finally(() => {
    const statusText = document.getElementById("sample-loader-status");
    if (statusText) statusText.remove();
    samplesLoaded = true;
    startGame();
  });
}

function playNoteSound(noteName) {
  if (!audioCtx) return;
  
  const buffer = sampleCache[noteName];
  if (buffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } else {
    // Fallback to our high-quality synthesizer
    const freq = NOTE_FREQS[noteName];
    if (freq) {
      playTone(freq, 1.2);
    }
  }
}

function playTone(freq, duration = 1.2) {
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  // Master Gain node to control overall volume and sustain/decay
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
  
  // ADSR volume envelope for an acoustic piano-like decay
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.4, now + 0.005); // Attack
  masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.25); // Decay
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
  
  // Lowpass filter to simulate piano body resonances (warmth and woodiness)
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4, now);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.4);
  filter.connect(masterGain);
  
  // 1. Fundamental frequency (Sine wave, strongest component)
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);
  const gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0.8, now);
  osc1.connect(gain1);
  gain1.connect(filter);
  
  // 2. Second harmonic (2 * frequency, for warm acoustic overtone)
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);
  const gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0.28, now);
  osc2.connect(gain2);
  gain2.connect(filter);
  
  // 3. Third harmonic (3 * frequency, for metallic string definition)
  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(freq * 3, now);
  const gain3 = audioCtx.createGain();
  gain3.gain.setValueAtTime(0.14, now);
  osc3.connect(gain3);
  gain3.connect(filter);
  
  // 4. Hammer strike transient (very brief, high frequency sine)
  const hammer = audioCtx.createOscillator();
  hammer.type = 'sine';
  hammer.frequency.setValueAtTime(freq * 6, now);
  const hammerGain = audioCtx.createGain();
  hammerGain.gain.setValueAtTime(0.3, now);
  hammerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04); // Decays almost instantly
  hammer.connect(hammerGain);
  hammerGain.connect(filter);
  
  // Start all oscillators
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  hammer.start(now);
  
  // Stop all oscillators
  osc1.stop(now + duration);
  osc2.stop(now + duration);
  osc3.stop(now + duration);
  hammer.stop(now + 0.05);
}

// --- KEYBOARD GENERATION ---
function generatePianoKeys() {
  pianoKeyboard.innerHTML = "";
  
  // Determine note range we need to show
  // For Level 1-2: C4 to C5
  // For Level 3-4: C3 to C4
  // For Level 5: C3 to C5
  let range = [];
  if (currentLevelNum <= 2) {
    range = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  } else if (currentLevelNum <= 4) {
    range = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];
  } else {
    range = ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  }
  
  // Full scale notes to place black keys correctly
  const chromatic = [
    { name: "C", isBlack: false },
    { name: "C#", isBlack: true },
    { name: "D", isBlack: false },
    { name: "D#", isBlack: true },
    { name: "E", isBlack: false },
    { name: "F", isBlack: false },
    { name: "F#", isBlack: true },
    { name: "G", isBlack: false },
    { name: "G#", isBlack: true },
    { name: "A", isBlack: false },
    { name: "A#", isBlack: true },
    { name: "B", isBlack: false }
  ];

  // We want to generate keys chronologically by octave
  const minOctave = parseInt(range[0].slice(-1));
  const maxOctave = parseInt(range[range.length - 1].slice(-1));
  
  for (let oct = minOctave; oct <= maxOctave; oct++) {
    for (let item of chromatic) {
      const noteName = `${item.name}${oct}`;
      
      // Stop if note is beyond max note in range
      if (oct === maxOctave && item.name !== "C" && range.indexOf(noteName) === -1) {
        continue;
      }
      
      const key = document.createElement("div");
      if (item.isBlack) {
        key.className = "piano-key black";
        key.dataset.note = noteName;
      } else {
        key.className = "piano-key white";
        key.dataset.note = noteName;
        
        // Show letter name in Spanish
        const baseName = item.name;
        const spanishName = NOTE_NAMES_ES[baseName];
        
        // Label middle C or C keys
        if (baseName === "C") {
          key.innerHTML = `<span style="font-size:0.7rem; color:var(--text-muted); position:absolute; top: 10px;">C${oct}</span>${spanishName}`;
        } else {
          key.innerHTML = spanishName;
        }
      }
      
      // Click listeners
      key.addEventListener("mousedown", () => handleKeyPress(noteName));
      pianoKeyboard.appendChild(key);
    }
  }
}

// --- STAFF DRAWING ---
function drawStaffLines(clefType) {
  // Clear SVG
  staffSvg.innerHTML = "";
  
  // Draw 5 staff lines
  // Spacing: 20px. Y starts at 60 and ends at 140
  for (let i = 0; i < 5; i++) {
    const y = 60 + (i * 20);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "10");
    line.setAttribute("y1", y);
    line.setAttribute("x2", "490");
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "rgba(255, 255, 255, 0.2)");
    line.setAttribute("stroke-width", "2");
    staffSvg.appendChild(line);
  }
  
  // Side bar lines (clefs boundaries)
  const leftBar = document.createElementNS("http://www.w3.org/2000/svg", "line");
  leftBar.setAttribute("x1", "10"); leftBar.setAttribute("y1", "60");
  leftBar.setAttribute("x2", "10"); leftBar.setAttribute("y2", "140");
  leftBar.setAttribute("stroke", "rgba(255, 255, 255, 0.4)");
  leftBar.setAttribute("stroke-width", "3");
  staffSvg.appendChild(leftBar);

  const rightBar = document.createElementNS("http://www.w3.org/2000/svg", "line");
  rightBar.setAttribute("x1", "490"); rightBar.setAttribute("y1", "60");
  rightBar.setAttribute("x2", "490"); rightBar.setAttribute("y2", "140");
  rightBar.setAttribute("stroke", "rgba(255, 255, 255, 0.4)");
  rightBar.setAttribute("stroke-width", "3");
  staffSvg.appendChild(rightBar);
  
  // Render Clef Symbol
  const clefText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clefText.setAttribute("fill", "var(--color-gold)");
  clefText.setAttribute("font-family", "serif");
  
  if (clefType === "sol") {
    clefText.setAttribute("x", "14");
    clefText.setAttribute("y", "138");
    clefText.setAttribute("font-size", "110");
    clefText.textContent = "𝄞";
  } else {
    clefText.setAttribute("x", "14");
    clefText.setAttribute("y", "136");
    clefText.setAttribute("font-size", "75");
    clefText.textContent = "𝄢";
  }
  staffSvg.appendChild(clefText);
}

function drawNoteOnStaff(note, clef) {
  // Clear any existing note elements (keep lines and clefs)
  const linesAndClefs = Array.from(staffSvg.querySelectorAll("line, text"));
  staffSvg.innerHTML = "";
  linesAndClefs.forEach(el => staffSvg.appendChild(el));
  
  // Calculate Y coordinate for the note
  const y = getNoteYPosition(note, clef);
  const noteX = 260; // Center of the staff
  
  // Draw ledger lines if outside main staff lines (Y < 60 or Y > 140)
  drawLedgerLines(noteX, y);

  // Draw note head (elipse)
  const noteHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  noteHead.setAttribute("cx", noteX);
  noteHead.setAttribute("cy", y);
  noteHead.setAttribute("rx", "12");
  noteHead.setAttribute("ry", "8");
  noteHead.setAttribute("fill", "var(--color-cyan)");
  noteHead.setAttribute("transform", `rotate(-20, ${noteX}, ${y})`);
  noteHead.setAttribute("filter", "drop-shadow(0px 0px 5px var(--color-cyan-glow))");
  staffSvg.appendChild(noteHead);
  
  // Draw note stem (vertical line)
  // For lower notes, stem goes up on the right. For higher notes, stem goes down on the left.
  const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const stemLength = 55;
  if (y >= 100) {
    // Stem goes UP
    stem.setAttribute("x1", noteX + 11);
    stem.setAttribute("y1", y - 3);
    stem.setAttribute("x2", noteX + 11);
    stem.setAttribute("y2", y - stemLength);
  } else {
    // Stem goes DOWN
    stem.setAttribute("x1", noteX - 11);
    stem.setAttribute("y1", y + 3);
    stem.setAttribute("x2", noteX - 11);
    stem.setAttribute("y2", y + stemLength);
  }
  stem.setAttribute("stroke", "var(--text-main)");
  stem.setAttribute("stroke-width", "2.5");
  staffSvg.appendChild(stem);
}

// Map note names to Y coordinates
function getNoteYPosition(note, clef) {
  // Main Y levels:
  // Staff lines at Y = 60, 80, 100, 120, 140
  // Note steps are 10px apart (lines and spaces)
  
  if (clef === "sol") {
    const solMap = {
      "C4": 160, // Ledger line
      "D4": 150,
      "E4": 140, // Line 1
      "F4": 130,
      "G4": 120, // Line 2
      "A4": 110,
      "B4": 100, // Line 3
      "C5": 90
    };
    return solMap[note] || 100;
  } else {
    const faMap = {
      "C3": 110,
      "D3": 100, // Line 3
      "E3": 90,
      "F3": 80,  // Line 4
      "G3": 70,
      "A3": 60,  // Line 5
      "B3": 50,
      "C4": 40   // Ledger line above
    };
    return faMap[note] || 100;
  }
}

function drawLedgerLines(x, y) {
  // Lines are at: Y = 60, 80, 100, 120, 140
  // If Y is 160 (C4 in Treble) or Y <= 40 (C4 in Bass), we need ledger lines
  if (y >= 160) {
    for (let ly = 160; ly <= y; ly += 20) {
      createLedgerLine(x, ly);
    }
  } else if (y <= 40) {
    for (let ly = 40; ly >= y; ly -= 20) {
      createLedgerLine(x, ly);
    }
  }
}

function createLedgerLine(x, y) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x - 22);
  line.setAttribute("y1", y);
  line.setAttribute("x2", x + 22);
  line.setAttribute("y2", y);
  line.setAttribute("stroke", "white");
  line.setAttribute("stroke-width", "2");
  staffSvg.appendChild(line);
}

// --- GAME LOGIC ---
let confetti = [];
let confettiActive = false;
let confettiCanvas = null;
let confettiCtx = null;
let confettiAnimId = null;

const encouragementPhrases = [
  "¡Uy, casi! ¡Inténtalo de nuevo, tú puedes! 💪",
  "¡No pasa nada! Recuerda mirar bien el pentagrama 🌟",
  "¡Vamos, concéntrate! ¡La música es pura práctica! 🎶",
  "¡Ojo! Revisa las líneas y espacios. ¡Vamos otra vez! 🎹",
  "¡Tú puedes hacerlo! Respira hondo y toca la nota ✨"
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
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function createConfetti() {
  confettiCanvas = document.getElementById("confetti-canvas");
  if (!confettiCanvas) return;
  confettiCtx = confettiCanvas.getContext("2d");
  
  // Resize canvas to match game-container
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
    
    // Wrap around boundaries
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

function startGame() {
  initAudio();
  isGameActive = true;
  score = 0;
  lives = 3;
  
  // Hide active toast if any
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
  
  hudScore.textContent = `0 / ${currentLevel.targetScore}`;
  updateHeartsDisplay();
  
  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";
  
  generateNextQuestion();
}

function restartGame() {
  startGame();
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
  
  // Choose random note from allowed pool
  const pool = currentLevel.notes;
  let nextNote = pool[Math.floor(Math.random() * pool.length)];
  
  // Prevent repeating the same note twice in a row if pool has multiple notes
  if (pool.length > 1) {
    while (nextNote === currentNote) {
      nextNote = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  
  currentNote = nextNote;
  
  // Set clef for this note based on level type
  if (currentLevel.clef === "mixed") {
    // Determine clef based on octave prefix (C3-B3 is Fa, C4-C5 is Sol)
    const oct = parseInt(currentNote.slice(-1));
    currentClef = oct <= 3 ? "fa" : "sol";
  } else {
    currentClef = currentLevel.clef;
  }
  
  // Render
  drawStaffLines(currentClef);
  drawNoteOnStaff(currentNote, currentClef);
  
  feedbackBox.className = "feedback-box";
  feedbackBox.textContent = "";
  
  // Handle contrarreloj (timed mode)
  if (currentLevel.timeLimit) {
    startNoteTimer();
  }
}

function startNoteTimer() {
  if (noteTimer) clearTimeout(noteTimer);
  
  let timeStart = Date.now();
  
  function checkTimer() {
    if (!isGameActive) return;
    const elapsed = Date.now() - timeStart;
    if (elapsed >= currentLevel.timeLimit) {
      handleIncorrectAnswer(true);
    } else {
      noteTimer = setTimeout(checkTimer, 100);
    }
  }
  
  noteTimer = setTimeout(checkTimer, 100);
}

function handleKeyPress(noteName) {
  if (!isGameActive) return;
  
  // Match without octave number first
  const pressedBase = noteName.slice(0, -1);
  const currentBase = currentNote.slice(0, -1);
  
  // Check if correct key pressed
  if (pressedBase === currentBase) {
    handleCorrectAnswer();
  } else {
    handleIncorrectAnswer(false);
  }
}

function handleCorrectAnswer() {
  if (currentLevel.timeLimit) clearTimeout(noteTimer);
  
  // Play note audio
  playTone(NOTE_FREQS[currentNote], 0.4);
  
  score++;
  hudScore.textContent = `${score} / ${currentLevel.targetScore}`;
  
  feedbackBox.className = "feedback-box feedback-correct";
  feedbackBox.textContent = "¡Excelente!";
  
  // Check win condition
  if (score >= currentLevel.targetScore) {
    handleWin();
  } else {
    setTimeout(generateNextQuestion, 800);
  }
}

function handleIncorrectAnswer(isTimeout = false) {
  if (currentLevel.timeLimit) clearTimeout(noteTimer);
  
  lives--;
  updateHeartsDisplay();
  
  feedbackBox.className = "feedback-box feedback-wrong";
  if (isTimeout) {
    feedbackBox.textContent = "¡Tiempo agotado!";
  } else {
    feedbackBox.textContent = "¡Nota incorrecta!";
  }
  
  // Play error feedback indicator
  if (audioCtx) {
    playTone(150, 0.3); // Low buzzer tone
  }
  
  // Check lose condition
  if (lives <= 0) {
    handleLose();
  } else {
    showEncouragementToast();
    setTimeout(generateNextQuestion, 1000);
  }
}

function handleWin() {
  isGameActive = false;
  if (currentLevel.timeLimit) clearTimeout(noteTimer);
  
  // Hide active toast if any
  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");
  
  // Save progress if custom mode is not active
  if (currentLevelNum !== "custom") {
    let progress = JSON.parse(localStorage.getItem("sevenkeys_progress")) || {
      unlocked: [1],
      highScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    // Update record
    const currentRecord = progress.highScores[currentLevelNum] || 0;
    if (score > currentRecord) {
      progress.highScores[currentLevelNum] = score;
    }
    
    // Unlock next level
    if (currentLevelNum < 5 && !progress.unlocked.includes(currentLevelNum + 1)) {
      progress.unlocked.push(currentLevelNum + 1);
    }
    
    localStorage.setItem("sevenkeys_progress", JSON.stringify(progress));
  }
  
  // Show win modal
  setTimeout(() => {
    winModal.style.display = "flex";
    
    // Launch Confetti Animation
    createConfetti();
    updateAndDrawConfetti();

    if (currentLevelNum === "custom") {
      btnNextLevel.style.display = "none";
      document.getElementById("win-message").textContent = `¡Felicidades! Has completado tu práctica personalizada con ${score} aciertos perfectos.`;
    } else if (currentLevelNum === 5) {
      btnNextLevel.style.display = "none";
      document.getElementById("win-message").textContent = `¡Felicidades! Has completado el Gran Desafío Final con ${score} aciertos. ¡Eres todo un maestro de la música!`;
    } else {
      btnNextLevel.style.display = "block";
      document.getElementById("win-message").textContent = `Excelente lectura de notas. ¡Has completado el Nivel ${currentLevelNum} y desbloqueado el siguiente nivel!`;
    }
  }, 600);
}

function handleLose() {
  isGameActive = false;
  if (currentLevel.timeLimit) clearTimeout(noteTimer);
  
  // Hide active toast if any
  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");
  
  setTimeout(() => {
    loseModal.style.display = "flex";
  }, 600);
}
