/**
 * Treadz Data Store Service
 * Centralized data management with Audit Logging and Search.
 * Currently backed by LocalStorage, designed for easy API/Database migration.
 */
const TreadzData = {

    // Configuration: Map logical collection names to storage keys
    CONFIG: {
        KEYS: {
            'ticket': 'treadzTowHistoryV1',
            'receipt': 'treadzQuoteHistoryV1', // Shared Storage with Quotes
            'quote': 'treadzQuoteHistoryV1',
            'audit': 'treadz_audit_logs'
        }
    },

    // --- Core Storage Abstraction (The "Local" Database Layer) ---
    // In the future, replace these methods to switch to a Real Database (Firebase/SQL)

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
            // Handle QuotaExceededError ideally
        }
    },

    // --- Public Data API ---

    /**
     * Get all records from a collection
     * @param {string} collection - 'ticket', 'receipt', 'quote'
     */
    getAll: (collection) => {
        return TreadzData._getStorage(collection);
    },

    /**
     * Get a specific record by ID
     */
    getById: (collection, id) => {
        const records = TreadzData._getStorage(collection);
        // Loose equality for ID strings/numbers
        return records.find(r => r.id == id);
    },

    /**
     * Save a record (Insert or Update)
     * Auto-generates Audit Log
     */
    save: (collection, record, user = 'System') => {
        const records = TreadzData._getStorage(collection);
        const index = records.findIndex(r => r.id == record.id);

        let action = '';
        let oldRecord = null;

        // Ensure Metadata
        const now = new Date().toISOString();

        if (index >= 0) {
            action = 'UPDATE';
            oldRecord = records[index];
            // Merge capabilities could go here, for now we overwrite
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
            records.unshift(record); // Newest first
        }

        // Enforce Limits (Local Storage constraint prevention)
        if (records.length > 200) records.pop();

        TreadzData._setStorage(collection, records);

        // Audit Log
        TreadzData.logAudit(collection, record.id, action, user, oldRecord ? 'Record updated' : 'New record created');

        return records[index >= 0 ? index : 0];
    },

    /**
     * Delete a record
     */
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

    // --- Audit Logging System ---

    logAudit: (targetCollection, targetId, action, user, details) => {
        const logs = TreadzData._getStorage('audit');

        const logEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
            timestamp: new Date().toISOString(),
            targetCollection,
            targetId,
            action, // CREATE, UPDATE, DELETE
            user,
            details
        };

        logs.unshift(logEntry);

        // Keep logs manageable (Last 500 events)
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

    // --- Advanced Search Engine ---

    /**
     * Site-wide search across specified collections
     * Returns normalized results
     */
    search: (query, collections = ['ticket']) => {
        if (!query || query.length < 2) return [];
        const lowerQ = query.toLowerCase();

        let results = [];

        collections.forEach(col => {
            const records = TreadzData.getAll(col);
            const matches = records.filter(item => {
                // Search in top level or fields object
                const searchable = item.fields ? JSON.stringify(Object.values(item.fields)) : JSON.stringify(Object.values(item));
                return searchable.toLowerCase().includes(lowerQ);
            });

            // Normalize for UI
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

    // --- Export Tools ---
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

    // --- Migration Utilities ---
    migrateLegacyData: () => {
        const legacyMap = {
            'ticket': ['treadzTowHistory', 'treadz_tow_history'],
            'receipt': ['treadzQuoteHistory', 'treadz_quote_history', 'treadzReceiptHistory'],
            'quote': ['treadzQuoteHistory', 'treadz_quote_history']
        };

        let migratedCount = 0;

        Object.entries(TreadzData.CONFIG.KEYS).forEach(([type, currentKey]) => {
            const currentData = localStorage.getItem(currentKey);
            // Only migrate if current is empty/null to avoid overwriting or duplication loops
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
                                    localStorage.setItem(currentKey, oldData); // Port it over
                                    migratedCount += parsed.length;
                                    // Optional: localStorage.removeItem(oldKey); // Keep for safety for now
                                    break; // Found one, stop looking
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

// Auto-run migration on load
try {
    TreadzData.migrateLegacyData();
} catch (e) {
    console.warn("Migration failed or already run", e);
}

// Expose to window
window.TreadzData = TreadzData;
