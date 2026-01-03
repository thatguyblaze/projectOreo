/**
 * Brokie Casino - Coin Flip Game Logic (coinflip.js)
 * Completely Remade v2.1 - Visual Fixes & Robust Logic
 */

(function () {
    // --- Game Variables ---
    let isActive = false;
    let currentBet = 0;
    let currentWinnings = 0;
    let isFlipping = false;
    let userChoice = null; // 'blue' or 'yellow'

    // --- Elements ---
    let els = {};

    // --- API Reference ---
    let API = null;

    /**
     * Main Initialization Function exposing itself to window
     */
    window.initCoinflip = function (brokieAPI) {
        if (!brokieAPI) { console.error("Coinflip: No API provided"); return; }
        API = brokieAPI;
        console.log("Coinflip: Init called");

        // Grab Elements
        els = {
            coin: document.getElementById('coin'),
            betInput: document.getElementById('coinflip-bet'),
            flipBtn: document.getElementById('coinflip-button'),
            cashoutBtn: document.getElementById('coinflip-cashout-button'),
            winningsDisplay: document.getElementById('coinflip-winnings'),
            status: document.getElementById('coinflip-status'),
            btnBlue: document.getElementById('coinflip-choose-blue'),
            btnYellow: document.getElementById('coinflip-choose-yellow')
        };

        // Validate
        for (let key in els) {
            if (!els[key]) {
                console.error(`Coinflip: Missing element ${key}`);
                return;
            }
        }

        // --- Event Binding --- 
        els.flipBtn.onclick = handleFlipClick;
        els.cashoutBtn.onclick = handleCashoutClick;
        els.btnBlue.onclick = () => selectSide('blue');
        els.btnYellow.onclick = () => selectSide('yellow');

        // Initial State
        resetGame();

        // Bet Adjustments
        if (API.addBetAdjustmentListeners) {
            API.addBetAdjustmentListeners('coinflip', els.betInput);
        }

        console.log("Coinflip: Ready");
    };

    /**
     * Resets visual and logical state
     */
    function resetGame() {
        isActive = false;
        isFlipping = false;
        currentBet = 0;
        currentWinnings = 0;
        userChoice = null;

        // Visual Reset
        if (els.coin) {
            // Remove legacy classes if any
            els.coin.classList.remove('show-front', 'show-back');

            // Hard reset transform
            els.coin.style.transition = 'none';
            els.coin.style.transform = 'rotateY(0deg)'; // Always default to Blue/Front

            // Force Reflow
            void els.coin.offsetWidth;

            // Restore transitions (after a tick to ensure it took)
            requestAnimationFrame(() => {
                els.coin.style.transition = '';
            });
        }

        if (els.status) els.status.textContent = "Choose Blue or Yellow to start!";
        if (els.winningsDisplay) els.winningsDisplay.textContent = "0";
        if (els.betInput) els.betInput.disabled = false;

        // Buttons
        updateButtons();
    }

    /**
     * Updates button states based on game state
     */
    function updateButtons() {
        // Choice Buttons
        const baseClass = "coinflip-choice-btn flex-1 py-6 text-lg flex flex-col gap-2 items-center rounded-xl transition-all";
        const blueBase = "border-blue-500/30 hover:bg-blue-500/10 text-blue-400";
        const yellowBase = "border-amber-500/30 hover:bg-amber-500/10 text-amber-400";
        const activeClass = "ring-4 scale-105";

        if (els.btnBlue) {
            els.btnBlue.className = `${baseClass} ${blueBase} ${userChoice === 'blue' ? activeClass + ' ring-blue-500 bg-blue-500/20 border-blue-500' : ''}`;
            els.btnBlue.disabled = isFlipping;
        }
        if (els.btnYellow) {
            els.btnYellow.className = `${baseClass} ${yellowBase} ${userChoice === 'yellow' ? activeClass + ' ring-yellow-500 bg-yellow-500/20 border-yellow-500' : ''}`;
            els.btnYellow.disabled = isFlipping;
        }

        // Flip Button
        if (els.flipBtn) {
            if (!userChoice || isFlipping) {
                els.flipBtn.disabled = true;
                els.flipBtn.textContent = isFlipping ? "FLIPPING..." : "SELECT SIDE";
            } else {
                els.flipBtn.disabled = false;
                els.flipBtn.textContent = isActive ? "FLIP AGAIN!" : "FLIP COIN";
            }
        }

        // Cashout Button
        if (els.cashoutBtn) {
            if (isActive && !isFlipping && currentWinnings > 0) {
                els.cashoutBtn.disabled = false;
                els.cashoutBtn.classList.remove('hidden');
            } else {
                els.cashoutBtn.disabled = true;
                els.cashoutBtn.classList.add('hidden');
            }
        }
    }

    function selectSide(side) {
        if (isFlipping) return;
        userChoice = side;
        API.playSound('click');
        els.status.textContent = `Selected ${side.toUpperCase()}. ${isActive ? 'Flip again!' : 'Place bet & Flip!'}`;
        updateButtons();
    }

    /**
     * Main Flip Logic
     */
    function handleFlipClick() {
        if (isFlipping || !userChoice) return;

        // 1. Validate / Place Bet
        if (!isActive) {
            const amount = parseInt(els.betInput.value);
            if (isNaN(amount) || amount <= 0) { API.showMessage("Invalid Bet"); return; }
            if (amount > API.getBalance()) { API.showMessage("Insufficient Funds"); return; }

            // Deduct
            API.updateBalance(-amount);
            currentBet = amount;
            currentWinnings = amount; // Start with principal
            isActive = true;
            els.betInput.disabled = true;
        }

        // 2. Start Animation
        isFlipping = true;
        updateButtons();
        els.status.textContent = "Flipping...";
        API.playSound('coin_flip');

        // Register stats
        if (API.registerGameStart) API.registerGameStart('CoinFlip');

        // Logic
        const isWin = Math.random() < 0.50;
        const resultColor = isWin ? userChoice : (userChoice === 'blue' ? 'yellow' : 'blue');

        // Animation Param
        // If result is Blue(0deg), rotate to 360*5 + 0.
        // If result is Yellow(180deg), rotate to 360*5 + 180.
        // spins must be INTEGER to ensure clean multiples of 360
        const spins = 5;
        const targetDeg = (spins * 360) + (resultColor === 'blue' ? 0 : 180);

        // Debug Log
        console.log(`Flip Target: ${resultColor.toUpperCase()} (${targetDeg}deg) -> Win: ${isWin}`);

        // Apply Transform
        // Note: We use a ease-out back or cubic-bezier for a nice effect
        els.coin.style.transition = 'transform 1.2s cubic-bezier(0.1, 0.7, 0.1, 1)';
        els.coin.style.transform = `rotateY(${targetDeg}deg)`;

        // 3. Resolve
        setTimeout(() => {
            finishFlip(isWin, resultColor);
        }, 1300); // Wait slightly longer than transition
    }

    function finishFlip(isWin, resultColor) {
        isFlipping = false;

        // Fix Visuals
        // We strip the transition to prevent "spinning back"
        els.coin.style.transition = 'none';
        // Normalize the degree to 0 or 180 (within one rotation)
        // This is visually identical because we landed on a multiple
        els.coin.style.transform = `rotateY(${resultColor === 'blue' ? 0 : 180}deg)`;

        // Force reflow to ensure the 'none' transition is applied before any future change
        void els.coin.offsetWidth;

        const emoji = resultColor === 'blue' ? '🔵' : '🟡';

        if (isWin) {
            // WIN
            currentWinnings = currentWinnings * 2;
            els.winningsDisplay.textContent = API.formatWin(currentWinnings);
            els.status.textContent = `WIN! Result: ${emoji}. Winnings: ${API.formatWin(currentWinnings)}`;
            API.playSound('win_small');
        } else {
            // LOSS
            els.status.textContent = `LOSS. Result: ${emoji}. Lost ${API.formatWin(currentBet)}`;
            API.playSound('lose');
            // Auto Reset after delay
            setTimeout(() => {
                resetGame();
            }, 1500);
            return; // Exit early
        }

        updateButtons();
        API.saveGameState();
    }

    function handleCashoutClick() {
        if (!isActive || isFlipping) return;

        const profit = currentWinnings - currentBet;
        API.updateBalance(currentWinnings); // Return strict winnings to balance
        API.addWin('CoinFlip', profit); // Log profit

        API.playSound('win_medium');
        API.showMessage(`Cashed out ${API.formatWin(currentWinnings)}!`);

        resetGame();
        API.saveGameState();
    }

})();