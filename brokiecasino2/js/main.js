/**
 * Brokie Casino - Main JavaScript File
 *
 * Handles core functionality:
 * - Global state (currency, loan, leaderboard, stats)
 * - DOM element selection for shared components
 * - Core utility functions (updates, messages, saving/loading)
 * - Sound management (Tone.js)
 * - Tab switching logic
 * - ATM/Loan functionality
 * - Generic bet adjustment logic
 * - Initialization
 */

// --- Global State ---
let currency = 500;
let totalLoanAmount = 0;
let leaderboard = [];
let totalGain = 0;
let totalLoss = 0;
const MAX_LEADERBOARD_ENTRIES = 5;
let animationFrameId = null; // For potential shared animations (if any)

// --- Sound State & Management ---
let toneStarted = false;
let synth, polySynth, noiseSynth; // Declare synth variables

// Function to initialize Tone.js on user interaction
async function startTone() {
    if (!toneStarted && typeof Tone !== 'undefined') { // Check if Tone is loaded
        try {
            await Tone.start();
            console.log("AudioContext started successfully.");
            toneStarted = true;

            // Initialize synths *after* Tone.start()
            synth = new Tone.Synth().toDestination();
            polySynth = new Tone.PolySynth(Tone.Synth).toDestination();
            polySynth.volume.value = -8; // Adjust volume
            noiseSynth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0 } }).toDestination();
            noiseSynth.volume.value = -20; // Adjust volume

        } catch (e) {
            console.error("Failed to start AudioContext:", e);
            // Optionally show a message to the user that sound won't work
            showMessage("Audio could not be initialized.", 2000);
        }
    }
}

// Function to play different sound effects
function playSound(type, value = 0) {
    // Ensure Tone has started and synths are initialized
    if (!toneStarted || !synth || !polySynth || !noiseSynth) {
        console.warn("Attempted to play sound before audio initialized:", type);
        return;
    }
    const now = Tone.now();
    try {
        // Added 'index' as a parameter for sounds needing it (like reel stop)
        let index = typeof value === 'object' && value !== null && value.index !== undefined ? value.index : 0;

        switch (type) {
            // General UI / Win/Loss
            case 'win_small': polySynth.triggerAttackRelease(["C4", "E4", "G4"], "8n", now); break;
            case 'win_medium': polySynth.triggerAttackRelease(["C5", "E5", "G5"], "4n", now); break;
            case 'win_big': polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5", "E5", "G5"], "2n", now); break; // More complex big win
            case 'lose': synth.triggerAttackRelease("C3", "4n", now); break; // Simple lose sound
            case 'loan': synth.triggerAttackRelease("A4", "8n", now); break;
            case 'click': synth.triggerAttackRelease("C5", "16n", now + 0.01); break; // Subtle click for buttons/bets

            // --- Game Specific Sounds ---
            // Slots
            case 'spin_start': noiseSynth.triggerAttackRelease("8n", now); break;
            case 'reel_stop': synth.triggerAttackRelease("A3", "16n", now + index * 0.05); break;

            // Crash
            case 'crash_tick': if (value > 5) synth.triggerAttackRelease("E6", "32n", now); else if (value > 2) synth.triggerAttackRelease("C6", "32n", now); break; // Crash multiplier tick (simplified)
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

            // Plinko (Add specific sounds)
            case 'plinko_drop': synth.triggerAttackRelease("E5", "16n", now); break; // Placeholder
            case 'plinko_peg_hit': synth.triggerAttackRelease("A5", "64n", now + Math.random()*0.02); break; // Placeholder - slightly random pitch/time
            case 'plinko_win_low': polySynth.triggerAttackRelease(["C4", "E4"], "16n", now); break; // Placeholder for low multiplier win
            case 'plinko_win_high': polySynth.triggerAttackRelease(["C5", "G5"], "8n", now); break; // Placeholder for high multiplier win

        }
    } catch (error) {
        console.error("Tone.js error playing sound:", error);
    }
}


