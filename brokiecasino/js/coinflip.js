// v2.1 - 3D Flip - Guard Block Removed for Debugging ts(1128)

console.log("[COINFLIP DEBUG] Script Loading (No Guard)...");

let coinFlipActive = false;
let coinFlipBet = 0;
let currentCoinFlipWinnings = 0;
let isCoinFlipping = false;
let coinFlipChoice = null;

let coinElement, coinflipBetInput, coinflipButton, coinflipCashoutButton;
let coinflipWinningsSpan, coinflipStatus, coinflipChooseBlueBtn, coinflipChooseYellowBtn;
let coinFrontFace, coinBackFace;

// --- API Reference --- Attempt to get from global scope if not passed to init
let LocalBrokieAPI = window.LocalBrokieAPI || null;

function initCoinflip() {
    console.log("Initializing Coin Flip (v2.1 - 3D / No Guard)...");
    // If API is passed via main.js, uncomment this line:
    // if (arguments.length > 0 && arguments[0]) LocalBrokieAPI = arguments[0];
    const api = LocalBrokieAPI || window; // Use the API object or fallback to window

    try {
        coinElement = document.getElementById('coin');
        coinflipBetInput = document.getElementById('coinflip-bet');
        coinflipButton = document.getElementById('coinflip-button');
        coinflipCashoutButton = document.getElementById('coinflip-cashout-button');
        coinflipWinningsSpan = document.getElementById('coinflip-winnings');
        coinflipStatus = document.getElementById('coinflip-status');
        coinflipChooseBlueBtn = document.getElementById('coinflip-choose-blue');
        coinflipChooseYellowBtn = document.getElementById('coinflip-choose-yellow');

        // Strict check for essential elements
        const elements = { coinElement, coinflipBetInput, coinflipButton, coinflipCashoutButton, coinflipWinningsSpan, coinflipStatus, coinflipChooseBlueBtn, coinflipChooseYellowBtn };
        for (const key in elements) {
            if (!elements[key]) {
                console.error(`Coin Flip initialization failed: Element '${key}' not found. Check HTML IDs.`);
                return;
            }
        }
        console.log("All required elements found by ID.");

        // Check coin face structure
        if(coinElement) {
            coinFrontFace = coinElement.querySelector('.coin-front');
            coinBackFace = coinElement.querySelector('.coin-back');
             console.log(`Coin faces query: front=${!!coinFrontFace}, back=${!!coinBackFace}`);
             if (!coinFrontFace || !coinBackFace) {
                 console.error("ERROR: Coin element found, but required .coin-front or .coin-back children are missing! Update HTML structure inside div#coin.");
                 if(coinflipButton) coinflipButton.disabled = true;
                 if(coinflipStatus) coinflipStatus.textContent = "HTML Error!";
                 return;
             }
             console.log("Coin face structure (.coin-front, .coin-back) verified.");
        } else { /* Should have failed above if !coinElement */ }


        resetCoinFlip();

        coinflipButton.addEventListener('click', handleCoinFlip);
        coinflipCashoutButton.addEventListener('click', cashOutCoinFlip);
        coinflipChooseBlueBtn.addEventListener('click', () => setCoinFlipChoice('blue'));
        coinflipChooseYellowBtn.addEventListener('click', () => setCoinFlipChoice('yellow'));

        if (typeof api.addBetAdjustmentListeners === 'function') {
            api.addBetAdjustmentListeners('coinflip', coinflipBetInput);
        } else {
            console.warn('addBetAdjustmentListeners function not found.');
        }

        console.log("Coin Flip Initialized (No Guard).");

    } catch (err) {
        console.error("Error during Coin Flip initialization:", err);
    }
}

function resetCoinFlip() {
    coinFlipActive = false;
    isCoinFlipping = false;
    coinFlipBet = 0;
    currentCoinFlipWinnings = 0;
    coinFlipChoice = null;

    if (coinElement) {
        coinElement.classList.remove('flipping');
        coinElement.style.transform = '';
        coinElement.style.transition = '';
    }

    if (coinflipButton) {
        coinflipButton.textContent = 'Select Side & Flip';
        coinflipButton.disabled = true;
    }
    if (coinflipCashoutButton) { coinflipCashoutButton.disabled = true; }
    if (coinflipWinningsSpan) { coinflipWinningsSpan.textContent = '0'; }
    if (coinflipStatus) { coinflipStatus.textContent = 'Choose Blue or Yellow!'; }
    if (coinflipBetInput) { coinflipBetInput.disabled = false; }
    if (coinflipChooseBlueBtn) { coinflipChooseBlueBtn.classList.remove('selected'); coinflipChooseBlueBtn.disabled = false; }
    if (coinflipChooseYellowBtn) { coinflipChooseYellowBtn.classList.remove('selected'); coinflipChooseYellowBtn.disabled = false; }
}


