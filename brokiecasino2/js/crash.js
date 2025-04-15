/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v2 - API & Auto-Cashout Fix)
 *
 * - Handles all functionality related to the Crash game.
 * - Uses BrokieAPI object passed from main.js for core functions.
 * - Fixes auto-cashout input enabling and validation timing.
 * - Includes dynamic viewBox scaling logic.
 * ==========================================================================
 */

// --- Crash Game Specific State & Constants ---
let crashGameActive = false;
let crashMultiplier = 1.00;
let crashTargetMultiplier = 1.00; // Multiplier where the game will actually crash
let crashInterval = null; // For the game loop using setInterval
let crashPlayerBet = 0;
let crashCashedOut = false;
let crashTimeStep = 0; // Counter for x-axis progression in the graph loop
const CRASH_UPDATE_INTERVAL = 100; // ms interval for game loop update
const INITIAL_VIEWBOX_WIDTH = 100; // Initial SVG viewbox width units
const INITIAL_VIEWBOX_HEIGHT = 100; // Initial SVG viewbox height units
let currentViewBox = { x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT }; // Current viewBox state
const VIEWBOX_PAN_THRESHOLD = 0.75; // Pan when point crosses 75% width/height
const CRASH_Y_SCALING_FACTOR = 15; // How fast line moves up vertically relative to multiplier (Lower = steeper visual climb for same multiplier)
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 1.50; // Default target, will be validated

// --- DOM Elements (Crash Game Specific) ---
let crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline;
let crashBetInput, crashBetButton, crashCashoutButton, crashStatusDisplay; // Renamed crashStatus
let crashAutoBetToggle, crashAutoCashoutInput, crashAutoCashoutToggle;

// --- API Reference (Passed from main.js) ---
let LocalBrokieAPI = null;

/**
 * Initializes the Crash game elements and event listeners.
 * Called by main.js on DOMContentLoaded, receives the API object.
 * @param {object} API - The BrokieAPI object from main.js.
 */
function initCrash(API) {
    console.log("Initializing Crash Game...");
    LocalBrokieAPI = API; // Store the API reference

    // Get DOM elements
    crashGraph = document.getElementById('crash-graph');
    crashMultiplierDisplay = document.getElementById('crash-multiplier');
    crashSvg = document.getElementById('crash-svg');
    crashGrid = document.getElementById('crash-grid');
    crashPolyline = document.getElementById('crash-polyline');
    crashBetInput = document.getElementById('crash-bet');
    crashBetButton = document.getElementById('crash-bet-button');
    crashCashoutButton = document.getElementById('crash-cashout-button');
    crashStatusDisplay = document.getElementById('crash-status'); // Use updated ID
    crashAutoBetToggle = document.getElementById('crash-auto-bet-toggle');
    crashAutoCashoutInput = document.getElementById('crash-auto-cashout-input');
    crashAutoCashoutToggle = document.getElementById('crash-auto-cashout-toggle');

    // Check if all essential elements and API were found
    if (!crashGraph || !crashMultiplierDisplay || !crashSvg || !crashGrid || !crashPolyline ||
        !crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay ||
        !crashAutoBetToggle || !crashAutoCashoutInput || !crashAutoCashoutToggle || !LocalBrokieAPI) {
        console.error("Crash Game initialization failed: Could not find all required DOM elements or API.");
        const gameArea = document.getElementById('game-crash');
        if(gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Crash Game elements.</p>';
        return; // Stop initialization
    }

    // Set initial state
    resetCrashVisuals(); // Includes drawing initial grid
    updateCrashAutoCashoutToggleVisuals(); // Set initial button/input state

    // Add Event Listeners
    crashBetButton.addEventListener('click', placeBetAndStart); // Renamed function for clarity
    crashCashoutButton.addEventListener('click', attemptCashOut);
    crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);

    // Listener for validating auto-cashout input when changed by user
    crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
    // Prevent non-numeric input (allow decimal)
    crashAutoCashoutInput.addEventListener('input', () => {
        // Allow only numbers and one decimal point
        crashAutoCashoutInput.value = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    });

    // Add bet adjustment listeners using the factory function from main.js API
    LocalBrokieAPI.addBetAdjustmentListeners('crash', crashBetInput);

    console.log("Crash Game Initialized.");
}

