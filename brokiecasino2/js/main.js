/**

 * ==========================================================================

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

 * ==========================================================================

 */
// --- Global State ---
let currency = 500;
let totalLoanAmount = 0;
let leaderboard = []; // Array to store { type: 'GameName', win: 150 }
let totalGain = 0;
let totalLoss = 0;
const MAX_LEADERBOARD_ENTRIES = 5;
let animationFrameId = null; // For potential shared animations (if any) - currently unused but good practice
// --- Sound State & Management ---
let toneStarted = false;
let synth, polySynth, noiseSynth; // Declare synth variables globally
/**

 * Initializes Tone.js audio context on the first user interaction.

 * This is required by modern browsers to prevent unsolicited audio.

 */
async function startTone() {
    // Only run once and if Tone library is loaded
    if (!toneStarted && typeof Tone !== 'undefined') {
        try {
            await Tone.start(); // Request audio context start
            console.log("AudioContext started successfully.");
            toneStarted = true;
            // Initialize synths *after* Tone.start() has successfully run
            // Basic Synth for single notes
            synth = new Tone.Synth().toDestination();
            // PolySynth for chords (multiple notes at once)
            polySynth = new Tone.PolySynth(Tone.Synth).toDestination();
            polySynth.volume.value = -8; // Lower volume slightly
            // NoiseSynth for effects like spin start, crash explode
            noiseSynth = new Tone.NoiseSynth({
                noise: {
                    type: 'white'
                }, // Or 'pink', 'brown'
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0
                } // Short envelope
            }).toDestination();
            noiseSynth.volume.value = -20; // Lower volume significantly
        } catch (e) {
            console.error("Failed to start AudioContext:", e);
            // Optionally show a message to the user that sound won't work
            showMessage("Audio could not be initialized.", 2000);
        }
    }
}
/**

 * Plays a specific sound effect using initialized Tone.js synths.

 * @param {string} type - The identifier for the sound effect (e.g., 'win_small', 'click').

 * @param {number | object} [value=0] - Optional value, sometimes used for pitch or timing variations (e.g., multiplier for crash_tick, index for reel_stop).

 */
