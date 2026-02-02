import { db } from '../store.js';

export function getTemplate() {
    return `
        <!-- Dashboard Content logic handles dynamic data -->
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="workspace-header">
                 <div class="ws-title">Command Dashboard</div>
            </div>

            <div class="scroller">
                <div class="grid-3" style="margin-bottom: 2rem;">
                    <div class="panel">
                        <div class="panel-body" style="text-align: center;">
                            <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Month Citations</div>
                            <div class="text-primary" style="font-size: 2.5rem; font-weight: 800;" id="kpi-citations">0</div>
                            <span class="badge" style="background: #dcfce7; color: #166534;">Live Count</span>
                        </div>
                    </div>
                     <div class="panel">
                        <div class="panel-body" style="text-align: center;">
                            <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Active Cases</div>
                            <div class="text-primary" style="font-size: 2.5rem; font-weight: 800;" id="kpi-cases">0</div>
                             <span class="badge" style="background: #e0f2fe; color: #075985;">Open Files</span>
                        </div>
                    </div>
                     <div class="panel">
                        <div class="panel-body" style="text-align: center;">
                            <div class="text-secondary" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Officer Status</div>
                            <div class="text-primary" style="font-size: 1.5rem; font-weight: 700; margin: 10px 0;" id="dashboard-officer">...</div>
                             <span class="badge" style="background: #f3f4f6; color: #374151;">On Duty</span>
                        </div>
                    </div>
                </div>

                <div class="grid-2" style="grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                    <div class="panel">
                        <div class="panel-head">Recent Activity Log</div>
                        <div class="panel-body" style="padding: 0;">
                            <table class="cyber-table">
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
                    
                     <div class="panel">
                        <div class="panel-head">Quick Actions</div>
                        <div class="panel-body">
                            <button class="btn btn-ghost" style="width: 100%; justify-content: flex-start; margin-bottom: 5px; border: 1px solid var(--border);">
                                <i class="fa-solid fa-calendar-days"></i> Court Schedule
                            </button>
                            <button class="btn btn-ghost" style="width: 100%; justify-content: flex-start; border: 1px solid var(--border);">
                                <i class="fa-solid fa-envelope"></i> Department Emails
                            </button>
                        </div>
                    </div>
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
