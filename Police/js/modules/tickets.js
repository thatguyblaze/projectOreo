export function getTemplate() {
    return `
        <div style="display: flex; gap: 2rem; height: 100%;">
            <!-- Left: Scanner -->
            <div class="glass-panel" style="flex: 1; padding: 1.5rem; display: flex; flex-direction: column;">
                <h3 class="stat-label" style="margin-bottom: 1rem;">LPR SYSTEM (License Plate Recognition)</h3>
                
                <div class="scanner-interface" id="scanner-view">
                    <div class="scan-line"></div>
                    <div style="position: absolute; bottom: 20px; text-align: center; width: 100%;">
                        <div id="ocr-display" class="ocr-result hidden">DETECTING...</div>
                    </div>
                    <i class="fa-solid fa-camera" style="font-size: 4rem; color: rgba(255,255,255,0.1);"></i>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 1rem;">
                    <button id="scan-btn" class="cta-btn full-width" style="background: var(--primary);">
                        <i class="fa-solid fa-qrcode"></i> SCAN PLATE
                    </button>
                    <button class="cta-btn" style="background: var(--bg-darker); border: 1px solid var(--border);">
                        <i class="fa-solid fa-upload"></i>
                    </button>
                </div>

                <div class="glass-panel" style="margin-top: 1.5rem; padding: 1rem; flex: 1; border: 1px solid var(--danger);">
                    <h4 class="stat-label" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> HOTLIST ALERT</h4>
                    <div id="alert-box" style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;">
                        No active alerts for current scan.
                    </div>
                </div>
            </div>

            <!-- Right: Citation Form -->
            <div class="glass-panel" style="flex: 1; padding: 2rem; overflow-y: auto;">
                <h3 class="stat-label" style="margin-bottom: 1.5rem;">New Citation</h3>
                
                <form id="ticket-form">
                    <div class="form-group">
                        <label>License Plate</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-car"></i>
                            <input type="text" id="plate-input" placeholder="ABC-1234">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Violation Type</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-gavel"></i>
                            <select id="violation-select" style="width: 100%; background: transparent; border: none; padding: 12px 12px 12px 40px; color: white; outline: none;">
                                <option value="" style="background: var(--bg-dark);">Select Violation...</option>
                                <option value="speeding" style="background: var(--bg-dark);">Speeding (15+ over)</option>
                                <option value="parking" style="background: var(--bg-dark);">Illegal Parking</option>
                                <option value="expired" style="background: var(--bg-dark);">Expired Registration</option>
                                <option value="reckless" style="background: var(--bg-dark);">Reckless Driving</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Location</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-location-dot"></i>
                            <input type="text" id="location-input" value="Lat: 40.7128, Long: -74.0060">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Court Date Sync</label>
                        <div class="input-wrapper" style="border-color: var(--success); background: rgba(16, 185, 129, 0.1);">
                            <i class="fa-solid fa-calendar-check" style="color: var(--success);"></i>
                            <input type="text" value="Auto-assigned: Oct 24, 2024 - 09:00 AM" readonly style="color: var(--success);">
                        </div>
                    </div>

                    <button type="button" class="cta-btn full-width">ISSUE CITATION</button>
                </form>
            </div>
        </div>
    `;
}

export function init(container) {
    const scanBtn = container.querySelector('#scan-btn');
    const ocrDisplay = container.querySelector('#ocr-display');
    const plateInput = container.querySelector('#plate-input');
    const alertBox = container.querySelector('#alert-box');
    const scannerView = container.querySelector('#scanner-view');

    scanBtn.addEventListener('click', () => {
        // Reset
        ocrDisplay.classList.add('hidden');
        alertBox.innerHTML = 'Scanning...';
        scannerView.style.borderColor = 'var(--text-muted)';

        // Simulate Scanning
        scanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SCANNING...';

        setTimeout(() => {
            // Random Plate Generation
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const nums = '0123456789';
            const plate =
                chars.charAt(Math.floor(Math.random() * chars.length)) +
                chars.charAt(Math.floor(Math.random() * chars.length)) +
                chars.charAt(Math.floor(Math.random() * chars.length)) +
                '-' +
                nums.charAt(Math.floor(Math.random() * nums.length)) +
                nums.charAt(Math.floor(Math.random() * nums.length)) +
                nums.charAt(Math.floor(Math.random() * nums.length)) +
                nums.charAt(Math.floor(Math.random() * nums.length));

            // Show Result
            ocrDisplay.innerText = plate;
            ocrDisplay.classList.remove('hidden');
            plateInput.value = plate;
            scanBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> SCAN PLATE';

            // Random Alert Logic
            if (Math.random() > 0.7) {
                scannerView.style.borderColor = 'var(--danger)';
                alertBox.innerHTML = `
                    <div style="color: var(--danger); font-weight: bold;">STOLEN VEHICLE RECORD</div>
                    <div>Owner: Warrant Active</div>
                    <div>Make/Model: 2018 Toyota Camry (Black)</div>
                 `;
            } else {
                scannerView.style.borderColor = 'var(--success)';
                alertBox.innerHTML = `
                    <div style="color: var(--success);">NO WANTS / WARRANTS</div>
                    <div>Registration: Valid</div>
                    <div>Insurance: Valid</div>
                `;
            }

        }, 1500);
    });
}
