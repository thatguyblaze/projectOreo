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
// Sidebar User Pod
const userAvatar = document.querySelector('.user-avatar'); // Class selector in new theme
const userName = document.querySelector('.user-name');
const userRank = document.querySelector('.user-rank');
const sidebar = document.getElementById('sidebar');
const adminLabel = document.getElementById('admin-label'); // Might need adjustment if ID changed
const navAdmin = document.getElementById('nav-admin');
const mainContent = document.getElementById('main-content');
const logoutBtn = document.getElementById('logout-btn'); // Will need to re-add to HTML or find by class

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

    // Handle Admin Visibility (If element exists)
    if (adminLabel && navAdmin) {
        if (currentUser.badge === '001') {
            adminLabel.classList.remove('hidden');
            navAdmin.classList.remove('hidden');
        } else {
            adminLabel.classList.add('hidden');
            navAdmin.classList.add('hidden');
        }
    }

    // Default Route
    loadRoute('dashboard');
}

function loadRoute(route) {
    mainContent.innerHTML = ''; // Clear current

    switch (route) {
        case 'dashboard':
            // "Command Center" Dashboard - CommandOS Theme
            mainContent.innerHTML = `
                <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
                    <div class="workspace-header">
                        <div>
                            <div class="ws-title">COMMAND CENTER</div>
                            <div class="mono text-dim" style="font-size: 0.8rem;">${new Date().toLocaleDateString().toUpperCase()}</div>
                        </div>
                    </div>

                    <div class="scroller">
                        <div class="grid-3" style="margin-bottom: 2rem;">
                             <div class="panel" style="margin:0;">
                                <div class="panel-body" style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="font-size: 2rem; color: var(--accent-cyan);"><i class="fa-solid fa-tower-broadcast"></i></div>
                                    <div>
                                        <div class="mono text-bright" style="font-size: 1.5rem; font-weight: bold;">5</div>
                                        <div class="text-dim" style="font-size: 0.7rem;">ACTIVE CALLS</div>
                                    </div>
                                </div>
                            </div>
                             <div class="panel" style="margin:0;">
                                <div class="panel-body" style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="font-size: 2rem; color: var(--text-bright);"><i class="fa-solid fa-file-invoice"></i></div>
                                    <div>
                                        <div class="mono text-bright" style="font-size: 1.5rem; font-weight: bold;">12</div>
                                        <div class="text-dim" style="font-size: 0.7rem;">CITATIONS (SHIFT)</div>
                                    </div>
                                </div>
                            </div>
                             <div class="panel" style="margin:0;">
                                <div class="panel-body" style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="font-size: 2rem; color: var(--accent-amber);"><i class="fa-solid fa-users-viewfinder"></i></div>
                                    <div>
                                        <div class="mono text-bright" style="font-size: 1.5rem; font-weight: bold;">3</div>
                                        <div class="text-dim" style="font-size: 0.7rem;">BOLOS / WARRANTS</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid-2">
                            <div class="panel">
                                 <div class="panel-head">PENDING REPORTS</div>
                                 <div class="panel-body">
                                    <div class="text-dim mono" style="text-align: center; padding: 1rem;">
                                        <i class="fa-solid fa-check-circle text-green" style="margin-bottom: 10px; display: block; font-size: 1.5rem;"></i>
                                        ALL REPORTS FILED
                                    </div>
                                 </div>
                            </div>
                            <div class="panel">
                                 <div class="panel-head">DEPARTMENT NOTICES</div>
                                 <div class="panel-body">
                                    <div style="padding: 10px; background: rgba(245, 158, 11, 0.1); border-left: 3px solid var(--accent-amber); font-size: 0.85rem;">
                                        <strong class="text-amber">RANGE TRAINING</strong><br>
                                        Mandatory requalification Tuesday 0800.
                                    </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
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
