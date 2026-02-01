export class AuthSystem {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.authLayer = document.getElementById('auth-layer');
        this.mainInterface = document.getElementById('main-interface');
        this.mfaPanel = document.getElementById('mfa-panel');
        this.mfaBtn = document.getElementById('mfa-btn');
        this.mfaInputs = document.querySelectorAll('.mfa-digit');
        
        this.init();
    }

    init() {
        // Toggle MFA Panel
        this.mfaBtn.addEventListener('click', () => {
            this.mfaPanel.classList.toggle('hidden');
            this.mfaBtn.classList.toggle('active');
        });

        // MFA Auto-focus logic
        this.mfaInputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                if (e.key >= 0 && e.key <= 9) {
                    if (index < this.mfaInputs.length - 1) {
                        this.mfaInputs[index + 1].focus();
                    }
                } else if (e.key === 'Backspace') {
                    if (index > 0) {
                        this.mfaInputs[index - 1].focus();
                    }
                }
            });
        });

        // Login Logic
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    handleLogin() {
        const btn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        // Simulating Auth Process
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AUTHENTICATING...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ACCESS GRANTED';
            btn.style.background = 'var(--success)';
            
            setTimeout(() => {
                this.authLayer.style.opacity = '0';
                this.authLayer.style.transition = 'opacity 0.5s ease';
                
                setTimeout(() => {
                    this.authLayer.classList.add('hidden');
                    this.mainInterface.classList.remove('hidden');
                    // Trigger entry animation
                    this.mainInterface.style.opacity = '0';
                    this.mainInterface.animate([
                        { opacity: 0, transform: 'scale(0.98)' },
                        { opacity: 1, transform: 'scale(1)' }
                    ], {
                        duration: 500,
                        fill: 'forwards',
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                    });
                }, 500);
            }, 800);
        }, 1500);
    }
}
