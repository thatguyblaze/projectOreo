/**
 * Brokie Casino - Roulette Game Logic (roulette.js)
 *
 * Handles all functionality related to the Roulette game.
 * Depends on functions and variables defined in main.js.
 */

// --- Roulette Specific State & Constants ---
let rouletteBet = 0; // Current bet amount per spin
let rouletteSelectedBet = null; // { type: 'number'/'red'/'black'/'odd'/'even'/'low'/'high', value: number | null }
let rouletteIsSpinning = false; // Flag specifically for animation state
const ROULETTE_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]; // Standard European order
const ROULETTE_NUMBER_COLORS = {}; // Populated in initRoulette
const ROULETTE_SPIN_DURATION = 4000; // ms for wheel spin animation (should match CSS transition)
let currentWheelAngle = 0; // Tracks the visual rotation state for smooth spins

// --- DOM Elements (Roulette Specific) ---
let rouletteBetInput, rouletteWheel, rouletteResultDisplay;
let rouletteInsideBetsContainer, rouletteOutsideBetsContainer;
let rouletteSpinButton, rouletteStatus, rouletteCurrentBetSpan;

/**
 * Initializes the Roulette game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initRoulette() {
    console.log("Initializing Roulette...");
    // Get DOM elements
    rouletteBetInput = document.getElementById('roulette-bet');
    rouletteWheel = document.getElementById('roulette-wheel');
    rouletteResultDisplay = document.getElementById('roulette-result');
    rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets');
    rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets');
    rouletteSpinButton = document.getElementById('roulette-spin-button');
    rouletteStatus = document.getElementById('roulette-status');
    rouletteCurrentBetSpan = document.getElementById('roulette-current-bet-type');

    // Check if all essential elements were found
    if (!rouletteBetInput || !rouletteWheel || !rouletteResultDisplay ||
        !rouletteInsideBetsContainer || !rouletteOutsideBetsContainer ||
        !rouletteSpinButton || !rouletteStatus || !rouletteCurrentBetSpan) {
        console.error("Roulette initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-roulette');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Roulette elements.</p>';
        return; // Stop initialization
    }

    // Define number colors and create betting grid (if not already done by tab activation)
    initializeRouletteColors();
    if (!rouletteInsideBetsContainer.hasChildNodes()) {
        createRouletteBettingGrid();
    }

    // Set initial state
    resetRoulette();

    // Add Event Listeners
    rouletteSpinButton.addEventListener('click', spinRouletteWheel);

    // Add listeners for outside bet buttons (since they exist in HTML)
    rouletteOutsideBetsContainer.querySelectorAll('.roulette-bet-btn').forEach(button => {
        button.addEventListener('click', () => selectRouletteBet(button.dataset.betType, null, button));
    });

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('roulette', rouletteBetInput); // uses main.js

    console.log("Roulette Initialized.");
}

/**
 * Populates the ROULETTE_NUMBER_COLORS map based on standard roulette layout.
 */
function initializeRouletteColors() {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    ROULETTE_NUMBERS.forEach(num => {
        if (num === 0) {
            ROULETTE_NUMBER_COLORS[num] = 'green';
        } else if (redNumbers.includes(num)) {
            ROULETTE_NUMBER_COLORS[num] = 'red';
        } else {
            ROULETTE_NUMBER_COLORS[num] = 'black';
        }
    });
}

/**
 * Creates the number buttons (0-36) for the roulette betting grid.
 * Called by initRoulette or setActiveTab.
 */
