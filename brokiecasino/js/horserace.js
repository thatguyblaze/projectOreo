/**
 * Brokie Casino - Horse Race Game Logic (horserace_balanced.js)
 *
 * Handles all functionality related to the Horse Racing game.
 * Incorporates horse attributes for more balanced, less random races.
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
const NUM_HORSES = 6;
const HORSERACE_WIN_MULTIPLIER = 10; // Adjusted payout multiplier
const BASE_SPEED_FACTOR = 1.8; // Base speed multiplier for advancement calculation
// --- Balancing Adjustments (v4 - Increased Randomness & Stamina Impact) ---
const STAMINA_DRAIN_FACTOR = 0.75; // How much stamina affects speed loss over the race (Increased from 0.6)
const CONSISTENCY_FACTOR = 3.5; // How much consistency reduces randomness (higher = less random, but wider swings for low consistency) (Increased from 3.0)
// --- End Adjustments ---

// --- Horse Data with Attributes ---
// Attributes:
// - speed: Base speed potential (higher is faster)
// - stamina: Resistance to slowing down (higher is better)
// - consistency: How reliably the horse performs to its potential (higher is less random variation)
const HORSES = [
    { name: "Panda", color: '#ef4444', attributes: { speed: 1.1, stamina: 0.9, consistency: 0.7 }, statsDisplay: "Fast Starter" },
    { name: "Quinton", color: '#f97316', attributes: { speed: 1.0, stamina: 1.1, consistency: 0.9 }, statsDisplay: "Good Stamina" },
    { name: "Blaze", color: '#3b82f6', attributes: { speed: 1.2, stamina: 0.8, consistency: 0.6 }, statsDisplay: "Very Fast, Tires" },
    { name: "Matt", color: '#a855f7', attributes: { speed: 0.9, stamina: 1.0, consistency: 1.0 }, statsDisplay: "Mr. Consistent" },
    { name: "Liqhtu", color: '#10b981', attributes: { speed: 1.0, stamina: 1.0, consistency: 0.8 }, statsDisplay: "Well Rounded" },
    { name: "Joker", color: '#eab308', attributes: { speed: 1.0, stamina: 0.9, consistency: 0.4 }, statsDisplay: "Wild Card" } // Lower consistency = more random
];

// --- DOM Elements (Horse Race Specific) ---
let horseraceBetInput, horseraceSelectionContainer, horseraceTrack;
let horseraceStartButton, horseraceStatus;
let trackWidth = 0; // Store track width for calculations
const finishLinePos = 25; // Target position (pixels from left edge of track) for finish

/**
 * Initializes the Horse Race game elements and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initHorserace() {
    console.log("Initializing Horse Race (Balanced v4 - Increased Randomness & Stamina Impact)..."); // Log version
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

    // Create the horse selection UI with stats
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
 * Creates the horse selection buttons UI, including stats display.
 */
