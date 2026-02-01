export function getTemplate() {
    return `
        <div class="fade-in">
             <div class="grid-2" style="grid-template-columns: 2fr 1fr;">
                
                <!-- LEFT COLUMN: BRIEFING & NCIC -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <!-- 1. SHIFT BRIEFING -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title"><i class="fa-solid fa-bullhorn"></i> Shift Briefing Notes</div>
                            <div class="badge badge-warning">DO NOT REDISSEMINATE</div>
                        </div>
                        <div class="card-body">
                            <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 1rem; margin-bottom: 1rem; font-size: 0.9rem;">
                                <strong>Watch Commander (Sgt. Miller):</strong> 
                                Focus patrols on Main St corridor between 2200-0200 due to recent break-ins. Be advised: 
                                Silver Ford F-150 reported fleeing scene of reckless driving incident near Hwy 11.
                            </div>
                            <table class="data-table">
                                <thead><tr><th>BOLO Type</th><th>Description</th><th>Case Ref</th></tr></thead>
                                <tbody>
                                    <tr>
                                        <td><span class="badge badge-danger">STOLEN VEH</span></td>
                                        <td>2018 Honda Accord, Grey. Plate: 4B2-99L. Rear bumper damage.</td>
                                        <td>26-0034</td>
                                    </tr>
                                    <tr>
                                        <td><span class="badge badge-warning">MISSING</span></td>
                                        <td>J. Smith (14yo M). Last seen wearing Blue Hoodie near High School.</td>
                                        <td>26-0041</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 2. NCIC SIMULATOR -->
                    <div class="card">
                         <div class="card-header">
                            <div class="card-title"><i class="fa-solid fa-database"></i> NCIC / TIES Lookup</div>
                        </div>
                        <div class="card-body">
                            <form id="ncic-form" style="display: flex; gap: 10px; align-items: flex-end;">
                                <div style="flex: 1;">
                                    <label style="font-size: 0.7rem; font-weight: bold; color: var(--text-muted); text-transform: uppercase;">Search Query (Name, VIN, Plate)</label>
                                    <input type="text" id="ncic-query" class="form-input" placeholder="ENTER QUERY..." style="font-family: monospace; text-transform: uppercase;">
                                </div>
                                <div style="width: 150px;">
                                     <label style="font-size: 0.7rem; font-weight: bold; color: var(--text-muted); text-transform: uppercase;">Database</label>
                                    <select class="form-input">
                                        <option>PERSONS</option>
                                        <option>VEHICLES</option>
                                        <option>GUNS</option>
                                        <option>ARTICLES</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary" id="ncic-btn">RUN QUERY</button>
                            </form>

                            <div id="ncic-result" class="hidden" style="margin-top: 1rem; border: 1px solid var(--border); background: #f1f5f9; padding: 1rem; font-family: monospace; font-size: 0.85rem;">
                                <!-- Dynamic result -->
                            </div>
                        </div>
                    </div>

                </div>

                <!-- RIGHT COLUMN: WARRANTS -->
                <div class="card" style="height: fit-content;">
                    <div class="card-header">
                        <div class="card-title"><i class="fa-solid fa-gavel"></i> Active Warrants</div>
                    </div>
                    <div class="card-body" style="padding: 0;">
                         <table class="data-table" style="font-size: 0.8rem;">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Charge</th>
                                    <th>Bond</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>WILSON, Greg</strong><br>DOB: 11/02/1985</td>
                                    <td>FTA: Driving Suspended</td>
                                    <td>$500</td>
                                </tr>
                                 <tr>
                                    <td><strong>DAVIS, Sarah</strong><br>DOB: 05/14/1992</td>
                                    <td>VOP: Theft U/$1000</td>
                                    <td>NO BOND</td>
                                </tr>
                                 <tr>
                                    <td><strong>JONES, Mike</strong><br>DOB: 01/22/2001</td>
                                    <td>Domestic Assault</td>
                                    <td>$2500</td>
                                </tr>
                                <tr style="background: #fee2e2;">
                                    <td><strong>UNKNOWN</strong><br>Alias: "Slim"</td>
                                    <td>Agg. Robbery</td>
                                    <td>$50,000</td>
                                </tr>
                            </tbody>
                        </table>
                        <div style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 0.7rem;">
                            CONFIRM ALL WARRANTS WITH DISPATCH PRIOR TO ARREST
                        </div>
                    </div>
                </div>

             </div>
        </div>
    `;
}

