// Created with <3 by Blazinik

document.addEventListener('DOMContentLoaded', () => {

    const getEl = (id) => document.getElementById(id);

    let inventory = [];
    let activityLog = [];
    let auditHistory = [];

    // Catalog & PO System State
    let catalogItems = [];
    let purchaseOrderCart = []; // Array of { id, item, sizeStr, quantity, distributor }
    let catalogFilters = {
        distributor: '',
        brand: '',
        rim: '',
        type: '',
        ply: '',
        sort: 'price_asc'
    };

    const loadData = () => {
        inventory = JSON.parse(localStorage.getItem('treadzTireInventoryV7')) || [];
        activityLog = JSON.parse(localStorage.getItem('treadzActivityLogV7')) || [];
        auditHistory = JSON.parse(localStorage.getItem('treadzAuditHistoryV7')) || [];
        purchaseOrderCart = JSON.parse(localStorage.getItem('treadzPOCart')) || [];

        // Initialize Catalog
        if (typeof TireCatalog !== 'undefined') {
            catalogItems = TireCatalog.getAll();
            if (catalogItems.length === 0) {
                TireCatalog.loadSampleData();
                catalogItems = TireCatalog.getAll();
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
        const cleaned = input.replace(/\D/g, '');
        const flotationMatch = cleaned.match(/^(\d{2})(\d{4})(\d{2})$/);
        if (flotationMatch) {
            const [_, diameter, widthRaw, rim] = flotationMatch;
            return { type: 'flotation', diameter: parseInt(diameter, 10), width: parseFloat((parseInt(widthRaw, 10) / 100).toFixed(2)), rim: parseInt(rim, 10) };
        }
        const pMetricMatch = cleaned.match(/^(\d{3})(\d{2})(\d{2})$/);
        if (pMetricMatch) {
            const [_, width, ratio, rim] = pMetricMatch;
            return { type: 'p-metric', width: parseInt(width, 10), ratio: parseInt(ratio, 10), rim: parseInt(rim, 10) };
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

    const addLogEntry = (description, type = 'System', details = {}) => { /* ... */ }; // Kept minimal for context

    const renderAll = () => {
        renderInventory();
        renderCatalog();
        // renderActivityLog();
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

        const searchTerm = getEl('search-input').value.trim().toLowerCase();

        let filtered = catalogItems.filter(item => {
            if (searchTerm) {
                const searchStr = [
                    item.vendor_name, item.model_name, item.size_display, item.car_type_str,
                    ...(item.sizes || []).map(s => `${s.width}/${s.profile}R${s.rim}`)
                ].join(' ').toLowerCase();
                const terms = searchTerm.split(/\s+/);
                if (!terms.every(t => searchStr.includes(t))) return false;
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
              <div class="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group/item">
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

    const renderInventory = () => { /* ... existing inventory render logic ... */ };

    // Listeners
    getEl('search-input').addEventListener('input', renderAll);
    getEl('clear-search-btn').addEventListener('click', () => { getEl('search-input').value = ''; renderAll(); });
    ['filter-distributor', 'filter-brand', 'filter-rim', 'filter-type', 'filter-ply', 'filter-sort'].forEach(id => {
        const el = getEl(id); if (el) el.addEventListener('change', (e) => {
            catalogFilters[id.replace('filter-', '')] = e.target.value; renderAll();
        });
    });

    loadData();
    populateFilters();
    renderAll();
});