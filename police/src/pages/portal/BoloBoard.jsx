import React from 'react';
import { boloData } from '../../data/mockPortalData';

const BoloBoard = () => {
    return (
        <div className="view-container">
            <header className="view-header">
                <div className="header-left">
                    <h2>BOLO Board</h2>
                    <p>Active Be On The Lookout Alerts (Confidential)</p>
                </div>
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

            <style>{`
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-left p { color: #64748b; font-size: 0.9rem; margin-left: 0.2rem; }
        .header-left h2 { margin: 0; font-size: 1.5rem; color: var(--primary-blue); display: flex; align-items: center; gap: 0.5rem; }
        
        .btn-alert { background: #fee2e2; color: #b91c1c; padding: 0.6rem 1.25rem; border-radius: 6px; font-weight: 600; border: 1px solid #fecaca; cursor: pointer; }
        
        .bolo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
        
        .bolo-card { background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: box-shadow 0.2s; }
        .bolo-card:hover { box-shadow: 0 5px 10px rgba(0,0,0,0.1); }
        .bolo-card.critical { border-top: 4px solid #ef4444; }
        .bolo-card.high { border-top: 4px solid #f97316; }
        .bolo-card.low { border-top: 4px solid #10b981; }
        
        .bolo-header { display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
        .bolo-type { font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
        .bolo-priority { font-size: 0.75rem; font-weight: 700; color: #ef4444; text-transform: uppercase; }
        
        .bolo-content { display: flex; padding: 1rem; gap: 1.25rem; }
        .bolo-img { width: 100px; height: 100px; border-radius: 6px; object-fit: cover; background: #cbd5e1; }
        
        .bolo-details { flex: 1; display: flex; flex-direction: column; }
        .bolo-details h3 { font-size: 1.2rem; margin: 0 0 0.5rem 0; color: #1e293b; }
        .bolo-desc { font-size: 0.95rem; color: #475569; margin-bottom: 1rem; line-height: 1.5; flex: 1; }
        
        .bolo-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
        .bolo-status { font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
        .status-active { color: #dc2626; }
        .status-resolved { color: #166534; }
      `}</style>
        </div>
    );
};

export default BoloBoard;
