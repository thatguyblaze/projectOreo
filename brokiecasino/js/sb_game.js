console.log("Loading sb_game.js (Premium v7 - SportSRC Integrated)...");

// 1. Define Initialization Function
window.initSports = function (API) {
    if (!API) {
        console.error("sb_game.js: BrokieAPI is missing!");
        return;
    }
    window.LocalBrokieAPI = API;

    const container = document.getElementById('game-sports');
    if (!container) return;

    // Premium UI Structure
    container.innerHTML = `
        <div class="flex flex-col gap-4 w-full h-full text-slate-200 font-sans">
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-white/5 p-3 rounded-xl shadow-lg gap-4">
                <div class="flex gap-3 items-center">
                    <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-xl border border-white/10 shadow-lg">
                        🏆
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white tracking-wide">Live Sportsbook</h2>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                            <span class="text-emerald-500 font-bold animate-pulse">● API Connected</span>
                            <span class="text-slate-700">|</span>
                            <span>Simulated Outcomes</span>
                        </div>
                    </div>
                </div>
                
                <!-- WAGER CONTROL (Standardized) -->
                <div class="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 shadow-inner">
                    <!-- Row 1: Incrementers -->
                    <div class="flex items-center gap-1">
                        <button onclick="adjustSbWager(-10)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">-10</button>
                        <button onclick="adjustSbWager(-1)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-400 border border-white/5 transition-colors">-</button>
                    </div>

                    <!-- Input -->
                    <div class="relative group">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                        <input type="number" id="sb-wager-input" value="10" min="1" class="w-20 h-8 bg-black/50 border border-white/10 rounded text-center text-white font-bold text-sm pl-3 focus:border-indigo-500 outline-none transition-colors">
                    </div>

                    <!-- Row 1: Incrementers Right -->
                    <div class="flex items-center gap-1">
                        <button onclick="adjustSbWager(1)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-400 border border-white/5 transition-colors">+</button>
                        <button onclick="adjustSbWager(10)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">+10</button>
                    </div>

                    <!-- Divider -->
                    <div class="w-px h-6 bg-white/10 mx-1"></div>

                    <!-- Row 2: Multipliers -->
                    <div class="flex items-center gap-1">
                        <button onclick="setSbWagerMin()" class="px-2 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">MIN</button>
                        <button onclick="multiplySbWager(0.5)" class="px-2 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">1/2</button>
                        <button onclick="multiplySbWager(2)" class="px-2 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">2x</button>
                        <button onclick="setSbWagerMax()" class="px-2 h-8 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 border border-white/10 transition-colors">MAX</button>
                    </div>
                </div>

                <div class="flex flex-col items-end min-w-[80px]">
                    <span class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Balance</span>
                     <div class="text-lg font-mono text-emerald-400 font-bold" id="sb-balance-display">---</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden min-h-[600px]">
                
                <!-- CENTER COLUMN: Player & Matches -->
                <div class="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
                    
                    <!-- EMBEDDED PLAYER (Simulation Visualizer) -->
                    <div id="sb-player-container" class="w-full aspect-[21/9] bg-black rounded-xl relative overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group hidden">
                        <div class="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
                            <div class="flex gap-2 items-center">
                                <span class="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">SIMULATION ACTIVE</span>
                                <h3 id="sb-stream-title" class="text-sm font-bold text-white shadow-black drop-shadow-md">Match Center</h3>
                            </div>
                        </div>
                        <div class="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative">
                             <!-- Dynamic Poster based on sport -->
                             <img id="sb-stream-poster" src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-30">
                             <div class="z-10 flex flex-col items-center gap-2">
                                <div class="w-12 h-12 rounded-full border-2 border-white/20 border-t-indigo-500 animate-spin"></div>
                                <span class="text-xs text-indigo-300 font-bold px-4 py-1 bg-black/60 rounded-full border border-indigo-500/30 backdrop-blur">Calculating Result...</span>
                             </div>
                        </div>
                    </div>

                    <!-- TABS & GRID -->
                    <div class="flex flex-col flex-grow overflow-hidden gap-3">
                        <div class="flex gap-2 pb-1 overflow-x-auto hide-scrollbar flex-shrink-0" id="sb-tabs">
                             <!-- Tabs injected via JS -->
                        </div>

                        <div id="sb-matches" class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
                             <div class="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
                                <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span class="text-xs text-slate-400 font-mono">Fetching Live Data from SportSRC...</span>
                             </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: Bets -->
                <div class="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
                    <div class="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h3 class="font-bold text-sm uppercase tracking-widest text-white">🎫 Active Bets</h3>
                    </div>
                    
                    <div class="px-4 py-2 bg-indigo-900/10 border-b border-indigo-500/5 text-[10px] text-slate-400 leading-relaxed italic">
                        Select a match to predict. Results are simulated instantly based on implied odds probability.
                    </div>

                    <div id="sb-bets" class="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        <div class="flex flex-col items-center justify-center h-40 text-slate-700 gap-3">
                            <span class="text-4xl opacity-20">📊</span>
                            <span class="text-xs font-bold text-slate-500">No active wagers</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    updateSbBalance();

    // Initial Load with corrected default
    renderCategoryTabs();
    loadSportSRC('american-football');
};

window.adjustSbWager = function (amount) {
    const input = document.getElementById('sb-wager-input');
    if (input) {
        let current = parseInt(input.value) || 0;
        let next = current + amount;
        if (next < 1) next = 1;
        input.value = next;
    }
};

window.multiplySbWager = function (multiplier) {
    const input = document.getElementById('sb-wager-input');
    if (input) {
        let current = parseInt(input.value) || 0;
        let next = Math.floor(current * multiplier);
        if (next < 1) next = 1;
        input.value = next;
    }
};

window.setSbWagerMin = function () {
    const input = document.getElementById('sb-wager-input');
    if (input) input.value = 10; // Min bet
};

window.setSbWagerMax = function () {
    const input = document.getElementById('sb-wager-input');
    if (input && window.LocalBrokieAPI) {
        input.value = Math.floor(window.LocalBrokieAPI.getBalance());
    }
};

window.updateSbBalance = function () {
    const el = document.getElementById('sb-balance-display');
    if (el && window.LocalBrokieAPI) {
        el.innerText = `$${window.LocalBrokieAPI.getBalance().toLocaleString()}`;
    }
}


// 2. Data & Logic
// Corrected Categories from User
const SPORTS_CATS = [
    { id: 'american-football', label: 'Football', icon: '🏈' }, // User prefers "Football" for NFL usually? Or American Football. Keeping clear.
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'baseball', label: 'Baseball', icon: '⚾' },
    { id: 'hockey', label: 'Hockey', icon: '🏒' },
    { id: 'fight', label: 'Fighting', icon: '🥊' },
    { id: 'football', label: 'Soccer', icon: '⚽' }
];

let activeCatId = 'american-football';

function renderCategoryTabs() {
    const el = document.getElementById('sb-tabs');
    if (!el) return;
    el.innerHTML = '';

    SPORTS_CATS.forEach(cat => {
        const btn = document.createElement('button');
        const isActive = cat.id === activeCatId;

        btn.className = `px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap border flex items-center gap-2 ${isActive
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
            : 'bg-black/40 text-slate-500 border-white/5 hover:bg-white/5 hover:text-white'
            }`;

        btn.innerHTML = `<span>${cat.icon}</span> ${cat.label}`;
        btn.onclick = () => {
            activeCatId = cat.id;
            renderCategoryTabs();
            loadSportSRC(cat.id);
        };
        el.appendChild(btn);
    });
}

async function loadSportSRC(categoryId) {
    const matchesEl = document.getElementById('sb-matches');
    if (matchesEl) matchesEl.innerHTML = `
        <div class="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
            <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-slate-400 font-mono">Loading ${categoryId}...</span>
        </div>`;

    try {
        // Using the confirmed ID structure
        const url = `https://api.sportsrc.org/?data=matches&category=${categoryId}`;
        console.log("Fetching SportSRC:", url);

        const response = await fetch(url);
        if (!response.ok) throw new Error("API Error");

        const jsonData = await response.json();

        // Parse Structure: { success: true, data: [...] }
        let matches = [];
        if (jsonData && jsonData.success && Array.isArray(jsonData.data)) {
            matches = jsonData.data;
        } else if (jsonData && Array.isArray(jsonData)) {
            matches = jsonData; // Fallback if direct array
        } else if (jsonData && Array.isArray(jsonData.data)) {
            matches = jsonData.data; // Safe fallback for weird nesting
        }

        // FIX: Ensure matches is not null before checking length
        if (!matches) matches = [];

        if (matches.length > 0) {
            renderMatches(matches, categoryId);
        } else {
            matchesEl.innerHTML = `<div class="p-10 text-center text-slate-500">No live matches found for ${categoryId}. <br> <span class="text-[10px] opacity-50">Try another category.</span></div>`;
        }

    } catch (err) {
        console.error("SportSRC Error:", err);
        matchesEl.innerHTML = `<div class="p-10 text-center text-rose-500">Connection Error. <br> <span class="text-[10px] text-slate-500">${err.message}</span></div>`;
    }
}

