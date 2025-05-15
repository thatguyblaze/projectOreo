/**
 * Brokie Casino - Horse Race Game Logic (horserace_balanced.js)
 *
 * Handles all functionality related to the Horse Racing game.
 * Incorporates horse attributes for more balanced, less random races.
 * Depends on functions and variables defined in main.js.
 */

// --- Horse Race Specific State & Constants ---
let horseraceActive = false;
let horseraceBet = 0;
let selectedHorseIndex = -1; // Index of the selected horse (0-based)
let raceAnimationId = null; // ID for requestAnimationFrame
let horsePositions = []; // Array to store current pixel position (from right edge) of each horse
let horseElements = []; // Array to store references to horse div elements
let horseLaneElements = []; // Array to store references to lane div elements
const NUM_HORSES = 6;
const HORSERACE_WIN_MULTIPLIER = 10; // Adjusted payout multiplier
// --- Balancing Adjustments (v7 - Enhanced Competitive Balance) ---
const BASE_SPEED_FACTOR = 1.7; // Base speed multiplier (Was 1.8)
const STAMINA_DRAIN_FACTOR = 0.9; // How much stamina affects speed loss (Was 0.85)
const CONSISTENCY_FACTOR = 5.0; // How much consistency impacts randomness (Was 4.5)
// --- End Adjustments ---

// --- Horse Data with Attributes ---
// Attributes:
// - speed: Base speed potential (higher is faster)
// - stamina: Resistance to slowing down (higher is better)
// - consistency: How reliably the horse performs to its potential (higher is less random variation)
const HORSES = [
    { name: "Panda", color: '#ef4444', attributes: { speed: 1.1, stamina: 0.8, consistency: 0.7 }, statsDisplay: "Fast Out The Gate, Tires" },
    { name: "Quinton", color: '#f97316', attributes: { speed: 0.9, stamina: 1.15, consistency: 0.9 }, statsDisplay: "Slow Start, Powerful Finish" },
    { name: "Blaze", color: '#3b82f6', attributes: { speed: 1.18, stamina: 0.75, consistency: 0.5 }, statsDisplay: "Extreme Speed, Very Risky" },
    { name: "Matt", color: '#a855f7', attributes: { speed: 0.9, stamina: 1.0, consistency: 1.0 }, statsDisplay: "Ultra Reliable, Average Pace" },
    { name: "Liqhtu", color: '#10b981', attributes: { speed: 1.0, stamina: 1.0, consistency: 0.8 }, statsDisplay: "Good All-Rounder" },
    { name: "Joker", color: '#eab308', attributes: { speed: 1.1, stamina: 0.85, consistency: 0.35 }, statsDisplay: "Total Gamble: Fast or Flop!" }
];

// --- DOM Elements (Horse Race Specific) ---
let horseraceBetInput, horseraceSelectionContainer, horseraceTrack;
let horseraceStartButton, horseraceStatus;
let trackWidth = 0; // Store track width for calculations
const finishLinePos = 25; // Target position (pixels from left edge of track) for finish

/**
 * Initializes the Horse Race game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initHorserace() {
    console.log("Initializing Horse Race (Balanced v7 - Enhanced Competitive Balance)..."); // Log version
    // Get DOM elements
    horseraceBetInput = document.getElementById('horserace-bet');
    horseraceSelectionContainer = document.getElementById('horserace-selection');
    horseraceTrack = document.getElementById('horserace-track');
    horseraceStartButton = document.getElementById('horserace-start-button');
    horseraceStatus = document.getElementById('horserace-status');

    // Check if all essential elements were found
    if (!horseraceBetInput || !horseraceSelectionContainer || !horseraceTrack ||
        !horseraceStartButton || !horseraceStatus) {
        console.error("Horse Race initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-horserace');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Horse Race elements.</p>';
        return; // Stop initialization
    }

    // Create the horse selection UI with stats
    createHorseSelectionUI();

    // Set initial state (doesn't create horses yet, that happens when tab is activated)
    resetHorserace();

    // Add Event Listeners
    horseraceStartButton.addEventListener('click', startHorserace);

    // Add bet adjustment listeners using the factory function from main.js
    if (typeof addBetAdjustmentListeners === 'function') {
        addBetAdjustmentListeners('horserace', horseraceBetInput);
    } else {
        console.warn('addBetAdjustmentListeners function not found. Bet buttons may not work.');
    }

    console.log("Horse Race Initialized.");
}

/**
 * Creates the horse selection buttons UI, including stats display.
 */
