import * as Dashboard from './modules/dashboard.js';
import * as Cases from './modules/cases.js';
import * as Traffic from './modules/traffic.js';
import * as Redaction from './modules/redaction.js';
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
        // Navigation Logic
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = item.dataset.view;
                this.switchView(viewName);

                // Update active state
                this.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Load default view (Dashboard)
        this.switchView('dashboard');
    }

    switchView(viewName) {
        // Clear container
        this.viewContainer.innerHTML = '';

        switch (viewName) {
            case 'dashboard':
                this.pageTitle.innerText = 'Command Dashboard';
                this.viewContainer.innerHTML = Dashboard.getTemplate();
                Dashboard.init();
                break;
            case 'cases':
                this.pageTitle.innerText = 'Case Management';
                this.viewContainer.innerHTML = Cases.getTemplate();
                Cases.init();
                break;
            case 'traffic':
                this.pageTitle.innerText = 'Traffic & OCR Terminal';
                this.viewContainer.innerHTML = Traffic.getTemplate();
                Traffic.init();
                break;
            case 'redaction':
                this.pageTitle.innerText = 'Redaction Studio';
                this.viewContainer.innerHTML = Redaction.getTemplate();
                Redaction.init();
                break;
            case 'intelligence':
                this.pageTitle.innerText = 'Intelligence & Analytics';
                this.viewContainer.innerHTML = Intelligence.getTemplate();
                Intelligence.init();
                break;
            case 'admin':
                this.pageTitle.innerText = 'Admin Center';
                this.viewContainer.innerHTML = Admin.getTemplate();
                Admin.init();
                break;
        }
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
