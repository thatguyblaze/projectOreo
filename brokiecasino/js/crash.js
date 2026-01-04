/**
 * ==========================================================================
 * Brokie Casino - Crash Game Logic (v7.0 - Scrolling Graph & Volatility)
 *
 * - Uses BrokieAPI object.
 * - NEW: Scrolling graph (line stays in center, world moves left).
 * - NEW: Visual volatility (fake out dips) while maintaining exponential underlying multiplier.
 * - Fixed auto-cashout logic.
 * - Uses requestAnimationFrame loop.
 * - Game loop now stops immediately when player cashes out.
 * ==========================================================================
 */

// --- Crash Game Constants ---
const CRASH_MAX_TIME_MS = 6000000; // Max time
const CRASH_STARTING_MAX_Y = 2.0;
const CRASH_Y_AXIS_PADDING_FACTOR = 1.15;
const CRASH_RESCALE_THRESHOLD = 0.80;
const SVG_VIEWBOX_WIDTH = 800;
const SVG_VIEWBOX_HEIGHT = 400;
const CRASH_TICK_SOUND_START_MULTIPLIER = 1000.0;
const CENTER_X_RATIO = 0.5; // Line head stays at 50% width

// --- Crash Game State Variables ---
let crashGameActive = false;
let crashStartTime = null;
let currentMultiplier = 1.00;
let displayedMultiplier = 1.00; // The fluctuating visual value
let crashTargetMultiplier = 1.00;
let crashAnimationId = null;
let crashPlayerBet = 0;
let crashCashedOut = false;
let crashRawPointsData = []; // [elapsedTime, visualMultiplier]
let currentMaxYMultiplier = CRASH_STARTING_MAX_Y;
let isCrashAutoBetting = false;
let isAutoCashoutEnabled = false;
let autoCashoutTarget = 1.50;
let playerHasBet = false;
let crashPointsString = '';
let crashHistory = []; // Stores last 5 multipliers -> New History Array

