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
        if (status === 'AVAILABLE') { el.style.background = '#22c55e'; el.style.color = 'black'; }
        else { el.style.background = '#ef4444'; el.style.color = 'white'; }
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
                    <div id="unit-status" class="badge" style="background: #22c55e; color: black;">AVAILABLE</div>
                    <div style="font-family: monospace; opacity: 0.8;">OFFICER: ${officer?.name?.toUpperCase()} | RANK: ${officer?.rank?.toUpperCase()}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.8rem; opacity: 0.7;">SHIFT XP</div>
                    <div id="shift-xp" style="font-weight: 700; font-size: 1.2rem; color: #fbbf24;">0</div>
                </div>
            </div>

            <!-- MAIN WORKSPACE - 3 Columns -->
            <div style="display: grid; grid-template-columns: 300px 1fr 350px; gap: 1rem; overflow: hidden;">
                
                <!-- LEFT: INFO / CALL LIST -->
                <div class="panel" style="display: flex; flex-direction: column; overflow: hidden; margin: 0;">
                    <div class="panel-head">
                        <span>CURRENT ASSIGNMENT</span>
                    </div>
                    <div class="panel-body" id="left-panel-content" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column;">
                        <!-- Screensaver or Mini Call Card -->
                        <div id="left-empty" style="text-align: center; margin-top: 2rem; color: var(--text-secondary);">
                             <i class="fa-solid fa-satellite-dish" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                             <div>Awaiting Dispatch...</div>
                        </div>
                        <div id="left-active" class="hidden">
                             <!-- Injected Call Details -->
                        </div>
                    </div>
                     <div style="padding: 1rem; border-top: 1px solid var(--border);">
                        <button id="btn-end-shift" class="btn btn-ghost" style="width: 100%; color: #ef4444;">End Shift</button>
                    </div>
                </div>

                <!-- MIDDLE: THE WINDSHIELD (SCENE) -->
                <div class="panel" style="display: flex; flex-direction: column; overflow: hidden; margin: 0; border: 2px solid var(--gov-blue);">
                    <div class="panel-head" style="background: var(--gov-blue); color: white; justify-content: center;">
                        <span id="scene-title">PATROL VIEW</span>
                    </div>
                    
                    <div id="scene-view" style="flex: 1; background: #f9fafb; display: flex; align-items: center; justify-content: center; position: relative; overflow-y: auto;">
                        <!-- SCENE CONTENT -->
                        <div id="scene-screensaver" style="text-align: center; opacity: 0.5;">
                            <i class="fa-solid fa-road" style="font-size: 4rem;"></i>
                            <h2 style="margin-top: 1rem;">PATROLLING SECTOR</h2>
                        </div>
                        
                        <div id="scene-content" class="hidden" style="width: 100%; height: 100%; padding: 2rem; display: flex; flex-direction: column;">
                            <!-- Injected Interaction -->
                        </div>
                    </div>
                    
                    <!-- SCENE ACTIONS FOOTER -->
                    <div id="scene-actions" class="hidden" style="padding: 1rem; background: white; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: center;">
                        <!-- Buttons like "Arrive", "Approach" -->
                    </div>
                </div>

                <!-- RIGHT: MDT TOOLS -->
                <div class="panel" style="display: flex; flex-direction: column; overflow: hidden; margin: 0;">
                    <div class="panel-head" style="padding: 0; display: flex;">
                        <button class="nav-item active" style="flex:1; border-radius:0; justify-content:center; margin:0;" onclick="window.switchPatrolTab('radio')">RADIO</button>
                        <button class="nav-item" style="flex:1; border-radius:0; justify-content:center; margin:0;" onclick="window.switchPatrolTab('notes')">NOTEPAD</button>
                    </div>
                    
                    <!-- RADIO -->
                    <div id="tab-radio" style="flex: 1; overflow-y: auto; padding: 1rem; font-family: monospace; font-size: 0.85rem; background: #111827; color: #10b981;">
                         <div id="radio-feed-content"></div>
                    </div>

                    <!-- NOTES -->
                    <div id="tab-notes" class="hidden" style="flex: 1; display: flex; flex-direction: column; background: #fffbe6;">
                        <textarea id="officer-notes" style="flex: 1; background: transparent; border: none; padding: 1rem; font-family: 'Courier New', monospace; resize: none; font-size: 0.9rem; line-height: 1.5;" placeholder="Enter investigative notes here..."></textarea>
                    </div>

                    <!-- QUICK ACTIONS -->
                    <div style="padding: 1rem; border-top: 1px solid var(--border); background: #f3f4f6;">
                         <div class="grid-2" style="gap: 5px;">
                            <button class="btn btn-primary" onclick="window.runPlate()" style="font-size: 0.8rem;">Run Plate</button>
                            <button class="btn btn-ghost" onclick="window.requestBackup()" style="font-size: 0.8rem; background: white; border: 1px solid #d1d5db;">Backup</button>
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
        window.location.reload();
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
    const time = 5000 + Math.random() * 10000;

    shiftTimer = setTimeout(() => {
        if (currentCall) return;
        generateCall();
    }, time);
}

