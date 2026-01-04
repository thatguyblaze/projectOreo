console.log("Loading sb_game.js (Premium v5 - Live Stream)...");

// 1. Define Initialization Function
window.initSports = function (API) {
    if (!API) {
        console.error("sb_game.js: BrokieAPI is missing!");
        return;
    }
    window.LocalBrokieAPI = API;

    const container = document.getElementById('game-sports');
    if (!container) return;

    // Premium UI Structure with Embedded Player
    container.innerHTML = `
        <div class="flex flex-col gap-4 w-full h-full text-slate-200 font-sans">
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-white/5 p-3 rounded-xl shadow-lg gap-4">
                <div class="flex gap-3 items-center">
                    <div class="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center text-xl border border-orange-500/30">🏈</div>
                    <div>
                        <h2 class="text-lg font-bold text-white tracking-wide">Sportsbook</h2>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                            <span class="text-rose-500 font-bold animate-pulse">● Live Stream</span>
                            <span class="text-slate-700">|</span>
                            <span>Simulated Results</span>
                        </div>
                    </div>
                </div>
                
                <!-- WAGER CONTROL -->
                <div class="flex items-center gap-3 bg-black/40 p-1.5 rounded-lg border border-white/5">
                    <div class="flex flex-col px-2 border-r border-white/5">
                        <label class="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Wager</label>
                        <div class="flex items-center gap-1">
                            <span class="text-slate-500 text-xs">$</span>
                            <input type="number" id="sb-wager-input" value="100" min="1" class="bg-transparent text-white font-mono font-bold text-sm w-16 outline-none hover:text-indigo-400 transition-colors">
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="adjustSbWager(100)" class="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors">+100</button>
                        <button onclick="setSbWagerMax()" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors">MAX</button>
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
                    
                    <!-- EMBEDDED PLAYER CONTAINER -->
                    <div id="sb-player-container" class="w-full aspect-video bg-black rounded-xl relative overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group">
                        <!-- Screen Overlay / Info -->
                        <div class="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
                            <div class="flex gap-2 items-center">
                                <span class="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
                                <h3 id="sb-stream-title" class="text-sm font-bold text-white shadow-black drop-shadow-md">Select a match to watch</h3>
                            </div>
                            <div class="flex gap-1">
                                <span class="bg-black/50 text-slate-400 text-[10px] font-mono px-1.5 rounded border border-white/10">HD</span>
                            </div>
                        </div>

                        <!-- Video Placeholder / Iframe -->
                        <div id="sb-video-embed" class="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative">
                            <!-- Background Image Mock -->
                             <img id="sb-stream-poster" src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all duration-1000">
                             
                             <div class="z-10 flex flex-col items-center gap-2">
                                <div class="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform hover:bg-white/20 hover:border-white/50" onclick="alert('Stream connection simulations active.')">
                                    <span class="text-2xl ml-1">▶</span>
                                </div>
                                <span class="text-xs text-slate-400 font-mono">Stream Feed Standby</span>
                             </div>
                        </div>
                    </div>

                    <!-- TABS & GRID -->
                    <div class="flex flex-col flex-grow overflow-hidden gap-3">
                        <div class="flex gap-2 pb-1 overflow-x-auto hide-scrollbar flex-shrink-0" id="sb-tabs">
                            <button class="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">Loading Markets...</button>
                        </div>

                        <div id="sb-matches" class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
                            <!-- Matches Injected Here -->
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: Bets -->
                <div class="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
                    <div class="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h3 class="font-bold text-sm uppercase tracking-widest text-white">🎫 Bet Slip</h3>
                        <span class="text-[10px] text-indigo-400">Simulation Mode</span>
                    </div>
                    <div id="sb-bets" class="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        <div class="flex flex-col items-center justify-center h-40 text-slate-700 gap-3">
                            <span class="text-4xl opacity-20">📉</span>
                            <span class="text-xs font-bold">Select Valid Odds</span>
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

window.watchSportsMatch = function (home, away, league) {
    const titleEl = document.getElementById('sb-stream-title');
    const container = document.getElementById('sb-player-container');
    const poster = document.getElementById('sb-stream-poster');

    if (titleEl) titleEl.innerText = `${home} vs ${away}`;

    // Scroll to top smoothly
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Visual feedback
    container.classList.remove('border-white/10');
    container.classList.add('border-indigo-500/50');
    setTimeout(() => {
        container.classList.remove('border-indigo-500/50');
        container.classList.add('border-white/10');
    }, 1000);

    // Change poster based on league randomly for variety
    if (poster) {
        poster.classList.add('opacity-0');
        setTimeout(() => {
            poster.classList.remove('opacity-0');
        }, 500);
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
    const categories = ['american-football', 'basketball', 'baseball', 'ice-hockey', 'mma', 'football'];
    renderTabs(categories);

    try {
        const url = `${SB_API_URL}?data=matches&category=${sbActiveTab}`;
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
            // Auto-watch first match
            const first = matchesArray[0];
            const h = first.home_team || first.home || first.teams?.home?.name || "Home";
            const a = first.away_team || first.away || first.teams?.away?.name || "Away";
            window.watchSportsMatch(h, a, "Highlight");
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

    const labels = {
        'american-football': 'NFL',
        'basketball': 'NBA',
        'baseball': 'MLB',
        'ice-hockey': 'NHL',
        'football': 'Soccer'
    };

    cats.forEach(cat => {
        const btn = document.createElement('button');
        const active = cat === sbActiveTab;

        let baseClass = "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 border flex items-center gap-2 whitespace-nowrap ";
        if (active) {
            baseClass += "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20";
        } else {
            baseClass += "bg-black/40 text-slate-500 border-white/5 hover:bg-white/5 hover:text-slate-300";
        }

        btn.className = baseClass;
        const icons = { 'american-football': '🏈', basketball: '🏀', tennis: '🎾', baseball: '⚾', mma: '🥊', 'ice-hockey': '🏒', football: '⚽' };
        btn.innerHTML = `<span>${icons[cat] || '🏆'}</span> ${labels[cat] || cat.replace('-', ' ')}`;

        btn.onclick = () => {
            if (sbActiveTab === cat) return;
            sbActiveTab = cat;
            document.getElementById('sb-matches').innerHTML = '<div class="p-10 flex justify-center"><div class="w-6 h-6 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent"></div></div>';
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
        card.className = "bg-slate-800/40 border border-white/5 hover:border-white/10 p-3 rounded-xl transition-all group relative overflow-hidden flex flex-col gap-3";

        // Compact Match Card
        card.innerHTML = `
            <div class="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>${league}</span>
                <button onclick="watchSportsMatch('${safeHome}','${safeAway}', '${league}')" class="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                    <span>📺</span> Watch
                </button>
            </div>
            
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 w-[40%] overflow-hidden">
                    ${homeBadge ? `<img src="${homeBadge}" class="w-6 h-6 object-contain">` : '<div class="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0"></div>'}
                    <span class="font-bold text-xs text-white truncate" title="${homeName}">${homeName}</span>
                </div>
                
                <div class="text-[9px] font-mono text-slate-600">vs</div>
                
                <div class="flex items-center justify-end gap-2 w-[40%] overflow-hidden">
                    <span class="font-bold text-xs text-white truncate text-right" title="${awayName}">${awayName}</span>
                    ${awayBadge ? `<img src="${awayBadge}" class="w-6 h-6 object-contain">` : '<div class="w-6 h-6 rounded-full bg-slate-700 flex-shrink-0"></div>'}
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
                <button onclick="placeSbBet('${safeHome}', ${o1})" class="bg-black/40 hover:bg-indigo-600/20 border border-white/5 rounded py-1.5 transition-colors flex flex-col items-center group/btn">
                    <span class="text-[10px] text-slate-500 group-hover/btn:text-indigo-200">Home</span>
                    <span class="text-xs font-bold text-indigo-400 group-hover/btn:text-white">${o1}</span>
                </button>
                <button onclick="placeSbBet('Draw', ${oX})" class="bg-black/40 hover:bg-white/5 border border-white/5 rounded py-1.5 transition-colors flex flex-col items-center group/btn">
                    <span class="text-[10px] text-slate-500">Draw</span>
                    <span class="text-xs font-bold text-slate-300 group-hover/btn:text-white">${oX}</span>
                </button>
                <button onclick="placeSbBet('${safeAway}', ${o2})" class="bg-black/40 hover:bg-indigo-600/20 border border-white/5 rounded py-1.5 transition-colors flex flex-col items-center group/btn">
                    <span class="text-[10px] text-slate-500 group-hover/btn:text-indigo-200">Away</span>
                    <span class="text-xs font-bold text-indigo-400 group-hover/btn:text-white">${o2}</span>
                </button>
            </div>
        `;
        el.appendChild(card);
    });
}


// 3. Betting Logic
window.placeSbBet = function (selection, odds) {
    if (!window.LocalBrokieAPI) { alert("API Reload Required"); return; }

    const input = document.getElementById('sb-wager-input');
    const val = parseInt(input ? input.value : 0);

    if (isNaN(val) || val <= 0) return alert("Please enter a valid wager amount.");
    if (val > window.LocalBrokieAPI.getBalance()) return alert("Insufficient Balance");

    window.LocalBrokieAPI.updateBalance(-val);
    window.LocalBrokieAPI.playSound('chip_place');
    updateSbBalance();

    const betId = Date.now();
    addBetToSlip(betId, selection, odds, val);

    simulateGameOutcome(betId, selection, odds, val);
};

function addBetToSlip(id, sel, odds, amt) {
    const slip = document.getElementById('sb-bets');
    if (slip.querySelector('.text-center')) slip.innerHTML = '';

    const div = document.createElement('div');
    div.id = `bet-${id}`;
    div.className = "bg-slate-800 p-2 rounded border border-white/5 mb-2 relative overflow-hidden";
    div.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-[10px] text-white truncate max-w-[100px]">${sel}</span>
            <span class="text-indigo-400 text-[10px] font-bold">${odds}x</span>
        </div>
        <div class="flex justify-between items-center text-[9px] text-slate-400 font-mono mb-1">
            <span>$${amt}</span>
            <span class="text-emerald-500/80">Est: $${(amt * odds).toFixed(0)}</span>
        </div>
        <div class="h-0.5 bg-black/50 rounded-full overflow-hidden w-full">
            <div class="h-full bg-indigo-500 w-0 transition-all duration-[5000ms] ease-linear" id="progress-${id}"></div>
        </div>
    `;
    slip.prepend(div);

    setTimeout(() => {
        const bar = document.getElementById(`progress-${id}`);
        if (bar) bar.style.width = '100%';
    }, 50);
}

