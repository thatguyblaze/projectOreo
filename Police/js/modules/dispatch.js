import { db } from '../store.js';

// Local State for random call generation interval
let callInterval = null;

export function getTemplate() {
    return `
        <div class="fade-in">
            <div class="page-header">
                <div>
                    <div class="page-title">CAD Dispatch</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Computer Aided Dispatch System</div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="font-weight: 600; font-size: 0.9rem;">UNIT STATUS:</div>
                    <select id="unit-status-select" class="form-input" style="width: 150px; background: white;">
                        <option value="AVAILABLE">AVAILABLE 🟢</option>
                        <option value="ENROUTE">ENROUTE 🟡</option>
                        <option value="ON SCENE">ON SCENE 🔴</option>
                        <option value="BUSY">BUSY ⚪</option>
                    </select>
                </div>
            </div>

            <div class="grid-2" style="grid-template-columns: 2fr 1fr;">
                
                <!-- ACTIVE CALLS LIST -->
                <div class="card" style="height: calc(100vh - 200px); display: flex; flex-direction: column;">
                    <div class="card-header">
                        <div class="card-title"><i class="fa-solid fa-tower-broadcast"></i> Active Calls for Service</div>
                         <button class="btn btn-outline" id="force-call-btn" style="font-size: 0.7rem;">+ SIMULATE CALL</button>
                    </div>
                    <div class="card-body" style="flex: 1; padding: 0; overflow-y: auto; background: #f8fafc;">
                        <div id="cad-call-list" style="display: flex; flex-direction: column; gap: 1px;">
                            <!-- Injected Calls -->
                            <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                                Waiting for dispatch...
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CALL DETAILS & UNIT LOG -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Selected Call Details</div>
                        </div>
                        <div class="card-body" id="call-detail-panel">
                            <div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                                Select a call to view details
                            </div>
                        </div>
                    </div>

                    <div class="card">
                         <div class="card-header">
                            <div class="card-title">Nearby Units</div>
                        </div>
                        <div class="card-body">
                            <table class="data-table">
                                <thead><tr><th>Unit</th><th>Status</th></tr></thead>
                                <tbody>
                                    <tr><td>101 (Sgt. Miller)</td><td><span class="badge badge-success">AVAIL</span></td></tr>
                                    <tr><td>104 (Ofc. Jones)</td><td><span class="badge badge-danger">SCENE</span></td></tr>
                                    <tr><td>108 (Ofc. Smith)</td><td><span class="badge badge-warning">ENRT</span></td></tr>
                                    <tr><td>K9-1</td><td><span class="badge badge-success">AVAIL</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}

export function init() {
    const listContainer = document.getElementById('cad-call-list');
    const detailPanel = document.getElementById('call-detail-panel');
    const unitSelect = document.getElementById('unit-status-select');
    const forceBtn = document.getElementById('force-call-btn');

    // 1. Initial Load of Calls
    renderCalls();

    // 2. Simulate Random Incoming Calls
    if (!callInterval) {
        callInterval = setInterval(() => {
            if (settings.activeCalls.length < 5 && Math.random() > 0.7) {
                generateRandomCall();
                renderCalls();
            }
        }, 5000); // Check every 5s
    }

    // 3. Events
    forceBtn.addEventListener('click', () => {
        generateRandomCall();
        renderCalls();
    });

    unitSelect.addEventListener('change', (e) => {
        // Just visual for now, could save to store
        const val = e.target.value;
        e.target.style.borderColor =
            val === 'AVAILABLE' ? 'var(--success)' :
                val === 'ON SCENE' ? 'var(--danger)' :
                    val === 'ENROUTE' ? 'var(--warning)' : '#ccc';
    });

    // --- LOGIC ---

    function renderCalls() {
        if (settings.activeCalls.length === 0) {
            listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No Active Calls</div>`;
            return;
        }

        listContainer.innerHTML = settings.activeCalls.map(call => `
            <div class="cad-item" data-id="${call.id}" style="
                padding: 1rem; 
                background: white; 
                cursor: pointer; 
                border-left: 4px solid ${getPriorityColor(call.priority)};
                transition: background 0.2s;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <div style="font-weight: 700; color: #0f172a;">${call.type}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${getTimeSince(call.timestamp)}</div>
                </div>
                <div style="font-size: 0.9rem; color: #334155;">${call.location}</div>
                <div style="margin-top: 6px; display: flex; gap: 6px;">
                    <span class="badge" style="background: #f1f5f9; color: #475569;">#${call.id.substring(0, 4)}</span>
                    <span class="badge" style="background: ${getPriorityColor(call.priority)}20; color: ${getPriorityColor(call.priority)};">PRIORITY ${call.priority}</span>
                </div>
            </div>
        `).join('');

        // Attach Clicks
        document.querySelectorAll('.cad-item').forEach(item => {
            item.addEventListener('click', () => {
                const call = settings.activeCalls.find(c => c.id === item.dataset.id);
                showCallDetails(call);
            });
            // Hover effect logic handled by CSS if we added a class, but inline suffices for demo
            item.addEventListener('mouseenter', () => item.style.background = '#f8fafc');
            item.addEventListener('mouseleave', () => item.style.background = 'white');
        });
    }

    function showCallDetails(call) {
        detailPanel.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: bold;">Incident Type</div>
                <div style="font-size: 1.2rem; font-weight: 700;">${call.type}</div>
            </div>
             <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: bold;">Location</div>
                <div style="font-size: 1rem;">${call.location}</div>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: bold;">Narrative</div>
                <div style="background: #fffbeb; padding: 10px; border: 1px solid #e2e8f0; font-size: 0.9rem; line-height: 1.4;">
                    ${call.narrative}
                </div>
            </div>
            
            <div class="grid-2">
                <button class="btn btn-primary" id="accept-call-btn">
                    <i class="fa-solid fa-check"></i> DISPATCH ME
                </button>
                 <button class="btn btn-outline" id="clear-call-btn">
                    <i class="fa-solid fa-xmark"></i> CLEAR
                </button>
            </div>
        `;

        document.getElementById('accept-call-btn').addEventListener('click', () => {
            unitSelect.value = 'ENROUTE';
            unitSelect.dispatchEvent(new Event('change'));
            alert(`Dispatched to Call #${call.id.substring(0, 4)}`);
        });

        document.getElementById('clear-call-btn').addEventListener('click', () => {
            // Remove locally
            settings.activeCalls = settings.activeCalls.filter(c => c.id !== call.id);
            renderCalls();
            detailPanel.innerHTML = 'Select a call...';
            unitSelect.value = 'AVAILABLE';
        });
    }

    // --- HELPERS ---

    // Temp Local Store Mock (Should be in store.js ideally, but keeping isolated for module speed)
    const settings = {
        activeCalls: []
    };

    function generateRandomCall() {
        const types = [
            { t: 'Domestic Disturbance', p: 1 },
            { t: 'Traffic Accident', p: 2 },
            { t: 'Alarm Activation', p: 3 },
            { t: 'Suspicious Person', p: 2 },
            { t: 'Shoplifting', p: 3 },
            { t: 'Noise Complaint', p: 4 }
        ];
        const streets = ['Main St', 'Highway 11', 'Colonial Rd', 'McKinney Ave', 'Park Blvd', 'Church St'];

        const typeObj = types[Math.floor(Math.random() * types.length)];
        const street = streets[Math.floor(Math.random() * streets.length)];
        const houseNum = Math.floor(Math.random() * 900) + 100;

        settings.activeCalls.unshift({
            id: crypto.randomUUID(),
            type: typeObj.t,
            priority: typeObj.p,
            location: `${houseNum} ${street}`,
            timestamp: Date.now(),
            narrative: `Caller reports ${typeObj.t.toLowerCase()} at location. Dispatch requested.`
        });
    }

    function getPriorityColor(p) {
        if (p === 1) return '#ef4444'; // Red
        if (p === 2) return '#f59e0b'; // Orange
        if (p === 3) return '#3b82f6'; // Blue
        return '#64748b'; // Gray
    }

    function getTimeSince(ts) {
        const sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 60) return 'Just now';
        return `${Math.floor(sec / 60)}m ago`;
    }
}
