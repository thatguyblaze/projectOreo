/**
 * Brokie Casino - Horse Race Game Logic (horserace.js)
 *
 * Handles all functionality related to the Horse Racing game.
 * Depends on functions and variables defined in main.js.
 */

// --- Horse Race Specific State & Constants ---
let horseraceActive = false;
let horseraceBet = 0;
let selectedHorseIndex = -1; // Index of the selected horse (0-based)
let raceAnimationId = null; // ID for requestAnimationFrame
let horsePositions = []; // Array to store current pixel position (from right edge) of each horse
let horseElements = []; // Array to store references to horse div elements
let horseLaneElements = []; // Array to store references to lane div elements
const NUM_HORSES = 6; // Number of horses in the race
const HORSE_NAMES = ["Panda", "Quinton", "Blaze", "Matt", "Liqhtu", "Conar"]; // Names for the horses
const HORSERACE_WIN_MULTIPLIER = 8; // Payout for winning horse (adjust as needed)
const HORSE_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#a855f7', '#10b981', '#eab308']; // red, orange, blue, purple, green, yellow
let raceFrameCounter = 0; // Counter for trail generation

// --- DOM Elements (Horse Race Specific) ---
let horseraceBetInput, horseraceSelectionContainer, horseraceTrack;
let horseraceStartButton, horseraceStatus;

/**
 * Initializes the Horse Race game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initHorserace() {
    console.log("Initializing Horse Race...");
    // Get DOM elements
    horseraceBetInput = document.getElementById('horserace-bet');
    horseraceSelectionContainer = document.getElementById('horserace-selection');
    horseraceTrack = document.getElementById('horserace-track');
    horseraceStartButton = document.getElementById('horserace-start-button');
    horseraceStatus = document.getElementById('horserace-status');

    // Check if all essential elements were found
    if (!horseraceBetInput || !horseraceSelectionContainer || !horseraceTrack ||
        !horseraceStartButton || !horseraceStatus) {
        console.error("Horse Race initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-horserace');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Horse Race elements.</p>';
        return; // Stop initialization
    }

    // Create the horse selection UI
    createHorseSelectionUI();

    // Set initial state (doesn't create horses yet, that happens when tab is activated)
    resetHorserace();

    // Add Event Listeners
    horseraceStartButton.addEventListener('click', startHorserace);

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('horserace', horseraceBetInput); // uses main.js

    console.log("Horse Race Initialized.");
}

/**
 * Creates the horse selection buttons UI.
 */
function createHorseSelectionUI() {
    if (!horseraceSelectionContainer) return;
    horseraceSelectionContainer.innerHTML = ''; // Clear previous buttons
    HORSE_NAMES.forEach((name, index) => {
        const button = document.createElement('button');
        button.className = 'horse-select-btn'; // Class defined in style.css
        button.dataset.horseIndex = index;

        // Color indicator span
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'horse-color-indicator'; // Class defined in style.css
        colorIndicator.style.backgroundColor = HORSE_COLORS[index % HORSE_COLORS.length];

        button.appendChild(colorIndicator);
        button.appendChild(document.createTextNode(` ${index + 1}. ${name}`)); // Add space

        button.addEventListener('click', () => {
            if (horseraceActive) return; // Don't allow selection during race
            playSound('click'); // uses main.js
            // Remove selected class from all buttons
            horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            button.classList.add('selected'); // Class defined in style.css
            selectedHorseIndex = index; // Update selected horse state
            if(horseraceStatus) horseraceStatus.textContent = `Selected Horse #${index + 1}: ${name}`;
        });
        horseraceSelectionContainer.appendChild(button);
    });
}

/**
 * Creates the horse elements and lanes within the track.
 * Called by setActiveTab in main.js when the horse race tab becomes active.
 */
function createHorses() {
    if (!horseraceTrack) return;
    horseraceTrack.innerHTML = ''; // Clear previous horses/lanes/finish line
    horseElements = []; // Clear the array
    horseLaneElements = []; // Clear the lane array

    // Check if track is actually visible and has height (important for positioning)
    if (horseraceTrack.clientHeight <= 0) {
        console.warn("Track height not available for horse creation. Will retry on next activation.");
        // Rely on setActiveTab to call it again when visible
        return;
    }

    // Create lanes and horses
    for (let i = 0; i < NUM_HORSES; i++) {
        const lane = document.createElement('div');
        lane.className = 'horse-lane'; // Class defined in style.css

        const horse = document.createElement('div');
        horse.className = 'horse'; // Class defined in style.css
        horse.dataset.horseId = i;
        horse.textContent = '🐎'; // Horse emoji
        horse.style.color = HORSE_COLORS[i % HORSE_COLORS.length]; // Assign color
        horse.style.right = '10px'; // Start position (RIGHT SIDE)

        lane.appendChild(horse);
        horseraceTrack.appendChild(lane);
        horseElements.push(horse); // Store horse reference
        horseLaneElements.push(lane); // Store lane reference
    }

    // Add finish line (on the LEFT side)
    const finishLine = document.createElement('div');
    finishLine.id = 'horserace-finish-line'; // ID used in style.css
    horseraceTrack.appendChild(finishLine);
    console.log("Horse elements created.");
}

