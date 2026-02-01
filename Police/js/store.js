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

    addCase(caseData) {
        return this.add(STORE_KEYS.CASES, caseData);
    }

    // --- OFFICER ---
    getCurrentOfficer() {
        return JSON.parse(localStorage.getItem(STORE_KEYS.OFFICER));
    }
}

export const db = new DataStore();
