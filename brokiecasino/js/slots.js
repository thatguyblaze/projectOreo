/**
 * Brokie Casino - Slot Machine Game Logic (slots.js)
 *
 * Handles all functionality related to the Slot Machine game.
 * Depends on functions and variables defined in main.js (e.g., currency, playSound, updateCurrencyDisplay, etc.)
 */

// --- Slot Machine Specific State & Constants ---
const slotSymbols = ['🍒', '🍋', '🍊', '🍉', '🔔', '💎', '💰', '7️⃣'];
const slotPayouts = {
    '7️⃣7️⃣7️⃣': 250, '💰💰💰': 100, '💎💎💎': 90, '🔔🔔🔔': 60,
    '🍉🍉🍉': 25, '🍊🍊🍊': 20, '🍋🍋🍋': 15, '🍒🍒🍒': 10,
    '7️⃣7️⃣': 10, '💰💰': 7, '💎💎': 5, '🍒🍒': 2, // Allow 2 symbols win only for specific ones if desired
};
const SPIN_DURATION = 1000; // ms for reel spin animation
const REEL_SPIN_OFFSET = 1500; // px, how far the reel strip scrolls visually
let isAutoSpinning = false;
let slotSpinTimeout = null; // Timeout for auto-spin delay

// --- DOM Elements (Slot Machine Specific) ---
let reelElements = []; // Populated in initSlots
let reelContainers = []; // Populated in initSlots
let spinButton, autoSpinToggle, slotBetInput, payoutList; // Populated in initSlots

/**
 * Initializes the Slot Machine game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initSlots() {
    console.log("Initializing Slots...");
    // Get DOM elements
    reelElements = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
    reelContainers = Array.from(reelElements).map(el => el?.closest('.reel')).filter(Boolean); // Ensure elements exist
    spinButton = document.getElementById('spin-button');
    autoSpinToggle = document.getElementById('auto-spin-toggle');
    slotBetInput = document.getElementById('slot-bet');
    payoutList = document.getElementById('payout-list');

    // Check if all essential elements were found
    if (!spinButton || !autoSpinToggle || !slotBetInput || !payoutList || reelElements.includes(null) || reelContainers.length !== 3) {
        console.error("Slots initialization failed: Could not find all required DOM elements.");
        // Optionally disable the slots tab or show an error message within the game area
        const gameArea = document.getElementById('game-slots');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Slot Machine elements.</p>';
        return; // Stop initialization if elements are missing
    }

    // Set initial reel state visually
    reelElements.forEach(reelSymbolElement => {
        if (reelSymbolElement) {
             reelSymbolElement.innerHTML = `<div style="height: 100px; line-height: 100px;">❓</div>`;
        }
    });

    // Populate the payout legend
    displayPayoutLegend();

    // Add Event Listeners
    spinButton.addEventListener('click', () => {
        if (isAutoSpinning) stopAutoSpin(); // Stop auto-spin if manual spin is clicked
        spinReels();
    });
    autoSpinToggle.addEventListener('click', toggleAutoSpin);

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('slot', slotBetInput);

    console.log("Slots Initialized.");
}

/**
 * Displays the slot machine payout legend in the UI.
 */
