// ===== Betting System =====
let playerBank = 1000;
let currentBet = 0;
let betChips = {};
let gameActive = false;

// ===== Maze Game State =====
let maze = [];
let player = { x: 0, y: 0 };
let exitPos = { x: 0, y: 0 };
let currentDifficulty = null;
let timerInterval = null;
let timeLeft = 0;
let totalTime = 0;
let animationFrameId = null;

// Canvas
let canvas, ctx;
let CELL_SIZE = 20;

// Difficulty settings
const DIFFICULTIES = {
    easy:   { size: 15, time: 40, multiplier: 1.5, name: 'EASY',   color: '#2ecc71' },
    medium: { size: 20, time: 30, multiplier: 2,   name: 'MEDIUM', color: '#f1c40f' },
    hard:   { size: 25, time: 20, multiplier: 3,   name: 'HARD',   color: '#e74c3c' }
};

// ===== Bank Management =====
function updateBankDisplay() {
    document.getElementById('bank-amount').textContent = playerBank;
    document.getElementById('bet-total').textContent = currentBet;
    updateChipAvailability();
    localStorage.setItem('playerBank', playerBank);
}

function updateChipAvailability() {
    const chipValues = [1, 5, 25, 50, 100, 500];
    chipValues.forEach(value => {
        const chipEl = document.getElementById(`chip-${value}`);
        if (chipEl) {
            if (playerBank >= value && !gameActive) {
                chipEl.classList.remove('disabled');
            } else {
                chipEl.classList.add('disabled');
            }
        }
    });
}

function loadBank() {
    const savedBank = localStorage.getItem('playerBank');
    if (savedBank !== null) {
        playerBank = parseInt(savedBank);
        // Bankruptcy protection
        if (playerBank <= 0) {
            playerBank = 1000;
            localStorage.setItem('playerBank', playerBank);
        }
    }
    updateBankDisplay();
}

// ===== Chip Betting =====
function addChipToBet(value) {
    if (gameActive) {
        setMessage('Cannot change bet during an active game!', 'warning');
        return;
    }
    if (playerBank < value) {
        setMessage('Not enough money in your bank!', 'warning');
        return;
    }

    playerBank -= value;
    currentBet += value;

    if (!betChips[value]) betChips[value] = 0;
    betChips[value]++;

    updateBankDisplay();
    renderBetChips();
}

function removeChipFromBet(value) {
    if (gameActive) {
        setMessage('Cannot change bet during an active game!', 'warning');
        return;
    }
    if (!betChips[value] || betChips[value] === 0) return;

    playerBank += value;
    currentBet -= value;
    betChips[value]--;

    if (betChips[value] === 0) delete betChips[value];

    updateBankDisplay();
    renderBetChips();
}

function renderBetChips() {
    const betDisplay = document.getElementById('bet-chips-display');
    if (!betDisplay) return;

    betDisplay.innerHTML = '';
    const chipValues = Object.keys(betChips).map(Number).sort((a, b) => a - b);

    chipValues.forEach(value => {
        const count = betChips[value];
        if (count > 0) {
            const pile = document.createElement('div');
            pile.className = 'bet-chip-pile';
            pile.onclick = () => removeChipFromBet(value);
            pile.title = 'Click to remove';

            const chip = document.createElement('div');
            chip.className = `bet-chip chip chip-${value}`;
            chip.innerHTML = `<span>$${value}</span>`;
            pile.appendChild(chip);

            if (count > 1) {
                const countBadge = document.createElement('div');
                countBadge.className = 'chip-count';
                countBadge.textContent = count;
                pile.appendChild(countBadge);
            }

            betDisplay.appendChild(pile);
        }
    });
}

function clearAllBets() {
    if (gameActive) {
        setMessage('Cannot change bet during an active game!', 'warning');
        return;
    }

    Object.keys(betChips).forEach(value => {
        playerBank += parseInt(value) * betChips[value];
    });

    currentBet = 0;
    betChips = {};
    updateBankDisplay();
    renderBetChips();
}

