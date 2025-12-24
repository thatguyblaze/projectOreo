/**
 * Brokie Casino - Memory Game Logic (memory.js)
 *
 * Handles all functionality related to the Memory Match game.
 * Depends on functions and variables defined in main.js.
 */

// --- Memory Game Specific State & Constants ---
let memoryActive = false;
let memoryBet = 0;
const MEMORY_GRID_SIZE = 4; // 4x4 grid
const MEMORY_CARDS = MEMORY_GRID_SIZE * MEMORY_GRID_SIZE; // 16 cards
const MEMORY_PAIRS = MEMORY_CARDS / 2; // 8 pairs
const MEMORY_SYMBOLS = ['🍎','🍌','🍇','🍓','🥝','🍍','🍑','🥥']; // 8 symbols for pairs
let memoryGridSymbols = []; // Actual symbols placed on the grid
let memoryRevealedCards = []; // Indices of currently revealed cards (max 2)
let memoryMatchedIndices = []; // Indices of cards that have been matched
let memoryTriesLeft = 0;
const MEMORY_INITIAL_TRIES = 8; // Number of attempts allowed
const MEMORY_WIN_MULTIPLIER = 4; // Payout multiplier on win
let memoryIsChecking = false; // Flag to prevent clicks during check animation/delay

// --- DOM Elements (Memory Game Specific) ---
let memoryBetInput, memoryGridElement, memoryStartButton;
let memoryTriesLeftSpan, memoryStatus;

/**
 * Initializes the Memory game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initMemory() {
    console.log("Initializing Memory Game...");
    // Get DOM elements
    memoryBetInput = document.getElementById('memory-bet');
    memoryGridElement = document.getElementById('memory-grid');
    memoryStartButton = document.getElementById('memory-start-button');
    memoryTriesLeftSpan = document.getElementById('memory-tries-left');
    memoryStatus = document.getElementById('memory-status');

    // Check if all essential elements were found
    if (!memoryBetInput || !memoryGridElement || !memoryStartButton ||
        !memoryTriesLeftSpan || !memoryStatus) {
        console.error("Memory Game initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-memory');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Memory Game elements.</p>';
        return; // Stop initialization
    }

    // Create the grid structure
    createMemoryGrid();

    // Set initial state
    resetMemoryGame();

    // Add Event Listeners
    memoryStartButton.addEventListener('click', startMemoryGame);

    // Event Delegation for Grid
    memoryGridElement.addEventListener('click', (e) => {
        const card = e.target.closest('.memory-card');
        if (card) {
            const index = parseInt(card.dataset.index);
            if (!isNaN(index)) {
                console.log(`Delegated click on card index: ${index}`);
                handleMemoryCardClick(index);
            }
        }
    });

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('memory', memoryBetInput); // uses main.js

    console.log("Memory Game Initialized.");
}

/**
 * Creates the memory game grid cards with front and back faces.
 */
function createMemoryGrid() {
    if (!memoryGridElement) return;
    memoryGridElement.innerHTML = ''; // Clear previous grid
    for (let i = 0; i < MEMORY_CARDS; i++) {
        const card = document.createElement('button');
        card.type = 'button'; // Explicitly set type to button
        card.className = 'memory-card';
        card.dataset.index = i;
        card.disabled = true; // Disabled until game starts

        // Create front face (visible when hidden)
        const cardFaceFront = document.createElement('div');
        cardFaceFront.className = 'card-face card-front';
        cardFaceFront.textContent = '❓'; // Question mark for hidden state

        // Create back face (visible when revealed)
        const cardFaceBack = document.createElement('div');
        cardFaceBack.className = 'card-face card-back'; // Symbol will be added later

        card.appendChild(cardFaceFront);
        card.appendChild(cardFaceBack);
        // Listener handled by delegation on grid parent
        memoryGridElement.appendChild(card);
    }
}

/**
 * Resets the memory game to its initial state (UI and variables).
 */
function resetMemoryGame() {
    memoryActive = false;
    memoryBet = 0;
    memoryGridSymbols = []; // Clear symbols
    memoryRevealedCards = []; // Clear revealed cards array
    memoryMatchedIndices = []; // Clear matched cards array
    memoryTriesLeft = 0;
    memoryIsChecking = false; // Reset checking flag

    // Reset button/input states (check if elements exist)
    if (memoryStartButton) memoryStartButton.disabled = false;
    if (memoryBetInput) memoryBetInput.disabled = false;
    if (memoryTriesLeftSpan) memoryTriesLeftSpan.textContent = '--'; // Reset tries display
    if (memoryStatus) memoryStatus.textContent = 'Place your bet and start!';

    // Reset card visuals
    if (memoryGridElement) {
        const cards = memoryGridElement.querySelectorAll('.memory-card');
        cards.forEach(card => {
            card.classList.remove('revealed', 'matched', 'mismatched'); // Remove state classes
            card.disabled = true; // Disable cards
            const backFace = card.querySelector('.card-back');
            if (backFace) backFace.textContent = ''; // Clear symbol from back face
            const frontFace = card.querySelector('.card-front');
            if (frontFace) frontFace.textContent = '❓'; // Ensure front face shows question mark
        });
    }
}

