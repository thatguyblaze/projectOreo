/**
 * Treadz Core Configuration & Utilities
 * 
 * This file centralizes all business logic constants and shared utility functions
 * to ensure consistency across the entire Treadz platform.
 * 
 * ENGINEERING STANDARD: Single Source of Truth
 */

const TreadzConfig = {
    // Business Info
    BUSINESS_NAME: "Treadz Tire & Towing",
    PHONE_NUMBER: "(423) 357-4551", // Verified via Web Search
    // Addresses
    SHOP_ADDRESS: "409 E Main St, Mount Carmel, TN 37645",
    SHOP_COORDS: { lat: 36.5602, lon: -82.6560 }, // Mount Carmel, TN

    // Financials
    TAX_RATE: 0.0975, // 9.75% TN Sales Tax
    CARD_FEE_RATE: 0.035, // 3.5% Card Processing Fee

    // Standard Fees
    FEES: {
        TIRE_STATE: 1.35,  // State Tire Fee
        TIRE_DISPOSAL: 4.00, // Disposal Fee
        TOW_HOOK: 75.00,   // Standard Tow Hook Fee
        TOW_RATE_PER_MILE: 4.00 // Standard Tow Mileage Rate
    },

    // Search Configuration
    SEARCH: {
        RADIUS_LOCAL_METERS: 50000,    // 50km (~30 miles)
        RADIUS_REGIONAL_METERS: 800000, // 800km (~500 miles)
        SUGGESTIONS_LOCAL_MAX: 5,
        SUGGESTIONS_TOTAL_MAX: 20
    },

    // Default Services Checklist
    DEFAULT_SERVICES: [
        { id: 'srv_rotation', name: 'Tire Rotation', defaultPrice: 50.00, defaultQty: 1 },
        { id: 'srv_balance', name: 'Tire Balance', defaultPrice: 50.00, defaultQty: 1 },
        { id: 'srv_stem', name: 'Valve Stems (New)', defaultPrice: 0.00, defaultQty: 4 },
        { id: 'srv_sensor', name: 'New TPMS Sensors', defaultPrice: 59.99, defaultQty: 4 },
        { id: 'srv_patch', name: 'Tire Patch', defaultPrice: 20.00, defaultQty: 1 },
        { id: 'srv_plug', name: 'Tire Plug', defaultPrice: 10.00, defaultQty: 1 }
    ]
};

const TreadzUtils = {
    /**
     * Format a number as currency string
     * @param {number} amount 
     * @returns {string} "$12.34"
     */
    formatMoney: (amount) => {
        return '$' + (amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    /**
     * Calculate Distance between two points (Haversine formula approximation could go here if needed locally)
     * For now, just a placeholder for future shared math.
     */
    calculateTax: (subtotal) => {
        return subtotal * TreadzConfig.TAX_RATE;
    },

    /**
     * Standardizes input behavior across the app.
     * 1. Scroll Wheel on focused number inputs changes value by +/- 1
     */
    enableGlobalScroll: () => {
        document.addEventListener('wheel', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
                if (document.activeElement === e.target) {
                    e.preventDefault();

                    const delta = e.deltaY < 0 ? 1 : -1;

                    let currentVal = parseFloat(e.target.value) || 0;
                    let newVal = currentVal + delta;

                    // Respect min attribute if present
                    if (e.target.min !== "" && newVal < parseFloat(e.target.min)) {
                        newVal = parseFloat(e.target.min);
                    }

                    // For fields that might show decimals, keep them clean if they are whole numbers
                    // But if it's a price field, it might render as 15.00
                    // Since we are adding an integer 1, precision usually stays fine.

                    e.target.value = newVal; // Or .toFixed(2) if strictly currency? 
                    // Input values are strings, let's keep it simple unless it breaks formatting.

                    // Trigger input event so calculations update
                    e.target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }, { passive: false });
    },

    /**
     * GLOBAL ID SYSTEM (Quotes & Receipts Linked)
     * Starts at 1000.
     */
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

// Freeze to prevent accidental modification at runtime
Object.freeze(TreadzConfig);
