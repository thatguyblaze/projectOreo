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
    }
};

// Freeze to prevent accidental modification at runtime
Object.freeze(TreadzConfig);
