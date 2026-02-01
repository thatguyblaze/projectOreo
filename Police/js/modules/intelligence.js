export function getTemplate() {
    return `
        <div style="display: flex; height: 100%; gap: 1.5rem;">
            <!-- Controls Sidebar -->
            <div style="width: 300px; display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="card" style="margin-bottom: 0;">
                    <div class="card-header">
                        <div class="card-title">Filters</div>
                    </div>
                    <div class="card-body">
                         <div class="form-group">
                            <label>Time Range</label>
                            <input type="range" class="form-control" style="padding: 0;" min="1" max="100" value="24">
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-medium); margin-top: 5px;">
                                <span>24h</span>
                                <span>7d</span>
                                <span>30d</span>
                                <span>1y</span>
                            </div>
                        </div>

                        <div style="margin-top: 1.5rem;">
                            <label style="font-weight: 500; display: block; margin-bottom: 0.5rem;">Layer Toggles</label>
                            
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <input type="checkbox" checked>
                                <span class="badge badge-danger">Violent Crime</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <input type="checkbox" checked>
                                <span class="badge badge-warning">Property Crime</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <input type="checkbox">
                                <span class="badge badge-success">Traffic Stops</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0;">
                    <div class="card-header">
                         <div class="card-title">Report Generator</div>
                    </div>
                    <div class="card-body">
                        <p style="font-size: 0.9rem; color: var(--text-medium); margin-bottom: 1rem;">
                            Generate PDF report for City Council based on current view.
                        </p>
                        <button class="btn-primary" style="width: 100%; justify-content: center;">
                            <i class="fa-solid fa-file-pdf"></i> GENERATE REPORT
                        </button>
                    </div>
                </div>

                <div class="card" style="flex: 1; margin-bottom: 0;">
                     <div class="card-header">
                         <div class="card-title">Predictive Analysis</div>
                    </div>
                    <div class="card-body">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--status-danger);">High</div>
                        <div style="font-size: 0.9rem; color: var(--text-medium); margin-bottom: 1rem;">Probability of incident in Sector 4 tonight.</div>
                        <div class="badge badge-warning">Resource Shift Recommended</div>
                    </div>
                </div>
            </div>

            <!-- Map Area -->
            <div class="card" style="flex: 1; margin-bottom: 0; display: flex; flex-direction: column;">
                <div class="card-header">
                    <div class="card-title">Rogersville Interactive Map</div>
                </div>
                <div id="map-container" style="flex: 1; background: #e2e8f0;"></div>
            </div>
        </div>
    `;
}

export function init() {
    // Leaflet Map Initialization
    // We use a timeout to ensure the DOM element is rendered
    setTimeout(() => {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer && typeof L !== 'undefined') {
            const map = L.map('map-container').setView([36.1627, -86.7816], 13); // Default coords

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);

            // Add some Heatmap-like Circles
            const points = [
                { lat: 36.1627, lng: -86.7816, color: 'red', r: 500 },
                { lat: 36.1700, lng: -86.7900, color: 'orange', r: 300 },
                { lat: 36.1550, lng: -86.7700, color: 'blue', r: 400 },
            ];

            points.forEach(p => {
                L.circle([p.lat, p.lng], {
                    color: p.color,
                    fillColor: p.color,
                    fillOpacity: 0.5,
                    radius: p.r
                }).addTo(map);
            });

            // Handle resizing issues when tab switching
            setTimeout(() => { map.invalidateSize(); }, 200);
        }
    }, 100);
}
