import { AuthSystem } from './auth.js';
import * as Evidence from './modules/evidence.js';
import * as Tickets from './modules/tickets.js';
import * as Reporting from './modules/reporting.js';

class App {
    constructor() {
        this.auth = new AuthSystem();
        this.viewContainer = document.getElementById('view-container');
        this.navItems = document.querySelectorAll('.nav-item');
        this.pageTitle = document.getElementById('page-title');

        this.init();
    }

    init() {
        // Navigation Logic
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const viewName = item.dataset.view;
                this.switchView(viewName);

                // Update active state
                this.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Load default view (Dashboard)
        this.renderDashboard();
    }

    switchView(viewName) {
        // Fade out
        this.viewContainer.style.opacity = '0';
        this.viewContainer.style.transition = 'opacity 0.2s';

        setTimeout(() => {
            switch (viewName) {
                case 'dashboard':
                    this.renderDashboard();
                    break;
                case 'evidence':
                    this.renderEvidence();
                    break;
                case 'tickets':
                    this.renderTickets();
                    break;
                case 'reporting':
                    this.renderReporting();
                    break;
            }
            // Fade in
            this.viewContainer.style.opacity = '1';
        }, 200);
    }

    renderDashboard() {
        this.pageTitle.innerText = 'Command Center';
        this.viewContainer.innerHTML = `
            <div class="heat-grid">
                <div class="stat-card">
                    <div class="stat-label">Active Units</div>
                    <div class="stat-value" style="color: var(--primary)">24</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending Calls</div>
                    <div class="stat-value" style="color: var(--warning)">08</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Flagged Plates</div>
                    <div class="stat-value" style="color: var(--danger)">03</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Evidence Queued</div>
                    <div class="stat-value" style="color: var(--success)">12</div>
                </div>
            </div>

            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 class="stat-label" style="margin-bottom: 1rem;">Recent Alerts</h3>
                <table class="recent-activity-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>10:42 AM</td>
                            <td>459 - Burglary</td>
                            <td>892 North St.</td>
                            <td><span class="badge danger">IN PROGRESS</span></td>
                        </tr>
                        <tr>
                            <td>10:15 AM</td>
                            <td>Traffic Stop</td>
                            <td>I-95 Exit 4</td>
                            <td><span class="badge success">CLEARED</span></td>
                        </tr>
                        <tr>
                            <td>09:55 AM</td>
                            <td>Suspicious Activity</td>
                            <td>Central Park</td>
                            <td><span class="badge warning">DISPATCHED</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    renderEvidence() {
        this.pageTitle.innerText = 'Evidence Management';
        this.viewContainer.innerHTML = Evidence.getTemplate();
        Evidence.init(this.viewContainer);
    }

    renderTickets() {
        this.pageTitle.innerText = 'Citation & Traffic';
        this.viewContainer.innerHTML = Tickets.getTemplate();
        Tickets.init(this.viewContainer);
    }

    renderReporting() {
        this.pageTitle.innerText = 'Intelligence & Reporting';
        this.viewContainer.innerHTML = Reporting.getTemplate();
        Reporting.init(this.viewContainer);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