// --- Helper for HTML Injection of History & Skip ---
function injectCrashHistoryAndControls() {
    const statusP = document.getElementById('crash-status');
    if (statusP && !document.getElementById('crash-history-list')) {
        // Create History Container above Graph (inside game-crash container) or below?
        // Let's put it above the graph.
        const graph = document.getElementById('crash-graph');
        if (graph) {
            const histContainer = document.createElement('div');
            histContainer.className = "flex justify-between items-center mb-2 w-full max-w-2xl";
            histContainer.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-[10px] uppercase font-bold text-slate-500">Last 5:</span>
                    <div id="crash-history-list" class="flex gap-1"></div>
                </div>
                <button id="crash-skip-button" class="hidden text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-slate-300 border border-white/5 transition-colors">⏩ SKIP</button>
            `;
            graph.parentNode.insertBefore(histContainer, graph);
        }
    }
}
// Render Logic
function renderCrashHistory() {
    const container = document.getElementById('crash-history-list');
    if (!container) return;
    container.innerHTML = '';

    // Show newest first (left to right? or right to left?)
    // Standard is newest on right or left. Let's do newest on left.
    crashHistory.forEach(mult => {
        const item = document.createElement('div');
        let colorClass = 'text-slate-400 border-slate-700';
        if (mult >= 10) colorClass = 'text-amber-400 border-amber-500/50 bg-amber-500/10';
        else if (mult >= 2) colorClass = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
        else colorClass = 'text-rose-400 border-rose-500/50 bg-rose-500/10';

        item.className = `px-2 py-0.5 rounded text-[10px] font-mono border ${colorClass}`;
        item.textContent = `${mult.toFixed(2)}x`;
        container.appendChild(item);
    });
}
function addToCrashHistory(val) {
    crashHistory.unshift(val);
    if (crashHistory.length > 5) crashHistory.pop();
    renderCrashHistory();
}

// --- DOM Element References ---
let crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline;
let crashBetInput, crashBetButton, crashCashoutButton, crashStatusDisplay;
let crashAutoBetToggle, crashAutoCashoutInput, crashAutoCashoutToggle;
let crashLiveStake, crashLiveProfit; // New refs

// --- API Reference (Passed from main.js) ---
let LocalBrokieAPI = null;

function initCrash(API) {
    // console.log("Initializing Crash Game (v7.0)...");
    LocalBrokieAPI = API;
    if (!LocalBrokieAPI) {
        console.error("Crash Game initialization failed: BrokieAPI object not provided.");
        return;
    }
    if (!assignCrashDOMElements()) return;

    resetCrashVisuals();
    updateCrashAutoCashoutToggleVisuals();

    // Inject History UI
    injectCrashHistoryAndControls();
    renderCrashHistory();

    setupCrashEventListeners();

    if (LocalBrokieAPI && typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
        LocalBrokieAPI.addBetAdjustmentListeners('crash', crashBetInput);
    }
    // console.log("Crash Initialized");
}

function assignCrashDOMElements() {
    crashGraph = document.getElementById('crash-graph');
    crashMultiplierDisplay = document.getElementById('crash-multiplier');
    crashSvg = document.getElementById('crash-svg');
    // Ensure we have the necessary groups in the SVG, or create them
    if (crashSvg) {
        let gridGroup = document.getElementById('crash-grid');
        if (!gridGroup) {
            gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gridGroup.id = 'crash-grid';
            crashSvg.prepend(gridGroup);
        }
        crashGrid = gridGroup;
    }
    crashPolyline = document.getElementById('crash-polyline');

    crashBetInput = document.getElementById('crash-bet');
    crashBetButton = document.getElementById('crash-bet-button');
    crashCashoutButton = document.getElementById('crash-cashout-button');
    crashStatusDisplay = document.getElementById('crash-status');
    crashAutoBetToggle = document.getElementById('crash-auto-bet-toggle');
    crashAutoCashoutInput = document.getElementById('crash-auto-cashout-input');
    crashAutoCashoutToggle = document.getElementById('crash-auto-cashout-toggle');
    crashLiveStake = document.getElementById('crash-live-stake');
    crashLiveProfit = document.getElementById('crash-live-profit');

    const elements = { crashGraph, crashMultiplierDisplay, crashSvg, crashGrid, crashPolyline, crashBetInput, crashBetButton, crashCashoutButton, crashStatusDisplay };
    for (const key in elements) {
        if (!elements[key]) {
            console.error(`Crash Game initialization failed: Missing ${key}.`);
            return false;
        }
    }
    return true;
}

function setupCrashEventListeners() {
    if (crashBetButton) crashBetButton.addEventListener('click', placeBetAndStart);
    if (crashCashoutButton) crashCashoutButton.addEventListener('click', attemptCashOut);
    if (crashAutoBetToggle) crashAutoBetToggle.addEventListener('click', toggleCrashAutoBet);
    if (crashAutoCashoutToggle) crashAutoCashoutToggle.addEventListener('click', toggleCrashAutoCashout);

    if (crashAutoCashoutInput) {
        crashAutoCashoutInput.addEventListener('change', validateAndUpdateAutoCashoutTarget);
        crashAutoCashoutInput.addEventListener('input', () => {
            let val = crashAutoCashoutInput.value.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('');
            }
            if (crashAutoCashoutInput.value !== val) {
                crashAutoCashoutInput.value = val;
            }
        });
    }

    // Bind Skip Button
    const skipBtn = document.getElementById('crash-skip-button');
    if (skipBtn) {
        skipBtn.onclick = () => {
            if (crashGameActive) {
                // Force the game loop to see a crash on next tick
                // We do this by artificially setting the start time way back
                crashStartTime = performance.now() - (CRASH_MAX_TIME_MS + 1000);
                // Also snap visual
                displayedMultiplier = crashTargetMultiplier;
            }
        };
    }
}

// Render Logic
function renderCrashHistory() {
    const container = document.getElementById('crash-history-list');
    if (!container) return;
    container.innerHTML = '';

    // Check if empty
    if (crashHistory.length === 0) {
        container.innerHTML = '<span class="text-[10px] text-slate-500 italic">No history</span>';
        return;
    }

    crashHistory.forEach(mult => {
        const item = document.createElement('div');
        let colorClass = 'text-slate-400 border-slate-700 bg-slate-800/50';
        if (mult >= 10) colorClass = 'text-amber-400 border-amber-500/50 bg-amber-500/10';
        else if (mult >= 2) colorClass = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
        else colorClass = 'text-rose-400 border-rose-500/50 bg-rose-500/10';

        item.className = `px-2 py-0.5 rounded text-[10px] font-mono border min-w-[30px] text-center ${colorClass}`;
        item.textContent = `${mult.toFixed(2)}x`;
        container.appendChild(item);
    });
}

/**
 * Updates the background grid lines to create the scrolling effect.
 * The grid lines move left as time progresses.
 */
function updateCrashGrid(timeOffset) {
    if (!crashGrid || !crashSvg) return;
    crashGrid.innerHTML = '';

    const width = SVG_VIEWBOX_WIDTH;
    const height = SVG_VIEWBOX_HEIGHT;

    // Fixed spacing in pixels for grid lines
    const GRID_SPACING_X = 100;

    // Calculate the offset for the moving grid
    // The "world" moves left, so lines move left. 
    // We compute the effective X based on timeOffset.

    // Time scale: How many pixels per second?
    // Let's say 100 pixels per second.
    const PX_PER_SEC = 100;
    const currentWorldX = (timeOffset / 1000) * PX_PER_SEC;

    // Determine the first visible grid line X coordinate
    // It should be: (some_multiple * GRID_SPACING) - (currentWorldX % GRID_SPACING)
    // No, simpler: Grid lines are at fixed world X coordinates. We subtract currentWorldX to get screen X.
    // But we want lines to appear from the right.

    const startWorldX = Math.floor(currentWorldX / GRID_SPACING_X) * GRID_SPACING_X;

    for (let wx = startWorldX; wx < currentWorldX + width + GRID_SPACING_X; wx += GRID_SPACING_X) {
        const screenX = wx - currentWorldX + (width * CENTER_X_RATIO);

        // Only draw if within view (with some buffer)
        if (screenX >= -50 && screenX <= width + 50) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', screenX.toFixed(2)); line.setAttribute('y1', '0');
            line.setAttribute('x2', screenX.toFixed(2)); line.setAttribute('y2', height.toFixed(2));
            line.setAttribute('class', 'grid-line');
            line.style.opacity = '0.2';
            crashGrid.appendChild(line);
        }
    }

    // Horizontal Lines (Static)
    const numHorizontalLines = 5;
    const yMultiplierRange = Math.max(0.01, currentMaxYMultiplier - 1);
    for (let i = 1; i <= numHorizontalLines; i++) {
        const multiplierValue = 1 + (i / (numHorizontalLines + 1)) * yMultiplierRange;
        const y = height - ((multiplierValue - 1) / yMultiplierRange) * height;
        if (y >= 0 && y <= height) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0'); line.setAttribute('y1', y.toFixed(2));
            line.setAttribute('x2', width.toFixed(2)); line.setAttribute('y2', y.toFixed(2));
            line.setAttribute('class', 'grid-line');
            crashGrid.appendChild(line);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', '5');
            text.setAttribute('y', (y - 5).toFixed(2));
            text.setAttribute('class', 'grid-label');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#6a6a6a');
            text.textContent = `${multiplierValue.toFixed(1)}x`;
            crashGrid.appendChild(text);
        }
    }
}

function resetCrashVisuals() {
    if (!crashSvg || !crashPolyline) return;
    if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
    crashAnimationId = null;

    crashGameActive = false;
    playerHasBet = false;
    crashCashedOut = false;
    currentMultiplier = 1.00;
    displayedMultiplier = 1.00;
    crashRawPointsData = [[0, 1.00]];
    currentMaxYMultiplier = CRASH_STARTING_MAX_Y;

    crashSvg.setAttribute('viewBox', `0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`);
    crashMultiplierDisplay.textContent = '1.00x';
    crashMultiplierDisplay.className = 'text-fluent-text-primary';

    // Initial line: Flat at start
    const startY = SVG_VIEWBOX_HEIGHT;
    const startX = SVG_VIEWBOX_WIDTH * CENTER_X_RATIO;
    crashPolyline.setAttribute('points', `0,${startY} ${startX},${startY}`);
    crashPolyline.style.stroke = '#0078d4';

    crashStatusDisplay.textContent = 'Place your bet for the next round!';
    updateCrashGrid(0);

    crashBetButton.disabled = false;
    crashBetButton.classList.remove('hidden');
    crashCashoutButton.disabled = true;
    crashCashoutButton.classList.add('hidden');

    const skipBtn = document.getElementById('crash-skip-button');
    if (skipBtn) skipBtn.classList.add('hidden');

    crashBetInput.disabled = false;
    if (crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if (crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;
    updateCrashAutoCashoutToggleVisuals();
}

function calculateCrashTarget() {
    const houseEdgePercent = 1.0;
    const h = Math.random();
    if (h * 100 < houseEdgePercent) return 1.00;
    let maxMultiplierFactor = 99 / (100 - houseEdgePercent);
    let crashPoint = maxMultiplierFactor / (1 - h);
    return Math.max(1.01, Math.floor(crashPoint * 100) / 100);
}

function placeBetAndStart() {
    if (!crashBetInput || !LocalBrokieAPI) return;
    if (crashGameActive) return;

    resetCrashVisuals();

    const betAmount = parseInt(crashBetInput.value);
    if (isNaN(betAmount) || betAmount < 1) {
        LocalBrokieAPI.showMessage("Invalid bet amount.", 2000);
        return;
    }
    if (betAmount > LocalBrokieAPI.getBalance()) {
        LocalBrokieAPI.showMessage("Insufficient balance.", 2000);
        if (isCrashAutoBetting) stopCrashAutoBet();
        return;
    }

    LocalBrokieAPI.startTone();
    if (typeof LocalBrokieAPI.registerGameStart === 'function') LocalBrokieAPI.registerGameStart('Crash');
    crashPlayerBet = betAmount;
    playerHasBet = true;
    LocalBrokieAPI.updateBalance(-betAmount);

    crashGameActive = true;
    crashCashedOut = false;
    crashTargetMultiplier = calculateCrashTarget();
    crashStatusDisplay.innerHTML = `Bet Placed! Value: <span id="potential-win-amount" class="font-bold text-white">${LocalBrokieAPI.formatWin(crashPlayerBet)}</span>`;

    crashBetButton.classList.add('hidden');
    crashCashoutButton.classList.remove('hidden');
    crashCashoutButton.disabled = false;
    crashBetInput.disabled = true;
    if (crashAutoBetToggle) crashAutoBetToggle.disabled = true;
    if (crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = true;
    if (crashAutoCashoutInput) crashAutoCashoutInput.disabled = true;
    if (isAutoCashoutEnabled) validateAndUpdateAutoCashoutTarget();

    crashStartTime = performance.now();
    crashRawPointsData = [[0, 1.00]];

    console.log(`Crash started. Target: ${crashTargetMultiplier.toFixed(2)}x`);
    crashAnimationId = requestAnimationFrame(crashGameLoop);
}

function crashGameLoop(timestamp) {
    if (!crashGameActive) {
        if (crashAnimationId) cancelAnimationFrame(crashAnimationId);
        return;
    }

    if (!crashStartTime) crashStartTime = timestamp;
    const elapsedTime = Math.max(0, timestamp - crashStartTime);
    const timeSec = elapsedTime / 1000;

    // --- Base Multiplier Logic (Exponential) ---
    currentMultiplier = 1 + 0.06 * Math.pow(timeSec, 1.65);

    // --- Visual Volatility (Lag & Catch-Up) ---
    // Instead of sinusoidal noise, we use a "lag" model.
    // The visual multiplier tries to follow the true multiplier, but sometimes lags behind (dip)
    // and then accelerates to catch up. This creates the "slow down then skyrocket" effect.

    if (!this.volatilityState) {
        this.volatilityState = {
            lagging: false,
            lagStartTime: 0,
            catchUpSpeed: 1.0
        };
    }

    // Chance to start a "fake out" lag event
    // Probability increases slightly as multiplier grows, but is random
    // Don't start if already lagging or just finished
    if (!this.volatilityState.lagging && Math.random() < 0.005) {
        this.volatilityState.lagging = true;
        this.volatilityState.lagStartTime = timeSec;
        this.volatilityState.catchUpSpeed = 1.0;
        // console.log("Crash: Fake out started");
    }

    if (this.volatilityState.lagging) {
        const lagDuration = timeSec - this.volatilityState.lagStartTime;

        // During lag, visual grows MUCH slower than real (or stalls)
        // We define a target "lagged" value
        const lagFactor = Math.max(0.2, 1.0 - lagDuration * 0.5); // Slows down growth

        // The visual target is bounded: it can't be higher than real, but can be lower
        // We interpolate displayedMultiplier towards (real * lagFactor) or just let real pull away

        // Simpler approach:
        // While lagging, we cap the rate of change of displayedMultiplier
        // Real multiplier is growing exponentially.
        // We let displayedMultiplier grow linearly or sub-linearly.

        const idealVisual = displayedMultiplier + (currentMultiplier - displayedMultiplier) * 0.05; // Slow follow

        // If lag has gone on too long (e.g. 1.5 seconds), snap out of it
        if (lagDuration > 1.5 || (currentMultiplier - displayedMultiplier) > currentMultiplier * 0.5) {
            this.volatilityState.lagging = false;
            // console.log("Crash: Fake out ending, catch up!");
        } else {
            displayedMultiplier = idealVisual;
        }
    } else {
        // Normal / Catch-up State
        // If visual is behind real, accelerate to catch up
        if (displayedMultiplier < currentMultiplier) {
            // Catch up speed accelerates
            const diff = currentMultiplier - displayedMultiplier;
            const catchUpStep = diff * 0.15; // Fast convergence
            displayedMultiplier += catchUpStep;

            // Snap if close enough
            if (displayedMultiplier > currentMultiplier - 0.01) {
                displayedMultiplier = currentMultiplier;
            }
        } else {
            displayedMultiplier = currentMultiplier;
        }
    }

    // Hard clamp to ensure fairness perception
    displayedMultiplier = Math.min(displayedMultiplier, currentMultiplier);
    displayedMultiplier = Math.max(1.00, displayedMultiplier);

    // --- Check Auto Cashout ---
    if (isAutoCashoutEnabled && !crashCashedOut && autoCashoutTarget >= 1.01 && currentMultiplier >= autoCashoutTarget) {
        // Force display to match target exactly for clarity
        displayedMultiplier = autoCashoutTarget;
        if (crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${displayedMultiplier.toFixed(2)}x`;
        attemptCashOut();
        return;
    }

    // --- Check Crash ---
    // Note: Crash checks against the BASE multiplier, not the jittery one, to be fair?
    // Or check against displayed? Standard is check against true exponential value (currentMultiplier).
    const hasCrashed = currentMultiplier >= crashTargetMultiplier || elapsedTime >= CRASH_MAX_TIME_MS;

    if (hasCrashed) {
        displayedMultiplier = crashTargetMultiplier; // Snap to final
        if (crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${displayedMultiplier.toFixed(2)}x`;
        if (crashPolyline) crashPolyline.style.stroke = '#e81123';
        endCrashGame(true, crashPlayerBet, false);
        return;
    }

    // --- Update UI ---
    if (crashMultiplierDisplay) crashMultiplierDisplay.textContent = `${displayedMultiplier.toFixed(2)}x`;

    if (!crashCashedOut && playerHasBet) {
        const currentCashoutValue = Math.floor(crashPlayerBet * currentMultiplier); // Payout uses REAL multiplier
        const currentProfit = currentCashoutValue - crashPlayerBet;

        const potentialWinSpan = document.getElementById('potential-win-amount');
        if (potentialWinSpan) potentialWinSpan.textContent = LocalBrokieAPI.formatWin(currentCashoutValue);

        // Update Live Stats
        if (crashLiveStake) crashLiveStake.textContent = LocalBrokieAPI.formatWin(crashPlayerBet);
        if (crashLiveProfit) {
            crashLiveProfit.textContent = `+${LocalBrokieAPI.formatWin(currentProfit)}`;
            crashLiveProfit.className = 'text-emerald-400 font-mono text-sm font-bold'; // Ensure green
        }
    } else if (crashCashedOut) {
        // Keep profit static if cashed out
    } else {
        // Reset live stats if no active bet
        if (crashLiveStake) crashLiveStake.textContent = '0';
        if (crashLiveProfit) {
            crashLiveProfit.textContent = '+0';
            crashLiveProfit.className = 'text-slate-500 font-mono text-sm font-bold'; // Grey out
        }
    }

    applyMultiplierVisuals(displayedMultiplier);

    // --- Rescale Y Axis ---
    let rescaleNeeded = false;
    while (displayedMultiplier >= currentMaxYMultiplier * CRASH_RESCALE_THRESHOLD) {
        currentMaxYMultiplier *= CRASH_Y_AXIS_PADDING_FACTOR;
        rescaleNeeded = true;
    }

    // --- Render Scrolling Graph ---
    // We update the grid to shift lines left
    updateCrashGrid(elapsedTime);

    // Update points data
    crashRawPointsData.push([elapsedTime, displayedMultiplier]);

    // Calculate Polyline Points relative to the scrolling view
    // center X = SVG_WIDTH * CENTER_X_RATIO
    // Current head point is always at Center X
    // Previous points are shifted left by (currentTime - pointTime) * pixels_per_sec
    const pointsString = calculateScrollingPointsString(crashRawPointsData, elapsedTime, currentMaxYMultiplier);

    if (crashPolyline) crashPolyline.setAttribute('points', pointsString);

    if (crashGameActive) {
        crashAnimationId = requestAnimationFrame(crashGameLoop);
    }
}

function calculateScrollingPointsString(dataPoints, currentElapsedTime, maxYMultiplier) {
    const PX_PER_SEC = 100;
    const centerX = SVG_VIEWBOX_WIDTH * CENTER_X_RATIO;
    const yMultiplierRange = Math.max(0.01, maxYMultiplier - 1);

    const points = dataPoints.map(point => {
        const pTime = point[0]; // ms
        const pMult = point[1];

        // Time difference from 'now' in seconds
        const timeDiffSec = (currentElapsedTime - pTime) / 1000;

        // X coordinate: Center minus distance traveled
        const x = centerX - (timeDiffSec * PX_PER_SEC);

        // Y coordinate
        const y = SVG_VIEWBOX_HEIGHT - ((pMult - 1) / yMultiplierRange) * SVG_VIEWBOX_HEIGHT;

        // Optimization: Filter out points that are way off screen to the left
        if (x < -100) return null;

        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return points.filter(p => p !== null).join(' ');
}

function applyMultiplierVisuals(val) {
    if (!crashMultiplierDisplay) return;
    const displaySpan = document.getElementById('potential-win-amount');
    const effectClasses = ['shake-subtle', 'shake-strong', 'mult-color-5x', 'mult-color-10x', 'mult-color-15x', 'mult-color-20x', 'mult-color-30x', 'win-effect'];

    crashMultiplierDisplay.classList.remove(...effectClasses);
    crashMultiplierDisplay.classList.add('text-fluent-text-primary');

    let appliedColorClass = null;
    if (val >= 30) appliedColorClass = 'mult-color-30x';
    else if (val >= 20) appliedColorClass = 'mult-color-20x';
    else if (val >= 15) appliedColorClass = 'mult-color-15x';
    else if (val >= 10) appliedColorClass = 'mult-color-10x';
    else if (val >= 5) appliedColorClass = 'mult-color-5x';

    if (appliedColorClass) {
        crashMultiplierDisplay.classList.add(appliedColorClass, 'shake-strong');
        if (displaySpan) {
            displaySpan.className = `font-bold ${appliedColorClass}`;
        }
    } else if (val >= 2) {
        crashMultiplierDisplay.classList.add('shake-subtle');
    }
}

function endCrashGame(crashed, betAtEnd, stoppedByTabSwitch = false) {
    crashGameActive = false;
    if (crashAnimationId) {
        cancelAnimationFrame(crashAnimationId);
        crashAnimationId = null;
    }

    if (crashBetButton) {
        crashBetButton.disabled = false;
        crashBetButton.classList.remove('hidden');
    }
    if (crashCashoutButton) {
        crashCashoutButton.disabled = true;
        crashCashoutButton.classList.add('hidden');
    }
    if (crashBetInput) crashBetInput.disabled = false;
    if (crashAutoBetToggle) crashAutoBetToggle.disabled = false;
    if (crashAutoCashoutToggle) crashAutoCashoutToggle.disabled = false;

    // Reset Live Stats on End
    if (crashLiveStake) crashLiveStake.textContent = '0';
    if (crashLiveProfit) {
        crashLiveProfit.textContent = '+0';
        crashLiveProfit.className = 'text-slate-500 font-mono text-sm font-bold';
    }

    const skipBtn = document.getElementById('crash-skip-button');
    if (skipBtn) skipBtn.classList.add('hidden');

    updateCrashAutoCashoutToggleVisuals();

    const formattedBet = LocalBrokieAPI.formatWin(betAtEnd);
    const finalMultiplier = displayedMultiplier; // Use the last displayed value

    if (stoppedByTabSwitch) {
        if (!crashCashedOut && playerHasBet) crashStatusDisplay.textContent = "Game stopped (inactive tab). Bet lost.";
        else if (crashStatusDisplay) crashStatusDisplay.textContent = "Game stopped.";
    } else if (crashed) {
        if (!crashCashedOut && playerHasBet) {
            crashMultiplierDisplay.textContent = `CRASH! ${finalMultiplier.toFixed(2)}x`;
            crashMultiplierDisplay.className = 'text-fluent-danger';
            crashPolyline.style.stroke = '#e81123';
            crashStatusDisplay.textContent = `Crashed! You lost ${formattedBet}.`;
            LocalBrokieAPI.playSound('crash_explode');
        } else {
            crashStatusDisplay.textContent = `Round Crashed @ ${finalMultiplier.toFixed(2)}x`;
        }
    } else if (crashCashedOut) {
        // Already handled in cashout
    }

    addToCrashHistory(finalMultiplier);

    if (LocalBrokieAPI) LocalBrokieAPI.saveGameState();

    const betBeforeReset = crashPlayerBet;
    crashPlayerBet = 0;
    playerHasBet = false;

    if (isCrashAutoBetting && !stoppedByTabSwitch && betBeforeReset > 0 && LocalBrokieAPI.getBalance() >= betBeforeReset) {
        setTimeout(placeBetAndStart, 1500);
    } else if (isCrashAutoBetting && LocalBrokieAPI.getBalance() < betBeforeReset) {
        stopCrashAutoBet();
        LocalBrokieAPI.showMessage("Auto Bet stop: Insufficient funds.", 2000);
    }
}

function attemptCashOut() {
    if (!crashGameActive || crashCashedOut || !playerHasBet) return;

    crashCashedOut = true;
    crashCashoutButton.disabled = true;

    // Cashout uses the SAFE exponential multiplier, not the jittery one, to ensure fairness
    // Or should it use displayed? If displayed is lower, user feels cheated. If higher, house loses edge.
    // Let's use displayedMultiplier to match what the user sees, but clamp it to currentMultiplier +/- reasonable bounds
    // Actually, sticking to the base curve is "safer" for logic, but "displayed" is what they clicked on.
    // Let's use the base `currentMultiplier` for the actual math to prevent exploiting the jitter.
    const cashoutMultiplier = currentMultiplier;

    const totalReturn = Math.floor(crashPlayerBet * cashoutMultiplier);
    const profit = totalReturn - crashPlayerBet;

    LocalBrokieAPI.updateBalance(totalReturn);
    LocalBrokieAPI.playSound('crash_cashout');

    const formattedProfit = LocalBrokieAPI.formatWin(profit);
    if (profit > 0) {
        LocalBrokieAPI.showMessage(`Cashed out @ ${cashoutMultiplier.toFixed(2)}x! Won ${formattedProfit}!`, 3000);
        LocalBrokieAPI.addWin('Crash', profit);
        crashStatusDisplay.textContent = `Cashed Out! Won ${formattedProfit}.`;
        crashMultiplierDisplay.classList.add('win-effect');
    } else {
        crashStatusDisplay.textContent = `Cashed Out. No profit.`;
    }

    // Do NOT end game here. Let it ride until crash.
    // Show Skip Button
    const skipBtn = document.getElementById('crash-skip-button');
    if (skipBtn) skipBtn.classList.remove('hidden');
}

function stopCrashAutoBet() {
    isCrashAutoBetting = false;
    if (crashAutoBetToggle) {
        crashAutoBetToggle.classList.remove('active');
        crashAutoBetToggle.textContent = 'Auto Bet Off';
    }
}

function toggleCrashAutoBet() {
    if (!crashAutoBetToggle || !LocalBrokieAPI) return;
    LocalBrokieAPI.playSound('click');
    isCrashAutoBetting = !isCrashAutoBetting;
    if (isCrashAutoBetting) {
        crashAutoBetToggle.classList.add('active');
        crashAutoBetToggle.textContent = 'Auto Bet ON';
        if (!crashGameActive) placeBetAndStart();
    } else {
        stopCrashAutoBet();
    }
}

function updateCrashAutoCashoutToggleVisuals() {
    if (!crashAutoCashoutToggle || !crashAutoCashoutInput) return;
    if (isAutoCashoutEnabled) {
        crashAutoCashoutToggle.classList.add('active');
        crashAutoCashoutToggle.textContent = 'Auto Cashout ON';
        crashAutoCashoutInput.disabled = crashGameActive;
    } else {
        crashAutoCashoutToggle.classList.remove('active');
        crashAutoCashoutToggle.textContent = 'Auto Cashout OFF';
        crashAutoCashoutInput.disabled = true;
    }
}

function validateAndUpdateAutoCashoutTarget() {
    if (!crashAutoCashoutInput) return false;
    const target = parseFloat(crashAutoCashoutInput.value);
    if (isNaN(target) || target < 1.01) {
        crashAutoCashoutInput.value = (autoCashoutTarget || 1.50).toFixed(2);
        return false;
    }
    autoCashoutTarget = target;
    crashAutoCashoutInput.value = target.toFixed(2);
    return true;
}

function toggleCrashAutoCashout() {
    if (!crashAutoCashoutToggle) return;
    LocalBrokieAPI.playSound('click');
    if (!isAutoCashoutEnabled) {
        if (validateAndUpdateAutoCashoutTarget()) isAutoCashoutEnabled = true;
    } else {
        isAutoCashoutEnabled = false;
    }
    updateCrashAutoCashoutToggleVisuals();
}

// Make globally available
window.initCrash = initCrash;