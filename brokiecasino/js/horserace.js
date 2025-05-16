/**
 * Brokie Casino - Horse Race Game Logic (horserace.js)
 *
 * v9.1 - Error Fixes & State Reset
 * Features unique horse abilities and dynamic odds-based payouts.
 * Corrected state management for abilities between races.
 * Depends on functions and variables defined in main.js.
 */

// --- Horse Race Specific State & Constants ---
let horseraceActive = false;
let horseraceBet = 0;
let selectedHorseIndex = -1;
let raceAnimationId = null;
let horsePositions = [];
let horseElements = [];
let horseLaneElements = [];
// let horseCurrentSpeedModifiers = []; // REMOVED - Unused
let horseOdds = []; // To store calculated odds for the current race

const NUM_HORSES = 6;
const BASE_SPEED_FACTOR = 1.7; // Base for speed calculation
const STAMINA_DRAIN_FACTOR = 0.9; // How much stamina affects speed loss
const CONSISTENCY_FACTOR = 0.3; // Max random performance swing (e.g., 0.3 means up to +/-30% for a horse with 0 baseConsistency)

// --- New Horse Data with Abilities ---
const HORSES = [
    {
        name: "Panda", color: '#ef4444',
        baseSpeed: 1.05, baseStamina: 0.9, baseConsistency: 0.8,
        ability: {
            name: "Early Bird",
            description: "Gains a 20% speed boost for the first 30% of the race, but stamina drains 15% faster.",
            activate: (horse, progress, horseState) => {
                // Applied during the first 30% of the race
                if (progress < 0.30) {
                    if (!horseState.earlyBirdPhaseActive) { // Apply only once at the start of this phase
                        horseState.speedModifier *= 1.20;       // Apply boost multiplicatively
                        horseState.staminaDrainMultiplier *= 1.15; // Apply penalty multiplicatively
                        horseState.earlyBirdPhaseActive = true;    // Mark that the effect is currently active
                    }
                } else {
                    // After 30% progress, if the effect was active, revert it
                    if (horseState.earlyBirdPhaseActive) {
                        horseState.speedModifier /= 1.20;       // Revert boost
                        horseState.staminaDrainMultiplier /= 1.15; // Revert penalty
                        horseState.earlyBirdPhaseActive = false;   // Mark that the effect is no longer active
                    }
                }
            }
        }
    },
    {
        name: "Quinton", color: '#f97316',
        baseSpeed: 0.92, baseStamina: 1.15, baseConsistency: 0.9,
        ability: {
            name: "Marathoner",
            description: "Stamina drains 20% slower. Gains a 10% speed boost in the last 25% of the race.",
            activate: (horse, progress, horseState) => {
                // Stamina drain reduction is always active for Quinton if not already set
                if (horseState.staminaDrainMultiplier === 1.0) { // Check if not already modified by this ability
                    horseState.staminaDrainMultiplier = 0.80; // Persistent effect for the race
                }

                // Late boost in the last 25%
                if (progress > 0.75 && !horseState.lateBoostAppliedMarathoner) {
                    horseState.speedModifier *= 1.10; // Apply boost multiplicatively
                    horseState.lateBoostAppliedMarathoner = true; // Ensure it only applies once per race
                }
            }
        }
    },
    {
        name: "Blaze", color: '#3b82f6',
        baseSpeed: 1.18, baseStamina: 0.75, baseConsistency: 0.5,
        ability: {
            name: "Glass Cannon",
            description: "Very high top speed but low consistency. Speed can vary wildly. Stamina drains 10% faster.",
            activate: (horse, progress, horseState) => {
                // Stamina drain increase is always active for Blaze if not already set
                 if (horseState.staminaDrainMultiplier === 1.0) { // Check if not already modified
                    horseState.staminaDrainMultiplier = 1.10; // Persistent
                 }
            }
        }
    },
    {
        name: "Matt", color: '#a855f7',
        baseSpeed: 0.95, baseStamina: 1.0, baseConsistency: 0.95,
        ability: {
            name: "Mr. Reliable",
            description: "Extremely consistent performance. Rarely has a bad day.",
            activate: (horse, progress, horseState) => {
                // High baseConsistency is the main effect. No dynamic changes needed here.
            }
        }
    },
    {
        name: "Liqhtu", color: '#10b981',
        baseSpeed: 1.0, baseStamina: 1.0, baseConsistency: 0.85,
        ability: {
            name: "Momentum",
            description: "Gains a small (2%) cumulative speed boost every 20% of the race if not in last place.",
            activate: (horse, progress, horseState, currentHorsePixelPositions) => {
                const interval = 0.20;
                // currentInterval will be 0 for 0-19.99% progress, 1 for 20-39.99%, etc.
                const currentInterval = Math.floor(progress / interval);

                // Check if this interval's boost has been applied and progress is meaningful
                if (progress > 0 && !horseState.momentumIntervalsApplied[currentInterval]) {
                    let isLast = true;
                    // Find Liqhtu's index to get its current pixel position
                    const liqhtuIndex = HORSES.findIndex(h => h.name === horse.name);
                    const liqhtuPixelPos = currentHorsePixelPositions[liqhtuIndex];

                    for (let j = 0; j < currentHorsePixelPositions.length; j++) {
                        if (j !== liqhtuIndex && currentHorsePixelPositions[j] < liqhtuPixelPos) {
                            // If another horse 'j' has a smaller 'right' position, it's ahead
                            isLast = false;
                            break;
                        }
                    }

                    if (!isLast) {
                        horseState.speedModifier *= 1.02; // Apply cumulative boost
                    }
                    horseState.momentumIntervalsApplied[currentInterval] = true; // Mark this interval's check as done
                }
            }
        }
    },
    {
        name: "Joker", color: '#eab308',
        baseSpeed: 1.0, baseStamina: 0.85, baseConsistency: 0.4,
        ability: {
            name: "Chaos Theory",
            description: "Highly unpredictable. Randomly gains a large (30%) speed boost or (20%) penalty for short bursts (approx every 15-25% of race progress).",
            activate: (horse, progress, horseState) => {
                // chaosEvents should be initialized in resetHorserace/startHorserace
                if (!horseState.chaosEvents) return; // Should not happen if initialized correctly

                // If current event duration has passed, reset its effect
                if (progress > horseState.chaosEvents.activeUntil && horseState.chaosEvents.currentEffect !== 1.0) {
                    horseState.speedModifier /= horseState.chaosEvents.currentEffect; // Revert effect
                    horseState.chaosEvents.currentEffect = 1.0; // Reset effect tracker
                }

                // If it's time for a new potential event and no event is currently active
                if (progress > horseState.chaosEvents.nextTriggerTime && horseState.chaosEvents.currentEffect === 1.0) {
                    if (Math.random() < 0.6) { // 60% chance to trigger an event
                        const isBoost = Math.random() < 0.5;
                        horseState.chaosEvents.currentEffect = isBoost ? 1.30 : 0.80;
                        horseState.speedModifier *= horseState.chaosEvents.currentEffect; // Apply new effect
                        horseState.chaosEvents.activeUntil = progress + (0.05 + Math.random() * 0.05); // Active for 5-10% of race progress
                    }
                    // Schedule next potential trigger point regardless of whether an event triggered now
                    horseState.chaosEvents.nextTriggerTime = progress + (0.15 + Math.random() * 0.10);
                }
            }
        }
    }
];

