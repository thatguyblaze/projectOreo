import * as Login from './modules/login.js';
import * as Dashboard from './modules/dashboard.js';
import * as Tickets from './modules/traffic.js';
import * as Cases from './modules/cases.js';
import * as Intelligence from './modules/intelligence.js'; // Will update later
import * as Admin from './modules/admin.js';
import * as Redaction from './modules/redaction.js';
import * as Legal from './modules/legal.js'; // New Module

// State
let currentUser = null;

const routes = {
    'dashboard': Dashboard,
    'traffic': Tickets,
    'cases': Cases,
    'intelligence': Intelligence,
    'redaction': Redaction,
    'admin': Admin,
    'legal': Legal
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Login
    const loginRoot = document.getElementById('login-root');
    loginRoot.innerHTML = Login.getTemplate();
    Login.init((user) => {
        handleLoginSuccess(user);
    });
});

function handleLoginSuccess(user) {
    currentUser = user;

    // UI Switch
    document.getElementById('login-root').classList.add('hidden');
    const app = document.getElementById('app');
    app.classList.remove('hidden');

    // Set Profile
    document.getElementById('user-name').innerText = user.name.toUpperCase();
    document.getElementById('user-rank').innerText = user.rank.toUpperCase();

    // RBAC (Role Based Access)
    const adminNav = document.getElementById('nav-admin');
    if (user.rank === 'Captain' || user.rank === 'Sergeant') {
        adminNav.classList.remove('hidden');
    }

    // Init Router
    initRouter();

    // Logout Logic
    document.getElementById('logout-btn').addEventListener('click', () => {
        location.reload(); // Simple logout
    });
}

function initRouter() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentArea = document.getElementById('main-content');

    // Default Route
    loadRoute('dashboard');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Active State
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Load Content
            const route = item.dataset.route;
            loadRoute(route);
        });
    });

    function loadRoute(route) {
        const module = routes[route];
        if (module) {
            contentArea.innerHTML = module.getTemplate();
            // Checking if module has init function before calling it
            if (typeof module.init === 'function') {
                module.init();
            }
        } else {
            contentArea.innerHTML = `<div style="padding: 2rem; text-align: center;">Module '${route}' under development.</div>`;
        }
    }
}
