// Check if the main function is already defined
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.14 - Fixed Ball Landing/Sticking)
     *
     * - FIX: Ball now re-parents to the wheel element upon landing.
     * - FIX: Ball position calculated relative to wheel center for final placement.
     * - FIX: hideBall now returns the ball to the container element.
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
        console.log("Roulette Initialized (v2.14 - Fixed Ball Landing/Sticking)");
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

        // Ensure ball is in the container before starting animation
        hideBall(); // Call hideBall to ensure it's detached from wheel if needed

        rouletteBall.style.left = `${initialX.toFixed(2)}px`;
        rouletteBall.style.top = `${initialY.toFixed(2)}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        rouletteBall.classList.add('visible');

        if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
        ballAnimationId = requestAnimationFrame(animateBall);
        console.log("Ball animation started.");
    }

     /** Hides the ball and ensures it's returned to the container. */
    function hideBall() {
        if (ballAnimationId) {
            cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
        }
        if (rouletteBall) {
            rouletteBall.classList.remove('visible');

            // --- START: Ensure ball is back in the container ---
            const wheelElement = document.getElementById('roulette-wheel');
            const containerElement = document.getElementById('roulette-wheel-container');

            // Check if the ball is currently a child of the wheel
            if (wheelElement && containerElement && rouletteBall.parentElement === wheelElement) {
                 // Try to move it back to the container
                 try {
                      wheelElement.removeChild(rouletteBall);
                      containerElement.appendChild(rouletteBall);
                      console.log("Ball moved back to container from wheel.");
                 } catch (e) {
                      console.error("Error moving ball back to container:", e);
                      // Fallback: just ensure it's removed from wheel if container add fails
                      if (rouletteBall.parentElement === wheelElement) {
                           try { wheelElement.removeChild(rouletteBall); } catch (removeError) { /* Ignore */ }
                      }
                 }
            }
            // --- END: Ensure ball is back in the container ---
        }
        ballLanded = false; // Reset landed state for next spin
    }

    /** Starts the continuous CSS spin animation on the wheel */
    function startContinuousSpin() {
        if (!rouletteWheel) return;
        rouletteWheel.style.transition = 'none'; // Remove any JS transition
        rouletteWheel.style.transform = ''; // Clear any JS transform
        // Ensure the class is applied (or re-applied if removed)
        if (!rouletteWheel.classList.contains('continuous-spin')) {
            rouletteWheel.classList.add('continuous-spin');
            console.log("Applied continuous-spin class.");
        }
    }

    /** Gets the current visual rotation angle of the wheel from CSS */
    function getCurrentWheelRotationAngle() {
        if (!rouletteWheel) return 0;
        try {
            const currentTransform = getComputedStyle(rouletteWheel).transform;
            if (currentTransform === 'none') return 0;
            // Extracts rotation angle from matrix(a, b, c, d, e, f)
            const matrixValues = currentTransform.match(/matrix.*\((.+)\)/);
            if (matrixValues && matrixValues[1]) {
                const matrix = matrixValues[1].split(', ').map(parseFloat);
                // angle = atan2(b, a)
                const angleRad = Math.atan2(matrix[1], matrix[0]);
                let angleDeg = angleRad * (180 / Math.PI);
                // Normalize to 0-360
                return (angleDeg < 0) ? angleDeg + 360 : angleDeg;
            }
        } catch (e) {
            console.error("Error getting wheel rotation:", e);
        }
        return 0; // Default fallback
    }

    /** The main ball animation loop. */
    function animateBall(timestamp) {
        // --- Initial checks ---
        // Check if landed state was set externally or container vanished
        if (ballLanded || !rouletteBall || !rouletteWheelContainer) {
            if(ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;
            return;
        }
         // Recalculate containerRadius in case of resize during animation
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0 || !ballStartTime) { // Need radius and start time
             if(ballAnimationId) cancelAnimationFrame(ballAnimationId);
             ballAnimationId = null;
             return;
         }

        const elapsed = timestamp - ballStartTime;
        // Use a safety check for deltaTime, especially if tab loses focus
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000)); // Clamp delta time
        lastBallTimestamp = timestamp;

        // --- Animation physics calculations ---
        let currentSpeed = BALL_INITIAL_SPEED;
        if (elapsed > BALL_DECELERATION_START_TIME) {
            const decelElapsed = elapsed - BALL_DECELERATION_START_TIME;
            // Use a smoother deceleration (e.g., quadratic ease-out)
            const decelProgress = Math.min(1, decelElapsed / BALL_DECELERATION_TIME);
            const decelFactor = Math.max(0, 1 - decelProgress*decelProgress); // Quadratic fade
            currentSpeed *= decelFactor;
        }

        let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
        const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
        if (elapsed > spiralStartTime) {
            const spiralElapsed = elapsed - spiralStartTime;
            const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
            // Ease-out cubic for smoother spiral inward: progress^3
            //const easedProgress = 1 - Math.pow(1 - spiralProgress, 3);
            // Ease-in-out cubic can also look good:
            const easedProgress = spiralProgress < 0.5 ? 4 * spiralProgress * spiralProgress * spiralProgress : 1 - Math.pow(-2 * spiralProgress + 2, 3) / 2;
            currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedProgress;
        }
        // Ball radius relative to CONTAINER during flight
        ballRadius = containerRadius * currentRadiusFactor;

        // Update ball angle based on speed
        ballAngle = (ballAngle + (currentSpeed * deltaTime)) % 360;
        if (ballAngle < 0) ballAngle += 360;

        // --- Landing Logic ---
        if (elapsed >= BALL_ANIMATION_DURATION) {
            ballLanded = true;
            // Stop the animation loop FIRST
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;

            // --- START: New Logic for Sticking Ball to Wheel ---
            const wheelElement = document.getElementById('roulette-wheel'); // Get wheel element
            if (!wheelElement) {
                console.error("Cannot find wheel element for final ball placement.");
                hideBall(); // Hide if wheel is gone
                return; // Exit function
            }

            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2; // Use WHEEL's radius

            if (wheelRadius <= 0) {
                console.error("Wheel radius is zero, cannot place ball accurately.");
                 hideBall(); // Hide if placement impossible
                 return; // Exit function
            }

            // Use the final radius factor relative to the WHEEL radius now
            const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;

            // Calculate the target angle ON THE WHEEL (0 deg = top, positive CW)
            // This angle is static relative to the wheel's numbers/layout
            const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);

            // Convert this wheel angle to radians for trig calculation
            // Use the same -90 offset as positionWheelNumbers to align coordinate systems
            const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);

            // Calculate final position relative to the WHEEL'S top-left corner (0,0)
            // wheelRadius = center X, wheelRadius = center Y
            const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
            const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);

            // Apply styles for position WITHIN the wheel
            rouletteBall.style.position = 'absolute'; // Ensure it's absolute positioned
            rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
            rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
            rouletteBall.style.transform = 'translate(-50%, -50%)'; // Keep centering the ball element itself

            // Re-parent the ball: Move it from container to wheel
            if (rouletteBall.parentElement !== wheelElement) {
                 if (rouletteBall.parentElement) {
                     // Remove from old parent (should be container)
                     try { rouletteBall.parentElement.removeChild(rouletteBall); } catch(e) { console.warn("Could not remove ball from previous parent", e); }
                 }
                 // Add to new parent (wheel)
                 try {
                    wheelElement.appendChild(rouletteBall);
                    console.log("Ball attached to wheel element.");
                 } catch(e) {
                    console.error("Could not attach ball to wheel element", e);
                    // If append fails, at least hide it
                    rouletteBall.classList.remove('visible');
                 }
            }
            // --- END: New Logic for Sticking Ball to Wheel ---

            console.log(`Ball visually locked onto wheel at Number Index: ${targetWinningNumberIndex}, Wheel Angle: ${winningNumberBaseAngle.toFixed(2)}`);

            // The handleResult timeout should still be running separately to process payout etc.
            // Exit the animateBall function here, as the ball is now positioned and parented correctly.
            return;

        } else {
             // --- Ball is still flying: Position relative to CONTAINER ---
             const currentRadians = (ballAngle - 90) * (Math.PI / 180); // For cos/sin
             const x = containerRadius + ballRadius * Math.cos(currentRadians); // Relative to container center
             const y = containerRadius + ballRadius * Math.sin(currentRadians); // Relative to container center

             // Ensure ball is positioned within the container during flight
             if(rouletteBall.parentElement !== rouletteWheelContainer) {
                 // This case shouldn't happen if hideBall works correctly, but as a safeguard:
                 console.warn("Ball parent incorrect during flight, attempting correction.");
                 if(rouletteBall.parentElement) rouletteBall.parentElement.removeChild(rouletteBall);
                 rouletteWheelContainer.appendChild(rouletteBall);
             }

             rouletteBall.style.left = `${x.toFixed(2)}px`;
             rouletteBall.style.top = `${y.toFixed(2)}px`;
             rouletteBall.style.transform = 'translate(-50%, -50%)'; // Keep centering

             // Continue animation ONLY if not landed
             ballAnimationId = requestAnimationFrame(animateBall);
        }
    } // End of animateBall

    // --- Core Functions ---
    function createRouletteBettingGrid() { /* ... No changes needed ... */ if (!rouletteInsideBetsContainer) { console.error("Roulette Inside Bets container not found!"); return; } rouletteInsideBetsContainer.innerHTML = ''; const zeroButton = createBetButton(0, 'green', 'single'); zeroButton.classList.add('col-span-3'); rouletteInsideBetsContainer.appendChild(zeroButton); for (let i = 1; i <= 36; i++) { const color = ROULETTE_COLORS[i]; const button = createBetButton(i, color, 'single'); rouletteInsideBetsContainer.appendChild(button); } }
    function createBetButton(value, color, betType) { /* ... No changes needed ... */ const button = document.createElement('button'); button.classList.add('roulette-bet-btn'); if (color) button.classList.add(color); button.textContent = value.toString(); button.dataset.betType = betType; button.dataset.betValue = value.toString(); button.dataset.originalValue = value.toString(); return button; }

    /** Positions numbers ON the spinning wheel with clock-face orientation. */
    function positionWheelNumbers() {
        // Ensure wheel element exists
        const wheel = document.getElementById('roulette-wheel');
        if (!wheel) { console.error("Wheel element missing for number positioning."); return; }

        // Use requestAnimationFrame to ensure layout is stable
        requestAnimationFrame(() => {
            // Use wheel's actual dimensions for calculations
            const wheelDiameter = wheel.offsetWidth;
            // If dimensions aren't ready, retry shortly
            if (wheelDiameter <= 0) {
                console.warn("Wheel diameter is 0, retrying number positioning...");
                setTimeout(positionWheelNumbers, 100); // Wait 100ms and try again
                return;
            }
            const wheelRadius = wheelDiameter / 2; // Radius of the spinning element

            // --- Adjust numberRingRadius based on wheelRadius ---
            // Factor determines how close to the edge numbers are placed (0.75=inner, 0.9=outer)
            const numberRingRadiusFactor = 0.88; // Fine-tune this visually
            const numberRingRadius = wheelRadius * numberRingRadiusFactor;

            console.log(`Positioning Numbers - Wheel Radius: ${wheelRadius.toFixed(2)}, Number Ring Radius: ${numberRingRadius.toFixed(2)} (Factor: ${numberRingRadiusFactor})`);

            wheel.innerHTML = ''; // Clear previous numbers from wheel before adding new ones

            ROULETTE_NUMBERS.forEach((num, index) => {
                // Calculate angle for the center of the number slot
                // (0 degrees = top, positive = clockwise)
                const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2);
                // Adjust angle for trigonometric functions (cos/sin expect 0 degrees at right)
                const calculationAngleRadians = (angleDegrees - 90) * (Math.PI / 180);

                const numberSpan = document.createElement('span');
                numberSpan.textContent = num.toString();
                numberSpan.classList.add('roulette-number', `num-${num}`, ROULETTE_COLORS[num]); // Add color class too

                // --- Calculate position relative to wheel's center (wheelRadius, wheelRadius) ---
                const x = wheelRadius + numberRingRadius * Math.cos(calculationAngleRadians);
                const y = wheelRadius + numberRingRadius * Math.sin(calculationAngleRadians);

                numberSpan.style.position = 'absolute';
                numberSpan.style.left = `${x.toFixed(2)}px`;
                numberSpan.style.top = `${y.toFixed(2)}px`;
                // Apply rotation for "clock face" orientation & center the span
                numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees}deg)`;

                wheel.appendChild(numberSpan); // Append number directly to the wheel element
            });
            console.log("Positioned numbers relative to wheel center.");
        });
    }

    function setupRouletteEventListeners() { /* ... No changes needed ... */ if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel); if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets); /* Add resize listener */ window.addEventListener('resize', onWindowResize); }
    function handleBetPlacement(event) { /* ... No changes needed ... */ if (rouletteIsSpinning) return; const targetButton = event.target.closest('.roulette-bet-btn'); if (!targetButton) return; const amountToAdd = parseInt(rouletteBetInput.value); if (isNaN(amountToAdd) || amountToAdd < 1){ LocalBrokieAPI?.showMessage("Invalid bet amount.", 1500); return; } if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()){ LocalBrokieAPI?.showMessage("Insufficient balance.", 1500); return;} if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); const betType = targetButton.dataset.betType; const betValue = targetButton.dataset.betValue; let existingBet = findPlacedBet(betType, betValue); if (existingBet) { existingBet.amount += amountToAdd; } else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); } updateButtonVisual(targetButton, existingBet.amount); updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = false; if (clearBetsButton) clearBetsButton.disabled = false; }
    function clearAllRouletteBets() { /* ... No changes needed ... */ if (rouletteIsSpinning) return; if (placedBets.length === 0) return; if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets'); placedBets.forEach(bet => { if (bet.buttonElement) updateButtonVisual(bet.buttonElement, 0); }); placedBets = []; updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!'; }

    /** Resets the roulette game state and visuals. */
    function resetRoulette(forceVisualReset = false) {
        console.log("Resetting Roulette State...");
        rouletteIsSpinning = false; // Mark as not spinning

        // Clear any pending timeouts
        if (handleResultTimeoutId) { clearTimeout(handleResultTimeoutId); handleResultTimeoutId = null; }
        if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; }

        // Clear bets and update UI
        clearAllRouletteBets();

        // Reset visual elements
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = '?';
            rouletteResultDisplay.className = 'roulette-result'; // Remove color classes
        }
        if (rouletteStatusDisplay && !rouletteStatusDisplay.textContent.includes('Bets cleared')) {
            rouletteStatusDisplay.textContent = 'Place your bet!';
        }
        updateTotalBetDisplay(); // Ensure total bet display is reset

        // Ensure ball is hidden and correctly parented
        hideBall();

        // Only reposition numbers if forced (e.g., initial load or maybe resize)
        if (forceVisualReset && rouletteWheel) {
             positionWheelNumbers();
        }

        // Ensure continuous spin is active
        if (rouletteWheel) {
             startContinuousSpin();
        }

        // Re-enable betting controls
        if (rouletteBetInput) rouletteBetInput.disabled = false;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
        // Ensure spin/clear buttons are correctly disabled if no bets
        if (rouletteSpinButton) rouletteSpinButton.disabled = (placedBets.length === 0);
        if (clearBetsButton) clearBetsButton.disabled = (placedBets.length === 0);
    }

     /** Handles window resize events to reposition elements. */
     let resizeTimeout;
     function onWindowResize() {
         // Debounce resize events to avoid excessive recalculations
         clearTimeout(resizeTimeout);
         resizeTimeout = setTimeout(() => {
             console.log("Window resized, repositioning elements.");
             if (rouletteWheel) {
                 positionWheelNumbers(); // Reposition numbers based on new wheel size
             }
             // If the ball is currently visible and flying, update container radius
             if (rouletteBall && rouletteBall.classList.contains('visible') && !ballLanded && rouletteWheelContainer) {
                 containerRadius = rouletteWheelContainer.offsetWidth / 2;
             }
             // No need to reposition landed ball - it's stuck to the wheel which handles its own layout.
         }, 250); // Adjust debounce delay as needed (250ms is reasonable)
     }


    /** Initiates the wheel spin sequence. */
    function spinWheel() {
        if (rouletteIsSpinning) { console.warn("Spin already in progress."); return; }
        if (placedBets.length === 0) { LocalBrokieAPI?.showMessage("Place a bet first!", 1500); return; }
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (isNaN(totalBetAmount) || totalBetAmount < 1) { console.error("Invalid total bet amount."); return; }
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) { LocalBrokieAPI?.showMessage("Insufficient balance for total bet.", 1500); return; }

        console.log("Starting spin and ball animation sequence...");
        rouletteIsSpinning = true; // Set spinning state

        // Update balance and play sound via API
        if (LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(-totalBetAmount);
            LocalBrokieAPI.playSound('roulette_spin');
        }

        // Update UI for spinning state
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Ball rolling... No more bets!';
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteBetInput) rouletteBetInput.disabled = true;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none'; // Disable betting areas
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        // Determine winning number
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        console.log(`Calculated winning number: ${winningNumber} (Index: ${winningNumberIndex})`);

        // Start the ball animation
        showBall(winningNumberIndex); // Pass the INDEX to the animation

        // Set timeout to handle the result AFTER the ball animation duration
        if (handleResultTimeoutId) clearTimeout(handleResultTimeoutId); // Clear any previous stray timeout
        handleResultTimeoutId = setTimeout(() => {
            console.log("Ball animation duration ended, handling result...");
            handleResult(winningNumber); // Pass the actual NUMBER to the result handler
        }, BALL_ANIMATION_DURATION);
    }

    /** Handles the result calculation and display after the spin. */
    function handleResult(winningNumber) {
        // Play landing sound immediately (even if ball animation is visually finishing)
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');
        console.log(`Handling result for winning number: ${winningNumber}`);

        const winningColor = ROULETTE_COLORS[winningNumber];

        // Update result display
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result'; // Reset classes
            rouletteResultDisplay.classList.add(winningColor); // Add new color class
        }

        // Calculate winnings
        let totalWinnings = 0; // Pure profit
        let totalBetReturned = 0; // Original bet amount returned on win

        placedBets.forEach(bet => {
            let payoutMultiplier = 0;
            let betWon = false;

            // Check each bet type against the winning number/color
            if (bet.type === 'single' && bet.value === winningNumber) {
                payoutMultiplier = ROULETTE_PAYOUTS.single; betWon = true;
            } else if (bet.type === 'red' && winningColor === 'red') {
                payoutMultiplier = ROULETTE_PAYOUTS.red; betWon = true;
            } else if (bet.type === 'black' && winningColor === 'black') {
                payoutMultiplier = ROULETTE_PAYOUTS.black; betWon = true;
            } else if (bet.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) {
                payoutMultiplier = ROULETTE_PAYOUTS.odd; betWon = true;
            } else if (bet.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
                payoutMultiplier = ROULETTE_PAYOUTS.even; betWon = true;
            } else if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) {
                payoutMultiplier = ROULETTE_PAYOUTS.low; betWon = true;
            } else if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) {
                payoutMultiplier = ROULETTE_PAYOUTS.high; betWon = true;
            }
            // Add checks for other bet types (columns, dozens, splits, etc.) here if implemented

            if (betWon) {
                const winningsForThisBet = bet.amount * payoutMultiplier;
                totalWinnings += winningsForThisBet;
                totalBetReturned += bet.amount; // Return the original stake for winning bets
                console.log(`Bet Won: Type=${bet.type}, Value=${bet.value}, Amount=${bet.amount}, Payout=${winningsForThisBet}`);
            } else {
                 console.log(`Bet Lost: Type=${bet.type}, Value=${bet.value}, Amount=${bet.amount}`);
            }
        });

        const totalReturn = totalWinnings + totalBetReturned; // Total amount added back to balance
        let statusMessage = '';

        if (totalReturn > 0 && LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(totalReturn); // Add winnings + returned stake
            statusMessage = `Win! Landed ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`;
            LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000);
            LocalBrokieAPI.playSound('win_long'); // Play win sound
            if (totalWinnings > 0) LocalBrokieAPI.addWin('Roulette', totalWinnings); // Log the win (profit only)
        } else {
            const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
            statusMessage = `Lose. Landed ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`;
            if (LocalBrokieAPI) {
                LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000);
                LocalBrokieAPI.playSound('lose'); // Play lose sound
            }
        }

        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Schedule the end of the cycle (resetting for next bet)
        if (resetTimeoutId) clearTimeout(resetTimeoutId); // Clear previous just in case
        resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
    }

    /** Ends the current spin cycle and resets the game for the next round. */
    function endSpinCycle() {
        console.log("Ending spin cycle, resetting...");
        // hideBall(); // hideBall is now called within resetRoulette
        rouletteIsSpinning = false; // Mark as not spinning before reset
        resetRoulette(false); // Perform reset, don't force number repositioning unless needed
    }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}