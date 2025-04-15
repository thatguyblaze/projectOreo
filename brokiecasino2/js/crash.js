/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v4 - User Logic + API Fix)
 *
 * - Uses the user's provided game logic (viewBox scaling, setInterval, etc.).
 * - Integrates with the BrokieAPI object passed from main.js.
 * - Handles all functionality related to the Crash game.
 * ==========================================================================
 */

// --- Crash Game Specific State & Constants ---
let crashGameActive = false;
let crashMultiplier = 1.00;
let crashTargetMultiplier = 1.00;
let crashInterval = null; // For the game loop using setInterval
let crashPlayerBet = 0;
let crashCashedOut = false;
let crashTimeStep = 0; // Counter for x-axis progression
const CRASH_UPDATE_INTERVAL = 100; // ms interval for game loop
const INITIAL_VIEWBOX_WIDTH = 100; // Initial SVG viewbox width
const INITIAL_VIEWBOX_HEIGHT = 100; // Initial SVG viewbox height
let currentViewBox = { x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT };
const VIEWBOX_PAN_THRESHOLD = 0.75; // Pan when point crosses 75% width/height (Increased from 0.5)
const CRASH_Y_SCALING_FACTOR = 15; // How fast line moves up visually relative to multiplier (Lower = steeper)
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 1.50; // Default target

// --- DOM Elements (Crash Game Specific) ---
let crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline;
let crashBetInput, crashBetButton, crashCashoutButton, crashStatusDisplay; // Renamed crashStatus
let crashAutoBetToggle, crashAutoCashoutInput, crashAutoCashoutToggle;

// --- API Reference (Passed from main.js) ---
let LocalBrokieAPI = null; // Will be set in initCrash

/**
 * Initializes the Crash game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
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
    crashBetButton.addEventListener('click', placeBetAndStart); // Renamed function
    crashCashoutButton.addEventListener('click', attemptCashOut);
    crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);

    // Listener for validating auto-cashout input when changed by user
    crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
    // Prevent non-numeric input (allow decimal)
    crashAutoCashoutInput.addEventListener('input', () => {
        crashAutoCashoutInput.value = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    });

    // Add bet adjustment listeners using the factory function from main.js API
    LocalBrokieAPI.addBetAdjustmentListeners('crash', crashBetInput);

    console.log("Crash Initialized.");
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

    // Draw vertical lines
    const xStep = vb.width / (numVerticalLines + 1);
    for (let i = 1; i <= numVerticalLines; i++) {
        const x = vb.x + i * xStep;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(2));
        line.setAttribute('y1', vb.y.toFixed(2));
        line.setAttribute('x2', x.toFixed(2));
        line.setAttribute('y2', (vb.y + vb.height).toFixed(2));
        line.setAttribute('class', 'grid-line');
        crashGrid.appendChild(line);
    }

    // Draw horizontal lines
    const yStep = vb.height / (numHorizontalLines + 1);
    for (let i = 1; i <= numHorizontalLines; i++) {
        const y = vb.y + i * yStep;
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
 * Resets the crash game visuals (graph, multiplier display) to the starting state.
 */
function resetCrashVisuals() {
    if (!crashMultiplierDisplay || !crashSvg || !crashPolyline || !crashStatusDisplay) return;

    crashMultiplier = 1.00;
    crashTimeStep = 0;
    // Reset SVG viewbox
    currentViewBox = { x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT };
    crashSvg.setAttribute('viewBox', `0 0 ${INITIAL_VIEWBOX_WIDTH} ${INITIAL_VIEWBOX_HEIGHT}`);
    // Reset multiplier display
    crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset classes
    crashMultiplierDisplay.style.fontSize = ''; // Reset font size
    // Reset graph line
    crashPointsString = `0,${INITIAL_VIEWBOX_HEIGHT}`; // Reset points string
    crashPolyline.setAttribute('points', crashPointsString); // Start at bottom-left
    crashPolyline.style.stroke = '#0078d4'; // Reset to primary color
    crashStatusDisplay.textContent = ''; // Clear status message
    updateCrashGrid(currentViewBox); // Redraw initial grid
}

