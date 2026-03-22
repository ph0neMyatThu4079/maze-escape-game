// ===== Betting System =====
let playerBank = 1000;
let currentBet = 0;
let betChips = {};
let gameActive = false;

// Difficulty settings
const DIFFICULTIES = {
    easy : {size: 15, time: 40, multiplier: 1.5, name: 'EASY', color: '#2ecc71'},
    medium : {size: 20, time: 30, multiplier: 2, name: 'MEDIUM', color: '#f1c40f'},
    hard : {size: 25, time: 20, multiplier: 3, name: 'HARD', color: '#e74c3c'}
}


//== Bank Management =====
function updateBankDisplay() {
    document.getElementById('bank-amount').textContent = playerBank;
    document.getElementById('bet-total').textContent = currentBet;
    updateChipAvailability();
    localStorage.setItem('playerBank', playerBank);
    
}

function updateChipAvailability(){
    const chipValues = [1, 5, 25, 50, 100, 500];
    chipValues.forEach(value => {
        const chipEl = document.getElementById(`chip-${value}`);
        if(chipEl){
            if(playerBank >= value && !gameActive) {
                chipEl.classList.remove('disabled');
            } else {
                chipEl.classList.add('disabled');
            }
        }
    })
}

function loadBank(){
    const savedBank = localStorage.getItem('playerBank');
    if(savedBank !== null) {
        playerBank = parseInt(savedBank);
    }
    updateBankDisplay();
    renderDisplay();
}

// Chip Betting
function addChipToBet(value) {
    if(gameActive){
        alert('Cannot change bet during an active game!');
        return;
    }

    if(playerBank < value){
        alert('Not enough money in your bank!');
        return;
    }

    const chipEl = document.getElementById(`chip-${value}`);
    if(chipEl){
        chipEl.classList.add('chip-animating');
        setTimeout(() => {
            chipEl.classList.remove('chip-animating');
        }, 500);
    }

    playerBank -= value;
    currentBet += value;

    if(!betChips[value]){
        betChips[value] = 0;
    }

    betChips[value]++;

    updateBankDisplay();
    renderBetChips()
}

// Chip Betting
function removeChipFromBet(value) {
    if (gameActive) {
        alert('Cannot change bet during an active game!');
        return;
    }

    if (!betChips[value] || betChips[value] === 0) {
        return;
    }

    playerBank += value;
    currentBet -= value;

    betChips[value]--;

    if (betChips[value] === 0) {
        delete betChips[value];
    }

    updateBankDisplay();
    renderBetChips();
}

function renderBetChips(){
    const betDisplay = document.getElementById('bet-chips-display');
    if(!betDisplay) return;

    betDisplay.innerHTML = '';

    const chipValues = Object.keys(betChips).map(Number).sort((a, b) => a - b);

    chipValues.forEach(value => {
        const count = betChips[value];
        if(count > 0){
            const pile = document.createElement('div');
            pile.className = 'bet-chip-pile';
            pile.onclick = () => removeChipFromBet(value);

            const chip = document.createElement('div');
            chip.className = `bet-chip chip chip-${value}`;
            chip.innerHTML = `<span>$${value}</span>`;

            pile.appendChild(chip);

            if(count > 1){
                const countBadge = document.createElement('div');
                countBadge.className = 'chip-count';
                countBadge.textContent = count;
                pile.appendChild(countBadge);
            }

            betDisplay.appendChild(pile);
        }

    })
}

function clearAllBets() {
    if (gameActive) {
        alert('Cannot change bet during an active game!');
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
        alert('Cannot change bet during an active game!');
        return;
    }

    if (playerBank === 0) {
        alert('You have no money left!');
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

// === Maze Game Logic ===



// Initialize bank on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBank();
    renderBetChips()
});