console.log("Loading sb_game.js...");

// 1. Define Initialization Function
window.initSports = function (API) {
    console.log("sb_game.js: initSports() called");

    // API Check
    if (!API) {
        console.error("sb_game.js: BrokieAPI is missing!");
        return;
    }

    // Set Global API reference
    window.LocalBrokieAPI = API;

    // Initialize UI
    const container = document.getElementById('game-sports');
    if (!container) {
        console.error("sb_game.js: Container #game-sports not found");
        return;
    }

    // Render Basic UI
    container.innerHTML = `
        <div class="flex flex-col gap-4 w-full h-full text-white">
            <div class="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <div class="flex gap-4 items-center">
                    <span class="text-2xl">⚽</span>
                    <h2 class="text-xl font-bold">Sports Betting</h2>
                </div>
                <div class="text-xs font-mono text-slate-400" id="sb-status">Ready</div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow overflow-hidden">
                <!-- Matches Column -->
                <div class="md:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
                    <div class="flex gap-2 pb-2 overflow-x-auto" id="sb-tabs">
                        <!-- Tabs will go here -->
                        <button class="px-3 py-1 bg-indigo-600 rounded text-xs pointer-events-none">Loading...</button>
                    </div>
                    <div id="sb-matches" class="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar bg-black/20 rounded-xl p-2">
                        <!-- Matches will go here -->
                         <div class="text-center p-10 text-slate-500 animate-pulse">Connecting to SportSRC...</div>
                    </div>
                </div>

                <!-- Bets Column -->
                <div class="md:col-span-1 bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-4 h-full">
                    <h3 class="font-bold border-b border-white/10 pb-2">Bet Slip</h3>
                    <div id="sb-bets" class="flex-grow overflow-y-auto space-y-2 custom-scrollbar">
                        <div class="text-center text-xs text-slate-600 mt-4">No active bets</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Start Data Load
    loadSportsData();
};

// 2. Global State & Config
const SB_API_URL = 'https://api.sportsrc.org/';
let sbActiveTab = 'football';

// 3. Logic Functions
async function loadSportsData() {
    const statusEl = document.getElementById('sb-status');
    const matchesEl = document.getElementById('sb-matches');

    if (statusEl) statusEl.textContent = 'Fetching Data...';

    // Mock Categories for robustness (in case API fails categories endpoint)
    const categories = ['football', 'basketball', 'tennis', 'baseball'];
    renderTabs(categories);

    // Fetch Matches
    try {
        const url = `${SB_API_URL}?data=matches&category=${sbActiveTab}`;
        console.log(`sb_game.js: Fetching ${url}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const jsonData = await response.json();
        console.log("sb_game.js: Data received", jsonData);

        if (statusEl) statusEl.textContent = 'Live';

        let matchesArray = [];
        // Handle API structure: {"success": true, "data": [...]} vs direct array
        if (Array.isArray(jsonData)) {
            matchesArray = jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
            matchesArray = jsonData.data;
        }

        if (matchesArray.length > 0) {
            renderMatches(matchesArray.slice(0, 50));
        } else {
            console.warn("sb_game.js: Data is not an array, using mock data for demo.");
            renderMatches(getMockMatches());
        }

    } catch (err) {
        console.error("sb_game.js: Fetch Error", err);
        if (statusEl) statusEl.textContent = 'Offline (Demo Mode)';
        if (matchesEl) matchesEl.innerHTML = `
            <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded text-rose-200 text-xs mb-4">
                Connection Failed: ${err.message}. Switching to offline demo.
            </div>
        `;
        // Fallback to mock data so the UI works
        setTimeout(() => renderMatches(getMockMatches()), 1000);
    }
}

function renderTabs(cats) {
    const el = document.getElementById('sb-tabs');
    if (!el) return;
    el.innerHTML = '';
    cats.forEach(cat => {
        const btn = document.createElement('button');
        const active = cat === sbActiveTab;
        btn.className = `px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'
            }`;
        btn.textContent = cat;
        btn.onclick = () => {
            sbActiveTab = cat;
            renderTabs(cats); // Upgrade active class
            loadSportsData();
        };
        el.appendChild(btn);
    });
}

