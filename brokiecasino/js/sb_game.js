console.log("Loading sb_game.js (Premium v3 + API Fix)...");

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
        <div class="flex flex-col gap-6 w-full h-full text-slate-200">
            <!-- Header -->
            <div class="flex justify-between items-center bg-gradient-to-r from-indigo-900/40 to-black/40 border border-white/5 p-4 rounded-xl backdrop-blur-sm shadow-xl">
                <div class="flex gap-4 items-center">
                    <div class="relative">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(79,70,229,0.3)]">⚽</div>
                        <div class="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
                            <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-black"></div>
                        </div>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold text-white tracking-wide">Live Sports</h2>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                            <span class="text-emerald-400">● LIVE FEED</span>
                            <span class="text-slate-600">|</span>
                            <span>OFFICIAL ODDS</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Balance</span>
                     <div class="text-lg font-mono text-emerald-400 font-bold" id="sb-balance-display">---</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden min-h-[500px]">
                <!-- Matches Column -->
                <div class="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
                    <!-- Tabs -->
                    <div class="flex gap-2 pb-2 overflow-x-auto hide-scrollbar" id="sb-tabs">
                        <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20">Loading...</button>
                    </div>

                    <!-- Matches Grid -->
                    <div id="sb-matches" class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
                         <div class="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
                            <div class="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span class="text-xs text-slate-400 font-mono">Connecting to SportSRC Network...</span>
                         </div>
                    </div>
                </div>

                <!-- Bets Column -->
                <div class="lg:col-span-1 bg-black/40 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
                    <div class="p-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent flex justify-between items-center">
                        <h3 class="font-bold text-xs uppercase tracking-widest text-slate-300">🎫 Bet Slip</h3>
                        <span class="text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded">AUTO-APPROVE</span>
                    </div>
                    <div id="sb-bets" class="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        <div class="flex flex-col items-center justify-center h-40 text-slate-600 gap-3">
                            <span class="text-4xl opacity-10">🧾</span>
                            <span class="text-xs font-mono">Your slip is empty</span>
                        </div>
                    </div>
                    <div class="p-3 bg-white/5 text-[10px] text-slate-500 text-center border-t border-white/5 font-mono">
                        Powered by SportSRC • Instant Settlement
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

function updateSbBalance() {
    const el = document.getElementById('sb-balance-display');
    if (el && window.LocalBrokieAPI) {
        el.innerText = `$${window.LocalBrokieAPI.getBalance()}`;
    }
}


// 2. State & Parsing Logic
const SB_API_URL = 'https://api.sportsrc.org/';
let sbActiveTab = 'football';

async function loadSportsData() {
    // Categories based on API docs + fallback
    const categories = ['football', 'basketball', 'tennis', 'baseball', 'mma', 'esports'];
    renderTabs(categories);

    try {
        const url = `${SB_API_URL}?data=matches&category=${sbActiveTab}`;
        // console.log(`Fetching ${url}...`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const jsonData = await response.json();

        // --- KEY API PARSING FIX ---
        // User provided example: { success: true, data: [ ...matches... ] }
        let matchesArray = [];

        if (jsonData.success && Array.isArray(jsonData.data)) {
            matchesArray = jsonData.data;
        } else if (Array.isArray(jsonData)) {
            matchesArray = jsonData;
        }

        if (matchesArray.length > 0) {
            renderMatches(matchesArray);
        } else {
            console.warn("API returned empty array, falling back to mock data.");
            renderMatches(getMockMatches());
        }

    } catch (err) {
        console.error("Sports Fetch Error:", err);
        // Fallback to mock data so UI never breaks
        renderMatches(getMockMatches());
    }
}

