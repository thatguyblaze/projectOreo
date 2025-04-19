// v2.14 (Baseline) with HEAVY LOGGING

// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {
    console.log("[ROULETTE_LOG] Script Guard Check Passed - Loading Roulette Logic...");

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
        console.log("[ROULETTE_LOG] initRoulette START");
        LocalBrokieAPI = API;
        try {
            console.log("[ROULETTE_LOG] Getting DOM elements...");
            rouletteWheelContainer = document.getElementById('roulette-wheel-container'); console.log(`[ROULETTE_LOG] rouletteWheelContainer found: ${!!rouletteWheelContainer}`);
            rouletteWheel = document.getElementById('roulette-wheel'); console.log(`[ROULETTE_LOG] rouletteWheel found: ${!!rouletteWheel}`);
            roulettePointer = document.getElementById('roulette-pointer'); console.log(`[ROULETTE_LOG] roulettePointer found: ${!!roulettePointer}`);
            rouletteResultDisplay = document.getElementById('roulette-result'); console.log(`[ROULETTE_LOG] rouletteResultDisplay found: ${!!rouletteResultDisplay}`);
            rouletteBetInput = document.getElementById('roulette-bet'); console.log(`[ROULETTE_LOG] rouletteBetInput found: ${!!rouletteBetInput}`);
            rouletteSpinButton = document.getElementById('roulette-spin-button'); console.log(`[ROULETTE_LOG] rouletteSpinButton found: ${!!rouletteSpinButton}`);
            rouletteStatusDisplay = document.getElementById('roulette-status'); console.log(`[ROULETTE_LOG] rouletteStatusDisplay found: ${!!rouletteStatusDisplay}`);
            rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets'); console.log(`[ROULETTE_LOG] rouletteInsideBetsContainer found: ${!!rouletteInsideBetsContainer}`);
            rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets'); console.log(`[ROULETTE_LOG] rouletteOutsideBetsContainer found: ${!!rouletteOutsideBetsContainer}`);
            rouletteCurrentBetDisplay = document.getElementById('roulette-current-bet-type'); console.log(`[ROULETTE_LOG] rouletteCurrentBetDisplay found: ${!!rouletteCurrentBetDisplay}`);
            clearBetsButton = document.getElementById('roulette-clear-bets-button'); console.log(`[ROULETTE_LOG] clearBetsButton found: ${!!clearBetsButton}`);
            rouletteBall = document.getElementById('roulette-ball'); console.log(`[ROULETTE_LOG] rouletteBall found: ${!!rouletteBall}`);

            if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !rouletteInsideBetsContainer || !LocalBrokieAPI) {
                console.error("[ROULETTE_LOG] Roulette init failed: Missing essential DOM elements or API during check.");
                const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none';
                return;
            }
            console.log("[ROULETTE_LOG] All essential elements found.");

            console.log("[ROULETTE_LOG] Calling createRouletteBettingGrid...");
            createRouletteBettingGrid();
            console.log("[ROULETTE_LOG] Calling positionWheelNumbers...");
            positionWheelNumbers();
            console.log("[ROULETTE_LOG] Calling setupRouletteEventListeners...");
            setupRouletteEventListeners();

            if (LocalBrokieAPI.addBetAdjustmentListeners) {
                console.log("[ROULETTE_LOG] Calling LocalBrokieAPI.addBetAdjustmentListeners...");
                LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
                 console.log("[ROULETTE_LOG] Finished LocalBrokieAPI.addBetAdjustmentListeners.");
            }

            console.log("[ROULETTE_LOG] Calling resetRoulette(true)...");
            resetRoulette(true);
            console.log("[ROULETTE_LOG] Roulette Initialized (v2.14 - LOGGING ADDED)");

        } catch (error) {
             console.error("[ROULETTE_LOG] FATAL ERROR during Roulette Initialization:", error);
             const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none';
        }
         console.log("[ROULETTE_LOG] initRoulette END");
    }

    // --- Helper Functions ---
    function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }
    function updateButtonVisual(button, amount) { if (!button) return; const originalValue = button.dataset.originalValue || button.textContent; if (!button.dataset.originalValue) button.dataset.originalValue = originalValue; if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); } else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); } }
    function updateTotalBetDisplay() { if (!rouletteCurrentBetDisplay) return; const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed'; }

    /** Shows the ball and starts its animation sequence. */
    function showBall(winningIndex) {
        console.log(`[ROULETTE_LOG] showBall START - winningIndex: ${winningIndex}`);
        if (!rouletteBall || !rouletteWheelContainer) { console.error("[ROULETTE_LOG] Cannot show ball: elements missing."); return; }
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        console.log(`[ROULETTE_LOG] showBall - Container Radius: ${containerRadius}`);
        if (containerRadius <= 0) { console.error("[ROULETTE_LOG] Cannot calculate container radius for ball."); return; }
        targetWinningNumberIndex = winningIndex;
        ballLanded = false;
        ballStartTime = performance.now();
        lastBallTimestamp = ballStartTime;
        ballStartAngle = Math.random() * 360;
        ballAngle = ballStartAngle;
        ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR;
        const initialRadians = (ballStartAngle - 90) * (Math.PI / 180);
        const initialX = containerRadius + ballRadius * Math.cos(initialRadians);
        const initialY = containerRadius + ballRadius * Math.sin(initialRadians);
        console.log("[ROULETTE_LOG] showBall - Calling hideBall before showing...");
        hideBall();
        rouletteBall.style.left = `${initialX.toFixed(2)}px`;
        rouletteBall.style.top = `${initialY.toFixed(2)}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        rouletteBall.classList.add('visible');
        console.log(`[ROULETTE_LOG] showBall - Ball made visible at (${initialX.toFixed(1)}, ${initialY.toFixed(1)})`);
        if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
        ballAnimationId = requestAnimationFrame(animateBall);
        console.log("[ROULETTE_LOG] showBall END - Ball animation started.");
    }

     /** Hides the ball and ensures it's returned to the container. */
    function hideBall() {
        // console.log("[ROULETTE_LOG] hideBall START"); // Can be noisy
        if (ballAnimationId) {
            // console.log("[ROULETTE_LOG] hideBall - Cancelling existing animation frame");
            cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
        }
        if (rouletteBall) {
            rouletteBall.style.transition = 'none'; // Ensure no transition lingers
            rouletteBall.classList.remove('visible');
            const wheelElement = document.getElementById('roulette-wheel');
            const containerElement = document.getElementById('roulette-wheel-container');
            if (wheelElement && containerElement && rouletteBall.parentElement === wheelElement) {
                try {
                    // console.log("[ROULETTE_LOG] hideBall - Moving ball from wheel to container");
                    wheelElement.removeChild(rouletteBall);
                    containerElement.appendChild(rouletteBall);
                } catch (e) { console.error("[ROULETTE_LOG] Error moving ball back to container:", e); }
            }
        }
        ballLanded = false;
        // console.log("[ROULETTE_LOG] hideBall END");
    }

    /** Starts the continuous CSS spin animation on the wheel */
    function startContinuousSpin() {
        console.log("[ROULETTE_LOG] startContinuousSpin START");
        if (!rouletteWheel) { console.warn("[ROULETTE_LOG] Cannot start spin, wheel element missing."); return; }
        try {
            rouletteWheel.style.transition = 'none';
            rouletteWheel.style.transform = '';
            if (!rouletteWheel.classList.contains('continuous-spin')) {
                rouletteWheel.classList.add('continuous-spin');
                console.log("[ROULETTE_LOG] Applied continuous-spin class.");
            } else {
                 console.log("[ROULETTE_LOG] continuous-spin class already present.");
            }
        } catch(error) {
            console.error("[ROULETTE_LOG] Error applying continuous spin:", error);
        }
         console.log("[ROULETTE_LOG] startContinuousSpin END");
    }

    /** Gets the current visual rotation angle of the wheel from CSS */
    function getCurrentWheelRotationAngle() {
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
        if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
        let currentContainerRadius = rouletteWheelContainer.offsetWidth / 2; // Use local
        if (currentContainerRadius <= 0 || !ballStartTime) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
        containerRadius = currentContainerRadius; // Update global

        const elapsed = timestamp - ballStartTime;
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
        lastBallTimestamp = timestamp;

        // --- Animation physics calculations (v2.14) ---
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const decelProgress = Math.min(1, decelElapsed / BALL_DECELERATION_TIME);
            const decelFactor = Math.max(0, 1 - decelProgress*decelProgress);
            currentSpeed *= decelFactor;
        }
        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
        if (elapsed > spiralStartTime) {
            const spiralElapsed = elapsed - spiralStartTime;
            const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
            const easedProgress = spiralProgress < 0.5 ? 4 * spiralProgress * spiralProgress * spiralProgress : 1 - Math.pow(-2 * spiralProgress + 2, 3) / 2;
            currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedProgress;
        }
        ballRadius = containerRadius * currentRadiusFactor;
        ballAngle = (ballAngle + (currentSpeed * deltaTime)) % 360;
        if (ballAngle < 0) ballAngle += 360;

        // --- Landing Logic (v2.14 - Instant Placement) ---
        if (elapsed >= BALL_ANIMATION_DURATION) {
            console.log("[ROULETTE_LOG][LANDING] === Ball Landing Sequence Start ===");
            ballLanded = true;
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
            console.log("[ROULETTE_LOG][LANDING] Animation frame cancelled.");

            const wheelElement = document.getElementById('roulette-wheel');
            if (!wheelElement) { console.error("[ROULETTE_LOG][LANDING] ERROR: Wheel element missing!"); hideBall(); return; }
            console.log("[ROULETTE_LOG][LANDING] Wheel element found.");

            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2;
            if (wheelRadius <= 0) { console.error("[ROULETTE_LOG][LANDING] ERROR: Wheel radius zero!"); hideBall(); return; }
            console.log(`[ROULETTE_LOG][LANDING] Wheel Radius=${wheelRadius.toFixed(1)}`);

            const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
            if (targetWinningNumberIndex < 0 || targetWinningNumberIndex >= ROULETTE_NUMBERS.length) {
                console.error(`[ROULETTE_LOG][LANDING] ERROR: Invalid target index ${targetWinningNumberIndex}`);
                hideBall(); return;
            }
            console.log(`[ROULETTE_LOG][LANDING] Target Index=${targetWinningNumberIndex} (Number: ${ROULETTE_NUMBERS[targetWinningNumberIndex]})`);

            const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
            const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
            const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
            const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);
            console.log(`[ROULETTE_LOG][LANDING] Calculated Target Coords Rel Wheel=(${finalX_relative.toFixed(1)}, ${finalY_relative.toFixed(1)})`);

            rouletteBall.style.transition = 'none';
            rouletteBall.style.position = 'absolute';
            rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
            rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
            rouletteBall.style.transform = 'translate(-50%, -50%)';
            console.log("[ROULETTE_LOG][LANDING] Set final position styles.");

            if (rouletteBall.parentElement !== wheelElement) {
                 console.log("[ROULETTE_LOG][LANDING] Ball needs re-parenting from", rouletteBall.parentElement?.id || 'null');
                 if (rouletteBall.parentElement) {
                     console.log("[ROULETTE_LOG][LANDING] Attempting removeChild...");
                     try{rouletteBall.parentElement.removeChild(rouletteBall);}catch(e){ console.error("[ROULETTE_LOG][LANDING] removeChild failed", e);}
                 }
                 try {
                     console.log("[ROULETTE_LOG][LANDING] Attempting appendChild to wheel...");
                     wheelElement.appendChild(rouletteBall);
                     console.log("[ROULETTE_LOG][LANDING] AppendChild successful.");
                 } catch(e) {
                     console.error("[ROULETTE_LOG][LANDING] ERROR: Failed attaching ball", e);
                 }
            } else {
                 console.log("[ROULETTE_LOG][LANDING] Ball already child of wheel.");
            }
            // Final check
            console.log(`[ROULETTE_LOG][LANDING] Final ball parent: ${rouletteBall.parentElement?.id || 'null'}`);
            console.log("[ROULETTE_LOG][LANDING] === Ball Landing Sequence End ===");
            return;
        } else {
             // --- Ball is still flying: Position relative to CONTAINER (v2.14) ---
             rouletteBall.style.transition = 'none';
             const currentRadians = (ballAngle - 90) * (Math.PI / 180);
             const x = containerRadius + ballRadius * Math.cos(currentRadians);
             const y = containerRadius + ballRadius * Math.sin(currentRadians);
             if(rouletteBall.parentElement !== rouletteWheelContainer) {
                // Minimal safeguard - log if parent is wrong during flight
                // console.warn(`[ROULETTE_LOG] Ball parent is wrong during flight: ${rouletteBall.parentElement?.id}`);
             }
             rouletteBall.style.left = `${x.toFixed(2)}px`;
             rouletteBall.style.top = `${y.toFixed(2)}px`;
             rouletteBall.style.transform = 'translate(-50%, -50%)';
             ballAnimationId = requestAnimationFrame(animateBall);
        }
    } // End of animateBall


    // --- Core Functions (v2.14) ---
    function createRouletteBettingGrid() {
        console.log("[ROULETTE_LOG] createRouletteBettingGrid START");
        if (!rouletteInsideBetsContainer) { console.error("[ROULETTE_LOG] createRouletteBettingGrid: Container not found!"); return; }
        try {
            // console.log("[ROULETTE_LOG] Clearing inside bets container.");
            rouletteInsideBetsContainer.innerHTML = '';
            const zeroButton = createBetButton(0, 'green', 'single');
            zeroButton.classList.add('col-span-3');
            rouletteInsideBetsContainer.appendChild(zeroButton);
            // console.log("[ROULETTE_LOG] Appended zero button.");
            for (let i = 1; i <= 36; i++) {
                const color = ROULETTE_COLORS[i];
                const button = createBetButton(i, color, 'single');
                rouletteInsideBetsContainer.appendChild(button);
            }
             // console.log("[ROULETTE_LOG] Finished appending number buttons.");
        } catch (error) {
            console.error("[ROULETTE_LOG] Error creating betting grid:", error);
        }
        // console.log("[ROULETTE_LOG] createRouletteBettingGrid END");
    }
    function createBetButton(value, color, betType) { const button = document.createElement('button'); button.classList.add('roulette-bet-btn'); if (color) button.classList.add(color); button.textContent = value.toString(); button.dataset.betType = betType; button.dataset.betValue = value.toString(); button.dataset.originalValue = value.toString(); return button; }
    function positionWheelNumbers() {
        // console.log("[ROULETTE_LOG] positionWheelNumbers START");
        const wheel = document.getElementById('roulette-wheel');
        if (!wheel) { console.error("[ROULETTE_LOG] positionWheelNumbers: Wheel element missing."); return; }
        requestAnimationFrame(() => {
            // console.log("[ROULETTE_LOG] positionWheelNumbers - requestAnimationFrame callback START");
            try {
                const wheelDiameter = wheel.offsetWidth;
                // console.log(`[ROULETTE_LOG] Wheel diameter: ${wheelDiameter}`);
                if (wheelDiameter <= 0) { setTimeout(positionWheelNumbers, 100); return; }
                const wheelRadius = wheelDiameter / 2;
                const numberRingRadiusFactor = 0.88;
                const numberRingRadius = wheelRadius * numberRingRadiusFactor;
                wheel.innerHTML = '';
                ROULETTE_NUMBERS.forEach((num, index) => {
                    const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2);
                    const calculationAngleRadians = (angleDegrees - 90) * (Math.PI / 180);
                    const numberSpan = document.createElement('span');
                    numberSpan.textContent = num.toString();
                    numberSpan.classList.add('roulette-number', `num-${num}`, ROULETTE_COLORS[num]);
                    const x = wheelRadius + numberRingRadius * Math.cos(calculationAngleRadians);
                    const y = wheelRadius + numberRingRadius * Math.sin(calculationAngleRadians);
                    numberSpan.style.position = 'absolute';
                    numberSpan.style.left = `${x.toFixed(2)}px`;
                    numberSpan.style.top = `${y.toFixed(2)}px`;
                    numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees}deg)`;
                    wheel.appendChild(numberSpan);
                });
            } catch (e) { console.error("[ROULETTE_LOG] Error in positionWheelNumbers execution:", e); }
            // console.log("[ROULETTE_LOG] positionWheelNumbers - requestAnimationFrame callback END");
        });
        // console.log("[ROULETTE_LOG] positionWheelNumbers END (after requesting frame)");
    }
    function setupRouletteEventListeners() {
        // console.log("[ROULETTE_LOG] setupRouletteEventListeners START");
         try { if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel); if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets); window.addEventListener('resize', onWindowResize); } catch(e) { console.error("[ROULETTE_LOG] Error in setupRouletteEventListeners", e); }
        // console.log("[ROULETTE_LOG] setupRouletteEventListeners END");
     }
    function handleBetPlacement(event) { if (rouletteIsSpinning) return; const targetButton = event.target.closest('.roulette-bet-btn'); if (!targetButton) return; const amountToAdd = parseInt(rouletteBetInput.value); if (isNaN(amountToAdd) || amountToAdd < 1){ LocalBrokieAPI?.showMessage("Invalid bet amount.", 1500); return; } if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()){ LocalBrokieAPI?.showMessage("Insufficient balance.", 1500); return;} if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); const betType = targetButton.dataset.betType; const betValue = targetButton.dataset.betValue; let existingBet = findPlacedBet(betType, betValue); if (existingBet) { existingBet.amount += amountToAdd; } else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); } updateButtonVisual(targetButton, existingBet.amount); updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = false; if (clearBetsButton) clearBetsButton.disabled = false; }
    function clearAllRouletteBets() { if (rouletteIsSpinning) return; if (placedBets.length === 0) return; if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets'); placedBets.forEach(bet => { if (bet.buttonElement) updateButtonVisual(bet.buttonElement, 0); }); placedBets = []; updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!'; }
    function resetRoulette(forceVisualReset = false) {
        console.log(`[ROULETTE_LOG] resetRoulette START (forceVisualReset=${forceVisualReset})`);
         try {
             rouletteIsSpinning = false;
             if (handleResultTimeoutId) { clearTimeout(handleResultTimeoutId); handleResultTimeoutId = null; }
             if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; }
             clearAllRouletteBets();
             if (rouletteResultDisplay) { rouletteResultDisplay.textContent = '?'; rouletteResultDisplay.className = 'roulette-result'; }
             if (rouletteStatusDisplay && !rouletteStatusDisplay.textContent.includes('Bets cleared')) { rouletteStatusDisplay.textContent = 'Place your bet!'; }
             updateTotalBetDisplay();
             console.log("[ROULETTE_LOG] resetRoulette - Calling hideBall...");
             hideBall();
             if (forceVisualReset && rouletteWheel) {
                 console.log("[ROULETTE_LOG] resetRoulette - Calling positionWheelNumbers...");
                 positionWheelNumbers();
             }
             if (rouletteWheel) {
                 console.log("[ROULETTE_LOG] resetRoulette - Calling startContinuousSpin...");
                 startContinuousSpin();
             }
             if (rouletteBetInput) rouletteBetInput.disabled = false;
             if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
             if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
             if (rouletteSpinButton) rouletteSpinButton.disabled = (placedBets.length === 0);
             if (clearBetsButton) clearBetsButton.disabled = (placedBets.length === 0);
        } catch(e) { console.error("[ROULETTE_LOG] Error in resetRoulette", e); }
        console.log("[ROULETTE_LOG] resetRoulette END");
     }
    let resizeTimeout; function onWindowResize() { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { if (rouletteWheel) { positionWheelNumbers(); } if (rouletteBall && rouletteBall.classList.contains('visible') && !ballLanded && rouletteWheelContainer) { containerRadius = rouletteWheelContainer.offsetWidth / 2; } }, 250); }
    function spinWheel() {
        console.log("[ROULETTE_LOG] spinWheel START");
        if (rouletteIsSpinning) { console.warn("[ROULETTE_LOG] Spin already in progress."); return; }
        if (placedBets.length === 0) { LocalBrokieAPI?.showMessage("Place a bet first!", 1500); return; }
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (isNaN(totalBetAmount) || totalBetAmount < 1) { console.error("[ROULETTE_LOG] Invalid total bet amount."); return; }
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) { LocalBrokieAPI?.showMessage("Insufficient balance for total bet.", 1500); return; }
        console.log("[ROULETTE_LOG] Starting spin and ball animation sequence...");
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) { LocalBrokieAPI.updateBalance(-totalBetAmount); LocalBrokieAPI.playSound('roulette_spin'); }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Ball rolling... No more bets!';
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteBetInput) rouletteBetInput.disabled = true;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        console.log(`[ROULETTE_LOG] Calculated winning number: ${winningNumber} (Index: ${winningNumberIndex})`);
        showBall(winningNumberIndex);
        if (handleResultTimeoutId) clearTimeout(handleResultTimeoutId);
        handleResultTimeoutId = setTimeout(() => {
            console.log("[ROULETTE_LOG] Ball animation duration ended, calling handleResult...");
            handleResult(winningNumber);
            }, BALL_ANIMATION_DURATION);
        console.log("[ROULETTE_LOG] spinWheel END");
     }
    function handleResult(winningNumber) {
        console.log("[ROULETTE_LOG] handleResult START");
        try {
            if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');
            console.log(`[ROULETTE_LOG] Handling result for winning number: ${winningNumber}`);
            const winningColor = ROULETTE_COLORS[winningNumber];
            if (rouletteResultDisplay) { rouletteResultDisplay.textContent = winningNumber.toString(); rouletteResultDisplay.className = 'roulette-result'; rouletteResultDisplay.classList.add(winningColor); }
            let totalWinnings = 0; let totalBetReturned = 0;
            placedBets.forEach(bet => { /* ... payout calc ... */ });
            const totalReturn = totalWinnings + totalBetReturned; let statusMessage = '';
            if (totalReturn > 0 && LocalBrokieAPI) { /* ... win msg ... */ } else { /* ... lose msg ... */ }
            if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;
            if (resetTimeoutId) clearTimeout(resetTimeoutId);
            console.log("[ROULETTE_LOG] handleResult - Setting timeout for endSpinCycle...");
            resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
        } catch(e) { console.error("[ROULETTE_LOG] Error in handleResult", e); }
        console.log("[ROULETTE_LOG] handleResult END");
    }
    function endSpinCycle() {
        console.log("[ROULETTE_LOG] endSpinCycle START");
        rouletteIsSpinning = false;
        resetRoulette(false);
        console.log("[ROULETTE_LOG] endSpinCycle END");
    }


// End of the guard block
} else {
    console.warn("[ROULETTE_LOG] Roulette script already loaded. Skipping re-initialization.");
}