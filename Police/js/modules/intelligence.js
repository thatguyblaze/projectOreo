export function getTemplate() {
    return `
        <div class="grid-2 fade-in" style="height: calc(100vh - 140px);">
            <!-- Left: Controls -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto;">
                <div class="card" style="margin-bottom: 0;">
                    <div class="card-header">
                        <div class="card-title">Analysis Filters</div>
                    </div>
                    <div class="card-body">
                         <div class="form-group">
                            <label>Time Range Analysis</label>
                            <input type="range" class="form-input" style="padding: 0;" min="1" max="100" value="24" oninput="this.nextElementSibling.innerText = this.value + ' Hours'">
                            <div style="text-align: right; font-size: 0.8rem; font-weight: bold; color: var(--brand-cobalt); margin-top: 5px;">24 Hours</div>
                        </div>

                        <div style="margin-top: 1.5rem;">
                            <label style="font-weight: 500; display: block; margin-bottom: 0.5rem;">Crime Layers</label>
                            
                            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">
                                <input type="checkbox" checked class="layer-toggle" data-layer="violent">
                                <span class="badge badge-danger">Class A Felonies</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">
                                <input type="checkbox" checked class="layer-toggle" data-layer="property">
                                <span class="badge badge-warning">Property / Theft</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer;">
                                <input type="checkbox" class="layer-toggle" data-layer="traffic">
                                <span class="badge badge-success">Traffic Stops</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0;">
                    <div class="card-header">
                         <div class="card-title">Reports</div>
                    </div>
                    <div class="card-body">
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
                            Generate intelligence brief for command staff based on current map view.
                        </p>
                        <button class="btn btn-primary" style="width: 100%; justify-content: center;" id="gen-report-btn">
                            <i class="fa-solid fa-file-pdf"></i> GENERATE TACTICAL BRIEF
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right: Map -->
            <div class="card" style="margin-bottom: 0; display: flex; flex-direction: column; overflow: hidden;">
                <div class="card-header">
                    <div class="card-title">Rogersville Sector Map</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">LIVE FEED</div>
                </div>
                <div id="map-container" style="flex: 1; background: #e2e8f0; position: relative;">
                    <!-- Leaflet inject -->
                </div>
            </div>
        </div>

        <!-- Report Modal -->
        <div id="report-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 2rem; border-radius: 8px; width: 400px; text-align: center;">
                <i class="fa-solid fa-file-contract" style="font-size: 3rem; color: var(--brand-cobalt); margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">Generating Brief...</h3>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Compiling crime stats and heatmap data.</p>
                <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; margin-bottom: 1rem;">
                    <div id="report-progress" style="width: 0%; height: 100%; background: var(--brand-cobalt); transition: width 0.2s;"></div>
                </div>
                <button id="download-report" class="btn btn-primary hidden" style="width: 100%;">DOWNLOAD PDF</button>
            </div>
        </div>
    `;
}

export function init() {
    let map = null;
    const layers = {};

    // 1. Initialize Map
    // Wait for DOM
    setTimeout(() => {
        const container = document.getElementById('map-container');
        if (container && typeof L !== 'undefined') {
            map = L.map('map-container').setView([36.1627, -86.7816], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);

            // Create Layers
            layers.violent = L.layerGroup([
                L.circle([36.1627, -86.7816], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 500 }).bindPopup("ASSAULT - 2HRS AGO"),
                L.circle([36.1500, -86.7900], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 300 }).bindPopup("ROBBERY - 6HRS AGO")
            ]).addTo(map);

            layers.property = L.layerGroup([
                L.circle([36.1700, -86.7700], { color: 'orange', fillColor: '#f59e0b', fillOpacity: 0.5, radius: 400 }).bindPopup("BURGLARY SERIES"),
                L.circle([36.1400, -86.7600], { color: 'orange', fillColor: '#f59e0b', fillOpacity: 0.5, radius: 400 })
            ]).addTo(map);

            layers.traffic = L.layerGroup([
                L.circle([36.1800, -86.7500], { color: 'green', fillColor: '#10b981', fillOpacity: 0.5, radius: 200 }).bindPopup("DUI CHECKPOINT")
            ]); // Not added by default

            setTimeout(() => map.invalidateSize(), 200);
        }
    }, 100);

    // 2. Toggles
    document.querySelectorAll('.layer-toggle').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const layerName = e.target.dataset.layer;
            if (e.target.checked) {
                map.addLayer(layers[layerName]);
            } else {
                map.removeLayer(layers[layerName]);
            }
        });
    });

    // 3. Report Generation
    const btn = document.getElementById('gen-report-btn');
    const modal = document.getElementById('report-modal');
    const progress = document.getElementById('report-progress');
    const dlBtn = document.getElementById('download-report');

    btn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        progress.style.width = '0%';
        dlBtn.classList.add('hidden');

        // Simulate Progress
        let width = 0;
        const interval = setInterval(() => {
            width += 5;
            progress.style.width = width + '%';
            if (width >= 100) {
                clearInterval(interval);
                dlBtn.classList.remove('hidden');
            }
        }, 100);
    });

    dlBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        alert("Report Downloaded to Local Disk.");
    });
}
