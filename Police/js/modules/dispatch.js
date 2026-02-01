/* DISPATCH MODULE v2 - COMMAND OS */
import { db } from '../store.js';
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            
            <!-- TOP BAR: STATUS -->
            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-tower-broadcast text-cyan"></i> DISPATCH & OPERATIONS</div>
                </div>
                <div class="ws-controls">
                     <button class="btn btn-ghost" id="refresh-units"><i class="fa-solid fa-arrows-rotate"></i> REFRESH</button>
                     <div style="border-left: 1px solid var(--border); padding-left: 1rem; display: flex; gap: 10px; align-items: center;">
                        <span class="mono text-dim" style="font-size: 0.7rem;">MY STATUS</span>
                        <select id="my-status" class="input-field" style="width: 140px; padding: 4px;">
                            <option value="AVAIL">AVAILABLE</option>
                            <option value="BUSY">BUSY / PAPER</option>
                            <option value="ENRT">EN ROUTE</option>
                            <option value="SCENE">ON SCENE</option>
                        </select>
                     </div>
                </div>
            </div>

            <div style="flex: 1; display: grid; grid-template-columns: 350px 1fr; overflow: hidden;">
                
                <!-- LEFT: ACTIVE CALLS LIST -->
                <div style="border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--bg-panel);">
                    <div class="panel-head">
                        <span>PENDING CALLS</span>
                        <span class="text-cyan mono" id="call-count">0</span>
                    </div>
                    <div style="flex: 1; overflow-y: auto; padding: 10px;" id="call-list">
                        <!-- Content Injected -->
                    </div>
                    <div style="padding: 10px; border-top: 1px solid var(--border);">
                        <button class="btn btn-cyan" style="width: 100%; justify-content: center;" id="sim-call-btn">
                            <i class="fa-solid fa-plus"></i> SIMULATE 911 CALL
                        </button>
                    </div>
                </div>

                <!-- RIGHT: MDT WORKSPACE (INCIDENT VIEW) -->
                <div id="mdt-workspace" style="background: var(--bg-deep); display: flex; flex-direction: column;">
                    
                    <!-- EMPTY STATE -->
                    <div id="mdt-empty" style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-mono); flex-direction: column;">
                        <i class="fa-solid fa-satellite-dish" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.2;"></i>
                        <div>SYSTEM IDLE</div>
                        <div style="font-size: 0.8rem;">SELECT A CALL TO INITIALIZE MDT</div>
                    </div>

                    <!-- ACTIVE CALL UI (Hidden initially) -->
                    <div id="mdt-active" class="hidden" style="flex: 1; display: flex; flex-direction: column;">
                        
                        <!-- INCIDENT HEADER -->
                        <div style="padding: 1rem 2rem; background: rgba(6,182,212,0.05); border-bottom: 1px solid var(--border-glow); display: flex; justify-content: space-between;">
                            <div>
                                <div class="mono text-cyan" style="font-size: 0.9rem;" id="active-id">INC-24-000</div>
                                <div style="font-size: 1.5rem; font-weight: 300; color: white;" id="active-type">Type</div>
                                <div class="text-dim" style="font-size: 0.9rem;"><i class="fa-solid fa-location-dot"></i> <span id="active-loc">Location</span></div>
                            </div>
                            <div style="text-align: right;">
                                <div class="mono text-amber" style="font-size: 1.2rem;" id="active-timer">00:00</div>
                                <div style="font-size: 0.7rem; color: var(--text-mono);">TIME ON CALL</div>
                            </div>
                        </div>

                        <!-- TABS -->
                        <div style="display: flex; border-bottom: 1px solid var(--border); padding: 0 1rem; background: var(--bg-panel);">
                            <div class="nav-item active" onclick="switchTab('narrative')">NARRATIVE</div>
                            <div class="nav-item" onclick="switchTab('subjects')">SUBJECTS</div>
                            <div class="nav-item" onclick="switchTab('reports')">REPORTS</div>
                        </div>

                        <!-- CONTENT PANES -->
                        <div style="flex: 1; overflow-y: auto; padding: 1rem; position: relative;">
                            
                            <!-- TAB: NARRATIVE -->
                            <div id="tab-narrative">
                                <div class="input-group" style="display: flex; gap: 10px;">
                                    <input type="text" id="narrative-input" class="input-field" placeholder="Add update...">
                                    <button class="btn btn-ghost" id="send-narrative"><i class="fa-solid fa-paper-plane"></i></button>
                                </div>
                                <div id="narrative-log" style="display: flex; flex-direction: column; gap: 10px; margin-top: 1rem;">
                                    <!-- Log Items -->
                                </div>
                            </div>

                            <!-- TAB: SUBJECTS -->
                            <div id="tab-subjects" class="hidden">
                                <div class="grid-2">
                                    <div class="panel">
                                        <div class="panel-head">ADD INVOLVED PERSON</div>
                                        <div class="panel-body">
                                            <div class="input-group">
                                                <label class="input-label">NCIC SEARCH (NAME)</label>
                                                <div style="display: flex; gap: 5px;">
                                                    <input type="text" id="sub-search" class="input-field" placeholder="Last, First">
                                                    <button class="btn btn-cyan" id="run-sub-search">RUN</button>
                                                </div>
                                            </div>
                                            <div id="quick-result" class="hidden" style="margin-top: 10px; padding: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.3);">
                                                <div id="qr-name" class="text-bright font-bold">Name</div>
                                                <div id="qr-status" class="mono text-dim" style="font-size: 0.8rem;">Status</div>
                                                <div style="margin-top: 10px; display: flex; gap: 5px;">
                                                    <button class="btn btn-ghost" style="font-size: 0.7rem;" onclick="linkSubject('Suspect')">LINK SUSPECT</button>
                                                    <button class="btn btn-ghost" style="font-size: 0.7rem;" onclick="linkSubject('Victim')">LINK VICTIM</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="panel">
                                        <div class="panel-head">LINKED SUBJECTS</div>
                                        <div class="panel-body" id="linked-subs-list">
                                            <div class="text-dim mono" style="text-align: center;">No subjects linked.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: REPORTS -->
                            <div id="tab-reports" class="hidden">
                                <div class="grid-3">
                                    <button class="btn btn-amber" style="justify-content: center; height: 100px; flex-direction: column;" onclick="openReport('TRAFFIC')">
                                        <i class="fa-solid fa-ticket" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                        WRITE CITATION
                                    </button>
                                    <button class="btn btn-red" style="justify-content: center; height: 100px; flex-direction: column;" onclick="openReport('ARREST')">
                                        <i class="fa-solid fa-handcuffs" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                        ARREST REPORT
                                    </button>
                                    <button class="btn btn-cyan" style="justify-content: center; height: 100px; flex-direction: column;" onclick="openReport('EVIDENCE')">
                                        <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                                        LOG EVIDENCE
                                    </button>
                                </div>
                            </div>

                        </div>

                        <!-- FOOTER -->
                        <div style="padding: 10px; border-top: 1px solid var(--border); text-align: right;">
                             <button class="btn btn-ghost" onclick="closeIncident()">CLOSE INCIDENT</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// Global scope for HTML onclicks (Module pattern workaround for demo)