function generateCall() {
    const type = CALL_TYPES[Math.floor(Math.random() * CALL_TYPES.length)];
    const subject = generateProfile();

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

    // Update UI Phase 1: DISPATCH
    updateStatus('BUSY');
    renderLeftPanel();

    // Alert User
    renderSceneMessage("INCOMING PRIORITY CALL", `Dispatching to ${currentCall.label}. Check details.`);

    // Enable "Enroute" button
    const actions = document.getElementById('scene-actions');
    actions.classList.remove('hidden');
    actions.innerHTML = `<button class="btn btn-primary" onclick="window.advanceCall('ENROUTE')">10-76 (En Route)</button>`;

    logRadio(`DISPATCH: Unit 4921, respond to ${currentCall.label}. Suspect in a ${vehicleDesc}.`, "DISPATCH");
}

window.advanceCall = (stage) => {
    currentCall.stage = stage;
    renderLeftPanel();

    const actions = document.getElementById('scene-actions');
    const sceneContent = document.getElementById('scene-content');

    if (stage === 'ENROUTE') {
        renderSceneMessage("EN ROUTE", "Travel time: driving to scene...");
        logRadio("Show me 10-76.", "UNIT");
        setTimeout(() => {
            renderSceneMessage("ARRIVED ON SCENE", "Visual on subject/vehicle.");
            actions.innerHTML = `<button class="btn btn-primary" onclick="window.advanceCall('ON_SCENE')">10-23 (On Scene)</button>`;
        }, 3000);
    }
    else if (stage === 'ON_SCENE') {
        logRadio("Show me 10-23.", "UNIT");
        // Investigation Phase
        startInteraction();
    }
};

function renderLeftPanel() {
    const empty = document.getElementById('left-empty');
    const active = document.getElementById('left-active');

    if (!currentCall) {
        empty.classList.remove('hidden');
        active.classList.add('hidden');
        return;
    }

    empty.classList.add('hidden');
    active.classList.remove('hidden');

    active.innerHTML = `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border);">
            <div class="badge" style="background: var(--status-warning); color: black;">${currentCall.code}</div>
            <h3 style="margin: 0.5rem 0;">${currentCall.label}</h3>
            <div class="text-secondary"><i class="fa-solid fa-location-dot"></i> Main St</div>
        </div>
        <div style="padding: 1rem;">
             <div style="font-size: 0.85rem; font-weight: 600;">SUBJECT</div>
             <div>${currentCall.subject.name}</div>
             <div class="text-secondary" style="font-size: 0.8rem;">${currentCall.subject.sex}/${currentCall.subject.race}</div>
             
             <div style="margin-top: 1rem; font-size: 0.85rem; font-weight: 600;">VEHICLE</div>
             <div style="font-size: 0.9rem;">${currentCall.vehicleDesc}</div>

             <div style="margin-top: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 4px; font-size: 0.8rem;">
                <strong>STATUS:</strong> ${currentCall.stage}
             </div>
        </div>
    `;
}

function renderSceneMessage(title, sub) {
    const view = document.getElementById('scene-view');
    document.getElementById('scene-screensaver').classList.add('hidden');
    document.getElementById('scene-content').classList.remove('hidden');

    // Simple message override
    document.getElementById('scene-content').innerHTML = `
        <div style="text-align: center; margin: auto;">
             <div style="font-size: 2rem; font-weight: 800; color: var(--gov-navy);">${title}</div>
             <div style="font-size: 1.2rem; color: var(--text-secondary); margin-top: 1rem;">${sub}</div>
        </div>
    `;
}

