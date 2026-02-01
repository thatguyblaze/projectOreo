export function getTemplate() {
    return `
        <div style="display: flex; gap: 2rem; height: 100%;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 1rem;">
                <div class="glass-panel" style="padding: 1.5rem;">
                    <div id="upload-zone" class="upload-zone">
                        <div class="upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                        <h3>Upload Evidence</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Drag & drop files or click to browse</p>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem;">Supports: .mp4, .jpg, .pdf, .wav</p>
                        <input type="file" id="evidence-input" style="display: none" multiple> 
                    </div>
                </div>

                <div class="glass-panel" style="padding: 1.5rem; flex: 1;">
                    <h3 class="stat-label">AI Redaction Queue</h3>
                    <div id="processing-queue" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.8rem;">
                        <!-- Queue Items injected here -->
                    </div>
                </div>
            </div>

            <div class="glass-panel" style="flex: 1; padding: 1.5rem; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 class="stat-label">Case Files (Recent)</h3>
                    <div class="input-wrapper" style="width: 200px;">
                        <i class="fa-solid fa-search"></i>
                        <input type="text" placeholder="Search Case #">
                    </div>
                </div>
                
                <table class="recent-activity-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Chain</th>
                        </tr>
                    </thead>
                    <tbody id="evidence-list">
                        <!-- Items injected here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export function init(container) {
    const uploadZone = container.querySelector('#upload-zone');
    const fileInput = container.querySelector('#evidence-input');
    const queueContainer = container.querySelector('#processing-queue');
    const listContainer = container.querySelector('#evidence-list');

    // Drag & Drop
    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary)';
        uploadZone.style.background = 'rgba(59, 130, 246, 0.1)';
    });

    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border)';
        uploadZone.style.background = 'transparent';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border)';
        uploadZone.style.background = 'transparent';
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Mock Data Loading
    loadMockEvidence();

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            addQueueItem(file.name);
        });
    }

    function addQueueItem(filename) {
        const item = document.createElement('div');
        item.style.cssText = `
            background: rgba(255,255,255,0.05);
            padding: 10px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-left: 3px solid var(--primary);
        `;
        item.innerHTML = `
            <i class="fa-solid fa-file-video" style="color: var(--primary)"></i>
            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div style="font-size: 0.9rem;">${filename}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">AI Redaction: <span class="progress-text">0%</span></div>
            </div>
            <i class="fa-solid fa-spinner fa-spin" style="color: var(--text-muted)"></i>
        `;
        queueContainer.prepend(item);

        // Simulate Progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                item.style.borderLeftColor = 'var(--success)';
                item.querySelector('.fa-spinner').className = 'fa-solid fa-check';
                item.querySelector('.fa-spinner').style.color = 'var(--success)';
                item.querySelector('.progress-text').innerText = 'Complete';
                item.querySelector('.progress-text').style.color = 'var(--success)';

                // Add to list after delay
                setTimeout(() => {
                    item.remove();
                    addEvidenceRow(filename);
                }, 1000);
            } else {
                item.querySelector('.progress-text').innerText = Math.floor(progress) + '%';
            }
        }, 300);
    }

    function addEvidenceRow(filename) {
        const tr = document.createElement('tr');
        const id = 'EV-' + Math.floor(Math.random() * 10000);
        tr.innerHTML = `
            <td>${id}</td>
            <td>Digital Video</td>
            <td>Just Now</td>
            <td><button class="badge" style="background: rgba(59, 130, 246, 0.2); border: none; color: white; cursor: pointer;">VIEW LOG</button></td>
        `;
        listContainer.prepend(tr);
    }

    function loadMockEvidence() {
        const mockData = [
            { id: 'EV-8291', type: 'Body Cam', date: '2 hrs ago' },
            { id: 'EV-8290', type: 'Dash Cam', date: '3 hrs ago' },
            { id: 'EV-8112', type: 'PDF Report', date: 'Yesterday' },
        ];

        mockData.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d.id}</td>
                <td>${d.type}</td>
                <td>${d.date}</td>
                <td><button class="badge" style="background: rgba(59, 130, 246, 0.2); border: none; color: white; cursor: pointer;">VIEW LOG</button></td>
            `;
            listContainer.appendChild(tr);
        });
    }
}
