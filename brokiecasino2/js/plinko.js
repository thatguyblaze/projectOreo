/**
 * Brokie Casino - Plinko Game Logic (plinko.js)
 *
 * Handles all functionality related to the Plinko game using HTML Canvas.
 * Depends on functions and variables defined in main.js.
 */

// --- Plinko Specific State & Constants ---
let plinkoActive = false; // Is a ball currently dropping?
let plinkoBet = 0;
let plinkoCanvas, plinkoCtx; // Canvas and context
let plinkoBall = null; // Object to hold ball properties { x, y, vx, vy, radius }
let plinkoPegs = []; // Array to hold peg positions [{ x, y, radius }]
let plinkoBuckets = []; // Array to hold bucket properties [{ x, width, multiplier, color }]
let plinkoAnimationId = null; // ID for requestAnimationFrame

const PLINKO_ROWS = 12; // Number of peg rows
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;
const PEG_COLOR = '#9ca3af'; // Gray-400
const BALL_COLOR = '#facc15'; // Yellow-400
const GRAVITY = 0.15;
const BOUNCE_FACTOR = 0.6; // Energy retained on bounce (lower = less bouncy)
const HORIZONTAL_DRIFT = 0.15; // Slight random horizontal push on collision

// Bucket definitions (multipliers and colors) - Adjust as desired
const BUCKET_MULTIPLIERS = [10, 3, 0.5, 0.2, 0.5, 3, 10];
const BUCKET_COLORS = ['#ef4444', '#fb923c', '#a3a3a3', '#6b7280', '#a3a3a3', '#fb923c', '#ef4444']; // Red, Orange, Neutral, Gray, Neutral, Orange, Red

// --- DOM Elements (Plinko Specific) ---
let plinkoBetInput, plinkoDropButton, plinkoStatus;

/**
 * Initializes the Plinko game elements, canvas, and event listeners.
 * Called by main.js on DOMContentLoaded.
 */
function initPlinko() {
    console.log("Initializing Plinko...");
    // Get DOM elements
    plinkoBetInput = document.getElementById('plinko-bet');
    plinkoDropButton = document.getElementById('plinko-drop-button');
    plinkoStatus = document.getElementById('plinko-status');
    plinkoCanvas = document.getElementById('plinko-canvas');

    // Check if all essential elements were found
    if (!plinkoBetInput || !plinkoDropButton || !plinkoStatus || !plinkoCanvas) {
        console.error("Plinko initialization failed: Could not find all required DOM elements.");
        const gameArea = document.getElementById('game-plinko');
        if(gameArea) gameArea.innerHTML = '<p class="text-red-500 text-center">Error loading Plinko elements.</p>';
        return; // Stop initialization
    }

    // Get canvas context
    plinkoCtx = plinkoCanvas.getContext('2d');
    if (!plinkoCtx) {
         console.error("Plinko initialization failed: Could not get canvas context.");
         plinkoCanvas.outerHTML = '<p class="text-red-500 text-center">Canvas not supported or context failed.</p>';
         return;
    }

    // Setup board layout
    setupPlinkoBoard();

    // Initial draw
    drawPlinkoBoard(); // Draw pegs and buckets initially

    // Add Event Listeners
    plinkoDropButton.addEventListener('click', dropPlinkoBall);

    // Add bet adjustment listeners using the factory function from main.js
    addBetAdjustmentListeners('plinko', plinkoBetInput); // uses main.js

    console.log("Plinko Initialized.");
}

/**
 * Calculates and stores the positions of pegs and buckets based on canvas size.
 */
