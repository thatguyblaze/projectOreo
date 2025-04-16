/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v6.1 - NaN, Interval, & saveGameState Fix)
 *
 * - Uses BrokieAPI object.
 * - Fixed auto-cashout logic.
 * - Fixed Y-axis scaling logic + uses clipPath.
 * - Uses requestAnimationFrame loop.
 * - Fixed NaN issue in polyline points calculation.
 * - Removed obsolete crashInterval references.
 * - Added check for LocalBrokieAPI.saveGameState before calling.
 * - Kept console logging for debugging.
 * ==========================================================================
 */

// --- Crash Game Constants ---
const CRASH_MAX_TIME_MS = 15000;
// const CRASH_UPDATE_INTERVAL_MS = 50; // Target interval (RAF controls actual timing)
const CRASH_STARTING_MAX_Y = 2.0;
const CRASH_Y_AXIS_PADDING_FACTOR = 1.15;
const CRASH_RESCALE_THRESHOLD = 0.90;
const CRASH_GRID_LINES_X = 5;
const CRASH_GRID_LINES_Y = 4;
const SVG_VIEWBOX_WIDTH = 100;
const SVG_VIEWBOX_HEIGHT = 100;

// --- Crash Game State Variables ---
let crashGameActive = false;
let crashStartTime = null;
let currentMultiplier = 1.00;
let crashTargetMultiplier = 1.00;
let crashAnimationId = null; // ID for requestAnimationFrame
let crashPlayerBet = 0;
let crashCashedOut = false;
let crashRawPointsData = [];
let currentMaxYMultiplier = CRASH_STARTING_MAX_Y;
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 1.50;
let playerHasBet = false; // Added missing variable declaration
let crashPointsString = ''; // Added missing variable declaration


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

    // Check if API object was passed correctly
    if (!LocalBrokieAPI) {
        console.error("Crash Game initialization failed: BrokieAPI object not provided.");
        const gameArea = document.getElementById('game-crash');
        if(gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Crash Game: API missing.</p>';
        return;
    }

    if (!assignCrashDOMElements()) return;

    resetCrashVisuals();
    updateCrashAutoCashoutToggleVisuals();
    setupCrashEventListeners();

    // Check if addBetAdjustmentListeners exists before calling
    if (LocalBrokieAPI && typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
        LocalBrokieAPI.addBetAdjustmentListeners('crash', crashBetInput);
    } else {
         console.warn("LocalBrokieAPI.addBetAdjustmentListeners is not a function. Bet adjustment listeners not added.");
    }
    console.log("Crash Initialized");
}

/** Assigns and checks essential DOM elements for the Crash game. */
function assignCrashDOMElements() {
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
        !crashAutoBetToggle || !crashAutoCashoutInput || !crashAutoCashoutToggle) {
        console.error("Crash Game initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-crash');
        if(gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Crash Game elements.</p>';
        return false;
    }
    return true;
}

/** Sets up event listeners for Crash game controls. */
function setupCrashEventListeners() {
    if(crashBetButton) crashBetButton.addEventListener('click', placeBetAndStart);
    if(crashCashoutButton) crashCashoutButton.addEventListener('click', attemptCashOut);
    if(crashAutoBetToggle) crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);
    if(crashAutoCashoutInput) {
        crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
        crashAutoCashoutInput.addEventListener('input', () => {
            // Allow only numbers and one decimal point
            crashAutoCashoutInput.value = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        });
    }
}


/**
 * Updates the background grid lines in the SVG based on the current Y-axis scale.
 */
