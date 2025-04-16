/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v6.2 - Cashout & Sound Fix)
 *
 * - Uses BrokieAPI object.
 * - Fixed auto-cashout logic.
 * - Fixed Y-axis scaling logic + uses clipPath.
 * - Uses requestAnimationFrame loop.
 * - Fixed NaN issue in polyline points calculation.
 * - Removed obsolete crashInterval references.
 * - Added check for LocalBrokieAPI.saveGameState before calling.
 * - Fixed cashout issue by correcting playerHasBet state timing.
 * - Adjusted tick sound to start playing at >= 5x multiplier.
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
const CRASH_TICK_SOUND_START_MULTIPLIER = 5.0; // Multiplier threshold to start tick sound

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
let playerHasBet = false; // Tracks if a bet is active for the current round
let crashPointsString = ''; // Holds the SVG polyline points string


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

    resetCrashVisuals(); // Initial reset
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

    // Check if all elements were found
    const elements = { crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline, crashBetInput, crashBetButton, crashCashoutButton, crashStatusDisplay, crashAutoBetToggle, crashAutoCashoutInput, crashAutoCashoutToggle };
    for (const key in elements) {
        if (!elements[key]) {
             console.error(`Crash Game initialization failed: Could not find DOM element with ID corresponding to '${key}'.`);
             const gameArea = document.getElementById('game-crash');
             if(gameArea) gameArea.innerHTML = `<p class="text-fluent-danger text-center">Error loading Crash Game element: ${key}.</p>`;
             return false;
        }
    }
    return true;
}

