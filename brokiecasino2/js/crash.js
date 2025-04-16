/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v4 - Scaling/Log Fixes)
 *
 * - Uses BrokieAPI object.
 * - Fixed auto-cashout logic.
 * - Adjusted Y-axis rescaling trigger point (0.90).
 * - Added more specific logging for Y coordinates and auto-bet.
 * - Ensures polyline recalculation uses clamped values.
 * ==========================================================================
 */

// --- Crash Game Constants ---
const CRASH_MAX_TIME_MS = 15000;
const CRASH_UPDATE_INTERVAL_MS = 50;
const CRASH_STARTING_MAX_Y = 2.0;
const CRASH_Y_AXIS_PADDING_FACTOR = 1.15; // Keep padding factor
const CRASH_RESCALE_THRESHOLD = 0.90; // Rescale when multiplier hits 90% of max Y (Changed from 0.95)
const CRASH_GRID_LINES_X = 5;
const CRASH_GRID_LINES_Y = 4;
const SVG_VIEWBOX_WIDTH = 100;
const SVG_VIEWBOX_HEIGHT = 100;

// --- Crash Game State Variables ---
let crashGameActive = false;
let crashStartTime = null;
let currentMultiplier = 1.00;
let crashTargetMultiplier = 1.00;
let crashInterval = null;
let crashPlayerBet = 0;
let crashCashedOut = false;
let crashRawPointsData = []; // Store raw [elapsedTime, multiplier] pairs
let currentMaxYMultiplier = CRASH_STARTING_MAX_Y;
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 1.50;

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
    LocalBrokieAPI = API;

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

    if (!crashGraph || !crashMultiplierDisplay || !crashSvg || !crashGrid || !crashPolyline ||
        !crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay ||
        !crashAutoBetToggle || !crashAutoCashoutInput || !crashAutoCashoutToggle || !LocalBrokieAPI) {
        console.error("Crash Game initialization failed: Could not find all required DOM elements or API.");
        const gameArea = document.getElementById('game-crash');
        if(gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Crash Game elements.</p>';
        return;
    }

    resetCrashVisuals();
    updateCrashAutoCashoutToggleVisuals();

    crashBetButton.addEventListener('click', placeBetAndStart);
    crashCashoutButton.addEventListener('click', attemptCashOut);
    crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);
    crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
    crashAutoCashoutInput.addEventListener('input', () => {
        crashAutoCashoutInput.value = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    });

    LocalBrokieAPI.addBetAdjustmentListeners('crash', crashBetInput);
    console.log("Crash Initialized");
}

/**
 * Updates the background grid lines in the SVG based on the current Y-axis scale.
 */
function updateCrashGrid() {
    if (!crashGrid || !crashSvg) return;
    crashGrid.innerHTML = '';

    const width = SVG_VIEWBOX_WIDTH;
    const height = SVG_VIEWBOX_HEIGHT;
    const numVerticalLines = CRASH_GRID_LINES_X;
    const xStep = width / (numVerticalLines + 1);
    for (let i = 1; i <= numVerticalLines; i++) {
        const x = i * xStep;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(2)); line.setAttribute('y1', '0');
        line.setAttribute('x2', x.toFixed(2)); line.setAttribute('y2', height.toFixed(2));
        line.setAttribute('class', 'grid-line');
        crashGrid.appendChild(line);
    }

    const numHorizontalLines = CRASH_GRID_LINES_Y;
    const yMultiplierRange = Math.max(0.01, currentMaxYMultiplier - 1);
    // console.log(`Updating Grid: MaxY=${currentMaxYMultiplier.toFixed(2)}`); // DEBUG
    for (let i = 1; i <= numHorizontalLines; i++) {
        const multiplierValue = 1 + (i / (numHorizontalLines + 1)) * yMultiplierRange;
        const y = height - ((multiplierValue - 1) / yMultiplierRange) * height;
        // console.log(`Grid Line ${i}: Mult=${multiplierValue.toFixed(2)}, Y=${y.toFixed(2)}`); // DEBUG
        if (y >= 0 && y <= height) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0'); line.setAttribute('y1', y.toFixed(2));
            line.setAttribute('x2', width.toFixed(2)); line.setAttribute('y2', y.toFixed(2));
            line.setAttribute('class', 'grid-line');
            crashGrid.appendChild(line);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', '2'); text.setAttribute('y', (y - 1).toFixed(2));
            text.setAttribute('class', 'grid-label'); text.setAttribute('font-size', '4');
            text.setAttribute('fill', '#6a6a6a');
            text.textContent = `${multiplierValue.toFixed(1)}x`;
            crashGrid.appendChild(text);
        }
    }
}

