/**
 * ==========================================================================
 * Brokie Casino - Sabacc Game Logic (sabacc.js) - v1.1 (Fixed Init Assignment)
 *
 * Handles core logic for a simplified Sabacc game.
 * - Fixed incorrect global assignment for init function.
 * - Target score: Closest to Zero.
 * - Bomb Out: Hand value > +23 or < -23.
 * - Sabacc (Pure Sabacc): Hand value exactly 0.
 * - Deck: Simplified mix of positive, negative, and zero cards.
 * - Sabacc Shift: Randomly replaces one card in each active hand.
 * ==========================================================================
 */

// Guard to prevent redefining if script runs twice
if (typeof initSabacc === 'undefined') {

    // --- Sabacc Specific State & Constants ---
    let sabaccDeck = [];
    let sabaccPlayerHand = [];
    let sabaccDealerHand = [];
    let sabaccPlayerScore = 0;
    let sabaccDealerScore = 0;
    let sabaccPlayerStands = false;
    let sabaccDealerStands = false; // Or determined by AI logic
    let sabaccCurrentBet = 0;
    let sabaccPot = 0; // Tracks total bet for the round
    let sabaccGameActive = false; // Is a round currently in progress?
    let sabaccShiftCounter = 0; // Track turns for potential shift
    const SABACC_SHIFT_THRESHOLD = 3; // Chance to shift after this many total cards drawn/swapped
    const SABACC_SHIFT_CHANCE = 0.3; // 30% chance of shift per eligible turn
    const SABACC_TARGET_SCORE = 0;
    const SABACC_BOMB_OUT_LIMIT = 23;

    // --- DOM Elements (Sabacc Specific) ---
    let sabaccPlayerHandArea, sabaccDealerHandArea, sabaccPlayerScoreDisplay,
        sabaccDealerScoreDisplay, sabaccBetInput, sabaccDealButton, sabaccHitButton,
        sabaccStandButton, sabaccStatusDisplay, sabaccPotDisplay;
        // Add sabacc-swap-button later if implementing swap

    // --- API Reference ---
    let LocalBrokieAPI = null; // Will be set in initSabacc

    /**
     * Initializes the Sabacc game elements, creates the deck, and sets up listeners.
     * @param {object} API - The BrokieAPI object from main.js.
     */
    function initSabacc(API) {
        console.log("Initializing Sabacc...");
        LocalBrokieAPI = API;

        // Get DOM elements
        sabaccPlayerHandArea = document.getElementById('sabacc-player-hand');
        sabaccDealerHandArea = document.getElementById('sabacc-dealer-hand');
        sabaccPlayerScoreDisplay = document.getElementById('sabacc-player-score');
        sabaccDealerScoreDisplay = document.getElementById('sabacc-dealer-score');
        sabaccBetInput = document.getElementById('sabacc-bet');
        sabaccDealButton = document.getElementById('sabacc-deal-button');
        sabaccHitButton = document.getElementById('sabacc-hit-button');
        sabaccStandButton = document.getElementById('sabacc-stand-button');
        sabaccStatusDisplay = document.getElementById('sabacc-status');
        sabaccPotDisplay = document.getElementById('sabacc-pot-display'); // Optional pot display

        // Basic check for essential elements
        if (!sabaccPlayerHandArea || !sabaccDealerHandArea || !sabaccBetInput || !sabaccDealButton || !sabaccHitButton || !sabaccStandButton || !sabaccStatusDisplay || !LocalBrokieAPI) {
            console.error("Sabacc initialization failed: Could not find all required DOM elements or API.");
            // Optionally hide the game area or show an error message
            const gameArea = document.getElementById('game-sabacc');
            if(gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Sabacc elements.</p>';
            return;
        }

        // Create the deck
        createSabaccDeck();

        // Setup Event Listeners
        sabaccDealButton.addEventListener('click', dealSabaccHand);
        sabaccHitButton.addEventListener('click', () => playerActionSabacc('hit'));
        sabaccStandButton.addEventListener('click', () => playerActionSabacc('stand'));

        // Add bet adjustment listeners using the factory from main.js
        LocalBrokieAPI.addBetAdjustmentListeners('sabacc', sabaccBetInput);

        resetSabaccTable(); // Initial state setup
        console.log("Sabacc Initialized.");
    }

    /**
     * Creates the Sabacc deck.
     * Simplified version with positive/negative values and The Idiot.
     */
    function createSabaccDeck() {
        sabaccDeck = [];
        const suits = ['Flasks', 'Sabers', 'Staves', 'Coins']; // Example suits
        const positiveValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const negativeValues = [-2, -5, -8, -11, -14, -17]; // Simplified negative cards
        const numDecks = 1; // Use 1 deck for simplicity

        for (let d = 0; d < numDecks; d++) {
            // Positive Cards
            suits.forEach(suit => {
                positiveValues.forEach(value => {
                    sabaccDeck.push({ name: `${value} of ${suit}`, value: value, type: 'positive' });
                });
            });

            // Negative Cards (add multiple copies for balance)
            for(let i = 0; i < 2; i++) { // Add 2 of each negative card per deck
                 negativeValues.forEach(value => {
                     // Assign simple names based on value for this example
                     sabaccDeck.push({ name: `Neg Card (${value})`, value: value, type: 'negative' });
                 });
            }


            // Special Cards
            sabaccDeck.push({ name: 'The Idiot', value: 0, type: 'special' });
            sabaccDeck.push({ name: 'The Idiot', value: 0, type: 'special' }); // Add two Idiots
        }
         console.log(`Sabacc deck created with ${sabaccDeck.length} cards.`);
    }

    /**
     * Shuffles the Sabacc deck using Fisher-Yates algorithm.
     */
    function shuffleSabaccDeck() {
        for (let i = sabaccDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sabaccDeck[i], sabaccDeck[j]] = [sabaccDeck[j], sabaccDeck[i]]; // Swap
        }
    }

    /**
     * Calculates the total value of a Sabacc hand.
     * @param {Array} hand - Array of card objects.
     * @returns {number} The calculated score.
     */
    function calculateSabaccHandValue(hand) {
        return hand.reduce((sum, card) => sum + card.value, 0);
    }

    /**
     * Checks if a hand has bombed out (value > 23 or < -23).
     * @param {number} score - The hand's score.
     * @returns {boolean} True if bombed out, false otherwise.
     */
    function hasBombedOut(score) {
        return score > SABACC_BOMB_OUT_LIMIT || score < -SABACC_BOMB_OUT_LIMIT;
    }

    /**
     * Checks if a hand is a "Pure Sabacc" (score is exactly the target).
     * @param {number} score - The hand's score.
     * @returns {boolean} True if Pure Sabacc, false otherwise.
     */
    function isPureSabacc(score) {
        return score === SABACC_TARGET_SCORE;
    }

    /**
     * Renders a hand (player or dealer) to the specified DOM element.
     * @param {Array} hand - The hand to render.
     * @param {HTMLElement} handAreaElement - The container element for the cards.
     * @param {boolean} hideFirstCard - If true, hides the dealer's first card.
     */
    function renderSabaccHand(hand, handAreaElement, hideFirstCard = false) {
        if (!handAreaElement) return;
        handAreaElement.innerHTML = ''; // Clear previous cards

        hand.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('sabacc-card'); // Use a specific class for Sabacc cards

            if (hideFirstCard && index === 0) {
                cardDiv.classList.add('hidden');
                cardDiv.innerHTML = `<span>?</span><span>?</span>`;
            } else {
                // Add classes based on card type or value for styling
                if (card.value > 0) cardDiv.classList.add('positive');
                else if (card.value < 0) cardDiv.classList.add('negative');
                else cardDiv.classList.add('zero'); // For The Idiot

                // Display card name and value (customize as needed)
                // Using smaller text for name, larger for value
                cardDiv.innerHTML = `
                    <span class="card-name">${card.name}</span>
                    <span class="card-value">${card.value}</span>
                `;
            }
            handAreaElement.appendChild(cardDiv);
        });
    }

    /**
     * Updates the displayed scores for player and dealer.
     */
    function updateSabaccScores() {
        sabaccPlayerScore = calculateSabaccHandValue(sabaccPlayerHand);
        // Calculate dealer score based on visible cards only initially
        sabaccDealerScore = sabaccGameActive && sabaccDealerHand.length > 0 ? calculateSabaccHandValue(sabaccDealerHand.slice(1)) : 0;
        const dealerFullScore = calculateSabaccHandValue(sabaccDealerHand); // For internal logic

        if (sabaccPlayerScoreDisplay) sabaccPlayerScoreDisplay.textContent = `${sabaccPlayerScore}`;
        // Display '?' for dealer score until their turn is over
        if (sabaccDealerScoreDisplay) {
            sabaccDealerScoreDisplay.textContent = (sabaccDealerStands || !sabaccGameActive) ? `${dealerFullScore}` : `${sabaccDealerScore} + ?`;
        }

        // Add classes if bombed out
        if (sabaccPlayerScoreDisplay) {
            sabaccPlayerScoreDisplay.classList.toggle('busted', hasBombedOut(sabaccPlayerScore));
        }
         if (sabaccDealerScoreDisplay && (sabaccDealerStands || !sabaccGameActive)) {
            sabaccDealerScoreDisplay.classList.toggle('busted', hasBombedOut(dealerFullScore));
        }
    }

    /**
     * Updates the UI elements (buttons, status messages).
     * @param {string} message - The message to display in the status area.
     * @param {boolean} gameOver - Indicates if the game round has ended.
     */
    function updateSabaccUI(message = "", gameOver = false) {
        if (sabaccStatusDisplay) sabaccStatusDisplay.textContent = message;
        if (sabaccPotDisplay) sabaccPotDisplay.textContent = sabaccPot; // Update pot display

        if (sabaccDealButton) sabaccDealButton.disabled = sabaccGameActive;
        if (sabaccHitButton) sabaccHitButton.disabled = !sabaccGameActive || gameOver || sabaccPlayerStands;
        if (sabaccStandButton) sabaccStandButton.disabled = !sabaccGameActive || gameOver || sabaccPlayerStands;
        // Disable bet input during active game
        if (sabaccBetInput) sabaccBetInput.disabled = sabaccGameActive;
    }

    /**
     * Resets the table for a new round.
     */
    function resetSabaccTable() {
        sabaccGameActive = false;
        sabaccPlayerHand = [];
        sabaccDealerHand = [];
        sabaccPlayerStands = false;
        sabaccDealerStands = false;
        sabaccShiftCounter = 0; // Reset shift counter
        sabaccPot = 0;

        // Clear visual hands and scores
        if (sabaccPlayerHandArea) sabaccPlayerHandArea.innerHTML = '';
        if (sabaccDealerHandArea) sabaccDealerHandArea.innerHTML = '';
        updateSabaccScores(); // Update scores to 0 or '?'

        updateSabaccUI("Place your bet and deal!", false);
    }

    /**
     * Deals the initial Sabacc hand.
     */
    function dealSabaccHand() {
        if (sabaccGameActive) return;

        const betAmount = parseInt(sabaccBetInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            LocalBrokieAPI.showMessage("Please enter a valid positive bet amount.", 2000); return;
        }
        if (betAmount > LocalBrokieAPI.getBalance()) {
            LocalBrokieAPI.showMessage("Not enough currency!", 2000); return;
        }

        LocalBrokieAPI.startTone();
        LocalBrokieAPI.playSound('blackjack_deal'); // Reuse deal sound

        sabaccGameActive = true;
        sabaccCurrentBet = betAmount;
        sabaccPot = sabaccCurrentBet * 2; // Player bet + initial dealer match (simple ante)
        LocalBrokieAPI.updateBalance(-sabaccCurrentBet); // Deduct player's bet

        createSabaccDeck(); // Create a fresh deck
        shuffleSabaccDeck();
        sabaccPlayerHand = [sabaccDeck.pop(), sabaccDeck.pop()];
        sabaccDealerHand = [sabaccDeck.pop(), sabaccDeck.pop()];
        sabaccPlayerStands = false;
        sabaccDealerStands = false;
        sabaccShiftCounter = 0;

        renderSabaccHand(sabaccPlayerHand, sabaccPlayerHandArea);
        renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, true); // Hide dealer's first card
        updateSabaccScores();

        // Check for immediate Sabacc or Bomb Out on deal (rare but possible)
        if (isPureSabacc(sabaccPlayerScore)) {
            endSabaccRound(true); // Player wins immediately
        } else if (hasBombedOut(sabaccPlayerScore)) {
             endSabaccRound(false); // Player bombs out immediately
        } else {
            updateSabaccUI("Your turn: Hit or Stand?", false);
        }
    }

    /**
     * Handles player actions (Hit or Stand).
     * @param {string} action - 'hit' or 'stand'.
     */
    function playerActionSabacc(action) {
        if (!sabaccGameActive || sabaccPlayerStands) return;

        if (action === 'hit') {
            LocalBrokieAPI.playSound('blackjack_hit'); // Reuse hit sound
            if (sabaccDeck.length > 0) {
                sabaccPlayerHand.push(sabaccDeck.pop());
            } else {
                 LocalBrokieAPI.showMessage("Deck is empty!", 1500);
                 // Optionally end round here or just prevent further hits
                 return;
            }
            renderSabaccHand(sabaccPlayerHand, sabaccPlayerHandArea);
            updateSabaccScores();
            sabaccShiftCounter++; // Increment shift counter on draw

            if (isPureSabacc(sabaccPlayerScore)) {
                updateSabaccUI("Pure Sabacc!", true);
                endSabaccRound(true); // Player wins
                return;
            }
            if (hasBombedOut(sabaccPlayerScore)) {
                updateSabaccUI("You Bombed Out!", true);
                endSabaccRound(false); // Player loses
                return;
            }
            // Check for potential shift after player action
            checkAndTriggerSabaccShift();

        } else if (action === 'stand') {
            LocalBrokieAPI.playSound('click'); // Simple click for stand
            sabaccPlayerStands = true;
            updateSabaccUI("Player stands. Dealer's turn.", false);
            // Check for shift *before* dealer plays, as player standing can trigger it
            if (!checkAndTriggerSabaccShift()) {
                // If no shift occurred, proceed to dealer's turn
                dealerTurnSabacc();
            }
            // If shift DID occur, dealerTurnSabacc will be called after the shift resolves
        }
    }

    /**
     * Simulates the dealer's turn based on simple AI.
     */
    function dealerTurnSabacc() {
        if (!sabaccGameActive) return;

        renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, false); // Reveal dealer's hand
        let dealerScore = calculateSabaccHandValue(sabaccDealerHand);
        updateSabaccScores(); // Update display with revealed score

        // Simple AI: Hit if absolute value is further than 5 from target (0), otherwise stand.
        // Avoid hitting if already bombed out.
        function performDealerAction() {
            dealerScore = calculateSabaccHandValue(sabaccDealerHand); // Recalculate after potential hit/shift

            if (hasBombedOut(dealerScore)) {
                sabaccDealerStands = true;
                updateSabaccUI("Dealer Bombed Out!", true);
                endSabaccRound(true); // Player wins
                return;
            }
             if (isPureSabacc(dealerScore)) {
                sabaccDealerStands = true;
                updateSabaccUI("Dealer has Pure Sabacc!", true);
                endSabaccRound(false); // Dealer wins
                return;
            }

            // AI Decision Logic
            const distanceFromTarget = Math.abs(dealerScore - SABACC_TARGET_SCORE);
            if (distanceFromTarget > 5 && sabaccDealerHand.length < 5) { // Threshold to hit (adjust) & card limit
                LocalBrokieAPI.playSound('blackjack_hit');
                if (sabaccDeck.length > 0) {
                    sabaccDealerHand.push(sabaccDeck.pop());
                } else {
                    LocalBrokieAPI.showMessage("Deck empty during Dealer turn!", 1500);
                    sabaccDealerStands = true; // Force stand if deck empty
                    endSabaccRound();
                    return;
                }

                renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, false);
                updateSabaccScores(); // Update score display immediately
                sabaccShiftCounter++; // Increment shift counter

                 // Check for bomb out/sabacc immediately after hit
                 dealerScore = calculateSabaccHandValue(sabaccDealerHand);
                 if (hasBombedOut(dealerScore)) {
                     sabaccDealerStands = true;
                     updateSabaccUI("Dealer Bombed Out!", true);
                     endSabaccRound(true); // Player wins
                     return;
                 }
                  if (isPureSabacc(dealerScore)) {
                     sabaccDealerStands = true;
                     updateSabaccUI("Dealer has Pure Sabacc!", true);
                     endSabaccRound(false); // Dealer wins
                     return;
                 }

                // Check for shift after dealer hit, then potentially hit again
                if (!checkAndTriggerSabaccShift()) {
                     setTimeout(performDealerAction, 800); // Delay next action if no shift
                }
                // If shift occurred, it will handle calling the next dealer action
            } else {
                // Stand
                sabaccDealerStands = true;
                updateSabaccUI("Dealer stands.", true);
                 endSabaccRound(); // Determine winner based on final scores
            }
        }

        // Start dealer's turn with a small delay
        setTimeout(performDealerAction, 800);
    }


    /**
     * Checks if conditions are met for a Sabacc Shift and triggers it.
     * @returns {boolean} True if a shift was triggered, false otherwise.
     */
    function checkAndTriggerSabaccShift() {
        if (!sabaccGameActive) return false;

        // Check if enough actions occurred and random chance hits
        if (sabaccShiftCounter >= SABACC_SHIFT_THRESHOLD && Math.random() < SABACC_SHIFT_CHANCE) {
            triggerSabaccShift();
            return true; // Shift happened
        }
        return false; // No shift
    }

    /**
     * Simulates the Sabacc Shift: Randomly replaces one card in each active hand.
     */
    function triggerSabaccShift() {
        console.log("--- SABACC SHIFT ---");
        LocalBrokieAPI.showMessage("Sabacc Shift!", 1500);
        // Play a specific sound? Reuse a generic effect for now
        LocalBrokieAPI.playSound('win_medium'); // Example sound

        sabaccShiftCounter = 0; // Reset counter

        // Animate or indicate shift visually? (e.g., flash hands)

        // Replace one random card in player's hand if they haven't stood yet
        if (!sabaccPlayerStands && sabaccPlayerHand.length > 0) {
            const playerIndexToReplace = Math.floor(Math.random() * sabaccPlayerHand.length);
            const oldPlayerCard = sabaccPlayerHand[playerIndexToReplace];
            const newPlayerCard = sabaccDeck.pop();
            if (newPlayerCard) { // Ensure deck isn't empty
                 sabaccPlayerHand[playerIndexToReplace] = newPlayerCard;
                 console.log(`Player Shift: ${oldPlayerCard.name} (${oldPlayerCard.value}) -> ${newPlayerCard.name} (${newPlayerCard.value})`);
            } else {
                 console.warn("Deck empty during player shift!");
            }

        }

        // Replace one random card in dealer's hand if they haven't stood yet
        // Note: Dealer AI might stand based on pre-shift score. Shift happens regardless.
        // Only shift if dealer hasn't already finished their turn logic (stood/bombed out)
        if (!sabaccDealerStands && sabaccDealerHand.length > 0) {
            const dealerIndexToReplace = Math.floor(Math.random() * sabaccDealerHand.length);
            const oldDealerCard = sabaccDealerHand[dealerIndexToReplace];
            const newDealerCard = sabaccDeck.pop();
             if (newDealerCard) { // Ensure deck isn't empty
                sabaccDealerHand[dealerIndexToReplace] = newDealerCard;
                console.log(`Dealer Shift: ${oldDealerCard.name} (${oldDealerCard.value}) -> ${newDealerCard.name} (${newDealerCard.value})`);
            } else {
                 console.warn("Deck empty during dealer shift!");
            }
        }

        // Short delay to show the shift effect before re-rendering/continuing
        setTimeout(() => {
            renderSabaccHand(sabaccPlayerHand, sabaccPlayerHandArea);
            // Re-render dealer hand, keeping first card hidden if player hasn't stood yet AND dealer hasn't stood/bombed
            renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, !sabaccPlayerStands && !sabaccDealerStands);
            updateSabaccScores();

            // Check for bomb out / Sabacc immediately after shift for player
            if (isPureSabacc(sabaccPlayerScore)) {
                updateSabaccUI("Pure Sabacc after Shift!", true);
                endSabaccRound(true); return;
            }
            if (hasBombedOut(sabaccPlayerScore)) {
                updateSabaccUI("Bombed Out after Shift!", true);
                endSabaccRound(false); return;
            }
            // Re-check dealer score after shift as well, in case they bombed out now
            const postShiftDealerScore = calculateSabaccHandValue(sabaccDealerHand);
             if (hasBombedOut(postShiftDealerScore) && !sabaccDealerStands) { // Only bomb out if they hadn't already finished
                 sabaccDealerStands = true; // Mark as finished
                 renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, false); // Show hand
                 updateSabaccScores(); // Update score display
                 updateSabaccUI("Dealer Bombed Out after Shift!", true);
                 endSabaccRound(true); return; // Player wins
             }
             if (isPureSabacc(postShiftDealerScore) && !sabaccDealerStands) {
                 sabaccDealerStands = true; // Mark as finished
                 renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, false); // Show hand
                 updateSabaccScores(); // Update score display
                 updateSabaccUI("Dealer has Pure Sabacc after Shift!", true);
                 endSabaccRound(false); return; // Dealer wins
             }


            // If player stood before shift, proceed to dealer turn *after* shift resolves
            if (sabaccPlayerStands && !sabaccDealerStands) { // Ensure dealer hasn't already finished
                 dealerTurnSabacc();
            } else if (!sabaccPlayerStands) {
                // Otherwise, it's still player's turn
                updateSabaccUI("Shift complete. Your turn.", false);
            }
            // If both stood or one finished, endSabaccRound will be called by the logic that led here.
        }, 800); // Delay for shift effect
    }


    /**
     * Ends the current Sabacc round and determines the winner.
     * @param {boolean} [playerWon=undefined] - Pre-determined winner (e.g., bomb out, pure sabacc). If undefined, compare scores.
     */
    function endSabaccRound(playerWon = undefined) {
        if (!sabaccGameActive && playerWon === undefined) {
             // Avoid ending the round again if it was already ended by bombout/sabacc check
             // unless a winner was explicitly passed.
             // console.log("Attempted to end round that was already inactive.");
             // return;
        }
        sabaccGameActive = false; // Mark game as inactive for UI updates

        // Reveal dealer's full hand and final score
        renderSabaccHand(sabaccDealerHand, sabaccDealerHandArea, false);
        const finalDealerScore = calculateSabaccHandValue(sabaccDealerHand);
        const finalPlayerScore = calculateSabaccHandValue(sabaccPlayerHand); // Recalculate just in case
         if (sabaccDealerScoreDisplay) sabaccDealerScoreDisplay.textContent = `${finalDealerScore}`;
         if (sabaccPlayerScoreDisplay) sabaccPlayerScoreDisplay.textContent = `${finalPlayerScore}`;
         // Update busted status based on final scores
         if (sabaccPlayerScoreDisplay) sabaccPlayerScoreDisplay.classList.toggle('busted', hasBombedOut(finalPlayerScore));
         if (sabaccDealerScoreDisplay) sabaccDealerScoreDisplay.classList.toggle('busted', hasBombedOut(finalDealerScore));


        let message = "";
        let playerNet = -sabaccCurrentBet; // Start assuming loss of initial bet

        if (playerWon === undefined) {
            // Compare scores if no pre-determined winner/loser
            const playerBombed = hasBombedOut(finalPlayerScore);
            const dealerBombed = hasBombedOut(finalDealerScore);
            const playerSabacc = isPureSabacc(finalPlayerScore);
            const dealerSabacc = isPureSabacc(finalDealerScore);

            if (playerBombed && dealerBombed) {
                message = "Both Bombed Out! It's a Push!";
                playerNet = 0; // Bet returned
            } else if (playerBombed) {
                message = "You Bombed Out! Dealer Wins.";
                playerNet = -sabaccCurrentBet;
            } else if (dealerBombed) {
                message = "Dealer Bombed Out! You Win!";
                playerNet = sabaccCurrentBet; // Win the pot (which was player bet + dealer match)
            } else if (playerSabacc && dealerSabacc) {
                 message = "Both Pure Sabacc! It's a Push!";
                 playerNet = 0;
            } else if (playerSabacc) {
                 message = "Pure Sabacc! You Win!";
                 playerNet = sabaccCurrentBet;
            } else if (dealerSabacc) {
                 message = "Dealer has Pure Sabacc! Dealer Wins.";
                 playerNet = -sabaccCurrentBet;
            } else {
                // Compare scores - closest absolute value to zero wins
                const playerDist = Math.abs(finalPlayerScore - SABACC_TARGET_SCORE);
                const dealerDist = Math.abs(finalDealerScore - SABACC_TARGET_SCORE);

                if (playerDist < dealerDist) {
                    message = `You Win! (${finalPlayerScore} vs ${finalDealerScore})`;
                    playerNet = sabaccCurrentBet;
                } else if (dealerDist < playerDist) {
                    message = `Dealer Wins. (${finalDealerScore} vs ${finalPlayerScore})`;
                    playerNet = -sabaccCurrentBet;
                } else {
                    message = `Push! Same distance from Zero. (${finalPlayerScore} vs ${finalDealerScore})`;
                    playerNet = 0;
                }
            }
        } else if (playerWon) {
            // Player won due to dealer bomb out or player pure sabacc
            message = sabaccStatusDisplay.textContent.includes("Bombed Out") || sabaccStatusDisplay.textContent.includes("Sabacc") ? sabaccStatusDisplay.textContent : "You Win!"; // Keep existing message if relevant
            playerNet = sabaccCurrentBet;
        } else {
            // Player lost due to player bomb out or dealer pure sabacc
            message = sabaccStatusDisplay.textContent.includes("Bombed Out") || sabaccStatusDisplay.textContent.includes("Sabacc") ? sabaccStatusDisplay.textContent : "Dealer Wins."; // Keep existing message if relevant
            playerNet = -sabaccCurrentBet;
        }

        // Update balance based on net result
        if (playerNet > 0) {
            LocalBrokieAPI.updateBalance(sabaccPot); // Player wins the pot (original bet + dealer match)
            LocalBrokieAPI.playSound('win_big'); // Big win sound
            LocalBrokieAPI.addWin('Sabacc', playerNet);
        } else if (playerNet === 0) {
            LocalBrokieAPI.updateBalance(sabaccCurrentBet); // Return player's original bet
            LocalBrokieAPI.playSound('click');
        } else {
            // Bet was already deducted, no balance change needed for loss
            LocalBrokieAPI.playSound('lose');
        }

        updateSabaccUI(message + " Deal again?", true); // Mark game as over for UI
    }

    // Make initSabacc globally available for main.js
    // This ensures it's callable even with the guard block.
    window.initSabacc = initSabacc;

// End of the guard block
} else {
    // Optional: Log a warning if the script tries to load again
    console.warn("Sabacc script already loaded. Skipping re-initialization.");
}
