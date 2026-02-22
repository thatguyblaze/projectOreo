// Created with <3 by Blazinik

const TireCatalog = (() => {
    const STORAGE_KEY = 'treadzTireCatalog';
    const META_KEY = 'treadzTireCatalogMeta';
    const SOURCES_KEY = 'treadzCatalogSources';


    const _getAll = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const _setAll = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const _getMeta = () => JSON.parse(localStorage.getItem(META_KEY)) || {
        lastImport: null,
        source: null,
        recordCount: 0,
        autoImport: false,
        importIntervalMs: 3600000,
        sftpPath: '',
        sftpAutoWatch: false
    };
    const _setMeta = (meta) => localStorage.setItem(META_KEY, JSON.stringify(meta));



    const _getSources = () => JSON.parse(localStorage.getItem(SOURCES_KEY)) || [];
    const _setSources = (sources) => localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));

    let _autoImportTimer = null;
    let _sftpWatchTimer = null;

    return {





        getAll() {
            return _getAll();
        },


        getMeta() {
            return _getMeta();
        },


        search(query) {
            if (!query || !query.trim()) return _getAll();
            const q = query.toLowerCase().trim();
            const terms = q.split(/\s+/);
            return _getAll().filter(tire => {
                const searchable = [
                    tire.vendor_name,
                    tire.model_name,
                    tire.size_display,
                    tire.season,
                    tire.car_type_str,
                    ...(tire.sizes || []).map(s => `${s.width}/${s.profile}R${s.rim}`)
                ].join(' ').toLowerCase();
                return terms.every(t => searchable.includes(t));
            });
        },


        filter({ brand, season, width, profile, rim, carType } = {}) {
            let results = _getAll();
            if (brand) results = results.filter(t => t.vendor_name?.toLowerCase() === brand.toLowerCase());
            if (season) results = results.filter(t => t.season?.toLowerCase() === season.toLowerCase());
            if (carType) results = results.filter(t => t.car_type_str?.toLowerCase() === carType.toLowerCase());
            if (width || profile || rim) {
                results = results.filter(t => {
                    return (t.sizes || []).some(s => {
                        if (width && s.width !== String(width)) return false;
                        if (profile && s.profile !== String(profile)) return false;
                        if (rim && s.rim !== String(rim)) return false;
                        return true;
                    });
                });
            }
            return results;
        },


        getBrands() {
            const brands = new Set();
            _getAll().forEach(t => { if (t.vendor_name) brands.add(t.vendor_name); });
            return [...brands].sort();
        },


        getSeasons() {
            const seasons = new Set();
            _getAll().forEach(t => { if (t.season) seasons.add(t.season); });
            return [...seasons].sort();
        },


        getRimSizes() {
            const rims = new Set();
            _getAll().forEach(t => {
                (t.sizes || []).forEach(s => { if (s.rim) rims.add(parseInt(s.rim)); });
            });
            return [...rims].sort((a, b) => a - b);
        },






        getSources() {
            return _getSources();
        },


        saveSource(source) {
            const sources = _getSources();
            const idx = sources.findIndex(s => s.id === source.id);
            if (idx >= 0) {
                sources[idx] = { ...sources[idx], ...source };
            } else {
                source.id = source.id || 'src_' + Date.now();
                source.lastImport = null;
                source.recordCount = 0;
                source.enabled = source.enabled !== false;
                sources.push(source);
            }
            _setSources(sources);
            return source.id;
        },


        removeSource(sourceId) {
            let sources = _getSources();
            sources = sources.filter(s => s.id !== sourceId);
            _setSources(sources);

            let catalog = _getAll();
            const before = catalog.length;
            catalog = catalog.filter(t => t._sourceId !== sourceId);
            _setAll(catalog);
            const meta = _getMeta();
            _setMeta({ ...meta, recordCount: catalog.length });
            return before - catalog.length;
        },


        toggleSource(sourceId, enabled) {
            const sources = _getSources();
            const src = sources.find(s => s.id === sourceId);
            if (src) {
                src.enabled = enabled;
                _setSources(sources);
            }
        },






        async importFromAPI(apiKey, sourceId) {
            const sources = _getSources();
            const source = sourceId ? sources.find(s => s.id === sourceId) : sources.find(s => s.type === 'tyresaddict');
            const base = source?.baseUrl || 'http://tyresaddict.ru/api';
            const key = apiKey || source?.apiKey;

            if (!key) throw new Error('API key is required');

            const catalog = [];


            const vendorsRes = await fetch(`${base}/tyres/vendors?api_version=1&api_key=${key}`);
            const vendorsData = await vendorsRes.json();
            if (!vendorsData.result) throw new Error(vendorsData.message || 'Failed to fetch vendors');


            for (const vendor of vendorsData.vendors) {
                const modelsRes = await fetch(`${base}/tyres/vendor_models?api_version=1&api_key=${key}&vendor_id=${vendor.vendor_id}`);
                const modelsData = await modelsRes.json();
                if (!modelsData.result) continue;

                for (const model of modelsData.models) {
                    const [detailRes, specsRes] = await Promise.all([
                        fetch(`${base}/tyres/model?api_version=1&api_key=${key}&model_id=${model.model_id}`),
                        fetch(`${base}/tyres/model_specs?api_version=1&api_key=${key}&model_id=${model.model_id}`)
                    ]);
                    const detail = await detailRes.json();
                    const specs = await specsRes.json();

                    if (detail.result && detail.model) {
                        catalog.push({
                            _sourceId: source?.id || 'tyresaddict',
                            vendor_id: vendor.vendor_id,
                            vendor_name: vendor.vendor_name,
                            model_id: model.model_id,
                            model_name: model.model_name,
                            model_year: detail.model.model_year || '',
                            car_type: detail.model.car_type || '',
                            car_type_str: detail.model.car_type_str || 'passenger',
                            season: detail.model.season || '',
                            photo: detail.model.cdn_photo_catalog || detail.model.photo_catalog || '',
                            sizes: specs.result ? (specs.sizes?.sizes || []) : [],
                            size_display: specs.result
                                ? (specs.sizes?.sizes || []).map(s => `${s.width}/${s.profile}R${s.rim}`).join(', ')
                                : ''
                        });
                    }
                }
            }


            this._mergeSourceData(source?.id || 'tyresaddict', catalog, source?.name || 'TyresAddict API');
            return catalog.length;
        },


        async importFromGenericAPI(sourceId) {
            const sources = _getSources();
            const source = sources.find(s => s.id === sourceId);
            if (!source) throw new Error('Source not found');
            if (!source.baseUrl) throw new Error('API endpoint URL is required');

            const headers = {};
            if (source.apiKey) {
                headers['Authorization'] = `Bearer ${source.apiKey}`;
                headers['X-API-Key'] = source.apiKey;
            }

            const res = await fetch(source.baseUrl, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

            const data = await res.json();
            let items = Array.isArray(data) ? data : (data.results || data.data || data.tires || data.items || []);

            const catalog = items.map(item => ({
                _sourceId: source.id,
                vendor_id: item.vendor_id || item.brand_id || '',
                vendor_name: item.vendor_name || item.brand || item.manufacturer || '',
                model_id: item.model_id || item.id || '',
                model_name: item.model_name || item.model || item.name || '',
                model_year: item.model_year || item.year || '',
                car_type_str: item.car_type_str || item.vehicle_type || item.type || 'passenger',
                season: item.season || '',
                photo: item.photo || item.image || item.img || '',
                sizes: item.sizes || [],
                size_display: item.size_display || (item.sizes || []).map(s => `${s.width}/${s.profile}R${s.rim}`).join(', ')
            }));

            this._mergeSourceData(source.id, catalog, source.name);
            return catalog.length;
        },


        /**
         * Dynamic Sync with TireAPIConnector (e.g. DeepConnect)
         * This uses the newly created abstraction to fetch from external APIs
         */
        async syncWithConnector(query = {}) {
            if (typeof TireAPIConnector === 'undefined') {
                console.error('[TireCatalog] TireAPIConnector not loaded.');
                return 0;
            }

            const items = await TireAPIConnector.fetchItems(query);
            if (items && items.length > 0) {
                // Merge with existing catalog under the designated source
                this._mergeSourceData('ATD', items, 'DeepConnect API');
                return items.length;
            }
            return 0;
        },






        importFromJSON(data, sourceId, sourceName) {
            let catalog;
            if (typeof data === 'string') {
                catalog = JSON.parse(data);
            } else if (Array.isArray(data)) {
                catalog = data;
            } else {
                throw new Error('Invalid JSON data - expected array');
            }

            const sid = sourceId || 'file_import';
            catalog = catalog.map(item => ({
                _sourceId: sid,
                vendor_id: item.vendor_id || '',
                vendor_name: item.vendor_name || item.brand || '',
                model_id: item.model_id || '',
                model_name: item.model_name || item.model || item.name || '',
                model_year: item.model_year || '',
                car_type_str: item.car_type_str || item.vehicle_type || 'passenger',
                season: item.season || '',
                photo: item.photo || item.image || '',
                sizes: item.sizes || [],
                size_display: item.size_display || (item.sizes || []).map(s => `${s.width}/${s.profile}R${s.rim}`).join(', ')
            }));

            this._mergeSourceData(sid, catalog, sourceName || 'JSON File Import');
            return catalog.length;
        },


        importFromCSV(csvText, sourceId, sourceName) {
            const lines = csvText.trim().split('\n');
            if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const catalog = [];
            const modelMap = {};
            const sid = sourceId || 'file_import';

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                const row = {};
                header.forEach((h, idx) => { row[h] = cols[idx] || ''; });

                const key = `${row.vendor || row.brand}|${row.model || row.model_name}`;
                if (!modelMap[key]) {
                    modelMap[key] = {
                        _sourceId: sid,
                        vendor_id: row.vendor_id || String(Object.keys(modelMap).length + 1),
                        vendor_name: row.vendor || row.brand || '',
                        model_id: row.model_id || String(Object.keys(modelMap).length + 1),
                        model_name: row.model || row.model_name || '',
                        model_year: row.year || '',
                        car_type_str: row.type || row.car_type || 'passenger',
                        season: row.season || '',
                        photo: row.photo || row.image || '',
                        sizes: []
                    };
                }
                if (row.width && row.profile && row.rim) {
                    modelMap[key].sizes.push({
                        width: row.width,
                        profile: row.profile,
                        rim: row.rim,
                        load_index: row.load_index || '',
                        speed_rating: row.speed_rating || '',
                        runflat_flag: row.runflat || 'off',
                        xl_flag: row.xl || 'off'
                    });
                }
            }

            Object.values(modelMap).forEach(tire => {
                tire.size_display = tire.sizes.map(s => `${s.width}/${s.profile}R${s.rim}`).join(', ');
                catalog.push(tire);
            });

            this._mergeSourceData(sid, catalog, sourceName || 'CSV File Import');
            return catalog.length;
        },






        setSftpPath(path) {
            const meta = _getMeta();
            _setMeta({ ...meta, sftpPath: path });
        },


        getSftpPath() {
            return _getMeta().sftpPath || '';
        },


        async importFromPath(filePath, sourceId) {
            if (!filePath) throw new Error('File path is required');


            let url = filePath;
            if (/^[A-Z]:\\/i.test(filePath)) {


                url = filePath;
            }

            if (!url.startsWith('http') && !url.startsWith('/')) {
                url = '/' + url;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${filePath}: HTTP ${res.status}`);

            const text = await res.text();
            const sid = sourceId || 'sftp_import';
            const sname = 'SFTP File Import';


            const trimmed = text.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                return this.importFromJSON(text, sid, sname);
            } else {
                return this.importFromCSV(text, sid, sname);
            }
        },


        startSftpWatch() {
            this.stopSftpWatch();
            const meta = _getMeta();
            if (!meta.sftpPath) return false;

            meta.sftpAutoWatch = true;
            _setMeta(meta);


            this.importFromPath(meta.sftpPath, 'sftp_auto').catch(e =>
                console.warn('[TireCatalog] SFTP watch import failed:', e.message)
            );

            _sftpWatchTimer = setInterval(async () => {
                try {
                    const count = await TireCatalog.importFromPath(meta.sftpPath, 'sftp_auto');
                    console.log(`[TireCatalog] SFTP watch import complete: ${count} tires`);
                } catch (e) {
                    console.warn('[TireCatalog] SFTP watch import failed:', e.message);
                }
            }, meta.importIntervalMs);

            return true;
        },


        stopSftpWatch() {
            if (_sftpWatchTimer) {
                clearInterval(_sftpWatchTimer);
                _sftpWatchTimer = null;
            }
            const meta = _getMeta();
            meta.sftpAutoWatch = false;
            _setMeta(meta);
        },






        _mergeSourceData(sourceId, newData, sourceName) {
            let catalog = _getAll();

            catalog = catalog.filter(t => t._sourceId !== sourceId);

            catalog = catalog.concat(newData);
            _setAll(catalog);


            const sources = _getSources();
            const src = sources.find(s => s.id === sourceId);
            if (src) {
                src.lastImport = new Date().toISOString();
                src.recordCount = newData.length;
                _setSources(sources);
            }


            const meta = _getMeta();
            _setMeta({
                ...meta,
                lastImport: new Date().toISOString(),
                source: sourceName || sourceId,
                recordCount: catalog.length
            });
        },






        clear() {
            localStorage.removeItem(STORAGE_KEY);
            const meta = _getMeta();
            _setMeta({ ...meta, recordCount: 0, lastImport: null, source: null });
        },


        clearSource(sourceId) {
            let catalog = _getAll();
            catalog = catalog.filter(t => t._sourceId !== sourceId);
            _setAll(catalog);
            const meta = _getMeta();
            _setMeta({ ...meta, recordCount: catalog.length });

            const sources = _getSources();
            const src = sources.find(s => s.id === sourceId);
            if (src) { src.lastImport = null; src.recordCount = 0; _setSources(sources); }
        },


        setApiKey(key) {

            let sources = _getSources();
            let src = sources.find(s => s.type === 'tyresaddict');
            if (src) {
                src.apiKey = key;
                _setSources(sources);
            } else {
                this.saveSource({ name: 'TyresAddict', type: 'tyresaddict', apiKey: key, baseUrl: 'http://tyresaddict.ru/api' });
            }
        },






        startAutoImport() {
            this.stopAutoImport();
            const meta = _getMeta();
            meta.autoImport = true;
            _setMeta(meta);

            _autoImportTimer = setInterval(async () => {
                const sources = _getSources();
                for (const src of sources) {
                    if (!src.enabled) continue;
                    try {
                        if (src.type === 'tyresaddict') {
                            await TireCatalog.importFromAPI(null, src.id);
                        } else if (src.type === 'generic') {
                            await TireCatalog.importFromGenericAPI(src.id);
                        }
                        console.log(`[TireCatalog] Auto-import ${src.name}: success`);
                    } catch (e) {
                        console.error(`[TireCatalog] Auto-import ${src.name} failed:`, e);
                    }
                }
            }, meta.importIntervalMs);

            return true;
        },


        stopAutoImport() {
            if (_autoImportTimer) {
                clearInterval(_autoImportTimer);
                _autoImportTimer = null;
            }
            const meta = _getMeta();
            meta.autoImport = false;
            _setMeta(meta);
        },






        loadSampleData() {
            const sampleCatalog = [
                {
                    vendor_id: '1', vendor_name: 'Michelin', model_id: '101', model_name: 'Defender LTX M/S',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '225', profile: '65', rim: '17', load_index: '102', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '235', profile: '70', rim: '16', load_index: '106', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '245', profile: '60', rim: '18', load_index: '105', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '17', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '55', rim: '20', load_index: '113', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '1', vendor_name: 'Michelin', model_id: '102', model_name: 'Pilot Sport 4S',
                    model_year: '2025', car_type_str: 'passenger', season: 'summer',
                    photo: '',
                    sizes: [
                        { width: '225', profile: '40', rim: '18', load_index: '92', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '35', rim: '19', load_index: '93', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '255', profile: '35', rim: '20', load_index: '97', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '275', profile: '35', rim: '19', load_index: '100', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '305', profile: '30', rim: '20', load_index: '103', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '1', vendor_name: 'Michelin', model_id: '103', model_name: 'X-Ice Snow',
                    model_year: '2024', car_type_str: 'passenger', season: 'winter',
                    photo: '',
                    sizes: [
                        { width: '205', profile: '55', rim: '16', load_index: '94', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '215', profile: '60', rim: '16', load_index: '99', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '225', profile: '45', rim: '17', load_index: '94', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '235', profile: '55', rim: '17', load_index: '103', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '2', vendor_name: 'Goodyear', model_id: '201', model_name: 'Wrangler AT/S',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '265', profile: '70', rim: '17', load_index: '113', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '60', rim: '20', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '245', profile: '75', rim: '16', load_index: '109', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '255', profile: '70', rim: '18', load_index: '113', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '2', vendor_name: 'Goodyear', model_id: '202', model_name: 'Assurance MaxLife',
                    model_year: '2025', car_type_str: 'passenger', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '205', profile: '55', rim: '16', load_index: '91', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '215', profile: '60', rim: '16', load_index: '95', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '225', profile: '65', rim: '17', load_index: '102', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '235', profile: '55', rim: '17', load_index: '99', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '3', vendor_name: 'BFGoodrich', model_id: '301', model_name: 'All-Terrain T/A KO2',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '265', profile: '70', rim: '17', load_index: '121', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '65', rim: '18', load_index: '123', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '285', profile: '75', rim: '16', load_index: '126', speed_rating: 'R', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '315', profile: '70', rim: '17', load_index: '121', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '35', profile: '1250', rim: '17', load_index: '121', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '4', vendor_name: 'Continental', model_id: '401', model_name: 'CrossContact LX25',
                    model_year: '2025', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '225', profile: '65', rim: '17', load_index: '102', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '235', profile: '60', rim: '18', load_index: '107', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '60', rim: '18', load_index: '105', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '255', profile: '55', rim: '19', load_index: '111', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '4', vendor_name: 'Continental', model_id: '402', model_name: 'ExtremeContact DWS 06 Plus',
                    model_year: '2024', car_type_str: 'passenger', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '205', profile: '50', rim: '17', load_index: '93', speed_rating: 'W', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '225', profile: '45', rim: '17', load_index: '91', speed_rating: 'W', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '225', profile: '40', rim: '18', load_index: '92', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '40', rim: '18', load_index: '97', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '255', profile: '35', rim: '19', load_index: '96', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '5', vendor_name: 'Bridgestone', model_id: '501', model_name: 'Dueler H/L Alenza Plus',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '225', profile: '65', rim: '17', load_index: '102', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '235', profile: '55', rim: '18', load_index: '100', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '245', profile: '60', rim: '18', load_index: '105', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '255', profile: '55', rim: '19', load_index: '111', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '265', profile: '50', rim: '20', load_index: '107', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '5', vendor_name: 'Bridgestone', model_id: '502', model_name: 'Potenza RE980AS+',
                    model_year: '2025', car_type_str: 'passenger', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '215', profile: '45', rim: '17', load_index: '91', speed_rating: 'W', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '225', profile: '50', rim: '17', load_index: '94', speed_rating: 'W', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '235', profile: '45', rim: '18', load_index: '98', speed_rating: 'W', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '40', rim: '18', load_index: '97', speed_rating: 'W', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '6', vendor_name: 'Pirelli', model_id: '601', model_name: 'Scorpion AS Plus 3',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '235', profile: '60', rim: '18', load_index: '107', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '60', rim: '18', load_index: '105', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '255', profile: '55', rim: '20', load_index: '110', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '265', profile: '50', rim: '20', load_index: '111', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '6', vendor_name: 'Pirelli', model_id: '602', model_name: 'P Zero',
                    model_year: '2025', car_type_str: 'passenger', season: 'summer',
                    photo: '',
                    sizes: [
                        { width: '225', profile: '40', rim: '18', load_index: '92', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '35', rim: '19', load_index: '93', speed_rating: 'Y', runflat_flag: 'on', xl_flag: 'on' },
                        { width: '255', profile: '35', rim: '20', load_index: '97', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '275', profile: '30', rim: '20', load_index: '97', speed_rating: 'Y', runflat_flag: 'on', xl_flag: 'on' },
                        { width: '295', profile: '35', rim: '21', load_index: '107', speed_rating: 'Y', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '7', vendor_name: 'Cooper', model_id: '701', model_name: 'Discoverer AT3 4S',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '235', profile: '75', rim: '15', load_index: '105', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '245', profile: '70', rim: '16', load_index: '107', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '16', load_index: '112', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '17', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '60', rim: '20', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '8', vendor_name: 'Hankook', model_id: '801', model_name: 'Kinergy GT',
                    model_year: '2024', car_type_str: 'passenger', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '195', profile: '65', rim: '15', load_index: '91', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '205', profile: '55', rim: '16', load_index: '91', speed_rating: 'H', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '215', profile: '55', rim: '17', load_index: '94', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '225', profile: '50', rim: '17', load_index: '94', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '235', profile: '45', rim: '18', load_index: '94', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '8', vendor_name: 'Hankook', model_id: '802', model_name: 'Dynapro AT2',
                    model_year: '2025', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '245', profile: '70', rim: '16', load_index: '107', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '17', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '65', rim: '18', load_index: '116', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '285', profile: '65', rim: '18', load_index: '125', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '9', vendor_name: 'Yokohama', model_id: '901', model_name: 'Geolandar A/T G015',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '245', profile: '70', rim: '16', load_index: '106', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '65', rim: '17', load_index: '112', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '55', rim: '20', load_index: '117', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '285', profile: '70', rim: '17', load_index: '117', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '10', vendor_name: 'Toyo', model_id: '1001', model_name: 'Open Country A/T III',
                    model_year: '2025', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '245', profile: '75', rim: '16', load_index: '109', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '17', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '65', rim: '18', load_index: '116', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '285', profile: '75', rim: '16', load_index: '126', speed_rating: 'R', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '33', profile: '1250', rim: '18', load_index: '122', speed_rating: 'Q', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '11', vendor_name: 'Nitto', model_id: '1101', model_name: 'Ridge Grappler',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '265', profile: '70', rim: '17', load_index: '121', speed_rating: 'S', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '55', rim: '20', load_index: '117', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '285', profile: '70', rim: '17', load_index: '116', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '295', profile: '70', rim: '18', load_index: '129', speed_rating: 'Q', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '35', profile: '1250', rim: '20', load_index: '125', speed_rating: 'Q', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '12', vendor_name: 'Falken', model_id: '1201', model_name: 'Wildpeak A/T3W',
                    model_year: '2025', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '245', profile: '70', rim: '16', load_index: '107', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '17', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '60', rim: '20', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '285', profile: '70', rim: '17', load_index: '117', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '13', vendor_name: 'General', model_id: '1301', model_name: 'Grabber A/TX',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '245', profile: '70', rim: '17', load_index: '110', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '16', load_index: '112', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '60', rim: '20', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                },
                {
                    vendor_id: '14', vendor_name: 'Kumho', model_id: '1401', model_name: 'Crugen HP71',
                    model_year: '2024', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '225', profile: '60', rim: '17', load_index: '99', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '235', profile: '60', rim: '18', load_index: '107', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'on' },
                        { width: '245', profile: '50', rim: '20', load_index: '102', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '255', profile: '50', rim: '19', load_index: '107', speed_rating: 'V', runflat_flag: 'off', xl_flag: 'on' }
                    ]
                },
                {
                    vendor_id: '15', vendor_name: 'Nexen', model_id: '1501', model_name: 'Roadian HTX2',
                    model_year: '2025', car_type_str: 'suv', season: 'all-season',
                    photo: '',
                    sizes: [
                        { width: '235', profile: '70', rim: '16', load_index: '106', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '245', profile: '70', rim: '17', load_index: '110', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '265', profile: '70', rim: '17', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' },
                        { width: '275', profile: '60', rim: '20', load_index: '115', speed_rating: 'T', runflat_flag: 'off', xl_flag: 'off' }
                    ]
                }
            ];


            const sources = ['ATD', 'TireHub', 'US Auto', 'Atlantic'];
            sampleCatalog.forEach(t => {
                t.size_display = t.sizes.map(s => `${s.width}/${s.profile}R${s.rim}`).join(', ');
                t._sourceId = sources[Math.floor(Math.random() * sources.length)];
            });

            _setAll(sampleCatalog);
            _setMeta({
                ..._getMeta(),
                lastImport: new Date().toISOString(),
                source: 'Sample Data (TyresAddict Schema)',
                recordCount: sampleCatalog.length
            });

            return sampleCatalog.length;
        }
    };
})();