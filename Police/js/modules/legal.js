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
                        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem;">
                            <button class="btn btn-ghost active-pill">All Codes</button>
                            <button class="btn btn-ghost">Traffic (Title 55)</button>
                            <button class="btn btn-ghost">Criminal (Title 39)</button>
                            <button class="btn btn-ghost">Procedure</button>
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
                                 <div class="list-item" onclick="alert('Opening Title 39...')">
                                    <div style="font-weight: 600;">Title 39 - Criminal Offenses</div>
                                    <div class="text-secondary" style="font-size: 0.8rem;">Assault, Homicide, Theft, Burglary...</div>
                                 </div>
                                 <div class="list-item" onclick="alert('Opening Title 55...')">
                                    <div style="font-weight: 600;">Title 55 - Motor and Other Vehicles</div>
                                    <div class="text-secondary" style="font-size: 0.8rem;">Rules of the Road, Registration, Licensing...</div>
                                 </div>
                                 <div class="list-item" onclick="alert('Opening Title 40...')">
                                    <div style="font-weight: 600;">Title 40 - Criminal Procedure</div>
                                    <div class="text-secondary" style="font-size: 0.8rem;">Arrest, Bail, Warrants, Extradition...</div>
                                 </div>
                             </div>
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
    { code: '39-17-418', title: 'Simple Possession', desc: 'Knowingly possess or casually exchange a controlled substance...' }
];

export function init() {
    const list = document.getElementById('quick-ref-list');

    list.innerHTML = COMMON_CODES.map(c => `
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

    // Search Filter
    document.getElementById('legal-search').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        // Simple filter logic for demo
        const filtered = COMMON_CODES.filter(c => c.title.toLowerCase().includes(val) || c.code.includes(val));

        if (filtered.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No matching common codes found.</div>`;
        } else {
            list.innerHTML = filtered.map(c => `
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
    });
}
