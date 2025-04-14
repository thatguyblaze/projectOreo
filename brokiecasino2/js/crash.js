/**
 * Brokie Casino - Crash Game Logic (crash.js)
 *
 * Handles all functionality related to the Crash game.
 * Depends on functions and variables defined in main.js.
 */

// --- Crash Game Specific State & Constants ---
let crashGameActive = false; // Make global within this script's scope
let crashMultiplier = 1.00;
let crashTargetMultiplier = 1.00;
let crashInterval = null; // For the game loop
let crashPlayerBet = 0;
let crashCashedOut = false;
let crashTimeStep = 0; // Counter for x-axis progression
const CRASH_UPDATE_INTERVAL = 100; // ms interval for game loop
const INITIAL_VIEWBOX_WIDTH = 100; // Initial SVG viewbox width
const INITIAL_VIEWBOX_HEIGHT = 100; // Initial SVG viewbox height
let currentViewBox = { x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT };
const VIEWBOX_PAN_THRESHOLD = 0.5; // Pan when point crosses 50% width/height
const CRASH_Y_SCALING_FACTOR = 15; // How fast line moves up vertically relative to multiplier
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 0;

// --- DOM Elements (Crash Game Specific) ---
let crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline;
let crashBetInput, crashBetButton, crashCashoutButton, crashStatus;
let crashAutoBetToggle, crashAutoCashoutInput, crashAutoCashoutToggle;

/**
 * Initializes the Crash game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initCrash() {
    console.log("Initializing Crash Game...");
    // Get DOM elements
    crashGraph = document.getElementById('crash-graph');
    crashMultiplierDisplay = document.getElementById('crash-multiplier');
    crashSvg = document.getElementById('crash-svg');
    crashGrid = document.getElementById('crash-grid');
    crashPolyline = document.getElementById('crash-polyline');
    crashBetInput = document.getElementById('crash-bet');
    crashBetButton = document.getElementById('crash-bet-button');
    crashCashoutButton = document.getElementById('crash-cashout-button');
    crashStatus = document.getElementById('crash-status');
    crashAutoBetToggle = document.getElementById('crash-auto-bet-toggle');
    crashAutoCashoutInput = document.getElementById('crash-auto-cashout-input');
    crashAutoCashoutToggle = document.getElementById('crash-auto-cashout-toggle');

    // Check if all essential elements were found
    if (!crashGraph || !crashMultiplierDisplay || !crashSvg || !crashGrid || !crashPolyline ||
        !crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatus ||
        !crashAutoBetToggle || !crashAutoCashoutInput || !crashAutoCashoutToggle) {
        console.error("Crash Game initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-crash');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Crash Game elements.</p>';
        return; // Stop initialization
    }

    // Set initial state
    resetCrashVisuals();
    updateCrashAutoCashoutToggleVisuals();

    // Add Event Listeners
    crashBetButton.addEventListener('click', startCrashGame);
    crashCashoutButton.addEventListener('click', attemptCashOut);
    crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);

    // Listener for changes in the auto-cashout input field
    crashAutoCashoutInput.addEventListener('change', () => {
        // Update target value only if auto-cashout is currently enabled
        if (isAutoCashoutEnabled) {
            const target = parseFloat(crashAutoCashoutInput.value);
            if (!isNaN(target) && target >= 1.01) {
                autoCashoutTarget = target;
                crashAutoCashoutInput.value = target.toFixed(2); // Format input
                showMessage(`Auto-cashout target updated to ${target.toFixed(2)}x`, 1500); // uses main.js
            } else {
                showMessage("Invalid auto-cashout target. Must be >= 1.01", 2500); // uses main.js
                // Reset input to previous valid target or placeholder if invalid
                crashAutoCashoutInput.value = autoCashoutTarget > 0 ? autoCashoutTarget.toFixed(2) : '';
            }
        }
    });
     // Prevent non-numeric input (allow decimal)
     crashAutoCashoutInput.addEventListener('input', () => {
        crashAutoCashoutInput.value = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '');
     });


    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('crash', crashBetInput); // uses main.js

    console.log("Crash Game Initialized.");
}

/**
 * Updates the background grid lines in the SVG based on the current viewbox.
 * @param {object} viewBox - The current SVG viewbox object {x, y, width, height}.
 */