function createRouletteBettingGrid() {
    if (!rouletteInsideBetsContainer) return;
    rouletteInsideBetsContainer.innerHTML = ''; // Clear previous grid

    // Add button for 0
    const zeroButton = document.createElement('button');
    zeroButton.className = 'roulette-bet-btn green'; // Classes from style.css
    zeroButton.textContent = '0';
    zeroButton.dataset.betType = 'number';
    zeroButton.dataset.betValue = '0';
    zeroButton.style.gridColumn = 'span 3'; // Make 0 span full width
    zeroButton.addEventListener('click', () => selectRouletteBet('number', 0, zeroButton));
    rouletteInsideBetsContainer.appendChild(zeroButton);

    // Add buttons for 1-36
    for (let i = 1; i <= 36; i++) {
        const button = document.createElement('button');
        const color = ROULETTE_NUMBER_COLORS[i] || 'black'; // Default to black if color not found
        button.className = `roulette-bet-btn ${color}`; // Classes from style.css
        button.textContent = i;
        button.dataset.betType = 'number';
        button.dataset.betValue = i;
        button.addEventListener('click', () => selectRouletteBet('number', i, button));
        rouletteInsideBetsContainer.appendChild(button);
    }
    console.log("Roulette betting grid created.");
}

/**
 * Resets the roulette game state and UI elements.
 */
function resetRoulette() {
    rouletteIsSpinning = false;
    rouletteSelectedBet = null; // Clear selected bet

    // Reset buttons and inputs (check existence first)
    if (rouletteSpinButton) rouletteSpinButton.disabled = false;
    if (rouletteBetInput) rouletteBetInput.disabled = false;
    if (rouletteStatus) rouletteStatus.textContent = 'Place your bet!';
    if (rouletteCurrentBetSpan) rouletteCurrentBetSpan.textContent = 'None';

    // Reset wheel result display
    if (rouletteResultDisplay) {
        rouletteResultDisplay.textContent = '?';
        // Reset result display classes/styles (important!)
        rouletteResultDisplay.className = ''; // Clear all existing classes first
        // Re-apply base structural and appearance classes defined in the HTML/CSS
        // (Assuming these classes handle positioning, size, base colors etc.)
        rouletteResultDisplay.classList.add(
            'flex', 'items-center', 'justify-center',
            'absolute', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2',
            'w-16', 'h-16', /* Adjust size if needed */
            'bg-opacity-80', 'rounded-full',
            'text-2xl', 'font-bold', 'text-white', 'z-10', 'border-4'
        );
        // Apply default background/border colors from CSS
        rouletteResultDisplay.style.backgroundColor = 'rgba(20, 20, 20, 0.8)';
        rouletteResultDisplay.style.borderColor = '#4a4a4a'; // Match initial border
    }

    // Reset wheel rotation visually to the remainder angle for the next spin calculation
    if (rouletteWheel) {
        rouletteWheel.style.transition = 'none'; // Temporarily disable transition
        rouletteWheel.style.transform = `rotate(${currentWheelAngle % 360}deg)`;
        void rouletteWheel.offsetWidth; // Force reflow
        rouletteWheel.style.transition = ''; // Re-enable transition (will pick up from CSS)
    }


    // Enable betting buttons
    if (rouletteInsideBetsContainer) {
        rouletteInsideBetsContainer.querySelectorAll('.roulette-bet-btn').forEach(btn => btn.disabled = false);
    }
    if (rouletteOutsideBetsContainer) {
        rouletteOutsideBetsContainer.querySelectorAll('.roulette-bet-btn').forEach(btn => btn.disabled = false);
    }
    // Clear selection highlight
    document.querySelectorAll('.roulette-bet-btn.selected').forEach(btn => btn.classList.remove('selected'));
}

/**
 * Handles the selection of a bet type/value on the roulette table.
 * @param {string} type - The type of bet (e.g., 'number', 'red', 'even').
 * @param {number | null} value - The specific number bet on (null for outside bets).
 * @param {HTMLElement} clickedButton - The button element that was clicked.
 */
