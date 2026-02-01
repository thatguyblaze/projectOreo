/* CASES & INVESTIGATIONS MODULE v3 - OFFICIAL */
import { db } from '../store.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-folder-open text-cyan"></i> Case Management</div>
                </div>
                <div class="ws-controls">
                     <button class="btn btn-primary" onclick="window.toggleNewCaseModal(true)"><i class="fa-solid fa-plus"></i> New Case</button>
                </div>
            </div>

            <!-- SCROLLER / BOARD -->
            <div class="scroller" style="overflow-x: auto; background: var(--bg-app);">
                <div style="display: grid; grid-template-columns: repeat(3, 350px); gap: 1.5rem; height: 100%;">
                    
                    <!-- COL 1 -->
                    <div style="display: flex; flex-direction: column;">
                         <div style="padding: 1rem; font-weight: 600; color: var(--gov-navy); display: flex; align-items: center; gap: 8px;">
                            <div style="width: 8px; height: 8px; background: var(--status-info); border-radius: 50%;"></div>
                            ACTIVE INVESTIGATIONS
                         </div>
                         <div id="col-active" style="flex: 1; overflow-y: auto;"></div>
                    </div>

                    <!-- COL 2 -->
                    <div style="display: flex; flex-direction: column;">
                         <div style="padding: 1rem; font-weight: 600; color: var(--status-warning); display: flex; align-items: center; gap: 8px;">
                            <div style="width: 8px; height: 8px; background: var(--status-warning); border-radius: 50%;"></div>
                            PENDING COURT / WARRANT
                         </div>
                         <div id="col-pending" style="flex: 1; overflow-y: auto;"></div>
                    </div>

                    <!-- COL 3 -->
                    <div style="display: flex; flex-direction: column;">
                         <div style="padding: 1rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                            <div style="width: 8px; height: 8px; background: var(--text-secondary); border-radius: 50%;"></div>
                            CLOSED / ARCHIVED
                         </div>
                         <div id="col-closed" style="flex: 1; overflow-y: auto;"></div>
                    </div>

                </div>
            </div>

            <!-- MODAL: NEW CASE -->
            <div id="modal-new-case" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center;">
                <div class="panel" style="width: 500px; max-width: 90vw; margin: 0;">
                    <div class="panel-head">
                        <span>Open New Investigation</span>
                        <button class="btn btn-ghost" onclick="window.toggleNewCaseModal(false)"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="panel-body">
                        <form id="new-case-form">
                            <div class="input-group">
                                <label class="input-label">Case Title</label>
                                <input type="text" name="title" class="input-field" required placeholder="e.g. Grand Theft Auto Ring">
                            </div>
                            <div class="input-group">
                                <label class="input-label">Incident Type</label>
                                <select name="type" class="input-field">
                                    <option>Felony</option>
                                    <option>Misdemeanor</option>
                                    <option>Internal</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label class="input-label">Initial Summary</label>
                                <textarea name="summary" class="input-field" rows="3" required></textarea>
                            </div>
                            <div style="text-align: right; margin-top: 1rem;">
                                <button type="submit" class="btn btn-primary">Create Case File</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    `;
}

// Temporary Local Store for Cases (Since store.js was focused on Incidents)
// In a full app, we'd add `db.createCase` methods. We will mock the "Real" persistence using localStorage directly here for the demo pivot.
const CASE_KEY = 'cmd_cases_v2';

export function init() {
    renderBoard();

    // Modal Toggle
    window.toggleNewCaseModal = (show) => {
        const m = document.getElementById('modal-new-case');
        if (show) m.classList.remove('hidden');
        else m.classList.add('hidden');
    };

    // Form Submit
    document.getElementById('new-case-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());

        const newCase = {
            id: '24-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
            title: data.title,
            status: 'ACTIVE',
            lead: db.getCurrentOfficer().name,
            progress: 0,
            summary: data.summary
        };

        const cases = JSON.parse(localStorage.getItem(CASE_KEY) || '[]');
        cases.unshift(newCase);
        localStorage.setItem(CASE_KEY, JSON.stringify(cases));

        renderBoard();
        window.toggleNewCaseModal(false);
        e.target.reset();
    });
}

function renderBoard() {
    const cases = JSON.parse(localStorage.getItem(CASE_KEY) || '[]');
    // Seed if empty
    if (cases.length === 0) {
        cases.push(
            { id: '24-0012', title: 'Grand Theft Auto Ring', status: 'ACTIVE', lead: 'Ofc. Miller', progress: 45, summary: 'Investigating series of F-150 thefts.' },
            { id: '23-1102', title: 'Cold Case: Missing Person', status: 'CLOSED', lead: 'Det. Vance', progress: 100, summary: 'Subject located in Florida.' }
        );
        localStorage.setItem(CASE_KEY, JSON.stringify(cases));
    }

    const cols = {
        ACTIVE: document.getElementById('col-active'),
        PENDING: document.getElementById('col-pending'),
        CLOSED: document.getElementById('col-closed')
    };

    // Clear
    Object.values(cols).forEach(c => c.innerHTML = '');

    cases.forEach(c => {
        const card = document.createElement('div');
        card.className = 'panel';
        card.style.cursor = 'pointer';
        card.style.marginBottom = '10px';
        card.innerHTML = `
            <div class="panel-body" style="padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span class="text-secondary" style="font-size: 0.75rem; font-weight: 500;">CASE #${c.id}</span>
                    <span class="badge" style="background: #f3f4f6; color: var(--text-primary);">${c.lead}</span>
                </div>
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; font-size: 0.95rem;">${c.title}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${c.summary}
                </div>
                
                <div style="height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                    <div style="height: 100%; width: ${c.progress}%; background: ${getStatusColor(c.status)};"></div>
                </div>
                <div style="text-align: right; font-size: 0.7rem; margin-top: 6px; color: var(--text-secondary); font-weight: 500;">${c.progress}% COMPLETE</div>
            </div>
        `;

        // No alert here - ideally clicking opens details, but for this step we focused on "Create" working.
        if (cols[c.status]) cols[c.status].appendChild(card);
    });
}

function getStatusColor(status) {
    if (status === 'ACTIVE') return 'var(--status-info)';
    if (status === 'PENDING') return 'var(--status-warning)';
    return 'var(--text-secondary)';
}
