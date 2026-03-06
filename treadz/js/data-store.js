/**
 * Treadz Data Store - V1
 * High-speed local persistence with legacy migration support.
 */

const TreadzData = {
    CONFIG: {
        KEYS: {
            'ticket': 'treadzTowHistoryV1',
            'receipt': 'quotehistoryv1',
            'quote': 'quotehistoryv1',
            'inventory': 'tireinventoryv7',
            'logs': 'treadz_audit_logs',
            'employees': 'treadz_employees'
        }
    },

    _migrationChecked: false,

    getAll: (type) => {
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
            // Ensure type is set if not present
            const finalData = { ...data, createdAt: new Date().toISOString(), CreatedBy: user };
            if (!finalData.type && (type === 'quote' || type === 'receipt')) {
                finalData.type = type;
            }
            all.push(finalData);
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
        // User requested not to worry about legacy data.
        if (TreadzData._migrationChecked) return;
        TreadzData._migrationChecked = true;
        console.log('[DataStore] Unified storage active');
    }
};

// Auto-run migration check once
if (typeof window !== 'undefined') {
    setTimeout(() => { TreadzData.migrateLegacyData(); }, 100);
}

window.TreadzData = TreadzData;