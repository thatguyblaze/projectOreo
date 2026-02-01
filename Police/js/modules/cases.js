import { db } from '../store.js';

// We'll simulate a selected Case ID for this demo
// In a real router, this would probably come from URL params
let currentCaseId = null;

export function getTemplate() {
    return `
        <div class="case-manager-container fade-in">
            <!-- Header -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header" style="background: white; border-bottom: none; padding-bottom: 0;">
                    <div style="flex:1;">
                        <h2 style="margin: 0; color: var(--brand-navy);" id="case-header-id">Case Loading...</h2>
                        <span class="badge badge-danger" id="case-header-status">OPEN</span>
                    </div>
                    <div style="text-align: right;">
                         <div style="font-size: 0.9rem; color: var(--text-muted);">Lead Detective</div>
                         <div style="font-weight: 600;" id="case-header-lead">...</div>
                    </div>
                </div>
                
                <!-- Minimal Tabs -->
                <div class="tabs-nav" style="padding: 0 1.5rem; margin-top: 1rem; border-bottom: 1px solid var(--border);">
                    <button class="tab-btn active" data-tab="vault">Evidence Vault</button>
                    <button class="tab-btn" data-tab="details">Case Details</button>
                    <button class="tab-btn" data-tab="chain">Chain of Custody</button>
                </div>
            </div>

            <!-- Content Area -->
            <div id="tab-content-vault" class="tab-content">
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

            <div id="tab-content-details" class="tab-content hidden">
               <div class="card">
                    <div class="card-body">
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
                            <label>Narrative</label>
                            <textarea class="form-input" rows="6" id="detail-narrative" readonly></textarea>
                        </div>
                    </div>
               </div>
            </div>

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

    // Toggle Dropzone visibility for "Add Evidence" feel
    triggerBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag & Drop
    document.addEventListener('dragover', (e) => { e.preventDefault(); }); // Global prevent

    // 4. Functions
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
        document.querySelector('[data-tab="vault"]').click();
    }

    function loadCaseData() {
        const c = db.getCaseById(currentCaseId);
        if (!c) return;

        // Header
        document.getElementById('case-header-id').innerText = `Case #${c.id.substring(0, 8).toUpperCase()}`;
        document.getElementById('case-header-lead').innerText = c.officer.name;

        // Details
        document.getElementById('detail-type').value = c.type || 'General Investigation';
        document.getElementById('detail-location').value = c.location || 'Unknown';
        document.getElementById('detail-narrative').value = c.narrative || 'No narrative provided.';

        // Evidence Grid
        const grid = document.getElementById('evidence-grid');
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

        // Chain Table
        const chainBody = document.getElementById('chain-table-body');
        if (c.chain) {
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
        div.style.cssText = `
            background: white;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        `;

        let icon = 'fa-file';
        let color = '#64748b';

        if (ev.fileType.includes('image')) { icon = 'fa-image'; color = '#10b981'; } // Green for img
        else if (ev.fileType.includes('video')) { icon = 'fa-file-video'; color = '#ef4444'; } // Red for video
        else if (ev.fileType.includes('pdf')) { icon = 'fa-file-pdf'; color = '#f59e0b'; } // Orange for PDF

        div.innerHTML = `
            <div style="height: 120px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border);">
                <i class="fa-solid ${icon}" style="font-size: 3rem; color: ${color};"></i>
            </div>
            <div style="padding: 1rem;">
                <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${ev.fileName}">${ev.fileName}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${ev.size || 'N/A'}</span>
                    <span class="badge badge-success" style="font-size: 0.6rem;">${ev.status}</span>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">
                    Added by ${ev.uploader.split(',')[0]}
                </div>
            </div>
        `;

        // Hover Effect
        div.addEventListener('mouseenter', () => {
            div.style.transform = 'translateY(-3px)';
            div.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
        });
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'translateY(0)';
            div.style.boxShadow = 'none';
        });

        return div;
    }

    function ensureDemoCase() {
        const existingdev = db.getCases()[0];
        if (existingdev) {
            currentCaseId = existingdev.id;
        } else {
            // Create one
            const newCase = db.addCase({
                type: 'Homicide Investigation',
                location: '892 North St, Rogersville',
                narrative: 'Initial responding units found victim...'
            });
            currentCaseId = newCase.id;
        }
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}