export function init() {
    const form = document.getElementById('ncic-form');
    const resultBox = document.getElementById('ncic-result');
    const btn = document.getElementById('ncic-btn');

    // Data Generators
    const firstNames = ['JAMES', 'JOHN', 'ROBERT', 'MICHAEL', 'WILLIAM', 'DAVID', 'RICHARD', 'JOSEPH', 'THOMAS', 'CHARLES', 'MARY', 'PATRICIA', 'JENNIFER', 'LINDA', 'ELIZABETH'];
    const lastNames = ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS', 'RODRIGUEZ', 'MARTINEZ'];
    const charges = ['AGG ASSAULT', 'THEFT OF PROPERTY', 'FAIL TO APPEAR', 'VIOLATION OF PROBATION', 'DRUGS: MFG/DEL/SELL', 'DUI 2ND OFFENSE'];

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('ncic-query').value.trim().toUpperCase();

        if (!query) return;

        // Simulate Loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> RUNNING...';
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = 'Creating TIES Data Link... <span style="color:green">CONNECTED</span><br>Querying NCIC...';

        setTimeout(() => {
            btn.disabled = false;
            btn.innerText = 'RUN QUERY';

            // Generate Random Result
            const rFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const rLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const rCharge = charges[Math.floor(Math.random() * charges.length)];
            const rDOB = `${Math.floor(Math.random() * 12) + 1}/${Math.floor(Math.random() * 28) + 1}/${1960 + Math.floor(Math.random() * 40)}`;

            // Heuristic: If query has numbers and is short, assume Plate/VIN. If just letters, assume Name.
            const isPlate = /\d/.test(query);

            // Random Probability
            const rand = Math.random();
            // 0.0 - 0.2: WARRANT HIT (Red)
            // 0.2 - 0.3: STOLEN (Red)
            // 0.3 - 0.6: WARNING / SUSPENDED (Yellow)
            // 0.6 - 1.0: CLEAR (Green/Plain)

            if (query === 'TEST') {
                // Hardcoded Test
                resultBox.innerHTML += `
                    <br>----------------------------------------
                    <br><strong>MKE/WANTED PERSON</strong>
                    <br>NAM/TEST, SUBJECT  SEX/M RAC/W
                    <br>HIT CONFIRMATION REQUIRED
                    <br>ORI/TN0370100
                    <br>OFF/AGGRAVATED ASSAULT
                    <br>WRN/24-1102A
                    <br>----------------------------------------
                    <br><strong style="color:red">** SUBJECT IS ARMED AND DANGEROUS **</strong>
                `;
            } else if (rand < 0.2 && !isPlate) {
                // WANTED PERSON HIT
                resultBox.innerHTML += `
                    <br>----------------------------------------
                    <br><strong style="color:red; background:yellow;">** WANTED PERSON **</strong>
                    <br>NAM/${rLastName}, ${rFirstName}
                    <br>SEX/M RAC/W DOB/${rDOB}
                    <br>
                    <br>OFFENSE: ${rCharge}
                    <br>WARRANT #: ${Math.floor(Math.random() * 90000) + 10000}
                    <br>AGENCY: ROGERSVILLE PD
                    <br>----------------------------------------
                    <br>CONFIRM WITH DISPATCH BEFORE ARREST
                `;
            } else if (rand < 0.2 && isPlate) {
                // STOLEN VEHICLE HIT
                resultBox.innerHTML += `
                    <br>----------------------------------------
                    <br><strong style="color:red; background:yellow;">** STOLEN VEHICLE **</strong>
                    <br>LIC/${query}  ST/TN  AYR/2021
                    <br>VMA/TOYT  VMO/CAMRY  COL/SIL
                    <br>VIN/4T1B...${Math.floor(Math.random() * 10000)}
                    <br>
                    <br>DATE OF THEFT: ${new Date().toLocaleDateString()}
                    <br>WANTED BY: HAWKINS COUNTY SO
                    <br>----------------------------------------
                    <br>USE CAUTION - OCCUPANTS MAY BE ARMED
                `;
            } else if (rand < 0.4 && !isPlate) {
                // DRIVER SUSPENDED
                resultBox.innerHTML += `
                    <br>----------------------------------------
                    <br><strong>DRIVER LICENSE QUERY</strong>
                    <br>NAM/${rLastName}, ${rFirstName}
                    <br>DOB/${rDOB}  SEX/M
                    <br>
                    <br>STATUS: <strong style="color:orange">SUSPENDED</strong>
                    <br>REASON: FAIL TO PAY FINES
                    <br>REINSTATEMENT FEE: $155.00
                    <br>----------------------------------------
                `;
            } else {
                // NO RECORD / VALID
                if (!isPlate) {
                    resultBox.innerHTML += `
                        <br>----------------------------------------
                        <br><strong>DRIVER LICENSE QUERY</strong>
                        <br>NAM/${rLastName}, ${rFirstName}
                        <br>DOB/${rDOB}  SEX/M
                        <br>
                        <br>STATUS: <strong>VALID</strong>
                        <br>CLASS: D
                        <br>POINTS: 0
                        <br>----------------------------------------
                    `;
                } else {
                    resultBox.innerHTML += `
                        <br>----------------------------------------
                        <br><strong>VEHICLE REGISTRATION</strong>
                        <br>LIC/${query}  ST/TN  AYR/2023
                        <br>VMA/PONT  VMO/G6  COL/BLK
                        <br>VIN/1G2...${Math.floor(Math.random() * 10000)}
                        <br>
                        <br>STATUS: <strong>VALID</strong>
                        <br>OWNER: ${rLastName}, ${rFirstName}
                        <br>----------------------------------------
                    `;
                }
            }

        }, 800 + Math.random() * 1000); // Random delay 0.8s - 1.8s
    });
}
