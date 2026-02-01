export function getTemplate() {
    return `
        <!-- KPI Row -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Active Cases</div>
                <div class="kpi-value">42</div>
                <div class="badge badge-success"><i class="fa-solid fa-arrow-up"></i> 12% vs Last Wk</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Shift Citations</div>
                <div class="kpi-value">18</div>
                <div class="badge badge-warning">Near Quota</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Pending Redactions</div>
                <div class="kpi-value">7</div>
                <div class="badge badge-danger">High Priority</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Court Summons</div>
                <div class="kpi-value">3</div>
                <div style="font-size: 0.8rem; color: var(--text-medium);">Next: Tomorrow 09:00</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
            <!-- Live Feed -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fa-solid fa-tower-broadcast"></i> Live Department Activity</div>
                    <button class="btn-icon"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Officer</th>
                                <th>Action</th>
                                <th>Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>10:42 AM</td>
                                <td>Sgt. Miller</td>
                                <td>Uploaded Evidence (Bodycam)</td>
                                <td><a href="#" style="color: var(--brand-cobalt);">#RPD-26-0012</a></td>
                            </tr>
                            <tr>
                                <td>10:38 AM</td>
                                <td>Ofc. Johnson</td>
                                <td>Issued Citation (Speeding)</td>
                                <td><a href="#" style="color: var(--brand-cobalt);">#CIT-8821</a></td>
                            </tr>
                            <tr>
                                <td>10:15 AM</td>
                                <td>Det. Vance</td>
                                <td>Requested Warrant</td>
                                <td><a href="#" style="color: var(--brand-cobalt);">#WAR-992</a></td>
                            </tr>
                             <tr>
                                <td>09:55 AM</td>
                                <td>Admin System</td>
                                <td>Auto-Archived Case</td>
                                <td><a href="#" style="color: var(--brand-cobalt);">#RPD-24-9912</a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Shift Calendar -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fa-solid fa-calendar-day"></i> Shift Schedule</div>
                </div>
                <div class="card-body">
                    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-light);">
                        <div style="font-weight: 600; color: var(--brand-navy);">Today, Oct 24</div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; opacity: 0.8;">
                            <span>08:00 - 20:00</span>
                            <span class="badge badge-success">ON DUTY</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <div style="width: 50px; font-weight: 600; color: var(--text-medium);">13:00</div>
                            <div style="flex: 1; background: #f1f5f9; padding: 8px; border-radius: 4px; border-left: 3px solid var(--brand-cobalt);">
                                <div style="font-weight: 600;">Briefing: Sector 4</div>
                                <div style="font-size: 0.8rem;">Room 202</div>
                            </div>
                        </div>
                         <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <div style="width: 50px; font-weight: 600; color: var(--text-medium);">15:30</div>
                            <div style="flex: 1; background: #fee2e2; padding: 8px; border-radius: 4px; border-left: 3px solid var(--status-danger);">
                                <div style="font-weight: 600; color: #b91c1c;">Court Appearance</div>
                                <div style="font-size: 0.8rem; color: #b91c1c;">Superior Court - Room B</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    console.log("Dashboard initialized");
}
