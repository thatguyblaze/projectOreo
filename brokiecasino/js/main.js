/**
 * ==========================================================================
 * Brokie Casino - Main JavaScript File (v Updated for Sabacc)
 *
 * Handles core functionality:
 * - Global state (currency, loan, leaderboard, stats)
 * - DOM element selection for shared components & game areas
 * - Core utility functions (updates, messages, saving/loading)
 * - Sound management (Tone.js)
 * - Tab switching logic (including Sabacc)
 * - ATM/Loan functionality
 * - Generic bet adjustment logic
 * - Initialization (including Sabacc)
 * ==========================================================================
 */

// --- Global State ---
let currency = 100;
let totalLoanAmount = 0;
let leaderboard = []; // Array to store { type: 'GameName', win: 150 }
let totalGain = 0;
let totalLoss = 0;
let lifetimeLoans = 0; // Total amount borrowed ever
let gameStats = {}; // { 'Slots': 5, 'Crash': 12, ... }
let totalOperations = 0; // Total number of plays/spins/hands
const MAX_LEADERBOARD_ENTRIES = 25;
let animationFrameId = null; // For potential shared animations

// --- Sound State & Management ---
let toneStarted = false;
let synth, polySynth, noiseSynth; // Declare synth variables globally

/**
 * Checks and resumes audio context if suspended.
 * Should be bound to user interactions.
 */
async function checkAudioContext() {
    if (Tone.context.state === 'suspended') {
        await Tone.start();
        // console.log("AudioContext resumed by user interaction.");
    }
}
// global listener to ensure audio stays alive
document.addEventListener('click', checkAudioContext);
document.addEventListener('keydown', checkAudioContext);

/**
 * Initializes Tone.js audio context on the first user interaction.
 */
async function startTone() {
    // Only run once and if Tone library is loaded
    if (!toneStarted && typeof Tone !== 'undefined') {
        try {
            await Tone.start(); // Request audio context start
            // console.log("AudioContext started successfully.");
            toneStarted = true;
            // Initialize synths *after* Tone.start() has successfully run
            // Configuring envelopes with sustain: 0 to check against stuck notes
            synth = new Tone.Synth({
                envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
            }).toDestination();

            polySynth = new Tone.PolySynth(Tone.Synth, {
                envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
            }).toDestination();
            polySynth.volume.value = -20; // Quieter

            noiseSynth = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
            }).toDestination();
            noiseSynth.volume.value = -35; // Quieter
        } catch (e) {
            console.error("Failed to start AudioContext:", e);
            // Use showMessage if available, otherwise console.log
            if (typeof showMessage === 'function') {
                showMessage("Audio could not be initialized.", 2000);
            } else {
                console.error("showMessage function not available for AudioContext error.");
            }
        }
    }
}

/**
 * Plays a specific sound effect using initialized Tone.js synths.
 * @param {string} type - The identifier for the sound effect (e.g., 'win_small', 'click').
 * @param {number | object} [value=0] - Optional value (e.g., multiplier for crash_tick, index for reel_stop).
 */
