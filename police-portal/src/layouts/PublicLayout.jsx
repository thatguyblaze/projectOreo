import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Phone } from 'lucide-react';

const PublicLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="public-layout">
            {/* Emergency Ribbon */}
            <div className="emergency-ribbon">
                <div className="container flex-between">
                    <span><strong>EMERGENCY: DIAL 9-1-1</strong> &nbsp;| &nbsp;Non-Emergency: (555) 012-3456</span>
                    <span className="ribbon-link">Anonymous Tip Line available 24/7</span>
                </div>
            </div>

            {/* Navigation */}
            <header className="main-header">
                <div className="container nav-container">
                    <Link to="/" className="brand-lockup">
                        <Shield className="brand-icon" size={32} />
                        <div className="brand-text">
                            <span className="dept-name">METRO CITY</span>
                            <span className="dept-label">POLICE DEPARTMENT</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="desktop-nav">
                        <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                        <Link to="/news" className={`nav-link ${isActive('/news')}`}>News & Alerts</Link>
                        <Link to="/resources" className={`nav-link ${isActive('/resources')}`}>Services</Link>
                        <Link to="/careers" className={`nav-link ${isActive('/careers')}`}>Join the Force</Link>
                        <Link to="/portal" className="portal-btn">Officer Login</Link>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main>
                <Outlet />
            </main>

            {/* Professional Footer */}
            <footer className="main-footer">
                <div className="container footer-grid">
                    <div className="footer-col brand-col">
                        <Shield size={48} className="footer-logo" />
                        <p>Committed to excellence, integrity, and community service since 1954.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <Link to="/resources">File a Report</Link>
                        <Link to="/news">Press Releases</Link>
                        <Link to="/careers">Recruitment</Link>
                        <Link to="/privacy">Privacy Policy</Link>
                    </div>
                    <div className="footer-col">
                        <h4>Contact</h4>
                        <p>100 Justice Way<br />Metro City, ST 90210</p>
                        <p>hq@metropolice.gov</p>
                    </div>
                    <div className="footer-col">
                        <h4>Connect</h4>
                        <div className="social-links">
                            {/* Mock Social Icons */}
                            <span className="social-icon">𝕏</span>
                            <span className="social-icon">fb</span>
                            <span className="social-icon">ig</span>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Metro City Police Department. All Rights Reserved.</p>
                </div>
            </footer>

            <style>{`
        .public-layout { min-height: 100vh; display: flex; flex-direction: column; }
        
        .emergency-ribbon {
          background-color: #b91c1c;
          color: white;
          padding: 0.5rem 0;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }

        .main-header {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 80px;
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--primary-blue);
          text-decoration: none;
        }

        .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
        .dept-name { font-weight: 800; letter-spacing: 0.5px; font-size: 1.1rem; }
        .dept-label { font-size: 0.75rem; font-weight: 500; letter-spacing: 2px; color: var(--text-secondary); }

        .desktop-nav { display: flex; gap: 2rem; align-items: center; }
        .nav-link {
          font-weight: 500;
          color: var(--text-main);
          font-size: 0.95rem;
          padding: 0.5rem 0;
          position: relative;
        }
        .nav-link:hover, .nav-link.active { color: var(--accent-blue); }
        .nav-link.active::after {
          content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: var(--accent-blue);
        }

        .portal-btn {
          background: var(--primary-blue);
          color: white;
          padding: 0.6rem 1.25rem;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.9rem;
          transition: background 0.2s;
        }
        .portal-btn:hover { background: var(--primary-light); }

        .main-footer { background: var(--primary-blue); color: white; padding-top: 4rem; margin-top: auto; }
        .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
        .footer-col h4 { color: white; margin-bottom: 1.25rem; font-size: 1.1rem; }
        .footer-col a, .footer-col p { display: block; color: #94a3b8; margin-bottom: 0.75rem; font-size: 0.95rem; }
        .footer-col a:hover { color: white; }
        
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 1.5rem 0; text-align: center; color: #64748b; font-size: 0.85rem; }
      `}</style>
        </div>
    );
};

export default PublicLayout;
