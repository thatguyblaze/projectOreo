export function getTemplate() {
    return `
        <div id="traffic-root" class="fade-in">
            <!-- 1. Selection Hub (Default View) -->
            <div id="citation-hub">
                <h2 style="margin-bottom: 2rem; color: var(--brand-navy); font-weight: 300;">Select Citation Type</h2>
                <div class="ticket-type-grid">
                    <div class="ticket-type-card" data-type="speeding">
                        <i class="fa-solid fa-gauge-high ticket-icon"></i>
                        <div class="ticket-name">Speeding Violation</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">M.G.L. c.90 §17</div>
                    </div>
                    <div class="ticket-type-card" data-type="parking">
                        <i class="fa-solid fa-square-parking ticket-icon"></i>
                        <div class="ticket-name">Parking Violation</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Local Ordinance 4-2</div>
                    </div>
                    <div class="ticket-type-card" data-type="equipment">
                        <i class="fa-solid fa-car-burst ticket-icon"></i>
                        <div class="ticket-name">Equipment Failure</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Light / Inspection</div>
                    </div>
                     <div class="ticket-type-card" data-type="moving">
                        <i class="fa-solid fa-ban ticket-icon"></i>
                        <div class="ticket-name">Moving Violation</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Stop Sign / Red Light</div>
                    </div>
                    <div class="ticket-type-card" data-type="ocr">
                        <i class="fa-solid fa-camera ticket-icon"></i>
                        <div class="ticket-name">Scan Plate (OCR)</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Automated Entry</div>
                    </div>
                </div>
            </div>

            <!-- 2. Dynamic Form Containers (Hidden by default) -->
            <div id="ticket-form-container" class="hidden">
                <div style="margin-bottom: 1.5rem;">
                     <button id="back-to-hub" class="btn btn-outline"><i class="fa-solid fa-arrow-left"></i> Back to Selection</button>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-title" id="form-title">Speeding Citation</div>
                        <div class="badge badge-warning">DRAFT</div>
                    </div>
                    <div class="card-body">
                        <!-- Dynamic Fields injected here -->
                        <form id="dynamic-ticket-form">
                            <!-- Fields go here -->
                        </form>
                    </div>
                    <div class="card-footer" style="padding: 1.5rem; background: #f8fafc; border-top: 1px solid var(--border); text-align: right;">
                         <button type="button" class="btn btn-outline" style="margin-right: 10px;">Cancel</button>
                         <button type="submit" form="dynamic-ticket-form" class="btn btn-primary">Issue Citation & Print</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const root = document.getElementById('traffic-root');
    const hub = document.getElementById('citation-hub');
    const formContainer = document.getElementById('ticket-form-container');
    const backBtn = document.getElementById('back-to-hub');
    const formTitle = document.getElementById('form-title');
    const dynamicForm = document.getElementById('dynamic-ticket-form');

    // Selection Logic
    const types = root.querySelectorAll('.ticket-type-card');
    types.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            loadForm(type);
        });
    });

    // Back Navigation
    backBtn.addEventListener('click', () => {
        formContainer.classList.add('hidden');
        hub.classList.remove('hidden');
    });

    // Dynamic Form Loader
    function loadForm(type) {
        // Hide Hub, Show Form
        hub.classList.add('hidden');
        formContainer.classList.remove('hidden');

        // Reset Form
        dynamicForm.innerHTML = '';

        switch (type) {
            case 'speeding':
                formTitle.innerText = "Speeding Citation (Civil)";
                dynamicForm.innerHTML = getSpeedingFields();
                break;
            case 'parking':
                formTitle.innerText = "Parking Violation Notice";
                dynamicForm.innerHTML = getParkingFields();
                break;
            case 'equipment':
                formTitle.innerText = "Equipment / Inspection Violation";
                dynamicForm.innerHTML = getGeneralFields();
                break;
            case 'moving':
                formTitle.innerText = "Moving Violation (Criminal/Civil)";
                dynamicForm.innerHTML = getGeneralFields();
                break;
            case 'ocr':
                // For OCR, we might redirect to a specialized OCR view or load it here.
                // Reusing the logic from previous step for now within a "form" context
                formTitle.innerText = "Automated OCR Entry";
                dynamicForm.innerHTML = getOCRInterface();
                attachOCRLogic(); // Attach JS for scanner
                return; // Early return as OCR has custom logic
        }

        // Generic Submit Mock
        dynamicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("Ticket Issued! Sent to Court Sync.");
        });
    }

    // --- Field Templates ---

    function getSpeedingFields() {
        return `
            <div class="grid-2">
                <div class="form-group">
                    <label>License Plate</label>
                    <input type="text" class="form-input" placeholder="ABC-1234">
                </div>
                <div class="form-group">
                    <label>State</label>
                    <select class="form-input"><option>MA</option><option>NH</option><option>RI</option></select>
                </div>
            </div>
            <div class="grid-3" style="align-items: end;">
                <div class="form-group">
                    <label>Speed Limit</label>
                    <input type="number" class="form-input" value="35">
                </div>
                <div class="form-group">
                    <label>Recorded Speed</label>
                    <input type="number" class="form-input" placeholder="e.g. 52">
                </div>
                <div class="form-group">
                    <label>Method</label>
                    <select class="form-input"><option>LIDAR</option><option>RADAR</option><option>PACE</option></select>
                </div>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-input" placeholder="Street Name / Intersection">
            </div>
            <div class="form-group">
                <label>Officer Notes</label>
                <textarea class="form-input" rows="3" placeholder="Weather conditions, traffic density..."></textarea>
            </div>
        `;
    }

    function getParkingFields() {
        return `
            <div class="grid-2">
                <div class="form-group">
                    <label>License Plate</label>
                    <input type="text" class="form-input" placeholder="ABC-1234">
                </div>
                <div class="form-group">
                    <label>Make / Model</label>
                    <input type="text" class="form-input" placeholder="Toyota Camry">
                </div>
            </div>
            <div class="form-group">
                <label>Violation</label>
                <select class="form-input">
                    <option>Expired Meter</option>
                    <option>No Parking Zone</option>
                    <option>Blocking Hydrant</option>
                    <option>Handicap Zone (No Placard)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Fine Amount</label>
                <input type="text" class="form-input" value="$50.00" readonly style="background: #f1f5f9;">
            </div>
        `;
    }

    function getGeneralFields() {
        return `
            <div class="grid-2">
                <div class="form-group">
                    <label>Driver License #</label>
                    <input type="text" class="form-input" placeholder="S12345678">
                </div>
                 <div class="form-group">
                    <label>License Plate</label>
                    <input type="text" class="form-input" placeholder="ABC-1234">
                </div>
            </div>
            <div class="form-group">
                <label>Offense Description</label>
                <input type="text" class="form-input" placeholder="e.g. Broken Taillight">
            </div>
            <div class="grid-2">
                 <div class="form-group">
                    <label>Action Taken</label>
                    <select class="form-input">
                        <option>Verbal Warning</option>
                        <option>Written Warning</option>
                        <option>Civil Infraction</option>
                        <option>Criminal Application</option>
                    </select>
                </div>
            </div>
        `;
    }

    function getOCRInterface() {
        return `
            <div style="background: #000; height: 300px; display: flex; align-items: center; justify-content: center; color: white; border-radius: 4px; position: relative;">
                <i class="fa-solid fa-camera fa-3x"></i>
                <div id="ocr-scan-btn" style="position: absolute; bottom: 20px; background: var(--success); color: white; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    ACTIVATE CAMERA
                </div>
                <div id="ocr-result" style="position: absolute; top: 20px; font-family: monospace; font-size: 2rem; display: none;">Scan Complete: 829-JKA</div>
            </div>
            <div style="margin-top: 1rem;">
                <p style="color: var(--text-muted); font-size: 0.9rem;">System will auto-fill citation fields upon successful scan.</p>
            </div>
        `;
    }

    function attachOCRLogic() {
        // Simple mock for the OCR "Form"
        const btn = document.getElementById('ocr-scan-btn');
        const res = document.getElementById('ocr-result');
        btn.addEventListener('click', () => {
            btn.innerText = "SCANNING...";
            setTimeout(() => {
                res.style.display = "block";
                btn.innerText = "RE-SCAN";
                // In a real app, this would populate value fields
            }, 1000);
        });
    }
}
