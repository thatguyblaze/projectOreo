/**
 * ==========================================================================
 * Brokie Casino - Main JavaScript File (v2 - API Save Fix)
 *
 * - Handles core functionality:
 * - Global state (currency, loan, leaderboard, stats)
 * - DOM element selection for shared components
 * - Core utility functions (updates, messages, saving/loading)
 * - Sound management (Tone.js)
 * - Tab switching logic
 * - ATM/Loan functionality
 * - Generic bet adjustment logic
 * - Initialization
 * - Added saveGameState to BrokieAPI
 * ==========================================================================
 */

// --- Global State ---
let currency = 500;
let totalLoanAmount = 0;
let leaderboard = []; // Array to store { type: 'GameName', win: 150 }
let totalGain = 0;
let totalLoss = 0;
const MAX_LEADERBOARD_ENTRIES = 5;
let animationFrameId = null; // Shared animation frame ID (currently unused)

// --- Sound State & Management ---
let toneStarted = false;
let synth, polySynth, noiseSynth;

/** Initializes Tone.js audio context on user interaction. */
async function startTone() {
    if (!toneStarted && typeof Tone !== 'undefined') {
        try {
            await Tone.start();
            console.log("AudioContext started successfully.");
            toneStarted = true;
            // Initialize synths *after* Tone.start()
            synth = new Tone.Synth().toDestination();
            polySynth = new Tone.PolySynth(Tone.Synth).toDestination();
            polySynth.volume.value = -8;
            noiseSynth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0 } }).toDestination();
            noiseSynth.volume.value = -20;
        } catch (e) {
            console.error("Failed to start AudioContext:", e);
            showMessage("Audio could not be initialized.", 2000);
        }
    }
}

/** Plays a specific sound effect using initialized Tone.js synths. */
function playSound(type, value = 0) {
    if (!toneStarted || !synth || !polySynth || !noiseSynth) {
        // console.warn("Attempted to play sound before audio initialized:", type); // Reduce console noise
        return;
    }
    const now = Tone.now();
    try {
        let index = typeof value === 'object' && value !== null && value.index !== undefined ? value.index : 0;
        // (Sound definitions from previous version - kept for brevity, assume they are correct)
        switch (type) {
             // General UI / Win/Loss
             case 'win_small': polySynth.triggerAttackRelease(["C4", "E4", "G4"], "8n", now); break;
             case 'win_medium': polySynth.triggerAttackRelease(["C5", "E5", "G5"], "4n", now); break;
             case 'win_big': polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5", "E5", "G5"], "2n", now); break;
             case 'lose': synth.triggerAttackRelease("C3", "4n", now); break;
             case 'loan': synth.triggerAttackRelease("A4", "8n", now); break;
             case 'click': synth.triggerAttackRelease("C5", "16n", now + 0.01); break;
             // Slots
             case 'spin_start': noiseSynth.triggerAttackRelease("8n", now); break;
             case 'reel_stop': synth.triggerAttackRelease("A3", "16n", now + index * 0.05); break;
             // Crash
             case 'crash_tick': if (value > 5) synth.triggerAttackRelease("E6", "32n", now); else if (value > 2) synth.triggerAttackRelease("C6", "32n", now); break;
             case 'crash_cashout': polySynth.triggerAttackRelease(["G4", "C5", "E5"], "4n", now); break;
             case 'crash_explode': polySynth.triggerAttackRelease(["C2", "E2", "G#2"], "2n", now); noiseSynth.triggerAttackRelease("2n", now + 0.05); break;
             // Coin Flip
             case 'coin_flip': synth.triggerAttackRelease("A4", "16n", now); break;
             // Minefield
             case 'mine_reveal': synth.triggerAttackRelease("C5", "16n", now + 0.02); break;
             case 'mine_bomb': polySynth.triggerAttackRelease(["C3", "D#3", "A3"], "4n", now); break;
             // Memory
             case 'memory_flip': synth.triggerAttackRelease("E5", "16n", now + 0.01); break;
             case 'memory_match': polySynth.triggerAttackRelease(["C5", "G5"], "8n", now); break;
             case 'memory_mismatch': synth.triggerAttackRelease("A3", "8n", now); break;
             case 'memory_win': polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5", "E5"], "2n", now); break;
             case 'memory_lose': polySynth.triggerAttackRelease(["C3", "E3", "G3"], "2n", now); break;
             // Horse Race
             case 'race_start': noiseSynth.triggerAttackRelease("4n", now); break;
             case 'race_win': polySynth.triggerAttackRelease(["C4", "G4", "C5", "E5"], "1n", now); break;
             case 'race_step': noiseSynth.triggerAttackRelease("64n", now); break;
             // Roulette
             case 'roulette_spin': noiseSynth.triggerAttackRelease("1n", now); break;
             case 'roulette_ball': synth.triggerAttackRelease("G5", "32n", now); break;
             case 'roulette_win': polySynth.triggerAttackRelease(["D4", "F#4", "A4", "D5"], "2n", now); break;
             // Blackjack
             case 'blackjack_deal': polySynth.triggerAttackRelease(["C4", "E4"], "16n", now); break;
             case 'blackjack_hit': synth.triggerAttackRelease("D4", "16n", now + 0.01); break;
             case 'blackjack_bust': synth.triggerAttackRelease("A2", "4n", now); break;
             case 'blackjack_win': polySynth.triggerAttackRelease(["C4", "G4", "C5"], "4n", now); break;
             case 'blackjack_push': synth.triggerAttackRelease("E4", "8n", now); break;
             case 'blackjack_blackjack': polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n", now); break;
             // Plinko
             case 'plinko_drop': synth.triggerAttackRelease("E5", "16n", now); break;
             case 'plinko_peg_hit': synth.triggerAttackRelease("A5", "64n", now + Math.random()*0.02); break;
             case 'plinko_win_low': polySynth.triggerAttackRelease(["C4", "E4"], "16n", now); break;
             case 'plinko_win_high': polySynth.triggerAttackRelease(["C5", "G5"], "8n", now); break;
        }
    } catch (error) {
        console.error("Tone.js error playing sound:", type, error);
    }
}

