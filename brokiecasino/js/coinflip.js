/**
 * Brokie Casino - Coin Flip Game Logic (coinflip.js)
 *
 * Handles all functionality related to the Coin Flip game.
 * Depends on functions and variables defined in main.js.
 * v1.7 - Enhanced Robustness and Logging for Debugging
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
let LocalBrokieAPI = null; // Local reference to API

/**
 * Initializes the Coin Flip game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initCoinflip(API) {
    if (!API) {
        console.error("CoinFlip Init Error: BrokieAPI missing!");
        return;
    }
    LocalBrokieAPI = API; // Store API reference
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

    // Robust Check and Log
    const missingElements = [];
    if (!coinElement) missingElements.push('coin');
    if (!coinflipBetInput) missingElements.push('coinflip-bet');
    if (!coinflipButton) missingElements.push('coinflip-button');
    if (!coinflipCashoutButton) missingElements.push('coinflip-cashout-button');
    if (!coinflipWinningsSpan) missingElements.push('coinflip-winnings');
    if (!coinflipStatus) missingElements.push('coinflip-status');
    if (!coinflipChooseBlueBtn) missingElements.push('coinflip-choose-blue');
    if (!coinflipChooseYellowBtn) missingElements.push('coinflip-choose-yellow');

    if (missingElements.length > 0) {
        console.error("Coin Flip initialization failed. Missing elements:", missingElements.join(', '));
        if (coinflipStatus) coinflipStatus.textContent = "Game Error: Elements missing.";
        return; // Stop initialization
    }

    // Set initial state
    resetCoinFlip();

    // Add Event Listeners with duplicate protection
    coinflipButton.removeEventListener('click', handleCoinFlip);
    coinflipButton.addEventListener('click', handleCoinFlip);

    coinflipCashoutButton.removeEventListener('click', cashOutCoinFlip);
    coinflipCashoutButton.addEventListener('click', cashOutCoinFlip);

    // Use named functions for choice buttons
    coinflipChooseBlueBtn.onclick = () => setCoinFlipChoice('blue');
    coinflipChooseYellowBtn.onclick = () => setCoinFlipChoice('yellow');

    // Add bet adjustment listeners using the factory function from API
    // Ensure the API method exists before calling
    if (typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
        LocalBrokieAPI.addBetAdjustmentListeners('coinflip', coinflipBetInput);
    } else {
        console.error("LocalBrokieAPI.addBetAdjustmentListeners is not a function:", LocalBrokieAPI);
    }

    console.log("Coin Flip Initialized Successfully.");
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
        coinflipCashoutButton.classList.add('hidden'); // Ensure hidden on reset
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
        // Reset classes completely to ensure no stuck 'selected' or hover states
        coinflipChooseBlueBtn.className = "coinflip-choice-btn flex-1 py-6 border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-lg flex flex-col gap-2 items-center rounded-xl transition-all";
        coinflipChooseBlueBtn.disabled = false;
    }
    if (coinflipChooseYellowBtn) {
        coinflipChooseYellowBtn.className = "coinflip-choice-btn flex-1 py-6 border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-lg flex flex-col gap-2 items-center rounded-xl transition-all";
        coinflipChooseYellowBtn.disabled = false;
    }
}

/**
 * Sets the player's chosen side (blue or yellow) for the coin flip.
 * @param {'blue' | 'yellow'} choice - The chosen side.
 */
