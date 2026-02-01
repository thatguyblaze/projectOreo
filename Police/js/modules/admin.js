import { db } from '../store.js';

export function getTemplate() {
    return `
        <div class="fade-in">
            <!-- Top Controls -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Personnel Management</div>
                    <button class="btn btn-primary" id="btn-add-officer"><i class="fa-solid fa-user-plus"></i> Add Personnel</button>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Badge #</th>
                                <th>Name</th>
                                <th>Rank</th>
                                <th>Clearance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="officer-table-body">
                             <!-- Injected -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Officer Modal (Inline hidden) -->
            <div id="add-officer-panel" class="card hidden" style="border: 1px solid var(--brand-cobalt);">
                <div class="card-header" style="background: rgba(0, 86, 179, 0.05);">
                    <div class="card-title">New Officer Registration</div>
                </div>
                <div class="card-body">
                    <form id="add-officer-form">
                        <div class="grid-3">
                            <div class="form-group"><label>First Name</label><input type="text" name="first" class="form-input" required></div>
                            <div class="form-group"><label>Last Name</label><input type="text" name="last" class="form-input" required></div>
                            <div class="form-group"><label>Badge #</label><input type="text" name="badge" class="form-input" required></div>
                        </div>
                        <div class="grid-3">
                             <div class="form-group">
                                <label>Rank</label>
                                <select name="rank" class="form-input">
                                    <option>Officer</option><option>Detective</option><option>Sergeant</option><option>Lieutenant</option><option>Captain</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Clearance</label>
                                <select name="clearance" class="form-input">
                                    <option>L1 - PROBATION</option><option>L2 - STANDARD</option><option>L3 - PATROL</option><option>L4 - INVESTIGATOR</option><option>L5 - MASTER</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select name="status" class="form-input">
                                    <option>Active</option><option>Administrative Leave</option><option>Suspended</option>
                                </select>
                            </div>
                        </div>
                        <div style="text-align: right;">
                             <button type="button" class="btn btn-outline" id="cancel-add">Cancel</button>
                             <button type="submit" class="btn btn-primary">Save Record</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">System Health</div>
                    </div>
                    <div class="card-body">
                        <div class="health-item" style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Server Load (CPU)</span>
                                <span style="color: var(--success);" id="cpu-val">12%</span>
                            </div>
                            <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                <div style="width: 12%; height: 100%; background: var(--success);" id="cpu-bar"></div>
                            </div>
                        </div>
                         <div class="health-item" style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Storage (Evidence Vault)</span>
                                <span style="color: var(--warning);">82%</span>
                            </div>
                             <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                <div style="width: 82%; height: 100%; background: var(--warning);"></div>
                            </div>
                        </div>
                         <div class="health-item">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Court Sync Latency</span>
                                <span style="color: var(--success);" id="latency-val">24ms</span>
                            </div>
                             <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                <div style="width: 5%; height: 100%; background: var(--success);" id="latency-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Live Audit Trail (Global)</div>
                        <span class="badge badge-success">REALTIME</span>
                    </div>
                    <div class="card-body">
                        <div id="audit-log-container" style="font-family: 'Courier New', monospace; font-size: 0.8rem; height: 200px; overflow-y: auto; background: #f8fafc; padding: 10px; border: 1px solid var(--border); border-radius: 4px;">
                            <!-- Logs -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    renderOfficers();
    renderLogs();
    startHealthMonitor();

    // UI Logic
    const addBtn = document.getElementById('btn-add-officer');
    const addPanel = document.getElementById('add-officer-panel');
    const cancelBtn = document.getElementById('cancel-add');
    const form = document.getElementById('add-officer-form');

    addBtn.addEventListener('click', () => {
        addPanel.classList.remove('hidden');
        addBtn.disabled = true;
    });

    cancelBtn.addEventListener('click', () => {
        addPanel.classList.add('hidden');
        addBtn.disabled = false;
        form.reset();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const newOfficer = {
            name: `${data.get('last')}, ${data.get('first')}`,
            badge: data.get('badge'),
            rank: data.get('rank'),
            clearance: data.get('clearance'),
            status: data.get('status')
        };

        db.addOfficer(newOfficer);
        renderOfficers();

        // Reset UI
        addPanel.classList.add('hidden');
        addBtn.disabled = false;
        form.reset();
        alert("Officer Added Successfully");
    });

    // --- RENDERERS ---
    function renderOfficers() {
        const tbody = document.getElementById('officer-table-body');
        const officers = db.getAllOfficers();

        tbody.innerHTML = officers.map(o => `
            <tr>
                <td>${o.badge}</td>
                <td><span style="font-weight: 600;">${o.name}</span></td>
                <td>${o.rank}</td>
                <td><span class="badge" style="background: #e2e8f0;">${o.clearance}</span></td>
                <td><span class="badge ${getStatusBadge(o.status)}">${o.status}</span></td>
                <td>
                    <button class="btn-icon toggle-status" data-id="${o.id}" title="Toggle Active/Suspended">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach listeners to new buttons
        tbody.querySelectorAll('.toggle-status').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const officer = officers.find(x => x.id === id);
                if (officer) {
                    const newStatus = officer.status === 'Active' ? 'Suspended' : 'Active';
                    db.updateOfficerStatus(id, newStatus);
                    renderOfficers();
                }
            });
        });
    }

    function renderLogs() {
        const container = document.getElementById('audit-log-container');
        const logs = db.getRecentLogs();

        if (logs.length === 0) {
            container.innerHTML = '<div style="color: #94a3b8; text-align: center; padding-top: 20px;">No system logs available.</div>';
            return;
        }

        container.innerHTML = logs.map(l => {
            const time = new Date(l.timestamp).toLocaleTimeString();
            return `
                <div style="border-bottom: 1px dashed #e2e8f0; padding: 4px 0;">
                    <span style="color: var(--brand-cobalt);">[${time}]</span> 
                    <b>${l.user}</b>: ${l.action}
                </div>
            `;
        }).join('');
    }

    function startHealthMonitor() {
        // Simple interval to fluctuate values creates a "Live" feel
        setInterval(() => {
            const cpu = Math.floor(Math.random() * 20) + 5; // 5-25%
            const lat = Math.floor(Math.random() * 30) + 10; // 10-40ms

            const cpuEl = document.getElementById('cpu-val');
            const latencyEl = document.getElementById('latency-val');

            if (cpuEl) {
                cpuEl.innerText = cpu + '%';
                document.getElementById('cpu-bar').style.width = cpu + '%';

                latencyEl.innerText = lat + 'ms';
                document.getElementById('latency-bar').style.width = (lat / 2) + '%'; // Scale it visually
            }
        }, 3000);
    }

    function getStatusBadge(status) {
        if (status === 'Active') return 'badge-success';
        if (status === 'Suspended') return 'badge-danger';
        return 'badge-warning';
    }
}
