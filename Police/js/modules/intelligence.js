/* INTELLIGENCE & NCIC MODULE v2 - COMMAND OS */
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="scan-overlay hidden" id="intel-scan"></div>

            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-database text-cyan"></i> NCIC / INTEL DATABASE</div>
                </div>
            </div>

            <div class="scroller" style="padding: 0;">
                
                <!-- SEARCH INTERFACE -->
                <div style="background: var(--bg-panel); padding: 2rem; border-bottom: 1px solid var(--border); text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <div style="margin-bottom: 1rem; font-family: var(--font-data); color: var(--accent-cyan);">SECURE CONNECTION ESTABLISHED // TBI_GATEWAY_04</div>
                        <div style="display: flex; gap: 0;">
                            <div style="background: var(--bg-deep); border: 1px solid var(--border); padding: 0 1rem; display: flex; align-items: center; border-right: none; color: var(--text-mono);">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </div>
                            <input type="text" id="ncic-query" class="input-field" style="border-left: none; border-radius: 0; font-size: 1.2rem; padding: 1rem;" placeholder="ENTER NAME, PLATE OR VIN...">
                            <button class="btn btn-cyan" id="btn-run-ncic" style="border-radius: 0 4px 4px 0; padding: 0 2rem; font-size: 1rem;">SEARCH RECORDS</button>
                        </div>
                        <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-dim); cursor: pointer;">
                                <input type="checkbox" checked> PERSON
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-dim); cursor: pointer;">
                                <input type="checkbox" checked> VEHICLE
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-dim); cursor: pointer;">
                                <input type="checkbox"> FIREARM
                            </label>
                        </div>
                    </div>
                </div>

                <!-- RESULTS CONTAINER -->
                <div id="ncic-results" class="hidden" style="padding: 2rem; max-width: 900px; margin: 0 auto;">
                    
                    <!-- IDENTITY CARD -->
                    <div class="panel" style="border-top: 4px solid var(--accent-cyan);">
                        <div class="panel-body">
                            <div style="display: flex; gap: 2rem;">
                                <!-- MUGSHOT PLACEHOLDER -->
                                <div style="width: 150px; height: 180px; background: #0f172a; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-direction: column;">
                                    <i class="fa-solid fa-user-secret" style="font-size: 4rem; color: var(--text-mono); margin-bottom: 10px;"></i>
                                    <div class="mono text-dim" style="font-size: 0.7rem;">NO PHOTO</div>
                                </div>

                                <!-- DATA GRID -->
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                        <div>
                                            <div class="mono text-cyan" style="font-size: 0.9rem;">IDENTITY VERIFIED</div>
                                            <div style="font-size: 2rem; font-weight: 700; line-height: 1;" id="res-name">DOE, JOHN</div>
                                        </div>
                                        <div id="status-badge" style="padding: 6px 12px; background: var(--accent-green); color: #000; font-weight: bold; border-radius: 4px; font-family: var(--font-data);">VALID</div>
                                    </div>

                                    <div class="grid-3" style="margin-bottom: 1.5rem;">
                                        <div><div class="input-label">DOB</div><div class="mono text-bright" id="res-dob">1990-01-01</div></div>
                                        <div><div class="input-label">SEX/RACE</div><div class="mono text-bright" id="res-race">M / W</div></div>
                                        <div><div class="input-label">HGT/WGT</div><div class="mono text-bright" id="res-phys">6'0" / 180</div></div>
                                    </div>

                                    <div class="grid-2">
                                        <div><div class="input-label">OLN (DRIVER LIC)</div><div class="mono text-dim">#99583210 (TN)</div></div>
                                        <div><div class="input-label">SSN</div><div class="mono text-dim">***-**-9912</div></div>
                                    </div>
                                </div>
                            </div>

                            <!-- FLAGS -->
                            <div id="flags-container" style="margin-top: 1.5rem; display: flex; gap: 10px; flex-wrap: wrap;">
                                <!-- Injected Flags -->
                            </div>
                        </div>
                    </div>

                    <div class="grid-2">
                        
                        <!-- CRIMINAL HISTORY -->
                        <div class="panel">
                            <div class="panel-head"><i class="fa-solid fa-gavel"></i> CRIMINAL HISTORY (CCH)</div>
                            <div class="panel-body" style="padding: 0;">
                                <table class="cyber-table">
                                    <thead><tr><th>DATE</th><th>CHARGE</th><th>DISPO</th></tr></thead>
                                    <tbody id="cch-table">
                                        <!-- Injected -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- VEHICLES -->
                        <div class="panel">
                             <div class="panel-head"><i class="fa-solid fa-car"></i> REGISTERED VEHICLES</div>
                             <div class="panel-body" style="padding: 0;">
                                 <table class="cyber-table">
                                    <thead><tr><th>PLATE</th><th>VEHICLE</th><th>COLOR</th></tr></thead>
                                    <tbody id="veh-table">
                                        <!-- Injected -->
                                    </tbody>
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

        // Effect
        scan.classList.remove('hidden');
        results.classList.add('hidden');

        setTimeout(() => {
            scan.classList.add('hidden');
            results.classList.remove('hidden');

            const profile = generateProfile(q);
            renderProfile(profile);

        }, 800);
    });

    function renderProfile(p) {
        document.getElementById('res-name').innerText = p.name;
        document.getElementById('res-dob').innerText = p.dob;
        document.getElementById('res-race').innerText = `${p.sex} / ${p.race}`;
        document.getElementById('res-phys').innerText = `${p.height} / ${p.weight}`;

        // Status Badge
        const badge = document.getElementById('status-badge');
        badge.innerText = p.status;
        if (p.status === 'WANTED') {
            badge.style.background = 'var(--accent-red)';
            badge.style.color = 'white';
            // Alert Sound?
        } else {
            badge.style.background = 'var(--accent-green)';
            badge.style.color = '#000';
        }

        // Flags
        const flagsDiv = document.getElementById('flags-container');
        if (p.flags.length > 0) {
            flagsDiv.innerHTML = p.flags.map(f => `
                <span style="padding: 4px 8px; font-size: 0.75rem; font-weight: bold; background: ${f.type === 'DANGER' ? 'var(--accent-red)' : 'var(--accent-amber)'}; color: #000; font-family: var(--font-data);">
                    <i class="fa-solid fa-triangle-exclamation"></i> ${f.label}
                </span>
            `).join('');
        } else {
            flagsDiv.innerHTML = `<span class="mono text-dim" style="font-size: 0.8rem;">NO ACTIVE CAUTION CODES</span>`;
        }

        // CCH
        const cchTable = document.getElementById('cch-table');
        if (p.history.length === 0) {
            cchTable.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-dim); padding: 1rem;">NO CRIMINAL RECORD FOUND</td></tr>`;
        } else {
            cchTable.innerHTML = p.history.map(h => `
                <tr>
                    <td class="mono">${h.date}</td>
                    <td>${h.charge}</td>
                    <td class="text-dim">${h.disposition}</td>
                </tr>
            `).join('');
        }

        // Vehicles
        const vehTable = document.getElementById('veh-table');
        if (p.vehicles.length === 0) {
            vehTable.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-dim); padding: 1rem;">NO VEHICLES REGISTERED</td></tr>`;
        } else {
            vehTable.innerHTML = p.vehicles.map(v => `
                <tr>
                    <td class="mono text-cyan">${v.plate}</td>
                    <td>${v.make} ${v.model}</td>
                    <td>${v.color}</td>
                </tr>
            `).join('');
        }
    }
}