/**
 * Updates the background grid lines in the SVG based on the current viewbox.
 * @param {object} viewBox - The current SVG viewbox object {x, y, width, height}.
 */
function updateCrashGrid(viewBox) {
    if (!crashGrid || !viewBox) return;
    crashGrid.innerHTML = ''; // Clear existing grid lines
    const vb = viewBox;
    const numVerticalLines = 5; // Number of lines excluding edges
    const numHorizontalLines = 4; // Number of lines excluding edges

    // Draw vertical lines (Time axis)
    const xStep = vb.width / (numVerticalLines + 1);
    for (let i = 1; i <= numVerticalLines; i++) {
        const x = vb.x + i * xStep;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(2));
        line.setAttribute('y1', vb.y.toFixed(2));
        line.setAttribute('x2', x.toFixed(2));
        line.setAttribute('y2', (vb.y + vb.height).toFixed(2));
        line.setAttribute('class', 'grid-line'); // Style defined in CSS
        crashGrid.appendChild(line);
    }

    // Draw horizontal lines (Multiplier axis)
    const yStep = vb.height / (numHorizontalLines + 1);
    for (let i = 1; i <= numHorizontalLines; i++) {
        const y = vb.y + i * yStep; // Y increases downwards in SVG
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', vb.x.toFixed(2));
        line.setAttribute('y1', y.toFixed(2));
        line.setAttribute('x2', (vb.x + vb.width).toFixed(2));
        line.setAttribute('y2', y.toFixed(2));
        line.setAttribute('class', 'grid-line');
        crashGrid.appendChild(line);
    }
}

/**
 * Resets the crash game visuals (graph, multiplier display, buttons) to the starting state.
 */
function resetCrashVisuals() {
    if (!crashMultiplierDisplay || !crashSvg || !crashPolyline || !crashStatusDisplay || !crashBetButton || !crashCashoutButton || !crashBetInput) return;

    crashMultiplier = 1.00;
    crashTimeStep = 0;
    // Reset SVG viewbox
    currentViewBox = { x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT };
    crashSvg.setAttribute('viewBox', `0 0 ${INITIAL_VIEWBOX_WIDTH} ${INITIAL_VIEWBOX_HEIGHT}`);
    // Reset multiplier display
    crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset color/size classes
    crashMultiplierDisplay.style.fontSize = ''; // Reset font size if modified
    // Reset graph line
    crashPolyline.setAttribute('points', `0,${INITIAL_VIEWBOX_HEIGHT}`); // Start at bottom-left
    crashPolyline.style.stroke = '#0078d4'; // Reset to primary color (was green before)
    crashStatusDisplay.textContent = 'Place your bet for the next round!'; // Clear status message
    updateCrashGrid(currentViewBox); // Redraw initial grid

    // Reset button states (enable betting, disable cashout)
    crashBetButton.disabled = false;
    crashCashoutButton.disabled = true;
    crashBetInput.disabled = false;
    // Re-enable auto toggles/input based on their state
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // This handles enabling/disabling the input/toggle

}

/**
 * Calculates the target multiplier where the game will crash.
 * Uses a distribution favoring lower multipliers but allowing high ones.
 * @returns {number} The calculated crash multiplier (>= 1.00).
 */
function calculateCrashTarget() {
    const r = Math.random(); // Random number [0, 1)
    const houseEdgePercent = 1.0; // 1% house edge (adjust as needed)

    // Calculate crash point using inverse transform sampling for exponential distribution
    // Adjusted for house edge (ensures 1% chance of crashing exactly at 1.00x)
    if (r * 100 < houseEdgePercent) {
        return 1.00;
    }
    // Formula gives distribution where median is around 2x, but allows high values
    // 99 / (100 - houseEdgePercent) ensures the max value (100) corresponds to r=1
    let maxMultiplier = 99 / (100 - houseEdgePercent);
    let crashPoint = maxMultiplier / (1 - r);

    // Ensure minimum is 1.01 (if not instant crash) and round
    return Math.max(1.01, Math.floor(crashPoint * 100) / 100);
}


