/**
 * Treadz Data Store - V1
 * High-speed local persistence with legacy migration support.
 */

const TreadzData = {
    CONFIG: {
        KEYS: {
            'ticket': 'treadzTowHistoryV1',
            'receipt': 'treadzQuoteHistoryV1',
            'quote': 'treadzQuoteHistoryV1',
            'inventory': 'treadzTireInventoryV7',
            'inventoryV5': 'treadzTireInventoryV5',
            'logs': 'treadz_audit_logs',
            'employees': 'treadz_employees'
        }
    },

    _migrationChecked: false,

    getAll: (type) => {
        // Safe check for migration only once when first accessing data
        if (!TreadzData._migrationChecked && typeof TreadzConfig !== 'undefined') {
            TreadzData.migrateLegacyData();
        }

        const key = TreadzData.CONFIG.KEYS[type] || type;
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error(`[DataStore] Failed to parse ${key}:`, e);
            return [];
        }
    },

    getById: (type, id) => {
        const all = TreadzData.getAll(type);
        return all.find(item => item.id == id);
    },

    save: (type, data, user = 'System') => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        let all = TreadzData.getAll(type);

        const index = all.findIndex(item => item.id == data.id);
        if (index >= 0) {
            all[index] = { ...all[index], ...data, updatedAt: new Date().toISOString(), updatedBy: user };
        } else {
            all.push({ ...data, createdAt: new Date().toISOString(), CreatedBy: user });
        }

        TreadzData._setStorage(type, all);
        TreadzData.log(user, `Saved ${type} #${data.id}`, { id: data.id });
    },

    delete: (type, id, user = 'System') => {
        let all = TreadzData.getAll(type);
        const filtered = all.filter(item => item.id != id);
        TreadzData._setStorage(type, filtered);
        TreadzData.log(user, `Deleted ${type} #${id}`, { id: id });
    },

    _setStorage: (type, data) => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        localStorage.setItem(key, JSON.stringify(data));
    },

    log: (user, action, details = {}) => {
        const logs = TreadzData.getAll('logs');
        logs.unshift({
            timestamp: new Date().toISOString(),
            user,
            action,
            details
        });
        // Limit logs to last 1000
        TreadzData._setStorage('logs', logs.slice(0, 1000));
    },

    exportToCSV: (type) => {
        const data = TreadzData.getAll(type);
        if (data.length === 0) return '';

        // Extract all unique headers
        const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));
        const rows = data.map(item =>
            headers.map(header => {
                const v = item[header];
                if (typeof v === 'object') return JSON.stringify(v).replace(/"/g, '""');
                return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    },

    migrateLegacyData: () => {
        if (TreadzData._migrationChecked) return;
        TreadzData._migrationChecked = true;

        const legacyMap = {
            'ticket': [
                'treadzTowHistory', 'treadz_tow_history', 'treadz_v2_tow_history',
                'treadzTowHistoryV4', 'treadzTowHistoryV5', 'treadzTowHistoryV6',
                'treadzTowHistoryV7', 'treadzTowHistoryV8', 'treadzTowHistoryV9', 'treadzTowHistoryV10',
                'treadzTowHistoryv4', 'treadzTowHistoryv5'
            ],
            'receipt': [
                'treadzQuoteHistory', 'treadz_quote_history', 'treadzReceiptHistory', 'treadz_v2_quote_history',
                'treadzQuoteHistoryV4', 'treadzQuoteHistoryV5', 'treadzQuoteHistoryV6',
                'treadzQuoteHistoryV7', 'treadzQuoteHistoryV8', 'treadzQuoteHistoryV9', 'treadzQuoteHistoryV10',
                'treadzQuoteHistoryv4', 'treadzQuoteHistoryv5'
            ],
            'quote': [
                'treadzQuoteHistory', 'treadz_quote_history', 'treadz_v2_quote_history',
                'treadzQuoteHistoryV4', 'treadzQuoteHistoryV5', 'treadzQuoteHistoryV6',
                'treadzQuoteHistoryV7', 'treadzQuoteHistoryV8', 'treadzQuoteHistoryV9', 'treadzQuoteHistoryV10',
                'treadzQuoteHistoryv4', 'treadzQuoteHistoryv5'
            ]
        };

        const processedKeys = new Set();

        Object.entries(TreadzData.CONFIG.KEYS).forEach(([type, currentKey]) => {
            const legacyKeys = legacyMap[type] || [];
            let currentDataArr = TreadzData.getAll(type); // Recursive through getAll but flag prevents loop
            let migrationHappened = false;

            legacyKeys.forEach(legacyKey => {
                if (legacyKey === currentKey || processedKeys.has(legacyKey)) return;

                const rawLegacyData = localStorage.getItem(legacyKey);
                if (rawLegacyData) {
                    try {
                        const legacyItems = JSON.parse(rawLegacyData);
                        if (Array.isArray(legacyItems) && legacyItems.length > 0) {
                            console.log(`[DataStore] Migrating ${legacyItems.length} records from ${legacyKey} to ${currentKey} (${type})`);

                            legacyItems.forEach(item => {
                                // Double-check for duplicates by ID
                                if (!currentDataArr.find(r => r.id == item.id)) {
                                    // Intelligent type assignment
                                    if (!item.type) {
                                        if (type === 'quote' || type === 'receipt') {
                                            const isProbablyReceipt = item.displayId || item.isPaid || (item.total && item.total.includes('$'));
                                            item.type = isProbablyReceipt ? 'receipt' : 'quote';
                                        } else {
                                            item.type = type;
                                        }
                                    }
                                    currentDataArr.push(item);
                                }
                            });
                            migrationHappened = true;
                        }
                        processedKeys.add(legacyKey);
                        localStorage.removeItem(legacyKey);
                    } catch (e) {
                        console.error(`[DataStore] Migration failed for ${legacyKey}:`, e);
                    }
                }
            });

            if (migrationHappened) {
                TreadzData._setStorage(type, currentDataArr);
            }
        });
    }
};

window.TreadzData = TreadzData;