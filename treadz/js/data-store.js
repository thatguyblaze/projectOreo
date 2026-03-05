/**
 * Treadz Data Store - V2.0
 * High-speed local persistence with activity_log_v7, tireinventoryv7, and quotehistoryv1.
 * Optimized for shared storage between quotes and receipts.
 */

const TreadzData = {
    CONFIG: {
        KEYS: {
            'ticket': 'treadzTowHistoryV1',
            'receipt': 'quotehistoryv1', // Physical key for receipts
            'quote': 'quotehistoryv1',   // Physical key for quotes (shared)
            'inventory': 'treadzTireInventoryV7',
            'logs': 'activity_log_v7',
            'employees': 'treadz_employees'
        }
    },

    _migrationChecked: false,

    /**
     * Retrieves all items for a specific type.
     * Automatically handles logical separation for shared keys.
     */
    getAll: (type) => {
        // Run migration check on first access
        if (!TreadzData._migrationChecked) {
            TreadzData.migrateLegacyData();
        }

        const key = TreadzData.CONFIG.KEYS[type] || type;
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        
        try {
            const data = JSON.parse(raw);
            if (!Array.isArray(data)) return [];

            // Logical filtering for shared storage (quotehistoryv1)
            // This ensures getAll('quote') doesn't return receipts and vice-versa
            if (type === 'quote') {
                return data.filter(item => item.type === 'quote');
            }
            if (type === 'receipt') {
                return data.filter(item => item.type === 'receipt' || item.isPaid === true);
            }

            return data;
        } catch (e) {
            console.error(`[DataStore] Failed to parse ${key}:`, e);
            return [];
        }
    },

    getById: (type, id) => {
        const all = TreadzData.getAll(type);
        return all.find(item => item.id == id);
    },

    /**
     * Saves or updates data.
     * For quotes/receipts, it intelligently merges into the shared 'quotehistoryv1' array.
     */
    save: (type, data, user = 'System') => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        const timestamp = new Date().toISOString();
        
        // Handle shared storage logic
        let fullArray;
        if (type === 'quote' || type === 'receipt') {
            const raw = localStorage.getItem('quotehistoryv1');
            try {
                fullArray = raw ? JSON.parse(raw) : [];
            } catch(e) { fullArray = []; }
            
            // Ensure data has the correct type attribute for future filtering
            data.type = type; 
        } else {
            fullArray = TreadzData.getAll(type);
        }

        const index = fullArray.findIndex(item => item.id == data.id);

        if (index >= 0) {
            fullArray[index] = { 
                ...fullArray[index], 
                ...data, 
                updatedAt: timestamp, 
                updatedBy: user 
            };
        } else {
            fullArray.push({ 
                ...data, 
                id: data.id || Date.now(),
                createdAt: timestamp, 
                CreatedBy: user 
            });
        }

        localStorage.setItem(key, JSON.stringify(fullArray));
        TreadzData.log(user, `Saved ${type} #${data.id}`, { id: data.id });
    },

    delete: (type, id, user = 'System') => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        let fullArray;
        
        // Use raw access for deletion in shared storage to ensure we don't lose the other type
        if (type === 'quote' || type === 'receipt') {
            const raw = localStorage.getItem('quotehistoryv1');
            try {
                fullArray = raw ? JSON.parse(raw) : [];
            } catch(e) { fullArray = []; }
        } else {
            fullArray = TreadzData.getAll(type);
        }

        const filtered = fullArray.filter(item => item.id != id);
        localStorage.setItem(key, JSON.stringify(filtered));
        TreadzData.log(user, `Deleted ${type} #${id}`, { id: id });
    },

    /**
     * Specialized logging using activity_log_v7
     */
    log: (user, action, details = {}) => {
        const key = TreadzData.CONFIG.KEYS['logs'];
        let logs = [];
        try {
            const raw = localStorage.getItem(key);
            logs = raw ? JSON.parse(raw) : [];
        } catch(e) { logs = []; }

        logs.unshift({
            timestamp: new Date().toISOString(),
            user,
            action,
            details
        });

        // Retention policy: Keep last 1000 logs
        localStorage.setItem(key, JSON.stringify(logs.slice(0, 1000)));
    },

    exportToCSV: (type) => {
        const data = TreadzData.getAll(type);
        if (data.length === 0) return '';

        const headers = Array.from(new Set(data.flatMap(item => Object.keys(item))));
        const rows = data.map(item =>
            headers.map(header => {
                const v = item[header];
                if (typeof v === 'object' && v !== null) return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
                return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    },

    /**
     * Migration logic to pull data from old V4/V5/V6 keys into the new schema.
     */
    migrateLegacyData: () => {
        if (TreadzData._migrationChecked) return;
        TreadzData._migrationChecked = true;

        const legacyMap = {
            'quotehistoryv1': [
                'treadzQuoteHistory', 'treadzReceiptHistory', 'treadz_quote_history',
                'treadzQuoteHistoryV1', 'treadzQuoteHistoryV4', 'treadzQuoteHistoryV5', 
                'treadzQuoteHistoryv4', 'treadzQuoteHistoryv5'
            ],
            'treadzTireInventoryV7': [
                'treadzTireInventory', 'treadzTireInventoryV5', 'treadzTireInventoryV6', 'treadz_inventory'
            ],
            'activity_log_v7': [
                'treadz_audit_logs', 'treadz_logs', 'treadz_activity_log'
            ]
        };

        Object.entries(legacyMap).forEach(([targetKey, legacyKeys]) => {
            const rawCurrent = localStorage.getItem(targetKey);
            let currentDataArr = [];
            try {
                currentDataArr = rawCurrent ? JSON.parse(rawCurrent) : [];
            } catch(e) { currentDataArr = []; }

            let migrationHappened = false;

            legacyKeys.forEach(legacyKey => {
                if (legacyKey === targetKey) return;
                
                const rawLegacy = localStorage.getItem(legacyKey);
                if (rawLegacy) {
                    try {
                        const legacyItems = JSON.parse(rawLegacy);
                        if (Array.isArray(legacyItems)) {
                            legacyItems.forEach(item => {
                                // Prevent duplicate IDs
                                if (!currentDataArr.find(r => r.id == item.id)) {
                                    // Assign type if migrating into shared quotehistoryv1
                                    if (targetKey === 'quotehistoryv1' && !item.type) {
                                        const isReceipt = item.isPaid || (item.total && String(item.total).includes('$'));
                                        item.type = isReceipt ? 'receipt' : 'quote';
                                    }
                                    currentDataArr.push(item);
                                }
                            });
                            migrationHappened = true;
                            // Note: We leave legacy data intact for safety, but you can 
                            // uncomment localStorage.removeItem(legacyKey) to clean up.
                        }
                    } catch (e) {
                        console.error(`[DataStore] Migration failed for ${legacyKey}:`, e);
                    }
                }
            });

            if (migrationHappened) {
                localStorage.setItem(targetKey, JSON.stringify(currentDataArr));
            }
        });
    }
};

// Global Exposure
window.TreadzData = TreadzData;