/**
 * Resets the crash game visuals to the starting state.
 */
function resetCrashVisuals() {
    if (!crashMultiplierDisplay || !crashSvg || !crashPolyline || !crashStatusDisplay || !crashBetButton || !crashCashoutButton || !crashBetInput) return;
    if (crashInterval) clearInterval(crashInterval); crashInterval = null;

    crashGameActive = false; playerHasBet = false; crashCashedOut = false;
    crashMultiplier = 1.00;
    crashRawPointsData = [[0, 1.00]]; // Reset raw data points array with initial point
    crashPointsString = `0,${SVG_VIEWBOX_HEIGHT}`;
    currentMaxYMultiplier = CRASH_STARTING_MAX_Y;

    crashSvg.setAttribute('viewBox', `0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`);
    crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = 'text-fluent-text-primary';
    crashMultiplierDisplay.style.fontSize = '';
    crashPolyline.setAttribute('points', crashPointsString);
    crashPolyline.style.stroke = '#0078d4'; // Primary color
    crashStatusDisplay.textContent = 'Place your bet for the next round!';
    updateCrashGrid();

    crashBetButton.disabled = false;
    crashCashoutButton.disabled = true;
    crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals();
}

/**
 * Calculates the target multiplier where the game will crash.
 * @returns {number} The calculated crash multiplier (>= 1.00).
 */
function calculateCrashTarget() {
    const r = Math.random(); const houseEdgePercent = 1.0;
    if (r * 100 < houseEdgePercent) return 1.00;
    let maxMultiplier = 99 / (100 - houseEdgePercent);
    let crashPoint = maxMultiplier / (1 - r);
    return Math.max(1.01, Math.floor(crashPoint * 100) / 100);
}

/**
 * Validates the bet amount and starts a new round of the crash game.
 */
