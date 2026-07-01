// --- DATA & CONFIG ---
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudScore = document.getElementById("hud-score");
const heartsBox = document.getElementById("hearts-box");
const startOverlay = document.getElementById("start-overlay");
const btnStart = document.getElementById("btn-start");
const winModal = document.getElementById("win-modal");
const loseModal = document.getElementById("lose-modal");
const staffSvg = document.getElementById("big-staff-svg");
const pianoKeys = document.querySelectorAll(".wkey");
const hudHint = document.querySelector(".hud-hint");

// Treble Clef Notes (DO4 to DO5)
// Spacing = 22px. Lines centered vertically at Y = 36, 58, 80, 102, 124.
const TREBLE_NOTES = [
  { id: "C", name: "DO",  color: "#ef4444", darkColor: "#7f1d1d", staffY: 146, isLedger: true, lane: 0 },   // Ledger at 146
  { id: "D", name: "RE",  color: "#f97316", darkColor: "#7c2d12", staffY: 135, isLedger: false, lane: 1 },  // Space below Line 1
  { id: "E", name: "MI",  color: "#eab308", darkColor: "#713f12", staffY: 124, isLedger: false, lane: 2 },  // Line 1
  { id: "F", name: "FA",  color: "#22c55e", darkColor: "#14532d", staffY: 113, isLedger: false, lane: 3 },  // Space 1
  { id: "G", name: "SOL", color: "#06b6d4", darkColor: "#164e63", staffY: 102, isLedger: false, lane: 4 },  // Line 2
  { id: "A", name: "LA",  color: "#1d4ed8", darkColor: "#1e3a8a", staffY: 91,  isLedger: false, lane: 5 },  // Space 2
  { id: "B", name: "SI",  color: "#a855f7", darkColor: "#581c87", staffY: 80,  isLedger: false, lane: 6 },  // Line 3
  { id: "C2", name: "DO", color: "#ef4444", darkColor: "#7f1d1d", staffY: 69,  isLedger: false, lane: 7 }   // Space 3
];

// Bass Clef Notes (DO3 to DO4)
const BASS_NOTES = [
  { id: "C", name: "DO",  color: "#ef4444", darkColor: "#7f1d1d", staffY: 91,  isLedger: false, lane: 0 },   // Space 2 (between Line 2 & 3)
  { id: "D", name: "RE",  color: "#f97316", darkColor: "#7c2d12", staffY: 80,  isLedger: false, lane: 1 },   // Line 3 (D3)
  { id: "E", name: "MI",  color: "#eab308", darkColor: "#713f12", staffY: 69,  isLedger: false, lane: 2 },   // Space 3 (E3)
  { id: "F", name: "FA",  color: "#22c55e", darkColor: "#14532d", staffY: 58,  isLedger: false, lane: 3 },   // Line 4 (F3)
  { id: "G", name: "SOL", color: "#06b6d4", darkColor: "#164e63", staffY: 47,  isLedger: false, lane: 4 },   // Space 4 (G3)
  { id: "A", name: "LA",  color: "#1d4ed8", darkColor: "#1e3a8a", staffY: 36,  isLedger: false, lane: 5 },   // Line 5 (A3)
  { id: "B", name: "SI",  color: "#a855f7", darkColor: "#581c87", staffY: 25,  isLedger: false, lane: 6 },   // Space above Line 5 (B3)
  { id: "C2", name: "DO", color: "#ef4444", darkColor: "#7f1d1d", staffY: 14,  isLedger: true,  lane: 7 }    // Ledger line above Line 5 (C4, Middle C)
];

let gameState = "START"; 
let score = 0;
let lives = 3;
let animationId;
let currentTargetNote = null;
let lastTargetNoteId = null;

// Game Config chosen by user
let chosenSpeedSetting = "slow"; 
let chosenClefSetting = "treble"; 
let chosenColorSetting = "colored"; // "colored" or "glass"

const speedConfigs = {
  slow: { baseSpeed: 0.3, acceleration: 0.002 },
  medium: { baseSpeed: 0.5, acceleration: 0.004 },
  fast: { baseSpeed: 0.8, acceleration: 0.006 }
};

// Teacher Juan Di encouragement phrases for toast notification
const encouragementPhrases = [
  "¡Uy, casi! ¡Inténtalo de nuevo, tú puedes! 💪",
  "¡No pasa nada! Recuerda mirar bien el pentagrama 🌟",
  "¡Vamos, concéntrate! ¡La música es pura práctica! 🎶",
  "¡Ojo! Revisa las líneas y espacios. ¡Vamos otra vez! 🎹",
  "¡Tú puedes hacerlo! Respira hondo y toca la nota ✨"
];

