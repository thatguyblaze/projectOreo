/* RELATIONAL DATA STORE v3 - OFFICIAL */
const STORE_KEYS = {
    INCIDENTS: 'cmd_incidents_v1',
    SUBJECTS: 'cmd_subjects_v1',
    EVIDENCE: 'cmd_evidence_v1',
    OFFICER: 'cmd_officer_v2', // Upgraded version for XP
    TICKETS: 'cmd_tickets_v1'
};

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORE_KEYS.INCIDENTS)) localStorage.setItem(STORE_KEYS.INCIDENTS, JSON.stringify([]));
        if (!localStorage.getItem(STORE_KEYS.SUBJECTS)) localStorage.setItem(STORE_KEYS.SUBJECTS, JSON.stringify([]));
        if (!localStorage.getItem(STORE_KEYS.EVIDENCE)) localStorage.setItem(STORE_KEYS.EVIDENCE, JSON.stringify([]));
        if (!localStorage.getItem(STORE_KEYS.TICKETS)) localStorage.setItem(STORE_KEYS.TICKETS, JSON.stringify([]));
        // Officer Key is managed by Login now
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
    createSubject(personData) {
        return this._add(STORE_KEYS.SUBJECTS, personData);
    }

    getMethods() { return { createSubject: this.createSubject.bind(this) }; }

    linkSubjectToIncident(incidentId, subjectId, role) {
        const inc = this.getIncident(incidentId);
        if (!inc) return;
        if (inc.linked_subjects.some(s => s.id === subjectId)) return;
        inc.linked_subjects.push({ id: subjectId, role: role });
        this.updateIncident(incidentId, { linked_subjects: inc.linked_subjects });
    }

    // --- TICKETS ---
    addTicket(ticket) {
        return this._add(STORE_KEYS.TICKETS, ticket);
    }

    getTickets() {
        return this._get(STORE_KEYS.TICKETS);
    }

    getCases() {
        // Wrapper for the separate case module storage key for dashboard uniformity
        return JSON.parse(localStorage.getItem('cmd_cases_v2') || '[]');
    }

    // --- EVIDENCE ---
    logEvidence(incidentId, itemDescription, type) {
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
        const inc = this.getIncident(incidentId);
        inc.linked_evidence.push(item.id);
        this.updateIncident(incidentId, { linked_evidence: inc.linked_evidence });
        return item;
    }

    getEvidenceForIncident(incidentId) {
        const all = this._get(STORE_KEYS.EVIDENCE);
        return all.filter(e => e.incident_id === incidentId);
    }

    // --- OFFICER SESSION & GAMIFICATION ---
    getCurrentOfficer() {
        return JSON.parse(localStorage.getItem(STORE_KEYS.OFFICER));
    }

    setCurrentOfficer(data) {
        localStorage.setItem(STORE_KEYS.OFFICER, JSON.stringify(data));
    }

    // XP SYSTEM
    addXP(amount) {
        const officer = this.getCurrentOfficer();
        if (!officer) return;

        officer.xp = (officer.xp || 0) + amount;

        // Level Up Logic
        const nextRank = Math.floor(officer.xp / 100);

        if (nextRank > officer.rankLevel) {
            officer.rankLevel = nextRank;
            officer.rank = this.getRankTitle(nextRank);
            alert(`PROMOTION: You have reached the rank of ${officer.rank}!`);
        }

        this.setCurrentOfficer(officer);
        // Also save to profile
        this.saveProfile();
        return officer;
    }

    getRankTitle(level) {
        const ranks = ['Cadet', 'Officer I', 'Officer II', 'Sergeant', 'Lieutenant', 'Captain', 'Deputy Chief', 'Chief'];
        return ranks[level] || 'Chief';
    }

    getProfileKey(badge) {
        return `cmd_profile_${badge}`;
    }

    // Save current session to persistent profile slot
    saveProfile() {
        const officer = this.getCurrentOfficer();
        if (officer) {
            localStorage.setItem(this.getProfileKey(officer.badge), JSON.stringify(officer));
        }
    }

    // Load profile from slot or create new
    loadProfile(badge, name) {
        const saved = localStorage.getItem(this.getProfileKey(badge));
        if (saved) {
            return JSON.parse(saved);
        } else {
            return {
                name: name || 'Unknown Officer',
                badge: badge,
                rank: 'Cadet',
                rankLevel: 0,
                xp: 0,
                initials: name ? name.split(' ').map(n => n[0]).join('') : 'XX',
                stats: { calls: 0, arrests: 0 }
            };
        }
    }
}

export const db = new DataStore();