/**
 * Shuffles the memory symbols and assigns them to the grid cards.
 */
function shuffleMemoryCards() {
    // Create pairs of symbols
    let symbolsToPlace = [];
    for (let i = 0; i < MEMORY_PAIRS; i++) {
        symbolsToPlace.push(MEMORY_SYMBOLS[i], MEMORY_SYMBOLS[i]);
    }
    // Shuffle the symbols array (Fisher-Yates shuffle)
    for (let i = symbolsToPlace.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbolsToPlace[i], symbolsToPlace[j]] = [symbolsToPlace[j], symbolsToPlace[i]]; // Swap elements
    }
    memoryGridSymbols = symbolsToPlace; // Store the shuffled symbols

    // Assign symbols to the back face of each card
    if (memoryGridElement) {
        const cards = memoryGridElement.querySelectorAll('.memory-card');
        cards.forEach((card, index) => {
            const backFace = card.querySelector('.card-back');
            if (backFace) {
                backFace.textContent = memoryGridSymbols[index];
            }
        });
    }
}

/**
 * Starts a new memory game after validating the bet.
 */
function startMemoryGame() {
    if (memoryActive) return; // Don't start if already active
    if (!memoryBetInput || !memoryStartButton || !memoryTriesLeftSpan || !memoryStatus || !memoryGridElement) return; // Check elements

    const betAmount = parseInt(memoryBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
    }
    if (betAmount > currency) { // uses main.js
        showMessage("Not enough currency!", 2000); return; // uses main.js
    }

    startTone(); // uses main.js
    resetMemoryGame(); // Reset state and visuals
    memoryBet = betAmount;
    currency -= betAmount; // Deduct bet (uses main.js)
    updateCurrencyDisplay('loss'); // uses main.js
    memoryActive = true;
    memoryTriesLeft = MEMORY_INITIAL_TRIES; // Set initial tries
    shuffleMemoryCards(); // Shuffle and assign symbols

    // Update UI for active game
    memoryStartButton.disabled = true;
    memoryBetInput.disabled = true;
    memoryTriesLeftSpan.textContent = memoryTriesLeft; // Display tries
    memoryStatus.textContent = 'Find the pairs!';
    // Enable cards for clicking
    const cards = memoryGridElement.querySelectorAll('.memory-card');
    cards.forEach(card => card.disabled = false);
    saveGameState(); // Save state after starting (uses main.js)
}

/**
 * Handles the logic when a player clicks on a memory card.
 * @param {number} index - The index of the clicked card.
 */
function handleMemoryCardClick(index) {
    // Ignore clicks if game inactive, checking in progress, card already revealed, or card already matched
    if (!memoryActive || memoryIsChecking || memoryRevealedCards.includes(index) || memoryMatchedIndices.includes(index)) {
        return;
    }
    if (!memoryGridElement || !memoryStatus) return; // Check elements

    const card = memoryGridElement.querySelector(`.memory-card[data-index="${index}"]`);
    if (!card || card.disabled) return; // Ignore if card not found or disabled

    playSound('memory_flip'); // uses main.js
    card.classList.add('revealed'); // Reveal the card (CSS handles the flip)
    memoryRevealedCards.push(index); // Add index to revealed array

    if (memoryRevealedCards.length === 2) { // Two cards revealed, check for match
        memoryIsChecking = true; // Prevent further clicks during check
        memoryStatus.textContent = 'Checking...';
        // Delay check slightly to allow player to see the second card
        setTimeout(checkMemoryMatch, 800);
    } else { // Only one card revealed
        memoryStatus.textContent = 'Pick another card.';
    }
}

/**
 * Checks if the two currently revealed memory cards are a match.
 * Updates game state (tries, matched pairs) and UI accordingly.
 */
