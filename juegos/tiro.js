// ================= TIRO AL BLANCO RÍTMICO GAME ENGINE =================

// Audio Synthesizer and Grand Piano Sample Preloading
let audioCtx = null;
let pianoBuffer = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    loadPianoSample();
  }
}

// Preload the grand piano C4 sample from acoustic soundfont repository
function loadPianoSample() {
  const url = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/C4.mp3";
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Fetch failed");
      return response.arrayBuffer();
    })
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      pianoBuffer = audioBuffer;
      console.log("Real grand piano sample C4 loaded successfully for Tiro al Blanco.");
    })
    .catch(err => {
      console.warn("Failed to load real piano sample, using synthesizer backup.", err);
    });
}

// Play real piano sound with a specific duration to model figures
function playPianoTone(durationMs, startTime) {
  if (pianoBuffer) {
    const source = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();
    source.buffer = pianoBuffer;
    
    gainNode.gain.setValueAtTime(0.6, startTime);
    // Simulate key release (dampening) by fading out at the end of the duration
    gainNode.gain.setValueAtTime(0.6, startTime + (durationMs / 1000) - 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + (durationMs / 1000));
    
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(startTime);
    source.stop(startTime + (durationMs / 1000));
  } else {
    // Backup synthetic flute-like tone at middle C (261.63 Hz)
    playTone(261.63, durationMs, startTime);
  }
}

// Play synth sound based on the musical figure
function playFigureSound(figureType, callback) {
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const tempoBPM = 80;
  const beatDurationMs = (60 / tempoBPM) * 1000; // ~750ms per beat

  const now = audioCtx.currentTime;

  if (figureType === 'negra') {
    playPianoTone(beatDurationMs * 0.9, now);
    setTimeout(callback, beatDurationMs);
  } else if (figureType === 'blanca') {
    playPianoTone(beatDurationMs * 1.9, now);
    setTimeout(callback, beatDurationMs * 2);
  } else if (figureType === 'corcheas') {
    playPianoTone(beatDurationMs * 0.35, now);
    playPianoTone(beatDurationMs * 0.35, now + (beatDurationMs * 0.5) / 1000);
    setTimeout(callback, beatDurationMs);
  } else if (figureType === 'silencio-negra') {
    // Metronome woodblock click to show a beat passed, but silence for the note
    playClick(800, 0.05, now);
    setTimeout(callback, beatDurationMs);
  }
}

function playTone(freq, durationMs, startTime) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'triangle'; // Smooth flute-like tone
  osc.frequency.setValueAtTime(freq, startTime);

  gainNode.gain.setValueAtTime(0.25, startTime);
  // Linear ramp down to avoid clicks
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + (durationMs / 1000));

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(startTime);
  osc.stop(startTime + (durationMs / 1000));
}

function playClick(freq, durationSec, startTime) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0.12, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + durationSec);
}

// Standard chime feedback for hits/errors
function playFeedbackSound(isHit) {
  initAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  if (isHit) {
    // Beautiful major third ascending chime
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1100, now + 0.1);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  } else {
    // Sad minor descending tone
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.15);
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  }
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start();
  osc.stop(now + 0.5);
}