function setupPlinkoBoard() {
    if (!plinkoCanvas) return;
    const canvasWidth = plinkoCanvas.width;
    const canvasHeight = plinkoCanvas.height;
    plinkoPegs = [];
    plinkoBuckets = [];

    const startY = 50; // Top padding for pegs
    const rowSpacing = 30;
    const pegSpacing = 35; // Horizontal spacing

    // Create Pegs
    for (let row = 0; row < PLINKO_ROWS; row++) {
        const numPegsInRow = row + 3; // Start with 3 pegs in the first row
        const totalWidthForRow = (numPegsInRow - 1) * pegSpacing;
        const startX = (canvasWidth - totalWidthForRow) / 2;
        const y = startY + row * rowSpacing;

        for (let col = 0; col < numPegsInRow; col++) {
            const x = startX + col * pegSpacing;
            plinkoPegs.push({ x: x, y: y, radius: PEG_RADIUS });
        }
    }

    // Create Buckets
    const bucketHeight = 30; // Height of the bucket area
    const bucketY = canvasHeight - bucketHeight;
    const bucketWidth = canvasWidth / BUCKET_MULTIPLIERS.length;

    for (let i = 0; i < BUCKET_MULTIPLIERS.length; i++) {
        plinkoBuckets.push({
            x: i * bucketWidth,
            width: bucketWidth,
            multiplier: BUCKET_MULTIPLIERS[i],
            color: BUCKET_COLORS[i] || '#a3a3a3' // Default color
        });
    }
}

/**
 * Draws the Plinko board (pegs and buckets) on the canvas.
 */
function drawPlinkoBoard() {
    if (!plinkoCtx || !plinkoCanvas) return;
    const ctx = plinkoCtx;
    const canvasWidth = plinkoCanvas.width;
    const canvasHeight = plinkoCanvas.height;

    // Clear canvas (redundant if called within animation loop, but good for initial draw)
    // ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Pegs
    ctx.fillStyle = PEG_COLOR;
    plinkoPegs.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Buckets
    const bucketHeight = 30;
    const bucketY = canvasHeight - bucketHeight;
    plinkoBuckets.forEach((bucket, index) => {
        ctx.fillStyle = bucket.color;
        ctx.fillRect(bucket.x, bucketY, bucket.width, bucketHeight);

        // Draw multiplier text
        ctx.fillStyle = '#FFFFFF'; // White text
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucketY + bucketHeight / 2);

        // Draw bucket dividers (optional)
        if (index > 0) {
            ctx.strokeStyle = '#121212'; // Dark divider
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bucket.x, bucketY);
            ctx.lineTo(bucket.x, canvasHeight);
            ctx.stroke();
        }
    });
}

/**
 * Draws the Plinko ball on the canvas.
 */