function playSound(type, value = 0) {
    // Ensure Tone has started and synths are initialized before playing
    if (!toneStarted || !synth || !polySynth || !noiseSynth) {
        console.warn("Attempted to play sound before audio initialized:", type);
        return; // Don't attempt to play if not ready
    }
    const now = Tone.now(); // Get the current time in the audio context
    try {
        // Extract index if value is an object containing it (used for reel_stop)
        let index = typeof value === 'object' && value !== null && value.index !== undefined ? value.index : 0;
        // --- Sound Definitions ---
        switch (type) {
            // General UI / Win/Loss
            case 'win_small':
                polySynth.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
                break; // Simple C major chord
            case 'win_medium':
                polySynth.triggerAttackRelease(["C5", "E5", "G5"], "4n", now);
                break; // Higher C major chord
            case 'win_big':
                polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5", "E5", "G5"], "2n", now);
                break; // Fuller C major chord
            case 'lose':
                synth.triggerAttackRelease("C3", "4n", now);
                break; // Low C note
            case 'loan':
                synth.triggerAttackRelease("A4", "8n", now);
                break; // Loan/ATM sound
            case 'click':
                synth.triggerAttackRelease("C5", "16n", now + 0.01);
                break; // Quick high C for clicks
                // --- Game Specific Sounds ---
                // Slots
            case 'spin_start':
                noiseSynth.triggerAttackRelease("8n", now);
                break; // Short burst of noise
            case 'reel_stop':
                synth.triggerAttackRelease("A3", "16n", now + index * 0.05);
                break; // Staggered low A notes based on reel index
                // Crash
                // Play higher ticks as multiplier increases (example logic)
            case 'crash_tick':
                if (value > 5) synth.triggerAttackRelease("E6", "32n", now);
                else if (value > 2) synth.triggerAttackRelease("C6", "32n", now);
                break;
            case 'crash_cashout':
                polySynth.triggerAttackRelease(["G4", "C5", "E5"], "4n", now);
                break; // Positive cashout sound
            case 'crash_explode':
                polySynth.triggerAttackRelease(["C2", "E2", "G#2"], "2n", now); // Low dissonant chord
                noiseSynth.triggerAttackRelease("2n", now + 0.05); // Longer noise burst
                break;
                // Coin Flip
            case 'coin_flip':
                synth.triggerAttackRelease("A4", "16n", now);
                break; // Simple flip sound
                // Minefield
            case 'mine_reveal':
                synth.triggerAttackRelease("C5", "16n", now + 0.02);
                break; // Safe reveal click
            case 'mine_bomb':
                polySynth.triggerAttackRelease(["C3", "D#3", "A3"], "4n", now);
                break; // Dissonant bomb sound
                // Memory
            case 'memory_flip':
                synth.triggerAttackRelease("E5", "16n", now + 0.01);
                break; // Card flip sound
            case 'memory_match':
                polySynth.triggerAttackRelease(["C5", "G5"], "8n", now);
                break; // Simple match sound (perfect fifth)
            case 'memory_mismatch':
                synth.triggerAttackRelease("A3", "8n", now);
                break; // Mismatch sound
            case 'memory_win':
                polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5", "E5"], "2n", now);
                break; // Game win sound
            case 'memory_lose':
                polySynth.triggerAttackRelease(["C3", "E3", "G3"], "2n", now);
                break; // Game lose sound
                // Horse Race
            case 'race_start':
                noiseSynth.triggerAttackRelease("4n", now);
                break; // Starting gun noise
            case 'race_win':
                polySynth.triggerAttackRelease(["C4", "G4", "C5", "E5"], "1n", now);
                break; // Fanfare win sound
            case 'race_step':
                noiseSynth.triggerAttackRelease("64n", now);
                break; // Very short noise clicks for steps
                // Roulette
            case 'roulette_spin':
                noiseSynth.triggerAttackRelease("1n", now);
                break; // Wheel spinning noise
            case 'roulette_ball':
                synth.triggerAttackRelease("G5", "32n", now);
                break; // Ball clicking sound
            case 'roulette_win':
                polySynth.triggerAttackRelease(["D4", "F#4", "A4", "D5"], "2n", now);
                break; // D major win sound
                // Blackjack
            case 'blackjack_deal':
                polySynth.triggerAttackRelease(["C4", "E4"], "16n", now);
                break; // Dealing cards sound
            case 'blackjack_hit':
                synth.triggerAttackRelease("D4", "16n", now + 0.01);
                break; // Hit sound
            case 'blackjack_bust':
                synth.triggerAttackRelease("A2", "4n", now);
                break; // Bust sound (low)
            case 'blackjack_win':
                polySynth.triggerAttackRelease(["C4", "G4", "C5"], "4n", now);
                break; // Win sound
            case 'blackjack_push':
                synth.triggerAttackRelease("E4", "8n", now);
                break; // Push sound
            case 'blackjack_blackjack':
                polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n", now);
                break; // Big Blackjack win sound
                // Plinko
            case 'plinko_drop':
                synth.triggerAttackRelease("E5", "16n", now);
                break; // Ball drop sound
            case 'plinko_peg_hit':
                synth.triggerAttackRelease("A5", "64n", now + Math.random() * 0.02);
                break; // Peg hit sound (slightly random)
            case 'plinko_win_low':
                polySynth.triggerAttackRelease(["C4", "E4"], "16n", now);
                break; // Low win sound
            case 'plinko_win_high':
                polySynth.triggerAttackRelease(["C5", "G5"], "8n", now);
                break; // High win sound
        }
    } catch (error) {
        console.error("Tone.js error playing sound:", type, error);
    }
}
// --- DOM Elements (Shared) ---
// Select all potentially needed elements, checking for existence later
const currencyDisplay = document.getElementById('currency-display');
const loanBalanceDisplay = document.getElementById('loan-balance-display');
const loanButton = document.getElementById('loan-button'); // Now used for ATM
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
const tabPlinko = document.getElementById('tab-plinko');
const gameSlots = document.getElementById('game-slots');
const gameCrash = document.getElementById('game-crash');
const gameCoinflip = document.getElementById('game-coinflip');
const gameMinefield = document.getElementById('game-minefield');
const gameMemory = document.getElementById('game-memory');
const gameHorserace = document.getElementById('game-horserace');
const gameRoulette = document.getElementById('game-roulette');
const gameBlackjack = document.getElementById('game-blackjack');
const gamePlinko = document.getElementById('game-plinko');
// Collect tabs and areas into arrays for easier iteration
const allTabs = [tabSlots, tabCrash, tabCoinflip, tabMinefield, tabMemory, tabHorserace, tabRoulette, tabBlackjack, tabPlinko].filter(el => el !== null);
const allGameAreas = [gameSlots, gameCrash, gameCoinflip, gameMinefield, gameMemory, gameHorserace, gameRoulette, gameBlackjack, gamePlinko].filter(el => el !== null);
// ATM Modal
const atmModalOverlay = document.getElementById('atm-modal-overlay');
const atmModal = document.getElementById('atm-modal');
const atmCloseButton = document.getElementById('atm-close-button');
const atmButtons = atmModal ? atmModal.querySelectorAll('.atm-button') : []; // Check if modal exists before querying
// Stats
const statsTotalGain = document.getElementById('stats-total-gain');
const statsTotalLoss = document.getElementById('stats-total-loss');
const statsNetProfit = document.getElementById('stats-net-profit');
// --- Core Functions ---
/**

 * Updates the enabled/disabled state of the 'Pay Loan' button based on current currency and loan amount.

 */
