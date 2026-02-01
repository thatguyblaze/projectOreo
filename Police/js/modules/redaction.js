export function getTemplate() {
    return `
        <div class="card" style="height: 100%; display: flex; flex-direction: column; margin-bottom: 0;">
            <div class="card-header">
                <div class="card-title">Redaction Studio</div>
                <div>
                    <button class="btn-primary" style="background: white; color: var(--text-dark); border: 1px solid var(--border-light); margin-right: 10px;">
                        <i class="fa-solid fa-folder-open"></i> Import from Vault
                    </button>
                    <button class="btn-primary">
                        <i class="fa-solid fa-file-export"></i> Export Public Copy
                    </button>
                </div>
            </div>
            
            <div class="card-body" style="flex: 1; display: flex; flex-direction: column;">
                <!-- Video Player Simulation -->
                <div class="video-stage">
                    <i class="fa-solid fa-play-circle fa-4x" style="opacity: 0.8; cursor: pointer;"></i>
                    <div style="position: absolute; bottom: 10px; left: 10px; width: calc(100% - 20px);">
                         <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 5px;">
                            <span>00:14 / 04:32</span>
                            <span>1080p | 30fps</span>
                         </div>
                         <div class="timeline">
                            <div class="timeline-progress" style="width: 45%;"></div>
                            <!-- Markers -->
                            <div style="position: absolute; left: 20%; top: 0; bottom: 0; width: 2px; background: var(--status-warning);" title="Audio Muted"></div>
                            <div style="position: absolute; left: 60%; top: 0; bottom: 0; width: 2px; background: var(--status-danger);" title="Face Blur"></div>
                         </div>
                    </div>
                </div>

                <!-- AI Toolbox -->
                <div style="margin-top: 1rem;">
                    <h4 style="margin-bottom: 1rem; color: var(--brand-navy);">AI Redaction Toolbox</h4>
                    <div style="display: flex; gap: 1rem;">
                        <div style="flex: 1; border: 1px solid var(--border-light); padding: 1rem; border-radius: 4px; border-left: 3px solid var(--brand-cobalt);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <div style="font-weight: 600;"><i class="fa-solid fa-face-viewfinder"></i> Auto-Blur Faces</div>
                                <input type="checkbox" checked>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-medium);">
                                Automatically detects and blurs unidentified faces. 
                                <span class="badge badge-success">ACTIVE</span>
                            </p>
                        </div>

                        <div style="flex: 1; border: 1px solid var(--border-light); padding: 1rem; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <div style="font-weight: 600;"><i class="fa-solid fa-microphone-slash"></i> Intelligent Audio Mute</div>
                                <input type="checkbox">
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-medium);">
                                Detects PII (Names, SSNs) and auto-mutes audio track.
                            </p>
                        </div>

                        <div style="flex: 1; border: 1px solid var(--border-light); padding: 1rem; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <div style="font-weight: 600;"><i class="fa-solid fa-eraser"></i> Scrub Metadata</div>
                                <input type="checkbox" checked>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-medium);">
                                Removes GPS, Officer ID, and device serial numbers.
                            </p>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Process Log</div>
                    <div style="font-family: monospace; font-size: 0.8rem; color: var(--text-medium); background: #f8fafc; padding: 10px; border-radius: 4px;">
                        > File loaded: CAM_8921_20241023.mp4<br>
                        > Analysis complete: 3 faces detected.<br>
                        > Auto-blur applied to timestamps [00:42 - 01:12].<br>
                        > Metadata scrubbing... Done.
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function init() {
    console.log("Redaction Studio initialized");
}
