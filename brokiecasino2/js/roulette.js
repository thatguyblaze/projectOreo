/**
 * ==========================================================================
 * Brokie Casino - Roulette Game Logic
 *
 * Handles betting, spinning the wheel, calculating results, and updating UI
 * for the Roulette game. Interacts with BrokieAPI for core functions.
 * ==========================================================================
 */

// --- Roulette Specific Constants ---
const ROULETTE_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
]; // Standard European Roulette wheel sequence
const ROULETTE_COLORS = {
    0: 'green', 1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
    11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
    21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
    31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};
const ROULETTE_PAYOUTS = {
    single: 35, // Bet on one number (pays 35 to 1)
    red: 1,     // Bet on red (pays 1 to 1)
    black: 1,   // Bet on black (pays 1 to 1)
    odd: 1,     // Bet on odd (pays 1 to 1)
    even: 1,    // Bet on even (pays 1 to 1)
    low: 1,     // Bet on 1-18 (pays 1 to 1)
    high: 1     // Bet on 19-36 (pays 1 to 1)
    // Add more bet types (split, street, corner, dozen, column) if desired
};
const TOTAL_NUMBERS = ROULETTE_NUMBERS.length; // Should be 37 for European wheel
const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;

// --- Roulette State Variables ---
let rouletteIsSpinning = false;
let currentRouletteBetType = null; // e.g., 'single', 'red', 'odd', or a specific number
let currentRouletteBetNumber = null; // The specific number if bet type is 'single'
let selectedBetButton = null; // The DOM element of the selected bet button

// --- DOM Element References ---
let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
    rouletteSpinButton, rouletteStatus, rouletteInsideBetsContainer, rouletteOutsideBetsContainer,
    rouletteCurrentBetTypeDisplay;

/**
 * Initializes the Roulette game elements and event listeners.
 */
function initRoulette() {
    // Get references to DOM elements specific to Roulette
    rouletteWheel = document.getElementById('roulette-wheel');
    roulettePointer = document.getElementById('roulette-pointer');
    rouletteResultDisplay = document.getElementById('roulette-result');
    rouletteBetInput = document.getElementById('roulette-bet');
    rouletteSpinButton = document.getElementById('roulette-spin-button');
    rouletteStatus = document.getElementById('roulette-status');
    rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets');
    rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets');
    rouletteCurrentBetTypeDisplay = document.getElementById('roulette-current-bet-type');

    // Check if elements exist before proceeding
    if (!rouletteWheel || !roulettePointer || !rouletteResultDisplay || !rouletteBetInput ||
        !rouletteSpinButton || !rouletteStatus || !rouletteInsideBetsContainer ||
        !rouletteOutsideBetsContainer || !rouletteCurrentBetTypeDisplay) {
        console.error("Roulette initialization failed: Could not find all required elements.");
        // Optionally disable the roulette tab or show an error message
        const tab = document.getElementById('tab-roulette');
        if(tab) tab.style.display = 'none'; // Hide tab if elements missing
        return;
    }

    // Create the betting grid buttons
    createRouletteBettingGrid();
    // Place numbers visually on the wheel
    placeNumbersOnWheel();
    // Setup event listeners for betting and spinning
    setupRouletteEventListeners();
    // Setup generic bet adjustment buttons using the factory from main.js
    BrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);

    // Initial reset
    resetRoulette();
    console.log("Roulette Initialized");
}

/**
 * Creates the number buttons (0-36) for the inside betting grid.
 */
function createRouletteBettingGrid() {
    if (!rouletteInsideBetsContainer) return;
    rouletteInsideBetsContainer.innerHTML = ''; // Clear previous grid if any

    // Create button for 0 (spans across top or separate)
    const zeroButton = document.createElement('button');
    zeroButton.textContent = '0';
    zeroButton.classList.add('roulette-bet-btn', 'green', 'col-span-3'); // Span 3 columns
    zeroButton.dataset.betType = 'single';
    zeroButton.dataset.betNumber = '0';
    rouletteInsideBetsContainer.appendChild(zeroButton);

    // Create buttons for 1-36
    for (let i = 1; i <= 36; i++) {
        const button = document.createElement('button');
        button.textContent = i.toString();
        button.classList.add('roulette-bet-btn');
        const color = ROULETTE_COLORS[i];
        button.classList.add(color); // Add 'red' or 'black' class
        button.dataset.betType = 'single';
        button.dataset.betNumber = i.toString();
        rouletteInsideBetsContainer.appendChild(button);
    }
}

/**
 * Places the number elements visually onto the roulette wheel graphic.
 * Calculates position and rotation for each number.
 */