function setCoinFlipChoice(choice) {
    console.log("Coin Flip Choice Clicked:", choice);

    // Allow choice ONLY if not currently flipping animation.
    // Allow changing choice if round hasn't started yet (coinFlipActive is false) OR if round IS active but waiting for next flip.
    // Wait, if round is active, can you switch sides? Typically 'Double or Nothing' implies same conditions, but let's allow switching side for fun.
    if (isCoinFlipping) {
        console.warn("Cannot choose side while flipping.");
        return;
    }

    // Safety check for elements
    if (!coinflipChooseBlueBtn || !coinflipChooseYellowBtn || !coinflipButton || !coinflipStatus) {
        console.error("Missing choice elements in setCoinFlipChoice");
        return;
    }

    if (LocalBrokieAPI) LocalBrokieAPI.playSound('click');
    coinFlipChoice = choice;

    // Reset styles
    coinflipChooseBlueBtn.className = "coinflip-choice-btn flex-1 py-6 border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-lg flex flex-col gap-2 items-center rounded-xl transition-all";
    coinflipChooseYellowBtn.className = "coinflip-choice-btn flex-1 py-6 border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-lg flex flex-col gap-2 items-center rounded-xl transition-all";

    // Apply Active Styling
    if (choice === 'blue') {
        coinflipChooseBlueBtn.classList.remove('border-blue-500/30', 'hover:bg-blue-500/10');
        coinflipChooseBlueBtn.classList.add('ring-4', 'ring-blue-500', 'scale-105', 'bg-blue-500/20', 'border-blue-500');
    } else {
        coinflipChooseYellowBtn.classList.remove('border-amber-500/30', 'hover:bg-amber-500/10');
        coinflipChooseYellowBtn.classList.add('ring-4', 'ring-yellow-500', 'scale-105', 'bg-yellow-500/20', 'border-yellow-500');
    }

    // Enable flip button explicitly
    coinflipButton.disabled = false;
    coinflipButton.textContent = coinFlipActive ? "FLIP AGAIN!" : "FLIP!";
    coinflipButton.classList.remove('opacity-50', 'cursor-not-allowed');

    coinflipStatus.textContent = `Selected ${choice === 'blue' ? 'Blue 🔵' : 'Yellow 🟡'}. ${coinFlipActive ? 'Flip again!' : 'Place your bet & Flip!'}`;
}

// --- Animation End Handler ---
const handleFlipEnd = (resultIsBlue, resultColor, resultEmoji) => {
    if (!isCoinFlipping) {
        return;
    }
    clearTimeout(fallbackTimeoutId);

    isCoinFlipping = false; // Set flipping state to false FIRST

    // Ensure elements still exist
    if (!coinflipStatus || !coinflipButton || !coinflipCashoutButton || !coinflipWinningsSpan || !coinElement) {
        if (typeof resetCoinFlip === 'function') resetCoinFlip(); // Attempt reset
        return;
    }

    // *** Set final visual state using classes ***
    coinElement.style.transform = ''; // Clear inline transform used for animation
    if (resultIsBlue) {
        coinElement.classList.remove('show-back');
        coinElement.classList.add('show-front');
    } else {
        coinElement.classList.remove('show-front');
        coinElement.classList.add('show-back');
    }

    // Check win/loss (Logic remains the same - compares logical result to choice)
    if (resultColor === coinFlipChoice) { // WIN
        currentCoinFlipWinnings *= 2;
        coinflipStatus.textContent = `WIN! It was ${resultEmoji}. Current Winnings: ${LocalBrokieAPI ? LocalBrokieAPI.formatWin(currentCoinFlipWinnings) : currentCoinFlipWinnings}`;

        // Enable controls
        coinflipButton.disabled = false;
        coinflipCashoutButton.disabled = false;
        coinflipCashoutButton.classList.remove('hidden'); // Ensure visible
        coinflipButton.textContent = "Double or Nothing?"; // Flavor text

        coinflipWinningsSpan.textContent = LocalBrokieAPI ? LocalBrokieAPI.formatWin(currentCoinFlipWinnings) : currentCoinFlipWinnings;
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('win_small');
    } else { // LOSS
        coinflipStatus.textContent = `LOSS! It was ${resultEmoji}. You lost ${LocalBrokieAPI ? LocalBrokieAPI.formatWin(currentCoinFlipWinnings) : currentCoinFlipWinnings}`;
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('lose');
        // Reset the game fully on a loss AFTER displaying the message
        setTimeout(resetCoinFlip, 1500); // Delay before resetting UI on loss
    }

    // Save game state
    if (LocalBrokieAPI) LocalBrokieAPI.saveGameState();
};


/**
 * Handles the coin flip action. Manages the initial bet deduction
 * or subsequent flips using current winnings. Triggers animation and result check.
 */