function allIn() {
    if (gameActive) {
        setMessage('Cannot change bet during an active game!', 'warning');
        return;
    }
    if (playerBank === 0 && currentBet === 0) {
        setMessage('You have no money left!', 'warning');
        return;
    }

    clearAllBets();

    const chipValues = [500, 100, 50, 25, 5, 1];
    let remaining = playerBank;

    chipValues.forEach(value => {
        while (remaining >= value) {
            remaining -= value;
            currentBet += value;
            if (!betChips[value]) betChips[value] = 0;
            betChips[value]++;
        }
    });

    playerBank = 0;
    updateBankDisplay();
    renderBetChips();
}

// ===== Maze Generation =====
// Step 1: Recursive backtracker (perfect maze — one solution, all dead ends)
// Step 2: Braiding — remove a % of dead-end walls to punch extra loops through,
//         creating multiple plausible routes so the path is never "obvious at a glance".
//         Braid rate scales per difficulty: easy=0.38, medium=0.26, hard=0.15
function generateMaze(size) {
    // Braid rate by difficulty name
    const braidRate = { EASY: 0.38, MEDIUM: 0.26, HARD: 0.15 };
    const braid = braidRate[currentDifficulty ? currentDifficulty.name : 'MEDIUM'] ?? 0.26;

    // --- Build grid ---
    maze = Array(size).fill().map(() =>
        Array(size).fill().map(() => ({
            walls: { top: true, right: true, bottom: true, left: true },
            visited: false
        }))
    );

    // --- Step 1: Recursive backtracker ---
    const stack = [];
    let current = { x: 0, y: 0 };
    maze[0][0].visited = true;

    while (true) {
        const neighbors = [];
        if (current.x > 0        && !maze[current.y][current.x - 1].visited) neighbors.push('left');
        if (current.x < size - 1 && !maze[current.y][current.x + 1].visited) neighbors.push('right');
        if (current.y > 0        && !maze[current.y - 1][current.x].visited) neighbors.push('top');
        if (current.y < size - 1 && !maze[current.y + 1][current.x].visited) neighbors.push('bottom');

        if (neighbors.length > 0) {
            const dir = neighbors[Math.floor(Math.random() * neighbors.length)];
            const next = { x: current.x, y: current.y };
            switch (dir) {
                case 'left':
                    maze[current.y][current.x].walls.left = false;
                    maze[current.y][current.x - 1].walls.right = false;
                    next.x--;
                    break;
                case 'right':
                    maze[current.y][current.x].walls.right = false;
                    maze[current.y][current.x + 1].walls.left = false;
                    next.x++;
                    break;
                case 'top':
                    maze[current.y][current.x].walls.top = false;
                    maze[current.y - 1][current.x].walls.bottom = false;
                    next.y--;
                    break;
                case 'bottom':
                    maze[current.y][current.x].walls.bottom = false;
                    maze[current.y + 1][current.x].walls.top = false;
                    next.y++;
                    break;
            }
            maze[next.y][next.x].visited = true;
            stack.push(current);
            current = next;
        } else if (stack.length > 0) {
            current = stack.pop();
        } else {
            break;
        }
    }

    // --- Step 2: Braiding — knock down walls of dead-end cells ---
    // A dead end is a cell with exactly 3 walls still up (only one opening).
    // For each dead end, we randomly remove one of its remaining closed walls
    // (that leads to a valid neighbour), creating a loop.  We only do this
    // with probability `braid` so the maze keeps some dead ends for flavour.
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const w = maze[y][x].walls;
            const wallCount = [w.top, w.right, w.bottom, w.left].filter(Boolean).length;

            // Dead end = 3 walls up
            if (wallCount === 3 && Math.random() < braid) {
                // Collect the closed walls that have a valid neighbour
                const candidates = [];
                if (w.top    && y > 0)        candidates.push('top');
                if (w.right  && x < size - 1) candidates.push('right');
                if (w.bottom && y < size - 1) candidates.push('bottom');
                if (w.left   && x > 0)        candidates.push('left');

                if (candidates.length === 0) continue;

                const pick = candidates[Math.floor(Math.random() * candidates.length)];
                switch (pick) {
                    case 'top':
                        maze[y][x].walls.top = false;
                        maze[y - 1][x].walls.bottom = false;
                        break;
                    case 'right':
                        maze[y][x].walls.right = false;
                        maze[y][x + 1].walls.left = false;
                        break;
                    case 'bottom':
                        maze[y][x].walls.bottom = false;
                        maze[y + 1][x].walls.top = false;
                        break;
                    case 'left':
                        maze[y][x].walls.left = false;
                        maze[y][x - 1].walls.right = false;
                        break;
                }
            }
        }
    }

    // --- Place exit — enforce minimum Manhattan distance from start (0,0) ---
    // Ratio of max possible distance (size-1)*2 that the exit must be at least.
    // Easy: 60%  Medium: 70%  Hard: 80%  — so the exit is always meaningfully far.
    const minDistRatio = { EASY: 0.60, MEDIUM: 0.70, HARD: 0.80 };
    const ratio = minDistRatio[currentDifficulty ? currentDifficulty.name : 'MEDIUM'] ?? 0.70;
    const minDist = Math.floor((size - 1) * 2 * ratio);

    let side, exitX, exitY, attempts = 0;
    do {
        side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: exitX = Math.floor(Math.random() * size); exitY = 0;          break; // top
            case 1: exitX = size - 1; exitY = Math.floor(Math.random() * size);   break; // right
            case 2: exitX = Math.floor(Math.random() * size); exitY = size - 1;   break; // bottom
            case 3: exitX = 0;        exitY = Math.floor(Math.random() * size);   break; // left
        }
        attempts++;
        // Relax constraint after many attempts to guarantee placement
        const threshold = attempts > 50 ? Math.floor(minDist * 0.6) : minDist;
        if (exitX + exitY >= threshold) break;
    } while (true);

    exitPos = { x: exitX, y: exitY };

    switch (side) {
        case 0: maze[exitY][exitX].walls.top    = false; break;
        case 1: maze[exitY][exitX].walls.right  = false; break;
        case 2: maze[exitY][exitX].walls.bottom = false; break;
        case 3: maze[exitY][exitX].walls.left   = false; break;
    }
}

