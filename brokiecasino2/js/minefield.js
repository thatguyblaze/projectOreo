/**
 * Brokie Casino - Minefield Game Logic (minefield.js)
 *
 * Handles all functionality related to the Minefield game.
 * Depends on functions and variables defined in main.js.
 */

// --- Minefield Specific State & Constants ---
let minefieldActive = false;
let minefieldBet = 0;
let minefieldGrid = []; // Stores 0 for safe, 1 for bomb
let minefieldRevealed = []; // Stores true/false for revealed tiles
const MINEFIELD_SIZE = 4; // 4x4 grid
const MINEFIELD_TILES = MINEFIELD_SIZE * MINEFIELD_SIZE;
const MINEFIELD_BOMBS = 3; // Number of bombs
let minefieldSafePicks = 0; // How many safe tiles revealed this round
let minefieldMultiplier = 1.0;
// Multipliers for consecutive safe picks (index corresponds to number of safe picks)
const MINEFIELD_MULTIPLIERS = [
    1.00, // 0 safe picks (start)
    1.15, // 1 safe pick
    1.35, // 2
    1.60, // 3
    1.90, // 4
    2.25, // 5
    2.70, // 6
    3.25, // 7
    4.00, // 8
    5.00, // 9
    6.50, // 10
    8.50, // 11
    11.00, // 12
    15.00 // 13 safe picks (max win: 16 tiles - 3 bombs = 13 safe)
];


// --- DOM Elements (Minefield Specific) ---
let minefieldBetInput, minefieldGridElement, minefieldStartButton;
let minefieldCashoutButton, minefieldMultiplierSpan, minefieldStatus;

/**
 * Initializes the Minefield game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initMinefield() {
    console.log("Initializing Minefield...");
    // Get DOM elements
    minefieldBetInput = document.getElementById('minefield-bet');
    minefieldGridElement = document.getElementById('minefield-grid');
    minefieldStartButton = document.getElementById('minefield-start-button');
    minefieldCashoutButton = document.getElementById('minefield-cashout-button');
    minefieldMultiplierSpan = document.getElementById('minefield-current-multiplier');
    minefieldStatus = document.getElementById('minefield-status');

    // Check if all essential elements were found
    if (!minefieldBetInput || !minefieldGridElement || !minefieldStartButton ||
        !minefieldCashoutButton || !minefieldMultiplierSpan || !minefieldStatus) {
        console.error("Minefield initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-minefield');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Minefield elements.</p>';
        return; // Stop initialization
    }

    // Create the grid structure
    createMinefieldGrid();

    // Set initial state (calls resetMinefield which also resets visuals)
    resetMinefield();

    // Add Event Listeners
    minefieldStartButton.addEventListener('click', startMinefield);
    minefieldCashoutButton.addEventListener('click', cashOutMinefield);

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('minefield', minefieldBetInput); // uses main.js

    console.log("Minefield Initialized.");
}

/**
 * Creates the minefield grid buttons and adds event listeners.
 */
function createMinefieldGrid() {
    if (!minefieldGridElement) return;
    minefieldGridElement.innerHTML = ''; // Clear previous grid
    for (let i = 0; i < MINEFIELD_TILES; i++) {
        const tile = document.createElement('button');
        tile.className = 'minefield-tile';
        tile.dataset.index = i;
        tile.textContent = '🔳'; // Initial hidden state symbol
        tile.disabled = true; // Disabled until game starts
        // Use an anonymous function to pass the index correctly
        tile.addEventListener('click', () => handleMinefieldTileClick(i));
        minefieldGridElement.appendChild(tile);
    }
}

/**
 * Resets the minefield game to its initial state (UI and variables).
 */
function resetMinefield() {
    minefieldActive = false;
    minefieldBet = 0;
    minefieldSafePicks = 0;
    minefieldMultiplier = 1.0;
    minefieldGrid = []; // Clear bomb locations
    minefieldRevealed = new Array(MINEFIELD_TILES).fill(false); // Reset revealed status

    // Reset button states (check if elements exist first)
    if (minefieldStartButton) minefieldStartButton.disabled = false;
    if (minefieldCashoutButton) minefieldCashoutButton.disabled = true;
    if (minefieldBetInput) minefieldBetInput.disabled = false;
    if (minefieldMultiplierSpan) minefieldMultiplierSpan.textContent = minefieldMultiplier.toFixed(2); // Reset multiplier display
    if (minefieldStatus) minefieldStatus.textContent = 'Place your bet and start!';

    // Reset tile visuals
    if (minefieldGridElement) {
        const tiles = minefieldGridElement.querySelectorAll('.minefield-tile');
        tiles.forEach(tile => {
            tile.textContent = '🔳';
            tile.className = 'minefield-tile'; // Reset classes
            tile.disabled = true; // Disable tiles
            tile.style.transform = ''; // Reset any scaling
        });
    }
}