/**
 * Validates the bet amount and starts a new round of the crash game.
 */
function placeBetAndStart() {
    // Check elements exist
    if (!crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay || !crashAutoBetToggle || !crashAutoCashoutToggle || !crashAutoCashoutInput) {
        console.error("Cannot start Crash game, elements not initialized.");
        return;
    }

    if (crashGameActive) {
        LocalBrokieAPI.showMessage("Round already in progress.", 1500);
        return;
    }

    const betAmount = parseInt(crashBetInput.value);

    // Validate bet
    if (isNaN(betAmount) || betAmount < 1) {
        LocalBrokieAPI.showMessage("Please enter a valid positive bet amount.", 2000);
        return;
    }
    if (betAmount > LocalBrokieAPI.getBalance()) {
        LocalBrokieAPI.showMessage("Not enough balance! Try the loan button?", 2000);
        // If auto-betting, stop it
        if (isCrashAutoBetting) {
            stopCrashAutoBet();
        }
        return;
    }

    // --- Bet is valid, proceed ---
    LocalBrokieAPI.startTone(); // Ensure audio is ready
    crashPlayerBet = betAmount;
    LocalBrokieAPI.updateBalance(-betAmount); // Deduct bet amount immediately

    crashGameActive = true;
    crashCashedOut = false;
    crashTargetMultiplier = calculateCrashTarget(); // Determine crash point for this round
    resetCrashVisuals(); // Reset graph and multiplier display for new round
    crashStatusDisplay.innerHTML = `Bet Placed! Current Value: <span id="potential-win-amount" class="font-bold text-white">${LocalBrokieAPI.formatWin(crashPlayerBet)}</span>`;

    // Disable controls during game
    crashBetButton.disabled = true;
    crashCashoutButton.disabled = false; // Enable cashout
    crashBetInput.disabled = true;
    crashAutoBetToggle.disabled = true; // Disable auto-bet toggle during round
    crashAutoCashoutToggle.disabled = true; // Disable auto-cashout toggle during round
    crashAutoCashoutInput.disabled = true; // Disable input during round

    // Validate auto-cashout target *just before* starting if enabled
    if (isAutoCashoutEnabled) {
        validateAndUpdateAutoCashoutTarget(); // Validate and set the target
        // If validation failed inside, isAutoCashoutEnabled might be false now
    }

    // --- Start the Game Loop ---
    let pathPoints = [[0, INITIAL_VIEWBOX_HEIGHT]]; // Start path at bottom-left
    crashTimeStep = 0; // Reset time step

    if (crashInterval) clearInterval(crashInterval); // Clear any residual interval
    crashInterval = setInterval(() => {
        if (!crashGameActive) { // Stop loop if game ended externally
            clearInterval(crashInterval);
            crashInterval = null;
            return;
        }

        crashTimeStep++;

        // Calculate multiplier increment (increases faster at higher multipliers)
        const randomFactor = 0.8 + Math.random() * 0.4; // Add some variance
        const baseIncrement = 0.01 * Math.max(1, Math.pow(crashMultiplier, 0.35)); // Slower curve than before
        const increment = baseIncrement * randomFactor;
        crashMultiplier += increment;

        // Check for Auto Cashout Trigger
        if (isAutoCashoutEnabled && !crashCashedOut && crashMultiplier >= autoCashoutTarget) {
            // Check target again in case it was invalid initially
            if (autoCashoutTarget >= 1.01) {
                LocalBrokieAPI.showMessage(`Auto-cashed out at ${autoCashoutTarget.toFixed(2)}x!`, 2000);
                attemptCashOut(); // Attempt cashout automatically
                // attemptCashOut calls endCrashGame which clears the interval
                return; // Exit loop processing for this tick
            } else {
                // Disable auto-cashout for next round if target was invalid
                isAutoCashoutEnabled = false;
                updateCrashAutoCashoutToggleVisuals();
                LocalBrokieAPI.showMessage("Auto-cashout disabled due to invalid target.", 2000);
            }
        }

        // Check for Crash Condition
        if (crashMultiplier >= crashTargetMultiplier) {
            clearInterval(crashInterval); // Stop the game loop
            crashInterval = null;
            crashMultiplier = crashTargetMultiplier; // Set final multiplier to target

            // Update display and visuals for the crash moment
            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;

            // Calculate final point and update SVG viewbox to ensure line is visible
            const finalX = crashTimeStep * (INITIAL_VIEWBOX_WIDTH / 100); // Adjust calculation if needed
            const finalY = INITIAL_VIEWBOX_HEIGHT - Math.max(0, (crashMultiplier - 1) * CRASH_Y_SCALING_FACTOR);
            pathPoints.push([finalX, finalY]);
            adjustViewBoxAndRedraw(finalX, finalY, pathPoints); // Adjust viewbox and redraw

            if(crashPolyline) crashPolyline.style.stroke = '#e81123'; // Turn line red (fluent-danger)

            // End the game after a short delay to show the crash point
            setTimeout(() => endCrashGame(true, crashPlayerBet), 100); // Crashed = true
            return; // Exit loop
        }

        // --- Update display during active game ---
        if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
        const currentCashoutValue = Math.floor(crashPlayerBet * crashMultiplier);
        const potentialWinSpan = document.getElementById('potential-win-amount');
        if (potentialWinSpan) {
            potentialWinSpan.textContent = LocalBrokieAPI.formatWin(currentCashoutValue);
        } else if (crashStatusDisplay) { // Fallback if span somehow disappears
            crashStatusDisplay.innerHTML = `Current Value: <span id="potential-win-amount" class="font-bold text-white">${LocalBrokieAPI.formatWin(currentCashoutValue)}</span>`;
        }

        // Apply visual effects based on multiplier
        applyMultiplierVisuals();

        // Update graph line and viewbox dynamically
        const currentX = crashTimeStep * (INITIAL_VIEWBOX_WIDTH / 100); // Adjust if time scale changes
        const currentY = INITIAL_VIEWBOX_HEIGHT - Math.max(0, (crashMultiplier - 1) * CRASH_Y_SCALING_FACTOR);
        pathPoints.push([currentX, currentY]);
        adjustViewBoxAndRedraw(currentX, currentY, pathPoints); // Adjust viewbox and redraw

        // Play tick sound
        LocalBrokieAPI.playSound('crash_tick', crashMultiplier);

    }, CRASH_UPDATE_INTERVAL);
}

