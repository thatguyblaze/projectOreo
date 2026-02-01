import React from 'react';
import { rosterData } from '../../data/mockPortalData';

const DutyRoster = () => {
    return (
        <div className="view-container">
            <header className="view-header">
                <h2>Shift Roster - Watch A</h2>
                <div className="roster-stats">
                    <span className="tag on-duty">14 On Duty</span>
                    <span className="tag available">11 Available</span>
                </div>
            </header>

            <div className="table-container">
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
                                <td className="fw-bold">
                                    <div className="officer-name-cell">
                                        <div className="status-dot-sm" style={{ background: officer.status === 'On Duty' ? '#22c55e' : '#cbd5e1' }}></div>
                                        {officer.name}
                                    </div>
                                </td>
                                <td className="mono">{officer.badge}</td>
                                <td><span className="unit-badge">{officer.unit}</span></td>
                                <td>
                                    <span className={`status-pill ${officer.status.toLowerCase().replace(' ', '-')}`}>
                                        {officer.status}
                                    </span>
                                </td>
                                <td>{officer.location}</td>
                                <td><button className="btn-xs">Contact</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .view-header h2 { margin: 0; font-size: 1.5rem; color: var(--primary-blue); }

        .roster-stats { display: flex; gap: 0.5rem; }
        .tag { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.85rem; font-weight: 600; }
        .tag.on-duty { background: #dcfce7; color: #166534; }
        .tag.available { background: #e0f2fe; color: #0369a1; }

        .table-container { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
        .roster-table { width: 100%; border-collapse: collapse; text-align: left; }
        .roster-table th { background: #f8fafc; padding: 1rem; font-weight: 600; color: #64748b; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; }
        .roster-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; font-size: 0.95rem; }
        
        .officer-name-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
        .status-dot-sm { width: 8px; height: 8px; border-radius: 50%; }
        .mono { font-family: monospace; color: #64748b; }

        .unit-badge { background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; border: 1px solid #e2e8f0; }

        .status-pill { padding: 2px 8px; border-radius: 99px; font-size: 0.8rem; font-weight: 600; }
        .status-pill.on-duty { background: #dcfce7; color: #15803d; }
        .status-pill.off-duty { background: #f1f5f9; color: #94a3b8; }
        .status-pill.break { background: #fef9c3; color: #a16207; }

        .btn-xs { padding: 0.3rem 0.75rem; font-size: 0.8rem; background: transparent; border: 1px solid #cbd5e1; border-radius: 4px; color: #475569; cursor: pointer; transition: all 0.2s; }
        .btn-xs:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
      `}</style>
        </div>
    );
};

export default DutyRoster;
