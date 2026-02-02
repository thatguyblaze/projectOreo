/* PATROL OPERATIONS MODULE - OFFICIAL GAME LOOP */
import { db } from '../store.js';
import { generateProfile } from './ncicGen.js';
import { CALL_TYPES, DIALOG_TREES, RADIO_CHATTER } from './scenarios.js';

let shiftActive = false;
let shiftTimer = null;
let currentCall = null;
let shiftStats = { xp: 0, calls: 0 };
let radioInterval = null;

// UI REFRESH
function updateStatus(status) {
    const el = document.getElementById('unit-status');
    if (el) {
        el.innerText = status;
        el.className = `badge ${status === 'AVAILABLE' ? 'bg-green' : 'bg-red'}`;
    }
}

export function getTemplate() {
    const officer = db.getCurrentOfficer();
    return `
        <div class="fade-in" style="height: 100%; display: grid; grid-template-rows: auto 1fr; gap: 1rem;">
            
            <!-- MDT HEADER info -->
            <div style="background: var(--gov-navy); color: white; padding: 1rem; border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="font-size: 1.5rem; font-weight: 700;">UNIT ${officer?.badge || '4921'}</div>
                    <div id="unit-status" class="badge bg-green" style="background: #22c55e; color: black;">AVAILABLE</div>
                    <div style="font-family: monospace; opacity: 0.8;">OFFICER: ${officer?.name?.toUpperCase()} | RANK: ${officer?.rank?.toUpperCase()}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.8rem; opacity: 0.7;">SHIFT XP</div>
                    <div id="shift-xp" style="font-weight: 700; font-size: 1.2rem; color: #fbbf24;">0</div>
                </div>
            </div>

            <!-- MAIN WORKSPACE -->
            <div class="grid-2" style="grid-template-columns: 1fr 350px; height: 100%; overflow: hidden;">
                
                <!-- LEFT: MAP / CALL AREA -->
                <div class="panel" style="display: flex; flex-direction: column; overflow: hidden;">
                    <div class="panel-head">
                        <span>ACTIVE CALL BOARD</span>
                        <button id="btn-end-shift" class="btn btn-ghost" style="color: #ef4444;">End Shift</button>
                    </div>
                    
                    <div id="call-container" style="flex: 1; padding: 2rem; display: flex; align-items: center; justify-content: center; background: #f3f4f6; position: relative;">
                        <!-- CALL CONTENT GOES HERE -->
                        <div id="screensaver" style="text-align: center; color: var(--text-secondary);">
                            <i class="fa-solid fa-car-side" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <h3>Patrolling Sector...</h3>
                            <p>Waiting for Dispatch</p>
                        </div>
                    </div>
                </div>

                <!-- RIGHT: RADIO & TOOLS -->
                <div style="display: flex; flex-direction: column; gap: 1rem; overflow: hidden;">
                    
                    <!-- TABBED RIGHT PANEL -->
                    <div class="panel" style="flex: 1; display: flex; flex-direction: column;">
                        <div class="panel-head" style="padding: 0; display: flex;">
                            <button class="nav-item active" style="flex:1; border-radius:0; justify-content:center; margin:0;" onclick="window.switchPatrolTab('radio')">RADIO</button>
                            <button class="nav-item" style="flex:1; border-radius:0; justify-content:center; margin:0;" onclick="window.switchPatrolTab('notes')">NOTEPAD</button>
                        </div>
                        
                        <!-- RADIO FEED -->
                        <div id="tab-radio" style="flex: 1; overflow-y: auto; padding: 1rem; font-family: monospace; font-size: 0.85rem; background: #111827; color: #10b981;">
                            <div>[SYSTEM] MDT CONNECTED...</div>
                            <div>[SYSTEM] CHANNEL 1 ACTIVE...</div>
                            <div id="radio-feed-content"></div>
                        </div>

                        <!-- NOTEPAD -->
                        <div id="tab-notes" class="hidden" style="flex: 1; display: flex; flex-direction: column; background: #fffbe6;">
                            <textarea id="officer-notes" style="flex: 1; background: transparent; border: none; padding: 1rem; font-family: 'Courier New', monospace; resize: none; font-size: 0.9rem; line-height: 1.5;" placeholder="Enter investigative notes here... (Vehicle descriptions, suspect statements, etc.)"></textarea>
                            <div style="padding: 5px; border-top: 1px solid #e5e7eb; font-size: 0.7rem; color: #666; text-align: center;">AUTO-SAVE ENABLED</div>
                        </div>
                    </div>

                    <!-- TOOLS -->
                    <div class="panel" style="flex-shrink: 0;">
                        <div class="panel-head">QUICK ACTIONS</div>
                        <div class="grid-2" style="gap: 0.5rem; padding: 1rem;">
                            <button class="btn" onclick="window.runPlate()">Run Plate</button>
                            <button class="btn btn-ghost" onclick="window.requestBackup()">Request Backup</button>
                        </div>
                    </div>

                </div>
            </div>

            <!-- INTERACTION MODAL -->
            <div id="modal-interaction" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center;">
                <div class="panel" style="width: 700px; max-width: 95vw; background: #1f2937; color: white; border: 1px solid #374151;">
                    <div class="panel-head" style="border-bottom: 1px solid #374151;">
                        <span id="int-title">INTERACTION</span>
                    </div>
                    <div class="panel-body">
                         <div class="grid-2" style="grid-template-columns: 1fr 2fr; gap: 2rem;">
                            <!-- SUBJECT IMAGE / INFO -->
                            <div style="text-align: center; border-right: 1px solid #374151; padding-right: 1rem;">
                                <div style="width: 100px; height: 100px; background: #374151; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                                    <i class="fa-solid fa-user" style="font-size: 3rem; color: #9ca3af;"></i>
                                </div>
                                <h3 id="int-sub-name">Unknown</h3>
                                <div id="int-sub-desc" style="color: #9ca3af; font-size: 0.85rem;"></div>
                            </div>
                            <!-- DIALOG -->
                            <div>
                                <div id="int-text" style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; min-height: 80px;">
                                    Officer, what seems to be the problem?
                                </div>
                                <div id="int-options" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    <!-- BUTTONS -->
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

        </div>
    `;
}