function displayPayoutLegend() {
    if (!payoutList) return;
    payoutList.innerHTML = ''; // Clear existing list
    // Sort payouts by value descending for better readability
    const sortedPayouts = Object.entries(slotPayouts).sort(([, a], [, b]) => b - a);
    for (const [key, value] of sortedPayouts) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${key}</span><span>${value}x</span>`;
        payoutList.appendChild(li);
    }
}

/**
 * Gets a random symbol from the available slot symbols.
 * @returns {string} A random slot symbol emoji.
 */
function getRandomSymbol() {
    return slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
}

/**
 * Starts the reel spinning animation and logic.
 */
function spinReels() {
    // Check if elements are available
    if (!spinButton || !slotBetInput || reelContainers.length !== 3) {
         console.error("Cannot spin reels, elements not initialized correctly.");
         showMessage("Error starting spin. Please reload.", 2000);
         return;
    }
    if (spinButton.disabled) return; // Prevent multiple spins

    const betAmount = parseInt(slotBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showMessage("Please enter a valid positive bet amount.", 2000);
        stopAutoSpin(); return;
    }
    if (betAmount > currency) {
        showMessage("Not enough currency! Try the loan button?", 2000);
        stopAutoSpin(); return;
    }

    startTone(); // Ensure audio context is ready (from main.js)
    playSound('spin_start'); // from main.js
    currency -= betAmount; // from main.js
    updateCurrencyDisplay('loss'); // from main.js
    spinButton.disabled = true;
    spinButton.textContent = 'Spinning...';
    reelContainers.forEach(c => c.classList.remove('win-effect')); // Clear previous win effects

    let finalSymbols = [];
    let activeReels = reelElements.length;

    reelElements.forEach((reelSymbolElement, index) => {
        // Ensure element exists before proceeding
        if (!reelSymbolElement) {
            console.error(`Reel element ${index + 1} not found during spin.`);
            activeReels--;
            if (activeReels === 0) finalizeSpin(finalSymbols, betAmount);
            return;
        }

        const reelContainer = reelSymbolElement.parentElement;
        if (!reelContainer) {
            console.error(`Could not find container for reel ${index + 1}`);
            activeReels--;
            if (activeReels === 0) finalizeSpin(finalSymbols, betAmount); // Finalize if this was the last reel
            return;
        }

        // Prepare the visual spin effect
        reelSymbolElement.style.transition = 'none'; // Disable transition for instant reset
        reelSymbolElement.style.top = `-${REEL_SPIN_OFFSET}px`; // Move instantly to top offset

        // Generate the strip of symbols for visual effect + final symbol
        let symbolStripHTML = '';
        const stripLength = 20; // Number of symbols in the visual strip
        for (let i = 0; i < stripLength; i++) {
            symbolStripHTML += `<div style="height: 100px; line-height: 100px;">${getRandomSymbol()}</div>`;
        }
        const finalSymbol = getRandomSymbol();
        finalSymbols[index] = finalSymbol; // Store the actual result
        symbolStripHTML += `<div style="height: 100px; line-height: 100px;">${finalSymbol}</div>`; // Add final symbol at the end
        reelSymbolElement.innerHTML = symbolStripHTML;

        // Force reflow to apply the reset position before starting animation
        reelContainer.offsetHeight;

        // Define transition end handler for this specific reel
        const transitionEndHandler = () => {
            reelSymbolElement.removeEventListener('transitionend', transitionEndHandler); // Clean up listener
            playSound('reel_stop', { index: index }); // Pass index to sound (from main.js)
            activeReels--;
            if (activeReels === 0) {
                finalizeSpin(finalSymbols, betAmount); // Call finalize only when ALL reels stopped
            }
        };
        reelSymbolElement.addEventListener('transitionend', transitionEndHandler);

        // Start the animation using requestAnimationFrame for smoother start
        requestAnimationFrame(() => {
            reelSymbolElement.style.transition = `top ${SPIN_DURATION / 1000 + index * 0.1}s cubic-bezier(0.25, 1, 0.5, 1)`; // Staggered duration
            const finalTopPosition = -(reelSymbolElement.scrollHeight - reelContainer.clientHeight); // Calculate final position
            reelSymbolElement.style.top = `${finalTopPosition}px`;
        });

        // Fallback timeout in case transitionend doesn't fire (rare, but possible)
        setTimeout(() => {
            if (activeReels > 0 && reelSymbolElement.style.transition !== 'none') { // Check if still active
                console.warn(`Transition fallback for reel ${index + 1}`);
                reelSymbolElement.removeEventListener('transitionend', transitionEndHandler); // Clean up listener
                playSound('reel_stop', { index: index }); // Pass index to sound
                activeReels--;
                if (activeReels === 0) {
                    finalizeSpin(finalSymbols, betAmount);
                }
            }
        }, SPIN_DURATION + 300 + index * 100); // Generous fallback timer
    });
}

/**
 * Finalizes the spin, checks for wins, and updates the UI.
 * @param {string[]} finalSymbols - Array containing the final symbol for each reel.
 * @param {number} betAmount - The amount bet on this spin.
 */
function finalizeSpin(finalSymbols, betAmount) {
    let spinError = false;
    try {
        if (finalSymbols.length === reelElements.length) {
            checkSlotWin(finalSymbols, betAmount); // Check for wins
        } else {
            console.error("Final symbols array length mismatch before check:", finalSymbols);
            showMessage("Error processing spin results.", 2000); // from main.js
            spinError = true;
        }
    } catch (e) {
        console.error("Error during win check:", e);
        showMessage("An error occurred checking the win.", 2000); // from main.js
        spinError = true;
    } finally {
        // Reset UI regardless of win/error
        if(spinButton) {
            spinButton.disabled = false;
            spinButton.textContent = 'Spin';
        }


        // Ensure final symbols are displayed correctly
        reelElements.forEach((reelSymbolElement, index) => {
            if (reelSymbolElement) { // Check if element exists
                 if (finalSymbols[index]) {
                     reelSymbolElement.style.transition = 'none'; // Remove transition
                     reelSymbolElement.innerHTML = `<div style="height: 100px; line-height: 100px;">${finalSymbols[index]}</div>`; // Display final symbol
                     reelSymbolElement.style.top = '0px'; // Reset position
                 } else { // Fallback if a symbol was missing
                     reelSymbolElement.innerHTML = `<div style="height: 100px; line-height: 100px;">❓</div>`;
                     reelSymbolElement.style.top = '0px';
                 }
            }
        });

        // Handle auto-spin continuation
        if (isAutoSpinning) {
            clearTimeout(slotSpinTimeout); // Clear previous timeout if any
            const currentBet = parseInt(slotBetInput.value); // Get current bet value
            if (spinError || currency < currentBet || currentBet <= 0) {
                stopAutoSpin(); // Stop auto-spin on error or insufficient funds or invalid bet
            } else {
                slotSpinTimeout = setTimeout(spinReels, 500); // Schedule next spin after a short delay
            }
        }
    }
}

/**
 * Checks the final symbols against payout rules and updates game state.
 * @param {string[]} symbols - The array of final symbols [s1, s2, s3].
 * @param {number} betAmount - The amount bet on this spin.
 */
function checkSlotWin(symbols, betAmount) {
    // Ensure elements exist before proceeding
    if (reelContainers.length !== 3) {
        console.error("Cannot check win, reel containers not initialized correctly.");
        return;
    }

    const [s1, s2, s3] = symbols;
    let winAmount = 0;
    let winKey = '';
    let winSound = null;
    let winningReels = [];

    // Check for 3-symbol matches first (highest payout)
    if (s1 === s2 && s2 === s3) {
        winKey = `${s1}${s2}${s3}`;
        winningReels = [0, 1, 2];
    }
    // Check for 2-symbol matches (only if specific payouts exist)
    else if (slotPayouts[`${s1}${s2}`]) { // Check left-to-right pair
        winKey = `${s1}${s2}`;
        winningReels = [0, 1];
    } else if (slotPayouts[`${s2}${s3}`]) { // Check middle-right pair (less common rule)
        winKey = `${s2}${s3}`;
        winningReels = [1, 2];
    }
    // Add specific checks like 'any two cherries' if needed here

    // Calculate winnings if a winning combination was found
    if (slotPayouts[winKey]) {
        winAmount = betAmount * slotPayouts[winKey];
        currency += winAmount; // from main.js
        totalGain += winAmount; // Add full win amount to gain (from main.js)
        addWinToLeaderboard('Slots', winAmount); // Add win to leaderboard (from main.js)

        // Determine sound based on multiplier size
        const multiplier = slotPayouts[winKey];
        if (multiplier >= 100) winSound = 'win_big';
        else if (multiplier >= 25) winSound = 'win_medium';
        else winSound = 'win_small';

        showMessage(`WIN! ${formatWin(winAmount)}! (${winKey})`, 3000); // from main.js
        winningReels.forEach(i => reelContainers[i]?.classList.add('win-effect')); // Highlight winning reels
        setTimeout(() => winningReels.forEach(i => reelContainers[i]?.classList.remove('win-effect')), 1000); // Remove highlight after delay
    } else {
        // No win, bet amount is already subtracted, just add to total loss
        totalLoss += betAmount; // from main.js
        showMessage("No win this time. Spin again!", 2000); // from main.js
        winSound = 'lose'; // Play lose sound
    }

    if (winSound) playSound(winSound, winAmount); // Play appropriate sound (from main.js)
    updateCurrencyDisplay(winAmount > 0 ? 'win' : null); // Update currency display (flash if win) (from main.js)
    saveGameState(); // Save state after win/loss calculation (from main.js)
}

/**
 * Stops the auto-spin feature and updates the button UI.
 */
function stopAutoSpin() {
    isAutoSpinning = false;
    clearTimeout(slotSpinTimeout); // Clear any scheduled spin
    if (autoSpinToggle) {
         autoSpinToggle.classList.remove('active');
         autoSpinToggle.textContent = 'Auto Off';
    }
    // Re-enable spin button if it was disabled only by auto-spin ending
    if (spinButton && !spinButton.disabled && !isAutoSpinning) {
        // This condition might be tricky, ensure spinButton isn't disabled for other reasons
        // Generally safe to just enable if auto-spin is off and no spin is in progress.
        // spinButton.disabled = false; // Re-enabled in finalizeSpin
    }
}

/**
 * Toggles the auto-spin feature on or off.
 */
function toggleAutoSpin() {
    if (!autoSpinToggle) return; // Ensure button exists

    isAutoSpinning = !isAutoSpinning;
    if (isAutoSpinning) {
        autoSpinToggle.classList.add('active');
        autoSpinToggle.textContent = 'Auto ON';
        spinReels(); // Start the first auto-spin immediately
    } else {
        stopAutoSpin();
    }
}

// Note: The initSlots() function will be called from main.js
// Ensure main.js includes: if (typeof initSlots === 'function') initSlots();
// within its DOMContentLoaded listener.