function updatePayLoanButtonState() {
    if (!payLoanButton) return; // Check if element exists
    // Can pay if loan exists and currency is sufficient to pay it IN FULL
    const canPay = totalLoanAmount > 0 && currency >= totalLoanAmount;
    payLoanButton.disabled = !canPay;
}
/**

 * Briefly highlights an element with a pulse animation using Tailwind class.

 * @param {HTMLElement} element - The DOM element to flash.

 */
function flashElement(element) {
    if (!element) return;
    element.classList.add('animate-pulse'); // Use Tailwind's pulse
    setTimeout(() => {
        element.classList.remove('animate-pulse');
    }, 600); // Duration approx matches Tailwind's default pulse
}
/**

 * Updates the session statistics display in the UI (Total Gain, Total Loss, Net Profit).

 * Also applies appropriate color classes to Net Profit.

 */
function updateStatsDisplay() {
    if (!statsTotalGain || !statsTotalLoss || !statsNetProfit) return; // Check elements exist
    // Update text content with formatted numbers
    statsTotalGain.textContent = totalGain.toLocaleString();
    statsTotalLoss.textContent = totalLoss.toLocaleString();
    const net = totalGain - totalLoss;
    statsNetProfit.textContent = net.toLocaleString();
    // Apply color based on net profit/loss using CSS classes defined in style.css
    statsNetProfit.className = 'stats-value font-semibold text-fluent-text-primary'; // Reset classes first
    if (net > 0) {
        statsNetProfit.classList.replace('text-fluent-text-primary', 'text-fluent-accent');
    } else if (net < 0) {
        statsNetProfit.classList.replace('text-fluent-text-primary', 'text-fluent-danger');
    }
    // else it remains text-fluent-text-primary
}
/**

 * Flashes the currency display green for a win, red for a loss using CSS classes.

 * @param {'win' | 'loss'} type - The type of change ('win' or 'loss').

 */
function flashCurrency(type) {
    if (!currencyDisplay) return; // Check element exists
    currencyDisplay.classList.remove('flash-win', 'flash-loss');
    // Force reflow to ensure the class removal is registered before adding it again
    void currencyDisplay.offsetWidth;
    if (type === 'win') {
        currencyDisplay.classList.add('flash-win');
    } else if (type === 'loss') {
        currencyDisplay.classList.add('flash-loss');
    }
    // Remove the animation class after it completes (duration defined in CSS)
    setTimeout(() => {
        currencyDisplay.classList.remove('flash-win', 'flash-loss');
    }, 600); // Match CSS animation duration
}
/**

 * Updates the currency and loan balance displays in the UI.

 * Calls functions to update related UI elements (loan buttons, stats).

 * Optionally flashes the currency display based on the change type.

 * @param {'win' | 'loss' | null} [changeType=null] - Type of change for flashing effect.

 */