// --- DOM Elements (Shared) ---
const currencyDisplay = document.getElementById('currency-display');
const loanBalanceDisplay = document.getElementById('loan-balance-display');
const loanButton = document.getElementById('loan-button');
const payLoanButton = document.getElementById('pay-loan-button');
const leaderboardList = document.getElementById('leaderboard-list');
const messageBox = document.getElementById('message-box');
const allTabs = Array.from(document.querySelectorAll('.tab-button')).filter(el => el !== null);
const allGameAreas = Array.from(document.querySelectorAll('.game-area')).filter(el => el !== null);
const atmModalOverlay = document.getElementById('atm-modal-overlay');
const atmModal = document.getElementById('atm-modal');
const atmCloseButton = document.getElementById('atm-close-button');
const atmButtons = atmModal ? atmModal.querySelectorAll('.atm-button') : [];
const statsTotalGain = document.getElementById('stats-total-gain');
const statsTotalLoss = document.getElementById('stats-total-loss');
const statsNetProfit = document.getElementById('stats-net-profit');

// --- Core Functions ---

/** Updates the enabled/disabled state of the 'Pay Loan' button. */
function updatePayLoanButtonState() {
    if (!payLoanButton) return;
    payLoanButton.disabled = !(totalLoanAmount > 0 && currency >= totalLoanAmount);
}

/** Briefly highlights an element with a pulse animation. */
function flashElement(element) { /* ... (implementation unchanged) ... */
    if (!element) return;
    element.classList.add('animate-pulse');
    setTimeout(() => {
        element.classList.remove('animate-pulse');
    }, 600);
}

/** Updates the session statistics display in the UI. */
function updateStatsDisplay() { /* ... (implementation unchanged) ... */
    if (!statsTotalGain || !statsTotalLoss || !statsNetProfit) return;
    statsTotalGain.textContent = totalGain.toLocaleString();
    statsTotalLoss.textContent = totalLoss.toLocaleString();
    const net = totalGain - totalLoss;
    statsNetProfit.textContent = net.toLocaleString();
    statsNetProfit.className = 'stats-value font-semibold text-fluent-text-primary'; // Reset
    if (net > 0) statsNetProfit.classList.replace('text-fluent-text-primary', 'text-fluent-accent');
    else if (net < 0) statsNetProfit.classList.replace('text-fluent-text-primary', 'text-fluent-danger');
}

