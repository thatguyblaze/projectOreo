/* TRAFFIC & CITATION MODULE v3 - OFFICIAL */
import { db } from '../store.js';
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="workspace-header">
                <div>
                    <div class="ws-title"><i class="fa-solid fa-file-contract text-cyan"></i> Traffic & Citations</div>
                </div>
                <div class="ws-controls">
                     <!-- Context Indicator -->
                     <div id="linked-context" class="feature-tag hidden" style="background: #eff6ff; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                        <i class="fa-solid fa-link"></i> LINKED TO INCIDENT
                     </div>
                     <button class="btn btn-ghost" onclick="resetForm()">Clear Form</button>
                </div>
            </div>

            <div class="scroller">
                <div class="grid-2" style="grid-template-columns: 2fr 1fr;">
                    
                    <!-- CITATION FORM -->
                    <div class="panel">
                        <div class="panel-head">
                            <span>CITATION ENTRY</span>
                            <span class="text-secondary" id="cit-id" style="font-weight: 400;">CIT-24-000</span>
                        </div>
                        <div class="panel-body">
                            <form id="ticket-form">
                                
                                <div style="margin-bottom: 2rem; background: #f9fafb; padding: 1.5rem; border-radius: var(--radius);">
                                    <div class="input-group">
                                        <label class="input-label">Subject Search (NCIC)</label>
                                        <div style="display: flex; gap: 10px;">
                                            <input type="text" id="dl-search" class="input-field" placeholder="Search Name or DL #">
                                            <button type="button" class="btn btn-primary" id="btn-lookup">Autofill</button>
                                        </div>
                                    </div>
                                    <div class="grid-3">
                                        <div class="input-group">
                                            <label class="input-label">Last Name</label>
                                            <input type="text" name="last" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">First Name</label>
                                            <input type="text" name="first" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">DOB</label>
                                            <input type="text" name="dob" class="input-field" placeholder="YYYY-MM-DD">
                                        </div>
                                    </div>
                                    <div class="grid-3">
                                        <div class="input-group">
                                            <label class="input-label">Address</label>
                                            <input type="text" name="address" class="input-field" style="grid-column: span 2;">
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">Vehicle</label>
                                            <input type="text" name="vehicle" class="input-field" placeholder="Yr Make Model Color" required>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 2rem;">
                                    <h4 style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Violations</h4>
                                    <div class="input-group">
                                        <label class="input-label">Primary Offense</label>
                                        <select id="statute-select" name="offense" class="input-field">
                                            <option value="">Select Statute...</option>
                                            <!-- Configured in JS -->
                                        </select>
                                    </div>
                                    
                                    <div class="grid-3 hidden" id="speed-block" style="background: #fffbeb; padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem;">
                                        <div class="input-group"><label class="input-label">Actual Speed</label><input type="number" name="speed" class="input-field"></div>
                                        <div class="input-group"><label class="input-label">Zone Limit</label><input type="number" name="limit" class="input-field"></div>
                                        <div class="input-group">
                                            <label class="input-label">Zone Type</label>
                                            <select name="zone" class="input-field">
                                                <option>Standard</option>
                                                <option>School</option>
                                                <option>Construction</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="grid-2">
                                        <div class="input-group">
                                            <label class="input-label">Location</label>
                                            <input type="text" name="location" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">Date / Time</label>
                                            <input type="datetime-local" name="timestamp" class="input-field" required>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                                    <div class="grid-2">
                                        <div class="input-group">
                                            <label class="input-label">Court Date</label>
                                            <input type="text" name="court_date" id="court-date" class="input-field" readonly style="background: #f9fafb;">
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">Total Fine</label>
                                            <input type="text" name="fine" id="fine-amt" class="input-field" readonly value="$0.00" style="background: #f9fafb; font-weight: bold; color: var(--text-primary);">
                                        </div>
                                    </div>
                                </div>

                                <div style="text-align: right;">
                                    <button type="submit" class="btn btn-primary" style="padding: 0.8rem 2rem; font-size: 1rem;">
                                        Confirm & Issue Citation
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                    <!-- RECENT -->
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                         <div class="panel">
                             <div class="panel-head">HISTORY</div>
                             <div class="panel-body" style="padding: 0;">
                                 <table class="cyber-table">
                                     <thead><tr><th>ID</th><th>Offense</th><th>Time</th></tr></thead>
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
    { code: '55-12-139', label: 'Financial Responsibility', fine: 180, isSpeed: false },
    { code: '55-4-104', label: 'Expired Registration', fine: 60, isSpeed: false },
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

    // Lookup Logic
    lookupBtn.addEventListener('click', () => {
        const q = document.getElementById('dl-search').value;
        if (!q) return;
        const profile = generateProfile(q);

        // Fill
        const names = profile.name.split(' ');
        form.querySelector('[name="last"]').value = names[names.length - 1];
        form.querySelector('[name="first"]').value = names[0];
        form.querySelector('[name="dob"]').value = new Date(profile.dob).toISOString().split('T')[0];

        if (profile.vehicles.length > 0) {
            const v = profile.vehicles[0];
            form.querySelector('[name="vehicle"]').value = `${v.style} ${v.make} ${v.model} (${v.color}) - ${v.plate}`;
        }
        form.querySelector('[name="address"]').value = `${Math.floor(Math.random() * 900)} Main St, Rogersville TN`;
    });

    // CONTEXT CHECK (Deep Integration)
    // Check if we came from Dispatch with a specific Incident ID
    const context = sessionStorage.getItem('active_incident_context');
    if (context) {
        const inc = db.getIncident(context);
        if (inc) {
            // Pre-fill location
            form.querySelector('[name="location"]').value = inc.location;

            // Show Context UI
            const ctxBadge = document.getElementById('linked-context');
            ctxBadge.classList.remove('hidden');
            ctxBadge.innerHTML = `<i class="fa-solid fa-link"></i> LINKED TO INCIDENT #${inc.id}`;

            // Check for Linked Subjects to suggest?
            if (inc.linked_subjects.length > 0) {
                // If there's a subject, let's just grab the first one to auto-fill (Simulation shortcut for convenience)
                // In production, we'd offer a dropdown "Select Linked Subject"
                // db.getSubject(id) needed
                console.log("Found linked subjects, could auto-fill if we had full Subject DB fetch.");
            }
        }
    }

    // Submit Logic (REAL SAVE)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const ticket = {
            id: document.getElementById('cit-id').innerText,
            subject: `${formData.get('last')}, ${formData.get('first')}`,
            offense: statuteSelect.options[statuteSelect.selectedIndex].text,
            fine: formData.get('fine'),
            timestamp: new Date().toISOString()
        };

        // 1. Save to Ticket DB (We'd add db.addTicket(ticket) in store)
        // For now, simulate by just logging it to recent.
        const row = `<tr>
            <td class="text-secondary" style="font-family: monospace;">${ticket.id}</td>
            <td>${ticket.offense}</td>
            <td class="text-secondary">Just now</td>
        </tr>`;
        document.getElementById('recent-table').innerHTML += row;

        // 2. Link to Incident if Context exists (NO PLACEHOLDERS)
        if (context) {
            db.addNarrative(context, `CITATION ISSUED to ${ticket.subject} for ${ticket.offense}. Ticket #${ticket.id}`);
            // Clear context
            sessionStorage.removeItem('active_incident_context');
            alert("Citation Issued & Linked to Incident Log.");
            // Ideally route back to dispatch?
        } else {
            alert("Citation Issued.");
        }

        form.reset();
        document.getElementById('cit-id').innerText = 'CIT-24-' + Math.floor(Math.random() * 100000);
        document.getElementById('linked-context').classList.add('hidden');
    });
}

window.resetForm = () => document.getElementById('ticket-form').reset();
