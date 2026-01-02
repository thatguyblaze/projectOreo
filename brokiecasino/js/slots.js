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
const MACHINE_COST = 2000;
const SPIN_DURATION = 1000; // ms
const REEL_SPIN_OFFSET = 1500; // px

// --- Global State ---
let activeMachines = []; // Array of SlotMachine instances
let machinesOwned = 1; // Default 1
let isAutoSpinning = false;
let slotSpinTimeout = null;

// --- DOM Elements ---
let slotsContainer, spinButton, autoSpinToggle, slotBetInput, payoutList, buyMachineBtn;

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
        machineDiv.className = 'slot-machine-instance glass-card p-4 rounded-2xl border border-white/5 shadow-2xl animate-reveal';
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

    async spin(betPerMachine) {
        // Clear previous effects
        this.reelContainers.forEach(c => c.classList.remove('win-effect'));

        const finalSymbols = [];
        const promises = this.reelElements.map((reelEl, index) => {
            return new Promise(resolve => {
                const reelContainer = reelEl.parentElement;

                // Visual reset
                reelEl.style.transition = 'none';
                reelEl.style.top = `-${REEL_SPIN_OFFSET}px`;

                // Strip generation
                let stripHTML = '';
                for (let i = 0; i < 15; i++) stripHTML += `<div style="height: 80px; line-height: 80px;">${this.getRandomSymbol()}</div>`;
                const finalSymbol = this.getRandomSymbol();
                finalSymbols[index] = finalSymbol;
                stripHTML += `<div style="height: 80px; line-height: 80px;">${finalSymbol}</div>`;
                reelEl.innerHTML = stripHTML;

                // Force Reflow
                reelContainer.offsetHeight;

                // Animate
                requestAnimationFrame(() => {
                    // Staggered spin duration
                    reelEl.style.transition = `top ${SPIN_DURATION / 1000 + index * 0.15}s cubic-bezier(0.25, 1, 0.5, 1)`;
                    const finalTop = -(reelEl.scrollHeight - reelContainer.clientHeight);
                    reelEl.style.top = `${finalTop}px`;

                    // Resolve after animation
                    setTimeout(() => {
                        resolve();
                        // Play stop sound per reel
                        playSound('reel_stop', { index: index });
                    }, SPIN_DURATION + index * 150);
                });
            });
        });

        await Promise.all(promises);

        // Final cleanup & Win Check (return win amount for this machine)
        return this.checkWin(finalSymbols, betPerMachine);
    }

    checkWin(symbols, bet) {
        const [s1, s2, s3] = symbols;
        let winKey = '';
        let winAmount = 0;
        let winningReels = [];

        if (s1 === s2 && s2 === s3) { winKey = s1 + s2 + s3; winningReels = [0, 1, 2]; }
        else if (SLOT_PAYOUTS[s1 + s2]) { winKey = s1 + s2; winningReels = [0, 1]; }
        else if (SLOT_PAYOUTS[s2 + s3]) { winKey = s2 + s3; winningReels = [1, 2]; }

        if (SLOT_PAYOUTS[winKey]) {
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

// --- Global Accessors for Shop & State ---
window.getSlotsMachineCount = () => machinesOwned;
window.addSlotMachine = () => {
    if (machinesOwned >= 8) return false; // Hard limit
    machinesOwned++;
    renderMachines();
    return true;
};
window.setMachinesOwned = (count) => {
    machinesOwned = parseInt(count) || 1;
    if (machinesOwned < 1) machinesOwned = 1;
    if (machinesOwned > 8) machinesOwned = 8;
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

    // Removed inline buy button
    // buyMachineBtn = document.getElementById('buy-machine-button'); 

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
    playSound('spin_start');

    spinButton.disabled = true;
    spinButton.textContent = 'Spinning...';

    // Execute spins in parallel
    const results = await Promise.all(activeMachines.map(m => m.spin(betPerMachine)));

    // Aggregate Results
    let totalWin = 0;
    let bestWinKey = null;
    let bestMultiplier = 0;

    results.forEach(res => {
        if (res.win > 0) {
            totalWin += res.win;
            const mult = res.win / betPerMachine;
            if (mult > bestMultiplier) {
                bestMultiplier = mult;
                bestWinKey = res.key;
            }
        }
    });

    finalizeGlobalSpin(totalWin, bestWinKey, bestMultiplier);
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
        li.innerHTML = `<span>${key}</span><span>${value}x</span>`;
        payoutList.appendChild(li);
    }
}
