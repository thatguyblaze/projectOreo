/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v6.4 - End on Cashout)
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
 * - Increased CRASH_MAX_TIME_MS to allow for higher potential multipliers.
 * - Game loop now stops immediately when player cashes out.
 * - Kept console logging for debugging.
 * ==========================================================================
 */

// --- Crash Game Constants ---
const CRASH_MAX_TIME_MS = 6000000; // Max time 60 seconds
// const CRASH_UPDATE_INTERVAL_MS = 50; // Target interval (RAF controls actual timing)
const CRASH_STARTING_MAX_Y = 2.0;
const CRASH_Y_AXIS_PADDING_FACTOR = 1.15;
const CRASH_RESCALE_THRESHOLD = 0.80;
const CRASH_GRID_LINES_X = 5;
const CRASH_GRID_LINES_Y = 4;
const SVG_VIEWBOX_WIDTH = 1150;
const SVG_VIEWBOX_HEIGHT = 250;
const CRASH_TICK_SOUND_START_MULTIPLIER = 1000.0; // Multiplier threshold to start tick sound

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
    // This is important for the "End on Cashout" feature, as endCrashGame sets this to false.
    if (!crashGameActive) {
        // console.log("RAF loop stopping: crashGameActive is false."); // DEBUG
        if (crashAnimationId) cancelAnimationFrame(crashAnimationId); // Ensure frame is cancelled
        crashAnimationId = null;
        return;
    }

    try {
        // Initialize startTime on the first frame if it's somehow null
        if (!crashStartTime) crashStartTime = timestamp;
        // Calculate elapsed time, ensuring it's non-negative
        const elapsedTime = Math.max(0, timestamp - crashStartTime);

        // Calculate current multiplier based on elapsed time
        const timeFactor = elapsedTime / 1000; // Time in seconds
        currentMultiplier = 1 + 0.06 * Math.pow(timeFactor, 1.65);
        currentMultiplier = Math.max(1.00, currentMultiplier); // Ensure multiplier is always at least 1.00

        // --- Check for Auto Cashout Trigger ---
        if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && currentMultiplier >= autoCashoutTarget) {
            console.log(`Auto-cashout triggered at ${currentMultiplier.toFixed(2)}x (Target: ${autoCashoutTarget.toFixed(2)}x)`); // DEBUG
            attemptCashOut(); // This will now call endCrashGame and stop the loop
            return; // Exit loop immediately after triggering cashout
        }

        // --- Check for Crash Condition ---
        const hasCrashed = currentMultiplier >= crashTargetMultiplier || elapsedTime >= CRASH_MAX_TIME_MS;

        if (hasCrashed) {
            const crashedByTime = elapsedTime >= CRASH_MAX_TIME_MS && currentMultiplier < crashTargetMultiplier;
            currentMultiplier = crashedByTime ? currentMultiplier : crashTargetMultiplier;
            currentMultiplier = Math.max(1.00, currentMultiplier); // Final safety check

            console.log(`Crashed at ${currentMultiplier.toFixed(2)}x` + (crashedByTime ? ' (Max Time Reached)' : '')); // DEBUG

            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
            crashRawPointsData.push([elapsedTime, currentMultiplier]);
            const finalPointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);
            if(crashPolyline) {
                crashPolyline.setAttribute('points', finalPointsString);
                crashPolyline.style.stroke = '#e81123'; // Red line
            }
            endCrashGame(true, crashPlayerBet, false, crashedByTime); // End the game naturally
            return; // Stop the loop
        }

        // --- Update display during active game (if not crashed yet) ---
        if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;

        // Update potential win amount display
        if (!crashCashedOut && playerHasBet) {
             const currentCashoutValue = Math.floor(crashPlayerBet * currentMultiplier);
             const potentialWinSpan = document.getElementById('potential-win-amount');
             const formattedWin = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(currentCashoutValue) : currentCashoutValue;
             if (potentialWinSpan) {
                 potentialWinSpan.textContent = formattedWin;
             } else if (crashStatusDisplay) {
                 crashStatusDisplay.innerHTML = `Value: <span id="potential-win-amount" class="font-bold text-white">${formattedWin}</span>`;
             }
        }

        applyMultiplierVisuals(); // Apply color/shake effects

        // --- Update Graph Line & Scale ---
        let rescaleNeeded = false;
        while (currentMultiplier >= currentMaxYMultiplier * CRASH_RESCALE_THRESHOLD) {
            currentMaxYMultiplier *= CRASH_Y_AXIS_PADDING_FACTOR;
            rescaleNeeded = true;
        }
        if (rescaleNeeded) {
            console.log("Rescaling Y axis to:", currentMaxYMultiplier.toFixed(2)); // DEBUG
            updateCrashGrid();
        }

        crashRawPointsData.push([elapsedTime, currentMultiplier]);
        const pointsString = calculatePointsString(crashRawPointsData, currentMaxYMultiplier);

        if(crashPolyline) {
             crashPolyline.setAttribute('points', pointsString);
        } else {
            console.error("crashPolyline element lost during update!");
            endCrashGame(false, crashPlayerBet); // Stop game if critical element lost
            return; // Exit loop
        }

        // --- Play tick sound ---
        if (!crashCashedOut && currentMultiplier >= CRASH_TICK_SOUND_START_MULTIPLIER && typeof LocalBrokieAPI.playSound === 'function') {
            LocalBrokieAPI.playSound('crash_tick', currentMultiplier);
        }

        // --- Request the next frame ---
        // Only request if the game is still active (it might have been stopped by cashout)
        if (crashGameActive) {
            crashAnimationId = requestAnimationFrame(crashGameLoop);
        } else {
             if (crashAnimationId) cancelAnimationFrame(crashAnimationId); // Explicitly cancel if stopped mid-frame
             crashAnimationId = null;
        }

    } catch (error) {
        console.error("Error inside crash game loop:", error);
        if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
        crashAnimationId = null;
        crashGameActive = false;
        if(crashStatusDisplay) crashStatusDisplay.textContent = "Game error occurred!";
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
     const effectClasses = ['shake-subtle', 'shake-strong', 'mult-color-5x', 'mult-color-10x', 'mult-color-15x', 'mult-color-20x', 'mult-color-30x', 'win-effect'];
     const sizeClasses = ['mult-size-10x', 'mult-size-20x', 'mult-size-30x'];

     crashMultiplierDisplay.classList.remove(...effectClasses, ...sizeClasses);
     crashMultiplierDisplay.style.fontSize = ''; // Reset inline font size
     crashMultiplierDisplay.classList.add('text-fluent-text-primary');

     if (displaySpan) {
         displaySpan.classList.remove(...effectClasses);
         displaySpan.className = 'font-bold text-white'; // Reset span class
     }

     // --- Apply new classes based on current multiplier ---
     let appliedColorClass = null;

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

     if (displaySpan && appliedColorClass) {
         displaySpan.classList.remove('text-white');
         displaySpan.classList.add(appliedColorClass);
     }

     if (appliedColorClass) {
         crashMultiplierDisplay.classList.remove('text-fluent-text-primary');
     }
}


