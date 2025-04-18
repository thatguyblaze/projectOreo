// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.5 - Stationary Numbers & Continuous Wheel)
     *
     * - Numbers are now placed in a stationary ring (#roulette-number-ring).
     * - Wheel (#roulette-wheel) spins continuously via CSS animation.
     * - Removed JS logic for stopping/starting/transitioning the wheel itself.
     * - Ball animation runs independently; lands based on pre-calculated target angle.
     * - Retains ball animation loop (requestAnimationFrame) from v2.4.
     * - Retains multiple bet support (v2.2).
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
    // Renamed constant - this is now the duration of the BALL animation sequence
    const BALL_ANIMATION_DURATION = 4500; // ms - How long the ball animation runs
    const POST_RESULT_DELAY = 2500; // ms - Delay before reset after result shown

    // --- Ball Animation Constants ---
    const BALL_INITIAL_RADIUS_FACTOR = 0.9;
    const BALL_FINAL_RADIUS_FACTOR = 0.75;
    const BALL_INITIAL_SPEED = -800; // Degrees per second
    // Adjust deceleration timing based on BALL_ANIMATION_DURATION
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3;
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7;
    const BALL_LANDING_SPIRAL_TIME = 1500; // Keep spiral time

    // --- State Variables ---
    let rouletteIsSpinning = false; // Tracks if the ball animation sequence is active
    let placedBets = [];
    let handleResultTimeoutId = null; // Renamed timeout ID
    let resetTimeoutId = null;
    // Ball Animation State
    let ballAnimationId = null;
    let ballStartTime = null;
    let ballStartAngle = 0;
    let ballAngle = 0;
    let ballRadius = 0;
    let ballTargetAngle = 0; // The final fixed angle the ball should land at
    let ballLanded = false;
    let containerRadius = 0;

    // --- DOM Element References ---
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall, rouletteWheelContainer,
        rouletteNumberRing; // NEW: Number ring element reference

    // --- API Reference ---
    let LocalBrokieAPI = null;

    /** Initializes the Roulette game. */
    function initRoulette(API) {
        LocalBrokieAPI = API;

        // Get DOM elements
        rouletteWheelContainer = document.getElementById('roulette-wheel-container');
        rouletteWheel = document.getElementById('roulette-wheel');
        rouletteNumberRing = document.getElementById('roulette-number-ring'); // NEW: Get number ring
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

        // Check essential elements (added number ring)
        if (!rouletteWheelContainer || !rouletteWheel || !rouletteNumberRing || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !LocalBrokieAPI) {
            console.error("Roulette init failed: Missing critical elements or API.");
            const tab = document.getElementById('tab-roulette');
            if (tab) tab.style.display = 'none';
            return;
        }

        // Setup UI
        createRouletteBettingGrid();
        positionWheelNumbers(); // Position numbers in the ring
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) {
            LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
        }

        // Initial Reset
        resetRoulette(true);
        console.log("Roulette Initialized (v2.5 - Stationary Numbers)");
    }

    // --- Helper Functions ---

    /** Finds a bet in the placedBets array. */
    function findPlacedBet(type, value) { /* ... No changes ... */
        return placedBets.find(bet => bet.type === type && bet.value == value);
    }

    /** Updates the visual display of a bet button. */
    function updateButtonVisual(button, amount) { /* ... No changes ... */
        if (!button) return;
        const originalValue = button.dataset.originalValue || button.textContent;
        if (!button.dataset.originalValue) button.dataset.originalValue = originalValue;
        if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); }
        else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); }
    }

    /** Updates the display showing the total amount currently bet. */
    function updateTotalBetDisplay() { /* ... No changes ... */
        if (!rouletteCurrentBetDisplay) return;
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed';
    }

    /** Makes the roulette ball visible and starts its animation loop. */
    function showBall(winningNumberIndex) {
        if (!rouletteBall || !rouletteWheelContainer) return;
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { console.error("Cannot calculate container radius."); return; }

        // --- Calculate Ball's FINAL Target Angle ---
        // This is the angle relative to the container (0=top) where the ball should land.
        const angleToSegmentStart = -(winningNumberIndex * ANGLE_PER_NUMBER);
        const offsetWithinSegment = -(ANGLE_PER_NUMBER * (0.2 + Math.random() * 0.6)); // Random offset within segment
        // Convert to the coordinate system used by animateBall (0 degrees = right, positive = counter-clockwise)
        // -90 adjustment aligns 0 degrees to the top visually for calculation.
        ballTargetAngle = (angleToSegmentStart + offsetWithinSegment - 90);
         // Normalize angle to be within [0, 360) or [-180, 180) if preferred - doesn't strictly matter for cos/sin
        ballTargetAngle = (ballTargetAngle % 360 + 360) % 360; // Ensure positive angle
        console.log(`Ball target angle set: ${ballTargetAngle.toFixed(2)}deg (for number index ${winningNumberIndex})`);

        // --- Reset Animation State ---
        ballLanded = false;
        ballStartTime = performance.now();
        // Start the ball at a random angle for variety
        ballStartAngle = Math.random() * 360;
        ballAngle = ballStartAngle;
        ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR; // Start at outer radius

        // --- Position & Show ---
        const initialRadians = ballStartAngle * (Math.PI / 180);
        const initialX = containerRadius + ballRadius * Math.cos(initialRadians);
        const initialY = containerRadius + ballRadius * Math.sin(initialRadians);
        rouletteBall.style.left = `${initialX}px`;
        rouletteBall.style.top = `${initialY}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        rouletteBall.classList.add('visible'); // Make it visible

        // --- Start Animation Loop ---
        if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
        ballAnimationId = requestAnimationFrame(animateBall);
        console.log("Ball animation started.");
    }

    /** Makes the roulette ball visually disappear and stops animation. */
    function hideBall() {
        if (ballAnimationId) {
            cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
        }
        if (rouletteBall) {
            rouletteBall.classList.remove('visible');
        }
        // console.log("Ball hidden, animation stopped."); // Less console noise
    }

     /** Ensures the continuous spin CSS class is active. (Wheel always spins) */
     function startContinuousSpin() {
        if (!rouletteWheel) return;
        // Only ensure the class is present, remove any potentially conflicting styles
        rouletteWheel.style.transition = 'none';
        rouletteWheel.style.transform = ''; // Let CSS animation control transform
        rouletteWheel.classList.remove('result-spin'); // Make sure this isn't present
        rouletteWheel.classList.add('continuous-spin');
     }

     // --- Removed stopContinuousSpinAndHold() as wheel no longer stops ---

    /** The main ball animation loop. */
    function animateBall(timestamp) {
        if (ballLanded || !rouletteBall || containerRadius <= 0 || !ballStartTime) {
            if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return;
        }

        const elapsed = timestamp - ballStartTime;

        // --- Calculate Current Speed (Deceleration) ---
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelerationElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const decelerationFactor = Math.max(0, 1 - (decelerationElapsed / BALL_DECELERATION_TIME));
            currentSpeed *= decelerationFactor * decelerationFactor; // Ease-out deceleration
        }

        // --- Calculate Current Radius (Spiral In) ---
        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
        if (elapsed > spiralStartTime) {
             const spiralElapsed = elapsed - spiralStartTime;
             const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
             // Ease-in-out for spiral looks nice: Math.pow(spiralProgress, 2) * (3 - 2 * spiralProgress)
             const easedProgress = spiralProgress * spiralProgress * (3 - 2 * spiralProgress);
             currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedProgress;
        }
        ballRadius = containerRadius * currentRadiusFactor;

        // --- Update Angle based on integrated speed ---
        // Simplified: Update based on current frame's speed (more accurate requires integration)
        const deltaTime = (timestamp - (window.lastBallTimestamp || ballStartTime)) / 1000; // Time since last frame in seconds
        window.lastBallTimestamp = timestamp; // Store for next frame delta calculation
        if (deltaTime > 0.1) { /* Skip large jumps */ } else { // Avoid huge jump on first frame or lag
             ballAngle = (ballAngle + (currentSpeed * deltaTime)) % 360;
        }


        // --- Check for Landing Time ---
        if (elapsed >= BALL_ANIMATION_DURATION) {
            console.log("Ball animation duration reached. Landing.");
            ballLanded = true;
            ballAngle = ballTargetAngle; // Snap to the calculated final angle
            ballRadius = containerRadius * BALL_FINAL_RADIUS_FACTOR; // Snap to final radius
        }

        // --- Calculate X, Y Coordinates ---
        const currentRadians = ballAngle * (Math.PI / 180);
        // Use containerRadius as the center offset
        const x = containerRadius + ballRadius * Math.cos(currentRadians);
        const y = containerRadius + ballRadius * Math.sin(currentRadians);

        // --- Update Ball Style ---
        rouletteBall.style.left = `${x}px`;
        rouletteBall.style.top = `${y}px`;

        // --- Request Next Frame or Stop ---
        if (!ballLanded) {
            ballAnimationId = requestAnimationFrame(animateBall);
        } else {
            ballAnimationId = null; // Stop the loop
            console.log(`Ball landed visually at Angle: ${ballAngle.toFixed(2)}, Radius: ${ballRadius.toFixed(2)}`);
            // Result handling is triggered by the separate timeout in spinWheel
        }
    }


    // --- Core Functions ---

    /** Creates the betting grid buttons. */
    function createRouletteBettingGrid() { /* ... No changes ... */
        if (!rouletteInsideBetsContainer) { console.error("..."); return; }
        rouletteInsideBetsContainer.innerHTML = '';
        const zeroButton = createBetButton(0, 'green', 'single'); zeroButton.classList.add('col-span-3'); rouletteInsideBetsContainer.appendChild(zeroButton);
        for (let i = 1; i <= 36; i++) { const color = ROULETTE_COLORS[i]; const button = createBetButton(i, color, 'single'); rouletteInsideBetsContainer.appendChild(button); }
    }

    /** Creates a single bet button element. */
    function createBetButton(value, color, betType) { /* ... No changes ... */
        const button = document.createElement('button'); button.classList.add('roulette-bet-btn'); if (color) button.classList.add(color); button.textContent = value.toString(); button.dataset.betType = betType; button.dataset.betValue = value.toString(); button.dataset.originalValue = value.toString(); return button;
    }

    /** Positions numbers in the stationary number ring. */
    function positionWheelNumbers() {
        const container = document.getElementById('roulette-wheel-container');
        // CHANGE: Target the number ring now
        if (!rouletteNumberRing || !container) { console.error("Number ring or container missing"); return; }

        requestAnimationFrame(() => {
             const containerDiameter = container.offsetWidth;
             if (containerDiameter <= 0) { /* Retry logic */ setTimeout(positionWheelNumbers, 100); return; }
             const containerRadius = containerDiameter / 2;
             const overlayInsetPercent = 0.15;
             const numberRingRadius = containerRadius * (1 - overlayInsetPercent - 0.04);

             // Clear existing numbers from the number ring
             rouletteNumberRing.innerHTML = ''; // Clear previous numbers

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
                 // CHANGE: Remove rotation, numbers stay upright relative to viewer
                 numberSpan.style.transform = `translate(-50%, -50%)`;

                 // CHANGE: Append to the number ring, not the wheel
                 rouletteNumberRing.appendChild(numberSpan);
             });
             console.log("Positioned numbers in stationary ring.");
        });
    }

    /** Sets up event listeners. */
    function setupRouletteEventListeners() { /* ... No changes needed ... */
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement);
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement);
        if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel);
        if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets);
    }

    /** Handles placing bets. */
    function handleBetPlacement(event) { /* ... No changes needed ... */
         if (rouletteIsSpinning) return; const targetButton = event.target.closest('.roulette-bet-btn'); if (!targetButton) return; const amountToAdd = parseInt(rouletteBetInput.value); if (isNaN(amountToAdd) || amountToAdd < 1){/*..*/} if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()){/*..*/} if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); const betType = targetButton.dataset.betType; const betValue = targetButton.dataset.betValue; let existingBet = findPlacedBet(betType, betValue); if (existingBet) { existingBet.amount += amountToAdd; } else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); } updateButtonVisual(targetButton, existingBet.amount); updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = false; if (clearBetsButton) clearBetsButton.disabled = false;
    }

    /** Clears all placed bets. */
    function clearAllRouletteBets() { /* ... No changes needed ... */
        if (rouletteIsSpinning) return; if (placedBets.length === 0) return; if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets'); placedBets.forEach(bet => { if (bet.buttonElement) updateButtonVisual(bet.buttonElement, 0); }); placedBets = []; updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!';
    }


    /** Resets the game state and UI. */
    function resetRoulette(forceVisualReset = false) {
        console.log("Resetting Roulette State...");
        rouletteIsSpinning = false;

        // Clear timeouts
        if (handleResultTimeoutId) { clearTimeout(handleResultTimeoutId); handleResultTimeoutId = null; }
        if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; }

        clearAllRouletteBets(); // Clear bets state and visuals

        // Reset displays
        if (rouletteResultDisplay) { rouletteResultDisplay.textContent = '?'; rouletteResultDisplay.className = 'roulette-result'; }
        if (rouletteStatusDisplay && !rouletteStatusDisplay.textContent.includes('Bets cleared')) { rouletteStatusDisplay.textContent = 'Place your bet!'; }
        updateTotalBetDisplay();

        // Position numbers in the correct ring
        if(rouletteNumberRing) positionWheelNumbers(); // Call after getting element ref

        // Ensure wheel keeps spinning continuously
        if (rouletteWheel) {
            // Remove any potential inline styles left over
            rouletteWheel.style.transform = '';
            rouletteWheel.style.transition = 'none';
            // Ensure continuous spin class is active
            startContinuousSpin();
        }

        // Hide ball and stop its animation
        hideBall();

        // Re-enable betting controls
        if (rouletteBetInput) rouletteBetInput.disabled = false;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
    }

    /** Starts the ball animation sequence. */
    function spinWheel() {
        if (rouletteIsSpinning) { console.warn("Spin already in progress."); return; }
        if (placedBets.length === 0) { /*...*/ return; }
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (isNaN(totalBetAmount) || totalBetAmount < 1) { /*...*/ return; }
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) { /*...*/ return; }

        // --- Start Spin Sequence ---
        console.log("Starting ball animation sequence...");
        rouletteIsSpinning = true; // Mark sequence as active
        if (LocalBrokieAPI) { LocalBrokieAPI.updateBalance(-totalBetAmount); LocalBrokieAPI.playSound('roulette_spin'); }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Ball rolling... No more bets!';
        // Disable controls...
        if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteBetInput) rouletteBetInput.disabled = true; if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none'; if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        // Calculate winning number
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        console.log(`Calculated winning number: ${winningNumber}`);

        // --- Wheel continues spinning via CSS ---
        // No need to stop/start wheel JS here

        // --- Show Ball & Start Its Animation ---
        // Pass winning index so showBall can calculate the final target landing angle
        showBall(winningNumberIndex);

        // --- Set timeout to handle result *after* the ball animation finishes ---
        if (handleResultTimeoutId) clearTimeout(handleResultTimeoutId);
        handleResultTimeoutId = setTimeout(() => {
            // Ball animation loop should have stopped itself and snapped ball position by now
            console.log("Ball animation duration ended, handling result...");
            handleResult(winningNumber);
        }, BALL_ANIMATION_DURATION); // Use ball animation duration
    }

    /** Handles result calculation and UI update after ball animation ends. */
    function handleResult(winningNumber) {
        // Ball animation stops itself, JS just needs to process the result now.
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball'); // Sound for ball landing
        console.log(`Handling result for winning number: ${winningNumber}`);

        const winningColor = ROULETTE_COLORS[winningNumber];

        // Display winning number/color in hub
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result';
            rouletteResultDisplay.classList.add(winningColor);
        }

        // --- Calculate Winnings ---
        let totalWinnings = 0; let totalBetReturned = 0;
        placedBets.forEach(bet => { /* ... Winnings calculation ... */
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

        // --- Update balance & status message ---
        const totalReturn = totalWinnings + totalBetReturned;
        let statusMessage = '';
        if (totalReturn > 0 && LocalBrokieAPI) { /* ... Win message/actions ... */
             LocalBrokieAPI.updateBalance(totalReturn); statusMessage = `Win! Landed ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`; LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000); LocalBrokieAPI.playSound('win_long'); if (totalWinnings > 0) LocalBrokieAPI.addWin('Roulette', totalWinnings);
        } else { /* ... Lose message/actions ... */
             const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); statusMessage = `Lose. Landed ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`; if (LocalBrokieAPI) { LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000); LocalBrokieAPI.playSound('lose'); }
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Set timeout to end the cycle (hide ball, reset UI)
        // NOTE: Wheel continues spinning, no need to restart it here
        if (resetTimeoutId) clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
    }

    /** Cleans up after a spin cycle: hides ball, then resets UI. */
    function endSpinCycle() {
        console.log("Ending spin cycle (ball hidden, wheel continues)...");
        hideBall(); // Hide the ball and stop its animation loop

        // The wheel animation (.continuous-spin) remains running via CSS

        rouletteIsSpinning = false; // Mark betting sequence as finished
        resetRoulette(false); // Reset bets, controls, status
    }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}