const TreadzData = {
    CONFIG: {
        KEYS: {
            'ticket': 'treadzTowHistoryV1',
            'receipt': 'quotehistoryv1',
            'quote': 'quotehistoryv1',
            'inventory': 'tireinventoryv7',
            'logs': 'activity_log_v7',
            'employees': 'treadz_employees'
        }
    },
    _migrationChecked: false,
    getAll: (type) => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            let data = JSON.parse(raw);
            if (!Array.isArray(data)) return [];
            let results = data;
            if (type === 'quote') {
                results = data.filter(i => i.type === 'quote' || (!i.type && !i.isPaid));
            } else if (type === 'receipt') {
                results = data.filter(i => i.type === 'receipt' || i.isPaid === true);
            }
            return results.sort((a, b) => {
                const dA = new Date(a.timestamp || a.createdAt || 0);
                const dB = new Date(b.timestamp || b.createdAt || 0);
                return dB - dA;
            });
        } catch (e) {
            console.error(e);
            return [];
        }
    },
    getById: (type, id) => {
        const all = TreadzData.getAll(type);
        return all.find(item => item.id == id);
    },
    save: (type, data, user = 'System') => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        let all = [];
        try {
            const raw = localStorage.getItem(key);
            if (raw) all = JSON.parse(raw);
        } catch (e) { }
        if (!Array.isArray(all)) all = [];
        const timestamp = new Date().toISOString();
        if (!data.timestamp) data.timestamp = timestamp;
        if (!data.type && (type === 'quote' || type === 'receipt')) data.type = type;
        const index = all.findIndex(item => item.id == data.id);
        if (index >= 0) {
            all[index] = { ...all[index], ...data, updatedAt: timestamp, updatedBy: user };
        } else {
            all.push({ ...data, id: data.id || Date.now(), createdAt: timestamp, CreatedBy: user });
        }
        localStorage.setItem(key, JSON.stringify(all));
        TreadzData.log(user, `Saved ${type} #${data.id}`, { id: data.id });
    },
    delete: (type, id, user = 'System') => {
        const key = TreadzData.CONFIG.KEYS[type] || type;
        let all = [];
        try {
            const raw = localStorage.getItem(key);
            if (raw) all = JSON.parse(raw);
        } catch (e) { }
        if (Array.isArray(all)) {
            const filtered = all.filter(item => item.id != id);
            localStorage.setItem(key, JSON.stringify(filtered));
            TreadzData.log(user, `Deleted ${type} #${id}`, { id: id });
        }
    },
    log: (user, action, details = {}) => {
        const key = TreadzData.CONFIG.KEYS['logs'];
        let logs = [];
        try {
            const raw = localStorage.getItem(key);
            if (raw) logs = JSON.parse(raw);
        } catch (e) { }
        if (!Array.isArray(logs)) logs = [];
        logs.unshift({ timestamp: new Date().toISOString(), user, action, details });
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
    migrateLegacyData: () => {
        if (TreadzData._migrationChecked) return;
        TreadzData._migrationChecked = true;
    }
};
if (typeof window !== 'undefined') {
    setTimeout(() => { TreadzData.migrateLegacyData(); }, 100);
}
window.TreadzData = TreadzData;