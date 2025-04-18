// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.15 - Smoothed Ball Landing)
     *
     * - FIX: Ball now re-parents to the wheel element upon landing.
     * - FIX: Ball position calculated relative to wheel center for final placement.
     * - FIX: hideBall now returns the ball to the container element.
     * - FIX: Added CSS transition for smooth final ball placement (prevents jump).
     * - Ball spins with wheel after landing.
     * - Numbers spin with wheel (clock-face orientation).
     * - Wheel spins continuously via CSS.
     * - Ball animation landing synchronized.
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
    const BALL_ANIMATION_DURATION = 4500; // ms
    const POST_RESULT_DELAY = 2500; // ms

    // --- Ball Animation Constants ---
    const BALL_INITIAL_RADIUS_FACTOR = 0.9; // Relative to container radius initially
    const BALL_FINAL_RADIUS_FACTOR = 0.75; // Relative to WHEEL radius for final position
    const BALL_INITIAL_SPEED = -800; // Degrees per second (negative for counter-spin)
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3; // Start slowing down
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7; // Time over which to decelerate
    const BALL_LANDING_SPIRAL_TIME = 1500; // Time for the spiral-in effect
    const BALL_LANDING_TRANSITION_MS = 300; // Duration for smooth final placement

    // --- State Variables ---
    let rouletteIsSpinning = false;
    let placedBets = [];
    let handleResultTimeoutId = null;
    let resetTimeoutId = null;
    let ballAnimationId = null;
    let ballStartTime = null;
    let ballStartAngle = 0;
    let ballAngle = 0;
    let ballRadius = 0; // Current ball radius relative to CONTAINER during flight
    let targetWinningNumberIndex = -1;
    let ballLanded = false;
    let containerRadius = 0; // Keep for initial ball animation calculations
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
        // Get DOM elements...
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

        // Check essential elements...
        if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !LocalBrokieAPI) { console.error("Roulette init failed: Missing essential DOM elements or API."); const tab=document.getElementById('tab-roulette'); if(tab) tab.style.display='none'; return; }
        // Setup UI...
        createRouletteBettingGrid();
        positionWheelNumbers(); // Position numbers first
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) { LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput); }
        // Initial Reset...
        resetRoulette(true); // Pass true for initial setup visual reset
        console.log("Roulette Initialized (v2.15 - Smoothed Ball Landing)");
    }

    // --- Helper Functions ---
    function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }
    function updateButtonVisual(button, amount) { if (!button) return; const originalValue = button.dataset.originalValue || button.textContent; if (!button.dataset.originalValue) button.dataset.originalValue = originalValue; if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); } else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); } }
    function updateTotalBetDisplay() { if (!rouletteCurrentBetDisplay) return; const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed'; }

    /** Shows the ball and starts its animation sequence. */
    function showBall(winningIndex) {
        if (!rouletteBall || !rouletteWheelContainer) return;

        // Ensure containerRadius is up-to-date for initial placement
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { console.error("Cannot calculate container radius for ball."); return; }

        targetWinningNumberIndex = winningIndex;
        ballLanded = false; // Ensure ball is not marked as landed
        ballStartTime = performance.now();
        lastBallTimestamp = ballStartTime;
        ballStartAngle = Math.random() * 360; // Random start position
        ballAngle = ballStartAngle;
        ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR; // Initial radius relative to container

        // Calculate initial position relative to CONTAINER center
        const initialRadians = (ballStartAngle - 90) * (Math.PI / 180); // Use consistent -90 offset
        const initialX = containerRadius + ballRadius * Math.cos(initialRadians);
        const initialY = containerRadius + ballRadius * Math.sin(initialRadians);

        // Ensure ball is in the container AND transition is off before starting
        hideBall(); // Call hideBall to ensure it's detached from wheel and transition is none

        rouletteBall.style.left = `${initialX.toFixed(2)}px`;
        rouletteBall.style.top = `${initialY.toFixed(2)}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        rouletteBall.classList.add('visible');

        if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
        ballAnimationId = requestAnimationFrame(animateBall);
        console.log("Ball animation started.");
    }

     /** Hides the ball, ensures it's returned to the container, and removes transitions. */
    function hideBall() {
        if (ballAnimationId) {
            cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
        }
        if (rouletteBall) {
             // --- Clear any transitions FIRST ---
            rouletteBall.style.transition = 'none';
            // ------------------------------------
            rouletteBall.classList.remove('visible');

            const wheelElement = document.getElementById('roulette-wheel');
            const containerElement = document.getElementById('roulette-wheel-container');

            // Move back to container logic
            if (wheelElement && containerElement && rouletteBall.parentElement === wheelElement) {
                 try {
                      wheelElement.removeChild(rouletteBall);
                      containerElement.appendChild(rouletteBall);
                      console.log("Ball moved back to container from wheel.");
                 } catch (e) { console.error("Error moving ball back to container:", e); /* ... fallback ... */ }
            }
        }
        ballLanded = false; // Reset landed state
    }

    /** Starts the continuous CSS spin animation on the wheel */
    function startContinuousSpin() {
        if (!rouletteWheel) return;
        rouletteWheel.style.transition = 'none'; // Remove any JS transition
        rouletteWheel.style.transform = ''; // Clear any JS transform
        if (!rouletteWheel.classList.contains('continuous-spin')) {
            rouletteWheel.classList.add('continuous-spin');
            console.log("Applied continuous-spin class.");
        }
    }

    /** Gets the current visual rotation angle of the wheel from CSS */
    function getCurrentWheelRotationAngle() {
        // ... (no changes needed here) ...
        if (!rouletteWheel) return 0;
        try {
            const currentTransform = getComputedStyle(rouletteWheel).transform;
            if (currentTransform === 'none') return 0;
            const matrixValues = currentTransform.match(/matrix.*\((.+)\)/);
            if (matrixValues && matrixValues[1]) {
                const matrix = matrixValues[1].split(', ').map(parseFloat);
                const angleRad = Math.atan2(matrix[1], matrix[0]);
                let angleDeg = angleRad * (180 / Math.PI);
                return (angleDeg < 0) ? angleDeg + 360 : angleDeg;
            }
        } catch (e) { console.error("Error getting wheel rotation:", e); }
        return 0;
    }

    /** The main ball animation loop. */
    function animateBall(timestamp) {
        // --- Initial checks ---
        if (ballLanded || !rouletteBall || !rouletteWheelContainer) { /* ... */ return; }
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0 || !ballStartTime) { /* ... */ return; }

        const elapsed = timestamp - ballStartTime;
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
        lastBallTimestamp = timestamp;

        // --- Animation physics calculations ---
        // ... (no changes needed here for speed, radius factor, ballAngle) ...
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) { /* ... deceleration ... */
            const decelElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const decelProgress = Math.min(1, decelElapsed / BALL_DECELERATION_TIME);
            const decelFactor = Math.max(0, 1 - decelProgress*decelProgress);
            currentSpeed *= decelFactor;
        }
        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
        if (elapsed > spiralStartTime) { /* ... spiral ... */
            const spiralElapsed = elapsed - spiralStartTime;
            const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
            const easedProgress = spiralProgress < 0.5 ? 4 * spiralProgress * spiralProgress * spiralProgress : 1 - Math.pow(-2 * spiralProgress + 2, 3) / 2;
            currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedProgress;
        }
        ballRadius = containerRadius * currentRadiusFactor;
        ballAngle = (ballAngle + (currentSpeed * deltaTime)) % 360;
        if (ballAngle < 0) ballAngle += 360;


        // --- Landing Logic ---
        if (elapsed >= BALL_ANIMATION_DURATION) {
            ballLanded = true;
            // Stop the animation loop FIRST
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;

            // --- START: Updated Logic for Sticking Ball to Wheel SMOOTHLY ---
            const wheelElement = document.getElementById('roulette-wheel');
            if (!wheelElement) { /* ... error handling ... */ hideBall(); return; }

            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2;
            if (wheelRadius <= 0) { /* ... error handling ... */ hideBall(); return; }

            const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
            const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
            const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
            const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
            const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);

            // --- Add Transition for Smooth Landing ---
            rouletteBall.style.transition = `left ${BALL_LANDING_TRANSITION_MS}ms ease-out, top ${BALL_LANDING_TRANSITION_MS}ms ease-out`;
            // -----------------------------------------

            // Apply styles for position WITHIN the wheel (will now transition smoothly)
            rouletteBall.style.position = 'absolute';
            rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
            rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
            rouletteBall.style.transform = 'translate(-50%, -50%)';

            // Re-parent the ball: Move it from container to wheel AFTER setting position
            if (rouletteBall.parentElement !== wheelElement) {
                 if (rouletteBall.parentElement) { try { rouletteBall.parentElement.removeChild(rouletteBall); } catch(e) { /* Ignore */ } }
                 try { wheelElement.appendChild(rouletteBall); console.log("Ball attached to wheel element."); }
                 catch(e) { console.error("Could not attach ball to wheel element", e); rouletteBall.classList.remove('visible'); }
            }

            // --- Remove Transition After Animation ---
            setTimeout(() => {
                if (rouletteBall) { // Check element still exists
                   rouletteBall.style.transition = 'none'; // Remove transition styles
                   console.log("Landing transition removed.");
                }
            }, BALL_LANDING_TRANSITION_MS + 50); // Add a small buffer
            // ------------------------------------------
            // --- END: Updated Logic ---

            console.log(`Ball visually locked onto wheel at Number Index: ${targetWinningNumberIndex}, Wheel Angle: ${winningNumberBaseAngle.toFixed(2)}`);
            return; // Exit animateBall function

        } else {
             // --- Ball is still flying: Position relative to CONTAINER ---
             // Ensure no transition is applied during flight
             rouletteBall.style.transition = 'none';

             const currentRadians = (ballAngle - 90) * (Math.PI / 180);
             const x = containerRadius + ballRadius * Math.cos(currentRadians);
             const y = containerRadius + ballRadius * Math.sin(currentRadians);

             if(rouletteBall.parentElement !== rouletteWheelContainer) { /* ... safeguard ... */
                console.warn("Ball parent incorrect during flight, attempting correction.");
                if(rouletteBall.parentElement) try {rouletteBall.parentElement.removeChild(rouletteBall);} catch(e){}
                try{rouletteWheelContainer.appendChild(rouletteBall);} catch(e){}
             }

             rouletteBall.style.left = `${x.toFixed(2)}px`;
             rouletteBall.style.top = `${y.toFixed(2)}px`;
             rouletteBall.style.transform = 'translate(-50%, -50%)';

             // Continue animation ONLY if not landed
             ballAnimationId = requestAnimationFrame(animateBall);
        }
    } // End of animateBall

    // --- Core Functions ---
    function createRouletteBettingGrid() { /* ... No changes needed ... */ if (!rouletteInsideBetsContainer) { console.error("Roulette Inside Bets container not found!"); return; } rouletteInsideBetsContainer.innerHTML = ''; const zeroButton = createBetButton(0, 'green', 'single'); zeroButton.classList.add('col-span-3'); rouletteInsideBetsContainer.appendChild(zeroButton); for (let i = 1; i <= 36; i++) { const color = ROULETTE_COLORS[i]; const button = createBetButton(i, color, 'single'); rouletteInsideBetsContainer.appendChild(button); } }
    function createBetButton(value, color, betType) { /* ... No changes needed ... */ const button = document.createElement('button'); button.classList.add('roulette-bet-btn'); if (color) button.classList.add(color); button.textContent = value.toString(); button.dataset.betType = betType; button.dataset.betValue = value.toString(); button.dataset.originalValue = value.toString(); return button; }
    function positionWheelNumbers() { /* ... No changes needed ... */ const wheel = document.getElementById('roulette-wheel'); if (!wheel) { console.error("Wheel element missing for number positioning."); return; } requestAnimationFrame(() => { const wheelDiameter = wheel.offsetWidth; if (wheelDiameter <= 0) { setTimeout(positionWheelNumbers, 100); return; } const wheelRadius = wheelDiameter / 2; const numberRingRadiusFactor = 0.88; const numberRingRadius = wheelRadius * numberRingRadiusFactor; console.log(`Positioning Numbers - Wheel Radius: ${wheelRadius.toFixed(2)}, Number Ring Radius: ${numberRingRadius.toFixed(2)} (Factor: ${numberRingRadiusFactor})`); wheel.innerHTML = ''; ROULETTE_NUMBERS.forEach((num, index) => { const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2); const calculationAngleRadians = (angleDegrees - 90) * (Math.PI / 180); const numberSpan = document.createElement('span'); numberSpan.textContent = num.toString(); numberSpan.classList.add('roulette-number', `num-${num}`, ROULETTE_COLORS[num]); const x = wheelRadius + numberRingRadius * Math.cos(calculationAngleRadians); const y = wheelRadius + numberRingRadius * Math.sin(calculationAngleRadians); numberSpan.style.position = 'absolute'; numberSpan.style.left = `${x.toFixed(2)}px`; numberSpan.style.top = `${y.toFixed(2)}px`; numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees}deg)`; wheel.appendChild(numberSpan); }); console.log("Positioned numbers relative to wheel center."); }); }
    function setupRouletteEventListeners() { /* ... No changes needed ... */ if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel); if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets); window.addEventListener('resize', onWindowResize); }
    function handleBetPlacement(event) { /* ... No changes needed ... */ if (rouletteIsSpinning) return; const targetButton = event.target.closest('.roulette-bet-btn'); if (!targetButton) return; const amountToAdd = parseInt(rouletteBetInput.value); if (isNaN(amountToAdd) || amountToAdd < 1){ LocalBrokieAPI?.showMessage("Invalid bet amount.", 1500); return; } if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()){ LocalBrokieAPI?.showMessage("Insufficient balance.", 1500); return;} if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); const betType = targetButton.dataset.betType; const betValue = targetButton.dataset.betValue; let existingBet = findPlacedBet(betType, betValue); if (existingBet) { existingBet.amount += amountToAdd; } else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); } updateButtonVisual(targetButton, existingBet.amount); updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = false; if (clearBetsButton) clearBetsButton.disabled = false; }
    function clearAllRouletteBets() { /* ... No changes needed ... */ if (rouletteIsSpinning) return; if (placedBets.length === 0) return; if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets'); placedBets.forEach(bet => { if (bet.buttonElement) updateButtonVisual(bet.buttonElement, 0); }); placedBets = []; updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!'; }
    function resetRoulette(forceVisualReset = false) { /* ... No changes needed ... */ console.log("Resetting Roulette State..."); rouletteIsSpinning = false; if (handleResultTimeoutId) { clearTimeout(handleResultTimeoutId); handleResultTimeoutId = null; } if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; } clearAllRouletteBets(); if (rouletteResultDisplay) { rouletteResultDisplay.textContent = '?'; rouletteResultDisplay.className = 'roulette-result'; } if (rouletteStatusDisplay && !rouletteStatusDisplay.textContent.includes('Bets cleared')) { rouletteStatusDisplay.textContent = 'Place your bet!'; } updateTotalBetDisplay(); hideBall(); if (forceVisualReset && rouletteWheel) { positionWheelNumbers(); } if (rouletteWheel) { startContinuousSpin(); } if (rouletteBetInput) rouletteBetInput.disabled = false; if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto'; if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto'; if (rouletteSpinButton) rouletteSpinButton.disabled = (placedBets.length === 0); if (clearBetsButton) clearBetsButton.disabled = (placedBets.length === 0); }
    let resizeTimeout; function onWindowResize() { /* ... No changes needed ... */ clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { console.log("Window resized, repositioning elements."); if (rouletteWheel) { positionWheelNumbers(); } if (rouletteBall && rouletteBall.classList.contains('visible') && !ballLanded && rouletteWheelContainer) { containerRadius = rouletteWheelContainer.offsetWidth / 2; } }, 250); }
    function spinWheel() { /* ... No changes needed ... */ if (rouletteIsSpinning) { console.warn("Spin already in progress."); return; } if (placedBets.length === 0) { LocalBrokieAPI?.showMessage("Place a bet first!", 1500); return; } const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); if (isNaN(totalBetAmount) || totalBetAmount < 1) { console.error("Invalid total bet amount."); return; } if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) { LocalBrokieAPI?.showMessage("Insufficient balance for total bet.", 1500); return; } console.log("Starting spin and ball animation sequence..."); rouletteIsSpinning = true; if (LocalBrokieAPI) { LocalBrokieAPI.updateBalance(-totalBetAmount); LocalBrokieAPI.playSound('roulette_spin'); } if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Ball rolling... No more bets!'; if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteBetInput) rouletteBetInput.disabled = true; if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none'; if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none'; const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS); const winningNumber = ROULETTE_NUMBERS[winningNumberIndex]; console.log(`Calculated winning number: ${winningNumber} (Index: ${winningNumberIndex})`); showBall(winningNumberIndex); if (handleResultTimeoutId) clearTimeout(handleResultTimeoutId); handleResultTimeoutId = setTimeout(() => { console.log("Ball animation duration ended, handling result..."); handleResult(winningNumber); }, BALL_ANIMATION_DURATION); }
    function handleResult(winningNumber) { /* ... No changes needed ... */ if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball'); console.log(`Handling result for winning number: ${winningNumber}`); const winningColor = ROULETTE_COLORS[winningNumber]; if (rouletteResultDisplay) { rouletteResultDisplay.textContent = winningNumber.toString(); rouletteResultDisplay.className = 'roulette-result'; rouletteResultDisplay.classList.add(winningColor); } let totalWinnings = 0; let totalBetReturned = 0; placedBets.forEach(bet => { let payoutMultiplier = 0; let betWon = false; if (bet.type === 'single' && bet.value === winningNumber) { payoutMultiplier = ROULETTE_PAYOUTS.single; betWon = true; } else if (bet.type === 'red' && winningColor === 'red') { payoutMultiplier = ROULETTE_PAYOUTS.red; betWon = true; } else if (bet.type === 'black' && winningColor === 'black') { payoutMultiplier = ROULETTE_PAYOUTS.black; betWon = true; } else if (bet.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) { payoutMultiplier = ROULETTE_PAYOUTS.odd; betWon = true; } else if (bet.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) { payoutMultiplier = ROULETTE_PAYOUTS.even; betWon = true; } else if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) { payoutMultiplier = ROULETTE_PAYOUTS.low; betWon = true; } else if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) { payoutMultiplier = ROULETTE_PAYOUTS.high; betWon = true; } if (betWon) { const winningsForThisBet = bet.amount * payoutMultiplier; totalWinnings += winningsForThisBet; totalBetReturned += bet.amount; console.log(`Bet Won: Type=${bet.type}, Value=${bet.value}, Amount=${bet.amount}, Payout=${winningsForThisBet}`); } else { console.log(`Bet Lost: Type=${bet.type}, Value=${bet.value}, Amount=${bet.amount}`); } }); const totalReturn = totalWinnings + totalBetReturned; let statusMessage = ''; if (totalReturn > 0 && LocalBrokieAPI) { LocalBrokieAPI.updateBalance(totalReturn); statusMessage = `Win! Landed ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`; LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000); LocalBrokieAPI.playSound('win_long'); if (totalWinnings > 0) LocalBrokieAPI.addWin('Roulette', totalWinnings); } else { const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); statusMessage = `Lose. Landed ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`; if (LocalBrokieAPI) { LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000); LocalBrokieAPI.playSound('lose'); } } if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage; if (resetTimeoutId) clearTimeout(resetTimeoutId); resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY); }
    function endSpinCycle() { /* ... No changes needed ... */ console.log("Ending spin cycle, resetting..."); rouletteIsSpinning = false; resetRoulette(false); }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}