function checkMemoryMatch() {
    if (memoryRevealedCards.length !== 2) { // Should not happen, but safety check
        memoryIsChecking = false; return;
    }
     if (!memoryGridElement || !memoryStatus || !memoryTriesLeftSpan) return; // Check elements

    const index1 = memoryRevealedCards[0];
    const index2 = memoryRevealedCards[1];
    const card1 = memoryGridElement.querySelector(`.memory-card[data-index="${index1}"]`);
    const card2 = memoryGridElement.querySelector(`.memory-card[data-index="${index2}"]`);

    if (!card1 || !card2) { // Safety check if cards somehow disappeared
        console.warn("Could not find revealed cards during check.");
        memoryIsChecking = false; memoryRevealedCards = []; return;
    }

    const symbol1 = memoryGridSymbols[index1];
    const symbol2 = memoryGridSymbols[index2];

    if (symbol1 === symbol2) { // --- MATCH ---
        playSound('memory_match'); // uses main.js
        memoryStatus.textContent = `Matched ${symbol1}!`;
        card1.classList.add('matched'); // Apply matched style (optional visual cue)
        card2.classList.add('matched');
        card1.disabled = true; // Permanently disable matched cards
        card2.disabled = true;
        memoryMatchedIndices.push(index1, index2); // Add to matched array

        // Check for win condition (all cards matched)
        if (memoryMatchedIndices.length === MEMORY_CARDS) {
            endMemoryGame(true); // Player won
        } else {
            memoryIsChecking = false; // Allow next pick
        }
    } else { // --- MISMATCH ---
        playSound('memory_mismatch'); // uses main.js
        memoryTriesLeft--; // Decrement tries
        memoryTriesLeftSpan.textContent = memoryTriesLeft; // Update display
        memoryStatus.textContent = `Mismatch! Tries left: ${memoryTriesLeft}`;
        card1.classList.add('mismatched'); // Apply mismatch style (e.g., red border/shake)
        card2.classList.add('mismatched');

        if (memoryTriesLeft <= 0) { // Check for lose condition (out of tries)
            // Delay slightly before ending to show the mismatch
            setTimeout(() => endMemoryGame(false), 600); // Player lost
        } else {
            // Flip cards back after a delay
            setTimeout(() => {
                // Check if cards still exist before modifying
                const currentCard1 = memoryGridElement.querySelector(`.memory-card[data-index="${index1}"]`);
                const currentCard2 = memoryGridElement.querySelector(`.memory-card[data-index="${index2}"]`);
                if (currentCard1) currentCard1.classList.remove('revealed', 'mismatched'); // Hide cards again
                if (currentCard2) currentCard2.classList.remove('revealed', 'mismatched');
                memoryIsChecking = false; // Allow next pick
            }, 1000); // Delay before hiding mismatch
        }
    }

    memoryRevealedCards = []; // Clear revealed cards array for next turn
    saveGameState(); // Save state after check (uses main.js)
}

/**
 * Ends the memory game, calculates payout/loss, updates UI and state.
 * @param {boolean} won - Whether the player won the game.
 */
function endMemoryGame(won) {
    memoryActive = false;
    memoryIsChecking = false;
    // Re-enable controls (check elements)
    if (memoryStartButton) memoryStartButton.disabled = false;
    if (memoryBetInput) memoryBetInput.disabled = false;
    // Disable all cards
    if (memoryGridElement) {
        const cards = memoryGridElement.querySelectorAll('.memory-card');
        cards.forEach(card => card.disabled = true);
    }
    if (!memoryStatus) return; // Need status element

    if (won) {
        const winAmount = memoryBet * MEMORY_WIN_MULTIPLIER;
        const profit = winAmount - memoryBet;
        currency += winAmount; // Add winnings (uses main.js)
        totalGain += Math.max(0, profit); // Add profit (uses main.js)
        memoryStatus.textContent = `YOU WIN! Found all pairs! Won ${formatWin(profit)}!`; // uses main.js
        playSound('memory_win'); // uses main.js
        addWinToLeaderboard('Memory', profit); // uses main.js
        updateCurrencyDisplay('win'); // Update currency (flash green) (uses main.js)
    } else {
        totalLoss += memoryBet; // Add bet to total loss (uses main.js)
        memoryStatus.textContent = `Out of tries! You lost ${formatWin(memoryBet)}.`; // uses main.js
        playSound('memory_lose'); // uses main.js
        // Optionally reveal all cards on loss
        if (memoryGridElement) {
            const cards = memoryGridElement.querySelectorAll('.memory-card');
            cards.forEach((card, index) => {
                if (!memoryMatchedIndices.includes(index)) { // Reveal only unmatched cards
                    card.classList.add('revealed');
                }
            });
        }
        updateCurrencyDisplay(); // Update currency (no flash) (uses main.js)
    }
    saveGameState(); // Save final game state (uses main.js)
}


// Note: The initMemory() function will be called from main.js
// Ensure main.js includes: if (typeof initMemory === 'function') initMemory();
// within its DOMContentLoaded listener.