// Traced SVG Path for the Silence, using Path2D
const SILENCE_PATH_STR = "M 7.5 5.0 L 9.1 5.0 L 10.7 5.5 L 12.3 6.5 L 14.0 7.4 L 15.4 8.4 L 17.0 9.4 L 18.6 10.4 L 20.0 11.3 L 19.8 12.3 L 18.4 13.3 L 17.0 14.3 L 15.6 15.3 L 14.7 16.2 L 14.0 17.2 L 13.7 18.2 L 14.0 19.2 L 14.7 20.1 L 15.6 21.1 L 16.8 22.1 L 18.1 23.1 L 19.5 24.0 L 19.8 25.0 L 17.9 24.9 L 16.1 24.4 L 14.2 24.3 L 12.3 24.5 L 10.7 25.4 L 10.3 26.4 L 10.3 27.3 L 11.0 28.3 L 11.7 29.3 L 13.0 30.3 L 12.3 31.0 L 10.5 30.1 L 8.6 29.3 L 6.8 28.3 L 5.4 27.3 L 4.5 26.4 L 4.0 25.4 L 4.0 24.4 L 4.7 23.4 L 6.3 22.6 L 8.2 22.2 L 10.0 22.1 L 11.9 22.2 L 13.7 22.6 L 14.4 22.3 L 13.0 21.4 L 11.7 20.4 L 10.3 19.4 L 8.9 18.4 L 7.7 17.5 L 6.3 16.5 L 5.4 15.5 L 7.2 14.5 L 8.9 13.5 L 10.3 12.6 L 11.2 11.6 L 11.7 10.6 L 11.7 9.6 L 11.4 8.7 L 10.7 7.7 L 9.8 6.7 L 8.6 5.7 L 7.9 5.2 Z";
let silencePath2D = null;
try {
  silencePath2D = new Path2D(SILENCE_PATH_STR);
} catch (e) {
  console.warn("Path2D not supported or failed", e);
}

// Game State variables
let currentLevel = 1;
let currentScore = 0;
let maxScore = 100;
let lives = 3;
let currentPromptFigure = null;
let isAudioPlaying = false;
let isGameActive = false;

// Physics Lists
let bubbles = [];
let particles = [];
let lasers = [];

// Canvas Setup
const canvas = document.getElementById("shooting-canvas");
const ctx = canvas.getContext("2d");
const arenaContainer = document.getElementById("arena-container");
const crosshair = document.getElementById("crosshair-element");

