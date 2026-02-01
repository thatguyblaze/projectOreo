/* RELATIONAL DATA STORE v2 */
const STORE_KEYS = {
    INCIDENTS: 'cmd_incidents_v1',
    SUBJECTS: 'cmd_subjects_v1',
    EVIDENCE: 'cmd_evidence_v1',
    OFFICER: 'cmd_officer_v1'
};

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORE_KEYS.INCIDENTS)) localStorage.setItem(STORE_KEYS.INCIDENTS, JSON.stringify([]));
        if (!localStorage.getItem(STORE_KEYS.SUBJECTS)) localStorage.setItem(STORE_KEYS.SUBJECTS, JSON.stringify([]));
        if (!localStorage.getItem(STORE_KEYS.EVIDENCE)) localStorage.setItem(STORE_KEYS.EVIDENCE, JSON.stringify([]));
        if (!localStorage.getItem(STORE_KEYS.OFFICER)) {
            // Seed Default User
            this.setCurrentOfficer({
                badge: '4921',
                name: 'Ofc. Miller',
                rank: 'Officer',
                initials: 'JM'
            });
        }
    }

    // --- GENERIC ---
    _get(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
    _save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    _add(key, item) {
        const data = this._get(key);
        item.id = item.id || crypto.randomUUID();
        item.created_at = new Date().toISOString();
        data.unshift(item); // Newest first
        this._save(key, data);
        return item;
    }

    // --- INCIDENTS (THE CORE) ---
    createIncident(type, location, narrative) {
        const id = 'INC-' + new Date().getFullYear().toString().substr(-2) + '-' + Math.floor(Math.random() * 100000);
        const incident = {
            id: id,
            type: type,
            location: location,
            status: 'ACTIVE', // ACTIVE, CLOSED
            units: [], // Assigned unit IDs
            narrative_log: [
                { time: new Date().toISOString(), text: `Call Generated: ${type} at ${location}`, author: 'DISPATCH' },
                { time: new Date().toISOString(), text: narrative, author: 'CALLER' }
            ],
            linked_subjects: [], // IDs of Person Objects
            linked_evidence: [], // IDs of Evidence Objects
            timestamp: new Date().toISOString()
        };
        return this._add(STORE_KEYS.INCIDENTS, incident);
    }

    getIncidents() { return this._get(STORE_KEYS.INCIDENTS); }

    getIncident(id) { return this._get(STORE_KEYS.INCIDENTS).find(i => i.id === id); }

    updateIncident(id, updates) {
        const data = this._get(STORE_KEYS.INCIDENTS);
        const idx = data.findIndex(i => i.id === id);
        if (idx === -1) return;

        data[idx] = { ...data[idx], ...updates };
        this._save(STORE_KEYS.INCIDENTS, data);
    }

    addNarrative(incidentId, text, author) {
        const inc = this.getIncident(incidentId);
        if (!inc) return;
        inc.narrative_log.push({
            time: new Date().toISOString(),
            text: text,
            author: author || this.getCurrentOfficer().name
        });
        this.updateIncident(incidentId, { narrative_log: inc.narrative_log });
    }

    // --- SUBJECTS (People) ---
    // Subjects are global. They can be linked to multiple incidents.
    createSubject(personData) {
        // Person Data: { first, last, dob, race, sex, history: [], flags: [] }
        return this._add(STORE_KEYS.SUBJECTS, personData);
    }

    getMethods() { return { createSubject: this.createSubject.bind(this) }; } // Helper for console use

    linkSubjectToIncident(incidentId, subjectId, role) {
        // Role: Suspect, Victim, Witness
        const inc = this.getIncident(incidentId);
        if (!inc) return;

        // Check if already linked
        if (inc.linked_subjects.some(s => s.id === subjectId)) return;

        inc.linked_subjects.push({ id: subjectId, role: role });
        this.updateIncident(incidentId, { linked_subjects: inc.linked_subjects });
    }

    // --- EVIDENCE ---
    logEvidence(incidentId, itemDescription, type) {
        // e.g. "Bloody Knife", "Weapon"
        const item = {
            id: 'EV-' + Math.floor(Math.random() * 100000),
            incident_id: incidentId,
            description: itemDescription,
            type: type,
            chain_of_custody: [
                { time: new Date().toISOString(), action: 'COLLECTED', user: this.getCurrentOfficer().name }
            ]
        };
        this._add(STORE_KEYS.EVIDENCE, item);

        // Link to Incident
        const inc = this.getIncident(incidentId);
        inc.linked_evidence.push(item.id);
        this.updateIncident(incidentId, { linked_evidence: inc.linked_evidence });

        return item;
    }

    getEvidenceForIncident(incidentId) {
        const all = this._get(STORE_KEYS.EVIDENCE);
        return all.filter(e => e.incident_id === incidentId);
    }

    // --- OFFICER SESSION ---
    getCurrentOfficer() { return JSON.parse(localStorage.getItem(STORE_KEYS.OFFICER)); }
    setCurrentOfficer(data) { localStorage.setItem(STORE_KEYS.OFFICER, JSON.stringify(data)); }
}

export const db = new DataStore();
