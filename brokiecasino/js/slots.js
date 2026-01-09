/**
 * Brokie Casino - Slot Machine Game Logic (slots.js)
 * Refactored for Multi-Machine Support ("Upgrades")
 */

// --- Constants ---
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '🔔', '💎', '💰', '7️⃣'];
// Payouts
const SLOT_PAYOUTS = {
    '7️⃣7️⃣7️⃣': 250, '💰💰💰': 100, '💎💎💎': 90, '🔔🔔🔔': 60,
    '🍉🍉🍉': 25, '🍊🍊🍊': 20, '🍋🍋🍋': 15, '🍒🍒🍒': 10,
    '7️⃣7️⃣': 10, '💰💰': 7, '💎💎': 5, '🍒🍒': 2,
};
const MACHINE_COST = 1000000;
const SPIN_DURATION = 1000; // ms
const REEL_SPIN_OFFSET = 1500; // px

// --- Global State ---
let activeMachines = []; // Array of SlotMachine instances
let machinesOwned = 1; // Default 1
let isAutoSpinning = false;
let slotSpinTimeout = null;

// --- DOM Elements ---
let slotsContainer, spinButton, autoSpinToggle, slotBetInput, payoutList;

/**
 * Class representing a single Slot Machine instance.
 * Handles its own DOM creation, animation, and result calculation.
 */
class SlotMachine {
    constructor(id) {
        this.id = id;
        this.element = null;
        this.reelElements = [];
        this.reelContainers = [];
        this.createDOM();
    }

    createDOM() {
        const machineDiv = document.createElement('div');
        machineDiv.className = 'slot-machine-instance glass-card p-4 rounded-2xl border border-white/5 shadow-2xl w-full max-w-[320px]';
        machineDiv.innerHTML = `
            <div class="flex justify-center gap-2 relative">
                 <!-- Machine Header/Status could go here -->
                <div class="reel-container"><div class="reel" id="m${this.id}-r1"><div style="height: 80px; line-height: 80px;">❓</div></div></div>
                <div class="reel-container"><div class="reel" id="m${this.id}-r2"><div style="height: 80px; line-height: 80px;">❓</div></div></div>
                <div class="reel-container"><div class="reel" id="m${this.id}-r3"><div style="height: 80px; line-height: 80px;">❓</div></div></div>
            </div>
        `;

        slotsContainer.appendChild(machineDiv);
        this.element = machineDiv;
        this.reelElements = [
            machineDiv.querySelector(`#m${this.id}-r1`),
            machineDiv.querySelector(`#m${this.id}-r2`),
            machineDiv.querySelector(`#m${this.id}-r3`)
        ];
        this.reelContainers = Array.from(machineDiv.querySelectorAll('.reel-container'));
    }

    async spin(betPerMachine, delay = 0) {
        // Stagger start
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

        // Clear previous effects
        this.reelContainers.forEach(c => c.classList.remove('win-effect'));

        const finalSymbols = [];
        const promises = this.reelElements.map((reelEl, index) => {
            return new Promise(resolve => {
                const reelContainer = reelEl.parentElement;

                // Visual reset
                reelEl.style.transition = 'none';
                reelEl.style.transform = 'translateY(0)'; // Start visible at top of strip

                // Strip generation
                let stripHTML = '';
                // Add flex-shrink: 0 to ensure items don't collapse inside the absolute container
                const itemStyle = "height: 80px; line-height: 80px; font-size: 40px; text-align: center; box-sizing: border-box; margin: 0; padding: 0; flex-shrink: 0;";

                for (let i = 0; i < 15; i++) stripHTML += `<div style="${itemStyle}">${this.getRandomSymbol()}</div>`;
                const finalSymbol = this.getRandomSymbol();
                finalSymbols[index] = finalSymbol;
                stripHTML += `<div style="${itemStyle}">${finalSymbol}</div>`;
                reelEl.innerHTML = stripHTML;

                // Force Reflow
                reelContainer.offsetHeight;

                // Animate
                requestAnimationFrame(() => {
                    // Staggered spin duration per reel
                    const ITEM_HEIGHT = 80;
                    const TOTAL_ITEMS = 16; // 15 random + 1 final
                    const targetIndex = TOTAL_ITEMS - 1; // 15

                    // Animate transform instead of top for better performance and layout stability
                    reelEl.style.transition = `transform ${SPIN_DURATION / 1000 + index * 0.15}s cubic-bezier(0.25, 1, 0.5, 1)`;

                    // Calculate exact target: Move up by 15 items * 80px
                    const finalTranslate = -(targetIndex * ITEM_HEIGHT);
                    reelEl.style.transform = `translateY(${finalTranslate}px)`;

                    // Resolve after animation
                    setTimeout(() => {
                        resolve();
                        // Play stop sound per reel
                        playSound('reel_stop');
                    }, SPIN_DURATION + index * 150);
                });
            });
        });

        await Promise.all(promises);

        // Final cleanup & Win Check (return win amount for this machine)
        const result = this.checkWin(finalSymbols, betPerMachine);

        // Play sound for this specific machine if it won
        if (result.win > 0) {
            // Determine sound based on multiplier relative to bet
            const multiplier = result.win / betPerMachine;
            let winSound = 'win_small';
            if (multiplier >= 25) winSound = 'win_medium';
            if (multiplier >= 100) winSound = 'win_big';
            playSound(winSound);
        }

        return result;
    }

