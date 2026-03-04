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
}


// Initialize bank on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBank();
});