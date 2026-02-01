export function getTemplate() {
    return `
        <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            
            <div class="fade-in" style="width: 380px; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); padding: 2.5rem; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 12px; margin: 0 auto 1rem auto; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h2 style="color: white; font-weight: 700; font-size: 1.5rem; margin: 0; letter-spacing: -0.5px;">Smart Command</h2>
                    <div style="color: #94a3b8; font-size: 0.9rem; margin-top: 5px;">Rogersville Police Department</div>
                </div>

                <form id="login-form">
                    <div class="form-group">
                        <label style="color: #cbd5e1; font-size: 0.75rem;">BADGE ID</label>
                        <input type="text" name="badge" class="form-input" style="background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); color: white;" placeholder="e.g. 4921" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                         <label style="color: #cbd5e1; font-size: 0.75rem;">PASSWORD</label>
                        <input type="password" name="password" class="form-input" style="background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); color: white;" required>
                    </div>
                    
                    <div class="alert badge-danger hidden" id="login-error" style="text-align: center; margin-bottom: 1rem;">
                        Invalid Credentials
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; height: 48px; font-weight: 600; font-size: 1rem;">
                        <i class="fa-solid fa-lock"></i> Secure Login
                    </button>
                </form>

                <div style="text-align: center; margin-top: 2rem; color: #64748b; font-size: 0.8rem;">
                    Authorized Personnel Only<br>Access is logged and audited.
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

        // Mock Auth Logic
        if (data.get('password') === 'police') {
            // Success
            const user = {
                badge: data.get('badge'),
                name: 'Ofc. Miller', // Mock
                rank: 'Officer',
                initials: 'JM'
            };

            // Captain Mock
            if (data.get('badge') === '001') {
                user.name = 'Cpt. Harris';
                user.rank = 'Captain';
                user.initials = 'RH';
            }

            onSuccess(user);
        } else {
            error.classList.remove('hidden');
        }
    });
}