function createHorseSelectionUI() {
    if (!horseraceSelectionContainer) return;
    horseraceSelectionContainer.innerHTML = ''; // Clear previous buttons

    HORSES.forEach((horse, index) => {
        const button = document.createElement('button');
        button.className = 'horse-select-btn'; // Class defined in style.css
        button.dataset.horseIndex = index;

        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'horse-color-indicator'; // Class defined in style.css
        colorIndicator.style.backgroundColor = horse.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = ` ${index + 1}. ${horse.name} `;

        const statsSpan = document.createElement('span');
        statsSpan.className = 'text-xs text-gray-400 ml-1';
        statsSpan.textContent = `(${horse.statsDisplay})`;

        button.appendChild(colorIndicator);
        button.appendChild(nameSpan);
        button.appendChild(statsSpan);

        button.addEventListener('click', () => {
            if (horseraceActive) return;
            if (typeof playSound === 'function') playSound('click');
            horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedHorseIndex = index;
            if(horseraceStatus) horseraceStatus.textContent = `Selected Horse #${index + 1}: ${horse.name}. Place bet & start!`;
        });
        horseraceSelectionContainer.appendChild(button);
    });
}

/**
 * Creates the horse elements and lanes within the track.
 */
function createHorses() {
    if (!horseraceTrack) return;
    horseraceTrack.innerHTML = '';
    horseElements = [];
    horseLaneElements = [];
    trackWidth = horseraceTrack.clientWidth;

    if (trackWidth <= 0) {
        console.warn("Track width not available for horse creation. Will retry on next activation.");
        return;
    }

    for (let i = 0; i < NUM_HORSES; i++) {
        const lane = document.createElement('div');
        lane.className = 'horse-lane';

        const horse = document.createElement('div');
        horse.className = 'horse';
        horse.dataset.horseId = i;
        horse.textContent = '🐎';
        horse.style.color = HORSES[i].color;
        horse.style.right = '10px';

        lane.appendChild(horse);
        horseraceTrack.appendChild(lane);
        horseElements.push(horse);
        horseLaneElements.push(lane);
    }

    const finishLine = document.createElement('div');
    finishLine.id = 'horserace-finish-line';
    horseraceTrack.appendChild(finishLine);
    console.log("Horse elements created. Track width:", trackWidth);
}

/**
 * Resets the horse race game to its initial state.
 */
function resetHorserace() {
    if (raceAnimationId) {
        cancelAnimationFrame(raceAnimationId);
        raceAnimationId = null;
    }
    horseraceActive = false;
    horsePositions = new Array(NUM_HORSES).fill(10);

    horseElements.forEach((horse, index) => {
        if (horse) {
            horse.style.right = `${horsePositions[index]}px`;
            horse.classList.remove('animate-pulse');
        }
    });

    if (horseraceTrack) {
        horseraceTrack.querySelectorAll('.horse-trail').forEach(trail => trail.remove());
    }

    if (horseraceStartButton) horseraceStartButton.disabled = false;
    if (horseraceBetInput) horseraceBetInput.disabled = false;
    if (horseraceSelectionContainer) {
        horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.disabled = false);
    }

    if (horseraceStatus) {
        if (selectedHorseIndex === -1 || !HORSES[selectedHorseIndex]) {
            horseraceStatus.textContent = 'Place your bet and pick a horse!';
        } else {
            horseraceStatus.textContent = `Selected Horse #${selectedHorseIndex + 1}: ${HORSES[selectedHorseIndex].name}. Place bet & start!`;
        }
    }
}

/**
 * Starts the horse race.
 */
