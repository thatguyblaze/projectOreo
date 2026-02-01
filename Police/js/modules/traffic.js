export function getTemplate() {
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; height: 100%;">
            <!-- Left: Scanner View -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="card" style="flex: 1; margin-bottom: 0; display: flex; flex-direction: column;">
                    <div class="card-header">
                        <div class="card-title"><i class="fa-solid fa-camera"></i> Live OCR Feed</div>
                        <div class="badge badge-success">CAMERA ACTIVE</div>
                    </div>
                    <div class="card-body" style="padding: 0; flex: 1; background: #000; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <!-- Simulated Camera View -->
                        <div style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover; opacity: 0.3; background: linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111), linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111); background-size: 20px 20px; background-position: 0 0, 10px 10px;"></div>
                        
                        <div id="scan-overlay" style="border: 2px solid var(--status-success); width: 60%; height: 30%; position: relative; box-shadow: 0 0 0 1000px rgba(0,0,0,0.7);">
                            <div style="position: absolute; top: -25px; left: 0; color: var(--status-success); font-weight: bold; background: black; padding: 2px 8px;">TARGET ACQUIRED</div>
                        </div>

                        <div id="scanned-plate-display" style="position: absolute; bottom: 20px; font-family: monospace; font-size: 3rem; color: var(--status-success); text-shadow: 0 0 10px var(--status-success);">
                            ABC-1234
                        </div>
                    </div>
                    <div class="card-footer" style="padding: 1rem; border-top: 1px solid var(--border-light);">
                        <button class="btn-primary" style="width: 100%; justify-content: center;" id="trigger-scan">
                            <i class="fa-solid fa-expand"></i> TRIGGER MANUAL SCAN
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Validation Form -->
            <div style="display: flex; flex-direction: column;">
                <div class="card" style="flex: 1; margin-bottom: 0;">
                    <div class="card-header">
                        <div class="card-title">Validation & Enforcement</div>
                        <div class="badge badge-success" id="ncic-status">NCIC: CONNECTED</div>
                    </div>
                    <div class="card-body">
                         <div class="alert" style="background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem; display: flex; gap: 10px; align-items: flex-start;">
                            <i class="fa-solid fa-circle-check" style="margin-top: 2px;"></i>
                            <div>
                                <div style="font-weight: bold;">Confirmed Match</div>
                                <div style="font-size: 0.9rem;">Vehicle registration matches OCR scan.</div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>License Plate (OCR)</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" class="form-control" value="ABC-1234" style="font-weight: bold; letter-spacing: 2px; background: #f0fdf4; border-color: #10b981;">
                                <button class="btn-icon" style="color: #10b981;"><i class="fa-solid fa-check"></i></button>
                            </div>
                        </div>

                        <div style="margin: 1.5rem 0; border-top: 1px solid var(--border-light);"></div>

                        <div class="form-grid">
                            <div class="form-group">
                                <label>Vehicle Make</label>
                                <input type="text" class="form-control" value="Toyota">
                            </div>
                            <div class="form-group">
                                <label>Model</label>
                                <input type="text" class="form-control" value="Camry">
                            </div>
                            <div class="form-group">
                                <label>Color</label>
                                <input type="text" class="form-control" value="Black">
                            </div>
                             <div class="form-group">
                                <label>Year</label>
                                <input type="text" class="form-control" value="2018">
                            </div>
                        </div>

                        <div style="margin: 1.5rem 0; border-top: 1px solid var(--border-light);"></div>

                        <div class="form-group">
                            <label>Registered Owner</label>
                            <input type="text" class="form-control" value="DOWNEY, ROBERT JR.">
                        </div>

                         <div class="form-group">
                            <label>Address</label>
                            <input type="text" class="form-control" value="10880 Malibu Point, Malibu, CA">
                        </div>

                        <div style="margin-top: 2rem;">
                            <button class="btn-primary" style="width: 100%; background: var(--status-warning); border-color: var(--status-warning); color: #78350f; justify-content: center;">
                                <i class="fa-solid fa-triangle-exclamation"></i> FLAGGED: EXPIRED REGISTRATION
                            </button>
                            <button class="btn-primary" style="width: 100%; margin-top: 10px; justify-content: center;">
                                <i class="fa-solid fa-print"></i> ISSUE CITATION
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const btn = document.getElementById('trigger-scan');
    const display = document.getElementById('scanned-plate-display');

    if (btn) {
        btn.addEventListener('click', () => {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SCANNING...';
            setTimeout(() => {
                // Randomize Plate
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                let plate = "";
                for (let i = 0; i < 7; i++) plate += chars.charAt(Math.floor(Math.random() * chars.length));
                plate = plate.substring(0, 3) + "-" + plate.substring(3);

                display.innerText = plate;
                btn.innerHTML = '<i class="fa-solid fa-expand"></i> TRIGGER MANUAL SCAN';
            }, 800);
        });
    }
}
