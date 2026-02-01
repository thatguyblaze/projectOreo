import { db } from '../store.js';

export function getTemplate() {
    return `
        <div class="fade-in">
             <div class="page-header">
                <div>
                    <div class="page-title">Field Interview Cards</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Intelligence gathering and subject contacts</div>
                </div>
                <button class="btn btn-primary" id="new-fi-btn"><i class="fa-solid fa-plus"></i> NEW CARD</button>
            </div>

            <div class="grid-2" style="grid-template-columns: 1fr 2fr;">
                
                <!-- NEW CARD FORM (Hidden by default, or toggled) -->
                <div class="card" id="fi-form-card">
                    <div class="card-header">
                        <div class="card-title">Subject Information</div>
                    </div>
                    <div class="card-body">
                        <form id="fi-form">
                            <div class="grid-2">
                                <div class="form-group"><label>Last Name</label><input type="text" name="last" class="form-input" required></div>
                                <div class="form-group"><label>First Name</label><input type="text" name="first" class="form-input" required></div>
                            </div>
                            <div class="grid-2">
                                <div class="form-group"><label>Alias / Moniker</label><input type="text" name="alias" class="form-input"></div>
                                <div class="form-group"><label>DOB (Approx)</label><input type="text" name="dob" class="form-input" placeholder="MM/DD/YYYY"></div>
                            </div>
                            
                            <div style="margin: 1rem 0; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                                <div class="form-group"><label>Clothing Description</label><input type="text" name="clothing" class="form-input" placeholder="Red Hoodie, Blue Jeans..."></div>
                                <div class="form-group"><label>Location of Stop</label><input type="text" name="location" class="form-input" placeholder="Address / Cross St"></div>
                            </div>

                            <div class="form-group">
                                <label>Narrative / Reason for Stop</label>
                                <textarea name="narrative" class="form-input" rows="4" placeholder="Subject seen loitering behind business..."></textarea>
                            </div>

                            <div style="text-align: right; margin-top: 1rem;">
                                <button type="submit" class="btn btn-primary">SUBMIT CARD for INTEL</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- RECENT CARDS LIST -->
                <div class="card">
                     <div class="card-header">
                        <div class="card-title">Recent Field Contacts (24hr)</div>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Subject</th>
                                    <th>Location</th>
                                    <th>Officer</th>
                                </tr>
                            </thead>
                            <tbody id="fi-table-body">
                                <tr>
                                    <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No entries this shift.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function init() {
    const form = document.getElementById('fi-form');
    const tableBody = document.getElementById('fi-table-body');

    // Initial Load (Mock)
    loadTable();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        data.timestamp = new Date().toISOString();
        data.officer = db.getCurrentOfficer().badge; // Gets current user badge

        // Add to "DB" (Mock array for now, real implementation would stick in store.js)
        saveFI(data);

        // Reset & Reload
        form.reset();
        loadTable();
        alert("FI Card Submitted to Intelligence Division.");
    });

    // --- LOGIC ---

    // In-memory Mock Data since it's a demo session
    const fiData = [
        { first: 'Mike', last: 'Jones', location: '100 Main St', officer: '4921', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ];

    function saveFI(item) {
        fiData.unshift(item);
    }

    function loadTable() {
        if (fiData.length === 0) return;

        tableBody.innerHTML = fiData.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td style="font-weight: 600;">${item.last.toUpperCase()}, ${item.first.toUpperCase()}</td>
                <td>${item.location}</td>
                <td><span class="badge badge-info">${item.officer}</span></td>
            </tr>
        `).join('');
    }
}
