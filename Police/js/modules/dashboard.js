import { db } from '../store.js';

export function getTemplate() {
    return `
        <!-- Dashboard Content logic handles dynamic data -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Month Citations</div>
                <div class="kpi-value" id="kpi-citations">0</div>
                <div class="badge badge-success">Live Count</div>
            </div>
             <div class="kpi-card">
                <div class="kpi-label">Active Cases</div>
                <div class="kpi-value" id="kpi-cases">0</div>
            </div>
             <div class="kpi-card">
                <div class="kpi-label">Officer On Duty</div>
                <div class="kpi-value" style="font-size: 1.2rem; margin-top: 10px;" id="dashboard-officer">...</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Recent Activity Log</div>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Type</th>
                                <th>Detail</th>
                            </tr>
                        </thead>
                        <tbody id="activity-feed">
                            <!-- Injected -->
                        </tbody>
                    </table>
                </div>
            </div>
            
             <div class="card">
                <div class="card-header"><div class="card-title">Quick Actions</div></div>
                <div class="card-body">
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 10px;">Check Court Schedule</button>
                    <button class="btn btn-outline" style="width: 100%;">Department Emails</button>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    const tickets = db.getTickets();
    const cases = db.getCases();
    const officer = db.getCurrentOfficer();

    // Update KPIs
    document.getElementById('kpi-citations').innerText = tickets.length;
    document.getElementById('kpi-cases').innerText = cases.length || 0; // Default if cases implementation lags
    document.getElementById('dashboard-officer').innerText = `${officer.rank} ${officer.name}`;

    // Update Feed (Combine Tickets as activity for now)
    const feed = document.getElementById('activity-feed');
    // Sort recent first
    const recentTickets = tickets.slice(0, 5);

    if (recentTickets.length === 0) {
        feed.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #94a3b8; padding: 20px;">No recent activity recorded locally.</td></tr>';
    } else {
        feed.innerHTML = recentTickets.map(t => `
            <tr>
                <td>${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td><span class="badge ${getBadgeColor(t.type)}">${t.type}</span></td>
                <td>${t.plate} - ${t.speed ? t.speed + ' MPH' : t.offense || 'Violation'}</td>
            </tr>
        `).join('');
    }
}

function getBadgeColor(type) {
    if (type === 'Speeding') return 'badge-warning';
    if (type === 'Criminal') return 'badge-danger';
    return 'badge-success';
}