// ===== Canvas Rendering =====
function fitCellSize(size) {
    // Fit the maze into the available container width
    const container = document.querySelector('.maze-container');
    const maxPx = container ? Math.min(container.clientWidth - 20, window.innerHeight * 0.5) : 400;
    CELL_SIZE = Math.max(12, Math.floor(maxPx / size));
}

function renderMaze() {
    if (!canvas || !ctx) return;

    const size = currentDifficulty.size;
    const totalPx = CELL_SIZE * size;

    canvas.width  = totalPx;
    canvas.height = totalPx;

    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, totalPx, totalPx);

    // Draw cells
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;

            // Exit cell highlight
            if (x === exitPos.x && y === exitPos.y) {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

                // Door emoji
                ctx.font = `${Math.floor(CELL_SIZE * 0.75)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🚪', px + CELL_SIZE / 2, py + CELL_SIZE / 2);
            }

            // Walls
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.lineCap = 'square';

            const walls = maze[y][x].walls;

            if (walls.top) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + CELL_SIZE, py);
                ctx.stroke();
            }
            if (walls.right) {
                ctx.beginPath();
                ctx.moveTo(px + CELL_SIZE, py);
                ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
                ctx.stroke();
            }
            if (walls.bottom) {
                ctx.beginPath();
                ctx.moveTo(px, py + CELL_SIZE);
                ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
                ctx.stroke();
            }
            if (walls.left) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, py + CELL_SIZE);
                ctx.stroke();
            }
        }
    }

    // Draw player
    drawPlayer();
}

function drawPlayer() {
    if (!ctx) return;

    const px = player.x * CELL_SIZE;
    const py = player.y * CELL_SIZE;
    const radius = CELL_SIZE * 0.35;
    const cx = px + CELL_SIZE / 2;
    const cy = py + CELL_SIZE / 2;

    // Glow
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 10;

    // Circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    grad.addColorStop(0, '#5dfa8a');
    grad.addColorStop(1, '#27ae60');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;
}

// Redraw only the player area (performance optimisation)
function updatePlayerOnCanvas() {
    if (!ctx || !canvas) return;

    // Instead of full redraw we do a full render — maze is not huge, acceptable
    renderMaze();
}

// ===== Timer =====
function updateTimerBar() {
    const bar = document.getElementById('timer-bar');
    const timeDisplay = document.getElementById('time-display');
    if (!bar || !timeDisplay) return;

    const pct = (timeLeft / totalTime) * 100;
    bar.style.width = pct + '%';
    timeDisplay.textContent = `${timeLeft}s`;

    bar.classList.remove('warning', 'danger');
    if (timeLeft <= 5)       bar.classList.add('danger');
    else if (timeLeft <= 10) bar.classList.add('warning');
}

// ===== Game Flow =====
function startMaze() {
    if (gameActive) return;

    if (currentBet === 0) {
        setMessage('⚠️ Please place a bet before starting!', 'warning');
        return;
    }

    // Pick random difficulty
    const keys = Object.keys(DIFFICULTIES);
    const key  = keys[Math.floor(Math.random() * keys.length)];
    currentDifficulty = DIFFICULTIES[key];

    // Update info bar
    const diffDisplay = document.getElementById('difficulty-display');
    const multDisplay = document.getElementById('multiplier-display');
    if (diffDisplay) {
        diffDisplay.textContent = currentDifficulty.name;
        diffDisplay.className = `info-value ${key}`;
    }
    if (multDisplay) {
        multDisplay.textContent = `${currentDifficulty.multiplier}x`;
    }

    // Reset player
    player = { x: 0, y: 0 };

    // Generate maze
    fitCellSize(currentDifficulty.size);
    generateMaze(currentDifficulty.size);
    renderMaze();

    // Start timer
    timeLeft  = currentDifficulty.time;
    totalTime = currentDifficulty.time;
    updateTimerBar();

    gameActive = true;
    updateChipAvailability();

    // Update start button → Give Up
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.textContent = '🏳️ Give Up';
        startBtn.onclick = giveUp;
        startBtn.className = 'btn btn-danger';
    }

    setMessage(`🎲 Difficulty: ${currentDifficulty.name} — Escape in ${currentDifficulty.time}s for ${currentDifficulty.multiplier}x!`);

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerBar();

        if (timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

function giveUp() {
    if (!gameActive) return;
    endGame(false);
}

function endGame(won) {
    clearInterval(timerInterval);
    gameActive = false;
    updateChipAvailability();

    // Reset start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.textContent = '🗺️ Start Maze';
        startBtn.onclick = startMaze;
        startBtn.className = 'btn btn-primary';
    }

    if (won) {
        const winnings = Math.floor(currentBet * currentDifficulty.multiplier);
        playerBank += winnings;
        const profit = winnings - currentBet;
        setMessage(`🎉 You escaped! Bet $${currentBet} → Won $${winnings} (profit: +$${profit})`, 'win');

        // Confetti burst
        triggerConfetti();
    } else {
        const lost = currentBet;
        setMessage(`⏰ ${timeLeft <= 0 ? "Time's up" : 'You gave up'}! Lost $${lost}. Better luck next time.`, 'lose');

        // Bankruptcy protection
        if (playerBank <= 0) {
            playerBank = 1000;
            // NOTE: session is closed AFTER saveGameResult() below so the
            // final loss gets recorded in the current session, not a new one.
            // We set a flag here and act on it after saving.
            window._bankruptThisGame = true;
        }
    }

    // Save result BEFORE clearing the bet so the amount is captured correctly
    saveGameResult(won);

    // Now close the session if bankruptcy occurred — after the loss is recorded
    if (window._bankruptThisGame) {
        window._bankruptThisGame = false;
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        if (sessions.length > 0) { sessions[sessions.length - 1].closed = true; }
        localStorage.setItem('sessions', JSON.stringify(sessions));
        // Clear current-session per-difficulty counters
        ['easy', 'medium', 'hard'].forEach(k => {
            localStorage.setItem('cur_wins_'   + k, '0');
            localStorage.setItem('cur_losses_' + k, '0');
        });
        localStorage.setItem('playerBank', playerBank);
        setTimeout(() => showPopup('You went bankrupt! Bank reset to $1,000.', 'bankrupt', true), 1600);
    }

    currentBet = 0;
    betChips   = {};
    renderBetChips();
    updateBankDisplay();
    localStorage.setItem('playerBank', playerBank);
}

function saveGameResult(won) {
    // Update flat counters used by scoreboard summary cards
    const wins   = parseInt(localStorage.getItem('wins')   || '0');
    const losses = parseInt(localStorage.getItem('losses') || '0');
    if (won) localStorage.setItem('wins',   wins + 1);
    else     localStorage.setItem('losses', losses + 1);

    // Update current session — a session runs from first game (or last reset) until reset.
    // Each session: { startDate, games, wins, losses, highestBank, closed }
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    let current = sessions.length > 0 ? sessions[sessions.length - 1] : null;

    if (!current || current.closed) {
        current = { startDate: new Date().toISOString(), games: 0, wins: 0, losses: 0, highestBank: 1000, closed: false };
        sessions.push(current);
        // New session started — wipe per-difficulty counters BEFORE incrementing below
        ['easy', 'medium', 'hard'].forEach(k => {
            localStorage.setItem('cur_wins_'   + k, '0');
            localStorage.setItem('cur_losses_' + k, '0');
        });
    }

    // Per-difficulty counters — MUST come after the new-session block so the
    // clear above doesn't wipe the increment we're about to write
    const diffKey = (currentDifficulty ? currentDifficulty.name : 'EASY').toLowerCase();
    const dw = parseInt(localStorage.getItem('cur_wins_'   + diffKey) || '0');
    const dl = parseInt(localStorage.getItem('cur_losses_' + diffKey) || '0');
    if (won) localStorage.setItem('cur_wins_'   + diffKey, dw + 1);
    else     localStorage.setItem('cur_losses_' + diffKey, dl + 1);

    current.games++;
    if (won) current.wins++;
    else current.losses++;
    // Only update highest if it exceeds the current recorded highest
    // Minimum is always 1000 (the starting bank) — never track below that
    if (playerBank > current.highestBank) current.highestBank = playerBank;

    localStorage.setItem('sessions', JSON.stringify(sessions));
}

// ===== Player Movement =====
function movePlayer(direction) {
    if (!gameActive) return;

    const walls = maze[player.y][player.x].walls;
    const size  = currentDifficulty.size;

    switch (direction) {
        case 'up':
            if (!walls.top    && player.y > 0)        player.y--;
            break;
        case 'down':
            if (!walls.bottom && player.y < size - 1) player.y++;
            break;
        case 'left':
            if (!walls.left   && player.x > 0)        player.x--;
            break;
        case 'right':
            if (!walls.right  && player.x < size - 1) player.x++;
            break;
    }

    updatePlayerOnCanvas();

    // Check win
    if (player.x === exitPos.x && player.y === exitPos.y) {
        endGame(true);
    }
}

// ===== Popup Message System =====
let popupTimeout = null;

function showPopup(text, type = '', persistent = false) {
    const existing = document.getElementById('result-popup');
    if (existing) existing.remove();
    clearTimeout(popupTimeout);

    const emojis = { win: '🎉', lose: '💀', warning: '⚠️', bankrupt: '💸' };
    const emoji  = emojis[type] || '';

    const overlay = document.createElement('div');
    overlay.id = 'result-popup';
    overlay.className = `popup-overlay popup-${type}`;
    overlay.innerHTML = `
        <div class="popup-box">
            ${emoji ? `<div class="popup-emoji">${emoji}</div>` : ''}
            <div class="popup-text">${text}</div>
            <button class="popup-close btn ${type === 'win' ? 'btn-success' : type === 'lose' ? 'btn-danger' : 'btn-secondary'}" onclick="closePopup()">OK</button>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('popup-visible'));

    if (!persistent) {
        popupTimeout = setTimeout(() => closePopup(), 4000);
    }
}