function updateCrashGrid() {
    if (!crashGrid || !crashSvg) return;
    crashGrid.innerHTML = ''; // Clear existing grid lines

    const width = SVG_VIEWBOX_WIDTH;
    const height = SVG_VIEWBOX_HEIGHT;

    // --- Vertical Lines (Time) ---
    const numVerticalLines = CRASH_GRID_LINES_X;
    const xStep = width / (numVerticalLines + 1);
    for (let i = 1; i <= numVerticalLines; i++) {
        const x = i * xStep;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x.toFixed(2)); line.setAttribute('y1', '0');
        line.setAttribute('x2', x.toFixed(2)); line.setAttribute('y2', height.toFixed(2));
        line.setAttribute('class', 'grid-line'); // Apply CSS class for styling
        crashGrid.appendChild(line);
    }

    // --- Horizontal Lines (Multiplier) ---
    const numHorizontalLines = CRASH_GRID_LINES_Y;
    const yMultiplierRange = Math.max(0.01, currentMaxYMultiplier - 1); // Avoid division by zero or negative range

    for (let i = 1; i <= numHorizontalLines; i++) {
        // Calculate the multiplier value this line represents
        const multiplierValue = 1 + (i / (numHorizontalLines + 1)) * yMultiplierRange;
        // Calculate the Y coordinate in SVG space (0 is top, height is bottom)
        const y = height - ((multiplierValue - 1) / yMultiplierRange) * height;

        // Only draw lines within the visible area
        if (y >= 0 && y <= height) {
            // Draw the grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0'); line.setAttribute('y1', y.toFixed(2));
            line.setAttribute('x2', width.toFixed(2)); line.setAttribute('y2', y.toFixed(2));
            line.setAttribute('class', 'grid-line'); // Apply CSS class
            crashGrid.appendChild(line);

            // Add the text label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', '2'); // Small padding from the left edge
            text.setAttribute('y', (y - 1).toFixed(2)); // Position slightly above the line
            text.setAttribute('class', 'grid-label'); // Apply CSS class for styling
            text.setAttribute('font-size', '4'); // Adjust font size as needed
            text.setAttribute('fill', '#6a6a6a'); // Text color
            text.textContent = `${multiplierValue.toFixed(1)}x`; // Format the label
            crashGrid.appendChild(text);
        }
    }
}

/**
 * Resets the crash game visuals to the starting state.
 * IMPORTANT: Sets crashGameActive to false.
 */
function resetCrashVisuals() {
    if (!crashMultiplierDisplay || !crashSvg || !crashPolyline || !crashStatusDisplay || !crashBetButton || !crashCashoutButton || !crashBetInput) {
        console.error("Cannot reset visuals: Essential DOM elements missing.");
        return;
    }

    // Stop any existing game loop
    if (crashAnimationId) cancelAnimationFrame(crashAnimationId); // Use cancelAnimationFrame
    crashAnimationId = null;

    // Reset state variables
    crashGameActive = false; // Crucial: Mark as inactive during reset
    playerHasBet = false; // Reset bet status
    crashCashedOut = false;
    currentMultiplier = 1.00;
    crashRawPointsData = [[0, 1.00]]; // Reset raw data points array with starting point
    currentMaxYMultiplier = CRASH_STARTING_MAX_Y; // Reset Y-axis scale
    crashPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier); // Calculate initial points string

    // Reset SVG and display elements
    crashSvg.setAttribute('viewBox', `0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`);
    crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset color/effects
    crashMultiplierDisplay.style.fontSize = ''; // Reset font size
    crashPolyline.setAttribute('points', crashPointsString); // Set initial point
    crashPolyline.style.stroke = '#0078d4'; // Reset to primary color
    crashStatusDisplay.textContent = 'Place your bet for the next round!';
    updateCrashGrid(); // Update grid for the reset scale

    // Reset button states
    crashBetButton.disabled = false;
    crashCashoutButton.disabled = true;
    crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Updates input based on toggle state
}

/**
 * Calculates the target multiplier where the game will crash.
 * Uses a common formula for provably fair crash games.
 * @returns {number} The calculated crash multiplier (>= 1.00).
 */
function calculateCrashTarget() {
    // Constants for the crash calculation (adjust houseEdgePercent as needed)
    const houseEdgePercent = 1.0; // Example: 1% house edge
    const e = 2 ** 52; // Maximum value for Math.random() precision

    // Generate a random float for the crash point calculation
    const h = Math.random();

    // Calculate the crash point using the formula
    // This formula ensures a distribution where lower multipliers are more common
    // and includes the house edge.
    if (h * 100 < houseEdgePercent) {
        return 1.00; // Instant crash based on house edge probability
    }

    // Calculate the crash point for non-instant crashes
    // Formula: E / (E - H) * (1 - houseEdge / 100)
    // Simplified: 1 / (1 - H) * (1 - houseEdge / 100)
    // Further simplified for calculation: (100 / (100 - houseEdge)) / (1 - H)
    let maxMultiplier = 99 / (100 - houseEdgePercent); // Adjusted max based on edge
    let crashPoint = maxMultiplier / (1 - h);

    // Ensure the crash point is at least 1.01 and round to 2 decimal places
    return Math.max(1.01, Math.floor(crashPoint * 100) / 100);
}