function updateCurrencyDisplay(changeType = null) {
    if (currencyDisplay) currencyDisplay.textContent = currency.toLocaleString();
    if (loanBalanceDisplay) loanBalanceDisplay.textContent = totalLoanAmount.toLocaleString();
    updatePayLoanButtonState(); // Update pay loan button based on new balance/loan
    updateStatsDisplay(); // Update stats display
    if (changeType) { // If a change type is provided, flash the display
        flashCurrency(changeType);
    }
}
/**

 * Shows a temporary message notification at the bottom of the screen.

 * @param {string} text - The message to display.

 * @param {number} [duration=3000] - How long the message stays visible in milliseconds.

 */
function showMessage(text, duration = 3000) {
    if (!messageBox) return; // Check if message box element exists
    messageBox.textContent = text;
    messageBox.classList.add('show'); // Add 'show' class (CSS handles the transition)
    // Set a timer to remove the 'show' class after the specified duration
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}
/**

 * Formats a number for display, typically for winnings or large currency amounts.

 * Uses toLocaleString for basic comma separation.

 * @param {number} amount - The number to format.

 * @returns {string} The formatted number string. Returns '0' if input is invalid.

 */
function formatWin(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn("Invalid amount passed to formatWin:", amount);
        return '0'; // Return '0' for invalid input
    }
    return amount.toLocaleString(); // Use browser's locale formatting
}
/**

 * Adds a win entry to the leaderboard state, sorts it, trims it, saves state,

 * and updates the UI display.

 * @param {string} type - The type of game or win (e.g., 'Slots', 'Crash').

 * @param {number} winAmount - The amount won. Must be positive.

 */
function addWinToLeaderboard(type, winAmount) {
    if (winAmount <= 0) return; // Only add actual positive wins
    leaderboard.push({
        type: type,
        win: winAmount
    }); // Add new win object
    leaderboard.sort((a, b) => b.win - a.win); // Sort descending by win amount
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES); // Keep only top entries
    saveGameState(); // Save the updated leaderboard
    updateLeaderboardDisplay(); // Update the UI to reflect changes
}
/**

 * Updates the leaderboard list element in the UI based on the current leaderboard state.

 * Clears the existing list and repopulates it. Adds animation class for new entries.

 */
function updateLeaderboardDisplay() {
    if (!leaderboardList) return; // Check if the list element exists
    // Store current text content to detect new entries for animation
    const oldListContent = Array.from(leaderboardList.children).map(li => li.textContent);
    leaderboardList.innerHTML = ''; // Clear the existing list items
    if (leaderboard.length === 0) {
        // Display placeholder if leaderboard is empty
        leaderboardList.innerHTML = '<li class="italic text-sm text-fluent-text-secondary">No significant wins yet!</li>';
        return;
    }
    // Create and append list items for each entry
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        const entryText = `${entry.type}: ${formatWin(entry.win)}`; // For checking if it's new
        li.className = 'flex justify-between items-center text-sm py-1'; // Base classes
        // Check if this entry is new compared to the old list content
        if (!oldListContent.some(oldText => oldText.includes(entryText))) {
            li.classList.add('leaderboard-entry-new'); // Add animation class
            li.style.animationDelay = `${index * 0.05}s`; // Stagger animation start
        }
        // Set the inner HTML with game type and formatted win amount
        li.innerHTML = `

            <span class="font-medium text-fluent-text-secondary">${entry.type}</span>

            <span class="text-fluent-accent font-semibold">+${formatWin(entry.win)}</span>

        `; // Use theme colors
        leaderboardList.appendChild(li);
    });
}
/**

 * Saves the current essential game state (currency, loan, leaderboard, stats) to localStorage.

 * Uses a try-catch block to handle potential storage errors.

 */
function saveGameState() {
    try {
        localStorage.setItem('brokieCasinoState', JSON.stringify({
            currency: currency,
            leaderboard: leaderboard,
            totalLoanAmount: totalLoanAmount,
            totalGain: totalGain,
            totalLoss: totalLoss,
        }));
    } catch (e) {
        console.error("Error saving game state:", e);
        showMessage("Could not save game progress.", 2000); // Notify user
    }
}
/**

 * Loads the game state from localStorage upon page load.

 * Includes error handling and defaults if loading fails or data is missing/invalid.

 * Updates the UI after loading.

 */
