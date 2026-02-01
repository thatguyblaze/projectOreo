import React from 'react';

const Home = () => {
    return (
        <div className="home-page">
            <section className="hero">
                <div className="hero-overlay">
                    <div className="container hero-content">
                        <h1>Commitment. Integrity. Service.</h1>
                        <p>Working together to build a safer community for everyone.</p>
                        <div className="hero-actions">
                            <button className="btn btn-primary">File a Report</button>
                            <button className="btn btn-secondary">Community Resources</button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="stats-bar">
                <div className="container stats-grid">
                    <div className="stat-item">
                        <span className="stat-number">24/7</span>
                        <span className="stat-label">Emergency Response</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">98%</span>
                        <span className="stat-label">Case Clearance Rate</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">Top 10</span>
                        <span className="stat-label">Safest Cities</span>
                    </div>
                </div>
            </section>

            <section className="container section-services">
                <h2 className="section-title">Department Services</h2>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="icon">📄</div>
                        <h3>Records Request</h3>
                        <p>Request public copies of accident reports and arrest records online.</p>
                    </div>
                    <div className="service-card">
                        <div className="icon">🔍</div>
                        <h3>Crime Mapping</h3>
                        <p>View real-time crime statistics and activity in your neighborhood.</p>
                    </div>
                    <div className="service-card">
                        <div className="icon">💼</div>
                        <h3>Careers</h3>
                        <p>Join our team. We are currently recruiting sworn officers and staff.</p>
                    </div>
                </div>
            </section>

            <style>{`
        .hero {
          background: linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.7)), url('https://placehold.co/1920x600/0f172a/ffffff?text=Metro+City+Skyline');
          background-size: cover;
          background-position: center;
          color: white;
          padding: 8rem 0;
          text-align: center;
        }

        .hero h1 {
          color: white;
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
        }

        .hero p {
          font-size: 1.25rem;
          max-width: 600px;
          margin: 0 auto 2.5rem;
          color: #e2e8f0;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          padding: 0.75rem 2rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 1rem;
          transition: transform 0.2s;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primary {
          background-color: var(--accent-blue);
          color: white;
        }

        .btn-secondary {
          background-color: transparent;
          border: 2px solid white;
          color: white;
        }

        .stats-bar {
          background-color: var(--primary-blue);
          padding: 2rem 0;
          color: white;
          margin-bottom: 4rem;
        }

        .stats-grid {
          display: flex;
          justify-content: space-around;
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-blue);
        }

        .stat-label {
          color: #cbd5e1;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .section-services {
          padding-bottom: 4rem;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .service-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-light);
          transition: box-shadow 0.3s;
        }

        .service-card:hover {
          box-shadow: var(--shadow-lg);
        }

        .service-card .icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .service-card h3 {
          margin-bottom: 0.5rem;
          color: var(--primary-blue);
        }

        .service-card p {
          color: var(--text-secondary);
        }
      `}</style>
        </div>
    );
};

export default Home;
