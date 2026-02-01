import React from 'react';

const PortalDashboard = () => {
    return (
        <div className="view-container animate-fade">
            <header className="view-header">
                <h2>Morning Briefing</h2>
                <span className="date">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </header>

            <div className="kpi-grid">
                <KpiCard title="Active Incidents" value="12" icon="🔥" />
                <KpiCard title="Reports Pending" value="5" icon="📄" isAlert />
                <KpiCard title="Units on Patrol" value="8" icon="🚓" />
                <KpiCard title="Clearance Rate" value="94%" icon="📈" />
            </div>

            <div className="dashboard-split">
                <div className="panel recent-activity">
                    <h3>Department Activity Log</h3>
                    <ul className="activity-list">
                        <ActivityItem time="10:42 AM" text="Unit 1-A initiated traffic stop at 4th & Elm." />
                        <ActivityItem time="10:15 AM" text="Case #9921 updated with new forensic data." />
                        <ActivityItem time="09:30 AM" text="BOLO issued for subject matching description in Sector 4." />
                        <ActivityItem time="08:00 AM" text="Shift briefing completed. All units deployed." />
                    </ul>
                </div>
                <div className="panel quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons">
                        <button className="btn-action">Vehicle Checkout</button>
                        <button className="btn-action secondary">Radio Channel 4</button>
                        <button className="btn-action secondary">Upload Media</button>
                    </div>
                </div>
            </div>

            <style>{`
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .kpi-card { background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .kpi-card.alert { border-left: 4px solid #f59e0b; }
        .kpi-top { display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #64748b; font-size: 0.9rem; }
        .kpi-value { font-size: 2rem; font-weight: 700; color: #0f172a; }
        
        .dashboard-split { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        .panel { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
        .activity-item { display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
        .activity-item .time { color: #94a3b8; font-size: 0.85rem; min-width: 70px; font-weight: 500; }
        
        .action-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
        .btn-action { padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #0f172a; color: white; text-align: center; font-weight: 500; }
        .btn-action.secondary { background: white; color: #334155; }
        
        @media (max-width: 768px) { .dashboard-split { grid-template-columns: 1fr; } }
      `}</style>
        </div>
    );
};

const KpiCard = ({ title, value, icon, isAlert }) => (
    <div className={`kpi-card ${isAlert ? 'alert' : ''}`}>
        <div className="kpi-top">
            <span>{title}</span>
            <span>{icon}</span>
        </div>
        <span className="kpi-value">{value}</span>
    </div>
);

const ActivityItem = ({ time, text }) => (
    <li className="activity-item">
        <span className="time">{time}</span>
        <span className="desc">{text}</span>
    </li>
);

export default PortalDashboard;