function startInteraction() {
    // Determine Scenario Type
    let scenarioKey = 'TRAFFIC'; // Default
    if (DIALOG_TREES[currentCall.type]) scenarioKey = currentCall.type;

    // We render the interaction IN THE SCENE VIEW now
    document.getElementById('scene-title').innerText = "FIELD INTERVIEW";

    // Inject Dialog Template into scene-content
    const container = document.getElementById('scene-content');
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 150px 1fr; gap: 2rem; max-width: 800px; margin: 0 auto; width: 100%;">
            <!-- Left: Avatar -->
            <div style="text-align: center;">
                 <div style="width: 120px; height: 120px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                    <i class="fa-solid fa-user" style="font-size: 4rem; color: #9ca3af;"></i>
                 </div>
                 <div style="font-weight: 700; font-size: 1.1rem;">${currentCall.subject.name}</div>
                 <div class="badge" style="margin-top: 5px;">Subject</div>
            </div>
            
            <!-- Right: Dialog Box -->
            <div style="display: flex; flex-direction: column;">
                 <div id="dialog-box" style="background: white; border: 1px solid var(--border); padding: 1.5rem; border-radius: 8px; box-shadow: var(--shadow-sm); min-height: 100px; margin-bottom: 1.5rem; position: relative;">
                    <i class="fa-solid fa-quote-left" style="position: absolute; top: 10px; left: 10px; color: #f3f4f6; font-size: 2rem; z-index: 0;"></i>
                    <div id="dialog-text" style="position: relative; z-index: 1; font-size: 1.1rem; line-height: 1.6;">...</div>
                 </div>

                 <div id="dialog-options" style="display: grid; gap: 10px;">
                    <!-- Buttons -->
                 </div>
            </div>
        </div>
    `;

    // Start Node
    runDialogNode(DIALOG_TREES[scenarioKey].start, DIALOG_TREES[scenarioKey].options, DIALOG_TREES[scenarioKey].states);

    // Hide footer actions for now (dialog handles them)
    document.getElementById('scene-actions').classList.add('hidden');
}

function runDialogNode(text, options, allStates) {
    const txtEl = document.getElementById('dialog-text');
    const optEl = document.getElementById('dialog-options');

    if (!txtEl) return; // Safety

    txtEl.innerText = `"${text}"`;
    optEl.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost interaction-btn';
        btn.style.textAlign = 'left';
        btn.style.border = '1px solid #d1d5db';
        btn.style.padding = '1rem';
        btn.style.background = 'white';
        btn.innerHTML = `<span style="color: var(--gov-blue); font-weight: 700; margin-right: 8px;">YOU:</span> ${opt.text}`;

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
        // In this new UI, we could auto-paste this to the notepad?
    } else if (action === 'force') {
        alert("FORCE DEPLOYED. Subject in custody.");
        closeInteraction(true);
    } else if (action === 'clear' || action === 'chase') {
        closeInteraction(true);
    }
}

function closeInteraction(completed) {
    if (completed) {
        completeCall();
    }
}

function completeCall() {
    const xp = 100;
    shiftStats.xp += xp;
    shiftStats.calls++;
    db.addXP(xp);

    document.getElementById('shift-xp').innerText = shiftStats.xp;
    logRadio(`SHOW ME 10-8. Call Closed. (+${xp} XP)`, "UNIT");

    currentCall = null;
    updateStatus('AVAILABLE');
    renderLeftPanel(); // Clear left

    renderSceneMessage("CALL CLEAR", "Returning to Patrol...");
    document.getElementById('scene-actions').innerHTML = '';
    document.getElementById('scene-actions').classList.add('hidden');

    scheduleNextCall();
}

function logRadio(msg, author) {
    const feed = document.getElementById('radio-feed-content'); // Updated ID
    if (!feed) return; // Not loaded

    const line = document.createElement('div');
    line.style.marginBottom = '6px';
    const time = new Date().toLocaleTimeString();

    let color = '#10b981';
    if (author === 'DISPATCH') color = '#fbbf24';
    if (author === 'UNIT') color = '#60a5fa';

    line.innerHTML = `<span style="opacity:0.6;">[${time}]</span> <strong style="color:${color};">${author}:</strong> ${msg}`;

    feed.appendChild(line);
    // Find parent to scroll
    const parent = document.getElementById('tab-radio');
    if (parent) parent.scrollTop = parent.scrollHeight;
}
