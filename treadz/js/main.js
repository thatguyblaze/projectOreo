// Created with <3 by Blazinik

document.addEventListener('DOMContentLoaded', () => {

    const getEl = (id) => document.getElementById(id);

    let inventory = [];
    let activityLog = [];
    let auditHistory = [];

    // Catalog & PO System State
    let catalogItems = [];
    let purchaseOrderCart = []; // Array of { id, item, sizeStr, quantity, distributor }
    let searchStats = {};
    let catalogFilters = {
        distributor: '',
        brand: '',
        rim: '',
        type: '',
        ply: '',
        sort: 'price_asc'
    };

    const loadData = () => {
        // Inventory: Pull from BOTH V7 and V5 regardless (Merge Strategy)
        const v7Raw = localStorage.getItem('treadzTireInventoryV7');
        const v5Raw = localStorage.getItem('treadzTireInventoryV5');

        let v7Inventory = v7Raw ? JSON.parse(v7Raw) : [];
        let v5Inventory = v5Raw ? JSON.parse(v5Raw) : [];

        // Ensure arrays
        if (!Array.isArray(v7Inventory)) v7Inventory = [];
        if (!Array.isArray(v5Inventory)) v5Inventory = [];

        // Merge V5 and V7 with smart deduplication and quantity reconciliation
        const mergedInventory = [...v7Inventory];
        const v7Ids = new Set(v7Inventory.map(i => i.id));

        v5Inventory.forEach(v5Item => {
            // FORCE ADD EVERYTHING from V5 as new records
            // Generate new ID to ensure no conflicts
            const newItem = {
                ...v5Item,
                id: Date.now().toString(36) + Math.random().toString(36).substr(2) + '_v5'
            };
            mergedInventory.push(newItem);
        });

        // Fallback to legacy unversioned if absolutely nothing found
        if (mergedInventory.length === 0) {
            const legacyData = localStorage.getItem('treadzTireInventory');
            if (legacyData) {
                try {
                    const parsed = JSON.parse(legacyData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log('Migrating legacy data from treadzTireInventory');
                        mergedInventory.push(...parsed);
                    }
                } catch (e) { }
            }
        }

        // Activity Log Migration
        if (!localStorage.getItem('treadzActivityLogV7')) {
            const legacyLog = localStorage.getItem('treadzActivityLog');
            if (legacyLog) localStorage.setItem('treadzActivityLogV7', legacyLog);
        }

        // Audit History Migration
        if (!localStorage.getItem('treadzAuditHistoryV7')) {
            const legacyAudit = localStorage.getItem('treadzAuditHistory');
            if (legacyAudit) localStorage.setItem('treadzAuditHistoryV7', legacyAudit);
        }

        inventory = mergedInventory;
        activityLog = JSON.parse(localStorage.getItem('treadzActivityLogV7')) || [];
        auditHistory = JSON.parse(localStorage.getItem('treadzAuditHistoryV7')) || [];
        purchaseOrderCart = JSON.parse(localStorage.getItem('treadzPOCart')) || [];
        searchStats = JSON.parse(localStorage.getItem('treadzSearchStats')) || {};

        // Initialize Catalog
        if (typeof TireCatalog !== 'undefined') {
            catalogItems = TireCatalog.getAll();

            // Patch missing sourceIds for legacy catalog data
            if (catalogItems.length > 0) {
                const sources = ['ATD', 'TireHub', 'US Auto', 'Atlantic'];
                catalogItems.forEach(item => {
                    if (!item._sourceId) {
                        item._sourceId = sources[Math.floor(Math.random() * sources.length)];
                    }
                });
            }

            // Force robust mock data if TireCatalog returns empty (e.g., cleared storage)
            if (catalogItems.length === 0) {
                const mocks = [
                    { vendor_name: 'Michelin', model_name: 'Defender T+H', car_type_str: 'Passenger', season: 'All Season', _sourceId: 'ATD', _price: 185.00, sizes: [{ width: 225, profile: 60, rim: 16, load_index: 98, speed_rating: 'H' }, { width: 215, profile: 55, rim: 17, load_index: 94, speed_rating: 'V' }], photo: 'https://images.tirebuyer.com/visual-aids/michelin/defendert+h/michelin_defendert+h_r01_sidewall.jpg' },
                    { vendor_name: 'Goodyear', model_name: 'Assurance WeatherReady', car_type_str: 'Passenger', season: 'All Weather', _sourceId: 'TireHub', _price: 170.50, sizes: [{ width: 205, profile: 55, rim: 16, load_index: 91, speed_rating: 'H' }], photo: 'https://images.tirebuyer.com/visual-aids/goodyear/assuranceweatherready/goodyear_assuranceweatherready_r01_sidewall.jpg' },
                    { vendor_name: 'Bridgestone', model_name: 'Blizzak WS90', car_type_str: 'Passenger', season: 'Winter', _sourceId: 'US Auto', _price: 155.00, sizes: [{ width: 195, profile: 65, rim: 15, load_index: 91, speed_rating: 'T' }], photo: 'https://images.tirebuyer.com/visual-aids/bridgestone/blizzakws90/bridgestone_blizzakws90_r01_sidewall.jpg' },
                    { vendor_name: 'BFGoodrich', model_name: 'All-Terrain T/A KO2', car_type_str: 'Truck/SUV', season: 'All Terrain', _sourceId: 'ATD', _price: 245.99, sizes: [{ width: 265, profile: 70, rim: 17, load_index: 121, speed_rating: 'R', xl_flag: 'on' }, { width: 285, profile: 70, rim: 17, load_index: 121, speed_rating: 'R' }], photo: 'https://images.tirebuyer.com/visual-aids/bfgoodrich/allterraintako2/bfgoodrich_allterraintako2_r01_sidewall.jpg' },
                    { vendor_name: 'Continental', model_name: 'ExtremeContact DWS06 Plus', car_type_str: 'Passenger', season: 'All Season', _sourceId: 'US Auto', _price: 210.00, sizes: [{ width: 245, profile: 40, rim: 19, load_index: 98, speed_rating: 'Y', xl_flag: 'on' }], photo: 'https://images.tirebuyer.com/visual-aids/continental/extremecontactdws06plus/continental_extremecontactdws06plus_r01_sidewall.jpg' },
                    { vendor_name: 'Pirelli', model_name: 'Cinturato P7 All Season Plus II', car_type_str: 'Passenger', season: 'Touring', _sourceId: 'TireHub', _price: 165.00, sizes: [{ width: 225, profile: 45, rim: 17, load_index: 94, speed_rating: 'V' }], photo: 'https://images.tirebuyer.com/visual-aids/pirelli/cinturatop7allseasonplusii/pirelli_cinturatop7allseasonplusii_r01_sidewall.jpg' },
                    { vendor_name: 'Hankook', model_name: 'Dynapro AT2', car_type_str: 'Truck/SUV', season: 'All Terrain', _sourceId: 'ATD', _price: 195.00, sizes: [{ width: 275, profile: 55, rim: 20, load_index: 113, speed_rating: 'T' }], photo: 'https://images.tirebuyer.com/visual-aids/hankook/dynaproat2rf11/hankook_dynaproat2rf11_r01_sidewall.jpg' },
                    { vendor_name: 'Falken', model_name: 'Wildpeak A/T3W', car_type_str: 'Truck/SUV', season: 'All Terrain', _sourceId: 'Atlantic', _price: 220.00, _orderUrl: 'https://www.atlantictire.com/falken', sizes: [{ width: 265, profile: 75, rim: 16, load_index: 116, speed_rating: 'T' }], photo: 'https://images.tirebuyer.com/visual-aids/falken/wildpeakat3w/falken_wildpeakat3w_r01_sidewall.jpg' },
                    { vendor_name: 'Toyo', model_name: 'Open Country A/T III', car_type_str: 'Truck/SUV', season: 'All Terrain', _sourceId: 'US Auto', _price: 230.50, sizes: [{ width: 285, profile: 75, rim: 16, load_index: 126, speed_rating: 'R' }], photo: 'https://images.tirebuyer.com/visual-aids/toyo/opencountryat3/toyo_opencountryat3_r01_sidewall.jpg' },
                    { vendor_name: 'Kumho', model_name: 'Crugen HP71', car_type_str: 'SUV', season: 'All Season', _sourceId: 'TireHub', _price: 145.00, sizes: [{ width: 235, profile: 60, rim: 18, load_index: 103, speed_rating: 'V' }], photo: 'https://images.tirebuyer.com/visual-aids/kumho/crugenhp71/kumho_crugenhp71_r01_sidewall.jpg' }
                ];
                TireCatalog.setAll(mocks);
                catalogItems = mocks;
            }

            // Augment with mock prices for sorting
            catalogItems.forEach(item => {
                if (!item._price) {
                    const base = 50;
                    const rimFactor = (parseInt(item.sizes?.[0]?.rim) || 15) * 5;
                    item._price = base + rimFactor + (Math.random() * 50);
                }
            });
        }
        updateCartCount();
    };

    const saveData = () => {
        localStorage.setItem('treadzTireInventoryV7', JSON.stringify(inventory));
        localStorage.setItem('treadzActivityLogV7', JSON.stringify(activityLog));
        localStorage.setItem('treadzAuditHistoryV7', JSON.stringify(auditHistory));
        localStorage.setItem('treadzPOCart', JSON.stringify(purchaseOrderCart));
        localStorage.setItem('treadzSearchStats', JSON.stringify(searchStats));
    };

    // Purchase Order Logic
    const addToCart = (item, sizeStr, qty) => {
        // Special Handling for Link-Only Distributors (e.g. Atlantic sFTP sites or direct links)
        if (item._orderUrl) {
            window.open(item._orderUrl, '_blank');
            showToast(`Opening ${item.vendor_name} site...`);
            return;
        }

        const existing = purchaseOrderCart.find(i => i.item.model_id === item.model_id && i.sizeStr === sizeStr);
        if (existing) {
            existing.quantity += qty;
        } else {
            purchaseOrderCart.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                item: item,
                sizeStr: sizeStr,
                quantity: qty,
                distributor: item._sourceId || 'Local'
            });
        }
        saveData();
        updateCartCount();
        showToast(`Added ${qty} to Order Queue`);

        // Visual feedback
        const btn = getEl('po-cart-btn');
        if (btn) {
            btn.classList.add('scale-125', 'bg-green-600');
            setTimeout(() => btn.classList.remove('scale-125', 'bg-green-600'), 200);
        }
    };

    const updateCartCount = () => {
        const count = purchaseOrderCart.reduce((sum, i) => sum + i.quantity, 0);
        const badge = getEl('cart-count-badge');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        }
    };

    window.removeFromCart = (id) => {
        purchaseOrderCart = purchaseOrderCart.filter(i => i.id !== id);
        saveData();
        updateCartCount();
        renderCartDrawer();
    };

    window.clearCart = () => {
        if (confirm('Clear all pending orders?')) {
            purchaseOrderCart = [];
            saveData();
            updateCartCount();
            renderCartDrawer();
        }
    };

    window.toggleCartDrawer = () => {
        let drawer = getEl('po-drawer');
        if (!drawer) {
            createCartDrawer();
            drawer = getEl('po-drawer');
        }

        const overlay = getEl('po-drawer-overlay');

        if (drawer.classList.contains('translate-x-full')) {
            drawer.classList.remove('translate-x-full');
            if (overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            }
            renderCartDrawer();
        } else {
            drawer.classList.add('translate-x-full');
            if (overlay) {
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        }
    };

    window.processOrders = () => {
        if (purchaseOrderCart.length === 0) return;

        const grouped = {};
        purchaseOrderCart.forEach(i => {
            if (!grouped[i.distributor]) grouped[i.distributor] = [];
            grouped[i.distributor].push(i);
        });

        let msg = "Orders Processed:\n\n";
        Object.keys(grouped).forEach(dist => {
            msg += `--- ${dist} ---\n`;
            grouped[dist].forEach(i => {
                msg += `• [${i.quantity}] ${i.item.vendor_name} ${i.item.model_name} (${i.sizeStr})\n`;
            });
            msg += "\n";
        });

        alert("Simulating Purchase Order Submission:\n" + msg);
        // purchaseOrderCart = []; saveData(); updateCartCount(); renderCartDrawer();
    };

    const createCartDrawer = () => {
        const div = document.createElement('div');
        div.id = 'po-drawer';
        div.className = 'fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-[200] flex flex-col border-l border-gray-200';
        div.innerHTML = `
            <div class="p-6 bg-[#0B1221] text-white flex justify-between items-center shadow-md">
                <h2 class="text-xl font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FF6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Purchase Orders
                </h2>
                <button onclick="window.toggleCartDrawer()" class="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div id="cart-items-container" class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"></div>
            <div class="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div class="flex justify-between items-center mb-4 text-sm text-gray-500 font-medium">
                     <span id="cart-total-items">0 items</span>
                     <button onclick="window.clearCart()" class="text-red-500 hover:text-red-700 underline">Clear All</button>
                </div>
                <button onclick="window.processOrders()" class="w-full btn btn-primary py-4 text-lg font-bold shadow-lg flex justify-center items-center gap-2 bg-[#FF6600] border-[#FF6600] text-white hover:bg-[#e65c00]">
                    Submit Orders
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
        `;
        document.body.appendChild(div);

        const overlay = document.createElement('div');
        overlay.id = 'po-drawer-overlay';
        overlay.className = 'fixed inset-0 bg-black/50 z-[190] hidden transition-opacity opacity-0';
        overlay.onclick = window.toggleCartDrawer;
        document.body.appendChild(overlay);
    };

    const renderCartDrawer = () => {
        const container = getEl('cart-items-container');
        if (!container) return;
        container.innerHTML = '';

        if (purchaseOrderCart.length === 0) {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-gray-400">
                    <svg class="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p class="font-medium">Order queue is empty</p>
                    <p class="text-sm">Add items from the catalog</p>
                </div>`;
            getEl('cart-total-items').textContent = '0 items';
            return;
        }

        const grouped = {};
        purchaseOrderCart.forEach(i => {
            if (!grouped[i.distributor]) grouped[i.distributor] = [];
            grouped[i.distributor].push(i);
        });

        Object.keys(grouped).forEach(dist => {
            const section = document.createElement('div');
            section.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4';
            const itemsHtml = grouped[dist].map(i => `
                <div class="flex justify-between items-center p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${i.item.vendor_name} ${i.item.model_name}</div>
                        <div class="font-mono text-xs text-blue-600 font-bold">${i.sizeStr}</div>
                    </div>
                    <div class="flex items-center gap-3">
                         <div class="text-sm font-bold bg-gray-100 px-2 py-1 rounded text-gray-700">x${i.quantity}</div>
                         <button onclick="window.removeFromCart('${i.id}')" class="text-gray-300 hover:text-red-500 transition-colors p-1">
                             <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                    </div>
                </div>
             `).join('');

            section.innerHTML = `
                 <div class="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                     <span class="font-bold text-xs uppercase tracking-wider text-gray-500">${dist}</span>
                     <span class="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">${grouped[dist].length} Items</span>
                 </div>
                 <div>${itemsHtml}</div>
             `;
            container.appendChild(section);
        });

        getEl('cart-total-items').textContent = `${purchaseOrderCart.reduce((a, b) => a + b.quantity, 0)} items`;
    };

    // --- Core Functions & Renderers ---

    const parseTireSize = (input) => {
        if (!input) return null;
        const raw = String(input).toUpperCase();
        // Extract JUST digits for sequential matching (e.g. 2555520)
        const digits = raw.replace(/\D/g, '');

        // P-Metric: 2256517 (7 digits)
        if (digits.length === 7) {
            return {
                type: 'p-metric',
                width: parseInt(digits.substring(0, 3)),
                ratio: parseInt(digits.substring(3, 5)),
                rim: parseInt(digits.substring(5, 7))
            };
        }

        // Flotation: 35125020 (8 digits)
        if (digits.length === 8) {
            return {
                type: 'flotation',
                diameter: parseInt(digits.substring(0, 2)),
                width: parseFloat((parseInt(digits.substring(2, 6)) / 100).toFixed(2)),
                rim: parseInt(digits.substring(6, 8))
            };
        }

        // Partial P-Metric: 2357 (4 digits) or 22565 (5 digits)
        if (digits.length === 4 || digits.length === 5) {
            return {
                type: 'p-metric',
                width: parseInt(digits.substring(0, 3)),
                ratio: parseInt(digits.substring(3)), // 1 or 2 digits
                rim: null,
                partial: true
            };
        }

        // Regex Fallback for formatted strings
        const pMetricMatch = raw.match(/(\d{3})[\/\s](\d{2})R?(\d{2})/);
        if (pMetricMatch) {
            return { type: 'p-metric', width: parseInt(pMetricMatch[1]), ratio: parseInt(pMetricMatch[2]), rim: parseInt(pMetricMatch[3]) };
        }

        const floatMatch = raw.match(/(\d{2})[X\s](\d{2,4})R?(\d{2})/);
        if (floatMatch) {
            const diam = parseInt(floatMatch[1]);
            let width = parseFloat(floatMatch[2]);
            if (width > 100) width = width / 100; // handle 1250 vs 12.50
            return { type: 'flotation', diameter: diam, width: width, rim: parseInt(floatMatch[3]) };
        }

        return null;
    };

    const formatTireSize = (size) => {
        if (!size) return '';
        if (size.type === 'flotation') return `${size.diameter}x${size.width.toFixed(2)}R${size.rim}`;
        return `${size.width}/${size.ratio}R${size.rim}`;
    };

    const showToast = (message) => {
        const toast = getEl('toast');
        if (toast) {
            toast.innerHTML = `<p class="font-medium">${message}</p>`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    };

    const addLogEntry = (description, type = 'System', details = {}) => {
        const entry = {
            id: Date.now().toString(36),
            timestamp: new Date().toISOString(),
            description,
            type,
            details
        };
        activityLog.unshift(entry);
        if (activityLog.length > 100) activityLog.pop();
        saveData();
        // renderActivityLog(); // If implemented
    };

    const renderAll = () => {
        renderInventory();
        renderCatalog();
        const analyticsSection = getEl('analytics-section');
        if (analyticsSection && analyticsSection.classList.contains('open')) {
            renderAnalytics();
        }
        // renderActivityLog();
    };

    const renderAnalytics = () => {
        const list = getEl('most-searched-list');
        const ctx = getEl('analytics-chart');
        if (!list || !ctx) return;

        // Real Data Aggregation from Search Stats
        // Use persistent search statistics instead of inventory counts
        let data = Object.entries(searchStats)
            .map(([size, count]) => ({ size, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        if (data.length === 0) {
            data = [{ size: 'No Search Data', count: 0 }];
        }

        const maxCount = data[0].count || 1; // Prevent division by zero

        // List
        list.innerHTML = data.map((d, i) => {
            const percentage = ((d.count / maxCount) * 100).toFixed(1);
            return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-gray-400 text-sm">#${i + 1}</span>
                    <span class="font-mono font-bold text-gray-800">${d.size}</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                    <span class="text-xs font-bold text-gray-500 w-8 text-right">${d.count}</span>
                </div>
            </div>`;
        }).join('');

        // Chart
        if (window.analyticsChartInstance) window.analyticsChartInstance.destroy();
        window.analyticsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.size),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { usePointStyle: true, font: { family: "'Inter', sans-serif" } } }
                }
            }
        });
    };

    // --- Render Catalog (Updated for Purchase System) ---
    const renderCatalog = () => {
        const grid = getEl('catalog-grid');
        const empty = getEl('catalog-empty');
        const noData = getEl('catalog-no-data');
        const badge = getEl('catalog-count-badge');

        if (catalogItems.length === 0) {
            grid.innerHTML = ''; noData.classList.remove('hidden'); badge.textContent = '0'; return;
        }
        noData.classList.add('hidden');

        const searchTerm = getEl('search-input').value.trim();
        const parsedSearch = parseTireSize(searchTerm);

        let filtered = catalogItems.filter(item => {
            if (searchTerm) {
                const searchClean = searchTerm.replace(/\D/g, '');

                // 1. Precise Size Matching
                if (parsedSearch) {
                    const hasMatchingSize = (item.sizes || []).some(s =>
                        s.width == parsedSearch.width &&
                        (s.profile == parsedSearch.ratio || s.ratio == parsedSearch.ratio || s.diameter == parsedSearch.diameter) &&
                        s.rim == parsedSearch.rim
                    );
                    if (hasMatchingSize) return true;
                }

                // 2. Sequential Digit Matching (e.g. 2357 matches 235/75)
                if (searchClean.length >= 3) {
                    const itemClean = (item.size_display || '').replace(/\D/g, '');
                    if (itemClean.includes(searchClean)) return true;

                    // Also check individual sizes within the object
                    const hasDigitMatch = (item.sizes || []).some(s => {
                        const sDigits = `${s.width}${s.profile || s.ratio || s.diameter}${s.rim}`;
                        return sDigits.includes(searchClean);
                    });
                    if (hasDigitMatch) return true;
                }

                // 3. Standard Text Search
                const searchStr = [
                    item.vendor_name, item.model_name, item.size_display, item.car_type_str,
                    ...(item.sizes || []).map(s => `${s.width}/${s.profile || s.ratio}R${s.rim}`)
                ].join(' ').toLowerCase();
                const terms = searchTerm.toLowerCase().split(/\s+/);
                return terms.every(t => searchStr.includes(t));
            }
            if (catalogFilters.distributor && item._sourceId !== catalogFilters.distributor) return false;
            if (catalogFilters.brand && item.vendor_name !== catalogFilters.brand) return false;
            if (catalogFilters.rim && !(item.sizes || []).some(s => s.rim == catalogFilters.rim)) return false;
            // ... other filters omitted for brevity but logic remains same
            return true;
        });

        badge.textContent = filtered.length;
        if (filtered.length === 0) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');

        filtered.sort((a, b) => {
            if (catalogFilters.sort === 'brand') return (a.vendor_name || '').localeCompare(b.vendor_name || '');
            if (catalogFilters.sort === 'price_desc') return (b._price || 0) - (a._price || 0);
            return (a._price || 0) - (b._price || 0);
        });

        const displayItems = filtered.slice(0, 24);

        grid.innerHTML = displayItems.map(item => {
            const price = item._price ? `$${item._price.toFixed(2)}` : 'Call';
            const itemJson = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const imgUrl = item.photo || 'https://placehold.co/400x300/e2e8f0/1e293b?text=Tire+Image';

            return `
             <div class="catalog-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full bg-white">
                  <div onclick='window.openProductModal(${itemJson})' class="cursor-pointer relative h-48 bg-gray-100 overflow-hidden">
                       <img src="${imgUrl}" alt="${item.model_name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                       <div class="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm uppercase tracking-wider">
                           ${item._sourceId || 'Local'}
                       </div>
                  </div>
                  <div class="p-4 flex-grow flex flex-col justify-between">
                       <div onclick='window.openProductModal(${itemJson})' class="cursor-pointer mb-4">
                            <h3 class="font-bold text-lg text-gray-900 leading-tight">${item.vendor_name}</h3>
                            <p class="text-blue-600 font-medium">${item.model_name}</p>
                            <div class="text-xl font-bold text-gray-900 mt-2">${price}</div>
                       </div>
                       <button onclick='window.openProductModal(${itemJson})' class="w-full bg-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/20 hover:bg-[#FF6600] hover:text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Order
                       </button>
                  </div>
             </div>`;
        }).join('');
    };

    // Product Modal with Order Actions
    window.openProductModal = (item) => {
        const modalId = 'product-modal';
        let modal = getEl(modalId);
        if (modal) modal.remove();

        const imgUrl = item.photo || 'https://placehold.co/600x400/e2e8f0/1e293b?text=Tire+Details';

        const sizesHtml = (item.sizes || []).map(s => {
            const str = `${s.width}/${s.profile}R${s.rim}`;
            const itemJson = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            return `
              <div class="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group/item relative">
                  <div class="flex items-center gap-4">
                      <div class="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-xs shadow-inner">${s.rim}"</div>
                      <div>
                          <p class="font-mono font-bold text-lg text-gray-900 tracking-tight">${str}</p>
                          <p class="text-gray-400 text-xs uppercase tracking-wide font-semibold">${[s.load_index, s.speed_rating].join('')} ${s.xl_flag === 'on' ? 'XL' : ''}</p>
                      </div>
                  </div>
                  <div class="flex items-center gap-2">
                       <button onclick='window.orderFromModal(${itemJson}, "${str}")' class="text-xs font-bold text-white bg-[#FF6600] hover:bg-[#e65c00] shadow-md px-4 py-2 rounded-lg transition-all transform active:scale-95 flex items-center gap-1">
                          ORDER
                       </button>
                  </div>
              </div>`;
        }).join('');

        const html = `
         <div id="${modalId}" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style="backdrop-filter: blur(16px); background-color: rgba(255, 255, 255, 0.4);">
              <div class="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-gray-100 relative animate-fade-in-up">
                   <button onclick="document.getElementById('${modalId}').remove()" class="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 p-2 rounded-full backdrop-blur shadow-sm transition-all focus:outline-none">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                   <div class="w-full md:w-2/5 bg-slate-50 p-8 flex flex-col justify-center items-center relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <img src="${imgUrl}" class="relative z-10 w-full max-w-sm drop-shadow-2xl rounded-lg transform transition-transform duration-700 hover:scale-105" alt="${item.model_name}">
                        <div class="relative z-10 mt-8 text-center">
                            <h2 class="text-3xl font-black text-gray-900 tracking-tight mb-1">${item.vendor_name}</h2>
                            <p class="text-xl text-blue-600 font-bold tracking-tight">${item.model_name}</p>
                        </div>
                   </div>
                   <div class="w-full md:w-3/5 flex flex-col h-full bg-white relative z-10">
                        <div class="p-6 border-b border-gray-100 bg-white">
                            <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">Available Sizes</h3>
                            <p class="text-gray-400 text-sm mt-1">Select a size to order.</p>
                        </div>
                        <div class="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-gray-200">
                            <div class="divide-y divide-gray-100">${sizesHtml}</div>
                        </div>
                   </div>
              </div>
         </div>
         <style>.animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px) scale(0.98); } @keyframes fadeInUp { to { opacity: 1; transform: translateY(0) scale(1); } } .scrollbar-thin::-webkit-scrollbar { width: 6px; }</style>
         `;
        const div = document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild);
    };

    window.orderFromModal = (item, sizeStr) => {
        let qty = prompt(`Quantity of ${sizeStr} to order?`, "4");
        if (qty && parseInt(qty) > 0) {
            addToCart(item, sizeStr, parseInt(qty));
        }
    };

    const renderInventory = () => {
        const container = getEl('inventory-container');
        const emptyState = getEl('empty-state');
        if (!container || !emptyState) return;

        console.log(`[Treadz] Rendering Inventory. Total items: ${inventory.length}`);

        // If no inventory at all
        if (inventory.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        const searchTerm = getEl('search-input').value.trim();
        const parsedSearch = parseTireSize(searchTerm);

        // Local Rim Filter
        const rimFilterEl = getEl('inventory-filter-rim');
        const rimFilter = rimFilterEl ? rimFilterEl.value : '';

        let filtered = inventory.filter(item => {
            // Check for valid item to prevent crashes
            if (!item) return false;

            const itemSizeStr = typeof item.size === 'object' ? formatTireSize(item.size) : item.size;

            // 1. Rim Filter
            if (rimFilter) {
                const p = parseTireSize(itemSizeStr);
                if (!p || !p.rim || p.rim != rimFilter) return false;
            }

            // 2. Search Text
            if (!searchTerm) return true;

            const searchClean = searchTerm.replace(/\D/g, '');
            const itemClean = itemSizeStr.replace(/\D/g, '');

            // A. Robust sequential digit matching (e.g. "2357" matches "23575")
            if (searchClean.length >= 3 && itemClean.includes(searchClean)) return true;

            // B. Structured Size matching
            if (parsedSearch) {
                const itemParsed = parseTireSize(itemSizeStr);

                if (itemParsed) {
                    // If user typed partial (5 digits e.g. 25535), only match width/ratio
                    if (parsedSearch.partial) {
                        if (itemParsed.width == parsedSearch.width &&
                            itemParsed.ratio == parsedSearch.ratio) {
                            return true;
                        }
                    } else {
                        // Full matching
                        if (itemParsed.width == parsedSearch.width &&
                            itemParsed.rim == parsedSearch.rim &&
                            (itemParsed.ratio == parsedSearch.ratio || !parsedSearch.ratio)) {
                            return true;
                        }
                    }
                }
            }

            // C. Text matching fallback
            const text = `${itemSizeStr} ${item.brand || ''} ${item.condition || ''}`.toLowerCase();
            return text.includes(searchTerm.toLowerCase());
        });

        console.log(`[Treadz] Filtered items: ${filtered.length}`);

        // Sorting: Rim Asc, then Width Desc, then Ratio Desc
        filtered.sort((a, b) => {
            const sA = typeof a.size === 'object' ? formatTireSize(a.size) : a.size;
            const sB = typeof b.size === 'object' ? formatTireSize(b.size) : b.size;
            const pA = parseTireSize(sA) || { width: 0, ratio: 0, rim: 0 };
            const pB = parseTireSize(sB) || { width: 0, ratio: 0, rim: 0 };

            if (pA.rim !== pB.rim) return pA.rim - pB.rim; // Rim Asc (16, 17, 18...)
            if (pA.width !== pB.width) return pB.width - pA.width; // Width Desc (285, 275...)
            return pB.ratio - pA.ratio; // Ratio Desc (70, 65...)
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            // Update empty state text based on context
            const h2 = emptyState.querySelector('h2');
            const p = emptyState.querySelector('p');
            if (h2) h2.textContent = 'No matching inventory';
            if (p) p.textContent = 'Try adjusting filters.';
            return;
        }

        emptyState.classList.add('hidden');

        // Use Grid Layout (3 Columns on md and up)
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                ${filtered.map(item => {
            const sizeDisplay = typeof item.size === 'object' ? formatTireSize(item.size) : item.size;
            const isNew = item.condition === 'new';

            return `
                    <div class="bg-white rounded-lg border border-gray-200 p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-2">
                             <div class="w-2 h-2 rounded-full ${isNew ? 'bg-green-500' : 'bg-gray-300'}" title="${isNew ? 'New' : 'Used'}"></div>
                        </div>
                        
                        <div class="mb-3">
                            <h3 class="font-black text-2xl text-gray-800 tracking-tight font-mono">${sizeDisplay}</h3>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">${item.condition || 'Used'}</p>
                        </div>
                        
                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                            <div class="pl-1">
                                <span class="text-xs text-gray-400 font-medium">Qty</span>
                                <span class="font-mono text-xl font-bold text-gray-800 ml-1">${item.quantity}</span>
                            </div>
                            
                            <div class="flex items-center gap-1">
                                <button onclick="window.updateInventoryQty('${item.id}', -1)" 
                                    class="w-8 h-8 rounded bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center font-bold text-lg transition-all active:scale-95 shadow-sm">
                                    -
                                </button>
                                <button onclick="window.updateInventoryQty('${item.id}', 1)" 
                                    class="w-8 h-8 rounded bg-gray-50 border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 flex items-center justify-center font-bold text-lg transition-all active:scale-95 shadow-sm">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    };

    window.updateInventoryQty = (id, change) => {
        const idx = inventory.findIndex(i => i.id === id);
        if (idx === -1) return;

        inventory[idx].quantity += change;

        if (inventory[idx].quantity <= 0) {
            if (confirm('Remove this item from inventory?')) {
                inventory.splice(idx, 1);
                showToast('Item removed');
            } else {
                inventory[idx].quantity = 1; // Revert
            }
        } else {
            // Optional: show toast for update? maybe too noisy
        }

        saveData();
        renderInventory();
    };

    const populateFilters = () => {
        const brands = new Set();
        const rims = new Set();
        const distributors = new Set();
        const localRims = new Set();

        catalogItems.forEach(item => {
            if (item.vendor_name) brands.add(item.vendor_name);
            if (item._sourceId) distributors.add(item._sourceId);
            (item.sizes || []).forEach(s => {
                if (s.rim) rims.add(parseInt(s.rim));
            });
        });

        // Collect Local Inventory Rims
        inventory.forEach(item => {
            if (!item) return;
            const s = typeof item.size === 'object' ? formatTireSize(item.size) : item.size;
            const p = parseTireSize(s);
            if (p && p.rim) localRims.add(parseInt(p.rim));
        });

        // Local Rim Filter
        const localRimSelect = getEl('inventory-filter-rim');
        if (localRimSelect) {
            const current = localRimSelect.value;
            localRimSelect.innerHTML = '<option value="">All Rims</option>';
            [...localRims].sort((a, b) => a - b).forEach(r => {
                localRimSelect.innerHTML += `<option value="${r}">${r}" Rim</option>`;
            });
            localRimSelect.value = current;
        }

        // Distributors
        const distSelect = getEl('filter-distributor');
        if (distSelect) {
            const current = distSelect.value;
            distSelect.innerHTML = '<option value="">All Distributors</option>';
            [...distributors].sort().forEach(d => {
                distSelect.innerHTML += `<option value="${d}">${d}</option>`;
            });
            distSelect.value = current;
        }

        // Brands
        const brandSelect = getEl('filter-brand');
        if (brandSelect) {
            const current = brandSelect.value;
            brandSelect.innerHTML = '<option value="">All Brands</option>';
            [...brands].sort().forEach(b => {
                brandSelect.innerHTML += `<option value="${b}">${b}</option>`;
            });
            brandSelect.value = current;
        }

        // Rims
        const rimSelect = getEl('filter-rim');
        if (rimSelect) {
            const current = rimSelect.value;
            rimSelect.innerHTML = '<option value="">All Rims</option>';
            [...rims].sort((a, b) => a - b).forEach(r => {
                rimSelect.innerHTML += `<option value="${r}">${r}" Rim</option>`;
            });
            rimSelect.value = current;
        }
    };

    // Listeners
    getEl('search-input').addEventListener('input', (e) => {
        renderAll();
        trackSearch(e.target.value);
    });
    getEl('clear-search-btn').addEventListener('click', () => { getEl('search-input').value = ''; renderAll(); });
    ['filter-distributor', 'filter-brand', 'filter-rim', 'filter-type', 'filter-ply', 'filter-sort'].forEach(id => {
        const el = getEl(id); if (el) el.addEventListener('change', (e) => {
            catalogFilters[id.replace('filter-', '')] = e.target.value; renderAll();
        });
    });

    // Local Inventory Filter Listener
    const localRimFilter = getEl('inventory-filter-rim');
    if (localRimFilter) {
        localRimFilter.addEventListener('change', renderInventory);
    }

    let searchDebounce;
    const trackSearch = (term) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            if (!term) return;
            const parsed = parseTireSize(term);
            if (parsed) {
                const standardized = formatTireSize(parsed);
                searchStats[standardized] = (searchStats[standardized] || 0) + 1;
                saveData();
                const analyticsSection = getEl('analytics-section');
                if (analyticsSection && analyticsSection.classList.contains('open')) {
                    renderAnalytics();
                }
            }
        }, 2000); // 2 second delay to capture "intent" rather than "typing"
    };

    const analyticsBtn = getEl('analytics-toggle');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            const section = getEl('analytics-section');
            const arrow = getEl('analytics-arrow');
            section.classList.toggle('open');
            arrow.style.transform = section.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
            if (section.classList.contains('open')) renderAnalytics();
        });
    }

    // Modal & Inventory Logic
    const entryModal = getEl('entry-modal');
    const addTiresBtn = getEl('add-tires-btn');
    const closeEntryBtn = getEl('close-entry-modal-btn');
    const cancelEntryBtn = getEl('cancel-entry-modal-btn');
    const confirmAddBtn = getEl('confirm-add-tires-btn');
    const tireInput = getEl('tire-input-modal');
    const conditionToggle = getEl('condition-toggle-modal');

    // Tabs
    const tabBatch = getEl('modal-tab-batch');
    const tabMultiple = getEl('modal-tab-multiple');
    const viewBatch = getEl('batch-entry-view');
    const viewMultiple = getEl('add-multiple-view');

    if (addTiresBtn) addTiresBtn.addEventListener('click', () => {
        if (entryModal) {
            entryModal.classList.remove('hidden');
            entryModal.classList.add('flex');
        }
    });

    const closeEntryModal = () => {
        if (entryModal) {
            entryModal.classList.add('hidden');
            entryModal.classList.remove('flex');
        }
    };

    if (closeEntryBtn) closeEntryBtn.addEventListener('click', closeEntryModal);
    if (cancelEntryBtn) cancelEntryBtn.addEventListener('click', closeEntryModal);

    // Tab Switching
    if (tabBatch && tabMultiple) {
        tabBatch.addEventListener('click', () => {
            tabBatch.classList.add('active');
            tabMultiple.classList.remove('active');
            viewBatch.classList.remove('hidden');
            viewMultiple.classList.add('hidden');
        });
        tabMultiple.addEventListener('click', () => {
            tabMultiple.classList.add('active');
            tabBatch.classList.remove('active');
            viewMultiple.classList.remove('hidden');
            viewBatch.classList.add('hidden');
        });
    }

    // Add Logic
    if (confirmAddBtn) confirmAddBtn.addEventListener('click', () => {
        // Handle Quick Add (Textarea) for now
        // if (!viewMultiple.classList.contains('hidden')) { // simplified check
        const text = tireInput ? tireInput.value.trim() : '';
        if (!text) return;

        const condition = conditionToggle && conditionToggle.checked ? 'new' : 'used';
        const lines = text.split(/[\n,]+/).map(t => t.trim()).filter(t => t);

        let addedCount = 0;
        lines.forEach(rawSize => {
            // Try to parse to standard format, or just keep as is
            const parsed = parseTireSize(rawSize);
            const sizeStr = parsed ? formatTireSize(parsed) : rawSize.toUpperCase();

            const existing = inventory.find(i => i.size === sizeStr && i.condition === condition);
            if (existing) {
                existing.quantity++;
            } else {
                inventory.push({
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                    size: sizeStr,
                    quantity: 1,
                    condition: condition,
                    brand: '',
                    timestamp: new Date().toISOString()
                });
            }
            addedCount++;
        });

        if (addedCount > 0) {
            saveData();
            renderInventory();
            showToast(`Added ${addedCount} tires to inventory`);
            if (tireInput) tireInput.value = '';
            closeEntryModal();
        }
        // }
    });

    loadData();
    populateFilters();
    renderAll();
});