document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);

    let inventory = [];
    let activityLog = [];
    let auditHistory = [];
    let processedAuditData = null;
    let currentEntryMode = 'batch';
    let analyticsChart = null;

    const distributors = [
        { name: 'ATD', urlTemplate: 'https://atdonline.com/es-search/refine?text={QUERY}', queryFormat: 'p-metric-no-slash' },
        { name: 'BENTIRE', urlTemplate: 'https://bentire.tireweb.com/Search/{QUERY}', queryFormat: 'p-metric-no-slash' },
        { name: 'ATLANTIC', urlTemplate: 'https://ecommerce.atlantic-tire.com/Search/ByTireSize/{QUERY}?snowTiresOnly=False', queryFormat: 'p-metric-no-slash' },
        { name: 'S&S', urlTemplate: 'https://ss2.treadsearch.com/products/tires/#{QUERY}', queryFormat: 'p-metric-no-slash' },
        { name: 'TIREHUB', urlTemplate: 'https://now.tirehub.com/tiresearch/result/?q={QUERY}', queryFormat: 'p-metric-no-slash' },
        { name: 'Justice Tire', urlTemplate: 'https://www.justicetire.com/?token=u4fl716t4i', queryFormat: 'none' },
        { name: 'NTW', urlTemplate: 'https://order.ntw.com/ntwtips/distribution/search/', queryFormat: 'none' }
    ];

    // --- DATA MANAGEMENT ---
    const loadData = () => {
        inventory = JSON.parse(localStorage.getItem('treadzTireInventoryV7')) || [];
        activityLog = JSON.parse(localStorage.getItem('treadzActivityLogV7')) || [];
        auditHistory = JSON.parse(localStorage.getItem('treadzAuditHistoryV7')) || [];
    };
    const saveData = () => {
        localStorage.setItem('treadzTireInventoryV7', JSON.stringify(inventory));
        localStorage.setItem('treadzActivityLogV7', JSON.stringify(activityLog));
        localStorage.setItem('treadzAuditHistoryV7', JSON.stringify(auditHistory));
    };

    // --- UTILITIES ---
    const parseTireSize = (input) => {
        if (!input) return null;
        const cleaned = input.replace(/[\s/rR.\-]/g, '');
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
    const formatQueryForDistributor = (rawInput, size, format) => {
        if (format === 'none') return '';
        if (format === 'p-metric-no-slash') {
            if (size && size.type === 'p-metric') return `${size.width}${size.ratio}${size.rim}`;
            return rawInput.replace(/[\s/rR.-]/g, '');
        }
        return rawInput;
    };
    const showToast = (message) => {
        const toast = getEl('toast');
        toast.innerHTML = `<p class="font-medium">${message}</p>`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // --- CORE LOGIC ---
    const addTire = (parsedSize, quantity = 1, condition = 'used', options = {}) => {
        const { fromSearch = false, suppressToast = false } = options;
        if (!parsedSize) return;
        const sizeString = JSON.stringify(parsedSize);
        const existingTire = inventory.find(t => JSON.stringify(t.size) === sizeString && t.condition === condition);

        let isUpdate = false;

        if (existingTire) {
            existingTire.quantity += quantity;
            isUpdate = true;
        } else {
            inventory.unshift({ size: parsedSize, quantity: quantity, condition: condition });
        }

        if (!suppressToast) {
            showToast(`Added ${quantity}x ${formatTireSize(parsedSize)} (${condition.toUpperCase()}).`);
        }
        if (fromSearch) getEl('search-input').value = '';

        addLogEntry(`${formatTireSize(parsedSize)} (${condition})`, 'Added', { quantityAdded: quantity });
        saveData();

        if (isUpdate) {
            updateTireQuantityDOM(parsedSize, condition, existingTire.quantity);
        } else {
            renderAll();
        }
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
                updateTireQuantityDOM(parsedSize, condition, newQuantity);
            }
        }
    };

    const updateTireQuantityDOM = (parsedSize, condition, newQuantity) => {
        const cardId = `card-${formatTireSize(parsedSize).replace(/[\/\sR.]/g, '')}-${condition}`;
        const cardElement = document.getElementById(cardId);

        if (newQuantity <= 0) {
            inventory = inventory.filter(t => !(JSON.stringify(t.size) === JSON.stringify(parsedSize) && t.condition === condition));
            if (cardElement) {
                cardElement.remove();
            }
        } else {
            if (cardElement) {
                const display = cardElement.querySelector('.stock-quantity-display');
                const input = cardElement.querySelector('.quantity-edit-input');
                if (display) display.textContent = newQuantity;
                if (input) input.value = newQuantity;
            }
        }

        // Update section totals
        const newTotal = inventory.filter(t => t.condition === 'new').reduce((sum, t) => sum + t.quantity, 0);
        const usedTotal = inventory.filter(t => t.condition === 'used').reduce((sum, t) => sum + t.quantity, 0);
        const newTitle = document.getElementById('new-tires-title');
        const usedTitle = document.getElementById('used-tires-title');
        if (newTitle) newTitle.textContent = `New Tire Inventory (${newTotal})`;
        if (usedTitle) usedTitle.textContent = `Used Tire Inventory (${usedTotal})`;

        if (getEl('inventory-container').querySelectorAll('.tire-card').length === 0) {
            renderInventory(); // Fallback to full render if a filter makes it empty
        }
    }


    // --- MAIN RENDER ---
    const renderAll = () => {
        renderInventory();
        renderSearchResults();
        renderActivityLog();
        renderSearchActions();
        renderExternalSearches();
        renderAnalytics();
        populateMainRimFilter();
        getEl('clear-search-btn').style.display = getEl('search-input').value ? 'block' : 'none';
    };

    const renderInventory = () => {
        const container = getEl('inventory-container');
        container.innerHTML = '';
        const emptyState = getEl('empty-state');
        const rimFilterValue = getEl('rim-filter-select').value;

        let filteredInventory = inventory;
        if (rimFilterValue !== 'all') {
            filteredInventory = inventory.filter(t => t.size.rim == rimFilterValue);
        }

        if (filteredInventory.length === 0) {
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
            if (inventory.length > 0) { // Show message if filtering results in empty
                emptyState.querySelector('h2').textContent = `No tires found for Rim Size ${rimFilterValue}"`;
                emptyState.querySelector('p').textContent = 'Select "ALL" to see your full inventory.';
            } else {
                emptyState.querySelector('h2').textContent = 'Inventory is Empty';
                emptyState.querySelector('p').textContent = 'Add your first tire using the search bar above.';
            }
            return;
        }

        emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        const sorted = [...filteredInventory].sort((a, b) => {
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
        section.innerHTML = `<h2 id="${titleId}" class="text-xl font-semibold mb-4" style="color: var(--primary-color);">${title} (${total})</h2>`;

        const grid = document.createElement('div');
        grid.className = 'inventory-grid';
        tires.forEach(tire => grid.appendChild(createTireCardElement(tire)));

        section.appendChild(grid);
        return section;
    };

    const createTireCardElement = (tire, matchClass = '') => {
        const cardId = `card-${formatTireSize(tire.size).replace(/[\/\sR.]/g, '')}-${tire.condition}`;
        const card = document.createElement('div');
        card.id = cardId;
        card.className = `tire-card p-4 flex justify-between items-center ${matchClass}`;
        card.innerHTML = `
            <div class="pr-4">
                <p class="font-mono text-lg font-semibold">${formatTireSize(tire.size)}</p>
                <p class="text-xs text-gray-500 stock-quantity-wrapper" data-size='${JSON.stringify(tire.size)}' data-condition="${tire.condition}">
                    Stock: 
                    <span class="stock-quantity-display font-semibold">${tire.quantity}</span>
                    <input type="number" value="${tire.quantity}" class="quantity-edit-input hidden">
                </p>
            </div>
            <div class="card-actions flex flex-col space-y-2" data-size='${JSON.stringify(tire.size)}' data-condition="${tire.condition}">
                <button class="btn btn-secondary h-8 w-8 rounded-full font-bold text-lg adjust-qty-btn" data-amount="1">+</button>
                <button class="btn btn-secondary h-8 w-8 rounded-full font-bold text-lg adjust-qty-btn" data-amount="-1">-</button>
            </div>`;
        return card;
    };

    const renderSearchResults = () => {
        const term = getEl('search-input').value.trim();
        const searchSize = parseTireSize(term);
        getEl('search-results-container').innerHTML = '';

        let matches = [];
        if (searchSize) {
            matches = inventory.filter(t => JSON.stringify(t.size) === JSON.stringify(searchSize));
        } else if (term.length > 2) {
            const cleanedTerm = term.replace(/[\s/rR.-]/g, '');
            matches = inventory.filter(t => formatTireSize(t.size).replace(/[\s/rR.-]/g, '').startsWith(cleanedTerm));
        }

        if (matches.length === 0) return;

        let html = '<h2 class="text-xl font-semibold text-gray-800 mb-4" style="color: var(--primary-color);">Search Results</h2>';
        html += '<div class="space-y-3">';
        matches.forEach(t => { html += createTireCardElement(t, 'exact-match').outerHTML; });
        html += '</div>';
        getEl('search-results-container').innerHTML = html;
    };

    const renderSearchActions = () => {
        const term = getEl('search-input').value.trim();
        const parsed = parseTireSize(term);
        getEl('search-actions').innerHTML = '';
        if (parsed) {
            const formatted = formatTireSize(parsed);
            getEl('search-actions').innerHTML = `
                <div class="flex items-center justify-center gap-4">
                    <button id="add-single-btn" class="btn btn-primary flex-grow py-2.5 px-4 font-semibold">Add "${formatted}"</button>
                    <label class="toggle-label text-sm font-medium text-gray-700">
                        USED
                        <div class="toggle-switch">
                            <input type="checkbox" id="condition-toggle-single">
                            <span class="slider"></span>
                        </div>
                        NEW
                    </label>
                </div>`;
            getEl('add-single-btn').onclick = () => {
                const condition = getEl('condition-toggle-single').checked ? 'new' : 'used';
                addTire(parsed, 1, condition, { fromSearch: true });
            };
        }
    };

    const renderExternalSearches = () => {
        const term = getEl('search-input').value.trim();
        const parsed = parseTireSize(term);
        const container = getEl('external-search-container');
        container.innerHTML = '';
        if (term) {
            const linksHTML = distributors.map(dist => {
                const query = formatQueryForDistributor(term, parsed, dist.queryFormat);
                if (dist.queryFormat !== 'none' && !query) return '';
                const url = dist.urlTemplate.replace('{QUERY}', query);
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="distributor-btn" data-distributor="${dist.name}"><span>${dist.name}</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;
            }).join('');
            container.innerHTML = `<h3 class="text-sm font-semibold text-gray-500 mb-3 text-center">Check Distributors</h3><div class="flex flex-wrap gap-4 justify-center">${linksHTML}</div>`;
        }
    };

    const addLogEntry = (term, action, details = {}) => {
        if (action === 'Searched') {
            const lastLog = activityLog[0];
            if (lastLog && lastLog.term === term && lastLog.action === 'Searched') {
                const now = new Date();
                const lastLogTime = new Date(lastLog.timestamp);
                if ((now - lastLogTime) / (1000 * 60) < 5) return;
            }
            const parsedSize = parseTireSize(term);
            details.inStock = inventory.some(t => JSON.stringify(t.size) === JSON.stringify(parsedSize));
        }
        activityLog.unshift({ id: Date.now(), term, action, details, timestamp: new Date().toISOString() });
        saveData();
        renderActivityLog();
        renderAnalytics();
    };

    const renderActivityLog = () => {
        const container = getEl('activity-log');
        container.innerHTML = activityLog.length ? '' : '<p class="text-gray-500 text-center w-full">No activity yet.</p>';
        activityLog.slice(0, 50).forEach(log => {
            const logEl = document.createElement('div');
            logEl.className = 'log-item flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200';
            let detailsHTML = '';
            if (log.action === 'Sold') {
                detailsHTML = `<div class="font-semibold text-red-500">Sold ${log.details.quantitySold}</div>`;
            } else if (log.action === 'Added') {
                detailsHTML = `<div class="font-semibold text-green-600">Added ${log.details.quantityAdded}</div>`;
            } else if (log.action === 'Audit') {
                detailsHTML = `<div class="font-semibold text-blue-500">Audit Adj: ${log.details.adjustment}</div>`;
            } else if (log.action === 'Searched') {
                detailsHTML = log.details.inStock ? `<div class="font-semibold text-green-600">In Stock</div>` : `<div class="text-gray-500">Not In Stock</div>`;
            }
            logEl.innerHTML = `<div><p class="font-mono font-medium">${log.term}</p><p class="text-xs text-gray-400">${new Date(log.timestamp).toLocaleString()}</p></div><div>${detailsHTML}</div>`;
            container.appendChild(logEl);
        });
    };

    const renderAnalytics = () => {
        if (analyticsChart) analyticsChart.destroy();
        const mostSearchedList = getEl('most-searched-list');
        if (activityLog.length === 0) {
            mostSearchedList.innerHTML = '<p class="text-gray-500">Not enough data yet.</p>';
            return;
        }
        const counts = activityLog.reduce((acc, log) => {
            const term = log.term.split(' (')[0]; // Ignore condition for analytics
            if (log.action === 'Searched') acc[term] = (acc[term] || 0) + 1;
            return acc;
        }, {});
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (sorted.length === 0) {
            mostSearchedList.innerHTML = '<p class="text-gray-500">No search data to analyze.</p>';
            return;
        }
        mostSearchedList.innerHTML = sorted.map(([term, count]) => `<div class="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span class="font-mono font-medium text-gray-700">${term}</span><span class="text-sm text-gray-500">${count} times</span></div>`).join('');
        analyticsChart = new Chart(getEl('analytics-chart'), {
            type: 'pie',
            data: {
                labels: sorted.map(item => item[0]),
                datasets: [{ data: sorted.map(item => item[1]), backgroundColor: ['#0078D4', '#107C10', '#F7A923', '#7719AA', '#D83B01'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
        });
    };

    // --- ENTRY MODAL LOGIC ---
    const toggleEntryModal = (show) => {
        const modal = getEl('entry-modal');
        modal.classList.toggle('hidden', !show);
        modal.classList.toggle('flex', show);
        if (show) {
            switchEntryMode('batch');
            getEl('batch-grid').innerHTML = '';
            createBatchRow();
            getEl('tire-input-modal').value = '';
        }
    };
    const switchEntryMode = (mode) => {
        currentEntryMode = mode;
        getEl('modal-tab-batch').classList.toggle('active', mode === 'batch');
        getEl('modal-tab-multiple').classList.toggle('active', mode === 'multiple');
        getEl('batch-entry-view').classList.toggle('hidden', mode !== 'batch');
        getEl('add-multiple-view').classList.toggle('hidden', mode !== 'multiple');
    };
    const createBatchRow = () => {
        const row = document.createElement('div');
        row.className = 'batch-grid-row';
        row.innerHTML = `
            <input type="text" class="data-input batch-size" placeholder="e.g., 2254517">
            <input type="number" class="data-input batch-qty" value="1" min="1">
            <select class="data-input batch-condition">
                <option value="used" selected>Used</option>
                <option value="new">New</option>
            </select>
            <button class="text-gray-400 hover:text-red-500 remove-batch-row text-2xl font-bold">&times;</button>
        `;
        getEl('batch-grid').appendChild(row);
        row.querySelector('.batch-size').focus();
    };
    const processEntries = () => {
        let addedCount = 0, processedTires = 0;
        if (currentEntryMode === 'batch') {
            getEl('batch-grid').querySelectorAll('.batch-grid-row').forEach(row => {
                const parsed = parseTireSize(row.querySelector('.batch-size').value);
                const qty = parseInt(row.querySelector('.batch-qty').value, 10);
                if (parsed && qty > 0) {
                    addTire(parsed, qty, row.querySelector('.batch-condition').value, { suppressToast: true });
                    processedTires += qty; addedCount++;
                }
            });
        } else {
            const inputs = getEl('tire-input-modal').value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
            const condition = getEl('condition-toggle-modal').checked ? 'new' : 'used';
            inputs.forEach(input => {
                const parsed = parseTireSize(input);
                if (parsed) {
                    addTire(parsed, 1, condition, { suppressToast: true });
                    processedTires++; addedCount++;
                }
            });
        }
        if (addedCount > 0) showToast(`Successfully added ${processedTires} tire(s) across ${addedCount} size(s).`);
        toggleEntryModal(false);
    };

    // --- AUDIT & HISTORY LOGIC ---
    const toggleAuditModal = (show) => {
        const modal = getEl('audit-modal');
        modal.classList.toggle('hidden', !show);
        modal.classList.toggle('flex', show);
        if (show) {
            getEl('audit-input-step').classList.remove('hidden');
            getEl('audit-summary-step').classList.add('hidden');
            getEl('process-audit-btn').classList.remove('hidden');
            getEl('confirm-audit-btn').classList.add('hidden');
            getEl('audit-paste-area').value = '';
            processedAuditData = null;
            populateAuditRimFilter();
        }
    };
    const populateAuditRimFilter = () => {
        const rimSizes = [...new Set(inventory.map(t => t.size.rim))].sort((a, b) => a - b);
        const select = getEl('audit-rim-select');
        select.innerHTML = '<option value="all" selected>Rim Size: ALL</option>';
        rimSizes.forEach(rim => {
            select.innerHTML += `<option value="${rim}">Rim Size: ${rim}"</option>`;
        });
    };
    const populateMainRimFilter = () => {
        const rimSizes = [...new Set(inventory.map(t => t.size.rim))].sort((a, b) => a - b);
        const select = getEl('rim-filter-select');
        const currentValue = select.value;
        select.innerHTML = '<option value="all" selected>Filter by Rim Size: ALL</option>';
        rimSizes.forEach(rim => {
            select.innerHTML += `<option value="${rim}" ${currentValue == rim ? 'selected' : ''}>Rim Size: ${rim}"</option>`;
        });
    }
    const generateDiscrepancyReportHTML = (summary) => {
        let html = '';
        const createRow = (d, type) => {
            if (type === 'new') {
                return `<div class="new-item-row" data-size-str="${d.sizeStr}"><span class="font-mono font-semibold">${d.sizeStr}</span><span class="text-center font-bold text-green-600">+${d.physicalQty}</span><span class="text-right"><button class="btn btn-secondary btn-sm quick-add-btn text-xs py-1 px-2" data-size-str="${d.sizeStr}">+ Add to System</button></span></div>`;
            }
            return `<div class="audit-summary-row ${d.variance > 0 ? 'surplus' : 'shortage'}" data-size-str="${d.sizeStr}"><span class="font-mono font-semibold">${d.sizeStr}</span><span class="text-center text-gray-500">${d.inventoryQty}</span><span class="text-center font-bold"><input type="number" value="${d.physicalQty}" class="audit-edit-qty" data-size-str="${d.sizeStr}" min="0"></span><span class="text-center variance-cell ${d.variance > 0 ? 'surplus' : 'shortage'}">${d.variance > 0 ? '+' : ''}${d.variance}</span></div>`;
        };
        if (summary.discrepancies.length > 0) html += '<div class="audit-summary-section"><h4>Discrepancies</h4>' + summary.discrepancies.map(d => createRow(d, 'discrepancy')).join('') + '</div>';
        if (summary.uncountedItems.length > 0) html += '<div class="audit-summary-section"><h4>Uncounted Items (Shortages)</h4>' + summary.uncountedItems.map(d => createRow(d, 'uncounted')).join('') + '</div>';
        if (summary.newItemsFound.length > 0) html += '<div class="audit-summary-section"><h4>New Items Found (Surpluses)</h4>' + summary.newItemsFound.map(d => createRow(d, 'new')).join('') + '</div>';
        return html || `<div class="p-4 text-center">Perfect match! No discrepancies found for this scope.</div>`;
    };
    const processAndReviewAudit = () => {
        const auditCondition = getEl('audit-condition-select').value;
        const auditRim = getEl('audit-rim-select').value;
        const entries = getEl('audit-paste-area').value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

        const physicalCountMap = new Map();
        entries.forEach(entry => {
            const parsed = parseTireSize(entry);
            if (parsed) {
                const formatted = formatTireSize(parsed);
                physicalCountMap.set(formatted, (physicalCountMap.get(formatted) || 0) + 1);
            }
        });

        let inventoryScope = inventory.filter(t => t.condition === auditCondition);
        if (auditRim !== 'all') inventoryScope = inventoryScope.filter(t => t.size.rim == auditRim);

        const inventoryCountMap = new Map();
        inventoryScope.forEach(tire => inventoryCountMap.set(formatTireSize(tire.size), tire.quantity));

        const allSizes = new Set([...physicalCountMap.keys(), ...inventoryCountMap.keys()]);
        const summary = { discrepancies: [], uncountedItems: [], newItemsFound: [] };

        allSizes.forEach(sizeStr => {
            const physicalQty = physicalCountMap.get(sizeStr) || 0;
            const inventoryQty = inventoryCountMap.get(sizeStr) || 0;
            const data = { sizeStr, physicalQty, inventoryQty, variance: physicalQty - inventoryQty };

            if (physicalQty !== inventoryQty) {
                if (inventoryQty > 0) {
                    summary.discrepancies.push(data)
                } else {
                    summary.newItemsFound.push(data);
                }
            }
        });

        summary.uncountedItems = inventoryScope
            .filter(t => !physicalCountMap.has(formatTireSize(t.size)))
            .map(t => ({ sizeStr: formatTireSize(t.size), physicalQty: 0, inventoryQty: t.quantity, variance: -t.quantity }));

        summary.discrepancies = summary.discrepancies.filter(d => !summary.uncountedItems.find(u => u.sizeStr === d.sizeStr));

        getEl('audit-summary-content').innerHTML = generateDiscrepancyReportHTML(summary);
        processedAuditData = { summary, auditCondition, auditRim };

        getEl('audit-input-step').classList.add('hidden');
        getEl('audit-summary-step').classList.remove('hidden');
        getEl('process-audit-btn').classList.add('hidden');
        getEl('confirm-audit-btn').classList.remove('hidden');
    };
    const confirmAndUpdateAudit = () => {
        if (!processedAuditData) return;
        const { summary, auditCondition, auditRim } = processedAuditData;
        const allDiscrepancies = [...summary.discrepancies, ...summary.uncountedItems, ...summary.newItemsFound];

        allDiscrepancies.forEach(d => {
            const parsedSize = parseTireSize(d.sizeStr);
            if (!parsedSize) return;

            const sizeString = JSON.stringify(parsedSize);
            const tireIndex = inventory.findIndex(t => JSON.stringify(t.size) === sizeString && t.condition === auditCondition);

            if (tireIndex > -1) {
                inventory[tireIndex].quantity = d.physicalQty;
            } else if (d.physicalQty > 0) {
                inventory.unshift({ size: parsedSize, quantity: d.physicalQty, condition: auditCondition });
            }
        });

        inventory = inventory.filter(t => t.quantity > 0);

        const auditRecord = {
            timestamp: new Date().toISOString(),
            condition: auditCondition,
            rim: auditRim,
            discrepancies: allDiscrepancies.filter(d => d.variance !== 0)
        };
        if (auditRecord.discrepancies.length > 0) auditHistory.unshift(auditRecord);

        saveData();
        renderAll();
        toggleAuditModal(false);
        showToast(`Audit confirmed. ${allDiscrepancies.length} adjustment(s) logged.`);
    };

    const toggleAuditHistoryModal = (show) => {
        const modal = getEl('audit-history-modal');
        modal.classList.toggle('hidden', !show);
        modal.classList.toggle('flex', show);
        if (show) renderAuditHistory();
    };

    const renderAuditHistory = () => {
        const list = getEl('audit-history-list');
        const detail = getEl('audit-history-detail');
        list.innerHTML = '';
        detail.innerHTML = '<p class="text-center text-gray-500">Select an audit from the left to view details.</p>';
        if (auditHistory.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-500">No past audits found.</p>';
            return;
        }

        auditHistory.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'audit-history-list-item';
            item.dataset.index = index;
            const date = new Date(record.timestamp);
            item.innerHTML = `
                <p class="font-semibold">Audit of ${record.condition.toUpperCase()} Tires</p>
                <p class="text-sm text-gray-500">${date.toLocaleString()}</p>
            `;
            item.addEventListener('click', () => {
                renderAuditHistoryDetail(record);
                document.querySelectorAll('.audit-history-list-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            });
            list.appendChild(item);
        });
    };

    const renderAuditHistoryDetail = (record) => {
        const summary = { discrepancies: record.discrepancies, uncountedItems: [], newItemsFound: [] };
        getEl('audit-history-detail').innerHTML = `
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Discrepancy Report</h3>
            <div>${generateDiscrepancyReportHTML(summary)}</div>
        `;
    };

    // --- EVENT LISTENERS ---
    getEl('search-input').addEventListener('input', () => {
        renderAll();
        const term = getEl('search-input').value.trim();
        const parsed = parseTireSize(term);
        if (parsed) {
            addLogEntry(formatTireSize(parsed), 'Searched');
        }
    });
    getEl('clear-search-btn').addEventListener('click', () => { getEl('search-input').value = ''; renderAll(); });
    getEl('add-tires-btn').addEventListener('click', () => toggleEntryModal(true));
    getEl('close-entry-modal-btn').addEventListener('click', () => toggleEntryModal(false));
    getEl('cancel-entry-modal-btn').addEventListener('click', () => toggleEntryModal(false));
    getEl('entry-modal').addEventListener('click', (e) => { if (e.target === getEl('entry-modal')) toggleEntryModal(false); });
    getEl('modal-tab-batch').addEventListener('click', () => switchEntryMode('batch'));
    getEl('modal-tab-multiple').addEventListener('click', () => switchEntryMode('multiple'));
    getEl('confirm-add-tires-btn').addEventListener('click', processEntries);
    getEl('batch-grid').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('batch-size')) { e.preventDefault(); createBatchRow(); }
    });
    getEl('batch-grid').addEventListener('click', (e) => {
        if (e.target.matches('.remove-batch-row') && getEl('batch-grid').querySelectorAll('.batch-grid-row').length > 1) {
            e.target.closest('.batch-grid-row').remove();
        }
    });

    getEl('audit-btn').addEventListener('click', () => toggleAuditModal(true));
    getEl('close-audit-modal-btn').addEventListener('click', () => toggleAuditModal(false));
    getEl('cancel-audit-modal-btn').addEventListener('click', () => toggleAuditModal(false));
    getEl('process-audit-btn').addEventListener('click', processAndReviewAudit);
    getEl('confirm-audit-btn').addEventListener('click', confirmAndUpdateAudit);
    getEl('audit-history-btn').addEventListener('click', () => toggleAuditHistoryModal(true));
    getEl('close-audit-history-modal-btn').addEventListener('click', () => toggleAuditHistoryModal(false));

    getEl('audit-summary-content').addEventListener('input', (e) => {
        if (e.target.classList.contains('audit-edit-qty')) {
            const input = e.target;
            const sizeStr = input.dataset.sizeStr;
            const newQty = parseInt(input.value, 10) || 0;

            const data = [...processedAuditData.summary.discrepancies, ...processedAuditData.summary.uncountedItems].find(d => d.sizeStr === sizeStr);
            if (data) {
                data.physicalQty = newQty;
                data.variance = newQty - data.inventoryQty;

                const row = input.closest('.audit-summary-row');
                const varianceCell = row.querySelector('.variance-cell');
                varianceCell.textContent = `${data.variance > 0 ? '+' : ''}${data.variance}`;
            }
        }
    });
    getEl('audit-summary-content').addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-add-btn')) {
            const btn = e.target;
            const parsed = parseTireSize(btn.dataset.sizeStr);
            if (parsed) {
                addTire(parsed, 0, processedAuditData.auditCondition, { suppressToast: true }); // Add with 0 qty initially
                showToast(`Added ${btn.dataset.sizeStr} to system. Quantity will be updated upon audit confirmation.`);
                btn.textContent = 'Added'; btn.disabled = true;
            }
        }
    });

    document.addEventListener('click', e => {
        if (e.target.matches('.adjust-qty-btn')) {
            const group = e.target.closest('[data-size]');
            const size = JSON.parse(group.dataset.size);
            const condition = group.dataset.condition;
            const amount = parseInt(e.target.dataset.amount);
            const tire = inventory.find(t => JSON.stringify(t.size) === JSON.stringify(size) && t.condition === condition);
            if (tire) {
                const newQuantity = tire.quantity + amount;
                if (newQuantity >= 0) {
                    updateTireQuantity(size, condition, newQuantity);
                }
            }
        }
        if (e.target.closest('.distributor-btn')) {
            const term = formatTireSize(parseTireSize(getEl('search-input').value));
            if (term) addLogEntry(term, 'Checked Distributor', { distributor: e.target.closest('.distributor-btn').dataset.distributor });
        }
        if (e.target.closest('#analytics-toggle')) {
            getEl('analytics-section').classList.toggle('open');
            getEl('analytics-arrow').classList.toggle('rotate-180');
        }
        if (e.target.closest('#activity-log-toggle')) {
            getEl('activity-log-section').classList.toggle('open');
            getEl('activity-log-arrow').classList.toggle('rotate-180');
        }
    });

    const handleQuantityUpdate = (input) => {
        const wrapper = input.closest('.stock-quantity-wrapper');
        if (!wrapper) return;
        const newQuantity = parseInt(input.value, 10);
        const size = JSON.parse(wrapper.dataset.size);
        const condition = wrapper.dataset.condition;
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            updateTireQuantity(size, condition, newQuantity);
        } else {
            renderAll(); // Rerender to revert invalid input
        }
    };

    getEl('inventory-container').addEventListener('click', e => {
        if (e.target.classList.contains('stock-quantity-display')) {
            const wrapper = e.target.closest('.stock-quantity-wrapper');
            const display = wrapper.querySelector('.stock-quantity-display');
            const input = wrapper.querySelector('.quantity-edit-input');
            display.classList.add('hidden');
            input.classList.remove('hidden');
            input.focus();
            input.select();
        }
    });

    getEl('inventory-container').addEventListener('focusout', e => {
        if (e.target.classList.contains('quantity-edit-input')) {
            handleQuantityUpdate(e.target);
        }
    });

    getEl('inventory-container').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('quantity-edit-input')) {
            handleQuantityUpdate(e.target);
        } else if (e.key === 'Escape' && e.target.classList.contains('quantity-edit-input')) {
            const display = e.target.previousElementSibling;
            display.classList.remove('hidden');
            e.target.classList.add('hidden');
        }
    });

    getEl('rim-filter-select').addEventListener('change', renderInventory);

    // --- INITIALIZATION ---
    loadData();
    renderAll();
});
