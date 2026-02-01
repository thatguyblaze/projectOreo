import React, { useState, useRef } from 'react';
// import { useReactToPrint } from 'react-to-print'; // Removed to avoid dependency issue
import { Printer, RotateCcw, Save } from 'lucide-react';

const commonViolations = [
    { code: "TR-401", desc: "Speeding (1-10 MPH over)", fine: 120.00, points: 2 },
    { code: "TR-402", desc: "Speeding (11-20 MPH over)", fine: 250.00, points: 4 },
    { code: "TR-305", desc: "Running Red Light / Stop Sign", fine: 180.00, points: 3 },
    { code: "TR-210", desc: "Expired Registration", fine: 85.00, points: 0 },
    { code: "PK-101", desc: "Parking - No Parking Zone", fine: 55.00, points: 0 },
    { code: "PK-104", desc: "Parking - Fire Hydrant", fine: 110.00, points: 0 },
];

const TicketWriter = () => {
    const [mode, setMode] = useState('traffic'); // traffic, warning, civil
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 16),
        violatorName: '',
        violatorDL: '',
        violatorAddress: '',
        vehiclePlate: '',
        vehicleMake: '',
        vehicleColor: '',
        location: '',
        violationCode: '',
        violationDesc: '',
        fineAmount: '',
        courtDate: '2024-03-15', // Default 45 days out
        notes: ''
    });

    const handlePrint = () => {
        window.print();
    };

    const handleCommonSelect = (e) => {
        const code = e.target.value;
        if (!code) return;
        const violation = commonViolations.find(v => v.code === code);
        if (violation) {
            setFormData(prev => ({
                ...prev,
                violationCode: violation.code,
                violationDesc: violation.desc,
                fineAmount: mode === 'warning' ? '0.00' : violation.fine.toFixed(2)
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="ticket-system">
            <div className="system-header no-print">
                <h2>e-Citation Writer</h2>
                <div className="mode-toggle">
                    <button className={`mode-btn ${mode === 'traffic' ? 'active' : ''}`} onClick={() => setMode('traffic')}>Traffic</button>
                    <button className={`mode-btn ${mode === 'warning' ? 'active' : ''}`} onClick={() => setMode('warning')}>Warning</button>
                    <button className={`mode-btn ${mode === 'civil' ? 'active' : ''}`} onClick={() => setMode('civil')}>Civil / Warrant</button>
                </div>
            </div>

            <div className="writer-container">
                {/* Input Form */}
                <div className="ticket-form panel no-print">
                    <div className="form-section">
                        <h3>Violator Information</h3>
                        <div className="grid-2">
                            <input type="text" name="violatorName" placeholder="Full Name" value={formData.violatorName} onChange={handleChange} />
                            <input type="text" name="violatorDL" placeholder="Driver's License #" value={formData.violatorDL} onChange={handleChange} />
                        </div>
                        <input type="text" name="violatorAddress" placeholder="Home Address" className="full-width" value={formData.violatorAddress} onChange={handleChange} />
                    </div>

                    <div className="form-section">
                        <h3>Vehicle Information</h3>
                        <div className="grid-3">
                            <input type="text" name="vehiclePlate" placeholder="License Plate" value={formData.vehiclePlate} onChange={handleChange} />
                            <input type="text" name="vehicleMake" placeholder="Make / Model" value={formData.vehicleMake} onChange={handleChange} />
                            <input type="text" name="vehicleColor" placeholder="Color" value={formData.vehicleColor} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Violation Details</h3>
                        <div className="grid-2">
                            <select onChange={handleCommonSelect}>
                                <option value="">-- Quick Select Violation --</option>
                                {commonViolations.map(v => (
                                    <option key={v.code} value={v.code}>{v.code} - {v.desc} (${v.fine})</option>
                                ))}
                            </select>
                            <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} />
                        </div>

                        <div className="grid-custom">
                            <input type="text" name="violationCode" placeholder="Code" style={{ width: '100px' }} value={formData.violationCode} onChange={handleChange} />
                            <input type="text" name="violationDesc" placeholder="Description of Offense" style={{ flex: 1 }} value={formData.violationDesc} onChange={handleChange} />
                        </div>

                        <div className="grid-2">
                            <input type="text" name="location" placeholder="Location of Stop" value={formData.location} onChange={handleChange} />
                            <div className="fine-input">
                                <span>$</span>
                                <input type="number" name="fineAmount" placeholder="0.00" value={formData.fineAmount} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label>Court Date</label>
                                <input type="date" name="courtDate" value={formData.courtDate} onChange={handleChange} />
                            </div>
                        </div>

                        <textarea name="notes" placeholder="Officer Notes / Remarks" rows="3" value={formData.notes} onChange={handleChange}></textarea>
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary"><RotateCcw size={16} /> Reset</button>
                        <div className="flex-gap">
                            <button className="btn-secondary"><Save size={16} /> Save Draft</button>
                            <button className="btn-primary" onClick={handlePrint}><Printer size={16} /> Issue & Print Ticket</button>
                        </div>
                    </div>
                </div>

                {/* Live Preview / Print Output */}
                <div className="ticket-preview-wrapper">
                    <div className="ticket-printout" id="printable-ticket">
                        <div className="ticket-header">
                            <img src="/vite.svg" className="ticket-seal" alt="Seal" />
                            <div className="dept-info">
                                <h1>METRO CITY POLICE</h1>
                                <h2>NOTICE TO APPEAR</h2>
                                <h3>CITATION #{Math.floor(Math.random() * 900000) + 100000}</h3>
                            </div>
                        </div>

                        <div className="ticket-body">
                            <div className="row-group">
                                <span className="label">DATE OF VIOLATION</span>
                                <span className="value">{formData.date.replace('T', ' ')}</span>
                            </div>

                            <hr className="dashed" />

                            <div className="row-group">
                                <span className="label">VIOLATOR INFO</span>
                                <span className="value bold">{formData.violatorName || "Unknown"}</span>
                                <span className="value">DL: {formData.violatorDL || "N/A"}</span>
                                <span className="value">{formData.violatorAddress || "N/A"}</span>
                            </div>

                            <hr className="dashed" />

                            <div className="row-group">
                                <span className="label">VEHICLE</span>
                                <div className="flex-row">
                                    <span className="value">PLATE: {formData.vehiclePlate}</span>
                                    <span className="value">COLOR: {formData.vehicleColor}</span>
                                </div>
                                <span className="value">{formData.vehicleMake}</span>
                            </div>

                            <hr className="dashed" />

                            <div className="row-group highlight-box">
                                <span className="label">VIOLATION</span>
                                <div className="flex-row">
                                    <span className="value bold">{formData.violationCode}</span>
                                    <span className="value bold">${formData.fineAmount}</span>
                                </div>
                                <span className="value desc">{formData.violationDesc}</span>
                                <span className="value loc">LOC: {formData.location}</span>
                                {mode === 'warning' && <div className="warning-stamp">WARNING ONLY</div>}
                            </div>

                            <hr className="dashed" />

                            <div className="row-group">
                                <span className="label">COURT APPEARANCE</span>
                                <span className="value">Metro Municipal Court</span>
                                <span className="value">100 Justice Way, Rm 302</span>
                                <span className="value bold">DATE: {formData.courtDate} @ 09:00 AM</span>
                                <p className="tiny-text">Failure to appear may result in a warrant for your arrest.</p>
                            </div>

                            <div className="signature-box">
                                <span className="label">OFFICER SIGNATURE</span>
                                <span className="sign-line">Ofc. J. Doe #4492</span>
                            </div>

                            <div className="signature-box">
                                <span className="label">VIOLATOR SIGNATURE</span>
                                <p className="tiny-text">Signing is not an admission of guilt, only a promise to appear.</p>
                                <span className="sign-line empty">x</span>
                            </div>

                            <div className="ticket-footer">
                                <p>PAY ONLINE: www.metropolice.gov/pay</p>
                                <p>HELPLINE: (555) 012-3456</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .ticket-system { height: calc(100vh - 80px); display: flex; flex-direction: column; overflow: hidden; }
        .system-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .system-header h2 { margin: 0; font-size: 1.5rem; color: var(--primary-blue); }

        .mode-toggle { background: white; padding: 4px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; }
        .mode-btn { border: none; background: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; color: #64748b; }
        .mode-btn.active { background: var(--primary-blue); color: white; }

        .writer-container { display: flex; gap: 2rem; flex: 1; overflow: hidden; }
        
        /* FORM STYLES */
        .ticket-form { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 2rem; background: white; border-radius: 8px; border: 1px solid #e2e8f0; }
        .form-section h3 { font-size: 0.95rem; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
        .grid-custom { display: flex; gap: 1rem; margin-bottom: 1rem; }
        
        input, select, textarea { padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%; font-size: 0.95rem; }
        .full-width { width: 100%; margin-bottom: 1rem; }
        
        .fine-input { position: relative; display: flex; align-items: center; }
        .fine-input span { position: absolute; left: 10px; font-weight: bold; color: #475569; }
        .fine-input input { padding-left: 25px; font-weight: 700; color: #b91c1c; }

        .form-actions { margin-top: auto; display: flex; justify-content: space-between; pt-4; border-top: 1px solid #e2e8f0; }
        .flex-gap { display: flex; gap: 1rem; }

        /* TICKET PREVIEW */
        .ticket-preview-wrapper { flex: 0 0 380px; background: #334155; padding: 2rem; display: flex; justify-content: center; overflow-y: auto; border-radius: 8px; }
        
        .ticket-printout {
          background: #fff;
          width: 320px;
          min-height: 500px;
          padding: 1.5rem;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          position: relative;
        }

        .ticket-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1rem; }
        .ticket-seal { width: 40px; margin-bottom: 0.5rem; opacity: 0.8; }
        .dept-info h1 { font-size: 1.1rem; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .dept-info h2 { font-size: 0.9rem; margin: 0.2rem 0; font-weight: 700; }
        .dept-info h3 { font-size: 0.8rem; margin: 0; font-weight: 400; }

        .ticket-body { font-size: 0.85rem; line-height: 1.4; color: #000; }
        .row-group { margin-bottom: 0.75rem; display: flex; flex-direction: column; }
        .label { font-size: 0.7rem; font-weight: 700; color: #444; margin-bottom: 2px; }
        .value { font-weight: 400; text-transform: uppercase; }
        .value.bold { font-weight: 800; font-size: 0.95rem; }
        .value.desc { margin-top: 4px; display: block; }
        
        .flex-row { display: flex; justify-content: space-between; }
        
        .dashed { border: none; border-top: 1px dashed #000; margin: 0.75rem 0; }
        
        .highlight-box { border: 2px solid #000; padding: 0.5rem; position: relative; }
        .warning-stamp { 
          position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px;
          border: 3px solid #b91c1c; color: #b91c1c; display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 900; transform: rotate(-5deg); opacity: 0.8;
          pointer-events: none;
        }

        .tiny-text { font-size: 0.65rem; margin: 4px 0 0 0; font-style: italic; }
        
        .signature-box { margin-top: 1.5rem; }
        .sign-line { border-bottom: 1px solid #000; display: block; margin-top: 1.5rem; padding-bottom: 2px; }
        .sign-line.empty { height: 20px; }

        .ticket-footer { text-align: center; margin-top: 2rem; font-weight: 700; font-size: 0.8rem; }
        .ticket-footer p { margin: 2px 0; }

        /* PRINT MEDIA QUERY */
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .portal-sidebar, .portal-header { display: none !important; }
          
          .ticket-printout, .ticket-printout * { visibility: visible; }
          .ticket-printout {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            box-shadow: none;
          }
          .ticket-preview-wrapper { background: white; padding: 0; position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
        }
      `}</style>
        </div>
    );
};

export default TicketWriter;