/**
 * Resets the horse race game to its initial state (UI and variables).
 */
function resetHorserace() {
    if (raceAnimationId) {
        cancelAnimationFrame(raceAnimationId); // Stop any ongoing race animation
        raceAnimationId = null;
    }
    horseraceActive = false;
    horseraceBet = 0;
    // Don't reset selectedHorseIndex here, allow selection before starting
    // selectedHorseIndex = -1;
    horsePositions = new Array(NUM_HORSES).fill(10); // Reset positions to start (10px from right)
    raceFrameCounter = 0; // Reset trail counter

    // Reset horse elements visually (check if they exist)
    horseElements.forEach((horse, index) => {
        if (horse) {
            horse.style.right = `${horsePositions[index]}px`; // Set initial right style
            horse.classList.remove('animate-pulse'); // Remove winner pulse if applied
        }
    });
    // Remove any existing trails
    if (horseraceTrack) {
        horseraceTrack.querySelectorAll('.horse-trail').forEach(trail => trail.remove());
    }

    // Re-enable controls (check if elements exist)
    if (horseraceStartButton) horseraceStartButton.disabled = false;
    if (horseraceBetInput) horseraceBetInput.disabled = false;
    if (horseraceSelectionContainer) {
        horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.disabled = false); // Enable selection buttons
    }
    // Update status only if no horse is selected yet, otherwise keep selection message
    if (horseraceStatus) {
        if (selectedHorseIndex === -1) {
            horseraceStatus.textContent = 'Place your bet and pick a horse!';
        } else if (HORSE_NAMES[selectedHorseIndex]){
            horseraceStatus.textContent = `Selected Horse #${selectedHorseIndex + 1}: ${HORSE_NAMES[selectedHorseIndex]}. Place bet & start!`;
        } else {
             horseraceStatus.textContent = 'Place your bet and pick a horse!'; // Fallback
        }
    }
}

/**
 * Starts the horse race animation and logic after validating inputs.
 */