/**
 * Calculates the target multiplier where the game will crash.
 * @returns {number} The calculated crash multiplier (>= 1.00).
 */
function calculateCrashTarget() {
    const r = Math.random();
    const houseEdgePercent = 1.0;
    if (r * 100 < houseEdgePercent) return 1.00;
    let maxMultiplier = 99 / (100 - houseEdgePercent);
    let crashPoint = maxMultiplier / (1 - r);
    return Math.max(1.01, Math.floor(crashPoint * 100) / 100);
}

/**
 * Validates the bet amount and starts a new round of the crash game.
 */
function placeBetAndStart() {
    if (!crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay || !LocalBrokieAPI) {
        console.error("Cannot start Crash game, elements or API not initialized.");
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
        if (isCrashAutoBetting) stopCrashAutoBet();
        return;
    }
    if (betAmount > LocalBrokieAPI.getBalance()) {
        LocalBrokieAPI.showMessage("Not enough balance! Try the loan button?", 2000);
        if (isCrashAutoBetting) stopCrashAutoBet();
        return;
    }

    // --- Bet is valid, proceed ---
    LocalBrokieAPI.startTone();
    crashPlayerBet = betAmount;
    LocalBrokieAPI.updateBalance(-betAmount); // Use API to update balance and stats

    crashGameActive = true;
    crashCashedOut = false;
    crashTargetMultiplier = calculateCrashTarget();
    resetCrashVisuals(); // Reset graph BEFORE starting loop
    crashStatusDisplay.innerHTML = `Bet Placed! Current Value: <span id="potential-win-amount" class="font-bold text-white">${LocalBrokieAPI.formatWin(crashPlayerBet)}</span>`;

    // Disable controls
    crashBetButton.disabled = true;
    crashCashoutButton.disabled = false;
    crashBetInput.disabled = true;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = true;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = true;
    if(crashAutoCashoutInput) crashAutoCashoutInput.disabled = true;

    // Validate auto-cashout target if enabled
    if (isAutoCashoutEnabled) {
        validateAndUpdateAutoCashoutTarget();
    }

    // --- Start the Game Loop ---
    crashStartTime = Date.now(); // Record start time
    crashPointsString = `0,${INITIAL_VIEWBOX_HEIGHT}`; // Ensure points string is reset

    console.log(`Crash round started. Target: ${crashTargetMultiplier.toFixed(2)}x`); // DEBUG

    if (crashInterval) clearInterval(crashInterval);
    crashInterval = setInterval(() => {
        if (!crashGameActive) {
            clearInterval(crashInterval); crashInterval = null; return;
        }

        crashTimeStep++; // Increment time step

        // Calculate multiplier increment (increases faster at higher multipliers)
        const randomFactor = 0.7 + Math.random() * 0.6; // Add some randomness
        const baseIncrement = 0.01 * Math.max(1, Math.pow(crashMultiplier, 0.4));
        const increment = baseIncrement * randomFactor;
        crashMultiplier += increment;

        // Check for Auto Cashout Trigger
        if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && crashMultiplier >= autoCashoutTarget) {
            LocalBrokieAPI.showMessage(`Auto-cashed out at ${autoCashoutTarget.toFixed(2)}x!`, 2000);
            attemptCashOut(); // Attempt cashout automatically
            return; // Exit loop processing for this tick
        }

        // Check for Crash
        if (crashMultiplier >= crashTargetMultiplier) {
            clearInterval(crashInterval); crashInterval = null;
            crashMultiplier = crashTargetMultiplier; // Set final multiplier to target

            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;

            // Calculate final point and update SVG viewbox/polyline
            const finalX = crashTimeStep * (INITIAL_VIEWBOX_WIDTH / 100); // Adjust if time scale needed
            const finalY = INITIAL_VIEWBOX_HEIGHT - Math.max(0, (crashMultiplier - 1) * CRASH_Y_SCALING_FACTOR);
            crashPointsString += ` ${finalX.toFixed(2)},${finalY.toFixed(2)}`; // Append final point
            adjustViewBoxAndRedraw(finalX, finalY); // Adjust viewbox

            if(crashPolyline) {
                crashPolyline.setAttribute('points', crashPointsString); // Set final points
                crashPolyline.style.stroke = '#e81123'; // Turn line red (fluent-danger)
            }

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
        const currentX = crashTimeStep * (INITIAL_VIEWBOX_WIDTH / 100); // Adjust if time scale needed
        const currentY = INITIAL_VIEWBOX_HEIGHT - Math.max(0, (crashMultiplier - 1) * CRASH_Y_SCALING_FACTOR);
        crashPointsString += ` ${currentX.toFixed(2)},${currentY.toFixed(2)}`; // Append current point

        adjustViewBoxAndRedraw(currentX, currentY); // Adjust viewbox and redraw

        if(crashPolyline) crashPolyline.setAttribute('points', crashPointsString); // Update polyline

        // Play tick sound based on multiplier
        LocalBrokieAPI.playSound('crash_tick', crashMultiplier);

    }, CRASH_UPDATE_INTERVAL);
}