/** Flashes the currency display green for a win, red for a loss. */
function flashCurrency(type) { /* ... (implementation unchanged) ... */
    if (!currencyDisplay) return;
    currencyDisplay.classList.remove('flash-win', 'flash-loss');
    void currencyDisplay.offsetWidth;
    if (type === 'win') currencyDisplay.classList.add('flash-win');
    else if (type === 'loss') currencyDisplay.classList.add('flash-loss');
    setTimeout(() => { currencyDisplay.classList.remove('flash-win', 'flash-loss'); }, 600);
}

/** Updates the currency and loan balance displays in the UI. */
function updateCurrencyDisplay(changeType = null) { /* ... (implementation unchanged) ... */
    if (currencyDisplay) currencyDisplay.textContent = currency.toLocaleString();
    if (loanBalanceDisplay) loanBalanceDisplay.textContent = totalLoanAmount.toLocaleString();
    updatePayLoanButtonState();
    updateStatsDisplay();
    if (changeType) flashCurrency(changeType);
}

/** Shows a temporary message at the bottom of the screen. */
function showMessage(text, duration = 3000) { /* ... (implementation unchanged) ... */
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.classList.add('show');
    setTimeout(() => { messageBox.classList.remove('show'); }, duration);
}

/** Formats a number for display as currency or winnings. */
function formatWin(amount) { /* ... (implementation unchanged) ... */
    if (typeof amount !== 'number' || isNaN(amount)) { console.warn("Invalid amount passed to formatWin:", amount); return '0'; }
    return amount.toLocaleString();
}

/** Adds a win entry to the leaderboard state and updates the display. */
function addWinToLeaderboard(type, winAmount) { /* ... (implementation unchanged) ... */
    if (winAmount <= 0) return;
    leaderboard.push({ type: type, win: winAmount });
    leaderboard.sort((a, b) => b.win - a.win);
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    saveGameState();
    updateLeaderboardDisplay();
}

/** Updates the leaderboard list in the UI based on the current state. */
function updateLeaderboardDisplay() { /* ... (implementation unchanged) ... */
    if (!leaderboardList) return;
    const oldListContent = Array.from(leaderboardList.children).map(li => li.textContent);
    leaderboardList.innerHTML = '';
    if (leaderboard.length === 0) { leaderboardList.innerHTML = '<li class="italic text-sm text-fluent-text-secondary">No wins yet!</li>'; return; }
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        const entryText = `${entry.type}: ${formatWin(entry.win)}`;
        li.className = 'flex justify-between items-center text-sm py-1';
        if (!oldListContent.some(oldText => oldText.includes(entryText))) {
            li.classList.add('leaderboard-entry-new'); li.style.animationDelay = `${index * 0.05}s`;
        }
        li.innerHTML = `<span class="font-medium text-fluent-text-secondary">${entry.type}</span> <span class="text-fluent-accent font-semibold">+${formatWin(entry.win)}</span>`;
        leaderboardList.appendChild(li);
    });
}

/** Saves the current game state to localStorage. */
function saveGameState() {
    try {
        localStorage.setItem('brokieCasinoState', JSON.stringify({
            currency: currency,
            leaderboard: leaderboard,
            totalLoanAmount: totalLoanAmount,
            totalGain: totalGain,
            totalLoss: totalLoss,
        }));
        // console.log("Game state saved."); // Optional debug log
    } catch (e) {
        console.error("Error saving game state:", e);
        showMessage("Could not save game progress.", 2000);
    }
}

/** Loads the game state from localStorage and updates the UI. */
function loadGameState() { /* ... (implementation unchanged) ... */
    const savedState = localStorage.getItem('brokieCasinoState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            currency = (state.currency !== undefined && !isNaN(state.currency)) ? state.currency : 500;
            leaderboard = Array.isArray(state.leaderboard) ? state.leaderboard : [];
            totalLoanAmount = (state.totalLoanAmount !== undefined && !isNaN(state.totalLoanAmount)) ? state.totalLoanAmount : 0;
            totalGain = (state.totalGain !== undefined && !isNaN(state.totalGain)) ? state.totalGain : 0;
            totalLoss = (state.totalLoss !== undefined && !isNaN(state.totalLoss)) ? state.totalLoss : 0;
        } catch (e) {
            console.error("Error loading saved state:", e);
            currency = 500; leaderboard = []; totalLoanAmount = 0; totalGain = 0; totalLoss = 0;
            localStorage.removeItem('brokieCasinoState');
        }
    }
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    updateCurrencyDisplay(); updateLeaderboardDisplay(); updateStatsDisplay();
}