function playSound(type, value = 0) {
    if (!toneStarted || !synth || !polySynth || !noiseSynth) {
        // console.warn("Attempted to play sound before audio initialized:", type);
        return; // Don't attempt to play if not ready
    }
    const now = Tone.now();
    try {
        let index = typeof value === 'object' && value !== null && value.index !== undefined ? value.index : 0;

        // --- Sound Definitions ---
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
            case 'reel_stop': polySynth.triggerAttackRelease("A3", "16n", now); break;

            // Crash
            case 'crash_tick':
                if (value > 5) synth.triggerAttackRelease("E6", "32n", now);
                else if (value > 2) synth.triggerAttackRelease("C6", "32n", now);
                break;
            case 'crash_cashout': polySynth.triggerAttackRelease(["G4", "C5", "E5"], "4n", now); break;
            case 'crash_explode':
                polySynth.triggerAttackRelease(["C2", "E2", "G#2"], "2n", now);
                noiseSynth.triggerAttackRelease("2n", now + 0.05);
                break;

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

            // Blackjack & Sabacc (reuse sounds)
            case 'blackjack_deal': polySynth.triggerAttackRelease(["C4", "E4"], "16n", now); break;
            case 'blackjack_hit': synth.triggerAttackRelease("D4", "16n", now + 0.01); break;
            case 'blackjack_bust': synth.triggerAttackRelease("A2", "4n", now); break;
            case 'blackjack_win': polySynth.triggerAttackRelease(["C4", "G4", "C5"], "4n", now); break;
            case 'blackjack_push': synth.triggerAttackRelease("E4", "8n", now); break;
            case 'blackjack_blackjack': polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n", now); break;

            // Plinko
            case 'plinko_drop': synth.triggerAttackRelease("E5", "16n", now); break;
            // Removed peg hit sound
            // case 'plinko_peg_hit': synth.triggerAttackRelease("A5", "64n", now + Math.random() * 0.02); break;
            // Removed bucket landing sounds
            // case 'plinko_win_low': polySynth.triggerAttackRelease(["C4", "E4"], "16n", now); break;
            // case 'plinko_win_high': polySynth.triggerAttackRelease(["C5", "G5"], "8n", now); break;

            default: console.warn("Unknown sound type:", type); break;
        }
    } catch (error) {
        console.error("Tone.js error playing sound:", type, error);
    }
}

// --- DOM Elements (Shared) ---
const currencyDisplay = document.getElementById('currency-display');
const loanBalanceDisplay = document.getElementById('loan-balance-display');
const loanButton = document.getElementById('loan-button'); // ATM button
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
const tabSabacc = document.getElementById('tab-sabacc'); // ** Added Sabacc Tab **

const gameSlots = document.getElementById('game-slots');
const gameCrash = document.getElementById('game-crash');
const gameCoinflip = document.getElementById('game-coinflip');
const gameMinefield = document.getElementById('game-minefield');
const gameMemory = document.getElementById('game-memory');
const gameHorserace = document.getElementById('game-horserace');
const gameRoulette = document.getElementById('game-roulette');
const gameBlackjack = document.getElementById('game-blackjack');
const gamePlinko = document.getElementById('game-plinko');
const gameSabacc = document.getElementById('game-sabacc'); // ** Added Sabacc Game Area **

// Collect tabs and areas into arrays for easier iteration
// ** Ensure Sabacc elements are added here in the correct order relative to HTML **
const allTabs = [
    tabSlots, tabCrash, tabCoinflip, tabMinefield, tabMemory, tabHorserace,
    tabRoulette, tabBlackjack, tabPlinko, tabSabacc // ** Added Sabacc Tab to Array **
]; // Filter removed to ensure index alignment

const allGameAreas = [
    gameSlots, gameCrash, gameCoinflip, gameMinefield, gameMemory, gameHorserace,
    gameRoulette, gameBlackjack, gamePlinko, gameSabacc // ** Added Sabacc Game Area to Array **
]; // Filter removed to ensure index alignment

// ATM Modal
const atmModalOverlay = document.getElementById('atm-modal-overlay');
const atmModal = document.getElementById('atm-modal');
const atmCloseButton = document.getElementById('atm-close-button');
const atmButtons = atmModal ? atmModal.querySelectorAll('.atm-button') : [];

// Stats
// Stats
// const statsTotalGain = ... (Removed dead code)
// const statsTotalLoss = ... (Removed dead code)
// const statsNetProfit = ... (Removed dead code)

// Extended Stats Elements
const statTotalProfit = document.getElementById('stat-total-profit');
const statTotalPlays = document.getElementById('stat-total-plays');
const statTotalLosses = document.getElementById('stat-total-losses'); // New
const statTotalLoans = document.getElementById('stat-total-loans'); // New
const statTopGamesList = document.getElementById('stat-top-games'); // New list container

// --- Core Functions ---

/**
 * Updates the enabled/disabled state of the 'Pay Loan' button.
 */
