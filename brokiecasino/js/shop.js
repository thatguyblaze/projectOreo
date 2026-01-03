/**
 * Brokie Casino - Shop Logic (shop.js)
 * Handles the Upgrade Shop Modal and item purchasing.
 */

// --- Constants ---
const SHOP_ITEMS = [
    {
        id: 'slots_machine',
        name: 'Extra Slot Machine',
        icon: '🎰',
        description: 'Add another machine to your grid. Spin more, win more!',
        cost: 1000000, // EXTREME COST
        maxLevel: 8, // Max 8 machines total
        get currentLevel() { return typeof getSlotsMachineCount === 'function' ? getSlotsMachineCount() : 1; },
        action: () => {
            if (typeof addSlotMachine === 'function') return addSlotMachine();
            return false;
        }
    },
    // Future items:
    // { id: 'luck_charm', name: 'Lucky Clover', ... }
];

// --- DOM Elements ---
let shopModalOverlay, shopModal, shopCloseBtn, shopOpenBtn, shopItemsContainer;

/**
 * Initializes the Shop system.
 */
function initShop() {
    console.log("Initializing Shop...");
    shopModalOverlay = document.getElementById('shop-modal-overlay');
    shopModal = document.getElementById('shop-modal');
    shopCloseBtn = document.getElementById('shop-close-button');
    shopOpenBtn = document.getElementById('shop-button');
    shopItemsContainer = document.getElementById('shop-items-container');

    if (!shopModalOverlay || !shopOpenBtn) {
        console.error("Shop initialization failed: Elements not found.");
        return;
    }

    // Event Listeners
    shopOpenBtn.addEventListener('click', openShop);
    shopCloseBtn.addEventListener('click', closeShop);
    shopModalOverlay.addEventListener('click', (e) => {
        if (e.target === shopModalOverlay) closeShop();
    });

    // Render initial items
    renderShopItems();
    console.log("Shop Initialized.");
}

/**
 * Renders shop items into the modal.
 */
function renderShopItems() {
    shopItemsContainer.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const isMaxed = item.currentLevel >= item.maxLevel;
        const canAfford = currency >= item.cost;

        const itemEl = document.createElement('div');
        itemEl.className = 'bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:bg-white/10 transition-colors';
        itemEl.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="text-3xl">${item.icon}</div>
                <div class="text-xs font-mono text-slate-500 bg-black/40 px-2 py-1 rounded">
                    Level ${item.currentLevel} / ${item.maxLevel}
                </div>
            </div>
            <div>
                <h3 class="font-bold text-white">${item.name}</h3>
                <p class="text-xs text-slate-400 mt-1">${item.description}</p>
            </div>
            <button class="shop-buy-btn w-full py-2 rounded-lg font-bold text-sm transition-all flex justify-center items-center gap-2 ${isMaxed
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                : canAfford
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }" ${isMaxed || !canAfford ? 'disabled' : ''} data-id="${item.id}">
                ${isMaxed ? 'MAX LEVEL' : `<span>Buy</span> <span class="text-indigo-200">$${formatWin(item.cost)}</span>`}
            </button>
        `;

        // Add click handler
        const btn = itemEl.querySelector('.shop-buy-btn');
        if (!btn.disabled) {
            btn.onclick = () => buyItem(item);
        }

        shopItemsContainer.appendChild(itemEl);
    });
}

/**
 * Handles item purchase.
 */
function buyItem(item) {
    if (currency < item.cost) {
        playSound('loan');
        showMessage("Not enough cash!");
        return;
    }

    // Attempt the action
    const success = item.action();
    if (success) {
        currency -= item.cost;
        updateCurrencyDisplay('loss'); // from main.js
        playSound('win_medium'); // success sound
        showMessage(`Purchased ${item.name}!`);

        // Re-render shop to update levels/buttons
        renderShopItems();
    } else {
        playSound('loan');
        showMessage("Could not purchase item.");
    }
}

function openShop() {
    renderShopItems(); // Refresh state
    shopModalOverlay.classList.remove('hidden');
    // Animate in
    setTimeout(() => {
        shopModal.classList.remove('opacity-0', 'scale-95');
        shopModal.classList.add('opacity-100', 'scale-100');
    }, 10);
    playSound('click');
}

function closeShop() {
    shopModal.classList.remove('opacity-100', 'scale-100');
    shopModal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        shopModalOverlay.classList.add('hidden');
    }, 300);
    playSound('click');
}

// Global accessor for main.js to init
window.initShop = initShop;
