export function getTemplate() {
    return `
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a;">
            <div style="width: 400px; background: #fff; padding: 2rem; border: 1px solid #94a3b8; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <i class="fa-solid fa-building-columns" style="font-size: 3rem; color: #002344; margin-bottom: 1rem;"></i>
                    <h2 class="serif" style="color: #002344; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Rogersville Police</h2>
                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">OFFICIAL USE ONLY | AUTHORIZED PERSONNEL</div>
                </div>

                <form id="login-form">
                    <div class="form-group">
                        <label style="font-weight: bold; font-family: 'Merriweather', serif;">Badge Number</label>
                        <input type="text" name="badge" class="form-input" style="border-radius: 0; border: 1px solid #94a3b8;" placeholder="e.g. 4921" required>
                    </div>
                    <div class="form-group">
                        <label style="font-weight: bold; font-family: 'Merriweather', serif;">Password</label>
                        <input type="password" name="password" class="form-input" style="border-radius: 0; border: 1px solid #94a3b8;" required>
                    </div>
                    
                    <div class="alert badge-danger hidden" id="login-error" style="border-radius: 0; margin-bottom: 1rem;">
                        <i class="fa-solid fa-triangle-exclamation"></i> Invalid Credentials
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; border-radius: 0; height: 44px; font-weight: bold; text-transform: uppercase;">
                        system login
                    </button>
                </form>

                <div style="margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                    Access to this system is monitored and audited.<br>
                    Unauthorized access is a felony violation of TCA § 39-14-602.
                </div>
            </div>
        </div>
    `;
}

export function init(onSuccess) {
    const form = document.getElementById('login-form');
    const error = document.getElementById('login-error');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(e.target);

        // Simulating Auth - Check against 'store.js' data would be better but keeping it simple/mock for now
        // Any Badge + "police" works for now, or match specific Rank logic later.

        // Mock Auth Logic
        if (data.get('password') === 'police') {
            // Success
            const user = {
                badge: data.get('badge'),
                name: 'OFFICER SESSION', // In real app, look up name
                rank: 'Officer' // Default
            };

            // Check for ADMIN override
            if (data.get('badge') === '001') {
                user.name = 'CPT. HARRIS';
                user.rank = 'Captain';
            }

            onSuccess(user);
        } else {
            error.classList.remove('hidden');
        }
    });
}