/** Switches the active game tab and handles associated UI changes. */
function setActiveTab(selectedTab) { /* ... (implementation unchanged, calls game-specific reset functions) ... */
    if (!selectedTab) return;
    const currentActiveTab = allTabs.find(tab => tab && tab.getAttribute('aria-current') === 'page');
    if (currentActiveTab && currentActiveTab !== selectedTab) {
        if (currentActiveTab === tabSlots && typeof stopAutoSpin === 'function') { stopAutoSpin(); }
        if (currentActiveTab === tabCrash && typeof endCrashGame === 'function' && typeof crashGameActive !== 'undefined' && crashGameActive) { endCrashGame(false, 0, true); /* End silently, no payout, stopped by tab switch */ }
        if (currentActiveTab === tabCoinflip && typeof resetCoinFlip === 'function' && typeof coinFlipActive !== 'undefined' && coinFlipActive) { resetCoinFlip(); }
        if (currentActiveTab === tabMinefield && typeof resetMinefield === 'function' && typeof minefieldActive !== 'undefined' && minefieldActive) { resetMinefield(); }
        if (currentActiveTab === tabMemory && typeof resetMemoryGame === 'function' && typeof memoryActive !== 'undefined' && memoryActive) { resetMemoryGame(); }
        if (currentActiveTab === tabHorserace && typeof resetHorserace === 'function' && typeof horseraceActive !== 'undefined' && horseraceActive) { resetHorserace(); }
        if (currentActiveTab === tabRoulette && typeof resetRoulette === 'function' && typeof rouletteIsSpinning !== 'undefined' && rouletteIsSpinning) { resetRoulette(true); }
        if (currentActiveTab === tabBlackjack && typeof resetBlackjack === 'function' && typeof blackjackActive !== 'undefined' && blackjackActive) { resetBlackjack(true); }
        if (currentActiveTab === tabPlinko && typeof resetPlinko === 'function' && typeof plinkoActive !== 'undefined' && plinkoActive) { resetPlinko(); }
    }
    allTabs.forEach((tab, index) => {
        if (!tab) return;
        const gameArea = allGameAreas[index]; if (!gameArea) return;
        if (tab === selectedTab) {
            tab.setAttribute('aria-current', 'page'); gameArea.classList.remove('hidden');
            requestAnimationFrame(() => { gameArea.classList.remove('opacity-0'); gameArea.classList.add('opacity-100'); });
            // Call init/reset for newly active game
            if (tab === tabCrash && typeof resetCrashVisuals === 'function' && (typeof crashGameActive === 'undefined' || !crashGameActive)) { resetCrashVisuals(); }
            if (tab === tabHorserace && typeof createHorses === 'function' && !document.querySelector('#horserace-track .horse')) { createHorses(); if(typeof resetHorserace === 'function') resetHorserace(); }
            if (tab === tabRoulette && typeof createRouletteBettingGrid === 'function' && !document.querySelector('#roulette-inside-bets button')) { createRouletteBettingGrid(); if(typeof resetRoulette === 'function') resetRoulette(false); }
            if (tab === tabBlackjack && typeof resetBlackjack === 'function' && (typeof blackjackActive === 'undefined' || !blackjackActive)) { resetBlackjack(false); }
            if (tab === tabPlinko && typeof resetPlinko === 'function' && (typeof plinkoActive === 'undefined' || !plinkoActive)) { resetPlinko(); }
            if (tab === tabSlots && typeof updateSlotsPayoutDisplay === 'function') { updateSlotsPayoutDisplay(); }
        } else {
            tab.removeAttribute('aria-current'); gameArea.classList.remove('opacity-100'); gameArea.classList.add('opacity-0');
            setTimeout(() => { if (tab.getAttribute('aria-current') !== 'page') { gameArea.classList.add('hidden'); } }, 300);
        }
    });
    playSound('click');
}

