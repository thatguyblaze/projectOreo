// Created with <3 by Blazinik

const TreadzData = {

    
    CONFIG: {
        KEYS: {
            'ticket': 'treadzTowHistoryV1',
            'receipt': 'treadzQuoteHistoryV1', 
            'quote': 'treadzQuoteHistoryV1',
            'audit': 'treadz_audit_logs'
        }
    },

    
    

    _getStorage: (collectionDesc) => {
        const key = TreadzData.CONFIG.KEYS[collectionDesc] || `treadz_${collectionDesc}`;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error loading ${collectionDesc}:`, e);
            return [];
        }
    },

    _setStorage: (collectionDesc, data) => {
        const key = TreadzData.CONFIG.KEYS[collectionDesc] || `treadz_${collectionDesc}`;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${collectionDesc}:`, e);
            
        }
    },

    

    
    getAll: (collection) => {
        return TreadzData._getStorage(collection);
    },

    
    getById: (collection, id) => {
        const records = TreadzData._getStorage(collection);
        
        return records.find(r => r.id == id);
    },

    
    save: (collection, record, user = 'System') => {
        const records = TreadzData._getStorage(collection);
        const index = records.findIndex(r => r.id == record.id);

        let action = '';
        let oldRecord = null;

        
        const now = new Date().toISOString();

        if (index >= 0) {
            action = 'UPDATE';
            oldRecord = records[index];
            
            records[index] = {
                ...oldRecord,
                ...record,
                updatedAt: now,
                version: (oldRecord.version || 1) + 1
            };
        } else {
            action = 'CREATE';
            record.createdAt = now;
            record.updatedAt = now;
            record.version = 1;
            records.unshift(record); 
        }

        
        if (records.length > 200) records.pop();

        TreadzData._setStorage(collection, records);

        
        TreadzData.logAudit(collection, record.id, action, user, oldRecord ? 'Record updated' : 'New record created');

        return records[index >= 0 ? index : 0];
    },

    
    delete: (collection, id, user = 'System') => {
        let records = TreadzData._getStorage(collection);
        const record = records.find(r => r.id == id);

        if (record) {
            records = records.filter(r => r.id != id);
            TreadzData._setStorage(collection, records);
            TreadzData.logAudit(collection, id, 'DELETE', user, 'Record permanently deleted');
            return true;
        }
        return false;
    },

    

    logAudit: (targetCollection, targetId, action, user, details) => {
        const logs = TreadzData._getStorage('audit');

        const logEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            timestamp: new Date().toISOString(),
            targetCollection,
            targetId,
            action, 
            user,
            details
        };

        logs.unshift(logEntry);

        
        if (logs.length > 500) logs.pop();

        TreadzData._setStorage('audit', logs);
        console.log(`[AUDIT] ${action} on ${targetCollection} #${targetId}`);
    },

    getAuditLogs: (collection, recordId) => {
        const logs = TreadzData._getStorage('audit');
        return logs.filter(l =>
            (!collection || l.targetCollection === collection) &&
            (!recordId || l.targetId == recordId)
        );
    },

    

    
    search: (query, collections = ['ticket']) => {
        if (!query || query.length < 2) return [];
        const lowerQ = query.toLowerCase();

        let results = [];

        collections.forEach(col => {
            const records = TreadzData.getAll(col);
            const matches = records.filter(item => {
                
                const searchable = item.fields ? JSON.stringify(Object.values(item.fields)) : JSON.stringify(Object.values(item));
                return searchable.toLowerCase().includes(lowerQ);
            });

            
            const colResults = matches.map(m => ({
                id: m.id,
                type: col,
                title: m.billTo || m.customer || (m.fields ? m.fields.billTo : 'Unknown'),
                subtitle: m.vehicle || (m.fields ? m.fields.vehicle : 'Unknown Item'),
                date: m.date || m.timestamp,
                raw: m
            }));

            results = [...results, ...colResults];
        });

        return results;
    },

    
    exportToCSV: (collection) => {
        const records = TreadzData.getAll(collection);
        if (!records.length) return '';

        const headers = Object.keys(records[0]).join(',');
        const rows = records.map(r =>
            Object.values(r).map(v =>
                typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : JSON.stringify(v)
            ).join(',')
        );

        return [headers, ...rows].join('\n');
    },

    
    migrateLegacyData: () => {
        const legacyMap = {
            'ticket': ['treadzTowHistory', 'treadz_tow_history'],
            'receipt': ['treadzQuoteHistory', 'treadz_quote_history', 'treadzReceiptHistory'],
            'quote': ['treadzQuoteHistory', 'treadz_quote_history']
        };

        let migratedCount = 0;

        Object.entries(TreadzData.CONFIG.KEYS).forEach(([type, currentKey]) => {
            const currentData = localStorage.getItem(currentKey);
            
            if (!currentData || JSON.parse(currentData).length === 0) {
                const legacyKeys = legacyMap[type];
                if (legacyKeys) {
                    for (const oldKey of legacyKeys) {
                        const oldData = localStorage.getItem(oldKey);
                        if (oldData) {
                            console.log(`[Migration] Found legacy data for ${type} in ${oldKey}`);
                            try {
                                const parsed = JSON.parse(oldData);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    localStorage.setItem(currentKey, oldData); 
                                    migratedCount += parsed.length;
                                    
                                    break; 
                                }
                            } catch (e) {
                                console.error(`[Migration] Failed to parse legacy ${oldKey}`, e);
                            }
                        }
                    }
                }
            }
        });

        if (migratedCount > 0) {
            console.log(`[Migration] Successfully migrated ${migratedCount} records.`);
            return true;
        }
        return false;
    }
};


try {
    TreadzData.migrateLegacyData();
} catch (e) {
    console.warn("Migration failed or already run", e);
}


window.TreadzData = TreadzData;