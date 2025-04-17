/**
 * Brokie Casino - Blackjack Game Logic (blackjack.js)
 *
 * Handles all functionality related to the Blackjack game.
 * Depends on functions and variables defined in main.js.
 */

// --- Blackjack Specific State & Constants ---
let blackjackActive = false; // Is a game currently in progress?
let blackjackBet = 0; // Current bet amount
let blackjackDeck = []; // Array to hold the current deck of cards
let blackjackPlayerHand = []; // Array of player's cards
let blackjackDealerHand = []; // Array of dealer's cards
let blackjackPlayerScore = 0; // Player's current score
let blackjackDealerScore = 0; // Dealer's current score (visible part)
let blackjackPlayerBusted = false;
let blackjackDealerBusted = false;
let blackjackPlayerBlackjack = false;
let blackjackDealerBlackjack = false;
const BLACKJACK_PAYOUT_MULTIPLIER = 2.5; // 3:2 payout for Blackjack (1.5 profit + original bet)
const REGULAR_WIN_MULTIPLIER = 2.0; // 1:1 payout for regular win (1 profit + original bet)
const BLACKJACK_TARGET_SCORE = 21;
const DEALER_STAND_SCORE = 17;
const blackjackSuits = ['♠', '♥', '♦', '♣']; // Spades, Hearts, Diamonds, Clubs
const blackjackRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']; // T=10

// --- DOM Elements (Blackjack Specific) ---
let blackjackBetInput, blackjackDealButton, blackjackHitButton, blackjackStandButton;
let blackjackPlayerHandElement, blackjackDealerHandElement;
let blackjackPlayerScoreElement, blackjackDealerScoreElement, blackjackStatus;

/**
 * Initializes the Blackjack game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initBlackjack() {
    console.log("Initializing Blackjack...");
    // Get DOM elements
    blackjackBetInput = document.getElementById('blackjack-bet');
    blackjackDealButton = document.getElementById('blackjack-deal-button');
    blackjackHitButton = document.getElementById('blackjack-hit-button');
    blackjackStandButton = document.getElementById('blackjack-stand-button');
    blackjackPlayerHandElement = document.getElementById('blackjack-player-hand');
    blackjackDealerHandElement = document.getElementById('blackjack-dealer-hand');
    blackjackPlayerScoreElement = document.getElementById('blackjack-player-score');
    blackjackDealerScoreElement = document.getElementById('blackjack-dealer-score');
    blackjackStatus = document.getElementById('blackjack-status');

    // Check if all essential elements were found
    if (!blackjackBetInput || !blackjackDealButton || !blackjackHitButton || !blackjackStandButton ||
        !blackjackPlayerHandElement || !blackjackDealerHandElement || !blackjackPlayerScoreElement ||
        !blackjackDealerScoreElement || !blackjackStatus) {
        console.error("Blackjack initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-blackjack');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Blackjack elements.</p>';
        return; // Stop initialization
    }

    // Set initial state
    resetBlackjack();

    // Add Event Listeners
    blackjackDealButton.addEventListener('click', startBlackjackGame);
    blackjackHitButton.addEventListener('click', blackjackHit);
    blackjackStandButton.addEventListener('click', blackjackStand);

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('blackjack', blackjackBetInput); // uses main.js

    console.log("Blackjack Initialized.");
}

/**
 * Creates a standard 52-card deck.
 * @returns {Array<Object>} An array of card objects { rank: string, suit: string }.
 */
