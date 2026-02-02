/* DISPATCH MODULE v3 - OFFICIAL */
import { db } from '../store.js';
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="workspace-header">
                <div>
                    <div class="ws-title">Dispatch Operations</div>
                </div>
                <div class="ws-controls">
                     <div style="border-right: 1px solid var(--border); padding-right: 1rem; display: flex; gap: 10px; align-items: center;">
                        <span class="text-secondary" style="font-size: 0.75rem; font-weight: 600;">UNIT STATUS</span>
                        <select id="my-status" class="input-field" style="width: 140px; padding: 6px;">
                            <option value="AVAIL">AVAILABLE</option>
                            <option value="BUSY">BUSY</option>
                            <option value="ENRT">EN ROUTE</option>
                            <option value="SCENE">ON SCENE</option>
                        </select>
                     </div>
                     <button class="btn btn-ghost" id="sim-call-btn">+ Sim Call</button>
                </div>
            </div>

            <div style="flex: 1; display: grid; grid-template-columns: 350px 1fr; overflow: hidden; background: var(--bg-app);">
                
                <!-- LEFT: CALL LIST -->
                <div style="border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-surface);">
                    <div class="panel-head">
                        <span>Active Incidents</span>
                        <span class="badge" style="background: #e5e7eb; color: #374151;" id="call-count">0</span>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 0.5rem;" id="call-list">
                        <!-- Content Injected -->
                    </div>
                </div>

                <!-- RIGHT: MDT WORKSPACE -->
                <div id="mdt-workspace" style="display: flex; flex-direction: column; background: var(--bg-app);">
                    
                    <!-- EMPTY STATE -->
                    <div id="mdt-empty" style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); flex-direction: column;">
                        <i class="fa-solid fa-satellite-dish" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                        <div style="font-weight: 500;">MDT Standby</div>
                        <div style="font-size: 0.85rem;">Select a call to begin operations.</div>
                    </div>

                    <!-- ACTIVE INCIDENT UI -->
                    <div id="mdt-active" class="hidden" style="flex: 1; display: flex; flex-direction: column;">
                        
                        <!-- HEADER -->
                        <div style="padding: 1rem 2rem; background: white; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <span class="badge" style="background: var(--gov-blue); color: white;" id="active-id">ID</span>
                                    <span style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary);" id="active-type">Type</span>
                                </div>
                                <div class="text-secondary" style="font-size: 0.9rem; margin-top: 4px;">
                                    <i class="fa-solid fa-location-dot"></i> <span id="active-loc">Location</span>
                                </div>
                            </div>
                            <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
                                <select id="active-status-select" onchange="window.updateCallStatus(this.value)" class="input-field" style="padding: 4px; font-size: 0.8rem; width: auto; border-color: var(--status-warning);">
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="CLEARED">CLEARED</option>
                                    <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                                <div>
                                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--status-warning);" id="active-timer">00:00</div>
                                    <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">TIME ELAPSED</div>
                                </div>
                            </div>
                        </div>

                        <!-- TABS -->
                        <div style="display: flex; border-bottom: 1px solid var(--border); padding: 0 1rem; background: #f9fafb;">
                            <div class="nav-item active" onclick="switchTab('narrative')" style="margin-right: 1rem;">NARRATIVE</div>
                            <div class="nav-item" onclick="switchTab('subjects')" style="margin-right: 1rem;">SUBJECTS</div>
                            <div class="nav-item" onclick="switchTab('reports')">REPORTS</div>
                        </div>

                        <!-- CONTENT PANES -->
                        <div style="flex: 1; overflow-y: auto; padding: 1.5rem; position: relative;">
                            
                            <!-- NARRATIVE -->
                            <div id="tab-narrative">
                                <div class="input-group" style="display: flex; gap: 10px;">
                                    <input type="text" id="narrative-input" class="input-field" placeholder="Enter notes or updates...">
                                    <button class="btn btn-primary" id="send-narrative">Add Log</button>
                                </div>
                                <div id="narrative-log" style="display: flex; flex-direction: column; gap: 12px; margin-top: 1.5rem;"></div>
                            </div>

                            <!-- SUBJECTS -->
                            <div id="tab-subjects" class="hidden">
                                <div class="grid-2">
                                    <div class="panel">
                                        <div class="panel-head">Search & Link</div>
                                        <div class="panel-body">
                                            <div class="input-group">
                                                <div style="display: flex; gap: 5px;">
                                                    <input type="text" id="sub-search" class="input-field" placeholder="Last Name">
                                                    <button class="btn btn-primary" id="run-sub-search">Search</button>
                                                </div>
                                            </div>
                                            <div id="quick-result" class="hidden" style="margin-top: 10px; padding: 10px; background: #f3f4f6; border-radius: 4px;">
                                                <div id="qr-name" style="font-weight: 600;">Name</div>
                                                <div id="qr-status" style="font-size: 0.8rem; color: var(--text-secondary);">Desc</div>
                                                <div style="margin-top: 10px; display: flex; gap: 5px;">
                                                    <button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.75rem;" onclick="linkSubject('Suspect')">Link Suspect</button>
                                                    <button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.75rem;" onclick="linkSubject('Victim')">Link Victim</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="panel">
                                        <div class="panel-head">Linked Persons</div>
                                        <div class="panel-body" id="linked-subs-list" style="padding: 0;">
                                            <div class="text-secondary" style="text-align: center; padding: 1.5rem;">No subjects linked.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- REPORTS (ACTIONS) -->
                            <div id="tab-reports" class="hidden">
                                <div class="grid-3">
                                    <button class="panel" style="width: 100%; text-align: left; transition: transform 0.2s; cursor: pointer;" onclick="openReport('traffic')">
                                        <div class="panel-body" style="display: flex; align-items: center; gap: 1rem;">
                                            <div style="background: #fffbeb; color: #b45309; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                                <i class="fa-solid fa-ticket"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 600; color: var(--text-primary);">Write Citation</div>
                                                <div style="font-size: 0.8rem; color: var(--text-secondary);">Traffic / Violation</div>
                                            </div>
                                        </div>
                                    </button>

                                    <button class="panel" style="width: 100%; text-align: left; transition: transform 0.2s; cursor: pointer;" onclick="openReport('arrest')">
                                        <div class="panel-body" style="display: flex; align-items: center; gap: 1rem;">
                                            <div style="background: #fef2f2; color: #b91c1c; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                                <i class="fa-solid fa-handcuffs"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight: 600; color: var(--text-primary);">Arrest Report</div>
                                                <div style="font-size: 0.8rem; color: var(--text-secondary);">Felony / Misdemeanor</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- FOOTER -->
                        <div style="padding: 10px 2rem; background: white; border-top: 1px solid var(--border); text-align: right;">
                             <button class="btn btn-ghost" onclick="closeIncident()">Close Incident Workspace</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Global Tab Helper
