import React from 'react';
import { Folder, Filter, Plus } from 'lucide-react';

const mockCases = [
    { id: "CASE-8842", title: "Residential Burglary", officer: "Det. Brown", status: "Active", priority: "High", due: "Feb 10" },
    { id: "CASE-9921", title: "Vandalism Spree", officer: "Ofc. Doe", status: "Active", priority: "Med", due: "Feb 05" },
    { id: "CASE-7731", title: "Noise Complaint", officer: "Sgt. Smith", status: "Closed", priority: "Low", due: "Jan 28" },
    { id: "CASE-1024", title: "Hit and Run", officer: "Det. Brown", status: "Pending Flow", priority: "High", due: "Feb 15" },
];

const CaseManager = () => {
    return (
        <div className="cms-container">
            <div className="cms-toolbar">
                <div className="search-group">
                    <input type="text" placeholder="Search cases by ID or keyword..." className="cms-search" />
                    <button className="btn-icon"><Filter size={18} /></button>
                </div>
                <button className="btn-new-case"><Plus size={18} /> Open New Case</button>
            </div>

            <div className="kanban-board">
                <Column title="Active Investigation" status="Active" color="blue" />
                <Column title="Pending DA Review" status="Pending Flow" color="orange" />
                <Column title="Closed / Archived" status="Closed" color="green" />
            </div>

            <style>{`
        .cms-container { height: calc(100vh - 140px); display: flex; flex-direction: column; }
        
        .cms-toolbar {
          display: flex; justify-content: space-between; margin-bottom: 2rem;
        }
        .search-group { display: flex; gap: 0.5rem; }
        .cms-search {
          padding: 0.6rem 1rem; width: 320px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;
        }
        .btn-icon { background: white; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 6px; cursor: pointer; color: #64748b; }
        .btn-new-case {
          background: var(--primary-blue); color: white; border: none; padding: 0.6rem 1.25rem;
          border-radius: 6px; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
        }

        .kanban-board {
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; flex: 1; overflow-x: auto;
        }
        
        .kanban-column {
          background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column;
        }
        .column-header {
          padding: 1rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;
          border-top: 4px solid #cbd5e1; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between;
        }
        .header-blue { border-top-color: var(--accent-blue); }
        .header-orange { border-top-color: #f59e0b; }
        .header-green { border-top-color: #10b981; }

        .column-body { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; }

        .case-card {
          background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor: move; transition: transform 0.2s;
        }
        .case-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        
        .card-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .card-id { font-size: 0.75rem; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; }
        .priority-badge { font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
        .pri-High { background: #fee2e2; color: #991b1b; }
        .pri-Med { background: #ffedd5; color: #9a3412; }
        .pri-Low { background: #f1f5f9; color: #64748b; }

        .card-title { font-weight: 600; color: #1e293b; margin-bottom: 0.75rem; font-size: 0.95rem; }
        
        .card-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; margin-top: auto; }
        .due-date { color: #ef4444; font-weight: 500; }
      `}</style>
        </div>
    );
};

const Column = ({ title, status, color }) => {
    const cases = mockCases.filter(c => c.status === status);
    return (
        <div className="kanban-column">
            <div className={`column-header header-${color}`}>
                <span>{title}</span>
                <span className="count">{cases.length}</span>
            </div>
            <div className="column-body">
                {cases.map(c => (
                    <div className="case-card" key={c.id}>
                        <div className="card-header">
                            <span className="card-id">{c.id}</span>
                            <span className={`priority-badge pri-${c.priority}`}>{c.priority}</span>
                        </div>
                        <div className="card-title">{c.title}</div>
                        <div className="card-meta">
                            <span>{c.officer}</span>
                            {status !== 'Closed' && <span className="due-date">Due {c.due}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CaseManager;