function selectRouletteBet(type, value, clickedButton) {
    if (rouletteIsSpinning) return; // Don't allow changing bet while spinning
    if (!rouletteCurrentBetSpan || !rouletteStatus) return; // Check elements
    playSound('click'); // uses main.js

    // Clear previous selection visual
    document.querySelectorAll('.roulette-bet-btn.selected').forEach(btn => btn.classList.remove('selected'));

    // Set new selection state
    rouletteSelectedBet = { type: type, value: value };
    if (clickedButton) {
        clickedButton.classList.add('selected'); // Highlight selected button (uses CSS)
    }

    // Update status display
    let betText = '';
    if (type === 'number') betText = `Number ${value}`;
    else betText = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize type name
    rouletteCurrentBetSpan.textContent = betText;
    rouletteStatus.textContent = `Betting on ${betText}. Spin the wheel!`;
}

/**
 * Spins the roulette wheel, determines the winner, and updates the game state.
 */
function spinRouletteWheel() {
    if (rouletteIsSpinning) return; // Don't spin if already spinning
    if (!rouletteBetInput || !rouletteSelectedBet || !rouletteWheel || !rouletteResultDisplay ||
        !rouletteSpinButton || !rouletteStatus || !rouletteInsideBetsContainer || !rouletteOutsideBetsContainer) {
        console.error("Cannot spin roulette, elements not initialized correctly.");
        showMessage("Error starting spin. Please reload.", 2000); // uses main.js
        return;
    }

    const betAmount = parseInt(rouletteBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
    }
    if (betAmount > currency) { // uses main.js
        showMessage("Not enough currency!", 2000); return; // uses main.js
    }
    // No need to check for rouletteSelectedBet here, already checked at start

    startTone(); // uses main.js
    playSound('roulette_spin'); // uses main.js
    rouletteBet = betAmount;
    currency -= betAmount; // uses main.js
    updateCurrencyDisplay('loss'); // uses main.js

    rouletteIsSpinning = true;
    // Disable controls during spin
    rouletteSpinButton.disabled = true;
    rouletteBetInput.disabled = true;
    rouletteInsideBetsContainer.querySelectorAll('.roulette-bet-btn').forEach(btn => btn.disabled = true);
    rouletteOutsideBetsContainer.querySelectorAll('.roulette-bet-btn').forEach(btn => btn.disabled = true);
    rouletteStatus.textContent = 'Spinning... No more bets!';
    rouletteResultDisplay.textContent = '...'; // Indicate spinning
    rouletteResultDisplay.style.backgroundColor = 'rgba(20, 20, 20, 0.8)'; // Reset background during spin
    rouletteResultDisplay.style.borderColor = '#4a4a4a';

    // --- Calculate Spin Result ---
    const winningNumberIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
    const winningColor = ROULETTE_NUMBER_COLORS[winningNumber] || 'black';

    // --- Calculate Target Angle ---
    const numberAngle = 360 / ROULETTE_NUMBERS.length;
    // Calculate the base angle for the winning number segment's center (0 degrees is top)
    const winningSegmentCenterAngle = (winningNumberIndex * numberAngle) + (numberAngle / 2);
    // Calculate the angle needed to rotate the wheel so the winning segment center aligns with the top pointer (0 degrees)
    // We subtract from 360 because CSS rotation is clockwise.
    const angleToWinningNumber = 360 - winningSegmentCenterAngle;

    // Add multiple full rotations for visual effect (e.g., 5-7 rotations)
    const fullRotations = (5 + Math.floor(Math.random() * 3)) * 360;

    // Calculate the final target angle based on the *current* visual angle plus rotations and offset
    // This ensures the wheel spins forward from its current position.
    const targetAngle = currentWheelAngle + fullRotations + angleToWinningNumber;

    // Apply the spin animation using CSS transition
    rouletteWheel.style.transform = `rotate(${targetAngle}deg)`;

    // Simulate ball bounce sounds during spin
    let ballSoundInterval = setInterval(() => {
        playSound('roulette_ball'); // uses main.js
    }, 150 + Math.random() * 150); // Random interval for ball sounds


    // --- Determine Result after Animation ---
    setTimeout(() => {
        clearInterval(ballSoundInterval); // Stop ball sounds
        rouletteIsSpinning = false; // Mark spinning as complete

        // Update the current angle state for the next spin calculation (use modulo for safety)
        currentWheelAngle = targetAngle % 360;

        // Check if elements still exist (user might have switched tabs)
        if (!rouletteResultDisplay || !rouletteStatus || !rouletteSpinButton || !rouletteBetInput ||
            !rouletteInsideBetsContainer || !rouletteOutsideBetsContainer) {
            console.warn("Roulette elements not found after spin timeout (tab switch?).");
            // No UI updates possible, state was likely saved before timeout.
            return;
        }


        // Display winning number and color
        rouletteResultDisplay.textContent = winningNumber;
        rouletteResultDisplay.className = ''; // Clear previous color classes
        // Re-apply base structural classes
        rouletteResultDisplay.classList.add(
            'flex', 'items-center', 'justify-center',
            'absolute', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2',
            'w-16', 'h-16', /* Adjust size if needed */
            'bg-opacity-80', 'rounded-full',
            'text-2xl', 'font-bold', 'text-white', 'z-10', 'border-4'
        );
        // Apply color styles based on result
        rouletteResultDisplay.style.backgroundColor = winningColor === 'red' ? '#ef4444' : winningColor === 'black' ? '#1f2937' : '#10b981';
        rouletteResultDisplay.style.borderColor = winningColor === 'red' ? '#dc2626' : winningColor === 'black' ? '#111827' : '#059669';


        // Calculate payout
        let winAmount = 0;
        let playerWins = false;
        const betType = rouletteSelectedBet.type;
        const betValue = rouletteSelectedBet.value;

        if (betType === 'number' && betValue === winningNumber) {
            winAmount = rouletteBet * 36; // 35:1 payout + original bet
            playerWins = true;
        } else if (betType === 'red' && winningColor === 'red') {
            winAmount = rouletteBet * 2; // 1:1 payout + original bet
            playerWins = true;
        } else if (betType === 'black' && winningColor === 'black') {
            winAmount = rouletteBet * 2;
            playerWins = true;
        } else if (betType === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) {
            winAmount = rouletteBet * 2;
            playerWins = true;
        } else if (betType === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
            winAmount = rouletteBet * 2;
            playerWins = true;
        } else if (betType === 'low' && winningNumber >= 1 && winningNumber <= 18) {
            winAmount = rouletteBet * 2;
            playerWins = true;
        } else if (betType === 'high' && winningNumber >= 19 && winningNumber <= 36) {
            winAmount = rouletteBet * 2;
            playerWins = true;
        }

        // Update currency and stats
        if (playerWins) {
            const profit = winAmount - rouletteBet;
            currency += winAmount; // uses main.js
            totalGain += Math.max(0, profit); // uses main.js
            rouletteStatus.textContent = `WIN! Number ${winningNumber} (${winningColor}). You won ${formatWin(profit)}!`; // uses main.js
            playSound('roulette_win'); // uses main.js
            addWinToLeaderboard('Roulette', profit); // uses main.js
            updateCurrencyDisplay('win'); // uses main.js
        } else {
            totalLoss += rouletteBet; // uses main.js
            rouletteStatus.textContent = `LOSE! Number ${winningNumber} (${winningColor}). You lost ${formatWin(rouletteBet)}.`; // uses main.js
            playSound('lose'); // uses main.js
            updateCurrencyDisplay(); // uses main.js
        }

        // Re-enable controls after a short delay
        setTimeout(() => {
             if (!rouletteIsSpinning) { // Only reset if another spin hasn't started
                  resetRoulette(); // Fully reset the game state for the next round
             }
        }, 1500);

        saveGameState(); // uses main.js

    }, ROULETTE_SPIN_DURATION); // Match CSS transition duration
}


// Note: The initRoulette() function will be called from main.js
// Ensure main.js includes: if (typeof initRoulette === 'function') initRoulette();
// within its DOMContentLoaded listener.