/** Adjusts the value of a bet input field based on the operation. */
function adjustBet(inputElement, amount, operation) { /* ... (implementation unchanged) ... */
    if (!inputElement) { console.error("adjustBet called with null inputElement"); return; }
    let currentBet = parseInt(inputElement.value); if (isNaN(currentBet) || currentBet < 1) currentBet = 1;
    let newBet = currentBet; const minBet = 1; const maxBet = Math.max(minBet, currency);
    switch (operation) {
        case 'add': newBet = currentBet + amount; break; case 'subtract': newBet = currentBet - amount; break;
        case 'multiply': newBet = Math.floor(currentBet * amount); break; case 'divide': newBet = Math.floor(currentBet / amount); break;
        case 'min': newBet = minBet; break; case 'max': newBet = maxBet; break; case 'set': newBet = amount; break;
        default: console.warn("Invalid operation in adjustBet:", operation); return;
    }
    newBet = Math.max(minBet, newBet);
    if (currency > 0) { newBet = Math.min(maxBet, newBet); } else { newBet = minBet; }
    if(isNaN(newBet)) { newBet = minBet; }
    inputElement.value = newBet; playSound('click');
}

// --- ATM / Loan Logic ---
function openAtmModal() { /* ... (implementation unchanged) ... */
    if (!atmModalOverlay || !atmModal) return; playSound('click');
    atmModalOverlay.classList.remove('hidden'); atmModal.classList.remove('hidden');
    requestAnimationFrame(() => { atmModalOverlay.classList.add('opacity-100'); atmModal.classList.add('opacity-100', 'scale-100'); });
}
function closeAtmModal() { /* ... (implementation unchanged) ... */
     if (!atmModalOverlay || !atmModal) return; playSound('click');
    atmModalOverlay.classList.remove('opacity-100'); atmModal.classList.remove('opacity-100', 'scale-100');
    setTimeout(() => { atmModalOverlay.classList.add('hidden'); atmModal.classList.add('hidden'); }, 300);
}

// --- Event Listeners Setup ---
function setupMainEventListeners() { /* ... (implementation unchanged) ... */
    if (loanButton) loanButton.addEventListener('click', openAtmModal);
    if (atmCloseButton) atmCloseButton.addEventListener('click', closeAtmModal);
    if (atmModalOverlay) atmModalOverlay.addEventListener('click', closeAtmModal);
    if (atmButtons) {
        atmButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = parseInt(button.dataset.amount); if (isNaN(amount) || amount <= 0) return;
                startTone(); playSound('loan'); currency += amount; totalLoanAmount += amount;
                updateCurrencyDisplay('win'); saveGameState();
                showMessage(`Withdrew ${formatWin(amount)}! Loan balance increased.`, 2000); closeAtmModal();
            });
        });
    }
    if (payLoanButton) {
        payLoanButton.addEventListener('click', () => {
            if (totalLoanAmount <= 0) { showMessage("No loan to pay back.", 1500); return; }
            if (currency >= totalLoanAmount) {
                startTone(); playSound('click'); const paidAmount = totalLoanAmount; currency -= totalLoanAmount; totalLoanAmount = 0;
                updateCurrencyDisplay('loss'); saveGameState(); showMessage(`Loan of ${formatWin(paidAmount)} paid off!`, 2000);
            } else { showMessage(`Not enough funds to pay off loan! Need ${formatWin(totalLoanAmount)}.`, 2000); }
        });
    }
    allTabs.forEach(tab => { if (tab) { tab.addEventListener('click', (e) => { startTone(); setActiveTab(e.currentTarget); }); } });
    document.body.addEventListener('click', startTone, { once: true }); document.body.addEventListener('keydown', startTone, { once: true });
}