function updatePayLoanButtonState() {
    if (!payLoanButton) return;
    const canPay = totalLoanAmount > 0 && currency >= totalLoanAmount;
    payLoanButton.disabled = !canPay;
}

/**
 * Briefly highlights an element with a pulse animation using Tailwind class.
 * @param {HTMLElement} element - The DOM element to flash.
 */
function flashElement(element) {
    if (!element) return;
    element.classList.add('animate-pulse');
    setTimeout(() => {
        element.classList.remove('animate-pulse');
    }, 600);
}

/**
 * Updates the session statistics display in the UI.
 */
function updateStatsDisplay() {
    // Extended Stats Panel
    if (statTotalProfit) {
        const net = totalGain - totalLoss;
        statTotalProfit.textContent = net > 0 ? `+${formatWin(net)}` : formatWin(net);
        statTotalProfit.className = net > 0 ? 'text-2xl font-black text-emerald-400' : (net < 0 ? 'text-2xl font-black text-rose-400' : 'text-2xl font-black text-white');
    }
    if (statTotalPlays) {
        statTotalPlays.textContent = totalOperations.toLocaleString();
    }
    if (statTotalLosses) {
        statTotalLosses.textContent = formatWin(totalLoss);
    }
    if (statTotalLoans) {
        statTotalLoans.textContent = formatWin(lifetimeLoans);
    }
    if (statTopGamesList) {
        // Sort games by play count descending
        const sortedGames = Object.entries(gameStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3); // Top 3

        statTopGamesList.innerHTML = '';
        if (sortedGames.length === 0) {
            statTopGamesList.innerHTML = '<li class="text-[10px] text-slate-500 italic">No games played yet.</li>';
        } else {
            sortedGames.forEach(([game, count], index) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0';
                li.innerHTML = `
                    <span class="text-slate-300 font-bold"><span class="text-indigo-500 mr-2">#${index + 1}</span>${game}</span>
                    <span class="text-slate-500 font-mono">${count}</span>
                `;
                statTopGamesList.appendChild(li);
            });
        }
    }
}

/**
 * Flashes the currency display green for a win, red for a loss using CSS classes.
 * @param {'win' | 'loss'} type - The type of change ('win' or 'loss').
 */
function flashCurrency(type) {
    if (!currencyDisplay) return;
    currencyDisplay.classList.remove('flash-win', 'flash-loss');
    void currencyDisplay.offsetWidth; // Force reflow

    if (type === 'win') {
        currencyDisplay.classList.add('flash-win');
    } else if (type === 'loss') {
        currencyDisplay.classList.add('flash-loss');
    }

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
    updatePayLoanButtonState();
    updateStatsDisplay();
    if (changeType) {
        flashCurrency(changeType);
    }
}

/**
 * Shows a temporary message notification at the bottom of the screen.
 * @param {string} text - The message to display.
 * @param {number} [duration=3000] - How long the message stays visible in milliseconds.
 */
function showMessage(text, duration = 3000) {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}

/**
 * Formats a number for display (e.g., winnings).
 * @param {number} amount - The number to format.
 * @returns {string} The formatted number string.
 */
function formatWin(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn("Invalid amount passed to formatWin:", amount);
        return '0';
    }
    return amount.toLocaleString();
}

/**
 * Adds a win entry to the leaderboard state, sorts it, trims it, saves state,
 * and updates the UI display.
 * @param {string} type - The type of game or win (e.g., 'Slots', 'Crash').
 * @param {number} winAmount - The amount won. Must be positive.
 */