function placeNumbersOnWheel() {
    if (!rouletteWheel) return;
    rouletteWheel.innerHTML = ''; // Clear any existing numbers first

    const wheelRadius = rouletteWheel.offsetWidth / 2;
    // Adjust numberRadius based on font size and desired position from edge
    const numberRadius = wheelRadius * 0.85; // Place numbers 85% out from the center

    ROULETTE_NUMBERS.forEach((num, index) => {
        const angleDegrees = (ANGLE_PER_NUMBER * index) - (ANGLE_PER_NUMBER / 2) - 90; // Center in segment, adjust offset
        const angleRadians = angleDegrees * (Math.PI / 180);

        const numberSpan = document.createElement('span');
        numberSpan.textContent = num.toString();
        numberSpan.classList.add('roulette-number', `num-${num}`); // Add class for potential specific styling

        // Calculate position using trigonometry
        const x = wheelRadius + numberRadius * Math.cos(angleRadians);
        const y = wheelRadius + numberRadius * Math.sin(angleRadians);

        // Apply styles for positioning and rotation
        numberSpan.style.position = 'absolute';
        numberSpan.style.left = `${x}px`;
        numberSpan.style.top = `${y}px`;
        // Rotate number to be upright relative to the center, adjust transform origin if needed
        numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees + 90}deg)`;

        rouletteWheel.appendChild(numberSpan);
    });
}


/**
 * Sets up event listeners for roulette betting buttons and the spin button.
 */
function setupRouletteEventListeners() {
    // Use event delegation for betting buttons (more efficient)
    rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement);
    rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement);

    // Spin button listener
    rouletteSpinButton.addEventListener('click', spinWheel);
}

/**
 * Handles clicks on any betting button (inside or outside).
 * Updates the current bet state and highlights the selected button.
 * @param {Event} event - The click event object.
 */
function handleBetPlacement(event) {
    if (rouletteIsSpinning) return; // Don't allow betting while spinning

    const target = event.target;
    // Check if the clicked element is a bet button
    if (target.classList.contains('roulette-bet-btn')) {
        // Remove highlight from previously selected button
        if (selectedBetButton) {
            selectedBetButton.classList.remove('selected');
        }

        // Get bet details from data attributes
        currentRouletteBetType = target.dataset.betType;
        currentRouletteBetNumber = target.dataset.betNumber || null; // Null for outside bets

        // Highlight the newly selected button
        target.classList.add('selected');
        selectedBetButton = target;

        // Update the display showing the current bet type
        let betText = currentRouletteBetType;
        if (currentRouletteBetType === 'single' && currentRouletteBetNumber !== null) {
            betText = `Number ${currentRouletteBetNumber}`;
        } else {
            // Capitalize first letter for display
            betText = betText.charAt(0).toUpperCase() + betText.slice(1);
        }
        rouletteCurrentBetTypeDisplay.textContent = betText;
        rouletteSpinButton.disabled = false; // Enable spin button once a bet is selected
        BrokieAPI.playSound('click'); // Play click sound
    }
}

/**
 * Resets the roulette game to its initial state.
 * Clears selection, resets wheel rotation, enables controls.
 * @param {boolean} [isSwitchingTabs=false] - Flag indicating if reset is due to tab switch.
 */
function resetRoulette(isSwitchingTabs = false) {
    rouletteIsSpinning = false;
    // Clear selected button highlight
    if (selectedBetButton) {
        selectedBetButton.classList.remove('selected');
        selectedBetButton = null;
    }
    currentRouletteBetType = null;
    currentRouletteBetNumber = null;
    rouletteCurrentBetTypeDisplay.textContent = 'None';
    rouletteResultDisplay.textContent = '?'; // Reset result display
    rouletteResultDisplay.style.backgroundColor = 'rgba(28, 28, 28, 0.85)'; // Reset background
    rouletteResultDisplay.style.color = '#fff'; // Reset text color
    rouletteStatus.textContent = 'Place your bet!';

    // Reset wheel rotation smoothly only if not switching tabs
    if (rouletteWheel) {
         if (!isSwitchingTabs) {
            rouletteWheel.style.transition = 'transform 0.5s ease-out'; // Smooth reset transition
            rouletteWheel.style.transform = `rotate(0deg)`;
         } else {
             rouletteWheel.style.transition = 'none'; // Instant reset when switching tabs
             rouletteWheel.style.transform = `rotate(0deg)`;
         }
    }

    // Ensure controls are enabled (except spin button until bet is placed)
    rouletteSpinButton.disabled = true;
    rouletteBetInput.disabled = false;
    // Re-enable betting buttons
    rouletteInsideBetsContainer.style.pointerEvents = 'auto';
    rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
}

/**
 * Starts the roulette spin animation and determines the winner.
 */
function spinWheel() {
    if (rouletteIsSpinning || !currentRouletteBetType) {
        BrokieAPI.showMessage("Please place a bet first!", 1500);
        return;
    }

    const betAmount = parseInt(rouletteBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        BrokieAPI.showMessage("Invalid bet amount.", 1500);
        return;
    }
    if (betAmount > BrokieAPI.getBalance()) {
        BrokieAPI.showMessage("Not enough balance!", 1500);
        return;
    }

    // Start the spin
    rouletteIsSpinning = true;
    BrokieAPI.playSound('roulette_spin');
    BrokieAPI.updateBalance(-betAmount); // Deduct bet amount immediately
    rouletteStatus.textContent = 'Spinning...';
    rouletteSpinButton.disabled = true;
    rouletteBetInput.disabled = true;
    // Disable betting buttons
    rouletteInsideBetsContainer.style.pointerEvents = 'none';
    rouletteOutsideBetsContainer.style.pointerEvents = 'none';
    if (selectedBetButton) selectedBetButton.classList.remove('selected'); // Remove highlight during spin


    // --- Calculate Winning Number and Spin Animation ---
    const randomIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
    const winningNumber = ROULETTE_NUMBERS[randomIndex];
    const winningColor = ROULETTE_COLORS[winningNumber];

    // Calculate target angle:
    // Base angle for the number's center + multiple full rotations + random offset within segment
    const targetAngle = (randomIndex * ANGLE_PER_NUMBER) + (360 * (5 + Math.floor(Math.random() * 3))) + (Math.random() * ANGLE_PER_NUMBER * 0.8 - ANGLE_PER_NUMBER * 0.4);

    // Apply spin animation using CSS transition
    rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.4, 1)'; // Spin transition
    rouletteWheel.style.transform = `rotate(${targetAngle}deg)`;

    // --- Handle Spin Completion ---
    setTimeout(() => {
        rouletteIsSpinning = false;
        BrokieAPI.playSound('roulette_ball'); // Sound for ball landing

        // Display winning number and color
        rouletteResultDisplay.textContent = winningNumber.toString();
        let resultBgColor = '#111827'; // Default black
        let resultTextColor = '#fff';
        if (winningColor === 'red') resultBgColor = '#e81123'; // fluent-danger
        if (winningColor === 'green') {
            resultBgColor = '#107c10'; // fluent-accent
            resultTextColor = '#fff';
        }
        rouletteResultDisplay.style.backgroundColor = resultBgColor;
        rouletteResultDisplay.style.color = resultTextColor;


        // --- Determine Win/Loss ---
        let winAmount = 0;
        let winMultiplier = 0;
        let won = false;

        if (currentRouletteBetType === 'single' && parseInt(currentRouletteBetNumber) === winningNumber) {
            winMultiplier = ROULETTE_PAYOUTS.single;
            won = true;
        } else if (currentRouletteBetType === 'red' && winningColor === 'red') {
            winMultiplier = ROULETTE_PAYOUTS.red;
            won = true;
        } else if (currentRouletteBetType === 'black' && winningColor === 'black') {
            winMultiplier = ROULETTE_PAYOUTS.black;
            won = true;
        } else if (currentRouletteBetType === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) {
            winMultiplier = ROULETTE_PAYOUTS.odd;
            won = true;
        } else if (currentRouletteBetType === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
            winMultiplier = ROULETTE_PAYOUTS.even;
            won = true;
        } else if (currentRouletteBetType === 'low' && winningNumber >= 1 && winningNumber <= 18) {
            winMultiplier = ROULETTE_PAYOUTS.low;
            won = true;
        } else if (currentRouletteBetType === 'high' && winningNumber >= 19 && winningNumber <= 36) {
            winMultiplier = ROULETTE_PAYOUTS.high;
            won = true;
        }

        // Calculate winnings (payout + original bet back)
        if (won) {
            winAmount = betAmount + (betAmount * winMultiplier);
            BrokieAPI.updateBalance(winAmount); // Add winnings to balance
            rouletteStatus.textContent = `Win! ${winningNumber} (${winningColor}). You won ${BrokieAPI.formatWin(winAmount - betAmount)}!`;
            BrokieAPI.showMessage(`You won ${BrokieAPI.formatWin(winAmount - betAmount)}!`, 2500);
            BrokieAPI.playSound('roulette_win');
            BrokieAPI.addWin('Roulette', winAmount - betAmount); // Add net win to leaderboard
        } else {
            rouletteStatus.textContent = `Lose! Landed on ${winningNumber} (${winningColor}).`;
            BrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 2500);
            BrokieAPI.playSound('lose');
        }

        // Reset for next round after a short delay
        setTimeout(() => {
             // Only reset if the tab is still active
             const currentActiveTab = document.querySelector('.tab-button[aria-current="page"]');
             if (currentActiveTab && currentActiveTab.id === 'tab-roulette') {
                resetRoulette();
             }
        }, 2000); // Delay before resetting UI

    }, 4100); // Slightly longer than the CSS transition duration
}

// Make init function globally accessible if main.js calls it directly
// Or rely on main.js calling it via BrokieAPI if preferred.
// window.initRoulette = initRoulette;
