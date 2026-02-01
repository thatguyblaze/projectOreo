const STORE_KEYS = {
    TICKETS: 'rpd_tickets_v1',
    CASES: 'rpd_cases_v1',
    OFFICER: 'rpd_officer_v1' // Current user session
};

class DataStore {
    constructor() {
        this.init();
    }

    init() {
        // Seed initial data if empty
        if (!localStorage.getItem(STORE_KEYS.TICKETS)) {
            localStorage.setItem(STORE_KEYS.TICKETS, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORE_KEYS.CASES)) {
            localStorage.setItem(STORE_KEYS.CASES, JSON.stringify([]));
        }
        if (!localStorage.getItem(STORE_KEYS.OFFICER)) {
            localStorage.setItem(STORE_KEYS.OFFICER, JSON.stringify({
                name: 'Miller, James',
                badge: '8921',
                rank: 'Sergeant'
            }));
        }
    }

    // --- GENERIC CRUD ---
    getAll(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    add(key, item) {
        const data = this.getAll(key);
        item.id = crypto.randomUUID(); // Unique ID
        item.timestamp = new Date().toISOString();
        item.officer = this.getCurrentOfficer();
        data.unshift(item); // Add to top
        localStorage.setItem(key, JSON.stringify(data));
        return item;
    }

    // --- TICKETS ---
    getTickets() {
        return this.getAll(STORE_KEYS.TICKETS);
    }

    addTicket(ticketData) {
        // Calculate Points if Speeding
        if (ticketData.type === 'Speeding') {
            ticketData.points = this.calculateSpeedPoints(ticketData.speed, ticketData.limit, ticketData.isConstruction);
        }
        return this.add(STORE_KEYS.TICKETS, ticketData);
    }

    calculateSpeedPoints(speed, limit, isConstruction) {
        const diff = speed - limit;
        if (diff <= 0) return 0;

        let points = 0;
        if (diff >= 1 && diff <= 5) points = 1;
        else if (diff >= 6 && diff <= 15) points = 3;
        else if (diff >= 16 && diff <= 25) points = 4;
        else if (diff >= 26 && diff <= 35) points = 5;
        else if (diff >= 36 && diff <= 45) points = 6;
        else if (diff >= 46) points = 8;

        // Construction zones often add fines, points usually stay same but context matters.
        // For this system we will flag it.
        return points;
    }

    // --- CASES ---
    getCases() {
        return this.getAll(STORE_KEYS.CASES);
    }

    getCaseById(id) {
        const cases = this.getCases();
        return cases.find(c => c.id === id);
    }

    addCase(caseData) {
        // Initialize arrays
        caseData.evidence = [];
        caseData.chain = [];
        return this.add(STORE_KEYS.CASES, caseData);
    }

    addEvidence(caseId, fileData) {
        const cases = this.getCases();
        const caseIndex = cases.findIndex(c => c.id === caseId);

        if (caseIndex === -1) return null;

        // Create Evidence Object
        const evidenceItem = {
            id: 'EV-' + Math.floor(Math.random() * 10000),
            fileName: fileData.name,
            fileType: fileData.type,
            size: fileData.size,
            timestamp: new Date().toISOString(),
            status: 'SECURE',
            uploader: this.getCurrentOfficer().name
        };

        // Add to Case
        cases[caseIndex].evidence.unshift(evidenceItem);

        // Auto-Log to Chain of Custody
        const logEntry = {
            timestamp: new Date().toISOString(),
            user: this.getCurrentOfficer().name,
            badge: this.getCurrentOfficer().badge,
            action: `EVIDENCE CHECK-IN: ${evidenceItem.fileName}`,
            hash: crypto.randomUUID().split('-')[0] // Simulating a hash
        };

        if (!cases[caseIndex].chain) cases[caseIndex].chain = [];
        cases[caseIndex].chain.unshift(logEntry);

        // Save
        localStorage.setItem(STORE_KEYS.CASES, JSON.stringify(cases));
        return evidenceItem;
    }

    // --- OFFICER & USERS ---
    getCurrentOfficer() {
        return JSON.parse(localStorage.getItem(STORE_KEYS.OFFICER));
    }

    setCurrentOfficer(data) {
        localStorage.setItem(STORE_KEYS.OFFICER, JSON.stringify(data));
    }

    getAllOfficers() {
        const officers = JSON.parse(localStorage.getItem('rpd_all_officers_v1'));
        if (!officers) {
            // Seed defaults
            const defaults = [
                { id: '1', name: 'Miller, James', badge: '8921', rank: 'Sergeant', status: 'Active', clearance: 'L5' },
                { id: '2', name: 'Vance, Sarah', badge: '9921', rank: 'Detective', status: 'Active', clearance: 'L4' },
                { id: '3', name: 'Johnson, Mike', badge: '1102', rank: 'Officer', status: 'Suspended', clearance: 'L3' }
            ];
            localStorage.setItem('rpd_all_officers_v1', JSON.stringify(defaults));
            return defaults;
        }
        return officers;
    }

    addOfficer(data) {
        const officers = this.getAllOfficers();
        data.id = crypto.randomUUID();
        officers.push(data);
        localStorage.setItem('rpd_all_officers_v1', JSON.stringify(officers));
    }

    updateOfficerStatus(id, newStatus) {
        const officers = this.getAllOfficers();
        const idx = officers.findIndex(o => o.id === id);
        if (idx !== -1) {
            officers[idx].status = newStatus;
            localStorage.setItem('rpd_all_officers_v1', JSON.stringify(officers));
        }
    }

    // --- LOGS (Mocking centralized logs) ---
    getRecentLogs() {
        // Collects recent actions from tickets and cases for the Admin Audit
        const tickets = this.getTickets().map(t => ({
            timestamp: t.timestamp,
            user: t.officer.name,
            action: `ISSUED CITATION ${t.id.substring(0, 8)}`,
            type: 'TRAFFIC'
        }));

        const cases = this.getCases().flatMap(c => c.chain ? c.chain.map(ch => ({
            timestamp: ch.timestamp,
            user: ch.user,
            action: `CASE UPDATE: ${ch.action}`,
            type: 'EVIDENCE'
        })) : []);

        // Combine and Sort
        return [...tickets, ...cases].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
    }
}

export const db = new DataStore();