function simulateGameOutcome(id, sel, odds, amt) {
    setTimeout(() => {
        const div = document.getElementById(`bet-${id}`);
        if (!div) return;

        const win = Math.random() < 0.45;

        if (win) {
            const profit = Math.floor(amt * odds);
            window.LocalBrokieAPI.updateBalance(profit);
            window.LocalBrokieAPI.addWin('Sports', profit - amt);
            window.LocalBrokieAPI.playSound('win_small');
            updateSbBalance();

            div.className = "bg-emerald-900/30 p-2 rounded border border-emerald-500/50 mb-2 relative";
            div.innerHTML = `<div class="text-center text-[10px] text-emerald-400 font-bold">WON +$${profit}</div>`;
        } else {
            div.className = "bg-rose-900/20 p-2 rounded border border-rose-500/20 mb-2 opacity-60";
            div.innerHTML = `<div class="text-center text-[10px] text-rose-500 font-bold">LOST -$${amt}</div>`;
        }
    }, 5000);
}

// 4. Mock Data
function getMockMatches() {
    return [
        { home: "Kansas City Chiefs", away: "San Francisco 49ers", league: "NFL", time: "Sun 18:30", odds: { home: 1.7, draw: 14.0, away: 2.2 } },
        { home: "Los Angeles Lakers", away: "Boston Celtics", league: "NBA", time: "LIVE Q4", odds: { home: 1.9, draw: 12.0, away: 1.9 } },
        { home: "New York Yankees", away: "Boston Red Sox", league: "MLB", time: "19:05", odds: { home: 1.6, draw: 22.0, away: 2.4 } },
        { home: "Dallas Cowboys", away: "Hamilton Tiger-Cats", league: "NFL", time: "Mon 20:15", odds: { home: 2.1, draw: 14.0, away: 1.8 } },
        { home: "Miami Heat", away: "Denver Nuggets", league: "NBA", time: "LIVE Q2", odds: { home: 2.5, draw: 12.0, away: 1.5 } }
    ];
}
