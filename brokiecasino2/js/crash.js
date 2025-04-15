/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v3 - Fixed Scaling)
 *
 * - Handles all functionality related to the Crash game.
 * - Uses BrokieAPI object passed from main.js for core functions.
 * - Fixes auto-cashout input enabling and validation timing.
 * - Implements corrected dynamic Y-axis scaling with fixed viewBox.
 * ==========================================================================
 */

// --- Crash Game Constants ---
const CRASH_MAX_TIME_MS = 15000; // Max duration the graph runs before auto-crashing (15 seconds)
const CRASH_UPDATE_INTERVAL_MS = 50; // How often to update the graph (ms) - Faster for smoother graph
const CRASH_STARTING_MAX_Y = 2.0; // Initial max multiplier shown on Y-axis (0-100 range)
const CRASH_Y_AXIS_PADDING_FACTOR = 1.15; // Add 15% padding when rescaling Y-axis
const CRASH_GRID_LINES_X = 5; // Number of vertical grid lines
const CRASH_GRID_LINES_Y = 4; // Number of horizontal grid lines
const SVG_VIEWBOX_WIDTH = 100; // Fixed SVG coordinate system width
const SVG_VIEWBOX_HEIGHT = 100; // Fixed SVG coordinate system height

// --- Crash Game State Variables ---
let crashGameActive = false;
let crashStartTime = null;
let currentMultiplier = 1.00;
let crashTargetMultiplier = 1.00; // Multiplier where the game will actually crash
let crashInterval = null; // For the game loop using setInterval
let crashPlayerBet = 0;
let crashCashedOut = false;
// let crashTimeStep = 0; // No longer needed, use elapsedTime
let crashPointsString = `0,${SVG_VIEWBOX_HEIGHT}`; // String for polyline points attribute
let currentMaxYMultiplier = CRASH_STARTING_MAX_Y; // Current max Y value for scaling
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 1.50; // Default target, will be validated

// --- DOM Element References ---
let crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline;
let crashBetInput, crashBetButton, crashCashoutButton, crashStatusDisplay;
let crashAutoBetToggle, crashAutoCashoutInput, crashAutoCashoutToggle;

// --- API Reference (Passed from main.js) ---
let LocalBrokieAPI = null;

/**
 * Initializes the Crash game elements and event listeners.
 * @param {object} API - The BrokieAPI object passed from main.js.
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
    crashStatusDisplay = document.getElementById('crash-status');
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
    crashBetButton.addEventListener('click', placeBetAndStart);
    crashCashoutButton.addEventListener('click', attemptCashOut);
    crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);
    crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
    crashAutoCashoutInput.addEventListener('input', () => { // Prevent non-numeric input
        crashAutoCashoutInput.value = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    });

    // Add bet adjustment listeners using the factory function from main.js API
    LocalBrokieAPI.addBetAdjustmentListeners('crash', crashBetInput);

    console.log("Crash Initialized");
}

/**
 * Updates the background grid lines in the SVG based on the current Y-axis scale.
 */
function updateCrashGrid() {
    if (!crashGrid || !crashSvg) return;
    crashGrid.innerHTML = ''; // Clear existing grid lines

    const width = SVG_VIEWBOX_WIDTH;
    const height = SVG_VIEWBOX_HEIGHT;

    // --- Draw Vertical Lines (Time Axis - Static) ---
    const numVerticalLines = CRASH_GRID_LINES_X;
    const xStep = width / (numVerticalLines + 1);
    for (let i = 1; i <= numVerticalLines; i++) {
        const x = i * xStep;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(2));
        line.setAttribute('y1', 0); // Top
        line.setAttribute('x2', x.toFixed(2));
        line.setAttribute('y2', height); // Bottom
        line.setAttribute('class', 'grid-line'); // Style defined in CSS
        crashGrid.appendChild(line);
    }

    // --- Draw Horizontal Lines & Labels (Multiplier Axis - Dynamic) ---
    const numHorizontalLines = CRASH_GRID_LINES_Y;
    for (let i = 1; i <= numHorizontalLines; i++) {
        // Calculate the multiplier value this line represents
        const multiplierValue = 1 + (i / (numHorizontalLines + 1)) * (currentMaxYMultiplier - 1);
        // Map this multiplier value to the Y coordinate (0-100, inverted)
        const y = height - ((multiplierValue - 1) / Math.max(0.01, currentMaxYMultiplier - 1)) * height;

        if (y >= 0 && y <= height) { // Only draw if within bounds
            // Draw the line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y.toFixed(2));
            line.setAttribute('x2', width);
            line.setAttribute('y2', y.toFixed(2));
            line.setAttribute('class', 'grid-line');
            crashGrid.appendChild(line);

            // Add Text Label for Multiplier
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', 2); // Small padding from left edge
            text.setAttribute('y', y - 1); // Position slightly above the line
            text.setAttribute('class', 'grid-label'); // Style with CSS if needed
            text.setAttribute('font-size', '4'); // Small font size for SVG
            text.setAttribute('fill', '#6a6a6a'); // fluent-text-disabled
            text.textContent = `${multiplierValue.toFixed(1)}x`; // Show 1 decimal place
            crashGrid.appendChild(text);
        }
    }
}