/**
 * Validates the bet amount and starts a new round of the crash game.
 */
function placeBetAndStart() {
    if (!crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay || !LocalBrokieAPI) { console.error("Crash start failed: elements/API missing."); return; }
    if (crashGameActive) {
        if (typeof LocalBrokieAPI.showMessage === 'function') LocalBrokieAPI.showMessage("Round already in progress.", 1500);
        return;
    }

    const betAmount = parseInt(crashBetInput.value);

    // --- Validate Bet ---
    if (isNaN(betAmount) || betAmount < 1) {
        if (typeof LocalBrokieAPI.showMessage === 'function') LocalBrokieAPI.showMessage("Invalid bet amount. Minimum is 1.", 2000);
        if (isCrashAutoBetting) stopCrashAutoBet(); // Stop auto-bet if bet is invalid
        return;
    }
    const currentBalance = (typeof LocalBrokieAPI.getBalance === 'function') ? LocalBrokieAPI.getBalance() : 0;
    if (betAmount > currentBalance) {
        if (typeof LocalBrokieAPI.showMessage === 'function') LocalBrokieAPI.showMessage("Insufficient balance.", 2000);
        if (isCrashAutoBetting) stopCrashAutoBet(); // Stop auto-bet if insufficient funds
        return;
    }

    // --- Bet is valid, proceed ---
    if (typeof LocalBrokieAPI.startTone === 'function') LocalBrokieAPI.startTone();
    crashPlayerBet = betAmount;
    playerHasBet = true; // Mark that the player has placed a bet for this round
    if (typeof LocalBrokieAPI.updateBalance === 'function') LocalBrokieAPI.updateBalance(-betAmount);

    // --- Reset visuals BEFORE setting game active ---
    resetCrashVisuals();

    crashGameActive = true; // NOW set game active
    crashCashedOut = false;
    crashTargetMultiplier = calculateCrashTarget();
    crashStatusDisplay.innerHTML = `Bet Placed! Value: <span id="potential-win-amount" class="font-bold text-white">${(typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(crashPlayerBet) : crashPlayerBet}</span>`;

    // Disable controls
    crashBetButton.disabled = true;
    crashCashoutButton.disabled = false; // Enable cashout button
    crashBetInput.disabled = true;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = true;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = true;
    if(crashAutoCashoutInput) crashAutoCashoutInput.disabled = true; // Disable input during game
    if (isAutoCashoutEnabled) validateAndUpdateAutoCashoutTarget(); // Re-validate target just in case

    // --- Start the Game Loop using requestAnimationFrame ---
    crashStartTime = performance.now();
    crashRawPointsData = [[0, 1.00]]; // Start with initial point [time, multiplier]
    crashPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier); // Calculate initial points string
    if(crashPolyline) crashPolyline.setAttribute('points', crashPointsString); // Apply initial point

    console.log(`Crash round started. Target: ${crashTargetMultiplier.toFixed(2)}x`); // DEBUG

    // Ensure no previous animation frame is running before starting a new one
    if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
    crashAnimationId = requestAnimationFrame(crashGameLoop); // Start the loop
}

/**
 * The main game loop, called by requestAnimationFrame.
 * @param {DOMHighResTimeStamp} timestamp - The timestamp provided by requestAnimationFrame.
 */
