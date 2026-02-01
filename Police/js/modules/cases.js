/* CASES & INVESTIGATIONS MODULE v2 - COMMAND OS */
import { db } from '../store.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-magnifying-glass text-cyan"></i> CASE INVESTIGATIONS</div>
                </div>
                <div class="ws-controls">
                     <button class="btn btn-cyan" onclick="newCase()"><i class="fa-solid fa-plus"></i> NEW CASE FILE</button>
                </div>
            </div>

            <div class="scroller" style="overflow-x: auto;">
                
                <!-- KANBAN BOARD LAYOUT -->
                <div style="display: grid; grid-template-columns: repeat(3, 400px); gap: 1.5rem; height: 100%;">
                    
                    <!-- COLUMN: OPEN / ACTIVE -->
                    <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column;">
                         <div style="padding: 1rem; border-bottom: 1px solid var(--border); font-weight: 600; color: var(--accent-cyan);">
                            <i class="fa-regular fa-folder-open"></i> ACTIVE INVESTIGATIONS
                         </div>
                         <div class="case-col" id="col-active" style="flex: 1; padding: 1rem; overflow-y: auto;">
                            <!-- Injected Cards -->
                         </div>
                    </div>

                    <!-- COLUMN: PENDING ACTION -->
                    <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column;">
                         <div style="padding: 1rem; border-bottom: 1px solid var(--border); font-weight: 600; color: var(--accent-amber);">
                            <i class="fa-solid fa-gavel"></i> PENDING WARRANTS / COURT
                         </div>
                         <div class="case-col" id="col-pending" style="flex: 1; padding: 1rem; overflow-y: auto;">
                            <!-- Injected Cards -->
                         </div>
                    </div>

                    <!-- COLUMN: CLOSED -->
                    <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column;">
                         <div style="padding: 1rem; border-bottom: 1px solid var(--border); font-weight: 600; color: var(--text-mono);">
                            <i class="fa-solid fa-box-archive"></i> CLOSED / COLD
                         </div>
                         <div class="case-col" id="col-closed" style="flex: 1; padding: 1rem; overflow-y: auto;">
                            <!-- Injected Cards -->
                         </div>
                    </div>

                </div>

            </div>
        </div>
    `;
}

// Mock Data for Visuals (In a real app, this would read from Store, but store.js 'Incidents' replaced Cases partially)
// We will treat these as "Long Term Investigations", separate from the Dispatch Incidents or linked to them.
const MOCK_CASES = [
    { id: '24-0012', title: 'Grand Theft Auto Ring', status: 'ACTIVE', lead: 'Det. Vance', progress: 45, summary: 'Investigating series of F-150 thefts.' },
    { id: '24-0045', title: 'Assault at Waffle House', status: 'PENDING', lead: 'Ofc. Miller', progress: 90, summary: 'Warrant pending for suspect J. Doe.' },
    { id: '23-0982', title: 'Cold Case: The missing donut', status: 'CLOSED', lead: 'Cpt. Harris', progress: 100, summary: 'Donut found in break room.' }
];

export function init() {
    renderBoard();
}

function renderBoard() {
    const cols = {
        ACTIVE: document.getElementById('col-active'),
        PENDING: document.getElementById('col-pending'),
        CLOSED: document.getElementById('col-closed')
    };

    MOCK_CASES.forEach(c => {
        const card = document.createElement('div');
        card.className = 'panel';
        card.style.cursor = 'grab';
        card.innerHTML = `
            <div class="panel-body" style="padding: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span class="mono text-dim" style="font-size: 0.75rem;">CASE #${c.id}</span>
                    <span class="badge" style="font-size: 0.6rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${c.lead}</span>
                </div>
                <div style="font-weight: 600; color: var(--text-bright); margin-bottom: 0.5rem;">${c.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${c.summary}
                </div>
                
                <!-- Progress Bar -->
                <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; width: ${c.progress}%; background: ${getStatusColor(c.status)};"></div>
                </div>
                <div style="text-align: right; font-size: 0.7rem; margin-top: 4px; color: var(--text-mono);">${c.progress}% COMPLETED</div>
                
                <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem; display: flex; gap: 10px;">
                    <button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.7rem;"><i class="fa-solid fa-eye"></i> VIEW</button>
                    <button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.7rem;"><i class="fa-solid fa-pen"></i> LOG</button>
                </div>
            </div>
        `;

        if (cols[c.status]) cols[c.status].appendChild(card);
    });
}

function getStatusColor(status) {
    if (status === 'ACTIVE') return 'var(--accent-cyan)';
    if (status === 'PENDING') return 'var(--accent-amber)';
    return 'var(--text-mono)';
}

window.newCase = () => alert("Logic to create new case folder.");
