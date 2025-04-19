// v2.25 - Combining v2.22 Eased Spin + Verified v2.14 Landing Logic

function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }
  
  if (typeof initRoulette === 'undefined') {
  
      // ... (Constants, State Variables, DOM Refs, API Ref - Identical to v2.22) ...
      const ROULETTE_NUMBERS = [ /* ... */ ];
      const ROULETTE_COLORS = { /* ... */ };
      const ROULETTE_PAYOUTS = { /* ... */ };
      const TOTAL_NUMBERS = ROULETTE_NUMBERS.length;
      const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;
      const BALL_ANIMATION_DURATION = 4500;
      const POST_RESULT_DELAY = 2500;
      const BALL_INITIAL_RADIUS_FACTOR = 0.9;
      const BALL_FINAL_RADIUS_FACTOR = 0.75;
      const BALL_LANDING_SPIRAL_TIME = 1500;
      const MIN_ROTATIONS = 7;
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
      let totalAngleToCover = 0;
      let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
          rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
          rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
          rouletteBall, rouletteWheelContainer;
      let LocalBrokieAPI = null;
  
  
      function initRoulette(API) {
          // ... (Identical to v2.22) ...
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
               console.error("Roulette init failed: Missing essential DOM elements or API."); const tab=document.getElementById('tab-roulette'); if(tab) tab.style.display='none'; return;
          }
          createRouletteBettingGrid();
          positionWheelNumbers();
          setupRouletteEventListeners();
          if (LocalBrokieAPI.addBetAdjustmentListeners) { LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput); }
          resetRoulette(true);
          console.log("Roulette Initialized (v2.25 - Eased Spin + v2.14 Landing)"); // <-- Version Update
      }
  
      function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }
      function updateButtonVisual(button, amount) { if (!button) return; const originalValue = button.dataset.originalValue || button.textContent; if (!button.dataset.originalValue) button.dataset.originalValue = originalValue; if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); } else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); } }
      function updateTotalBetDisplay() { if (!rouletteCurrentBetDisplay) return; const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed'; }
  
      function showBall(winningIndex) {
          // ... (Identical to v2.22 - calculates totalAngleToCover) ...
           if (!rouletteBall || !rouletteWheelContainer) return;
          containerRadius = rouletteWheelContainer.offsetWidth / 2;
          if (containerRadius <= 0) { console.error("Cannot calculate container radius for ball."); return; }
          targetWinningNumberIndex = winningIndex;
          ballLanded = false;
          ballStartTime = performance.now();
          ballStartAngle = Math.random() * 360;
          ballAngle = ballStartAngle;
          ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR;
          const randomExtraAngle = Math.random() * 720;
          totalAngleToCover = (MIN_ROTATIONS * 360) + randomExtraAngle;
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
          console.log(`Ball animation started. Target Index: ${targetWinningNumberIndex}, Total angle: ${totalAngleToCover.toFixed(0)}`);
      }
  
      function hideBall() {
          // ... (Identical to v2.22) ...
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
          // ... (Identical to v2.22) ...
           if (!rouletteWheel) return; rouletteWheel.style.transition = 'none'; rouletteWheel.style.transform = ''; if (!rouletteWheel.classList.contains('continuous-spin')) { rouletteWheel.classList.add('continuous-spin'); }
      }
  
      function getCurrentWheelRotationAngle() {
          // ... (Identical to v2.22) ...
          if (!rouletteWheel) return 0; try { const currentTransform = getComputedStyle(rouletteWheel).transform; if (currentTransform === 'none') return 0; const matrixValues = currentTransform.match(/matrix.*\((.+)\)/); if (matrixValues && matrixValues[1]) { const matrix = matrixValues[1].split(', ').map(parseFloat); const angleRad = Math.atan2(matrix[1], matrix[0]); let angleDeg = angleRad * (180 / Math.PI); return (angleDeg < 0) ? angleDeg + 360 : angleDeg; } } catch (e) { console.error("Error getting wheel rotation:", e); } return 0;
      }
  
      function animateBall(timestamp) {
          if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
          const currentContainerRadius = rouletteWheelContainer.offsetWidth / 2;
          if (currentContainerRadius <= 0 || !ballStartTime) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
          containerRadius = currentContainerRadius;
  
          const elapsed = timestamp - ballStartTime;
          const progress = Math.min(1.0, elapsed / BALL_ANIMATION_DURATION);
  
          // Radius calculation (Spiral) - Identical to v2.22
          let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
          const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
          if (elapsed > spiralStartTime) {
              const spiralElapsed = elapsed - spiralStartTime;
              const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
              const easedSpiralProgress = spiralProgress < 0.5 ? 4 * spiralProgress * spiralProgress * spiralProgress : 1 - Math.pow(-2 * spiralProgress + 2, 3) / 2;
              currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedSpiralProgress;
          }
          ballRadius = containerRadius * currentRadiusFactor;
  
          // Angle Calculation (Deterministic Easing) - Identical to v2.22
          const easedProgress = easeOutQuint(progress);
          ballAngle = (ballStartAngle - (totalAngleToCover * easedProgress)) % 360;
          ballAngle = (ballAngle + 360) % 360;
  
          // Landing Logic (EXACTLY from v2.14 - Verified Working)
          if (progress >= 1.0) {
              ballLanded = true;
              if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
              ballAnimationId = null;
              console.log("Landing: Progress >= 1.0"); // DEBUG
  
              const wheelElement = document.getElementById('roulette-wheel');
              if (!wheelElement) { console.error("Landing Error: Wheel element missing!"); hideBall(); return; }
              console.log("Landing: Wheel element found."); // DEBUG
  
              const wheelDiameter = wheelElement.offsetWidth;
              const wheelRadius = wheelDiameter / 2;
              if (wheelRadius <= 0) { console.error("Landing Error: Wheel radius zero!"); hideBall(); return; }
              console.log(`Landing: Wheel Radius=${wheelRadius}`); // DEBUG
  
              const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
              if (targetWinningNumberIndex < 0) { console.error("Landing Error: Invalid target index!"); hideBall(); return;}
               console.log(`Landing: Target Index=${targetWinningNumberIndex}`); // DEBUG
  
              const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
              const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
              const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
              const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);
               console.log(`Landing: Target Coords Rel Wheel=(${finalX_relative.toFixed(1)}, ${finalY_relative.toFixed(1)})`); // DEBUG
  
              rouletteBall.style.transition = 'none';
              rouletteBall.style.position = 'absolute';
              rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
              rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
              rouletteBall.style.transform = 'translate(-50%, -50%)';
               console.log("Landing: Set final position styles."); // DEBUG
  
              if (rouletteBall.parentElement !== wheelElement) {
                   console.log("Landing: Ball needs re-parenting."); // DEBUG
                   if (rouletteBall.parentElement) {
                       console.log("Landing: Removing from old parent."); // DEBUG
                       try{rouletteBall.parentElement.removeChild(rouletteBall);}catch(e){ console.error("Landing Error: removeChild failed", e);}
                   }
                   try {
                       console.log("Landing: Appending to wheel."); // DEBUG
                       wheelElement.appendChild(rouletteBall);
                       console.log("Landing: AppendChild successful. New parent:", rouletteBall.parentElement?.id); // DEBUG
                   } catch(e) {
                       console.error("Landing Error: Failed attaching ball", e);
                   }
              } else {
                   console.log("Landing: Ball already child of wheel."); // DEBUG
              }
              console.log(`Ball landed. Final Parent: ${rouletteBall.parentElement?.id}`); // DEBUG
              return;
          }
  
          // Positioning during flight (Identical to v2.22)
          rouletteBall.style.transition = 'none';
          const currentRadians = (ballAngle - 90) * (Math.PI / 180);
          const x = containerRadius + ballRadius * Math.cos(currentRadians);
          const y = containerRadius + ballRadius * Math.sin(currentRadians);
          if(rouletteBall.parentElement !== rouletteWheelContainer) { }
          rouletteBall.style.left = `${x.toFixed(2)}px`;
          rouletteBall.style.top = `${y.toFixed(2)}px`;
          rouletteBall.style.transform = 'translate(-50%, -50%)';
          ballAnimationId = requestAnimationFrame(animateBall);
      }
  
  
      // --- Core Functions ---
      // ... (Identical to v2.22/v2.14) ...
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