/**
 * Adjusts the SVG viewBox dynamically to keep the line visible and pans.
 * Redraws the grid and polyline based on the new viewbox.
 * @param {number} currentX - The current X coordinate of the line end.
 * @param {number} currentY - The current Y coordinate of the line end.
 * @param {Array<Array<number>>} pathPoints - The array of [x, y] points for the polyline.
 */
function adjustViewBoxAndRedraw(currentX, currentY, pathPoints) {
    if (!crashSvg || !crashPolyline) return;

    // Calculate required viewbox size to fit the current point with some padding
    const requiredWidth = Math.max(INITIAL_VIEWBOX_WIDTH, currentX * 1.1);
    const requiredHeight = Math.max(INITIAL_VIEWBOX_HEIGHT, (INITIAL_VIEWBOX_HEIGHT - currentY) * 1.1);

    // Determine target viewbox dimensions (expand if needed)
    let targetViewBoxWidth = Math.max(currentViewBox.width, requiredWidth);
    let targetViewBoxHeight = Math.max(currentViewBox.height, requiredHeight);

    // Determine target viewbox origin (pan if needed)
    // Pan rightwards if X crosses the threshold
    let targetViewBoxX = (currentX > currentViewBox.width * VIEWBOX_PAN_THRESHOLD)
                       ? currentX - currentViewBox.width * VIEWBOX_PAN_THRESHOLD
                       : currentViewBox.x;
    // Pan upwards (decrease Y origin) if Y crosses the threshold (Y=0 is top)
    let targetViewBoxY = (currentY < currentViewBox.height * (1 - VIEWBOX_PAN_THRESHOLD))
                       ? Math.max(0, INITIAL_VIEWBOX_HEIGHT - targetViewBoxHeight) // Adjust based on expanded height
                       : currentViewBox.y;

    // Clamp origin coordinates
    targetViewBoxX = Math.max(0, targetViewBoxX);
    targetViewBoxY = Math.max(0, targetViewBoxY);

    // Update viewbox state and SVG attribute
    currentViewBox = { x: targetViewBoxX, y: targetViewBoxY, width: targetViewBoxWidth, height: targetViewBoxHeight };
    crashSvg.setAttribute('viewBox', `${currentViewBox.x.toFixed(2)} ${currentViewBox.y.toFixed(2)} ${currentViewBox.width.toFixed(2)} ${currentViewBox.height.toFixed(2)}`);

    // Update polyline points
    crashPolyline.setAttribute('points', pathPoints.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' '));

    // Redraw grid for the new viewbox
    updateCrashGrid(currentViewBox);
}

