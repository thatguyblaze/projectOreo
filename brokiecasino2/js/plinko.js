/**
 * ==========================================================================
 * Brokie Casino - Plinko Game Logic (plinko.js) - v2 (Multiple Balls)
 *
 * Handles Plinko game logic using HTML Canvas.
 * - Allows multiple balls to be dropped concurrently.
 * - Randomizes ball drop position.
 * - Includes logic to reduce balls getting stuck.
 * - Depends on functions and variables defined in main.js (BrokieAPI).
 * ==========================================================================
 */

// --- Plinko Specific State & Constants ---
let plinkoBalls = []; // Array to hold multiple ball objects
let plinkoCanvas, plinkoCtx; // Canvas and context
let plinkoPegs = []; // Array to hold peg positions [{ x, y, radius }]
let plinkoBuckets = []; // Array to hold bucket properties [{ x, width, multiplier, color }]
let plinkoAnimationId = null; // ID for requestAnimationFrame

const PLINKO_ROWS = 12; // Number of peg rows
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;
const PEG_COLOR = '#9ca3af'; // Gray-400 (Tailwind gray-400)
const BALL_COLOR = '#facc15'; // Yellow-400 (Tailwind yellow-400)
const GRAVITY = 0.15;
const BOUNCE_FACTOR = 0.6; // Energy retained on bounce (lower = less bouncy)
const HORIZONTAL_DRIFT_FACTOR = 0.2; // Increased base horizontal push on collision

// Bucket definitions (multipliers and colors)
const BUCKET_MULTIPLIERS = [10, 3, 0.5, 0.2, 0.5, 3, 10];
// Using Tailwind colors for consistency where possible
const BUCKET_COLORS = ['#ef4444', '#fb923c', '#a3a3a3', '#6b7280', '#a3a3a3', '#fb923c', '#ef4444']; // red-500, orange-400, neutral-400, gray-500, neutral-400, orange-400, red-500

// --- DOM Elements (Plinko Specific) ---
let plinkoBetInput, plinkoDropButton, plinkoStatus;

// --- API Reference ---
let LocalBrokieAPI = null; // Will be set in initPlinko

/**
 * Initializes the Plinko game elements, canvas, and event listeners.
 * Called by main.js on DOMContentLoaded.
 * @param {object} API - The BrokieAPI object from main.js.
 */
function initPlinko(API) {
    console.log("Initializing Plinko...");
    LocalBrokieAPI = API; // Store the API reference

    // Get DOM elements
    plinkoBetInput = document.getElementById('plinko-bet');
    plinkoDropButton = document.getElementById('plinko-drop-button');
    plinkoStatus = document.getElementById('plinko-status');
    plinkoCanvas = document.getElementById('plinko-canvas');

    // Check if all essential elements were found
    if (!plinkoBetInput || !plinkoDropButton || !plinkoStatus || !plinkoCanvas || !LocalBrokieAPI) {
        console.error("Plinko initialization failed: Could not find all required DOM elements or API.");
        const gameArea = document.getElementById('game-plinko');
        if (gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Plinko elements.</p>';
        return; // Stop initialization
    }

    // Get canvas context
    plinkoCtx = plinkoCanvas.getContext('2d');
    if (!plinkoCtx) {
        console.error("Plinko initialization failed: Could not get canvas context.");
        plinkoCanvas.outerHTML = '<p class="text-fluent-danger text-center">Canvas not supported or context failed.</p>';
        return;
    }

    // Setup board layout (pegs and buckets)
    setupPlinkoBoard();

    // Initial draw of the static board elements
    drawPlinkoBoard();

    // Add Event Listeners
    plinkoDropButton.addEventListener('click', dropPlinkoBall);

    // Add bet adjustment listeners using the factory function from main.js
    LocalBrokieAPI.addBetAdjustmentListeners('plinko', plinkoBetInput);

    console.log("Plinko Initialized.");
}

/**
 * Calculates and stores the positions of pegs and buckets based on canvas size.
 */
function setupPlinkoBoard() {
    if (!plinkoCanvas || !plinkoCtx) return;
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
            y: bucketY, // Store y position for clarity
            height: bucketHeight,
            width: bucketWidth,
            multiplier: BUCKET_MULTIPLIERS[i],
            color: BUCKET_COLORS[i] || '#a3a3a3' // Default color
        });
    }
}

