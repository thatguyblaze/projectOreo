export function getTemplate() {
    return `
        <div class="card">
            <div class="card-header">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div class="card-title">Case #RPD-26-0012</div>
                    <span class="badge badge-danger">OPEN - HOMICIDE</span>
                </div>
                <div>
                     <span style="color: var(--text-medium); margin-right: 1rem;">Lead: Det. Vance</span>
                     <button class="btn-primary" id="add-evidence-btn"><i class="fa-solid fa-plus"></i> Add Evidence</button>
                </div>
            </div>
            
            <div class="case-tabs">
                <div class="case-tab active">Case Details</div>
                <div class="case-tab">Evidence Vault (12)</div>
                <div class="case-tab">Chain of Custody</div>
            </div>

            <div class="card-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Incident Location</label>
                        <input type="text" class="form-control" value="892 North St, Rogersville, MA 02199">
                    </div>
                    <div class="form-group">
                        <label>Date / Time</label>
                        <input type="datetime-local" class="form-control" value="2024-10-23T23:42">
                    </div>
                    <div class="form-group" style="grid-column: span 2;">
                        <label>Narrative Summary</label>
                        <textarea class="form-control" rows="4">Suspect apprehended near scene. Weapon recovered. Initial perimeter established by Unit 4-Alpha. Forensics requested for processing. Chain of custody initiated for all recovered items.</textarea>
                    </div>
                </div>

                <h4 style="margin: 2rem 0 1rem 0; color: var(--brand-navy); border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;">Suspect Information</h4>
                
                <div class="form-grid">
                     <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" class="form-control" value="Doe, John A.">
                    </div>
                    <div class="form-group">
                        <label>DOB</label>
                        <input type="date" class="form-control" value="1985-04-12">
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">Evidence Vault</div>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                    <!-- Evidence Item -->
                    <div style="border: 1px solid var(--border-light); border-radius: 4px; overflow: hidden; position: relative;">
                        <div style="height: 100px; background: #333; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fa-solid fa-image fa-2x"></i>
                        </div>
                        <div style="padding: 8px;">
                            <div style="font-weight: 600; font-size: 0.8rem;">Scene Photo 01</div>
                            <div style="font-size: 0.7rem; color: var(--text-medium);">JPG • 4.2 MB</div>
                        </div>
                        <div class="badge badge-success" style="position: absolute; top: 4px; right: 4px;">SYNCED</div>
                    </div>
                     <!-- Evidence Item -->
                    <div style="border: 1px solid var(--border-light); border-radius: 4px; overflow: hidden; position: relative;">
                        <div style="height: 100px; background: #333; display: flex; align-items: center; justify-content: center; color: white;">
                             <i class="fa-solid fa-file-video fa-2x"></i>
                        </div>
                        <div style="padding: 8px;">
                            <div style="font-weight: 600; font-size: 0.8rem;">Bodycam - Miller</div>
                            <div style="font-size: 0.7rem; color: var(--text-medium);">MP4 • 1.2 GB</div>
                        </div>
                         <div class="badge badge-warning" style="position: absolute; top: 4px; right: 4px;">PROCESSING</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const btn = document.getElementById('add-evidence-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            // Simulation of "Add Narrative" or Upload
            alert("File Upload Dialog Simulator Initiated");
        });
    }
}
