/**
 * Brokie Casino - Coin Flip Game Logic (coinflip.js)
 *
 * Handles all functionality related to the Coin Flip game.
 * Depends on functions and variables defined in main.js.
 * v1.5 - Use CSS classes for final state to fix visual desync. Added logging.
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
    clearTimeout(fallbackTimeoutId); // Clear any pending fallback timeout

    if (coinElement) {
        // Reset coin rotation to show the front (Blue) side using class
        coinElement.style.transition = 'none'; // Disable animation for reset
        coinElement.classList.remove('show-back'); // Remove potential back class
        coinElement.classList.add('show-front');   // Ensure front class is present
        coinElement.style.transform = ''; // Remove any inline transform from animation
        coinElement.offsetHeight; // Force reflow
        coinElement.style.transition = ''; // Re-enable CSS transition
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
    console.log(`%cFlip End: Comparing resultColor="${resultColor}" with coinFlipChoice="${coinFlipChoice}"`, 'color: orange; font-weight: bold;');
    if (!isCoinFlipping) {
        console.log("Flip End: Already handled or not flipping. Exiting.");
        return;
    }
    clearTimeout(fallbackTimeoutId);

    isCoinFlipping = false; // Set flipping state to false FIRST

    // Ensure elements still exist
    if (!coinflipStatus || !coinflipButton || !coinflipCashoutButton || !coinflipWinningsSpan || !coinElement) {
        console.warn("Coin flip elements missing after flip animation ended.");
        if (typeof resetCoinFlip === 'function') resetCoinFlip(); // Attempt reset
        return;
    }

    // *** NEW: Set final visual state using classes ***
    coinElement.style.transform = ''; // Clear inline transform used for animation
    if (resultIsBlue) {
        coinElement.classList.remove('show-back');
        coinElement.classList.add('show-front');
        console.log("Set final visual class to: show-front (Blue)");
    } else {
        coinElement.classList.remove('show-front');
        coinElement.classList.add('show-back');
        console.log("Set final visual class to: show-back (Yellow)");
    }
    // *** END NEW ***


    // Check win/loss (Logic remains the same - compares logical result to choice)
    if (resultColor === coinFlipChoice) { // WIN
        console.log("%cCondition evaluated TRUE (WIN)", 'color: lightgreen;');
        currentCoinFlipWinnings *= 2;
        coinflipStatus.textContent = `WIN! It was ${resultEmoji}. Current Winnings: ${formatWin(currentCoinFlipWinnings)}`;
        coinflipButton.disabled = false;
        coinflipCashoutButton.disabled = false;
        coinflipWinningsSpan.textContent = formatWin(currentCoinFlipWinnings);
        playSound('win_small');
    } else { // LOSS
        console.log("%cCondition evaluated FALSE (LOSS)", 'color: salmon;');
        coinflipStatus.textContent = `LOSS! It was ${resultEmoji}. You lost ${formatWin(currentCoinFlipWinnings)}.`;
        totalLoss += coinFlipBet;
        playSound('lose');
        // Reset the game fully on a loss AFTER displaying the message
        // Use a short delay if needed for the user to read the message before reset
        setTimeout(resetCoinFlip, 50); // Short delay before resetting UI on loss
        updateCurrencyDisplay(); // Update display immediately
    }

    // Save game state regardless of win/loss outcome.
    // If loss, resetCoinFlip handles UI/state reset, but we still need to save the updated currency/stats.
    saveGameState();
};


/**
 * Handles the coin flip action. Manages the initial bet deduction
 * or subsequent flips using current winnings. Triggers animation and result check.
 */