function loadGameState() {
    const savedState = localStorage.getItem('brokieCasinoState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            // Load values, providing defaults if missing or invalid
            currency = (state.currency !== undefined && !isNaN(state.currency)) ? state.currency : 500;
            leaderboard = Array.isArray(state.leaderboard) ? state.leaderboard : [];
            totalLoanAmount = (state.totalLoanAmount !== undefined && !isNaN(state.totalLoanAmount)) ? state.totalLoanAmount : 0;
            totalGain = (state.totalGain !== undefined && !isNaN(state.totalGain)) ? state.totalGain : 0;
            totalLoss = (state.totalLoss !== undefined && !isNaN(state.totalLoss)) ? state.totalLoss : 0;
        } catch (e) {
            console.error("Error loading saved state:", e);
            // Reset to defaults if parsing fails
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
    // Update all relevant UI elements after loading state
    updateCurrencyDisplay();
    updateLeaderboardDisplay();
    updateStatsDisplay(); // Also updates net profit color
}
/**

 * Switches the active game tab and view.

 * Handles stopping/resetting the previous game and initializing/resetting the new game.

 * Manages visibility and opacity transitions for game areas.

 * @param {HTMLElement} selectedTab - The tab button element that was clicked.

 */
function setActiveTab(selectedTab) {
    if (!selectedTab) return;
    // --- Call reset/stop functions for the *previously* active game ---
    const currentActiveTab = allTabs.find(tab => tab && tab.getAttribute('aria-current') === 'page');
    if (currentActiveTab && currentActiveTab !== selectedTab) {
        // Check if game-specific stop/reset functions exist and call them
        if (currentActiveTab === tabSlots && typeof stopAutoSpin === 'function') {
            stopAutoSpin();
        }
        if (currentActiveTab === tabCrash && typeof endCrashGame === 'function' && typeof crashGameActive !== 'undefined' && crashGameActive) {
            endCrashGame(true, 0, true); /* Args: crashed, multiplier, silent */
        }
        if (currentActiveTab === tabCoinflip && typeof resetCoinFlip === 'function' && typeof coinFlipActive !== 'undefined' && coinFlipActive) {
            resetCoinFlip();
        }
        if (currentActiveTab === tabMinefield && typeof resetMinefield === 'function' && typeof minefieldActive !== 'undefined' && minefieldActive) {
            resetMinefield();
        }
        if (currentActiveTab === tabMemory && typeof resetMemoryGame === 'function' && typeof memoryActive !== 'undefined' && memoryActive) {
            resetMemoryGame();
        }
        if (currentActiveTab === tabHorserace && typeof resetHorserace === 'function' && typeof horseraceActive !== 'undefined' && horseraceActive) {
            resetHorserace();
        }
        if (currentActiveTab === tabRoulette && typeof resetRoulette === 'function' && typeof rouletteIsSpinning !== 'undefined' && rouletteIsSpinning) {
            resetRoulette(true); /* Pass true to reset wheel visually immediately */
        }
        if (currentActiveTab === tabBlackjack && typeof resetBlackjack === 'function' && typeof blackjackActive !== 'undefined' && blackjackActive) {
            resetBlackjack(true); /* Arg: isSwitchingTabs */
        }
        if (currentActiveTab === tabPlinko && typeof resetPlinko === 'function' && typeof plinkoActive !== 'undefined' && plinkoActive) {
            resetPlinko();
        }
    }
    // --- Switch Tab Visuals and Game Area Visibility ---
    allTabs.forEach((tab, index) => {
        if (!tab) return; // Skip if tab element doesn't exist
        const gameArea = allGameAreas[index];
        if (!gameArea) return; // Skip if corresponding game area doesn't exist
        if (tab === selectedTab) {
            // Activate the selected tab
            tab.setAttribute('aria-current', 'page');
            gameArea.classList.remove('hidden'); // Make area potentially visible
            // Use requestAnimationFrame to ensure 'hidden' removal is processed before opacity transition starts
            requestAnimationFrame(() => {
                gameArea.classList.remove('opacity-0');
                gameArea.classList.add('opacity-100'); // Fade in
            });
            // --- Initialize/Reset Newly Active Game (if needed) ---
            if (tab === tabCrash && typeof resetCrashVisuals === 'function' && (typeof crashGameActive === 'undefined' || !crashGameActive)) {
                resetCrashVisuals();
            }
            if (tab === tabHorserace && typeof createHorses === 'function' && !document.querySelector('#horserace-track .horse')) {
                createHorses();
                if (typeof resetHorserace === 'function') resetHorserace();
            }
            if (tab === tabRoulette && typeof createRouletteBettingGrid === 'function' && !document.querySelector('#roulette-inside-bets button')) {
                createRouletteBettingGrid();
                if (typeof resetRoulette === 'function') resetRoulette(false);
            } // Reset without visual wheel reset
            if (tab === tabBlackjack && typeof resetBlackjack === 'function' && (typeof blackjackActive === 'undefined' || !blackjackActive)) {
                resetBlackjack(false); /* Arg: isSwitchingTabs = false */
            }
            if (tab === tabPlinko && typeof resetPlinko === 'function' && (typeof plinkoActive === 'undefined' || !plinkoActive)) {
                resetPlinko();
            }
            if (tab === tabSlots && typeof updateSlotsPayoutDisplay === 'function') {
                updateSlotsPayoutDisplay();
            } // Update payouts on tab switch
        } else {
            // Deactivate other tabs
            tab.removeAttribute('aria-current');
            gameArea.classList.remove('opacity-100'); // Start fade out
            gameArea.classList.add('opacity-0');
            // Hide the element completely after the fade-out transition (duration matches CSS)
            setTimeout(() => {
                // Double-check it wasn't re-selected quickly before hiding
                if (tab.getAttribute('aria-current') !== 'page') {
                    gameArea.classList.add('hidden');
                }
            }, 300); // Match CSS transition duration
        }
    });
    // playSound('click'); // Play click sound for tab switch
}
/**

 * Adjusts the value of a bet input field based on a specified operation.

 * Handles min/max bet logic based on current currency.

 * @param {HTMLInputElement} inputElement - The bet input field element.

 * @param {number} amount - The amount for the operation (e.g., 10 for add/subtract, 2 for multiply/divide).

 * @param {'add'|'subtract'|'multiply'|'divide'|'min'|'max'|'set'} operation - The operation type.

 */
function adjustBet(inputElement, amount, operation) {
    if (!inputElement) {
        console.error("adjustBet called with invalid inputElement");
        return;
    }
    let currentBet = parseInt(inputElement.value);
    // Default to 1 if input is empty or invalid
    if (isNaN(currentBet) || currentBet < 1) currentBet = 1;
    let newBet = currentBet;
    const minBet = 1;
    // Max bet is the current currency, but not less than min bet
    const maxBet = Math.max(minBet, currency);
    // Perform the requested operation
    switch (operation) {
        case 'add':
            newBet = currentBet + amount;
            break;
        case 'subtract':
            newBet = currentBet - amount;
            break;
        case 'multiply':
            newBet = Math.floor(currentBet * amount);
            break; // Use floor to keep integer bets
        case 'divide':
            newBet = Math.floor(currentBet / amount);
            break; // Use floor
        case 'min':
            newBet = minBet;
            break;
        case 'max':
            newBet = maxBet;
            break;
        case 'set':
            newBet = amount;
            break; // Directly set the value
        default:
            console.warn("Invalid operation in adjustBet:", operation);
            return;
    }
    // Clamp the new bet between min and max allowed values
    newBet = Math.max(minBet, newBet); // Ensure at least minBet
    // Only clamp to maxBet if the user actually has currency
    if (currency > 0) {
        newBet = Math.min(maxBet, newBet);
    } else {
        newBet = minBet; // If broke, bet resets to min
    }
    // Handle potential NaN if operations result in invalid numbers
    if (isNaN(newBet)) {
        newBet = minBet;
    }
    inputElement.value = newBet; // Update the input field value
    playSound('click'); // Play sound feedback
}
// --- ATM / Loan Logic ---
/** Opens the ATM modal with transitions. */
function openAtmModal() {
    if (!atmModalOverlay || !atmModal) return;
    playSound('click');
    atmModalOverlay.classList.remove('hidden');
    atmModal.classList.remove('hidden');
    // Use requestAnimationFrame to ensure display change happens before transition starts
    requestAnimationFrame(() => {
        atmModalOverlay.classList.add('opacity-100');
        atmModal.classList.add('opacity-100', 'scale-100'); // Add scale for effect
    });
}
/** Closes the ATM modal with transitions. */
function closeAtmModal() {
    if (!atmModalOverlay || !atmModal) return;
    playSound('click');
    atmModalOverlay.classList.remove('opacity-100');
    atmModal.classList.remove('opacity-100', 'scale-100');
    // Wait for transitions to finish before hiding
    setTimeout(() => {
        atmModalOverlay.classList.add('hidden');
        atmModal.classList.add('hidden');
    }, 300); // Match CSS transition duration (e.g., duration-300)
}
// --- Event Listeners Setup ---
/** Sets up all the main event listeners for shared UI elements. */
function setupMainEventListeners() {
    // Loan Button (now acts as ATM button)
    if (loanButton) loanButton.addEventListener('click', openAtmModal);
    // ATM Modal Buttons & Closing
    if (atmCloseButton) atmCloseButton.addEventListener('click', closeAtmModal);
    if (atmModalOverlay) atmModalOverlay.addEventListener('click', closeAtmModal); // Click outside to close
    if (atmButtons) {
        atmButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = parseInt(button.dataset.amount);
                if (isNaN(amount) || amount <= 0) return;
                currency += amount; // Increase currency
                totalLoanAmount += amount; // Increase loan amount
                updateCurrencyDisplay('win'); // Update UI, flash green
                saveGameState(); // Persist changes
                showMessage(`Withdrew ${formatWin(amount)}! Loan balance increased.`, 2000);
                closeAtmModal(); // Close the modal
            });
        });
    }
    // Pay Loan Button
    if (payLoanButton) {
        payLoanButton.addEventListener('click', () => {
            if (totalLoanAmount <= 0) {
                showMessage("No loan to pay off.", 1500);
                return;
            }
            if (currency >= totalLoanAmount) { // Check if enough to pay full amount
                startTone();
                playSound('click');
                const paidAmount = totalLoanAmount;
                currency -= totalLoanAmount; // Deduct full loan amount
                totalLoanAmount = 0; // Clear loan
                updateCurrencyDisplay('loss'); // Update UI, flash red
                saveGameState();
                showMessage(`Loan of ${formatWin(paidAmount)} paid off!`, 2000);
            } else {
                showMessage(`Not enough funds to pay off loan! Need ${formatWin(totalLoanAmount)}.`, 2000);
            }
        });
    }
    // Tab Switching Logic
    allTabs.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', (e) => {
                setActiveTab(e.currentTarget); // Pass the clicked button element
            });
        }
    });
    // Listener to start Tone.js on first interaction anywhere
    document.body.addEventListener('click', startTone, {
        once: true
    });
    document.body.addEventListener('keydown', startTone, {
        once: true
    });
}
// --- Generic Bet Adjustment Listener Factory ---
/**

 * Attaches event listeners to a set of bet adjustment buttons for a specific game.

 * @param {string} gamePrefix - The prefix used in the button IDs (e.g., 'slots', 'crash').

 * @param {HTMLInputElement} betInputElement - The specific input element for this game's bet.

 */