function drawPlinkoBall() {
    if (!plinkoCtx || !plinkoBall) return;
    const ctx = plinkoCtx;
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(plinkoBall.x, plinkoBall.y, plinkoBall.radius, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Resets the Plinko game state, clearing the ball and enabling the drop button.
 */
function resetPlinko() {
    plinkoActive = false;
    plinkoBall = null; // Remove the ball
    if (plinkoAnimationId) {
        cancelAnimationFrame(plinkoAnimationId);
        plinkoAnimationId = null;
    }
    if (plinkoDropButton) plinkoDropButton.disabled = false;
    // Clear status after a delay maybe? Or keep the last result?
    // if (plinkoStatus) plinkoStatus.textContent = 'Drop the ball!';

    // Redraw board without the ball
    if (plinkoCtx && plinkoCanvas) {
         plinkoCtx.clearRect(0, 0, plinkoCanvas.width, plinkoCanvas.height);
         drawPlinkoBoard();
    }
}

/**
 * Starts the Plinko game by dropping a ball from the top.
 */
function dropPlinkoBall() {
    if (plinkoActive) return; // Don't drop if already active
    if (!plinkoBetInput || !plinkoDropButton || !plinkoStatus || !plinkoCanvas) return; // Check elements

    const betAmount = parseInt(plinkoBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showMessage("Please enter a valid positive bet amount.", 2000); return; // uses main.js
    }
    if (betAmount > currency) { // uses main.js
        showMessage("Not enough currency!", 2000); return; // uses main.js
    }

    startTone(); // uses main.js
    // Consider adding a specific 'plinko_drop' sound
    playSound('click'); // uses main.js (using generic click for now)

    plinkoBet = betAmount;
    currency -= betAmount; // uses main.js
    updateCurrencyDisplay('loss'); // uses main.js
    saveGameState(); // Save state immediately after bet deduction (uses main.js)

    plinkoActive = true;
    plinkoDropButton.disabled = true;
    plinkoStatus.textContent = 'Dropping...';

    // Initial ball state
    plinkoBall = {
        x: plinkoCanvas.width / 2 + (Math.random() - 0.5) * 5, // Start slightly randomized horizontally
        y: 20, // Start above the pegs
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS
    };

    // Start animation loop
    if (plinkoAnimationId) cancelAnimationFrame(plinkoAnimationId); // Clear previous animation if any
    plinkoAnimationId = requestAnimationFrame(animatePlinko);
}

/**
 * The main animation loop for the Plinko ball.
 */
function animatePlinko() {
    if (!plinkoActive || !plinkoCtx || !plinkoCanvas || !plinkoBall) {
        // Stop animation if game became inactive or elements are missing
        if (plinkoAnimationId) cancelAnimationFrame(plinkoAnimationId);
        plinkoAnimationId = null;
        return;
    }
    const ctx = plinkoCtx;
    const canvasWidth = plinkoCanvas.width;
    const canvasHeight = plinkoCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // --- Physics Update ---
    // Apply gravity
    plinkoBall.vy += GRAVITY;

    // Update position
    plinkoBall.x += plinkoBall.vx;
    plinkoBall.y += plinkoBall.vy;

    // --- Collision Detection ---
    let collisionOccurred = false;

    // Peg Collisions
    for (const peg of plinkoPegs) {
        const dx = plinkoBall.x - peg.x;
        const dy = plinkoBall.y - peg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = plinkoBall.radius + peg.radius;

        if (distance < minDist) {
            collisionOccurred = true;
            // Basic collision response:
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Reflect velocity (simplified) - primarily affect vertical bounce
            plinkoBall.vy *= -BOUNCE_FACTOR;

            // Add slight horizontal push based on collision angle and randomness
            plinkoBall.vx += nx * HORIZONTAL_DRIFT * (Math.random() + 0.5);

            // Prevent sticking: Move ball slightly away from peg
            const overlap = minDist - distance;
            plinkoBall.x += nx * overlap * 0.5; // Move slightly along collision normal
            plinkoBall.y += ny * overlap * 0.5;

            playSound('click'); // Play peg hit sound (using generic click for now)
            break; // Handle only one peg collision per frame for simplicity
        }
    }

    // Wall Collisions
    if (plinkoBall.x - plinkoBall.radius < 0) { // Left wall
        plinkoBall.x = plinkoBall.radius;
        plinkoBall.vx *= -BOUNCE_FACTOR;
        collisionOccurred = true;
    } else if (plinkoBall.x + plinkoBall.radius > canvasWidth) { // Right wall
        plinkoBall.x = canvasWidth - plinkoBall.radius;
        plinkoBall.vx *= -BOUNCE_FACTOR;
        collisionOccurred = true;
    }

    // --- Bucket Check ---
    const bucketHeight = 30;
    const bucketY = canvasHeight - bucketHeight;
    if (plinkoBall.y + plinkoBall.radius > bucketY) {
        for (const bucket of plinkoBuckets) {
            if (plinkoBall.x >= bucket.x && plinkoBall.x < bucket.x + bucket.width) {
                // Ball has landed in a bucket!
                handlePlinkoWin(bucket);
                return; // Stop animation
            }
        }
        let closestBucket = plinkoBuckets[0];
        let minDist = Math.abs(plinkoBall.x - (closestBucket.x + closestBucket.width / 2));
        for(let i = 1; i < plinkoBuckets.length; i++) {
            let dist = Math.abs(plinkoBall.x - (plinkoBuckets[i].x + plinkoBuckets[i].width / 2));
            if (dist < minDist) {
                minDist = dist;
                closestBucket = plinkoBuckets[i];
            }
        }
        console.warn("Ball landed outside defined buckets, assigning to closest:", closestBucket);
        handlePlinkoWin(closestBucket);
        return;

    }

    // --- Draw ---
    drawPlinkoBoard(); // Redraw pegs and buckets
    drawPlinkoBall(); // Draw the ball at its new position

    // Request next frame
    plinkoAnimationId = requestAnimationFrame(animatePlinko);
}

/**
 * Handles the win/loss calculation and UI update when the ball lands in a bucket.
 * @param {object} bucket - The bucket object the ball landed in.
 */
function handlePlinkoWin(bucket) {
    if (!plinkoStatus) return; // Check element

    plinkoActive = false; // Game round is over
    cancelAnimationFrame(plinkoAnimationId); // Stop animation
    plinkoAnimationId = null;

    const multiplier = bucket.multiplier;
    const winAmount = Math.floor(plinkoBet * multiplier);
    const profit = winAmount - plinkoBet;

    // Update currency and stats
    currency += winAmount; // uses main.js
    if (profit > 0) {
        totalGain += profit; // uses main.js
        addWinToLeaderboard('Plinko', profit); // uses main.js
        plinkoStatus.textContent = `WIN! Landed in ${multiplier}x! Won ${formatWin(profit)}!`; // uses main.js
        playSound('win_medium'); // uses main.js
        updateCurrencyDisplay('win'); // uses main.js
    } else if (profit < 0) {
        totalLoss += Math.abs(profit); // uses main.js (or totalLoss += plinkoBet)
        plinkoStatus.textContent = `Landed in ${multiplier}x. Lost ${formatWin(Math.abs(profit))}.`; // uses main.js
        playSound('lose'); // uses main.js
        updateCurrencyDisplay(); // uses main.js
    } else { // 1x multiplier or similar where profit is 0
        plinkoStatus.textContent = `Landed in ${multiplier}x. Bet returned.`;
        playSound('click'); // Neutral sound for break-even (uses main.js)
        updateCurrencyDisplay(); // uses main.js
    }

    saveGameState(); // uses main.js

    // Highlight the winning bucket briefly (optional)
    if (plinkoCtx && plinkoCanvas) {
        const originalColor = bucket.color;
        const highlightColor = '#FFFFFF'; // White highlight
        const bucketY = plinkoCanvas.height - 30;
        plinkoCtx.fillStyle = highlightColor;
        plinkoCtx.fillRect(bucket.x, bucketY, bucket.width, 30);
        // Redraw text
        plinkoCtx.fillStyle = '#000000'; // Black text on highlight
        plinkoCtx.font = 'bold 12px Inter, sans-serif';
        plinkoCtx.textAlign = 'center';
        plinkoCtx.textBaseline = 'middle';
        plinkoCtx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucketY + 15);

        // Revert after a delay
        setTimeout(() => {
            if (!plinkoActive && plinkoCtx) { // Check if another game hasn't started
                 plinkoCtx.fillStyle = originalColor;
                 plinkoCtx.fillRect(bucket.x, bucketY, bucket.width, 30);
                 // Redraw text in white
                 plinkoCtx.fillStyle = '#FFFFFF';
                 plinkoCtx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucketY + 15);
                 // Redraw dividers if needed
            }
        }, 800);
    }


    // Re-enable drop button after a delay
    setTimeout(() => {
        if (!plinkoActive && plinkoDropButton) { // Ensure game hasn't restarted
            plinkoDropButton.disabled = false;
            if(plinkoStatus) plinkoStatus.textContent = 'Drop again!';
        }
    }, 1000);

    // Consider calling resetPlinko() here or let the board stay with the last result until next drop?
    // For now, let's leave the board as is, reset happens on next drop or tab switch.
}


// Note: The initPlinko() function will be called from main.js
// Ensure main.js includes: if (typeof initPlinko === 'function') initPlinko();
// within its DOMContentLoaded listener.
