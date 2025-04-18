// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.4 - Ball Animation)
     *
     * - Adds animation for the #roulette-ball element using requestAnimationFrame.
     * - Ball spins, decelerates, and spirals inwards to land near the result.
     * - Implements continuous wheel spin by default using CSS classes.
     * - Manages animation state transitions (continuous <-> result spin).
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
    const RESULT_SPIN_DURATION = 4000; // ms - Wheel CSS transition duration
    const POST_RESULT_DELAY = 2500; // ms - Delay before reset

    // --- Ball Animation Constants ---
    const BALL_INITIAL_RADIUS_FACTOR = 0.9; // Relative to container radius (outer track)
    const BALL_FINAL_RADIUS_FACTOR = 0.75; // Where ball lands (slightly inside number ring)
    const BALL_INITIAL_SPEED = -800; // Degrees per second (negative for opposite direction to wheel maybe?)
    const BALL_DECELERATION_START_TIME = RESULT_SPIN_DURATION * 0.3; // Start slowing down early
    const BALL_DECELERATION_TIME = RESULT_SPIN_DURATION * 0.7; // Time over which ball decelerates
    const BALL_LANDING_SPIRAL_TIME = 1500; // Last ms of deceleration where radius decreases

    // --- State Variables ---
    let rouletteIsSpinning = false;
    let placedBets = [];
    let resultSpinTimeoutId = null;
    let resetTimeoutId = null;
    // NEW: Ball Animation State
    let ballAnimationId = null;
    let ballStartTime = null;
    let ballStartAngle = 0; // Starting angle for this specific spin animation
    let ballAngle = 0; // Current angle during animation
    let ballRadius = 0; // Current radius during animation
    let ballTargetAngle = 0; // Target angle based on winning number
    let ballLanded = false;
    let containerRadius = 0; // Calculated on spin start

    // --- DOM Element References ---
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall, rouletteWheelContainer; // Added container ref

    // --- API Reference ---
    let LocalBrokieAPI = null;

    /** Initializes the Roulette game. */
    function initRoulette(API) {
        LocalBrokieAPI = API;

        // Get DOM elements
        rouletteWheelContainer = document.getElementById('roulette-wheel-container'); // Get container
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
        rouletteBall = document.getElementById('roulette-ball');

        // Check essential elements
        if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !LocalBrokieAPI) {
            console.error("Roulette init failed: Missing critical elements or API.");
            const tab = document.getElementById('tab-roulette');
            if (tab) tab.style.display = 'none';
            return;
        }

        // Setup UI
        createRouletteBettingGrid();
        positionWheelNumbers();
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) {
            LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
        }

        // Initial Reset
        resetRoulette(true);
        console.log("Roulette Initialized (v2.4 - Ball Animation)");
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

    /** Makes the roulette ball visible and starts its animation loop. */
    function showBall(winningNumberIndex) {
        if (!rouletteBall || !rouletteWheelContainer) return;

        // Calculate container radius for positioning
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { console.error("Cannot calculate container radius for ball."); return; }

        // --- Calculate Target Angle ---
        // Match wheel calculation: angle to start of segment + offset within segment
        const angleToSegmentStart = -(winningNumberIndex * ANGLE_PER_NUMBER);
        const offsetWithinSegment = -(ANGLE_PER_NUMBER * (0.2 + Math.random() * 0.6)); // Same offset as wheel target
        // Adjust target angle slightly for visual alignment (ball center vs segment center)
        ballTargetAngle = (angleToSegmentStart + offsetWithinSegment - 90) % 360; // Match coordinate system used in animateBall
        console.log(`Ball target angle calculated: ${ballTargetAngle}deg (for number index ${winningNumberIndex})`);


        // --- Reset Animation State ---
        ballLanded = false;
        ballStartTime = performance.now();
        ballStartAngle = (Math.random() * 360) - 90; // Random starting angle (aligned with coordinate system)
        ballAngle = ballStartAngle; // Set initial angle
        ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR; // Start at outer radius

        // --- Position & Show ---
        // Initial position calculation
        const initialRadians = ballStartAngle * (Math.PI / 180);
        const initialX = containerRadius + ballRadius * Math.cos(initialRadians);
        const initialY = containerRadius + ballRadius * Math.sin(initialRadians);
        rouletteBall.style.left = `${initialX}px`;
        rouletteBall.style.top = `${initialY}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)'; // Center the ball on its coordinates

        rouletteBall.classList.add('visible'); // Make it visible

        // --- Start Animation Loop ---
        if (ballAnimationId) cancelAnimationFrame(ballAnimationId); // Cancel previous loop if any
        ballAnimationId = requestAnimationFrame(animateBall);
        console.log("Ball shown, animation started.");
    }

    /** Makes the roulette ball visually disappear and stops animation. */
    function hideBall() {
        if (ballAnimationId) {
            cancelAnimationFrame(ballAnimationId); // Stop the loop
            ballAnimationId = null;
        }
        if (rouletteBall) {
            rouletteBall.classList.remove('visible'); // Hide it
        }
        console.log("Ball hidden, animation stopped.");
    }

     /** Ensures the continuous spin CSS class is active and others are not. */
     function startContinuousSpin() {
        if (!rouletteWheel) return;
        rouletteWheel.classList.remove('result-spin');
        rouletteWheel.style.transition = 'none';
        rouletteWheel.classList.add('continuous-spin');
     }

     /** Stops the continuous spin, holds position, returns current transform. */
     function stopContinuousSpinAndHold() {
         if (!rouletteWheel) return 'none';
         const currentTransform = getComputedStyle(rouletteWheel).transform;
         rouletteWheel.classList.remove('continuous-spin');
         rouletteWheel.style.transform = currentTransform;
         return currentTransform;
     }

    /** The main ball animation loop using requestAnimationFrame. */
    function animateBall(timestamp) {
        if (ballLanded || !rouletteBall || containerRadius <= 0) {
            // Ensure loop stops if landed or elements missing
            if(ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
            return;
        }

        const elapsed = timestamp - ballStartTime;

        // --- Calculate Current Speed ---
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelerationElapsed = elapsed - BALL_DECELERATION_START_TIME;
            // Simple linear deceleration: speed decreases over time
            const decelerationFactor = Math.max(0, 1 - (decelerationElapsed / BALL_DECELERATION_TIME));
            currentSpeed *= decelerationFactor * decelerationFactor; // Exponential slow down feels better
        }

        // --- Calculate Current Radius (for final spiral) ---
        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = RESULT_SPIN_DURATION - BALL_LANDING_SPIRAL_TIME;
        if (elapsed > spiralStartTime) {
             const spiralElapsed = elapsed - spiralStartTime;
             const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
             // Interpolate radius from initial to final
             currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * spiralProgress;
        }
        ballRadius = containerRadius * currentRadiusFactor;


        // --- Update Angle based on time and speed ---
        // More accurate position calculation based on total time elapsed
        // Integrate speed over time (simplified here for linear deceleration example)
        let totalRotation = 0;
        if (elapsed <= BALL_DECELERATION_START_TIME) {
            totalRotation = BALL_INITIAL_SPEED * (elapsed / 1000);
        } else {
            // Rotation during constant speed phase
            totalRotation = BALL_INITIAL_SPEED * (BALL_DECELERATION_START_TIME / 1000);
            // Add rotation during deceleration phase (approximate for non-linear)
            const decelerationElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const averageDecelerationFactor = Math.max(0, 1 - (decelerationElapsed / (2 * BALL_DECELERATION_TIME))); // Rough average
            totalRotation += (BALL_INITIAL_SPEED * averageDecelerationFactor) * (decelerationElapsed / 1000);
        }
        ballAngle = (ballStartAngle + totalRotation) % 360;


        // --- Check for Landing Time ---
        if (elapsed >= RESULT_SPIN_DURATION) {
            console.log("Ball animation duration reached. Landing.");
            ballLanded = true;
            // Snap to final calculated target angle and radius
            ballAngle = ballTargetAngle;
            ballRadius = containerRadius * BALL_FINAL_RADIUS_FACTOR;
        }

        // --- Calculate X, Y Coordinates ---
        const currentRadians = ballAngle * (Math.PI / 180);
        const x = containerRadius + ballRadius * Math.cos(currentRadians);
        const y = containerRadius + ballRadius * Math.sin(currentRadians);

        // --- Update Ball Style ---
        rouletteBall.style.left = `${x}px`;
        rouletteBall.style.top = `${y}px`;
        // Optional: Add slight scale or bounce effect based on progress/radius

        // --- Request Next Frame ---
        if (!ballLanded) {
            ballAnimationId = requestAnimationFrame(animateBall);
        } else {
            ballAnimationId = null; // Ensure ID is cleared on land
            console.log(`Ball landed at final position: Angle=${ballAngle.toFixed(2)}, Radius=${ballRadius.toFixed(2)}`);
        }
    }


    // --- Core Functions ---

    /** Creates the betting grid buttons. */
    function createRouletteBettingGrid() { /* ... No changes ... */
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
    function createBetButton(value, color, betType) { /* ... No changes ... */
        const button = document.createElement('button');
        button.classList.add('roulette-bet-btn');
        if (color) button.classList.add(color);
        button.textContent = value.toString();
        button.dataset.betType = betType;
        button.dataset.betValue = value.toString();
        button.dataset.originalValue = value.toString();
        return button;
    }

    /** Positions numbers on the wheel. */
    function positionWheelNumbers() { /* ... No changes ... */
        const container = document.getElementById('roulette-wheel-container');
        if (!rouletteWheel || !container) { console.error("..."); return; }
        requestAnimationFrame(() => {
             const containerDiameter = container.offsetWidth;
             if (containerDiameter <= 0) { setTimeout(positionWheelNumbers, 100); return; }
             const containerRadius = containerDiameter / 2;
             const overlayInsetPercent = 0.15;
             const numberRingRadius = containerRadius * (1 - overlayInsetPercent - 0.04);
             const existingNumbers = rouletteWheel.querySelectorAll('.roulette-number');
             existingNumbers.forEach(num => num.remove());
             ROULETTE_NUMBERS.forEach((num, index) => {
                 const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2) - 90;
                 const angleRadians = angleDegrees * (Math.PI / 180);
                 const numberSpan = document.createElement('span');
                 numberSpan.textContent = num.toString();
                 numberSpan.classList.add('roulette-number', `num-${num}`);
                 const x = containerRadius + numberRingRadius * Math.cos(angleRadians);
                 const y = containerRadius + numberRingRadius * Math.sin(angleRadians);
                 numberSpan.style.position = 'absolute';
                 numberSpan.style.left = `${x}px`;
                 numberSpan.style.top = `${y}px`;
                 numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees + 90}deg)`;
                 rouletteWheel.appendChild(numberSpan);
             });
        });
    }

    /** Sets up event listeners. */
    function setupRouletteEventListeners() { /* ... No changes ... */
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement);
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement);
        if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel);
        if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets);
        else console.warn("Clear Bets button element not found.");
    }

    /** Handles placing bets. */
    function handleBetPlacement(event) { /* ... No changes needed ... */
        if (rouletteIsSpinning) return;
        const targetButton = event.target.closest('.roulette-bet-btn');
        if (!targetButton) return;
        const amountToAdd = parseInt(rouletteBetInput.value);
        if (isNaN(amountToAdd) || amountToAdd < 1) { /*...*/ return; }
        if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()) { /*...*/ return; }
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place');
        const betType = targetButton.dataset.betType;
        const betValue = targetButton.dataset.betValue;
        let existingBet = findPlacedBet(betType, betValue);
        if (existingBet) { existingBet.amount += amountToAdd; }
        else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); }
        updateButtonVisual(targetButton, existingBet.amount);
        updateTotalBetDisplay();
        if (rouletteSpinButton) rouletteSpinButton.disabled = false;
        if (clearBetsButton) clearBetsButton.disabled = false;
    }

    /** Clears all placed bets. */
    function clearAllRouletteBets() { /* ... No changes needed ... */
        if (rouletteIsSpinning) return;
        if (placedBets.length === 0) return;
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets');
        placedBets.forEach(bet => { if (bet.buttonElement) updateButtonVisual(bet.buttonElement, 0); });
        placedBets = [];
        updateTotalBetDisplay();
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!';
    }


    /** Resets the game state, UI, and ensures continuous spin is active. */
    function resetRoulette(forceVisualReset = false) {
        console.log("Resetting Roulette State...");
        rouletteIsSpinning = false; // Ensure sequence state is false

        // Clear any pending timeouts
        if (resultSpinTimeoutId) { clearTimeout(resultSpinTimeoutId); resultSpinTimeoutId = null; }
        if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; }

        clearAllRouletteBets(); // Clear bets logic

        // Reset result display
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = '?';
            rouletteResultDisplay.className = 'roulette-result';
        }
        // Reset status message (unless set by clearBets)
        if (rouletteStatusDisplay && !rouletteStatusDisplay.textContent.includes('Bets cleared')) {
            rouletteStatusDisplay.textContent = 'Place your bet!';
        }
        updateTotalBetDisplay();

        // Position numbers if needed
        if(rouletteWheel) positionWheelNumbers();

        // Reset wheel animation state
        if (rouletteWheel) {
            rouletteWheel.classList.remove('result-spin');
            rouletteWheel.style.transition = 'none';
            if (forceVisualReset || !rouletteWheel.style.transform) { // Reset transform if forced or not set
                 rouletteWheel.style.transform = 'rotate(0deg)';
            } // Otherwise, let it continue from its stopped position
            void rouletteWheel.offsetWidth;
            startContinuousSpin(); // Ensure continuous spin class is applied
            console.log("Continuous spin started/resumed.");
        }

        // Hide the ball and cancel its animation
        hideBall();

        // Re-enable betting controls
        if (rouletteBetInput) rouletteBetInput.disabled = false;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
    }

    /** Starts the result spin sequence. */
    function spinWheel() {
        if (rouletteIsSpinning) { console.warn("Spin already in progress."); return; }
        if (placedBets.length === 0) { /*...*/ return; }

        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (isNaN(totalBetAmount) || totalBetAmount < 1) { /*...*/ return; }
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) { /*...*/ return; }

        // --- Start Spin Sequence ---
        console.log("Starting result spin sequence...");
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) { LocalBrokieAPI.updateBalance(-totalBetAmount); LocalBrokieAPI.playSound('roulette_spin'); }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Spinning... Ball rolling!';
        // Disable controls...
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteBetInput) rouletteBetInput.disabled = true;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        // Calculate winning number & target angle for ball
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        console.log(`Calculated winning number: ${winningNumber}`);

        // --- Handle Wheel Animation ---
        if (rouletteWheel) {
            stopContinuousSpinAndHold();
            void rouletteWheel.offsetWidth; // Reflow

            const angleToSegmentStart = -(winningNumberIndex * ANGLE_PER_NUMBER);
            const offsetWithinSegment = -(ANGLE_PER_NUMBER * (0.2 + Math.random() * 0.6));
            const finalAngleInRotation = angleToSegmentStart + offsetWithinSegment;
            const fullRotations = (4 + Math.floor(Math.random() * 4)) * 360;
            const targetRotation = finalAngleInRotation - fullRotations;

            rouletteWheel.classList.add('result-spin');
            rouletteWheel.style.transform = `rotate(${targetRotation}deg)`;
            console.log(`Starting result spin CSS transition to target: ${targetRotation}deg`);
        }

        // 4. Show the ball & START its animation
        // Pass winning index so showBall can calculate target angle
        showBall(winningNumberIndex);

        // 5. Set timeout to handle result *after* the CSS transition completes
        if (resultSpinTimeoutId) clearTimeout(resultSpinTimeoutId);
        resultSpinTimeoutId = setTimeout(() => {
            console.log("Result spin transition presumed ended, handling result...");
            handleResult(winningNumber); // Pass winning number to result handler
        }, RESULT_SPIN_DURATION);
    }

    /** Handles result calculation and UI update after spin animation ends. */
    function handleResult(winningNumber) {
        // Note: Ball animation loop stops itself when duration is met

        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');
        console.log(`Handling result for winning number: ${winningNumber}`);

        const winningColor = ROULETTE_COLORS[winningNumber];

        // Display winning number/color
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result';
            rouletteResultDisplay.classList.add(winningColor);
        }

        // --- Calculate Winnings ---
        let totalWinnings = 0;
        let totalBetReturned = 0;
        placedBets.forEach(bet => { /* ... Winnings calculation logic ... */
            let payoutMultiplier = 0; let betWon = false;
            if (bet.type === 'single' && bet.value === winningNumber) { payoutMultiplier = ROULETTE_PAYOUTS.single; betWon = true; }
            else if (bet.type === 'red' && winningColor === 'red') { payoutMultiplier = ROULETTE_PAYOUTS.red; betWon = true; }
            else if (bet.type === 'black' && winningColor === 'black') { payoutMultiplier = ROULETTE_PAYOUTS.black; betWon = true; }
            else if (bet.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) { payoutMultiplier = ROULETTE_PAYOUTS.odd; betWon = true; }
            else if (bet.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) { payoutMultiplier = ROULETTE_PAYOUTS.even; betWon = true; }
            else if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) { payoutMultiplier = ROULETTE_PAYOUTS.low; betWon = true; }
            else if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) { payoutMultiplier = ROULETTE_PAYOUTS.high; betWon = true; }
            if (betWon) { const winningsForThisBet = bet.amount * payoutMultiplier; totalWinnings += winningsForThisBet; totalBetReturned += bet.amount;}
        });

        // Update balance & status message
        const totalReturn = totalWinnings + totalBetReturned;
        let statusMessage = '';
        if (totalReturn > 0 && LocalBrokieAPI) { /* ... Win message ... */
            LocalBrokieAPI.updateBalance(totalReturn); statusMessage = `Win! Landed ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`; LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000); LocalBrokieAPI.playSound('win_long'); if (totalWinnings > 0) LocalBrokieAPI.addWin('Roulette', totalWinnings);
        } else { /* ... Lose message ... */
             const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); statusMessage = `Lose. Landed ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`; if (LocalBrokieAPI) { LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000); LocalBrokieAPI.playSound('lose'); }
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Set timeout to end the cycle (hide ball, restart continuous spin, reset UI)
        if (resetTimeoutId) clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
    }

    /** Cleans up after a spin cycle: hides ball, restarts continuous spin, allows reset. */
    function endSpinCycle() {
        console.log("Ending spin cycle, cleaning up...");
        // Hide ball and ensure its animation loop is stopped
        hideBall();

        // Restart continuous spin
        if (rouletteWheel) {
            const finalTransform = getComputedStyle(rouletteWheel).transform;
            rouletteWheel.classList.remove('result-spin');
            rouletteWheel.style.transition = 'none';
            rouletteWheel.style.transform = finalTransform; // Hold final position
            void rouletteWheel.offsetWidth;
            startContinuousSpin(); // Apply continuous spin class
            console.log("Continuous spin class re-applied.");
        }

        // Allow new spins/bets and reset the betting UI
        rouletteIsSpinning = false; // Mark sequence as finished
        resetRoulette(false); // Reset bets, controls, status (don't force wheel snap)
    }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}