// --- Generic Bet Adjustment Listener Factory ---
function addBetAdjustmentListeners(gamePrefix, betInputElement) { /* ... (implementation unchanged) ... */
    const decrease10Btn = document.getElementById(`${gamePrefix}-bet-decrease-10`); const decrease1Btn = document.getElementById(`${gamePrefix}-bet-decrease-1`);
    const increase1Btn = document.getElementById(`${gamePrefix}-bet-increase-1`); const increase10Btn = document.getElementById(`${gamePrefix}-bet-increase-10`);
    const minBtn = document.getElementById(`${gamePrefix}-bet-min`); const halfBtn = document.getElementById(`${gamePrefix}-bet-half`);
    const doubleBtn = document.getElementById(`${gamePrefix}-bet-double`); const maxBtn = document.getElementById(`${gamePrefix}-bet-max`);
    if (!betInputElement) { console.warn(`Bet input not found for prefix: ${gamePrefix}`); return; }
    if (decrease10Btn) decrease10Btn.addEventListener('click', () => adjustBet(betInputElement, 10, 'subtract')); if (decrease1Btn) decrease1Btn.addEventListener('click', () => adjustBet(betInputElement, 1, 'subtract'));
    if (increase1Btn) increase1Btn.addEventListener('click', () => adjustBet(betInputElement, 1, 'add')); if (increase10Btn) increase10Btn.addEventListener('click', () => adjustBet(betInputElement, 10, 'add'));
    if (minBtn) minBtn.addEventListener('click', () => adjustBet(betInputElement, 1, 'min')); if (halfBtn) halfBtn.addEventListener('click', () => adjustBet(betInputElement, 2, 'divide'));
    if (doubleBtn) doubleBtn.addEventListener('click', () => adjustBet(betInputElement, 2, 'multiply')); if (maxBtn) maxBtn.addEventListener('click', () => adjustBet(betInputElement, currency, 'max'));
    if (betInputElement) {
        betInputElement.addEventListener('change', () => { let value = parseInt(betInputElement.value); if(isNaN(value) || value < 1) value = 1; adjustBet(betInputElement, value, 'set'); });
        betInputElement.addEventListener('input', () => { betInputElement.value = betInputElement.value.replace(/[^0-9]/g, ''); });
    }
}


// --- Global Access Object (for game files) ---
// Define BrokieAPI object *before* DOMContentLoaded listener finishes
const BrokieAPI = {
    // State Accessors
    getBalance: () => currency,
    getLoanBalance: () => totalLoanAmount,

    // State Modifiers (ensure updates go through main logic)
    updateBalance: (amountChange) => {
        const changeType = amountChange > 0 ? 'win' : 'loss';
        currency += amountChange;
        if (currency < 0) currency = 0; // Prevent negative balance

        // Update stats based on the change
        if (amountChange > 0) {
            totalGain += amountChange;
        } else if (amountChange < 0) {
            totalLoss += Math.abs(amountChange);
        }

        updateCurrencyDisplay(changeType); // Update display and stats
        // Note: saveGameState is called separately by game logic where needed
        return currency; // Return the new balance
    },
    addWin: (gameName, winAmount) => {
        if (winAmount > 0) {
            addWinToLeaderboard(gameName, winAmount);
            // Balance update should happen via updateBalance where the win is awarded
        }
    },

    // Utilities
    showMessage: showMessage,
    playSound: playSound,
    startTone: startTone,
    formatWin: formatWin,
    addBetAdjustmentListeners: addBetAdjustmentListeners,
    // --- FIX: Expose saveGameState ---
    saveGameState: saveGameState
};

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing Brokie Casino...");
    loadGameState(); // Load saved state first
    setupMainEventListeners(); // Setup listeners for main UI elements

    // Set the initial active tab (e.g., Slots)
    const initialTab = tabSlots || allTabs.find(tab => tab); // Prefer slots, fallback to first
    if (initialTab) {
        setActiveTab(initialTab);
    } else {
        console.error("No game tabs found to activate!");
    }

    // --- Call Initialization functions from game-specific files ---
    // Pass the BrokieAPI object to each init function
    if (typeof initSlots === 'function') initSlots(BrokieAPI); else console.warn("initSlots not found.");
    if (typeof initCrash === 'function') initCrash(BrokieAPI); else console.warn("initCrash not found.");
    if (typeof initCoinflip === 'function') initCoinflip(BrokieAPI); else console.warn("initCoinflip not found.");
    if (typeof initMinefield === 'function') initMinefield(BrokieAPI); else console.warn("initMinefield not found.");
    if (typeof initMemory === 'function') initMemory(BrokieAPI); else console.warn("initMemory not found.");
    if (typeof initHorserace === 'function') initHorserace(BrokieAPI); else console.warn("initHorserace not found.");
    if (typeof initRoulette === 'function') initRoulette(BrokieAPI); else console.warn("initRoulette not found.");
    if (typeof initBlackjack === 'function') initBlackjack(BrokieAPI); else console.warn("initBlackjack not found.");
    if (typeof initPlinko === 'function') initPlinko(BrokieAPI); else console.warn("initPlinko not found.");

    console.log("Brokie Casino Initialized.");
});
