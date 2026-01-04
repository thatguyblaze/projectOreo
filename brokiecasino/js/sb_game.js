console.log("Loading sb_game.js (Real Sports Betting v1.2 RemoteStreams)...");

/* ==========================================================================
   GLOBAL STATE & INIT
   ========================================================================== */
window.sb_bets = []; // Local state for tickets
window.sb_active_tab = 'live'; // 'live', 'pending', 'settled'

window.initSports = function (API) {
    if (!API) {
        console.error("sb_game.js: BrokieAPI is missing!");
        return;
    }
    window.LocalBrokieAPI = API;

    // Load persisted bets
    loadBets();

    const container = document.getElementById('game-sports');
    if (!container) return;

    // Render Main Layout
    container.innerHTML = `
        <div class="flex flex-col gap-4 w-full h-full text-slate-200 font-sans">
            <!-- HEADER -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-white/5 p-3 rounded-xl shadow-lg gap-4">
                <div class="flex gap-3 items-center">
                    <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-xl border border-white/10 shadow-lg">
                        📺
                    </div>
                    <div>
                        <h2 class="text-lg font-bold text-white tracking-wide">Live Sports</h2>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                            <span class="text-rose-500 font-bold animate-pulse">● LIVE</span>
                            <span class="text-slate-700">|</span>
                            <span>Sportsbook</span>
                        </div>
                    </div>
                </div>
                
                <!-- WAGER CONTROL -->
                <div class="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 shadow-inner">
                    <div class="flex items-center gap-1">
                        <button onclick="adjustSbWager(-10)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">-10</button>
                        <button onclick="adjustSbWager(-1)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-400 border border-white/5 transition-colors">-</button>
                    </div>
                    <div class="relative group">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                        <input type="number" id="sb-wager-input" value="10" min="1" class="w-20 h-8 bg-black/50 border border-white/5 rounded text-center text-white font-bold text-sm pl-3 focus:border-indigo-500 outline-none transition-colors">
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="adjustSbWager(1)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-sm font-bold text-slate-400 border border-white/5 transition-colors">+</button>
                        <button onclick="adjustSbWager(10)" class="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 border border-white/5 transition-colors">+10</button>
                    </div>
                    <div class="w-px h-6 bg-white/10 mx-1"></div>
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
            
            <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-grow overflow-hidden min-h-[600px]">
                
                <!-- LEFT: Stream & Matches -->
                <div class="xl:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                    
                    <!-- VIDEO PLAYER -->
                    <div id="sb-player-container" class="w-full aspect-video bg-black rounded-xl relative overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group">
                        <!-- Header Overlay -->
                        <div class="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/90 to-transparent z-20 flex justify-between items-start pointer-events-none transition-opacity opacity-0 group-hover:opacity-100">
                            <div class="flex gap-4 items-center">
                                <span class="bg-rose-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                                </span>
                                <h3 id="sb-stream-title" class="text-sm font-bold text-white shadow-black drop-shadow-md">Select a match</h3>
                            </div>
                            
                            <!-- Custom Link Input (Pointer Events Enabled) -->
                            <div class="pointer-events-auto flex items-center gap-2 bg-black/60 rounded p-1 backdrop-blur border border-white/10">
                                <input type="text" id="sb-custom-url" placeholder="Paste stream link..." class="bg-transparent border-none outline-none text-[10px] text-white w-32 placeholder-slate-500">
                                <button onclick="loadCustomStream()" class="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded transition-colors">Load</button>
                            </div>
                        </div>

                        <div class="w-full h-full bg-slate-900 relative">
                            <iframe id="sb-video-frame" class="w-full h-full object-cover" src="about:blank" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
                            
                            <!-- Standby/Placeholder -->
                            <div id="sb-video-placeholder" class="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center pointer-events-none z-10">
                                <img src="https://images.unsplash.com/photo-1570498839593-e565b39455fc?q=80&w=1000&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-20">
                                <div class="z-10 bg-black/50 p-6 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                                    <div class="text-4xl mb-2">📡</div>
                                    <div class="font-bold text-white">Stream Standby</div>
                                    <div class="text-xs text-slate-400 mt-1">Select a Live Game below</div>
                                    <div class="text-[9px] text-slate-500 mt-2">or paste a custom link above</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TABS & MATCHES -->
                    <div class="flex flex-col flex-grow overflow-hidden gap-3">
                        <div class="flex gap-2 pb-1 overflow-x-auto hide-scrollbar flex-shrink-0" id="sb-tabs"></div>
                        <div id="sb-matches" class="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10"></div>
                    </div>
                </div>

                <!-- RIGHT: Slip -->
                <div class="xl:col-span-1 bg-slate-900/50 border border-white/5 rounded-xl flex flex-col h-full overflow-hidden shadow-xl">
                    <div class="p-3 border-b border-white/5 bg-black/20 flex flex-col gap-3">
                        <div class="flex justify-between items-center">
                             <h3 class="font-bold text-sm uppercase tracking-widest text-white">Slip</h3>
                             <span class="text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded" id="sb-bets-count">0 Bets</span>
                        </div>
                        
                        <!-- SLIP TABS -->
                        <div class="flex bg-black/30 p-1 rounded-lg">
                            <button onclick="switchSbSlipTab('live')" id="sb-tab-live" class="flex-1 py-1 px-2 text-[10px] font-bold rounded text-white bg-indigo-600 transition-all">Start (Live)</button>
                            <button onclick="switchSbSlipTab('pending')" id="sb-tab-pending" class="flex-1 py-1 px-2 text-[10px] font-bold rounded text-slate-500 hover:text-white transition-all">Pending</button>
                            <button onclick="switchSbSlipTab('settled')" id="sb-tab-settled" class="flex-1 py-1 px-2 text-[10px] font-bold rounded text-slate-500 hover:text-white transition-all">Settled</button>
                        </div>
                    </div>
                    
                    <div id="sb-bets" class="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        <!-- Bets injected here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    updateSbBalance();

    // START
    renderCategoryTabs();
    renderSbSlip(); // Initial render of bets

    // Resume Simulations for any bets that were 'LIVE' when saved
    window.sb_bets.forEach(b => {
        if (b.status === 'LIVE' && !b.resolved) {
            runLiveGameSimulation(b.id, b.selection, b.odds, b.wager);
        }
    });

    loadSportSRC('american-football');
};


/* ==========================================================================
   PERSISTENCE & STATE
   ========================================================================== */
function loadBets() {
    const saved = localStorage.getItem('brokie_sb_bets');
    if (saved) {
        try { window.sb_bets = JSON.parse(saved); } catch (e) { window.sb_bets = []; }
    }
}

function saveBets() {
    localStorage.setItem('brokie_sb_bets', JSON.stringify(window.sb_bets));
    renderSbSlip();
}

window.switchSbSlipTab = function (tab) {
    window.sb_active_tab = tab;
    // Update visual tabs
    ['live', 'pending', 'settled'].forEach(t => {
        const btn = document.getElementById(`sb-tab-${t}`);
        if (btn) {
            if (t === tab) btn.className = "flex-1 py-1 px-2 text-[10px] font-bold rounded text-white bg-indigo-600 shadow-lg";
            else btn.className = "flex-1 py-1 px-2 text-[10px] font-bold rounded text-slate-500 hover:text-white hover:bg-white/5";
        }
    });
    renderSbSlip();
}

/* ==========================================================================
   DATA & RENDERING
   ========================================================================== */
const SPORTS_CATS = [
    { id: 'american-football', label: 'NFL', icon: '🏈' },
    { id: 'basketball', label: 'NBA', icon: '🏀' },
    { id: 'baseball', label: 'MLB', icon: '⚾' },
    { id: 'hockey', label: 'NHL', icon: '🏒' },
    { id: 'fight', label: 'UFC', icon: '🥊' },
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
        btn.className = `px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap border flex items-center gap-2 ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-black/40 text-slate-500 border-white/5 hover:bg-white/5 hover:text-white'
            }`;
        btn.innerHTML = `<span>${cat.icon}</span> ${cat.label}`;
        btn.onclick = () => { activeCatId = cat.id; renderCategoryTabs(); loadSportSRC(cat.id); };
        el.appendChild(btn);
    });
}

// Helper to fetch logos
function getTeamLogo(teamName, category) {
    const lower = teamName.toLowerCase();
    if (category === 'american-football' || category === 'nfl') {
        const nflTeams = { 'chiefs': 'kc', 'ravens': 'bal', 'bills': 'bf', '49ers': 'sf', 'cowboys': 'dal', 'eagles': 'phi', 'packers': 'gb', 'steelers': 'pit', 'bengals': 'cin', 'browns': 'cle' };
        for (let k in nflTeams) { if (lower.includes(k)) return `https://a.espncdn.com/i/teamlogos/nfl/500/${nflTeams[k]}.png`; }
        return "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png";
    }
    if (category === 'basketball' || category === 'nba') {
        const nbaTeams = { 'lakers': 'lal', 'warriors': 'gs', 'celtics': 'bos', 'heat': 'mia', 'bulls': 'chi', 'knicks': 'ny' };
        for (let k in nbaTeams) { if (lower.includes(k)) return `https://a.espncdn.com/i/teamlogos/nba/500/${nbaTeams[k]}.png`; }
        return "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png";
    }
    if (category === 'fight' || category === 'ufc') {
        return "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/2560px-UFC_Logo.svg.png";
    }
    return null;
}