function handleCoinFlip() {
    if (isCoinFlipping) { return; }
    if (!coinElement || !coinflipBetInput || !coinflipButton || !coinflipCashoutButton || !coinflipStatus || !coinflipChooseBlueBtn || !coinflipChooseYellowBtn) { console.error("Missing elements for flip"); return; }
    if (!coinFlipChoice) { if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please choose Blue or Yellow first!", 2000); return; }

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
        if (isNaN(betAmount) || betAmount <= 0) { if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please enter a valid positive bet amount.", 2000); return; }
        if (LocalBrokieAPI && betAmount > LocalBrokieAPI.getBalance()) { LocalBrokieAPI.showMessage("Not enough currency!", 2000); return; }

        coinFlipBet = betAmount;
        if (LocalBrokieAPI) LocalBrokieAPI.updateBalance(-betAmount);

        currentCoinFlipWinnings = betAmount;
        coinFlipActive = true;
        coinflipBetInput.disabled = true;

        coinflipChooseBlueBtn.disabled = true; // Disable changing choice *during* flip? No, standard logic.
        // Actually, let's keep choice enabled between flips if they want to switch for double-or-nothing
        coinflipChooseBlueBtn.disabled = false;
        coinflipChooseYellowBtn.disabled = false;
    }

    isCoinFlipping = true;
    coinflipStatus.textContent = 'Flipping...';
    coinflipButton.disabled = true;
    coinflipCashoutButton.disabled = true;

    if (LocalBrokieAPI) LocalBrokieAPI.playSound('coin_flip');
    if (LocalBrokieAPI && typeof LocalBrokieAPI.registerGameStart === 'function') LocalBrokieAPI.registerGameStart('CoinFlip');

    // Determine result
    const resultIsBlue = Math.random() < 0.5;
    const resultColor = resultIsBlue ? 'blue' : 'yellow';
    const resultEmoji = resultIsBlue ? '🔵' : '🟡';

    // Calculate a large rotation for the animation *effect* only
    const numSpins = 5; // Increased spins for dramatic effect
    const animationEndDegrees = (numSpins * 360) + (resultIsBlue ? 0 : 180); // Spin ends *near* the target side
    const targetAnimationRotation = `rotateY(${animationEndDegrees}deg)`;

    // Listener function needs access to result variables
    const transitionEndListener = (event) => {
        if (event.target === coinElement && event.propertyName === 'transform') {
            handleFlipEnd(resultIsBlue, resultColor, resultEmoji);
        }
    };
    coinElement.addEventListener('transitionend', transitionEndListener, { once: true });

    // Start animation using inline style
    coinElement.style.transform = targetAnimationRotation;

    // Fallback timeout
    fallbackTimeoutId = setTimeout(() => {
        if (!isCoinFlipping) return; // Avoid fallback if already handled
        coinElement.removeEventListener('transitionend', transitionEndListener);
        handleFlipEnd(resultIsBlue, resultColor, resultEmoji);
    }, 1000); // 
}


/**
 * Cashes out the current coin flip winnings, updates currency and stats, and resets the game.
 */
function cashOutCoinFlip() {
    if (!coinFlipActive || isCoinFlipping) return; // Can't cash out if not active or flipping
    if (!coinflipWinningsSpan) return; // Check element
    clearTimeout(fallbackTimeoutId); // Clear fallback timeout if cashing out

    const profit = currentCoinFlipWinnings - coinFlipBet;

    // Add the FULL winnings back to balance (initial bet + profit)
    if (LocalBrokieAPI) {
        LocalBrokieAPI.updateBalance(currentCoinFlipWinnings);
        LocalBrokieAPI.addWin('CoinFlip', profit);
        LocalBrokieAPI.showMessage(`Cashed out ${LocalBrokieAPI.formatWin(currentCoinFlipWinnings)}! Profit: ${LocalBrokieAPI.formatWin(profit)}`, 3000);
        LocalBrokieAPI.playSound('win_medium');
        LocalBrokieAPI.saveGameState();
    }

    resetCoinFlip(); // Reset the game
}

// Ensure main.js calls initCoinflip();
window.initCoinflip = initCoinflip;