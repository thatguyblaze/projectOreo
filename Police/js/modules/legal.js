export function getTemplate() {
    return `
        <div class="fade-in">
            <h2 style="border-bottom: 2px solid var(--brand-navy); padding-bottom: 10px; margin-bottom: 20px;">
                <i class="fa-solid fa-scale-balanced"></i> Legal Resources & Reference
            </h2>
            
            <div class="grid-2">
                <!-- EXTERNAL LINKS -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Official Databases</div>
                    </div>
                    <div class="card-body">
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="margin-bottom: 1rem;">
                                <a href="https://www.tncourts.gov/Tennessee%20Code" target="_blank" style="text-decoration: none; color: var(--brand-cobalt); font-weight: bold; display: block;">
                                    <i class="fa-solid fa-book-open"></i> Tennessee Code Annotated (TCA)
                                </a>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Access the full digital version of TN State Laws via LexisNexis.</div>
                            </li>
                             <li style="margin-bottom: 1rem;">
                                <a href="https://library.municode.com/tn/rogersville/codes/code_of_ordinances" target="_blank" style="text-decoration: none; color: var(--brand-cobalt); font-weight: bold; display: block;">
                                    <i class="fa-solid fa-city"></i> Rogersville Municipal Code
                                </a>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Local ordinances, zoning, and noise regulations (Municode).</div>
                            </li>
                             <li>
                                <a href="https://www.tn.gov/safety/driver-services/mvr.html" target="_blank" style="text-decoration: none; color: var(--brand-cobalt); font-weight: bold; display: block;">
                                    <i class="fa-solid fa-id-card"></i> TN Dept. of Safety (Driver Services)
                                </a>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">License status checks and crash reporting portals.</div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- DEPARTMENT DIRECTORY -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Internal Directory</div>
                    </div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead><tr><th>Unit</th><th>Extension</th></tr></thead>
                            <tbody>
                                <tr><td>Dispatch / Comm Center</td><td>x1000</td></tr>
                                <tr><td>Watch Commander</td><td>x1050</td></tr>
                                <tr><td>Records Division</td><td>x1200</td></tr>
                                <tr><td>Criminal Invest. (CID)</td><td>x1300</td></tr>
                                <tr><td>Evidence Room</td><td>x1350</td></tr>
                                <tr><td>Magistrate (On-Call)</td><td>(423) 555-0199</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- CHEAT SHEET -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Common TCA Code Reference</div>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Offense</th>
                                <th>TCA Code</th>
                                <th>Class</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Speeding</td><td>55-8-152</td><td>C Misd</td><td>Check school zone multiplier</td></tr>
                            <tr><td>DUI (1st Offense)</td><td>55-10-401</td><td>A Misd</td><td>Mandatory 48hr hold</td></tr>
                            <tr><td>Driving on Suspended</td><td>55-50-504</td><td>B Misd</td><td>Seize license if in possession</td></tr>
                            <tr><td>Simple Possession (Sch VI)</td><td>39-17-418</td><td>A Misd</td><td>Under 0.5oz marijuana</td></tr>
                            <tr><td>Theft of Property (<$1k)</td><td>39-14-103</td><td>A Misd</td><td>"Petty Theft"</td></tr>
                            <tr><td>Theft of Property (>$1k)</td><td>39-14-103</td><td>E Felony</td><td>"Grand Theft"</td></tr>
                            <tr><td>Domestic Assault</td><td>39-13-111</td><td>A Misd</td><td>Requires 12hr hold (Cooling off)</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    // Static links, no logic needed yet
}