function startHorserace() {
    if (horseraceActive) return;
    // Ensure all necessary DOM elements are available
    if (!horseraceBetInput || !horseraceStartButton || !horseraceStatus || !horseraceSelectionContainer || !horseraceTrack) {
        console.error("Cannot start race, essential DOM elements missing for horse race.");
        if (typeof showMessage === 'function') showMessage("Error: Race components not loaded.", 3000);
        return;
    }

    const betAmount = parseInt(horseraceBetInput.value);
    const safeShowMessage = typeof showMessage === 'function' ? showMessage : (msg, dur) => console.log(`Message: ${msg}`);
    const currentCurrency = typeof currency !== 'undefined' ? currency : 0;

    if (isNaN(betAmount) || betAmount <= 0) { safeShowMessage("Please enter a valid positive bet amount.", 2000); return; }
    if (betAmount > currentCurrency) { safeShowMessage("Not enough currency!", 2000); return; }
    if (selectedHorseIndex < 0 || selectedHorseIndex >= NUM_HORSES) { safeShowMessage("Please select a horse to bet on.", 2000); return; }

    if (horseElements.length === 0 || trackWidth <= 0) {
        createHorses();
        if (horseElements.length === 0 || trackWidth <= 0) {
            safeShowMessage("Error initializing race track. Try switching tabs or resizing.", 3000);
            return;
        }
    }

    if (typeof startTone === 'function') startTone();
    if (typeof playSound === 'function') playSound('race_start');
    horseraceBet = betAmount;

    if (typeof currency !== 'undefined' && typeof updateCurrencyDisplay === 'function') {
        currency -= betAmount;
        updateCurrencyDisplay('loss');
    } else {
        console.warn('Currency or updateCurrencyDisplay not found/available in main.js.');
    }

    horseraceActive = true;
    horseraceStartButton.disabled = true;
    horseraceBetInput.disabled = true;
    horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.disabled = true);
    horseraceStatus.textContent = 'And they\'re off!';

    horsePositions = new Array(NUM_HORSES).fill(10);
    horseElements.forEach((horse, i) => {
        if(horse) {
            horse.style.right = `${horsePositions[i]}px`;
            horse.classList.remove('animate-pulse');
        }
    });
    if (horseraceTrack) {
        horseraceTrack.querySelectorAll('.horse-trail').forEach(trail => trail.remove());
    }
    let raceFrameCounter = 0;
    let startTime = null;

    function raceStep(timestamp) {
        if (!startTime) startTime = timestamp;
        if (!horseraceActive) return;

        let winner = -1;
        raceFrameCounter++;

        horsePositions = horsePositions.map((pos, i) => {
            if (!horseElements[i] || !HORSES[i]) return pos;

            const horseData = HORSES[i];
            const horseElem = horseElements[i];
            const horseWidth = horseElem.offsetWidth || 20;
            const currentLeftPos = trackWidth - pos - horseWidth;

            if (currentLeftPos <= finishLinePos) {
                if (winner === -1) winner = i;
                return pos;
            }

            let baseAdvancement = horseData.attributes.speed * BASE_SPEED_FACTOR;
            let randomFactor = (Math.random() - 0.5) * CONSISTENCY_FACTOR * (1 - horseData.attributes.consistency);
            let variedAdvancement = baseAdvancement * (1 + randomFactor);

            let raceProgress = Math.max(0, (pos - 10)) / (trackWidth - finishLinePos - 10 - horseWidth);
            raceProgress = Math.min(1, Math.max(0, raceProgress));

            let staminaAttributeFactor = Math.max(0.1, 1.5 - horseData.attributes.stamina);
            let drain = Math.pow(raceProgress, 1.5) * STAMINA_DRAIN_FACTOR * staminaAttributeFactor;
            let staminaEffect = Math.max(0.15, 1.0 - drain); // Min stamina effect is 0.15

            const finalAdvancement = Math.max(0.05, variedAdvancement * staminaEffect); // Min movement 0.05
            const newPos = pos + finalAdvancement;
            horseElem.style.right = `${newPos}px`;

            if (raceFrameCounter % 5 === 0 && horseLaneElements[i]) {
                const trail = document.createElement('div');
                trail.className = 'horse-trail';
                trail.style.backgroundColor = horseData.color;
                trail.style.right = `${newPos - 5}px`;
                trail.style.top = `${horseElem.offsetTop + horseElem.offsetHeight / 2 - 2}px`;
                horseLaneElements[i].appendChild(trail);
                setTimeout(() => trail.remove(), 500);
            }

            if (raceFrameCounter % 12 === 0 && typeof playSound === 'function') playSound('race_step');

            const newLeftPos = trackWidth - newPos - horseWidth;
            if (newLeftPos <= finishLinePos && winner === -1) {
                winner = i;
                const finalRightPos = trackWidth - finishLinePos - horseWidth;
                horseElem.style.right = `${finalRightPos}px`;
                return finalRightPos;
            }
            return newPos;
        });

        if (winner !== -1) {
            finishRace(winner);
        } else {
            raceAnimationId = requestAnimationFrame(raceStep);
        }
    }
    raceAnimationId = requestAnimationFrame(raceStep);
    if (typeof saveGameState === 'function') saveGameState();
}