// --- DOM Elements (Shared) ---
const currencyDisplay = document.getElementById('currency-display');
const loanBalanceDisplay = document.getElementById('loan-balance-display');
const loanButton = document.getElementById('loan-button');
const payLoanButton = document.getElementById('pay-loan-button');
const leaderboardList = document.getElementById('leaderboard-list');
const messageBox = document.getElementById('message-box');
// Tabs & Game Areas
const tabSlots = document.getElementById('tab-slots');
const tabCrash = document.getElementById('tab-crash');
const tabCoinflip = document.getElementById('tab-coinflip');
const tabMinefield = document.getElementById('tab-minefield');
const tabMemory = document.getElementById('tab-memory');
const tabHorserace = document.getElementById('tab-horserace');
const tabRoulette = document.getElementById('tab-roulette');
const tabBlackjack = document.getElementById('tab-blackjack');
const tabPlinko = document.getElementById('tab-plinko'); // Added Plinko Tab
const gameSlots = document.getElementById('game-slots');
const gameCrash = document.getElementById('game-crash');
const gameCoinflip = document.getElementById('game-coinflip');
const gameMinefield = document.getElementById('game-minefield');
const gameMemory = document.getElementById('game-memory');
const gameHorserace = document.getElementById('game-horserace');
const gameRoulette = document.getElementById('game-roulette');
const gameBlackjack = document.getElementById('game-blackjack');
const gamePlinko = document.getElementById('game-plinko'); // Added Plinko Game Area
const allTabs = [tabSlots, tabCrash, tabCoinflip, tabMinefield, tabMemory, tabHorserace, tabRoulette, tabBlackjack, tabPlinko]; // Added Plinko Tab
const allGameAreas = [gameSlots, gameCrash, gameCoinflip, gameMinefield, gameMemory, gameHorserace, gameRoulette, gameBlackjack, gamePlinko]; // Added Plinko Game Area
// ATM Modal
const atmModalOverlay = document.getElementById('atm-modal-overlay');
const atmModal = document.getElementById('atm-modal');
const atmCloseButton = document.getElementById('atm-close-button');
const atmButtons = atmModal.querySelectorAll('.atm-button');
// Stats
const statsTotalGain = document.getElementById('stats-total-gain');
const statsTotalLoss = document.getElementById('stats-total-loss');
const statsNetProfit = document.getElementById('stats-net-profit');

// --- Core Functions ---

/**
 * Updates the enabled/disabled state of the 'Pay Loan' button.
 */
function updatePayLoanButtonState() {
    if (!payLoanButton) return; // Check if element exists
    const canPay = currency >= totalLoanAmount && totalLoanAmount > 0;
    payLoanButton.disabled = !canPay;
}

/**
 * Briefly highlights an element with a pulse animation.
 * @param {HTMLElement} element - The DOM element to flash.
 */
function flashElement(element) {
    if (!element) return;
    // Using CSS class defined in style.css (animate-pulse might conflict with Tailwind)
    // Let's assume a custom 'pulse-effect' class exists or use Tailwind's temporarily
    element.classList.add('animate-pulse'); // Use Tailwind's pulse for now
    setTimeout(() => {
        element.classList.remove('animate-pulse');
    }, 600); // Duration matches Tailwind's default pulse
}

/**
 * Updates the session statistics display in the UI.
 */
function updateStatsDisplay() {
    if (!statsTotalGain || !statsTotalLoss || !statsNetProfit) return; // Check elements
    const oldGain = parseFloat(statsTotalGain.textContent.replace(/,/g, '')) || 0;
    const oldLoss = parseFloat(statsTotalLoss.textContent.replace(/,/g, '')) || 0;
    const oldNet = parseFloat(statsNetProfit.textContent.replace(/,/g, '')) || 0;

    statsTotalGain.textContent = totalGain.toLocaleString();
    statsTotalLoss.textContent = totalLoss.toLocaleString();
    const net = totalGain - totalLoss;
    statsNetProfit.textContent = net.toLocaleString();

    // Apply color based on net profit/loss using CSS classes
    statsNetProfit.className = 'stats-value'; // Reset classes first
    if (net > 0) {
        statsNetProfit.classList.add('text-profit');
    } else if (net < 0) {
        statsNetProfit.classList.add('text-loss');
    }

    // Flash if values changed
    if (totalGain !== oldGain) flashElement(statsTotalGain);
    if (totalLoss !== oldLoss) flashElement(statsTotalLoss);
    if (net !== oldNet) flashElement(statsNetProfit);
}