/** Applies visual styles (color, size, shake) to the multiplier display based on its value. */
function applyMultiplierVisuals() {
     if (!crashMultiplierDisplay) return;

     const displaySpan = document.getElementById('potential-win-amount'); // Get span for potential win styling
     // Clear previous multiplier styles first
     crashMultiplierDisplay.className = ''; // Clear all classes
     crashMultiplierDisplay.classList.add('text-fluent-text-primary'); // Add back base text color
     crashMultiplierDisplay.style.fontSize = ''; // Reset font size
     if (displaySpan) displaySpan.className = 'font-bold text-white'; // Reset potential win color

     // Apply new styles based on current multiplier thresholds
     if (crashMultiplier >= 30) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-30x', 'mult-size-30x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-30x'; }
     else if (crashMultiplier >= 20) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-20x', 'mult-size-20x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-20x'; }
     else if (crashMultiplier >= 15) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-15x', 'mult-size-10x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-15x'; }
     else if (crashMultiplier >= 10) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-10x', 'mult-size-10x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-10x'; }
     else if (crashMultiplier >= 5) { crashMultiplierDisplay.classList.add('shake-subtle', 'mult-color-5x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-5x'; }
     else if (crashMultiplier >= 3) { crashMultiplierDisplay.classList.add('shake-subtle'); }
     // Add base class back if none of the above applied (optional, handled by reset)
     // else { crashMultiplierDisplay.classList.add('text-fluent-text-primary'); }
}


/**
 * Ends the crash game round, updates UI, calculates win/loss, and handles auto-bet.
 * @param {boolean} crashed - True if the game ended due to hitting the crash target.
 * @param {number} betAtEnd - The player's bet amount for this round.
 * @param {boolean} [stoppedByTabSwitch=false] - True if stopped because the user switched tabs.
 */
function endCrashGame(crashed, betAtEnd, stoppedByTabSwitch = false) {
    if (crashInterval) { // Ensure loop is stopped
        clearInterval(crashInterval);
        crashInterval = null;
    }
    // Only proceed if the game was active or stopped by tab switch
    if (!crashGameActive && !stoppedByTabSwitch) {
        // console.warn("endCrashGame called but game not active.");
        return; // Avoid ending multiple times
    }

    crashGameActive = false; // Mark game as inactive

    // Re-enable controls (check if elements exist first)
    if(crashBetButton) crashBetButton.disabled = false;
    if(crashCashoutButton) crashCashoutButton.disabled = true; // Disable cashout after round ends
    if(crashBetInput) crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Handles enabling/disabling input based on state

    // --- Handle Game Outcome ---
    if (crashed && !stoppedByTabSwitch) {
        // Player did not cash out in time
        if (!crashCashedOut) {
            LocalBrokieAPI.updateBalance(0); // No balance change, just update stats
            // Update totalLoss in main.js state via API if available, otherwise local (requires API)
            // totalLoss += betAtEnd; // This should be handled via API updateBalance if possible
            if(crashMultiplierDisplay) {
                crashMultiplierDisplay.textContent = `CRASH! ${crashTargetMultiplier.toFixed(2)}x`;
                crashMultiplierDisplay.className = 'text-fluent-danger'; // Red text for crash
            }
            if(crashPolyline) crashPolyline.style.stroke = '#e81123'; // Ensure line is red
            if(crashStatusDisplay) crashStatusDisplay.textContent = `Crashed! You lost ${LocalBrokieAPI.formatWin(betAtEnd)}.`;
            LocalBrokieAPI.playSound('crash_explode');
        } else {
             // Player cashed out before crash - message already shown
             if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Crashed @ ${crashTargetMultiplier.toFixed(2)}x)`;
             // Optionally play a different sound for crash after cashout
        }

    } else if (!crashed && crashCashedOut && !stoppedByTabSwitch) {
        // Player cashed out successfully (outcome handled in attemptCashOut)
        // Just ensure final state is clean
        if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Round ended)`; // Optional final status update

    } else if (stoppedByTabSwitch) {
        // Game stopped by switching tabs
        if (!crashCashedOut) {
            // Consider the bet lost if not cashed out
            LocalBrokieAPI.updateBalance(0); // No balance change, just update stats
             // totalLoss += betAtEnd; // Update stats
            if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped. Bet lost.";
        }
         // If cashed out just before switching, the win was already processed.
    }

    LocalBrokieAPI.saveGameState(); // Save state after round ends
    crashPlayerBet = 0; // Reset player bet for the round

    // Start next round if auto-bet is on and wasn't stopped by tab switch
    if (isCrashAutoBetting && !stoppedByTabSwitch) {
        setTimeout(placeBetAndStart, 1500); // Delay before starting next auto-bet round
    }
}

/**
 * Attempts to cash out the current crash game bet at the current multiplier.
 */
function attemptCashOut() {
    if (!crashGameActive || crashCashedOut || !crashCashoutButton) return; // Exit conditions

    crashCashedOut = true; // Mark as cashed out
    crashCashoutButton.disabled = true; // Disable button immediately

    const cashoutMultiplier = crashMultiplier; // Capture current multiplier
    const totalReturn = Math.floor(crashPlayerBet * cashoutMultiplier);
    const profit = totalReturn - crashPlayerBet;

    LocalBrokieAPI.updateBalance(totalReturn); // Add total return (bet + profit)
    LocalBrokieAPI.playSound('crash_cashout');

    if (profit > 0) {
        LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x! Won ${LocalBrokieAPI.formatWin(profit)}!`, 3000);
        LocalBrokieAPI.addWin('Crash', profit); // Add net win to leaderboard
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out! Won ${LocalBrokieAPI.formatWin(profit)}.`;
        if(crashMultiplierDisplay) { // Add visual effect for successful cashout
             crashMultiplierDisplay.classList.add('win-effect');
             setTimeout(() => crashMultiplierDisplay.classList.remove('win-effect'), 1000);
        }
    } else {
        LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x. No profit.`, 3000);
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out @ ${cashoutMultiplier.toFixed(2)}x.`;
    }

    // Note: The game loop continues until the actual crash point is reached,
    // but the player's outcome is now locked in. endCrashGame handles final cleanup.
}

/**
 * Stops the crash auto-bet feature and updates UI controls accordingly.
 */
function stopCrashAutoBet() {
    isCrashAutoBetting = false;
    if (crashAutoBetToggle) {
        crashAutoBetToggle.classList.remove('active');
        crashAutoBetToggle.textContent = 'Auto Bet Off';
    }
    // Re-enable controls only if the game is NOT currently active
    if (!crashGameActive) {
        if(crashBetButton) crashBetButton.disabled = false;
        if(crashBetInput) crashBetInput.disabled = false;
        if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
        if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
        updateCrashAutoCashoutToggleVisuals(); // Update input state
    }
}

/**
 * Toggles the crash auto-bet feature on or off and updates UI.
 * Starts a game immediately if toggled on and game is inactive.
 */
function toggleCrashAutoBet() {
    if (!crashAutoBetToggle) return;
    LocalBrokieAPI.playSound('click');
    isCrashAutoBetting = !isCrashAutoBetting;
    if (isCrashAutoBetting) {
        crashAutoBetToggle.classList.add('active');
        crashAutoBetToggle.textContent = 'Auto Bet ON';
        // If game is not active, start the first auto-bet round
        if (!crashGameActive) {
            placeBetAndStart();
        }
    } else {
        stopCrashAutoBet(); // Handles UI update and state change
    }
}

/**
 * Updates the visuals and disabled state of the auto-cashout input/toggle button.
 * Input is enabled only if auto-cashout is ON *and* the game is NOT active.
 */
function updateCrashAutoCashoutToggleVisuals() {
    if (!crashAutoCashoutToggle || !crashAutoCashoutInput) return;
    if (isAutoCashoutEnabled) {
        crashAutoCashoutToggle.classList.add('active'); // Use 'active' class from CSS
        crashAutoCashoutToggle.textContent = 'Disable'; // Text when enabled
        // Only enable input if game is not running
        crashAutoCashoutInput.disabled = crashGameActive;
    } else {
        crashAutoCashoutToggle.classList.remove('active');
        crashAutoCashoutToggle.textContent = 'Enable'; // Text when disabled
        crashAutoCashoutInput.disabled = true; // Always disable input when feature is off
    }
}

/**
 * Validates the auto-cashout target value when the input changes.
 */
function validateAndUpdateAutoCashoutTarget() {
    if (!crashAutoCashoutInput) return;
    const target = parseFloat(crashAutoCashoutInput.value);

    if (isNaN(target) || target < 1.01) {
        LocalBrokieAPI.showMessage("Invalid auto-cashout target. Must be >= 1.01", 2500);
        // Reset input to previous valid target or default if invalid
        crashAutoCashoutInput.value = autoCashoutTarget >= 1.01 ? autoCashoutTarget.toFixed(2) : '1.50';
        // Update the internal target to match the reset value
        autoCashoutTarget = parseFloat(crashAutoCashoutInput.value);
    } else {
        autoCashoutTarget = target;
        crashAutoCashoutInput.value = target.toFixed(2); // Format input
        // Optionally show confirmation message
        // LocalBrokieAPI.showMessage(`Auto-cashout target set to ${target.toFixed(2)}x`, 1500);
    }
}


/**
 * Toggles the crash auto-cashout feature on or off.
 */
function toggleCrashAutoCashout() {
    if (!crashAutoCashoutInput || !crashAutoCashoutToggle) return;
    LocalBrokieAPI.playSound('click');
    isAutoCashoutEnabled = !isAutoCashoutEnabled; // Toggle the state

    if (isAutoCashoutEnabled) {
        // When enabling, read the current value and validate it
        validateAndUpdateAutoCashoutTarget();
        // If validation failed, it might have reset the input and target,
        // but we keep the feature enabled for the user to correct it.
        LocalBrokieAPI.showMessage("Auto-cashout enabled. Set target value.", 2000);
    } else {
        // When disabling
        LocalBrokieAPI.showMessage("Auto-cashout disabled.", 2000);
        // autoCashoutTarget = 0; // Optionally reset target when disabling
    }
    updateCrashAutoCashoutToggleVisuals(); // Update button text and input disabled state
}

// Make init function available to main.js
// window.initCrash = initCrash; // This might cause issues if main.js loads later. Prefer calling from main.js.
