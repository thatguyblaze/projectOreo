console.log("Sports.js (v6 Debug) loading...");

// 1. Fail-fast Global Assignment
try {
    if (typeof window !== 'undefined') {
        window.initSports = function (API) {
            console.log("initSports (v6) executing...");
            _initSportsInternal(API);
        };
    }
} catch (err) {
    console.error("Sports.js Critical Setup Error:", err);
}

// 2. Variables
let sportsGameActive = false;
let activeSportsTab = 'football';
let availableMatches = [];
let pendingBets = [];
let LocalBrokieAPI = null;
const SPORTS_API_BASE = 'https://api.sportsrc.org/';

// DOM Elements
let sportsContainer, sportsTabsContainer, sportsMatchesGrid, sportsPendingBetsContainer;

// 3. Internal Init Logic
function _initSportsInternal(API) {
    LocalBrokieAPI = API;
    if (!LocalBrokieAPI) {
        console.error("Sports Init Failed: API Missing");
        return;
    }

    // Inject HTML
    if (assignSportsElements()) {
        fetchSportsCategories(); // Start data load
    }
}

function assignSportsElements() {
    sportsContainer = document.getElementById('game-sports');
    if (!sportsContainer) return false;

    // Safety check content
    const tabs = document.getElementById('sports-tabs');
    if (!tabs) {
        // Simple HTML Structure for now to avoid syntax risks
        sportsContainer.innerHTML = `
            <div class="flex flex-col gap-4 w-full h-full">
                <div class="flex justify-between items-center">
                    <div id="sports-tabs" class="flex gap-2 text-white">Loading...</div>
                    <button onclick="refreshSportsData()" class="px-3 py-1 bg-white/10 rounded text-xs">Refresh</button>
                </div>
                <div class="grid grid-cols-3 gap-4 h-full">
                    <div class="col-span-2 overflow-y-auto" id="sports-matches-grid">
                        <div class="text-center p-10 text-slate-500">Select a category</div>
                    </div>
                    <div class="col-span-1 bg-black/20 p-4 rounded overflow-y-auto" id="sports-pending-bets">
                         <div class="text-xs text-slate-500 text-center">No Bets</div>
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

// 4. Mock Data Fetching (Test Phase)
async function fetchSportsCategories() {
    console.log("Fetching Categories...");
    // Mock for safety first
    const mockCats = ['football', 'basketball', 'tennis'];
    sportsTabsContainer.innerHTML = '';
    mockCats.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = "px-3 py-1 rounded bg-indigo-900 border border-indigo-500 text-xs uppercase";
        btn.onclick = () => loadMatchesForCategory(cat);
        sportsTabsContainer.appendChild(btn);
    });

    // Auto load first
    loadMatchesForCategory('football');
}

async function loadMatchesForCategory(cat) {
    console.log("Loading matches for", cat);
    if (!sportsMatchesGrid) return;
    sportsMatchesGrid.innerHTML = '<div class="p-4 text-center">Loading Data...</div>';

    // Real Fetch Attempt
    try {
        const response = await fetch(`${SPORTS_API_BASE}?data=matches&category=${cat}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            availableMatches = data.slice(0, 50); // Store global
            renderMatches(availableMatches);
        } else {
            sportsMatchesGrid.innerHTML = 'Error: Invalid Data Format';
        }
    } catch (e) {
        console.error("Fetch Error:", e);
        sportsMatchesGrid.innerHTML = 'Error Loading Matches. ' + e.message;
    }
}

function renderMatches(matches) {
    sportsMatchesGrid.innerHTML = '';
    matches.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = "p-3 mb-2 bg-black/40 border border-white/10 rounded flex justify-between items-center";

        const home = m.home_team || m.home || "Home";
        const away = m.away_team || m.away || "Away";

        // Save safe odds
        m.safeOdds = {
            home: 2.0, draw: 3.0, away: 2.5
        };

        div.innerHTML = `
            <div class="flex-1 text-right text-sm font-bold pr-2">${home}</div>
            <div class="text-xs text-slate-500 px-2">VS</div>
            <div class="flex-1 text-left text-sm font-bold pl-2">${away}</div>
            <div class="ml-4 flex gap-1">
                <button onclick="placeSportsBet(${i}, 'home')" class="px-2 py-1 bg-indigo-600 rounded text-xs">1</button>
                <button onclick="placeSportsBet(${i}, 'draw')" class="px-2 py-1 bg-slate-600 rounded text-xs">x</button>
                <button onclick="placeSportsBet(${i}, 'away')" class="px-2 py-1 bg-indigo-600 rounded text-xs">2</button>
            </div>
        `;
        sportsMatchesGrid.appendChild(div);
    });
}

// 5. Global Actions
window.placeSportsBet = function (index, type) {
    const m = availableMatches[index];
    if (!m) return alert("Match Error");

    if (!LocalBrokieAPI) return alert("API Error");

    const amount = prompt("Bet Amount:", "10");
    if (amount && parseInt(amount) > 0) {
        LocalBrokieAPI.updateBalance(-parseInt(amount));
        alert("Bet Placed (Simulated)");
    }
};

window.refreshSportsData = function () {
    fetchSportsCategories();
};

console.log("Sports.js (v6 Debug) Loaded.");
