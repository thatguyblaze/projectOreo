// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.17 - Guided Ball Landing)
     *
     * - FIX: Implemented angle guidance during final spiral phase.
     * - Ball angle calculation now blends towards the target pocket angle.
     * - Aims for a more natural deceleration into the winning number.
     * - Final placement step remains for precision but should be minimal.
     * - Ball re-parents and sticks to wheel on landing.
     * ==========================================================================
     */

    // --- Constants ---
    const ROULETTE_NUMBERS = [
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
    const BALL_INITIAL_RADIUS_FACTOR = 0.9; // Relative to container radius initially
    const BALL_FINAL_RADIUS_FACTOR = 0.75; // Relative to WHEEL radius for final position
    const BALL_INITIAL_SPEED = -800; // Degrees per second (negative for counter-spin)
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3;
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7;
    const BALL_LANDING_SPIRAL_TIME = 1500; // Time for the spiral-in effect
    const BALL_ANGLE_GUIDANCE_START_TIME = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME; // Start guiding angle when spiral starts
    const BALL_ANGLE_GUIDANCE_DURATION = BALL_LANDING_SPIRAL_TIME; // Guide over the spiral duration
    const BALL_LANDING_TRANSITION_MS = 100; // Shorter transition now, just for final micro-adjustment if needed

    // --- State Variables ---
    // ... (no changes needed here) ...
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
    // ... (no changes needed here) ...
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall, rouletteWheelContainer;

    // --- API Reference ---
    let LocalBrokieAPI = null;

    /** Initializes the Roulette game. */
    function initRoulette(API) {
        // ... (no changes needed here) ...
        LocalBrokieAPI = API;
        rouletteWheelContainer = document.getElementById('roulette-wheel-container');
        rouletteWheel = document.getElementById('roulette-wheel');
        // ... (get other elements) ...
        rouletteBall = document.getElementById('roulette-ball');
        if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall /*...*/) { /* ... error handling ... */ return; }
        createRouletteBettingGrid();
        positionWheelNumbers();
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) { /* ... */ }
        resetRoulette(true);
        console.log("Roulette Initialized (v2.17 - Guided Ball Landing)"); // <-- Updated version
    }

    // --- Helper Functions ---
    function findPlacedBet(type, value) { /* ... */ }
    function updateButtonVisual(button, amount) { /* ... */ }
    function updateTotalBetDisplay() { /* ... */ }

    /** Shows the ball and starts its animation sequence. */
    function showBall(winningIndex) {
        // ... (no changes needed here) ...
        if (!rouletteBall || !rouletteWheelContainer) return;
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { /* ... */ return; }
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
        // ... (no changes needed here, already clears transition) ...
        if (ballAnimationId) { /* ... */ }
        if (rouletteBall) {
            rouletteBall.style.transition = 'none';
            rouletteBall.classList.remove('visible');
            const wheelElement = document.getElementById('roulette-wheel');
            const containerElement = document.getElementById('roulette-wheel-container');
            if (wheelElement && containerElement && rouletteBall.parentElement === wheelElement) {
                 try { /* ... move back to container ... */ } catch (e) { /* ... */ }
            }
        }
        ballLanded = false;
    }

    /** Starts the continuous CSS spin animation on the wheel */
    function startContinuousSpin() { /* ... */ }

    /** Gets the current visual rotation angle of the wheel from CSS */
    function getCurrentWheelRotationAngle() { /* ... */ }

    // --- NEW HELPER FUNCTIONS for Angle Guidance (v2.17) ---

    /**
     * Calculates the target screen angle (0=top, CW) for the center of a pocket.
     * @param {number} targetIndex - The index in ROULETTE_NUMBERS.
     * @param {number} currentWheelAngle - The current rotation angle of the wheel.
     * @returns {number} Target angle relative to the container/screen top (0-360).
     */
    function calculateTargetScreenAngle(targetIndex, currentWheelAngle) {
        // Angle of the number's center relative to the wheel's 0 degree point (top)
        const winningNumberBaseAngle = (targetIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
        // Add the wheel's current rotation to get the angle relative to the container's top
        let screenAngle = (currentWheelAngle + winningNumberBaseAngle) % 360;
        if (screenAngle < 0) screenAngle += 360; // Normalize
        return screenAngle;
    }

    /**
     * Interpolates between two angles along the shortest path.
     * @param {number} startAngle - Angle in degrees (0-360).
     * @param {number} endAngle - Angle in degrees (0-360).
     * @param {number} factor - Interpolation factor (0.0 to 1.0).
     * @returns {number} Interpolated angle in degrees (0-360).
     */
    function interpolateAngles(startAngle, endAngle, factor) {
        let difference = endAngle - startAngle;
        // Find the shortest path difference (-180 to 180)
        while (difference < -180) difference += 360;
        while (difference > 180) difference -= 360;
        // Interpolate along this shortest path
        let interpolated = startAngle + difference * factor;
        // Normalize the result to [0, 360)
        interpolated = (interpolated % 360 + 360) % 360;
        return interpolated;
    }

    // =========================================================================
    // vvvvvvvv   MODIFIED animateBall function (v2.17)   vvvvvvvv
    // =========================================================================
    /** The main ball animation loop with angle guidance. */
    function animateBall(timestamp) {
        // --- Initial checks ---
        if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0 || !ballStartTime) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }

        const elapsed = timestamp - ballStartTime;
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
        lastBallTimestamp = timestamp;

        // --- Animation physics: Speed and Radius ---
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelElapsed = elapsed - BALL_DECELERATION_START_TIME;
            const decelProgress = Math.min(1, decelElapsed / BALL_DECELERATION_TIME);
            const decelFactor = Math.max(0, 1 - decelProgress * decelProgress);
            currentSpeed *= decelFactor;
        }

        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME; // Same as ANGLE_GUIDANCE_START_TIME
        if (elapsed > spiralStartTime) {
            const spiralElapsed = elapsed - spiralStartTime;
            const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
            const easedProgress = spiralProgress < 0.5 ? 4 * spiralProgress * spiralProgress * spiralProgress : 1 - Math.pow(-2 * spiralProgress + 2, 3) / 2;
            currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedProgress;
        }
        ballRadius = containerRadius * currentRadiusFactor;


        // --- Angle Calculation with Guidance ---
        const physicsPredictedAngle = (ballAngle + (currentSpeed * deltaTime)); // Where physics alone would move it

        // Start guiding the angle during the spiral phase
        if (elapsed > BALL_ANGLE_GUIDANCE_START_TIME && targetWinningNumberIndex !== -1) {
            const guidanceElapsedTime = elapsed - BALL_ANGLE_GUIDANCE_START_TIME;
            // Blend factor increases as we approach the end time (using ease-in-out)
            let blendFactor = Math.min(1, guidanceElapsedTime / BALL_ANGLE_GUIDANCE_DURATION);
            blendFactor = blendFactor < 0.5 ? 2 * blendFactor * blendFactor : 1 - Math.pow(-2 * blendFactor + 2, 2) / 2; // Ease-in-out quadratic

            // Calculate the current target angle on screen
            const currentWheelAngle = getCurrentWheelRotationAngle();
            const targetScreenAngle = calculateTargetScreenAngle(targetWinningNumberIndex, currentWheelAngle);

            // Interpolate between the physics angle and the target angle
            ballAngle = interpolateAngles(physicsPredictedAngle, targetScreenAngle, blendFactor);

        } else {
             // Before guidance starts, just use physics prediction
             ballAngle = physicsPredictedAngle % 360;
        }
        // Normalize ballAngle
        if (ballAngle < 0) ballAngle += 360;


        // --- Landing Logic (Final Placement) ---
        if (elapsed >= BALL_ANIMATION_DURATION) {
            ballLanded = true;
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;

            // --- START: Final Placement (Re-parent FIRST, then tiny transition) ---
            const wheelElement = document.getElementById('roulette-wheel');
            if (!wheelElement) { /* ... error handling ... */ hideBall(); return; }
            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2;
            if (wheelRadius <= 0) { /* ... error handling ... */ hideBall(); return; }

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
                     try { rouletteBall.parentElement.removeChild(rouletteBall); } catch(e) { /* Ignore */ }
                 }
                 try {
                    // Set position roughly before adding to minimize visual jump during re-parent
                    // Use the last calculated screen position (x, y from previous frame's logic)
                    // Convert screen pos (relative to container) to wheel pos approx.
                     const lastScreenX = parseFloat(rouletteBall.style.left || '0');
                     const lastScreenY = parseFloat(rouletteBall.style.top || '0');
                     const wheelRect = wheelElement.getBoundingClientRect();
                     const containerRect = rouletteWheelContainer.getBoundingClientRect();
                     const initialX_inWheel = lastScreenX - (wheelRect.left - containerRect.left);
                     const initialY_inWheel = lastScreenY - (wheelRect.top - containerRect.top);
                     rouletteBall.style.left = `${initialX_inWheel.toFixed(2)}px`;
                     rouletteBall.style.top = `${initialY_inWheel.toFixed(2)}px`;

                     wheelElement.appendChild(rouletteBall);
                     console.log("Ball attached to wheel element (Pre-Final-Placement).");
                 } catch(e) { /* ... error handling ... */ return; }
            }

            // 3. Apply tiny transition for micro-adjustment, wait for next frame
            requestAnimationFrame(() => {
                rouletteBall.style.transition = `left ${BALL_LANDING_TRANSITION_MS}ms ease-out, top ${BALL_LANDING_TRANSITION_MS}ms ease-out`;
                // 4. Set the final precise target position
                rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
                rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
                rouletteBall.style.transform = 'translate(-50%, -50%)';
                // 5. Schedule removal of the transition
                setTimeout(() => {
                    if (rouletteBall) rouletteBall.style.transition = 'none';
                }, BALL_LANDING_TRANSITION_MS + 50);
            });
            // --- END: Final Placement ---

            console.log(`Ball visually locked onto wheel near Index: ${targetWinningNumberIndex}`);
            return; // Exit animateBall

        } else {
             // --- Ball is still flying: Position relative to CONTAINER ---
             rouletteBall.style.transition = 'none'; // Ensure no transition

             const currentRadians = (ballAngle - 90) * (Math.PI / 180);
             const x = containerRadius + ballRadius * Math.cos(currentRadians);
             const y = containerRadius + ballRadius * Math.sin(currentRadians);

             if(rouletteBall.parentElement !== rouletteWheelContainer) { /* ... safeguard ... */ }

             rouletteBall.style.left = `${x.toFixed(2)}px`;
             rouletteBall.style.top = `${y.toFixed(2)}px`;
             rouletteBall.style.transform = 'translate(-50%, -50%)';

             ballAnimationId = requestAnimationFrame(animateBall);
        }
    } // End of animateBall
    // =========================================================================
    // ^^^^^^^^   MODIFIED animateBall function (v2.17)   ^^^^^^^^
    // =========================================================================


    // --- Core Functions ---
    function createRouletteBettingGrid() { /* ... */ }
    function createBetButton(value, color, betType) { /* ... */ }
    function positionWheelNumbers() { /* ... */ }
    function setupRouletteEventListeners() { /* ... */ }
    function handleBetPlacement(event) { /* ... */ }
    function clearAllRouletteBets() { /* ... */ }
    function resetRoulette(forceVisualReset = false) { /* ... */ }
    let resizeTimeout; function onWindowResize() { /* ... */ }
    function spinWheel() { /* ... */ }
    function handleResult(winningNumber) { /* ... */ }
    function endSpinCycle() { /* ... */ }


// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}