function createBlackjackDeck() {
    const deck = [];
    for (const suit of blackjackSuits) {
        for (const rank of blackjackRanks) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 */
function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

/**
 * Gets the numerical value of a Blackjack card rank.
 * @param {string} rank The card rank ('2'-'9', 'T', 'J', 'Q', 'K', 'A').
 * @returns {number} The numerical value (Ace is 11 initially).
 */
function getBlackjackCardValue(rank) {
    if (['T', 'J', 'Q', 'K'].includes(rank)) {
        return 10;
    } else if (rank === 'A') {
        return 11; // Ace is initially 11
    } else {
        return parseInt(rank);
    }
}

/**
 * Calculates the total value of a Blackjack hand, handling Aces correctly.
 * @param {Array<Object>} hand An array of card objects.
 * @returns {number} The calculated hand value.
 */
function calculateBlackjackHandValue(hand) {
    let value = 0;
    let aceCount = 0;
    for (const card of hand) {
        if (!card || !card.rank) continue; // Skip if card is invalid
        value += getBlackjackCardValue(card.rank);
        if (card.rank === 'A') {
            aceCount++;
        }
    }
    // Adjust for Aces if the total value exceeds 21
    while (value > BLACKJACK_TARGET_SCORE && aceCount > 0) {
        value -= 10; // Change an Ace from 11 to 1
        aceCount--;
    }
    return value;
}

/**
 * Creates an HTML element representing a playing card.
 * @param {Object} card The card object { rank: string, suit: string }.
 * @param {boolean} [isHidden=false] Whether the card should be hidden (face down).
 * @returns {HTMLElement} The card div element.
 */
function createBlackjackCardElement(card, isHidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'blackjack-card'; // Base class from style.css
    if (isHidden) {
        cardDiv.classList.add('hidden'); // Hidden class from style.css
        // Add placeholder content for hidden card
        cardDiv.innerHTML = `<span>?</span><span>?</span>`;
    } else if (card && card.rank && card.suit) { // Ensure card data is valid
        const rankSpan = document.createElement('span');
        rankSpan.textContent = card.rank === 'T' ? '10' : card.rank; // Display '10' for Ten

        const suitSpan = document.createElement('span');
        suitSpan.textContent = card.suit;

        // Add color class based on suit
        if (['♥', '♦'].includes(card.suit)) {
            cardDiv.classList.add('suit-red'); // Class from style.css
        } else {
            cardDiv.classList.add('suit-black'); // Class from style.css
        }

        cardDiv.appendChild(rankSpan);
        cardDiv.appendChild(suitSpan);
    } else {
         // Fallback for invalid card data
         cardDiv.classList.add('hidden');
         cardDiv.innerHTML = `<span>!</span><span>!</span>`;
         console.warn("Attempted to create card element with invalid data:", card);
    }
    return cardDiv;
}

/**
 * Deals a single card from the deck to a specified hand.
 * @param {Array<Object>} hand The hand to deal to (player or dealer).
 */
function dealBlackjackCard(hand) {
    if (blackjackDeck.length > 0) {
        hand.push(blackjackDeck.pop());
    } else {
        console.error("Deck is empty!"); // Should ideally not happen with a single deck game
        showMessage("Error: Deck empty!", 2000); // uses main.js
    }
}

/**
 * Resets the Blackjack game state and UI.
 * @param {boolean} [refundBet=false] - If true, refunds the current bet (used when switching tabs).
 */
function resetBlackjack(refundBet = false) {
    // Check if elements exist before proceeding
    if (!blackjackPlayerHandElement || !blackjackDealerHandElement || !blackjackPlayerScoreElement ||
        !blackjackDealerScoreElement || !blackjackStatus || !blackjackDealButton ||
        !blackjackHitButton || !blackjackStandButton || !blackjackBetInput) {
            console.warn("Cannot reset Blackjack, elements missing.");
            return;
        }

    if (refundBet && blackjackActive && blackjackBet > 0) {
        currency += blackjackBet; // Refund bet if game was active and reset by tab switch (uses main.js)
        updateCurrencyDisplay(); // Update display without flash (uses main.js)
    }

    blackjackActive = false;
    blackjackBet = 0;
    blackjackDeck = [];
    blackjackPlayerHand = [];
    blackjackDealerHand = [];
    blackjackPlayerScore = 0;
    blackjackDealerScore = 0;
    blackjackPlayerBusted = false;
    blackjackDealerBusted = false;
    blackjackPlayerBlackjack = false;
    blackjackDealerBlackjack = false;

    // Clear UI elements
    blackjackPlayerHandElement.innerHTML = '';
    blackjackDealerHandElement.innerHTML = '';
    blackjackPlayerScoreElement.textContent = '0';
    blackjackDealerScoreElement.textContent = '0';
    // Remove status classes from the PARENT of the score element if structure requires it
    // Assuming the parent has the 'blackjack-score' class from the HTML structure
    if (blackjackPlayerScoreElement.parentElement) {
        blackjackPlayerScoreElement.parentElement.classList.remove('busted', 'blackjack');
    }
    if (blackjackDealerScoreElement.parentElement) {
        blackjackDealerScoreElement.parentElement.classList.remove('busted', 'blackjack');
    }
    blackjackStatus.textContent = 'Place your bet and Deal!';

    // Reset button states
    blackjackDealButton.disabled = false;
    blackjackHitButton.disabled = true;
    blackjackStandButton.disabled = true;
    blackjackBetInput.disabled = false; // Allow changing bet
}

/**
 * Updates the Blackjack UI (hands, scores) based on the current game state.
 * @param {boolean} [hideDealerCard=false] - If true, hides the dealer's second card.
 */
function updateBlackjackUI(hideDealerCard = false) {
    // Check if elements exist
    if (!blackjackPlayerHandElement || !blackjackDealerHandElement || !blackjackPlayerScoreElement || !blackjackDealerScoreElement) {
        console.error("Cannot update Blackjack UI, elements missing.");
        return;
    }

    // Update Player Hand and Score
    blackjackPlayerHandElement.innerHTML = '';
    blackjackPlayerHand.forEach(card => {
        blackjackPlayerHandElement.appendChild(createBlackjackCardElement(card));
    });
    blackjackPlayerScore = calculateBlackjackHandValue(blackjackPlayerHand);
    blackjackPlayerScoreElement.textContent = blackjackPlayerScore;
    // Update player score display style (assuming parent has 'blackjack-score' class)
    const playerScoreParent = blackjackPlayerScoreElement.parentElement;
    if (playerScoreParent) {
        playerScoreParent.classList.remove('busted', 'blackjack');
        if (blackjackPlayerBusted) {
            playerScoreParent.classList.add('busted');
        } else if (blackjackPlayerBlackjack && blackjackPlayerHand.length === 2) {
            playerScoreParent.classList.add('blackjack');
        }
    }


    // Update Dealer Hand and Score
    blackjackDealerHandElement.innerHTML = '';
    let visibleDealerScore = 0;
    let visibleAceCount = 0; // Track aces in visible cards for correct visible score calculation
    blackjackDealerHand.forEach((card, index) => {
        const isHidden = hideDealerCard && index === 1;
        blackjackDealerHandElement.appendChild(createBlackjackCardElement(card, isHidden));
        if (!isHidden && card && card.rank) { // Calculate visible score only for shown cards
            visibleDealerScore += getBlackjackCardValue(card.rank);
            if (card.rank === 'A') {
                visibleAceCount++;
            }
        }
    });
    // Adjust visible score for aces if needed
    while (visibleDealerScore > BLACKJACK_TARGET_SCORE && visibleAceCount > 0) {
        visibleDealerScore -= 10;
        visibleAceCount--;
    }

    // Display either the visible score or the final score if game is over
    blackjackDealerScore = calculateBlackjackHandValue(blackjackDealerHand); // Full score calculation
    blackjackDealerScoreElement.textContent = hideDealerCard ? visibleDealerScore : blackjackDealerScore;
    // Update dealer score display style (only show final state like bust/blackjack when game ends)
    const dealerScoreParent = blackjackDealerScoreElement.parentElement;
     if (dealerScoreParent) {
        dealerScoreParent.classList.remove('busted', 'blackjack');
        if (!hideDealerCard) { // Only show final status when all cards revealed
            if (blackjackDealerBusted) {
                dealerScoreParent.classList.add('busted');
            } else if (blackjackDealerBlackjack && blackjackDealerHand.length === 2) {
                dealerScoreParent.classList.add('blackjack');
            }
        }
    }
}

/**
 * Starts a new round of Blackjack: validates bet, deals cards, checks for immediate Blackjacks.
 */
function startBlackjackGame() {
    if (blackjackActive) return; // Don't start if already active
    if (!blackjackBetInput || !blackjackDealButton || !blackjackHitButton || !blackjackStandButton || !blackjackStatus) return; // Check elements

    const betAmount = parseInt(blackjackBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
    }
    if (betAmount > currency) { // uses main.js
        showMessage("Not enough currency!", 2000); return; // uses main.js
    }

    startTone(); // uses main.js
    playSound('blackjack_deal'); // uses main.js
    resetBlackjack(); // Reset previous game state

    blackjackActive = true;
    blackjackBet = betAmount;
    currency -= betAmount; // uses main.js
    updateCurrencyDisplay('loss'); // uses main.js

    // Create and shuffle deck
    blackjackDeck = createBlackjackDeck();
    shuffleDeck(blackjackDeck);

    // Deal initial hands
    dealBlackjackCard(blackjackPlayerHand);
    dealBlackjackCard(blackjackDealerHand);
    dealBlackjackCard(blackjackPlayerHand);
    dealBlackjackCard(blackjackDealerHand);

    // Calculate initial scores and check for immediate Blackjacks
    blackjackPlayerScore = calculateBlackjackHandValue(blackjackPlayerHand);
    blackjackDealerScore = calculateBlackjackHandValue(blackjackDealerHand); // Calculate full dealer score now
    blackjackPlayerBlackjack = (blackjackPlayerScore === BLACKJACK_TARGET_SCORE && blackjackPlayerHand.length === 2);
    blackjackDealerBlackjack = (blackjackDealerScore === BLACKJACK_TARGET_SCORE && blackjackDealerHand.length === 2);

    // Update UI, hiding dealer's second card initially
    updateBlackjackUI(true);

    // Disable bet input and deal button, enable hit/stand
    blackjackBetInput.disabled = true;
    blackjackDealButton.disabled = true;

    // Handle immediate Blackjack scenarios
    if (blackjackPlayerBlackjack || blackjackDealerBlackjack) {
        // If either has Blackjack, the game ends immediately after revealing dealer card
        blackjackHitButton.disabled = true; // Disable hit/stand
        blackjackStandButton.disabled = true;
        setTimeout(() => determineBlackjackWinner(), 500); // Slight delay to show hands
    } else {
        // Enable hit/stand only if no immediate blackjack occurred
        blackjackHitButton.disabled = false;
        blackjackStandButton.disabled = false;
        blackjackStatus.textContent = 'Your turn: Hit or Stand?';
    }
    saveGameState(); // uses main.js
}

/**
 * Handles the player clicking the "Hit" button. Deals a card and checks for bust.
 */
function blackjackHit() {
    if (!blackjackActive) return;
    if (!blackjackHitButton || !blackjackStandButton || !blackjackStatus) return; // Check elements
    playSound('blackjack_hit'); // uses main.js

    dealBlackjackCard(blackjackPlayerHand);
    // Recalculate score and check bust status immediately after dealing
    blackjackPlayerScore = calculateBlackjackHandValue(blackjackPlayerHand);
    blackjackPlayerBusted = blackjackPlayerScore > BLACKJACK_TARGET_SCORE;

    updateBlackjackUI(true); // Keep dealer card hidden

    if (blackjackPlayerBusted) {
        blackjackStatus.textContent = `Busted! (${blackjackPlayerScore})`;
        playSound('blackjack_bust'); // uses main.js
        determineBlackjackWinner(); // End game immediately if player busts
    } else if (blackjackPlayerScore === BLACKJACK_TARGET_SCORE) {
        // Optional: Automatically stand if player hits 21? Or let them stand manually.
        // For now, let them choose to stand.
        blackjackStatus.textContent = '21! Hit or Stand?';
        // blackjackStand(); // Example: Auto-stand on 21
    } else {
        blackjackStatus.textContent = 'Hit or Stand?';
    }
    saveGameState(); // uses main.js
}

/**
 * Handles the player clicking the "Stand" button. Reveals dealer card and starts dealer's turn.
 */
function blackjackStand() {
    if (!blackjackActive) return;
    if (!blackjackHitButton || !blackjackStandButton || !blackjackStatus) return; // Check elements
    playSound('click'); // Simple click sound for stand (uses main.js)

    // Disable player actions
    blackjackHitButton.disabled = true;
    blackjackStandButton.disabled = true;

    // Reveal dealer's hidden card and proceed with dealer's turn
    blackjackStatus.textContent = "Dealer's turn...";
    updateBlackjackUI(false); // Reveal dealer's second card

    // Delay dealer's turn slightly for visual pacing
    setTimeout(dealerTurn, 1000);
}

/**
 * Executes the dealer's turn according to Blackjack rules (hit until >= 17).
 */
function dealerTurn() {
    // Check if game ended prematurely (e.g., player Blackjack or Bust) BEFORE dealer takes turn
    if (!blackjackActive) return;
    if (!blackjackStatus) return; // Check element

    // Reveal dealer's full hand first if it wasn't already (redundant if called after stand, but safe)
    updateBlackjackUI(false);

    // Dealer hits until score is DEALER_STAND_SCORE (17) or higher
    if (blackjackDealerScore < DEALER_STAND_SCORE) {
        blackjackStatus.textContent = 'Dealer hits...';
        playSound('blackjack_hit'); // uses main.js
        dealBlackjackCard(blackjackDealerHand);
        // Recalculate score and check bust status
        blackjackDealerScore = calculateBlackjackHandValue(blackjackDealerHand);
        blackjackDealerBusted = blackjackDealerScore > BLACKJACK_TARGET_SCORE;
        updateBlackjackUI(false); // Update UI with new card

        if (blackjackDealerBusted) {
            blackjackStatus.textContent = `Dealer Busted! (${blackjackDealerScore})`;
            playSound('blackjack_bust'); // uses main.js
            determineBlackjackWinner(); // End game if dealer busts
        } else {
            // Delay next dealer action for pacing
            setTimeout(dealerTurn, 1000);
        }
    } else {
        // Dealer stands
        blackjackStatus.textContent = `Dealer stands (${blackjackDealerScore}).`;
        determineBlackjackWinner(); // Determine winner after dealer stands
    }
    saveGameState(); // uses main.js
}

/**
 * Determines the winner of the Blackjack round based on final scores and states.
 * Updates currency, stats, and UI.
 */
function determineBlackjackWinner() {
    if (!blackjackActive) return; // Ensure game is active before determining winner (prevents double calls)
    if (!blackjackStatus || !blackjackDealButton || !blackjackBetInput) return; // Check elements

    // Reveal dealer's full hand if it wasn't already (important for Blackjack checks)
    updateBlackjackUI(false);

    blackjackActive = false; // Mark game as ended *before* calculating payout

    // Disable hit/stand permanently for this round
    if (blackjackHitButton) blackjackHitButton.disabled = true;
    if (blackjackStandButton) blackjackStandButton.disabled = true;
    // Re-enable Deal and Bet for next round
    blackjackDealButton.disabled = false;
    blackjackBetInput.disabled = false;

    let winAmount = 0;
    let statusMessage = '';
    let outcomeSound = 'lose'; // Default sound
    let changeType = null; // For currency flash

    // --- Determine Outcome ---
    // Player Blackjack scenarios
    if (blackjackPlayerBlackjack) {
        if (blackjackDealerBlackjack) {
            statusMessage = `Push! Both have Blackjack! Bet ${formatWin(blackjackBet)} returned.`; // uses main.js
            winAmount = blackjackBet; // Return original bet
            outcomeSound = 'blackjack_push';
        } else {
            statusMessage = `Blackjack! You win ${formatWin(Math.floor(blackjackBet * (BLACKJACK_PAYOUT_MULTIPLIER - 1)))}!`; // uses main.js
            winAmount = Math.floor(blackjackBet * BLACKJACK_PAYOUT_MULTIPLIER); // 3:2 payout
            outcomeSound = 'blackjack_blackjack';
            changeType = 'win';
        }
    }
    // Dealer Blackjack scenario (player does not have Blackjack)
    else if (blackjackDealerBlackjack) {
        statusMessage = `Dealer Blackjack! You lose ${formatWin(blackjackBet)}.`; // uses main.js
        winAmount = 0; // Player loses bet
        outcomeSound = 'lose';
        changeType = 'loss'; // Loss was on deal, but confirm sound/status
    }
    // Bust scenarios
    else if (blackjackPlayerBusted) {
        statusMessage = `You Busted! (${blackjackPlayerScore}). You lose ${formatWin(blackjackBet)}.`; // uses main.js
        winAmount = 0;
        outcomeSound = 'blackjack_bust'; // Already played on hit, but set for consistency
        changeType = 'loss';
    } else if (blackjackDealerBusted) {
        statusMessage = `Dealer Busted! (${blackjackDealerScore}). You win ${formatWin(blackjackBet)}!`; // uses main.js
        winAmount = blackjackBet * REGULAR_WIN_MULTIPLIER; // 1:1 payout
        outcomeSound = 'blackjack_win';
        changeType = 'win';
    }
    // Compare scores scenario (neither busted, no Blackjacks)
    else {
        if (blackjackPlayerScore > blackjackDealerScore) {
            statusMessage = `You win! ${blackjackPlayerScore} vs ${blackjackDealerScore}. Won ${formatWin(blackjackBet)}.`; // uses main.js
            winAmount = blackjackBet * REGULAR_WIN_MULTIPLIER;
            outcomeSound = 'blackjack_win';
            changeType = 'win';
        } else if (blackjackPlayerScore < blackjackDealerScore) {
            statusMessage = `Dealer wins! ${blackjackDealerScore} vs ${blackjackPlayerScore}. You lose ${formatWin(blackjackBet)}.`; // uses main.js
            winAmount = 0;
            outcomeSound = 'lose';
            changeType = 'loss';
        } else { // Push
            statusMessage = `Push! Both have ${blackjackPlayerScore}. Bet ${formatWin(blackjackBet)} returned.`; // uses main.js
            winAmount = blackjackBet; // Return original bet
            outcomeSound = 'blackjack_push';
            // No currency change type for push
        }
    }

    // --- Update State & UI ---
    const profit = winAmount - blackjackBet;
    currency += winAmount; // Add back winnings (or original bet on push) (uses main.js)

    if (profit > 0) {
        totalGain += profit; // uses main.js
        addWinToLeaderboard('Blackjack', profit); // uses main.js
    } else if (profit < 0) {
        totalLoss += Math.abs(profit); // Or just totalLoss += blackjackBet; (uses main.js)
    }
    // No gain/loss change for push (profit = 0)

    updateCurrencyDisplay(changeType); // uses main.js
    blackjackStatus.textContent = statusMessage;
    playSound(outcomeSound); // uses main.js
    saveGameState(); // Save final game state (uses main.js)
}


// Note: The initBlackjack() function will be called from main.js
// Ensure main.js includes: if (typeof initBlackjack === 'function') initBlackjack();
// within its DOMContentLoaded listener.