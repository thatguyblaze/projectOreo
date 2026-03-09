// Created with <3 by Blazinik

const TreadzAuth = (() => {
    const STORAGE_KEY = 'treadz_employees';
    const SESSION_KEY = 'treadz_session';
    const MAX_FAILED_ATTEMPTS = 5;
    const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; 
    const LOCKOUT_DURATION_MS = 15 * 60 * 1000; 

    

    
    function generateSalt() {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    
    function generateToken() {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    
    async function hashPassword(password, salt) {
        const encoder = new TextEncoder();
        
        let data = encoder.encode(salt + password);

        
        for (let i = 0; i < 10000; i++) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            data = new Uint8Array(hashBuffer);
        }

        return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    

    function getEmployees() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Auth: Failed to load employees', e);
            return [];
        }
    }

    function saveEmployees(employees) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    }

    

    return {
        
        seedIfEmpty: async function (defaultId = '001', defaultPassword = 'Treadz2026!') {
            const employees = getEmployees();
            if (employees.length > 0) return; 

            const salt = generateSalt();
            const hash = await hashPassword(defaultPassword, salt);

            const owner = {
                id: defaultId,
                name: 'Owner',
                role: 'admin',
                salt: salt,
                hash: hash,
                locked: false,
                failedAttempts: 0,
                lockedUntil: null,
                createdAt: new Date().toISOString()
            };

            saveEmployees([owner]);
            console.log('Auth: Default owner account created (ID: ' + defaultId + ')');
        },

        
        login: async function (employeeId, password) {
            const employees = getEmployees();
            const emp = employees.find(e => e.id === employeeId);

            if (!emp) {
                
                return { success: false, error: 'Invalid credentials.' };
            }

            
            if (emp.locked && emp.lockedUntil) {
                const lockExpiry = new Date(emp.lockedUntil).getTime();
                if (Date.now() < lockExpiry) {
                    const minsLeft = Math.ceil((lockExpiry - Date.now()) / 60000);
                    return { success: false, error: `Account locked. Try again in ${minsLeft} min.` };
                } else {
                    
                    emp.locked = false;
                    emp.failedAttempts = 0;
                    emp.lockedUntil = null;
                }
            }

            
            const hash = await hashPassword(password, emp.salt);

            if (hash !== emp.hash) {
                
                emp.failedAttempts = (emp.failedAttempts || 0) + 1;
                if (emp.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                    emp.locked = true;
                    emp.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
                }
                saveEmployees(employees);

                const remaining = MAX_FAILED_ATTEMPTS - emp.failedAttempts;
                if (remaining <= 0) {
                    return { success: false, error: 'Account locked due to too many failed attempts. Wait 15 minutes.' };
                }
                return { success: false, error: `Invalid credentials. ${remaining} attempt(s) remaining.` };
            }

            
            emp.failedAttempts = 0;
            emp.locked = false;
            emp.lockedUntil = null;
            saveEmployees(employees);

            
            const session = {
                token: generateToken(),
                employeeId: emp.id,
                name: emp.name,
                role: emp.role,
                expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

            return {
                success: true,
                employee: { id: emp.id, name: emp.name, role: emp.role }
            };
        },

        
        checkSession: function () {
            try {
                const raw = sessionStorage.getItem(SESSION_KEY);
                if (!raw) return { valid: false };

                const session = JSON.parse(raw);
                if (new Date(session.expiresAt).getTime() < Date.now()) {
                    sessionStorage.removeItem(SESSION_KEY);
                    return { valid: false };
                }

                return {
                    valid: true,
                    employee: {
                        id: session.employeeId,
                        name: session.name,
                        role: session.role
                    }
                };
            } catch {
                return { valid: false };
            }
        },

        
        logout: function () {
            sessionStorage.removeItem(SESSION_KEY);
        },

        
        getCurrentUser: function () {
            const s = this.checkSession();
            return s.valid ? s.employee.name : 'Unknown';
        },

        
        getCurrentRole: function () {
            const s = this.checkSession();
            return s.valid ? s.employee.role : null;
        },

        

        
        addEmployee: async function (id, name, password, role = 'employee') {
            if (!id || !name || !password) {
                return { success: false, error: 'All fields are required.' };
            }
            if (password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters.' };
            }

            const employees = getEmployees();
            if (employees.find(e => e.id === id)) {
                return { success: false, error: 'An employee with this ID already exists.' };
            }

            const salt = generateSalt();
            const hash = await hashPassword(password, salt);

            employees.push({
                id: id,
                name: name,
                role: role,
                salt: salt,
                hash: hash,
                locked: false,
                failedAttempts: 0,
                lockedUntil: null,
                createdAt: new Date().toISOString()
            });

            saveEmployees(employees);
            return { success: true };
        },

        
        removeEmployee: function (id) {
            const session = this.checkSession();
            if (session.valid && session.employee.id === id) {
                return { success: false, error: 'Cannot remove your own account.' };
            }

            const employees = getEmployees();
            const filtered = employees.filter(e => e.id !== id);

            if (filtered.length === employees.length) {
                return { success: false, error: 'Employee not found.' };
            }

            
            const adminsLeft = filtered.filter(e => e.role === 'admin');
            if (adminsLeft.length === 0) {
                return { success: false, error: 'Cannot remove the last admin account.' };
            }

            saveEmployees(filtered);
            return { success: true };
        },

        
        resetPassword: async function (id, newPassword) {
            if (!newPassword || newPassword.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters.' };
            }

            const employees = getEmployees();
            const emp = employees.find(e => e.id === id);
            if (!emp) return { success: false, error: 'Employee not found.' };

            const salt = generateSalt();
            const hash = await hashPassword(newPassword, salt);

            emp.salt = salt;
            emp.hash = hash;
            emp.locked = false;
            emp.failedAttempts = 0;
            emp.lockedUntil = null;

            saveEmployees(employees);
            return { success: true };
        },

        
        unlockEmployee: function (id) {
            const employees = getEmployees();
            const emp = employees.find(e => e.id === id);
            if (!emp) return { success: false, error: 'Employee not found.' };

            emp.locked = false;
            emp.failedAttempts = 0;
            emp.lockedUntil = null;

            saveEmployees(employees);
            return { success: true };
        },

        
        listEmployees: function () {
            return getEmployees().map(e => ({
                id: e.id,
                name: e.name,
                role: e.role,
                locked: e.locked || false,
                failedAttempts: e.failedAttempts || 0,
                createdAt: e.createdAt
            }));
        }
    };
})();