/**
 * Brokie Casino - Horse Race Game Logic (horserace.js)
 *
 * v9.1 - Randomized Race Logic
 * Features a purely random horse race. Odds-based payouts.
 * All unique horse abilities and complex stats have been removed for a random outcome.
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
let horseOdds = []; // To store calculated odds for the current race

const NUM_HORSES = 6;
// Constants for random advancement in raceStep
const MIN_ADVANCE_PER_FRAME = 0.5; // Minimum pixels a horse can advance per frame
const MAX_ADVANCE_PER_FRAME = 2.5; // Maximum pixels a horse can advance per frame


// --- Simplified Horse Data (No Abilities/Stats) ---
const HORSES = [
    { name: "Panda", color: '#ef4444' },
    { name: "Quinton", color: '#f97316' },
    { name: "Blaze", color: '#3b82f6' },
    { name: "Matt", color: '#a855f7' },
    { name: "Liqhtu", color: '#10b981' },
    { name: "Joker", color: '#eab308' }
];

// --- DOM Elements ---
let horseraceBetInput, horseraceSelectionContainer, horseraceTrack;
let horseraceStartButton, horseraceStatus;
let trackWidth = 0;
const finishLinePos = 25; // Position of the finish line from the left edge of the track

// Per-Race Horse State is no longer needed as abilities are removed.

/**
 * Initializes the Horse Race game.
 */
