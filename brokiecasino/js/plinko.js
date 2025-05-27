/**
 * ==========================================================================
 * Brokie Casino - Plinko Game Logic (plinko.js) - v2.5.1 (House Edge Mod)
 *
 * Handles Plinko game logic using HTML Canvas.
 * - Enhanced Peg design (gradient/3D look).
 * - Added Ball trail effect.
 * - Enhanced Bucket Divider appearance.
 * - Added Drop Zone visual hint.
 * - Adjusted bucket multipliers for better balance.
 * - Increased ball lifetime to 20 seconds.
 * - Enhanced anti-stuck logic (stronger nudge, low-velocity jiggle).
 * - Improved ball visual appearance with gradient.
 * - Enhanced bucket highlight effect.
 * - Depends on functions and variables defined in main.js (BrokieAPI).
 *
 * HOUSE EDGE MODIFICATION:
 * - The horizontal drift when a ball hits a peg is subtly biased
 * to favor balls moving towards the center of the board (lower multipliers)
 * over many plays. This is achieved by adjusting the random component
 * of the drift strength based on the ball's current horizontal position
 * relative to the center of the canvas.
 * ==========================================================================
 */

// Guard to prevent redefining if script runs twice
if (typeof initPlinko === 'undefined') {

    // --- Plinko Specific State & Constants ---
    let plinkoBalls = []; // Array to hold multiple ball objects { x, y, vx, vy, radius, betAmount, startTime, stuckFrames, history[] }
    let plinkoCanvas, plinkoCtx; // Canvas and context
    let plinkoPegs = []; // Array to hold peg positions [{ x, y, radius }]
    let plinkoBuckets = []; // Array to hold bucket properties [{ x, width, multiplier, color }]
    let plinkoAnimationId = null; // ID for requestAnimationFrame

    const PLINKO_ROWS = 12;
    const PEG_RADIUS = 5;
    const BALL_RADIUS = 7;
    const BALL_HISTORY_LENGTH = 5;
    const GRAVITY = 0.15;
    const BOUNCE_FACTOR = 0.6;
    const HORIZONTAL_DRIFT_FACTOR = 0.2; // Main factor for horizontal drift strength
    const BALL_LIFETIME_MS = 20000;
    const MIN_VELOCITY_THRESHOLD = 0.05;
    const STUCK_FRAMES_THRESHOLD = 60;

    // Bucket definitions (multipliers and colors)
    const BUCKET_MULTIPLIERS = [5, 2, 0.5, 0.1, 0.5, 2, 5]; // Central buckets have lower multipliers
    const BUCKET_COLORS = ['#ef4444', '#fb923c', '#a3a3a3', '#6b7280', '#a3a3a3', '#fb923c', '#ef4444'];

    // --- DOM Elements (Plinko Specific) ---
    let plinkoBetInput, plinkoDropButton, plinkoStatus;

    // --- API Reference ---
    let LocalBrokieAPI = null;

    /**
     * Initializes the Plinko game elements, canvas, and event listeners.
     * @param {object} API - The BrokieAPI object from main.js.
     */
    function initPlinko(API) {
        console.log("Initializing Plinko (v2.5.1 Guarded - House Edge Mod)...");
        LocalBrokieAPI = API;

        plinkoBetInput = document.getElementById('plinko-bet');
        plinkoDropButton = document.getElementById('plinko-drop-button');
        plinkoStatus = document.getElementById('plinko-status');
        plinkoCanvas = document.getElementById('plinko-canvas');

        if (!plinkoBetInput || !plinkoDropButton || !plinkoStatus || !plinkoCanvas || !LocalBrokieAPI) {
            console.error("Plinko initialization failed: Could not find all required DOM elements or API.");
            const gameArea = document.getElementById('game-plinko');
            if (gameArea) gameArea.innerHTML = '<p class="text-fluent-danger text-center">Error loading Plinko elements.</p>';
            return;
        }

        plinkoCtx = plinkoCanvas.getContext('2d');
        if (!plinkoCtx) {
            console.error("Plinko initialization failed: Could not get canvas context.");
            plinkoCanvas.outerHTML = '<p class="text-fluent-danger text-center">Canvas not supported or context failed.</p>';
            return;
        }

        setupPlinkoBoard();
        drawPlinkoBoard(); // Initial draw

        if (plinkoDropButton) {
            plinkoDropButton.addEventListener('click', dropPlinkoBall);
        } else {
            console.error("Plinko drop button not found for event listener.");
        }

        if (LocalBrokieAPI && typeof LocalBrokieAPI.addBetAdjustmentListeners === 'function') {
             LocalBrokieAPI.addBetAdjustmentListeners('plinko', plinkoBetInput);
        } else {
             console.error("BrokieAPI.addBetAdjustmentListeners not found in plinko.js init");
        }

        console.log("Plinko Initialized (v2.5.1 Guarded - House Edge Mod).");
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

        const startY = 60;
        const rowSpacing = 30;
        const pegSpacing = 35;

        // Create Pegs
        for (let row = 0; row < PLINKO_ROWS; row++) {
            const numPegsInRow = row + 3;
            const totalWidthForRow = (numPegsInRow - 1) * pegSpacing;
            const startX = (canvasWidth - totalWidthForRow) / 2;
            const y = startY + row * rowSpacing;

            for (let col = 0; col < numPegsInRow; col++) {
                const x = startX + col * pegSpacing;
                plinkoPegs.push({ x: x, y: y, radius: PEG_RADIUS });
            }
        }

        // Create Buckets
        const bucketHeight = 30;
        const bucketY = canvasHeight - bucketHeight;
        const bucketWidth = canvasWidth / BUCKET_MULTIPLIERS.length;

        for (let i = 0; i < BUCKET_MULTIPLIERS.length; i++) {
            plinkoBuckets.push({
                x: i * bucketWidth,
                y: bucketY,
                height: bucketHeight,
                width: bucketWidth,
                multiplier: BUCKET_MULTIPLIERS[i],
                color: BUCKET_COLORS[i] || '#a3a3a3'
            });
        }
    }

    /**
     * Draws the static Plinko board elements (pegs, buckets, drop zone) on the canvas.
     */
    function drawPlinkoBoard() {
        if (!plinkoCtx || !plinkoCanvas) return;
        const ctx = plinkoCtx;
        const canvasWidth = plinkoCanvas.width;
        const canvasHeight = plinkoCanvas.height;

        // Draw Drop Zone Hint
        const dropZoneY = 40;
        ctx.fillStyle = 'rgba(74, 74, 74, 0.1)';
        ctx.fillRect(0, 0, canvasWidth, dropZoneY);
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, dropZoneY);
        ctx.lineTo(canvasWidth, dropZoneY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Pegs with Gradient
        plinkoPegs.forEach(peg => {
            const pegGradient = ctx.createRadialGradient(
                peg.x - peg.radius * 0.3, peg.y - peg.radius * 0.3, peg.radius * 0.1,
                peg.x, peg.y, peg.radius
            );
            pegGradient.addColorStop(0, '#e5e7eb');
            pegGradient.addColorStop(0.8, '#9ca3af');
            pegGradient.addColorStop(1, '#6b7280');

            ctx.fillStyle = pegGradient;
            ctx.beginPath();
            ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Buckets
        plinkoBuckets.forEach((bucket, index) => {
            ctx.fillStyle = bucket.color;
            ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);

            if (index > 0) {
                const dividerX = bucket.x;
                const dividerTopY = bucket.y;
                const dividerBottomY = canvasHeight;

                ctx.strokeStyle = '#1c1c1c';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(dividerX, dividerTopY);
                ctx.lineTo(dividerX, dividerBottomY);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(74, 74, 74, 0.6)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(dividerX + 1, dividerTopY);
                ctx.lineTo(dividerX + 1, dividerBottomY);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(dividerX - 1, dividerTopY);
                ctx.lineTo(dividerX - 1, dividerBottomY);
                ctx.stroke();
            }
        });
        ctx.lineWidth = 1;
    }

    /**
     * Draws all active Plinko balls on the canvas with a gradient and trail.
     */
    function drawPlinkoBalls() {
        if (!plinkoCtx) return;
        const ctx = plinkoCtx;

        plinkoBalls.forEach(ball => {
            // Draw Trail
            if (ball.history && ball.history.length > 0) {
                ball.history.forEach((pos, index) => {
                    const alpha = 0.5 * (index / ball.history.length);
                    const radius = ball.radius * (0.5 + 0.5 * (index / ball.history.length));

                    const trailGradient = ctx.createRadialGradient(
                        pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.1,
                        pos.x, pos.y, radius
                    );
                    trailGradient.addColorStop(0, `rgba(255, 255, 204, ${alpha * 0.8})`);
                    trailGradient.addColorStop(0.7, `rgba(250, 204, 21, ${alpha})`);
                    trailGradient.addColorStop(1, `rgba(234, 179, 8, ${alpha * 0.7})`);

                    ctx.fillStyle = trailGradient;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // Draw Main Ball
            const gradient = ctx.createRadialGradient(
                ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.1,
                ball.x, ball.y, ball.radius
            );
            gradient.addColorStop(0, '#ffffcc');
            gradient.addColorStop(0.7, '#facc15');
            gradient.addColorStop(1, '#eab308');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * Resets the Plinko game state.
     */
    function resetPlinko() {
        plinkoBalls = [];
        if (plinkoAnimationId) {
            cancelAnimationFrame(plinkoAnimationId);
            plinkoAnimationId = null;
        }
        if (plinkoDropButton) plinkoDropButton.disabled = false;
        if (plinkoCtx && plinkoCanvas) {
            plinkoCtx.clearRect(0, 0, plinkoCanvas.width, plinkoCanvas.height);
            drawPlinkoBoard();
        }
        console.log("Plinko reset.");
    }

    /**
     * Starts the Plinko game by creating and dropping a new ball.
     */
    function dropPlinkoBall() {
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
        LocalBrokieAPI.playSound('plinko_drop');
        LocalBrokieAPI.updateBalance(-betAmount);

        const canvasWidth = plinkoCanvas.width;
        const randomX = canvasWidth * 0.2 + canvasWidth * 0.6 * Math.random(); // Standard random drop
        const newBall = {
            x: randomX,
            y: 20,
            vx: 0,
            vy: 0,
            radius: BALL_RADIUS,
            betAmount: betAmount,
            startTime: Date.now(),
            stuckFrames: 0,
            history: []
        };
        plinkoBalls.push(newBall);

        if (!plinkoAnimationId) {
            console.log("Starting Plinko animation loop.");
            plinkoAnimationId = requestAnimationFrame(animatePlinko);
        }
    }

    /**
     * The main animation loop for updating and drawing Plinko balls.
     */
    function animatePlinko() {
        if (!plinkoCtx || !plinkoCanvas) {
            console.error("Canvas context lost, stopping animation.");
            if (plinkoAnimationId) cancelAnimationFrame(plinkoAnimationId);
            plinkoAnimationId = null;
            return;
        }
        const ctx = plinkoCtx;
        const canvasWidth = plinkoCanvas.width;
        const canvasHeight = plinkoCanvas.height;
        const currentTime = Date.now();

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        for (let i = plinkoBalls.length - 1; i >= 0; i--) {
            const ball = plinkoBalls[i];

            ball.history.push({ x: ball.x, y: ball.y });
            if (ball.history.length > BALL_HISTORY_LENGTH) {
                ball.history.shift();
            }

            if (currentTime - ball.startTime > BALL_LIFETIME_MS) {
                console.log("Ball timed out and removed.");
                plinkoBalls.splice(i, 1);
                continue;
            }

            ball.vy += GRAVITY;
            ball.x += ball.vx;
            ball.y += ball.vy;

            let collisionOccurredThisFrame = false;

            // Peg Collisions
            for (const peg of plinkoPegs) {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = ball.radius + peg.radius;

                if (distance < minDist) {
                    collisionOccurredThisFrame = true;
                    const nx = dx / distance; // Normalized collision vector x
                    const ny = dy / distance; // Normalized collision vector y
                    const overlap = minDist - distance;
                    ball.x += nx * overlap;
                    ball.y += ny * overlap;
                    const dotProduct = ball.vx * nx + ball.vy * ny;
                    ball.vx -= 2 * dotProduct * nx;
                    ball.vy -= 2 * dotProduct * ny;
                    ball.vx *= BOUNCE_FACTOR;
                    ball.vy *= BOUNCE_FACTOR;

                    // --- RIGGED HORIZONTAL DRIFT (HOUSE EDGE) ---
                    // The goal is to subtly nudge the ball towards the center of the board
                    // where lower multipliers are typically located.

                    // Original M factor random part: Math.random() * 0.4, gives [0, 0.4)
                    // Original M factor: 0.8 + (Math.random() * 0.4), gives [0.8, 1.2)
                    const M_BASE_RANDOM_PART = Math.random() * 0.4;
                    let M_base = 0.8 + M_BASE_RANDOM_PART;

                    // BIAS_EFFECT_STRENGTH determines how much the M factor is shifted.
                    // A small value (e.g., 0.05 to 0.1) makes the bias less noticeable.
                    // This value is an absolute shift applied to M_base.
                    // Max range of M_base is 0.4 (from 0.8 to 1.2).
                    // A BIAS_EFFECT_STRENGTH of 0.075 is about 18.75% of this random range.
                    const BIAS_EFFECT_STRENGTH = 0.075;

                    let M_final = M_base; // Default to unbiased M factor
                    const canvasCenter = plinkoCanvas.width / 2;
                    // Don't apply bias if the ball is already very close to the center line
                    const centerBiasThreshold = PEG_RADIUS * 3; // A small zone around the center

                    if (ball.x < canvasCenter - centerBiasThreshold) {
                        // Ball is to the LEFT of center, encourage movement to the RIGHT.
                        if (nx > 0) {
                            // Collision's natural horizontal push (via nx) is to the RIGHT. Enhance it.
                            M_final = Math.min(1.2, M_base + BIAS_EFFECT_STRENGTH);
                        } else if (nx < 0) {
                            // Collision's natural horizontal push (via nx) is to the LEFT. Weaken it.
                            M_final = Math.max(0.8, M_base - BIAS_EFFECT_STRENGTH);
                        }
                    } else if (ball.x > canvasCenter + centerBiasThreshold) {
                        // Ball is to the RIGHT of center, encourage movement to the LEFT.
                        if (nx < 0) {
                            // Collision's natural horizontal push (via nx) is to the LEFT. Enhance it.
                            M_final = Math.min(1.2, M_base + BIAS_EFFECT_STRENGTH);
                        } else if (nx > 0) {
                            // Collision's natural horizontal push (via nx) is to the RIGHT. Weaken it.
                            M_final = Math.max(0.8, M_base - BIAS_EFFECT_STRENGTH);
                        }
                    }
                    // If ball is within `centerBiasThreshold` of `canvasCenter`, M_final remains M_base (no bias).

                    ball.vx += nx * HORIZONTAL_DRIFT_FACTOR * M_final;
                    // --- END RIGGED HORIZONTAL DRIFT ---

                    // Original non-rigged line:
                    // ball.vx += nx * HORIZONTAL_DRIFT_FACTOR * (0.8 + Math.random() * 0.4);

                    // Small vertical boost if ball gets too slow on a peg (helps prevent getting stuck high)
                    if (Math.abs(ball.vy) < 0.15 && ball.y < canvasHeight - plinkoBuckets[0].height - 20) {
                       ball.vy += 0.35; // Add some downward velocity
                       ball.vx += (Math.random() - 0.5) * 0.3; // Add a bit of random horizontal nudge
                    }
                    break; // Process only one peg collision per frame
                }
            }

            // Wall Collisions
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius; ball.vx *= -BOUNCE_FACTOR; collisionOccurredThisFrame = true;
            } else if (ball.x + ball.radius > canvasWidth) {
                ball.x = canvasWidth - ball.radius; ball.vx *= -BOUNCE_FACTOR; collisionOccurredThisFrame = true;
            }

            // Bucket Check
            const bucketTopY = canvasHeight - plinkoBuckets[0].height;
            if (ball.y + ball.radius > bucketTopY) {
                let landedInBucket = false;
                for (const bucket of plinkoBuckets) {
                    if (ball.x >= bucket.x && ball.x < bucket.x + bucket.width) {
                        handlePlinkoWin(bucket, ball.betAmount);
                        plinkoBalls.splice(i, 1);
                        landedInBucket = true;
                        break;
                    }
                }
                 if (!landedInBucket && ball.y > bucketTopY + ball.radius + 5) { // Ball clearly missed and went below
                     console.warn("Ball missed buckets, assigning to closest.");
                     let closestBucket = plinkoBuckets[0];
                     let minDist = Math.abs(ball.x - (closestBucket.x + closestBucket.width / 2));
                     for(let j = 1; j < plinkoBuckets.length; j++) {
                         let dist = Math.abs(ball.x - (plinkoBuckets[j].x + plinkoBuckets[j].width / 2));
                         if (dist < minDist) {
                             minDist = dist; closestBucket = plinkoBuckets[j];
                         }
                     }
                     handlePlinkoWin(closestBucket, ball.betAmount);
                     plinkoBalls.splice(i, 1);
                 }
            }

            // Anti-Stuck Jiggle Logic
            const totalVelocity = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (totalVelocity < MIN_VELOCITY_THRESHOLD && ball.y < bucketTopY - ball.radius * 2) {
                ball.stuckFrames++;
                if (ball.stuckFrames > STUCK_FRAMES_THRESHOLD) {
                    ball.vx += (Math.random() - 0.5) * 0.1; // Small random horizontal jiggle
                    ball.vy += Math.random() * 0.1;       // Small random downward jiggle
                    ball.stuckFrames = 0;
                    console.log("Applied anti-stuck jiggle.");
                }
            } else {
                ball.stuckFrames = 0;
            }
        }

        drawPlinkoBoard();
        drawPlinkoBalls();

        if (plinkoBalls.length > 0) {
            plinkoAnimationId = requestAnimationFrame(animatePlinko);
        } else {
            console.log("Stopping Plinko animation loop.");
            cancelAnimationFrame(plinkoAnimationId);
            plinkoAnimationId = null;
            if (plinkoDropButton) plinkoDropButton.disabled = false;
            if (plinkoStatus) plinkoStatus.textContent = 'Drop again!';
        }
    }

    /**
     * Handles the win/loss calculation and UI update.
     */
    function handlePlinkoWin(bucket, betAmount) {
        if (!plinkoStatus || !LocalBrokieAPI) return;
        const multiplier = bucket.multiplier;
        const winAmount = Math.floor(betAmount * multiplier); // Use Math.floor for integer winnings
        LocalBrokieAPI.updateBalance(winAmount);

        let statusText = `Ball landed in ${multiplier}x. `;
        const profit = winAmount - betAmount; // Calculate net profit/loss
        if (profit > 0) {
            statusText += `Won ${LocalBrokieAPI.formatWin(profit)}!`;
            LocalBrokieAPI.addWin('Plinko', profit);
            LocalBrokieAPI.playSound('plinko_win_high'); // Or a generic win sound
        } else if (profit < 0) {
             statusText += `Lost ${LocalBrokieAPI.formatWin(Math.abs(profit))}.`;
             LocalBrokieAPI.playSound('plinko_win_low'); // Or a generic lose sound
        } else { // profit === 0 (e.g. 0.1x multiplier might lead to this if betAmount is small)
             statusText += `Almost nothing back.`;
             LocalBrokieAPI.playSound('plinko_peg_hit'); // A neutral sound
        }
        LocalBrokieAPI.showMessage(statusText, 2500);
        highlightBucket(bucket);
    }

    /**
     * Briefly highlights a specific bucket.
     */
    function highlightBucket(bucket) {
       if (!plinkoCtx || !plinkoCanvas) return;
       const ctx = plinkoCtx;
       const originalColor = bucket.color;
       const highlightFill = 'rgba(255, 255, 255, 0.9)';
       const highlightBorder = '#FFFFFF';
       const highlightTextColor = '#000000'; // Black text for high contrast on white highlight

       // Draw highlight
       ctx.fillStyle = highlightFill;
       ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
       ctx.strokeStyle = highlightBorder;
       ctx.lineWidth = 2;
       ctx.strokeRect(bucket.x + 1, bucket.y + 1, bucket.width - 2, bucket.height - 2); // Inset border

       // Draw text on highlight
       ctx.fillStyle = highlightTextColor;
       ctx.font = 'bold 13px Inter, sans-serif'; // Slightly larger for emphasis
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);
       ctx.lineWidth = 1; // Reset line width

       setTimeout(() => {
           // Redraw only the specific bucket to its original state
           // This is a simplified redraw; for perfect redraw, the entire board might be needed
           // if balls are still falling or other dynamic elements are present.
           // However, since balls are removed upon landing, this should be mostly fine.
           if (plinkoCtx) {
               ctx.fillStyle = originalColor;
               ctx.fillRect(bucket.x, bucket.y, bucket.width, bucket.height);
               ctx.fillStyle = '#FFFFFF'; // Original text color
               ctx.font = 'bold 12px Inter, sans-serif'; // Original font
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.fillText(`${bucket.multiplier}x`, bucket.x + bucket.width / 2, bucket.y + bucket.height / 2);
           }
       }, 350); // Duration of highlight
    }

    // Expose initPlinko to be called from main.js or HTML
    window.initPlinko = initPlinko;

// End of the guard block
} else {
    console.warn("Plinko script (v2.5.1 - House Edge Mod) already loaded. Skipping re-initialization.");
}
