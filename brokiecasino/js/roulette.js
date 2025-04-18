// Add this CSS to your style.css for the ball and animation classes:
/*
#roulette-ball {
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: #f0f0f0;
    border-radius: 50%;
    z-index: 8;  /* Above wheel numbers/overlay, below pointer */
    box-shadow: inset 0 -2px 2px rgba(0,0,0,0.3), 0 0 5px white;
    /* Start hidden */
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    /* Initial position (example: top center outside the main wheel area) */
    top: 10%;
    left: 50%;
    transform: translate(-50%, -50%);
    /* We will animate top/left or transform later */
    pointer-events: none; /* Prevent interaction with the ball */
}
#roulette-ball.visible {
    opacity: 1;
    visibility: visible;
}
/* Animation Class Definitions */
#roulette-wheel.continuous-spin {
    /* animation defined in CSS @keyframes continuous-spin */
    animation: continuous-spin 20s linear infinite;
    /* Ensure transition is off when continuously spinning */
    transition: none;
}
#roulette-wheel.result-spin {
    /* transition defined in CSS for the result spin */
    transition: transform 4s cubic-bezier(0.2, 0.8, 0.4, 1);
    /* Ensure animation is off during result spin */
    animation: none;
}
*/

// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.3 - Continuous Spin & Basic Ball)
     *
     * - Implements continuous wheel spin by default using CSS classes.
     * - Manages animation state transitions (continuous <-> result spin).
     * - Adds basic show/hide functionality for a ball element.
     * - Retains multiple bet support (v2.2).
     * - Uses a placedBets array {type, value, amount, buttonElement}.
     * - Visualizes placed bet amount on buttons.
     * - Calculates total bet and winnings based on all placed bets.
     * - Includes clearAllRouletteBets function.
     * - Accepts BrokieAPI object during initialization.
     * ==========================================================================
     */

    // --- Constants ---
    const ROULETTE_NUMBERS = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
    const ROULETTE_COLORS = {
        0: 'green', 1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
        11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
        21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
        31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
    };
    const ROULETTE_PAYOUTS = {
        single: 35, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1
    };
    const TOTAL_NUMBERS = ROULETTE_NUMBERS.length;
    const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;
    const RESULT_SPIN_DURATION = 4000; // ms - Should match CSS transition duration
    const POST_RESULT_DELAY = 2500; // ms - Delay before reset after result shown

    // --- State Variables ---
    let rouletteIsSpinning = false; // Tracks if the result spin sequence is active
    let placedBets = []; // Array of bet objects: { type, value, amount, buttonElement }
    let resultSpinTimeoutId = null; // Timeout ID for handleResult
    let resetTimeoutId = null; // Timeout ID for endSpinCycle/resetting UI

    // --- DOM Element References ---
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall; // Ball element reference

    // --- API Reference ---
    let LocalBrokieAPI = null;

    /**
     * Initializes the Roulette game.
     * @param {object} API - The BrokieAPI object.
     */
    function initRoulette(API) {
        LocalBrokieAPI = API;

        // Get DOM elements
        rouletteWheel = document.getElementById('roulette-wheel');
        roulettePointer = document.getElementById('roulette-pointer');
        rouletteResultDisplay = document.getElementById('roulette-result');
        rouletteBetInput = document.getElementById('roulette-bet');
        rouletteSpinButton = document.getElementById('roulette-spin-button');
        rouletteStatusDisplay = document.getElementById('roulette-status');
        rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets');
        rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets');
        rouletteCurrentBetDisplay = document.getElementById('roulette-current-bet-type');
        clearBetsButton = document.getElementById('roulette-clear-bets-button');
        rouletteBall = document.getElementById('roulette-ball'); // Get ball element

        // Check essential elements
        if (!rouletteWheel || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !LocalBrokieAPI) {
            console.error("Roulette initialization failed: Missing critical elements (wheel, ball, result, spin button) or API.");
            const tab = document.getElementById('tab-roulette');
            if (tab) tab.style.display = 'none';
            return;
        }

        // Setup Game UI
        createRouletteBettingGrid();
        positionWheelNumbers(); // Ensure numbers are positioned initially
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) {
            LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
        }

        // Initial Reset and start continuous spin
        resetRoulette(true); // Force visual reset and start continuous spin
        console.log("Roulette Initialized (v2.3 - Continuous Spin)");
    }

    // --- Helper Functions ---

    /** Finds a bet in the placedBets array. */
    function findPlacedBet(type, value) {
        return placedBets.find(bet => bet.type === type && bet.value == value);
    }

    /** Updates the visual display of a bet button. */
    function updateButtonVisual(button, amount) {
        if (!button) return;
        const originalValue = button.dataset.originalValue || button.textContent;
        if (!button.dataset.originalValue) button.dataset.originalValue = originalValue;

        if (amount > 0) {
            button.textContent = `${originalValue} (${amount})`;
            button.dataset.betAmount = amount.toString();
            button.classList.add('has-bet');
        } else {
            button.textContent = originalValue;
            button.removeAttribute('data-bet-amount');
            button.classList.remove('has-bet');
        }
    }

    /** Updates the display showing the total amount currently bet. */
    function updateTotalBetDisplay() {
        if (!rouletteCurrentBetDisplay) return;
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed';
    }

    /** Makes the roulette ball visually appear. */
    function showBall() {
        if (rouletteBall) {
             // Reset ball position before showing (optional)
             rouletteBall.style.transform = 'translate(-50%, -50%)'; // Reset any animation transforms
             rouletteBall.style.top = '10%'; // Example starting position
             rouletteBall.style.left = '50%';
             rouletteBall.classList.add('visible');
        }
        // Placeholder: Start ball animation logic here later
        console.log("Ball shown (animation pending)");
    }

    /** Makes the roulette ball visually disappear. */
    function hideBall() {
        if (rouletteBall) rouletteBall.classList.remove('visible');
         // Placeholder: Stop/reset ball animation logic here later
    }

     /** Ensures the continuous spin CSS class is active and others are not. */
     function startContinuousSpin() {
        if (!rouletteWheel) return;
        // Ensure result spin transition/class is removed first
        rouletteWheel.classList.remove('result-spin');
        rouletteWheel.style.transition = 'none'; // Ensure no transition interference

        // Apply the animation class (CSS handles the animation itself)
        rouletteWheel.classList.add('continuous-spin');
     }

     /** Stops the continuous spin, holds position, returns current transform. */
     function stopContinuousSpinAndHold() {
         if (!rouletteWheel) return 'matrix(1, 0, 0, 1, 0, 0)'; // Default transform

         // Get the current computed transform matrix before removing the animation
         const currentTransform = getComputedStyle(rouletteWheel).transform;

         // Remove the animation class
         rouletteWheel.classList.remove('continuous-spin');

         // Apply the computed transform directly to hold the position
         // This prevents the wheel snapping back to 0 degrees
         rouletteWheel.style.transform = currentTransform;

         return currentTransform; // Return the transform
     }


    // --- Core Functions ---

    /** Creates the number buttons (0-36) for the inside betting grid. */
    function createRouletteBettingGrid() {
        if (!rouletteInsideBetsContainer) { console.error("..."); return; }
        rouletteInsideBetsContainer.innerHTML = '';
        const zeroButton = createBetButton(0, 'green', 'single');
        zeroButton.classList.add('col-span-3');
        rouletteInsideBetsContainer.appendChild(zeroButton);
        for (let i = 1; i <= 36; i++) {
            const color = ROULETTE_COLORS[i];
            const button = createBetButton(i, color, 'single');
            rouletteInsideBetsContainer.appendChild(button);
        }
    }

    /** Creates a single bet button element. */
    function createBetButton(value, color, betType) {
        const button = document.createElement('button');
        button.classList.add('roulette-bet-btn');
        if (color) button.classList.add(color);
        button.textContent = value;
        button.dataset.betType = betType;
        button.dataset.betValue = value;
        button.dataset.originalValue = value; // Store original value for reset
        return button;
    }

    /** Positions the number elements absolutely around the wheel graphic. */
    function positionWheelNumbers() {
        if (!rouletteWheel) { console.error("..."); return; }
        // Use parent container for dimensions as wheel itself might be transforming
        const container = document.getElementById('roulette-wheel-container');
        if (!container) { console.error("..."); return; }

        requestAnimationFrame(() => {
             const containerDiameter = container.offsetWidth;
             if (containerDiameter <= 0) { /*...*/ return; }
             const containerRadius = containerDiameter / 2;
             // Adjust numberRadius based on container size and overlay % from CSS
             const overlayPercentage = 0.15; // Match the ::before inset % (e.g., 15% = 0.15)
             const numberRadius = containerRadius * (1 - overlayPercentage - 0.03); // Position slightly inside the overlay edge

             const existingNumbers = rouletteWheel.querySelectorAll('.roulette-number');
             existingNumbers.forEach(num => num.remove());

             ROULETTE_NUMBERS.forEach((num, index) => {
                 const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2) - 90; // Center in segment, adjust offset
                 const angleRadians = angleDegrees * (Math.PI / 180);
                 const numberSpan = document.createElement('span');
                 numberSpan.textContent = num.toString();
                 numberSpan.classList.add('roulette-number', `num-${num}`);

                 // Calculate position relative to the WHEEL's center (which is container's center)
                 const x = containerRadius + numberRadius * Math.cos(angleRadians);
                 const y = containerRadius + numberRadius * Math.sin(angleRadians);

                 numberSpan.style.position = 'absolute';
                 numberSpan.style.left = `${x}px`;
                 numberSpan.style.top = `${y}px`;
                 // Rotate the number to be upright relative to the center
                 numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees + 90}deg)`;

                 rouletteWheel.appendChild(numberSpan); // Append to wheel so they rotate with it
             });
        });
    }

    /** Sets up event listeners for buttons. */
    function setupRouletteEventListeners() {
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement);
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement);
        if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel);
        if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets);
        else console.warn("Clear Bets button not found.");
    }

    /** Handles clicks on betting buttons to place or add to a bet. */
    function handleBetPlacement(event) {
        if (rouletteIsSpinning) return; // Prevent betting during result spin sequence
        const targetButton = event.target.closest('.roulette-bet-btn');
        if (!targetButton) return;
        const amountToAdd = parseInt(rouletteBetInput.value);
        if (isNaN(amountToAdd) || amountToAdd < 1) {
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please enter a valid bet amount first.", 1500);
            return;
        }
        if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()) {
             if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Not enough balance to add this amount.", 1500);
            return;
        }
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); // Chip sound

        const betType = targetButton.dataset.betType;
        const betValue = targetButton.dataset.betValue;
        let existingBet = findPlacedBet(betType, betValue);

        if (existingBet) {
            existingBet.amount += amountToAdd;
        } else {
            existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton };
            placedBets.push(existingBet);
        }

        updateButtonVisual(targetButton, existingBet.amount);
        updateTotalBetDisplay();
        if (rouletteSpinButton) rouletteSpinButton.disabled = false;
        if (clearBetsButton) clearBetsButton.disabled = false;
    }

    /** Clears all currently placed bets. */
    function clearAllRouletteBets() {
        if (rouletteIsSpinning) return;
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets');
        placedBets.forEach(bet => updateButtonVisual(bet.buttonElement, 0)); // Reset visuals
        placedBets = []; // Clear array
        updateTotalBetDisplay(); // Update display
        if (rouletteSpinButton) rouletteSpinButton.disabled = true; // Disable actions
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!';
    }


    /** Resets the game state, UI, and ensures continuous spin is active. */
    function resetRoulette(forceVisualReset = false) {
        console.log("Resetting Roulette...");
        rouletteIsSpinning = false; // Ensure sequence state is reset

        // Clear any pending timeouts
        if (resultSpinTimeoutId) { clearTimeout(resultSpinTimeoutId); resultSpinTimeoutId = null; }
        if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; }

        clearAllRouletteBets(); // Clear bets, reset button visuals, disable spin/clear

        // Reset result display
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = '?';
            rouletteResultDisplay.className = 'roulette-result'; // Reset colors
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Place your bet!';
        updateTotalBetDisplay();

        // Ensure wheel numbers are positioned correctly
        if(rouletteWheel) positionWheelNumbers();

        // Reset wheel animation state
        if (rouletteWheel) {
            rouletteWheel.classList.remove('result-spin'); // Ensure result transition class is off
            rouletteWheel.style.transition = 'none'; // Prevent transitions during reset
            if (forceVisualReset) {
                rouletteWheel.style.transform = 'rotate(0deg)'; // Snap to 0 if forced
            }
            void rouletteWheel.offsetWidth; // Force reflow needed before starting animation again
            startContinuousSpin(); // Ensure continuous spin is (re)applied
            console.log("Continuous spin started/resumed.");
        }

        // Hide the ball
        hideBall();

        // Reset controls
        if (rouletteBetInput) rouletteBetInput.disabled = false;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
        // Spin/Clear buttons are disabled by clearAllRouletteBets initially
    }

    /** Starts the result spin sequence. */
    function spinWheel() {
        if (rouletteIsSpinning) return; // Prevent double spins
        if (placedBets.length === 0) {
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please place a bet first!", 1500);
            return;
        }

        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (isNaN(totalBetAmount) || totalBetAmount < 1) { /* Error handling */ return; }
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) {
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Not enough balance for the total bet.", 1500);
            return;
        }

        // --- Start Spin Sequence ---
        console.log("Starting spin sequence...");
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(-totalBetAmount);
            LocalBrokieAPI.playSound('roulette_spin'); // Could use a specific "ball drop" sound
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Spinning... Ball rolling!';
        // Disable controls
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteBetInput) rouletteBetInput.disabled = true;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        // Calculate winning number
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        console.log(`Calculated winning number: ${winningNumber}`);

        // --- Handle Wheel Animation ---
        if (rouletteWheel) {
            // 1. Stop continuous spin & hold position
            stopContinuousSpinAndHold();
            // Force reflow *after* removing animation and setting transform
            void rouletteWheel.offsetWidth;

            // 2. Calculate target rotation for the result spin
            const angleToSegmentStart = -(winningNumberIndex * ANGLE_PER_NUMBER);
            const offsetWithinSegment = -(ANGLE_PER_NUMBER * (0.2 + Math.random() * 0.6)); // Slightly randomized stop within segment
            const finalAngleInRotation = angleToSegmentStart + offsetWithinSegment;
            const fullRotations = (4 + Math.floor(Math.random() * 4)) * 360; // 4-7 full rotations for result
            const targetRotation = finalAngleInRotation - fullRotations; // Target angle for CSS transition

            // 3. Apply result-spin class (for transition) and set target transform
            rouletteWheel.classList.add('result-spin');
            rouletteWheel.style.transform = `rotate(${targetRotation}deg)`;
            console.log(`Starting result spin to target: ${targetRotation}deg`);
        }

        // 4. Show the ball
        showBall();
        // TODO: Implement ball animation logic within showBall or here

        // 5. Set timeout to handle result *after* the CSS transition completes
        if (resultSpinTimeoutId) clearTimeout(resultSpinTimeoutId); // Clear any previous
        resultSpinTimeoutId = setTimeout(() => {
            console.log("Result spin transition ended, handling result...");
            handleResult(winningNumber);
        }, RESULT_SPIN_DURATION); // Use constant duration
    }

    /** Handles result calculation and UI update after spin animation ends. */
    function handleResult(winningNumber) {
        // Sound for ball landing
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');
        console.log(`Ball landed. Winning number: ${winningNumber}`);

        const winningColor = ROULETTE_COLORS[winningNumber];

        // Display winning number/color
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result'; // Reset
            rouletteResultDisplay.classList.add(winningColor); // Add color class
        }

        // --- Calculate Winnings (Iterate through placed bets) ---
        let totalWinnings = 0;
        let totalBetReturned = 0;
        placedBets.forEach(bet => {
            let payoutMultiplier = 0;
            let betWon = false;
            // ... (Win checking logic - same as v2.2) ...
            if (bet.type === 'single' && bet.value === winningNumber) { payoutMultiplier = ROULETTE_PAYOUTS.single; betWon = true; }
            else if (bet.type === 'red' && winningColor === 'red') { payoutMultiplier = ROULETTE_PAYOUTS.red; betWon = true; }
            else if (bet.type === 'black' && winningColor === 'black') { payoutMultiplier = ROULETTE_PAYOUTS.black; betWon = true; }
            else if (bet.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) { payoutMultiplier = ROULETTE_PAYOUTS.odd; betWon = true; }
            else if (bet.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) { payoutMultiplier = ROULETTE_PAYOUTS.even; betWon = true; }
            else if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) { payoutMultiplier = ROULETTE_PAYOUTS.low; betWon = true; }
            else if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) { payoutMultiplier = ROULETTE_PAYOUTS.high; betWon = true; }

            if (betWon) {
                const winningsForThisBet = bet.amount * payoutMultiplier;
                totalWinnings += winningsForThisBet;
                totalBetReturned += bet.amount;
            }
        });

        // Update balance & status message
        const totalReturn = totalWinnings + totalBetReturned;
        let statusMessage = '';
        if (totalReturn > 0 && LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(totalReturn);
            statusMessage = `Win! Landed on ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`;
            LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000);
            LocalBrokieAPI.playSound('win_long'); // Use a more distinct win sound maybe
            LocalBrokieAPI.addWin('Roulette', totalWinnings);
        } else {
             const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
             statusMessage = `Lose. Landed on ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`;
            if (LocalBrokieAPI) {
                LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000);
                LocalBrokieAPI.playSound('lose');
            }
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Set timeout to end the cycle (hide ball, restart continuous spin, reset UI)
        if (resetTimeoutId) clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
    }

    /** Cleans up after a spin cycle: hides ball, restarts continuous spin, then resets UI fully. */
    function endSpinCycle() {
        console.log("Ending spin cycle, preparing for reset...");
        hideBall(); // Hide the ball

        if (rouletteWheel) {
            // Hold final position before removing transition class
            const finalTransform = getComputedStyle(rouletteWheel).transform;
            rouletteWheel.classList.remove('result-spin');
            rouletteWheel.style.transition = 'none';
            rouletteWheel.style.transform = finalTransform; // Hold final position
            void rouletteWheel.offsetWidth; // Reflow
            startContinuousSpin(); // Restart continuous spin animation
            console.log("Continuous spin restarted.");
        }

        // Now the spin sequence is truly over, allow new actions
        rouletteIsSpinning = false;
        resetRoulette(false); // Reset bets, controls, status

    }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}