function resizeCanvas() {
  const rect = arenaContainer.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Follow cursor with Crosshair
arenaContainer.addEventListener("mousemove", (e) => {
  const rect = arenaContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  crosshair.style.left = `${x}px`;
  crosshair.style.top = `${y}px`;
  crosshair.style.display = "block";
});

arenaContainer.addEventListener("mouseleave", () => {
  crosshair.style.display = "none";
});

// Click / Tap listener for shooting
arenaContainer.addEventListener("pointerdown", (e) => {
  if (!isGameActive || isAudioPlaying) return;
  e.preventDefault();

  const rect = arenaContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  fireLaser(clickX, clickY);
});

// Configure figures database per level
const LEVEL_FIGURES = {
  1: ["negra", "blanca"],
  2: ["negra", "blanca", "silencio-negra"],
  3: ["negra", "blanca", "silencio-negra", "corcheas"],
  4: ["negra", "blanca", "silencio-negra", "corcheas"],
  5: ["negra", "blanca", "silencio-negra", "corcheas"]
};

// Speed setting per level
const LEVEL_SPEEDS = {
  1: { min: 1.0, max: 2.0, spawnCount: 4 },
  2: { min: 1.2, max: 2.2, spawnCount: 4 },
  3: { min: 1.5, max: 2.5, spawnCount: 5 },
  4: { min: 2.0, max: 3.2, spawnCount: 6 },
  5: { min: 2.5, max: 4.0, spawnCount: 7 }
};

// Neon color theme per figure type
const FIGURE_COLORS = {
  "negra": { fill: "rgba(0, 229, 255, 0.15)", border: "#00e5ff", glow: "rgba(0, 229, 255, 0.4)" },      // Cyan
  "blanca": { fill: "rgba(212, 175, 55, 0.15)", border: "#d4af37", glow: "rgba(212, 175, 55, 0.4)" },     // Gold
  "corcheas": { fill: "rgba(213, 0, 249, 0.15)", border: "#d500f9", glow: "rgba(213, 0, 249, 0.4)" },    // Magenta
  "silencio-negra": { fill: "rgba(0, 230, 118, 0.15)", border: "#00e676", glow: "rgba(0, 230, 118, 0.4)" } // Green
};

// Bubble Class
class Bubble {
  constructor(type, x, y, radius, vx, vy) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.color = FIGURE_COLORS[type];
    this.opacity = 1.0;
    this.scale = 1.0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off left/right walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx;
    } else if (this.x + this.radius > canvas.width) {
      this.x = canvas.width - this.radius;
      this.vx = -this.vx;
    }

    // Bounce off top/bottom walls
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy;
    } else if (this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius;
      this.vy = -this.vy;
    }
  }

  draw() {
    ctx.save();
    
    // Bubble body with Glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color.border;
    ctx.strokeStyle = this.color.border;
    ctx.lineWidth = 3;
    ctx.fillStyle = this.color.fill;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reflection arc for premium glass feel
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.5, Math.PI * 1.0, Math.PI * 1.5);
    ctx.stroke();

    // Render musical symbol in the center
    ctx.fillStyle = this.color.border;
    ctx.strokeStyle = this.color.border;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const cx = this.x;
    const cy = this.y;

    if (this.type === "negra") {
      // Filled oval rotated -20 degrees, stem
      ctx.save();
      ctx.translate(cx - 3, cy + 4);
      ctx.rotate(-20 * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(cx + 3, cy + 4);
      ctx.lineTo(cx + 3, cy - 14);
      ctx.stroke();

    } else if (this.type === "blanca") {
      // Hollow oval rotated -20 degrees, stem
      ctx.save();
      ctx.translate(cx - 3, cy + 4);
      ctx.rotate(-20 * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(cx + 3, cy + 4);
      ctx.lineTo(cx + 3, cy - 14);
      ctx.stroke();

    } else if (this.type === "corcheas") {
      // Two filled notes joined with a beam
      const dx = 10;
      
      // Note 1
      ctx.save();
      ctx.translate(cx - dx - 1, cy + 6);
      ctx.rotate(-20 * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(cx - dx + 3, cy + 6);
      ctx.lineTo(cx - dx + 3, cy - 10);
      ctx.stroke();

      // Note 2
      ctx.save();
      ctx.translate(cx + dx - 1, cy + 6);
      ctx.rotate(-20 * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(cx + dx + 3, cy + 6);
      ctx.lineTo(cx + dx + 3, cy - 10);
      ctx.stroke();

      // Connecting Beam
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - dx + 3, cy - 10);
      ctx.lineTo(cx + dx + 3, cy - 10);
      ctx.stroke();

    } else if (this.type === "silencio-negra") {
      // Render the calligraphic traced path
      if (silencePath2D) {
        ctx.save();
        // Scale and center the traced path inside the bubble
        // Path has viewBox 0 0 24 36. Let's scale it to fit nicely.
        ctx.translate(cx - 10, cy - 14);
        ctx.scale(0.85, 0.8);
        ctx.fill(silencePath2D);
        ctx.restore();
      } else {
        // Fallback simple line silence
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 10);
        ctx.lineTo(cx + 6, cy - 4);
        ctx.lineTo(cx - 6, cy + 4);
        ctx.lineTo(cx + 6, cy + 10);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// Particle Class for explosions
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1; // Slight upward force initially
    this.radius = Math.random() * 3 + 1.5;
    this.color = color;
    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.015;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08; // Gravity simulation
    this.life -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Laser Shot Line Class
class Laser {
  constructor(startX, startY, endX, endY, color) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = color;
    this.life = 1.0;
    this.decay = 0.07;
  }

  update() {
    this.life -= this.decay;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.lineWidth = 4 * this.life;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();
    ctx.restore();
  }
}

// Shockwave Class
class Shockwave {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.maxRadius = 35;
    this.color = color;
    this.opacity = 1.0;
  }

  update() {
    this.radius += 2.5;
    this.opacity = 1 - (this.radius / this.maxRadius);
  }

  draw() {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
let shockwaves = [];

// Fire Laser Action
function fireLaser(tx, ty) {
  // Start laser line from the center-bottom of the canvas
  const sx = canvas.width / 2;
  const sy = canvas.height;

  // Add laser line to anim list
  lasers.push(new Laser(sx, sy, tx, ty, "#00e5ff"));
  shockwaves.push(new Shockwave(tx, ty, "#00e5ff"));

  // Check collision with bubbles
  let shotHit = false;
  let bubbleHit = null;

  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    const dx = tx - b.x;
    const dy = ty - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= b.radius) {
      bubbleHit = b;
      bubbles.splice(i, 1);
      shotHit = true;
      break;
    }
  }

  if (shotHit) {
    // Generate beautiful particle burst
    for (let p = 0; p < 25; p++) {
      particles.push(new Particle(tx, ty, bubbleHit.color.border));
    }

    // Validate if the shot bubble type matches the current prompt figure
    if (bubbleHit.type === currentPromptFigure) {
      // CORRECT!
      currentScore += 20;
      playFeedbackSound(true);
      updateHUD();

      if (currentScore >= maxScore) {
        triggerVictory();
      } else {
        // Queue next round
        setTimeout(setupNextRound, 500);
      }
    } else {
      // INCORRECT FIGURE SHOT!
      lives--;
      playFeedbackSound(false);
      triggerArenaShake();
      updateHUD();

      if (lives <= 0) {
        triggerDefeat();
      } else {
        // Spawn replacements and queue next round
        spawnBubbles();
        setTimeout(setupNextRound, 500);
      }
    }
  }
}

// Shake screen effect when lives are lost
function triggerArenaShake() {
  arenaContainer.style.transform = 'translate(6px, 6px)';
  setTimeout(() => arenaContainer.style.transform = 'translate(-6px, -6px)', 50);
  setTimeout(() => arenaContainer.style.transform = 'translate(6px, -6px)', 100);
  setTimeout(() => arenaContainer.style.transform = 'translate(-6px, 6px)', 150);
  setTimeout(() => arenaContainer.style.transform = 'translate(0px, 0px)', 200);
}

// Setup Next Round
function setupNextRound() {
  if (!isGameActive) return;

  // Make sure correct figure exists on screen, spawn new ones if needed
  ensurePromptFigureExists();

  // Reset play button visual state
  const btn = document.getElementById("btn-play-prompt");
  btn.classList.remove("playing");
  btn.innerHTML = "🔊";
  
  // Prompt instructions
  document.getElementById("sound-instructions").textContent = "¡Haz clic en el altavoz para escuchar el ritmo!";

  // Autoplay next sound automatically after a brief delay
  setTimeout(playCurrentFigureAudio, 600);
}

// Ensure the target figure exists in the current floating bubble list
function ensurePromptFigureExists() {
  const allowed = LEVEL_FIGURES[currentLevel];
  currentPromptFigure = allowed[Math.floor(Math.random() * allowed.length)];

  const typesPresent = bubbles.map(b => b.type);
  if (!typesPresent.includes(currentPromptFigure)) {
    // Replace one bubble to guarantee it exists
    if (bubbles.length > 0) {
      bubbles[0].type = currentPromptFigure;
      bubbles[0].color = FIGURE_COLORS[currentPromptFigure];
    } else {
      spawnBubbles();
    }
  }
}

// Spawn random bubbles floating across the screen
function spawnBubbles() {
  bubbles = [];
  const allowed = LEVEL_FIGURES[currentLevel];
  const speedRange = LEVEL_SPEEDS[currentLevel];
  const count = speedRange.spawnCount;

  const bubbleRadius = 38;

  for (let i = 0; i < count; i++) {
    // Place randomly, avoiding overlaps or wall lock
    const rx = Math.random() * (canvas.width - bubbleRadius * 2) + bubbleRadius;
    const ry = Math.random() * (canvas.height - bubbleRadius * 2) + bubbleRadius;

    // Speeds
    const speed = Math.random() * (speedRange.max - speedRange.min) + speedRange.min;
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const type = allowed[i % allowed.length];
    bubbles.push(new Bubble(type, rx, ry, bubbleRadius, vx, vy));
  }
}

// Play current prompt audio sound
function playCurrentFigureAudio() {
  if (isAudioPlaying || !isGameActive) return;

  isAudioPlaying = true;
  const btn = document.getElementById("btn-play-prompt");
  btn.classList.add("playing");
  btn.innerHTML = "⚡";
  
  document.getElementById("sound-instructions").textContent = "¡Escuchando...";

  playFigureSound(currentPromptFigure, () => {
    isAudioPlaying = false;
    btn.classList.remove("playing");
    btn.innerHTML = "🔊";
    document.getElementById("sound-instructions").textContent = "¡Encuéntrala y dispárale!";
  });
}

// Start game action
function startGame() {
  isGameActive = true;
  currentScore = 0;
  lives = 3;
  updateHUD();
  spawnBubbles();
  ensurePromptFigureExists();

  // Autoplay the first prompt automatically after a short delay
  setTimeout(playCurrentFigureAudio, 800);
}

// Update DOM HUD values
function updateHUD() {
  document.getElementById("display-level").textContent = currentLevel;
  document.getElementById("display-score").textContent = `${currentScore} / ${maxScore}`;

  // Update hearts
  const heartContainers = document.getElementById("display-lives");
  heartContainers.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const span = document.createElement("span");
    span.className = "heart-icon" + (i >= lives ? " lost" : "");
    span.textContent = i >= lives ? "🖤" : "❤️";
    heartContainers.appendChild(span);
  }
}

// Select level pill action
function selectTiroLevel(levelNum) {
  currentLevel = levelNum;
  
  // Highlight pills
  const pills = document.querySelectorAll(".btn-level-pill");
  pills.forEach((pill, idx) => {
    if (idx + 1 === levelNum) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  restartTiroLevel();
}

// Restart Level
function restartTiroLevel() {
  closeAllModals();
  startGame();
}

// Next level load
function nextTiroLevel() {
  if (currentLevel < 5) {
    selectTiroLevel(currentLevel + 1);
  } else {
    // Already beat all levels
    restartTiroLevel();
  }
}

// Victory trigger
function triggerVictory() {
  isGameActive = false;
  const modal = document.getElementById("modal-victory");
  
  if (currentLevel === 5) {
    document.getElementById("victory-message").innerHTML = `<strong>¡FELICITACIONES!</strong> Has superado el Desafío Supremo de Tiro al Blanco Rítmico de la Escuela Seven Keys. ¡Eres todo un virtuoso del ritmo!`;
    document.getElementById("btn-next-level-modal").style.display = "none";
  } else {
    document.getElementById("victory-message").innerHTML = `¡Eso es! Conseguiste los 100 puntos en el Nivel ${currentLevel} con total precisión. ¡Vayamos por el siguiente reto!`;
    document.getElementById("btn-next-level-modal").style.display = "block";
  }
  
  modal.classList.add("active");
}

// Defeat trigger
function triggerDefeat() {
  isGameActive = false;
  document.getElementById("modal-defeat").classList.add("active");
}

// Modal closing helpers
function closeStartModal() {
  document.getElementById("modal-start").classList.remove("active");
  startGame();
}

function closeAllModals() {
  document.getElementById("modal-start").classList.remove("active");
  document.getElementById("modal-victory").classList.remove("active");
  document.getElementById("modal-defeat").classList.remove("active");
}

// Main Canvas Loop (60 FPS)
function drawLoop() {
  // Clear screen
  ctx.fillStyle = "#080d16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw background starry shooting grid
  ctx.strokeStyle = "rgba(0, 229, 255, 0.02)";
  ctx.lineWidth = 1;
  const gridSpacing = 40;
  for (let x = 0; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Update & Draw Bubbles
  bubbles.forEach(b => {
    b.update();
    b.draw();
  });

  // Update & Draw Laser Beams
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.update();
    l.draw();
    if (l.life <= 0) lasers.splice(i, 1);
  }

  // Update & Draw Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.update();
    s.draw();
    if (s.opacity <= 0) shockwaves.splice(i, 1);
  }

  // Update & Draw Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(drawLoop);
}

// Run the render loop
drawLoop();