/**
 * Flashes the currency display green for a win, red for a loss.
 * @param {'win' | 'loss'} type - The type of change.
 */
function flashCurrency(type) {
    if (!currencyDisplay) return; // Check element
    currencyDisplay.classList.remove('flash-win', 'flash-loss');
    void currencyDisplay.offsetWidth; // Trigger reflow to restart animation
    if (type === 'win') {
        currencyDisplay.classList.add('flash-win');
    } else if (type === 'loss') {
        currencyDisplay.classList.add('flash-loss');
    }
    // Remove class after animation duration (matches CSS)
    setTimeout(() => {
        currencyDisplay.classList.remove('flash-win', 'flash-loss');
    }, 600);
}

/**
 * Updates the currency and loan balance displays in the UI.
 * Optionally flashes the currency display.
 * @param {'win' | 'loss' | null} [changeType=null] - Type of change for flashing effect.
 */
function updateCurrencyDisplay(changeType = null) {
    if (currencyDisplay) currencyDisplay.textContent = currency.toLocaleString();
    if (loanBalanceDisplay) loanBalanceDisplay.textContent = totalLoanAmount.toLocaleString();
    updatePayLoanButtonState();
    updateStatsDisplay(); // Update stats whenever currency changes
    if (changeType) {
        flashCurrency(changeType);
    }
}

/**
 * Shows a temporary message at the bottom of the screen.
 * @param {string} text - The message to display.
 * @param {number} [duration=3000] - How long to display the message in milliseconds.
 */
function showMessage(text, duration = 3000) {
    if (!messageBox) return; // Check element
    messageBox.textContent = text;
    messageBox.classList.add('show');
    // Hide the message after the duration
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}

/**
 * Formats a number for display as currency or winnings.
 * @param {number} amount - The number to format.
 * @returns {string} The formatted number string.
 */
function formatWin(amount) {
    // Ensure amount is a number before formatting
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn("Invalid amount passed to formatWin:", amount);
        return '0'; // Or some other default/error string
    }
    return amount.toLocaleString();
}


/**
 * Adds a win entry to the leaderboard state and updates the display.
 * @param {string} type - The type of game or win (e.g., 'Slots', 'Crash').
 * @param {number} winAmount - The amount won.
 */
function addWinToLeaderboard(type, winAmount) {
    if (winAmount <= 0) return; // Only add actual wins
    leaderboard.push({ type: type, win: winAmount });
    // Sort leaderboard descending by win amount
    leaderboard.sort((a, b) => b.win - a.win);
    // Keep only the top entries
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    saveGameState(); // Save after updating leaderboard
    updateLeaderboardDisplay(); // Update the UI
}

/**
 * Updates the leaderboard list in the UI based on the current state.
 */