function placeBetAndStart() {
    // Basic validation and checks...
    if (!crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay || !LocalBrokieAPI) { console.error("Crash start failed: elements/API missing."); return; }
    if (crashGameActive) { LocalBrokieAPI.showMessage("Round in progress.", 1500); return; }
    const betAmount = parseInt(crashBetInput.value);
    if (isNaN(betAmount) || betAmount < 1) { LocalBrokieAPI.showMessage("Invalid bet.", 2000); if (isCrashAutoBetting) stopCrashAutoBet(); return; }
    if (betAmount > LocalBrokieAPI.getBalance()) { LocalBrokieAPI.showMessage("Insufficient balance.", 2000); if (isCrashAutoBetting) stopCrashAutoBet(); return; }

    // --- Start Game ---
    LocalBrokieAPI.startTone();
    crashPlayerBet = betAmount;
    LocalBrokieAPI.updateBalance(-betAmount);

    crashGameActive = true; crashCashedOut = false;
    crashTargetMultiplier = calculateCrashTarget();
    resetCrashVisuals(); // Reset graph visual state
    crashStatusDisplay.innerHTML = `Bet Placed! Value: <span id="potential-win-amount" class="font-bold text-white">${LocalBrokieAPI.formatWin(crashPlayerBet)}</span>`;

    // Disable controls
    crashBetButton.disabled = true; crashCashoutButton.disabled = false; crashBetInput.disabled = true;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = true;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = true;
    if(crashAutoCashoutInput) crashAutoCashoutInput.disabled = true;
    if (isAutoCashoutEnabled) validateAndUpdateAutoCashoutTarget();

    // --- Start Game Loop ---
    crashStartTime = Date.now();
    crashRawPointsData = [[0, 1.00]]; // Start with initial point for recalculation
    crashPointsString = `0,${SVG_VIEWBOX_HEIGHT}`; // Reset visual points string

    console.log(`Crash round started. Target: ${crashTargetMultiplier.toFixed(2)}x`);

    if (crashInterval) clearInterval(crashInterval);
    crashInterval = setInterval(() => {
        try {
            // console.log("Interval callback started"); // Keep this log minimal now
            if (!crashGameActive) { clearInterval(crashInterval); crashInterval = null; return; }

            const elapsedTime = Date.now() - crashStartTime;
            const timeFactor = elapsedTime / 1000;
            crashMultiplier = 1 + 0.06 * Math.pow(timeFactor, 1.65);
            crashMultiplier = Math.max(1.00, crashMultiplier);

            // Check for Auto Cashout
            if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && crashMultiplier >= autoCashoutTarget) {
                attemptCashOut(); return;
            }

            // Check for Crash
            const hasCrashed = crashMultiplier >= crashTargetMultiplier || elapsedTime >= CRASH_MAX_TIME_MS;
            if (hasCrashed) {
                clearInterval(crashInterval); crashInterval = null;
                crashMultiplier = Math.min(crashMultiplier, crashTargetMultiplier);
                if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
                // Add final point to raw data
                crashRawPointsData.push([elapsedTime, crashMultiplier]);
                // Recalculate final points string based on final scale
                const finalPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);
                if(crashPolyline) {
                    crashPolyline.setAttribute('points', finalPointsString);
                    crashPolyline.style.stroke = '#e81123'; // Red
                }
                setTimeout(() => endCrashGame(true, crashPlayerBet), 100);
                return;
            }

            // --- Update display during active game ---
            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
            const currentCashoutValue = Math.floor(crashPlayerBet * crashMultiplier);
            const potentialWinSpan = document.getElementById('potential-win-amount');
            if (potentialWinSpan) potentialWinSpan.textContent = LocalBrokieAPI.formatWin(currentCashoutValue);
            else if (crashStatusDisplay) crashStatusDisplay.innerHTML = `Value: <span id="potential-win-amount" class="font-bold text-white">${LocalBrokieAPI.formatWin(currentCashoutValue)}</span>`;

            applyMultiplierVisuals();

            // --- Update Graph Line ---
            let rescaleNeeded = false;
            // Rescale check using the threshold constant
            while (crashMultiplier >= currentMaxYMultiplier * CRASH_RESCALE_THRESHOLD) {
                currentMaxYMultiplier *= CRASH_Y_AXIS_PADDING_FACTOR;
                rescaleNeeded = true;
            }
            if (rescaleNeeded) {
                console.log("Rescaling Y axis to:", currentMaxYMultiplier.toFixed(2)); // DEBUG
                updateCrashGrid();
            }

            // Add current raw data point
            crashRawPointsData.push([elapsedTime, crashMultiplier]);

            // Recalculate the entire points string based on current scale
            const pointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);
            const lastPointY = parseFloat(pointsString.slice(pointsString.lastIndexOf(',') + 1)); // Get Y of last point

            console.log(`Loop Update: Time=${elapsedTime}ms, Mult=${crashMultiplier.toFixed(3)}, MaxY=${currentMaxYMultiplier.toFixed(2)}, LastY=${lastPointY.toFixed(2)}`); // Combined Log

            if(crashPolyline) {
                 crashPolyline.setAttribute('points', pointsString);
            } else {
                console.error("crashPolyline element lost during update!");
                clearInterval(crashInterval); crashInterval = null;
            }

            LocalBrokieAPI.playSound('crash_tick', crashMultiplier);

        } catch (error) {
            console.error("Error inside crash game loop:", error);
            clearInterval(crashInterval); crashInterval = null;
            crashGameActive = false;
            if(crashStatusDisplay) crashStatusDisplay.textContent = "Game error occurred!";
        }
    }, CRASH_UPDATE_INTERVAL_MS);
}