function renderMatches(matches, catId) {
    const el = document.getElementById('sb-matches');
    if (!el) return;
    el.innerHTML = '';

    matches.slice(0, 50).forEach((m, idx) => {
        // Robust Parsing for SportSRC structure
        // Usually: home_team, away_team, odds: {home, draw, away}

        let homeName = m.home_team || m.home || (m.teams && m.teams.home ? m.teams.home.name : "Home Team");
        let awayName = m.away_team || m.away || (m.teams && m.teams.away ? m.teams.away.name : "Away Team");

        // Odds Parsing
        // If API provides odds, use them. Else, generate synthetic based on randomness seeded by names (for consistency)
        let o1 = 1.90, oX = 3.50, o2 = 1.90;

        if (m.odds) {
            o1 = parseFloat(m.odds.home) || parseFloat(m.odds['1']) || 1.90;
            oX = parseFloat(m.odds.draw) || parseFloat(m.odds['x']) || 3.50;
            o2 = parseFloat(m.odds.away) || parseFloat(m.odds['2']) || 1.90;
        } else {
            // Synthetic fallback if this specific match object lacks odds
            const seed = (homeName.length + awayName.length + idx);
            o1 = (1.5 + (seed % 10) / 10).toFixed(2);
            o2 = (1.5 + (seed % 8) / 10).toFixed(2);
        }

        const league = m.league || m.category || catId.toUpperCase();
        const timeStr = m.time || "Upcoming";

        const card = document.createElement('div');
        card.className = "bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 p-4 rounded-xl transition-all group relative overflow-hidden";

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded">${league}</span>
                <span class="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                    ${timeStr.toLowerCase().includes('live') ? '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>' : ''}
                    ${timeStr}
                </span>
            </div>
            
            <div class="flex items-center justify-between mb-5 gap-4">
                <div class="flex flex-col w-[40%]">
                    <span class="font-bold text-sm text-white leading-tight truncate" title="${homeName}">${homeName}</span>
                    <span class="text-[10px] text-slate-600">Home</span>
                </div>
                
                <div class="text-[10px] font-mono text-slate-600">VS</div>
                
                <div class="flex flex-col w-[40%] text-right">
                    <span class="font-bold text-sm text-white leading-tight truncate" title="${awayName}">${awayName}</span>
                    <span class="text-[10px] text-slate-600">Away</span>
                </div>
            </div>

            <!-- ODDS BUTTONS -->
            <div class="grid grid-cols-3 gap-2">
                <button onclick="placeSRCBet('${homeName.replace(/'/g, "\\'")}', ${o1}, 'home')" class="bg-black/40 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 rounded py-2 transition-all group/btn flex flex-col items-center">
                    <span class="text-[10px] text-slate-500 group-hover/btn:text-indigo-200">1</span>
                    <span class="text-xs font-bold text-indigo-400 group-hover/btn:text-white">${o1}</span>
                </button>
                <button onclick="placeSRCBet('Draw', ${oX}, 'draw')" class="bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded py-2 transition-all group/btn flex flex-col items-center">
                    <span class="text-[10px] text-slate-500">X</span>
                    <span class="text-xs font-bold text-slate-400 group-hover/btn:text-white">${oX}</span>
                </button>
                <button onclick="placeSRCBet('${awayName.replace(/'/g, "\\'")}', ${o2}, 'away')" class="bg-black/40 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 rounded py-2 transition-all group/btn flex flex-col items-center">
                    <span class="text-[10px] text-slate-500 group-hover/btn:text-indigo-200">2</span>
                    <span class="text-xs font-bold text-indigo-400 group-hover/btn:text-white">${o2}</span>
                </button>
            </div>
        `;
        el.appendChild(card);
    });
}


// 3. Betting & Simulation
window.placeSRCBet = function (teamName, odds, type) {
    if (!window.LocalBrokieAPI) { alert("API Error"); return; }
    const input = document.getElementById('sb-wager-input');
    const val = parseInt(input ? input.value : 0);

    if (isNaN(val) || val <= 0) return alert("Invalid wager");
    if (val > window.LocalBrokieAPI.getBalance()) return alert("Insufficient Balance");

    window.LocalBrokieAPI.updateBalance(-val);
    window.LocalBrokieAPI.playSound('chip_place');
    window.updateSbBalance();

    // Show Simulation Overlay
    const player = document.getElementById('sb-player-container');
    const title = document.getElementById('sb-stream-title');
    const poster = document.getElementById('sb-stream-poster');

    if (player) {
        player.classList.remove('hidden');
        player.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (title) title.innerText = `Prediction Simulation: ${teamName}`;

        // Update poster based on active category if possible (simple random fallback)
        const posters = [
            "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop", // stadium
            "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1000&auto=format&fit=crop"  // basketball
        ];
        if (poster) poster.src = posters[Math.floor(Math.random() * posters.length)];
    }

    // Add Slip
    const betId = Date.now();
    addBetToSlip(betId, teamName, odds, val);

    // Calc Result
    simulateSRCResult(betId, odds, val);
}

function addBetToSlip(id, sel, odds, amt) {
    const slip = document.getElementById('sb-bets');
    if (slip.querySelector('.flex-col')) slip.innerHTML = ''; // clear placeholder

    const div = document.createElement('div');
    div.id = `bet-${id}`;
    div.className = "bg-slate-800 p-3 rounded-lg border border-white/5 mb-3 relative overflow-hidden shadow-lg slide-in-bottom";
    div.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <span class="font-bold text-xs text-white truncate w-2/3">${sel}</span>
            <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 rounded text-[10px] font-bold">x${odds}</span>
        </div>
        <div class="flex justify-between text-[10px] text-slate-400 font-mono mb-2">
            <span>$${amt}</span>
            <span>Pot: $${(amt * odds).toFixed(0)}</span>
        </div>
        <div class="relative h-1 bg-black/50 rounded-full overflow-hidden">
            <div id="prog-${id}" class="absolute left-0 top-0 bottom-0 bg-indigo-500 w-0 transition-all duration-[5000ms] ease-linear"></div>
        </div>
        <div class="text-[9px] text-center text-indigo-400 mt-1 uppercase font-bold tracking-wider animate-pulse">Running Simulation...</div>
    `;
    slip.prepend(div);

    setTimeout(() => {
        const bar = document.getElementById(`prog-${id}`);
        if (bar) bar.style.width = '100%';
    }, 50);
}

