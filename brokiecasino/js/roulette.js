// Add this easing function somewhere accessible (e.g., before initRoulette)
function easeOutQuint(t) {
    // t goes from 0 to 1
    return 1 - Math.pow(1 - t, 5);
  }
  
  // Check if the main function is already defined
  if (typeof initRoulette === 'undefined') {
  
      /**
       * ==========================================================================
       * Brokie Casino - Roulette Game Logic (v2.21 - Deterministic Eased Spin)
       *
       * - Determines winner first.
       * - Calculates total angle needed for N rotations + random offset.
       * - Uses an easing function (easeOutQuint) to control ball angle over time.
       * - Ball smoothly decelerates towards the end of the animation.
       * - Landing uses v2.14 logic (instant placement), should look smooth now.
       * - Radius animation (spiral) remains based on elapsed time.
       * ==========================================================================
       */
  
      // --- Constants ---
      const ROULETTE_NUMBERS = [ /* ... */ ];
      const ROULETTE_COLORS = { /* ... */ };
      const ROULETTE_PAYOUTS = { /* ... */ };
      const TOTAL_NUMBERS = ROULETTE_NUMBERS.length;
      const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;
      const BALL_ANIMATION_DURATION = 4500; // ms
      const POST_RESULT_DELAY = 2500; // ms
  
      // --- Ball Animation Constants ---
      const BALL_INITIAL_RADIUS_FACTOR = 0.9;
      const BALL_FINAL_RADIUS_FACTOR = 0.75;
      const BALL_INITIAL_SPEED = -800; // --- NO LONGER USED directly for animation ---
      const BALL_DECELERATION_START_TIME = BALL_ANIMATION_DURATION * 0.3; // Keep for spiral logic maybe?
      const BALL_DECELERATION_TIME = BALL_ANIMATION_DURATION * 0.7; // Keep for spiral logic maybe?
      const BALL_LANDING_SPIRAL_TIME = 1500; // Keep for radius calculation timing
      const MIN_ROTATIONS = 7; // Minimum full spins for visual effect
  
      // --- State Variables ---
      let rouletteIsSpinning = false;
      let placedBets = [];
      let handleResultTimeoutId = null;
      let resetTimeoutId = null;
      let ballAnimationId = null;
      let ballStartTime = null;
      let ballStartAngle = 0; // Initial random angle
      let ballAngle = 0;      // Current angle during animation
      let ballRadius = 0;
      let targetWinningNumberIndex = -1;
      let ballLanded = false;
      let containerRadius = 0;
      let lastBallTimestamp = 0; // May not be needed but keep for now
      let totalAngleToCover = 0; // <-- ADDED for deterministic spin total distance
  
      // --- DOM Element References ---
      let rouletteWheel, /*...*/ rouletteBall, rouletteWheelContainer;
  
      // --- API Reference ---
      let LocalBrokieAPI = null;
  
      /** Initializes the Roulette game. */
      function initRoulette(API) {
          // ... (Keep v2.14 implementation - Get elements, checks, calls setup funcs) ...
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
          console.log("Roulette Initialized (v2.21 - Deterministic Eased Spin)"); // <-- Updated Version
      }
  
      // --- Helper Functions ---
      // ... (Keep findPlacedBet, updateButtonVisual, updateTotalBetDisplay) ...
      function findPlacedBet(type, value) { /* ... */ }
      function updateButtonVisual(button, amount) { /* ... */ }
      function updateTotalBetDisplay() { /* ... */ }
  
      /** Shows the ball and starts its animation sequence. */
      function showBall(winningIndex) {
          if (!rouletteBall || !rouletteWheelContainer) return;
          containerRadius = rouletteWheelContainer.offsetWidth / 2;
          // DEBUG: Check container radius calculation
          // console.log("Container Radius:", containerRadius);
          if (containerRadius <= 0) { console.error("Cannot calculate container radius for ball."); return; }
  
          targetWinningNumberIndex = winningIndex; // Still needed for final placement
          ballLanded = false;
          ballStartTime = performance.now();
          lastBallTimestamp = ballStartTime; // Keep potentially for radius calc?
          ballStartAngle = Math.random() * 360; // Random visual start position
          ballAngle = ballStartAngle; // Animation starts from here
          ballRadius = containerRadius * BALL_INITIAL_RADIUS_FACTOR;
  
          // --- Calculate Total Angle for Deterministic Spin (v2.21) ---
          const randomExtraAngle = Math.random() * 720; // Add 0-2 extra random rotations
          totalAngleToCover = (MIN_ROTATIONS * 360) + randomExtraAngle;
          // --- End Calculation ---
  
          const initialRadians = (ballStartAngle - 90) * (Math.PI / 180);
          // Check Centering: Ensure calculation uses the correct center reference
          const initialX = containerRadius + ballRadius * Math.cos(initialRadians);
          const initialY = containerRadius + ballRadius * Math.sin(initialRadians);
  
          hideBall();
          rouletteBall.style.left = `${initialX.toFixed(2)}px`;
          rouletteBall.style.top = `${initialY.toFixed(2)}px`;
          rouletteBall.style.transform = 'translate(-50%, -50%)'; // CSS should center ball on this point
          rouletteBall.classList.add('visible');
  
          if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
          ballAnimationId = requestAnimationFrame(animateBall);
          console.log(`Ball animation started. Total angle: ${totalAngleToCover.toFixed(0)}`);
      }
  
       /** Hides the ball and ensures it's returned to the container. */
      function hideBall() {
          // ... (Keep v2.14/v2.20 implementation - ensures transition:none) ...
          if (ballAnimationId) { cancelAnimationFrame(ballAnimationId); ballAnimationId = null; }
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
      function startContinuousSpin() { /* ... Keep v2.14 ... */ }
  
      /** Gets the current visual rotation angle of the wheel from CSS */
      function getCurrentWheelRotationAngle() { /* ... Keep v2.14 ... */ }
  
  
      // =========================================================================
      // vvvvvvvv   MODIFIED animateBall function (v2.21)   vvvvvvvv
      // =========================================================================
      /** The main ball animation loop (Deterministic Eased Spin). */
      function animateBall(timestamp) {
          // --- Initial checks ---
          if (ballLanded || !rouletteBall || !rouletteWheelContainer) { if(ballAnimationId) cancelAnimationFrame(ballAnimationId); ballAnimationId = null; return; }
          // Check container radius consistency
          const currentContainerRadius = rouletteWheelContainer.offsetWidth / 2;
          if (currentContainerRadius <= 0 || !ballStartTime) {
               // Don't stop animation, maybe it resizes later
               console.warn("animateBall: Invalid container radius or start time.");
               ballAnimationId = requestAnimationFrame(animateBall); // Try next frame
               return;
          }
          containerRadius = currentContainerRadius; // Update if valid
  
          const elapsed = timestamp - ballStartTime;
  
          // --- Animation Progress (0.0 to 1.0) ---
          const progress = Math.min(1.0, elapsed / BALL_ANIMATION_DURATION);
  
          // --- Radius Calculation (Spiral - unchanged) ---
          let currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
          // Use the original spiral logic, driven by elapsed time relative to duration
          const spiralStartTime = BALL_ANIMATION_DURATION - BALL_LANDING_SPIRAL_TIME;
          if (elapsed > spiralStartTime) {
              const spiralElapsed = elapsed - spiralStartTime;
              const spiralProgress = Math.min(1, spiralElapsed / BALL_LANDING_SPIRAL_TIME);
              // Use a suitable easing for the spiral inward movement
              const easedSpiralProgress = spiralProgress < 0.5 ? 4 * spiralProgress * spiralProgress * spiralProgress : 1 - Math.pow(-2 * spiralProgress + 2, 3) / 2; // easeInOutCubic
              currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR + (BALL_FINAL_RADIUS_FACTOR - BALL_INITIAL_RADIUS_FACTOR) * easedSpiralProgress;
          } else if (progress < (spiralStartTime / BALL_ANIMATION_DURATION)) {
               // Ensure radius stays at initial factor before spiral starts
               currentRadiusFactor = BALL_INITIAL_RADIUS_FACTOR;
          } else {
              // If between spiral start and end, calculate based on overall progress?
              // Let's stick to the time-based spiral calculation above. It should cover this.
          }
          ballRadius = containerRadius * currentRadiusFactor;
  
  
          // --- Angle Calculation (Deterministic Easing v2.21) ---
          const easedProgress = easeOutQuint(progress); // Apply easing to the overall progress
          // Ball spins counter-clockwise (negative direction)
          ballAngle = (ballStartAngle - (totalAngleToCover * easedProgress)) % 360;
          ballAngle = (ballAngle + 360) % 360; // Normalize to [0, 360)
          // --- END Angle Calculation ---
  
  
          // --- Landing Logic (Keep EXACTLY as in v2.14) ---
          if (progress >= 1.0) { // Land when progress reaches 1
              ballLanded = true;
              if (ballAnimationId) cancelAnimationFrame(ballAnimationId);
              ballAnimationId = null;
  
              // --- START: Final Placement Logic (INSTANT - From v2.14) ---
              const wheelElement = document.getElementById('roulette-wheel');
              if (!wheelElement) { console.error("Cannot find wheel for final placement."); hideBall(); return; }
              const wheelDiameter = wheelElement.offsetWidth;
              const wheelRadius = wheelDiameter / 2;
              if (wheelRadius <= 0) { console.error("Wheel radius zero for final placement."); hideBall(); return; }
              const finalBallRadiusOnWheel = wheelRadius * BALL_FINAL_RADIUS_FACTOR;
              // targetWinningNumberIndex MUST be set correctly when spin starts
              if (targetWinningNumberIndex < 0) { console.error("Invalid target index for landing"); hideBall(); return;}
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
                   if (rouletteBall.parentElement) { try{rouletteBall.parentElement.removeChild(rouletteBall);}catch(e){} }
                   try { wheelElement.appendChild(rouletteBall); } catch(e) { console.error("Failed attaching ball", e); }
              }
              // --- END: Final Placement Logic (INSTANT - From v2.14) ---
  
              console.log(`Ball landed deterministically near Index: ${targetWinningNumberIndex}`);
              return; // Exit animateBall
          }
  
          // --- Ball is still flying: Position relative to CONTAINER ---
          // Check Centering: Add console logs here if needed to debug ball position
          // console.log(`Pos: angle=${ballAngle.toFixed(1)}, radius=${ballRadius.toFixed(1)}`);
          rouletteBall.style.transition = 'none'; // Ensure no transition
          const currentRadians = (ballAngle - 90) * (Math.PI / 180);
          const x = containerRadius + ballRadius * Math.cos(currentRadians);
          const y = containerRadius + ballRadius * Math.sin(currentRadians);
          if(rouletteBall.parentElement !== rouletteWheelContainer) { /* Safeguard */ }
          rouletteBall.style.left = `${x.toFixed(2)}px`;
          rouletteBall.style.top = `${y.toFixed(2)}px`;
          rouletteBall.style.transform = 'translate(-50%, -50%)'; // Ensure this is correct in CSS too
          ballAnimationId = requestAnimationFrame(animateBall);
      } // End of animateBall
      // =========================================================================
      // ^^^^^^^^   MODIFIED animateBall function (v2.21)   ^^^^^^^^
      // =========================================================================
  
  
      // --- Core Functions ---
      // (Keep EXACTLY as in v2.14)
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