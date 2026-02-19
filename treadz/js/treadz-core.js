// Created with <3 by Blazinik

const TreadzConfigDefault = {
    
    VERSION: '2.5.0',

    
    BUSINESS_NAME: "Treadz Tire & Towing",
    PHONE_NUMBER: "(423) 357-4551", 
    
    SHOP_ADDRESS: "409 E Main St, Mount Carmel, TN 37645",
    SHOP_COORDS: { lat: 36.5602, lon: -82.6560 }, 

    
    TAX_RATE: 0.0975, 
    CARD_FEE_RATE: 0.035, 

    
    FEES: {
        TIRE_STATE: 1.35,  
        TIRE_DISPOSAL: 4.00, 
        TOW_HOOK: 75.00,   
        TOW_RATE_PER_MILE: 4.00 
    },

    
    SEARCH: {
        RADIUS_LOCAL_METERS: 50000,    
        RADIUS_REGIONAL_METERS: 800000, 
        SUGGESTIONS_LOCAL_MAX: 5,
        SUGGESTIONS_TOTAL_MAX: 20
    },

    
    DEFAULT_SERVICES: [
        { id: 'srv_rotation', name: 'Tire Rotation', defaultPrice: 20.00, defaultQty: 1 },
        { id: 'srv_balance', name: 'Tire Balance', defaultPrice: 20.00, defaultQty: 1 },
        { id: 'srv_stem', name: 'Valve Stems', defaultPrice: 0.00, defaultQty: 4 },
        { id: 'srv_sensor', name: 'TPMS Sensor', defaultPrice: 59.99, defaultQty: 4 },
        { id: 'srv_patch', name: 'Tire Patch', defaultPrice: 20.00, defaultQty: 1 },
        { id: 'srv_plug', name: 'Tire Plug', defaultPrice: 10.00, defaultQty: 1 }
    ]
};


const savedConfig = localStorage.getItem('treadzConfigOverrides');
let TreadzConfig = savedConfig ? { ...TreadzConfigDefault, ...JSON.parse(savedConfig) } : TreadzConfigDefault;

if (savedConfig) {
    const overrides = JSON.parse(savedConfig);
    if (overrides.FEES) TreadzConfig.FEES = { ...TreadzConfigDefault.FEES, ...overrides.FEES };
}

const TreadzUtils = {
    
    formatMoney: (amount) => {
        return '$' + (amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    
    calculateTax: (subtotal) => {
        return subtotal * TreadzConfig.TAX_RATE;
    },

    
    enableGlobalScroll: () => {
        document.addEventListener('wheel', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
                if (document.activeElement === e.target) {
                    e.preventDefault();

                    const delta = e.deltaY < 0 ? 1 : -1;

                    let currentVal = parseFloat(e.target.value) || 0;
                    let newVal = currentVal + delta;

                    
                    if (e.target.min !== "" && newVal < parseFloat(e.target.min)) {
                        newVal = parseFloat(e.target.min);
                    }

                    
                    
                    

                    e.target.value = newVal; 
                    

                    
                    e.target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }, { passive: false });
    },

    
    getNextGlobalId: () => {
        const stored = localStorage.getItem('treadzGlobalSequenceId');
        if (!stored) {
            localStorage.setItem('treadzGlobalSequenceId', '1000');
            return 1000;
        }
        return parseInt(stored);
    },

    incrementGlobalId: () => {
        const current = TreadzUtils.getNextGlobalId();
        const next = current + 1;
        localStorage.setItem('treadzGlobalSequenceId', next.toString());
        return next;
    }
};


Object.freeze(TreadzConfig);