function simulateSRCResult(id, odds, amt) {
    setTimeout(() => {
        const div = document.getElementById(`bet-${id}`);
        if (!div) return;

        const impliedProb = (1 / odds) - 0.05; // 5% House Edge
        const win = Math.random() < impliedProb;

        if (win) {
            const profit = Math.floor(amt * odds);
            window.LocalBrokieAPI.updateBalance(profit);
            window.LocalBrokieAPI.addWin('Sports', profit - amt);
            window.LocalBrokieAPI.playSound('win_small');
            window.updateSbBalance();

            div.className = "bg-emerald-900/40 p-3 rounded-lg border border-emerald-500/50 mb-3 relative overflow-hidden";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-white">${div.querySelector('span').innerText}</span>
                    <span class="text-[10px] font-bold bg-emerald-500 text-black px-1.5 rounded">WIN</span>
                </div>
                <div class="mt-1 text-center text-emerald-400 font-mono text-sm font-bold">+$${profit}</div>
            `;
        } else {
            div.className = "bg-rose-900/30 p-3 rounded-lg border border-rose-500/30 mb-3 relative overflow-hidden opacity-50";
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-slate-300">${div.querySelector('span').innerText}</span>
                    <span class="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-1.5 rounded">LOSS</span>
                </div>
                <div class="mt-1 text-center text-rose-500 font-mono text-xs font-bold">-$${amt}</div>
            `;
        }

        // Hide player
        setTimeout(() => {
            const player = document.getElementById('sb-player-container');
            if (player) player.classList.add('hidden');
        }, 2000);

    }, 5000); // 5s match sim duration
}