export function init() {
    startShift();

    document.getElementById('btn-end-shift').addEventListener('click', () => {
        endShift();
        alert("Shift Ended. XP Saved.");
        window.location.reload(); // Simple reset
    });

    window.runPlate = () => {
        const p = prompt("Enter Plate Number:");
        if (p) logRadio(`Unit 4921 running plate: ${p.toUpperCase()}... Comes back CLEAR.`, 'DISPATCH');
    };

    window.switchPatrolTab = (tab) => {
        if (tab === 'radio') {
            document.getElementById('tab-radio').classList.remove('hidden');
            document.getElementById('tab-notes').classList.add('hidden');
        } else {
            document.getElementById('tab-radio').classList.add('hidden');
            document.getElementById('tab-notes').classList.remove('hidden');
        }
    };

    window.requestBackup = () => {
        logRadio("Unit 4921 requesting 10-78 (Backup)!", "UNIT");
        setTimeout(() => {
            logRadio("Units en route to your location. ETA 2 minutes.", "DISPATCH");
        }, 1500);
    };
}

function startShift() {
    shiftActive = true;
    shiftStats = { xp: 0, calls: 0 };
    logRadio("UNIT 4921 10-41 (ON DUTY)", "UNIT");

    // Random Radio Chatter
    radioInterval = setInterval(() => {
        if (Math.random() > 0.7) {
            const msg = RADIO_CHATTER[Math.floor(Math.random() * RADIO_CHATTER.length)];
            logRadio(msg, "RADIO");
        }
    }, 8000);

    // Call Loop
    scheduleNextCall();
}

function endShift() {
    shiftActive = false;
    clearInterval(radioInterval);
    clearTimeout(shiftTimer);
}

function scheduleNextCall() {
    if (!shiftActive) return;
    const time = 5000 + Math.random() * 10000; // 5-15 seconds for testing
    // const time = 30000 + Math.random() * 60000; // Real

    shiftTimer = setTimeout(() => {
        if (currentCall) return; // Busy
        generateCall();
    }, time);
}

function generateCall() {
    const type = CALL_TYPES[Math.floor(Math.random() * CALL_TYPES.length)];
    const subject = generateProfile();

    // Pick a vehicle if they have one, otherwise generic
    let vehicleDesc = "Unknown Vehicle";
    if (subject.vehicles.length > 0) {
        const v = subject.vehicles[0];
        vehicleDesc = `${v.color} ${v.year} ${v.make} ${v.model}`;
    }

    currentCall = {
        ...type,
        id: 'CALL-' + Math.floor(Math.random() * 1000),
        subject: subject,
        vehicleDesc: vehicleDesc,
        stage: 'DISPATCH'
    };

    // UI Update
    updateStatus('BUSY');

    // Play sound?
    // new Audio('assets/beep.mp3').play().catch(()=>{});

    const container = document.getElementById('call-container');
    container.innerHTML = `
        <div class="panel fade-in" style="width: 100%; max-width: 500px; border-left: 5px solid var(--status-warning);">
            <div class="panel-body">
                <div style="display: flex; justify-content: space-between;">
                    <span class="badge" style="background: var(--status-warning); color: black;">PRIORITY INTERVENTION</span>
                    <span style="font-weight: 700; color: var(--text-secondary);">${currentCall.code}</span>
                </div>
                <h2 style="margin: 1rem 0;">${currentCall.label}</h2>
                <div style="margin-bottom: 1rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-location-dot"></i> ${Math.floor(Math.random() * 100)} Main St
                </div>
                 <div style="margin-bottom: 1rem; font-size: 0.9rem; background: #fffbe6; padding: 0.5rem; border-radius: 4px; border: 1px solid #e5e7eb;">
                    <span style="font-weight: 600;">SUSPECT VEHICLE:</span> ${vehicleDesc}
                </div>
                <button id="btn-respond" class="btn btn-primary" style="width: 100%;">RESPOND (CODE 3)</button>
            </div>
        </div>
    `;

    logRadio(`DISPATCH: Unit 4921, respond to ${currentCall.label}. Suspect in a ${vehicleDesc} at Main St.`, "DISPATCH");

    document.getElementById('btn-respond').onclick = () => {
        startInteraction();
    };
}