window.switchTab = (tabName) => {
    ['narrative', 'subjects', 'reports'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    // Highlight nav
    document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
    // (Simple hack) find the click target parent? No, just rely on content switching for now.
};

let currentIncident = null;
let stagedSubject = null;

export function init() {
    const list = document.getElementById('call-list');
    const simBtn = document.getElementById('sim-call-btn');
    const mdtEmpty = document.getElementById('mdt-empty');
    const mdtActive = document.getElementById('mdt-active');

    // Link Search Logic
    document.getElementById('run-sub-search').addEventListener('click', () => {
        const q = document.getElementById('sub-search').value;
        if (!q) return;
        stagedSubject = generateProfile(q);
        const qr = document.getElementById('quick-result');
        qr.classList.remove('hidden');
        document.getElementById('qr-name').innerText = stagedSubject.name;
        document.getElementById('qr-status').innerText = `${stagedSubject.sex}/${stagedSubject.race} | DOB: ${stagedSubject.dob}`;
    });

    // Helper functions
    window.linkSubject = (role) => {
        if (!currentIncident || !stagedSubject) return;
        const savedSub = db.createSubject(stagedSubject);
        db.linkSubjectToIncident(currentIncident.id, savedSub.id, role);
        db.addNarrative(currentIncident.id, `Linked Subject: ${savedSub.name} as ${role}`);
        loadIncident(currentIncident.id);
        document.getElementById('quick-result').classList.add('hidden');
    };

    window.closeIncident = () => {
        currentIncident = null;
        mdtActive.classList.add('hidden');
        mdtEmpty.classList.remove('hidden');
        renderList();
    };

    window.updateCallStatus = (newStatus) => {
        if (!currentIncident) return;

        // Update DB
        db.updateIncident(currentIncident.id, { status: newStatus });

        // Log it
        if (newStatus !== 'ACTIVE') {
            db.addNarrative(currentIncident.id, `Incident marked as ${newStatus}`, 'DISPATCH');
        }

        // Refresh
        // If archived or cleared, maybe close?
        // For now just re-load to update UI state if needed
        loadIncident(currentIncident.id);
        renderList(); // Update list sidebar
    };

    // REAL ROUTING - NO ALERTS
    window.openReport = (type) => {
        if (!currentIncident) return;

        if (type === 'traffic') {
            // 1. Save Context
            sessionStorage.setItem('active_incident_context', currentIncident.id);
            // 2. Trigger Route Change (Using app.js exposed global? Or finding the sidebar element)
            // Ideally app.js exports loadRoute, but we can't import circular.
            // We'll simulate a click on the sidebar nav.
            const nav = document.querySelector(`[data-route="traffic"]`);
            if (nav) nav.click();
        } else {
            alert("Arrest Module pending refactor to Light Mode.");
        }
    };

    function renderList() {
        const incidents = db.getIncidents();
        document.getElementById('call-count').innerText = incidents.length;

        list.innerHTML = incidents.map(inc => `
            <div onclick="window.selectCall('${inc.id}')" style="background: white; border: 1px solid var(--border); padding: 12px; margin-bottom: 8px; cursor: pointer; border-radius: 6px; position: relative;">
                ${inc.status === 'ACTIVE' ? `<div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--status-success); border-radius: 6px 0 0 6px;"></div>` : ''}
                <div style="margin-left: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 0.75rem; font-weight: 600; color: var(--gov-blue);">${inc.id}</span>
                        <span class="text-secondary" style="font-size: 0.7rem;">${new Date(inc.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${inc.type}</div>
                    <div class="text-secondary" style="font-size: 0.85rem;">${inc.location}</div>
                </div>
            </div>
        `).join('');
    }

    window.selectCall = (id) => loadIncident(id);

    function loadIncident(id) {
        currentIncident = db.getIncident(id);
        if (!currentIncident) return;
        mdtEmpty.classList.add('hidden');
        mdtActive.classList.remove('hidden');

        document.getElementById('active-id').innerText = currentIncident.id;
        document.getElementById('active-type').innerText = currentIncident.type;
        document.getElementById('active-loc').innerText = currentIncident.location;

        // Set Status Dropdown
        const statusSel = document.getElementById('active-status-select');
        if (statusSel) {
            statusSel.value = currentIncident.status;
            // Visual feedback
            if (currentIncident.status === 'ACTIVE') statusSel.style.borderColor = 'var(--status-warning)';
            else if (currentIncident.status === 'CLEARED') statusSel.style.borderColor = 'var(--status-success)';
            else statusSel.style.borderColor = 'var(--border)';
        }

        const log = document.getElementById('narrative-log');
        log.innerHTML = currentIncident.narrative_log.map(n => `
            <div style="background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary);">${n.author}</span>
                    <span class="text-secondary" style="font-size: 0.7rem;">${new Date(n.time).toLocaleTimeString()}</span>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-primary);">${n.text}</div>
            </div>
        `).join('');

        const subList = document.getElementById('linked-subs-list');
        if (currentIncident.linked_subjects.length === 0) {
            subList.innerHTML = `<div class="text-secondary" style="text-align: center; padding: 1.5rem;">No subjects linked.</div>`;
        } else {
            subList.innerHTML = currentIncident.linked_subjects.map(link => `
                <div style="padding: 10px 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span class="badge" style="background: ${link.role === 'Suspect' ? '#fee2e2' : '#dbeafe'}; color: ${link.role === 'Suspect' ? '#b91c1c' : '#1e40af'};">${link.role}</span>
                        <span style="font-weight: 500; margin-left: 8px;">ID: ${link.id}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    // New Narrative
    document.getElementById('send-narrative').addEventListener('click', () => {
        const val = document.getElementById('narrative-input').value;
        if (val && currentIncident) {
            db.addNarrative(currentIncident.id, val);
            document.getElementById('narrative-input').value = '';
            loadIncident(currentIncident.id);
        }
    });

    // Simulate Call
    simBtn.addEventListener('click', () => {
        const types = ['Domestic Disturbance', 'Traffic Stop', 'Suspicious Activity', 'Alarm', 'Theft in Progress'];
        const locs = ['101 Main St', 'Hwy 66 @ MM 12', 'Walmart', 'Rogersville High', 'Super 8 Motel'];
        db.createIncident(
            types[Math.floor(Math.random() * types.length)],
            locs[Math.floor(Math.random() * locs.length)],
            "Caller reports incident nearby. Requesting units."
        );
        renderList();
    });

    renderList();
}
