export const CALL_TYPES = [
    { type: 'TRAFFIC', label: 'Traffic Stop', code: '10-81', duration: 15 },
    { type: 'SUSPICIOUS', label: 'Suspicious Subject', code: '10-37', duration: 20 },
    { type: 'ALARM', label: 'Burglar Alarm', code: '10-42', duration: 10 },
    { type: 'THEFT', label: 'Theft Report', code: '10-43', duration: 25 },
    { type: 'DOMESTIC', label: 'Domestic Disturbance', code: '10-90', duration: 30 }
];

export const DIALOG_TREES = {
    'TRAFFIC': {
        start: "Officer approaches the driver side window.",
        options: [
            { text: "License and Registration, please.", next: 'docs', effect: 'compliant' },
            { text: "Do you know why I stopped you?", next: 'why', effect: 'neutral' },
            { text: "DRIVER OUT OF THE CAR!", next: 'agitated', effect: 'escalate' }
        ],
        states: {
            'docs': { text: "Subject hands over paperwork. 'Is there a problem, Officer?'", options: [{ text: "Check NCIC", action: 'run_ncic' }] },
            'why': { text: "'Honestly no idea. Was I speeding?'", options: [{ text: "Yes, 15 over.", next: 'docs' }, { text: "Tail light out.", next: 'docs' }] },
            'agitated': { text: "Subject grips steering wheel. 'I didn't do anything!'", options: [{ text: "Calm down, just need ID.", next: 'docs' }, { text: "Taser! Taser!", action: 'force' }] }
        }
    },
    'SUSPICIOUS': {
        start: "Subject is standing near the closed business looking nervous.",
        options: [
            { text: "Evening. Everything okay?", next: 'casual', effect: 'good' },
            { text: "Stop! Hands where I can see them!", next: 'run', effect: 'bad' }
        ],
        states: {
            'casual': { text: "'Just waiting for a ride, officer. My car broke down.'", options: [{ text: "ID please.", action: 'run_ncic' }, { text: "Move along.", action: 'clear' }] },
            'run': { text: "Subject sprints down the alleyway!", options: [{ text: "Foot Pursuit", action: 'chase' }] }
        }
    }
};

export const RADIO_CHATTER = [
    "Dispatch to 4921, check status.",
    "Bolo for Red Ford Truck, last seen southbound.",
    "201, show me 10-8 from the station.",
    "Dispatch, can you start EMS to the 10-50?",
    "Traffic Control needed at Main and First."
];
