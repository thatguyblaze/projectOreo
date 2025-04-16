/**
 * ==========================================================================
 * Brokie Casino - Plinko Game Logic (plinko.js) - v2.2 (Fix saveGameState Call)
 *
 * Handles Plinko game logic using HTML Canvas.
 * - Removed incorrect call to saveGameState (already handled by updateBalance).
 * - Added guard against multiple script executions/declarations.
 * - Allows multiple balls to be dropped concurrently.
 * - Randomizes ball drop position.
 * - Includes logic to reduce balls getting stuck.
 * - Depends on functions and variables defined in main.js (BrokieAPI).
 * ==========================================================================
 */

// Guard to prevent redefining if script runs twice
if (typeof initPlinko === 'undefined') {

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
        console.log("Initializing Plinko (Guarded)..."); // Log guarded init
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
        // Ensure button exists before adding listener
        if (plinkoDropButton) {
            plinkoDropButton.addEventListener('click', dropPlinkoBall);
        } else {
            console.error("Plinko drop button not found for event listener.");
        }


        // Add bet adjustment listeners using the factory function from main.js
        // Ensure API and function exist
        if (LocalBrokieAPI && typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
             LocalBrokieAPI.addBetAdjustmentListeners('plinko', plinkoBetInput);
        } else {
             console.error("BrokieAPI.addBetAdjustmentListeners not found in plinko.js init");
        }


        console.log("Plinko Initialized (Guarded).");
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
        // Validate bet amount
        if (isNaN(betAmount) || betAmount <= 0) {
            LocalBrokieAPI.showMessage("Please enter a valid positive bet amount.", 2000); return;
        }
        // Validate balance
        if (betAmount > LocalBrokieAPI.getBalance()) {
            LocalBrokieAPI.showMessage("Not enough currency!", 2000); return;
        }

        // Ensure Tone is started and play sound
        LocalBrokieAPI.startTone();
        LocalBrokieAPI.playSound('plinko_drop'); // Use specific sound

        // Deduct bet for this specific ball
        LocalBrokieAPI.updateBalance(-betAmount); // Update balance immediately
        // ** REMOVED LocalBrokieAPI.saveGameState(); - It's called within updateBalance **

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
    }

    /**
     * The main animation loop for updating and drawing Plinko balls.
     */
    function animatePlinko() {
        // Check if context exists
        if (!plinkoCtx || !plinkoCanvas) {
            console.error("Canvas context lost, stopping animation.");
            if (plinkoAnimationId) cancelAnimationFrame(plinkoAnimationId); // Ensure cancellation
            plinkoAnimationId = null;
            return;
        }
        const ctx = plinkoCtx;
        const canvasWidth = plinkoCanvas.width;
        const canvasHeight = plinkoCanvas.height;

        // Clear canvas for redraw
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // --- Update and Check Each Ball ---
        // Iterate backwards for safe removal when ball lands
        for (let i = plinkoBalls.length - 1; i >= 0; i--) {
            const ball = plinkoBalls[i];

            // --- Physics Update ---
            ball.vy += GRAVITY;
            ball.x += ball.vx;
            ball.y += ball.vy;

            // --- Collision Detection ---
            let collisionOccurredThisFrame = false; // Track collision for this ball this frame

            // Peg Collisions
            for (const peg of plinkoPegs) {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = ball.radius + peg.radius;

                if (distance < minDist) {
                    collisionOccurredThisFrame = true;

                    // Normalize collision vector
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Stronger overlap correction (push ball fully out of peg)
                    const overlap = minDist - distance;
                    ball.x += nx * overlap;
                    ball.y += ny * overlap;

                    // Reflect velocity based on collision normal
                    const dotProduct = ball.vx * nx + ball.vy * ny;
                    ball.vx -= 2 * dotProduct * nx;
                    ball.vy -= 2 * dotProduct * ny;

                    // Apply bounce factor (reduce energy)
                    ball.vx *= BOUNCE_FACTOR;
                    ball.vy *= BOUNCE_FACTOR;

                    // Add horizontal drift based on collision point normal
                    ball.vx += nx * HORIZONTAL_DRIFT_FACTOR * (0.8 + Math.random() * 0.4);

                    // Anti-stuck: If vertical velocity is very low after collision, give a nudge
                    if (Math.abs(ball.vy) < 0.1 && ball.y < canvasHeight - plinkoBuckets[0].height - 20) {
                       ball.vy += 0.25; // Small downward nudge
                       ball.vx += (Math.random() - 0.5) * 0.2; // Tiny horizontal nudge
                    }

                    // Play sound only once per collision check cycle for this ball
                    if (LocalBrokieAPI) LocalBrokieAPI.playSound('plinko_peg_hit');
                    break; // Handle only one peg collision per ball per frame for simplicity
                }
            }

            // Wall Collisions
            if (ball.x - ball.radius < 0) { // Left wall
                ball.x = ball.radius; // Correct position
                ball.vx *= -BOUNCE_FACTOR; // Reflect and dampen
                collisionOccurredThisFrame = true;
            } else if (ball.x + ball.radius > canvasWidth) { // Right wall
                ball.x = canvasWidth - ball.radius; // Correct position
                ball.vx *= -BOUNCE_FACTOR; // Reflect and dampen
                collisionOccurredThisFrame = true;
            }

            // --- Bucket Check ---
            const bucketTopY = canvasHeight - plinkoBuckets[0].height;
            // Check if the bottom of the ball is below the top of the buckets
            if (ball.y + ball.radius > bucketTopY) {
                let landedInBucket = false;
                for (const bucket of plinkoBuckets) {
                    // Check if the center of the ball is horizontally within the bucket
                    if (ball.x >= bucket.x && ball.x < bucket.x + bucket.width) {
                        // Ball has landed in this bucket!
                        handlePlinkoWin(bucket, ball.betAmount); // Pass bet amount
                        plinkoBalls.splice(i, 1); // Remove this ball from the array
                        landedInBucket = true;
                        break; // Stop checking buckets for this ball
                    }
                }
                // If ball is well below bucket top but didn't land (e.g., on divider), assign to nearest
                if (!landedInBucket && ball.y > bucketTopY + ball.radius + 5) { // Check if significantly below
                     console.warn("Ball missed buckets, assigning to closest.");
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

        // Update currency (winAmount is the total return including original bet if multiplier >= 1)
        LocalBrokieAPI.updateBalance(winAmount);

        // Determine sound and status message based on multiplier
        let winSound = 'click'; // Default neutral sound
        let statusText = `Ball landed in ${multiplier}x. `;
        const profit = winAmount - betAmount; // Calculate net profit/loss

        if (profit > 0) {
            winSound = multiplier >= 3 ? 'plinko_win_high' : 'plinko_win_low'; // Different sounds for high/low wins
            statusText += `Won ${LocalBrokieAPI.formatWin(profit)}!`;
            LocalBrokieAPI.addWin('Plinko', profit); // Add net win to leaderboard
        } else if (profit < 0) {
             winSound = 'lose';
             statusText += `Lost ${LocalBrokieAPI.formatWin(Math.abs(profit))}.`;
        } else { // profit === 0
             statusText += `Bet returned.`;
        }

        LocalBrokieAPI.playSound(winSound);
        // Display status temporarily - Note: might be overwritten quickly by other balls
        // plinkoStatus.textContent = statusText; // Maybe remove this for less clutter?
        // Show message notification for each ball result - more reliable for multiple balls
        LocalBrokieAPI.showMessage(statusText, 2500);


        // Flash currency display based on profit
        if (profit > 0) {
            LocalBrokieAPI.updateCurrencyDisplay('win'); // Flash green
        } else if (profit < 0) {
             LocalBrokieAPI.updateCurrencyDisplay('loss'); // Flash red
        } else {
             LocalBrokieAPI.updateCurrencyDisplay(); // No flash
        }

        // Highlight the winning bucket briefly
        highlightBucket(bucket);
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
             // Important: Check if other balls haven't landed and re-highlighted in the meantime
             // A simple redraw might be sufficient if timing isn't critical
             if (plinkoCtx) {
                  ctx.fillStyle = originalColor;
                  ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
                  // Redraw text in white
                  ctx.fillStyle = '#FFFFFF';
                  ctx.font = 'bold 12px Inter, sans-serif'; // Ensure font is reset too
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);
                  // Redraw divider if needed (might be simpler to just redraw whole board in main loop)
             }
         }, 500); // Highlight duration
    }

    // Make initPlinko globally available for main.js
    // This ensures it's callable even with the guard block.
    window.initPlinko = initPlinko;

// End of the guard block
} else {
    // Optional: Log a warning if the script tries to load again
    console.warn("Plinko script already loaded. Skipping re-initialization.");
}
