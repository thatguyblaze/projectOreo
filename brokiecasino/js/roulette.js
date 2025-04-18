// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.7 - Corrected Number Orientation)
     *
     * - Corrected positionWheelNumbers: Numbers spin with wheel and stay upright relative to viewer.
     * - Wheel (#roulette-wheel) spins continuously via CSS animation.
     * - Ball animation landing synchronized with the wheel's current rotation.
     * - Retains ball animation loop (requestAnimationFrame).
     * - Retains multiple bet support.
     * ==========================================================================
     */

    // --- Constants ---
    const ROULETTE_NUMBERS = [ /* ... numbers ... */
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
    const ROULETTE_COLORS = { /* ... colors ... */
        0: 'green', 1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
        11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
        21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
        31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
    };
    const ROULETTE_PAYOUTS = { /* ... payouts ... */
        single: 35, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1
    };
    const TOTAL_NUMBERS = ROULETTE_NUMBERS.length;
    const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;
    const BALL_ANIMATION_DURATION = 4500; // ms
    const POST_RESULT_DELAY = 2500; // ms

    // --- Ball Animation Constants ---
    const BALL_INITIAL_RADIUS_FACTOR = 0.9;
    const BALL_FINAL_RADIUS_FACTOR = 0.75;
    const BALL_INITIAL_SPEED = -800; // Degrees per second
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3;
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7;
    const BALL_LANDING_SPIRAL_TIME = 1500;
    const BALL_LANDING_CONVERGE_TIME = 300; // Not currently used, but kept for potential refinement

    // --- State Variables ---
    let rouletteIsSpinning = false;
    let placedBets = [];
    let handleResultTimeoutId = null;
    let resetTimeoutId = null;
    let ballAnimationId = null;
    let ballStartTime = null;
    let ballStartAngle = 0;
    let ballAngle = 0;
    let ballRadius = 0;
    let targetWinningNumberIndex = -1;
    let ballLanded = false;
    let containerRadius = 0;
    let lastBallTimestamp = 0;

    // --- DOM Element References ---
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall, rouletteWheelContainer;

    // --- API Reference ---
    let LocalBrokieAPI = null;

    /** Initializes the Roulette game. */
    function initRoulette(API) {
        LocalBrokieAPI = API;
        // Get DOM elements
        rouletteWheelContainer = document.getElementById('roulette-wheel-container');
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
            const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none'; return;
        }
        // Setup UI
        createRouletteBettingGrid();
        positionWheelNumbers(); // Position numbers ON the wheel
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) { LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput); }
        // Initial Reset
        resetRoulette(true);
        console.log("Roulette Initialized (v2.7 - Corrected Number Orientation)");
    }

    // --- Helper Functions ---

    /** Finds a bet in the placedBets array. */
    function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }

    /** Updates the visual display of a bet button. */
    function updateButtonVisual(button, amount) { /* ... No changes ... */ if (!button) return; const originalValue = button.dataset.originalValue || button.textContent; if (!button.dataset.originalValue) button.dataset.originalValue = originalValue; if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); } else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); } }

    /** Updates the display showing the total amount currently bet. */
    function updateTotalBetDisplay() { /* ... No changes ... */ if (!rouletteCurrentBetDisplay) return; const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed'; }

    /** Makes the roulette ball visible and starts its animation loop. */
    function showBall(winningIndex) {
        if (!rouletteBall || !rouletteWheelContainer) return;
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { console.error("Cannot calculate container radius."); return; }
        targetWinningNumberIndex = winningIndex;
        ballLanded = false;
        ballStartTime = performance.now();
        lastBallTimestamp = ballStartTime;
        ballStartAngle = Math.random() * 360;
        ballAngle = ballStartAngle;
        ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR;
        const initialRadians = ballStartAngle * (Math.PI / 180);
        const initialX = containerRadius + ballRadius * Math.cos(initialRadians);
        const initialY = containerRadius + ballRadius * Math.sin(initialRadians);
        rouletteBall.style.left = `${initialX}px`;
        rouletteBall.style.top = `${initialY}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        rouletteBall.classList.add('visible');
        if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
        ballAnimationId = requestAnimationFrame(animateBall);
        console.log("Ball animation started.");
    }

    /** Makes the roulette ball visually disappear and stops animation. */
    function hideBall() {
        if (ballAnimationId) { cancelAnimationFrame(ballAnimationId); ballAnimationId = null; }
        if (rouletteBall) { rouletteBall.classList.remove('visible'); }
    }

     /** Ensures the continuous spin CSS class is active. */
     function startContinuousSpin() {
        if (!rouletteWheel) return;
        rouletteWheel.style.transition = 'none';
        rouletteWheel.style.transform = '';
        rouletteWheel.classList.add('continuous-spin');
     }

     /** Gets the current rotation angle of the wheel. */
     function getCurrentWheelRotationAngle() {
         if (!rouletteWheel) return 0;
         try {
             const currentTransform = getComputedStyle(rouletteWheel).transform;
             if (currentTransform === 'none') return 0;
             const matrixValues = currentTransform.match(/matrix.*\((.+)\)/);
             if (matrixValues && matrixValues[1]) {
                  const matrix = matrixValues[1].split(', ');
                  const angleRad = Math.atan2(parseFloat(matrix[1]), parseFloat(matrix[0]));
                  let angleDeg = angleRad * (180 / Math.PI);
                  return (angleDeg < 0) ? angleDeg + 360 : angleDeg;
             }
         } catch (e) { console.error("Error getting wheel rotation:", e); }
         return 0;
     }


    /** The main ball animation loop. */
    function animateBall(timestamp) {
        if (ballLanded || !rouletteBall || containerRadius <= 0 || !ballStartTime) {
             if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return;
        }

        const elapsed = timestamp - ballStartTime;
        const deltaTime = (timestamp - lastBallTimestamp) / 1000;
        lastBallTimestamp = timestamp;

        if (deltaTime <= 0 || deltaTime > 0.1) { ballAnimationId = requestAnimationFrame(animateBall); return; }

        // Calculate Current Speed
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelerationElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const decelerationFactor = Math.max(0, 1 - (decelerationElapsed / BALL_DECELERATION_TIME));
            currentSpeed *= decelerationFactor * decelerationFactor;
        }

        // Calculate Current Radius
        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
        if (elapsed > spiralStartTime) {
             const spiralElapsed = elapsed - spiralStartTime;
             const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
             const easedProgress = spiralProgress * spiralProgress * (3 - 2 * spiralProgress);
             currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedProgress;
        }
        ballRadius = containerRadius * currentRadiusFactor;

        // Update Ball Angle
        ballAngle = (ballAngle + (currentSpeed * deltaTime)) % 360;
        if (ballAngle < 0) ballAngle += 360;

        // Check for Landing Time & Snap Position
        if (elapsed >= BALL_ANIMATION_DURATION) {
            console.log("Ball animation duration reached. Landing.");
            ballLanded = true;
            // Sync with current wheel rotation
            const wheelCurrentAngle = getCurrentWheelRotationAngle();
            const winningNumberBaseAngle = 360 - (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2); // 0=top, positive=CW
            const finalTargetAngle = (wheelCurrentAngle + winningNumberBaseAngle) % 360;
            ballAngle = finalTargetAngle;
            ballRadius = containerRadius * BALL_FINAL_RADIUS_FACTOR;
        }

        // Calculate X, Y Coordinates
        const currentRadians = (ballAngle - 90) * (Math.PI / 180); // Adjust for trig functions (0=right)
        const x = containerRadius + ballRadius * Math.cos(currentRadians);
        const y = containerRadius + ballRadius * Math.sin(currentRadians);

        // Update Ball Style
        rouletteBall.style.left = `${x}px`;
        rouletteBall.style.top = `${y}px`;

        // Request Next Frame or Stop
        if (!ballLanded) {
            ballAnimationId = requestAnimationFrame(animateBall);
        } else {
            ballAnimationId = null;
            console.log(`Ball landed visually at Angle: ${ballAngle.toFixed(2)}`);
        }
    }


    // --- Core Functions ---

    /** Creates the betting grid buttons. */
    function createRouletteBettingGrid() { /* ... No changes ... */
        if (!rouletteInsideBetsContainer) { console.error("..."); return; } rouletteInsideBetsContainer.innerHTML = ''; const zeroButton = createBetButton(0, 'green', 'single'); zeroButton.classList.add('col-span-3'); rouletteInsideBetsContainer.appendChild(zeroButton); for (let i = 1; i <= 36; i++) { const color = ROULETTE_COLORS[i]; const button = createBetButton(i, color, 'single'); rouletteInsideBetsContainer.appendChild(button); }
    }

    /** Creates a single bet button element. */
    function createBetButton(value, color, betType) { /* ... No changes ... */
         const button = document.createElement('button'); button.classList.add('roulette-bet-btn'); if (color) button.classList.add(color); button.textContent = value.toString(); button.dataset.betType = betType; button.dataset.betValue = value.toString(); button.dataset.originalValue = value.toString(); return button;
     }

    /** Positions numbers ON the spinning wheel, keeping text upright relative to viewer. */
    function positionWheelNumbers() {
        const wheel = document.getElementById('roulette-wheel');
        const container = document.getElementById('roulette-wheel-container');
        if (!wheel || !container) { console.error("Wheel or container missing"); return; }

        requestAnimationFrame(() => {
             const containerDiameter = container.offsetWidth;
             if (containerDiameter <= 0) { setTimeout(positionWheelNumbers, 100); return; }
             const containerRadius = containerDiameter / 2;
             const overlayInsetPercent = 0.15;
             const numberRingRadius = containerRadius * (1 - overlayInsetPercent - 0.04);

             wheel.innerHTML = ''; // Clear previous numbers/content from wheel

             ROULETTE_NUMBERS.forEach((num, index) => {
                 // Angle for positioning (0=top, positive=CW)
                 const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2);
                 // Angle for trig calculations (0=right, positive=CCW)
                 const calculationAngleRadians = (angleDegrees - 90) * (Math.PI / 180);

                 const numberSpan = document.createElement('span');
                 numberSpan.textContent = num.toString();
                 numberSpan.classList.add('roulette-number', `num-${num}`);

                 // Calculate position relative to the wheel's center
                 const x = containerRadius + numberRingRadius * Math.cos(calculationAngleRadians);
                 const y = containerRadius + numberRingRadius * Math.sin(calculationAngleRadians);

                 numberSpan.style.position = 'absolute';
                 numberSpan.style.left = `${x}px`;
                 numberSpan.style.top = `${y}px`;
                 // CHANGE: Apply only translate to center the span. Rotation comes from parent wheel.
                 numberSpan.style.transform = `translate(-50%, -50%)`;

                 // Append to the wheel div so they rotate with it
                 wheel.appendChild(numberSpan);
             });
             console.log("Positioned numbers on spinning wheel (upright text).");
        });
    }

    /** Sets up event listeners. */
    function setupRouletteEventListeners() { /* ... No changes ... */
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel); if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets);
    }

    /** Handles placing bets. */
    function handleBetPlacement(event) { /* ... No changes ... */
         if (rouletteIsSpinning) return; const targetButton = event.target.closest('.roulette-bet-btn'); if (!targetButton) return; const amountToAdd = parseInt(rouletteBetInput.value); if (isNaN(amountToAdd) || amountToAdd < 1){/*..*/} if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()){/*..*/} if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); const betType = targetButton.dataset.betType; const betValue = targetButton.dataset.betValue; let existingBet = findPlacedBet(betType, betValue); if (existingBet) { existingBet.amount += amountToAdd; } else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); } updateButtonVisual(targetButton, existingBet.amount); updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = false; if (clearBetsButton) clearBetsButton.disabled = false;
     }

    /** Clears all placed bets. */
    function clearAllRouletteBets() { /* ... No changes ... */
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

        // Position numbers ON the wheel
        if(rouletteWheel) positionWheelNumbers();

        // Ensure wheel keeps spinning
        if (rouletteWheel) {
            startContinuousSpin(); // Ensures .continuous-spin class is on
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
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) { LocalBrokieAPI.updateBalance(-totalBetAmount); LocalBrokieAPI.playSound('roulette_spin'); }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Ball rolling... No more bets!';
        // Disable controls...
        if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteBetInput) rouletteBetInput.disabled = true; if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none'; if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        // Calculate winning number
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        console.log(`Calculated winning number: ${winningNumber} (Index: ${winningNumberIndex})`);

        // --- Wheel continues spinning via CSS ---

        // --- Show Ball & Start Its Animation ---
        showBall(winningNumberIndex); // Pass index for landing calculation

        // --- Set timeout to handle result ---
        if (handleResultTimeoutId) clearTimeout(handleResultTimeoutId);
        handleResultTimeoutId = setTimeout(() => {
            // Ball animation stops itself via ballLanded flag in animateBall
            console.log("Ball animation duration ended, handling result...");
            handleResult(winningNumber);
        }, BALL_ANIMATION_DURATION);
    }

    /** Handles result calculation and UI update after ball animation ends. */
    function handleResult(winningNumber) {
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');
        console.log(`Handling result for winning number: ${winningNumber}`);
        const winningColor = ROULETTE_COLORS[winningNumber];

        // Display result in hub
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result';
            rouletteResultDisplay.classList.add(winningColor);
        }

        // Calculate Winnings
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

        // Update balance & status
        const totalReturn = totalWinnings + totalBetReturned;
        let statusMessage = '';
        if (totalReturn > 0 && LocalBrokieAPI) { /* ... Win message ... */
            LocalBrokieAPI.updateBalance(totalReturn); statusMessage = `Win! Landed ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`; LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000); LocalBrokieAPI.playSound('win_long'); if (totalWinnings > 0) LocalBrokieAPI.addWin('Roulette', totalWinnings);
        } else { /* ... Lose message ... */
            const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); statusMessage = `Lose. Landed ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`; if (LocalBrokieAPI) { LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000); LocalBrokieAPI.playSound('lose'); }
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Set timeout to end the cycle
        if (resetTimeoutId) clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
    }

    /** Cleans up after a spin cycle: hides ball, then resets UI. */
    function endSpinCycle() {
        console.log("Ending spin cycle...");
        hideBall(); // Hide ball & stop its animation
        // Wheel continues spinning via CSS

        rouletteIsSpinning = false; // Allow next spin
        resetRoulette(false); // Reset bets/controls
    }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}