/** Sets up event listeners for Crash game controls. */
function setupCrashEventListeners() {
    // Add listeners only if the elements exist
    if(crashBetButton) crashBetButton.addEventListener('click', placeBetAndStart);
    if(crashCashoutButton) crashCashoutButton.addEventListener('click', attemptCashOut);
    if(crashAutoBetToggle) crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);
    if(crashAutoCashoutInput) {
        crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
        crashAutoCashoutInput.addEventListener('input', () => {
            // Allow only numbers and one decimal point using a simple regex
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
    const xStep = width / (numVerticalLines + 1); // Divide space including edges
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
    // Ensure the multiplier range is at least a small positive number
    const yMultiplierRange = Math.max(0.01, currentMaxYMultiplier - 1);

    for (let i = 1; i <= numHorizontalLines; i++) {
        // Calculate the multiplier value this line represents (linear scale from 1.00 to max)
        const multiplierValue = 1 + (i / (numHorizontalLines + 1)) * yMultiplierRange;
        // Calculate the Y coordinate in SVG space (0 is top, height is bottom)
        const y = height - ((multiplierValue - 1) / yMultiplierRange) * height;

        // Only draw lines and labels that fall within the SVG height
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
            text.setAttribute('y', (y - 1).toFixed(2)); // Position slightly above the line for better visibility
            text.setAttribute('class', 'grid-label'); // Apply CSS class for styling
            text.setAttribute('font-size', '4'); // Adjust font size as needed for SVG viewBox
            text.setAttribute('fill', '#6a6a6a'); // Set text color
            text.textContent = `${multiplierValue.toFixed(1)}x`; // Format the label (e.g., 1.5x)
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

    // Stop any existing game loop animation frame
    if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
    crashAnimationId = null;

    // Reset core state variables
    crashGameActive = false; // Crucial: Mark as inactive during reset
    playerHasBet = false; // Reset bet status **HERE**
    crashCashedOut = false;
    currentMultiplier = 1.00;
    crashRawPointsData = [[0, 1.00]]; // Reset raw data points array with starting point [time, multiplier]
    currentMaxYMultiplier = CRASH_STARTING_MAX_Y; // Reset Y-axis scale
    crashPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier); // Calculate initial points string

    // Reset SVG and display elements to initial state
    crashSvg.setAttribute('viewBox', `0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`);
    crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = 'text-fluent-text-primary'; // Reset color/effects
    crashMultiplierDisplay.style.fontSize = ''; // Reset font size if dynamically changed
    crashPolyline.setAttribute('points', crashPointsString); // Set initial point (0, max_height)
    crashPolyline.style.stroke = '#0078d4'; // Reset line to primary color
    crashStatusDisplay.textContent = 'Place your bet for the next round!';
    updateCrashGrid(); // Update grid lines for the reset scale

    // Reset button and input states
    crashBetButton.disabled = false;
    crashCashoutButton.disabled = true; // Can't cash out before betting
    crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Updates auto-cashout input based on toggle state
}

/**
 * Calculates the target multiplier where the game will crash.
 * Uses a common formula for provably fair crash games.
 * @returns {number} The calculated crash multiplier (>= 1.00).
 */
function calculateCrashTarget() {
    // Constants for the crash calculation (adjust houseEdgePercent as needed)
    const houseEdgePercent = 1.0; // Example: 1% house edge
    const e = 2 ** 52; // Maximum value for Math.random() precision (used in some formulas)

    // Generate a random float for the crash point calculation
    const h = Math.random(); // Random number between 0 (inclusive) and 1 (exclusive)

    // Check for instant crash based on house edge probability
    if (h * 100 < houseEdgePercent) {
        return 1.00;
    }

    // Calculate the crash point for non-instant crashes
    // Using a simplified formula that provides a similar distribution:
    // multiplier = 1 / (1 - random_number)
    // Adjusting for house edge: multiplier = (100 / (100 - houseEdge)) / (1 - random_number)
    // Simplified further for calculation:
    let maxMultiplierFactor = 99 / (100 - houseEdgePercent); // e.g., 99 / 99 = 1 for 1% edge (adjusts the curve slightly)
    let crashPoint = maxMultiplierFactor / (1 - h);

    // Ensure the crash point is at least 1.01 and round down to 2 decimal places
    return Math.max(1.01, Math.floor(crashPoint * 100) / 100);
}


/**
 * Validates the bet amount and starts a new round of the crash game.
 */
function placeBetAndStart() {
    // Ensure required elements and API are available
    if (!crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatusDisplay || !LocalBrokieAPI) {
        console.error("Crash start failed: critical elements or API missing.");
        return;
    }
    // Prevent starting if a game is already active
    if (crashGameActive) {
        if (typeof LocalBrokieAPI.showMessage === 'function') LocalBrokieAPI.showMessage("Round already in progress.", 1500);
        return;
    }

    // --- FIX: Reset visuals *before* changing game state ---
    resetCrashVisuals();

    const betAmount = parseInt(crashBetInput.value);

    // --- Validate Bet Amount ---
    if (isNaN(betAmount) || betAmount < 1) {
        if (typeof LocalBrokieAPI.showMessage === 'function') LocalBrokieAPI.showMessage("Invalid bet amount. Minimum is 1.", 2000);
        if (isCrashAutoBetting) stopCrashAutoBet(); // Stop auto-bet if bet is invalid
        resetCrashVisuals(); // Ensure controls are re-enabled after invalid bet
        return;
    }
    const currentBalance = (typeof LocalBrokieAPI.getBalance === 'function') ? LocalBrokieAPI.getBalance() : 0;
    if (betAmount > currentBalance) {
        if (typeof LocalBrokieAPI.showMessage === 'function') LocalBrokieAPI.showMessage("Insufficient balance.", 2000);
        if (isCrashAutoBetting) stopCrashAutoBet(); // Stop auto-bet if insufficient funds
        resetCrashVisuals(); // Ensure controls are re-enabled after insufficient funds
        return;
    }

    // --- Bet is valid, Proceed with Game Start ---
    if (typeof LocalBrokieAPI.startTone === 'function') LocalBrokieAPI.startTone();

    // Deduct bet and update state AFTER validation and reset
    crashPlayerBet = betAmount;
    playerHasBet = true; // Mark that the player has placed a bet for this round **NOW**
    if (typeof LocalBrokieAPI.updateBalance === 'function') LocalBrokieAPI.updateBalance(-betAmount);


    // Set game state to active
    crashGameActive = true;
    crashCashedOut = false; // Ensure cashedOut is false at the start of the round
    crashTargetMultiplier = calculateCrashTarget();
    const formattedBet = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(crashPlayerBet) : crashPlayerBet;
    crashStatusDisplay.innerHTML = `Bet Placed! Value: <span id="potential-win-amount" class="font-bold text-white">${formattedBet}</span>`;

    // Disable betting controls, enable cashout
    crashBetButton.disabled = true;
    crashCashoutButton.disabled = false; // Enable cashout button now that bet is placed
    crashBetInput.disabled = true;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = true; // Disable auto-bet toggle during round
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = true; // Disable auto-cashout toggle during round
    if(crashAutoCashoutInput) crashAutoCashoutInput.disabled = true; // Disable auto-cashout input during round
    if (isAutoCashoutEnabled) validateAndUpdateAutoCashoutTarget(); // Re-validate target just in case it was changed

    // --- Start the Game Loop using requestAnimationFrame ---
    crashStartTime = performance.now(); // Record start time
    crashRawPointsData = [[0, 1.00]]; // Initialize points data
    crashPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier); // Calculate initial points string
    if(crashPolyline) crashPolyline.setAttribute('points', crashPointsString); // Apply initial point to polyline

    console.log(`Crash round started. Target: ${crashTargetMultiplier.toFixed(2)}x`); // DEBUG

    // Ensure no previous animation frame is running before starting a new one
    if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
    crashAnimationId = requestAnimationFrame(crashGameLoop); // Start the animation loop
}

/**
 * The main game loop, called by requestAnimationFrame.
 * @param {DOMHighResTimeStamp} timestamp - The timestamp provided by requestAnimationFrame.
 */
function crashGameLoop(timestamp) {
    // Stop immediately if the game is no longer marked as active
    if (!crashGameActive) {
        crashAnimationId = null; // Ensure ID is cleared if game stops unexpectedly
        return;
    }

    try {
        // Initialize startTime on the first frame if it's somehow null
        if (!crashStartTime) crashStartTime = timestamp;
        // Calculate elapsed time, ensuring it's non-negative
        const elapsedTime = Math.max(0, timestamp - crashStartTime);

        // Calculate current multiplier based on elapsed time (adjust formula as needed for game feel)
        const timeFactor = elapsedTime / 1000; // Time in seconds
        // Example formula: starts slow, accelerates over time
        currentMultiplier = 1 + 0.06 * Math.pow(timeFactor, 1.65);
        currentMultiplier = Math.max(1.00, currentMultiplier); // Ensure multiplier is always at least 1.00

        // --- Check for Auto Cashout Trigger ---
        // Condition: Auto cashout enabled, player hasn't manually cashed out, target is valid, current multiplier meets target
        if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && currentMultiplier >= autoCashoutTarget) {
            console.log(`Auto-cashout triggered at ${currentMultiplier.toFixed(2)}x (Target: ${autoCashoutTarget.toFixed(2)}x)`); // DEBUG
            attemptCashOut();
            // Note: Loop continues after auto-cashout to show the graph reach its crash point.
        }

        // --- Check for Crash Condition ---
        // Condition: Current multiplier reaches or exceeds the target, OR max game time is reached
        const hasCrashed = currentMultiplier >= crashTargetMultiplier || elapsedTime >= CRASH_MAX_TIME_MS;

        if (hasCrashed) {
            // Ensure the final displayed multiplier doesn't exceed the actual crash target
            currentMultiplier = Math.min(currentMultiplier, crashTargetMultiplier);
            console.log(`Crashed at ${currentMultiplier.toFixed(2)}x`); // DEBUG

            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
            // Add the final crash point to the data for accurate line drawing
            crashRawPointsData.push([elapsedTime, currentMultiplier]);
            // Calculate the final points string including the crash point
            const finalPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);
            if(crashPolyline) {
                crashPolyline.setAttribute('points', finalPointsString);
                crashPolyline.style.stroke = '#e81123'; // Change line color to red for crash
            }
            endCrashGame(true, crashPlayerBet); // End the game, marking it as crashed
            return; // Stop the loop immediately after crash processing
        }

        // --- Update display during active game (if not crashed yet) ---
        if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;

        // Update potential win amount display if the player hasn't cashed out yet and has bet
        if (!crashCashedOut && playerHasBet) {
             const currentCashoutValue = Math.floor(crashPlayerBet * currentMultiplier);
             const potentialWinSpan = document.getElementById('potential-win-amount');
             const formattedWin = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(currentCashoutValue) : currentCashoutValue;
             if (potentialWinSpan) {
                 potentialWinSpan.textContent = formattedWin; // Update existing span
             } else if (crashStatusDisplay) {
                 // Fallback: Update status display if span is missing (less ideal)
                 crashStatusDisplay.innerHTML = `Value: <span id="potential-win-amount" class="font-bold text-white">${formattedWin}</span>`;
             }
        }

        applyMultiplierVisuals(); // Apply color/shake effects based on multiplier

        // --- Update Graph Line & Scale ---
        let rescaleNeeded = false;
        // Check if the current multiplier is approaching the top edge of the graph view
        while (currentMultiplier >= currentMaxYMultiplier * CRASH_RESCALE_THRESHOLD) {
            currentMaxYMultiplier *= CRASH_Y_AXIS_PADDING_FACTOR; // Increase the max Y value for the scale
            rescaleNeeded = true;
        }
        // If the scale changed, redraw the grid lines
        if (rescaleNeeded) {
            console.log("Rescaling Y axis to:", currentMaxYMultiplier.toFixed(2)); // DEBUG
            updateCrashGrid();
        }

        // Add current raw data point [time, multiplier] to the array
        crashRawPointsData.push([elapsedTime, currentMultiplier]);
        // Recalculate the entire points string based on the potentially updated scale
        const pointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);

        // Update the polyline if the element still exists
        if(crashPolyline) {
             crashPolyline.setAttribute('points', pointsString);
        } else {
            console.error("crashPolyline element lost during update!");
            endCrashGame(false, crashPlayerBet); // Stop game if critical element lost
            return; // Exit loop
        }

        // --- Play tick sound ---
        // Play sound only if: not cashed out, API function exists, AND multiplier is >= threshold
        if (!crashCashedOut && currentMultiplier >= CRASH_TICK_SOUND_START_MULTIPLIER && typeof LocalBrokieAPI.playSound === 'function') {
            LocalBrokieAPI.playSound('crash_tick', currentMultiplier);
        }

        // --- Request the next frame ---
        // Continue the loop only if the game is still marked as active
        if (crashGameActive) {
            crashAnimationId = requestAnimationFrame(crashGameLoop);
        } else {
            crashAnimationId = null; // Ensure ID is cleared if game stopped by other means (e.g., cashout)
        }

    } catch (error) {
        console.error("Error inside crash game loop:", error);
        if (crashAnimationId) cancelAnimationFrame(crashAnimationId); // Stop loop on error
        crashAnimationId = null;
        crashGameActive = false; // Ensure game stops on error
        if(crashStatusDisplay) crashStatusDisplay.textContent = "Game error occurred!";
        // Attempt to reset visuals to allow starting a new game
        resetCrashVisuals();
    }
}


