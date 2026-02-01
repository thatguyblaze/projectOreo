import { db } from '../store.js';

// Helper for demo case ID
// In a real app, this would come from the router or URL
const currentCaseId = 'CASE-INIT-001';

export function getTemplate() {
    return `
        <div class="case-manager-container fade-in">
            <!-- Header -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header" style="background: white; border-bottom: none; padding-bottom: 0;">
                    <div style="flex:1;">
                        <h2 style="margin: 0; color: var(--brand-navy);" id="case-header-id">Case Loading...</h2>
                        <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                            <span class="badge badge-danger" id="case-header-status">OPEN</span>
                            <span id="workflow-pill" class="badge" style="background: #e2e8f0; color: #475569;">DRAFTING</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                         <div style="font-size: 0.9rem; color: var(--text-muted);">Lead Detective</div>
                         <div style="font-weight: 600;" id="case-header-lead">...</div>
                         <div style="margin-top: 5px;">
                            <select id="supervisor-action" class="form-input" style="padding: 4px; font-size: 0.8rem;">
                                <option value="Draft">Status: Draft</option>
                                <option value="Review">Submit for Review</option>
                                <option value="Approved">Mark Approved</option>
                                <option value="Closed">Close Case</option>
                            </select>
                         </div>
                    </div>
                </div>
                
                <!-- Minimal Tabs -->
                <div class="tabs-nav" style="padding: 0 1.5rem; margin-top: 1rem; border-bottom: 1px solid var(--border);">
                    <button class="tab-btn active" data-tab="details">Case Details</button>
                    <button class="tab-btn" data-tab="vault">Evidence Vault</button>
                    <button class="tab-btn" data-tab="chain">Chain of Custody</button>
                </div>
            </div>

            <!-- Content Area -->
            
            <!-- TAB: Details (Expanded) -->
            <div id="tab-content-details" class="tab-content">
               <div class="card">
                    <div class="card-body">
                        <h4 class="form-section-title">Incident Essentials</h4>
                        <div class="grid-2">
                             <div class="form-group">
                                <label>Incident Type</label>
                                <input type="text" class="form-input" id="detail-type" readonly>
                            </div>
                            <div class="form-group">
                                <label>Location</label>
                                <input type="text" class="form-input" id="detail-location" readonly>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Officer Narrative</label>
                            <textarea class="form-input" rows="6" id="detail-narrative" readonly></textarea>
                        </div>

                        <h4 class="form-section-title">Investigative Data</h4>
                        <div class="grid-3">
                             <div class="form-group">
                                <label>Suspect Description</label>
                                <input type="text" class="form-input" id="detail-suspect" placeholder="Height, Build, Clothing..." readonly>
                            </div>
                            <div class="form-group">
                                <label>Weapon Involved</label>
                                <input type="text" class="form-input" id="detail-weapon" placeholder="Type and Caliber" readonly>
                            </div>
                             <div class="form-group">
                                <label>Motive / Intent</label>
                                <input type="text" class="form-input" id="detail-motive" placeholder="Unknown" readonly>
                            </div>
                        </div>

                        <h4 class="form-section-title">Victim / witness Information</h4>
                        <div class="form-group">
                            <label>Contact Details (Confidential)</label>
                            <textarea class="form-input" rows="2" id="detail-victim" placeholder="Name, Phone, Address..." readonly style="background: #fff1f2; border-color: #fecdd3;"></textarea>
                        </div>
                    </div>
               </div>
            </div>

            <!-- TAB: Vault -->
            <div id="tab-content-vault" class="tab-content hidden">
                <!-- Drop Zone / Toolbar -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 400; color: var(--brand-navy);">Digital Evidence Repository</h3>
                    <input type="file" id="evidence-upload-input" multiple style="display: none;">
                    <button class="btn btn-primary" id="trigger-upload">
                        <i class="fa-solid fa-cloud-arrow-up"></i> UPLOAD NEW EVIDENCE
                    </button>
                </div>

                <div id="upload-drop-zone" style="border: 2px dashed var(--border); border-radius: 8px; background: #fff; padding: 2rem; text-align: center; margin-bottom: 2rem; cursor: pointer; transition: all 0.2s;" class="hidden">
                    <i class="fa-solid fa-folder-plus" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <div style="font-weight: 500; color: var(--brand-navy);">Drag files here or click to browse</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">Supports: MP4, JPG, PDF, WAV (Max: 5GB)</div>
                </div>

                <!-- Grid -->
                <div id="evidence-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
                    <!-- Items Injected -->
                </div>
            </div>

            <!-- TAB: Chain -->
            <div id="tab-content-chain" class="tab-content hidden">
                <div class="card">
                     <table class="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Hash</th>
                            </tr>
                        </thead>
                        <tbody id="chain-table-body">
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;
}

export function init() {
    // 1. Load or Create a Default Case for Demo
    ensureDemoCase();
    loadCaseData();

    // 2. Tab Logic
    const navButtons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            contents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-content-${btn.dataset.tab}`).classList.remove('hidden');
        });
    });

    // 3. Upload Logic
    const triggerBtn = document.getElementById('trigger-upload');
    const fileInput = document.getElementById('evidence-upload-input');
    const dropZone = document.getElementById('upload-drop-zone');

    if (triggerBtn) {
        // Toggle Dropzone visibility for "Add Evidence" feel
        triggerBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    // Drag & Drop
    document.addEventListener('dragover', (e) => { e.preventDefault(); }); // Global prevent

    // 4. Supervisor Action Logic
    const statusSelect = document.getElementById('supervisor-action');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            const workflowStatus = e.target.value;
            const workflowPill = document.getElementById('workflow-pill');

            // Visual Update
            if (workflowPill) updateWorkflowPill(workflowPill, workflowStatus);

            // Save to DB (Quick Hack)
            const c = db.getCaseById(currentCaseId);
            if (c) {
                c.workflow = workflowStatus;
                // Log it
                const action = `STATUS CHANGE: ${workflowStatus.toUpperCase()}`;

                // Add chain entry
                if (!c.chain) c.chain = [];
                c.chain.unshift({
                    timestamp: new Date().toISOString(),
                    user: db.getCurrentOfficer().name,
                    action: action,
                    hash: 'ADMIN-OVERRIDE'
                });

                // Refresh chain table if visible
                loadCaseData();
            }
        });
    }

    function handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            // Upload to DB
            db.addEvidence(currentCaseId, {
                name: file.name,
                type: file.type || 'Unknown',
                size: formatBytes(file.size)
            });
        });
        // Refresh
        loadCaseData();
        // Switch to Vault tab if not there
        const vaultTab = document.querySelector('[data-tab="vault"]');
        if (vaultTab) vaultTab.click();
    }

    function loadCaseData() {
        const c = db.getCaseById(currentCaseId);
        if (!c) return;

        // Header
        const headerId = document.getElementById('case-header-id');
        if (headerId) headerId.innerText = `Case #${c.id.substring(0, 8).toUpperCase()}`;

        const headerLead = document.getElementById('case-header-lead');
        if (headerLead) headerLead.innerText = c.officer.name;

        // Workflow Status
        const wf = c.workflow || 'Draft';
        const pill = document.getElementById('workflow-pill');
        if (pill) updateWorkflowPill(pill, wf);
        const sel = document.getElementById('supervisor-action');
        if (sel) sel.value = wf;

        // Detail Fields
        if (document.getElementById('detail-type')) {
            document.getElementById('detail-type').value = c.type || 'General Investigation';
            document.getElementById('detail-location').value = c.location || 'Unknown';
            document.getElementById('detail-narrative').value = c.narrative || 'No narrative provided.';

            // Expanded Data (Safe defaults)
            document.getElementById('detail-suspect').value = c.suspect_desc || 'Not listed';
            document.getElementById('detail-weapon').value = c.weapon || 'None';
            document.getElementById('detail-motive').value = c.motive || 'Under Investigation';
            document.getElementById('detail-victim').value = c.victim_info || 'Confidential';
        }

        // Evidence Grid
        const grid = document.getElementById('evidence-grid');
        if (grid) {
            grid.innerHTML = '';

            if (!c.evidence || c.evidence.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted); border: 2px dashed var(--border); border-radius: 8px;">
                        <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <div>Vault is Empty</div>
                        <div style="font-size: 0.8rem;">Upload files to establish chain of custody.</div>
                    </div>
                `;
            } else {
                c.evidence.forEach(ev => {
                    grid.appendChild(createEvidenceCard(ev));
                });
            }
        }

        // Chain Table
        const chainBody = document.getElementById('chain-table-body');
        if (chainBody && c.chain) {
            chainBody.innerHTML = c.chain.map(log => `
                <tr>
                    <td style="font-size: 0.9rem;">${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td style="font-family: monospace; font-size: 0.8rem;">${log.hash}</td>
                </tr>
            `).join('');
        }
    }

    function createEvidenceCard(ev) {
        const div = document.createElement('div');
        div.className = 'evidence-card fade-in';
        div.style.background = 'white';
        div.style.border = '1px solid var(--border)';
        div.style.borderRadius = '8px';
        div.style.overflow = 'hidden';
        div.style.cursor = 'pointer';

        let icon = 'fa-file';
        let color = '#64748b';

        if (ev.type.includes('image')) { icon = 'fa-file-image'; color = '#0284c7'; }
        if (ev.type.includes('video')) { icon = 'fa-file-video'; color = '#dc2626'; }
        if (ev.type.includes('pdf')) { icon = 'fa-file-pdf'; color = '#ea580c'; }

        div.innerHTML = `
            <div style="height: 120px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: ${color};">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div style="padding: 10px;">
                <div style="font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ev.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">${ev.type.split('/')[1]?.toUpperCase() || 'FILE'} • ${ev.size}</div>
            </div>
        `;
        return div;
    }

    function updateWorkflowPill(pill, status) {
        pill.innerText = status.toUpperCase();
        pill.className = 'badge'; // Reset

        switch (status) {
            case 'Draft': pill.style.background = '#e2e8f0'; pill.style.color = '#475569'; break;
            case 'Review': pill.style.background = '#fef3c7'; pill.style.color = '#b45309'; break;
            case 'Approved': pill.style.background = '#dcfce7'; pill.style.color = '#166534'; break;
            case 'Closed': pill.style.background = '#334155'; pill.style.color = 'white'; break;
        }
    }

    function ensureDemoCase() {
        if (!db.getCaseById(currentCaseId)) {
            // Seed a case if missing
            const officer = db.getCurrentOfficer();
            db.addCase({
                id: currentCaseId,
                type: 'Aggravated Assault',
                location: '1204 Main St, Rogersville',
                narrative: 'Suspect engaged in altercation using a blunt object. Witness statements collected on scene.',
                status: 'Open',
                officer: officer,
                workflow: 'Draft',
                suspect_desc: 'Male, 6ft, approx 200lbs, wearing red hoodie.',
                weapon: 'Baseball Bat',
                motive: 'Dispute over debt',
                victim_info: 'John Doe (34) - 555-0192',
                evidence: [],
                chain: [
                    {
                        timestamp: new Date().toISOString(),
                        user: officer.name,
                        action: 'CASE OPENED',
                        hash: crypto.randomUUID().substring(0, 8)
                    }
                ]
            });
        }
    }

    // Format helper
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}