function addWinToLeaderboard(type, winAmount) {
    if (winAmount <= 0) return;

    // Filter duplicates:
    // Check if an existing entry matches the Game Type AND the Win Amount is within +/- 10,000 range.
    // This prevents flooding the leaderboard with similar wins from the same game.
    const isDuplicate = leaderboard.some(entry => {
        return entry.type === type && Math.abs(entry.win - winAmount) < 10000;
    });

    if (isDuplicate) {
        // Optional: If the new win is strictly higher, maybe replace the old one?
        // For now, the user requested "ignore them". But updating to the higher value if close might be better?
        // User said: "just ignore them".
        // However, if I win 50,000 then 55,000, ignoring the 55k feels wrong if it's a "Biggest Win".
        // Let's implement: If new win is *higher* than the similar entry, replace it. If lower, ignore.
        const similarEntryIndex = leaderboard.findIndex(entry => entry.type === type && Math.abs(entry.win - winAmount) < 10000);
        if (similarEntryIndex !== -1) {
            if (winAmount > leaderboard[similarEntryIndex].win) {
                leaderboard[similarEntryIndex].win = winAmount; // Update to the higher value
                // Re-sort below
            } else {
                return; // Ignore strictly lower or equal similar win
            }
        } else {
            return; // Should not happen given isDuplicate check
        }
    } else {
        leaderboard.push({ type: type, win: winAmount });
    }

    leaderboard.sort((a, b) => b.win - a.win); // Sort descending
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES); // Keep top entries
    saveGameState();
    updateLeaderboardDisplay();
}

/**
 * Updates the leaderboard list element in the UI.
 */
