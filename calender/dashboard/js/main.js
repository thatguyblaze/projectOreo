document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const mainContainer = document.querySelector('.main-container');
    const sitesContainer = document.getElementById('pinned-sites-container');
    const calendarLink = document.getElementById('calendar-link');
    const addSiteModal = document.getElementById('add-site-modal');
    const addSiteForm = document.getElementById('add-site-form');
    const cancelAddSiteBtn = document.getElementById('cancel-add-site');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const notesPanel = document.getElementById('notes-panel');
    const scratchpadEditor = document.getElementById('scratchpad-editor');
    const notesBtn = document.getElementById('notes-btn');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const dateDisplay = document.getElementById('date-display');
    const greetingEl = document.getElementById('greeting');
    const factContainer = document.getElementById('fact-container');

    let sites = [];
    let longPressTimer;

    // --- DATE & CALENDAR ---
    function updateDate() {
        const now = new Date();
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
    calendarLink.addEventListener('click', () => { window.location.href = 'https://blazinikportfolio.web.app/'; });
    // made this change
    // --- FOCUS MODE ---
    function setFocusMode(isFocused) {
        document.body.classList.toggle('focus-mode', isFocused);
        localStorage.setItem('focusMode', isFocused);
    }
    focusModeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setFocusMode(!document.body.classList.contains('focus-mode'));
    });
    document.querySelector('#main-content').addEventListener('click', (e) => {
        if (e.target === e.currentTarget && document.body.classList.contains('focus-mode')) {
            setFocusMode(false);
        }
        if (document.body.classList.contains('edit-mode') && !e.target.closest('.sites-wrapper')) {
            exitEditMode();
        }
    });
    function loadFocusMode() { setFocusMode(localStorage.getItem('focusMode') === 'true'); }

    // --- WIDGET TOGGLING ---
    notesBtn.addEventListener('click', () => {
        notesPanel.classList.toggle('active');
        notesBtn.classList.toggle('active');
    });

    // --- STABLE WYSIWYG NOTES EDITOR ---
    function setupToolbar() {
        document.getElementById('scratchpad-toolbar').addEventListener('mousedown', (e) => {
            e.preventDefault();
            const button = e.target.closest('.toolbar-btn');
            if (button) document.execCommand(button.dataset.command, false, button.dataset.value || null);
        });
    }
    function saveScratchpad() { localStorage.setItem('scratchpadContent', scratchpadEditor.innerHTML); }
    function loadScratchpad() {
        const content = localStorage.getItem('scratchpadContent');
        scratchpadEditor.innerHTML = content || '<p>Welcome to your notes!</p><ul><li>Use the toolbar to format text.</li></ul>';
    }
    scratchpadEditor.addEventListener('blur', saveScratchpad);

    // --- DRAG & DROP SITE MANAGEMENT ---
    function enterEditMode() {
        document.body.classList.add('edit-mode');
        document.querySelectorAll('.site-link-container').forEach(el => el.setAttribute('draggable', true));
    }
    function exitEditMode() {
        document.body.classList.remove('edit-mode');
        document.querySelectorAll('.site-link-container').forEach(el => el.setAttribute('draggable', false));
    }

    function loadSites() {
        const storedSites = localStorage.getItem('pinnedSites');
        sites = storedSites ? JSON.parse(storedSites) : [
            { name: 'Bing', url: 'https://bing.com' }, { name: 'YouTube', url: 'https://youtube.com' },
            { name: 'GitHub', url: 'https://github.com' }, { name: 'Reddit', url: 'https://reddit.com' },
        ];
    }
    function saveSites() { localStorage.setItem('pinnedSites', JSON.stringify(sites)); }

    function renderSites() {
        sitesContainer.innerHTML = '';
        sites.forEach((site, index) => {
            const domain = new URL(site.url).hostname;
            const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            const siteName = site.name || domain;
            const container = document.createElement('div');
            container.className = 'site-link-container';
            container.dataset.index = index;
            container.innerHTML = `<button class="delete-site-btn" data-index="${index}">&#x2715;</button><a href="${site.url}" class="site-link"><div class="site-icon-wrapper"><img src="${iconUrl}" alt="${siteName} icon" class="site-icon" onerror="this.onerror=null; this.src='https://placehold.co/64x64/2a2a2a/f0f0f0?text=${siteName.charAt(0)}'"></div><span class="site-name">${siteName}</span></a>`;
            sitesContainer.appendChild(container);
        });

        const addButtonContainer = document.createElement('div');
        addButtonContainer.className = 'site-link-container add-site-btn-container';
        addButtonContainer.innerHTML = `<div class="site-link add-site-btn" style="cursor: pointer;"><div class="site-icon-wrapper"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div><span class="site-name">Add New</span></div>`;
        sitesContainer.appendChild(addButtonContainer);
    }

    sitesContainer.addEventListener('mousedown', (e) => {
        // Prevent drag initiation on delete button which causes issues in some browsers (Edge)
        if (e.target.closest('.delete-site-btn')) {
            e.stopPropagation();
            return;
        }

        if (document.body.classList.contains('edit-mode')) return;
        const target = e.target.closest('.site-link-container:not(.add-site-btn-container)');
        if (target) {
            longPressTimer = setTimeout(() => enterEditMode(), 500);
        }
    });
    document.addEventListener('mouseup', () => clearTimeout(longPressTimer));

    sitesContainer.addEventListener('click', e => {
        // 1. Add Button Check
        if (e.target.closest('.add-site-btn')) {
            addSiteModal.classList.add('active');
            return;
        }

        // 2. Delete Button Check
        const deleteBtn = e.target.closest('.delete-site-btn');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            sites.splice(parseInt(deleteBtn.dataset.index, 10), 1);
            saveSites(); renderSites(); exitEditMode(); setTimeout(enterEditMode, 10);
            return;
        }

        // 3. Edit Mode Guard (Prevent Links)
        if (document.body.classList.contains('edit-mode')) {
            e.preventDefault();
            return;
        }
    }, true);

    sitesContainer.addEventListener('dragstart', e => {
        if (!e.target.closest('.site-link-container')) return;
        e.target.closest('.site-link-container').classList.add('dragging');
    });
    sitesContainer.addEventListener('dragend', e => {
        if (!e.target.closest('.site-link-container')) return;
        e.target.closest('.site-link-container').classList.remove('dragging');
    });
    sitesContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const draggingEl = document.querySelector('.dragging');
        if (!draggingEl) return;
        const afterElement = getDragAfterElement(sitesContainer, e.clientX);
        if (afterElement == null) {
            sitesContainer.appendChild(draggingEl);
        } else {
            sitesContainer.insertBefore(draggingEl, afterElement);
        }
    });
    sitesContainer.addEventListener('drop', () => {
        const newOrder = Array.from(sitesContainer.querySelectorAll('.site-link-container:not(.add-site-btn-container)'))
            .map(el => sites[parseInt(el.dataset.index)]);
        sites = newOrder;
        saveSites();
        renderSites();
        exitEditMode();
        setTimeout(enterEditMode, 10);
    });

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.site-link-container:not(.dragging):not(.add-site-btn-container)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    addSiteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const siteName = document.getElementById('site-name').value.trim();
        let siteUrl = document.getElementById('site-url').value.trim();
        if (!siteUrl.startsWith('http')) siteUrl = `https://${siteUrl}`;
        sites.push({ name: siteName, url: siteUrl });
        saveSites(); renderSites(); addSiteForm.reset(); addSiteModal.classList.remove('active');
    });
    cancelAddSiteBtn.addEventListener('click', () => addSiteModal.classList.remove('active'));
    addSiteModal.addEventListener('click', (e) => { if (e.target === addSiteModal) addSiteModal.classList.remove('active'); });

    // --- SEARCH FUNCTIONALITY ---
    function performSearch(query) {
        if (!query) return;
        try {
            new URL(query);
            window.location.href = query.startsWith('http') ? query : `https://${query}`;
        } catch (_) {
            window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        }
    }
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); performSearch(searchInput.value.trim()); });

    // --- FLIP CLOCK LOGIC ---
    class FlipUnit {
        constructor(container, initialValue) {
            this.container = container; this.currentValue = initialValue; this.isFlipping = false;
            this.upperCard = document.createElement('div'); this.upperCard.className = 'upper-card'; this.upperCard.innerHTML = `<span>${initialValue}</span>`;
            this.lowerCard = document.createElement('div'); this.lowerCard.className = 'lower-card'; this.lowerCard.innerHTML = `<span>${initialValue}</span>`;
            this.flipper = document.createElement('div'); this.flipper.className = 'flipper';
            this.flipperFront = document.createElement('div'); this.flipperFront.className = 'flipper-front'; this.flipperFront.innerHTML = `<span>${initialValue}</span>`;
            this.flipperBack = document.createElement('div'); this.flipperBack.className = 'flipper-back'; this.flipperBack.innerHTML = `<span>${initialValue}</span>`;
            this.flipper.appendChild(this.flipperFront); this.flipper.appendChild(this.flipperBack);
            this.container.appendChild(this.upperCard); this.container.appendChild(this.lowerCard); this.container.appendChild(this.flipper);
        }
        flip(newValue) {
            if (this.isFlipping || newValue === this.currentValue) return;
            const oldValue = this.currentValue; this.isFlipping = true;
            this.upperCard.firstChild.textContent = newValue; this.flipperFront.firstChild.textContent = oldValue;
            this.flipperBack.firstChild.textContent = newValue; this.flipper.classList.add('flipping');
            setTimeout(() => {
                this.lowerCard.firstChild.textContent = newValue; this.flipperFront.firstChild.textContent = newValue;
                this.flipper.style.transition = 'none'; this.flipper.classList.remove('flipping');
                this.flipper.offsetHeight; this.flipper.style.transition = '';
                this.currentValue = newValue; this.isFlipping = false;
            }, 500);
        }
    }

    function updateClock() {
        const now = new Date(); let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM'; ampmUnit.flip(ampm);
        hours = hours % 12; hours = hours ? hours : 12;
        hoursUnit.flip(String(hours).padStart(2, '0'));
        minutesUnit.flip(String(now.getMinutes()).padStart(2, '0'));
        secondsUnit.flip(String(now.getSeconds()).padStart(2, '0'));
    }
    const initialDate = new Date(); let initialHours = initialDate.getHours();
    const initialAmpm = initialHours >= 12 ? 'PM' : 'AM';
    initialHours = initialHours % 12; initialHours = initialHours ? initialHours : 12;
    const hoursUnit = new FlipUnit(document.getElementById('hours'), String(initialHours).padStart(2, '0'));
    const minutesUnit = new FlipUnit(document.getElementById('minutes'), String(initialDate.getMinutes()).padStart(2, '0'));
    const secondsUnit = new FlipUnit(document.getElementById('seconds'), String(initialDate.getSeconds()).padStart(2, '0'));
    const ampmUnit = new FlipUnit(document.getElementById('ampm'), initialAmpm);

    // --- PASSIVE INFO WIDGETS ---
    function updateGreeting() {
        const hours = new Date().getHours();
        if (hours < 12) greetingEl.textContent = 'Good morning.';
        else if (hours < 18) greetingEl.textContent = 'Good afternoon.';
        else greetingEl.textContent = 'Good evening.';
    }
    async function getFactOfTheDay() {
        try {
            const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
            if (!res.ok) throw new Error();
            const data = await res.json();
            factContainer.textContent = data.text;
        } catch (error) { factContainer.style.display = 'none'; }
    }

    // --- GEOLOCATION & WEATHER LOGIC ---
    function getWeather() {
        const weatherContainer = document.getElementById('weather-container');
        if (!navigator.geolocation) { weatherContainer.style.display = 'none'; return; }
        const weatherIcons = { 0: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>', 1: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>', 3: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"></path><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path></svg>', 61: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13.3A5.4 5.4 0 1 0 5.2 8"></path><path d="M16 13.3a3.8 3.8 0 1 0-7.6 0"></path><path d="M12 12v6"></path><path d="M16 16v6"></path><path d="M8 16v6"></path></svg>', 95: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 17H2.5"></path><path d="M16 4.4A5.4 5.4 0 1 0 5.2 8"></path><path d="M16 4.4a3.8 3.8 0 1 0-7.6 0"></path><path d="M13 12l-2 5h4l-2 5"></path></svg>', };
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`;
                try {
                    const response = await fetch(apiUrl); const data = await response.json();
                    const temp = Math.round(data.current_weather.temperature); const code = data.current_weather.weathercode;
                    const icon = weatherIcons[code] || weatherIcons[0];
                    weatherContainer.innerHTML = `${icon}<span>${temp}°F</span>`;
                } catch (error) { weatherContainer.style.display = 'none'; }
            },
            () => { weatherContainer.style.display = 'none'; }
        );
    }

    // --- INITIALIZATION ---
    loadSites(); renderSites();
    setupToolbar(); loadScratchpad();
    loadFocusMode();
    getWeather();
    updateDate(); updateGreeting();
    getFactOfTheDay();
    updateClock(); setInterval(updateClock, 1000);
});