    checkWin(symbols, bet) {
        const [s1, s2, s3] = symbols;
        let winKey = '';
        let winAmount = 0;
        let winningReels = [];

        // STRICT MATCHING: Only allow wins if symbols are identical.
        if (s1 === s2 && s2 === s3 && SLOT_PAYOUTS[s1 + s2 + s3]) {
            // 3 matching symbols
            winKey = s1 + s2 + s3;
            winningReels = [0, 1, 2];
        }
        else if (s1 === s2 && SLOT_PAYOUTS[s1 + s2]) {
            // First 2 match
            winKey = s1 + s2;
            winningReels = [0, 1];
        }
        else if (s2 === s3 && SLOT_PAYOUTS[s2 + s3]) {
            // Last 2 match
            winKey = s2 + s3;
            winningReels = [1, 2];
        }

        if (winKey && SLOT_PAYOUTS[winKey]) {
            winAmount = bet * SLOT_PAYOUTS[winKey];
            // Highlight
            winningReels.forEach(i => this.reelContainers[i].classList.add('win-effect'));
            return { win: winAmount, key: winKey };
        }
        return { win: 0, key: null };
    }

    getRandomSymbol() {
        return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    }
}

const MAX_MACHINES = 12; // Updated to 12

// --- Global Accessors for Shop & State ---
window.getSlotsMachineCount = () => machinesOwned;
window.addSlotMachine = () => {
    if (machinesOwned >= MAX_MACHINES) return false;
    machinesOwned++;
    renderMachines();
    return true;
};
window.setMachinesOwned = (count) => {
    machinesOwned = parseInt(count) || 1;
    if (machinesOwned < 1) machinesOwned = 1;
    if (machinesOwned > MAX_MACHINES) machinesOwned = MAX_MACHINES;
    renderMachines();
};


/**
 * Initializes Slots Game
 */
function initSlots() {
    console.log("Initializing Multi-Machine Slots...");
    slotsContainer = document.getElementById('slots-machine-container');
    spinButton = document.getElementById('spin-button');
    autoSpinToggle = document.getElementById('auto-spin-toggle');
    slotBetInput = document.getElementById('slot-bet');
    payoutList = document.getElementById('payout-list');



    if (!slotsContainer || !spinButton) return;

    // Load State? (Mocked for now, just default 1 or previously purchased)
    // In a real persist scenario, we'd read 'machinesOwned' from localStorage.
    // For now, reset to 1 on reload or keep in memory if SPA navigation.

    renderMachines();
    displayPayoutLegend();

    // Listeners
    spinButton.onclick = () => { if (isAutoSpinning) stopAutoSpin(); startSpinAll(); };
    autoSpinToggle.onclick = toggleAutoSpin;

    addBetAdjustmentListeners('slot', slotBetInput);
}

function renderMachines() {
    if (!slotsContainer) return; // Guard against early calls (e.g. from loadGameState before initSlots)
    slotsContainer.innerHTML = ''; // Clear
    activeMachines = []; // Reset instances
    for (let i = 0; i < machinesOwned; i++) {
        activeMachines.push(new SlotMachine(i));
    }
}

