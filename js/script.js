/* ==============================================
   MINDBLOOM — script.js
   A living word garden game
============================================== */

// ── STATE ──
let mode = 1;
let currentPlayer = 1;
let scores = [0, 0];
let usedWords = new Set();
let flowerCount = 0;
let lastFlower = null;
let soundEnabled = true;

// ── DOM ──
const garden       = document.getElementById('garden');
const gardenEmpty  = document.getElementById('garden-empty');
const wordInput    = document.getElementById('word-input');
const charCount    = document.getElementById('char-count');
const msgBar       = document.getElementById('msg-bar');
const turnBanner   = document.getElementById('turn-banner');
const turnInner    = document.getElementById('turn-inner');
const turnDot      = document.getElementById('turn-dot');
const turnText     = document.getElementById('turn-text');
const numP1        = document.getElementById('num-p1');
const numP2        = document.getElementById('num-p2');
const numFlowers   = document.getElementById('num-flowers');
const scoreP2      = document.getElementById('score-p2');
const numP2El      = document.getElementById('num-p2');
const winnerOverlay= document.getElementById('winner-overlay');
const winnerEmoji  = document.getElementById('winner-emoji');
const winnerTitle  = document.getElementById('winner-title');
const winnerSub    = document.getElementById('winner-sub');
const modalOverlay = document.getElementById('modal-overlay');
const soundBtn     = document.getElementById('sound-btn');

// ── FLOWER COLORS ──
const PALETTES = [
  { petals: '#FF6B9D', shadow: '#C2185B', center: '#880E4F' },
  { petals: '#FF9A3C', shadow: '#E65100', center: '#BF360C' },
  { petals: '#FFE14D', shadow: '#F9A825', center: '#E65100' },
  { petals: '#A78BFA', shadow: '#5B21B6', center: '#3730A3' },
  { petals: '#38BDF8', shadow: '#0369A1', center: '#01579B' },
  { petals: '#4ADE80', shadow: '#15803D', center: '#064E3B' },
  { petals: '#FB7185', shadow: '#BE123C', center: '#881337' },
  { petals: '#F472B6', shadow: '#9D174D', center: '#701A75' },
  { petals: '#34D399', shadow: '#065F46', center: '#022C22' },
  { petals: '#FCD34D', shadow: '#D97706', center: '#92400E' },
  { petals: '#60A5FA', shadow: '#1D4ED8', center: '#1E3A8A' },
  { petals: '#F87171', shadow: '#B91C1C', center: '#7F1D1D' },
];

const P2_PALETTES = [
  { petals: '#F472B6', shadow: '#9D174D', center: '#701A75' },
  { petals: '#FB7185', shadow: '#BE123C', center: '#881337' },
  { petals: '#E879F9', shadow: '#7E22CE', center: '#581C87' },
  { petals: '#F9A8D4', shadow: '#BE185D', center: '#9D174D' },
];

// ── SCORING ──
function wordScore(word) {
  const l = word.length;
  if (l <= 3) return 1;
  if (l <= 5) return 2;
  if (l <= 7) return 3;
  if (l <= 10) return 4;
  return 5;
}

function flowerDims(word) {
  const l = word.length;
  if (l <= 3)  return { stemH: 44, headR: 14, petals: 5 };
  if (l <= 5)  return { stemH: 60, headR: 18, petals: 6 };
  if (l <= 7)  return { stemH: 76, headR: 23, petals: 7 };
  if (l <= 10) return { stemH: 92, headR: 28, petals: 8 };
  return              { stemH: 112, headR: 35, petals: 10 };
}