/**
 * Adjusts the SVG viewBox dynamically to keep the line visible and pans.
 * Redraws the grid based on the new viewbox.
 * @param {number} currentX - The current X coordinate of the line end.
 * @param {number} currentY - The current Y coordinate of the line end.
 */
function adjustViewBoxAndRedraw(currentX, currentY) {
    if (!crashSvg) return;

    // Calculate required viewbox size based on current point
    // Add padding (e.g., 10%) to required dimensions
    const requiredWidth = Math.max(INITIAL_VIEWBOX_WIDTH, currentX * 1.1);
    const requiredHeight = Math.max(INITIAL_VIEWBOX_HEIGHT, (INITIAL_VIEWBOX_HEIGHT - currentY) * 1.1);

    // Determine target viewbox dimensions (expand if needed)
    let targetViewBoxWidth = Math.max(currentViewBox.width, requiredWidth);
    let targetViewBoxHeight = Math.max(currentViewBox.height, requiredHeight);

    // Determine target viewbox origin (pan if needed)
    // Pan rightwards if X crosses the threshold
    let targetViewBoxX = (currentX > currentViewBox.x + currentViewBox.width * VIEWBOX_PAN_THRESHOLD)
                       ? currentX - currentViewBox.width * VIEWBOX_PAN_THRESHOLD
                       : currentViewBox.x;
    // Pan upwards (decrease Y origin) if Y crosses the threshold (Y=0 is top)
    let targetViewBoxY = (currentY < currentViewBox.y + currentViewBox.height * (1 - VIEWBOX_PAN_THRESHOLD))
                       ? Math.max(0, INITIAL_VIEWBOX_HEIGHT - targetViewBoxHeight) // Adjust based on expanded height
                       : currentViewBox.y;

    // Clamp origin coordinates
    targetViewBoxX = Math.max(0, targetViewBoxX);
    targetViewBoxY = Math.max(0, targetViewBoxY);

    // Update viewbox state and SVG attribute only if changed significantly
    const dx = Math.abs(targetViewBoxX - currentViewBox.x);
    const dy = Math.abs(targetViewBoxY - currentViewBox.y);
    const dw = Math.abs(targetViewBoxWidth - currentViewBox.width);
    const dh = Math.abs(targetViewBoxHeight - currentViewBox.height);

    if (dx > 0.1 || dy > 0.1 || dw > 0.1 || dh > 0.1) { // Threshold to avoid minor updates
        currentViewBox = { x: targetViewBoxX, y: targetViewBoxY, width: targetViewBoxWidth, height: targetViewBoxHeight };
        crashSvg.setAttribute('viewBox', `${currentViewBox.x.toFixed(2)} ${currentViewBox.y.toFixed(2)} ${currentViewBox.width.toFixed(2)} ${currentViewBox.height.toFixed(2)}`);
        updateCrashGrid(currentViewBox); // Redraw grid for new viewbox
    }
}


