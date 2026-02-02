/* LOGIN MODULE v3 - OFFICIAL */
import { db } from '../store.js';

export function getTemplate() {
    return `
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5;">
            <div class="panel fade-in" style="width: 400px; padding: 2.5rem; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <i class="fa-solid fa-building-columns" style="font-size: 3rem; color: var(--gov-navy); margin-bottom: 1rem;"></i>
                    <h2 style="margin: 0; color: var(--text-primary); font-weight: 700;">Secure Portal</h2>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px;">Officer Authentication Required</div>
                </div>

                <form id="login-form">
                    <div class="input-group" style="margin-bottom: 1.5rem;">
                        <input type="text" id="badge-in" class="input-field" placeholder="Badge Number / Save Slot" style="padding: 12px; font-size: 1rem;" required>
                    </div>
                    
                    <div class="input-group" style="margin-bottom: 2rem;">
                        <input type="text" id="name-in" class="input-field" placeholder="Officer Name (For New Profile)" style="padding: 12px; font-size: 1rem;">
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; border-radius: 6px;">
                        Sign In / Start Shift
                    </button>
                    
                    <div id="login-error" class="hidden" style="margin-top: 1rem; color: #b91c1c; font-size: 0.85rem; text-align: center; padding: 10px; background: #fef2f2; border-radius: 4px;">
                        INVALID CREDENTIALS
                    </div>
                </form>

                <div style="margin-top: 2rem; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 1rem; color: var(--text-secondary); font-size: 0.75rem;">
                    Authorized Personnel Only.<br>Access is monitored and logged.
                </div>
            </div>
        </div>
    `;
}

export function init(onSuccess) {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const b = document.getElementById('badge-in').value.trim();
        const n = document.getElementById('name-in').value.trim();

        if (!b) return;

        // Gamified Login: Use badge as key, name as optional creator props
        // If badge exists, load it. If not, create it using name (or default).

        let profile = db.loadProfile(b, n);

        // Save it back to ensure it exists if new
        db.setCurrentOfficer(profile);
        db.saveProfile();

        // Success
        onSuccess(profile);
    });
}
