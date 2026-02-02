/* INTELLIGENCE & NCIC MODULE v3 - OFFICIAL */
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="scan-overlay hidden" id="intel-scan"></div>

            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-server text-cyan" style="color: var(--gov-navy);"></i> NCIC Database Access</div>
                </div>
            </div>

            <div class="scroller" style="padding: 0; background: var(--bg-app);">
                
                <!-- SEARCH HEADER -->
                <div style="background: white; padding: 3rem 2rem; border-bottom: 1px solid var(--border); text-align: center;">
                    <div style="max-width: 650px; margin: 0 auto;">
                        <h2 style="color: var(--gov-navy); margin-bottom: 1.5rem; font-weight: 700;">Tennessee Bureau of Investigation</h2>
                        
                        <div style="display: flex; box-shadow: var(--shadow-md); border-radius: 6px; overflow: hidden;">
                            <div style="background: white; border: 1px solid var(--border); border-right: none; padding: 0 1.25rem; display: flex; align-items: center; color: var(--text-secondary);">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </div>
                            <input type="text" id="ncic-query" class="input-field" style="border: 1px solid var(--border); border-left: none; border-radius: 0; font-size: 1.1rem; padding: 1.2rem; box-shadow: none;" placeholder="Search Name, Plate, or DL Number...">
                            <button class="btn btn-primary" id="btn-run-ncic" style="border-radius: 0; padding: 0 2.5rem; font-size: 1rem; font-weight: 600;">Search</button>
                        </div>
                        
                        <div style="margin-top: 1.5rem; display: flex; gap: 1.5rem; justify-content: center;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; font-weight: 500;">
                                <input type="checkbox" checked> Persons
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; font-weight: 500;">
                                <input type="checkbox" checked> Vehicles
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; font-weight: 500;">
                                <input type="checkbox"> Property / Firearms
                            </label>
                        </div>
                    </div>
                </div>

                <!-- RESULTS -->
                <div id="ncic-results" class="hidden" style="padding: 2rem; max-width: 1000px; margin: 0 auto;">
                    
                    <!-- IDENTITY CARD -->
                    <div class="panel" style="border-top: 4px solid var(--gov-navy);">
                        <div class="panel-body">
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                                <!-- MUGSHOT -->
                                <div style="width: 140px; height: 170px; background: #f3f4f6; border: 1px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-direction: column; flex-shrink: 0;">
                                    <i class="fa-solid fa-user" style="font-size: 4rem; color: #d1d5db; margin-bottom: 10px;"></i>
                                    <div class="text-secondary" style="font-size: 0.7rem; font-weight: 600;">NO PHOTO</div>
                                </div>

                                <!-- DATA -->
                                <div style="flex: 1; min-width: 300px;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                        <div>
                                            <div class="text-secondary" style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">Identity Verified</div>
                                            <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1.2;" id="res-name">DOE, JOHN</div>
                                        </div>
                                        <div id="status-badge" class="badge" style="padding: 8px 16px; font-size: 0.85rem;">VALID</div>
                                    </div>

                                    <div class="grid-3" style="margin-bottom: 1.5rem;">
                                        <div><div class="input-label">Date of Birth</div><div class="text-primary font-medium" id="res-dob">1990-01-01</div></div>
                                        <div><div class="input-label">Sex / Race</div><div class="text-primary font-medium" id="res-race">M / W</div></div>
                                        <div><div class="input-label">Height / Weight</div><div class="text-primary font-medium" id="res-phys">6'0" / 180</div></div>
                                    </div>

                                    <div class="grid-2">
                                        <div><div class="input-label">Driver License (TN)</div><div class="text-secondary font-mono">#99583210</div></div>
                                        <div><div class="input-label">Social Security</div><div class="text-secondary font-mono">***-**-9912</div></div>
                                    </div>
                                </div>
                            </div>

                            <!-- FLAGS -->
                            <div id="flags-container" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 10px; flex-wrap: wrap;">
                                <!-- Injected -->
                            </div>
                        </div>
                    </div>

                    <div class="grid-2">
                        
                        <!-- CCH -->
                        <div class="panel">
                            <div class="panel-head"><i class="fa-solid fa-gavel text-secondary"></i> Criminal History</div>
                            <div class="panel-body" style="padding: 0;">
                                <table class="cyber-table">
                                    <thead><tr><th>Date</th><th>Charge</th><th>Disposition</th></tr></thead>
                                    <tbody id="cch-table"></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- VEHICLES -->
                        <div class="panel">
                             <div class="panel-head"><i class="fa-solid fa-car text-secondary"></i> Registered Vehicles</div>
                             <div class="panel-body" style="padding: 0;">
                                 <table class="cyber-table">
                                    <thead><tr><th>Plate</th><th>Vehicle</th><th>Color</th></tr></thead>
                                    <tbody id="veh-table"></tbody>
                                </table>
                             </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    `;
}

export function init() {
    const btn = document.getElementById('btn-run-ncic');
    const input = document.getElementById('ncic-query');
    const results = document.getElementById('ncic-results');
    const scan = document.getElementById('intel-scan');

    btn.addEventListener('click', () => {
        const q = input.value;
        if (!q) return;

        scan.classList.remove('hidden');
        results.classList.add('hidden');

        setTimeout(() => {
            scan.classList.add('hidden');
            results.classList.remove('hidden');

            const profile = generateProfile(q);
            renderProfile(profile);

        }, 600);
    });

    function renderProfile(p) {
        document.getElementById('res-name').innerText = p.name;
        document.getElementById('res-dob').innerText = p.dob;
        document.getElementById('res-race').innerText = `${p.sex} / ${p.race}`;
        document.getElementById('res-phys').innerText = `${p.height} / ${p.weight}`;

        const badge = document.getElementById('status-badge');
        badge.innerText = p.status;
        if (p.status === 'WANTED') {
            badge.style.background = '#fee2e2'; badge.style.color = '#b91c1c';
        } else {
            badge.style.background = '#dcfce7'; badge.style.color = '#15803d';
        }

        const flagsDiv = document.getElementById('flags-container');
        if (p.flags.length > 0) {
            flagsDiv.innerHTML = p.flags.map(f => `
                <span class="badge" style="background: ${f.type === 'DANGER' ? '#fee2e2' : '#fef3c7'}; color: ${f.type === 'DANGER' ? '#b91c1c' : '#b45309'}; padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> ${f.label}
                </span>
            `).join('');
        } else {
            flagsDiv.innerHTML = `<span class="text-secondary" style="font-size: 0.85rem;">No active flags or warnings.</span>`;
        }

        const cchTable = document.getElementById('cch-table');
        if (p.history.length === 0) {
            cchTable.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No Records Found</td></tr>`;
        } else {
            cchTable.innerHTML = p.history.map(h => `
                <tr>
                    <td style="font-family: inherit;">${h.date}</td>
                    <td>${h.charge}</td>
                    <td class="text-secondary" style="font-size: 0.8rem;">${h.disposition}</td>
                </tr>
            `).join('');
        }

        const vehTable = document.getElementById('veh-table');
        if (p.vehicles.length === 0) {
            vehTable.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No Vehicles Found</td></tr>`;
        } else {
            vehTable.innerHTML = p.vehicles.map(v => `
                <tr>
                    <td style="font-family: monospace; font-weight: 600;">${v.plate}</td>
                    <td>${v.year} ${v.make} ${v.model}</td>
                    <td>${v.color}</td>
                </tr>
            `).join('');
        }
    }
}