async function loadSportSRC(categoryId) {
    const matchesEl = document.getElementById('sb-matches');
    if (matchesEl) matchesEl.innerHTML = `<div class="p-20 text-center opacity-50"><div class="animate-spin text-2xl">⏳</div></div>`;

    try {
        let apiCat = categoryId === 'ufc' ? 'fight' : categoryId;
        const url = `https://api.sportsrc.org/?data=matches&category=${apiCat}`;
        const response = await fetch(url);

        let matches = [];
        if (response.ok) {
            const jsonData = await response.json();
            if (jsonData && jsonData.success && Array.isArray(jsonData.data)) { matches = jsonData.data; }
            else if (jsonData && Array.isArray(jsonData)) { matches = jsonData; }
            else if (jsonData && Array.isArray(jsonData.data)) { matches = jsonData.data; }
        }

        if (!matches) matches = [];

        if (matches.length > 0) {
            renderMatches(matches, categoryId);
        } else {
            renderMatches(generateMockLiveGames(categoryId), categoryId);
        }

    } catch (err) {
        console.error("SportSRC Error:", err);
        renderMatches(generateMockLiveGames(categoryId), categoryId);
    }
}

function renderMatches(matches, catId) {
    const el = document.getElementById('sb-matches');
    if (!el) return;
    el.innerHTML = '';

    matches.slice(0, 50).forEach((m, idx) => {
        try {
            // ADVANCED PARSING LAYER v4
            // Helper to extract string name
            const getName = (val) => {
                if (!val) return null;
                if (typeof val === 'string' && val.trim().length > 1) return val;
                if (typeof val === 'object' && val.name) return val.name;
                if (typeof val === 'object' && val.team_name) return val.team_name;
                if (typeof val === 'object' && val.player_name) return val.player_name;
                return null;
            };

            // 1. Array/Object Checks (participants, teams, competitors)
            let homeName = getName(m.home_team) || getName(m.home) || getName(m.team1) || getName(m.player_1) || getName(m.fighter_1);
            let awayName = getName(m.away_team) || getName(m.away) || getName(m.team2) || getName(m.player_2) || getName(m.fighter_2);

            // Deep Nested Checks
            if (!homeName) homeName = (m.teams && getName(m.teams.home)) || (m.competitors && getName(m.competitors[0])) || (m.participants && getName(m.participants[0]));
            if (!awayName) awayName = (m.teams && getName(m.teams.away)) || (m.competitors && getName(m.competitors[1])) || (m.participants && getName(m.participants[1]));

            // 2. Title Parsing (Fallback)
            if (!homeName || !awayName) {
                const titleCandidates = [m.name, m.title, m.match_name, m.event, m.summary];
                const validTitle = titleCandidates.find(t => t && typeof t === 'string' && (t.includes(' vs ') || t.includes(' v ') || t.includes(' - ') || t.includes(' @ ')));

                if (validTitle) {
                    let clean = validTitle.replace(/ v /i, ' vs ').replace(/ - /g, ' vs ').replace(/ @ /g, ' vs ');
                    clean = clean.replace(/^(UFC\s?\d*\s*:?|NFL\s*:?|NBA\s*:?|Week\s?\d+\s*:?)/i, '').trim();

                    const parts = clean.split(' vs ');
                    if (parts.length >= 2) {
                        homeName = parts[0].trim();
                        awayName = parts[1].trim();
                    } else {
                        // If split fails but we have a title, use title as Home and "Field" as Away temporarily?
                        // Or just show title as Home and "-" as Away to avoid TBD.
                        homeName = clean;
                        awayName = "";
                    }
                }
            }

            // 3. Last Resort: Show Object Keys for Debugging only if TBD
            if (!homeName || homeName === 'TBD Home') {
                // Debug: Show keys to identify where data is hiding
                homeName = m.name || m.title || "Unknown (" + Object.keys(m).join(',').substring(0, 20) + "...)";
            }
            if (!awayName || awayName === 'TBD Away') awayName = "Field";

            // Cleanup
            if (homeName && homeName.includes(":")) homeName = homeName.split(":").pop().trim();
            if (awayName && awayName.includes(":")) awayName = awayName.split(":").pop().trim();

            // 4. STRICT LIVE CHECK & TIME WINDOW FAILSAFE
            const statusRaw = (m.status || m.time || "").toString().toLowerCase();
            let isLive = (
                statusRaw === 'live' ||
                statusRaw === 'in progress' ||
                statusRaw.includes('q1') || statusRaw.includes('q2') || statusRaw.includes('q3') || statusRaw.includes('q4') ||
                (statusRaw.includes('half') && !statusRaw.includes('final')) ||
                (m.is_live === true)
            ) && !statusRaw.includes('not') && !statusRaw.includes('final') && !statusRaw.includes('finished');

            // TIME WINDOW OVERRIDE: If the game started < 3 hours ago and isn't marked finished, assume LIVE.
            // This fixes APIs that are slow to update the "status" text field.
            if (!isLive) {
                const rawTime = m.time || m.start || m.date || m.timestamp;
                if (rawTime) {
                    // Parse timestamp (seconds or string)
                    const d = new Date((typeof rawTime === 'string' && /^\d+$/.test(rawTime)) ? parseInt(rawTime) * 1000 : rawTime);
                    if (!isNaN(d.getTime())) {
                        const now = new Date();
                        const diffMinutes = (now - d) / 1000 / 60;
                        // If started between 0 and 180 minutes ago (3 hours)
                        if (diffMinutes > 0 && diffMinutes < 180) {
                            isLive = true;
                        }
                    }
                }
            }

            // Logo Parsing: distinct logic for API provided vs generated
            let homeLogo = m.home_team_logo || m.home_logo || (m.teams?.home?.logo) || (m.teams?.home?.badge) || getTeamLogo(homeName, catId);
            let awayLogo = m.away_team_logo || m.away_logo || (m.teams?.away?.logo) || (m.teams?.away?.badge) || getTeamLogo(awayName, catId);

            // Final Fallback for logos
            if (!homeLogo) homeLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(homeName)}&background=333&color=fff&rounded=true`;
            if (!awayLogo) awayLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(awayName)}&background=333&color=fff&rounded=true`;

            // Extract Odds
            let o1 = 1.90, oX = 3.50, o2 = 1.90;
            if (m.odds) {
                o1 = parseFloat(m.odds.home || m.odds['1']) || 1.90;
                oX = parseFloat(m.odds.draw || m.odds['x']) || 3.50;
                o2 = parseFloat(m.odds.away || m.odds['2']) || 1.90;
            } else {
                const seed = (String(homeName).length + String(awayName).length + idx);
                o1 = (1.5 + (seed % 10) / 10).toFixed(2);
                o2 = (1.5 + (seed % 8) / 10).toFixed(2);
            }

            // Status & Time
            const league = m.league || m.category || catId.toUpperCase();
            // Generate Readable Date
            let dateDisplay = "UPCOMING";
            if (!isLive) {
                // Try Parse m.time (often string like "2023-10-10 20:00" or unix)
                const rawTime = m.time || m.start || m.date || m.timestamp;
                if (rawTime) {
                    // If rawTime is strictly numeric digits, treat strings as numbers (unix timestamp)
                    const d = new Date((typeof rawTime === 'string' && /^\d+$/.test(rawTime)) ? parseInt(rawTime) * 1000 : rawTime);

                    if (!isNaN(d.getTime())) {
                        const now = new Date();
                        const isToday = now.toDateString() === d.toDateString();
                        // Check if it's tomorrow
                        const tomorrow = new Date(now);
                        tomorrow.setDate(now.getDate() + 1);
                        const isTomorrow = tomorrow.toDateString() === d.toDateString();

                        const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                        if (isToday) dateDisplay = `Today • ${timeStr}`;
                        else if (isTomorrow) dateDisplay = `Tomorrow • ${timeStr}`;
                        else dateDisplay = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + " • " + timeStr;
                    } else {
                        // Fallback if string is specific text/format we cant parse automatically
                        dateDisplay = String(rawTime).replace("T", " ");
                    }
                }
            }

            // Provide a rich object to the button
            const matchData = {
                id: m.id || idx,
                home: homeName,
                away: awayName,
                isLive: isLive,
                date: dateDisplay,
                league: league
            };
            const matchJson = JSON.stringify(matchData).replace(/"/g, '&quot;');

            // STREAM PARSING (Official / Fallback)
            // Just check existence of known fields to show green icon, but real fetch happens on click
            const possibleStream = m.stream_url || m.embed_url || m.video_url || m.stream || m.server1;
            const isOfficialStream = !!possibleStream;

            // Render
            const card = document.createElement('div');
            card.className = "bg-slate-800/40 border border-white/5 hover:border-indigo-500/30 p-4 rounded-xl transition-all group relative overflow-hidden flex flex-col gap-3";

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex flex-col gap-1">
                        <div class="flex gap-2 items-center">
                            <span class="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">${league}</span>
                             ${isLive
                    ? '<span class="text-[9px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded animate-pulse">● LIVE</span>'
                    : `<span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 tracking-tight">📅 ${dateDisplay}</span>`
                }
                        </div>
                    </div>
                    <button onclick="watchSportsStream('${m.id}', '${catId}', '${homeName} vs ${awayName}')" class="text-[10px] font-bold ${isOfficialStream ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'} hover:text-white flex items-center gap-1 px-2 py-1 rounded transition-colors border">
                        ${isOfficialStream ? '📡 API Stream' : '📺 Watch Stream'}
                    </button>
                </div>
                
                <div class="flex items-center justify-between gap-4">
                    <div class="w-[40%] flex flex-col items-center gap-2">
                        <img src="${homeLogo}" class="w-10 h-10 object-contain drop-shadow-md">
                        <span class="font-bold text-sm text-white leading-tight block truncate text-center w-full" title="${homeName}">${homeName}</span>
                    </div>
                    <div class="text-[10px] font-mono text-slate-600 font-bold">VS</div>
                    <div class="w-[40%] flex flex-col items-center gap-2">
                        <img src="${awayLogo}" class="w-10 h-10 object-contain drop-shadow-md">
                        <span class="font-bold text-sm text-white leading-tight block truncate text-center w-full" title="${awayName}">${awayName}</span>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-2">
                    <button onclick="placeBet(${matchJson}, '${homeName.replace(/'/g, "\\'")}', ${o1}, '1')" class="bg-black/40 hover:bg-white/5 border border-white/5 rounded py-2 flex flex-col items-center">
                        <span class="text-[10px] text-slate-500">Home</span>
                        <span class="text-xs font-bold text-indigo-400">${o1}</span>
                    </button>
                    ${catId === 'fight' ? '' : `
                    <button onclick="placeBet(${matchJson}, 'Draw', ${oX}, 'X')" class="bg-black/40 hover:bg-white/5 border border-white/5 rounded py-2 flex flex-col items-center">
                        <span class="text-[10px] text-slate-500">Draw</span>
                        <span class="text-xs font-bold text-slate-400">${oX}</span>
                    </button>`}
                    <button onclick="placeBet(${matchJson}, '${awayName.replace(/'/g, "\\'")}', ${o2}, '2')" class="bg-black/40 hover:bg-white/5 border border-white/5 rounded py-2 flex flex-col items-center">
                        <span class="text-[10px] text-slate-500">Away</span>
                        <span class="text-xs font-bold text-indigo-400">${o2}</span>
                    </button>
                </div>
            `;
            el.appendChild(card);
        } catch (e) { console.warn("Match render skipped:", e); }
    });
}

function generateMockLiveGames(catId) {
    if (catId === 'fight') return [
        { id: 'mock1', home: "Jon Jones", away: "Stipe Miocic", league: "UFC 300", odds: { home: 1.5, away: 2.6 }, status: "LIVE" },
        { id: 'mock2', home: "Sean O'Malley", away: "Chito Vera", league: "UFC Main", odds: { home: 1.7, away: 2.1 }, status: "Upcoming" }
    ];
    return [
        { id: 'mock3', home: "Kansas City Chiefs", away: "Buffalo Bills", league: "NFL", odds: { home: 1.80, draw: 15.0, away: 2.10 }, status: "Upcoming", time: Date.now() + 86400000 },
        { id: 'mock4', home: "Golden State Warriors", away: "LA Lakers", league: "NBA", odds: { home: 1.50, draw: 12.0, away: 2.80 }, status: "LIVE Q4" }
    ];
}


/* ==========================================================================
   BETTING ENGINE (REAL/PENDING)
   ========================================================================== */
window.placeBet = function (match, selection, odds, pick) {
    if (!window.LocalBrokieAPI) { alert("API Error"); return; }

    // 1. Balance Check
    const input = document.getElementById('sb-wager-input');
    const wager = parseInt(input ? input.value : 0);
    if (!wager || wager <= 0) return alert("Enter Wager");
    if (wager > window.LocalBrokieAPI.getBalance()) return alert("Insufficient Funds");

    // 2. Determine State
    // If game is LIVE, bet is 'live'. If upcoming, bet is 'pending'.
    const status = match.isLive ? 'LIVE' : 'PENDING';

    // 3. Create Ticket
    const bet = {
        id: Date.now(),
        matchId: match.id,
        matchName: `${match.home} vs ${match.away}`,
        selection: selection,
        odds: odds,
        wager: wager,
        potentialWin: Math.floor(wager * odds),
        status: status, // LIVE, PENDING, WON, LOST
        date: match.date,
        resolved: false,
        timestamp: Date.now()
    };

    // 4. Deduct & Save
    window.LocalBrokieAPI.updateBalance(-wager);
    window.LocalBrokieAPI.playSound('chip_place');
    window.updateSbBalance();

    window.sb_bets.unshift(bet);
    saveBets();

    // 5. UX Feedback
    window.sb_active_tab = status.toLowerCase(); // Switch to relevant tab
    if (status === 'PENDING') window.sb_active_tab = 'pending';

    // Update Tab UI
    window.switchSbSlipTab(window.sb_active_tab);

    // 6. If LIVE, Start Simulation immediately
    if (status === 'LIVE') {
        runLiveGameSimulation(bet.id, bet.selection, bet.odds, bet.wager);
    }
};

// Renders the bets based on active Tab
function renderSbSlip() {
    const el = document.getElementById('sb-bets');
    const countEl = document.getElementById('sb-bets-count');
    if (!el) return;

    // Filter
    let betsToShow = [];
    if (window.sb_active_tab === 'live') betsToShow = window.sb_bets.filter(b => b.status === 'LIVE');
    if (window.sb_active_tab === 'pending') betsToShow = window.sb_bets.filter(b => b.status === 'PENDING');
    if (window.sb_active_tab === 'settled') betsToShow = window.sb_bets.filter(b => b.status === 'WON' || b.status === 'LOST');

    if (countEl) countEl.innerText = `${window.sb_bets.filter(b => !b.resolved).length} Open`;

    el.innerHTML = '';
    if (betsToShow.length === 0) {
        el.innerHTML = `<div class="flex flex-col items-center justify-center h-40 text-slate-700 gap-3"><span class="text-4xl opacity-20">📝</span><span class="text-xs font-bold text-slate-500">No bets in ${window.sb_active_tab}</span></div>`;
        return;
    }

    betsToShow.forEach(bet => {
        const ticket = document.createElement('div');
        ticket.className = "bg-slate-800 p-3 rounded border border-white/5 relative group animate-in fade-in slide-in-from-right duration-300";

        let statusBadge = '';
        if (bet.status === 'LIVE') statusBadge = `<div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> <span class="text-rose-500 font-bold">LIVE</span></div>`;
        if (bet.status === 'PENDING') statusBadge = `<div class="flex items-center gap-1.5"><span class="text-slate-500 font-bold">🕒 PENDING</span></div>`;
        if (bet.status === 'WON') statusBadge = `<span class="text-emerald-500 font-bold">WIN</span>`;
        if (bet.status === 'LOST') statusBadge = `<span class="text-rose-500 font-bold">LOSS</span>`;

        let actionArea = '';
        if (bet.status === 'LIVE') {
            actionArea = `<div class="bg-black/30 rounded p-1.5 flex items-center justify-between border border-white/5 mt-2"><span class="text-[9px] text-slate-500">Game Clock</span><span class="text-[9px] font-mono text-slate-300" id="timer-${bet.id}">...</span></div>`;
        } else if (bet.status === 'PENDING') {
            actionArea = `
                <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                    <span class="text-[9px] text-slate-500">${bet.date}</span>
                    <button onclick="forceSimulateBet(${bet.id})" class="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500 hover:text-white transition-colors"> Sim Match </button>
                </div>`;
        } else {
            actionArea = `
                <div class="mt-2 pt-2 border-t border-white/5 text-right">
                    <span class="text-[10px] font-bold ${bet.status === 'WON' ? 'text-emerald-400' : 'text-slate-500'}">
                        ${bet.status === 'WON' ? `Paid: $${bet.potentialWin}` : 'Stake Lost'}
                    </span>
                </div>`;
        }

        ticket.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <div class="flex flex-col">
                    <span class="text-xs font-bold text-white leading-tight">${bet.matchName}</span>
                    <span class="text-[10px] text-slate-400 mt-0.5">Pick: <span class="text-indigo-300 font-bold">${bet.selection}</span> (${bet.odds})</span>
                </div>
            </div>
            <div class="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                <span>Bet: $${bet.wager}</span>
                <span class="text-emerald-600/80">To Win: $${bet.potentialWin}</span>
            </div>
            
            <div class="flex justify-between items-center text-[9px] mt-2">
                ${statusBadge}
            </div>
            ${actionArea}
        `;
        el.prepend(ticket);
    });
}