function setCoinFlipChoice(choice) {
    if (isCoinFlipping || coinFlipActive) return;
    if (!coinflipChooseBlueBtn || !coinflipChooseYellowBtn || !coinflipButton || !coinflipStatus) return;

    const api = LocalBrokieAPI || window;
    if (typeof api.playSound === 'function') api.playSound('click');
    coinFlipChoice = choice;

    if (choice === 'blue') {
        coinflipChooseBlueBtn.classList.add('selected');
        coinflipChooseYellowBtn.classList.remove('selected');
    } else {
        coinflipChooseYellowBtn.classList.add('selected');
        coinflipChooseBlueBtn.classList.remove('selected');
    }
    coinflipButton.disabled = false;
    coinflipStatus.textContent = `Selected ${choice === 'blue' ? 'Blue 🔵' : 'Yellow 🟡'}. Place your bet & Flip!`;
}


function handleCoinFlip() {
    if (isCoinFlipping) return;
    if (!coinElement || !coinflipBetInput || !coinflipButton || !coinflipCashoutButton || !coinflipStatus || !coinflipChooseBlueBtn || !coinflipChooseYellowBtn) {
         console.error("handleCoinFlip aborted: Missing required elements.");
         return;
     }

    if (!coinFlipChoice) {
        const api = LocalBrokieAPI || window;
         if (typeof api.showMessage === 'function') api.showMessage("Please choose Blue or Yellow first!", 2000);
         else alert("Please choose Blue or Yellow first!"); // Fallback alert
        return;
    }

    const betAmount = parseInt(coinflipBetInput.value);
    const api = LocalBrokieAPI || window;
    const currentBalance = typeof api.currency !== 'undefined' ? api.currency : (typeof window.currency !== 'undefined' ? window.currency : Infinity); // Assume infinite if not found


    if (!coinFlipActive) {
        if (isNaN(betAmount) || betAmount <= 0) {
             if (typeof api.showMessage === 'function') api.showMessage("Please enter a valid positive bet amount.", 2000);
             else alert("Please enter a valid positive bet amount.");
             return;
        }
        if (betAmount > currentBalance && currentBalance !== Infinity) { // Check balance if available
             if (typeof api.showMessage === 'function') api.showMessage("Not enough currency!", 2000);
             else alert("Not enough currency!");
             return;
        }
        coinFlipBet = betAmount;

        if (typeof api.updateBalance === 'function') {
             api.updateBalance(-coinFlipBet);
        } else if (typeof window.updateBalance === 'function') {
             window.updateBalance(-coinFlipBet);
        } else {
             if (typeof api.currency !== 'undefined') api.currency -= coinFlipBet;
             else if (typeof window.currency !== 'undefined') window.currency -= coinFlipBet;
             if (typeof api.updateCurrencyDisplay === 'function') api.updateCurrencyDisplay('loss');
             else if (typeof window.updateCurrencyDisplay === 'function') window.updateCurrencyDisplay('loss');
        }

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

    coinElement.style.transform = '';
    coinElement.classList.remove('flipping');
    void coinElement.offsetWidth;
    coinElement.classList.add('flipping');

    if (typeof api.playSound === 'function') api.playSound('coin_flip');
    else if (typeof window.playSound === 'function') window.playSound('coin_flip');

    setTimeout(() => {
        if (!coinElement || !coinflipButton || !coinflipCashoutButton || !coinflipWinningsSpan || !coinflipStatus) {
            console.warn("Coin flip elements not found after timeout.");
            isCoinFlipping = false;
            return;
        }

        const resultIsBlue = Math.random() < 0.5;
        const resultEmoji = resultIsBlue ? '🔵' : '🟡';
        const resultColor = resultIsBlue ? 'blue' : 'yellow';

        coinElement.classList.remove('flipping');
        isCoinFlipping = false;

        coinElement.style.transition = 'transform 0.15s ease-out';
        if (resultIsBlue) {
            coinElement.style.transform = 'rotateY(0deg)';
        } else {
            coinElement.style.transform = 'rotateY(180deg)';
        }
        setTimeout(() => {
            if (coinElement) coinElement.style.transition = '';
        }, 160);


        if (resultColor === coinFlipChoice) { // WIN
            currentCoinFlipWinnings *= 2;
            const displayWinnings = typeof api.formatWin === 'function' ? api.formatWin(currentCoinFlipWinnings) : (typeof window.formatWin === 'function' ? window.formatWin(currentCoinFlipWinnings) : currentCoinFlipWinnings);
            coinflipStatus.textContent = `WIN! Current Winnings: ${displayWinnings}`;
            coinflipButton.disabled = false;
            coinflipCashoutButton.disabled = false;
            coinflipWinningsSpan.textContent = displayWinnings;
             if (typeof api.playSound === 'function') api.playSound('win_small');
             else if (typeof window.playSound === 'function') window.playSound('win_small');
        } else { // LOSS
            const displayLoss = typeof api.formatWin === 'function' ? api.formatWin(currentCoinFlipWinnings) : (typeof window.formatWin === 'function' ? window.formatWin(currentCoinFlipWinnings) : currentCoinFlipWinnings);
            coinflipStatus.textContent = `LOSS! It was ${resultEmoji}. You lost ${displayLoss}.`;
             if (typeof api.totalLoss !== 'undefined') api.totalLoss += coinFlipBet;
             else if (typeof window.totalLoss !== 'undefined') window.totalLoss += coinFlipBet;
             if (typeof api.playSound === 'function') api.playSound('lose');
             else if (typeof window.playSound === 'function') window.playSound('lose');
            resetCoinFlip();
             if (typeof api.updateCurrencyDisplay === 'function') api.updateCurrencyDisplay();
             else if (typeof window.updateCurrencyDisplay === 'function') window.updateCurrencyDisplay();
        }
         if (typeof api.saveGameState === 'function') api.saveGameState();
         else if (typeof window.saveGameState === 'function') window.saveGameState();
    }, 600);
}


function cashOutCoinFlip() {
    if (!coinFlipActive || isCoinFlipping) return;
    if (!coinflipWinningsSpan) return;

    const profit = currentCoinFlipWinnings - coinFlipBet;
    const api = LocalBrokieAPI || window;

     if (typeof api.updateBalance === 'function') {
         api.updateBalance(currentCoinFlipWinnings);
     } else if (typeof window.updateBalance === 'function') {
         window.updateBalance(currentCoinFlipWinnings);
     } else {
         if (typeof api.currency !== 'undefined') api.currency += currentCoinFlipWinnings;
         else if (typeof window.currency !== 'undefined') window.currency += currentCoinFlipWinnings;
     }

     if (typeof api.totalGain !== 'undefined') api.totalGain += Math.max(0, profit);
     else if (typeof window.totalGain !== 'undefined') window.totalGain += Math.max(0, profit);


    const displayWinnings = typeof api.formatWin === 'function' ? api.formatWin(currentCoinFlipWinnings) : (typeof window.formatWin === 'function' ? window.formatWin(currentCoinFlipWinnings) : currentCoinFlipWinnings);
    const displayProfit = typeof api.formatWin === 'function' ? api.formatWin(profit) : (typeof window.formatWin === 'function' ? window.formatWin(profit) : profit);

    if (typeof api.showMessage === 'function') api.showMessage(`Cashed out ${displayWinnings}! Profit: ${displayProfit}`, 3000);
    else if (typeof window.showMessage === 'function') window.showMessage(`Cashed out ${displayWinnings}! Profit: ${displayProfit}`, 3000);
    else alert(`Cashed out ${displayWinnings}! Profit: ${displayProfit}`); // Fallback alert

    if (typeof api.playSound === 'function') api.playSound('win_medium');
    else if (typeof window.playSound === 'function') window.playSound('win_medium');

    if (typeof api.addWinToLeaderboard === 'function') api.addWinToLeaderboard('Coin Flip', profit);
    else if (typeof window.addWinToLeaderboard === 'function') window.addWinToLeaderboard('Coin Flip', profit);

    resetCoinFlip();

    if (typeof api.updateCurrencyDisplay === 'function') api.updateCurrencyDisplay('win');
    else if (typeof window.updateCurrencyDisplay === 'function') window.updateCurrencyDisplay('win');

    if (typeof api.saveGameState === 'function') api.saveGameState();
    else if (typeof window.saveGameState === 'function') window.saveGameState();
}

// --- Initialization Trigger ---
// Make sure this init function is called after the DOM is loaded.
/*
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded, attempting to initialize Coinflip (No Guard)...");
    if (typeof initCoinflip === 'function') {
        initCoinflip(); // Assumes LocalBrokieAPI might be set globally or not needed
    } else {
        console.error("initCoinflip function is not defined!");
    }
});
*/
// If initCoinflip is already called from main.js, make sure it's called correctly.

// --- END OF SCRIPT ---