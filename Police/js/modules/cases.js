export function getTemplate() {
    return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">Case #RPD-26-0012</div>
                    <span class="badge badge-danger">OPEN - HOMICIDE</span>
                </div>
                <div>
                     <span style="color: var(--text-muted); margin-right: 1rem; font-size: 0.9rem;">Lead: Det. Vance</span>
                     <button class="btn btn-primary" id="add-evidence-btn"><i class="fa-solid fa-plus"></i> Add Evidence</button>
                </div>
            </div>
            
            <div class="tabs-nav">
                <button class="tab-btn active" data-tab="details">Details</button>
                <button class="tab-btn" data-tab="vault">Evidence Vault (12)</button>
                <button class="tab-btn" data-tab="chain">Chain of Custody</button>
            </div>

            <div class="card-body">
                
                <!-- Tab: Details -->
                <div id="tab-content-details" class="tab-content">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Incident Location</label>
                            <input type="text" class="form-input" value="892 North St, Rogersville, MA 02199">
                        </div>
                        <div class="form-group">
                            <label>Date / Time</label>
                            <input type="datetime-local" class="form-input" value="2024-10-23T23:42">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Narrative Summary (Officer Report)</label>
                            <textarea class="form-input" rows="5">Suspect apprehended near scene. Weapon recovered. Initial perimeter established by Unit 4-Alpha. Forensics requested for processing. Chain of custody initiated for all recovered items.</textarea>
                        </div>
                    </div>

                    <h4 style="margin: 2rem 0 1rem 0; color: var(--brand-navy); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">Suspect Information</h4>
                    
                    <div class="form-grid">
                         <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" class="form-input" value="Doe, John A.">
                        </div>
                        <div class="form-group">
                            <label>DOB</label>
                            <input type="date" class="form-input" value="1985-04-12">
                        </div>
                    </div>
                </div>

                <!-- Tab: Vault -->
                <div id="tab-content-vault" class="tab-content hidden">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                        <!-- Evidence Item 1 -->
                        <div style="border: 1px solid var(--border); border-radius: 4px; overflow: hidden; position: relative;">
                            <div style="height: 100px; background: #333; display: flex; align-items: center; justify-content: center; color: white;">
                                <i class="fa-solid fa-image fa-2x"></i>
                            </div>
                            <div style="padding: 8px;">
                                <div style="font-weight: 600; font-size: 0.8rem;">Scene Photo 01</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">JPG • 4.2 MB</div>
                            </div>
                            <div class="badge badge-success" style="position: absolute; top: 4px; right: 4px; font-size: 0.6rem;">SYNCED</div>
                        </div>
                         <!-- Evidence Item 2 -->
                        <div style="border: 1px solid var(--border); border-radius: 4px; overflow: hidden; position: relative;">
                            <div style="height: 100px; background: #333; display: flex; align-items: center; justify-content: center; color: white;">
                                 <i class="fa-solid fa-file-video fa-2x"></i>
                            </div>
                            <div style="padding: 8px;">
                                <div style="font-weight: 600; font-size: 0.8rem;">Bodycam - Miller</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">MP4 • 1.2 GB</div>
                            </div>
                             <div class="badge badge-warning" style="position: absolute; top: 4px; right: 4px; font-size: 0.6rem;">PROCESSING</div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Chain of Custody -->
                <div id="tab-content-chain" class="tab-content hidden">
                     <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left;">
                                <th style="padding: 10px;">Date/Time</th>
                                <th style="padding: 10px;">User</th>
                                <th style="padding: 10px;">Action</th>
                                <th style="padding: 10px;">Hash Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 10px;">Oct 24, 10:42 AM</td>
                                <td style="padding: 10px;">Sgt. Miller (#8921)</td>
                                <td style="padding: 10px;">Checked Out</td>
                                <td style="padding: 10px; font-family: monospace;">8x92...a921</td>
                            </tr>
                             <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 10px;">Oct 23, 11:55 PM</td>
                                <td style="padding: 10px;">SysAdmin</td>
                                <td style="padding: 10px;">Initial Deposit</td>
                                <td style="padding: 10px; font-family: monospace;">7b21...k902</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    `;
}

export function init() {
    const container = document.querySelector('.card-body'); // Scope appropriately
    const navButtons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            // Hide all contents
            contents.forEach(c => c.classList.add('hidden'));

            // Show target
            const targetId = `tab-content-${btn.dataset.tab}`;
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Mock Upload Interaction
    const addBtn = document.getElementById('add-evidence-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert("File System Access Requested... (Simulation)");
        });
    }
}
