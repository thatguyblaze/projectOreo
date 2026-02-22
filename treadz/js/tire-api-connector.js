/**
 * Treadz API Connector
 * Ready to integrate with external distributor APIs (e.g., DeepConnect, ATD, etc.)
 * This provides the logic to fetch and map data to the internal catalog format.
 */

const TireAPIConnector = (() => {

    /**
     * Map a DeepConnect product response to our internal Tire format
     */
    const _mapDeepConnectProduct = (p) => ({
        _sourceId: 'ATD', // Identification for this source
        vendor_id: p.brandId || '',
        vendor_name: p.brand || '',
        model_id: p.styleId || '',
        model_name: p.style || '',
        car_type_str: p.productType || 'Passenger',
        season: p.season || 'All Season',
        photo: p.imageThumbnail || '',
        _price: parseFloat(p.price) || 0,
        _availability: p.availability || 0,
        sizes: [{
            width: String(p.width || ''),
            profile: String(p.ratio || ''),
            rim: String(p.rim || ''),
            load_index: p.loadIndex || '',
            speed_rating: p.speedRating || ''
        }],
        size_display: `${p.width}/${p.ratio}R${p.rim}`
    });

    return {
        /**
         * Generic fetch method that uses the config in TreadzConfig
         */
        async fetchItems(query = {}) {
            const config = TreadzConfig.API.DEEPCONNECT;
            if (!config || !config.ENABLED || !config.BASE_URL) {
                console.warn('[TireAPIConnector] DeepConnect integration is disabled or not configured.');
                return [];
            }

            try {
                // Construct the appropriate endpoint based on query params
                // Note: Actual endpoints from documentation will be used here
                let endpoint = `${config.BASE_URL}/products`;

                // Example: size search
                if (query.width && query.profile && query.rim) {
                    endpoint += `/search?width=${query.width}&ratio=${query.profile}&rim=${query.rim}`;
                }

                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${config.API_KEY}`,
                        'X-Client-Id': config.CLIENT_ID,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error(`API Error: ${response.status}`);

                const data = await response.json();

                // Expecting a response structure like { products: [...] }
                const products = data.products || data.items || [];
                return products.map(_mapDeepConnectProduct);

            } catch (error) {
                console.error('[TireAPIConnector] Fetch failed:', error);
                return [];
            }
        },

        /**
         * Place an order (Purchase Order) through the API
         */
        async placeOrder(cart) {
            const config = TreadzConfig.API.DEEPCONNECT;
            if (!config || !config.ENABLED) return { success: false, message: 'API not enabled' };

            try {
                // Map local cart to API expected order format
                const orderData = {
                    branchCode: config.BRANCH_CODE,
                    items: cart.map(i => ({
                        productId: i.id,
                        quantity: i.quantity
                    }))
                };

                const response = await fetch(`${config.BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });

                const result = await response.json();
                return {
                    success: response.ok,
                    orderId: result.orderId,
                    message: result.message || (response.ok ? 'Order placed successfully' : 'Failed to place order')
                };

            } catch (error) {
                console.error('[TireAPIConnector] Order failed:', error);
                return { success: false, message: error.message };
            }
        }
    };
})();
