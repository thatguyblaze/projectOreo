/* FIELD INTERVIEW (FI) CARDS v3 - OFFICIAL */
import { generateProfile } from './ncicGen.js';

export function getTemplate() {
    return `
        <div class="fade-in" style="height: 100%; display: flex; flex-direction: column;">
            <div class="workspace-header">
                <div>
                    <div class="ws-title">Field Interviews (FI)</div>
                </div>
                <div class="ws-controls">
                     <button class="btn btn-ghost" onclick="resetFI()">Clear Form</button>
                </div>
            </div>

            <div class="scroller" style="background: var(--bg-app);">
                <div class="grid-2" style="grid-template-columns: 2fr 1fr;">
                    
                    <!-- FI FORM -->
                    <div class="panel">
                        <div class="panel-head">
                            <span>Subject Contact Card</span>
                            <span class="text-secondary" style="font-weight: 400;" id="fi-id">FI-24-000</span>
                        </div>
                        <div class="panel-body">
                            <form id="fi-form">
                                
                                <div style="margin-bottom: 2rem;">
                                    <div class="input-group">
                                        <label class="input-label">Subject Search (NCIC)</label>
                                        <div style="display: flex; gap: 10px;">
                                            <input type="text" id="dl-search" class="input-field" placeholder="Search Name for Auto-Fill...">
                                            <button type="button" class="btn btn-primary" id="btn-lookup">Autofill</button>
                                        </div>
                                    </div>
                                    <div class="grid-2">
                                        <div class="input-group">
                                            <label class="input-label">Last Name</label>
                                            <input type="text" name="last" class="input-field" required>
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">First Name</label>
                                            <input type="text" name="first" class="input-field" required>
                                        </div>
                                    </div>
                                    <div class="grid-3">
                                        <div class="input-group">
                                            <label class="input-label">Alias / Moniker</label>
                                            <input type="text" name="alias" class="input-field">
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">Clothing Desc</label>
                                            <input type="text" name="clothing" class="input-field" placeholder="e.g. Red hoodie, jeans">
                                        </div>
                                        <div class="input-group">
                                            <label class="input-label">Stop Reason</label>
                                            <select name="reason" class="input-field">
                                                <option>Suspicious Person</option>
                                                <option>Traffic Stop</option>
                                                <option>Terry Stop</option>
                                                <option>Consensual Encounter</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label class="input-label">Detailed Narrative / Observations</label>
                                    <textarea name="narrative" class="input-field" rows="4" placeholder="Describe the encounter, associates, and any intelligence gathered..."></textarea>
                                </div>

                                <div class="grid-2">
                                    <div class="input-group">
                                        <label class="input-label">Location</label>
                                        <input type="text" name="location" class="input-field" required>
                                    </div>
                                    <div class="input-group">
                                        <label class="input-label">Date/Time</label>
                                        <input type="datetime-local" name="timestamp" class="input-field" required>
                                    </div>
                                </div>

                                <div style="text-align: right; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
                                    <button type="submit" class="btn btn-primary" style="padding: 10px 24px;">File Contact Card</button>
                                </div>

                            </form>
                        </div>
                    </div>

                    <!-- RECENT LIST -->
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                         <div class="panel">
                             <div class="panel-head">Recent Contacts (Shift)</div>
                             <div class="panel-body" style="padding: 0;">
                                 <div id="fi-list" style="display: flex; flex-direction: column;">
                                    <!-- Injected -->
                                 </div>
                             </div>
                         </div>
                    </div>

                </div>
            </div>

            <!-- MODAL: VIEW CARD -->
            <div id="modal-fi-view" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center;">
                <div class="panel" style="width: 500px; max-width: 90vw; margin: 0;">
                    <div class="panel-head">
                        <span id="view-id">FI-24-XXX</span>
                        <button class="btn btn-ghost" onclick="document.getElementById('modal-fi-view').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="panel-body">
                         <div class="grid-2" style="margin-bottom: 1rem;">
                            <div>
                                <label class="input-label">Subject</label>
                                <div id="view-subject" style="font-weight: 600;"></div>
                            </div>
                            <div>
                                <label class="input-label">Time</label>
                                <div id="view-time"></div>
                            </div>
                         </div>
                         <div style="margin-bottom: 1rem;">
                            <label class="input-label">Reason & Location</label>
                            <div id="view-meta"></div>
                         </div>
                         <div style="background: #f9fafb; padding: 1rem; border-radius: var(--radius);">
                            <label class="input-label">NARRATIVE</label>
                            <div id="view-narrative" style="white-space: pre-wrap; font-size: 0.9rem; color: var(--text-secondary);"></div>
                         </div>
                    </div>
                </div>
            </div>

        </div>
    `;
}

// Local Mock Store
const FI_KEY = 'cmd_fi_v2';

export function init() {
    const form = document.getElementById('fi-form');
    document.getElementById('fi-id').innerText = 'FI-24-' + Math.floor(Math.random() * 10000);
    form.querySelector('[name="timestamp"]').value = new Date().toISOString().slice(0, 16);

    renderList();

    // Autofill
    document.getElementById('btn-lookup').addEventListener('click', () => {
        const q = document.getElementById('dl-search').value;
        if (!q) return;
        const p = generateProfile(q);
        const names = p.name.split(' ');
        form.querySelector('[name="last"]').value = names[names.length - 1];
        form.querySelector('[name="first"]').value = names[0];
        form.querySelector('[name="location"]').value = "Main St & Broadway";
    });

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const card = {
            id: document.getElementById('fi-id').innerText,
            subject: `${data.last}, ${data.first}`,
            reason: data.reason,
            location: data.location,
            time: data.timestamp,
            narrative: data.narrative
        };

        const list = JSON.parse(localStorage.getItem(FI_KEY) || '[]');
        list.unshift(card);
        localStorage.setItem(FI_KEY, JSON.stringify(list));

        renderList();
        form.reset();
        document.getElementById('fi-id').innerText = 'FI-24-' + Math.floor(Math.random() * 10000);
        form.querySelector('[name="timestamp"]').value = new Date().toISOString().slice(0, 16);
    });
}

function renderList() {
    const list = JSON.parse(localStorage.getItem(FI_KEY) || '[]');
    const container = document.getElementById('fi-list');

    if (list.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">No cards filed this shift.</div>`;
        return;
    }

    container.innerHTML = list.map((c, index) => `
        <div class="fi-item hover-bg-gray" data-idx="${index}" style="padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: 600; color: var(--text-primary);">${c.subject}</span>
                <span class="text-secondary" style="font-size: 0.75rem;">${new Date(c.time).toLocaleTimeString()}</span>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.85rem;">${c.reason}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;"><i class="fa-solid fa-location-dot"></i> ${c.location}</div>
        </div>
    `).join('');

    // Add click listeners
    container.querySelectorAll('.fi-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = el.dataset.idx;
            openCard(list[idx]);
        });
        el.addEventListener('mouseenter', () => el.style.background = '#f9fafb');
        el.addEventListener('mouseleave', () => el.style.background = 'transparent');
    });
}

function openCard(card) {
    document.getElementById('view-id').innerText = card.id;
    document.getElementById('view-subject').innerText = card.subject;
    document.getElementById('view-time').innerText = new Date(card.time).toLocaleString();
    document.getElementById('view-meta').innerText = `${card.reason} at ${card.location}`;
    document.getElementById('view-narrative').innerText = card.narrative || "No narrative entered.";

    document.getElementById('modal-fi-view').classList.remove('hidden');
}

window.resetFI = () => document.getElementById('fi-form').reset();
