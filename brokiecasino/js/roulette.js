// v2.14-landing-diag - Baseline v2.14 with Landing Diagnostics

// Helper function needed for diagnostic logging
function calculateTargetScreenAngle(targetIndex, currentWheelAngle) {
    const winningNumberBaseAngle = (targetIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
    let screenAngle = (currentWheelAngle + winningNumberBaseAngle) % 360;
    return (screenAngle < 0) ? screenAngle + 360 : screenAngle;
}


if (typeof initRoulette === 'undefined') {
    console.log("[ROULETTE_DIAG] Script Guard Check Passed - Loading Roulette Logic...");

    // --- Constants --- (Identical to v2.14)
    const ROULETTE_NUMBERS = [ /* ... */ ];
    const ROULETTE_COLORS = { /* ... */ };
    const ROULETTE_PAYOUTS = { /* ... */ };
    const TOTAL_NUMBERS = ROULETTE_NUMBERS.length;
    const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;
    const BALL_ANIMATION_DURATION = 4500;
    const POST_RESULT_DELAY = 2500;
    const BALL_INITIAL_RADIUS_FACTOR = 0.9;
    const BALL_FINAL_RADIUS_FACTOR = 0.75;
    const BALL_INITIAL_SPEED = -800;
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3;
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7;
    const BALL_LANDING_SPIRAL_TIME = 1500;

    // --- State Variables --- (Identical to v2.14)
    let rouletteIsSpinning = false; /*...*/

    // --- DOM Element References --- (Identical to v2.14)
    let rouletteWheel, /*...*/ rouletteBall, rouletteWheelContainer;

    // --- API Reference ---
    let LocalBrokieAPI = null;

    function initRoulette(API) {
        console.log("[ROULETTE_DIAG] initRoulette START");
        LocalBrokieAPI = API;
        try {
            // ... (Get elements - same as logged version) ...
            rouletteWheelContainer = document.getElementById('roulette-wheel-container');
            rouletteWheel = document.getElementById('roulette-wheel');
            // ... etc ...
            rouletteBall = document.getElementById('roulette-ball');

            if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall /* || ... other checks ... */ || !LocalBrokieAPI) {
                console.error("[ROULETTE_DIAG] Init failed: Missing elements/API."); return;
            }
             console.log("[ROULETTE_DIAG] Elements found.");
            // ... (Call setup funcs - same as logged version) ...
            createRouletteBettingGrid();
            positionWheelNumbers();
            setupRouletteEventListeners();
            if (LocalBrokieAPI.addBetAdjustmentListeners) { LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput); }
            resetRoulette(true);
            console.log("[ROULETTE_DIAG] Roulette Initialized (v2.14 - Landing Diagnostics)");

        } catch (error) { console.error("[ROULETTE_DIAG] FATAL ERROR during Init:", error); }
        console.log("[ROULETTE_DIAG] initRoulette END");
    }

    // --- Helper Functions --- (Identical to v2.14)
    function findPlacedBet(type, value) { /* ... */ }
    function updateButtonVisual(button, amount) { /* ... */ }
    function updateTotalBetDisplay() { /* ... */ }
    function showBall(winningIndex) { /* ... */ }
    function hideBall() { /* ... */ }
    function startContinuousSpin() { /* ... */ }
    function getCurrentWheelRotationAngle() { /* ... */ }

    function animateBall(timestamp) {
        if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
        let currentContainerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (currentContainerRadius <= 0 || !ballStartTime) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
        containerRadius = currentContainerRadius;

        const elapsed = timestamp - ballStartTime;
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
        lastBallTimestamp = timestamp;

        // Physics calculations (v2.14 logic)
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

        // Calculate current screen position based on physics BEFORE checking for landing
        const currentRadians = (ballAngle - 90) * (Math.PI / 180);
        const x_current = containerRadius + ballRadius * Math.cos(currentRadians);
        const y_current = containerRadius + ballRadius * Math.sin(currentRadians);

        // Landing Check & Logic (v2.14 structure + Diagnostics)
        if (elapsed >= BALL_ANIMATION_DURATION) {
            console.log("[ROULETTE_DIAG][LANDING] === Ball Landing Sequence Start ===");
            ballLanded = true;
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
            console.log("[ROULETTE_DIAG][LANDING] Animation frame cancelled.");

            // --- LOGGING: Position where animation naturally stopped ---
            const finalAnimatedAngle = ballAngle; // Capture angle just before override
            console.log(`[ROULETTE_DIAG][LANDING] Final Animated Screen Pos (x,y)=(${x_current.toFixed(1)}, ${y_current.toFixed(1)})`);
            console.log(`[ROULETTE_DIAG][LANDING] Final Animated Angle (Screen)=${finalAnimatedAngle.toFixed(1)}`);
            // --- END LOGGING ---

            const wheelElement = document.getElementById('roulette-wheel');
            if (!wheelElement) { console.error("[ROULETTE_DIAG][LANDING] ERROR: Wheel element missing!"); hideBall(); return; }

            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2;
            if (wheelRadius <= 0) { console.error("[ROULETTE_DIAG][LANDING] ERROR: Wheel radius zero!"); hideBall(); return; }

            const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
            if (targetWinningNumberIndex < 0 || targetWinningNumberIndex >= ROULETTE_NUMBERS.length) { console.error(`[ROULETTE_DIAG][LANDING] ERROR: Invalid target index ${targetWinningNumberIndex}`); hideBall(); return;}
            console.log(`[ROULETTE_DIAG][LANDING] Target Index=${targetWinningNumberIndex} (Number: ${ROULETTE_NUMBERS[targetWinningNumberIndex]})`);

            // Calculate the target position RELATIVE TO WHEEL where it *will* be placed
            const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2); // Angle relative to wheel top
            const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
            const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
            const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);
            console.log(`[ROULETTE_DIAG][LANDING] Target Coords Rel Wheel (Teleport Target)=(${finalX_relative.toFixed(1)}, ${finalY_relative.toFixed(1)})`);
            console.log(`[ROULETTE_DIAG][LANDING] Target Angle on Wheel=${winningNumberBaseAngle.toFixed(1)}`);

            // --- LOGGING: Compare final animated angle vs actual target angle ---
            const finalWheelAngle = getCurrentWheelRotationAngle();
            const actualTargetScreenAngle = calculateTargetScreenAngle(targetWinningNumberIndex, finalWheelAngle);
            let angleDifference = actualTargetScreenAngle - finalAnimatedAngle;
            while (angleDifference <= -180) angleDifference += 360;
            while (angleDifference > 180) angleDifference -= 360;
            console.log(`[ROULETTE_DIAG][LANDING] Wheel Angle at Land=${finalWheelAngle.toFixed(1)}`);
            console.log(`[ROULETTE_DIAG][LANDING] Target Screen Angle at Land=${actualTargetScreenAngle.toFixed(1)}`);
            console.log(`[ROULETTE_DIAG][LANDING] ===> Angle Difference (Jump Amount)=${angleDifference.toFixed(1)} degrees`);
            // --- END LOGGING ---


            // Execute the instantaneous placement and re-parenting (v2.14 logic)
            rouletteBall.style.transition = 'none';
            rouletteBall.style.position = 'absolute';
            rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
            rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
            rouletteBall.style.transform = 'translate(-50%, -50%)';
            console.log("[ROULETTE_DIAG][LANDING] Set final position styles.");

            if (rouletteBall.parentElement !== wheelElement) {
                 console.log("[ROULETTE_DIAG][LANDING] Ball needs re-parenting from", rouletteBall.parentElement?.id || 'null');
                 if (rouletteBall.parentElement) {
                     try{rouletteBall.parentElement.removeChild(rouletteBall);}catch(e){ console.error("[ROULETTE_DIAG][LANDING] removeChild failed", e);}
                 }
                 try {
                     wheelElement.appendChild(rouletteBall);
                     console.log("[ROULETTE_DIAG][LANDING] AppendChild successful.");
                 } catch(e) { console.error("[ROULETTE_DIAG][LANDING] ERROR: Failed attaching ball", e); }
            } else { console.log("[ROULETTE_DIAG][LANDING] Ball already child of wheel."); }
            console.log(`[ROULETTE_DIAG][LANDING] Final ball parent: ${rouletteBall.parentElement?.id || 'null'}`);
            console.log("[ROULETTE_DIAG][LANDING] === Ball Landing Sequence End ===");
            return; // Exit animateBall
        }

        // Positioning during flight
        rouletteBall.style.transition = 'none';
        rouletteBall.style.left = `${x_current.toFixed(2)}px`;
        rouletteBall.style.top = `${y_current.toFixed(2)}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        ballAnimationId = requestAnimationFrame(animateBall);
    }

    // --- Core Functions --- (Keep baseline versions)
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


} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}

// Ensure all functions like createRouletteBettingGrid, positionWheelNumbers etc. are copied correctly from the baseline v2.14.