// ── MAKE FLOWER SVG ──
function makeFlowerSVG(word, palette, dims) {
  const { headR, petals } = dims;
  const size = headR * 2 + headR * 1.6 + 4;
  const cx = size / 2;
  const cy = size / 2;
  const petalR = headR * 0.62;
  const orbitR = headR * 0.72;
  const score = wordScore(word);
  const pts = ['1pt', '2pts', '3pts', '4pts', '5pts'][score - 1];

  let petalSVG = '';
  for (let i = 0; i < petals; i++) {
    const angle = (360 / petals) * i - 90;
    const rad = angle * Math.PI / 180;
    const px = cx + Math.cos(rad) * orbitR;
    const py = cy + Math.sin(rad) * orbitR;
    petalSVG += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${petalR.toFixed(1)}" ry="${(petalR * 0.68).toFixed(1)}" fill="${palette.petals}" opacity="0.93" transform="rotate(${angle + 90}, ${px.toFixed(1)}, ${py.toFixed(1)})" />`;
  }

  const centerR = headR * 0.45;
  const fontSize = Math.max(7, Math.round(centerR * 0.7));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size)}" height="${Math.round(size)}" viewBox="0 0 ${size.toFixed(1)} ${size.toFixed(1)}">
    ${petalSVG}
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${centerR.toFixed(1)}" fill="${palette.center}" />
    <circle cx="${cx.toFixed(1)}" cy="${(cy - centerR * 0.25).toFixed(1)}" r="${(centerR * 0.55).toFixed(1)}" fill="${palette.shadow}" opacity="0.4" />
    <text x="${cx.toFixed(1)}" y="${(cy + fontSize * 0.38).toFixed(1)}" text-anchor="middle" fill="white" font-family="Fredoka One, cursive" font-size="${fontSize}" font-weight="700">${pts}</text>
  </svg>`;
}

// ── PLANT WORD ──
function plantWord() {
  const raw = wordInput.value.trim();
  const clean = raw.toLowerCase().replace(/[^a-z]/g, '');

  if (!clean) { showMsg('Type a word first! 🌱', '#e53935'); return; }
  if (clean.length < 2) { showMsg('Word must be at least 2 letters! ✏️', '#e53935'); return; }
  if (usedWords.has(clean)) { showMsg(`"${raw}" is already in your garden! Try another word 🌸`, '#FF9800'); return; }
  if (flowerCount >= 24) { showMsg('Garden is full! Clear it to grow more flowers 🌻', '#FF9800'); return; }

  usedWords.add(clean);
  flowerCount++;
  gardenEmpty.style.display = 'none';

  const score = wordScore(clean);
  const dims = flowerDims(clean);
  const pool = mode === 2 && currentPlayer === 2 ? P2_PALETTES : PALETTES;
  const palette = pool[Math.floor(Math.random() * pool.length)];
  const swayDur = (2.5 + Math.random() * 2).toFixed(1);
  const swayDelay = (Math.random() * 2).toFixed(1);
  const stemW = Math.max(4, Math.round(dims.headR * 0.18));
  const svgHead = makeFlowerSVG(clean, palette, dims);
  const displayWord = raw.length > 10 ? raw.slice(0, 9) + '…' : raw;

  const f = document.createElement('div');
  f.className = 'flower';
  f.style.setProperty('--sway', swayDur + 's');
  f.style.setProperty('--sway-delay', swayDelay + 's');
  f.dataset.word = clean;
  f.dataset.player = currentPlayer;
  f.title = `"${raw}" — ${score} pt${score > 1 ? 's' : ''}`;

  f.innerHTML = `
    <div class="flower-pts">${score}pt${score > 1 ? 's' : ''}</div>
    <div class="flower-head">${svgHead}</div>
    <div class="flower-stem" style="width:${stemW}px;height:${dims.stemH}px;"></div>
    <div class="flower-word">${displayWord}</div>
  `;

  garden.appendChild(f);
  lastFlower = f;

  scores[currentPlayer - 1] += score;
  updateScores();
  spawnParticles(score);
  playSound(score);

  const p1Msgs = ['Beautiful! 🌸', 'Wonderful! 🌺', 'It bloomed! 🌼', 'Gorgeous! 💐', 'Lovely! 🌻'];
  const bigMsgs = ['Incredible word! 🌟', 'Epic bloom! 🌟', `${score} points! Amazing!`, 'That\'s a big one! 🌟'];
  const pick = score >= 4 ? bigMsgs : p1Msgs;
  const suffix = mode === 2 ? ` +${score} for Player ${currentPlayer}!` : ` +${score}pts!`;
  showMsg(pick[Math.floor(Math.random() * pick.length)] + suffix, '#2E7D32');

  if (mode === 2) {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnBanner();
    if (flowerCount >= 20) showWinner();
  }

  wordInput.value = '';
  charCount.textContent = '0';
  wordInput.focus();
}

// ── SOUNDS (Web Audio API) ──
function playSound(score) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = [261, 294, 329, 392, 523];
    const freq = freqs[Math.min(score - 1, freqs.length - 1)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

// ── PARTICLES ──
function spawnParticles(score) {
  const emojis = ['🌸', '✨', '⭐', '🌺', '💫', '🌼', '🎉'];
  const count = score + 1;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = (30 + Math.random() * 40) + '%';
    el.style.top = (40 + Math.random() * 20) + '%';
    el.style.animationDelay = (i * 0.08) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

// ── MSG ──
let msgTimer;
function showMsg(text, color) {
  msgBar.textContent = text;
  msgBar.style.color = color;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => {
    msgBar.textContent = '';
  }, 3200);
}

// ── SCORES ──
function updateScores() {
  const prev1 = parseInt(numP1.textContent) || 0;
  const prev2 = parseInt(numP2.textContent) || 0;
  numP1.textContent = scores[0];
  numP2.textContent = scores[1];
  numFlowers.textContent = flowerCount;
  if (scores[0] !== prev1) bumpEl(numP1);
  if (scores[1] !== prev2) bumpEl(numP2);
}

function bumpEl(el) {
  el.classList.remove('score-bump');
  void el.offsetWidth;
  el.classList.add('score-bump');
}

// ── MODE ──
function setMode(m) {
  mode = m;
  currentPlayer = 1;
  scores = [0, 0];
  usedWords.clear();
  flowerCount = 0;
  lastFlower = null;

  document.getElementById('btn-solo').classList.toggle('active', m === 1);
  document.getElementById('btn-two').classList.toggle('active', m === 2);

  scoreP2.classList.toggle('hidden', m === 1);
  numP1.classList.toggle('p2', false);

  if (m === 2) {
    turnBanner.classList.add('visible');
    document.querySelector('.score-card:first-child .score-label').textContent = '🌿 Player 1';
    updateTurnBanner();
  } else {
    turnBanner.classList.remove('visible');
    document.querySelector('.score-card:first-child .score-label').textContent = '🌿 My Garden';
  }

  updateScores();
  garden.innerHTML = '';
  garden.appendChild(gardenEmpty);
  gardenEmpty.style.display = 'block';
  showMsg(m === 1 ? 'Solo mode — grow your dream garden! 🌿' : '2-Player mode — take turns and compete! 🏆', '#2E7D32');
  wordInput.focus();
}

// ── TURN BANNER ──
function updateTurnBanner() {
  const isP2 = currentPlayer === 2;
  turnText.textContent = isP2 ? "Player 2's turn" : "Player 1's turn";
  turnDot.style.background = isP2 ? '#E91E8C' : '#4CAF50';
  turnInner.style.borderColor = isP2 ? '#E91E8C' : '#4CAF50';
  turnInner.style.color = isP2 ? '#E91E8C' : '#2E7D32';
}

// ── WINNER ──
function showWinner() {
  setTimeout(() => {
    let emoji, title, sub;
    if (scores[0] > scores[1]) {
      emoji = '🏆'; title = 'Player 1 Wins!';
      sub = `${scores[0]} vs ${scores[1]} points — Beautiful garden!`;
    } else if (scores[1] > scores[0]) {
      emoji = '🌸'; title = 'Player 2 Wins!';
      sub = `${scores[1]} vs ${scores[0]} points — Stunning blooms!`;
    } else {
      emoji = '🤝'; title = "It's a Tie!";
      sub = `${scores[0]} points each — Both gardens are gorgeous!`;
    }
    winnerEmoji.textContent = emoji;
    winnerTitle.textContent = title;
    winnerSub.textContent = sub;
    winnerOverlay.classList.add('visible');
  }, 400);
}

function resetGame() {
  winnerOverlay.classList.remove('visible');
  setMode(mode);
}

// ── CLEAR ──
function clearGarden() {
  if (flowerCount === 0) { showMsg('Garden is already empty! 🌱', '#888'); return; }
  if (!confirm('Clear your garden and start fresh? 🌱')) return;
  scores = [0, 0];
  usedWords.clear();
  flowerCount = 0;
  lastFlower = null;
  currentPlayer = 1;
  garden.innerHTML = '';
  garden.appendChild(gardenEmpty);
  gardenEmpty.style.display = 'block';
  updateScores();
  if (mode === 2) updateTurnBanner();
  showMsg('Garden cleared! Grow new flowers! 🌱', '#4CAF50');
}

// ── UNDO ──
function undoLast() {
  if (!lastFlower) { showMsg('Nothing to undo! 🌱', '#888'); return; }
  const word = lastFlower.dataset.word;
  const player = parseInt(lastFlower.dataset.player);
  const sc = wordScore(word);
  scores[player - 1] = Math.max(0, scores[player - 1] - sc);
  usedWords.delete(word);
  flowerCount--;
  lastFlower.style.animation = 'none';
  lastFlower.style.transform = 'scaleY(0)';
  lastFlower.style.opacity = '0';
  lastFlower.style.transition = 'all 0.3s ease';
  setTimeout(() => { lastFlower.remove(); lastFlower = null; }, 300);
  if (flowerCount === 0) gardenEmpty.style.display = 'block';
  updateScores();
  if (mode === 2) {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnBanner();
  }
  showMsg('Last flower removed! 🌱', '#FF9800');
}

// ── SHARE ──
function shareGarden() {
  const total = scores[0] + scores[1];
  const text = mode === 1
    ? `I grew ${flowerCount} flowers and scored ${scores[0]} points in MindBloom! 🌸 Can you beat me? Try it: https://david-del-pix.github.io/mindbloom/`
    : `Player 1: ${scores[0]}pts vs Player 2: ${scores[1]}pts — ${flowerCount} flowers grown in MindBloom! 🌺 https://david-del-pix.github.io/mindbloom/`;

  if (navigator.share) {
    navigator.share({ title: 'MindBloom 🌸', text, url: 'https://david-del-pix.github.io/mindbloom/' })
      .catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => showMsg('Score copied to clipboard! Share it! 🔗', '#2E7D32'))
    .catch(() => showMsg('Could not copy — share manually!', '#e53935'));
}

