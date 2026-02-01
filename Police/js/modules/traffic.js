/* TRAFFIC & CITATION MODULE v2 - COMMAND OS */
import { db } from '../store.js';
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-file-signature text-amber"></i> TRAFFIC & CITATIONS</div>
                </div>
                <div class="ws-controls">
                     <button class="btn btn-ghost" onclick="resetForm()">CLEAR FORM</button>
                </div>
            </div>

            <div class="scroller">
                <div class="grid-2" style="grid-template-columns: 2fr 1fr;">
                    
                    <!-- CITATION FORM -->
                    <div class="panel">
                        <div class="panel-head">
                            <span>NEW CITATION ENTRY</span>
                            <span class="mono text-dim" id="cit-id">CIT-24-000</span>
                        </div>
                        <div class="panel-body">
                            <form id="ticket-form">
                                
                                <!-- SUBJECT SECTION -->
                                <div style="margin-bottom: 2rem; border-left: 3px solid var(--accent-cyan); padding-left: 1rem;">
                                    <div class="input-group">
                                        <label class="input-label">SUBJECT IDENTITY (DL / NAME)</label>
                                        <div style="display: flex; gap: 10px;">
                                            <input type="text" id="dl-search" class="input-field" placeholder="Search Name or DL to Auto-Fill...">
                                            <button type="button" class="btn btn-cyan" id="btn-lookup">SEARCH & FILL</button>
                                        </div>
                                    </div>
                                    <div class="grid-3">
                                        <div class="input-group">
                                            <label class="input-label">LAST NAME</label>
                                            <input type="text" name="last" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">FIRST NAME</label>
                                            <input type="text" name="first" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">DOB</label>
                                            <input type="text" name="dob" class="input-field" placeholder="YYYY-MM-DD">
                                        </div>
                                    </div>
                                    <div class="grid-3">
                                        <div class="input-group">
                                            <label class="input-label">ADDRESS</label>
                                            <input type="text" name="address" class="input-field" style="grid-column: span 2;">
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">VEHICLE INFO</label>
                                            <input type="text" name="vehicle" class="input-field" placeholder="Year Make Model Color" required>
                                        </div>
                                    </div>
                                </div>

                                <!-- VIOLATION SECTION -->
                                <div style="margin-bottom: 2rem; border-left: 3px solid var(--accent-amber); padding-left: 1rem;">
                                    <div class="input-group">
                                        <label class="input-label">VIOLATION STATUTE</label>
                                        <select id="statute-select" name="offense" class="input-field">
                                            <option value="">SELECT OFFENSE...</option>
                                            <!-- Configured in JS -->
                                        </select>
                                    </div>
                                    
                                    <div class="grid-3 hidden" id="speed-block">
                                        <div class="input-group"><label class="input-label">ACTUAL SPEED</label><input type="number" name="speed" class="input-field"></div>
                                        <div class="input-group"><label class="input-label">ZONE LIMIT</label><input type="number" name="limit" class="input-field"></div>
                                        <div class="input-group">
                                            <label class="input-label">ZONE TYPE</label>
                                            <select name="zone" class="input-field">
                                                <option>Standard</option>
                                                <option>School</option>
                                                <option>Construction</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="grid-2">
                                        <div class="input-group">
                                            <label class="input-label">LOCATION OF STOP</label>
                                            <input type="text" name="location" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">DATE/TIME</label>
                                            <input type="datetime-local" name="timestamp" class="input-field" required>
                                        </div>
                                    </div>
                                </div>

                                <!-- COURT SECTION -->
                                <div style="margin-bottom: 2rem; border-left: 3px solid var(--text-mono); padding-left: 1rem;">
                                    <div class="grid-2">
                                        <div class="input-group">
                                            <label class="input-label">COURT DATE (AUTO)</label>
                                            <input type="text" name="court_date" id="court-date" class="input-field" readonly>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">FINE AMOUNT</label>
                                            <input type="text" name="fine" id="fine-amt" class="input-field" readonly value="$0.00">
                                        </div>
                                    </div>
                                </div>

                                <div style="text-align: right;">
                                    <button type="submit" class="btn btn-amber" style="font-size: 1rem; padding: 1rem 2rem;">
                                        <i class="fa-solid fa-print"></i> ISSUE CITATION
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                    <!-- RIGHT SIDEBAR: RECENT & STATUTES -->
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                         <div class="panel">
                             <div class="panel-head">RECENT CITATIONS</div>
                             <div class="panel-body" style="padding: 0;">
                                 <table class="cyber-table">
                                     <thead><tr><th>ID</th><th>OFFENSE</th><th>TIME</th></tr></thead>
                                     <tbody id="recent-table">
                                         <!-- JS -->
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// Statutes Database
const STATUTES = [
    { code: '55-8-152', label: 'Speeding', fine: 120, isSpeed: true },
    { code: '55-9-402', label: 'Light Law Violation', fine: 50, isSpeed: false },
    { code: '55-8-123', label: 'Failure to Maintain Lane', fine: 85, isSpeed: false },
    { code: '55-12-139', label: 'Financial Responsibility (No Ins)', fine: 180, isSpeed: false },
    { code: '55-4-104', label: 'Registration Violation', fine: 60, isSpeed: false },
    { code: '55-8-136', label: 'Drivers to Exercise Due Care', fine: 110, isSpeed: false },
    { code: '55-50-301', label: 'Driving w/o License', fine: 140, isSpeed: false }
];