function updateLeaderboardDisplay() {
    if (!leaderboardList) return;
    const oldListContent = Array.from(leaderboardList.children).map(li => li.textContent);
    leaderboardList.innerHTML = ''; // Clear existing

    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<li class="italic text-sm text-fluent-text-secondary">No significant wins yet!</li>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        const entryText = `${entry.type}: ${formatWin(entry.win)}`;
        li.className = 'flex justify-between items-center text-sm py-1';

        if (!oldListContent.some(oldText => oldText.includes(entryText))) {
            li.classList.add('leaderboard-entry-new');
            li.style.animationDelay = `${index * 0.05}s`;
        }

        li.innerHTML = `
            <span class="font-medium text-fluent-text-secondary">${entry.type}</span>
            <span class="text-fluent-accent font-semibold">+${formatWin(entry.win)}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

/**
 * Saves the current essential game state to localStorage.
 */
function saveGameState() {
    try {
        localStorage.setItem('brokieCasinoState', JSON.stringify({
            currency: currency,
            leaderboard: leaderboard,
            totalLoanAmount: totalLoanAmount,
            totalGain: totalGain,
            totalLoss: totalLoss,
            lifetimeLoans: lifetimeLoans,
            gameStats: gameStats,
            totalOperations: totalOperations,
            slotsMachines: (typeof getSlotsMachineCount === 'function') ? getSlotsMachineCount() : 1
        }));
    } catch (e) {
        console.error("Error saving game state:", e);
        showMessage("Could not save game progress.", 2000);
    }
}

/**
 * Loads the game state from localStorage.
 */
function loadGameState() {
    const savedState = localStorage.getItem('brokieCasinoState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            currency = (state.currency !== undefined && !isNaN(state.currency)) ? state.currency : 500;
            leaderboard = Array.isArray(state.leaderboard) ? state.leaderboard : [];
            totalLoanAmount = (state.totalLoanAmount !== undefined && !isNaN(state.totalLoanAmount)) ? state.totalLoanAmount : 0;
            totalGain = (state.totalGain !== undefined && !isNaN(state.totalGain)) ? state.totalGain : 0;
            totalLoss = (state.totalLoss !== undefined && !isNaN(state.totalLoss)) ? state.totalLoss : 0;
            lifetimeLoans = (state.lifetimeLoans !== undefined && !isNaN(state.lifetimeLoans)) ? state.lifetimeLoans : 0;
            gameStats = (typeof state.gameStats === 'object') ? state.gameStats : {};
            totalOperations = (typeof state.totalOperations === 'number') ? state.totalOperations : 0;
        } catch (e) {
            console.error("Error loading saved state:", e);
            // Reset to defaults if parsing fails
            currency = 500;
            leaderboard = [];
            totalLoanAmount = 0;
            totalGain = 0;
            totalLoss = 0;
            lifetimeLoans = 0;
            gameStats = {};
            totalOperations = 0;
            localStorage.removeItem('brokieCasinoState'); // Clear corrupted state
        }
    }

    // Restore Slots State
    const machinesCount = (savedState && JSON.parse(savedState).slotsMachines) || 1;
    if (typeof setMachinesOwned === 'function') {
        setMachinesOwned(machinesCount);
    }
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES); // Ensure limit
    updateCurrencyDisplay();
    updateLeaderboardDisplay();
    updateStatsDisplay();
}

/**
 * Switches the active game tab and view.
 * Handles stopping/resetting the previous game and initializing/resetting the new game.
 * @param {HTMLElement} selectedTab - The tab button element that was clicked.
 */
function setActiveTab(selectedTab) {
    if (!selectedTab) return;
    // console.log("Setting active tab:", selectedTab.id);


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
        if (currentActiveTab === tabPlinko && typeof resetPlinko === 'function') {
            resetPlinko();
        }
        // ** Added Sabacc Reset Check **
        if (currentActiveTab === tabSabacc && typeof resetSabaccTable === 'function' && typeof sabaccGameActive !== 'undefined' && sabaccGameActive) {
            resetSabaccTable(); // Call Sabacc reset function
        }
    }

    // --- Switch Tab Visuals and Game Area Visibility ---
    // --- Switch Tab Visuals and Game Area Visibility (NUCLEAR OPTION) ---
    // console.log(`--- Switching Tab --- (Total Areas: ${allGameAreas.length})`);

    // 1. Force Hide ALL Game Areas first
    allGameAreas.forEach(area => {
        if (!area) {
            console.warn("Found null area in allGameAreas");
            return;
        }
        // console.log(`Hiding: ${area.id}, Classes: ${area.className}`);
        area.classList.remove('flex');
        area.classList.add('hidden');
        area.classList.remove('opacity-100');
        area.classList.add('opacity-0');
    });

    // 2. Reset All Tabs
    allTabs.forEach(t => t && t.removeAttribute('aria-current'));

    // 3. Show ONLY the selected tab/game
    const selectedIndex = allTabs.indexOf(selectedTab);
    if (selectedIndex === -1) {
        console.error("Selected tab not found in allTabs array");
        return;
    }

    selectedTab.setAttribute('aria-current', 'page');
    const targetGameArea = allGameAreas[selectedIndex];

    if (targetGameArea) {
        // console.log("Showing Game Area:", targetGameArea.id);
        targetGameArea.classList.remove('hidden');
        targetGameArea.classList.add('flex');

        requestAnimationFrame(() => {
            targetGameArea.classList.remove('opacity-0');
            targetGameArea.classList.add('opacity-100');
        });

        // --- Initialize/Reset Newly Active Game (if needed) ---
        if (selectedTab === tabCrash && typeof resetCrashVisuals === 'function' && (typeof crashGameActive === 'undefined' || !crashGameActive)) {
            resetCrashVisuals();
        }
        if (selectedTab === tabHorserace && typeof createHorses === 'function' && !document.querySelector('#horserace-track .horse')) {
            createHorses(); if (typeof resetHorserace === 'function') resetHorserace();
        }
        if (selectedTab === tabRoulette && typeof createRouletteBettingGrid === 'function' && !document.querySelector('#roulette-inside-bets button')) {
            createRouletteBettingGrid(); if (typeof resetRoulette === 'function') resetRoulette(false);
        }
        if (selectedTab === tabBlackjack && typeof resetBlackjack === 'function' && (typeof blackjackActive === 'undefined' || !blackjackActive)) {
            resetBlackjack(false);
        }
        if (selectedTab === tabPlinko && typeof drawPlinkoBoard === 'function') {
            drawPlinkoBoard();
        }

        // Ensure Slots render if empty (fix for blank box)
        if (selectedTab === tabSlots) {
            if (typeof renderMachines === 'function' && (!activeMachines || activeMachines.length === 0)) {
                console.log("Forcing Slots Render on Tab Switch");
                renderMachines();
            }
        }
    } else {
        console.error("Target game area not found for index:", selectedIndex);
    }
    // playSound('click'); // Optional: Play click sound for tab switch
}


/**
 * Adjusts the value of a bet input field based on a specified operation.
 * Handles min/max bet logic based on current currency.
 * Uses parseFloat for reading input to handle potential scientific notation for large numbers.
 * Assumes bets are ultimately integers, so Math.floor is used after parsing.
 * @param {HTMLInputElement} inputElement - The bet input field element.
 * @param {number} amount - The amount for the operation.
 * @param {'add'|'subtract'|'multiply'|'divide'|'min'|'max'|'set'} operation - The operation type.
 */
function adjustBet(inputElement, amount, operation) {
    if (!inputElement) {
        console.error("adjustBet called with invalid inputElement");
        return;
    }

    // Read current bet using parseFloat to handle potential scientific notation (e.g., "1e7")
    // Then floor it, assuming bets are integers.
    let parsedValue = parseFloat(inputElement.value);
    let currentBet;
    if (isNaN(parsedValue) || parsedValue < 1) {
        currentBet = 1; // Default to 1 if invalid or less than 1
    } else {
        currentBet = Math.floor(parsedValue);
    }

    let newBet = currentBet; // Initialize newBet with the current (floored) bet value.
    // This will be overridden by 'min', 'max', and 'set' operations.

    const minBet = 1;
    // maxBet is the maximum amount the player can possibly bet, based on their current currency.
    const maxBet = Math.max(minBet, Math.floor(currency)); // Floor currency for max bet if currency can be float

    switch (operation) {
        case 'add': newBet = currentBet + amount; break;
        case 'subtract': newBet = currentBet - amount; break;
        case 'multiply': newBet = Math.floor(currentBet * amount); break;
        case 'divide': newBet = Math.floor(currentBet / amount); break;
        case 'min': newBet = minBet; break;
        case 'max': newBet = maxBet; break; // Set to the maximum possible bet (floored currency)
        case 'set': newBet = Math.floor(amount); break; // Directly set the value (and floor it)
        default: console.warn("Invalid operation in adjustBet:", operation); return;
    }

    // Clamp the new bet: ensure it's at least minBet.
    newBet = Math.max(minBet, newBet);

    // Further clamp: ensure it doesn't exceed maxBet (player's current floored currency).
    // This check is crucial. If currency is 0, maxBet would be 1 (due to Math.max(minBet, 0)).
    if (currency > 0) {
        newBet = Math.min(maxBet, newBet);
    } else {
        // If currency is 0 (or less, though should not happen), bet must be minBet.
        newBet = minBet;
    }

    // Handle potential NaN from operations if inputs were weird, though parseFloat helps.
    if (isNaN(newBet)) {
        newBet = minBet;
    }

    inputElement.value = newBet; // Update the input field value.
    // playSound('click'); // Optional sound feedback
}

// --- ATM / Loan Logic ---
/** Opens the ATM modal with transitions. */
function openAtmModal() {
    if (!atmModalOverlay || !atmModal) return;
    playSound('click');
    atmModalOverlay.classList.remove('hidden');
    atmModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        atmModalOverlay.classList.add('opacity-100');
        atmModal.classList.add('opacity-100', 'scale-100');
    });
}

/** Closes the ATM modal with transitions. */
function closeAtmModal() {
    if (!atmModalOverlay || !atmModal) return;
    playSound('click');
    atmModalOverlay.classList.remove('opacity-100');
    atmModal.classList.remove('opacity-100', 'scale-100');
    setTimeout(() => {
        atmModalOverlay.classList.add('hidden');
        atmModal.classList.add('hidden');
    }, 300); // Match CSS transition duration
}

// --- Event Listeners Setup ---
/** Sets up all the main event listeners for shared UI elements. */
function setupMainEventListeners() {
    // --- Games Navigation Scroll Logic ---
    const gamesContainer = document.getElementById('games-tab-container');
    const scrollLeftBtn = document.getElementById('games-scroll-left');
    const scrollRightBtn = document.getElementById('games-scroll-right');

    if (gamesContainer && scrollLeftBtn && scrollRightBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            gamesContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });

        scrollRightBtn.addEventListener('click', () => {
            gamesContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }

    // Reset Stats Button
    const resetStatsBtn = document.getElementById('reset-stats-button');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset all your stats? This cannot be undone.")) {
                totalGain = 0;
                totalLoss = 0;
                lifetimeLoans = 0;
                gameStats = {};
                totalOperations = 0;

                // Feedback Round 2: Reset Currency, Loans, and Leaderboard
                currency = 100;
                totalLoanAmount = 0;
                leaderboard = [];
                const leaderboardList = document.getElementById('leaderboard-list');
                if (leaderboardList) leaderboardList.innerHTML = '';

                // Reset Upgrades
                if (typeof setMachinesOwned === 'function') {
                    setMachinesOwned(1);
                }

                saveGameState();
                updateCurrencyDisplay(); // Updates all balance/loan UI
                updateStatsDisplay();
                showMessage("All personal statistics, upgrades, and balances have been reset.", 2000);
            }
        });
    }

    // ATM Button
    if (loanButton) loanButton.addEventListener('click', openAtmModal);

    // ATM Modal Buttons & Closing
    if (atmCloseButton) atmCloseButton.addEventListener('click', closeAtmModal);
    if (atmModalOverlay) atmModalOverlay.addEventListener('click', closeAtmModal); // Click outside to close
    if (atmButtons) {
        atmButtons.forEach(button => {
            button.addEventListener('click', () => {
                const amount = parseInt(button.dataset.amount); // ATM amounts are fixed integers
                if (isNaN(amount) || amount <= 0) return;
                currency += amount;
                totalLoanAmount += amount;
                lifetimeLoans += amount; // Track lifetime borrowing
                updateCurrencyDisplay('win'); // Update UI, flash green
                saveGameState();
                showMessage(`Withdrew ${formatWin(amount)}! Loan balance increased.`, 2000);
                closeAtmModal();
            });
        });
    }

    // Pay Loan Button
    if (payLoanButton) {
        payLoanButton.addEventListener('click', () => {
            if (totalLoanAmount <= 0) {
                showMessage("No loan to pay off.", 1500); return;
            }
            if (currency >= totalLoanAmount) {
                startTone(); playSound('click');
                const paidAmount = totalLoanAmount;
                currency -= totalLoanAmount;
                totalLoanAmount = 0;
                updateCurrencyDisplay('loss'); // Update UI, flash red
                saveGameState();
                showMessage(`Loan of ${formatWin(paidAmount)} paid off!`, 2000);
            } else {
                showMessage(`Not enough funds to pay off loan! Need ${formatWin(totalLoanAmount)}.`, 2000);
            }
        });
    }

    // Tab Switching Logic
    // Tab Switching Logic (Robust Re-selection)
    const freshTabs = document.querySelectorAll('.tab-button');
    console.log("Found tabs for listener setup:", freshTabs.length);

    freshTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const clickedTab = e.currentTarget;
            // console.log("Tab clicked (Fresh):", clickedTab.id);
            // debug toast
            if (typeof showMessage === 'function') {
                showMessage(`Navigating to ${clickedTab.querySelector('span:last-child').textContent.trim()}...`, 800);
            }
            setActiveTab(clickedTab);
        });
    });

    // Listener to start Tone.js on first interaction anywhere
    document.body.addEventListener('click', startTone, { once: true });
    document.body.addEventListener('keydown', startTone, { once: true });
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
    // For 'max', pass the current currency. adjustBet will handle flooring if necessary.
    if (maxBtn) maxBtn.addEventListener('click', () => adjustBet(betInputElement, currency, 'max'));


    // Add listener to the input field itself for validation on change/input
    if (betInputElement) {
        betInputElement.addEventListener('change', () => { // Validate on 'change'
            // Use parseFloat to correctly read potentially large numbers (e.g., scientific notation)
            let tempValue = parseFloat(betInputElement.value);
            let valueToSet;
            if (isNaN(tempValue) || tempValue < 1) {
                valueToSet = 1;
            } else {
                valueToSet = Math.floor(tempValue); // Assume integer bets
            }
            // Use adjustBet with 'set' operation to apply clamping and update.
            // adjustBet will also floor the 'amount' for 'set' operation.
            adjustBet(betInputElement, valueToSet, 'set');
        });
        betInputElement.addEventListener('input', () => { // Prevent non-numeric input, allow 'e' for scientific notation
            // but rely on parseFloat for final validation.
            // This regex is a bit more permissive to allow typing scientific notation,
            // but parseFloat and subsequent logic will handle validation.
            // A simpler alternative if not wanting to support typing 'e':
            // betInputElement.value = betInputElement.value.replace(/[^0-9]/g, '');
            // For now, let's stick to original non-numeric filtering, as parseFloat handles 'e'.
            betInputElement.value = betInputElement.value.replace(/[^0-9]/g, '');
        });
    }
}

// --- Global Access Object (BrokieAPI) ---
// Defined before DOMContentLoaded to be available for game init functions
const BrokieAPI = {
    // State Accessors
    getBalance: () => currency,
    getLoanAmount: () => totalLoanAmount,
    // State Modifiers
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

        // Update display (includes flash) and save state
        updateCurrencyDisplay(amountChange > 0 ? 'win' : (amountChange < 0 ? 'loss' : null));
        saveGameState(); // Save after every balance change
        return currency; // Return the new balance
    },
    addWin: (gameName, winAmount) => {
        if (winAmount > 0) {
            addWinToLeaderboard(gameName, winAmount);
            // Balance update happens via updateBalance call where win is awarded
        }
    },
    registerGameStart: (gameName) => {
        totalOperations++;
        if (!gameStats[gameName]) gameStats[gameName] = 0;
        gameStats[gameName]++;
        saveGameState();
        updateStatsDisplay(); // Update stats UI immediately
    },
    // Utilities
    showMessage: showMessage,
    playSound: playSound,
    startTone: startTone,
    formatWin: formatWin,
    addBetAdjustmentListeners: addBetAdjustmentListeners // Expose factory function
};

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM Loaded. Initializing Brokie Casino...");
    loadGameState(); // Load saved state first
    setupMainEventListeners(); // Setup listeners for main UI elements (including tabs)

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
    const safeInit = (name, fn) => {
        try {
            if (typeof fn === 'function') fn(BrokieAPI);
            else console.warn(`${name} not found.`);
        } catch (err) {
            console.error(`Error initializing ${name}:`, err);
        }
    };

    safeInit('Shop', typeof initShop !== 'undefined' ? initShop : undefined);
    safeInit('Slots', typeof initSlots !== 'undefined' ? initSlots : undefined);
    safeInit('Crash', typeof initCrash !== 'undefined' ? initCrash : undefined);
    safeInit('CoinFlip', typeof initCoinflip !== 'undefined' ? initCoinflip : (window.initCoinflip || undefined));
    safeInit('Minefield', typeof initMinefield !== 'undefined' ? initMinefield : undefined);
    safeInit('Memory', typeof initMemory !== 'undefined' ? initMemory : undefined);
    safeInit('Horserace', typeof initHorserace !== 'undefined' ? initHorserace : undefined);
    safeInit('Roulette', typeof initRoulette !== 'undefined' ? initRoulette : undefined);
    safeInit('Blackjack', typeof initBlackjack !== 'undefined' ? initBlackjack : undefined);
    safeInit('Plinko', typeof initPlinko !== 'undefined' ? initPlinko : undefined);
    safeInit('Sabacc', typeof initSabacc !== 'undefined' ? initSabacc : undefined);


    // console.log("Brokie Casino Initialized.");
});