function crashGameLoop(timestamp) {
    if (!crashGameActive) {
        // console.log("RAF loop stopped: crashGameActive is false."); // DEBUG
        crashAnimationId = null; // Ensure ID is cleared if game stops unexpectedly
        return; // Stop if game ended
    }

    try {
        if (!crashStartTime) crashStartTime = timestamp; // Initialize startTime if it's null
        const elapsedTime = Math.max(0, timestamp - crashStartTime); // Ensure elapsedTime is not negative

        // Calculate multiplier based on elapsed time (adjust formula as needed)
        const timeFactor = elapsedTime / 1000; // Time in seconds
        // Example formula: starts slow, accelerates over time
        currentMultiplier = 1 + 0.06 * Math.pow(timeFactor, 1.65);
        currentMultiplier = Math.max(1.00, currentMultiplier); // Ensure multiplier is at least 1.00

        // Check for Auto Cashout Trigger
        if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && currentMultiplier >= autoCashoutTarget) {
            attemptCashOut();
            // Don't return here - let the loop continue to update visuals until crash
        }

        // Check for Crash Condition
        const hasCrashed = currentMultiplier >= crashTargetMultiplier || elapsedTime >= CRASH_MAX_TIME_MS;

        if (hasCrashed) {
            // Ensure the displayed multiplier doesn't exceed the crash target
            currentMultiplier = Math.min(currentMultiplier, crashTargetMultiplier);
            console.log(`Crashed at ${currentMultiplier.toFixed(2)}x`); // DEBUG

            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
            // Add the final crash point to the data
            crashRawPointsData.push([elapsedTime, currentMultiplier]);
            // Calculate the final points string including the crash point
            const finalPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);
            if(crashPolyline) {
                crashPolyline.setAttribute('points', finalPointsString);
                crashPolyline.style.stroke = '#e81123'; // Change line color to red for crash
            }
            endCrashGame(true, crashPlayerBet); // End the game, marking it as crashed
            return; // Stop the loop after crash processing
        }

        // --- Update display during active game ---
        if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
        // Update potential win amount if the player hasn't cashed out yet
        if (!crashCashedOut && playerHasBet) {
             const currentCashoutValue = Math.floor(crashPlayerBet * currentMultiplier);
             const potentialWinSpan = document.getElementById('potential-win-amount');
             const formattedWin = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(currentCashoutValue) : currentCashoutValue;
             if (potentialWinSpan) {
                 potentialWinSpan.textContent = formattedWin;
             } else if (crashStatusDisplay) {
                 // Update status display if span is missing (less ideal)
                 crashStatusDisplay.innerHTML = `Value: <span id="potential-win-amount" class="font-bold text-white">${formattedWin}</span>`;
             }
        }

        applyMultiplierVisuals(); // Apply color/shake effects

        // --- Update Graph Line ---
        let rescaleNeeded = false;
        // Check if the current multiplier is approaching the top of the graph
        while (currentMultiplier >= currentMaxYMultiplier * CRASH_RESCALE_THRESHOLD) {
            currentMaxYMultiplier *= CRASH_Y_AXIS_PADDING_FACTOR; // Increase the max Y value
            rescaleNeeded = true;
        }
        if (rescaleNeeded) {
            console.log("Rescaling Y axis to:", currentMaxYMultiplier.toFixed(2)); // DEBUG
            updateCrashGrid(); // Redraw grid lines for the new scale
        }

        // Add current raw data point [time, multiplier]
        crashRawPointsData.push([elapsedTime, currentMultiplier]);
        // Recalculate the entire points string based on current scale
        const pointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);

        if(crashPolyline) {
             crashPolyline.setAttribute('points', pointsString);
        } else {
            console.error("crashPolyline element lost during update!");
            endCrashGame(false, crashPlayerBet); // Stop game if critical element lost
            return;
        }

        // Play tick sound (if API provides it)
        if (!crashCashedOut && typeof LocalBrokieAPI.playSound === 'function') {
            LocalBrokieAPI.playSound('crash_tick', currentMultiplier);
        }

        // Request the next frame ONLY if game is still active
        if (crashGameActive) {
            crashAnimationId = requestAnimationFrame(crashGameLoop);
        } else {
            crashAnimationId = null; // Ensure ID is cleared if game stopped by other means
        }

    } catch (error) {
        console.error("Error inside crash game loop:", error);
        if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
        crashAnimationId = null;
        crashGameActive = false; // Ensure game stops on error
        if(crashStatusDisplay) crashStatusDisplay.textContent = "Game error occurred!";
        // Optionally, try to reset or handle the error state more gracefully
        resetCrashVisuals();
    }
}


