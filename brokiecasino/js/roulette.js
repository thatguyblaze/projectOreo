// Check if the main function is already defined to prevent redeclaration errors
if (typeof initRoulette === 'undefined') {

    /**
     * ==========================================================================
     * Brokie Casino - Roulette Game Logic (v2.2 - Multiple Bets)
     *
     * - Supports placing multiple bets simultaneously.
     * - Uses a placedBets array to track bets {type, value, amount}.
     * - Visualizes placed bet amount on buttons.
     * - Calculates total bet and winnings based on all placed bets.
     * - Added clearAllRouletteBets function (requires HTML button).
     * - Accepts BrokieAPI object during initialization.
     * - Uses passed API object for core functions (balance, sound, messages).
     * - Includes logic for placing numbers visually on the wheel.
     * ==========================================================================
     */

    // --- Roulette Specific Constants ---
    const ROULETTE_NUMBERS = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ]; // Standard European Roulette wheel sequence
    const ROULETTE_COLORS = {
        0: 'green', 1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red', 10: 'black',
        11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red', 19: 'red', 20: 'black',
        21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red', 28: 'black', 29: 'black', 30: 'red',
        31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
    };
    const ROULETTE_PAYOUTS = {
        single: 35, // Bet on one number (pays 35 to 1)
        red: 1,     // Bet on red (pays 1 to 1)
        black: 1,   // Bet on black (pays 1 to 1)
        odd: 1,     // Bet on odd (pays 1 to 1)
        even: 1,    // Bet on even (pays 1 to 1)
        low: 1,     // Bet on 1-18 (pays 1 to 1)
        high: 1     // Bet on 19-36 (pays 1 to 1)
        // Add more bet types (split, street, corner, dozen, column) if desired
    };
    const TOTAL_NUMBERS = ROULETTE_NUMBERS.length; // Should be 37 for European wheel
    const ANGLE_PER_NUMBER = 360 / TOTAL_NUMBERS;

    // --- Roulette State Variables ---
    let rouletteIsSpinning = false;
    // CHANGE: Store multiple bets in an array
    let placedBets = []; // Array of bet objects: { type: string, value: string|number, amount: number, buttonElement: HTMLElement }
    // let currentRouletteBetType = null; // Removed
    // let currentRouletteBetValue = null; // Removed
    // let selectedBetButton = null; // Removed (manage selection via placedBets)

    // --- DOM Element References ---
    let rouletteWheel, roulettePointer, rouletteResultDisplay, rouletteBetInput,
        rouletteSpinButton, rouletteStatusDisplay, rouletteInsideBetsContainer, rouletteOutsideBetsContainer,
        rouletteCurrentBetDisplay, clearBetsButton; // NEW: clearBetsButton

    // --- API Reference (Passed from main.js) ---
    let LocalBrokieAPI = null;

    /**
     * Initializes the Roulette game elements and event listeners.
     * @param {object} API - The BrokieAPI object passed from main.js.
     */
    function initRoulette(API) {
        // Assign the API reference
        LocalBrokieAPI = API;

        // Get references to DOM elements specific to Roulette
        rouletteWheel = document.getElementById('roulette-wheel');
        roulettePointer = document.getElementById('roulette-pointer');
        rouletteResultDisplay = document.getElementById('roulette-result');
        rouletteBetInput = document.getElementById('roulette-bet');
        rouletteSpinButton = document.getElementById('roulette-spin-button');
        rouletteStatusDisplay = document.getElementById('roulette-status');
        rouletteInsideBetsContainer = document.getElementById('roulette-inside-bets');
        rouletteOutsideBetsContainer = document.getElementById('roulette-outside-bets');
        rouletteCurrentBetDisplay = document.getElementById('roulette-current-bet-type'); // We might repurpose or remove this later
        // NEW: Get clear bets button reference (assuming ID 'roulette-clear-bets-button')
        clearBetsButton = document.getElementById('roulette-clear-bets-button');

        // Basic element check (excluding clearBetsButton for now)
        if (!rouletteWheel || !roulettePointer || !rouletteResultDisplay || !rouletteBetInput ||
            !rouletteSpinButton || !rouletteStatusDisplay || !rouletteInsideBetsContainer ||
            !rouletteOutsideBetsContainer || !rouletteCurrentBetDisplay || !LocalBrokieAPI) {
            console.error("Roulette initialization failed: Could not find required elements or API.");
            const tab = document.getElementById('tab-roulette');
            if(tab) tab.style.display = 'none'; // Hide tab if setup fails
            return;
        }

        // Create the betting grid buttons
        createRouletteBettingGrid();
        // Place numbers visually on the wheel
        positionWheelNumbers();
        // Setup event listeners for betting and spinning
        setupRouletteEventListeners();
        // Setup generic bet adjustment buttons
        if (LocalBrokieAPI && typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
            LocalBrokieAPI.addBetAdjustmentListeners('roulette', rouletteBetInput);
        } else {
            console.error("BrokieAPI.addBetAdjustmentListeners not found in roulette.js");
        }

        // Initial reset
        resetRoulette(false);
        console.log("Roulette Initialized (v2.2 - Multiple Bets)");
    }

    // --- Helper Functions ---

    /**
     * Finds a bet in the placedBets array.
     * @param {string} type - Bet type (e.g., 'single', 'red').
     * @param {string|number} value - Bet value (e.g., 5, 'red').
     * @returns {object|null} The found bet object or null.
     */
    function findPlacedBet(type, value) {
        return placedBets.find(bet => bet.type === type && bet.value == value); // Use == for potential type coercion (e.g., '5' vs 5)
    }

    /**
    * Updates the visual display of a bet button (text content and data attribute).
    * @param {HTMLElement} button - The button element to update.
    * @param {number} amount - The total amount currently bet on this button (0 to reset).
    */
    function updateButtonVisual(button, amount) {
        if (!button) return;
        const originalValue = button.dataset.originalValue || button.textContent; // Store original text if not already stored
        if (!button.dataset.originalValue) {
            button.dataset.originalValue = originalValue;
        }

        if (amount > 0) {
            button.textContent = `${originalValue} (${amount})`;
            button.dataset.betAmount = amount.toString();
            button.classList.add('has-bet'); // Add class for potential styling
        } else {
            button.textContent = originalValue;
            button.removeAttribute('data-bet-amount');
            button.classList.remove('has-bet'); // Remove class
        }
    }

    // --- Core Functions ---

    /**
     * Creates the number buttons (0-36) for the inside betting grid.
     */
    function createRouletteBettingGrid() {
        if (!rouletteInsideBetsContainer) return;
        rouletteInsideBetsContainer.innerHTML = '';
        console.log("Creating Roulette inside bet buttons...");

        // Create button for 0
        const zeroButton = createBetButton(0, 'green', 'single');
        zeroButton.classList.add('col-span-3'); // Span 3 columns
        rouletteInsideBetsContainer.appendChild(zeroButton);

        // Create buttons for 1-36
        for (let i = 1; i <= 36; i++) {
            const color = ROULETTE_COLORS[i];
            const button = createBetButton(i, color, 'single');
            rouletteInsideBetsContainer.appendChild(button);
        }
        console.log("Finished creating Roulette inside bet buttons.");
    }

    /**
     * Creates a single bet button element.
     */
    function createBetButton(value, color, betType) {
        const button = document.createElement('button');
        button.classList.add('roulette-bet-btn');
        if (color) button.classList.add(color);
        button.textContent = value;
        button.dataset.betType = betType;
        button.dataset.betValue = value;
        button.dataset.originalValue = value; // NEW: Store original value for reset
        return button;
    }

    /**
     * Positions the number elements (0-36) absolutely around the roulette wheel graphic.
     * (No changes needed here for multiple bets logic)
     */
    function positionWheelNumbers() {
        // ... (Keep the existing positionWheelNumbers function as it was)
        if (!rouletteWheel) {
             console.error("Roulette wheel element not found for positioning numbers!");
             return;
        }
        requestAnimationFrame(() => {
            const wheelDiameter = rouletteWheel.offsetWidth;
            if (wheelDiameter <= 0) {
                console.warn("Roulette wheel still has no width after rAF, trying again shortly.");
                if (window.positionWheelTimeout) clearTimeout(window.positionWheelTimeout);
                window.positionWheelTimeout = setTimeout(positionWheelNumbers, 150);
                return;
            }
            console.log("Positioning numbers on Roulette wheel (rAF)...");
            if (window.positionWheelTimeout) clearTimeout(window.positionWheelTimeout);

            const wheelRadius = wheelDiameter / 2;
            const numberRadius = wheelRadius * 0.85; // Radius for placing numbers

            const existingNumbers = rouletteWheel.querySelectorAll('.roulette-number');
            existingNumbers.forEach(num => num.remove());

            ROULETTE_NUMBERS.forEach((num, index) => {
                const angleDegrees = (ANGLE_PER_NUMBER * index) + (ANGLE_PER_NUMBER / 2) - 90;
                const angleRadians = angleDegrees * (Math.PI / 180);
                const numberSpan = document.createElement('span');
                numberSpan.textContent = num.toString();
                numberSpan.classList.add('roulette-number', `num-${num}`);
                const x = wheelRadius + numberRadius * Math.cos(angleRadians);
                const y = wheelRadius + numberRadius * Math.sin(angleRadians);
                numberSpan.style.position = 'absolute';
                numberSpan.style.left = `${x}px`;
                numberSpan.style.top = `${y}px`;
                numberSpan.style.transform = `translate(-50%, -50%) rotate(${angleDegrees + 90}deg)`;
                rouletteWheel.appendChild(numberSpan);
            });
            console.log("Finished positioning numbers on Roulette wheel.");
        });
    }

    /**
     * Sets up event listeners for roulette betting buttons, spin, and clear buttons.
     */
    function setupRouletteEventListeners() {
        if (rouletteInsideBetsContainer) {
            rouletteInsideBetsContainer.addEventListener('click', handleBetPlacement); // CHANGE: Renamed handler
        }
        if (rouletteOutsideBetsContainer) {
            rouletteOutsideBetsContainer.addEventListener('click', handleBetPlacement); // CHANGE: Renamed handler
        }
        if (rouletteSpinButton) {
            rouletteSpinButton.addEventListener('click', spinWheel);
        }
        // NEW: Add listener for clear bets button (if it exists)
        if (clearBetsButton) {
            clearBetsButton.addEventListener('click', clearAllRouletteBets);
        } else {
            console.warn("Roulette 'Clear Bets' button not found (ID: roulette-clear-bets-button). Functionality will be missing.");
        }
    }

    /**
     * Handles clicks on any betting button to place or add to a bet.
     * CHANGE: Major logic change for multiple bets.
     */
    function handleBetPlacement(event) {
        if (rouletteIsSpinning) return;

        const targetButton = event.target.closest('.roulette-bet-btn');
        if (!targetButton) return;

        // Get amount from the main bet input
        const amountToAdd = parseInt(rouletteBetInput.value);
        if (isNaN(amountToAdd) || amountToAdd < 1) {
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please enter a valid bet amount first.", 2000);
            return;
        }
         // Check balance for this single addition - prevents adding if broke
        if (LocalBrokieAPI && amountToAdd > LocalBrokieAPI.getBalance()) {
            LocalBrokieAPI.showMessage("Not enough balance to add this amount.", 2000);
            return;
        }

        if (LocalBrokieAPI) LocalBrokieAPI.playSound('chip_place'); // NEW: Use a chip sound

        const betType = targetButton.dataset.betType;
        const betValue = targetButton.dataset.betValue; // Keep as string/number from dataset

        // Find if this bet already exists
        let existingBet = findPlacedBet(betType, betValue);

        if (existingBet) {
            // Add amount to existing bet
            existingBet.amount += amountToAdd;
        } else {
            // Create new bet object and add to array
            existingBet = {
                type: betType,
                value: (betType === 'single') ? parseInt(betValue, 10) : betValue, // Parse single number bets
                amount: amountToAdd,
                buttonElement: targetButton // Store reference to the button
            };
            placedBets.push(existingBet);
        }

        // Update the button's visual display
        updateButtonVisual(targetButton, existingBet.amount);

        // Update the total bet display (optional, could display sum of placedBets)
        updateTotalBetDisplay();

        // Enable spin button if any bets are placed
        if (rouletteSpinButton && placedBets.length > 0) {
            rouletteSpinButton.disabled = false;
        }
        // NEW: Enable clear bets button if any bets are placed
        if (clearBetsButton && placedBets.length > 0) {
            clearBetsButton.disabled = false;
        }
    }

    /**
     * NEW: Updates a display showing the total amount currently bet.
     * (Replaces the old rouletteCurrentBetDisplay logic)
     */
    function updateTotalBetDisplay() {
        if (!rouletteCurrentBetDisplay) return;
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);
        if (totalBetAmount > 0) {
            rouletteCurrentBetDisplay.textContent = `Total Bet: ${totalBetAmount}`;
        } else {
            rouletteCurrentBetDisplay.textContent = 'No Bets Placed';
        }
    }


    /**
     * NEW: Clears all currently placed bets without spinning.
     */
    function clearAllRouletteBets() {
        if (rouletteIsSpinning) return; // Don't clear while spinning
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('clear_bets'); // NEW: Sound for clearing

        // Reset visuals for all buttons that had bets
        placedBets.forEach(bet => {
            updateButtonVisual(bet.buttonElement, 0); // Reset visual to 0 amount
        });

        // Clear the bets array
        placedBets = [];

        // Update total bet display
        updateTotalBetDisplay();

        // Disable Spin and Clear buttons
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true;
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Bets cleared. Place new bets!';
    }


    /**
     * Resets the roulette game to its initial state.
     * CHANGE: Now clears the placedBets array and button visuals.
     */
    function resetRoulette(resetWheelVisual = false) {
        rouletteIsSpinning = false;

        // Clear placed bets and button visuals
        clearAllRouletteBets(); // Use the clear bets function to handle visuals and array

        // Reset displays
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = '?';
            rouletteResultDisplay.className = 'roulette-result'; // Reset color classes
            rouletteResultDisplay.style.backgroundColor = '';
            rouletteResultDisplay.style.color = '';
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Place your bet!';
        updateTotalBetDisplay(); // Reset total bet display

        // Reset wheel rotation
        if (rouletteWheel && resetWheelVisual) {
           // ... (Keep existing wheel visual reset logic)
           positionWheelNumbers();
           rouletteWheel.style.transition = 'none';
           rouletteWheel.style.transform = `rotate(0deg)`;
           void rouletteWheel.offsetWidth;
           rouletteWheel.style.transition = '';
        } else if (rouletteWheel) {
             positionWheelNumbers(); // Ensure numbers are positioned on reset
        }

        // Ensure controls are set correctly
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true; // Disable clear button initially
        if (rouletteBetInput) rouletteBetInput.disabled = false;
        // Re-enable betting buttons using pointer events
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'auto';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'auto';
    }

    /**
     * Starts the roulette spin animation and determines the winner.
     * CHANGE: Calculates total bet, deducts total, checks win for each bet.
     */
    function spinWheel() {
        if (rouletteIsSpinning) return;
        if (placedBets.length === 0) { // CHANGE: Check if any bets are placed
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Please place a bet first!", 2000);
            return;
        }

        // CHANGE: Calculate total bet amount from the array
        const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0);

        if (isNaN(totalBetAmount) || totalBetAmount < 1) {
            // This case should ideally not happen if placedBets is managed correctly
            if (LocalBrokieAPI) LocalBrokieAPI.showMessage("Invalid total bet amount.", 2000);
            console.error("Invalid total bet amount calculated:", totalBetAmount, placedBets);
            return;
        }

        // Check balance against total bet
        if (LocalBrokieAPI && totalBetAmount > LocalBrokieAPI.getBalance()) {
            LocalBrokieAPI.showMessage("Not enough balance for the total bet.", 2000);
            return;
        }

        // Start the spin
        rouletteIsSpinning = true;
        if (LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(-totalBetAmount); // CHANGE: Deduct total bet amount
            LocalBrokieAPI.playSound('roulette_spin');
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = 'Spinning... No more bets!';
        if (rouletteSpinButton) rouletteSpinButton.disabled = true;
        if (clearBetsButton) clearBetsButton.disabled = true; // Disable clear during spin
        if (rouletteBetInput) rouletteBetInput.disabled = true; // Disable main input
        // Disable betting buttons visually during spin
        if (rouletteInsideBetsContainer) rouletteInsideBetsContainer.style.pointerEvents = 'none';
        if (rouletteOutsideBetsContainer) rouletteOutsideBetsContainer.style.pointerEvents = 'none';

        // --- Calculate Winning Number and Spin Animation ---
        // (No changes needed in the animation calculation itself)
        const winningNumberIndex = Math.floor(Math.random() * TOTAL_NUMBERS);
        const winningNumber = ROULETTE_NUMBERS[winningNumberIndex];
        const angleToSegmentStart = -(winningNumberIndex * ANGLE_PER_NUMBER);
        const offsetWithinSegment = -(ANGLE_PER_NUMBER * (0.1 + Math.random() * 0.8));
        const finalAngleInRotation = angleToSegmentStart + offsetWithinSegment;
        const fullRotations = (5 + Math.floor(Math.random() * 5)) * 360;
        const targetRotation = finalAngleInRotation - fullRotations;

        if (rouletteWheel) {
            rouletteWheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.4, 1)';
            rouletteWheel.style.transform = `rotate(${targetRotation}deg)`;
        }

        // --- Handle Spin Completion ---
        setTimeout(() => {
            handleResult(winningNumber); // CHANGE: Don't need to pass betAmount anymore
        }, 4100); // Match CSS transition duration + buffer
    }

    /**
     * Handles the result calculation and UI update after the spin finishes.
     * CHANGE: Iterates through placedBets to calculate total win.
     */
    function handleResult(winningNumber) {
        rouletteIsSpinning = false; // Allow new spins/bets
        if (LocalBrokieAPI) LocalBrokieAPI.playSound('roulette_ball');

        const winningColor = ROULETTE_COLORS[winningNumber];

        // Display winning number and style result display
        if (rouletteResultDisplay) {
            rouletteResultDisplay.textContent = winningNumber.toString();
            rouletteResultDisplay.className = 'roulette-result'; // Reset classes
            rouletteResultDisplay.classList.add(winningColor); // Add color class
        }

        // --- Determine Win/Loss for EACH placed bet ---
        let totalWinnings = 0; // Winnings only (excluding original bet amount)
        let totalBetReturned = 0; // Sum of original bets for winning bets

        placedBets.forEach(bet => {
            let payoutMultiplier = 0;
            let betWon = false;

            // Check win conditions based on the current bet object
            if (bet.type === 'single' && bet.value === winningNumber) {
                payoutMultiplier = ROULETTE_PAYOUTS.single; betWon = true;
            } else if (bet.type === 'red' && winningColor === 'red') {
                payoutMultiplier = ROULETTE_PAYOUTS.red; betWon = true;
            } else if (bet.type === 'black' && winningColor === 'black') {
                payoutMultiplier = ROULETTE_PAYOUTS.black; betWon = true;
            } else if (bet.type === 'odd' && winningNumber !== 0 && winningNumber % 2 !== 0) {
                payoutMultiplier = ROULETTE_PAYOUTS.odd; betWon = true;
            } else if (bet.type === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
                payoutMultiplier = ROULETTE_PAYOUTS.even; betWon = true;
            } else if (bet.type === 'low' && winningNumber >= 1 && winningNumber <= 18) {
                payoutMultiplier = ROULETTE_PAYOUTS.low; betWon = true;
            } else if (bet.type === 'high' && winningNumber >= 19 && winningNumber <= 36) {
                payoutMultiplier = ROULETTE_PAYOUTS.high; betWon = true;
            }
            // Add checks for other bet types here if implemented

            if (betWon) {
                const winningsForThisBet = bet.amount * payoutMultiplier;
                totalWinnings += winningsForThisBet;
                totalBetReturned += bet.amount; // Add original bet amount to return total
            }
        });

        // Calculate total return and update balance/stats
        const totalReturn = totalWinnings + totalBetReturned; // Winnings + original winning bets
        let statusMessage = '';

        if (totalReturn > 0 && LocalBrokieAPI) {
            LocalBrokieAPI.updateBalance(totalReturn); // Add winnings + original bets back
            statusMessage = `Win! Landed on ${winningNumber} (${winningColor}). You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`;
            LocalBrokieAPI.showMessage(`You won ${LocalBrokieAPI.formatWin(totalWinnings)}!`, 3000);
            LocalBrokieAPI.playSound('roulette_win'); // Could play tiered sounds based on win amount
            LocalBrokieAPI.addWin('Roulette', totalWinnings); // Add net win to leaderboard
        } else { // Loss (or API missing)
             const totalBetAmount = placedBets.reduce((sum, bet) => sum + bet.amount, 0); // Recalculate for message
             statusMessage = `Lose! Landed on ${winningNumber} (${winningColor}). Lost ${totalBetAmount}.`;
            if (LocalBrokieAPI) {
                LocalBrokieAPI.showMessage(`Landed on ${winningNumber}. Better luck next time!`, 3000);
                LocalBrokieAPI.playSound('lose');
                 // Balance was already deducted, no further action needed for loss
            }
        }
        if (rouletteStatusDisplay) rouletteStatusDisplay.textContent = statusMessage;

        // Reset UI elements for the next round after a short delay
        setTimeout(() => {
            const currentActiveTab = document.querySelector('.tab-button[aria-current="page"]');
            if (currentActiveTab && currentActiveTab.id === 'tab-roulette') {
                resetRoulette(false);
            }
        }, 2500); // Shortened delay a bit
    }

// End of the guard block
} else {
    console.warn("Roulette script already loaded. Skipping re-initialization.");
}