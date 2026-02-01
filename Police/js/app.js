import * as Dashboard from './modules/dashboard.js';
import * as Tickets from './modules/traffic.js';
import * as Cases from './modules/cases.js';
import * as Intelligence from './modules/intelligence.js';
import * as Admin from './modules/admin.js';

class App {
    constructor() {
        this.viewContainer = document.getElementById('view-container');
        this.pageTitle = document.getElementById('page-title');
        this.navItems = document.querySelectorAll('.nav-item');

        this.init();
    }

    init() {
        // Navigation Logic (Top Bar)
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = item.dataset.view;

                // Update active state
                this.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Switch View
                this.switchView(viewName);
            });
        });

        // Load default view (Dashboard)
        this.switchView('dashboard');
    }

    switchView(viewName) {
        // Clear container with fade effect
        this.viewContainer.style.opacity = '0';

        setTimeout(() => {
            this.viewContainer.innerHTML = '';

            switch (viewName) {
                case 'dashboard':
                    this.updateHeader('Command Dashboard', 'Overview');
                    this.viewContainer.innerHTML = Dashboard.getTemplate();
                    Dashboard.init();
                    break;
                case 'tickets':
                    this.updateHeader('Citation Management', 'Traffic & Enforcement');
                    this.viewContainer.innerHTML = Tickets.getTemplate();
                    Tickets.init(); // Now handles sub-views internally
                    break;
                case 'cases':
                    this.updateHeader('Case Manager', 'Investigations');
                    this.viewContainer.innerHTML = Cases.getTemplate();
                    Cases.init();
                    break;
                case 'intelligence':
                    this.updateHeader('Intelligence', 'Maps & Analytics');
                    this.viewContainer.innerHTML = Intelligence.getTemplate();
                    Intelligence.init();
                    break;
                case 'admin':
                    this.updateHeader('Admin Center', 'System Control');
                    this.viewContainer.innerHTML = Admin.getTemplate();
                    Admin.init();
                    break;
            }

            // Restore Opacity
            this.viewContainer.style.opacity = '1';
        }, 150);
    }

    updateHeader(title, subtitle) {
        this.pageTitle.innerHTML = `<i class="fa-solid fa-chevron-right" style="font-size: 0.8rem; margin-right: 10px; color: var(--text-muted);"></i> ${title} <span style="font-weight: 400; color: var(--text-muted); margin-left: 10px;">| ${subtitle}</span>`;
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