/** Applies visual styles (color, size, shake) to the multiplier display based on its value. */
function applyMultiplierVisuals() {
     if (!crashMultiplierDisplay) return;

     const displaySpan = document.getElementById('potential-win-amount');
     // Clear previous multiplier styles first
     crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset to base class
     crashMultiplierDisplay.style.fontSize = ''; // Reset font size
     if (displaySpan) displaySpan.className = 'font-bold text-white'; // Reset potential win color

     // Apply new styles based on current multiplier thresholds
     if (crashMultiplier >= 30) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-30x', 'mult-size-30x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-30x'; }
     else if (crashMultiplier >= 20) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-20x', 'mult-size-20x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-20x'; }
     else if (crashMultiplier >= 15) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-15x', 'mult-size-10x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-15x'; }
     else if (crashMultiplier >= 10) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-10x', 'mult-size-10x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-10x'; }
     else if (crashMultiplier >= 5) { crashMultiplierDisplay.classList.add('shake-subtle', 'mult-color-5x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-5x'; }
     else if (crashMultiplier >= 3) { crashMultiplierDisplay.classList.add('shake-subtle'); }
     // Ensure base class remains if none apply
     if (!crashMultiplierDisplay.classList.contains('text-fluent-text-primary')) {
         crashMultiplierDisplay.classList.add('text-fluent-text-primary');
     }
}


/**
 * Ends the crash game round, updates UI, calculates win/loss, and handles auto-bet.
 * @param {boolean} crashed - True if the game ended due to hitting the crash target.
 * @param {number} betAtEnd - The player's bet amount for this round.
 * @param {boolean} [stoppedByTabSwitch=false] - True if stopped because the user switched tabs.
 */
function endCrashGame(crashed, betAtEnd, stoppedByTabSwitch = false) {
    if (crashInterval) { clearInterval(crashInterval); crashInterval = null; }
    if (!crashGameActive && !stoppedByTabSwitch) return;

    crashGameActive = false;

    // Re-enable controls
    if(crashBetButton) crashBetButton.disabled = false;
    if(crashCashoutButton) crashCashoutButton.disabled = true;
    if(crashBetInput) crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals();

    // --- Handle Game Outcome ---
    if (crashed && !stoppedByTabSwitch) {
        if (!crashCashedOut) {
            // Balance was already deducted, only update stats for loss
            LocalBrokieAPI.updateBalance(0); // Pass 0 to trigger stat update
            if(crashMultiplierDisplay) {
                crashMultiplierDisplay.textContent = `CRASH! ${crashTargetMultiplier.toFixed(2)}x`;
                crashMultiplierDisplay.className = 'text-fluent-danger'; // Red text
            }
            if(crashPolyline) crashPolyline.style.stroke = '#e81123'; // Red line
            if(crashStatusDisplay) crashStatusDisplay.textContent = `Crashed! You lost ${LocalBrokieAPI.formatWin(betAtEnd)}.`;
            LocalBrokieAPI.playSound('crash_explode');
        } else {
             if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Crashed @ ${crashTargetMultiplier.toFixed(2)}x)`;
        }
    } else if (!crashed && crashCashedOut && !stoppedByTabSwitch) {
        // Outcome handled in attemptCashOut
        if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Round ended)`;
    } else if (stoppedByTabSwitch) {
        if (!crashCashedOut) {
            LocalBrokieAPI.updateBalance(0); // Update stats for loss
            if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped. Bet lost.";
        }
    }

    LocalBrokieAPI.saveGameState();
    crashPlayerBet = 0;

    // Start next round if auto-bet is on
    if (isCrashAutoBetting && !stoppedByTabSwitch) {
        setTimeout(placeBetAndStart, 1500);
    }
}

/**
 * Attempts to cash out the current crash game bet at the current multiplier.
 */
function attemptCashOut() {
    if (!crashGameActive || crashCashedOut || !crashCashoutButton) return;

    crashCashedOut = true;
    crashCashoutButton.disabled = true;

    const cashoutMultiplier = crashMultiplier;
    const totalReturn = Math.floor(crashPlayerBet * cashoutMultiplier);
    const profit = totalReturn - crashPlayerBet;

    LocalBrokieAPI.updateBalance(totalReturn); // Add total return (bet + profit)
    LocalBrokieAPI.playSound('crash_cashout');

    if (profit > 0) {
        LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x! Won ${LocalBrokieAPI.formatWin(profit)}!`, 3000);
        LocalBrokieAPI.addWin('Crash', profit); // Use API to add win
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out! Won ${LocalBrokieAPI.formatWin(profit)}.`;
        if(crashMultiplierDisplay) {
             crashMultiplierDisplay.classList.add('win-effect'); // Assumes win-effect class exists in CSS
             setTimeout(() => crashMultiplierDisplay.classList.remove('win-effect'), 1000);
        }
    } else {
        LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x. No profit.`, 3000);
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out @ ${cashoutMultiplier.toFixed(2)}x.`;
    }
    // Game loop continues until actual crash
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
    if (!crashGameActive) { // Re-enable controls only if game stopped
        if(crashBetButton) crashBetButton.disabled = false;
        if(crashBetInput) crashBetInput.disabled = false;
        if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
        if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
        updateCrashAutoCashoutToggleVisuals();
    }
}

/**
 * Toggles the crash auto-bet feature on or off and updates UI.
 */
function toggleCrashAutoBet() {
    if (!crashAutoBetToggle) return;
    LocalBrokieAPI.playSound('click');
    isCrashAutoBetting = !isCrashAutoBetting;
    if (isCrashAutoBetting) {
        crashAutoBetToggle.classList.add('active');
        crashAutoBetToggle.textContent = 'Auto Bet ON';
        if (!crashGameActive) {
            placeBetAndStart(); // Start game immediately if toggled on
        }
    } else {
        stopCrashAutoBet();
    }
}

/**
 * Updates the visuals and disabled state of the auto-cashout input/toggle button.
 */
function updateCrashAutoCashoutToggleVisuals() {
    if (!crashAutoCashoutToggle || !crashAutoCashoutInput) return;
    if (isAutoCashoutEnabled) {
        crashAutoCashoutToggle.classList.add('active');
        crashAutoCashoutToggle.textContent = 'Disable';
        crashAutoCashoutInput.disabled = crashGameActive; // Enable if game not active
    } else {
        crashAutoCashoutToggle.classList.remove('active');
        crashAutoCashoutToggle.textContent = 'Enable';
        crashAutoCashoutInput.disabled = true; // Always disable if feature off
    }
}

/**
 * Validates the auto-cashout target value when the input changes or before game start.
 * @returns {boolean} True if the value is valid, false otherwise.
 */
function validateAndUpdateAutoCashoutTarget() {
    if (!crashAutoCashoutInput) return false;
    const target = parseFloat(crashAutoCashoutInput.value);

    if (isNaN(target) || target < 1.01) {
        LocalBrokieAPI.showMessage("Invalid auto-cashout target. Must be >= 1.01", 2500);
        crashAutoCashoutInput.value = autoCashoutTarget >= 1.01 ? autoCashoutTarget.toFixed(2) : '1.50';
        autoCashoutTarget = parseFloat(crashAutoCashoutInput.value);
        return false; // Indicate validation failed
    } else {
        autoCashoutTarget = target;
        crashAutoCashoutInput.value = target.toFixed(2); // Format input
        return true; // Indicate validation passed
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
        // When enabling, just update visuals. Validation happens on input change or game start.
        LocalBrokieAPI.showMessage("Auto-cashout enabled. Set target value.", 2000);
    } else {
        // When disabling
        LocalBrokieAPI.showMessage("Auto-cashout disabled.", 2000);
    }
    updateCrashAutoCashoutToggleVisuals(); // Update button text and input disabled state
}

// Make init function available to main.js via the BrokieAPI object structure if preferred,
// but main.js currently calls initCrash directly.
