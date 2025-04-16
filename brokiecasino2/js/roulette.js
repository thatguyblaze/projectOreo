// Check if the main function is already defined to prevent redeclaration errors
// This acts as a guard against the script running multiple times.
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.1 - Guarded)
     *
     * - Accepts BrokieAPI object during initialization.
     * - Uses passed API object for core functions (balance, sound, messages).
     * - Includes logic for placing numbers visually on the wheel.
     * - Fixes handling of outside bet button clicks.
     * - Added guard against multiple script executions.
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
    // These are now scoped within the guard block
    let rouletteIsSpinning = false;
    let currentRouletteBetType = null;
    let currentRouletteBetValue = null;
    let selectedBetButton = null;

    // --- DOM Element References ---
    // Declare variables, will be assigned in initRoulette
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer, rouletteOutsideBetsContainer,
        rouletteCurrentBetDisplay;

    // --- API Reference (Passed from main.js) ---
    // This declaration is now safe inside the guard block
    let LocalBrokieAPI = null;

    /**
     * Initializes the Roulette game elements and event listeners.
     * This function will now only be defined once globally.
     * @param {object} API - The BrokieAPI object passed from main.js.
     */
    function initRoulette(API) {
        // Assign the API reference
        LocalBrokieAPI = API;

        // Get references to DOM elements specific to Roulette
        rouletteWheel = document.getElementById('roulette-wheel');
        roulettePointer = document.getElementById('roulette-pointer');
        rouletteResultDisplay = document.getElementById('roulette-result');
        rouletteBetInput = document.getElementById('roulette-bet');
        rouletteSpinButton = document.getElementById('roulette-spin-button');
        rouletteStatusDisplay = document.getElementById('roulette-status');
        rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets');
        rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets');
        rouletteCurrentBetDisplay = document.getElementById('roulette-current-bet-type');

        // Check if elements exist before proceeding
        if (!rouletteWheel || !roulettePointer || !rouletteResultDisplay || !rouletteBetInput ||
            !rouletteSpinButton || !rouletteStatusDisplay || !rouletteInsideBetsContainer ||
            !rouletteOutsideBetsContainer || !rouletteCurrentBetDisplay || !LocalBrokieAPI) {
            console.error("Roulette initialization failed: Could not find all required elements or API.");
            const tab = document.getElementById('tab-roulette');
            if(tab) tab.style.display = 'none'; // Hide tab if setup fails
            return;
        }

        // Create the betting grid buttons
        createRouletteBettingGrid();
        // Place numbers visually on the wheel
        positionWheelNumbers();
        // Setup event listeners for betting and spinning
        setupRouletteEventListeners();
        // Setup generic bet adjustment buttons using the factory from main.js
        // Ensure BrokieAPI has the function before calling
        if (LocalBrokieAPI && typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
            LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
        } else {
            console.error("BrokieAPI.addBetAdjustmentListeners not found in roulette.js");
        }


        // Initial reset
        resetRoulette(false);
        console.log("Roulette Initialized (Guarded)"); // Updated log message
    }

    // --- All other functions (createRouletteBettingGrid, createBetButton, positionWheelNumbers, etc.) go here ---
    // --- They are now defined only if initRoulette wasn't already defined ---

    /**
     * Creates the number buttons (0-36) for the inside betting grid.
     */
    function createRouletteBettingGrid() {
        if (!rouletteInsideBetsContainer) {
            console.error("Roulette inside bets container not found!");
            return;
        }
        rouletteInsideBetsContainer.innerHTML = ''; // Clear previous grid if any
        console.log("Creating Roulette inside bet buttons...");

        // Create button for 0
        const zeroButton = createBetButton(0, 'green', 'single');
        zeroButton.classList.add('col-span-3'); // Span 3 columns
        rouletteInsideBetsContainer.appendChild(zeroButton);

        // Create buttons for 1-36
        for (let i = 1; i <= 36; i++) {
            const color = ROULETTE_COLORS[i];
            const button = createBetButton(i, color, 'single');
            rouletteInsideBetsContainer.appendChild(button);
        }
        console.log("Finished creating Roulette inside bet buttons.");
    }

    /**
     * Creates a single bet button element.
     */
    function createBetButton(value, color, betType) {
        const button = document.createElement('button');
        button.classList.add('roulette-bet-btn');
        if (color) button.classList.add(color); // Add 'red', 'black', 'green' class
        button.textContent = value;
        button.dataset.betType = betType;
        button.dataset.betValue = value; // Store the specific number/type
        return button;
    }

    /**
     * Positions the number elements (0-36) absolutely around the roulette wheel graphic.
     */
    function positionWheelNumbers() {
        if (!rouletteWheel) {
             console.error("Roulette wheel element not found for positioning numbers!");
             return;
        }

        // Use requestAnimationFrame to ensure layout is calculated before accessing offsetWidth
        requestAnimationFrame(() => {
            const wheelDiameter = rouletteWheel.offsetWidth;
            if (wheelDiameter <= 0) {
                console.warn("Roulette wheel still has no width after rAF, trying again shortly.");
                // Fallback to setTimeout if rAF didn't work (e.g., element still hidden)
                if (window.positionWheelTimeout) clearTimeout(window.positionWheelTimeout);
                window.positionWheelTimeout = setTimeout(positionWheelNumbers, 150); // Slightly longer delay
                return;
            }
            console.log("Positioning numbers on Roulette wheel (rAF)...");
            if (window.positionWheelTimeout) clearTimeout(window.positionWheelTimeout);

            const wheelRadius = wheelDiameter / 2;
            const numberRadius = wheelRadius * 0.85; // Radius for placing numbers

            // Clear any existing numbers first
            const existingNumbers = rouletteWheel.querySelectorAll('.roulette-number');
            existingNumbers.forEach(num => num.remove());

            ROULETTE_NUMBERS.forEach((num, index) => {
                // Calculate the angle for the center of the segment for this number
                const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2) - 90; // Center in segment, adjust offset
                const angleRadians = angleDegrees * (Math.PI / 180);

                const numberSpan = document.createElement('span');
                numberSpan.textContent = num.toString();
                numberSpan.classList.add('roulette-number', `num-${num}`); // Add class for styling

                // Calculate position using trigonometry
                const x = wheelRadius + numberRadius * Math.cos(angleRadians);
                const y = wheelRadius + numberRadius * Math.sin(angleRadians);

                // Apply styles for positioning and rotation
                numberSpan.style.position = 'absolute';
                numberSpan.style.left = `${x}px`;
                numberSpan.style.top = `${y}px`;
                // Rotate the number to be upright relative to the center
                numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees + 90}deg)`;

                rouletteWheel.appendChild(numberSpan);
            });
            console.log("Finished positioning numbers on Roulette wheel.");
        });
    }

    /**
     * Sets up event listeners for roulette betting buttons and the spin button.
     */
    function setupRouletteEventListeners() {
        // Ensure containers exist before adding listeners
        if (rouletteInsideBetsContainer) {
            rouletteInsideBetsContainer.addEventListener('click', handleBetSelection);
        } else {
            console.error("Roulette inside bets container not found for event listener.");
        }
        if (rouletteOutsideBetsContainer) {
            rouletteOutsideBetsContainer.addEventListener('click', handleBetSelection);
        } else {
             console.error("Roulette outside bets container not found for event listener.");
        }
        if (rouletteSpinButton) {
             rouletteSpinButton.addEventListener('click', spinWheel);
        } else {
             console.error("Roulette spin button not found for event listener.");
        }
    }

    /**
     * Handles clicks on any betting button (inside or outside).
     */
    function handleBetSelection(event) {
        if (rouletteIsSpinning) return; // Don't allow betting while spinning

        // Find the actual button element that was clicked
        const target = event.target.closest('.roulette-bet-btn');
        if (!target) return; // Exit if the click wasn't on a bet button or its child

        // Play sound only if API is available and function exists
        if (LocalBrokieAPI && typeof LocalBrokieAPI.playSound === 'function') {
            LocalBrokieAPI.playSound('click'); // Play click sound for bet selection
        }

        // Remove highlight from previously selected button
        if (selectedBetButton) {
            selectedBetButton.classList.remove('selected');
        }

        // Get bet details from data attributes
        const betType = target.dataset.betType;
        const betValue = target.dataset.betValue;

        // Set the bet type
        currentRouletteBetType = betType;
        // Set the bet value: parse if single, otherwise use the type string itself
        currentRouletteBetValue = (betType === 'single') ? parseInt(betValue, 10) : (betValue || betType);

        // Update the display showing the current bet type
        let betText = "None";
        if (currentRouletteBetType === 'single') {
            betText = `Number ${currentRouletteBetValue}`;
        } else if (currentRouletteBetType) {
            // Use the TYPE string for display text, capitalize it
            betText = currentRouletteBetType.charAt(0).toUpperCase() + currentRouletteBetType.slice(1);
            // Handle specific display text for low/high bets
            if (currentRouletteBetType === 'low') betText = '1-18';
            if (currentRouletteBetType === 'high') betText = '19-36';
        }
        // Update display only if element exists
        if (rouletteCurrentBetDisplay) rouletteCurrentBetDisplay.textContent = betText;

        // Highlight the newly selected button
        target.classList.add('selected');
        selectedBetButton = target;

        // Enable spin button only if it exists
        if (rouletteSpinButton) rouletteSpinButton.disabled = false;
    }

    /**
     * Resets the roulette game to its initial state.
     */
    function resetRoulette(resetWheelVisual = false) {
        rouletteIsSpinning = false;

        // Clear selected button highlight
        if (selectedBetButton) {
            selectedBetButton.classList.remove('selected');
            selectedBetButton = null;
        }
        currentRouletteBetType = null;
        currentRouletteBetValue = null;
        if (rouletteCurrentBetDisplay) rouletteCurrentBetDisplay.textContent = 'None';
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = '?';
            rouletteResultDisplay.className = 'roulette-result'; // Reset color classes
            rouletteResultDisplay.style.backgroundColor = '';
            rouletteResultDisplay.style.color = '';
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Place your bet!';

        // Reset wheel rotation and ensure numbers are positioned
        if (rouletteWheel) {
           positionWheelNumbers(); // Ensure numbers are positioned on reset
           if (resetWheelVisual) {
               rouletteWheel.style.transition = 'none'; // Disable transition temporarily
               rouletteWheel.style.transform = `rotate(0deg)`;
               // Force browser reflow to apply the 'transition: none' before re-enabling it
               void rouletteWheel.offsetWidth;
               rouletteWheel.style.transition = ''; // Re-enable transition (uses CSS definition)
           }
        }

        // Ensure controls are re-enabled
        if (rouletteSpinButton) rouletteSpinButton.disabled = true; // Disable spin until bet placed
        if (rouletteBetInput) rouletteBetInput.disabled = false;
        // Re-enable betting buttons using pointer events
        if(rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
        if(rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
    }

    /**
     * Starts the roulette spin animation and determines the winner.
     */
    function spinWheel() {
        if (rouletteIsSpinning) return;
        if (!currentRouletteBetType) {
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please place a bet first!", 2000);
            return;
        }

        // Get current bet amount from input
        const currentBetAmount = parseInt(rouletteBetInput.value);
        if (isNaN(currentBetAmount) || currentBetAmount < 1) {
             if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Invalid bet amount.", 2000);
            return;
        }
        // Check balance only if API is available
        if (LocalBrokieAPI && currentBetAmount > LocalBrokieAPI.getBalance()) {
            LocalBrokieAPI.showMessage("Not enough balance for this bet.", 2000);
            return;
        }

        // Start the spin
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(-currentBetAmount); // Deduct bet amount immediately
            LocalBrokieAPI.playSound('roulette_spin'); // Play spin sound
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Spinning... No more bets!';
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (rouletteBetInput) rouletteBetInput.disabled = true;
        // Disable betting buttons visually during spin
        if(rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none';
        if(rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';
        if (selectedBetButton) selectedBetButton.classList.remove('selected'); // Remove highlight

        // --- Calculate Winning Number and Spin Animation ---
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];

        // Calculate target angle:
        const angleToSegmentStart = -(winningNumberIndex * ANGLE_PER_NUMBER);
        const offsetWithinSegment = -(ANGLE_PER_NUMBER * (0.1 + Math.random() * 0.8)); // Random offset within the segment
        const finalAngleInRotation = angleToSegmentStart + offsetWithinSegment;
        const fullRotations = (5 + Math.floor(Math.random() * 5)) * 360; // 5-9 full rotations
        const targetRotation = finalAngleInRotation - fullRotations; // Subtract full rotations for clockwise spin effect

        // Apply rotation using CSS transition
        if (rouletteWheel) {
            rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.4, 1)'; // Ensure transition is set
            rouletteWheel.style.transform = `rotate(${targetRotation}deg)`;
        }

        // --- Handle Spin Completion ---
        setTimeout(() => {
            handleResult(winningNumber, currentBetAmount); // Pass bet amount to result handler
        }, 4100); // Match CSS transition duration + buffer
    }

    /**
     * Handles the result calculation and UI update after the spin finishes.
     */
    function handleResult(winningNumber, betAmount) {
        rouletteIsSpinning = false; // Allow new spins/bets
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball'); // Sound for ball landing

        const winningColor = ROULETTE_COLORS[winningNumber];

        // Display winning number and style result display
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result'; // Reset classes
            rouletteResultDisplay.classList.add(winningColor); // Add color class
        }

        // --- Determine Win/Loss ---
        let payoutMultiplier = 0;
        let won = false;

        // Check win conditions based on stored bet type and value
        if (currentRouletteBetType === 'single' && currentRouletteBetValue === winningNumber) {
            payoutMultiplier = ROULETTE_PAYOUTS.single; won = true;
        } else if (currentRouletteBetType === 'red' && winningColor === 'red') {
            payoutMultiplier = ROULETTE_PAYOUTS.red; won = true;
        } else if (currentRouletteBetType === 'black' && winningColor === 'black') {
            payoutMultiplier = ROULETTE_PAYOUTS.black; won = true;
        } else if (currentRouletteBetType === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) {
            payoutMultiplier = ROULETTE_PAYOUTS.odd; won = true;
        } else if (currentRouletteBetType === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
            payoutMultiplier = ROULETTE_PAYOUTS.even; won = true;
        } else if (currentRouletteBetType === 'low' && winningNumber >= 1 && winningNumber <= 18) {
            payoutMultiplier = ROULETTE_PAYOUTS.low; won = true;
        } else if (currentRouletteBetType === 'high' && winningNumber >= 19 && winningNumber <= 36) {
            payoutMultiplier = ROULETTE_PAYOUTS.high; won = true;
        }
        // Add checks for other bet types (split, street, etc.) here if implemented

        // Calculate winnings and update balance/stats
        let statusMessage = '';
        if (won && LocalBrokieAPI) {
            const winnings = betAmount * payoutMultiplier;
            const totalReturn = winnings + betAmount; // Original bet back + winnings
            LocalBrokieAPI.updateBalance(totalReturn); // Add total amount back
            const netWin = totalReturn - betAmount;
            statusMessage = `Win! ${winningNumber} (${winningColor}). You won ${LocalBrokieAPI.formatWin(netWin)}!`;
            LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(netWin)}!`, 3000);
            LocalBrokieAPI.playSound('roulette_win');
            LocalBrokieAPI.addWin('Roulette', netWin); // Add net win to leaderboard
        } else if (LocalBrokieAPI) { // Only update status if loss and API exists
            statusMessage = `Lose! Landed on ${winningNumber} (${winningColor}).`;
            LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000);
            LocalBrokieAPI.playSound('lose');
            // Balance was already deducted, no further action needed for loss
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Reset UI elements for the next round after a short delay
        setTimeout(() => {
            // Check if roulette tab is still active before resetting UI elements
            const currentActiveTab = document.querySelector('.tab-button[aria-current="page"]');
            if (currentActiveTab && currentActiveTab.id === 'tab-roulette') {
                resetRoulette(false); // Reset state but don't snap wheel visually
            }
        }, 2000); // Delay before resetting UI for next bet
    }

// End of the guard block that checks if initRoulette is already defined
} else {
    // Optional: Log a warning if the script tries to load again
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}
