console.log("Loading sb_game.js (Premium v4 - Standardized Betting)...");

// 1. Define Initialization Function
window.initSports = function (API) {
    if (!API) {
        console.error("sb_game.js: BrokieAPI is missing!");
        return;
    }
    window.LocalBrokieAPI = API;

    const container = document.getElementById('game-sports');
    if (!container) return;

    // Premium UI Structure with Betting Controls
    container.innerHTML = `
        <div class="flex flex-col gap-6 w-full h-full text-slate-200 font-sans">
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 border border-white/5 p-4 rounded-xl shadow-xl gap-4">
                <div class="flex gap-4 items-center">
                    <div class="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">🏈</div>
                    <div>
                        <h2 class="text-xl font-bold text-white tracking-wide">Sportsbook</h2>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                            <span class="text-emerald-400 animate-pulse">● Live Odds</span>
                            <span class="text-slate-600">|</span>
                            <span>Simulated Results</span>
                        </div>
                    </div>
                </div>
                
                <!-- STANDARDIZED BET CONTROLS -->
                <div class="flex items-center gap-4 bg-black/40 p-2 rounded-lg border border-white/5">
                    <div class="flex flex-col">
                        <label class="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Wager Amount</label>
                        <div class="flex items-center gap-2">
                            <span class="text-slate-400">$</span>
                            <input type="number" id="sb-wager-input" value="100" min="1" class="bg-transparent text-white font-mono font-bold text-lg w-24 outline-none border-b border-white/10 focus:border-indigo-500 transition-colors placeholder-slate-600">
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="adjustSbWager(10)" class="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors">+10</button>
                        <button onclick="adjustSbWager(50)" class="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors">+50</button>
                        <button onclick="adjustSbWager(100)" class="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors">+100</button>
                        <button onclick="setSbWagerMax()" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors">MAX</button>
                    </div>
                </div>

                <div class="flex flex-col items-end min-w-[100px]">
                    <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Balance</span>
                     <div class="text-xl font-mono text-emerald-400 font-bold" id="sb-balance-display">---</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden min-h-[500px]">
                <!-- Matches Column -->
                <div class="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
                    <!-- Tabs -->
                    <div class="flex gap-2 pb-2 overflow-x-auto hide-scrollbar" id="sb-tabs">
                        <button class="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">Loading...</button>
                    </div>

                    <!-- Matches Grid -->
                    <div id="sb-matches" class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
                         <div class="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
                            <div class="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span class="text-xs text-slate-400 font-mono">Loading Markets...</span>
                         </div>
                    </div>
                </div>

                <!-- Bets Column -->
                <div class="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
                    <div class="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h3 class="font-bold text-sm uppercase tracking-widest text-white">🎫 Bet Slip</h3>
                        <span class="text-[10px] text-slate-500">Auto-Simulate Mode</span>
                    </div>
                    <div id="sb-bets" class="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        <div class="flex flex-col items-center justify-center h-40 text-slate-700 gap-3">
                            <span class="text-4xl opacity-20">📉</span>
                            <span class="text-xs font-bold">Place a bet to start simulation</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Hook into balance updates
    updateSbBalance();

    // Start Logic
    loadSportsData();
};

window.adjustSbWager = function (amount) {
    const input = document.getElementById('sb-wager-input');
    if (input) {
        let current = parseInt(input.value) || 0;
        input.value = current + amount;
    }
};

window.setSbWagerMax = function () {
    const input = document.getElementById('sb-wager-input');
    if (input && window.LocalBrokieAPI) {
        input.value = Math.floor(window.LocalBrokieAPI.getBalance());
    }
};

function updateSbBalance() {
    const el = document.getElementById('sb-balance-display');
    if (el && window.LocalBrokieAPI) {
        el.innerText = `$${window.LocalBrokieAPI.getBalance().toLocaleString()}`;
    }
}


// 2. State & Parsing Logic
const SB_API_URL = 'https://api.sportsrc.org/';
let sbActiveTab = 'american-football';

async function loadSportsData() {
    // Priority on US Sports
    const categories = ['american-football', 'basketball', 'baseball', 'ice-hockey', 'mma', 'football'];
    renderTabs(categories);

    try {
        const url = `${SB_API_URL}?data=matches&category=${sbActiveTab}`;
        // console.log(`Fetching ${url}...`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const jsonData = await response.json();

        let matchesArray = [];
        if (jsonData.success && Array.isArray(jsonData.data)) {
            matchesArray = jsonData.data;
        } else if (Array.isArray(jsonData)) {
            matchesArray = jsonData;
        }

        if (matchesArray.length > 0) {
            renderMatches(matchesArray);
        } else {
            console.warn("API empty, using mock.");
            renderMatches(getMockMatches());
        }

    } catch (err) {
        console.error("Sports Fetch Error:", err);
        renderMatches(getMockMatches());
    }
}

function renderTabs(cats) {
    const el = document.getElementById('sb-tabs');
    if (!el) return;
    el.innerHTML = '';

    // Nice labels
    const labels = {
        'american-football': 'NFL / Football',
        'basketball': 'NBA / Basketball',
        'baseball': 'MLB / Baseball',
        'ice-hockey': 'NHL / Hockey',
        'football': 'Soccer'
    };

    cats.forEach(cat => {
        const btn = document.createElement('button');
        const active = cat === sbActiveTab;

        let baseClass = "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 border flex items-center gap-2 whitespace-nowrap ";
        if (active) {
            baseClass += "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20 z-10";
        } else {
            baseClass += "bg-black/40 text-slate-500 border-white/5 hover:bg-white/5 hover:text-slate-300 hover:border-white/10";
        }

        btn.className = baseClass;

        const icons = { 'american-football': '🏈', basketball: '🏀', tennis: '🎾', baseball: '⚾', mma: '🥊', 'ice-hockey': '🏒', football: '⚽' };

        btn.innerHTML = `<span>${icons[cat] || '🏆'}</span> ${labels[cat] || cat.replace('-', ' ')}`;

        btn.onclick = () => {
            if (sbActiveTab === cat) return;
            sbActiveTab = cat;
            document.getElementById('sb-matches').innerHTML = '<div class="p-20 flex justify-center opacity-50"><div class="w-8 h-8 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent"></div></div>';
            renderTabs(cats);
            loadSportsData();
        };
        el.appendChild(btn);
    });
}

function renderMatches(matches) {
    const el = document.getElementById('sb-matches');
    if (!el) return;
    el.innerHTML = '';

    const limit = 50;
    matches.slice(0, limit).forEach((m, idx) => {
        // Parsing logic remains robust
        let homeName = m.home_team || m.home || (m.teams?.home?.name) || "Home Team";
        let awayName = m.away_team || m.away || (m.teams?.away?.name) || "Away Team";
        let homeBadge = m.teams?.home?.badge || "";
        let awayBadge = m.teams?.away?.badge || "";

        const safeHome = homeName.replace(/'/g, "\\'");
        const safeAway = awayName.replace(/'/g, "\\'");

        const timeStr = m.time || (m.date ? new Date(m.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "LIVE");
        const league = m.league || m.category || "League";

        const seed = (homeName.length + awayName.length);
        const o1 = (m.odds && m.odds.home) || (1.1 + (seed % 20) / 10).toFixed(2);
        const oX = (m.odds && m.odds.draw) || (2.5 + (seed % 10) / 10).toFixed(2);
        const o2 = (m.odds && m.odds.away) || (1.1 + (awayName.length % 20) / 10).toFixed(2);

        const card = document.createElement('div');
        // Match Card UI
        card.className = "bg-slate-800/40 border border-white/5 hover:border-white/20 p-4 rounded-xl transition-all group relative overflow-hidden";

        card.innerHTML = `
            ${homeBadge ? `<img src="${homeBadge}" class="absolute -left-6 -bottom-6 w-32 h-32 opacity-[0.05] grayscale group-hover:opacity-[0.1] transition-all duration-500">` : ''}
            
            <div class="flex justify-between items-start mb-4 relative z-10">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded">${league}</span>
                <span class="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">${timeStr}</span>
            </div>
            
            <div class="flex items-center justify-between mb-6 relative z-10 gap-4">
                <div class="flex items-center gap-3 w-[45%]">
                    ${homeBadge ? `<img src="${homeBadge}" class="w-10 h-10 object-contain drop-shadow-lg">` : '<div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs">H</div>'}
                    <span class="font-bold text-sm text-white leading-tight" title="${homeName}">${homeName}</span>
                </div>
                
                <div class="text-slate-600 text-[10px] font-bold">VS</div>
                
                <div class="flex items-center justify-end gap-3 w-[45%] text-right">
                    <span class="font-bold text-sm text-white leading-tight" title="${awayName}">${awayName}</span>
                    ${awayBadge ? `<img src="${awayBadge}" class="w-10 h-10 object-contain drop-shadow-lg">` : '<div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs">A</div>'}
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2 relative z-10">
                <button onclick="placeSbBet('${safeHome}', ${o1})" class="relative bg-slate-700/30 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 rounded-lg py-2 transition-all group/btn">
                    <div class="flex flex-col items-center justify-center leading-none gap-1">
                        <span class="text-xs font-bold text-indigo-400 group-hover/btn:text-indigo-300">${o1}</span>
                        <span class="text-[9px] text-slate-500 uppercase">Home</span>
                    </div>
                </button>
                <button onclick="placeSbBet('Draw', ${oX})" class="relative bg-slate-700/30 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg py-2 transition-all group/btn">
                    <div class="flex flex-col items-center justify-center leading-none gap-1">
                        <span class="text-xs font-bold text-white group-hover/btn:text-white">${oX}</span>
                        <span class="text-[9px] text-slate-500 uppercase">Draw</span>
                    </div>
                </button>
                <button onclick="placeSbBet('${safeAway}', ${o2})" class="relative bg-slate-700/30 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 rounded-lg py-2 transition-all group/btn">
                    <div class="flex flex-col items-center justify-center leading-none gap-1">
                        <span class="text-xs font-bold text-indigo-400 group-hover/btn:text-indigo-300">${o2}</span>
                        <span class="text-[9px] text-slate-500 uppercase">Away</span>
                    </div>
                </button>
            </div>
        `;
        el.appendChild(card);
    });
}


// 3. Betting Logic & Simulation
window.placeSbBet = function (selection, odds) {
    if (!window.LocalBrokieAPI) { alert("API Reload Required"); return; }

    // GET WAGER FROM INPUT, NOT PROMPT
    const input = document.getElementById('sb-wager-input');
    const val = parseInt(input ? input.value : 0);

    if (isNaN(val) || val <= 0) return alert("Please enter a valid wager amount.");
    if (val > window.LocalBrokieAPI.getBalance()) return alert("Insufficient Balance");

    // Execute Transaction
    window.LocalBrokieAPI.updateBalance(-val);
    window.LocalBrokieAPI.playSound('chip_place');
    updateSbBalance();

    const betId = Date.now();
    addBetToSlip(betId, selection, odds, val);

    // Simulate Result (Visual Delay)
    simulateGameOutcome(betId, selection, odds, val);
};

function addBetToSlip(id, sel, odds, amt) {
    const slip = document.getElementById('sb-bets');
    if (slip.querySelector('.text-center')) slip.innerHTML = '';

    const div = document.createElement('div');
    div.id = `bet-${id}`;
    div.className = "bg-slate-800 p-3 rounded-lg border border-white/5 mb-2 relative overflow-hidden";
    div.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <span class="font-bold text-xs text-white truncate max-w-[120px]">${sel}</span>
            <span class="bg-indigo-600/20 text-indigo-400 text-[10px] font-bold px-1.5 rounded border border-indigo-500/30">${odds}x</span>
        </div>
        <div class="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2">
            <span>Wager: $${amt}</span>
            <span class="text-emerald-500/80">Est. Win: $${(amt * odds).toFixed(0)}</span>
        </div>
        
        <!-- Progress Bar for Simulation -->
        <div class="h-1 bg-black/50 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-500 w-0 transition-all duration-[5000ms] ease-linear" id="progress-${id}"></div>
        </div>
        <div class="text-[9px] text-center text-indigo-400 mt-1 animate-pulse" id="status-${id}">
            SIMULATING GAME...
        </div>
    `;
    slip.prepend(div);

    // Start animation next frame
    setTimeout(() => {
        const bar = document.getElementById(`progress-${id}`);
        if (bar) bar.style.width = '100%';
    }, 100);
}

