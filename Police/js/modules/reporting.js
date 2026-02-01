export function getTemplate() {
    return `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; height: 100%;">
            <!-- Controls -->
            <div class="glass-panel" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem;">
                    <div class="input-wrapper">
                        <i class="fa-solid fa-calendar"></i>
                        <input type="date" value="2023-10-24" style="color-scheme: dark;">
                    </div>
                    <div class="input-wrapper">
                        <i class="fa-solid fa-filter"></i>
                        <select style="background: transparent; border: none; padding: 10px 10px 10px 35px; color: white; outline: none;">
                            <option>All Precincts</option>
                            <option>North Sector</option>
                            <option>South Sector</option>
                        </select>
                    </div>
                </div>
                <button id="export-pdf" class="cta-btn" style="background: var(--primary);">
                    <i class="fa-solid fa-file-pdf"></i> EXPORT REPORT
                </button>
            </div>

            <!-- Charts Row -->
            <div style="display: flex; gap: 1.5rem; flex: 1; min-height: 0;">
                <div class="glass-panel" style="flex: 1; padding: 1.5rem; display: flex; flex-direction: column;">
                    <h3 class="stat-label">Crime Density Heatmap</h3>
                    <div style="flex: 1; position: relative; margin-top: 1rem;">
                        <canvas id="crime-chart"></canvas>
                    </div>
                </div>
                <div class="glass-panel" style="flex: 1; padding: 1.5rem; display: flex; flex-direction: column;">
                    <h3 class="stat-label">Incident Types</h3>
                    <div style="flex: 1; position: relative; margin-top: 1rem;">
                         <canvas id="type-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init(container) {
    const exportBtn = container.querySelector('#export-pdf');

    exportBtn.addEventListener('click', () => {
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING...';
        setTimeout(() => {
            exportBtn.innerHTML = '<i class="fa-solid fa-check"></i> DOWNLOADED';
            exportBtn.style.background = 'var(--success)';
            setTimeout(() => {
                exportBtn.innerHTML = originalText;
                exportBtn.style.background = 'var(--primary)';
            }, 2000);
        }, 1500);
    });

    // Initialize Charts
    initCharts();

    function initCharts() {
        const ctx1 = document.getElementById('crime-chart').getContext('2d');
        const ctx2 = document.getElementById('type-chart').getContext('2d');

        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
                datasets: [{
                    label: 'Violent Crimes',
                    data: [12, 19, 3, 5, 2, 3, 10],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Property Crimes',
                    data: [4, 2, 10, 15, 22, 18, 8],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });

        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Burglary', 'Assault', 'Traffic', 'Narcotics', 'Other'],
                datasets: [{
                    data: [12, 19, 43, 15, 8],
                    backgroundColor: [
                        '#f59e0b',
                        '#ef4444',
                        '#3b82f6',
                        '#10b981',
                        '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8' } }
                }
            }
        });
    }
}
