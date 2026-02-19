// Created with <3 by Blazinik

document.addEventListener('DOMContentLoaded', () => {

    const getEl = (id) => document.getElementById(id);

    let inventory = [];
    let activityLog = [];
    let auditHistory = [];

    // Catalog State
    let catalogItems = [];
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

        // Initialize Catalog
        if (typeof TireCatalog !== 'undefined') {
            catalogItems = TireCatalog.getAll();
            if (catalogItems.length === 0) {
                TireCatalog.loadSampleData();
                catalogItems = TireCatalog.getAll();
            }
            // Augment with mock prices for sorting if missing
            catalogItems.forEach(item => {
                if (!item._price) {
                    // Mock price based on Rim size and randomness
                    const base = 50;
                    const rimFactor = (parseInt(item.sizes?.[0]?.rim) || 15) * 5;
                    item._price = base + rimFactor + (Math.random() * 50);
                }
            });
        }
    };

    const saveData = () => {
        localStorage.setItem('treadzTireInventoryV7', JSON.stringify(inventory));
        localStorage.setItem('treadzActivityLogV7', JSON.stringify(activityLog));
        localStorage.setItem('treadzAuditHistoryV7', JSON.stringify(auditHistory));
    };


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
        toast.innerHTML = `<p class="font-medium">${message}</p>`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const addLogEntry = (description, type = 'System', details = {}) => {
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: new Date().toISOString(),
            description, type, details
        };
        activityLog.unshift(entry);
        if (activityLog.length > 50) activityLog.pop();
        saveData();
    };

    const addTire = (parsedSize, quantity = 1, condition = 'used', options = {}) => {
        const { fromSearch = false, suppressToast = false } = options;
        if (!parsedSize) return;
        const sizeString = JSON.stringify(parsedSize);
        const existingTire = inventory.find(t => JSON.stringify(t.size) === sizeString && t.condition === condition);

        if (existingTire) {
            existingTire.quantity += parseInt(quantity);
        } else {
            inventory.unshift({ size: parsedSize, quantity: parseInt(quantity), condition: condition });
        }

        if (!suppressToast) {
            showToast(`Added ${quantity}x ${formatTireSize(parsedSize)} (${condition.toUpperCase()}).`);
        }
        if (fromSearch) getEl('search-input').value = '';

        addLogEntry(`${formatTireSize(parsedSize)} (${condition})`, 'Added', { quantityAdded: quantity });
        saveData();
        renderAll();
    };

    const updateTireQuantity = (parsedSize, condition, newQuantity) => {
        const sizeString = JSON.stringify(parsedSize);
        const tire = inventory.find(t => JSON.stringify(t.size) === sizeString && t.condition === condition);
        if (tire) {
            const oldQuantity = tire.quantity;
            if (oldQuantity !== newQuantity) {
                const change = newQuantity - oldQuantity;
                tire.quantity = newQuantity;

                if (change > 0) {
                    addLogEntry(`${formatTireSize(parsedSize)} (${condition})`, 'Added', { quantityAdded: change });
                    showToast(`Added ${change}x ${formatTireSize(parsedSize)}.`);
                } else {
                    addLogEntry(`${formatTireSize(parsedSize)} (${condition})`, 'Sold', { quantitySold: -change });
                    showToast(`Sold ${-change}x ${formatTireSize(parsedSize)}.`);
                }
                saveData();
                renderAll();
            }
        }
    };

    const renderAll = () => {
        renderInventory();
        renderCatalog();
        renderSearchActions();
        renderActivityLog();

        const searchVal = getEl('search-input').value;
        const clearBtn = getEl('clear-search-btn');
        if (clearBtn) clearBtn.style.display = searchVal ? 'block' : 'none';

        if (searchVal.trim() !== '') {
            renderSearchResults();
        } else {
            getEl('search-results-container').innerHTML = '';
        }
    };

    const populateFilters = () => {
        if (!catalogItems.length) return;

        // Populate Brands
        const brandSelect = getEl('filter-brand');
        const brands = new Set(catalogItems.map(i => i.vendor_name).filter(Boolean));
        [...brands].sort().forEach(b => {
            if (![...brandSelect.options].some(o => o.value === b)) {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                brandSelect.appendChild(opt);
            }
        });

        // Populate Rims
        const rimSelect = getEl('filter-rim');
        const rims = new Set();
        catalogItems.forEach(i => {
            (i.sizes || []).forEach(s => { if (s.rim) rims.add(parseInt(s.rim)); });
        });
        [...rims].sort((a, b) => a - b).forEach(r => {
            if (![...rimSelect.options].some(o => o.value == r)) {
                const opt = document.createElement('option');
                opt.value = r;
                opt.textContent = `${r}"`;
                rimSelect.appendChild(opt);
            }
        });

        // Populate Distributor
        const distSelect = getEl('filter-distributor');
        if (typeof TireCatalog !== 'undefined' && TireCatalog.getSources) {
            const sources = TireCatalog.getSources();
            sources.forEach(s => {
                if (![...distSelect.options].some(o => o.value === s.id)) {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.name;
                    distSelect.appendChild(opt);
                }
            });
        }
    };

    const renderInventory = () => {
        const container = getEl('inventory-container');
        container.innerHTML = '';
        const emptyState = getEl('empty-state');

        const searchTerm = getEl('search-input').value.trim().toLowerCase();
        const rimFilter = getEl('filter-rim').value;

        let filtered = inventory.filter(t => {
            let match = true;
            if (searchTerm) {
                const searchStr = `${t.size.width}/${t.size.ratio}R${t.size.rim} ${t.condition}`.toLowerCase();
                if (!searchStr.includes(searchTerm.replace(/[\/\s-]/g, ''))) match = false;
            }
            if (match && rimFilter && t.size.rim != rimFilter) match = false;
            return match;
        });

        if (inventory.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (filtered.length === 0 && searchTerm) {
            container.innerHTML = `<div class="p-4 text-center text-gray-500 italic">No inventory matches for "${searchTerm}"</div>`;
            if (emptyState) emptyState.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        const sorted = [...filtered].sort((a, b) => {
            if (a.size.rim !== b.size.rim) return a.size.rim - b.size.rim;
            return (a.size.width || a.size.diameter) - (b.size.width || b.size.diameter);
        });

        const newTires = sorted.filter(t => t.condition === 'new');
        const usedTires = sorted.filter(t => t.condition === 'used');

        if (newTires.length > 0) container.appendChild(createInventorySection('New Tire Inventory', newTires));
        if (usedTires.length > 0) container.appendChild(createInventorySection('Used Tire Inventory', usedTires));
    };

    const createInventorySection = (title, tires) => {
        const section = document.createElement('section');
        section.className = 'mb-8';
        const total = tires.reduce((acc, t) => acc + t.quantity, 0);
        const titleId = title.toLowerCase().includes('new') ? 'new-tires-title' : 'used-tires-title';
        section.innerHTML = `<h2 id="${titleId}" class="text-xl font-semibold mb-4 border-b pb-2 flex justify-between">
            <span>${title}</span>
            <span class="text-gray-500 text-sm font-normal self-center">${total} tires</span>
        </h2>`;
        const grid = document.createElement('div');
        grid.className = 'inventory-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        tires.forEach(tire => grid.appendChild(createTireCardElement(tire)));
        section.appendChild(grid);
        return section;
    };

    const createTireCardElement = (tire, matchClass = '') => {
        const cardId = `card-${formatTireSize(tire.size).replace(/[\/\sR.]/g, '')}-${tire.condition}`;
        const card = document.createElement('div');
        card.id = cardId;
        card.className = `tire-card bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center ${matchClass}`;

        const sizeStr = formatTireSize(tire.size);

        card.innerHTML = `
            <div class="pr-4">
                <p class="font-mono text-lg font-bold text-gray-800">
                    ${sizeStr}
                    <span class="ml-2 text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded ${tire.condition === 'new' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}">${tire.condition}</span>
                </p>
                <p class="text-sm text-gray-500 stock-quantity-wrapper mt-1">
                    Stock: 
                    <span class="stock-quantity-display font-semibold text-gray-900">${tire.quantity}</span>
                </p>
            </div>
            <div class="flex items-center gap-2">
                <button class="btn btn-secondary h-8 w-8 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-200" onclick="window.handleQtyClick('${sizeStr}', '${tire.condition}', -1)">-</button>
                <button class="btn btn-secondary h-8 w-8 rounded-full flex items-center justify-center font-bold text-lg hover:bg-gray-200" onclick="window.handleQtyClick('${sizeStr}', '${tire.condition}', 1)">+</button>
            </div>`;
        return card;
    };

    window.handleQtyClick = (sizeStr, condition, change) => {
        const tire = inventory.find(t => formatTireSize(t.size) === sizeStr && t.condition === condition);
        if (tire) {
            updateTireQuantity(tire.size, condition, tire.quantity + change);
        }
    };

    const renderSearchResults = () => {
        const term = getEl('search-input').value.trim();
        const searchSize = parseTireSize(term);
        const container = getEl('search-results-container');
        container.innerHTML = '';

        if (!term) return;

        let matches = [];
        if (searchSize) {
            matches = inventory.filter(t => JSON.stringify(t.size) === JSON.stringify(searchSize));
        } else if (term.length > 2) {
            const cleanedTerm = term.replace(/[\s/rR.-]/g, '');
            matches = inventory.filter(t => formatTireSize(t.size).replace(/[\s/rR.-]/g, '').startsWith(cleanedTerm));
        }

        if (matches.length === 0) return;

        let html = '<h2 class="text-xl font-semibold text-gray-800 mb-4 px-1" style="color: var(--primary-color);">In Stock Results</h2>';
        html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        matches.forEach(t => { html += createTireCardElement(t, 'border-blue-500 ring-1 ring-blue-500').outerHTML; });
        html += '</div>';
        container.innerHTML = html;
    };

    const renderCatalog = () => {
        const grid = getEl('catalog-grid');
        const empty = getEl('catalog-empty');
        const noData = getEl('catalog-no-data');
        const badge = getEl('catalog-count-badge');

        if (catalogItems.length === 0) {
            grid.innerHTML = '';
            noData.classList.remove('hidden');
            badge.textContent = '0';
            return;
        }
        noData.classList.add('hidden');

        const searchTerm = getEl('search-input').value.trim().toLowerCase();

        let filtered = catalogItems.filter(item => {
            if (searchTerm) {
                const searchStr = [
                    item.vendor_name,
                    item.model_name,
                    item.size_display,
                    item.car_type_str,
                    ...(item.sizes || []).map(s => `${s.width}/${s.profile}R${s.rim}`)
                ].join(' ').toLowerCase();
                const terms = searchTerm.split(/\s+/);
                if (!terms.every(t => searchStr.includes(t))) return false;
            }
            if (catalogFilters.distributor && item._sourceId !== catalogFilters.distributor) return false;
            if (catalogFilters.brand && item.vendor_name !== catalogFilters.brand) return false;
            if (catalogFilters.type && item.car_type_str !== catalogFilters.type) return false;
            if (catalogFilters.rim) {
                if (!(item.sizes || []).some(s => s.rim == catalogFilters.rim)) return false;
            }
            if (catalogFilters.ply) {
                const hasPly = (item.sizes || []).some(s => {
                    if (catalogFilters.ply === 'xl') return s.xl_flag === 'on' || s.xl === 'on';
                    const li = parseInt(s.load_index);
                    if (catalogFilters.ply === '10') return li >= 115 && li <= 123;
                    if (catalogFilters.ply === '12') return li > 123;
                    return false;
                });
                if (!hasPly) return false;
            }
            return true;
        });

        badge.textContent = filtered.length;

        if (filtered.length === 0) {
            grid.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        filtered.sort((a, b) => {
            if (catalogFilters.sort === 'brand') return (a.vendor_name || '').localeCompare(b.vendor_name || '');
            if (catalogFilters.sort === 'price_desc') return (b._price || 0) - (a._price || 0);
            return (a._price || 0) - (b._price || 0);
        });

        const displayItems = filtered.slice(0, 24);

        grid.innerHTML = displayItems.map(item => {
            const price = item._price ? `$${item._price.toFixed(2)}` : 'Call';

            // Escape JSON properly for onclick attribute
            const itemJson = JSON.stringify(item).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

            return `
             <div class="catalog-card bg-white rounded-xl border border-gray-200 p-4 flex flex-col justify-between h-full relative">
                  <div class="absolute top-3 right-3 text-xs font-bold text-gray-400 uppercase tracking-widest">${item._sourceId || 'Local'}</div>
                  <div class="mb-4">
                       <h3 class="font-bold text-lg text-gray-900 leading-tight">${item.vendor_name}</h3>
                       <p class="text-blue-600 font-medium">${item.model_name}</p>
                       <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">${item.car_type_str || 'Tire'}</span>
                            <span class="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">${item.season || 'All Season'}</span>
                       </div>
                  </div>
                  <div>
                      <div class="flex justify-between items-end mb-3">
                          <div class="text-2xl font-bold text-gray-900">${price}</div>
                          <div class="text-sm text-gray-500 mb-1">${(item.sizes || []).length} Sizes</div>
                      </div>
                      <button onclick='window.openSizeSelector(${itemJson})' 
                          class="w-full btn btn-secondary hover:bg-blue-600 hover:text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                          Add to Inventory
                      </button>
                  </div>
             </div>
             `;
        }).join('');
    };

    window.openSizeSelector = (item) => {
        const modalId = 'size-modal';
        let modal = getEl(modalId);
        if (modal) modal.remove();

        const sizesHtml = (item.sizes || []).map(s => {
            const str = `${s.width}/${s.profile}R${s.rim}`;
            const specs = [s.load_index, s.speed_rating].filter(Boolean).join('');
            const ext = [s.xl_flag === 'on' ? 'XL' : '', s.runflat_flag === 'on' ? 'RFT' : ''].filter(Boolean).join(' ');

            return `
              <div class="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <div>
                      <span class="font-mono font-bold text-lg text-gray-800">${str}</span>
                      <span class="text-gray-500 text-sm ml-2">${specs} ${ext}</span>
                  </div>
                  <div class="flex items-center gap-3">
                       <button onclick="window.addToInvFromCatalog('${str}', 'used')" class="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full uppercase">Add Used</button>
                       <button onclick="window.addToInvFromCatalog('${str}', 'new')" class="text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-full uppercase">Add New</button>
                  </div>
              </div>
              `;
        }).join('');

        const html = `
         <div id="${modalId}" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                   <div class="p-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                             <h3 class="text-2xl font-bold text-gray-900">${item.vendor_name} ${item.model_name}</h3>
                             <p class="text-gray-500">Select a size to add to inventory</p>
                        </div>
                        <button onclick="document.getElementById('${modalId}').remove()" class="text-gray-400 hover:text-gray-600">
                             <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                   </div>
                   <div class="overflow-y-auto p-4">
                        ${sizesHtml}
                   </div>
                   <div class="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-center text-sm text-gray-400">
                        Total ${item.sizes.length} sizes available
                   </div>
              </div>
         </div>
         `;

        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    };

    window.addToInvFromCatalog = (sizeStr, condition) => {
        const m = getEl('size-modal');
        if (m) m.remove();
        const parsed = parseTireSize(sizeStr);
        if (parsed) {
            addTire(parsed, 1, condition, { suppressToast: false });
        } else {
            showToast("Error parsing size");
        }
    };

    const renderSearchActions = () => {
        const term = getEl('search-input').value.trim();
        const parsed = parseTireSize(term);
        getEl('search-actions').innerHTML = '';
        if (parsed) {
            const formatted = formatTireSize(parsed);
            getEl('search-actions').innerHTML = `
                <div class="flex items-center justify-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <span class="font-medium text-blue-800">Quick Add:</span>
                    <button id="add-single-btn-used" class="btn bg-white border border-gray-200 shadow-sm text-amber-600 hover:bg-amber-50 font-bold py-2 px-4 rounded-lg">Add USED ${formatted}</button>
                    <button id="add-single-btn-new" class="btn bg-white border border-gray-200 shadow-sm text-green-600 hover:bg-green-50 font-bold py-2 px-4 rounded-lg">Add NEW ${formatted}</button>
                </div>`;
            getEl('add-single-btn-used').onclick = () => addTire(parsed, 1, 'used', { fromSearch: true });
            getEl('add-single-btn-new').onclick = () => addTire(parsed, 1, 'new', { fromSearch: true });
        }
    };

    const renderActivityLog = () => {
        const logContainer = getEl('activity-log');
        if (!logContainer) return;
        logContainer.innerHTML = '';
        activityLog.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'text-sm p-3 border-l-2 bg-gray-50 rounded-r border-gray-300';
            const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let badgeClass = 'bg-gray-200 text-gray-700';
            if (entry.description.toLowerCase().includes('added')) badgeClass = 'bg-green-100 text-green-800';
            if (entry.description.toLowerCase().includes('sold')) badgeClass = 'bg-red-100 text-red-800';

            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <span class="font-medium ${badgeClass} px-1.5 py-0.5 rounded text-xs">${entry.type || 'Log'}</span>
                    <span class="text-gray-400 text-xs">${time}</span>
                </div>
                <div class="mt-1 text-gray-700">${entry.description}</div>
            `;
            logContainer.appendChild(div);
        });
    };

    // Listeners
    getEl('search-input').addEventListener('input', () => {
        renderAll();
    });

    getEl('clear-search-btn').addEventListener('click', () => {
        getEl('search-input').value = '';
        renderAll();
    });

    ['filter-distributor', 'filter-brand', 'filter-rim', 'filter-type', 'filter-ply', 'filter-sort'].forEach(id => {
        const el = getEl(id);
        if (el) {
            el.addEventListener('change', (e) => {
                const key = id.replace('filter-', '');
                catalogFilters[key] = e.target.value;
                renderAll();
            });
        }
    });

    const logToggle = getEl('activity-log-toggle');
    if (logToggle) {
        logToggle.onclick = () => {
            const sec = getEl('activity-log-section');
            const arrow = getEl('activity-log-arrow');
            if (sec.style.display === 'none' || !sec.style.display) {
                sec.style.display = 'block';
                arrow.style.transform = 'rotate(180deg)';
            } else {
                sec.style.display = 'none';
                arrow.style.transform = 'rotate(0deg)';
            }
        };
        getEl('activity-log-section').style.display = 'none';
    }

    if (getEl('add-tires-btn')) {
        getEl('add-tires-btn').addEventListener('click', () => {
            getEl('search-input').focus();
            showToast('Type a size to add (e.g. 225/60/16)');
        });
    }

    loadData();
    populateFilters();
    renderAll();

    if (inventory.length === 0) {
        showToast("Welcome! Try searching or adding mock inventory.");
    }
});