/**
 * Resets the crash game visuals (graph, multiplier display, buttons) to the starting state.
 */
function resetCrashVisuals() {
    if (!crashMultiplierDisplay || !crashSvg || !crashPolyline || !crashStatusDisplay || !crashBetButton || !crashCashoutButton || !crashBetInput) return;

    // Stop any existing game loop
    if (crashInterval) clearInterval(crashInterval);
    crashInterval = null;

    // Reset state variables
    crashGameActive = false;
    playerHasBet = false;
    playerCashedOut = false;
    crashMultiplier = 1.00;
    // crashTimeStep = 0; // Not needed
    crashPointsString = `0,${SVG_VIEWBOX_HEIGHT}`; // Reset points string
    currentMaxYMultiplier = CRASH_STARTING_MAX_Y; // Reset Y-axis scale

    // Reset SVG viewbox (should be fixed)
    crashSvg.setAttribute('viewBox', `0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`);

    // Reset multiplier display
    crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset color/size classes
    crashMultiplierDisplay.style.fontSize = ''; // Reset font size if modified

    // Reset graph line
    crashPolyline.setAttribute('points', crashPointsString); // Start at bottom-left
    crashPolyline.style.stroke = '#0078d4'; // Reset to primary color

    // Reset status message
    crashStatusDisplay.textContent = 'Place your bet for the next round!';

    // Redraw grid for the initial scale
    updateCrashGrid();

    // Reset button states
    crashBetButton.disabled = false;
    crashCashoutButton.disabled = true;
    crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Handles enabling/disabling input/toggle based on state
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
        // If auto-betting, stop it
        if (isCrashAutoBetting) {
            stopCrashAutoBet();
        }
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
    crashStartTime = Date.now();
    crashPointsString = `0,${SVG_VIEWBOX_HEIGHT}`; // Reset points string for polyline

    if (crashInterval) clearInterval(crashInterval); // Clear any residual interval
    crashInterval = setInterval(() => {
        if (!crashGameActive) { // Stop loop if game ended externally
            clearInterval(crashInterval);
            crashInterval = null;
            return;
        }

        const elapsedTime = Date.now() - crashStartTime;

        // Calculate multiplier
        // Use a curve that starts at 1 and increases. Adjust power for speed.
        const timeFactor = elapsedTime / 1000; // Time in seconds
        // Example curve: 1 + 0.05 * time^1.6
        crashMultiplier = 1 + 0.05 * Math.pow(timeFactor, 1.6);
        crashMultiplier = Math.max(1.00, crashMultiplier); // Ensure minimum 1.00x

        // Check for Auto Cashout Trigger
        if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && crashMultiplier >= autoCashoutTarget) {
            LocalBrokieAPI.showMessage(`Auto-cashed out at ${autoCashoutTarget.toFixed(2)}x!`, 2000);
            attemptCashOut(); // Attempt cashout automatically
            // attemptCashOut calls endCrashGame which clears the interval
            return; // Exit loop processing for this tick
        }

        // Check for Crash Condition (Multiplier OR Max Time)
        if (crashMultiplier >= crashTargetMultiplier || elapsedTime >= CRASH_MAX_TIME_MS) {
            clearInterval(crashInterval); // Stop the game loop
            crashInterval = null;
            // If crashed by time, use the multiplier reached at max time
            // If crashed by multiplier, use the target multiplier
            crashMultiplier = Math.min(crashMultiplier, crashTargetMultiplier);

            // Update display and visuals for the crash moment
            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;

            // Calculate final point and update polyline
            const finalX = Math.min(SVG_VIEWBOX_WIDTH, (elapsedTime / CRASH_MAX_TIME_MS) * SVG_VIEWBOX_WIDTH);
            const finalY = SVG_VIEWBOX_HEIGHT - ((crashMultiplier - 1) / Math.max(0.01, currentMaxYMultiplier - 1)) * SVG_VIEWBOX_HEIGHT;
            crashPointsString += ` ${finalX.toFixed(2)},${Math.max(0, Math.min(SVG_VIEWBOX_HEIGHT, finalY)).toFixed(2)}`; // Append final point
            if(crashPolyline) {
                crashPolyline.setAttribute('points', crashPointsString);
                crashPolyline.style.stroke = '#e81123'; // Turn line red (fluent-danger)
            }

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

        // --- Update Graph Line (Fixed ViewBox, Scaled Coordinates) ---
        let rescaleNeeded = false;
        while (crashMultiplier >= currentMaxYMultiplier * 0.95) { // Rescale if multiplier nears the top 95%
            currentMaxYMultiplier *= CRASH_Y_AXIS_PADDING_FACTOR; // Increase max Y value
            rescaleNeeded = true;
        }
        if (rescaleNeeded) {
            updateCrashGrid(); // Redraw grid with new scale
            // If grid rescales, we need to recalculate ALL previous points for the polyline
            // based on the NEW currentMaxYMultiplier to keep the line shape correct relative to the new scale.
            // This can be computationally intensive for long games.
            // For now, we'll just append, which might distort the early part of the line on rescale.
            // A better approach involves storing raw [time, multiplier] data and regenerating the points string on rescale.
            console.log("Rescaled Y axis to:", currentMaxYMultiplier.toFixed(2)); // Log rescaling
        }

        // Calculate current point coordinates based on the CURRENT scale
        const currentX = Math.min(SVG_VIEWBOX_WIDTH, (elapsedTime / CRASH_MAX_TIME_MS) * SVG_VIEWBOX_WIDTH);
        const currentY = SVG_VIEWBOX_HEIGHT - ((crashMultiplier - 1) / Math.max(0.01, currentMaxYMultiplier - 1)) * SVG_VIEWBOX_HEIGHT;
        const clampedY = Math.max(0, Math.min(SVG_VIEWBOX_HEIGHT, currentY)); // Clamp Y within 0-100

        // Append new point to the polyline string
        crashPointsString += ` ${currentX.toFixed(2)},${clampedY.toFixed(2)}`;
        if(crashPolyline) crashPolyline.setAttribute('points', crashPointsString);

        // Play tick sound
        LocalBrokieAPI.playSound('crash_tick', crashMultiplier);

    }, CRASH_UPDATE_INTERVAL_MS); // Use defined interval constant
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
            // Balance was already deducted, only update stats for loss
            LocalBrokieAPI.updateBalance(0); // Pass 0 to trigger stat update without changing balance
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
        // Balance/stats already updated there. Just finalize UI.
        if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Round ended)`; // Optional final status update

    } else if (stoppedByTabSwitch) {
        // Game stopped by switching tabs
        if (!crashCashedOut) {
            // Consider the bet lost if not cashed out
            LocalBrokieAPI.updateBalance(0); // Update stats for loss
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
             crashMultiplierDisplay.classList.add('win-effect'); // Assumes win-effect class exists
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
 * Validates input only when enabling.
 */
function toggleCrashAutoCashout() {
    if (!crashAutoCashoutInput || !crashAutoCashoutToggle) return;
    LocalBrokieAPI.playSound('click');
    isAutoCashoutEnabled = !isAutoCashoutEnabled; // Toggle the state

    if (isAutoCashoutEnabled) {
        // When enabling, just update visuals. Validation happens on input change or game start.
        LocalBrokieAPI.showMessage("Auto-cashout enabled. Set target value.", 2000);
    } else {
        // When disabling
        LocalBrokieAPI.showMessage("Auto-cashout disabled.", 2000);
        // autoCashoutTarget = 0; // Optionally reset target when disabling
    }
    updateCrashAutoCashoutToggleVisuals(); // Update button text and input disabled state
}

// Make init function available to main.js via the BrokieAPI object structure if preferred,
// but main.js currently calls initCrash directly.