function addBetAdjustmentListeners(gamePrefix, betInputElement) {
    // Select all potential buttons using the prefix
    const decrease10Btn = document.getElementById(`${gamePrefix}-bet-decrease-10`);
    const decrease1Btn = document.getElementById(`${gamePrefix}-bet-decrease-1`);
    const increase1Btn = document.getElementById(`${gamePrefix}-bet-increase-1`);
    const increase10Btn = document.getElementById(`${gamePrefix}-bet-increase-10`);
    const minBtn = document.getElementById(`${gamePrefix}-bet-min`);
    const halfBtn = document.getElementById(`${gamePrefix}-bet-half`);
    const doubleBtn = document.getElementById(`${gamePrefix}-bet-double`);
    const maxBtn = document.getElementById(`${gamePrefix}-bet-max`);
    if (!betInputElement) {
        console.warn(`Bet input not found for prefix: ${gamePrefix}`);
        return; // Exit if the core input element is missing
    }
    // Add listeners only if the button exists
    if (decrease10Btn) decrease10Btn.addEventListener('click', () => adjustBet(betInputElement, 10, 'subtract'));
    if (decrease1Btn) decrease1Btn.addEventListener('click', () => adjustBet(betInputElement, 1, 'subtract'));
    if (increase1Btn) increase1Btn.addEventListener('click', () => adjustBet(betInputElement, 1, 'add'));
    if (increase10Btn) increase10Btn.addEventListener('click', () => adjustBet(betInputElement, 10, 'add'));
    if (minBtn) minBtn.addEventListener('click', () => adjustBet(betInputElement, 1, 'min'));
    if (halfBtn) halfBtn.addEventListener('click', () => adjustBet(betInputElement, 2, 'divide'));
    if (doubleBtn) doubleBtn.addEventListener('click', () => adjustBet(betInputElement, 2, 'multiply'));
    if (maxBtn) maxBtn.addEventListener('click', () => adjustBet(betInputElement, currency, 'max'));
    // Add listener to the input field itself for validation on change/input
    if (betInputElement) {
        // Validate on 'change' (when focus is lost or Enter is pressed)
        betInputElement.addEventListener('change', () => {
            let value = parseInt(betInputElement.value);
            if (isNaN(value) || value < 1) value = 1; // Default to 1 if invalid
            adjustBet(betInputElement, value, 'set'); // Use adjustBet to clamp the value
        });
        // Optional: Prevent non-numeric input directly (can sometimes interfere with pasting)
        betInputElement.addEventListener('input', () => {
            betInputElement.value = betInputElement.value.replace(/[^0-9]/g, '');
        });
    }
}
// --- Global Access Object ---
// Define BrokieAPI object *before* DOMContentLoaded listener finishes
// This ensures it's available when game init functions are called
const BrokieAPI = {
    // State Accessors
    getBalance: () => currency,
    getLoanAmount: () => totalLoanAmount,
    // State Modifiers (ensure validation and UI updates)
    updateBalance: (amountChange) => {
        const previousBalance = currency;
        currency += amountChange;
        if (currency < 0) currency = 0; // Prevent negative balance
        // Update stats based on the change
        if (amountChange > 0) {
            totalGain += amountChange;
        } else if (amountChange < 0) {
            totalLoss += Math.abs(amountChange);
        }
        updateCurrencyDisplay(amountChange > 0 ? 'win' : (amountChange < 0 ? 'loss' : null));
        saveGameState(); // Save after every balance change
        return currency; // Return the new balance
    },
    addWin: (gameName, winAmount) => {
        if (winAmount > 0) {
            addWinToLeaderboard(gameName, winAmount);
            // Balance update should happen separately where the win is awarded
        }
    },
    // Utilities
    showMessage: showMessage,
    playSound: playSound,
    startTone: startTone, // Allow games to potentially trigger Tone start if needed
    formatWin: formatWin,
    addBetAdjustmentListeners: addBetAdjustmentListeners // Make factory function available
};
// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing Brokie Casino...");
    loadGameState(); // Load saved state first
    setupMainEventListeners(); // Setup listeners for main UI elements
    // Set the initial active tab (e.g., Slots)
    if (tabSlots) {
        setActiveTab(tabSlots);
    } else {
        console.error("Default tab (Slots) not found!");
        // Fallback: activate the first available tab if slots isn't found
        const firstAvailableTab = allTabs.find(tab => tab);
        if (firstAvailableTab) setActiveTab(firstAvailableTab);
    }
    // --- Call Initialization functions from game-specific files ---
    // Pass the BrokieAPI object to each init function
    if (typeof initSlots === 'function') initSlots(BrokieAPI);
    else console.warn("initSlots not found.");
    if (typeof initCrash === 'function') initCrash(BrokieAPI);
    else console.warn("initCrash not found.");
    if (typeof initCoinflip === 'function') initCoinflip(BrokieAPI);
    else console.warn("initCoinflip not found.");
    if (typeof initMinefield === 'function') initMinefield(BrokieAPI);
    else console.warn("initMinefield not found.");
    if (typeof initMemory === 'function') initMemory(BrokieAPI);
    else console.warn("initMemory not found.");
    if (typeof initHorserace === 'function') initHorserace(BrokieAPI);
    else console.warn("initHorserace not found.");
    if (typeof initRoulette === 'function') initRoulette(BrokieAPI);
    else console.warn("initRoulette not found.");
    if (typeof initBlackjack === 'function') initBlackjack(BrokieAPI);
    else console.warn("initBlackjack not found.");
    if (typeof initPlinko === 'function') initPlinko(BrokieAPI);
    else console.warn("initPlinko not found.");
    console.log("Brokie Casino Initialized.");
});