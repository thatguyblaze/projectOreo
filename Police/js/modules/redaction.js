export function getTemplate() {
    return `
        <div class="grid-2 fade-in">
             <!-- Control Panel -->
             <div class="card" style="height: 100%;">
                <div class="card-header">
                    <div class="card-title">Media Processor</div>
                    <div class="badge badge-warning">RESTRICTED</div>
                </div>
                <div class="card-body">
                    <div style="margin-bottom: 2rem;">
                        <button class="btn btn-primary" id="redact-import-btn" style="width: 100%; justify-content: center; margin-bottom: 10px;">
                            <i class="fa-solid fa-cloud-arrow-down"></i> IMPORT FROM VAULT
                        </button>
                        <div style="font-size: 0.8rem; text-align: center; color: var(--text-muted);">
                            Select evidence from active cases for processing.
                        </div>
                    </div>

                    <h4 class="form-section-title">AI Detection Settings</h4>
                    <div style="margin-bottom: 1.5rem;">
                         <div class="form-group" style="background: #f8fafc; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
                            <label style="margin: 0; cursor: pointer;"><i class="fa-solid fa-face-viewfinder"></i> Auto-Blur Faces</label>
                            <input type="checkbox" id="chk-blur" checked style="transform: scale(1.2);">
                        </div>
                        <div class="form-group" style="background: #f8fafc; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
                            <label style="margin: 0; cursor: pointer;"><i class="fa-solid fa-car"></i> Blur License Plates</label>
                            <input type="checkbox" id="chk-plate" checked style="transform: scale(1.2);">
                        </div>
                         <div class="form-group" style="background: #f8fafc; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
                            <label style="margin: 0; cursor: pointer;"><i class="fa-solid fa-ear-deaf"></i> Mute PII Audio</label>
                            <input type="checkbox" id="chk-audio" style="transform: scale(1.2);">
                        </div>
                    </div>

                    <button class="btn btn-outline" id="redact-export-btn" style="width: 100%; justify-content: center;" disabled>
                        <i class="fa-solid fa-file-export"></i> EXPORT PUBLIC RELEASE (REDACTED)
                    </button>
                </div>
             </div>

             <!-- Preview & Editor -->
             <div class="card" style="height: 100%; display: flex; flex-direction: column;">
                <div class="card-header">
                    <div class="card-title">Editor Canvas</div>
                    <div id="file-status">NO FILE LOADED</div>
                </div>
                <div class="card-body" style="background: #000; flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; padding: 0;">
                    
                    <!-- Player Screen -->
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;" id="player-screen">
                        <i class="fa-solid fa-film" style="color: #333; font-size: 5rem;" id="placeholder-icon"></i>
                        
                        <!-- Simulated Blur Box -->
                        <div id="blur-box" class="hidden" style="position: absolute; top: 30%; left: 40%; width: 100px; height: 100px; backdrop-filter: blur(15px); background: rgba(255,255,255,0.1); border: 1px dashed rgba(255,255,255,0.5);">
                            <div style="position: absolute; top: -20px; left: 0; color: white; font-size: 0.7rem; background: red; padding: 2px;">FACE DETECTED</div>
                        </div>

                        <!-- Scan Line -->
                        <div id="process-scan" class="hidden" style="position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: var(--brand-cobalt); box-shadow: 0 0 15px var(--brand-cobalt); animation: scanX 2s infinite linear;"></div>
                    </div>

                    <!-- Controls -->
                    <div style="height: 80px; background: #1e293b; display: flex; align-items: center; padding: 0 1.5rem; gap: 1.5rem;">
                         <button class="btn-icon" style="color: white; font-size: 1.5rem;" id="play-btn"><i class="fa-solid fa-play"></i></button>
                         
                         <div style="flex: 1;">
                            <div style="height: 6px; background: #334155; border-radius: 3px; position: relative;">
                                <div id="progress-bar" style="width: 0%; height: 100%; background: var(--brand-cobalt);"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.75rem; margin-top: 5px;">
                                <span id="time-current">00:00</span>
                                <span id="time-total">00:00</span>
                            </div>
                         </div>
                    </div>
                </div>
             </div>
        </div>

        <style>
            @keyframes scanX {
                0% { left: 0; }
                100% { left: 100%; }
            }
        </style>
    `;
}

export function init() {
    const importBtn = document.getElementById('redact-import-btn');
    const exportBtn = document.getElementById('redact-export-btn');
    const playBtn = document.getElementById('play-btn');
    const status = document.getElementById('file-status');
    const icon = document.getElementById('placeholder-icon');
    const blurBox = document.getElementById('blur-box');
    const scanLine = document.getElementById('process-scan');
    const progressBar = document.getElementById('progress-bar');

    let isPlaying = false;
    let isLoaded = false;
    let progress = 0;
    let timer = null;

    importBtn.addEventListener('click', () => {
        // Simulate Import
        importBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LOADING...';
        setTimeout(() => {
            isLoaded = true;
            importBtn.innerHTML = '<i class="fa-solid fa-check"></i> LOADED';
            importBtn.disabled = true;

            status.innerText = "EVIDENCE_CAM_1A.MP4";
            status.style.color = "var(--success)";

            icon.classList.add('hidden'); // Hide placeholder
            // Show a static frame or something? For now just black bg

            exportBtn.disabled = false;
            document.getElementById('time-total').innerText = "04:20";
        }, 1200);
    });

    playBtn.addEventListener('click', () => {
        if (!isLoaded) {
            alert("Please import media first.");
            return;
        }

        if (isPlaying) {
            pause();
        } else {
            play();
        }
    });

    exportBtn.addEventListener('click', () => {
        exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> RENDERING...';

        // Show scan line to simulate processing
        scanLine.classList.remove('hidden');

        setTimeout(() => {
            scanLine.classList.add('hidden');
            exportBtn.innerHTML = '<i class="fa-solid fa-download"></i> SAVE FILE';
            exportBtn.classList.remove('btn-outline');
            exportBtn.classList.add('btn-primary');
            alert("File Processed & Downloaded. Face/PII redaction applied.");
        }, 2000);
    });

    function play() {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

        // Show simulated detection
        if (document.getElementById('chk-blur').checked) {
            blurBox.classList.remove('hidden');
        }

        timer = setInterval(() => {
            progress += 0.5;
            if (progress > 100) progress = 0;
            progressBar.style.width = progress + '%';
        }, 50);
    }

    function pause() {
        isPlaying = false;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        blurBox.classList.add('hidden');
        clearInterval(timer);
    }
}