// ── INPUT EVENTS ──
wordInput.addEventListener('input', () => {
  charCount.textContent = wordInput.value.length;
});

wordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') plantWord();
});

// ── SOUND TOGGLE ──
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '♪' : '♪̶';
  soundBtn.title = soundEnabled ? 'Mute sound' : 'Enable sound';
  showMsg(soundEnabled ? 'Sound on! 🎵' : 'Sound off 🔇', '#888');
});

// ── HOW TO PLAY ──
document.getElementById('howto-btn').addEventListener('click', () => {
  modalOverlay.classList.add('visible');
});

document.getElementById('modal-close').addEventListener('click', () => {
  modalOverlay.classList.remove('visible');
});

document.getElementById('play-now-btn').addEventListener('click', () => {
  modalOverlay.classList.remove('visible');
  wordInput.focus();
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove('visible');
});

// ── SKY CANVAS (clouds + sun) ──
function drawSky() {
  const canvas = document.getElementById('sky-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  function drawCloud(x, y, scale) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
    ctx.arc(x + 22 * scale, y - 8 * scale, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 46 * scale, y, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSun(x, y) {
    const r = 22;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawSun(canvas.width - 50, 36);
  drawCloud(30, 30, 1);
  drawCloud(canvas.width * 0.4, 20, 0.8);
  drawCloud(canvas.width * 0.65, 38, 0.65);
}

// ── INIT ──
window.addEventListener('load', () => {
  drawSky();
  setTimeout(() => {
    modalOverlay.classList.add('visible');
  }, 400);
});

window.addEventListener('resize', drawSky);