function initHorserace() {
    console.log("Initializing Horse Race (v9.1 - Randomized Logic)...");
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
    resetHorserace(); // This will calculate and display odds

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
 * In a purely random system, all horses have an equal chance.
 */
function calculatePowerRatings() {
    // Assign a flat, equal rating to all horses.
    return HORSES.map(() => 50); // Arbitrary equal rating (e.g., 50)
}

/**
 * Calculates odds for each horse based on power ratings.
 */
function calculateAndDisplayOdds() {
    const powerRatings = calculatePowerRatings();
    const totalPower = powerRatings.reduce((sum, rating) => sum + rating, 0);

    if (totalPower === 0) {
        // Fallback if totalPower is zero (shouldn't happen with flat ratings)
        horseOdds = HORSES.map(() => 10);
    } else {
        const houseEdge = 0.10; // 10% house edge
        horseOdds = powerRatings.map(rating => {
            if (rating <= 0) return 100; // Assign high odds for zero or negative rating
            const chance = rating / totalPower;
            if (chance <= 0) return 100;
            let calculatedOdds = (1 / chance) * (1 - houseEdge);
            // Cap odds between a minimum (e.g., 1.5:1) and a maximum (e.g., 50:1)
            return parseFloat(Math.max(1.5, Math.min(calculatedOdds, 50)).toFixed(2));
        });
    }

    const buttons = horseraceSelectionContainer.querySelectorAll('.horse-select-btn');
    buttons.forEach((button, index) => {
        const oddsDisplay = button.querySelector('.horse-odds-display');
        if (oddsDisplay && horseOdds[index] != null) {
            oddsDisplay.textContent = ` (${horseOdds[index].toFixed(2)}:1)`;
        } else if (oddsDisplay) {
            oddsDisplay.textContent = ` (N/A)`;
        }
    });
}


/**
 * Creates the horse selection buttons UI.
 * Ability information is removed.
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
        
        const oddsDisplaySpan = document.createElement('span');
        oddsDisplaySpan.className = 'horse-odds-display text-sm text-yellow-400 ml-1';
        oddsDisplaySpan.textContent = ` (Calculating...)`; // Odds will be filled by calculateAndDisplayOdds

        button.appendChild(colorIndicator);
        button.appendChild(nameSpan);
        button.appendChild(oddsDisplaySpan);
        // Removed ability name and description spans

        button.addEventListener('click', () => {
            if (horseraceActive) return;
            if (typeof playSound === 'function') playSound('click');
            horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            selectedHorseIndex = index;
            if(horseraceStatus) {
                const currentOdds = horseOdds[index] != null ? horseOdds[index].toFixed(2) + ':1' : '...';
                horseraceStatus.textContent = `Selected ${horse.name} (${currentOdds}). Place bet & start!`;
            }
        });
        horseraceSelectionContainer.appendChild(button);
    });
    // calculateAndDisplayOdds(); // Called by resetHorserace during init and after races
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
        horse.textContent = '🐎'; // Horse emoji
        horse.style.color = HORSES[i].color;
        horse.style.right = '10px'; // Initial position from the right (start line)

        lane.appendChild(horse);
        horseraceTrack.appendChild(lane);
        horseElements.push(horse);
        horseLaneElements.push(lane);
    }

    // Create a visual finish line
    const finishLine = document.createElement('div');
    finishLine.id = 'horserace-finish-line';
    // Style the finish line via CSS (e.g., position absolute, left: finishLinePos + 'px', border, height)
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
    horsePositions = new Array(NUM_HORSES).fill(10); // Reset to initial start position (10px from right)
    
    // initializeHorseRaceStates(); // REMOVED - No complex states anymore

    horseElements.forEach((horse, index) => {
        if (horse) {
            horse.style.right = `${horsePositions[index]}px`;
            horse.classList.remove('animate-pulse'); // Remove winner pulse if any
        }
    });

    // Clear any trails from previous race
    if (horseraceTrack) {
        horseraceTrack.querySelectorAll('.horse-trail').forEach(trail => trail.remove());
    }

    if (horseraceStartButton) horseraceStartButton.disabled = false;
    if (horseraceBetInput) horseraceBetInput.disabled = false;
    if (horseraceSelectionContainer) {
        horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.disabled = false);
    }
    
    calculateAndDisplayOdds(); // Recalculate and display odds for the new round

    if (horseraceStatus) {
        if (selectedHorseIndex === -1 || !HORSES[selectedHorseIndex]) {
            horseraceStatus.textContent = 'Place your bet and pick a horse!';
        } else {
            const horse = HORSES[selectedHorseIndex]; // Get selected horse
            const currentOdds = horseOdds[selectedHorseIndex] != null ? horseOdds[selectedHorseIndex].toFixed(2) + ':1' : '...';
            horseraceStatus.textContent = `Selected ${horse.name} (${currentOdds}). Place bet & start!`;
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
    // Use a safe wrapper for showMessage in case it's not defined in main.js
    const safeShowMessage = typeof showMessage === 'function' ? showMessage : (msg, dur) => console.log(`Message: ${msg}`);
    const currentCurrency = typeof currency !== 'undefined' ? currency : 0; // Get currency from main.js

    if (isNaN(betAmount) || betAmount <= 0) { safeShowMessage("Please enter a valid positive bet amount.", 2000); return; }
    if (betAmount > currentCurrency) { safeShowMessage("Not enough currency!", 2000); return; }
    if (selectedHorseIndex < 0 || selectedHorseIndex >= NUM_HORSES) { safeShowMessage("Please select a horse.", 2000); return; }

    // Ensure horses are created and track width is known
    if (horseElements.length === 0 || trackWidth <= 0) {
        createHorses(); // Attempt to create horses if not already done
        if (horseElements.length === 0 || trackWidth <= 0) {
            safeShowMessage("Error initializing race track. Try switching tabs or resizing.", 3000);
            return;
        }
    }
    
    // initializeHorseRaceStates(); // REMOVED - No complex states
    calculateAndDisplayOdds(); // Ensure odds are up-to-date (though they are flat now)

    if (typeof startTone === 'function') startTone(); // From main.js
    if (typeof playSound === 'function') playSound('race_start'); // From main.js
    horseraceBet = betAmount;

    if (typeof currency !== 'undefined' && typeof updateCurrencyDisplay === 'function') {
        currency -= betAmount; // Deduct bet from main.js currency
        updateCurrencyDisplay('loss'); // Update display in main.js
    } else {
        console.warn('Currency or updateCurrencyDisplay not found in main.js.');
    }

    horseraceActive = true;
    horseraceStartButton.disabled = true;
    horseraceBetInput.disabled = true;
    horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.disabled = true);
    horseraceStatus.textContent = 'And they\'re off!';

    horsePositions = new Array(NUM_HORSES).fill(10); // Reset positions to start (10px from right)

    // Reset visual positions and clear trails
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
        if (!horseraceActive) return; // Stop animation if race is no longer active

        let winner = -1;
        raceFrameCounter++;

        horsePositions = horsePositions.map((pos, i) => {
            if (!horseElements[i] || !HORSES[i]) return pos; // Skip if horse element or data doesn't exist

            const horseElem = horseElements[i];
            const horseWidth = horseElem.offsetWidth || 20; // Get horse element width, fallback to 20px
            
            // Calculate current position from the left edge for finish line check
            // pos is distance from right. trackWidth - pos is distance from left (of right edge of horse).
            // trackWidth - pos - horseWidth is distance from left (of left edge of horse).
            const currentLeftEdgePos = trackWidth - pos - horseWidth;

            // Check if horse has crossed the finish line (finishLinePos from left)
            if (currentLeftEdgePos <= finishLinePos) {
                if (winner === -1) winner = i; // Declare first horse to cross as winner
                // Ensure horse stops exactly at the finish line visually
                return trackWidth - finishLinePos - horseWidth;
            }

            // --- RANDOM ADVANCEMENT LOGIC ---
            const advancement = Math.random() * (MAX_ADVANCE_PER_FRAME - MIN_ADVANCE_PER_FRAME) + MIN_ADVANCE_PER_FRAME;
            const newPos = pos + advancement;
            // --- END RANDOM ADVANCEMENT LOGIC ---
            
            horseElem.style.right = `${newPos}px`;

            // Add a visual trail effect (optional)
            if (raceFrameCounter % 5 === 0 && horseLaneElements[i]) {
                const trail = document.createElement('div');
                trail.className = 'horse-trail';
                trail.style.backgroundColor = HORSES[i].color;
                trail.style.right = `${newPos - 5}px`; // Position trail slightly behind horse
                trail.style.top = `${horseElem.offsetTop + horseElem.offsetHeight / 2 - 2}px`; // Center trail vertically
                horseLaneElements[i].appendChild(trail);
                setTimeout(() => trail.remove(), 500); // Trail fades quickly
            }

            // Play step sound periodically
            if (raceFrameCounter % 12 === 0 && typeof playSound === 'function') playSound('race_step');

            // Re-check for finish after moving
            const newLeftEdgePos = trackWidth - newPos - horseWidth;
            if (newLeftEdgePos <= finishLinePos && winner === -1) {
                winner = i;
                const finalVisualPos = trackWidth - finishLinePos - horseWidth;
                horseElem.style.right = `${finalVisualPos}px`;
                return finalVisualPos;
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
    if (typeof saveGameState === 'function') saveGameState(); // From main.js
}

/**
 * Finishes the horse race and processes results.
 */
function finishRace(winnerIndex) {
    if (!horseraceActive) return; // Should not happen, but good check
    if (!horseraceStatus || !horseraceStartButton || !horseraceBetInput || !horseraceSelectionContainer) {
        console.error("Cannot finish race, essential DOM elements missing.");
        // Allow reset to happen anyway
    }

    cancelAnimationFrame(raceAnimationId);
    raceAnimationId = null;
    horseraceActive = false; // Mark race as inactive

    const winnerHorse = HORSES[winnerIndex];
    const winnerName = winnerHorse?.name || `Horse ${winnerIndex + 1}`; // Fallback name
    const playerWon = winnerIndex === selectedHorseIndex;

    // Add a visual cue for the winning horse
    if(horseElements[winnerIndex]) {
        horseElements[winnerIndex].classList.add('animate-pulse'); // Requires Tailwind or custom CSS for pulse
    }

    // Safe wrappers for functions from main.js
    const safeFormatWin = typeof formatWin === 'function' ? formatWin : (amount) => `${amount} currency`;
    const safePlaySound = typeof playSound === 'function' ? playSound : (sound) => console.log(`Sound: ${sound}`);
    const safeAddWinToLeaderboard = typeof addWinToLeaderboard === 'function' ? addWinToLeaderboard : (game, amount) => console.log(`Leaderboard: ${game} +${amount}`);
    const safeUpdateCurrencyDisplay = typeof updateCurrencyDisplay === 'function' ? updateCurrencyDisplay : (status) => console.log(`Currency display updated: ${status || 'loss'}`);


    if (playerWon) {
        const winnerOdds = horseOdds[winnerIndex] != null ? horseOdds[winnerIndex] : 2.0; // Fallback odds if not found
        const winAmount = Math.floor(horseraceBet * winnerOdds); // Total amount returned to player
        // const profit = winAmount - horseraceBet; // This is incorrect, winAmount is the total, bet already deducted visually
        const profit = winAmount; // The actual amount won, on top of getting the bet back (which is handled by adding winAmount)

        if (typeof currency !== 'undefined') currency += winAmount; // Add winnings to main.js currency
        if (typeof totalGain !== 'undefined') totalGain += profit; // Track total gain in main.js
        
        if(horseraceStatus) horseraceStatus.textContent = `${winnerName} wins at ${winnerOdds.toFixed(2)}:1! You won ${safeFormatWin(profit)}!`;
        safePlaySound('race_win');
        safeAddWinToLeaderboard('Race', profit);
        safeUpdateCurrencyDisplay('win');
    } else {
        if (typeof totalLoss !== 'undefined') totalLoss += horseraceBet; // Track total loss in main.js
        const winnerOddsValue = horseOdds[winnerIndex] != null ? horseOdds[winnerIndex] : 0; // Odds of actual winner
        if(horseraceStatus) horseraceStatus.textContent = `${winnerName} wins (${winnerOddsValue.toFixed(2)}:1). You lost ${safeFormatWin(horseraceBet)}.`;
        safePlaySound('lose');
        safeUpdateCurrencyDisplay(); // Default to 'loss' or no status change if that's how main.js handles it
    }

    // Enable UI for next race after a delay
    setTimeout(() => {
        if (!horseraceActive) { // Ensure race hasn't been restarted somehow
             resetHorserace();
        }
    }, 3000); // 3 second delay before resetting UI

    if (typeof saveGameState === 'function') saveGameState(); // Save game state from main.js
}

// Ensure initHorserace is called, typically from main.js after DOM is loaded.
// Example: document.addEventListener('DOMContentLoaded', () => { if (typeof initHorserace === 'function') initHorserace(); });
