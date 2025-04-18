// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.18 - Reverted Guidance, Simplified Landing)
     *
     * - Reverted angle guidance logic from v2.17 (potential error source).
     * - Simplified the re-parenting step during landing (removed getBoundingClientRect).
     * - Retained "Re-parent first, then transition" structure.
     * - Added more element checks within animateBall.
     * - Aims to restore basic functionality (numbers, buttons, spin).
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
    const BALL_INITIAL_RADIUS_FACTOR = 0.9;
    const BALL_FINAL_RADIUS_FACTOR = 0.75;
    const BALL_INITIAL_SPEED = -800;
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3;
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7;
    const BALL_LANDING_SPIRAL_TIME = 1500;
    const BALL_LANDING_TRANSITION_MS = 250; // Keep a moderate transition time

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
        try { // Add try-catch around initialization
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
            if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !rouletteInsideBetsContainer || !LocalBrokieAPI) {
                console.error("Roulette init failed: Missing essential DOM elements or API.");
                const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none';
                return;
            }
            // Setup UI...
            console.log("Creating betting grid...");
            createRouletteBettingGrid();
            console.log("Positioning wheel numbers...");
            positionWheelNumbers(); // Position numbers first
            console.log("Setting up listeners...");
            setupRouletteEventListeners();
            if (LocalBrokieAPI.addBetAdjustmentListeners) { LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput); }
            // Initial Reset...
            console.log("Performing initial reset...");
            resetRoulette(true); // Pass true for initial setup visual reset
            console.log("Roulette Initialized (v2.18 - Reverted Guidance)"); // <-- Updated version
        } catch (error) {
            console.error("FATAL ERROR during Roulette Initialization:", error);
            // Optionally hide the whole game tab if init fails badly
            const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none';
        }
    }

    // --- Helper Functions ---
    function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }
    function updateButtonVisual(button, amount) { /* ... */ } // (Keep implementation)
    function updateTotalBetDisplay() { /* ... */ } // (Keep implementation)

    /** Shows the ball and starts its animation sequence. */
    function showBall(winningIndex) {
        if (!rouletteBall || !rouletteWheelContainer) { console.error("Cannot show ball: elements missing."); return; }
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { console.warn("Container radius zero in showBall."); } // Warn instead of error
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
        hideBall();
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
        if (ballAnimationId) { cancelAnimationFrame(ballAnimationId); ballAnimationId = null; }
        if (rouletteBall) {
            rouletteBall.style.transition = 'none';
            rouletteBall.classList.remove('visible');
            const wheelElement = document.getElementById('roulette-wheel');
            const containerElement = document.getElementById('roulette-wheel-container');
            if (wheelElement && containerElement && rouletteBall.parentElement === wheelElement) {
                try {
                    wheelElement.removeChild(rouletteBall);
                    containerElement.appendChild(rouletteBall);
                } catch (e) { console.error("Error moving ball back to container:", e); /* attempt recovery */ }
            }
        }
        ballLanded = false;
    }

    /** Starts the continuous CSS spin animation on the wheel */
    function startContinuousSpin() {
        if (!rouletteWheel) { console.warn("Cannot start spin, wheel element missing."); return; }
        try { // Add try-catch for safety
            rouletteWheel.style.transition = 'none';
            rouletteWheel.style.transform = '';
            if (!rouletteWheel.classList.contains('continuous-spin')) {
                rouletteWheel.classList.add('continuous-spin');
                console.log("Applied continuous-spin class.");
            }
        } catch(error) {
            console.error("Error applying continuous spin:", error);
        }
    }

    /** Gets the current visual rotation angle of the wheel from CSS */
    function getCurrentWheelRotationAngle() {
        // Added check for rouletteWheel inside
        if (!rouletteWheel) { return 0; }
        try {
            const currentTransform = getComputedStyle(rouletteWheel).transform;
            // ... (rest of the function remains the same) ...
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

    // --- REMOVED HELPER FUNCTIONS from v2.17 ---
    // function calculateTargetScreenAngle(...) { ... } // REMOVED
    // function interpolateAngles(...) { ... } // REMOVED

    // =========================================================================
    // vvvvvvvv   MODIFIED animateBall function (v2.18)   vvvvvvvv
    // =========================================================================
    /** The main ball animation loop (Angle Guidance Removed). */
    function animateBall(timestamp) {
        // --- Initial checks & Element verification ---
        if (ballLanded) { return; } // Exit if already landed
        if (!rouletteBall || !rouletteWheelContainer || !rouletteWheel) {
            console.error("animateBall: Critical element missing.");
            if(ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
            hideBall(); // Attempt to cleanup
            return;
        }
        // Ensure container radius is valid
        let currentContainerRadius = rouletteWheelContainer.offsetWidth / 2; // Use local var
        if (currentContainerRadius <= 0 || !ballStartTime) {
             // Don't stop animation, maybe it resizes later, log warning
             console.warn("animateBall: Invalid container radius or start time.");
             // Request next frame anyway, hoping it recovers
             if(ballAnimationId) requestAnimationFrame(animateBall);
             return;
        }
        // Update global containerRadius only if valid
        containerRadius = currentContainerRadius;


        const elapsed = timestamp - ballStartTime;
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
        lastBallTimestamp = timestamp;

        // --- Animation physics: Speed and Radius ---
        // ... (Physics calculations remain the same as v2.17) ...
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const decelProgress = Math.min(1, decelElapsed / BALL_DECELERATION_TIME);
            const decelFactor = Math.max(0, 1 - decelProgress * decelProgress);
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

        // --- Angle Calculation (Reverted to pure physics) ---
        const physicsPredictedAngle = (ballAngle + (currentSpeed * deltaTime));
        ballAngle = (physicsPredictedAngle % 360 + 360) % 360; // Normalize to [0, 360)

        // --- Landing Logic (Final Placement) ---
        if (elapsed >= BALL_ANIMATION_DURATION) {
            ballLanded = true;
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;

            // --- START: Simplified Re-parent FIRST, then Transition (v2.18) ---
            const wheelElement = document.getElementById('roulette-wheel'); // Re-check just in case
            if (!wheelElement) { console.error("Wheel element missing for landing."); hideBall(); return; }

            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2;
            if (wheelRadius <= 0) { console.error("Wheel radius zero for landing."); hideBall(); return; }

            // 1. Calculate final target position relative to the wheel (precision step)
            const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
            const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
            const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
            const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
            const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);

            // 2. Re-parent the ball to the wheel immediately
            rouletteBall.style.position = 'absolute';
            rouletteBall.style.transition = 'none';
            if (rouletteBall.parentElement !== wheelElement) {
                 if (rouletteBall.parentElement) {
                     try {
                         rouletteBall.parentElement.removeChild(rouletteBall);
                         wheelElement.appendChild(rouletteBall); // Append without setting complex initial pos
                         console.log("Ball attached to wheel element (Pre-Transition).");
                     } catch(e) {
                         console.error("Could not attach ball to wheel element", e);
                         rouletteBall.classList.remove('visible');
                         return; // Stop if we can't re-parent
                     }
                 } else { /* Should not happen if hideBall works */ }
            }

            // 3. Apply the smooth transition *after* re-parenting, in the next frame
            requestAnimationFrame(() => {
                if (!rouletteBall) return; // Check ball exists before styling
                // Apply transition style
                rouletteBall.style.transition = `left ${BALL_LANDING_TRANSITION_MS}ms ease-out, top ${BALL_LANDING_TRANSITION_MS}ms ease-out`;
                // 4. Set the final precise target position
                rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
                rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
                rouletteBall.style.transform = 'translate(-50%, -50%)';
                // 5. Schedule removal of the transition style
                setTimeout(() => {
                    if (rouletteBall) rouletteBall.style.transition = 'none';
                }, BALL_LANDING_TRANSITION_MS + 50);
            });
            // --- END: Simplified Landing ---

            console.log(`Ball visually locked onto wheel near Index: ${targetWinningNumberIndex}`);
            return; // Exit animateBall

        } else {
             // --- Ball is still flying: Position relative to CONTAINER ---
             rouletteBall.style.transition = 'none'; // Ensure no transition
             const currentRadians = (ballAngle - 90) * (Math.PI / 180);
             const x = containerRadius + ballRadius * Math.cos(currentRadians);
             const y = containerRadius + ballRadius * Math.sin(currentRadians);
             if(rouletteBall.parentElement !== rouletteWheelContainer) { /* Safeguard */ }
             rouletteBall.style.left = `${x.toFixed(2)}px`;
             rouletteBall.style.top = `${y.toFixed(2)}px`;
             rouletteBall.style.transform = 'translate(-50%, -50%)';
             ballAnimationId = requestAnimationFrame(animateBall);
        }
    } // End of animateBall
    // =========================================================================
    // ^^^^^^^^   MODIFIED animateBall function (v2.18)   ^^^^^^^^
    // =========================================================================

    // --- Core Functions ---
    function createRouletteBettingGrid() {
        if (!rouletteInsideBetsContainer) { console.error("createRouletteBettingGrid: Container not found!"); return; }
        try {
            rouletteInsideBetsContainer.innerHTML = '';
            const zeroButton = createBetButton(0, 'green', 'single');
            zeroButton.classList.add('col-span-3'); // Specific style for zero
            rouletteInsideBetsContainer.appendChild(zeroButton);
            for (let i = 1; i <= 36; i++) {
                const color = ROULETTE_COLORS[i];
                const button = createBetButton(i, color, 'single');
                rouletteInsideBetsContainer.appendChild(button);
            }
        } catch (error) {
            console.error("Error creating betting grid:", error);
        }
    }
    function createBetButton(value, color, betType) { /* ... */ } // (Keep implementation)
    function positionWheelNumbers() {
        const wheel = document.getElementById('roulette-wheel');
        if (!wheel) { console.error("positionWheelNumbers: Wheel element missing."); return; }
        requestAnimationFrame(() => {
            try { // Add try-catch
                const wheelDiameter = wheel.offsetWidth;
                if (wheelDiameter <= 0) { setTimeout(positionWheelNumbers, 100); return; }
                const wheelRadius = wheelDiameter / 2;
                const numberRingRadiusFactor = 0.88;
                const numberRingRadius = wheelRadius * numberRingRadiusFactor;
                //console.log(`Positioning Numbers - Wheel Radius: ${wheelRadius.toFixed(2)}, Number Ring Radius: ${numberRingRadius.toFixed(2)}`);
                wheel.innerHTML = ''; // Clear first
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
                //console.log("Positioned numbers relative to wheel center.");
            } catch (error) {
                console.error("Error positioning wheel numbers:", error);
            }
        });
    }
    function setupRouletteEventListeners() { /* ... */ } // (Keep implementation)
    function handleBetPlacement(event) { /* ... */ } // (Keep implementation)
    function clearAllRouletteBets() { /* ... */ } // (Keep implementation)
    function resetRoulette(forceVisualReset = false) { /* ... */ } // (Keep implementation)
    let resizeTimeout; function onWindowResize() { /* ... */ } // (Keep implementation)
    function spinWheel() { /* ... */ } // (Keep implementation)
    function handleResult(winningNumber) { /* ... */ } // (Keep implementation)
    function endSpinCycle() { /* ... */ } // (Keep implementation)

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}