function handleCoinFlip() {
    if (isCoinFlipping) { console.log("handleCoinFlip called while already flipping. Ignoring."); return; }
    if (!coinElement || !coinflipBetInput || !coinflipButton || !coinflipCashoutButton || !coinflipStatus || !coinflipChooseBlueBtn || !coinflipChooseYellowBtn) { console.error("handleCoinFlip called but required elements missing."); return; }
    if (!coinFlipChoice) { showMessage("Please choose Blue or Yellow first!", 2000); return; }

    // Reset visual state without animation before flip
    coinElement.style.transition = 'none';
    coinElement.classList.remove('show-back'); // Ensure start from front
    coinElement.classList.add('show-front');
    coinElement.style.transform = ''; // Ensure no inline transform persists
    coinElement.offsetHeight; // Force reflow
    coinElement.style.transition = ''; // Re-enable transition

    const betAmount = parseInt(coinflipBetInput.value);

    // --- Initial Bet ---
    if (!coinFlipActive) {
        if (isNaN(betAmount) || betAmount <= 0) { showMessage("Please enter a valid positive bet amount.", 2000); return; }
        if (betAmount > currency) { showMessage("Not enough currency!", 2000); return; }
        coinFlipBet = betAmount;
        currency -= betAmount;
        updateCurrencyDisplay('loss');
        currentCoinFlipWinnings = betAmount;
        coinFlipActive = true;
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

    // Determine result
    const resultIsBlue = Math.random() < 0.5;
    const resultColor = resultIsBlue ? 'blue' : 'yellow';
    const resultEmoji = resultIsBlue ? '🔵' : '🟡';

    // Calculate a large rotation for the animation *effect* only
    const numSpins = 2; // Can increase this for more visual spins
    const animationEndDegrees = (numSpins * 360) + (resultIsBlue ? 0 : 180); // Spin ends *near* the target side
    const targetAnimationRotation = `rotateY(${animationEndDegrees}deg)`;

    console.log(`%cFlip Start: Intended result=${resultColor} (isBlue=${resultIsBlue}). Player choice=${coinFlipChoice}. Target Anim Rot=${targetAnimationRotation}`, 'color: cyan;');

    // Listener function needs access to result variables
    const transitionEndListener = (event) => {
         if (event.target === coinElement && event.propertyName === 'transform') {
             console.log("TransitionEnd event fired.");
             handleFlipEnd(resultIsBlue, resultColor, resultEmoji);
         }
    };
    coinElement.addEventListener('transitionend', transitionEndListener, { once: true });

    // Start animation using inline style
    coinElement.style.transform = targetAnimationRotation;

    // Fallback timeout
    fallbackTimeoutId = setTimeout(() => {
        if (!isCoinFlipping) return; // Avoid fallback if already handled
        console.warn("Coin flip transitionend event did not fire, using fallback timeout.");
        coinElement.removeEventListener('transitionend', transitionEndListener); // Crucial: remove listener
        handleFlipEnd(resultIsBlue, resultColor, resultEmoji);
    }, 900); // Animation is 0.8s, timeout slightly longer
}


/**
 * Cashes out the current coin flip winnings, updates currency and stats, and resets the game.
 */
function cashOutCoinFlip() {
    if (!coinFlipActive || isCoinFlipping) return; // Can't cash out if not active or flipping
    if (!coinflipWinningsSpan) return; // Check element
    clearTimeout(fallbackTimeoutId); // Clear fallback timeout if cashing out

    // It's possible the user clicks cashout *exactly* as the transition ends.
    // Ensure we are not in the middle of processing the end.
    // If handleFlipEnd was already called, isCoinFlipping would be false.
    // If it's about to be called, this check prevents issues.

    const profit = currentCoinFlipWinnings - coinFlipBet;
    currency += currentCoinFlipWinnings;
    totalGain += Math.max(0, profit);

    showMessage(`Cashed out ${formatWin(currentCoinFlipWinnings)}! Profit: ${formatWin(profit)}`, 3000);
    playSound('win_medium');
    addWinToLeaderboard('Coin Flip', profit);
    resetCoinFlip(); // Reset the game
    updateCurrencyDisplay('win');
    saveGameState();
}

// Ensure main.js calls initCoinflip();