/**
 * Finishes the horse race and processes results.
 * @param {number} winnerIndex - The index of the winning horse.
 */
function finishRace(winnerIndex) {
    if (!horseraceActive) return;
     // Ensure all necessary DOM elements are available
    if (!horseraceStatus || !horseraceStartButton || !horseraceBetInput || !horseraceSelectionContainer) {
        console.error("Cannot finish race, essential DOM elements missing for horse race UI update.");
        // Attempt to proceed with logic even if UI elements are missing for status updates
    }


    cancelAnimationFrame(raceAnimationId);
    raceAnimationId = null;
    horseraceActive = false;

    const winnerName = HORSES[winnerIndex]?.name || `Horse ${winnerIndex + 1}`;
    const playerWon = winnerIndex === selectedHorseIndex;

    if(horseElements[winnerIndex]) {
        horseElements[winnerIndex].classList.add('animate-pulse');
    }

    const safeFormatWin = typeof formatWin === 'function' ? formatWin : (amount) => `${amount} currency`;
    const safePlaySound = typeof playSound === 'function' ? playSound : (sound) => console.log(`Sound: ${sound}`);
    const safeAddWinToLeaderboard = typeof addWinToLeaderboard === 'function' ? addWinToLeaderboard : (game, amount) => console.log(`Leaderboard: ${game} +${amount}`);
    const safeUpdateCurrencyDisplay = typeof updateCurrencyDisplay === 'function' ? updateCurrencyDisplay : (status) => console.log(`Currency display updated: ${status || 'loss'}`);

    if (playerWon) {
        const winAmount = horseraceBet * HORSERACE_WIN_MULTIPLIER;
        const profit = winAmount;

        if (typeof currency !== 'undefined') currency += winAmount;
        if (typeof totalGain !== 'undefined') totalGain += Math.max(0, profit);
        
        if(horseraceStatus) horseraceStatus.textContent = `Horse #${winnerIndex + 1} (${winnerName}) wins! You won ${safeFormatWin(profit)}!`;
        safePlaySound('race_win');
        safeAddWinToLeaderboard('Race', profit);
        safeUpdateCurrencyDisplay('win');
    } else {
        if (typeof totalLoss !== 'undefined') totalLoss += horseraceBet;
        if(horseraceStatus) horseraceStatus.textContent = `Horse #${winnerIndex + 1} (${winnerName}) wins! You lost ${safeFormatWin(horseraceBet)}.`;
        safePlaySound('lose');
        safeUpdateCurrencyDisplay();
    }

    setTimeout(() => {
        if (!horseraceActive) {
             resetHorserace();
        }
    }, 2500);

    if (typeof saveGameState === 'function') saveGameState();
}

// Example: document.addEventListener('DOMContentLoaded', () => { if (typeof initHorserace === 'function') initHorserace(); });