// --- DOM Elements ---
let horseraceBetInput, horseraceSelectionContainer, horseraceTrack;
let horseraceStartButton, horseraceStatus;
let trackWidth = 0;
const finishLinePos = 25;

// --- Per-Race Horse State ---
let horseRaceStates = [];

/**
 * Initializes ability-specific states for all horses.
 * Called at the beginning of each race and on full reset.
 */
function initializeHorseRaceStates() {
    horseRaceStates = HORSES.map(horse => {
        const initialState = {
            speedModifier: 1.0,
            staminaDrainMultiplier: 1.0,
            // Panda
            earlyBirdPhaseActive: false,
            // Quinton
            lateBoostAppliedMarathoner: false,
            // Liqhtu
            momentumIntervalsApplied: {}, // Stores { intervalIndex: true }
            // Joker
            chaosEvents: {
                nextTriggerTime: 0.10 + Math.random() * 0.15, // Initial time for first potential event
                activeUntil: 0,      // Time until current event effect wears off
                currentEffect: 1.0   // Multiplier of current event (1.0 if no event active)
            }
        };
        // For abilities that have a persistent base effect not tied to progress (like Quinton's base stamina drain or Blaze's)
        // It's better to apply them once when states are initialized or let the ability manage it.
        // Here, Quinton and Blaze's activate functions will set their persistent multipliers if they are at default.
        return initialState;
    });
}