function simulateGameOutcome(id, sel, odds, amt) {
    // 5 second simulation delay for suspense
    setTimeout(() => {
        const div = document.getElementById(`bet-${id}`);
        if (!div) return;

        const win = Math.random() < 0.45; // 45% Win Chance
        const statusEl = document.getElementById(`status-${id}`);
        const bar = document.getElementById(`progress-${id}`);

        if (win) {
            const profit = Math.floor(amt * odds);
            window.LocalBrokieAPI.updateBalance(profit);
            window.LocalBrokieAPI.addWin('Sports', profit - amt);
            window.LocalBrokieAPI.playSound('win_small');
            updateSbBalance();

            div.className = "bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/50 mb-2 relative overflow-hidden";
            statusEl.innerText = "WINNER";
            statusEl.className = "text-[10px] text-center text-emerald-400 font-bold mt-1";
            bar.parentElement.classList.add('opacity-0');

            div.innerHTML += `<div class="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>`;
        } else {
            div.className = "bg-rose-900/30 p-3 rounded-lg border border-rose-500/30 mb-2 relative overflow-hidden opacity-75";
            statusEl.innerText = "LOSS";
            statusEl.className = "text-[10px] text-center text-rose-500 font-bold mt-1";
            bar.parentElement.classList.add('opacity-0');
        }
    }, 5000);
}

// 4. Mock Data for Fallback
function getMockMatches() {
    return [
        { home: "Kansas City Chiefs", away: "San Francisco 49ers", league: "NFL", time: "Sun 18:30", odds: { home: 1.7, draw: 14.0, away: 2.2 } },
        { home: "Los Angeles Lakers", away: "Boston Celtics", league: "NBA", time: "LIVE Q4", odds: { home: 1.9, draw: 12.0, away: 1.9 } },
        { home: "New York Yankees", away: "Boston Red Sox", league: "MLB", time: "19:05", odds: { home: 1.6, draw: 22.0, away: 2.4 } },
        { home: "Dallas Cowboys", away: "Philadelphia Eagles", league: "NFL", time: "Mon 20:15", odds: { home: 2.1, draw: 14.0, away: 1.8 } },
        { home: "Miami Heat", away: "Denver Nuggets", league: "NBA", time: "LIVE Q2", odds: { home: 2.5, draw: 12.0, away: 1.5 } },
        { home: "Buffalo Bills", away: "Miami Dolphins", league: "NFL", time: "Thu 20:15", odds: { home: 1.5, draw: 14.0, away: 2.8 } }
    ];
}
