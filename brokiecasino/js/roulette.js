// v2.26 - Attempting smooth landing via RAF + CSS Transition

function easeOutQuint(t) { // Keep easing function in case needed later
    return 1 - Math.pow(1 - t, 5);
  }
  
  if (typeof initRoulette === 'undefined') {
  
      // --- Constants, State, Refs, API --- (Keep from previous version)
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
      let lastBallTimestamp = 0; // Added back just in case needed by other logic
      let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
          rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
          rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
          rouletteBall, rouletteWheelContainer;
      let LocalBrokieAPI = null;
  
      function initRoulette(API) {
          // ... (Keep baseline init logic) ...
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
          console.log("Roulette Initialized (v2.26 - Re-parent, RAF, Transition)"); // <-- Version Update
      }
  
      // --- Helper Functions ---
      function findPlacedBet(type, value) { /* ... */ }
      function updateButtonVisual(button, amount) { /* ... */ }
      function updateTotalBetDisplay() { /* ... */ }
      function showBall(winningIndex) { /* ... */ }
      function hideBall() { /* ... */ }
      function startContinuousSpin() { /* ... */ }
      function getCurrentWheelRotationAngle() { /* ... */ }
  
      /** The main ball animation loop. */
      function animateBall(timestamp) {
          // --- Initial checks & Physics (Keep from v2.14 Baseline) ---
          if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
          containerRadius = rouletteWheelContainer.offsetWidth / 2;
          if (containerRadius <= 0 || !ballStartTime) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
          const elapsed = timestamp - ballStartTime;
          const deltaTime = Math.max(0, Math.min(0.1, (timestamp - lastBallTimestamp) / 1000));
          lastBallTimestamp = timestamp;
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
          // --- End Physics ---
  
          // --- Landing Logic (v2.26 - Re-parent, RAF, Transition) ---
          if (elapsed >= BALL_ANIMATION_DURATION) {
              ballLanded = true;
              if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
              ballAnimationId = null;
              // console.log("[ROULETTE_LOG][LANDING] === Ball Landing Sequence Start (v2.26) ===");
  
              const wheelElement = document.getElementById('roulette-wheel');
              if (!wheelElement) { /*...*/ hideBall(); return; }
              const wheelDiameter = wheelElement.offsetWidth;
              const wheelRadius = wheelDiameter / 2;
              if (wheelRadius <= 0) { /*...*/ hideBall(); return; }
              const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
              if (targetWinningNumberIndex < 0 || targetWinningNumberIndex >= ROULETTE_NUMBERS.length) { /*...*/ hideBall(); return;}
  
              // 1. Calculate final target position
              const winningNumberBaseAngle = (targetWinningNumberIndex * ANGLE_PER_NUMBER + ANGLE_PER_NUMBER / 2);
              const finalRadiansOnWheel = (winningNumberBaseAngle - 90) * (Math.PI / 180);
              const finalX_relative = wheelRadius + finalBallRadiusOnWheel * Math.cos(finalRadiansOnWheel);
              const finalY_relative = wheelRadius + finalBallRadiusOnWheel * Math.sin(finalRadiansOnWheel);
              // console.log(`[ROULETTE_LOG][LANDING] Target Coords Rel Wheel=(${finalX_relative.toFixed(1)}, ${finalY_relative.toFixed(1)})`);
  
              // 2. Re-parent the ball FIRST
              rouletteBall.style.position = 'absolute';
              rouletteBall.style.transition = 'none';
              if (rouletteBall.parentElement !== wheelElement) {
                   // console.log("[ROULETTE_LOG][LANDING] Ball needs re-parenting...");
                   if (rouletteBall.parentElement) {
                       try { rouletteBall.parentElement.removeChild(rouletteBall); } catch(e){ /* Log error */ }
                   }
                   try {
                       wheelElement.appendChild(rouletteBall); // Append without setting pos
                       // console.log("[ROULETTE_LOG][LANDING] AppendChild successful.");
                   } catch(e) { console.error("[ROULETTE_LOG][LANDING] ERROR: Failed attaching ball", e); hideBall(); return; }
              }
  
              // 3. Wait for next frame, then apply transition and final position
              requestAnimationFrame(() => {
                  // console.log("[ROULETTE_LOG][LANDING] RAF callback: Applying transition.");
                  if (!rouletteBall || !ballLanded) return; // Check state
  
                  const landingTransitionTime = 300; // ms for smooth landing slide
                  rouletteBall.style.transition = `left ${landingTransitionTime}ms ease-out, top ${landingTransitionTime}ms ease-out`;
  
                  // Set final position - this should now trigger the smooth transition
                  rouletteBall.style.left = `${finalX_relative.toFixed(2)}px`;
                  rouletteBall.style.top = `${finalY_relative.toFixed(2)}px`;
                  rouletteBall.style.transform = 'translate(-50%, -50%)';
  
                  // 4. Schedule removal of the transition
                  setTimeout(() => {
                      if (rouletteBall) { rouletteBall.style.transition = 'none'; }
                  }, landingTransitionTime + 50);
              });
  
              // console.log(`[ROULETTE_LOG][LANDING] Sequence complete (transition started).`);
              return; // Exit animateBall
          } else {
               // --- Ball is still flying: Position relative to CONTAINER ---
               rouletteBall.style.transition = 'none';
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
  
      // --- Core Functions (Keep identical to v2.14/v2.22) ---
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