/**
 * Calculates the SVG points string from raw data based on the current Y scale.
 * Uses raw Y value, relying on SVG clip-path for bounding.
 * @param {Array<Array<number>>} dataPoints - Array of [elapsedTime, multiplier] points.
 * @param {number} maxYMultiplier - The current maximum multiplier for the Y axis scale.
 * @returns {string} The SVG points string (e.g., "x1,y1 x2,y2 ...").
 */
function calculatePointsString(dataPoints, maxYMultiplier) {
    // Ensure the range is valid to prevent division by zero or negative scaling
    const yMultiplierRange = Math.max(0.01, maxYMultiplier - 1);

    const points = dataPoints.map(point => {
        const elapsedTime = point[0];
        const multiplier = point[1];

        // Ensure elapsedTime is non-negative for X calculation
        const safeElapsedTime = Math.max(0, elapsedTime);

        // Calculate X coordinate based on time elapsed relative to max time
        const x = Math.min(SVG_VIEWBOX_WIDTH, (safeElapsedTime / CRASH_MAX_TIME_MS) * SVG_VIEWBOX_WIDTH);

        // Calculate Y coordinate based on multiplier relative to the current Y scale
        // SVG Y=0 is at the top, Y=height is at the bottom.
        // Formula: height - ((currentValue - minValue) / range) * height
        const y = SVG_VIEWBOX_HEIGHT - ((multiplier - 1) / yMultiplierRange) * SVG_VIEWBOX_HEIGHT;

        // Check for NaN before formatting (Fix for the polyline error)
        if (isNaN(x) || isNaN(y)) {
            console.warn(`NaN detected in point calculation: T=${elapsedTime}, M=${multiplier}, MaxY=${maxYMultiplier} => X=${x}, Y=${y}. Skipping point.`);
            return null; // Indicate invalid point
        }
        // console.log(`Mapping: T=${elapsedTime.toFixed(0)}, M=${multiplier.toFixed(3)} => X=${x.toFixed(2)}, Y=${y.toFixed(2)}`); // DEBUG raw Y
        return `${x.toFixed(2)},${y.toFixed(2)}`; // Format point for SVG polyline
    });

    // Filter out any null (invalid) points before joining
    return points.filter(p => p !== null).join(' ');
}

/** Applies visual styles (color, size, shake) to the multiplier display based on its value. */
function applyMultiplierVisuals() {
     if (!crashMultiplierDisplay) return;

     const displaySpan = document.getElementById('potential-win-amount');

     // --- Reset classes first ---
     // Define all possible classes to remove them cleanly
     const effectClasses = ['shake-subtle', 'shake-strong', 'mult-color-5x', 'mult-color-10x', 'mult-color-15x', 'mult-color-20x', 'mult-color-30x'];
     const sizeClasses = ['mult-size-10x', 'mult-size-20x', 'mult-size-30x'];

     crashMultiplierDisplay.classList.remove(...effectClasses, ...sizeClasses);
     crashMultiplierDisplay.style.fontSize = ''; // Reset inline font size if previously set
     // Ensure base text color is reapplied if no other color class is added
     crashMultiplierDisplay.classList.add('text-fluent-text-primary');
     if (displaySpan) {
         displaySpan.classList.remove(...effectClasses); // Remove color classes from span too
         displaySpan.className = 'font-bold text-white'; // Reset span class
     }

     // --- Apply classes based on multiplier ---
     let appliedColorClass = null; // Track which color class is applied

     if (currentMultiplier >= 30) {
         crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-30x', 'mult-size-30x');
         appliedColorClass = 'mult-color-30x';
     } else if (currentMultiplier >= 20) {
         crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-20x', 'mult-size-20x');
         appliedColorClass = 'mult-color-20x';
     } else if (currentMultiplier >= 15) {
         crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-15x', 'mult-size-10x');
         appliedColorClass = 'mult-color-15x';
     } else if (currentMultiplier >= 10) {
         crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-10x', 'mult-size-10x');
         appliedColorClass = 'mult-color-10x';
     } else if (currentMultiplier >= 5) {
         crashMultiplierDisplay.classList.add('shake-subtle', 'mult-color-5x');
         appliedColorClass = 'mult-color-5x';
     } else if (currentMultiplier >= 3) {
         crashMultiplierDisplay.classList.add('shake-subtle');
     }

     // Apply the color class to the potential win span if a color was set
     if (displaySpan && appliedColorClass) {
         displaySpan.classList.remove('text-white'); // Remove default white if a color is applied
         displaySpan.classList.add(appliedColorClass);
     }

     // If a color class was applied, remove the default primary text color
     if (appliedColorClass) {
         crashMultiplierDisplay.classList.remove('text-fluent-text-primary');
     }
}


