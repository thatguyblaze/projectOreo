import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [badge, setBadge] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for realism
        setTimeout(() => {
            const result = login(badge, password);
            if (result.success) {
                navigate('/portal');
            } else {
                setError(result.message);
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="brand-header">
                    <Shield size={48} className="logo-icon" />
                    <h1>METRO POLICE</h1>
                    <p>SECURE OFFICER INTRANET</p>
                </div>

                <div className="login-card">
                    <div className="security-banner">
                        <Lock size={14} /> AUTHORIZED PERSONNEL ONLY
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Badge Number</label>
                            <input
                                type="text"
                                value={badge}
                                onChange={(e) => setBadge(e.target.value)}
                                placeholder="Ex. 4492"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="error-msg">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Secure Login'}
                        </button>
                    </form>

                    <p className="disclaimer">
                        Unauthorized access to this system is a federal offense.
                        All activities are monitored and logged.
                    </p>
                </div>

                <div className="footer-links">
                    <a href="#">Forgot Password?</a>
                    <span>&bull;</span>
                    <a href="#">IT Support</a>
                </div>
            </div>

            <style>{`
        .login-page {
          min-height: 100vh;
          background-color: #0f172a;
          background-image: 
            radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.15) 0px, transparent 50%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .brand-header {
          text-align: center;
          color: white;
          margin-bottom: 2rem;
        }
        .logo-icon { color: var(--accent-blue); margin-bottom: 1rem; }
        .brand-header h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: 1px; margin: 0; }
        .brand-header p { color: #94a3b8; font-size: 0.85rem; font-weight: 600; letter-spacing: 2px; margin-top: 0.5rem; }

        .login-card {
          background: white;
          border-radius: 12px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .security-banner {
          background: #f1f5f9;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 700;
          text-align: center;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
          letter-spacing: 0.5px;
        }

        form { padding: 2rem; }

        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus { outline: none; border-color: var(--accent-blue); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1); }

        .btn-login {
          width: 100%;
          padding: 0.85rem;
          background: var(--primary-blue);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-login:hover { background: #1e293b; }
        .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

        .error-msg {
          background: #fee2e2; color: #991b1b;
          padding: 0.75rem; border-radius: 6px; font-size: 0.9rem;
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .disclaimer {
          padding: 0 2rem 2rem;
          font-size: 0.75rem;
          color: #94a3b8;
          text-align: center;
          line-height: 1.5;
        }

        .footer-links {
          margin-top: 1.5rem;
          display: flex;
          gap: 1rem;
          color: #64748b;
          font-size: 0.85rem;
        }
        .footer-links a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: white; }
      `}</style>
        </div>
    );
};

export default Login;