async function startSpinAll() {
    const betPerMachine = parseInt(slotBetInput.value);
    const totalBet = betPerMachine * activeMachines.length;

    if (totalBet > currency) {
        showMessage(`Not enough cash! Need $${totalBet} for ${activeMachines.length} machines.`);
        stopAutoSpin();
        return;
    }

    // Logic
    startTone();
    currency -= totalBet;
    updateCurrencyDisplay('loss');

    // Update Stats UI
    const lastCostEl = document.getElementById('slot-last-cost');
    if (lastCostEl) lastCostEl.textContent = formatWin(totalBet); // use formatWin for consistency or just $

    playSound('spin_start');

    spinButton.disabled = true;
    spinButton.textContent = 'Spinning...';

    // Execute spins in parallel with stagger
    // machinesOwned usually small (1-4). Stagger 300ms.
    const results = await Promise.all(activeMachines.map((m, i) => m.spin(betPerMachine, i * 300)));

    // Aggregate Results
    let totalWin = 0;
    results.forEach(r => totalWin += r.win);

    // Update Stats UI (Last Win)
    const lastWinEl = document.getElementById('slot-last-win');
    if (lastWinEl) lastWinEl.textContent = formatWin(totalWin);

    if (totalWin > 0) {
        currency += totalWin;
        totalGain += Math.max(0, totalWin - totalBet); // Net gain calculation if needed
        updateCurrencyDisplay('win');
        showMessage(`Won ${formatWin(totalWin)}!`, 2000);
        // playSound(totalWin > totalBet * 5 ? 'win_big' : 'win_medium'); // REMOVED: Managed per machine
        addWinToLeaderboard('Slots', totalWin);
    } else {
        totalLoss += totalBet;
        // playSound('lose'); // REMOVED: Silence on loss per machine preference
    }

    spinButton.disabled = false;
    spinButton.textContent = 'SPIN ALL';

    // Auto Spin Logic?
    if (isAutoSpinning) {
        // Simple delay before next auto spin
        setTimeout(startSpinAll, 1000);
    }
}

function finalizeGlobalSpin(totalWin, winKey, multiplier) {
    if (totalWin > 0) {
        currency += totalWin;
        totalGain += totalWin;
        addWinToLeaderboard('Slots', totalWin);

        let winSound = 'win_small';
        if (multiplier >= 100) winSound = 'win_big';
        else if (multiplier >= 25) winSound = 'win_medium';

        playSound(winSound);
        showMessage(`TOTAL WIN: ${formatWin(totalWin)}!`);
        updateCurrencyDisplay('win');
    } else {
        totalLoss += (parseInt(slotBetInput.value) * activeMachines.length);
        showMessage("No wins.", 1000);
    }

    saveGameState();
    spinButton.disabled = false;
    spinButton.textContent = 'SPIN ALL';

    if (isAutoSpinning) {
        slotSpinTimeout = setTimeout(startSpinAll, 500);
    }
}

// ... Auto Spin Logic (Same as before) ...
function stopAutoSpin() {
    isAutoSpinning = false;
    clearTimeout(slotSpinTimeout);
    if (autoSpinToggle) {
        autoSpinToggle.classList.remove('active');
        autoSpinToggle.textContent = 'Auto Off';
    }
}

function toggleAutoSpin() {
    if (!autoSpinToggle) return;
    isAutoSpinning = !isAutoSpinning;
    if (isAutoSpinning) {
        autoSpinToggle.classList.add('active');
        autoSpinToggle.textContent = 'Auto ON';
        startSpinAll();
    } else {
        stopAutoSpin();
    }
}

function displayPayoutLegend() {
    if (!payoutList) return;
    payoutList.innerHTML = '';
    const sortedPayouts = Object.entries(SLOT_PAYOUTS).sort(([, a], [, b]) => b - a);
    for (const [key, value] of sortedPayouts) {
        const li = document.createElement('li');
        // Inline styles to ensure visibility regardless of CSS issues
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.padding = '8px 12px';
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.borderRadius = '6px';
        li.style.marginBottom = '4px';

        li.innerHTML = `<span style="font-size: 1.25rem;">${key}</span><span style="color: #ffd700; font-weight: bold;">${value}x</span>`;
        payoutList.appendChild(li);
    }
}
