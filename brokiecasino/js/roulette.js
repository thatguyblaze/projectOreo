function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
}

if (typeof initRoulette === 'undefined') {

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
    const BALL_ANIMATION_DURATION = 4500;
    const POST_RESULT_DELAY = 2500;

    const BALL_INITIAL_RADIUS_FACTOR = 0.9;
    const BALL_FINAL_RADIUS_FACTOR = 0.75;
    const BALL_INITIAL_SPEED = -800;
    const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3;
    const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7;
    const BALL_LANDING_SPIRAL_TIME = 1500;

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
    let finalWinningNumber = null; // Stores the number determined by animation
    let ballLanded = false;
    let containerRadius = 0;
    let lastBallTimestamp = 0;

    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall, rouletteWheelContainer;

    let LocalBrokieAPI = null;

    function initRoulette(API) {
        LocalBrokieAPI = API;
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

        if (!rouletteWheelContainer || !rouletteWheel || !rouletteBall || !rouletteResultDisplay || !rouletteSpinButton || !rouletteInsideBetsContainer || !LocalBrokieAPI) {
            console.error("Roulette init failed: Missing essential DOM elements or API."); const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none'; return;
        }
        createRouletteBettingGrid();
        positionWheelNumbers();
        setupRouletteEventListeners();
        if (LocalBrokieAPI.addBetAdjustmentListeners) { LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput); }
        resetRoulette(true);
        console.log("Roulette Initialized (v2.29 - Animation Determines Outcome)");
    }

    function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }
    function updateButtonVisual(button, amount) { if (!button) return; const originalValue = button.dataset.originalValue || button.textContent; if (!button.dataset.originalValue) button.dataset.originalValue = originalValue; if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); } else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); } }
    function updateTotalBetDisplay() { if (!rouletteCurrentBetDisplay) return; const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed'; }

    function showBall() {
        if (!rouletteBall || !rouletteWheelContainer) return;
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0) { console.error("Cannot calculate container radius."); return; }

        targetWinningNumberIndex = -1;
        finalWinningNumber = null;
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
        console.log("Ball animation started (Outcome TBD).");
    }

    function hideBall() {
        if (ballAnimationId) { cancelAnimationFrame(ballAnimationId); ballAnimationId = null; }
        if (rouletteBall) {
            rouletteBall.style.transition = 'none';
            rouletteBall.classList.remove('visible');
            const wheelElement = document.getElementById('roulette-wheel');
            const containerElement = document.getElementById('roulette-wheel-container');
            if (wheelElement && containerElement && rouletteBall.parentElement === wheelElement) {
                try { wheelElement.removeChild(rouletteBall); containerElement.appendChild(rouletteBall); } catch (e) { }
            }
        }
        ballLanded = false;
    }

    function startContinuousSpin() {
        if (!rouletteWheel) return; rouletteWheel.style.transition = 'none'; rouletteWheel.style.transform = ''; if (!rouletteWheel.classList.contains('continuous-spin')) { rouletteWheel.classList.add('continuous-spin'); }
    }

    function getCurrentWheelRotationAngle() {
        if (!rouletteWheel) return 0; try { const currentTransform = getComputedStyle(rouletteWheel).transform; if (currentTransform === 'none') return 0; const matrixValues = currentTransform.match(/matrix.*\((.+)\)/); if (matrixValues && matrixValues[1]) { const matrix = matrixValues[1].split(', ').map(parseFloat); const angleRad = Math.atan2(matrix[1], matrix[0]); let angleDeg = angleRad * (180 / Math.PI); return (angleDeg < 0) ? angleDeg + 360 : angleDeg; } } catch (e) { console.error("Error getting wheel rotation:", e); } return 0;
    }

    function animateBall(timestamp) {
        if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if (ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
        containerRadius = rouletteWheelContainer.offsetWidth / 2;
        if (containerRadius <= 0 || !ballStartTime) { if (ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }

        const elapsed = timestamp - ballStartTime;
        const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
        lastBallTimestamp = timestamp;

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
        ballAngle = (ballAngle + (currentSpeed * deltaTime)) % 360;
        if (ballAngle < 0) ballAngle += 360;

        if (elapsed >= BALL_ANIMATION_DURATION) {
            ballLanded = true;
            if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
            ballAnimationId = null;

            const finalAnimatedAngle = ballAngle;
            const finalWheelAngle = getCurrentWheelRotationAngle();
            const ballAngleRelativeToWheel = (finalAnimatedAngle - finalWheelAngle + 360) % 360;

            let determinedWinningIndex = -1;
            for (let i = 0; i < TOTAL_NUMBERS; i++) {
                const segmentStartAngle = (i * ANGLE_PER_NUMBER);
                const segmentEndAngle = ((i + 1) * ANGLE_PER_NUMBER);
                if (segmentEndAngle > 360) {
                    if ((ballAngleRelativeToWheel >= segmentStartAngle && ballAngleRelativeToWheel < 360) ||
                        (ballAngleRelativeToWheel >= 0 && ballAngleRelativeToWheel < (segmentEndAngle % 360))) {
                        determinedWinningIndex = i;
                        break;
                    }
                } else {
                    if (ballAngleRelativeToWheel >= segmentStartAngle && ballAngleRelativeToWheel < segmentEndAngle) {
                        determinedWinningIndex = i;
                        break;
                    }
                }
            }
            if (determinedWinningIndex === -1) {
                console.error("Could not determine winning index from angle:", ballAngleRelativeToWheel);
                determinedWinningIndex = Math.floor(ballAngleRelativeToWheel / ANGLE_PER_NUMBER);
                determinedWinningIndex = Math.max(0, Math.min(TOTAL_NUMBERS - 1, determinedWinningIndex));
            }

            targetWinningNumberIndex = determinedWinningIndex;
            finalWinningNumber = ROULETTE_NUMBERS[targetWinningNumberIndex];
            console.log(`Animation Result: Ball landed in segment of index ${targetWinningNumberIndex}, Number: ${finalWinningNumber}`);

            const wheelElement = document.getElementById('roulette-wheel');
            if (!wheelElement) { hideBall(); return; }
            const wheelDiameter = wheelElement.offsetWidth;
            const wheelRadius = wheelDiameter / 2;
            if (wheelRadius <= 0) { hideBall(); return; }
            const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
            const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
            const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
            const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
            const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);

            rouletteBall.style.transition = 'none';
            rouletteBall.style.position = 'absolute';
            rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
            rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
            rouletteBall.style.transform = 'translate(-50%, -50%)';

            if (rouletteBall.parentElement !== wheelElement) {
                if (rouletteBall.parentElement) { try { rouletteBall.parentElement.removeChild(rouletteBall); } catch (e) { } }
                try { wheelElement.appendChild(rouletteBall); } catch (e) { console.error("Failed attaching ball", e); }
            }

            return;
        }

        rouletteBall.style.transition = 'none';
        const x_current = containerRadius + ballRadius * Math.cos((ballAngle - 90) * Math.PI / 180);
        const y_current = containerRadius + ballRadius * Math.sin((ballAngle - 90) * Math.PI / 180);
        if (rouletteBall.parentElement !== rouletteWheelContainer) { }
        rouletteBall.style.left = `${x_current.toFixed(2)}px`;
        rouletteBall.style.top = `${y_current.toFixed(2)}px`;
        rouletteBall.style.transform = 'translate(-50%, -50%)';
        ballAnimationId = requestAnimationFrame(animateBall);
    }

    function createRouletteBettingGrid() { if (!rouletteInsideBetsContainer) { console.error("Roulette Inside Bets container not found!"); return; } try { rouletteInsideBetsContainer.innerHTML = ''; const zeroButton = createBetButton(0, 'green', 'single'); zeroButton.classList.add('col-span-3'); rouletteInsideBetsContainer.appendChild(zeroButton); for (let i = 1; i <= 36; i++) { const color = ROULETTE_COLORS[i]; const button = createBetButton(i, color, 'single'); rouletteInsideBetsContainer.appendChild(button); } } catch (e) { console.error("Error in createRouletteBettingGrid", e); } }
    function createBetButton(value, color, betType) { const button = document.createElement('button'); button.classList.add('roulette-bet-btn'); if (color) button.classList.add(color); button.textContent = value.toString(); button.dataset.betType = betType; button.dataset.betValue = value.toString(); button.dataset.originalValue = value.toString(); return button; }
    function positionWheelNumbers() { const wheel = document.getElementById('roulette-wheel'); if (!wheel) { console.error("Wheel element missing for number positioning."); return; } requestAnimationFrame(() => { try { const wheelDiameter = wheel.offsetWidth; if (wheelDiameter <= 0) { setTimeout(positionWheelNumbers, 100); return; } const wheelRadius = wheelDiameter / 2; const numberRingRadiusFactor = 0.88; const numberRingRadius = wheelRadius * numberRingRadiusFactor; wheel.innerHTML = ''; ROULETTE_NUMBERS.forEach((num, index) => { const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2); const calculationAngleRadians = (angleDegrees - 90) * (Math.PI / 180); const numberSpan = document.createElement('span'); numberSpan.textContent = num.toString(); numberSpan.classList.add('roulette-number', `num-${num}`, ROULETTE_COLORS[num]); const x = wheelRadius + numberRingRadius * Math.cos(calculationAngleRadians); const y = wheelRadius + numberRingRadius * Math.sin(calculationAngleRadians); numberSpan.style.position = 'absolute'; numberSpan.style.left = `${x.toFixed(2)}px`; numberSpan.style.top = `${y.toFixed(2)}px`; numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees}deg)`; wheel.appendChild(numberSpan); }); } catch (e) { console.error("Error in positionWheelNumbers", e); } }); }
    function setupRouletteEventListeners() { try { if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement); if (rouletteSpinButton) rouletteSpinButton.addEventListener('click', spinWheel); if (clearBetsButton) clearBetsButton.addEventListener('click', clearAllRouletteBets); window.addEventListener('resize', onWindowResize); } catch (e) { console.error("Error in setupRouletteEventListeners", e); } }
    function handleBetPlacement(event) { if (rouletteIsSpinning) return; const targetButton = event.target.closest('.roulette-bet-btn'); if (!targetButton) return; const amountToAdd = parseInt(rouletteBetInput.value); if (isNaN(amountToAdd) || amountToAdd < 1) { LocalBrokieAPI?.showMessage("Invalid bet amount.", 1500); return; } if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()) { LocalBrokieAPI?.showMessage("Insufficient balance.", 1500); return; } if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); const betType = targetButton.dataset.betType; const betValue = targetButton.dataset.betValue; let existingBet = findPlacedBet(betType, betValue); if (existingBet) { existingBet.amount += amountToAdd; } else { existingBet = { type: betType, value: (betType === 'single') ? parseInt(betValue, 10) : betValue, amount: amountToAdd, buttonElement: targetButton }; placedBets.push(existingBet); } updateButtonVisual(targetButton, existingBet.amount); updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = false; if (clearBetsButton) clearBetsButton.disabled = false; }
    function clearAllRouletteBets() { if (rouletteIsSpinning) return; if (placedBets.length === 0) return; if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets'); placedBets.forEach(bet => { if (bet.buttonElement) updateButtonVisual(bet.buttonElement, 0); }); placedBets = []; updateTotalBetDisplay(); if (rouletteSpinButton) rouletteSpinButton.disabled = true; if (clearBetsButton) clearBetsButton.disabled = true; if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!'; }
    function resetRoulette(forceVisualReset = false, keepBets = false) { try { console.log("Resetting Roulette State..."); rouletteIsSpinning = false; if (handleResultTimeoutId) { clearTimeout(handleResultTimeoutId); handleResultTimeoutId = null; } if (resetTimeoutId) { clearTimeout(resetTimeoutId); resetTimeoutId = null; } if (!keepBets) clearAllRouletteBets(); if (rouletteResultDisplay) { rouletteResultDisplay.textContent = '?'; rouletteResultDisplay.className = 'roulette-result'; } if (rouletteStatusDisplay && !rouletteStatusDisplay.textContent.includes('Bets cleared')) { rouletteStatusDisplay.textContent = 'Place your bet!'; } updateTotalBetDisplay(); hideBall(); if (forceVisualReset && rouletteWheel) { positionWheelNumbers(); } if (rouletteWheel) { startContinuousSpin(); } if (rouletteBetInput) rouletteBetInput.disabled = false; if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto'; if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto'; if (rouletteSpinButton) rouletteSpinButton.disabled = (placedBets.length === 0); if (clearBetsButton) clearBetsButton.disabled = (placedBets.length === 0); } catch (e) { console.error("Error in resetRoulette", e); } }
    let resizeTimeout; function onWindowResize() { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { if (rouletteWheel) { positionWheelNumbers(); } if (rouletteBall && rouletteBall.classList.contains('visible') && !ballLanded && rouletteWheelContainer) { containerRadius = rouletteWheelContainer.offsetWidth / 2; } }, 250); }

    function spinWheel() {
        if (rouletteIsSpinning) { console.warn("Spin already in progress."); return; }
        if (placedBets.length === 0) { LocalBrokieAPI?.showMessage("Place a bet first!", 1500); return; }
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (isNaN(totalBetAmount) || totalBetAmount < 1) { console.error("Invalid total bet amount."); return; }
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) { LocalBrokieAPI?.showMessage("Insufficient balance for total bet.", 1500); return; }
        console.log("Starting spin and ball animation sequence...");
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(-totalBetAmount);
            LocalBrokieAPI.playSound('roulette_spin');
            if (typeof LocalBrokieAPI.registerGameStart === 'function') LocalBrokieAPI.registerGameStart('Roulette');
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Ball rolling... No more bets!';
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteBetInput) rouletteBetInput.disabled = true;
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        showBall();

        if (handleResultTimeoutId) clearTimeout(handleResultTimeoutId);
        handleResultTimeoutId = setTimeout(handleResult, BALL_ANIMATION_DURATION + 100); // Use the modified handleResult
        console.log("spinWheel END - handleResult timer set.");
    }

    function handleResult() { // No winningNumber parameter needed
        if (finalWinningNumber === null || targetWinningNumberIndex === -1) {
            console.error("handleResult called but finalWinningNumber or index not set by animation!");
            endSpinCycle(); // Reset on error
            return;
        }
        const winningNumber = finalWinningNumber; // Use the number determined by animation
        console.log(`Handling result for winning number: ${winningNumber} (Index: ${targetWinningNumberIndex})`);
        try {
            if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');
            const winningColor = ROULETTE_COLORS[winningNumber];
            if (rouletteResultDisplay) {
                rouletteResultDisplay.textContent = winningNumber.toString();
                rouletteResultDisplay.className = 'roulette-result';
                rouletteResultDisplay.classList.add(winningColor);
            }
            let totalWinnings = 0; let totalBetReturned = 0;
            placedBets.forEach(bet => {
                let payoutMultiplier = 0; let betWon = false;
                if (bet.type === 'single' && bet.value === winningNumber) { payoutMultiplier = ROULETTE_PAYOUTS.single; betWon = true; }
                else if (bet.type === 'red' && winningColor === 'red') { payoutMultiplier = ROULETTE_PAYOUTS.red; betWon = true; }
                else if (bet.type === 'black' && winningColor === 'black') { payoutMultiplier = ROULETTE_PAYOUTS.black; betWon = true; }
                else if (bet.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) { payoutMultiplier = ROULETTE_PAYOUTS.odd; betWon = true; }
                else if (bet.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) { payoutMultiplier = ROULETTE_PAYOUTS.even; betWon = true; }
                else if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) { payoutMultiplier = ROULETTE_PAYOUTS.low; betWon = true; }
                else if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) { payoutMultiplier = ROULETTE_PAYOUTS.high; betWon = true; }
                if (betWon) { const winningsForThisBet = bet.amount * payoutMultiplier; totalWinnings += winningsForThisBet; totalBetReturned += bet.amount; }
            });
            const totalReturn = totalWinnings + totalBetReturned;
            let statusMessage = '';
            if (totalReturn > 0 && LocalBrokieAPI) {
                LocalBrokieAPI.updateBalance(totalReturn); statusMessage = `Win! Landed ${winningNumber} (${winningColor}). Won ${LocalBrokieAPI.formatWin(totalWinnings)}!`; LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000); LocalBrokieAPI.playSound('win_long'); if (totalWinnings > 0) LocalBrokieAPI.addWin('Roulette', totalWinnings);
            } else {
                const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); statusMessage = `Lose. Landed ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`; if (LocalBrokieAPI) { LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000); LocalBrokieAPI.playSound('lose'); }
            }
            if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;
            if (resetTimeoutId) clearTimeout(resetTimeoutId);
            resetTimeoutId = setTimeout(endSpinCycle, POST_RESULT_DELAY);
        } catch (e) { console.error("Error in handleResult", e); }
    }

    function endSpinCycle() {
        console.log("Ending spin cycle, resetting...");
        rouletteIsSpinning = false;
        // Keep bets on table after spin:
        resetRoulette(false, true);
    }

} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}