function startHorserace() {
    if (horseraceActive) return; // Don't start if already active
    if (!horseraceBetInput || !horseraceStartButton || !horseraceStatus || !horseraceSelectionContainer || !horseraceTrack) return; // Check elements

    const betAmount = parseInt(horseraceBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) { showMessage("Please enter a valid positive bet amount.", 2000); return; } // uses main.js
    if (betAmount > currency) { showMessage("Not enough currency!", 2000); return; } // uses main.js
    if (selectedHorseIndex < 0 || selectedHorseIndex >= NUM_HORSES) { showMessage("Please select a horse to bet on.", 2000); return; } // uses main.js

    // Ensure horses are created if they weren't already (e.g., if tab wasn't visible on load)
    if (horseElements.length === 0) {
        createHorses();
        if (horseElements.length === 0) { // Still couldn't create them
            showMessage("Error initializing race track. Try switching tabs.", 3000); // uses main.js
            return;
        }
    }

    startTone(); // uses main.js
    playSound('race_start'); // uses main.js
    horseraceBet = betAmount;
    currency -= betAmount; // uses main.js
    updateCurrencyDisplay('loss'); // uses main.js

    horseraceActive = true;
    // Disable controls during race
    horseraceStartButton.disabled = true;
    horseraceBetInput.disabled = true;
    horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.disabled = true);
    horseraceStatus.textContent = 'And they\'re off!';

    // Reset positions and visuals before starting animation
    horsePositions = new Array(NUM_HORSES).fill(10); // Reset positions (10px from right)
    horseElements.forEach((horse, i) => {
        if(horse) {
            horse.style.right = `${horsePositions[i]}px`;
            horse.classList.remove('animate-pulse');
        }
    });
    horseraceTrack.querySelectorAll('.horse-trail').forEach(trail => trail.remove()); // Clear old trails
    raceFrameCounter = 0; // Reset frame counter for trails

    const trackWidth = horseraceTrack.clientWidth;
    // Finish line is positioned 20px from left + 5px width = 25px effective position
    const finishLinePos = 25; // Target position (pixels from left edge of track) for finish

    if (trackWidth <= 0) {
        console.error("Cannot start race: Track width is zero.");
        horseraceStatus.textContent = "Error starting race (track size).";
        resetHorserace(); return;
    }

    let startTime = null;

    // --- Race Animation Loop (Right-to-Left) ---
    function raceStep(timestamp) {
        if (!startTime) startTime = timestamp;
        if (!horseraceActive) return; // Stop if game reset externally

        let winner = -1;
        raceFrameCounter++;

        horsePositions = horsePositions.map((pos, i) => {
            if (!horseElements[i]) return pos; // Skip if horse element doesn't exist

            // Calculate current position from the left edge for finish check
            const horseWidth = horseElements[i].offsetWidth || 20; // Get actual or estimate width
            const currentLeftPos = trackWidth - pos - horseWidth;

            if (currentLeftPos <= finishLinePos) { // Already finished
                 if (winner === -1) winner = i; // Declare first finisher
                 return pos; // Stop advancing if finished
            }

            // Random advancement per frame (increase distance from right edge)
            const advancement = Math.random() * 2.5 + 0.5; // Adjust speed/randomness here
            const newPos = pos + advancement;

            // Update horse's style.right
            horseElements[i].style.right = `${newPos}px`;

            // Create trail particle occasionally
            if (raceFrameCounter % 4 === 0 && horseLaneElements[i]) {
                const trail = document.createElement('div');
                trail.className = 'horse-trail'; // Class defined in style.css
                trail.style.backgroundColor = HORSE_COLORS[i % HORSE_COLORS.length];
                // Position trail slightly behind the horse (adjust based on 'right' style)
                trail.style.right = `${newPos - 5}px`; // Position relative to lane
                trail.style.top = '50%'; // Center vertically in lane
                // Apply animation directly (defined in style.css)
                horseLaneElements[i].appendChild(trail);
                // Remove trail after animation ends (matches CSS animation duration)
                setTimeout(() => trail.remove(), 500);
            }
            // Play step sound less frequently
            if (raceFrameCounter % 10 === 0) playSound('race_step'); // uses main.js

            // Check if this horse crossed the finish line NOW
             const newLeftPos = trackWidth - newPos - horseWidth;
             if (newLeftPos <= finishLinePos && winner === -1) {
                 winner = i;
             }

            return newPos; // Return updated right position
        });

        // Check if a winner was determined in this frame
        if (winner !== -1) {
            finishRace(winner); // Finish the race
        } else {
            raceAnimationId = requestAnimationFrame(raceStep); // Continue animation
        }
    }

    raceAnimationId = requestAnimationFrame(raceStep); // Start the first frame
    saveGameState(); // uses main.js
}

/**
 * Finishes the horse race, determines payout, and updates UI.
 * @param {number} winnerIndex - The index of the winning horse.
 */
function finishRace(winnerIndex) {
    if (!horseraceActive) return; // Prevent finishing multiple times
    if (!horseraceStatus || !horseraceStartButton || !horseraceBetInput || !horseraceSelectionContainer) return; // Check elements

    cancelAnimationFrame(raceAnimationId); // Stop animation loop
    raceAnimationId = null;
    horseraceActive = false;

    const winnerName = HORSE_NAMES[winnerIndex] || `Horse ${winnerIndex + 1}`;
    const playerWon = winnerIndex === selectedHorseIndex;

    // Highlight winner
    if(horseElements[winnerIndex]) {
        horseElements[winnerIndex].classList.add('animate-pulse'); // Uses Tailwind pulse
    }

    if (playerWon) {
        const winAmount = horseraceBet * HORSERACE_WIN_MULTIPLIER;
        const profit = winAmount - horseraceBet;
        currency += winAmount; // uses main.js
        totalGain += Math.max(0, profit); // uses main.js
        horseraceStatus.textContent = `Horse #${winnerIndex + 1} (${winnerName}) wins! You won ${formatWin(profit)}!`; // uses main.js
        playSound('race_win'); // uses main.js
        addWinToLeaderboard('Race', profit); // uses main.js
        updateCurrencyDisplay('win'); // uses main.js
    } else {
        totalLoss += horseraceBet; // uses main.js
        horseraceStatus.textContent = `Horse #${winnerIndex + 1} (${winnerName}) wins! You lost ${formatWin(horseraceBet)}.`; // uses main.js
        playSound('lose'); // uses main.js
        updateCurrencyDisplay(); // uses main.js
    }

    // Re-enable controls after a short delay
    setTimeout(() => {
        if (!horseraceActive) { // Only reset if another race hasn't started
             resetHorserace(); // Resetting here re-enables buttons and updates status
        }
    }, 2500); // Longer delay to see winner pulse

    saveGameState(); // uses main.js
}


// Note: The initHorserace() function will be called from main.js
// Ensure main.js includes: if (typeof initHorserace === 'function') initHorserace();
// within its DOMContentLoaded listener.