/**
 * Calculates the SVG points string from raw data based on the current Y scale.
 * @param {Array<Array<number>>} dataPoints - Array of [elapsedTime, multiplier] points.
 * @param {number} maxYMultiplier - The current maximum multiplier for the Y axis scale.
 * @returns {string} The SVG points string (e.g., "x1,y1 x2,y2 ...").
 */
function calculatePointsString(dataPoints, maxYMultiplier) {
    const yMultiplierRange = Math.max(0.01, maxYMultiplier - 1); // Denominator for scaling Y
    return dataPoints.map(point => {
        const elapsedTime = point[0];
        const multiplier = point[1];
        // Map time to X coordinate (0-100)
        const x = Math.min(SVG_VIEWBOX_WIDTH, (elapsedTime / CRASH_MAX_TIME_MS) * SVG_VIEWBOX_WIDTH);
        // Map multiplier (1 to maxYMultiplier) to Y coordinate (100 down to 0)
        const y = SVG_VIEWBOX_HEIGHT - ((multiplier - 1) / yMultiplierRange) * SVG_VIEWBOX_HEIGHT;
        // Clamp Y coordinate to stay within the 0-100 viewbox height
        const clampedY = Math.max(0, Math.min(SVG_VIEWBOX_HEIGHT, y));
        return `${x.toFixed(2)},${clampedY.toFixed(2)}`; // Use clamped Y
    }).join(' ');
}

/** Applies visual styles (color, size, shake) to the multiplier display based on its value. */
function applyMultiplierVisuals() {
     if (!crashMultiplierDisplay) return;
     const displaySpan = document.getElementById('potential-win-amount');
     crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset class
     crashMultiplierDisplay.style.fontSize = '';
     if (displaySpan) displaySpan.className = 'font-bold text-white';

     if (crashMultiplier >= 30) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-30x', 'mult-size-30x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-30x'; }
     else if (crashMultiplier >= 20) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-20x', 'mult-size-20x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-20x'; }
     else if (crashMultiplier >= 15) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-15x', 'mult-size-10x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-15x'; }
     else if (crashMultiplier >= 10) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-10x', 'mult-size-10x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-10x'; }
     else if (crashMultiplier >= 5) { crashMultiplierDisplay.classList.add('shake-subtle', 'mult-color-5x'); if (displaySpan) displaySpan.className = 'font-bold mult-color-5x'; }
     else if (crashMultiplier >= 3) { crashMultiplierDisplay.classList.add('shake-subtle'); }

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
            LocalBrokieAPI.updateBalance(0); // Update stats for loss
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
        console.log("Auto-bet: Condition met, scheduling next bet."); // DEBUG
        setTimeout(placeBetAndStart, 1500);
    } else {
         console.log(`Auto-bet: Condition NOT met. isCrashAutoBetting=${isCrashAutoBetting}, stoppedByTabSwitch=${stoppedByTabSwitch}`); // DEBUG
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

    LocalBrokieAPI.updateBalance(totalReturn);
    LocalBrokieAPI.playSound('crash_cashout');

    if (profit > 0) {
        LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x! Won ${LocalBrokieAPI.formatWin(profit)}!`, 3000);
        LocalBrokieAPI.addWin('Crash', profit);
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out! Won ${LocalBrokieAPI.formatWin(profit)}.`;
        if(crashMultiplierDisplay) {
             crashMultiplierDisplay.classList.add('win-effect'); // Assumes win-effect class exists in CSS
             setTimeout(() => { if(crashMultiplierDisplay) crashMultiplierDisplay.classList.remove('win-effect') }, 1000);
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
        // Reset input to previous valid target or default if invalid
        crashAutoCashoutInput.value = autoCashoutTarget >= 1.01 ? autoCashoutTarget.toFixed(2) : '1.50';
        // Update the internal target to match the reset value
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