window.forceSimulateBet = function (id) {
    // User explicitly asks to simulate a pending bet
    const bet = window.sb_bets.find(b => b.id === id);
    if (bet && bet.status === 'PENDING') {
        bet.status = 'LIVE';
        saveBets();
        window.sb_active_tab = 'live';
        switchSbSlipTab('live');
        runLiveGameSimulation(bet.id, bet.selection, bet.odds, bet.wager);
    }
}

function runLiveGameSimulation(id, sel, odds, wager) {
    const timer = document.getElementById(`timer-${id}`);
    let seconds = 0;
    const interval = setInterval(() => {
        seconds += 5;
        const tEl = document.getElementById(`timer-${id}`); // Re-query in case render update
        if (tEl) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            tEl.innerText = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        }

        if (seconds > 15 + Math.random() * 15) {
            clearInterval(interval);
            resolveBet(id);
        }
    }, 1000);
}

function resolveBet(id) {
    const bet = window.sb_bets.find(b => b.id === id);
    if (!bet || bet.resolved) return;

    const winProb = (1 / bet.odds) - 0.05;
    const isWin = Math.random() < winProb;

    bet.status = isWin ? 'WON' : 'LOST';
    bet.resolved = true;

    if (isWin) {
        window.LocalBrokieAPI.updateBalance(bet.potentialWin);
        window.LocalBrokieAPI.addWin('Sports', bet.potentialWin - bet.wager);
        window.LocalBrokieAPI.playSound('win_small');
        window.updateSbBalance();
    } else {
        // Lost
    }
    saveBets();

    // If we are on live tab, maybe show notification?
    // Move to settled tab after a delay or just re-render
    renderSbSlip();
}