function closePopup() {
    clearTimeout(popupTimeout);
    const popup = document.getElementById('result-popup');
    if (!popup) return;
    popup.classList.remove('popup-visible');
    popup.classList.add('popup-hiding');
    setTimeout(() => popup.remove(), 300);
}

function setMessage(text, type = '') {
    if (type === 'win' || type === 'lose' || type === 'warning' || type === 'bankrupt') {
        showPopup(text, type, type === 'win' || type === 'lose');
    }
}

// ===== Confetti =====
function triggerConfetti() {
    const canvas2 = document.createElement('canvas');
    canvas2.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(canvas2);
    const c = canvas2.getContext('2d');
    canvas2.width  = window.innerWidth;
    canvas2.height = window.innerHeight;

    const pieces = Array.from({ length: 120 }, () => ({
        x:   Math.random() * canvas2.width,
        y:   Math.random() * -canvas2.height,
        w:   6 + Math.random() * 10,
        h:   10 + Math.random() * 14,
        color: ['#ffd700','#2ecc71','#667eea','#e74c3c','#f39c12'][Math.floor(Math.random() * 5)],
        rot:  Math.random() * 360,
        vx:  (Math.random() - 0.5) * 4,
        vy:  2 + Math.random() * 4,
        vr:  (Math.random() - 0.5) * 6
    }));

    let frame = 0;
    function animate() {
        c.clearRect(0, 0, canvas2.width, canvas2.height);
        pieces.forEach(p => {
            p.x  += p.vx;
            p.y  += p.vy;
            p.rot += p.vr;
            c.save();
            c.translate(p.x + p.w / 2, p.y + p.h / 2);
            c.rotate(p.rot * Math.PI / 180);
            c.fillStyle = p.color;
            c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            c.restore();
        });
        frame++;
        if (frame < 120) requestAnimationFrame(animate);
        else canvas2.remove();
    }
    animate();
}

// ===== Keyboard Controls =====
document.addEventListener('keydown', e => {
    const map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right'
    };
    if (map[e.key]) {
        e.preventDefault();
        movePlayer(map[e.key]);

        // Visual feedback on control buttons
        const btnMap = { up: 'up', down: 'down', left: 'left', right: 'right' };
        const dir = map[e.key];
        document.querySelectorAll('.control-btn').forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(`'${dir}'`)) {
                btn.style.transform = 'translateY(-7px) scale(0.92)';
                setTimeout(() => btn.style.transform = '', 150);
            }
        });
    }
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('maze-canvas');
    ctx    = canvas ? canvas.getContext('2d') : null;

    loadBank();
    renderBetChips();

    // Draw a placeholder on the canvas
    if (canvas && ctx) {
        canvas.width  = 300;
        canvas.height = 300;
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(0, 0, 300, 300);
        ctx.font = '18px Segoe UI, sans-serif';
        ctx.fillStyle = '#95a5a6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Place a bet & click Start Maze!', 150, 150);
    }

    // Wire start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = startMaze;
});