/**
 * Brokie Casino - Coin Flip Game Logic (coinflip.js)
 *
 * Handles all functionality related to the Coin Flip game.
 * Depends on functions and variables defined in main.js.
 */

// --- Coin Flip Specific State ---
let coinFlipActive = false; // Is a round currently in progress (after first bet)?
let coinFlipBet = 0; // The initial bet amount for the round
let currentCoinFlipWinnings = 0; // The amount currently staked (doubles on win)
let isCoinFlipping = false; // Is the coin animation currently playing?
let coinFlipChoice = null; // 'blue' or 'yellow'

// --- DOM Elements (Coin Flip Specific) ---
let coinElement, coinflipBetInput, coinflipButton, coinflipCashoutButton;
let coinflipWinningsSpan, coinflipStatus, coinflipChooseBlueBtn, coinflipChooseYellowBtn;

/**
 * Initializes the Coin Flip game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initCoinflip() {
    console.log("Initializing Coin Flip...");
    // Get DOM elements
    coinElement = document.getElementById('coin');
    coinflipBetInput = document.getElementById('coinflip-bet');
    coinflipButton = document.getElementById('coinflip-button');
    coinflipCashoutButton = document.getElementById('coinflip-cashout-button');
    coinflipWinningsSpan = document.getElementById('coinflip-winnings');
    coinflipStatus = document.getElementById('coinflip-status');
    coinflipChooseBlueBtn = document.getElementById('coinflip-choose-blue');
    coinflipChooseYellowBtn = document.getElementById('coinflip-choose-yellow');

    // Check if all essential elements were found
    if (!coinElement || !coinflipBetInput || !coinflipButton || !coinflipCashoutButton ||
        !coinflipWinningsSpan || !coinflipStatus || !coinflipChooseBlueBtn || !coinflipChooseYellowBtn) {
        console.error("Coin Flip initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-coinflip');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Coin Flip elements.</p>';
        return; // Stop initialization
    }

    // Set initial state
    resetCoinFlip();

    // Add Event Listeners
    coinflipButton.addEventListener('click', handleCoinFlip);
    coinflipCashoutButton.addEventListener('click', cashOutCoinFlip);
    coinflipChooseBlueBtn.addEventListener('click', () => setCoinFlipChoice('blue'));
    coinflipChooseYellowBtn.addEventListener('click', () => setCoinFlipChoice('yellow'));

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('coinflip', coinflipBetInput); // uses main.js

    console.log("Coin Flip Initialized.");
}

/**
 * Resets the coin flip game to its initial state (UI and variables).
 */
function resetCoinFlip() {
    coinFlipActive = false;
    isCoinFlipping = false;
    coinFlipBet = 0;
    currentCoinFlipWinnings = 0;
    coinFlipChoice = null; // Reset choice

    if (coinElement) {
        coinElement.classList.remove('flipping'); // Stop animation if active
        coinElement.textContent = '🪙'; // Reset to default coin emoji
    }
    if (coinflipButton) {
        coinflipButton.textContent = 'Select Side & Flip';
        coinflipButton.disabled = true; // Disabled until side is chosen
    }
    if (coinflipCashoutButton) {
        coinflipCashoutButton.disabled = true; // Disabled until a win occurs
    }
    if (coinflipWinningsSpan) {
        coinflipWinningsSpan.textContent = '0'; // Reset winnings display
    }
    if (coinflipStatus) {
        coinflipStatus.textContent = 'Choose Blue or Yellow!';
    }
    if (coinflipBetInput) {
        coinflipBetInput.disabled = false; // Allow changing bet
    }
    // Reset button selections
    if (coinflipChooseBlueBtn) {
        coinflipChooseBlueBtn.classList.remove('selected');
        coinflipChooseBlueBtn.disabled = false;
    }
    if (coinflipChooseYellowBtn) {
        coinflipChooseYellowBtn.classList.remove('selected');
        coinflipChooseYellowBtn.disabled = false;
    }
}

/**
 * Sets the player's chosen side (blue or yellow) for the coin flip.
 * @param {'blue' | 'yellow'} choice - The chosen side.
 */
function setCoinFlipChoice(choice) {
    if (isCoinFlipping || coinFlipActive) return; // Don't allow changing choice mid-round
    if (!coinflipChooseBlueBtn || !coinflipChooseYellowBtn || !coinflipButton || !coinflipStatus) return;

    playSound('click'); // uses main.js
    coinFlipChoice = choice;

    // Update button visuals
    if (choice === 'blue') {
        coinflipChooseBlueBtn.classList.add('selected');
        coinflipChooseYellowBtn.classList.remove('selected');
    } else {
        coinflipChooseYellowBtn.classList.add('selected');
        coinflipChooseBlueBtn.classList.remove('selected');
    }
    coinflipButton.disabled = false; // Enable flip button now that side is chosen
    coinflipStatus.textContent = `Selected ${choice === 'blue' ? 'Blue 🔵' : 'Yellow 🟡'}. Place your bet & Flip!`;
}

/**
 * Handles the coin flip action. Manages the initial bet deduction
 * or subsequent flips using current winnings. Triggers animation and result check.
 */
