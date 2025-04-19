// v2.28 - Fixed Init Check + Landing Diagnostics

// Keep easing function + helpers if needed later
function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }
function calculateTargetScreenAngle(targetIndex, currentWheelAngle) { /* ... */ }
function interpolateAngles(startAngle, endAngle, factor) { /* ... */ }


if (typeof initRoulette === 'undefined') {
    console.log("[ROULETTE_DIAG] Script Guard Check Passed - Loading Roulette Logic...");

    // --- Constants, State Variables --- (Keep as before)
    const ROULETTE_NUMBERS = [ /* ... */ ]; // etc.
    let rouletteIsSpinning = false; // etc.

    // --- DOM Element References ---
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer,
        rouletteOutsideBetsContainer, rouletteCurrentBetDisplay, clearBetsButton,
        rouletteBall, rouletteWheelContainer;

    // --- API Reference ---
    let LocalBrokieAPI = null;

    function initRoulette(API) {
        console.log("[ROULETTE_DIAG] initRoulette START");
        LocalBrokieAPI = API;
        try {
            console.log("[ROULETTE_LOG] Getting DOM elements...");
            rouletteWheelContainer = document.getElementById('roulette-wheel-container');
            rouletteWheel = document.getElementById('roulette-wheel');
            roulettePointer = document.getElementById('roulette-pointer');
            rouletteResultDisplay = document.getElementById('roulette-result');
            rouletteBetInput = document.getElementById('roulette-bet'); // Assign
            rouletteSpinButton = document.getElementById('roulette-spin-button');
            rouletteStatusDisplay = document.getElementById('roulette-status');
            rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets');
            rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets');
            rouletteCurrentBetDisplay = document.getElementById('roulette-current-bet-type');
            clearBetsButton = document.getElementById('roulette-clear-bets-button');
            rouletteBall = document.getElementById('roulette-ball');

            // --- FIXED Check: Include ALL required elements used in init ---
            const essentialElements = {
                rouletteWheelContainer, rouletteWheel, // Core visual
                rouletteBall,           // Core visual
                rouletteResultDisplay,  // Display
                rouletteBetInput,       // Input for betting + API call
                rouletteSpinButton,     // Control
                rouletteInsideBetsContainer, // Betting Area
                roulettePointer         // Visual element
                // Add others here if they are critical for init/reset/listeners
            };
            let missingElementId = null;
            for (const id in essentialElements) {
                if (!essentialElements[id]) {
                    missingElementId = id; // Store the *name* of the missing var
                    break;
                }
                 console.log(`[ROULETTE_DIAG] Element check passed for: ${id}`);
            }

            if (missingElementId || !LocalBrokieAPI) {
                // Try to get the expected ID from the variable name for a better error msg
                const expectedId = missingElementId ? missingElementId.replace(/([A-Z])/g, '-$1').toLowerCase() : 'LocalBrokieAPI';
                console.error(`[ROULETTE_DIAG] Roulette init failed: Missing ${missingElementId ? `element with ID likely matching '${expectedId}'` : 'LocalBrokieAPI'}.`);
                const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none';
                return;
            }
            console.log("[ROULETTE_DIAG] All essential elements verified.");
            // --- END FIXED Check ---

            // --- Continue with setup ---
            console.log("[ROULETTE_DIAG] Calling createRouletteBettingGrid...");
            createRouletteBettingGrid(); // Uses rouletteInsideBetsContainer
            console.log("[ROULETTE_DIAG] Calling positionWheelNumbers...");
            positionWheelNumbers(); // Uses rouletteWheel
            console.log("[ROULETTE_DIAG] Calling setupRouletteEventListeners...");
            setupRouletteEventListeners(); // Uses several button/container elements

            if (LocalBrokieAPI.addBetAdjustmentListeners) {
                 console.log("[ROULETTE_DIAG] Calling LocalBrokieAPI.addBetAdjustmentListeners...");
                 // This line should now only run if rouletteBetInput is confirmed non-null by the check above
                 LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
                 console.log("[ROULETTE_DIAG] Finished addBetAdjustmentListeners call.");
            } else {
                 console.warn("[ROULETTE_DIAG] LocalBrokieAPI.addBetAdjustmentListeners does not exist.");
            }

            console.log("[ROULETTE_DIAG] Calling resetRoulette(true)...");
            resetRoulette(true); // Uses many elements
            console.log("[ROULETTE_DIAG] Roulette Initialized (v2.28 - Fixed Init Check)");

        } catch (error) {
             console.error("[ROULETTE_DIAG] FATAL ERROR during Roulette Initialization:", error);
             const tab = document.getElementById('tab-roulette'); if (tab) tab.style.display = 'none';
        }
         console.log("[ROULETTE_DIAG] initRoulette END");
    }

    // ... (Rest of script: Helper funcs, animateBall with logs, Core funcs etc. keep from v2.14-landing-diag) ...
     function findPlacedBet(type, value) { return placedBets.find(bet => bet.type === type && bet.value == value); }
    function updateButtonVisual(button, amount) { if (!button) return; const originalValue = button.dataset.originalValue || button.textContent; if (!button.dataset.originalValue) button.dataset.originalValue = originalValue; if (amount > 0) { button.textContent = `${originalValue} (${amount})`; button.dataset.betAmount = amount.toString(); button.classList.add('has-bet'); } else { button.textContent = originalValue; button.removeAttribute('data-bet-amount'); button.classList.remove('has-bet'); } }
    function updateTotalBetDisplay() { if (!rouletteCurrentBetDisplay) return; const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); rouletteCurrentBetDisplay.textContent = totalBetAmount > 0 ? `Total Bet: ${totalBetAmount}` : 'No Bets Placed'; }
    function showBall(winningIndex) { /* ... v2.14 ... */ }
    function hideBall() { /* ... v2.14 + transition none ... */ }
    function startContinuousSpin() { /* ... v2.14 ... */ }
    function getCurrentWheelRotationAngle() { /* ... v2.14 ... */ }
    function animateBall(timestamp) { /* ... v2.14 physics + landing logs ... */ }
    function createRouletteBettingGrid() { /* ... v2.14 ... */ }
    function createBetButton(value, color, betType) { /* ... v2.14 ... */ }
    function positionWheelNumbers() { /* ... v2.14 ... */ }
    function setupRouletteEventListeners() { /* ... v2.14 ... */ }
    function handleBetPlacement(event) { /* ... v2.14 ... */ }
    function clearAllRouletteBets() { /* ... v2.14 ... */ }
    function resetRoulette(forceVisualReset = false) { /* ... v2.14 ... */ }
    let resizeTimeout; function onWindowResize() { /* ... v2.14 ... */ }
    function spinWheel() { /* ... v2.14 ... */ }
    function handleResult(winningNumber) { /* ... v2.14 ... */ }
    function endSpinCycle() { /* ... v2.14 ... */ }


} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}