export function init() {
    const form = document.getElementById('ticket-form');
    const statuteSelect = document.getElementById('statute-select');
    const lookupBtn = document.getElementById('btn-lookup');

    // Auto-ID
    document.getElementById('cit-id').innerText = 'CIT-24-' + Math.floor(Math.random() * 100000);

    // Set Timestamp to now
    form.querySelector('[name="timestamp"]').value = new Date().toISOString().slice(0, 16);

    // Auto-Court Date (30 days)
    const d = new Date();
    d.setDate(d.getDate() + 30);
    document.getElementById('court-date').value = d.toLocaleDateString() + " @ 0900";

    // Populate Statutes
    STATUTES.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.code;
        opt.innerText = `[${s.code}] ${s.label}`;
        opt.dataset.fine = s.fine;
        opt.dataset.isSpeed = s.isSpeed;
        statuteSelect.appendChild(opt);
    });

    // Statute Change Handler
    statuteSelect.addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        if (opt && opt.value) {
            document.getElementById('fine-amt').value = `$${opt.dataset.fine}.00`;
            const speedBlock = document.getElementById('speed-block');
            if (opt.dataset.isSpeed === 'true') {
                speedBlock.classList.remove('hidden');
            } else {
                speedBlock.classList.add('hidden');
            }
        }
    });

    // Lookup Logic (Import from NCIC)
    lookupBtn.addEventListener('click', () => {
        const q = document.getElementById('dl-search').value;
        if (!q) return;

        const profile = generateProfile(q);

        // Fill Fields
        const names = profile.name.split(' '); // Rough split
        form.querySelector('[name="last"]').value = names[names.length - 1]; // Last assumption
        form.querySelector('[name="first"]').value = names[0];

        let dobStr = profile.dob;
        // Try to convert to YYYY-MM-DD
        try {
            const dateObj = new Date(profile.dob);
            dobStr = dateObj.toISOString().split('T')[0]; // Simple formatting
        } catch (e) { }
        // Since profile.dob is localized string from ncicGen, this is tricky, 
        // but for now let's just stick the string or a mock if parsing fails in this demo context.
        form.querySelector('[name="dob"]').value = dobStr;

        // Vehicle
        if (profile.vehicles.length > 0) {
            const v = profile.vehicles[0];
            form.querySelector('[name="vehicle"]').value = `${v.style} ${v.make} ${v.model} (${v.color}) - ${v.plate}`;
        }

        form.querySelector('[name="address"]').value = `${Math.floor(Math.random() * 900)} Main St, Rogersville TN`;
    });

    // Submit Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());

        // Save to 'Evidence/Store' as a record? Or just log it.
        // For now, we simulate the "Print" process.

        // Save to our Local store if we had a dedicated "Citations" store, 
        // but we can simulate "Paperwork Filed"
        alert("CITATION ISSUED. SIGNATURE LOGGED.");

        // Add to Recent
        const row = `<tr>
            <td class="mono text-cyan">${document.getElementById('cit-id').innerText}</td>
            <td>${statuteSelect.options[statuteSelect.selectedIndex].text}</td>
            <td class="text-dim">Just now</td>
        </tr>`;
        document.getElementById('recent-table').innerHTML += row;

        // Reset
        form.reset();
        document.getElementById('cit-id').innerText = 'CIT-24-' + Math.floor(Math.random() * 100000);
    });
}

window.resetForm = () => document.getElementById('ticket-form').reset();
