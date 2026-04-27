// ===== Scoreboard Logic =====

function loadStats() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const bank     = parseInt(localStorage.getItem('playerBank') || '1000');

    // Current session = last session that is NOT closed 
    // If it's closed (bankrupt or reset), there is no active session → show 0.
    const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    const isCurrent   = lastSession && !lastSession.closed;

    const curGames  = isCurrent ? (lastSession.games  || 0) : 0;
    const curWins   = isCurrent ? (lastSession.wins   || 0) : 0;
    const curLosses = isCurrent ? (lastSession.losses || 0) : 0;
    const winRate   = curGames > 0 ? Math.round((curWins / curGames) * 100) : 0;

    // Summary cards 
    setText('total-games',   curGames);
    setText('player-wins',   curWins);
    setText('player-losses', curLosses);
    setText('current-bank',  '$' + bank.toLocaleString());

    // Win-rate bar 
    const fill = document.getElementById('win-rate-fill');
    if (fill) fill.style.width = winRate + '%';
    setText('win-percentage', winRate);

    //  Per-difficulty breakdown (current session only) 
    ['easy', 'medium', 'hard'].forEach(key => {
        const w = isCurrent ? parseInt(localStorage.getItem(`cur_wins_${key}`)   || '0') : 0;
        const l = isCurrent ? parseInt(localStorage.getItem(`cur_losses_${key}`) || '0') : 0;
        const t = w + l;
        const r = t > 0 ? Math.round((w / t) * 100) : 0;

        setText(`diff-${key}-wins`,   w);
        setText(`diff-${key}-losses`, l);
        setText(`diff-${key}-rate`,   r + '%');

        const bar = document.getElementById(`diff-${key}-bar`);
        if (bar) bar.style.width = r + '%';
    });

    //  Session history table (all sessions and newest one first) 
    renderHistory(sessions);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderHistory(sessions) {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;

    const rows = [...sessions].reverse().slice(0, 20);

    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:var(--text-secondary);padding:2rem;">
                    No sessions yet — play a game first!
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = rows.map(s => {
        const date    = new Date(s.startDate);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Highest bank: show $1,000 if never exceeded starting amount
        const highest = '$' + Math.max(s.highestBank || 1000, 1000).toLocaleString();

        const statusBadge = s.closed
            ? '<span class="session-badge closed">Ended</span>'
            : '<span class="session-badge active">Active</span>';

        return `
            <tr>
                <td>${dateStr}<br><span class="time-sub">${timeStr}</span> ${statusBadge}</td>
                <td>${s.games  || 0}</td>
                <td class="win-color">${s.wins   || 0}</td>
                <td class="loss-color">${s.losses || 0}</td>
                <td class="highlight-bank">${highest}</td>
            </tr>`;
    }).join('');
}

function resetStats() {
    const confirmed = confirm('Reset current session stats? History table is kept. Bank resets to $1,000.');
    if (!confirmed) return;

    // Close current open session so next game starts fresh
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    if (sessions.length > 0 && !sessions[sessions.length - 1].closed) {
        sessions[sessions.length - 1].closed = true;
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    // Reset bank
    localStorage.setItem('playerBank', '1000');

    // Clear ALL current-session per-difficulty counters
    ['easy', 'medium', 'hard'].forEach(key => {
        localStorage.setItem(`cur_wins_${key}`,   '0');
        localStorage.setItem(`cur_losses_${key}`, '0');
    });

    loadStats();
    showToast('Stats reset! Bank back to $1,000. History kept.');
}

function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#2ecc71;color:white;padding:0.75rem 1.5rem;border-radius:25px;font-weight:600;z-index:9999;box-shadow:0 5px 20px rgba(0,0,0,0.3);';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}

document.addEventListener('DOMContentLoaded', loadStats);