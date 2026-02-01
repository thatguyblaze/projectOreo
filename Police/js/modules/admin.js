export function getTemplate() {
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">User Management</div>
                <button class="btn-primary"><i class="fa-solid fa-user-plus"></i> Add Personnel</button>
            </div>
            <div class="card-body">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Badge #</th>
                            <th>Name</th>
                            <th>Rank</th>
                            <th>Clearance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr>
                            <td>8921</td>
                            <td>Miller, James</td>
                            <td>Sergeant</td>
                            <td><span class="badge badge-success">L5 - MASTER</span></td>
                            <td>Active</td>
                            <td><button class="btn-icon"><i class="fa-solid fa-pencil"></i></button></td>
                        </tr>
                        <tr>
                            <td>9921</td>
                            <td>Vance, Sarah</td>
                            <td>Detective</td>
                            <td><span class="badge badge-warning">L4 - INVESTIGATOR</span></td>
                            <td>Active</td>
                            <td><button class="btn-icon"><i class="fa-solid fa-pencil"></i></button></td>
                        </tr>
                        <tr>
                            <td>1102</td>
                            <td>Johnson, Mike</td>
                            <td>Officer</td>
                            <td><span class="badge" style="background: #e2e8f0;">L3 - PATROL</span></td>
                            <td>Suspended</td>
                            <td><button class="btn-icon"><i class="fa-solid fa-pencil"></i></button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">System Health</div>
                </div>
                <div class="card-body">
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Server Load (CPU)</span>
                            <span style="color: var(--status-success);">12%</span>
                        </div>
                        <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: 12%; height: 100%; background: var(--status-success);"></div>
                        </div>
                    </div>
                     <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Storage (Evidence Vault)</span>
                            <span style="color: var(--status-warning);">82%</span>
                        </div>
                         <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: 82%; height: 100%; background: var(--status-warning);"></div>
                        </div>
                    </div>
                     <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Court Sync Latency</span>
                            <span style="color: var(--status-success);">24ms</span>
                        </div>
                         <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                            <div style="width: 5%; height: 100%; background: var(--status-success);"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Audit Trail (Recent)</div>
                </div>
                <div class="card-body">
                    <div style="font-family: monospace; font-size: 0.85rem; color: var(--text-medium);">
                        <div style="padding: 4px 0; border-bottom: 1px dashed var(--border-light);">[15:42:01] LOGIN_SUCCESS: User 8921 (Miller) IP: 10.0.4.12</div>
                        <div style="padding: 4px 0; border-bottom: 1px dashed var(--border-light);">[15:40:22] FILE_UPLOAD: Case #RPD-26-0012 Size: 42MB</div>
                         <div style="padding: 4px 0; border-bottom: 1px dashed var(--border-light); color: var(--status-danger);">[14:12:00] LOGIN_FAIL: User 1102 (Johnson) IP: 192.168.1.5</div>
                        <div style="padding: 4px 0; border-bottom: 1px dashed var(--border-light);">[13:55:12] DB_QUERY: NCIC_CHECK Plate: ABC-1224</div>
                    </div>
                    <button class="btn-primary" style="width: 100%; margin-top: 1rem; background: var(--bg-app); color: var(--text-dark); border: 1px solid var(--border-light);">View Full Logs</button>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    console.log("Admin module initialized.");
}