/**
 * Initializes the Horse Race game.
 */
function initHorserace() {
    console.log("Initializing Horse Race (v9.1 - Abilities & Odds Overhaul)...");
    horseraceBetInput = document.getElementById('horserace-bet');
    horseraceSelectionContainer = document.getElementById('horserace-selection');
    horseraceTrack = document.getElementById('horserace-track');
    horseraceStartButton = document.getElementById('horserace-start-button');
    horseraceStatus = document.getElementById('horserace-status');

    if (!horseraceBetInput || !horseraceSelectionContainer || !horseraceTrack ||
        !horseraceStartButton || !horseraceStatus) {
        console.error("Horse Race initialization failed: Missing DOM elements.");
        const gameArea = document.getElementById('game-horserace');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Horse Race elements.</p>';
        return;
    }

    createHorseSelectionUI();
    resetHorserace(); // This will call initializeHorseRaceStates and calculateAndDisplayOdds

    horseraceStartButton.addEventListener('click', startHorserace);
    if (typeof addBetAdjustmentListeners === 'function') {
        addBetAdjustmentListeners('horserace', horseraceBetInput);
    } else {
        console.warn('addBetAdjustmentListeners function not found.');
    }
    console.log("Horse Race Initialized.");
}

/**
 * Calculates a 'power rating' for each horse.
 */
function calculatePowerRatings() {
    return HORSES.map(horse => {
        let rating = (horse.baseSpeed * 40) + (horse.baseStamina * 30) + (horse.baseConsistency * 25); // Adjusted consistency weight
        // Simplified heuristic for ability impact on base rating
        if (horse.ability.name === "Early Bird") rating += 5;  // Panda
        if (horse.ability.name === "Marathoner") rating += 12; // Quinton
        if (horse.ability.name === "Glass Cannon") rating += 2;  // Blaze (high speed is base, ability is risk)
        if (horse.ability.name === "Mr. Reliable") rating += 8; // Matt
        if (horse.ability.name === "Momentum") rating += 7;   // Liqhtu
        if (horse.ability.name === "Chaos Theory") rating -= 2; // Joker (unpredictability slightly lowers base expectation)
        return Math.max(1, rating);
    });
}

/**
 * Calculates odds for each horse based on power ratings.
 */
function calculateAndDisplayOdds() {
    const powerRatings = calculatePowerRatings();
    const totalPower = powerRatings.reduce((sum, rating) => sum + rating, 0);

    if (totalPower === 0) {
        horseOdds = HORSES.map(() => 10);
    } else {
        const houseEdge = 0.10; // 10% house edge
        horseOdds = powerRatings.map(rating => {
            if (rating <= 0) return 100; // Assign high odds for zero or negative rating
            const chance = rating / totalPower;
            if (chance <= 0) return 100;
            let calculatedOdds = (1 / chance) * (1 - houseEdge);
            return parseFloat(Math.max(1.5, Math.min(calculatedOdds, 50)).toFixed(2)); // Cap and format
        });
    }

    const buttons = horseraceSelectionContainer.querySelectorAll('.horse-select-btn');
    buttons.forEach((button, index) => {
        const oddsDisplay = button.querySelector('.horse-odds-display');
        if (oddsDisplay && horseOdds[index] != null) { // Check for null or undefined
            oddsDisplay.textContent = ` (${horseOdds[index].toFixed(2)}:1)`;
        } else if (oddsDisplay) {
            oddsDisplay.textContent = ` (N/A)`;
        }
    });
}


/**
 * Creates the horse selection buttons UI.
 */
