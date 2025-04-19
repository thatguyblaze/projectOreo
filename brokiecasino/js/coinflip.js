/**
 * Brokie Casino - Coin Flip Game Logic (coinflip.js)
 *
 * Handles all functionality related to the Coin Flip game.
 * Depends on functions and variables defined in main.js.
 * v1.4 - Added console logging to debug visual/logic mismatch.
 */

// --- Coin Flip Specific State ---
let coinFlipActive = false; // Is a round currently in progress (after first bet)?
let coinFlipBet = 0; // The initial bet amount for the round
let currentCoinFlipWinnings = 0; // The amount currently staked (doubles on win)
let isCoinFlipping = false; // Is the coin animation currently playing?
let coinFlipChoice = null; // 'blue' or 'yellow'

// --- DOM Elements (Coin Flip Specific) ---
let coinElement; // Now references the div.coin element
let coinflipBetInput, coinflipButton, coinflipCashoutButton;
let coinflipWinningsSpan, coinflipStatus, coinflipChooseBlueBtn, coinflipChooseYellowBtn;
let fallbackTimeoutId = null; // Stores the ID for the fallback timeout

/**
 * Initializes the Coin Flip game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initCoinflip() {
    console.log("Initializing Coin Flip...");
    // Get DOM elements
    coinElement = document.getElementById('coin'); // Get the main coin div
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
    clearTimeout(fallbackTimeoutId); // Clear any pending fallback timeout

    if (coinElement) {
        // Reset coin rotation to show the front (Blue) side without animation
        coinElement.style.transition = 'none'; // Disable transition for immediate reset
        coinElement.style.transform = 'rotateY(0deg)';
        // Force reflow to apply the style immediately before re-enabling transition
        coinElement.offsetHeight; // eslint-disable-line no-unused-expressions
        coinElement.style.transition = ''; // Re-enable transition defined in CSS
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

// --- Animation End Handler ---
const handleFlipEnd = (resultIsBlue, resultColor, resultEmoji) => {
    // Check if the function was called prematurely or already handled
    if (!isCoinFlipping) {
        // console.log("handleFlipEnd called but isCoinFlipping is false. Ignoring."); // Optional: more verbose logging
        return;
    }
    clearTimeout(fallbackTimeoutId); // Clear timeout if transitionend fired

    isCoinFlipping = false; // End flipping state - SET THIS FIRST

    // Ensure elements still exist (user might switch tabs quickly)
    if (!coinElement || !coinflipStatus || !coinflipButton || !coinflipCashoutButton || !coinflipWinningsSpan) {
        console.warn("Coin flip elements missing after flip animation ended.");
        resetCoinFlip(); // Attempt to reset to a safe state
        return;
    }

    // *** DEBUG LOGGING START ***
    let finalVisualTransform = 'N/A';
    try {
        finalVisualTransform = window.getComputedStyle(coinElement).transform;
    } catch (e) {
        console.error("Error getting computed style for coin element:", e);
    }
    console.log(`%c--- Flip End Debug ---
    Logical Result: ${resultColor} (${resultIsBlue ? 'Blue' : 'Yellow'})
    Player Choice: ${coinFlipChoice}
    Computed Visual Transform: ${finalVisualTransform}`,
    'color: #0078d4; font-weight: bold;');
    // *** DEBUG LOGGING END ***


    // Check win/loss
    if (resultColor === coinFlipChoice) { // WIN
        console.log("Debug: Outcome = WIN"); // Log outcome
        currentCoinFlipWinnings *= 2; // Double the winnings
        coinflipStatus.textContent = `WIN! It was ${resultEmoji}. Current Winnings: ${formatWin(currentCoinFlipWinnings)}`; // uses main.js
        coinflipButton.disabled = false; // Enable flip again
        coinflipCashoutButton.disabled = false; // Enable cashout
        coinflipWinningsSpan.textContent = formatWin(currentCoinFlipWinnings); // Update winnings display (uses main.js)
        playSound('win_small'); // Play win sound (uses main.js)
    } else { // LOSS
        console.log("Debug: Outcome = LOSS"); // Log outcome
        coinflipStatus.textContent = `LOSS! It was ${resultEmoji}. You lost ${formatWin(currentCoinFlipWinnings)}.`; // uses main.js
        totalLoss += coinFlipBet; // Add original bet to total loss (uses main.js)
        playSound('lose'); // uses main.js
        resetCoinFlip(); // Reset the game state
        updateCurrencyDisplay(); // Update currency (no change type) (uses main.js)
    }
    saveGameState(); // Save state after flip result (uses main.js)
};


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

    // Reset rotation before starting the next flip animation
    coinElement.style.transition = 'none'; // Disable animation for reset
    coinElement.style.transform = 'rotateY(0deg)'; // Snap to front face
    coinElement.offsetHeight; // Force browser reflow
    coinElement.style.transition = ''; // Re-enable CSS transition

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
        // Disable bet input and choice buttons
        coinflipBetInput.disabled = true;
        coinflipButton.textContent = 'Flip Again';
        coinflipChooseBlueBtn.disabled = true;
        coinflipChooseYellowBtn.disabled = true;
    }

    isCoinFlipping = true;
    coinflipStatus.textContent = 'Flipping...';
    coinflipButton.disabled = true;
    coinflipCashoutButton.disabled = true;

    playSound('coin_flip');

    // Determine result and target rotation
    const resultIsBlue = Math.random() < 0.5;
    const resultColor = resultIsBlue ? 'blue' : 'yellow';
    const resultEmoji = resultIsBlue ? '🔵' : '🟡';

    // Use fewer spins (potentially more reliable)
    const numSpins = 1;
    const finalRestingDegrees = resultIsBlue ? 0 : 180;
    const targetRotationDegrees = (numSpins * 360) + finalRestingDegrees; // e.g., 360 or 540
    const targetRotation = `rotateY(${targetRotationDegrees}deg)`;

    // Setup the listener for the end of the animation
    const transitionEndListener = (event) => {
        // Make sure the event is for the transform property on the coin element
        if (event.target === coinElement && event.propertyName === 'transform') {
            // console.log("TransitionEnd event fired."); // Optional: more verbose logging
            handleFlipEnd(resultIsBlue, resultColor, resultEmoji);
        }
    };
    coinElement.addEventListener('transitionend', transitionEndListener, { once: true });

    // Start the animation
    coinElement.style.transform = targetRotation;

    // Setup fallback timeout - Pass result info to the handler via anonymous function
    clearTimeout(fallbackTimeoutId); // Clear any previous fallback just in case
    fallbackTimeoutId = setTimeout(() => {
        console.warn("Coin flip transitionend event did not fire, using fallback timeout.");
        // Remove the listener since the timeout is firing
        coinElement.removeEventListener('transitionend', transitionEndListener);
        handleFlipEnd(resultIsBlue, resultColor, resultEmoji); // Manually call the handler
    }, 900); // Animation is 0.8s, timeout slightly longer
}


/**
 * Cashes out the current coin flip winnings, updates currency and stats, and resets the game.
 */
function cashOutCoinFlip() {
    if (!coinFlipActive || isCoinFlipping) return; // Can't cash out if not active or flipping
    if (!coinflipWinningsSpan) return; // Check element
    clearTimeout(fallbackTimeoutId); // Clear fallback timeout if cashing out

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