/**
 * Generates random bomb locations for the current round.
 * @param {number} betAmount - The amount bet for this round.
 */
function generateBombs(betAmount) {
    minefieldGrid = new Array(MINEFIELD_TILES).fill(0); // Initialize grid with safe tiles (0)
    minefieldRevealed = new Array(MINEFIELD_TILES).fill(false); // Reset revealed status
    let bombsPlaced = 0;
    while (bombsPlaced < MINEFIELD_BOMBS) {
        const index = Math.floor(Math.random() * MINEFIELD_TILES);
        if (minefieldGrid[index] === 0) { // Place bomb only if tile is currently safe
            minefieldGrid[index] = 1; // Mark as bomb (1)
            bombsPlaced++;
        }
    }
    minefieldBet = betAmount; // Store the bet for this round
    minefieldSafePicks = 0; // Reset safe pick counter
    minefieldMultiplier = 1.0; // Reset multiplier (index 0 in array)
    minefieldActive = true; // Mark game as active
}

/**
 * Starts a new minefield game after validating the bet.
 */
function startMinefield() {
    if (minefieldActive) return; // Don't start if already active
    if (!minefieldBetInput || !minefieldStartButton || !minefieldCashoutButton || !minefieldStatus || !minefieldGridElement) return; // Check elements

    const betAmount = parseInt(minefieldBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
    }
    if (betAmount > currency) { // uses main.js
        showMessage("Not enough currency!", 2000); return; // uses main.js
    }

    startTone(); // uses main.js
    resetMinefield(); // Reset visuals and state before starting
    currency -= betAmount; // Deduct bet (uses main.js)
    updateCurrencyDisplay('loss'); // uses main.js
    generateBombs(betAmount); // Place bombs

    // Update UI for active game
    minefieldStartButton.disabled = true;
    minefieldCashoutButton.disabled = true; // Can't cash out before first pick
    minefieldBetInput.disabled = true;
    minefieldStatus.textContent = 'Click a tile to reveal!';
    // Enable all tiles for clicking
    const tiles = minefieldGridElement.querySelectorAll('.minefield-tile');
    tiles.forEach(tile => tile.disabled = false);
    saveGameState(); // Save state after starting (uses main.js)
}

/**
 * Reveals all mine locations at the end of the game.
 * @param {number} [hitIndex=-1] - The index of the bomb the player clicked (if any), to highlight it.
 */
function revealAllMines(hitIndex = -1) {
    if (!minefieldGridElement) return;
    const tiles = minefieldGridElement.querySelectorAll('.minefield-tile');
    tiles.forEach((tile, index) => {
        tile.disabled = true; // Disable all tiles
        if (minefieldGrid[index] === 1) { // If it's a bomb
            tile.textContent = '💣';
            tile.classList.add('revealed', 'bomb');
            if (index === hitIndex) { // Apply slight scale effect to the bomb that was hit
                tile.style.transform = 'scale(1.1)';
                // Add shake animation directly here if needed, though CSS handles it on reveal
                // tile.classList.add('shake-strong');
            }
        } else if (minefieldRevealed[index]) { // If it was a safe tile already revealed
            tile.textContent = '🟩'; // Keep it green
            tile.classList.add('revealed', 'safe'); // Ensure classes are set
        } else {
            // Optionally reveal unclicked safe tiles differently, or leave them hidden
             tile.textContent = '⬜'; // Example: Reveal unclicked safe tiles as white squares
             tile.classList.add('revealed'); // Mark as revealed but not 'safe' or 'bomb'
             tile.style.backgroundColor = '#5a5a5a'; // Give them a neutral revealed color
        }
    });
}

/**
 * Handles the logic when a player clicks on a minefield tile.
 * @param {number} index - The index of the clicked tile.
 */
