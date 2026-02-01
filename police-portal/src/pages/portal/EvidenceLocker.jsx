import React, { useState } from 'react';
import { evidenceData } from '../../data/mockEvidence';

const EvidenceLocker = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEvidence = evidenceData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caseId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="view-container">
            <header className="view-header">
                <div className="header-left">
                    <h2>Evidence Locker</h2>
                    <p>Secure custody chain management</p>
                </div>
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
                                <span className={`status-badge ${item.status.toLowerCase().replace(' ', '-')}`}>
                                    {item.status}
                                </span>
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

            <style>{`
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-left p { color: #64748b; font-size: 0.9rem; }
        .header-left h2 { margin: 0; font-size: 1.5rem; color: var(--primary-blue); }

        .actions { display: flex; gap: 1rem; }
        .search-input { padding: 0.6rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 300px; font-size: 0.9rem; }
        .btn-primary { background: var(--primary-blue); color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 6px; cursor: pointer; font-weight: 500; }

        .evidence-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .evidence-card { background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .evidence-card:hover { transform: translateY(-3px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        
        .card-image { height: 180px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        .card-image img { width: 100%; height: 100%; object-fit: cover; }
        
        .card-body { padding: 1.25rem; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .case-id { font-weight: 700; color: #64748b; font-size: 0.8rem; letter-spacing: 0.5px; }
        
        .status-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 99px; font-weight: 600; text-transform: uppercase; }
        .status-badge.in-custody { background: #dbeafe; color: #1e40af; }
        .status-badge.processed { background: #dcfce7; color: #166534; }
        .status-badge.at-lab { background: #fef9c3; color: #854d0e; }

        .evidence-card h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #1e293b; }
        .desc { font-size: 0.9rem; color: #64748b; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 3em; }
        
        .meta { border-top: 1px solid #f1f5f9; padding-top: 0.75rem; font-size: 0.8rem; color: #94a3b8; display: flex; justify-content: space-between; }
      `}</style>
        </div>
    );
};

export default EvidenceLocker;