// Falling bubble (blank color orb)
let bubble = {
  x: 0,
  y: 0,
  radius: 18, 
  speed: 0.3,  
  note: null,
  active: false
};

// Particles for explosion
let particles = [];

// Falling Confetti and Serpentines for victory screen
let confetti = [];

// Audio Context and Piano Samples Cache
let audioCtx = null;
const sampleCache = {};
let samplesLoaded = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Map dynamic note templates to official MIDI names (C3 - C5)
function getMidiNoteName(noteId, clef) {
  if (clef === "treble") {
    if (noteId === "C2") return "C5";
    return noteId + "4";
  } else {
    if (noteId === "C2") return "C4";
    return noteId + "3";
  }
}

// Fetch piano note samples from open source MIDI soundfont repository
function loadPianoSamples(callback) {
  initAudio();
  const notesToLoad = [
    "C3", "D3", "E3", "F3", "G3", "A3", "B3",
    "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"
  ];
  
  const statusBtn = document.getElementById("btn-start");
  const originalText = statusBtn.textContent;
  statusBtn.setAttribute("disabled", "true");
  statusBtn.textContent = "Cargando piano real...";
  
  const promises = notesToLoad.map(note => {
    if (sampleCache[note]) return Promise.resolve();
    const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/${note}.mp3`;
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Fetch failed");
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        sampleCache[note] = audioBuffer;
      })
      .catch(err => {
        console.warn(`Error al cargar piano real para ${note}, usando sintetizador de respaldo.`, err);
      });
  });
  
  Promise.all(promises).finally(() => {
    statusBtn.removeAttribute("removed"); // Cleanup
    statusBtn.removeAttribute("disabled");
    statusBtn.textContent = originalText;
    samplesLoaded = true;
    callback();
  });
}

// Play real piano note sound or fall back to synth chime if not loaded
function playNoteSound(noteName) {
  if (!audioCtx) return;
  
  const buffer = sampleCache[noteName];
  if (buffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  } else {
    // Backup synthetic chime
    const freq = chosenClefSetting === "treble" ? trebleNoteFreqs[currentTargetNote.id] : bassNoteFreqs[currentTargetNote.id];
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 1.2);
    osc2.stop(audioCtx.currentTime + 1.2);
  }
}

const trebleNoteFreqs = {
  "C": 261.63, 
  "D": 293.66,
  "E": 329.63,
  "F": 349.23,
  "G": 392.00,
  "A": 440.00,
  "B": 493.88,
  "C2": 523.25 
};

const bassNoteFreqs = {
  "C": 130.81, 
  "D": 146.83,
  "E": 164.81,
  "F": 174.61,
  "G": 196.00,
  "A": 220.00,
  "B": 246.94,
  "C2": 261.63 
};

function playErrorSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(140, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.35);
  
  gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.35);
}

// --- SETUP & RESIZE ---
function resizeCanvas() {
  const wrap = document.querySelector('.canvas-wrap');
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

window.addEventListener('resize', resizeCanvas);

// --- RENDERING STAFF ---
function drawStaff(noteObj) {
  let svgContent = `
    <defs>
      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.0" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
  `;

  if (noteObj) {
    svgContent += `
      <filter id="noteGlow">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffffff" flood-opacity="0.5"/>
      </filter>
    `;
  }

  svgContent += `
    </defs>
    
    <!-- 5 lines of the staff with 22px spacing, centered vertically -->
    <path d="M 40 36 L 460 36" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <path d="M 40 58 L 460 58" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <path d="M 40 80 L 460 80" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <path d="M 40 102 L 460 102" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <path d="M 40 124 L 460 124" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
  `;

  if (chosenClefSetting === "treble") {
    // Centered exactly around the SOL line (Y = 102)
    svgContent += `<text x="30" y="118" fill="var(--color-gold, #d4af37)" font-family="serif" font-size="92" filter="url(#neon-glow)">𝄞</text>`;
  } else {
    // Centered around the FA line (Y = 58)
    svgContent += `<text x="30" y="118" fill="var(--color-gold, #d4af37)" font-family="serif" font-size="80" filter="url(#neon-glow)">𝄢</text>`;
  }

  if (noteObj) {
    if (noteObj.isLedger) {
      svgContent += `<line x1="228" y1="${noteObj.staffY}" x2="272" y2="${noteObj.staffY}" stroke="#ffffff" stroke-width="2.5" />`;
    }
    
    // Premium elegant cyan note design (matches game.html styles exactly)
    svgContent += `
      <ellipse cx="250" cy="${noteObj.staffY}" rx="12" ry="8" fill="var(--color-cyan, #00e5ff)" filter="url(#noteGlow)" transform="rotate(-20 250 ${noteObj.staffY})" />
    `;
    
    if (noteObj.staffY > 80) {
      // Elegant thin stem pointing up on the right
      svgContent += `<line x1="261.5" y1="${noteObj.staffY}" x2="261.5" y2="${noteObj.staffY - 35}" stroke="#ffffff" stroke-width="2" />`;
    } else {
      // Elegant thin stem pointing down on the left
      svgContent += `<line x1="238.5" y1="${noteObj.staffY}" x2="238.5" y2="${noteObj.staffY + 35}" stroke="#ffffff" stroke-width="2" />`;
    }
  }

  staffSvg.innerHTML = svgContent;
}

// --- GAME LOGIC ---

function selectTargetNote() {
  const notePool = chosenClefSetting === "treble" ? TREBLE_NOTES : BASS_NOTES;
  
  let available = notePool.filter(n => n.id !== lastTargetNoteId);
  if (available.length === 0) available = notePool;
  
  currentTargetNote = available[Math.floor(Math.random() * available.length)];
  lastTargetNoteId = currentTargetNote.id;
  
  drawStaff(currentTargetNote);
  hudHint.innerText = `¡Toca la nota del pentagrama!`;
  
  spawnBubbleForTarget(currentTargetNote);
}

function spawnBubbleForTarget(noteTemplate) {
  const margin = bubble.radius * 2;
  const targetX = margin + Math.random() * (canvas.width - margin * 2);
  
  const speedCfg = speedConfigs[chosenSpeedSetting];
  
  bubble.x = targetX;
  bubble.y = -bubble.radius;
  bubble.note = noteTemplate;
  bubble.speed = speedCfg.baseSpeed + (score * speedCfg.acceleration); 
  bubble.active = true;
}

function updateHUD() {
  hudScore.innerText = score;
  let heartsStr = "";
  for (let i = 0; i < 3; i++) {
    heartsStr += i < lives ? "❤️" : "🖤";
  }
  heartsBox.innerText = heartsStr;
}

function checkKeyInput(clickedNote) {
  if (gameState !== "PLAYING" || !bubble.active) return;
  
  if (clickedNote === currentTargetNote.id) {
    bubble.active = false;
    handleCatch();
  } else {
    handleMistake();
  }
}

function handleMistake() {
  playErrorSound();
  lives--;
  updateHUD();
  
  const wrap = document.querySelector('.canvas-wrap');
  wrap.style.background = "rgba(239, 68, 68, 0.25)";
  setTimeout(() => wrap.style.background = "rgba(0, 0, 0, 0.4)", 180);

  if (lives <= 0) {
    const toast = document.getElementById("profe-toast");
    if (toast) toast.classList.remove("show");
    endGame(false);
  } else {
    showEncouragementToast();
    selectTargetNote(); 
  }
}

let toastTimeout = null;
function showEncouragementToast() {
  const toast = document.getElementById("profe-toast");
  const toastText = document.getElementById("profe-toast-text");
  if (!toast || !toastText) return;
  
  const phrase = encouragementPhrases[Math.floor(Math.random() * encouragementPhrases.length)];
  toastText.innerText = `"${phrase}"`;
  
  toast.classList.add("show");
  
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function handleCatch() {
  const midiNote = getMidiNoteName(currentTargetNote.id, chosenClefSetting);
  playNoteSound(midiNote);
  score += 10;
  updateHUD();
  
  const explosionColor = chosenColorSetting === "colored" ? currentTargetNote.color : "#f1f5f9";
  createExplosion(bubble.x, bubble.y, explosionColor);
  
  if (score >= 150) {
    const toast = document.getElementById("profe-toast");
    if (toast) toast.classList.remove("show");
    endGame(true);
  } else {
    selectTargetNote();
  }
}

function createExplosion(x, y, color) {
  for (let i = 0; i < 18; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 1,
      radius: Math.random() * 4 + 2,
      color: color,
      life: 1.0,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

// Confetti Setup for Win Modal
function createConfetti() {
  confetti = [];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#1d4ed8", "#a855f7", "#ec4899"];
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height - 20,
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
  if (gameState !== "END") return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background styling
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let activeConfetti = 0;
  for (let i = 0; i < confetti.length; i++) {
    let c = confetti[i];
    c.y += c.vy;
    c.x += c.vx;
    c.rotation += c.rotationSpeed;
    
    // Wrap around boundaries
    if (c.x < -10) c.x = canvas.width + 10;
    if (c.x > canvas.width + 10) c.x = -10;
    
    if (c.y < canvas.height + 20) {
      activeConfetti++;
    }
    
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation * Math.PI / 180);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.width/2, -c.height/2, c.width, c.height);
    ctx.restore();
  }
  
  if (activeConfetti > 0 && gameState === "END") {
    animationId = requestAnimationFrame(updateAndDrawConfetti);
  }
}

function gameLoop() {
  if (gameState !== "PLAYING") return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (bubble.active) {
    bubble.y += bubble.speed;
    
    if (bubble.y - bubble.radius > canvas.height) {
      bubble.active = false;
      handleMistake();
    } else {
      let bubbleColor = bubble.note.color;
      let bubbleDarkColor = bubble.note.darkColor;
      
      if (chosenColorSetting === "glass") {
        bubbleColor = "rgba(241, 245, 249, 0.9)";
        bubbleDarkColor = "rgba(100, 116, 139, 0.85)";
      }
      
      let grad = ctx.createRadialGradient(
        bubble.x - bubble.radius/3, bubble.y - bubble.radius/3, bubble.radius/10,
        bubble.x, bubble.y, bubble.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, bubbleColor);
      grad.addColorStop(1, bubbleDarkColor);
      
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = chosenColorSetting === "colored" ? bubble.note.color : "rgba(255, 255, 255, 0.4)";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0; 
      
      ctx.beginPath();
      ctx.arc(bubble.x - bubble.radius/3, bubble.y - bubble.radius/3, bubble.radius/3, Math.PI, 1.5 * Math.PI);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }
  }
  
  updateAndDrawParticles();
  
  animationId = requestAnimationFrame(gameLoop);
}

// --- CONTROLS VIA PIANO KEYBOARD ---
pianoKeys.forEach(btn => {
  const pressKey = (e) => {
    e.preventDefault();
    initAudio();
    
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
    
    const clickedNote = btn.getAttribute('data-note');
    checkKeyInput(clickedNote);
  };
  
  btn.addEventListener('mousedown', pressKey);
  btn.addEventListener('touchstart', pressKey);
});

// --- GLOBAL SPEED SELECTOR EVENT LISTENERS ---
const speedButtons = document.querySelectorAll(".btn-speed");
speedButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const speed = btn.getAttribute("data-speed");
    chosenSpeedSetting = speed;
    
    document.querySelectorAll(".btn-speed").forEach(b => {
      if (b.getAttribute("data-speed") === speed) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  });
});

// --- GLOBAL CLEF SELECTOR EVENT LISTENERS ---
const clefButtons = document.querySelectorAll(".btn-clef");
clefButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const clef = btn.getAttribute("data-clef");
    chosenClefSetting = clef;
    
    document.querySelectorAll(".btn-clef").forEach(b => {
      if (b.getAttribute("data-clef") === clef) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
    
    if (gameState !== "PLAYING") {
      drawStaff(null);
    }
  });
});

// --- GLOBAL BUBBLE COLOR MODE SELECTOR EVENT LISTENERS ---
const colorButtons = document.querySelectorAll(".btn-color");
colorButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.getAttribute("data-color-mode");
    chosenColorSetting = mode;
    
    document.querySelectorAll(".btn-color").forEach(b => {
      if (b.getAttribute("data-color-mode") === mode) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  });
});

// --- GAME FLOW ---

function handleStartButtonClick() {
  initAudio();
  if (!samplesLoaded) {
    loadPianoSamples(startGame);
  } else {
    startGame();
  }
}

function startGame() {
  score = 0;
  lives = 3;
  particles = [];
  confetti = [];
  bubble.active = false;
  gameState = "PLAYING";
  
  startOverlay.style.display = "none";
  winModal.style.display = "none";
  loseModal.style.display = "none";
  
  const toast = document.getElementById("profe-toast");
  if (toast) toast.classList.remove("show");
  
  resizeCanvas();
  updateHUD();
  selectTargetNote();
  
  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
}

function endGame(isWin) {
  gameState = "END";
  cancelAnimationFrame(animationId);
  
  if (isWin) {
    winModal.style.display = "flex";
    createConfetti();
    updateAndDrawConfetti();
  } else {
    loseModal.style.display = "flex";
    // Make sure canvas is cleared and dark overlay drawn
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

window.addEventListener('load', () => {
  resizeCanvas();
  drawStaff(null);
});

btnStart.addEventListener('click', handleStartButtonClick);
document.getElementById('btn-restart-win').addEventListener('click', handleStartButtonClick);
document.getElementById('btn-restart-lose').addEventListener('click', handleStartButtonClick);
