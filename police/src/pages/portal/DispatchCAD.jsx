import React from 'react';
import { MapPin, PhoneIncoming, Clock, ShieldAlert } from 'lucide-react';

const mockCalls = [
    { id: 1024, type: "Domestic Disturbance", priority: 1, location: "442 Maple Ave", time: "10:42", units: ["1-A", "1-B"], status: "On Scene" },
    { id: 1025, type: "Traffic Collision", priority: 2, location: "Main St & 5th Ave", time: "10:48", units: ["2-A", "EMS-1"], status: "En Route" },
    { id: 1026, type: "Suspicious Person", priority: 3, location: "Central Park West", time: "10:55", units: [], status: "Pending" },
    { id: 1027, type: "Shopifting", priority: 3, location: "Walmart - North Side", time: "11:02", units: [], status: "Pending" }
];

const units = [
    { id: "1-A", status: "Busy", location: "442 Maple" },
    { id: "1-B", status: "Busy", location: "442 Maple" },
    { id: "2-A", status: "En Route", location: "Main St" },
    { id: "2-B", status: "Available", location: "Sector 2" },
    { id: "3-A", status: "Available", location: "Sector 3" },
    { id: "K9-1", status: "Available", location: "HQ" },
];

const DispatchCAD = () => {
    return (
        <div className="cad-interface">
            <div className="cad-header">
                <h2>DISPATCH CONTROL <span className="live-indicator">● LIVE</span></h2>
                <div className="clock">11:05:22</div>
            </div>

            <div className="cad-grid">
                {/* Active Calls List */}
                <div className="cad-panel calls-panel">
                    <div className="panel-header">
                        <h3>Active Calls for Service</h3>
                        <button className="btn-cad small">+ New Call (F2)</button>
                    </div>
                    <table className="cad-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Pri</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Time</th>
                                <th>Units</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockCalls.map(call => (
                                <tr key={call.id} className={`priority-${call.priority}`}>
                                    <td>#{call.id}</td>
                                    <td><span className={`badge-pri p${call.priority}`}>{call.priority}</span></td>
                                    <td className="fw-bold">{call.type}</td>
                                    <td>{call.location}</td>
                                    <td>{call.time}</td>
                                    <td>{call.units.join(', ') || '-'}</td>
                                    <td><span className={`status-pill ${call.status.toLowerCase().replace(' ', '-')}`}>{call.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Map Placeholder */}
                <div className="cad-panel map-panel">
                    <div className="map-placeholder">
                        <MapPin size={48} className="map-icon" />
                        <span>Interactive AVL Map Module</span>
                    </div>
                </div>

                {/* Unit Status */}
                <div className="cad-panel units-panel">
                    <div className="panel-header">
                        <h3>Unit Status</h3>
                    </div>
                    <div className="unit-grid">
                        {units.map(unit => (
                            <div className={`unit-card ${unit.status.toLowerCase().replace(' ', '-')}`} key={unit.id}>
                                <span className="unit-id">{unit.id}</span>
                                <span className="unit-status">{unit.status}</span>
                                <span className="unit-loc">{unit.location}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        .cad-interface {
          background-color: #1e293b; /* Dark Slate Background for CAD */
          color: #e2e8f0;
          height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
          padding: 1rem;
          margin: -2rem; /* Negate default padding of layout */
        }

        .cad-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          background: #0f172a;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid var(--accent-blue);
        }
        .cad-header h2 { margin: 0; font-size: 1.25rem; letter-spacing: 1px; }
        .live-indicator { color: #ef4444; animation: blink 1.5s infinite; font-size: 0.8rem; vertical-align: middle; margin-left: 10px; }
        .clock { font-family: monospace; font-size: 1.5rem; font-weight: 700; color: var(--accent-blue); }

        .cad-grid {
          display: grid;
          grid-template-columns: 2fr 1fr; /* Calls take left, Map/Units take right */
          grid-template-rows: 2fr 1fr;
          gap: 1rem;
          flex: 1;
        }

        .cad-panel {
          background: #334155;
          border-radius: 6px;
          border: 1px solid #475569;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .calls-panel { grid-row: span 2; }
        
        .panel-header {
          background: #1e293b;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #475569;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .panel-header h3 { margin: 0; font-size: 0.95rem; text-transform: uppercase; color: #94a3b8; }

        .btn-cad { background: var(--accent-blue); border: none; color: white; border-radius: 4px; padding: 0.25rem 0.75rem; font-size: 0.8rem; cursor: pointer; }
        
        /* Table Styles */
        .cad-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .cad-table th { text-align: left; padding: 0.75rem; background: #28364d; color: #94a3b8; font-weight: 600; }
        .cad-table td { padding: 0.75rem; border-bottom: 1px solid #475569; }
        
        .badge-pri { display: inline-block; width: 24px; text-align: center; border-radius: 4px; font-weight: 700; color: white; }
        .p1 { background: #ef4444; }
        .p2 { background: #f97316; }
        .p3 { background: #10b981; }

        .status-pill { padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .status-pill.on-scene { background: #dbeafe; color: #1e40af; }
        .status-pill.en-route { background: #fef9c3; color: #854d0e; }
        .status-pill.pending { background: #fee2e2; color: #991b1b; }

        /* Map & Units */
        .map-panel {
          background: #0f172a;
          display: flex; align-items: center; justify-content: center;
        }
        .map-placeholder { text-align: center; color: #475569; }

        .unit-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; padding: 0.5rem; overflow-y: auto; }
        .unit-card { background: #1e293b; padding: 0.5rem; border-radius: 4px; display: flex; justify-content: space-between; border-left: 3px solid #64748b; font-size: 0.85rem; }
        .unit-card.busy { border-left-color: #ef4444; }
        .unit-card.available { border-left-color: #10b981; }
        
        .unit-id { font-weight: 700; color: white; }
        .unit-status { color: #cbd5e1; }
        
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
        </div>
    );
};

export default DispatchCAD;