function createHorseSelectionUI() {
    if (!horseraceSelectionContainer) return;
    horseraceSelectionContainer.innerHTML = '';

    HORSES.forEach((horse, index) => {
        const button = document.createElement('button');
        button.className = 'horse-select-btn';
        button.dataset.horseIndex = index;

        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'horse-color-indicator';
        colorIndicator.style.backgroundColor = horse.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = ` ${index + 1}. ${horse.name} `;

        const abilityNameSpan = document.createElement('span');
        abilityNameSpan.className = 'text-sm text-gray-300 ml-1 italic';
        abilityNameSpan.textContent = `"${horse.ability.name}"`;
        
        const oddsDisplaySpan = document.createElement('span');
        oddsDisplaySpan.className = 'horse-odds-display text-sm text-yellow-400 ml-1';
        oddsDisplaySpan.textContent = ` (Calculating...)`;

        const abilityDescSpan = document.createElement('p');
        abilityDescSpan.className = 'text-xs text-gray-400 mt-1 w-full';
        abilityDescSpan.textContent = horse.ability.description;

        button.appendChild(colorIndicator);
        button.appendChild(nameSpan);
        button.appendChild(abilityNameSpan);
        button.appendChild(oddsDisplaySpan);
        button.appendChild(abilityDescSpan);

        button.addEventListener('click', () => {
            if (horseraceActive) return;
            if (typeof playSound === 'function') playSound('click');
            horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedHorseIndex = index;
            if(horseraceStatus) {
                const currentOdds = horseOdds[index] != null ? horseOdds[index].toFixed(2) + ':1' : '...';
                horseraceStatus.textContent = `Selected ${horse.name} (${currentOdds}) Place bet & start!`;
            }
        });
        horseraceSelectionContainer.appendChild(button);
    });
    // calculateAndDisplayOdds(); // Removed: Called by resetHorserace during init
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
        console.warn("Track width not available. Retrying on next activation or race start.");
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
    
    initializeHorseRaceStates(); // Centralized state initialization

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
    
    calculateAndDisplayOdds(); // Recalculate odds on reset for UI

    if (horseraceStatus) {
        if (selectedHorseIndex === -1 || !HORSES[selectedHorseIndex]) {
            horseraceStatus.textContent = 'Place your bet and pick a horse!';
        } else {
            const horse = HORSES[selectedHorseIndex];
            const currentOdds = horseOdds[selectedHorseIndex] != null ? horseOdds[selectedHorseIndex].toFixed(2) + ':1' : '...';
            horseraceStatus.textContent = `Selected ${horse.name} (${currentOdds}) Place bet & start!`;
        }
    }
}

/**
 * Starts the horse race.
 */
