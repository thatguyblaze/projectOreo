import { db } from '../store.js';

export function getTemplate() {
    return `
        <div id="traffic-root" class="fade-in">
            <!-- 1. Category Selection Hub -->
            <div id="citation-hub">
                <h2 style="margin-bottom: 2rem; color: var(--brand-navy); font-weight: 300;">New Tennessee Uniform Citation</h2>
                
                <div class="ticket-category-header">Common Violations</div>
                <div class="ticket-type-grid">
                    <div class="ticket-type-card" data-category="Speeding">
                        <i class="fa-solid fa-gauge-high ticket-icon"></i>
                        <div class="ticket-name">Speeding</div>
                        <div class="ticket-sub">Points assessment based on MPH over limit</div>
                    </div>
                    <div class="ticket-type-card" data-category="Moving">
                        <i class="fa-solid fa-car-side ticket-icon"></i>
                        <div class="ticket-name">Moving Violations</div>
                        <div class="ticket-sub">Reckless, Stop Signs, Improper Passing</div>
                    </div>
                </div>

                <div class="ticket-category-header">Vehicle & Admin</div>
                <div class="ticket-type-grid">
                    <div class="ticket-type-card" data-category="Equipment">
                        <i class="fa-solid fa-screwdriver-wrench ticket-icon"></i>
                        <div class="ticket-name">Equipment / Non-Moving</div>
                        <div class="ticket-sub">Lights, Tint, Registration, Seatbelt</div>
                    </div>
                     <div class="ticket-type-card" data-category="Documentation">
                        <i class="fa-solid fa-id-card ticket-icon"></i>
                        <div class="ticket-name">Documentation</div>
                        <div class="ticket-sub">Insurance (Financial Resp), License Status</div>
                    </div>
                </div>

                <div class="ticket-category-header" style="color: var(--danger);">Serious Offenses</div>
                 <div class="ticket-type-grid">
                    <div class="ticket-type-card" data-category="Criminal">
                        <i class="fa-solid fa-handcuffs ticket-icon" style="color: var(--danger);"></i>
                        <div class="ticket-name">Criminal Citations</div>
                        <div class="ticket-sub">DUI, Hit & Run, Drag Racing</div>
                    </div>
                </div>
            </div>

            <!-- 2. Dynamic Form Container -->
            <div id="ticket-form-container" class="hidden">
                <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                     <button id="back-to-hub" class="btn btn-outline"><i class="fa-solid fa-arrow-left"></i> Back to Categories</button>
                     <div style="text-align: right;">
                        <div style="font-weight: bold; color: var(--brand-navy);">OFFICER: <span id="officer-display"></span></div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Badge #<span id="badge-display"></span></div>
                     </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-title" id="form-title">Citation Details</div>
                    </div>
                    <div class="card-body">
                        <form id="dynamic-ticket-form">
                            <!-- Defendant Info (Always Present) -->
                            <h4 class="form-section-title">Defendant Information</h4>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Driver License #</label>
                                    <input type="text" name="dl_number" class="form-input" required placeholder="TN-xxxxxxx">
                                </div>
                                <div class="form-group">
                                    <label>State</label>
                                    <select name="dl_state" class="form-input">
                                        <option value="TN">TN</option><option value="KY">KY</option><option value="VA">VA</option><option value="MS">MS</option><option value="AL">AL</option><option value="GA">GA</option><option value="NC">NC</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid-3">
                                <div class="form-group"><label>First Name</label><input type="text" name="first_name" class="form-input" required></div>
                                <div class="form-group"><label>Last Name</label><input type="text" name="last_name" class="form-input" required></div>
                                <div class="form-group"><label>DOB</label><input type="date" name="dob" class="form-input" required></div>
                            </div>
                            <div class="form-group">
                                <label>Address</label>
                                <input type="text" name="address" class="form-input" placeholder="Street, City, Zip">
                            </div>

                            <!-- Vehicle Info -->
                            <h4 class="form-section-title">Vehicle Information</h4>
                            <div class="grid-3">
                                <div class="form-group"><label>Plate #</label><input type="text" name="plate" class="form-input" required></div>
                                <div class="form-group"><label>Make</label><input type="text" name="make" class="form-input"></div>
                                <div class="form-group"><label>Model</label><input type="text" name="model" class="form-input"></div>
                            </div>

                            <!-- Dynamic Violation Fields -->
                            <h4 class="form-section-title">Violation Details | <span id="violation-type-label" style="color: var(--brand-cobalt);"></span></h4>
                            <div id="violation-fields"></div>
                            
                            <!-- Submit -->
                            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                <button type="submit" class="btn btn-primary"><i class="fa-solid fa-print"></i> ISSUE & PRINT CITATION</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 3. Print Preview Modal (Hidden) -->
            <div id="print-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
                <div style="background: white; width: 400px; max-height: 90vh; overflow-y: auto; padding: 20px; font-family: 'Courier New', monospace; position: relative;">
                    <button id="close-print" style="position: absolute; top: 10px; right: 10px; border: none; background: none; cursor: pointer; font-size: 1.5rem;">&times;</button>
                    
                    <div id="ticket-paper" style="border: 2px dashed #333; padding: 10px;">
                        <!-- Content Injected Here -->
                    </div>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" class="btn btn-primary" style="width: 100%;">START PRINT JOB</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const officer = db.getCurrentOfficer();
    const root = document.getElementById('traffic-root');
    const hub = document.getElementById('citation-hub');
    const formContainer = document.getElementById('ticket-form-container');
    const fieldsContainer = document.getElementById('violation-fields');
    const typeLabel = document.getElementById('violation-type-label');

    // Set Officer Display
    if (document.getElementById('officer-display')) {
        document.getElementById('officer-display').innerText = officer.name;
        document.getElementById('badge-display').innerText = officer.badge;
    }

    // Category Selection
    root.querySelectorAll('.ticket-type-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            loadCategoryFields(category);
        });
    });

    // Back Button
    document.getElementById('back-to-hub').addEventListener('click', () => {
        hub.classList.remove('hidden');
        formContainer.classList.add('hidden');
    });

    // Close Print
    document.getElementById('close-print').addEventListener('click', () => {
        document.getElementById('print-modal').classList.add('hidden');
    });

    // Form Submit
    document.getElementById('dynamic-ticket-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Add Meta Data
        data.type = typeLabel.innerText;

        // Process & Save
        const ticket = db.addTicket(data);

        // Show Print View
        showPrintPreview(ticket);
    });

    function loadCategoryFields(category) {
        hub.classList.add('hidden');
        formContainer.classList.remove('hidden');
        typeLabel.innerText = category;
        fieldsContainer.innerHTML = ''; // Clear

        switch (category) {
            case 'Speeding':
                fieldsContainer.innerHTML = `
                    <div class="grid-3">
                        <div class="form-group">
                            <label>Posted Zone</label>
                            <input type="number" name="limit" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Recorded Speed</label>
                            <input type="number" name="speed" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Method</label>
                            <select name="method" class="form-input">
                                <option>RADAR</option><option>LIDAR</option><option>PACE</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Zone Conditions</label>
                        <div style="display: flex; gap: 20px;">
                            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" name="isConstruction"> Construction Zone</label>
                            <label style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" name="isSchool"> School Zone</label>
                        </div>
                    </div>
                `;
                break;
            case 'Moving':
                fieldsContainer.innerHTML = `
                    <div class="form-group">
                        <label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="Reckless Driving">Reckless Driving (6 pts)</option>
                            <option value="Failure to Obey Signal">Failure to Obey Signal (4 pts)</option>
                            <option value="Improper Passing">Improper Passing (4 pts)</option>
                            <option value="Following Too Closely">Following Too Closely (3 pts)</option>
                            <option value="Failure to Yield">Failure to Yield (4 pts)</option>
                            <option value="Texting While Driving">Texting While Driving</option>
                        </select>
                    </div>
                `;
                break;
            case 'Equipment':
                fieldsContainer.innerHTML = `
                     <div class="form-group">
                        <label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="Light Law">Light Law (Headlight/Taillight)</option>
                            <option value="Window Tint">Window Tint violation (>35%)</option>
                            <option value="Registration">Expired/Invalid Registration</option>
                            <option value="Seat Belt">Seat Belt Violation</option>
                            <option value="Child Restraint">Child Restraint Violation</option>
                        </select>
                    </div>
                     <div class="form-group">
                        <label>Correction Status</label>
                        <select name="status" class="form-input">
                            <option value="Must Appear">Must Appear</option>
                            <option value="Dismiss upon Correction">Dismissable if fixed (Start date)</option>
                        </select>
                    </div>
                `;
                break;
            case 'Documentation':
                fieldsContainer.innerHTML = `
                     <div class="form-group">
                        <label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="No Insurance">Financial Responsibility (No Insurance)</option>
                            <option value="No License">No License in Possession</option>
                            <option value="Suspended License">Driving on Suspended/Revoked</option>
                        </select>
                    </div>
                `;
                break;
            case 'Criminal':
                fieldsContainer.innerHTML = `
                     <div class="form-group">
                        <label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="DUI">DUI (Driving Under Influence)</option>
                            <option value="Reckless Endangerment">Reckless Endangerment</option>
                            <option value="Hit and Run">Leaving Scene of Accident</option>
                            <option value="Drag Racing">Drag Racing</option>
                        </select>
                    </div>
                    <div class="alert badge-danger" style="margin-top: 10px; padding: 10px;">
                        <i class="fa-solid fa-handcuffs"></i> ARRESTABLE OFFENSE: Ensure Miranda Rights are read if taking into custody.
                    </div>
                `;
                break;
        }
    }

    function showPrintPreview(ticket) {
        const modal = document.getElementById('print-modal');
        const paper = document.getElementById('ticket-paper');

        // Formatting
        const date = new Date(ticket.timestamp).toLocaleString();
        let offenseDetails = "";

        if (ticket.type === 'Speeding') {
            offenseDetails = `SPEEDING ${ticket.speed} in a ${ticket.limit} ZONE<br>
                              Meth: ${ticket.method} | Constr: ${ticket.isConstruction ? 'YES' : 'NO'}<br>
                              ASSESSED POINTS: ${ticket.points}`;
        } else {
            offenseDetails = `${ticket.offense.toUpperCase()}`;
        }

        paper.innerHTML = `
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px;">
                <h3 style="margin: 0;">ROGERSVILLE POLICE DEPT</h3>
                <h5 style="margin: 5px 0;">UNIFORM CITATION</h5>
                <span style="font-size: 0.8rem;">CITATION #: ${ticket.id.substring(0, 8).toUpperCase()}</span>
            </div>
            
            <div style="font-size: 0.9rem; line-height: 1.4;">
                <strong>DATE/TIME:</strong> ${date}<br>
                <strong>LOCATION:</strong> ${ticket.address || 'Not Listed'}<br>
                <br>
                <strong>DEFENDANT:</strong><br>
                ${ticket.last_name.toUpperCase()}, ${ticket.first_name.toUpperCase()}<br>
                DL: ${ticket.dl_number} (${ticket.dl_state})<br>
                DOB: ${ticket.dob}<br>
                <br>
                <strong>VEHICLE:</strong><br>
                ${ticket.plate.toUpperCase()} (${ticket.make || ''} ${ticket.model || ''})<br>
                <br>
                <strong>OFFENSE(S):</strong><br>
                ${offenseDetails}<br>
                <br>
                <strong>OFFICER:</strong> ${ticket.officer.name} (${ticket.officer.badge})<br>
            </div>

            <div style="margin-top: 20px; border-top: 1px dashed black; padding-top: 5px; font-size: 0.7rem; text-align: center;">
                NOTICE TO VIOLATOR: Failure to appear in court on the date assigned may result in suspension of your license and issuance of a warrant for your arrest.
            </div>
            <div style="font-size: 3rem; text-align: center; margin-top: 10px;">
                <i class="fa-solid fa-barcode"></i>
            </div>
        `;

        modal.classList.remove('hidden');
    }
}