function updateLeaderboardDisplay() {
    if (!leaderboardList) return; // Check element
    const oldList = Array.from(leaderboardList.children).map(li => li.textContent); // Get text of old entries
    leaderboardList.innerHTML = ''; // Clear the list
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<li class="text-gray-500">No wins yet! Play a game!</li>';
        return;
    }
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        const entryText = `${entry.type}: ${formatWin(entry.win)}`; // Consistent format
        li.className = 'flex justify-between items-center text-sm';
        // Check if this entry is new compared to the old list content
        if (!oldList.some(oldText => oldText.includes(entryText))) {
            li.classList.add('leaderboard-entry-new'); // Add animation class for new entries
            li.style.animationDelay = `${index * 0.05}s`; // Stagger animation
        }
        li.innerHTML = `
            <span class="font-medium text-gray-300">${entry.type}</span>
            <span class="text-green-400 font-semibold">${formatWin(entry.win)}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

/**
 * Saves the current game state (currency, loan, leaderboard, stats) to localStorage.
 */
function saveGameState() {
    try {
        localStorage.setItem('brokieCasinoState', JSON.stringify({
            currency: currency,
            leaderboard: leaderboard,
            totalLoanAmount: totalLoanAmount,
            totalGain: totalGain,
            totalLoss: totalLoss,
            // Add other game-specific states if persistence is needed (e.g., auto-bet settings)
        }));
    } catch (e) {
        console.error("Error saving game state:", e);
        showMessage("Could not save game progress.", 2000);
    }
}

/**
 * Loads the game state from localStorage and updates the UI.
 */
function loadGameState() {
    const savedState = localStorage.getItem('brokieCasinoState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // Validate loaded data or use defaults
            currency = state.currency !== undefined && !isNaN(state.currency) ? state.currency : 500;
            leaderboard = Array.isArray(state.leaderboard) ? state.leaderboard : [];
            totalLoanAmount = state.totalLoanAmount !== undefined && !isNaN(state.totalLoanAmount) ? state.totalLoanAmount : 0;
            totalGain = state.totalGain !== undefined && !isNaN(state.totalGain) ? state.totalGain : 0;
            totalLoss = state.totalLoss !== undefined && !isNaN(state.totalLoss) ? state.totalLoss : 0;
            // Load other saved states here if added
        } catch (e) {
            console.error("Error loading saved state:", e);
            // Reset to defaults if loading fails
            currency = 500;
            leaderboard = [];
            totalLoanAmount = 0;
            totalGain = 0;
            totalLoss = 0;
            localStorage.removeItem('brokieCasinoState'); // Clear corrupted state
        }
    }
    // Ensure leaderboard doesn't exceed max entries after loading
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    updateCurrencyDisplay(); // Update UI with loaded values
    updateLeaderboardDisplay();
}

/**
 * Switches the active game tab and handles associated UI changes.
 * @param {HTMLElement} selectedTab - The tab button element that was clicked.
 */
function setActiveTab(selectedTab) {
    // --- Call reset/stop functions for the *previously* active game ---
    // Find the currently active tab before switching
    const currentActiveTab = allTabs.find(tab => tab && tab.getAttribute('aria-current') === 'page'); // Added null check for tab
    if (currentActiveTab && currentActiveTab !== selectedTab) {
        // Slots
        if (currentActiveTab === tabSlots && typeof stopAutoSpin === 'function') { stopAutoSpin(); }
        // Crash
        if (currentActiveTab === tabCrash) {
            if (typeof stopCrashAutoBet === 'function') { stopCrashAutoBet(); }
            // Check crashGameActive using window scope or ensure it's globally available
            if (typeof endCrashGame === 'function' && typeof crashGameActive !== 'undefined' && crashGameActive) { endCrashGame(true, 0, true); }
        }
        // Coin Flip
        if (currentActiveTab === tabCoinflip && typeof resetCoinFlip === 'function' && typeof coinFlipActive !== 'undefined' && coinFlipActive) { resetCoinFlip(); }
        // Minefield
        if (currentActiveTab === tabMinefield && typeof resetMinefield === 'function' && typeof minefieldActive !== 'undefined' && minefieldActive) { resetMinefield(); }
        // Memory
        if (currentActiveTab === tabMemory && typeof resetMemoryGame === 'function' && typeof memoryActive !== 'undefined' && memoryActive) { resetMemoryGame(); }
        // Horse Race
        if (currentActiveTab === tabHorserace && typeof resetHorserace === 'function' && typeof horseraceActive !== 'undefined' && horseraceActive) { resetHorserace(); }
        // Roulette
        if (currentActiveTab === tabRoulette && typeof resetRoulette === 'function' && typeof rouletteIsSpinning !== 'undefined' && rouletteIsSpinning) { resetRoulette(); }
        // Blackjack
        if (currentActiveTab === tabBlackjack && typeof resetBlackjack === 'function' && typeof blackjackActive !== 'undefined' && blackjackActive) { resetBlackjack(true); }
        // Plinko
        if (currentActiveTab === tabPlinko && typeof resetPlinko === 'function' && typeof plinkoActive !== 'undefined' && plinkoActive) { resetPlinko(); }
    }


    // --- Handle tab switching visuals and game area visibility ---
    allTabs.forEach((tab, index) => {
        if (!tab) return; // Skip if tab element wasn't found
        const gameArea = allGameAreas[index]; // Get corresponding game area
        if (!gameArea) return; // Skip if game area element wasn't found

        if (tab === selectedTab) {
            tab.setAttribute('aria-current', 'page'); // Highlight active tab
            gameArea.classList.remove('hidden');
            // Delay opacity transition slightly to ensure 'hidden' is removed first
            requestAnimationFrame(() => {
                gameArea.classList.remove('opacity-0');
                gameArea.classList.add('opacity-100'); // Make game area visible
            });


            // --- Call initialization/reset functions for the *newly* active game (if needed) ---
            // Crash: Reset visuals if game not active
            if (tab === tabCrash && typeof resetCrashVisuals === 'function' && (typeof crashGameActive === 'undefined' || !crashGameActive)) {
                resetCrashVisuals();
                if (typeof updateCrashAutoCashoutToggleVisuals === 'function') updateCrashAutoCashoutToggleVisuals();
            }
            // Horse Race: Create horses if needed
            if (tab === tabHorserace && typeof createHorses === 'function' && !document.querySelector('#horserace-track .horse')) {
                createHorses();
                if (typeof resetHorserace === 'function') resetHorserace();
            }
            // Roulette: Create grid if needed
            if (tab === tabRoulette && typeof createRouletteBettingGrid === 'function' && !document.querySelector('#roulette-inside-bets button')) {
                createRouletteBettingGrid();
                if (typeof resetRoulette === 'function') resetRoulette();
            }
            // Blackjack: Reset if not active
            if (tab === tabBlackjack && typeof resetBlackjack === 'function' && (typeof blackjackActive === 'undefined' || !blackjackActive)) {
                resetBlackjack(false);
            }
            // Plinko: Reset board if not active
            if (tab === tabPlinko && typeof resetPlinko === 'function' && (typeof plinkoActive === 'undefined' || !plinkoActive)) {
                resetPlinko(); // Redraws board without ball
            }

        } else {
            tab.removeAttribute('aria-current'); // Unhighlight inactive tabs
            // Start fade out
            gameArea.classList.remove('opacity-100');
            gameArea.classList.add('opacity-0');
            // Hide after transition (300ms matches CSS transition)
            setTimeout(() => {
                // Only hide if the tab is still not the selected one
                if (tab.getAttribute('aria-current') !== 'page') {
                    gameArea.classList.add('hidden');
                }
            }, 300);
        }
    });
}

/**
 * Adjusts the value of a bet input field based on the operation.
 * Clamps the value between 1 and the player's current currency.
 * @param {HTMLInputElement} inputElement - The bet input field.
 * @param {number} amount - The amount to add/subtract/multiply/divide by, or the value to set.
 * @param {'add'|'subtract'|'multiply'|'divide'|'min'|'max'|'set'} operation - The operation to perform.
 */
function adjustBet(inputElement, amount, operation) {
    if (!inputElement) return; // Check element exists
    let currentBet = parseInt(inputElement.value);
    if (isNaN(currentBet)) currentBet = 1; // Default to 1 if input is invalid

    let newBet = currentBet;
    const minBet = 1;
    // Max bet is generally the current currency, but ensure it's at least minBet
    const maxBet = Math.max(minBet, currency);

    switch (operation) {
        case 'add': newBet = currentBet + amount; break;
        case 'subtract': newBet = currentBet - amount; break;
        case 'multiply': newBet = Math.floor(currentBet * amount); break;
        case 'divide': newBet = Math.floor(currentBet / amount); break;
        case 'min': newBet = minBet; break;
        case 'max': newBet = maxBet; break;
        case 'set': newBet = amount; break; // Directly set the value (e.g., from input change)
    }

    // Clamp the new bet between min and max
    newBet = Math.max(minBet, newBet);
    // Don't allow setting bet higher than max, unless it's the 'min' operation or currency is 0
    if (operation !== 'min' && currency > 0) {
        newBet = Math.min(maxBet, newBet);
    }
    // If max bet is less than min bet (e.g., currency is 0), force to min bet
    if (maxBet < minBet) {
        newBet = minBet;
    }
    // Ensure result is not NaN
    if(isNaN(newBet)) {
        newBet = minBet;
    }

    inputElement.value = newBet; // Update the input field
    playSound('click'); // Play click sound for bet adjustment
}

// --- ATM / Loan Logic ---
function openAtmModal() {
    if (!atmModalOverlay || !atmModal) return;
    playSound('click');
    atmModalOverlay.classList.remove('hidden');
    atmModal.classList.remove('hidden');
}
function closeAtmModal() {
     if (!atmModalOverlay || !atmModal) return;
    playSound('click');
    atmModalOverlay.classList.add('hidden');
    atmModal.classList.add('hidden');
}


// --- Event Listeners (Shared) ---

// Loan/ATM Buttons
if (loanButton) loanButton.addEventListener('click', openAtmModal);
if (atmCloseButton) atmCloseButton.addEventListener('click', closeAtmModal);
if (atmModalOverlay) atmModalOverlay.addEventListener('click', closeAtmModal); // Close on overlay click
if (atmButtons) {
    atmButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.dataset.amount);
            if (isNaN(amount) || amount <= 0) return;
            startTone(); // Ensure audio context
            playSound('loan');
            currency += amount;
            totalLoanAmount += amount; // Increase loan balance
            updateCurrencyDisplay('win'); // Flash green for getting money
            saveGameState();
            showMessage(`Withdrew ${amount}! Loan balance increased.`, 2000);
            closeAtmModal();
        });
    });
}
if (payLoanButton) {
    payLoanButton.addEventListener('click', () => {
        if (currency >= totalLoanAmount && totalLoanAmount > 0) {
            startTone();
            playSound('click'); // Or a specific pay sound
            const paidAmount = totalLoanAmount;
            currency -= totalLoanAmount;
            totalLoanAmount = 0; // Clear loan
            updateCurrencyDisplay('loss'); // Flash red for spending money
            saveGameState();
            showMessage(`Loan of ${paidAmount} paid off!`, 2000);
        } else {
            showMessage(`Not enough funds to pay off loan! Need ${totalLoanAmount}.`, 2000);
        }
    });
}

// Tab Switching (Add Plinko Tab Listener)
if (tabSlots) tabSlots.addEventListener('click', () => setActiveTab(tabSlots));
if (tabCrash) tabCrash.addEventListener('click', () => setActiveTab(tabCrash));
if (tabCoinflip) tabCoinflip.addEventListener('click', () => setActiveTab(tabCoinflip));
if (tabMinefield) tabMinefield.addEventListener('click', () => setActiveTab(tabMinefield));
if (tabMemory) tabMemory.addEventListener('click', () => setActiveTab(tabMemory));
if (tabHorserace) tabHorserace.addEventListener('click', () => setActiveTab(tabHorserace));
if (tabRoulette) tabRoulette.addEventListener('click', () => setActiveTab(tabRoulette));
if (tabBlackjack) tabBlackjack.addEventListener('click', () => setActiveTab(tabBlackjack));
if (tabPlinko) tabPlinko.addEventListener('click', () => setActiveTab(tabPlinko)); // Added Plinko listener

// Generic Bet Adjustment Listener Factory (to be called from game-specific files)
function addBetAdjustmentListeners(gamePrefix, betInputElement) {
    const decrease10Btn = document.getElementById(`${gamePrefix}-bet-decrease-10`);
    const decrease1Btn = document.getElementById(`${gamePrefix}-bet-decrease-1`);
    const increase1Btn = document.getElementById(`${gamePrefix}-bet-increase-1`);
    const increase10Btn = document.getElementById(`${gamePrefix}-bet-increase-10`);
    const minBtn = document.getElementById(`${gamePrefix}-bet-min`);
    const halfBtn = document.getElementById(`${gamePrefix}-bet-half`);
    const doubleBtn = document.getElementById(`${gamePrefix}-bet-double`);
    const maxBtn = document.getElementById(`${gamePrefix}-bet-max`);

    // Add listeners only if the buttons exist
    if (decrease10Btn) decrease10Btn.addEventListener('click', () => adjustBet(betInputElement, 10, 'subtract'));
    if (decrease1Btn) decrease1Btn.addEventListener('click', () => adjustBet(betInputElement, 1, 'subtract'));
    if (increase1Btn) increase1Btn.addEventListener('click', () => adjustBet(betInputElement, 1, 'add'));
    if (increase10Btn) increase10Btn.addEventListener('click', () => adjustBet(betInputElement, 10, 'add'));
    if (minBtn) minBtn.addEventListener('click', () => adjustBet(betInputElement, 1, 'min'));
    if (halfBtn) halfBtn.addEventListener('click', () => adjustBet(betInputElement, 2, 'divide'));
    if (doubleBtn) doubleBtn.addEventListener('click', () => adjustBet(betInputElement, 2, 'multiply'));
    if (maxBtn) maxBtn.addEventListener('click', () => adjustBet(betInputElement, currency, 'max'));

    // Update bet on manual input change, clamping to valid range
    if (betInputElement) {
        betInputElement.addEventListener('change', () => {
            let value = parseInt(betInputElement.value);
            if(isNaN(value)) value = 1; // Default to min if invalid input
            adjustBet(betInputElement, value, 'set');
        });
         // Prevent non-numeric input
         betInputElement.addEventListener('input', () => {
            // Allow only digits
            betInputElement.value = betInputElement.value.replace(/[^0-9]/g, '');
         });
    } else {
        console.warn(`Bet input not found for prefix: ${gamePrefix}`);
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing Brokie Casino...");
    loadGameState(); // Load saved progress first

    // Initialize Tone.js on first user interaction anywhere on the body
    // We add it here, but startTone() is called on first click or game action
    document.body.addEventListener('click', startTone, { once: true });
    document.body.addEventListener('keydown', startTone, { once: true }); // Also init on keydown

    // Set the initial active tab (e.g., Slots)
    if (tabSlots) { // Check if default tab exists
         setActiveTab(tabSlots);
    } else {
         console.error("Default tab (Slots) not found!");
         // Optionally set another tab as default or handle error
    }

    // --- Call Initialization functions from game-specific files ---
    // These functions should exist in their respective JS files (e.g., slots.js, crash.js)
    // They will handle getting elements and setting up listeners for that specific game.
    if (typeof initSlots === 'function') initSlots(); else console.warn("initSlots not found.");
    if (typeof initCrash === 'function') initCrash(); else console.warn("initCrash not found.");
    if (typeof initCoinflip === 'function') initCoinflip(); else console.warn("initCoinflip not found.");
    if (typeof initMinefield === 'function') initMinefield(); else console.warn("initMinefield not found.");
    if (typeof initMemory === 'function') initMemory(); else console.warn("initMemory not found.");
    if (typeof initHorserace === 'function') initHorserace(); else console.warn("initHorserace not found.");
    if (typeof initRoulette === 'function') initRoulette(); else console.warn("initRoulette not found.");
    if (typeof initBlackjack === 'function') initBlackjack(); else console.warn("initBlackjack not found.");
    if (typeof initPlinko === 'function') initPlinko(); else console.warn("initPlinko not found."); // Added Plinko Init Call
    // --- End Game Initializations ---

    // Trigger entrance animations for cards (can be kept here)
    const cards = document.querySelectorAll('.grid-col-1 > div, .grid-col-2 > div, .grid-col-about');
    cards.forEach((card, index) => {
        // Ensure the 'animate-card-enter' class is present if defined in CSS
        if (card.classList.contains('animate-card-enter')) {
             card.style.animationDelay = `${index * 0.05}s`; // Stagger animation
        }
    });

    console.log("Brokie Casino Initialized.");
});