function renderTabs(cats) {
    const el = document.getElementById('sb-tabs');
    if (!el) return;
    el.innerHTML = '';

    cats.forEach(cat => {
        const btn = document.createElement('button');
        const active = cat === sbActiveTab;

        // Premium Tab Styles
        let baseClass = "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-200 border flex items-center gap-2 whitespace-nowrap ";
        if (active) {
            baseClass += "bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] scale-105 z-10";
        } else {
            baseClass += "bg-black/40 text-slate-500 border-white/5 hover:bg-white/5 hover:text-slate-300 hover:border-white/10";
        }

        btn.className = baseClass;

        // Icon Mapping
        const icons = { football: '⚽', basketball: '🏀', tennis: '🎾', baseball: '⚾', mma: '🥊', esports: '🎮' };
        btn.innerHTML = `<span>${icons[cat] || '🏆'}</span> ${cat}`;

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
        // --- PARSING MATCH OBJECT ---
        // Structure: m.teams.home.name OR m.home_team OR m.home
        let homeName = "Unknown Home";
        let awayName = "Unknown Away";
        let homeBadge = "";
        let awayBadge = "";

        if (m.teams) {
            if (m.teams.home) {
                homeName = m.teams.home.name || homeName;
                homeBadge = m.teams.home.badge || "";
            }
            if (m.teams.away) {
                awayName = m.teams.away.name || awayName;
                awayBadge = m.teams.away.badge || "";
            }
        } else {
            // Fallback for flat structure or mock data
            homeName = m.home_team || m.home || homeName;
            awayName = m.away_team || m.away || awayName;
        }

        // Clean Names (remove trailing W for Women's leagues if desired, keeping for accuracy though)
        // Ensure no quotes break functions
        const safeHome = homeName.replace(/'/g, "\\'");
        const safeAway = awayName.replace(/'/g, "\\'");

        const timeStr = m.time || (m.date ? new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "LIVE");
        const league = m.league || m.category || "League";
        const isLive = String(timeStr).toLowerCase().includes('live') || (m.date && m.date < Date.now());

        // ODDS GENERATION (Since API free tier might not have real-time odds)
        // Seed random based on match ID to keep odds consistent-ish
        const seed = (homeName.length + awayName.length);
        const o1 = (m.odds && m.odds.home) || (1.1 + (seed % 20) / 10).toFixed(2);
        const oX = (m.odds && m.odds.draw) || (2.5 + (seed % 10) / 10).toFixed(2);
        const o2 = (m.odds && m.odds.away) || (1.1 + (awayName.length % 20) / 10).toFixed(2);

        const card = document.createElement('div');
        card.className = "bg-gradient-to-br from-white/5 to-black/60 border border-white/5 hover:border-indigo-500/30 p-4 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50 group relative overflow-hidden";

        // Background badge effect
        card.innerHTML = `
            ${homeBadge ? `<img src="${homeBadge}" class="absolute -left-4 -bottom-4 w-24 h-24 opacity-[0.03] grayscale group-hover:opacity-[0.07] transition-all">` : ''}
            
            <div class="flex justify-between items-start mb-3 relative z-10">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-black/40 px-2 py-1 rounded-md border border-white/5">${league}</span>
                <div class="flex items-center gap-1.5 ${isLive ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-800/50 border-white/5 text-slate-400'} px-2 py-1 rounded-md border text-[10px] font-bold">
                    ${isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>' : ''}
                    <span>${timeStr}</span>
                </div>
            </div>
            
            <div class="flex items-center justify-between mb-5 relative z-10 gap-2">
                <div class="flex items-center gap-3 w-[45%]">
                    ${homeBadge ? `<img src="${homeBadge}" class="w-8 h-8 object-contain">` : '<div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px]">H</div>'}
                    <span class="font-bold text-sm text-white leading-tight" title="${homeName}">${homeName}</span>
                </div>
                
                <div class="font-mono text-slate-700 text-xs font-bold italic">VS</div>
                
                <div class="flex items-center justify-end gap-3 w-[45%] text-right">
                    <span class="font-bold text-sm text-white leading-tight" title="${awayName}">${awayName}</span>
                    ${awayBadge ? `<img src="${awayBadge}" class="w-8 h-8 object-contain">` : '<div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px]">A</div>'}
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2 relative z-10">
                <button onclick="placeSbBet('${safeHome}', ${o1})" class="relative overflow-hidden bg-black/40 hover:bg-slate-700/50 border border-white/10 rounded-lg py-2.5 transition-all group/btn">
                    <div class="flex flex-col items-center justify-center leading-none gap-1">
                        <span class="text-[10px] text-slate-500 group-hover/btn:text-white transition-colors uppercase font-bold">1 (Home)</span>
                        <span class="text-indigo-400 font-mono font-bold group-hover/btn:text-indigo-300 transition-colors">${o1}</span>
                    </div>
                </button>
                <button onclick="placeSbBet('Draw', ${oX})" class="relative overflow-hidden bg-black/40 hover:bg-slate-700/50 border border-white/10 rounded-lg py-2.5 transition-all group/btn">
                    <div class="flex flex-col items-center justify-center leading-none gap-1">
                        <span class="text-[10px] text-slate-500 group-hover/btn:text-white transition-colors uppercase font-bold">X (Draw)</span>
                        <span class="text-slate-300 font-mono font-bold group-hover/btn:text-white transition-colors">${oX}</span>
                    </div>
                </button>
                <button onclick="placeSbBet('${safeAway}', ${o2})" class="relative overflow-hidden bg-black/40 hover:bg-slate-700/50 border border-white/10 rounded-lg py-2.5 transition-all group/btn">
                    <div class="flex flex-col items-center justify-center leading-none gap-1">
                        <span class="text-[10px] text-slate-500 group-hover/btn:text-white transition-colors uppercase font-bold">2 (Away)</span>
                        <span class="text-indigo-400 font-mono font-bold group-hover/btn:text-indigo-300 transition-colors">${o2}</span>
                    </div>
                </button>
            </div>
        `;
        el.appendChild(card);
    });
}


// 3. Betting Logic
window.placeSbBet = function (selection, odds) {
    if (!window.LocalBrokieAPI) { alert("API Error: Please refresh."); return; }

    const amount = prompt(`Place Bet on ${selection}\nOdds: ${odds}x\n\nEnter Amount:`, "100");
    if (amount === null) return;

    // Allow shorthand 'k' (e.g. 1k = 1000)
    let cleanAmt = amount.toLowerCase().replace('k', '000');
    const val = parseInt(cleanAmt);

    if (isNaN(val) || val <= 0) return alert("Invalid Amount");
    if (val > window.LocalBrokieAPI.getBalance()) return alert("Insufficient Balance");

    // Execute Transaction
    window.LocalBrokieAPI.updateBalance(-val);
    window.LocalBrokieAPI.playSound('chip_place');
    updateSbBalance();

    addBetToSlip(selection, odds, val);

    // Simulate Result (Demo Mode Physics)
    setTimeout(() => resolveSbBet(selection, odds, val), 2500);
};

function addBetToSlip(sel, odds, amt) {
    const slip = document.getElementById('sb-bets');
    // Clean empty state if present
    if (slip.children.length === 1 && slip.children[0].classList.contains('items-center')) {
        slip.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = "bg-slate-800/80 p-3 rounded-lg border-l-4 border-amber-500 mb-2 relative overflow-hidden animate-pulse shadow-lg";
    div.innerHTML = `
        <div class="absolute top-0 right-0 p-1">
             <div class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></div>
        </div>
        <div class="flex flex-col gap-1">
            <span class="font-bold text-xs text-white truncate pr-4">${sel}</span>
            <div class="flex justify-between items-center text-[10px] font-mono">
                 <span class="text-amber-400 font-bold bg-amber-500/10 px-1 rounded">@${odds}</span>
                 <span class="text-slate-400">Wager: $${amt}</span>
            </div>
            <div class="text-right text-[10px] text-indigo-300 font-bold border-t border-white/5 pt-1 mt-1">
                Potential Win: $${(amt * odds).toFixed(0)}
            </div>
        </div>
    `;
    slip.prepend(div);
}

function resolveSbBet(sel, odds, amt) {
    const slip = document.getElementById('sb-bets');
    if (!slip || !slip.firstChild) return;

    const betEl = slip.firstChild;
    betEl.classList.remove('animate-pulse');
    betEl.querySelector('.animate-ping')?.remove();

    // Win Logic (40% Win Rate for Casino Realism)
    const win = Math.random() < 0.40;

    if (win) {
        const profit = Math.floor(amt * odds);
        window.LocalBrokieAPI.updateBalance(profit);
        window.LocalBrokieAPI.addWin('Sports', profit - amt);
        window.LocalBrokieAPI.playSound('win_small');
        window.LocalBrokieAPI.showMessage(`Sports Bet WON! +$${profit}`);
        updateSbBalance();

        betEl.className = "bg-emerald-900/40 p-3 rounded-lg border-l-4 border-emerald-500 mb-2 transition-all relative overflow-hidden";
        betEl.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs text-white truncate w-2/3">${sel}</span>
                <span class="bg-emerald-500 text-black text-[9px] font-bold px-1.5 rounded-sm">WON</span>
            </div>
            <div class="text-[10px] text-emerald-300 font-mono flex justify-between">
                <span>$${amt} -> $${profit}</span>
            </div>
        `;
    } else {
        // window.LocalBrokieAPI.playSound('lose'); // Optional
        betEl.className = "bg-rose-900/20 p-3 rounded-lg border-l-4 border-rose-500/50 mb-2 opacity-60 transition-all hover:opacity-100 grayscale-[0.5]";
        betEl.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs text-slate-300 truncate w-2/3">${sel}</span>
                <span class="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 rounded-sm">LOST</span>
            </div>
            <div class="text-[10px] text-slate-500 font-mono">
                -$${amt}
            </div>
        `;
    }
}

// 4. Mock Data for Fallback
function getMockMatches() {
    return [
        { home: "Real Madrid", away: "Barcelona", league: "La Liga", time: "LIVE 88'", odds: { home: 2.1, draw: 3.2, away: 2.8 } },
        { home: "Man City", away: "Liverpool", league: "Premier League", time: "LIVE 12'", odds: { home: 1.8, draw: 3.5, away: 3.8 } },
        { home: "Lakers", away: "Celtics", league: "NBA", time: "Q3 04:20", odds: { home: 1.5, draw: 12.0, away: 2.5 } },
        { home: "Chiefs", away: "49ers", league: "NFL", time: "Sun 18:30", odds: { home: 1.7, draw: 14.0, away: 2.2 } },
        { home: "Djokovic", away: "Alcaraz", league: "Wimbledon", time: "Set 2", odds: { home: 1.4, draw: 22.0, away: 2.8 } }
    ];
}