function startHorserace() {
    if (horseraceActive) return;
    if (!horseraceBetInput || !horseraceStartButton || !horseraceStatus || !horseraceSelectionContainer || !horseraceTrack) {
        console.error("Cannot start race, essential DOM elements missing.");
        if (typeof showMessage === 'function') showMessage("Error: Race components not loaded.", 3000);
        return;
    }

    const betAmount = parseInt(horseraceBetInput.value);
    const safeShowMessage = typeof showMessage === 'function' ? showMessage : (msg, dur) => console.log(`Message: ${msg}`);
    const currentCurrency = typeof currency !== 'undefined' ? currency : 0;

    if (isNaN(betAmount) || betAmount <= 0) { safeShowMessage("Please enter a valid positive bet amount.", 2000); return; }
    if (betAmount > currentCurrency) { safeShowMessage("Not enough currency!", 2000); return; }
    if (selectedHorseIndex < 0 || selectedHorseIndex >= NUM_HORSES) { safeShowMessage("Please select a horse.", 2000); return; }

    if (horseElements.length === 0 || trackWidth <= 0) {
        createHorses();
        if (horseElements.length === 0 || trackWidth <= 0) {
            safeShowMessage("Error initializing race track. Try switching tabs or resizing.", 3000);
            return;
        }
    }
    
    initializeHorseRaceStates(); // Ensure fresh states for the new race
    calculateAndDisplayOdds(); // Ensure odds are based on fresh state if anything could change them (though unlikely here)

    if (typeof startTone === 'function') startTone();
    if (typeof playSound === 'function') playSound('race_start');
    horseraceBet = betAmount;

    if (typeof currency !== 'undefined' && typeof updateCurrencyDisplay === 'function') {
        currency -= betAmount;
        updateCurrencyDisplay('loss');
    } else {
        console.warn('Currency or updateCurrencyDisplay not found.');
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

        const currentHorsePixelPositions = horsePositions.slice();

        horsePositions = horsePositions.map((pos, i) => {
            if (!horseElements[i] || !HORSES[i]) return pos;

            const horseData = HORSES[i];
            const horseElem = horseElements[i];
            const horseState = horseRaceStates[i];
            const horseWidth = horseElem.offsetWidth || 20;
            const currentLeftPos = trackWidth - pos - horseWidth;

            if (currentLeftPos <= finishLinePos) {
                if (winner === -1) winner = i;
                return pos;
            }

            if (horseData.ability && typeof horseData.ability.activate === 'function') {
                const raceProgress = Math.max(0, (pos - 10)) / (trackWidth - finishLinePos - 10 - horseWidth);
                horseData.ability.activate(horseData, Math.min(1, Math.max(0, raceProgress)), horseState, currentHorsePixelPositions);
            }

            let currentSpeed = horseData.baseSpeed * horseState.speedModifier; // speedModifier defaults to 1.0
            let randomPerformance = (Math.random() - 0.5) * 2 * (1 - horseData.baseConsistency) * CONSISTENCY_FACTOR;
            currentSpeed *= (1 + randomPerformance);
            
            let effectiveRaceProgress = Math.max(0, (pos - 10)) / (trackWidth - finishLinePos - 10 - horseWidth);
            effectiveRaceProgress = Math.min(1, Math.max(0, effectiveRaceProgress));

            let staminaFactor = Math.max(0.1, 1.5 - horseData.baseStamina);
            let drain = Math.pow(effectiveRaceProgress, 1.5) * STAMINA_DRAIN_FACTOR * staminaFactor * horseState.staminaDrainMultiplier; // staminaDrainMultiplier defaults to 1.0
            let staminaEffect = Math.max(0.10, 1.0 - drain);

            const finalAdvancement = Math.max(0.05, currentSpeed * staminaEffect * BASE_SPEED_FACTOR);
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
 */
function finishRace(winnerIndex) {
    if (!horseraceActive) return;
    if (!horseraceStatus || !horseraceStartButton || !horseraceBetInput || !horseraceSelectionContainer) {
        console.error("Cannot finish race, essential DOM elements missing.");
    }

    cancelAnimationFrame(raceAnimationId);
    raceAnimationId = null;
    horseraceActive = false;

    const winnerHorse = HORSES[winnerIndex];
    const winnerName = winnerHorse?.name || `Horse ${winnerIndex + 1}`;
    const playerWon = winnerIndex === selectedHorseIndex;

    if(horseElements[winnerIndex]) {
        horseElements[winnerIndex].classList.add('animate-pulse');
    }

    const safeFormatWin = typeof formatWin === 'function' ? formatWin : (amount) => `${amount} currency`;
    const safePlaySound = typeof playSound === 'function' ? playSound : (sound) => console.log(`Sound: ${sound}`);
    const safeAddWinToLeaderboard = typeof addWinToLeaderboard === 'function' ? addWinToLeaderboard : (game, amount) => console.log(`Leaderboard: ${game} +${amount}`);
    const safeUpdateCurrencyDisplay = typeof updateCurrencyDisplay === 'function' ? updateCurrencyDisplay : (status) => console.log(`Currency display updated: ${status || 'loss'}`);

    if (playerWon) {
        const winnerOdds = horseOdds[winnerIndex] != null ? horseOdds[winnerIndex] : 2.0; // Fallback odds
        const winAmount = Math.floor(horseraceBet * winnerOdds);
        const profit = winAmount;

        if (typeof currency !== 'undefined') currency += winAmount;
        if (typeof totalGain !== 'undefined') totalGain += Math.max(0, profit);
        
        if(horseraceStatus) horseraceStatus.textContent = `${winnerName} wins at ${winnerOdds.toFixed(2)}:1! You won ${safeFormatWin(profit)}!`;
        safePlaySound('race_win');
        safeAddWinToLeaderboard('Race', profit);
        safeUpdateCurrencyDisplay('win');
    } else {
        if (typeof totalLoss !== 'undefined') totalLoss += horseraceBet;
        const winnerOddsValue = horseOdds[winnerIndex] != null ? horseOdds[winnerIndex] : 0;
        if(horseraceStatus) horseraceStatus.textContent = `${winnerName} wins (${winnerOddsValue.toFixed(2)}:1). You lost ${safeFormatWin(horseraceBet)}.`;
        safePlaySound('lose');
        safeUpdateCurrencyDisplay();
    }

    setTimeout(() => {
        if (!horseraceActive) {
             resetHorserace();
        }
    }, 3000);

    if (typeof saveGameState === 'function') saveGameState();
}

// Ensure initHorserace is called, e.g., in main.js on DOMContentLoaded
// document.addEventListener('DOMContentLoaded', () => { if (typeof initHorserace === 'function') initHorserace(); });