window.switchTab = (tabName) => {
    ['narrative', 'subjects', 'reports'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
};

let currentIncident = null;
let stagedSubject = null; // Result of search

export function init() {
    const list = document.getElementById('call-list');
    const simBtn = document.getElementById('sim-call-btn');

    // MDT Elements
    const mdtEmpty = document.getElementById('mdt-empty');
    const mdtActive = document.getElementById('mdt-active');

    // Bind Search
    document.getElementById('run-sub-search').addEventListener('click', () => {
        const query = document.getElementById('sub-search').value;
        if (!query) return;

        stagedSubject = generateProfile(query); // Use the Generator

        // Show Quick Result
        const qr = document.getElementById('quick-result');
        qr.classList.remove('hidden');
        document.getElementById('qr-name').innerText = stagedSubject.name;
        document.getElementById('qr-status').innerText = `${stagedSubject.sex}/${stagedSubject.race} | DOB: ${stagedSubject.dob} | ${stagedSubject.status}`;

        if (stagedSubject.status === 'WANTED') {
            document.getElementById('qr-status').style.color = 'var(--accent-red)';
        } else {
            document.getElementById('qr-status').style.color = 'var(--text-mono)';
        }
    });

    // Link Helper
    window.linkSubject = (role) => {
        if (!currentIncident || !stagedSubject) return;

        // Save Subject to DB first
        const savedSub = db.createSubject(stagedSubject);

        // Link to Incident
        db.linkSubjectToIncident(currentIncident.id, savedSub.id, role);

        // Log it
        db.addNarrative(currentIncident.id, `Linked Subject: ${savedSub.name} as ${role}`);

        // Refresh UI
        loadIncident(currentIncident.id); // Reloads data
        document.getElementById('quick-result').classList.add('hidden');
        document.getElementById('sub-search').value = '';
    };

    // Close Helper
    window.closeIncident = () => {
        currentIncident = null;
        mdtActive.classList.add('hidden');
        mdtEmpty.classList.remove('hidden');
        renderList();
    };

    // Open Report Helper
    window.openReport = (type) => {
        alert("This would open the " + type + " module pre-filled with Incident ID " + currentIncident.id + " and linked subjects.");
        // In full implementation, this routes to traffic.js with query params
    };

    // Render Logic
    function renderList() {
        const incidents = db.getIncidents(); // Now real objects
        document.getElementById('call-count').innerText = incidents.length;

        list.innerHTML = incidents.map(inc => `
            <div onclick="window.selectCall('${inc.id}')" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 10px; margin-bottom: 8px; cursor: pointer; border-left: 3px solid ${inc.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--text-mono)'};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span class="mono text-cyan" style="font-size: 0.7rem;">${inc.id}</span>
                    <span class="text-dim" style="font-size: 0.7rem;">${new Date(inc.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style="font-weight: 600; font-size: 0.9rem;">${inc.type}</div>
                <div class="text-dim" style="font-size: 0.8rem;">${inc.location}</div>
            </div>
        `).join('');
    }

    // Select Call Logic
    window.selectCall = (id) => {
        loadIncident(id);
    };

    function loadIncident(id) {
        currentIncident = db.getIncident(id); // Refresh
        if (!currentIncident) return;

        mdtEmpty.classList.add('hidden');
        mdtActive.classList.remove('hidden');

        // Header
        document.getElementById('active-id').innerText = currentIncident.id;
        document.getElementById('active-type').innerText = currentIncident.type;
        document.getElementById('active-loc').innerText = currentIncident.location;

        // Narrative
        const log = document.getElementById('narrative-log');
        log.innerHTML = currentIncident.narrative_log.map(n => `
            <div style="background: rgba(0,0,0,0.2); padding: 8px; border-left: 2px solid var(--border);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <span class="text-cyan" style="font-size: 0.75rem; font-weight: bold;">${n.author}</span>
                    <span class="mono text-dim" style="font-size: 0.65rem;">${new Date(n.time).toLocaleTimeString()}</span>
                </div>
                <div style="font-size: 0.85rem;">${n.text}</div>
            </div>
        `).join('');

        // Linked Subjects
        const subList = document.getElementById('linked-subs-list');
        if (currentIncident.linked_subjects.length === 0) {
            subList.innerHTML = `<div class="text-dim mono" style="text-align: center;">No subjects linked.</div>`;
        } else {
            subList.innerHTML = currentIncident.linked_subjects.map(link => {
                // In a real app we'd fetch the subject details again, but we assume we have them or simple display for now.
                // Since store doesn't easily resolve IDs to names without a method, we will cheat for this demo render:
                return `
                    <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); margin-bottom: 4px;">
                        <div>
                            <span class="badge" style="background: ${link.role === 'Suspect' ? 'var(--accent-red)' : 'var(--accent-cyan)'}; color: black; font-size: 0.6rem; padding: 2px 4px;">${link.role}</span>
                            <span class="mono text-bright">ID: ${link.id}</span> 
                        </div>
                    </div>
                `;
            }).join('');
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

    // Sim Call Logic
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

    // Initial Render
    renderList();
}