function createHorseSelectionUI() {
    if (!horseraceSelectionContainer) return;
    horseraceSelectionContainer.innerHTML = ''; // Clear previous buttons

    HORSES.forEach((horse, index) => {
        const button = document.createElement('button');
        button.className = 'horse-select-btn'; // Class defined in style.css
        button.dataset.horseIndex = index;

        // Color indicator span
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'horse-color-indicator'; // Class defined in style.css
        colorIndicator.style.backgroundColor = horse.color;

        // Horse Name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = ` ${index + 1}. ${horse.name} `; // Add space

        // Stats Display Span
        const statsSpan = document.createElement('span');
        statsSpan.className = 'text-xs text-gray-400 ml-1'; // Style for stats text
        statsSpan.textContent = `(${horse.statsDisplay})`;

        button.appendChild(colorIndicator);
        button.appendChild(nameSpan);
        button.appendChild(statsSpan); // Add the stats display

        button.addEventListener('click', () => {
            if (horseraceActive) return; // Don't allow selection during race
            playSound('click'); // uses main.js
            // Remove selected class from all buttons
            horseraceSelectionContainer.querySelectorAll('.horse-select-btn').forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            button.classList.add('selected'); // Class defined in style.css
            selectedHorseIndex = index; // Update selected horse state
            if(horseraceStatus) horseraceStatus.textContent = `Selected Horse #${index + 1}: ${horse.name}. Place bet & start!`;
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

    // Get and store track width - crucial for race logic
    trackWidth = horseraceTrack.clientWidth;

    // Check if track is actually visible and has width
    if (trackWidth <= 0) {
        console.warn("Track width not available for horse creation. Will retry on next activation.");
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
        horse.style.color = HORSES[i].color; // Assign color from HORSES array
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
    console.log("Horse elements created. Track width:", trackWidth);
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
    horsePositions = new Array(NUM_HORSES).fill(10); // Reset positions to start (10px from right)

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
        } else if (HORSES[selectedHorseIndex]){
            horseraceStatus.textContent = `Selected Horse #${selectedHorseIndex + 1}: ${HORSES[selectedHorseIndex].name}. Place bet & start!`;
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

    // Ensure horses are created and track width is known
    if (horseElements.length === 0 || trackWidth <= 0) {
        createHorses(); // Attempt to create horses and get track width
        if (horseElements.length === 0 || trackWidth <= 0) { // Still couldn't create them or get width
            showMessage("Error initializing race track. Try switching tabs or resizing.", 3000); // uses main.js
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
    let raceFrameCounter = 0; // Reset frame counter for trails/sound

    let startTime = null;

    // --- Race Animation Loop (Right-to-Left) ---
    function raceStep(timestamp) {
        if (!startTime) startTime = timestamp;
        if (!horseraceActive) return; // Stop if game reset externally

        let winner = -1;
        raceFrameCounter++;

        horsePositions = horsePositions.map((pos, i) => {
            if (!horseElements[i] || !HORSES[i]) return pos; // Skip if horse element or data doesn't exist

            const horseData = HORSES[i];
            const horseElem = horseElements[i];
            const horseWidth = horseElem.offsetWidth || 20; // Get actual or estimate width
            const currentLeftPos = trackWidth - pos - horseWidth;

            // Check if already finished
            if (currentLeftPos <= finishLinePos) {
                if (winner === -1) winner = i; // Declare first finisher
                return pos; // Stop advancing if finished
            }

            // --- Calculate Advancement based on Attributes ---
            // 1. Base speed from attribute
            let baseAdvancement = horseData.attributes.speed * BASE_SPEED_FACTOR;

            // 2. Randomness based on consistency (less consistent = more random range)
            let randomFactor = (Math.random() - 0.5) * CONSISTENCY_FACTOR * (1 - horseData.attributes.consistency);
            let variedAdvancement = baseAdvancement * (1 + randomFactor);

            // 3. Stamina effect (slows down over race distance) - NON-LINEAR
            let raceProgress = Math.max(0, (pos - 10)) / (trackWidth - finishLinePos - 10); // Approximate progress 0 to 1

            // Calculate drain: Use Math.pow on progress for non-linear effect.
            // Amplify effect based on (1.5 - stamina) - lower stamina = higher multiplier for drain.
            let staminaAttributeFactor = Math.max(0.1, 1.5 - horseData.attributes.stamina); // Ensure positive factor
            // Use progress^1.5 - effect accelerates later in the race
            let drain = Math.pow(raceProgress, 1.5) * STAMINA_DRAIN_FACTOR * staminaAttributeFactor;

            let staminaEffect = 1.0 - drain;

            // Set a floor for the effect to prevent horses stopping completely, but allow significant slowdown.
            staminaEffect = Math.max(0.30, staminaEffect); // Adjusted floor (was 0.35)

            // 4. Final advancement for this frame
            const finalAdvancement = Math.max(0.1, variedAdvancement * staminaEffect); // Ensure minimum movement

            const newPos = pos + finalAdvancement;

            // Update horse's style.right
            horseElem.style.right = `${newPos}px`;

            // Create trail particle occasionally
            if (raceFrameCounter % 5 === 0 && horseLaneElements[i]) {
                const trail = document.createElement('div');
                trail.className = 'horse-trail'; // Class defined in style.css
                trail.style.backgroundColor = horseData.color;
                trail.style.right = `${newPos - 5}px`;
                trail.style.top = '50%';
                horseLaneElements[i].appendChild(trail);
                setTimeout(() => trail.remove(), 500);
            }
            // Play step sound less frequently
            if (raceFrameCounter % 12 === 0) playSound('race_step'); // uses main.js

            // Check if this horse crossed the finish line NOW
            const newLeftPos = trackWidth - newPos - horseWidth;
            if (newLeftPos <= finishLinePos && winner === -1) {
                winner = i;
                horseElem.style.right = `${trackWidth - finishLinePos - horseWidth}px`;
                return trackWidth - finishLinePos - horseWidth;
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

    const winnerName = HORSES[winnerIndex]?.name || `Horse ${winnerIndex + 1}`; // Use optional chaining
    const playerWon = winnerIndex === selectedHorseIndex;

    // Highlight winner
    if(horseElements[winnerIndex]) {
        horseElements[winnerIndex].classList.add('animate-pulse'); // Uses Tailwind pulse
    }

    if (playerWon) {
        const winAmount = horseraceBet * HORSERACE_WIN_MULTIPLIER;
        const profit = winAmount; // Profit is the full win amount since bet was already deducted
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