function handleCoinFlip() {
    if (isCoinFlipping) return; // Don't flip if already flipping
    if (!coinElement || !coinflipBetInput || !coinflipButton || !coinflipCashoutButton || !coinflipStatus || !coinflipChooseBlueBtn || !coinflipChooseYellowBtn) return; // Check elements

    if (!coinFlipChoice) { // Must choose a side first
        showMessage("Please choose Blue or Yellow first!", 2000); // uses main.js
        return;
    }

    const betAmount = parseInt(coinflipBetInput.value);

    // --- Initial Bet ---
    if (!coinFlipActive) {
        if (isNaN(betAmount) || betAmount <= 0) {
            showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
        }
        if (betAmount > currency) { // uses currency from main.js
            showMessage("Not enough currency!", 2000); return; // uses main.js
        }
        coinFlipBet = betAmount; // Store the initial bet
        currency -= betAmount; // Deduct bet (uses currency from main.js)
        updateCurrencyDisplay('loss'); // uses main.js
        currentCoinFlipWinnings = betAmount; // Start winnings streak with the bet amount
        coinFlipActive = true; // Mark round as active
        // Disable bet input and choice buttons for the duration of the round
        coinflipBetInput.disabled = true;
        coinflipButton.textContent = 'Flip Again'; // Change button text
        coinflipChooseBlueBtn.disabled = true;
        coinflipChooseYellowBtn.disabled = true;
    }
    // --- Subsequent Flips ---
    // Bet amount is already deducted, player is risking currentCoinFlipWinnings

    isCoinFlipping = true; // Start flipping animation state
    coinflipStatus.textContent = 'Flipping...';
    coinflipButton.disabled = true; // Disable flip/cashout during animation
    coinflipCashoutButton.disabled = true;
    coinElement.classList.add('flipping'); // Add animation class
    playSound('coin_flip'); // uses main.js

    // Simulate flip result after animation duration
    setTimeout(() => {
        if (!coinElement || !coinflipButton || !coinflipCashoutButton || !coinflipWinningsSpan || !coinflipStatus) {
             // Elements might have been removed if tab switched during timeout
             console.warn("Coin flip elements not found after timeout.");
             isCoinFlipping = false;
             // Might need a more robust way to handle state if tab switching during animation is common
             return;
        }

        const resultIsBlue = Math.random() < 0.5; // 50/50 chance
        const resultEmoji = resultIsBlue ? '🔵' : '🟡';
        const resultColor = resultIsBlue ? 'blue' : 'yellow';

        coinElement.classList.remove('flipping'); // Remove animation class
        coinElement.textContent = resultEmoji; // Show result
        isCoinFlipping = false; // End flipping state

        // Check win/loss
        if (resultColor === coinFlipChoice) { // WIN
            currentCoinFlipWinnings *= 2; // Double the winnings
            coinflipStatus.textContent = `WIN! Current Winnings: ${formatWin(currentCoinFlipWinnings)}`; // uses main.js
            coinflipButton.disabled = false; // Enable flip again
            coinflipCashoutButton.disabled = false; // Enable cashout
            coinflipWinningsSpan.textContent = formatWin(currentCoinFlipWinnings); // Update winnings display (uses main.js)
            playSound('win_small'); // Play win sound (uses main.js)
        } else { // LOSS
            coinflipStatus.textContent = `LOSS! It was ${resultEmoji}. You lost ${formatWin(currentCoinFlipWinnings)}.`; // uses main.js
            totalLoss += coinFlipBet; // Add original bet to total loss (uses main.js)
            playSound('lose'); // uses main.js
            resetCoinFlip(); // Reset the game state
            updateCurrencyDisplay(); // Update currency (no change type) (uses main.js)
        }
        saveGameState(); // Save state after flip result (uses main.js)
    }, 600); // Match animation duration in CSS
}

/**
 * Cashes out the current coin flip winnings, updates currency and stats, and resets the game.
 */
function cashOutCoinFlip() {
    if (!coinFlipActive || isCoinFlipping) return; // Can't cash out if not active or flipping
    if (!coinflipWinningsSpan) return; // Check element

    const profit = currentCoinFlipWinnings - coinFlipBet; // Calculate profit
    currency += currentCoinFlipWinnings; // Add winnings back to currency (uses main.js)
    totalGain += Math.max(0, profit); // Add profit to total gain (uses main.js)

    showMessage(`Cashed out ${formatWin(currentCoinFlipWinnings)}! Profit: ${formatWin(profit)}`, 3000); // uses main.js
    playSound('win_medium'); // Play cashout sound (uses main.js)
    addWinToLeaderboard('Coin Flip', profit); // Add profit to leaderboard (uses main.js)
    resetCoinFlip(); // Reset the game
    updateCurrencyDisplay('win'); // Update currency (flash green) (uses main.js)
    saveGameState(); // uses main.js
}


// Note: The initCoinflip() function will be called from main.js
// Ensure main.js includes: if (typeof initCoinflip === 'function') initCoinflip();
// within its DOMContentLoaded listener.
