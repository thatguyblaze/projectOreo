import { db } from '../store.js';

export function getTemplate() {
    return `
        <div id="traffic-root" class="fade-in">
            <!-- 1. Category Selection Hub -->
            <div id="citation-hub">
                <h2 style="margin-bottom: 2rem; color: var(--brand-navy); font-weight: 300;">New Tennessee Uniform Citation / Arrest</h2>
                
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

                <div class="ticket-category-header" style="color: var(--danger);">Serious Offenses & Felonies</div>
                 <div class="ticket-type-grid">
                    <div class="ticket-type-card" data-category="Criminal_Traffic">
                        <i class="fa-solid fa-handcuffs ticket-icon" style="color: var(--danger);"></i>
                        <div class="ticket-name">Criminal Traffic</div>
                        <div class="ticket-sub">DUI, Hit & Run, Drag Racing</div>
                    </div>
                    <div class="ticket-type-card" data-category="Felony_Arrest_Person">
                        <i class="fa-solid fa-user-injured ticket-icon" style="color: #7f1d1d;"></i>
                        <div class="ticket-name">Crimes Against Persons</div>
                        <div class="ticket-sub">Domestic Assault, Battery, Attempted Murder</div>
                    </div>
                    <div class="ticket-type-card" data-category="Felony_Arrest_Property">
                        <i class="fa-solid fa-house-crack ticket-icon" style="color: #7f1d1d;"></i>
                        <div class="ticket-name">Property Crimes</div>
                        <div class="ticket-sub">Theft, Grand Theft, Burglary</div>
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
                        <div class="badge hidden" id="arrest-badge" style="background: var(--danger); color: white;">ARREST REPORT</div>
                    </div>
                    <div class="card-body">
                        <form id="dynamic-ticket-form">
                            <!-- Defendant Info (Always Present) -->
                            <h4 class="form-section-title">Defendant / Suspect Information</h4>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Driver License #</label>
                                    <input type="text" name="dl_number" class="form-input" placeholder="TN-xxxxxxx">
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
                            <h4 class="form-section-title">Vehicle Information (If Applicable)</h4>
                            <div class="grid-3">
                                <div class="form-group"><label>Plate #</label><input type="text" name="plate" class="form-input"></div>
                                <div class="form-group"><label>Make</label><input type="text" name="make" class="form-input"></div>
                                <div class="form-group"><label>Model</label><input type="text" name="model" class="form-input"></div>
                            </div>

                            <!-- Dynamic Violation Fields -->
                            <h4 class="form-section-title">Violation Details | <span id="violation-type-label" style="color: var(--brand-cobalt);"></span></h4>
                            <div id="violation-fields"></div>
                            
                            <!-- Booking Info (Hidden unless Arrest) -->
                            <div id="booking-section" class="hidden" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                                <h4 class="form-section-title" style="color: var(--danger);">Booking & Custody Details</h4>
                                <div class="grid-2">
                                    <div class="form-group">
                                        <label>Miranda Rights Read At:</label>
                                        <input type="time" name="miranda_time" class="form-input">
                                    </div>
                                    <div class="form-group">
                                        <label>Transporting Unit</label>
                                        <input type="text" name="transport_unit" class="form-input" placeholder="e.g. Wagon 4">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Booking Facility</label>
                                    <select name="facility" class="form-input">
                                        <option>County Jail</option>
                                        <option>City Holding</option>
                                        <option>Hospital (Guard)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Submit -->
                            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                                <button type="submit" class="btn btn-primary" id="submit-btn"><i class="fa-solid fa-print"></i> ISSUE & PRINT</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 3. Print Preview Modal (Hidden) -->
            <div id="print-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; justify-content: center; align-items: center;">
                <div style="background: white; width: 500px; max-height: 90vh; overflow-y: auto; padding: 30px; font-family: 'Courier New', monospace; position: relative;">
                    <button id="close-print" style="position: absolute; top: 10px; right: 10px; border: none; background: none; cursor: pointer; font-size: 1.5rem;">&times;</button>
                    
                    <div id="ticket-paper" style="border: 3px double #333; padding: 20px;">
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
    const bookingSection = document.getElementById('booking-section');
    const arrestBadge = document.getElementById('arrest-badge');
    const submitBtn = document.getElementById('submit-btn');

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
        hub.classList.remove('hidden'); // Go back to start
        formContainer.classList.add('hidden');
    });

    // Form Submit
    document.getElementById('dynamic-ticket-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.type = typeLabel.innerText;
        data.officer = officer;
        data.timestamp = new Date().toISOString();
        data.id = crypto.randomUUID();

        // Save to DB
        db.addTicket(data);

        // Show Print View
        showPrintPreview(data);
    });

    function loadCategoryFields(category) {
        hub.classList.add('hidden');
        formContainer.classList.remove('hidden');
        typeLabel.innerText = category.replace(/_/g, " ");
        fieldsContainer.innerHTML = '';

        // Reset Arrest Mode
        bookingSection.classList.add('hidden');
        arrestBadge.classList.add('hidden');
        submitBtn.innerHTML = '<i class="fa-solid fa-print"></i> ISSUE & PRINT CITATION';

        let isArrest = false;

        switch (category) {
            case 'Speeding':
                fieldsContainer.innerHTML = `
                    <div class="grid-3">
                        <div class="form-group"><label>Posted Zone</label><input type="number" name="limit" class="form-input" required></div>
                        <div class="form-group"><label>Recorded Speed</label><input type="number" name="speed" class="form-input" required></div>
                        <div class="form-group"><label>Method</label><select name="method" class="form-input"><option>RADAR</option><option>LIDAR</option><option>PACE</option></select></div>
                    </div>
                    <div class="form-group">
                        <label>Zone Conditions</label>
                        <div style="display: flex; gap: 20px;">
                            <label><input type="checkbox" name="isConstruction"> Construction</label>
                            <label><input type="checkbox" name="isSchool"> School Zone</label>
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
                     <div class="form-group"><label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="Light Law">Light Law</option>
                            <option value="Window Tint">Window Tint</option>
                            <option value="Registration">Registration</option>
                            <option value="Seat Belt">Seat Belt</option>
                        </select>
                    </div>
                `;
                break;
            case 'Documentation':
                fieldsContainer.innerHTML = `
                     <div class="form-group"><label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="No Insurance">Financial Responsibility</option>
                            <option value="No License">No License</option>
                            <option value="Suspended License">Suspended License</option>
                        </select>
                    </div>
                `;
                break;

            // --- ARREST CATEGORIES ---
            case 'Criminal_Traffic':
                isArrest = true;
                fieldsContainer.innerHTML = `
                     <div class="form-group"><label>Offense</label>
                        <select name="offense" class="form-input" required>
                            <option value="DUI">DUI (Driving Under Influence)</option>
                            <option value="Reckless Endangerment">Reckless Endangerment</option>
                            <option value="Hit and Run">Leaving Scene of Accident</option>
                            <option value="Drag Racing">Drag Racing</option>
                        </select>
                    </div>
                `;
                break;

            case 'Felony_Arrest_Person':
                isArrest = true;
                fieldsContainer.innerHTML = `
                     <div class="form-group"><label>Specific Charge</label>
                        <select name="offense" class="form-input" required id="person-charge-select">
                            <option value="Domestic Assault">Domestic Assault</option>
                            <option value="Battery">Battery / Aggravated Battery</option>
                            <option value="Attempted Murder">Attempted Murder</option>
                        </select>
                    </div>
                    
                    <!-- Dynamic Sub-Fields for Person Crimes -->
                    <div id="sub-fields-person"></div>
                `;
                // Attach listener for sub-fields
                setTimeout(() => {
                    const sel = document.getElementById('person-charge-select');
                    const sub = document.getElementById('sub-fields-person');

                    const updateSub = () => {
                        if (sel.value === 'Domestic Assault') {
                            sub.innerHTML = `
                                <div class="grid-2">
                                     <div class="form-group"><label>Relationship to Victim</label><input type="text" name="victim_rel" class="form-input" placeholder="Spouse, Partner, Sibling"></div>
                                     <div class="form-group"><label>Visible Injury?</label><select name="has_injury" class="form-input"><option>Yes</option><option>No</option></select></div>
                                </div>
                            `;
                        } else if (sel.value === 'Battery') {
                            sub.innerHTML = `
                                <div class="form-group"><label>Weapon Used?</label><input type="text" name="weapon" class="form-input" placeholder="None, Bat, Fist..."></div>
                            `;
                        } else if (sel.value === 'Attempted Murder') {
                            sub.innerHTML = `
                                <div class="grid-2">
                                     <div class="form-group"><label>Weapon</label><input type="text" name="weapon" class="form-input" required></div>
                                     <div class="form-group"><label>Premeditation Indicated?</label><select name="premeditated" class="form-input"><option>Yes</option><option>Unknown</option></select></div>
                                </div>
                            `;
                        }
                    };
                    sel.addEventListener('change', updateSub);
                    updateSub(); // Run once
                }, 100);
                break;

            case 'Felony_Arrest_Property':
                isArrest = true;
                fieldsContainer.innerHTML = `
                     <div class="form-group"><label>Charge Logic (Based on Value)</label>
                        <div class="grid-2">
                             <div class="form-group"><label>Stolen Item(s)</label><input type="text" name="stolen_items" class="form-input" placeholder="Electronics, Cash..."></div>
                             <div class="form-group"><label>Total Value ($)</label><input type="number" name="stolen_value" class="form-input" placeholder="0.00" id="theft-value"></div>
                        </div>
                        <input type="hidden" name="offense" id="theft-offense-name" value="Theft">
                        <div style="margin-top: 5px; font-weight: bold; color: var(--brand-cobalt);">Estimated Charge: <span id="theft-charge-display">Petty Theft (Misdemeanor)</span></div>
                    </div>
                `;
                setTimeout(() => {
                    const valInput = document.getElementById('theft-value');
                    const disp = document.getElementById('theft-charge-display');
                    const hidden = document.getElementById('theft-offense-name');

                    valInput.addEventListener('input', () => {
                        const val = parseFloat(valInput.value) || 0;
                        if (val >= 1000) {
                            disp.innerText = "GRAND THEFT (Felony)";
                            disp.style.color = "var(--danger)";
                            hidden.value = "Grand Theft";
                        } else {
                            disp.innerText = "Petty Theft (Misdemeanor)";
                            disp.style.color = "var(--brand-cobalt)";
                            hidden.value = "Petty Theft";
                        }
                    });
                }, 100);
                break;
        }

        if (isArrest) {
            bookingSection.classList.remove('hidden');
            arrestBadge.classList.remove('hidden');
            submitBtn.innerHTML = '<i class="fa-solid fa-file-contract"></i> GENERATE ARREST REPORT';
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-danger'); // Red button
        } else {
            submitBtn.classList.add('btn-primary');
            submitBtn.classList.remove('btn-danger'); // Blue button
        }
    }

    function showPrintPreview(data) {
        const modal = document.getElementById('print-modal');
        const paper = document.getElementById('ticket-paper');

        const date = new Date(data.timestamp).toLocaleString();
        const isArrest = data.booking_facility || data.offense === 'DUI' || data.type.includes('Felony');

        let headerColor = isArrest ? 'black' : 'black';
        let title = isArrest ? 'ARREST / BOOKING SHEET' : 'UNIFORM CITATION';
        let subDetails = '';

        if (data.type === 'Speeding') {
            subDetails = `SPEED: ${data.speed} in ${data.limit} (${data.method})`;
        } else if (data.victim_rel) {
            subDetails = `VICTIM REL: ${data.victim_rel} | INJURY: ${data.has_injury}`;
        } else if (data.stolen_value) {
            subDetails = `VALUE: $${data.stolen_value} | ITEMS: ${data.stolen_items}`;
        }

        let bookingBlock = '';
        if (isArrest) {
            bookingBlock = `
                <div style="border: 2px solid black; padding: 10px; margin-top: 15px;">
                    <strong>CUSTODY RECORD</strong><br>
                    FACILITY: ${data.facility || 'County Jail'}<br>
                    TRANSPORT: ${data.transport_unit || 'N/A'}<br>
                    MIRANDA READ: ${data.miranda_time || 'N/A'}
                </div>
                <div style="margin-top: 10px; font-weight: bold; text-align: center;">NO BOND SET - HOLD FOR MAGISTRATE</div>
            `;
        } else {
            bookingBlock = `
                <div style="margin-top: 20px; text-align: center; font-size: 0.8rem;">
                    Violator Signature (Not an admission of guilt):<br>
                    __________________________________________
                </div>
            `;
        }

        paper.innerHTML = `
            <div style="text-align: center; border-bottom: 4px double ${headerColor}; padding-bottom: 10px; margin-bottom: 15px;">
                <h2 style="margin: 0;">ROGERSVILLE POLICE</h2>
                <h4 style="margin: 5px 0;">${title}</h4>
                <div style="font-size: 0.8rem;">REF #: ${data.id.substring(0, 8).toUpperCase()}</div>
            </div>
            
            <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                <tr>
                    <td colspan="2" style="padding-bottom: 10px;"><strong>DATE/TIME:</strong> ${date}</td>
                </tr>
                <tr>
                    <td colspan="2" style="border-top: 1px solid #ccc; padding-top: 5px;"><strong>DEFENDANT:</strong></td>
                </tr>
                <tr>
                    <td>NAME: ${data.last_name.toUpperCase()}, ${data.first_name.toUpperCase()}</td>
                    <td>DOB: ${data.dob}</td>
                </tr>
                 <tr>
                    <td>ADDR: ${data.address || 'N/A'}</td>
                    <td>DL: ${data.dl_number} (${data.dl_state})</td>
                </tr>
            </table>

            <div style="background: #eee; padding: 10px; margin: 15px 0; border: 1px solid #999;">
                <strong>CHARGE / OFFENSE:</strong><br>
                <div style="font-size: 1.2rem; font-weight: bold;">${data.offense.toUpperCase()}</div>
                <div style="font-size: 0.9rem; margin-top: 5px;">${subDetails}</div>
            </div>

            <div style="border-top: 1px solid #ccc; padding-top: 5px;">
                <strong>OFFICER STATEMENT:</strong><br>
                Undersigned officer has probable cause to believe the named defendant committed the offense(s) stated above.
                <br><br>
                SIGNED: <u>Sgt. ${data.officer.name} (${data.officer.badge})</u>
            </div>

            ${bookingBlock}
        `;

        modal.classList.remove('hidden');
    }
}