/* ==========================================================================
   VIDEO & WAGER UTILS
   ========================================================================== */
window.watchSportsStream = async function (matchId, category, title) {
    const iframe = document.getElementById('sb-video-frame');
    const placeholder = document.getElementById('sb-video-placeholder');
    const titleEl = document.getElementById('sb-stream-title');
    const container = document.getElementById('sb-player-container');

    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (titleEl) titleEl.innerText = "Loading Stream: " + title + "...";

    // Show placeholder/loading state
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `<div class="animate-spin text-4xl mb-2">⏳</div><div class="text-white font-bold">Fetching official stream...</div>`;
    }

    try {
        // Fetch Detail Endpoint
        const apiCat = category === 'ufc' ? 'fight' : category;
        const res = await fetch(`https://api.sportsrc.org/?data=detail&category=${apiCat}&id=${matchId}`);
        const data = await res.json();

        let streamUrl = "";

        // Check for specific stream fields in detail response
        if (data) {
            // Some APIs return the embed code directly as a string <iframe...>
            // Others return a URL. We need to handle both.
            const rawEmbed = data.embed || data.embed_code || data.stream_url || data.url;

            if (rawEmbed && rawEmbed.includes("<iframe")) {
                // It's raw HTML, we need to inject it into a container, not sv-video-frame src
                // But our layout expects an iframe. Let's write into the iframe document?
                // Or easier: replace the iframe outerHTML or innerHTML of container.
                // For safety/simplicity, let's extract the src if possible, or fallback to Youtube.
                const srcMatch = rawEmbed.match(/src=["'](.*?)["']/);
                if (srcMatch && srcMatch[1]) streamUrl = srcMatch[1];
            } else if (rawEmbed && rawEmbed.startsWith("http")) {
                streamUrl = rawEmbed;
            }
        }

        if (!streamUrl) {
            // Try Loker.life Scrape (The "Hijack" Method)
            if (titleEl) titleEl.innerText = "Searching external streams (Loker)...";
            const lokerLink = await searchLokerStream(category, title.split(" vs ")[0], title.split(" vs ")[1]);
            if (lokerLink) {
                streamUrl = lokerLink;
                console.log("Found Loker Link:", lokerLink);
            }
        }

        if (!streamUrl) {
            // Fallback
            streamUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(title + " live")}`;
        }

        if (iframe && streamUrl) {
            iframe.src = streamUrl;
            if (placeholder) placeholder.style.display = 'none';
        }
        if (titleEl) titleEl.innerText = "Live: " + title;

    } catch (e) {
        console.error("Stream Fetch Error", e);
        // Fallback on error
        const fallback = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(title + " live")}`;
        if (iframe) iframe.src = fallback;
        if (placeholder) placeholder.style.display = 'none';
        if (titleEl) titleEl.innerText = "Live (Fallback): " + title;
    }
};

// Scrapes loker.life category pages to find the "hidden" ID for a match
async function searchLokerStream(category, team1, team2) {
    // Map our categories to loker slugs
    const catMap = {
        'american-football': 'american-football',
        'nfl': 'american-football',
        'basketball': 'basketball',
        'nba': 'basketball',
        'football': 'football',
        'fight': 'fight',
        'ufc': 'fight',
        'baseball': 'baseball',
        'hockey': 'hockey'
    };

    const slug = catMap[category] || category;
    const targetUrl = `https://loker.life/${slug}/`;

    console.log(`Searching Loker for ${team1} vs ${team2} in ${slug}...`);

    try {
        // Use AllOrigins proxy to bypass CORS for scraping (common trick for frontend scraping)
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();

        if (!data || !data.contents) return null;

        const html = data.contents;

        // Simple regex to find links containing team names
        // Pattern: href=".../team1-vs-team2-12345/"
        // We normalize names to lower case and remove spaces
        const t1 = team1.toLowerCase().split(' ').pop(); // e.g. "Rams"
        const t2 = team2.toLowerCase().split(' ').pop(); // e.g. "Cardinals"

        // Regex that looks for href="...t1...t2..." OR href="...t2...t1..."
        // We look for the specific loker link structure
        const linkRegex = new RegExp(`href=["']([^"']*${t1}[^"']*${t2}[^"']*)["']`, 'i');
        const reverseRegex = new RegExp(`href=["']([^"']*${t2}[^"']*${t1}[^"']*)["']`, 'i');

        let match = html.match(linkRegex) || html.match(reverseRegex);

        if (match && match[1]) {
            let foundLink = match[1];
            if (!foundLink.startsWith('http')) foundLink = "https://loker.life" + foundLink;
            return foundLink;
        }

    } catch (e) {
        console.warn("Loker Scraping Error:", e);
    }
    return null;
}

window.adjustSbWager = function (amount) { const input = document.getElementById('sb-wager-input'); if (input) { let current = parseInt(input.value) || 0; let next = current + amount; if (next < 1) next = 1; input.value = next; } };
window.multiplySbWager = function (multiplier) { const input = document.getElementById('sb-wager-input'); if (input) { let current = parseInt(input.value) || 0; let next = Math.floor(current * multiplier); if (next < 1) next = 1; input.value = next; } };
window.setSbWagerMin = function () { const input = document.getElementById('sb-wager-input'); if (input) input.value = 10; };
window.setSbWagerMax = function () { const input = document.getElementById('sb-wager-input'); if (input && window.LocalBrokieAPI) { input.value = Math.floor(window.LocalBrokieAPI.getBalance()); } };
window.loadCustomStream = function () {
    const input = document.getElementById('sb-custom-url');
    const iframe = document.getElementById('sb-video-frame');
    const placeholder = document.getElementById('sb-video-placeholder');
    const titleEl = document.getElementById('sb-stream-title');

    if (input && input.value && iframe) {
        let url = input.value.trim();
        // Basic check to ensure protocol
        if (!url.startsWith('http')) url = 'https://' + url;

        iframe.src = url;
        if (placeholder) placeholder.style.display = 'none';
        if (titleEl) titleEl.innerText = "Custom Stream Loaded";
        input.value = ''; // clear
    }
};
window.updateSbBalance = function () { const el = document.getElementById('sb-balance-display'); if (el && window.LocalBrokieAPI) { el.innerText = `$${window.LocalBrokieAPI.getBalance().toLocaleString()}`; } }