/**
 * Calculates the SVG points string from raw data based on the current Y scale.
 * Converts [time, multiplier] data into SVG [x, y] coordinates.
 * @param {Array<Array<number>>} dataPoints - Array of [elapsedTime, multiplier] points.
 * @param {number} maxYMultiplier - The current maximum multiplier for the Y axis scale.
 * @returns {string} The SVG points string (e.g., "x1,y1 x2,y2 ...").
 */
function calculatePointsString(dataPoints, maxYMultiplier) {
    // Ensure the multiplier range for scaling is valid (at least 0.01)
    const yMultiplierRange = Math.max(0.01, maxYMultiplier - 1);

    const points = dataPoints.map(point => {
        const elapsedTime = point[0];
        const multiplier = point[1];

        // Ensure elapsedTime is non-negative for X calculation
        const safeElapsedTime = Math.max(0, elapsedTime);

        // Calculate X coordinate: map elapsed time (0 to max time) to SVG width (0 to width)
        const x = Math.min(SVG_VIEWBOX_WIDTH, (safeElapsedTime / CRASH_MAX_TIME_MS) * SVG_VIEWBOX_WIDTH);

        // Calculate Y coordinate: map multiplier (1 to max Y) to SVG height (height to 0)
        // SVG Y=0 is at the top, Y=height is at the bottom.
        // Formula: height - ((currentValue - minValue) / range) * height
        const y = SVG_VIEWBOX_HEIGHT - ((multiplier - 1) / yMultiplierRange) * SVG_VIEWBOX_HEIGHT;

        // Check for NaN values which can break SVG rendering
        if (isNaN(x) || isNaN(y)) {
            console.warn(`NaN detected in point calculation: T=${elapsedTime}, M=${multiplier}, MaxY=${maxYMultiplier} => X=${x}, Y=${y}. Skipping point.`);
            return null; // Indicate an invalid point to be filtered out
        }
        // Format the point with fixed precision for SVG attribute
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    // Filter out any null (invalid) points and join the valid points with spaces
    return points.filter(p => p !== null).join(' ');
}

/** Applies visual styles (color, size, shake) to the multiplier display based on its value. */
function applyMultiplierVisuals() {
     if (!crashMultiplierDisplay) return;

     const displaySpan = document.getElementById('potential-win-amount');

     // --- Reset classes first for clean application ---
     // Define all possible dynamic classes to remove them reliably
     const effectClasses = ['shake-subtle', 'shake-strong', 'mult-color-5x', 'mult-color-10x', 'mult-color-15x', 'mult-color-20x', 'mult-color-30x', 'win-effect'];
     const sizeClasses = ['mult-size-10x', 'mult-size-20x', 'mult-size-30x'];

     // Remove all potential effect and size classes from the multiplier display
     crashMultiplierDisplay.classList.remove(...effectClasses, ...sizeClasses);
     crashMultiplierDisplay.style.fontSize = ''; // Reset inline font size if previously set by effects
     // Ensure base text color is reapplied if no specific color class is added below
     crashMultiplierDisplay.classList.add('text-fluent-text-primary');

     // Reset the potential win span as well
     if (displaySpan) {
         displaySpan.classList.remove(...effectClasses); // Remove color classes from span too
         displaySpan.className = 'font-bold text-white'; // Reset span class to default
     }

     // --- Apply new classes based on current multiplier ---
     let appliedColorClass = null; // Track which color class is applied for the span

     // Apply styles progressively based on multiplier thresholds
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
         crashMultiplierDisplay.classList.add('shake-subtle'); // Only shake, no color change
     }

     // Apply the determined color class to the potential win span, removing default white
     if (displaySpan && appliedColorClass) {
         displaySpan.classList.remove('text-white');
         displaySpan.classList.add(appliedColorClass);
     }

     // If a specific color class was applied, remove the default primary text color from the main display
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
    // Stop the animation loop FIRST to prevent race conditions or further updates
    if (crashAnimationId) {
        cancelAnimationFrame(crashAnimationId);
        crashAnimationId = null;
    }

    // Prevent multiple calls to endCrashGame for the same round if already inactive
    if (!crashGameActive && !stoppedByTabSwitch) {
        console.log("endCrashGame called but game already inactive."); // DEBUG
        return;
    }
    crashGameActive = false; // Mark game as inactive

    // Re-enable betting controls and disable cashout button
    if(crashBetButton) crashBetButton.disabled = false;
    if(crashCashoutButton) crashCashoutButton.disabled = true; // Disable cashout after round ends
    if(crashBetInput) crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Re-enable auto-cashout input if applicable

    // --- Handle Game Outcome Display and Sounds ---
    const formattedBet = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(betAtEnd) : betAtEnd;

    if (crashed && !stoppedByTabSwitch) { // Game crashed normally
        if (!crashCashedOut && playerHasBet) { // Player bet and did not cash out in time = Loss
            // Balance was already deducted at bet time, no update needed here for loss
            // Update displays for crash loss
            if(crashMultiplierDisplay) {
                crashMultiplierDisplay.textContent = `CRASH! ${crashTargetMultiplier.toFixed(2)}x`;
                crashMultiplierDisplay.className = 'text-fluent-danger'; // Red text
            }
            if(crashPolyline) crashPolyline.style.stroke = '#e81123'; // Red line
            if(crashStatusDisplay) crashStatusDisplay.textContent = `Crashed! You lost ${formattedBet}.`;
            // Play crash sound
            if (typeof LocalBrokieAPI.playSound === 'function') LocalBrokieAPI.playSound('crash_explode');

        } else if (crashCashedOut) { // Player cashed out before the crash = Win (handled in attemptCashOut)
             if(crashStatusDisplay) {
                // Append crash info to the existing cashout message for context
                crashStatusDisplay.textContent += ` (Crashed @ ${crashTargetMultiplier.toFixed(2)}x)`;
             }
             // Optional: Play a less dramatic sound for crash after cashout?
        } else { // Game crashed, but player didn't bet (shouldn't happen with current logic, but handle defensively)
             if(crashStatusDisplay) crashStatusDisplay.textContent = `Round Crashed @ ${crashTargetMultiplier.toFixed(2)}x`;
        }
    } else if (!crashed && crashCashedOut && !stoppedByTabSwitch) { // Game ended by max time AFTER player cashed out
        if(crashStatusDisplay) crashStatusDisplay.textContent += ` (Round ended by time)`;
    } else if (stoppedByTabSwitch) { // Game stopped due to tab switch or similar interruption
        if (!crashCashedOut && playerHasBet) { // Player lost their bet
            if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped (inactive tab). Bet lost.";
        } else if (crashCashedOut) { // Player already cashed out
             if(crashStatusDisplay) crashStatusDisplay.textContent += " (Game stopped)";
        } else { // No bet placed
             if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped (inactive tab).";
        }
    } else { // Other end conditions (e.g., manual stop, error handled in loop)
        if(crashStatusDisplay && !crashStatusDisplay.textContent.includes("Cashed Out")) {
             crashStatusDisplay.textContent = "Round finished.";
        }
    }

    // --- Save Game State (Optional) ---
    // Check if saveGameState function exists on the API before calling
    if (LocalBrokieAPI && typeof LocalBrokieAPI.saveGameState === 'function') {
        LocalBrokieAPI.saveGameState();
    } else {
        // Only log warning if the function is expected but missing
        // console.warn("LocalBrokieAPI.saveGameState is not a function. Game state not saved.");
    }

    // Reset bet amount and status for the next round
    crashPlayerBet = 0;
    playerHasBet = false; // Reset bet status **HERE** as well

    // --- Handle Auto-Bet ---
    // Start next round automatically if auto-bet is enabled and game wasn't stopped externally
    if (isCrashAutoBetting && !stoppedByTabSwitch) {
        console.log("Auto-bet: Scheduling next bet."); // DEBUG
        // Use a delay to allow player to see the result before the next round starts
        setTimeout(placeBetAndStart, 1500); // Adjust delay as needed
    } else {
         console.log(`Auto-bet: Not starting next round. isCrashAutoBetting=${isCrashAutoBetting}, stoppedByTabSwitch=${stoppedByTabSwitch}`); // DEBUG
         // If auto-betting was stopped due to invalid bet/funds, ensure controls are enabled
         if(!crashGameActive) {
             resetCrashVisuals();
         }
    }
}

/**
 * Attempts to cash out the current crash game bet at the current multiplier.
 * Called by button click or auto-cashout trigger.
 */
function attemptCashOut() {
    // --- Pre-conditions for Cashout ---
    // 1. Game must be active.
    // 2. Player must not have already cashed out this round.
    // 3. Cashout button must exist (sanity check).
    // 4. Player must have actually placed a bet this round.
    if (!crashGameActive || crashCashedOut || !crashCashoutButton || !playerHasBet) {
        console.warn(`Cashout attempt failed: gameActive=${crashGameActive}, cashedOut=${crashCashedOut}, playerHasBet=${playerHasBet}`); // More detailed log
        // Optionally provide user feedback if triggered by button click
        // if (typeof LocalBrokieAPI.showMessage === 'function' && !playerHasBet) {
        //     LocalBrokieAPI.showMessage("Cannot cash out: No active bet.", 1500);
        // }
        return;
    }

    // --- Mark as Cashed Out ---
    crashCashedOut = true;
    crashCashoutButton.disabled = true; // Disable button immediately to prevent multiple clicks

    // --- Calculate Winnings ---
    const cashoutMultiplier = currentMultiplier; // Capture multiplier at the exact moment of cashout
    const totalReturn = Math.floor(crashPlayerBet * cashoutMultiplier); // Calculate total amount returned
    const profit = totalReturn - crashPlayerBet; // Calculate profit (can be 0 or negative if cashing out <= 1.00x)

    // --- Update Balance & Play Sound ---
    if (typeof LocalBrokieAPI.updateBalance === 'function') {
        LocalBrokieAPI.updateBalance(totalReturn); // Add the full return amount (covers original bet + profit)
    } else {
        console.warn("LocalBrokieAPI.updateBalance is not a function. Balance not updated on cashout.");
    }
    if (typeof LocalBrokieAPI.playSound === 'function') {
        LocalBrokieAPI.playSound('crash_cashout');
    }

    // --- Update UI and Records ---
    const formattedProfit = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(profit) : profit;
    const formattedReturn = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(totalReturn) : totalReturn;

    if (profit > 0) { // Player made a profit
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
        // Apply visual effect to multiplier display for positive feedback
        if(crashMultiplierDisplay) {
             crashMultiplierDisplay.classList.add('win-effect'); // Add a CSS class for visual feedback
             // Remove the effect after a short duration
             setTimeout(() => { if(crashMultiplierDisplay) crashMultiplierDisplay.classList.remove('win-effect') }, 1000);
        }
    } else { // Player cashed out at 1.00x or very close, no profit
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x. No profit. Returned ${formattedReturn}`, 3000);
        }
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out @ ${cashoutMultiplier.toFixed(2)}x. Returned ${formattedReturn}.`;
    }

    // Note: The game loop continues visually until the actual crash occurs,
    // even though the player's bet is secured. This is standard Crash game behavior.
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

    // Re-enable betting controls ONLY if the game is NOT currently active
    // If the game is active, controls will be re-enabled by endCrashGame
    if (!crashGameActive) {
        if(crashBetButton) crashBetButton.disabled = false;
        if(crashBetInput) crashBetInput.disabled = false;
        if(crashAutoBetToggle) crashAutoBetToggle.disabled = false; // Re-enable the toggle itself
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

    isCrashAutoBetting = !isCrashAutoBetting; // Toggle the state

    if (isCrashAutoBetting) { // If turning ON
        crashAutoBetToggle.classList.add('active');
        crashAutoBetToggle.textContent = 'Auto Bet ON';
        console.log("Auto-bet enabled."); // DEBUG
        // If the game isn't running, and auto-bet is turned on, start a round immediately.
        if (!crashGameActive) {
            console.log("Auto-bet: Starting game immediately."); // DEBUG
            placeBetAndStart();
        }
    } else { // If turning OFF
        stopCrashAutoBet(); // Call the dedicated stop function
    }
}

/**
 * Updates the visuals and disabled state of the auto-cashout input/toggle button
 * based on the `isAutoCashoutEnabled` and `crashGameActive` states.
 */
function updateCrashAutoCashoutToggleVisuals() {
    if (!crashAutoCashoutToggle || !crashAutoCashoutInput) return;

    if (isAutoCashoutEnabled) {
        crashAutoCashoutToggle.classList.add('active');
        crashAutoCashoutToggle.textContent = 'Auto Cashout ON'; // More descriptive text
        // Input should be enabled ONLY if the feature is ON *AND* the game is NOT active
        crashAutoCashoutInput.disabled = crashGameActive;
    } else {
        crashAutoCashoutToggle.classList.remove('active');
        crashAutoCashoutToggle.textContent = 'Auto Cashout OFF'; // More descriptive text
        crashAutoCashoutInput.disabled = true; // Always disable input if the feature is off
    }
}

/**
 * Validates the auto-cashout target value from the input field.
 * Updates the `autoCashoutTarget` state variable if valid.
 * Resets input to last valid value or default if invalid.
 * @returns {boolean} True if the value is valid, false otherwise.
 */
function validateAndUpdateAutoCashoutTarget() {
    if (!crashAutoCashoutInput || !LocalBrokieAPI) return false;

    const target = parseFloat(crashAutoCashoutInput.value);
    const minValue = 1.01; // Minimum valid auto-cashout target

    if (isNaN(target) || target < minValue) {
        // If invalid, show message and reset input field
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Invalid auto-cashout target. Must be >= ${minValue.toFixed(2)}x`, 2500);
        }
        // Reset to the previous valid value, or a default (1.50) if the previous was also invalid/unset
        const fallbackValue = (autoCashoutTarget >= minValue) ? autoCashoutTarget : 1.50;
        crashAutoCashoutInput.value = fallbackValue.toFixed(2);
        autoCashoutTarget = fallbackValue; // Update state to match reset input
        console.warn(`Invalid auto-cashout input. Reset to ${fallbackValue.toFixed(2)}x`); // Log warning
        return false;
    } else {
        // Value is valid, update the state variable
        autoCashoutTarget = target;
        // Reformat the input to ensure consistent display (e.g., "2" -> "2.00")
        crashAutoCashoutInput.value = target.toFixed(2);
        console.log(`Auto-cashout target set to: ${autoCashoutTarget.toFixed(2)}x`); // DEBUG
        return true;
    }
}


/**
 * Toggles the crash auto-cashout feature on or off.
 * Validates the target value when enabling the feature.
 */
function toggleCrashAutoCashout() {
    if (!crashAutoCashoutInput || !crashAutoCashoutToggle || !LocalBrokieAPI) return;
    if (typeof LocalBrokieAPI.playSound === 'function') LocalBrokieAPI.playSound('click');

    // Tentatively toggle the state
    const intendedState = !isAutoCashoutEnabled;

    if (intendedState) { // If trying to ENABLE
        // Validate the current input value *before* confirming the state change
        if (validateAndUpdateAutoCashoutTarget()) {
             // Validation passed, confirm state change
             isAutoCashoutEnabled = true;
             if (typeof LocalBrokieAPI.showMessage === 'function') {
                LocalBrokieAPI.showMessage(`Auto-cashout enabled @ ${autoCashoutTarget.toFixed(2)}x.`, 2000);
             }
        } else {
            // Validation failed, do NOT change the state (isAutoCashoutEnabled remains false)
            // Message was already shown by the validation function
            isAutoCashoutEnabled = false; // Explicitly ensure state is false
        }
    } else { // If trying to DISABLE
         isAutoCashoutEnabled = false; // Simply disable the feature
         if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage("Auto-cashout disabled.", 2000);
         }
    }
    // Update visuals based on the *final* state of isAutoCashoutEnabled
    updateCrashAutoCashoutToggleVisuals();
}

// Make init function available globally if needed for specific module loading patterns
// window.initCrash = initCrash;
