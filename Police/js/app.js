import { db } from './store.js';
import * as traffic from './modules/traffic.js';
import * as cases from './modules/cases.js';
import * as intelligence from './modules/intelligence.js';
import * as legal from './modules/legal.js';
import * as login from './modules/login.js';
import * as dispatch from './modules/dispatch.js';
import * as ficards from './modules/ficards.js';

// DOM Elements
const app = document.getElementById('app');
const loginRoot = document.getElementById('login-root');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userRank = document.getElementById('user-rank');
const sidebar = document.getElementById('sidebar');
const adminLabel = document.getElementById('admin-label');
const navAdmin = document.getElementById('nav-admin');
const mainContent = document.getElementById('main-content');
const logoutBtn = document.getElementById('logout-btn');

// State
let currentUser = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Start with Login
    showLogin();

    // Sidebar Navigation Logic
    sidebar.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item');
        if (!item) return;

        // Visual Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // Route
        const route = item.dataset.route;
        loadRoute(route);
    });

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        app.classList.add('hidden');
        showLogin();
    });
});

function showLogin() {
    loginRoot.innerHTML = login.getTemplate();
    loginRoot.classList.remove('hidden');
    login.init((user) => {
        // Auth Success
        currentUser = user;
        db.setCurrentOfficer(user); // Sync to store
        loginRoot.innerHTML = ''; // Clear login
        loginRoot.classList.add('hidden');
        initializeApp();
    });
}

function initializeApp() {
    app.classList.remove('hidden');

    // Set Sidebar User Info
    userName.innerText = currentUser.name;
    userRank.innerText = currentUser.rank;
    userAvatar.innerText = currentUser.initials;

    // Handle Admin Visibility
    if (currentUser.badge === '001') {
        adminLabel.classList.remove('hidden');
        navAdmin.classList.remove('hidden');
    } else {
        adminLabel.classList.add('hidden');
        navAdmin.classList.add('hidden');
    }

    // Default Route
    loadRoute('dashboard');
}

function loadRoute(route) {
    mainContent.innerHTML = ''; // Clear current

    switch (route) {
        case 'dashboard':
            // "Command Center" Dashboard - A mix of widgets
            mainContent.innerHTML = `
                <div class="fade-in">
                    <div class="page-header">
                        <div>
                            <div class="page-title">Command Center</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">Overview for ${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    <div class="widget-grid">
                         <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-tower-broadcast"></i></div>
                            <div class="stat-value" style="color: var(--brand-primary);">5</div>
                            <div class="stat-label">Active CAD Calls</div>
                        </div>
                         <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-file-invoice"></i></div>
                            <div class="stat-value">12</div>
                            <div class="stat-label">Citations Issued (Shift)</div>
                        </div>
                         <div class="stat-card">
                            <div class="stat-icon"><i class="fa-solid fa-users-viewfinder"></i></div>
                            <div class="stat-value" style="color: var(--warning);">3</div>
                            <div class="stat-label">BOLO Alerts</div>
                        </div>
                    </div>

                    <div class="grid-2">
                        <div class="card">
                             <div class="card-header"><div class="card-title">Pending Reports</div></div>
                             <div class="card-body">
                                <div style="color: var(--text-secondary); text-align: center; padding: 1rem;">All reports up to date.</div>
                             </div>
                        </div>
                        <div class="card">
                             <div class="card-header"><div class="card-title">Department Notices</div></div>
                             <div class="card-body">
                                <div style="padding: 0.5rem; background: #fff7ed; border-left: 4px solid #f97316; font-size: 0.9rem;">
                                    <strong>Range Training:</strong> Mandatory requalification next Tuesday at 0800.
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            `;
            // Dashboard doesn't need a module init for now
            break;

        case 'dispatch':
            mainContent.innerHTML = dispatch.getTemplate();
            dispatch.init();
            break;

        case 'traffic':
            mainContent.innerHTML = traffic.getTemplate();
            traffic.init();
            break;

        case 'cases':
            mainContent.innerHTML = cases.getTemplate();
            cases.init();
            break;

        case 'ficards':
            mainContent.innerHTML = ficards.getTemplate();
            ficards.init();
            break;

        case 'intelligence':
            mainContent.innerHTML = intelligence.getTemplate();
            intelligence.init();
            break;

        case 'legal':
            mainContent.innerHTML = legal.getTemplate();
            legal.init();
            break;

        default:
            mainContent.innerHTML = '<div style="padding: 2rem;">Module Construction In Progress...</div>';
    }
}
