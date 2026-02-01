import React, { useState } from 'react';
import { evidenceData } from '../data/mockEvidence';
import { boloData, rosterData } from '../data/mockPortalData';

const Portal = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    // Search Logic
    const filteredEvidence = evidenceData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caseId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="portal-container">
            {/* Sidebar Navigation */}
            <aside className="portal-sidebar">
                <div className="user-profile">
                    <div className="avatar">JD</div>
                    <div className="user-info">
                        <span className="name">Officer J. Doe</span>
                        <span className="badge">Badge #4492</span>
                    </div>
                </div>

                <nav className="portal-nav">
                    <NavButton id="dashboard" label="Dashboard" icon="📊" active={activeTab} set={setActiveTab} />
                    <NavButton id="evidence" label="Evidence Locker" icon="📦" active={activeTab} set={setActiveTab} />
                    <NavButton id="reports" label="Report Writer" icon="📝" active={activeTab} set={setActiveTab} />
                    <NavButton id="roster" label="Duty Roster" icon="👥" active={activeTab} set={setActiveTab} />
                    <NavButton id="bolo" label="Active BOLOs" icon="🚨" active={activeTab} set={setActiveTab} />
                    <div className="nav-divider"></div>
                    <NavButton id="settings" label="Settings" icon="⚙️" active={activeTab} set={setActiveTab} />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="portal-main">

                {/* DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
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
                                    <button className="btn-action" onClick={() => setActiveTab('reports')}>Draft New Report</button>
                                    <button className="btn-action secondary">Vehicle Checkout</button>
                                    <button className="btn-action secondary">Upload Media</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* EVIDENCE LOCKER VIEW */}
                {activeTab === 'evidence' && (
                    <div className="view-container animate-fade">
                        <header className="view-header">
                            <h2>Evidence Locker</h2>
                            <div className="actions">
                                <input
                                    type="text"
                                    placeholder="Search case ID or keywords..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button className="btn-primary">+ Check-in Item</button>
                            </div>
                        </header>

                        <div className="evidence-grid">
                            {filteredEvidence.map(item => (
                                <div className="evidence-card" key={item.id}>
                                    <div className="card-image">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.title} />
                                        ) : (
                                            <div className="img-placeholder">{item.type}</div>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <div className="card-top">
                                            <span className="case-id">{item.caseId}</span>
                                            <StatusBadge status={item.status} />
                                        </div>
                                        <h4>{item.title}</h4>
                                        <p className="desc">{item.description}</p>
                                        <div className="meta">
                                            <span>Logged: {item.dateAcquired}</span>
                                            <span>By: {item.officer}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* REPORTS VIEW */}
                {activeTab === 'reports' && (
                    <div className="view-container animate-fade">
                        <header className="view-header">
                            <h2>Incident Reporting System</h2>
                            <span className="draft-status">Draft Auto-saved: 10:45 AM</span>
                        </header>

                        <div className="report-form-container panel">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Case Number (Auto)</label>
                                    <input type="text" value="CASE-2024-XP92" disabled className="input-disabled" />
                                </div>
                                <div className="form-group">
                                    <label>Incident Type</label>
                                    <select>
                                        <option>Select Type...</option>
                                        <option>Theft / Burglary</option>
                                        <option>Traffic Collision</option>
                                        <option>Assault</option>
                                        <option>Public Disturbance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input type="text" placeholder="123 Main St..." />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Narrative</label>
                                <textarea rows="10" placeholder="Enter detailed description of events..."></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Involved Parties</label>
                                    <button className="btn-secondary small">+ Add Person</button>
                                </div>
                                <div className="form-group">
                                    <label>Attachments</label>
                                    <button className="btn-secondary small">+ Upload Evidence</button>
                                </div>
                            </div>

                            <div className="form-actions-footer">
                                <button className="btn-text">Discard Draft</button>
                                <div className="right-btns">
                                    <button className="btn-secondary">Save Draft</button>
                                    <button className="btn-primary">Submit for Approval</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ROSTER VIEW */}
                {activeTab === 'roster' && (
                    <div className="view-container animate-fade">
                        <header className="view-header">
                            <h2>Shift Roster - Watch A</h2>
                            <div className="roster-stats">
                                <span className="tag on-duty">14 On Duty</span>
                                <span className="tag available">11 Available</span>
                            </div>
                        </header>

                        <div className="roster-table-container panel">
                            <table className="roster-table">
                                <thead>
                                    <tr>
                                        <th>Officer</th>
                                        <th>Badge</th>
                                        <th>Unit Assignment</th>
                                        <th>Current Status</th>
                                        <th>Location / Sector</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rosterData.map(officer => (
                                        <tr key={officer.id}>
                                            <td className="fw-bold">{officer.name}</td>
                                            <td>{officer.badge}</td>
                                            <td><span className="unit-badge">{officer.unit}</span></td>
                                            <td>
                                                <span className={`status-dot ${officer.status.toLowerCase().replace(' ', '-')}`}></span>
                                                {officer.status}
                                            </td>
                                            <td>{officer.location}</td>
                                            <td><button className="btn-xs">Contact</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* BOLO VIEW */}
                {activeTab === 'bolo' && (
                    <div className="view-container animate-fade">
                        <header className="view-header">
                            <h2>Be On The Lookout (BOLO)</h2>
                            <button className="btn-alert">+ Issue New Alert</button>
                        </header>

                        <div className="bolo-grid">
                            {boloData.map(bolo => (
                                <div className={`bolo-card ${bolo.priority.toLowerCase()}`} key={bolo.id}>
                                    <div className="bolo-header">
                                        <span className="bolo-type">{bolo.type}</span>
                                        <span className="bolo-priority">{bolo.priority} Priority</span>
                                    </div>
                                    <div className="bolo-content">
                                        <img src={bolo.imageUrl} alt="Subject" className="bolo-img" />
                                        <div className="bolo-details">
                                            <h3>{bolo.subject}</h3>
                                            <p className="bolo-desc">{bolo.description}</p>
                                            <div className="bolo-meta">
                                                <small>Last Seen: {bolo.lastSeen}</small>
                                                <span className={`bolo-status status-${bolo.status.toLowerCase()}`}>{bolo.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>

            {/* Styled JSX Styles */}
            <style>{`
        .portal-container {
          display: flex;
          height: calc(100vh - 70px);
          background-color: #f1f5f9;
          font-family: 'Inter', sans-serif;
        }

        /* Sidebar */
        .portal-sidebar {
          width: 280px;
          background-color: #ffffff;
          border-right: 1px solid #cbd5e1;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          box-shadow: 2px 0 10px rgba(0,0,0,0.02);
          z-index: 10;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .avatar {
          width: 50px;
          height: 50px;
          background: var(--primary-blue);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .user-info { display: flex; flex-direction: column; }
        .user-info .name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
        .user-info .badge { font-size: 0.8rem; color: #64748b; }

        .portal-nav { display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-divider { height: 1px; background: #e2e8f0; margin: 1rem 0; }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .menu-item:hover { background-color: #f8fafc; color: #1e293b; }
        .menu-item.active { background-color: #e0f2fe; color: var(--accent-blue); font-weight: 600; }
        .menu-item .icon { font-size: 1.2rem; min-width: 24px; }

        /* Main Area */
        .portal-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
          background: #f8fafc;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .view-header h2 { color: #0f172a; margin: 0; font-size: 1.8rem; }
        .view-header .date { color: #64748b; font-weight: 500; }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .kpi-card {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        }
        .kpi-card.alert { border-left: 4px solid var(--status-warning); }

        .kpi-top { display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #64748b; font-size: 0.9rem; }
        .kpi-value { font-size: 2rem; font-weight: 700; color: #0f172a; }

        /* Panels */
        .panel {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .dashboard-split { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        .dashboard-split h3 { font-size: 1.1rem; margin-bottom: 1rem; color: #334155; }

        .activity-list { list-style: none; padding: 0; }
        .activity-item { 
          display: flex; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; 
          font-size: 0.95rem; color: #334155;
        }
        .activity-item .time { color: #94a3b8; font-size: 0.85rem; min-width: 70px; font-weight: 500;}

        /* Buttons */
        .btn-primary { background: var(--primary-blue); color: white; padding: 0.5rem 1.2rem; border-radius: 6px; font-weight: 500; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #334155; padding: 0.5rem 1.2rem; border-radius: 6px; }
        .btn-alert { background: #fee2e2; color: #b91c1c; padding: 0.5rem 1.2rem; border-radius: 6px; font-weight: 600; border: 1px solid #fecaca; }
        .action-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
        .btn-action { padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; background: #0f172a; color: white; text-align: center; }
        .btn-action.secondary { background: white; color: #334155; }

        /* Reports Form */
        .report-form-container { max-width: 900px; margin: 0 auto; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .form-group label { font-size: 0.9rem; font-weight: 600; color: #475569; }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; outline: none;
        }
        .input-disabled { background: #f1f5f9; color: #94a3b8; }
        .form-actions-footer { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
        .right-btns { display: flex; gap: 1rem; }

        /* Roster Table */
        .roster-stats { display: flex; gap: 1rem; }
        .tag { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.85rem; font-weight: 600; }
        .tag.on-duty { background: #dcfce7; color: #166534; }
        .tag.available { background: #e0f2fe; color: #0369a1; }
        
        .roster-table { width: 100%; border-collapse: collapse; }
        .roster-table th { text-align: left; padding: 1rem; color: #64748b; font-weight: 500; font-size: 0.9rem; border-bottom: 2px solid #e2e8f0; }
        .roster-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; vertical-align: middle; }
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .status-dot.on-duty { background: #22c55e; }
        .status-dot.break { background: #eab308; }
        .status-dot.off-duty { background: #cbd5e1; }
        .unit-badge { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; }
        .btn-xs { padding: 0.25rem 0.75rem; font-size: 0.8rem; background: transparent; border: 1px solid #cbd5e1; border-radius: 4px; }

        /* BOLO Grid */
        .bolo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .bolo-card { background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .bolo-card.critical { border-top: 4px solid #ef4444; }
        .bolo-card.high { border-top: 4px solid #f97316; }
        
        .bolo-header { display: flex; justify-content: space-between; padding: 1rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
        .bolo-type { font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 0.85rem; }
        .bolo-priority { font-size: 0.8rem; font-weight: 600; color: #ef4444; }
        
        .bolo-content { display: flex; padding: 1rem; gap: 1rem; }
        .bolo-img { width: 80px; height: 80px; border-radius: 6px; object-fit: cover; }
        .bolo-details h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
        .bolo-desc { font-size: 0.9rem; color: #475569; margin-bottom: 0.75rem; line-height: 1.4; }
        .bolo-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #94a3b8; }
        .bolo-status { font-weight: 700; text-transform: uppercase; }
        .status-active { color: #dc2626; }
        .status-resolved { color: #166534; }

        /* Evidence (Kept from before but refined) */
        .actions { display: flex; gap: 1rem; }
        .search-input { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 300px; }
        .evidence-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
        .evidence-card { background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; transition: transform 0.2s; }
        .evidence-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .card-image img { width: 100%; height: 160px; object-fit: cover; }
        .card-body { padding: 1rem; }
        .card-top { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; }
        .case-id { font-weight: 600; color: #64748b; }
        .status-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; background: #f1f5f9; color: #475569; }
        
        .animate-fade { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
};

// Sub Components for Cleanliness
const NavButton = ({ id, label, icon, active, set }) => (
    <button className={`menu-item ${active === id ? 'active' : ''}`} onClick={() => set(id)}>
        <span className="icon">{icon}</span>
        {label}
    </button>
);

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

const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>
        {status}
    </span>
);

export default Portal;