function startInteraction() {
    // Determine Scenario Type
    let scenarioKey = 'TRAFFIC'; // Default
    if (DIALOG_TREES[currentCall.type]) scenarioKey = currentCall.type;

    // Setup Modal
    const modal = document.getElementById('modal-interaction');
    const title = document.getElementById('int-title');
    const name = document.getElementById('int-sub-name');
    const desc = document.getElementById('int-sub-desc');

    modal.classList.remove('hidden');
    title.innerText = `${currentCall.label} - INTERVIEW`;
    name.innerText = `${currentCall.subject.name}`;
    desc.innerText = `${currentCall.subject.age} y/o / ${currentCall.subject.sex} / Since: ${currentCall.subject.dob}`;

    // Start Dialog
    runDialogNode(DIALOG_TREES[scenarioKey].start, DIALOG_TREES[scenarioKey].options, DIALOG_TREES[scenarioKey].states);
}

function runDialogNode(text, options, allStates) {
    const txtEl = document.getElementById('int-text');
    const optEl = document.getElementById('int-options');

    txtEl.innerText = `"${text}"`;
    optEl.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost interaction-btn'; // We need to style this
        btn.style.textAlign = 'left';
        btn.style.border = '1px solid #4b5563';
        btn.style.padding = '1rem';
        btn.innerText = `➤ ${opt.text}`;

        btn.onclick = () => {
            if (opt.action) {
                handleAction(opt.action);
            } else if (opt.next && allStates[opt.next]) {
                const nextNode = allStates[opt.next];
                runDialogNode(nextNode.text, nextNode.options, allStates);
            } else {
                // End / Fallback
                closeInteraction(true);
            }
        };

        optEl.appendChild(btn);
    });
}

function handleAction(action) {
    if (action === 'run_ncic') {
        const sub = currentCall.subject;
        alert(`NCIC RETURN:\nName: ${sub.name}\nWants: ${sub.wants ? 'WARRANT ACTIVE' : 'NONE'}\nLicense: VALID`);
        // Return to dialog? For simplicity, we just clear up for now or push a 'return' node.
        // In full game, this would be an overlay.
    } else if (action === 'force') {
        alert("FORCE DEPLOYED. Subject in custody.");
        closeInteraction(true);
    } else if (action === 'clear' || action === 'chase') {
        closeInteraction(true);
    }
}

function closeInteraction(completed) {
    document.getElementById('modal-interaction').classList.add('hidden');
    if (completed) {
        completeCall();
    }
}

function completeCall() {
    const xp = 100;
    shiftStats.xp += xp;
    shiftStats.calls++;

    db.addXP(xp); // Persist

    // UI Update
    document.getElementById('shift-xp').innerText = shiftStats.xp;
    logRadio(`SHOW ME 10-8. Call Closed. (+${xp} XP)`, "UNIT");

    // Reset
    currentCall = null;
    updateStatus('AVAILABLE');

    const container = document.getElementById('call-container');
    container.innerHTML = `
        <div id="screensaver" style="text-align: center; color: var(--text-secondary);">
            <i class="fa-solid fa-check-circle" style="font-size: 4rem; margin-bottom: 1rem; color: var(--status-info);"></i>
            <h3>Call Complete</h3>
            <p>Scanning Sector...</p>
        </div>
    `;

    scheduleNextCall();
}

function logRadio(msg, author) {
    // Target tab-radio directly to keep scrolling working.
    const feed = document.getElementById('tab-radio');
    const line = document.createElement('div');
    line.style.marginBottom = '6px';
    const time = new Date().toLocaleTimeString();

    let color = '#10b981';
    if (author === 'DISPATCH') color = '#fbbf24';
    if (author === 'UNIT') color = '#60a5fa';

    line.innerHTML = `<span style="opacity:0.6;">[${time}]</span> <strong style="color:${color};">${author}:</strong> ${msg}`;

    // Add to feed if it exists (might be hidden or not init yet)
    if (feed) {
        if (author === 'DISPATCH') {
            // Dispatch also goes to the "Radio" list in main view if we wanted, 
            // but here we just append to the tab.
        }
        feed.appendChild(line);
        feed.scrollTop = feed.scrollHeight;
    }
}