/**
 * Ends the crash game round, updates UI, calculates win/loss, and handles auto-bet.
 * @param {boolean} crashed - True if the game ended due to hitting the crash target or max time.
 * @param {number} betAtEnd - The player's bet amount for this round.
 * @param {boolean} [stoppedByTabSwitch=false] - True if stopped because the user switched tabs.
 * @param {boolean} [crashedByTime=false] - True if the crash was triggered by max time limit.
 */
function endCrashGame(crashed, betAtEnd, stoppedByTabSwitch = false, crashedByTime = false) {
    // Stop the animation loop FIRST
    // Important: Set crashGameActive false *before* cancelling frame to prevent race condition in loop check
    crashGameActive = false;
    if (crashAnimationId) {
        cancelAnimationFrame(crashAnimationId);
        crashAnimationId = null;
    }

    // Prevent multiple calls if already ended (e.g. cashout then crash condition met)
    // Check if playerHasBet is true to ensure we only process end game for active bets
    // Note: This check might need refinement depending on desired behavior after cashout + natural crash
    // if (!playerHasBet && !stoppedByTabSwitch) {
    //     console.log("endCrashGame called but no active bet or already ended."); // DEBUG
    //     // Ensure controls are reset even if no bet was active
    //      if(crashBetButton) crashBetButton.disabled = false;
    //      if(crashCashoutButton) crashCashoutButton.disabled = true;
    //      if(crashBetInput) crashBetInput.disabled = false;
    //      updateCrashAutoCashoutToggleVisuals();
    //     return;
    // }


    // Re-enable betting controls and disable cashout button
    if(crashBetButton) crashBetButton.disabled = false;
    if(crashCashoutButton) crashCashoutButton.disabled = true;
    if(crashBetInput) crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Re-enable auto-cashout input if applicable

    // --- Handle Game Outcome Display and Sounds ---
    const formattedBet = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(betAtEnd) : betAtEnd;
    // Use the globally tracked currentMultiplier which was finalized before calling this
    const finalMultiplier = currentMultiplier;

    // --- Logic based on how the game ended ---

    if (stoppedByTabSwitch) { // Game stopped due to tab switch
        if (!crashCashedOut && playerHasBet) { // Player lost their bet
            if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped (inactive tab). Bet lost.";
        } else if (crashCashedOut) { // Player already cashed out
             if(crashStatusDisplay) crashStatusDisplay.textContent += " (Game stopped)"; // Append to cashout message
        } else { // No bet placed
             if(crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped (inactive tab).";
        }
    } else if (crashed) { // Game ended due to hitting target multiplier or max time
        if (!crashCashedOut && playerHasBet) { // Player bet and did NOT cash out = Loss
            if(crashMultiplierDisplay) {
                crashMultiplierDisplay.textContent = `CRASH! ${finalMultiplier.toFixed(2)}x`;
                crashMultiplierDisplay.className = 'text-fluent-danger';
            }
            if(crashPolyline) crashPolyline.style.stroke = '#e81123'; // Red line
            if(crashStatusDisplay) {
                crashStatusDisplay.textContent = `Crashed${crashedByTime ? ' (Max Time)' : ''}! You lost ${formattedBet}.`;
            }
            if (typeof LocalBrokieAPI.playSound === 'function') LocalBrokieAPI.playSound('crash_explode');
        } else if (crashCashedOut && playerHasBet) { // Player HAD cashed out before the natural crash
             // Message already set by attemptCashOut, just append crash info
             if(crashStatusDisplay) {
                crashStatusDisplay.textContent += ` (Round ended @ ${finalMultiplier.toFixed(2)}x${crashedByTime ? ' by time' : ''})`;
             }
             // Optionally play a different sound here?
        } else { // Game crashed, but player didn't bet (e.g., observer)
             if(crashStatusDisplay) {
                crashStatusDisplay.textContent = `Round Crashed @ ${finalMultiplier.toFixed(2)}x${crashedByTime ? ' (Max Time)' : ''}`;
             }
        }
    } else if (crashCashedOut) { // Game ended specifically *because* of cashout (crashed == false)
        // The main message is already set in attemptCashOut.
        // We might add a generic "Round Ended" or leave as is.
        if(crashStatusDisplay && crashStatusDisplay.textContent.includes("Cashed Out")) {
             // Message already indicates cashout success. No extra text needed.
        } else {
            // Fallback if status wasn't updated correctly
             if(crashStatusDisplay) crashStatusDisplay.textContent = `Round ended after cashout.`;
        }
    } else {
         // Fallback for any other unexpected end condition
         console.warn("endCrashGame reached unexpected state.");
         if(crashStatusDisplay) crashStatusDisplay.textContent = "Round finished.";
    }


    // --- Save Game State (Optional) ---
    if (LocalBrokieAPI && typeof LocalBrokieAPI.saveGameState === 'function') {
        LocalBrokieAPI.saveGameState();
    } else {
        // console.warn("LocalBrokieAPI.saveGameState is not a function. Game state not saved.");
    }

    // Reset bet amount and status for the next round
    const betBeforeReset = crashPlayerBet; // Store bet before resetting for auto-bet check
    crashPlayerBet = 0;
    playerHasBet = false; // Reset bet status

    // --- Handle Auto-Bet ---
    // Start next round only if auto-bet is on AND the game wasn't stopped externally
    if (isCrashAutoBetting && !stoppedByTabSwitch && betBeforeReset > 0) { // Also ensure a valid bet was made
        console.log("Auto-bet: Scheduling next bet."); // DEBUG
        setTimeout(placeBetAndStart, 1500); // Delay before starting next round
    } else {
         console.log(`Auto-bet: Not starting next round. isCrashAutoBetting=${isCrashAutoBetting}, stoppedByTabSwitch=${stoppedByTabSwitch}, betBeforeReset=${betBeforeReset}`); // DEBUG
         // If auto-betting was stopped/off, ensure controls are fully reset/enabled
         // Resetting visuals again here might be redundant if called correctly earlier
         // but ensures clean state if endCrashGame is somehow called unexpectedly.
         // if(!crashGameActive) { // Check again just in case
         //     resetCrashVisuals();
         // }
    }
}

/**
 * Attempts to cash out the current crash game bet at the current multiplier.
 * Called by button click or auto-cashout trigger.
 * Ends the game immediately upon successful cashout.
 */
function attemptCashOut() {
    // --- Pre-conditions for Cashout ---
    if (!crashGameActive || crashCashedOut || !crashCashoutButton || !playerHasBet) {
        console.warn(`Cashout attempt failed: gameActive=${crashGameActive}, cashedOut=${crashCashedOut}, playerHasBet=${playerHasBet}`);
        return; // Exit if conditions not met
    }

    // --- Mark as Cashed Out & Disable Button ---
    crashCashedOut = true;
    crashCashoutButton.disabled = true;

    // --- Calculate Winnings ---
    const cashoutMultiplier = currentMultiplier; // Capture multiplier
    const totalReturn = Math.floor(crashPlayerBet * cashoutMultiplier);
    const profit = totalReturn - crashPlayerBet;

    // --- Update Balance & Play Sound ---
    if (typeof LocalBrokieAPI.updateBalance === 'function') {
        LocalBrokieAPI.updateBalance(totalReturn);
    } else {
        console.warn("LocalBrokieAPI.updateBalance is not a function.");
    }
    if (typeof LocalBrokieAPI.playSound === 'function') {
        LocalBrokieAPI.playSound('crash_cashout');
    }

    // --- Update UI and Records ---
    const formattedProfit = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(profit) : profit;
    const formattedReturn = (typeof LocalBrokieAPI.formatWin === 'function') ? LocalBrokieAPI.formatWin(totalReturn) : totalReturn;

    if (profit > 0) {
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x! Won ${formattedProfit}!`, 3000);
        }
        if (typeof LocalBrokieAPI.addWin === 'function') {
            LocalBrokieAPI.addWin('Crash', profit);
        } else {
             console.warn("LocalBrokieAPI.addWin is not a function.");
        }
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out! Won ${formattedProfit}. Total: ${formattedReturn}`;
        if(crashMultiplierDisplay) {
             crashMultiplierDisplay.classList.add('win-effect');
             // Don't use timeout to remove, endCrashGame will reset visuals
             // setTimeout(() => { if(crashMultiplierDisplay) crashMultiplierDisplay.classList.remove('win-effect') }, 1000);
        }
    } else {
        if (typeof LocalBrokieAPI.showMessage === 'function') {
            LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x. No profit. Returned ${formattedReturn}`, 3000);
        }
        if(crashStatusDisplay) crashStatusDisplay.textContent = `Cashed Out @ ${cashoutMultiplier.toFixed(2)}x. Returned ${formattedReturn}.`;
    }

    // --- End the Game Immediately ---
    // Call endCrashGame, indicating it did NOT crash naturally (crashed = false)
    console.log(`Game ended by cashout at ${cashoutMultiplier.toFixed(2)}x`); // DEBUG
    endCrashGame(false, crashPlayerBet); // Pass false for 'crashed' parameter

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