/**
 * Ends the crash game round, updates UI, calculates win/loss, and handles auto-bet.
 * @param {boolean} crashed - True if the game ended due to hitting the crash target or max time.
 * @param {number} betAtEnd - The player's bet amount for this round.
 * @param {boolean} [stoppedByTabSwitch=false] - True if stopped because the user switched tabs (or other external reason).
 */
function endCrashGame(crashed, betAtEnd, stoppedByTabSwitch = false) {
    // Stop the animation loop FIRST to prevent race conditions
    if (crashAnimationId) {
        cancelAnimationFrame(crashAnimationId);
        crashAnimationId = null;
    }

    // Prevent multiple calls to endCrashGame for the same round
    if (!crashGameActive && !stoppedByTabSwitch) {
        console.log("endCrashGame called but game already inactive."); // DEBUG
        return;
    }
    crashGameActive = false; // Mark game as inactive

    // Re-enable controls
    if(crashBetButton) crashBetButton.disabled = false;
    if(crashCashoutButton) crashCashoutButton.disabled = true; // Disable cashout after round ends
    if(crashBetInput) crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Re-enable input if needed

    // --- Handle Game Outcome ---
    const formattedBet = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(betAtEnd) : betAtEnd;

    if (crashed && !stoppedByTabSwitch) {
        if (!crashCashedOut && playerHasBet) { // Player bet and did not cash out
            // Update balance (no win, loss already deducted) - Ensure updateBalance exists
            if (typeof LocalBrokieAPI.updateBalance === 'function') {
                // LocalBrokieAPI.updateBalance(0); // No change needed if loss already deducted
            } else {
                console.warn("LocalBrokieAPI.updateBalance is not a function. Cannot update balance for loss.");
            }
            // Update displays for crash loss
            if(crashMultiplierDisplay) {
                crashMultiplierDisplay.textContent = `CRASH! ${crashTargetMultiplier.toFixed(2)}x`;
                crashMultiplierDisplay.className = 'text-fluent-danger'; // Red text
            }
            if(crashPolyline) crashPolyline.style.stroke = '#e81123'; // Red line
            if(crashStatusDisplay) crashStatusDisplay.textContent = `Crashed! You lost ${formattedBet}.`;
            // Play crash sound (if API provides it)
            if (typeof LocalBrokieAPI.playSound === 'function') LocalBrokieAPI.playSound('crash_explode');

        } else if (crashCashedOut) { // Player cashed out before the crash
             if(crashStatusDisplay) {
                // Append crash info to the existing cashout message
                crashStatusDisplay.textContent += ` (Crashed @ ${crashTargetMultiplier.toFixed(2)}x)`;
             }
             // Maybe play a different, less dramatic sound?
        } else {
            // Game crashed, but player didn't bet (shouldn't happen with current logic)
             if(crashStatusDisplay) crashStatusDisplay.textContent = `Round Crashed @ ${crashTargetMultiplier.toFixed(2)}x`;
        }
    } else if (!crashed && crashCashedOut && !stoppedByTabSwitch) {
        // Game ended naturally (e.g., max time) AFTER player cashed out
        // Outcome already handled in attemptCashOut
        if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Round ended)`;
    } else if (stoppedByTabSwitch) {
        // Game stopped due to tab switch or similar interruption
        if (!crashCashedOut && playerHasBet) {
            if (typeof LocalBrokieAPI.updateBalance === 'function') {
                // LocalBrokieAPI.updateBalance(0); // Loss already deducted
            }
            if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped (inactive tab). Bet lost.";
        } else if (crashCashedOut) {
             if(crashStatusDisplay) crashStatusDisplay.textContent += " (Game stopped)";
        } else {
             if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped (inactive tab).";
        }
    } else {
        // Other end conditions? (e.g., manual stop, error)
        if(crashStatusDisplay) crashStatusDisplay.textContent = "Round finished.";
    }

    // --- FIX: Check if saveGameState exists before calling ---
    if (LocalBrokieAPI && typeof LocalBrokieAPI.saveGameState === 'function') {
        LocalBrokieAPI.saveGameState();
    } else {
        console.warn("LocalBrokieAPI.saveGameState is not a function. Game state not saved.");
    }
    // ---------------------------------------------------------

    crashPlayerBet = 0; // Reset bet amount for the next round
    playerHasBet = false; // Reset bet status

    // Start next round if auto-bet is on and game wasn't stopped externally
    if (isCrashAutoBetting && !stoppedByTabSwitch) {
        console.log("Auto-bet: Scheduling next bet."); // DEBUG
        // Use a delay to allow player to see the result
        setTimeout(placeBetAndStart, 1500); // Adjust delay as needed
    } else {
         console.log(`Auto-bet: Not starting next round. isCrashAutoBetting=${isCrashAutoBetting}, stoppedByTabSwitch=${stoppedByTabSwitch}`); // DEBUG
    }
}

/**
 * Attempts to cash out the current crash game bet at the current multiplier.
 */
function attemptCashOut() {
    // Check if cashout is possible
    if (!crashGameActive || crashCashedOut || !crashCashoutButton || !playerHasBet) {
        console.log(`Cashout attempt failed: gameActive=${crashGameActive}, cashedOut=${crashCashedOut}, playerHasBet=${playerHasBet}`);
        return;
    }

    crashCashedOut = true;
    crashCashoutButton.disabled = true; // Disable button immediately

    const cashoutMultiplier = currentMultiplier; // Capture multiplier at the moment of cashout
    const totalReturn = Math.floor(crashPlayerBet * cashoutMultiplier);
    const profit = totalReturn - crashPlayerBet;

    // Update balance (if API provides it)
    if (typeof LocalBrokieAPI.updateBalance === 'function') {
        LocalBrokieAPI.updateBalance(totalReturn); // Add the full return amount
    } else {
        console.warn("LocalBrokieAPI.updateBalance is not a function. Balance not updated on cashout.");
    }

    // Play cashout sound (if API provides it)
    if (typeof LocalBrokieAPI.playSound === 'function') {
        LocalBrokieAPI.playSound('crash_cashout');
    }

    const formattedProfit = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(profit) : profit;
    const formattedReturn = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(totalReturn) : totalReturn;

    if (profit > 0) {
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x! Won ${formattedProfit}!`, 3000);
        }
        // Add win record (if API provides it)
        if (typeof LocalBrokieAPI.addWin === 'function') {
            LocalBrokieAPI.addWin('Crash', profit);
        } else {
             console.warn("LocalBrokieAPI.addWin is not a function. Win not recorded.");
        }
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out! Won ${formattedProfit}. Total: ${formattedReturn}`;
        // Apply visual effect to multiplier display
        if(crashMultiplierDisplay) {
             crashMultiplierDisplay.classList.add('win-effect'); // Add a CSS class for visual feedback
             // Remove the effect after a short duration
             setTimeout(() => { if(crashMultiplierDisplay) crashMultiplierDisplay.classList.remove('win-effect') }, 1000);
        }
    } else {
        // Cashed out at 1.00x or very close, no profit
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x. No profit. Returned ${formattedReturn}`, 3000);
        }
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out @ ${cashoutMultiplier.toFixed(2)}x. Returned ${formattedReturn}.`;
    }

    // Note: The game loop continues visually until the actual crash occurs,
    // even though the player's bet is secured.
}

/**
 * Stops the crash auto-bet feature and updates UI controls accordingly.
 */
function stopCrashAutoBet() {
    isCrashAutoBetting = false;
    if (crashAutoBetToggle) {
        crashAutoBetToggle.classList.remove('active'); // Visual indicator off
        crashAutoBetToggle.textContent = 'Auto Bet Off';
    }
    console.log("Auto-bet stopped."); // DEBUG

    // Re-enable controls only if the game is NOT currently active
    if (!crashGameActive) {
        if(crashBetButton) crashBetButton.disabled = false;
        if(crashBetInput) crashBetInput.disabled = false;
        if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
        if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
        updateCrashAutoCashoutToggleVisuals(); // Ensure cashout input state is correct
    }
}

/**
 * Toggles the crash auto-bet feature on or off and updates UI.
 */
function toggleCrashAutoBet() {
    if (!crashAutoBetToggle || !LocalBrokieAPI) return;
    if (typeof LocalBrokieAPI.playSound === 'function') LocalBrokieAPI.playSound('click');

    isCrashAutoBetting = !isCrashAutoBetting;

    if (isCrashAutoBetting) {
        crashAutoBetToggle.classList.add('active');
        crashAutoBetToggle.textContent = 'Auto Bet ON';
        console.log("Auto-bet enabled."); // DEBUG
        // If the game isn't running, and auto-bet is turned on, start a round immediately.
        if (!crashGameActive) {
            console.log("Auto-bet: Starting game immediately."); // DEBUG
            placeBetAndStart();
        }
    } else {
        stopCrashAutoBet(); // Call the dedicated stop function
    }
}

/**
 * Updates the visuals and disabled state of the auto-cashout input/toggle button.
 */
function updateCrashAutoCashoutToggleVisuals() {
    if (!crashAutoCashoutToggle || !crashAutoCashoutInput) return;

    if (isAutoCashoutEnabled) {
        crashAutoCashoutToggle.classList.add('active');
        crashAutoCashoutToggle.textContent = 'Auto Cashout ON'; // More descriptive text
        // Input should be enabled ONLY if the feature is on AND the game is not active
        crashAutoCashoutInput.disabled = crashGameActive;
    } else {
        crashAutoCashoutToggle.classList.remove('active');
        crashAutoCashoutToggle.textContent = 'Auto Cashout OFF'; // More descriptive text
        crashAutoCashoutInput.disabled = true; // Always disable input if feature is off
    }
}

/**
 * Validates the auto-cashout target value when the input changes or before game start.
 * @returns {boolean} True if the value is valid, false otherwise.
 */
function validateAndUpdateAutoCashoutTarget() {
    if (!crashAutoCashoutInput || !LocalBrokieAPI) return false;

    const target = parseFloat(crashAutoCashoutInput.value);
    const minValue = 1.01; // Minimum valid cashout target

    if (isNaN(target) || target < minValue) {
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Invalid auto-cashout target. Must be >= ${minValue.toFixed(2)}x`, 2500);
        }
        // Reset to the previous valid value or a default if the previous was invalid
        const fallbackValue = (autoCashoutTarget >= minValue) ? autoCashoutTarget : 1.50;
        crashAutoCashoutInput.value = fallbackValue.toFixed(2);
        autoCashoutTarget = fallbackValue;
        return false;
    } else {
        // Value is valid, update the state variable
        autoCashoutTarget = target;
        // Optionally reformat the input to ensure consistent display (e.g., "2" -> "2.00")
        crashAutoCashoutInput.value = target.toFixed(2);
        console.log(`Auto-cashout target set to: ${autoCashoutTarget.toFixed(2)}x`); // DEBUG
        return true;
    }
}


/**
 * Toggles the crash auto-cashout feature on or off.
 */
function toggleCrashAutoCashout() {
    if (!crashAutoCashoutInput || !crashAutoCashoutToggle || !LocalBrokieAPI) return;
    if (typeof LocalBrokieAPI.playSound === 'function') LocalBrokieAPI.playSound('click');

    isAutoCashoutEnabled = !isAutoCashoutEnabled;

    if (isAutoCashoutEnabled) {
        // Validate the current input value when enabling
        if (validateAndUpdateAutoCashoutTarget()) {
             if (typeof LocalBrokieAPI.showMessage === 'function') {
                LocalBrokieAPI.showMessage(`Auto-cashout enabled @ ${autoCashoutTarget.toFixed(2)}x.`, 2000);
             }
        } else {
            // If validation failed, keep it disabled visually but update state
            isAutoCashoutEnabled = false; // Revert state change
            // Message shown by validate function
        }
    } else {
         if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage("Auto-cashout disabled.", 2000);
         }
    }
    // Update visuals based on the final state of isAutoCashoutEnabled
    updateCrashAutoCashoutToggleVisuals();
}

// Make init function available globally if needed, although direct call from main.js is typical.
// window.initCrash = initCrash; // Uncomment if needed for specific module loading patterns