function updateCrashGrid(viewBox) {
    if (!crashGrid) return;
    crashGrid.innerHTML = ''; // Clear existing grid lines
    const vb = viewBox;
    const numVerticalLines = 5;
    const numHorizontalLines = 4;

    // Draw vertical lines
    const xStep = vb.width / numVerticalLines;
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
    const yStep = vb.height / numHorizontalLines;
    for (let i = 1; i < numHorizontalLines; i++) { // Start from 1, end before numHorizontalLines
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
    if (!crashMultiplierDisplay || !crashSvg || !crashPolyline || !crashStatus) return;

    crashMultiplier = 1.00;
    crashTimeStep = 0;
    // Reset SVG viewbox
    currentViewBox = { x: 0, y: 0, width: INITIAL_VIEWBOX_WIDTH, height: INITIAL_VIEWBOX_HEIGHT };
    crashSvg.setAttribute('viewBox', `0 0 ${INITIAL_VIEWBOX_WIDTH} ${INITIAL_VIEWBOX_HEIGHT}`);
    // Reset multiplier display
    crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
    crashMultiplierDisplay.className = ''; // Clear all classes first
    crashMultiplierDisplay.classList.add('text-gray-300'); // Re-add default class (from CSS)
    crashMultiplierDisplay.style.fontSize = ''; // Reset font size
    // Reset graph line
    crashPolyline.setAttribute('points', `0,${INITIAL_VIEWBOX_HEIGHT}`); // Start at bottom-left
    crashPolyline.style.stroke = '#34d399'; // Reset to green
    crashStatus.textContent = ''; // Clear status message
    updateCrashGrid(currentViewBox); // Redraw initial grid
}

/**
 * Calculates the target multiplier where the game will crash.
 * Uses a distribution favoring lower multipliers but allowing high ones.
 * @returns {number} The calculated crash multiplier (>= 1.01).
 */
function calculateCrashTarget() {
    const r = Math.random();
    const houseEdge = 0.02; // 2% chance of instant crash at 1.00x

    // Instant crash based on house edge
    if (r < houseEdge) {
        return 1.00;
    }

    // Calculate multiplier using an exponential distribution adjusted for house edge
    // This formula creates more lower multipliers and fewer very high ones
    const effectiveRandom = (r - houseEdge) / (1 - houseEdge); // Adjust random number to exclude house edge range
    const exponent = 1.85 ; // Controls the curve steepness (higher = more low multipliers)
    const multiplierBase = 1 / Math.pow(1 - effectiveRandom, 1 / exponent);

    // Ensure minimum multiplier is 1.01 and round to 2 decimal places
    return Math.max(1.01, Math.floor(multiplierBase * 100) / 100);
}

/**
 * Starts a new round of the crash game. Validates bet, updates state, starts game loop.
 */
function startCrashGame() {
    // Check elements exist
    if (!crashBetInput || !crashBetButton || !crashCashoutButton || !crashStatus || !crashAutoBetToggle || !crashAutoCashoutToggle || !crashAutoCashoutInput) {
        console.error("Cannot start Crash game, elements not initialized.");
        return;
    }
    // Check bet validity, especially for auto-bet
    if (isCrashAutoBetting) {
        const betAmount = parseInt(crashBetInput.value);
        if (isNaN(betAmount) || betAmount <= 0 || betAmount > currency) { // uses currency from main.js
            showMessage("Auto-bet stopped: Invalid bet or insufficient funds.", 3000); // uses main.js
            stopCrashAutoBet();
            return;
        }
    } else { // Manual bet validation
        const betAmount = parseInt(crashBetInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
        }
        if (betAmount > currency) { // uses currency from main.js
            showMessage("Not enough currency! Try the loan button?", 2000); return; // uses main.js
        }
    }

    if (crashGameActive) return; // Don't start if already active

    const betAmount = parseInt(crashBetInput.value);
    startTone(); // Ensure audio context (from main.js)
    crashPlayerBet = betAmount;
    currency -= betAmount; // uses currency from main.js
    updateCurrencyDisplay('loss'); // Update display immediately (from main.js)

    crashGameActive = true;
    crashCashedOut = false;
    crashTargetMultiplier = calculateCrashTarget();
    resetCrashVisuals(); // Reset graph and multiplier display
    crashStatus.innerHTML = `Bet Placed! Current Value: <span id="potential-win-amount" class="font-bold text-gray-300">${formatWin(crashPlayerBet)}</span>`; // uses formatWin from main.js

    // Disable controls during game
    crashBetButton.disabled = true;
    crashCashoutButton.disabled = false; // Enable cashout
    crashBetInput.disabled = true;
    crashAutoBetToggle.disabled = true;
    crashAutoCashoutToggle.disabled = true;
    crashAutoCashoutInput.disabled = true; // Disable input during game

    crashMultiplierDisplay.classList.remove('win-effect'); // Remove previous win effect
    if(crashGraph) crashGraph.offsetHeight; // Force reflow for smooth animation start

    let pathPoints = [[0, INITIAL_VIEWBOX_HEIGHT]]; // Start path at bottom-left

    // --- Crash Game Loop ---
    if (crashInterval) clearInterval(crashInterval); // Clear any existing interval first
    crashInterval = setInterval(() => {
        if (!crashGameActive) { // Stop loop if game ended externally
            clearInterval(crashInterval);
            crashInterval = null;
            return;
        }

        crashTimeStep++;

        // Calculate multiplier increment (increases faster at higher multipliers)
        const randomFactor = 0.7 + Math.random() * 0.6; // Add some randomness
        const baseIncrement = 0.01 * Math.max(1, Math.pow(crashMultiplier, 0.4));
        const increment = baseIncrement * randomFactor;
        crashMultiplier += increment;

        // Check for Auto Cashout
        if (isAutoCashoutEnabled && !crashCashedOut && crashMultiplier >= autoCashoutTarget) {
            showMessage(`Auto-cashed out at ${autoCashoutTarget.toFixed(2)}x!`, 2000); // uses main.js
            attemptCashOut(); // Attempt cashout automatically
            // attemptCashOut calls endCrashGame which clears the interval
            return; // Exit loop processing for this tick
        }

        // Check for Crash
        if (crashMultiplier >= crashTargetMultiplier) {
            clearInterval(crashInterval); // Stop the game loop
            crashInterval = null;
            crashMultiplier = crashTargetMultiplier; // Set final multiplier to target

            // Update display and visuals for the crash moment
            if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`; // Display final multiplier

            // Calculate final point and update SVG viewbox to ensure line is visible
            const finalX = crashTimeStep * (INITIAL_VIEWBOX_WIDTH / 100);
            const finalY = INITIAL_VIEWBOX_HEIGHT - Math.max(0, (crashMultiplier - 1) * CRASH_Y_SCALING_FACTOR);
            pathPoints.push([finalX, finalY]);

            // Adjust viewbox to fit the final point
            let finalViewBoxWidth = Math.max(INITIAL_VIEWBOX_WIDTH, finalX * 1.1);
            let finalViewBoxHeight = Math.max(INITIAL_VIEWBOX_HEIGHT, (INITIAL_VIEWBOX_HEIGHT - finalY) * 1.1);
            let finalViewBoxX = Math.max(0, finalX - finalViewBoxWidth * VIEWBOX_PAN_THRESHOLD);
            let finalViewBoxY = Math.max(0, INITIAL_VIEWBOX_HEIGHT - finalViewBoxHeight); // Ensure Y is not negative
            currentViewBox = { x: finalViewBoxX, y: finalViewBoxY, width: finalViewBoxWidth, height: finalViewBoxHeight };

            if(crashSvg) crashSvg.setAttribute('viewBox', `${currentViewBox.x.toFixed(2)} ${currentViewBox.y.toFixed(2)} ${currentViewBox.width.toFixed(2)} ${currentViewBox.height.toFixed(2)}`);
            if(crashPolyline) {
                crashPolyline.setAttribute('points', pathPoints.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' '));
                crashPolyline.style.stroke = '#ef4444'; // Turn line red on crash
            }
            updateCrashGrid(currentViewBox); // Update grid for final viewbox

            // End the game after a short delay to show the crash point
            setTimeout(() => endCrashGame(true, crashPlayerBet), 100); // Crashed = true
            return; // Exit loop
        }

        // --- Update display during active game ---
        if(crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${crashMultiplier.toFixed(2)}x`;
        const currentCashoutValue = Math.floor(crashPlayerBet * crashMultiplier);
        const potentialWinSpan = document.getElementById('potential-win-amount');
        if (potentialWinSpan) {
            potentialWinSpan.textContent = formatWin(currentCashoutValue); // uses main.js
        } else if (crashStatus) { // Fallback if span somehow disappears
            crashStatus.innerHTML = `Current Value: <span id="potential-win-amount" class="font-bold text-gray-300">${formatWin(currentCashoutValue)}</span>`; // uses main.js
        }

        // Apply visual effects based on multiplier
        if (crashMultiplierDisplay) {
            const displaySpan = document.getElementById('potential-win-amount'); // Get span again for styling
            // Clear previous multiplier styles first
            crashMultiplierDisplay.classList.remove('shake-subtle', 'shake-strong', 'mult-color-5x', 'mult-color-10x', 'mult-color-15x', 'mult-color-20x', 'mult-color-30x', 'mult-size-10x', 'mult-size-20x', 'mult-size-30x');
            crashMultiplierDisplay.style.fontSize = ''; // Reset font size
            if (displaySpan) displaySpan.className = 'font-bold text-gray-300'; // Reset potential win color

            // Apply new styles based on current multiplier
            if (crashMultiplier >= 30) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-30x', 'mult-size-30x'); if (displaySpan) displaySpan.classList.add('mult-color-30x'); }
            else if (crashMultiplier >= 20) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-20x', 'mult-size-20x'); if (displaySpan) displaySpan.classList.add('mult-color-20x'); }
            else if (crashMultiplier >= 15) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-15x', 'mult-size-10x'); if (displaySpan) displaySpan.classList.add('mult-color-15x'); }
            else if (crashMultiplier >= 10) { crashMultiplierDisplay.classList.add('shake-strong', 'mult-color-10x', 'mult-size-10x'); if (displaySpan) displaySpan.classList.add('mult-color-10x'); }
            else if (crashMultiplier >= 5) { crashMultiplierDisplay.classList.add('shake-subtle', 'mult-color-5x'); if (displaySpan) displaySpan.classList.add('mult-color-5x'); }
            else if (crashMultiplier >= 3) { crashMultiplierDisplay.classList.add('shake-subtle'); }
        }

        // Update graph line and viewbox dynamically
        const currentX = crashTimeStep * (INITIAL_VIEWBOX_WIDTH / 100); // X position based on time step
        const currentY = INITIAL_VIEWBOX_HEIGHT - Math.max(0, (crashMultiplier - 1) * CRASH_Y_SCALING_FACTOR); // Y position based on multiplier
        pathPoints.push([currentX, currentY]);

        // Calculate required viewbox size to fit the current point
        let targetViewBoxWidth = currentViewBox.width;
        let targetViewBoxHeight = currentViewBox.height;
        let targetViewBoxX = currentViewBox.x;
        let targetViewBoxY = currentViewBox.y;

        const requiredWidth = Math.max(INITIAL_VIEWBOX_WIDTH, currentX * 1.1); // Need width at least initial, or 110% of current X
        const requiredHeight = Math.max(INITIAL_VIEWBOX_HEIGHT, (INITIAL_VIEWBOX_HEIGHT - currentY) * 1.1); // Need height at least initial, or 110% of current Y extent

        targetViewBoxWidth = Math.max(currentViewBox.width, requiredWidth); // Expand width if needed
        targetViewBoxHeight = Math.max(currentViewBox.height, requiredHeight); // Expand height if needed

        // Pan viewbox rightwards if point crosses threshold
        targetViewBoxX = Math.max(0, currentX - targetViewBoxWidth * VIEWBOX_PAN_THRESHOLD);
        // Pan viewbox upwards (decrease Y origin)
        targetViewBoxY = Math.max(0, INITIAL_VIEWBOX_HEIGHT - targetViewBoxHeight); // Y origin is top-left

        // Update viewbox state and SVG attribute
        currentViewBox = { x: targetViewBoxX, y: targetViewBoxY, width: targetViewBoxWidth, height: targetViewBoxHeight };
        if(crashSvg) crashSvg.setAttribute('viewBox', `${currentViewBox.x.toFixed(2)} ${currentViewBox.y.toFixed(2)} ${currentViewBox.width.toFixed(2)} ${currentViewBox.height.toFixed(2)}`);
        if(crashPolyline) crashPolyline.setAttribute('points', pathPoints.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')); // Update polyline
        updateCrashGrid(currentViewBox); // Redraw grid for new viewbox

        // Change line color as it approaches crash target (visual tension)
        if (crashPolyline) {
            const closeness = crashMultiplier / crashTargetMultiplier;
            if (closeness > 0.8) {
                const yellowIntensity = Math.min(255, 50 + (closeness - 0.8) * 1000);
                const greenIntensity = Math.max(50, 200 - (closeness - 0.8) * 500);
                crashPolyline.style.stroke = `rgb(${yellowIntensity}, ${greenIntensity}, 0)`;
            } else {
                crashPolyline.style.stroke = '#34d399'; // Default green
            }
        }
        // Play tick sound based on multiplier
        playSound('crash_tick', crashMultiplier); // uses main.js

    }, CRASH_UPDATE_INTERVAL);
}

/**
 * Ends the crash game round (either by crashing or cashing out).
 * Updates UI, currency, stats, and handles auto-bet continuation.
 * @param {boolean} crashed - Whether the game ended due to a crash.
 * @param {number} betAtEnd - The bet amount relevant for loss calculation if crashed.
 * @param {boolean} [stoppedByTabSwitch=false] - If true, the game was stopped by switching tabs.
 */
function endCrashGame(crashed, betAtEnd, stoppedByTabSwitch = false) {
    if (crashInterval) { // Ensure loop is stopped
        clearInterval(crashInterval);
        crashInterval = null;
    }
    // Avoid ending already ended game unless forced by tab switch
    if (!crashGameActive && !crashed && !stoppedByTabSwitch) {
         console.warn("endCrashGame called but game not active.");
         return;
    }

    // Make sure bet amount is correct for loss calculation if crashed
    const betForCalculation = crashed ? betAtEnd : crashPlayerBet;

    crashGameActive = false; // Mark game as inactive

    // Re-enable controls (check if elements exist first)
    if(crashBetButton) crashBetButton.disabled = false;
    if(crashCashoutButton) crashCashoutButton.disabled = true; // Disable cashout after round ends
    if(crashBetInput) crashBetInput.disabled = false;
    if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals(); // Update input state based on toggle

    // Handle crash outcome
    if (crashed && !stoppedByTabSwitch) {
        totalLoss += betForCalculation; // Add bet amount to total loss (uses main.js)
        if (crashMultiplierDisplay) {
            crashMultiplierDisplay.textContent = `CRASH! ${crashTargetMultiplier.toFixed(2)}x`;
            crashMultiplierDisplay.classList.remove('text-gray-300', 'win-effect');
            crashMultiplierDisplay.classList.add('text-red-500'); // Red text for crash
        }
        if(crashPolyline) crashPolyline.style.stroke = '#ef4444'; // Ensure line is red
        if(crashStatus) crashStatus.textContent = `Crashed! You lost ${formatWin(betForCalculation)}.`; // uses main.js
        playSound('crash_explode'); // uses main.js
        updateCurrencyDisplay(); // Update currency (no change type) (uses main.js)
    }
    // Handle cashout outcome
    else if (!crashed && !stoppedByTabSwitch) {
        const totalReturn = Math.floor(crashPlayerBet * crashMultiplier);
        const profit = totalReturn - crashPlayerBet;
        currency += totalReturn; // Add winnings back to currency (uses main.js)
        totalGain += Math.max(0, profit); // Add profit to total gain (uses main.js)

        if (profit > 0) {
            if(crashStatus) crashStatus.textContent = `Cashed out @ ${crashMultiplier.toFixed(2)}x! Won ${formatWin(profit)}.`; // uses main.js
            playSound('crash_cashout'); // uses main.js
            addWinToLeaderboard('Crash', profit); // uses main.js
            if(crashMultiplierDisplay) {
                crashMultiplierDisplay.classList.add('win-effect'); // Add win effect
                setTimeout(() => crashMultiplierDisplay.classList.remove('win-effect'), 1000); // Remove effect after delay
            }
            updateCurrencyDisplay('win'); // Update currency (flash green) (uses main.js)
        } else { // Cashed out at 1.00x or somehow less
            if(crashStatus) crashStatus.textContent = `Cashed out @ ${crashMultiplier.toFixed(2)}x. No profit.`;
            updateCurrencyDisplay(); // Update currency (no flash) (uses main.js)
        }
    }
    // Handle game stopped by switching tabs
    else if (stoppedByTabSwitch) {
        // The bet was already subtracted, consider it a loss for simplicity unless cashed out before switch
        if (!crashCashedOut) {
            totalLoss += betForCalculation; // uses main.js
            if(crashStatus) crashStatus.textContent = "Game stopped by switching tabs. Bet lost.";
            updateCurrencyDisplay(); // uses main.js
        }
        // If cashed out just before switching, the win was already processed.
    }

    saveGameState(); // Save state after round ends (uses main.js)
    crashPlayerBet = 0; // Reset player bet for the round

    // Start next round if auto-bet is on
    if (isCrashAutoBetting && !stoppedByTabSwitch) {
        setTimeout(startCrashGame, 1500); // Delay before starting next auto-bet round
    }
}

/**
 * Attempts to cash out the current crash game bet.
 */
function attemptCashOut() {
    if (!crashGameActive || crashCashedOut) return; // Can't cash out if game not active or already cashed out
    crashCashedOut = true; // Mark as cashed out
    if(crashCashoutButton) crashCashoutButton.disabled = true; // Disable button immediately
    // Pass false for 'crashed', use current crashPlayerBet
    // endCrashGame clears the interval
    endCrashGame(false, crashPlayerBet);
}

/**
 * Stops the crash auto-bet feature and updates UI.
 */
function stopCrashAutoBet() {
    isCrashAutoBetting = false;
    if (crashAutoBetToggle) {
        crashAutoBetToggle.classList.remove('active');
        crashAutoBetToggle.textContent = 'Auto Bet Off';
    }
    // Re-enable controls if game is not currently active
    if (!crashGameActive) {
        if(crashBetButton) crashBetButton.disabled = false;
        if(crashBetInput) crashBetInput.disabled = false;
        if(crashAutoBetToggle) crashAutoBetToggle.disabled = false;
        if(crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
        updateCrashAutoCashoutToggleVisuals(); // Update input state
    }
}

/**
 * Toggles the crash auto-bet feature on or off.
 */
function toggleCrashAutoBet() {
    if (!crashAutoBetToggle) return;
    isCrashAutoBetting = !isCrashAutoBetting;
    if (isCrashAutoBetting) {
        crashAutoBetToggle.classList.add('active');
        crashAutoBetToggle.textContent = 'Auto Bet ON';
        if (!crashGameActive) {
            startCrashGame(); // Start game immediately if auto-bet turned on and game inactive
        }
    } else {
        stopCrashAutoBet();
    }
}

/**
 * Updates the visuals and state of the auto-cashout input/toggle button.
 */
function updateCrashAutoCashoutToggleVisuals() {
    if (!crashAutoCashoutToggle || !crashAutoCashoutInput) return;
    if (isAutoCashoutEnabled) {
        crashAutoCashoutToggle.classList.add('active');
        crashAutoCashoutToggle.textContent = 'Enabled';
        crashAutoCashoutInput.value = autoCashoutTarget > 0 ? autoCashoutTarget.toFixed(2) : '';
    } else {
        crashAutoCashoutToggle.classList.remove('active');
        crashAutoCashoutToggle.textContent = 'Enable';
    }
    // Input should be editable ONLY when the toggle is enabled AND the game is NOT active
    crashAutoCashoutInput.disabled = !(isAutoCashoutEnabled && !crashGameActive);
}

/**
 * Toggles the crash auto-cashout feature on or off.
 */
function toggleCrashAutoCashout() {
    if (!crashAutoCashoutInput || !crashAutoCashoutToggle) return;
    isAutoCashoutEnabled = !isAutoCashoutEnabled;
    if (isAutoCashoutEnabled) {
        const target = parseFloat(crashAutoCashoutInput.value);
        if (isNaN(target) || target < 1.01) {
            showMessage("Invalid auto-cashout target. Must be >= 1.01", 2500); // uses main.js
            isAutoCashoutEnabled = false; // Turn back off if invalid
        } else {
            autoCashoutTarget = target;
            crashAutoCashoutInput.value = target.toFixed(2); // Format input
            showMessage(`Auto-cashout enabled at ${target.toFixed(2)}x`, 2000); // uses main.js
        }
    } else {
        showMessage("Auto-cashout disabled.", 2000); // uses main.js
        autoCashoutTarget = 0; // Reset target
    }
    updateCrashAutoCashoutToggleVisuals(); // Update UI state
}


// Note: The initCrash() function will be called from main.js
// Ensure main.js includes: if (typeof initCrash === 'function') initCrash();
// within its DOMContentLoaded listener.
