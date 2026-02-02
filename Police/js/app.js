/**
 * Police Portal Main Controller v3
 */
import { db } from './store.js';

// Module Imports (Dynamic)
const MODULES = {
    'dashboard': './modules/dashboard.js',
    'dispatch': './modules/dispatch.js',
    'traffic': './modules/traffic.js',
    'cases': './modules/cases.js',
    'reports': './modules/reports.js',
    'ficards': './modules/ficards.js',
    'legal': './modules/legal.js',
    'admin': './modules/admin.js',
    'patrol': './modules/patrol.js',
    'login': './modules/login.js'
};

let currentModule = null;

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const officer = localStorage.getItem('cmd_officer_v2');

    if (!officer) {
        loadModule('login');
    } else {
        try {
            // Parse officer data from localStorage
            const currentUser = JSON.parse(officer);
            db.setCurrentOfficer(currentUser); // Sync to store
            initializeApp(currentUser);
            setupNav();
            loadModule('dashboard');
        } catch (e) {
            console.error("Auth Error", e);
            loadModule('login'); // Fallback
        }
    }
});

function setupNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            // Add active
            e.currentTarget.classList.add('active');

            const target = e.currentTarget.dataset.page;
            if (target === 'logout') {
                localStorage.removeItem('cmd_officer_v2');
                window.location.reload();
            } else {
                loadModule(target);
            }
        });
    });
}

async function loadModule(name) {
    const content = document.getElementById('main-content');
    const sidebar = document.getElementById('sidebar');
    const container = document.getElementById('app-container');

    // Handle Login View Mode
    if (name === 'login') {
        sidebar.classList.add('hidden');
        content.style.marginLeft = '0';
        content.style.width = '100vw';
    } else if (sidebar.classList.contains('hidden')) {
        // Restore Sidebar if coming from login
        sidebar.classList.remove('hidden');
        content.style.marginLeft = '260px'; // Matching CSS
        content.style.width = 'calc(100vw - 260px)';
    }

    try {
        const modulePath = MODULES[name];
        if (!modulePath) {
            console.warn("Module not found: " + name);
            content.innerHTML = `<div style="padding: 2rem;">Module '${name}' is under construction.</div>`;
            return;
        }

        const mod = await import(modulePath);

        // 1. Get Template
        if (mod.getTemplate) {
            content.innerHTML = mod.getTemplate();
        } else {
            content.innerHTML = `<div style="padding: 2rem;">Error: Module '${name}' has no template.</div>`;
        }

        // 2. Init Logic
        if (mod.init) {
            if (name === 'login') {
                mod.init((officerData) => {
                    // On Auth Success
                    localStorage.setItem('cmd_officer_v2', JSON.stringify(officerData));
                    db.setCurrentOfficer(officerData); // Sync to store
                    initializeApp(officerData);
                    setupNav(); // Re-bind nav
                    loadModule('dashboard');
                });
            } else {
                mod.init();
            }
        }

        currentModule = name;

    } catch (err) {
        console.error(err);
        content.innerHTML = `<div style="padding: 2rem; color: red;">Error loading module: ${name}<br>${err.message}</div>`;
    }
}

function initializeApp(user) {
    console.log("App Initialized for: " + user.name);

    // GAMIFICATION: Rank Unlocks
    // Helpers
    const lock = (page, minRank) => {
        const btn = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (btn) {
            // Check if user has rankLevel, default to 0
            const level = user.rankLevel || 0;

            if (level < minRank) {
                // MINIMAL LOOK: Hide completely
                btn.style.display = 'none';
            }
        }
    };

    lock('cases', 1);
    lock('reports', 1);
    lock('ficards', 1);
    lock('intelligence', 2);

    // Admin is special
    const adminBtn = document.querySelector(`.nav-item[data-page="admin"]`);
    if (adminBtn) {
        if (user.badge !== '001') {
            adminBtn.style.display = 'none';
        }
    }
}