function renderMatches(matches) {
    const el = document.getElementById('sb-matches');
    if (!el) return;
    el.innerHTML = '';

    if (matches.length === 0) {
        el.innerHTML = '<div class="p-4 text-center text-slate-500">No matches found.</div>';
        return;
    }

    matches.forEach((m, idx) => {
        // Safe accessors
        const home = m.home_team || m.home || "Team A";
        const away = m.away_team || m.away || "Team B";
        const time = m.time || "Live";
        const league = m.league || "League";

        // Generate pseudo-random odds if missing
        const o1 = (m.odds && m.odds.home) || (1.5 + Math.random()).toFixed(2);
        const oX = (m.odds && m.odds.draw) || (2.5 + Math.random()).toFixed(2);
        const o2 = (m.odds && m.odds.away) || (1.5 + Math.random()).toFixed(2);

        const card = document.createElement('div');
        card.className = "bg-black/40 border border-white/5 p-3 rounded-lg hover:border-indigo-500/50 transition-colors group";
        card.innerHTML = `
            <div class="flex justify-between mb-2">
                <span class="text-[10px] bg-white/10 px-1 rounded text-slate-400">${league}</span>
                <span class="text-[10px] text-rose-400 font-bold animate-pulse">${time}</span>
            </div>
            <div class="flex justify-between items-center mb-3">
                <div class="font-bold text-sm w-1/3 truncate" title="${home}">${home}</div>
                <div class="text-xs text-slate-600 font-mono">vs</div>
                <div class="font-bold text-sm w-1/3 truncate text-right" title="${away}">${away}</div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <button onclick="placeSbBet('${home}', ${o1})" class="py-1 bg-white/5 hover:bg-indigo-600/50 rounded text-xs border border-white/10 transition-colors flex justify-between px-2">
                    <span>1</span> <span class="font-mono text-indigo-300 group-hover:text-white">${o1}</span>
                </button>
                <button onclick="placeSbBet('Draw', ${oX})" class="py-1 bg-white/5 hover:bg-indigo-600/50 rounded text-xs border border-white/10 transition-colors flex justify-between px-2">
                    <span>X</span> <span class="font-mono text-indigo-300 group-hover:text-white">${oX}</span>
                </button>
                <button onclick="placeSbBet('${away}', ${o2})" class="py-1 bg-white/5 hover:bg-indigo-600/50 rounded text-xs border border-white/10 transition-colors flex justify-between px-2">
                    <span>2</span> <span class="font-mono text-indigo-300 group-hover:text-white">${o2}</span>
                </button>
            </div>
        `;
        el.appendChild(card);
    });
}


// 4. Betting Logic (Global exposure)
window.placeSbBet = function (selection, odds) {
    if (!window.LocalBrokieAPI) { alert("System Error: API not linked."); return; }

    const amount = prompt(`Bet on ${selection} @ ${odds}?\nEnter Amount:`, "10");
    if (!amount) return;
    const val = parseInt(amount);

    if (isNaN(val) || val <= 0) { alert("Invalid amount"); return; }
    if (val > window.LocalBrokieAPI.getBalance()) { alert("Insufficient funds"); return; }

    // Place
    window.LocalBrokieAPI.updateBalance(-val);
    window.LocalBrokieAPI.playSound('chip_place');

    // Add to slip
    addBetToSlip(selection, odds, val);

    // Outcome
    setTimeout(() => {
        resolveSbBet(selection, odds, val);
    }, 2500);
};

function addBetToSlip(sel, odds, amt) {
    const slip = document.getElementById('sb-bets');
    if (!slip) return;

    // Clear "empty" msg
    if (slip.querySelector('.text-center')) slip.innerHTML = '';

    const div = document.createElement('div');
    div.className = "bg-slate-800/50 p-2 rounded text-xs border-l-2 border-amber-500 mb-2 animate-pulse";
    div.innerHTML = `
        <div class="flex justify-between font-bold"><span>${sel}</span> <span>${odds}</span></div>
        <div class="text-slate-400">Wager: ${amt}</div>
        <div class="text-right text-indigo-400">Potential: ${(amt * odds).toFixed(0)}</div>
    `;
    slip.prepend(div);
}

function resolveSbBet(sel, odds, amt) {
    const win = Math.random() > 0.5; // Coinflip logic for demo

    if (win) {
        const profit = Math.floor(amt * odds);
        window.LocalBrokieAPI.updateBalance(profit);
        window.LocalBrokieAPI.addWin('Sports', profit - amt);
        window.LocalBrokieAPI.playSound('win_small');
        window.LocalBrokieAPI.showMessage(`Sports Win: +${profit}`);
    }

    // Update slip visual (not implemented for complexity, just demo loop)
    const slip = document.getElementById('sb-bets');
    if (slip && slip.firstChild) {
        slip.firstChild.classList.remove('animate-pulse');
        slip.firstChild.classList.remove('border-amber-500');
        slip.firstChild.classList.add(win ? 'border-emerald-500' : 'border-rose-500');
        slip.firstChild.classList.add(win ? 'bg-emerald-900/20' : 'bg-rose-900/20');

        // Add Result Badge
        const badge = document.createElement('div');
        badge.className = `text-[10px] font-bold text-center mt-1 ${win ? 'text-emerald-400' : 'text-rose-400'}`;
        badge.textContent = win ? 'WON' : 'LOST';
        slip.firstChild.appendChild(badge);
    }
}

// 5. Mock Data Gen
function getMockMatches() {
    return [
        { home: "Man City", away: "Liverpool", league: "Premier League", time: "LIVE 45'" },
        { home: "Real Madrid", away: "Barcelona", league: "La Liga", time: "20:00" },
        { home: "Lakers", away: "Warriors", league: "NBA", time: "LIVE Q3" },
        { home: "Chiefs", away: "Bills", league: "NFL", time: "Sun 18:30" }
    ];
}

console.log("sb_game.js loaded successfully.");