function handleMinefieldTileClick(index) {
    if (!minefieldActive || minefieldRevealed[index]) return; // Ignore clicks if game inactive or tile already revealed
    if (!minefieldGridElement || !minefieldStatus || !minefieldMultiplierSpan || !minefieldCashoutButton || !minefieldStartButton || !minefieldBetInput) return; // Check elements

    const tile = minefieldGridElement.querySelector(`.minefield-tile[data-index="${index}"]`);
    if (!tile || tile.disabled) return; // Ignore if tile not found or somehow disabled

    minefieldRevealed[index] = true; // Mark tile as revealed
    tile.disabled = true; // Disable the clicked tile

    if (minefieldGrid[index] === 1) { // --- BOMB HIT ---
        playSound('mine_bomb'); // uses main.js
        tile.textContent = '💣';
        tile.classList.add('revealed', 'bomb'); // Apply bomb styles (CSS handles animation)
        minefieldStatus.textContent = `BOOM! You hit a mine! Lost ${formatWin(minefieldBet)}.`; // uses main.js
        totalLoss += minefieldBet; // Add bet to total loss (uses main.js)
        revealAllMines(index); // Show all other bombs
        minefieldActive = false; // Game over
        // Re-enable controls for new game
        minefieldStartButton.disabled = false;
        minefieldCashoutButton.disabled = true;
        minefieldBetInput.disabled = false;
        updateCurrencyDisplay(); // Update currency (no change type) (uses main.js)
        saveGameState(); // uses main.js
    } else { // --- SAFE PICK ---
        playSound('mine_reveal'); // uses main.js
        tile.textContent = '🟩';
        tile.classList.add('revealed', 'safe'); // Apply safe styles
        minefieldSafePicks++;
        // Update multiplier based on number of safe picks (use safePicks as index)
        minefieldMultiplier = MINEFIELD_MULTIPLIERS[minefieldSafePicks] ?? MINEFIELD_MULTIPLIERS[MINEFIELD_MULTIPLIERS.length - 1]; // Use nullish coalescing for safety
        minefieldMultiplierSpan.textContent = minefieldMultiplier.toFixed(2); // Update display
        minefieldCashoutButton.disabled = false; // Enable cashout now
        minefieldStatus.textContent = `Safe! Multiplier: ${minefieldMultiplier.toFixed(2)}x. Pick again or cash out.`;

        // Check for win condition (all safe tiles revealed)
        if (minefieldSafePicks === MINEFIELD_TILES - MINEFIELD_BOMBS) {
            minefieldStatus.textContent = `Cleared the field! Max Win!`;
            minefieldCashoutButton.disabled = true; // Disable cashout as it will auto-cashout
            setTimeout(cashOutMinefield, 500); // Automatically cash out on max win after short delay
        } else {
            saveGameState(); // Save progress after safe pick (uses main.js)
        }
    }
}

/**
 * Cashes out the current minefield winnings, updates state, and resets the game UI.
 */
function cashOutMinefield() {
    // Allow cashout even if picks = 0? No, doesn't make sense.
    if (!minefieldActive || minefieldSafePicks === 0) return;
     if (!minefieldStatus || !minefieldStartButton || !minefieldCashoutButton || !minefieldBetInput) return; // Check elements


    const winAmount = Math.floor(minefieldBet * minefieldMultiplier);
    const profit = winAmount - minefieldBet;
    currency += winAmount; // Add winnings to currency (uses main.js)
    totalGain += Math.max(0, profit); // Add profit to total gain (uses main.js)

    showMessage(`Cashed out ${formatWin(winAmount)}! Profit: ${formatWin(profit)}`, 3000); // uses main.js
    playSound('win_medium'); // uses main.js
    addWinToLeaderboard('Mines', profit); // uses main.js
    revealAllMines(); // Show bomb locations after cashing out
    minefieldActive = false; // End the game
    // Re-enable controls
    minefieldStartButton.disabled = false;
    minefieldCashoutButton.disabled = true;
    minefieldBetInput.disabled = false;
    minefieldStatus.textContent = `Cashed out ${formatWin(winAmount)}! Place bet to start again.`; // Update status
    updateCurrencyDisplay('win'); // Update currency (flash green) (uses main.js)
    saveGameState(); // uses main.js
}


// Note: The initMinefield() function will be called from main.js
// Ensure main.js includes: if (typeof initMinefield === 'function') initMinefield();
// within its DOMContentLoaded listener.
