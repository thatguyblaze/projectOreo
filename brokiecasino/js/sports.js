console.log("Sports.js loading...");

/**
 * ==========================================================================
 * Brokie Casino - Live Sports Betting (v1.0)
 * Uses SportSRC API (https://api.sportsrc.org/)
 * ==========================================================================
 */

let sportsGameActive = false;
let sportsCategories = [];
let activeSportsTab = 'football';
let availableMatches = [];
let pendingBets = []; // Array of { matchId, selection, amount, price, status }

// --- DOM References ---
let sportsContainer;
let sportsTabsContainer;
let sportsMatchesGrid;
let sportsPendingBetsContainer;

// --- API Cache ---
const SPORTS_API_BASE = 'https://api.sportsrc.org/';
let LocalBrokieAPI = null;

function initSports(API) {
    console.log("initSports called!"); // Debug
    LocalBrokieAPI = API;
    if (!LocalBrokieAPI) {
        console.error("Sports Init Failed: API Missing");
        return;
    }

    if (!assignSportsElements()) return;

    fetchSportsCategories();
}

function assignSportsElements() {
    sportsContainer = document.getElementById('game-sports');
    if (!sportsContainer) return false;

    // Dynamically create internal structure if missing
    if (!document.getElementById('sports-tabs')) {
        sportsContainer.innerHTML = `
            <div class="w-full flex flex-col gap-6">
                <!-- Header / Tabs -->
                <div class="flex items-center justify-between">
                    <div id="sports-tabs" class="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                        <!-- Categories injected here -->
                        <div class="text-slate-500 text-sm animate-pulse">Loading Sports...</div>
                    </div>
                    <button class="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors" onclick="refreshSportsData()">
                        🔄 Refresh
                    </button>
                </div>

                <!-- Main Content: Matches & Bets -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full h-full min-h-[400px]">
                    
                    <!-- Matches List -->
                    <div class="lg:col-span-2 flex flex-col gap-4">
                        <div id="sports-matches-grid" class="flex flex-col gap-3 w-full max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            <!-- Matches injected here -->
                            <div class="text-center text-slate-500 py-10">Select a sport to load matches...</div>
                        </div>
                    </div>

                    <!-- Betting Slip / Active Bets -->
                    <div class="lg:col-span-1 flex flex-col gap-4">
                        <div class="bg-black/40 rounded-xl border border-white/5 p-4 h-full flex flex-col">
                            <h3 class="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-white/5 pb-2">
                                🎫 Bet Slip / Pending
                            </h3>
                            <div id="sports-pending-bets" class="flex flex-col gap-2 flex-grow overflow-y-auto max-h-[300px] custom-scrollbar">
                                <span class="text-xs text-slate-600 italic text-center mt-10">No active bets</span>
                            </div>
                            
                            <!-- Simple Info -->
                            <div class="mt-auto pt-4 text-[10px] text-slate-500 leading-relaxed">
                                <p>Odds are simulated for demo purposes.</p>
                                <p>Results update automatically based on simulation (Instant Settlement).</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    sportsTabsContainer = document.getElementById('sports-tabs');
    sportsMatchesGrid = document.getElementById('sports-matches-grid');
    sportsPendingBetsContainer = document.getElementById('sports-pending-bets');

    return true;
}

// --- Data Fetching ---

async function fetchSportsCategories() {
    try {
        const response = await fetch(`${SPORTS_API_BASE}?data=sports`);
        const data = await response.json();
        // data structure? Assuming ["football", "basketball"...] or objects
        // The quick start says ?data=matches&category=football works, so let's rely on standard ones if this fails or is complex.
        // Assuming it returns an array of Objects or Strings.

        // Fallback hardcoded list if API is strict or slow
        sportsCategories = ['football', 'basketball', 'tennis', 'baseball', 'mma', 'esports'];

        renderSportsTabs();
        loadMatchesForCategory('football'); // Default
    } catch (e) {
        console.error("Sports API Error:", e);
        // Fallback
        sportsCategories = ['football', 'basketball', 'tennis'];
        renderSportsTabs();
        loadMatchesForCategory('football');
    }
}

function renderSportsTabs() {
    sportsTabsContainer.innerHTML = '';
    sportsCategories.forEach(cat => {
        const btn = document.createElement('button');
        const isActive = cat === activeSportsTab;
        btn.className = `px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${isActive
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
            : 'bg-black/30 text-slate-500 border-white/5 hover:bg-white/5 hover:text-slate-300'
            }`;
        btn.textContent = cat;
        btn.onclick = () => {
            activeSportsTab = cat;
            renderSportsTabs(); // Re-render to update active state styling
            loadMatchesForCategory(cat);
        };
        sportsTabsContainer.appendChild(btn);
    });
}

async function loadMatchesForCategory(category) {
    if (!sportsMatchesGrid) return;
    sportsMatchesGrid.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    `;

    try {
        const response = await fetch(`${SPORTS_API_BASE}?data=matches&category=${category}`);
        const data = await response.json();

        // Data likely an array of match objects.
        // Based on doc example: match.league, match.home, match.away, etc.
        // We will filter for "Live" or "Upcoming" if possible, or just take the first 20.

        if (!Array.isArray(data) || data.length === 0) {
            sportsMatchesGrid.innerHTML = `<div class="text-center text-slate-500 py-10">No matches found for ${category}.</div>`;
            return;
        }

        availableMatches = data.slice(0, 50); // Limit to 50
        renderMatches(availableMatches);

    } catch (e) {
        console.error("Error loading matches:", e);
        sportsMatchesGrid.innerHTML = `<div class="text-center text-rose-500 py-10">Failed to load matches. API might be busy.</div>`;
    }
}

function renderMatches(matches) {
    sportsMatchesGrid.innerHTML = '';
    matches.forEach(match => {
        // Construct safe display names
        const homeName = match.home_team || match.home || "Home Team";
        const awayName = match.away_team || match.away || "Away Team";
        const league = match.league || "Unknown League";
        const timeStr = match.time || "Live";

        // Generate Simulated Odds (Deterministic based on name length to be somewhat consistent)
        // Or just random for fun since it's a "Casino" simulation
        const seed = homeName.length + awayName.length;
        const oddsHome = (1.5 + (seed % 10) / 10).toFixed(2);
        const oddsAway = (1.5 + (awayName.length % 10) / 10).toFixed(2);
        const oddsDraw = (2.5 + (league.length % 5) / 10).toFixed(2);

        const card = document.createElement('div');
        card.className = "group relative bg-black/40 border border-white/5 hover:border-indigo-500/30 rounded-xl p-4 transition-all hover:bg-black/60";

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">${league}</span>
                <div class="flex items-center gap-1 text-rose-400 text-xs font-bold">
                    ${timeStr === 'Live' ? '<span class="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span> LIVE' : timeStr}
                </div>
            </div>

            <div class="flex items-center justify-between mb-6">
                <div class="flex flex-col items-start w-1/3">
                    <span class="text-sm font-bold text-white truncate w-full text-left" title="${homeName}">${homeName}</span>
                    <span class="text-xs text-slate-500">Home</span>
                </div>
                <div class="flex flex-col items-center justify-center w-1/3 text-slate-600 font-mono text-xs">
                    <span>VS</span>
                </div>
                <div class="flex flex-col items-end w-1/3">
                    <span class="text-sm font-bold text-white truncate w-full text-right" title="${awayName}">${awayName}</span>
                    <span class="text-xs text-slate-500">Away</span>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
                <button onclick="placeSportsBet('${match.id || Math.random()}', '${homeName}', ${oddsHome})" 
                    class="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded py-2 text-xs font-mono font-bold text-indigo-300 transition-colors">
                    1 <span class="text-white ml-1">${oddsHome}</span>
                </button>
                <button onclick="placeSportsBet('${match.id || Math.random()}', 'Draw', ${oddsDraw})" 
                    class="bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded py-2 text-xs font-mono font-bold text-slate-300 transition-colors">
                    X <span class="text-white ml-1">${oddsDraw}</span>
                </button>
                <button onclick="placeSportsBet('${match.id || Math.random()}', '${awayName}', ${oddsAway})" 
                    class="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded py-2 text-xs font-mono font-bold text-indigo-300 transition-colors">
                    2 <span class="text-white ml-1">${oddsAway}</span>
                </button>
            </div>
        `;
        sportsMatchesGrid.appendChild(card);
    });
}

// Make global for onclick access
window.placeSportsBet = function (matchId, selection, odds) {
    if (!LocalBrokieAPI) return;

    // Prompt for bet amount (Simple for now)
    // Ideally we'd have a selected state and a bet slip input, but prompt is faster for v1 integration
    const amountStr = prompt(`Bet on ${selection} @ ${odds}x\nEnter Amount:`, "10");
    if (amountStr === null) return;

    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
        alert("Invalid Amount");
        return;
    }

    if (amount > LocalBrokieAPI.getBalance()) {
        alert("Insufficient Balance");
        return;
    }

    // Place Bet
    LocalBrokieAPI.updateBalance(-amount);

    // Create Bet Object
    const bet = {
        id: Date.now(),
        matchId,
        selection,
        odds: parseFloat(odds),
        amount,
        status: 'pending' // pending, won, lost
    };

    pendingBets.unshift(bet);
    renderPendingBets();

    // Simulate Result (Instant for Casino Gratification)
    // 40% Win Rate roughly
    setTimeout(() => {
        resolveBet(bet.id);
    }, 3000); // 3 seconds suspense
};

function renderPendingBets() {
    if (!sportsPendingBetsContainer) return;
    sportsPendingBetsContainer.innerHTML = '';

    if (pendingBets.length === 0) {
        sportsPendingBetsContainer.innerHTML = '<span class="text-xs text-slate-600 italic text-center mt-10">No active bets</span>';
        return;
    }

    pendingBets.forEach(bet => {
        const item = document.createElement('div');
        item.className = "bg-black/30 p-3 rounded border border-white/5 flex flex-col gap-1 text-xs relative overflow-hidden";

        // Status Color
        let statusColor = 'bg-slate-500';
        if (bet.status === 'won') statusColor = 'bg-emerald-500';
        if (bet.status === 'lost') statusColor = 'bg-rose-500';

        item.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="font-bold text-white">${bet.selection}</span>
                <span class="font-mono text-slate-400">@${bet.odds}</span>
            </div>
            <div class="flex justify-between items-center text-[10px] text-slate-500">
                <span>Stake: ${bet.amount}</span>
                <span>Pot. Win: ${(bet.amount * bet.odds).toFixed(0)}</span>
            </div>
            <div class="absolute bottom-0 left-0 h-1 ${statusColor} w-full transition-all"></div>
            ${bet.status === 'pending' ? '<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>' : ''}
        `;
        sportsPendingBetsContainer.appendChild(item);
    });
}

function resolveBet(betId) {
    const betIndex = pendingBets.findIndex(b => b.id === betId);
    if (betIndex === -1) return;

    const bet = pendingBets[betIndex];
    if (bet.status !== 'pending') return;

    // Simulate Outcome
    const isWin = Math.random() > 0.6; // 40% chance to win for House Edge

    bet.status = isWin ? 'won' : 'lost';

    if (isWin) {
        const winAmount = Math.floor(bet.amount * bet.odds);
        LocalBrokieAPI.updateBalance(winAmount);
        LocalBrokieAPI.addWin('Sports', winAmount - bet.amount);
        LocalBrokieAPI.playSound('win_small');
        LocalBrokieAPI.showMessage(`Sports Bet WON! +${winAmount}`);
    } else {
        // LocalBrokieAPI.playSound('lose'); // Optional
    }

    renderPendingBets();

    // Remove from list after a while?
    // Keep valid for history
}

window.refreshSportsData = function () {
    if (activeSportsTab) loadMatchesForCategory(activeSportsTab);
};

// Export init
if (typeof window !== 'undefined') {
    window.initSports = initSports;
    // window.refreshSportsData assigned above in code
    // window.placeSportsBet assigned above in code
}
console.log("Sports.js loaded. window.initSports:", typeof window.initSports);