/**
 * Draws the static Plinko board elements (pegs and buckets) on the canvas.
 */
function drawPlinkoBoard() {
    if (!plinkoCtx || !plinkoCanvas) return;
    const ctx = plinkoCtx;
    const canvasWidth = plinkoCanvas.width;
    const canvasHeight = plinkoCanvas.height;

    // Draw Pegs
    ctx.fillStyle = PEG_COLOR;
    plinkoPegs.forEach(peg => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Buckets
    plinkoBuckets.forEach((bucket, index) => {
        ctx.fillStyle = bucket.color;
        ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);

        // Draw multiplier text
        ctx.fillStyle = '#FFFFFF'; // White text
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);

        // Draw bucket dividers
        if (index > 0) {
            ctx.strokeStyle = '#1c1c1c'; // Use fluent-bg for divider
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bucket.x, bucket.y);
            ctx.lineTo(bucket.x, canvasHeight);
            ctx.stroke();
        }
    });
}

/**
 * Draws all active Plinko balls on the canvas.
 */
function drawPlinkoBalls() {
    if (!plinkoCtx) return;
    const ctx = plinkoCtx;
    ctx.fillStyle = BALL_COLOR;
    plinkoBalls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Resets the Plinko game state, clearing all balls and stopping the animation.
 * Called on tab switch away from Plinko.
 */
function resetPlinko() {
    plinkoBalls = []; // Clear all active balls
    if (plinkoAnimationId) {
        cancelAnimationFrame(plinkoAnimationId);
        plinkoAnimationId = null;
    }
    // Re-enable drop button if it exists
    if (plinkoDropButton) plinkoDropButton.disabled = false;

    // Clear the canvas and redraw the static board
    if (plinkoCtx && plinkoCanvas) {
        plinkoCtx.clearRect(0, 0, plinkoCanvas.width, plinkoCanvas.height);
        drawPlinkoBoard();
    }
     console.log("Plinko reset.");
}

/**
 * Starts the Plinko game by creating and dropping a new ball.
 * Allows multiple balls to be dropped concurrently.
 */
function dropPlinkoBall() {
    // Check elements and API exist
    if (!plinkoBetInput || !plinkoDropButton || !plinkoStatus || !plinkoCanvas || !plinkoCtx || !LocalBrokieAPI) {
        console.error("Cannot drop ball, Plinko not fully initialized.");
        return;
    }

    const betAmount = parseInt(plinkoBetInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        LocalBrokieAPI.showMessage("Please enter a valid positive bet amount.", 2000); return;
    }
    if (betAmount > LocalBrokieAPI.getBalance()) {
        LocalBrokieAPI.showMessage("Not enough currency!", 2000); return;
    }

    LocalBrokieAPI.startTone();
    LocalBrokieAPI.playSound('plinko_drop'); // Use specific sound

    // Deduct bet for this specific ball
    LocalBrokieAPI.updateBalance(-betAmount); // Update balance immediately
    // No need to flash display here, let win/loss flash later
    LocalBrokieAPI.saveGameState(); // Save state after bet deduction

    // Create the new ball object
    const canvasWidth = plinkoCanvas.width;
    // Random start position within the middle 60%
    const randomX = canvasWidth * 0.2 + canvasWidth * 0.6 * Math.random();
    const newBall = {
        x: randomX,
        y: 20, // Start above the pegs
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        betAmount: betAmount // Store the bet amount with the ball
    };

    // Add the new ball to the array
    plinkoBalls.push(newBall);

    // Start the animation loop if it's not already running
    if (!plinkoAnimationId) {
        console.log("Starting Plinko animation loop.");
        plinkoAnimationId = requestAnimationFrame(animatePlinko);
    }

    // Update status (optional, could get cluttered with many balls)
    // plinkoStatus.textContent = 'Dropping...';
}

/**
 * The main animation loop for updating and drawing Plinko balls.
 */
function animatePlinko() {
    // Check if context exists
    if (!plinkoCtx || !plinkoCanvas) {
        console.error("Canvas context lost, stopping animation.");
        cancelAnimationFrame(plinkoAnimationId);
        plinkoAnimationId = null;
        return;
    }
    const ctx = plinkoCtx;
    const canvasWidth = plinkoCanvas.width;
    const canvasHeight = plinkoCanvas.height;

    // Clear canvas for redraw
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // --- Update and Check Each Ball ---
    // Iterate backwards for safe removal
    for (let i = plinkoBalls.length - 1; i >= 0; i--) {
        const ball = plinkoBalls[i];

        // --- Physics Update ---
        ball.vy += GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // --- Collision Detection ---
        let collisionOccurred = false; // Track collision for this ball this frame

        // Peg Collisions
        for (const peg of plinkoPegs) {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = ball.radius + peg.radius;

            if (distance < minDist) {
                collisionOccurred = true;

                // Normalize collision vector
                const nx = dx / distance;
                const ny = dy / distance;

                // Stronger overlap correction
                const overlap = minDist - distance;
                ball.x += nx * overlap;
                ball.y += ny * overlap;

                // Reflect velocity
                // Calculate dot product of velocity and normal
                const dotProduct = ball.vx * nx + ball.vy * ny;
                // Reflect velocity vector
                ball.vx -= 2 * dotProduct * nx;
                ball.vy -= 2 * dotProduct * ny;

                // Apply bounce factor (reduce energy)
                ball.vx *= BOUNCE_FACTOR;
                ball.vy *= BOUNCE_FACTOR;

                // Add horizontal drift based on collision point
                // Push away from the peg center horizontally, stronger effect
                 ball.vx += nx * HORIZONTAL_DRIFT_FACTOR * (0.8 + Math.random() * 0.4);


                // Anti-stuck: If vertical velocity is very low, give a nudge
                if (Math.abs(ball.vy) < 0.1 && ball.y < canvasHeight - plinkoBuckets[0].height - 20) {
                   ball.vy += 0.25; // Small downward nudge
                   ball.vx += (Math.random() - 0.5) * 0.2; // Tiny horizontal nudge
                }

                // Play sound only once per collision check cycle for this ball
                if (LocalBrokieAPI) LocalBrokieAPI.playSound('plinko_peg_hit');
                break; // Handle only one peg collision per ball per frame
            }
        }

        // Wall Collisions
        if (ball.x - ball.radius < 0) { // Left wall
            ball.x = ball.radius;
            ball.vx *= -BOUNCE_FACTOR;
            collisionOccurred = true;
        } else if (ball.x + ball.radius > canvasWidth) { // Right wall
            ball.x = canvasWidth - ball.radius;
            ball.vx *= -BOUNCE_FACTOR;
            collisionOccurred = true;
        }

        // --- Bucket Check ---
        const bucketTopY = canvasHeight - plinkoBuckets[0].height;
        if (ball.y + ball.radius > bucketTopY) {
            let landedInBucket = false;
            for (const bucket of plinkoBuckets) {
                if (ball.x >= bucket.x && ball.x < bucket.x + bucket.width) {
                    // Ball has landed in this bucket!
                    handlePlinkoWin(bucket, ball.betAmount); // Pass bet amount
                    plinkoBalls.splice(i, 1); // Remove this ball from the array
                    landedInBucket = true;
                    break; // Stop checking buckets for this ball
                }
            }
            // If ball somehow missed buckets but is below top edge (e.g., lands on divider)
            // Assign to nearest bucket or handle as loss? Let's assign to nearest for now.
            if (!landedInBucket && ball.y > bucketTopY + 5) { // Give a little leeway
                 console.warn("Ball landed outside defined buckets, assigning to closest.");
                 let closestBucket = plinkoBuckets[0];
                 let minDist = Math.abs(ball.x - (closestBucket.x + closestBucket.width / 2));
                 for(let j = 1; j < plinkoBuckets.length; j++) {
                     let dist = Math.abs(ball.x - (plinkoBuckets[j].x + plinkoBuckets[j].width / 2));
                     if (dist < minDist) {
                         minDist = dist;
                         closestBucket = plinkoBuckets[j];
                     }
                 }
                 handlePlinkoWin(closestBucket, ball.betAmount);
                 plinkoBalls.splice(i, 1); // Remove this ball
            }
        }
    } // End of loop through balls

    // --- Draw ---
    drawPlinkoBoard(); // Redraw static elements (pegs, buckets)
    drawPlinkoBalls(); // Draw all remaining balls

    // --- Continue or Stop Animation ---
    if (plinkoBalls.length > 0) {
        // If there are still balls falling, request the next frame
        plinkoAnimationId = requestAnimationFrame(animatePlinko);
    } else {
        // If no balls are left, stop the animation loop
        console.log("Stopping Plinko animation loop.");
        cancelAnimationFrame(plinkoAnimationId);
        plinkoAnimationId = null;
        // Re-enable drop button now that all balls are finished
        if (plinkoDropButton) plinkoDropButton.disabled = false;
        if (plinkoStatus) plinkoStatus.textContent = 'Drop again!';
    }
}

/**
 * Handles the win/loss calculation and UI update when a ball lands in a bucket.
 * @param {object} bucket - The bucket object the ball landed in.
 * @param {number} betAmount - The bet amount associated with the landed ball.
 */
function handlePlinkoWin(bucket, betAmount) {
    if (!plinkoStatus || !LocalBrokieAPI) return; // Check elements & API

    const multiplier = bucket.multiplier;
    const winAmount = Math.floor(betAmount * multiplier); // Use ball's specific bet amount
    const profit = winAmount; // We already deducted the bet, so winAmount is the profit/loss relative to 0

    // Update currency and stats
    LocalBrokieAPI.updateBalance(winAmount); // Add the calculated win amount

    // Determine sound and status message based on multiplier
    let winSound = 'click'; // Default neutral sound
    let statusText = `Landed in ${multiplier}x. `;
    if (multiplier > 1) {
        winSound = 'plinko_win_high'; // High win sound
        statusText += `Won ${LocalBrokieAPI.formatWin(winAmount)}!`;
        LocalBrokieAPI.addWin('Plinko', winAmount); // Add win to leaderboard
    } else if (multiplier < 1 && multiplier > 0) {
         winSound = 'plinko_win_low'; // Low win sound
         statusText += `Returned ${LocalBrokieAPI.formatWin(winAmount)}.`;
    } else if (multiplier <= 0) { // Loss or very low return treated as loss sound-wise
         winSound = 'lose';
         statusText += `Returned ${LocalBrokieAPI.formatWin(winAmount)}.`; // Or "Lost bet." if multiplier is 0
    } else { // multiplier == 1
         statusText += `Bet returned.`;
    }

    LocalBrokieAPI.playSound(winSound);
    // Display status temporarily - might get overwritten quickly by other balls
    // Consider a different way to show results for multiple balls (e.g., a scrolling log)
    plinkoStatus.textContent = statusText;

    // Flash currency display based on profit (winAmount > betAmount, winAmount < betAmount, etc.)
    // Since bet was already deducted, winAmount represents the return.
    // Profit is winAmount. We flash green if winAmount > 0, red if winAmount = 0? Or based on multiplier?
    // Let's flash green if multiplier > 1, red if multiplier < 1, neutral otherwise.
    if (multiplier > 1) {
        LocalBrokieAPI.updateCurrencyDisplay('win'); // Flash green
    } else if (multiplier < 1) {
         LocalBrokieAPI.updateCurrencyDisplay('loss'); // Flash red
    } else {
         LocalBrokieAPI.updateCurrencyDisplay(); // No flash
    }


    // Highlight the winning bucket briefly
    highlightBucket(bucket);

    // No need to re-enable drop button here, handled when animation loop stops
}

/**
 * Briefly highlights a specific bucket.
 * @param {object} bucket - The bucket object to highlight.
 */
function highlightBucket(bucket) {
     if (!plinkoCtx || !plinkoCanvas) return;
     const ctx = plinkoCtx;
     const originalColor = bucket.color;
     const highlightColor = '#FFFFFF'; // White highlight

     // Draw highlight
     ctx.fillStyle = highlightColor;
     ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
     // Redraw text
     ctx.fillStyle = '#000000'; // Black text on highlight
     ctx.font = 'bold 12px Inter, sans-serif';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);

     // Revert after a delay
     setTimeout(() => {
         // Check context still exists and redraw original bucket color + text
         if (plinkoCtx) {
              ctx.fillStyle = originalColor;
              ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
              // Redraw text in white
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 12px Inter, sans-serif'; // Ensure font is reset too
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);
              // Redraw divider if needed (might be simpler to just redraw whole board)
         }
     }, 500); // Highlight duration
}


// Make sure initPlinko is available globally if called directly by main.js
// This is handled by the guard block at the top now.
