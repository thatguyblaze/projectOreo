import React from 'react';

const Layout = ({ children, setPage }) => {
    return (
        <div className="layout">
            <header className="navbar">
                <div className="container nav-container">
                    <div className="logo" onClick={() => setPage('home')}>
                        <div className="badge-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <span className="dept-name">METRO <strong>POLICE</strong></span>
                    </div>

                    <nav className="nav-links">
                        <button onClick={() => setPage('home')} className="nav-link">Home</button>
                        <button className="nav-link">About</button>
                        <button className="nav-link">Services</button>
                        <button onClick={() => setPage('portal')} className="nav-link active">Officer Portal</button>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                {children}
            </main>

            <footer className="footer">
                <div className="container footer-content">
                    <div className="footer-col">
                        <h4>Metro Police Dept.</h4>
                        <p>Serving the community with integrity and transparency.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Contact</h4>
                        <p>Emergency: 911</p>
                        <p>Non-Emergency: 555-0123</p>
                    </div>
                    <div className="footer-col">
                        <h4>Secure Access</h4>
                        <button className="link-btn" onClick={() => setPage('portal')}>Evidence Entry</button>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Metro Police Department. Official Government Website.</p>
                </div>
            </footer>

            <style>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .navbar {
          background-color: var(--primary-blue);
          color: white;
          padding: 1rem 0;
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          cursor: pointer;
        }

        .badge-icon {
          color: var(--accent-blue);
        }

        .dept-name {
          letter-spacing: 0.5px;
        }
        
        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          background: none;
          color: var(--text-inverse);
          opacity: 0.8;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
        }

        .nav-link:hover {
          opacity: 1;
          background: rgba(255,255,255,0.1);
        }

        .nav-link.active {
          opacity: 1;
          color: var(--accent-blue);
          background: rgba(14, 165, 233, 0.1);
        }

        .main-content {
          flex: 1;
          padding-bottom: 2rem;
        }

        .footer {
          background-color: var(--primary-light);
          color: white;
          padding: 3rem 0 1rem;
          margin-top: auto;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer h4 {
          color: white;
          margin-bottom: 1rem;
        }

        .footer p {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .link-btn {
          background: none;
          color: var(--accent-blue);
          text-decoration: underline;
          padding: 0;
          font-size: 0.9rem;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 1rem;
          text-align: center;
          font-size: 0.8rem;
          color: #64748b;
        }
      `}</style>
        </div>
    );
};

export default Layout;
