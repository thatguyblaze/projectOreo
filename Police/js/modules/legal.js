/* LAW LIBRARY & STATUTES MODULE v3 - OFFICIAL */
export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-scale-balanced text-secondary"></i> Law Library</div>
                </div>
            </div>

            <div class="scroller" style="background: var(--bg-app);">
                
                <!-- SEARCH BAR -->
                <div style="background: white; padding: 2rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div class="input-group">
                            <input type="text" id="legal-search" class="input-field" placeholder="Search Statutes, Codes, or Case Law..." style="padding: 1rem; font-size: 1.1rem; border-radius: 50px; text-align: center; box-shadow: var(--shadow-sm);">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem;" id="legal-filters">
                            <button class="btn btn-ghost active-pill" data-filter="all">All Codes</button>
                            <button class="btn btn-ghost" data-filter="55">Traffic (Title 55)</button>
                            <button class="btn btn-ghost" data-filter="39">Criminal (Title 39)</button>
                            <button class="btn btn-ghost" data-filter="40">Procedure</button>
                        </div>
                    </div>
                </div>

                <!-- CONTENT GRID -->
                <div class="grid-2" style="max-width: 1000px; margin: 0 auto;">
                    
                    <!-- BOOKMARKS / QUICK REF -->
                    <div>
                        <h3 style="color: var(--gov-navy); margin-bottom: 1rem;">Quick Reference (Common)</h3>
                        <div id="quick-ref-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <!-- Injected -->
                        </div>
                    </div>

                    <!-- SEARCH RESULTS / BROWSE -->
                    <div>
                        <h3 style="color: var(--gov-navy); margin-bottom: 1rem;">Browse Categories</h3>
                        <div class="panel">
                             <div class="panel-body" style="padding: 0;">
                                 <div class="list-item" id="btn-cat-39">
                                    <div style="font-weight: 600;">Title 39 - Criminal Offenses</div>
                                    <div class="text-secondary" style="font-size: 0.8rem;">Assault, Homicide, Theft, Burglary...</div>
                                 </div>
                                 <div class="list-item" id="btn-cat-55">
                                    <div style="font-weight: 600;">Title 55 - Motor and Other Vehicles</div>
                                    <div class="text-secondary" style="font-size: 0.8rem;">Rules of the Road, Registration, Licensing...</div>
                                 </div>
                                 <div class="list-item" id="btn-cat-40">
                                    <div style="font-weight: 600;">Title 40 - Criminal Procedure</div>
                                    <div class="text-secondary" style="font-size: 0.8rem;">Arrest, Bail, Warrants, Extradition...</div>
                                 </div>
                             </div>
                        </div>
                        
                        <!-- Dynamic Result Area -->
                        <div id="cat-result-area" class="hidden panel">
                            <div class="panel-head">
                                <span id="cat-result-title">Category Results</span>
                                <button class="btn btn-ghost" style="padding: 2px 8px;" onclick="document.getElementById('cat-result-area').classList.add('hidden')">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div class="panel-body" id="cat-result-body" style="padding: 0;"></div>
                        </div>

                    </div>

                </div>

            </div>
        </div>

        <style>
            .list-item { padding: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; }
            .list-item:hover { background: #f9fafb; }
            .list-item:last-child { border-bottom: none; }
            .active-pill { background: var(--gov-blue); color: white; border-radius: 20px; }
            .active-pill:hover { background: var(--gov-blue-dark); color: white; }
        </style>
    `;
}

const COMMON_CODES = [
    { code: '39-13-102', title: 'Aggravated Assault', desc: 'Intentionally or knowingly commits an assault that results in serious bodily injury...' },
    { code: '39-13-111', title: 'Domestic Assault', desc: 'Commits an assault against a domestic abuse victim...' },
    { code: '55-10-401', title: 'DUI First Offense', desc: 'Driving under the influence of any intoxicant...' },
    { code: '39-17-418', title: 'Simple Possession', desc: 'Knowingly possess or casually exchange a controlled substance...' },
    { code: '55-8-152', title: 'Speeding', desc: 'Operating a vehicle in excess of the posted speed limit.' },
    { code: '55-9-402', title: 'Light Law', desc: 'Failure to display illuminated headlights/taillights during required times.' },
    { code: '40-7-103', title: 'Warrantless Arrest', desc: 'Grounds for arrest by an officer without a warrant.' }
];

export function init() {
    renderList(COMMON_CODES);

    // Search Filter
    document.getElementById('legal-search').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = COMMON_CODES.filter(c => c.title.toLowerCase().includes(val) || c.code.includes(val) || c.desc.toLowerCase().includes(val));
        renderList(filtered);
    });

    // Button Filters
    document.querySelectorAll('#legal-filters button').forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Toggle
            document.querySelectorAll('#legal-filters button').forEach(b => b.classList.remove('active-pill'));
            btn.classList.add('active-pill');

            const filterIdx = btn.dataset.filter;
            if (filterIdx === 'all') {
                renderList(COMMON_CODES);
            } else {
                const filtered = COMMON_CODES.filter(c => c.code.startsWith(filterIdx));
                renderList(filtered);
            }
        });
    });

    // Category Browsing
    setupCategory('39', 'Title 39 - Criminal Offenses', [
        { code: '39-13', title: 'Offenses Against Person', desc: 'Assault, Homicide, Kidnapping' },
        { code: '39-14', title: 'Offenses Against Property', desc: 'Theft, Burglary, Arson' },
        { code: '39-16', title: 'Offenses Against Admin of Gov', desc: 'Resisting Arrest, Escape, Bribery' },
        { code: '39-17', title: 'Offenses Against Public Health', desc: 'Drugs, Weapons, Gambling' }
    ]);
    setupCategory('55', 'Title 55 - Traffic', [
        { code: '55-8', title: 'Operation of Vehicles', desc: 'Rules of the Road' },
        { code: '55-9', title: 'Equipment / Lights', desc: 'Required equipment' },
        { code: '55-10', title: 'Accidents / DUI', desc: 'Reporting and Alcohol offenses' },
        { code: '55-50', title: 'Licensing', desc: 'Driver Licenses' }
    ]);
    setupCategory('40', 'Title 40 - Procedure', [
        { code: '40-7', title: 'Arrest', desc: 'Procedures for arrest' },
        { code: '40-11', title: 'Bail', desc: 'Admission to bail' }
    ]);
}

function setupCategory(idSuffix, title, subItems) {
    document.getElementById(`btn-cat-${idSuffix}`).addEventListener('click', () => {
        const area = document.getElementById('cat-result-area');
        const body = document.getElementById('cat-result-body');
        const titleEl = document.getElementById('cat-result-title');

        titleEl.innerText = title;
        body.innerHTML = subItems.map(i => `
            <div class="list-item">
                <div style="font-weight: 600;">${i.title}</div>
                <div class="text-secondary" style="font-size: 0.8rem;">Chapter ${i.code} - ${i.desc}</div>
            </div>
        `).join('');

        area.classList.remove('hidden');
    });
}

function renderList(items) {
    const list = document.getElementById('quick-ref-list');
    if (items.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No matching codes found.</div>`;
    } else {
        list.innerHTML = items.map(c => `
            <div class="panel" style="margin: 0; cursor: pointer; border-left: 4px solid var(--gov-blue);">
                <div class="panel-body" style="padding: 1rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 700; color: var(--text-primary);">${c.title}</span>
                        <span class="text-secondary" style="font-family: monospace;">TCA ${c.code}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${c.desc}</div>
                </div>
            </div>
        `).join('');
    }
}
