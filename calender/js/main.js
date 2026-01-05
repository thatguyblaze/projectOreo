import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDNqUe3m9s7J2z8kk78dPNeeWdwjcrbo0M",
    authDomain: "blazinikportfolio.firebaseapp.com",
    projectId: "blazinikportfolio",
    storageBucket: "blazinikportfolio.firebasestorage.app",
    messagingSenderId: "208992861186",
    appId: "1:208992861186:web:f7fc7452f4b01291c63b1b",
    measurementId: "G-3VWF7W6G3S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// AUTH LOGIC
const loginOverlay = document.getElementById('login-overlay');
const appContainer = document.getElementById('app');
const loginBtn = document.getElementById('google-login-btn');

loginBtn.addEventListener('click', () => {
    console.log("Login button clicked, attempting sign in...");
    const provider = new GoogleAuthProvider();
    // Force prompt to ensure the popup appears
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Sign in successful!", result.user);
        })
        .catch((error) => {
            console.error("Login failed FULL ERROR:", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);

            // Standard user-friendly errors
            if (error.code === 'auth/popup-blocked') {
                alert("The login popup was blocked by your browser. Please allow popups for this site.");
            } else if (error.code === 'auth/cancelled-popup-request') {
                // User closed it, ignore
            } else if (error.code === 'auth/unauthorized-domain') {
                alert("This domain is not authorized for OAuth. Please add it in Firebase Console -> Authentication -> Settings -> Authorized Domains.");
            } else {
                alert("Login Error: " + error.message);
            }
        });
});

document.addEventListener('DOMContentLoaded', () => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let events = [];
    let unsubscribe = null; // Store listener to detach on logout

    // Auth Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Logged In
            console.log("Welcome,", user.email);
            loginOverlay.classList.add('hidden');
            appContainer.classList.remove('hidden');

            // Start Real-time listener ONLY when logged in
            // Security: We basically assume anyone logging in is YOU for now as requested.
            unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
                events = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                updateView();
                console.log("Events synced:", events.length);
            });
        } else {
            // Logged Out
            loginOverlay.classList.remove('hidden');
            appContainer.classList.add('hidden');
            if (unsubscribe) unsubscribe();
        }
    });

    // One-time Migration for existing local data
    const localEvents = JSON.parse(localStorage.getItem('calendarEvents-v2'));
    if (localEvents && localEvents.length > 0) {
        console.log("Found local events to migrate:", localEvents.length);
        // Ask user (or just do it? Let's do it automatically to be helpful, but using a flag would be safer)
        // Since we can't easily ask via UI without blocking, we'll log it and do it if not already done.
        // Actually, simplest is to just check a flag.
        if (!localStorage.getItem('firebase_migrated')) {
            if (confirm(`Connect to Cloud: Found ${localEvents.length} existing events. Upload them to your new online calendar?`)) {
                localEvents.forEach(async (evt) => {
                    const { id, ...data } = evt; // discard old ID
                    try {
                        await addDoc(collection(db, "events"), data);
                    } catch (e) {
                        console.error("Failed to migrate event:", evt, e);
                    }
                });
                localStorage.setItem('firebase_migrated', 'true');
                alert("Events are being uploaded to the cloud! They will appear shortly.");
            }
        }
    }

    let currentView = 'year';
    let isWheeling = false; // Throttling flag for scroll navigation

    // DOM Elements
    const yearView = document.getElementById('yearView');
    const monthView = document.getElementById('monthView');
    const viewTitle = document.getElementById('viewTitle');
    const viewToggleBtn = document.getElementById('viewToggleBtn');
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearHeader = document.getElementById('monthYearHeader');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');
    const countdownContainer = document.getElementById('countdownContainer');
    const prevYearBtn = document.getElementById('prevYearBtn');
    const nextYearBtn = document.getElementById('nextYearBtn');

    // Modal Elements
    const eventModal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const eventForm = document.getElementById('eventForm');
    const eventStartDateInput = document.getElementById('eventStartDate');
    const eventEndDateInput = document.getElementById('eventEndDate');
    const eventIdInput = document.getElementById('eventId');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventTypeInput = document.getElementById('eventType');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventRecurringSelect = document.getElementById('eventRecurring');
    const eventCountdownCheckbox = document.getElementById('eventCountdown');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    const eventEmojiInput = document.getElementById('eventEmoji');
    const colorPicker = document.getElementById('colorPicker');
    const eventColorInput = document.getElementById('eventColor');
    const detailsModal = document.getElementById('detailsModal');
    const detailsDate = document.getElementById('detailsDate');
    const detailsDay = document.getElementById('detailsDay');
    const detailsContent = document.getElementById('detailsContent');
    const detailsCloseBtn = document.getElementById('detailsCloseBtn');

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const emojis = ['📱', '💼', '🎂', '✈️', '❤️', '💰', '💳', '🏡', '💪', '🍽️', '🎓', '🩺', '🚗', '🛜'];
    const eventColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const holidayIcons = { "new year": '🥳', "valentine": '❤️', "patrick": '🍀', "easter": '🐰', "mother": '👩‍👧‍👦', "father": '👨‍👧‍👦', "juneteenth": '✊🏿', "independence": '🎆', "halloween": '🎃', "thanksgiving": '🦃', "christmas": '🎄', "king": '🕊️' };
    const holidays = { '01-01': "New Year's Day", '01-20': "Martin Luther King, Jr. Day", '02-14': "Valentine's Day", '02-17': "Presidents' Day", '03-17': "St. Patrick's Day", '04-18': "Good Friday", '04-20': "Easter Sunday", '05-11': "Mother's Day", '05-26': "Memorial Day", '06-15': "Father's Day", '06-19': "Juneteenth", '07-04': "Independence Day", '09-01': "Labor Day", '10-13': "Columbus Day", '10-31': "Halloween", '11-11': "Veterans Day", '11-27': "Thanksgiving Day", '12-25': "Christmas Day" };

    function getHolidayIcon(title) {
        const lowerTitle = title.toLowerCase();
        for (const key in holidayIcons) if (lowerTitle.includes(key)) return holidayIcons[key];
        return '⭐';
    }

    const getISODate = (date) => date.toISOString().split('T')[0];

    function generateYearView() {
        yearView.innerHTML = '';
        const seasons = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10] };
        const seasonInfo = { winter: '❄️ Winter', spring: '🌸 Spring', summer: '☀️ Summer', autumn: '🍂 Autumn' };
        const todayString = new Date().toDateString();

        monthNames.forEach((name, index) => {
            let seasonKey = Object.keys(seasons).find(key => seasons[key].includes(index));
            let seasonDisplay = seasonInfo[seasonKey];
            let seasonClass = `month-card-${seasonKey}`;

            const monthCard = `<div class="month-card p-4 rounded-xl cursor-pointer border border-transparent ${seasonClass}" data-month="${index}" style="animation-delay: ${index * 0.05}s;">
                <div class="flex justify-between items-center mb-2">
                     <h3 class="font-bold text-lg text-accent-primary">${name}</h3>
                     <span class="text-sm font-medium text-text-secondary">${seasonDisplay}</span>
                </div>
                <div class="grid grid-cols-7 gap-1 text-xs text-center text-text-secondary">
                    ${dayNamesShort.map(d => `<div>${d[0]}</div>`).join('')}
                    ${Array(new Date(currentYear, index, 1).getDay()).fill('<div></div>').join('')}
                    ${Array.from({ length: new Date(currentYear, index + 1, 0).getDate() }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentYear, index, day);
                const isToday = date.toDateString() === todayString;
                return `<div class="w-5 h-5 flex items-center justify-center mx-auto ${isToday ? 'today-highlight-year' : ''}">${day}</div>`;
            }).join('')}
                </div>
            </div>`;
            yearView.insertAdjacentHTML('beforeend', monthCard);
        });
        yearView.querySelectorAll('.month-card').forEach(card => {
            card.addEventListener('click', () => {
                currentMonth = parseInt(card.dataset.month);
                switchToMonthView();
            });
        });
    }

    function generateMonthView() {
        calendarGrid.innerHTML = dayNamesShort.map(day => `<div class="text-center font-semibold text-text-secondary text-sm py-2">${day}</div>`).join('');
        monthYearHeader.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const oldBarsContainer = document.getElementById('event-bars-container');
        if (oldBarsContainer) oldBarsContainer.remove();
        const eventBarsContainer = document.createElement('div');
        eventBarsContainer.id = 'event-bars-container';
        calendarGrid.style.position = 'relative';
        calendarGrid.appendChild(eventBarsContainer);

        let dayCounter = 0;
        let gridCells = [];

        const prevMonth = new Date(currentYear, currentMonth, 0);
        const daysInPrevMonth = prevMonth.getDate();
        for (let i = 0; i < firstDayOfMonth; i++) {
            const day = daysInPrevMonth - firstDayOfMonth + i + 1;
            const date = new Date(currentYear, currentMonth - 1, day);
            gridCells.push({ day, date, isOtherMonth: true });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            gridCells.push({ day, date, isOtherMonth: false });
        }

        const gridTotal = 42;
        let nextMonthDay = 1;
        while (gridCells.length < gridTotal) {
            const date = new Date(currentYear, currentMonth + 1, nextMonthDay++);
            gridCells.push({ day: date.getDate(), date, isOtherMonth: true });
        }

        gridCells.forEach(cell => {
            const { day, date, isOtherMonth } = cell;
            const isoDate = getISODate(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const dayCellHTML = `<div class="day-cell-wrapper">
                <div class="day-cell flex flex-col p-2 rounded-lg cursor-pointer ${date.toDateString() === new Date().toDateString() ? 'today-highlight' : ''} ${isWeekend ? 'day-cell-weekend' : ''} ${isOtherMonth ? 'day-cell-other-month' : ''}" data-date="${isoDate}" style="animation-delay:${dayCounter++ * 0.01}s">
                    <div class="add-day-event-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
                    <span class="self-start day-number">${day}</span>
                </div>
            </div>`;
            calendarGrid.insertAdjacentHTML('beforeend', dayCellHTML);
        });

        setTimeout(() => renderEventBars(firstDayOfMonth, daysInMonth), 50);

        calendarGrid.querySelectorAll('.day-cell').forEach(cell => {
            cell.addEventListener('click', () => openDetailsModal(cell.dataset.date));
            cell.querySelector('.add-day-event-btn').addEventListener('click', (e) => { e.stopPropagation(); openEventModal(cell.dataset.date); });
        });
    }

    function renderEventBars(firstDayOfMonth, daysInMonth) {
        const eventBarsContainer = document.getElementById('event-bars-container');
        if (!eventBarsContainer) return;
        eventBarsContainer.innerHTML = '';
        const monthEvents = getEventsForMonth(currentYear, currentMonth);

        const layout = []; // This will be indexed 0-41

        // Define the start date of the 42-day grid view
        const gridViewStartDate = new Date(currentYear, currentMonth, 1 - firstDayOfMonth);
        const startOfGridView = new Date(`${getISODate(gridViewStartDate)}T12:00:00`);

        monthEvents.forEach(event => {
            const eventStartDate = new Date(`${event.date}T12:00:00`);
            const eventEndDate = event.endDate ? new Date(`${event.endDate}T12:00:00`) : eventStartDate;

            // Calculate day index relative to the start of the grid (0-41)
            const startIndex = (eventStartDate - startOfGridView) / (1000 * 60 * 60 * 24);
            const endIndex = (eventEndDate - startOfGridView) / (1000 * 60 * 60 * 24);

            // Only render events that are at all visible in the 42-day grid
            if (endIndex < 0 || startIndex > 41) return;

            const effectiveStartIndex = Math.max(0, startIndex);
            const effectiveEndIndex = Math.min(41, endIndex);

            // Find the first available vertical track for this event
            let track = 0;
            while (true) {
                let collision = false;
                for (let i = effectiveStartIndex; i <= effectiveEndIndex; i++) {
                    if (layout[i] && layout[i][track]) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) break;
                track++;
            }

            // Mark the track as occupied for the duration of the event
            for (let i = effectiveStartIndex; i <= effectiveEndIndex; i++) {
                if (!layout[i]) layout[i] = [];
                layout[i][track] = true;
            }

            const dayCellHeight = calendarGrid.querySelector('.day-cell-wrapper')?.offsetHeight || 110;

            // Render the event bar, splitting it by week if it spans multiple weeks
            let currentRenderIndex = effectiveStartIndex;
            while (currentRenderIndex <= effectiveEndIndex) {
                const weekRow = Math.floor(currentRenderIndex / 7);
                const startColumn = currentRenderIndex % 7;

                let segmentEndIndex = currentRenderIndex;
                while (segmentEndIndex + 1 <= effectiveEndIndex && Math.floor((segmentEndIndex + 1) / 7) === weekRow) {
                    segmentEndIndex++;
                }

                const durationInDays = segmentEndIndex - currentRenderIndex + 1;

                const bar = document.createElement('div');
                bar.className = 'event-bar';
                bar.style.top = `${weekRow * dayCellHeight + 30 + track * 28}px`;
                bar.style.left = `calc(${startColumn / 7 * 100}% + 4px)`;
                bar.style.width = `calc(${durationInDays / 7 * 100}% - 8px)`;
                bar.style.backgroundColor = event.color || '#3B82F6';
                bar.dataset.eventId = event.id.toString().startsWith('holiday-') ? event.id : event.id.split('-')[0];
                bar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDetailsModal(event.date);
                });

                const icon = (event.type === 'holiday') ? getHolidayIcon(event.title) : (event.emoji || (event.type === 'bill' ? '💰' : '🎉'));
                bar.innerHTML = `<span>${icon}</span><span class="truncate">${event.title}</span>`;
                eventBarsContainer.appendChild(bar);

                currentRenderIndex = segmentEndIndex + 1;
            }
        });
    }

    function checkRecurring(event, currentDate) {
        const eventDate = new Date(`${event.date}T12:00:00`);
        if (currentDate < eventDate) return false;

        switch (event.recurring) {
            case 'weekly':
                return currentDate.getDay() === eventDate.getDay();
            case 'biweekly':
                const diffTime = Math.abs(currentDate - eventDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return currentDate.getDay() === eventDate.getDay() && Math.floor(diffDays / 7) % 2 === 0;
            case 'monthly':
            case true:
                return currentDate.getDate() === eventDate.getDate();
            case 'yearly':
                return currentDate.getMonth() === eventDate.getMonth() && currentDate.getDate() === eventDate.getDate();
        }
        return false;
    }

    function getEventsForMonth(year, month) {
        const uniqueEvents = new Map();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const gridStartDate = new Date(year, month, 1 - firstDayOfMonth);
        const gridEndDate = new Date(gridStartDate);
        gridEndDate.setDate(gridStartDate.getDate() + 41);

        // 1. Add all base events (recurring or not) that overlap with the grid view
        events.forEach(event => {
            const eventStart = new Date(`${event.date}T12:00:00`);
            const eventEnd = event.endDate ? new Date(`${event.endDate}T12:00:00`) : eventStart;
            if (eventStart <= gridEndDate && eventEnd >= gridStartDate) {
                uniqueEvents.set(event.id, event);
            }
        });

        // 2. Generate recurring instances and holidays for the entire grid view
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(gridStartDate);
            currentDate.setDate(gridStartDate.getDate() + i);
            const isoDate = getISODate(currentDate);

            // Handle recurring events
            events.forEach(event => {
                if (event.recurring && event.recurring !== 'none') {
                    if (isoDate > event.date && checkRecurring(event, currentDate)) {
                        const instanceId = `${event.id}-${isoDate}`;
                        if (!uniqueEvents.has(instanceId)) {
                            const newEndDate = event.endDate ? getISODate(new Date(currentDate.getTime() + (new Date(event.endDate) - new Date(event.date)))) : null;
                            uniqueEvents.set(instanceId, {
                                ...event,
                                id: instanceId,
                                date: isoDate,
                                endDate: newEndDate,
                                isRecurringInstance: true
                            });
                        }
                    }
                }
            });

            // Handle holidays
            const monthDay = isoDate.substring(5);
            if (holidays[monthDay]) {
                const holidayId = `holiday-${isoDate}`;
                if (!uniqueEvents.has(holidayId)) {
                    uniqueEvents.set(holidayId, {
                        id: holidayId,
                        date: isoDate,
                        title: holidays[monthDay],
                        type: 'holiday',
                        color: '#10B981'
                    });
                }
            }
        }

        const monthEvents = Array.from(uniqueEvents.values());
        return monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function getEventsForDate(isoDate) {
        let dayEvents = [];
        const currentDate = new Date(`${isoDate}T12:00:00`);

        events.forEach(event => {
            const eventStart = new Date(`${event.date}T12:00:00`);
            const eventEnd = event.endDate ? new Date(`${event.endDate}T12:00:00`) : eventStart;
            if (currentDate >= eventStart && currentDate <= eventEnd) {
                dayEvents.push(event);
            }
        });

        const recurringEvents = events.filter(e => e.recurring && e.recurring !== 'none');
        recurringEvents.forEach(event => {
            if (event.date !== isoDate && checkRecurring(event, currentDate)) {
                dayEvents.push({ ...event, date: isoDate, isRecurringInstance: true });
            }
        });

        const monthDay = isoDate.substring(5);
        if (holidays[monthDay]) dayEvents.unshift({ id: `holiday-${isoDate}`, date: isoDate, title: holidays[monthDay], type: 'holiday', color: '#10B981' });
        return [...new Set(dayEvents)].sort((a, b) => a.type === 'holiday' ? -1 : 1);
    }

    function updateCountdownBanner() {
        countdownContainer.innerHTML = '';

        const today = new Date(new Date().toISOString().split('T')[0] + "T12:00:00");

        const futureCountdowns = events
            .filter(e => e.isCountdown && new Date(e.date + "T12:00:00") >= today)
            .sort((a, b) => new Date(a.date + "T12:00:00") - new Date(b.date + "T12:00:00"))
            .slice(0, 3);

        if (futureCountdowns.length > 0) {
            futureCountdowns.forEach(countdown => {
                const targetDate = new Date(countdown.date + "T12:00:00");
                const timeDiff = targetDate.getTime() - today.getTime();
                const daysRemaining = Math.round(timeDiff / (1000 * 3600 * 24));

                let countdownText;
                if (daysRemaining === 0) {
                    countdownText = `🎉 Today: ${countdown.title}`;
                } else if (daysRemaining === 1) {
                    countdownText = `⏳ Tomorrow: ${countdown.title}`;
                } else {
                    countdownText = `⏳ ${daysRemaining} days to ${countdown.title}`;
                }

                const countdownEl = document.createElement('div');
                countdownEl.textContent = countdownText;
                countdownEl.className = 'countdown-item';
                countdownContainer.appendChild(countdownEl);
            });
        }
    }

    function updateView() {
        if (currentView === 'year') {
            generateYearView();
        } else {
            generateMonthView();
        }
        updateCountdownBanner();
    }

    function updateViewTitle() { viewTitle.textContent = currentView === 'year' ? currentYear : `${monthNames[currentMonth]} ${currentYear}`; }

    function switchToView(view) {
        currentView = view;
        yearView.classList.toggle('view-hidden', view !== 'year');
        monthView.classList.toggle('view-hidden', view === 'year');

        prevYearBtn.classList.toggle('hidden', view !== 'year');
        nextYearBtn.classList.toggle('hidden', view !== 'year');

        viewToggleBtn.textContent = view === 'year' ? 'Month View' : 'Year View';
        updateViewTitle();
        updateView();
    }
    const switchToMonthView = () => switchToView('month');
    const switchToYearView = () => switchToView('year');

    // Local storage save removed in favor of Firestore


    function initPickers() {
        emojiPicker.innerHTML = emojis.map(emoji => `<div class="emoji-option" data-emoji="${emoji}">${emoji}</div>`).join('');
        colorPicker.innerHTML = eventColors.map(color => `<div class="color-option" data-color="${color}" style="background-color:${color}"></div>`).join('');

        emojiPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-option')) {
                emojiPicker.querySelector('.selected')?.classList.remove('selected');
                e.target.classList.add('selected');
                eventEmojiInput.value = e.target.dataset.emoji;
            }
        });
        colorPicker.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-option')) {
                colorPicker.querySelector('.selected')?.classList.remove('selected');
                e.target.classList.add('selected');
                eventColorInput.value = e.target.dataset.color;
            }
        });
    }

    function openModal(modal) { modal.classList.remove('hidden'); setTimeout(() => modal.classList.add('modal-visible'), 10); }
    function closeModal(modal) { modal.classList.remove('modal-visible'); setTimeout(() => modal.classList.add('hidden'), 300); }

    function openEventModal(date, eventToEdit = null) {
        openModal(eventModal);
        eventForm.reset();
        deleteEventBtn.classList.add('hidden');
        eventStartDateInput.value = date;
        eventEndDateInput.value = '';
        eventEmojiInput.value = '';
        eventColorInput.value = eventColors[0];
        emojiPicker.querySelector('.selected')?.classList.remove('selected');
        colorPicker.querySelector('.selected')?.classList.remove('selected');
        colorPicker.querySelector(`[data-color="${eventColors[0]}"]`).classList.add('selected');

        if (eventToEdit) {
            modalTitle.textContent = 'Edit Item';
            eventIdInput.value = eventToEdit.id;
            eventTitleInput.value = eventToEdit.title;
            eventStartDateInput.value = eventToEdit.date;
            eventEndDateInput.value = eventToEdit.endDate || '';
            eventTypeInput.value = eventToEdit.type;
            eventDescriptionInput.value = eventToEdit.description || '';
            eventCountdownCheckbox.checked = eventToEdit.isCountdown || false;

            const recurringValue = eventToEdit.recurring;
            if (typeof recurringValue === 'boolean' && recurringValue) {
                eventRecurringSelect.value = 'monthly'; // Backward compatibility
            } else {
                eventRecurringSelect.value = recurringValue || 'none';
            }

            if (eventToEdit.emoji) {
                eventEmojiInput.value = eventToEdit.emoji;
                emojiPicker.querySelector(`[data-emoji="${eventToEdit.emoji}"]`)?.classList.add('selected');
            }
            if (eventToEdit.color) {
                eventColorInput.value = eventToEdit.color;
                colorPicker.querySelector(`[data-color="${eventToEdit.color}"]`)?.classList.add('selected');
            }
            deleteEventBtn.classList.remove('hidden');

        } else {
            modalTitle.textContent = 'Add New Item';
            eventRecurringSelect.value = 'none';
            eventIdInput.value = '';
        }
    }

    function openDetailsModal(isoDate) {
        openModal(detailsModal);
        const date = new Date(`${isoDate}T12:00:00`);
        detailsDate.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        detailsDay.textContent = dayNames[date.getDay()];
        const dayEvents = getEventsForDate(isoDate);
        detailsContent.innerHTML = dayEvents.length === 0
            ? '<p class="text-text-secondary">No items for this day.</p>'
            : dayEvents.map(event => {
                const isEditable = event.type !== 'holiday' && !event.isRecurringInstance;
                const icon = (event.type === 'holiday') ? getHolidayIcon(event.title) : (event.emoji || (event.type === 'bill' ? '💰' : '🎉'));
                return `<div class="flex items-start justify-between p-3 rounded-lg bg-bg-tertiary ${isEditable ? 'cursor-pointer hover:bg-gray-700' : ''}" ${isEditable ? `data-event-id="${event.id}"` : ''}>
                    <div class="flex items-start gap-3">
                         <div class="event-color-dot mt-2" style="background-color:${event.color || '#3B82F6'}"></div>
                        <span class="text-lg mt-1">${icon}</span>
                        <div>
                            <p>${event.title} ${event.isRecurringInstance ? '<span class="text-xs text-accent-secondary">(Recurring)</span>' : ''}</p>
                            ${event.description ? `<p class="text-sm text-text-secondary mt-1">${event.description}</p>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');

        detailsContent.querySelectorAll('[data-event-id]').forEach(item => {
            item.addEventListener('click', () => {
                const event = events.find(e => e.id === item.dataset.eventId);
                closeModal(detailsModal);
                openEventModal(isoDate, event);
            });
        });
    }

    // Event Listeners
    viewToggleBtn.addEventListener('click', () => currentView === 'year' ? switchToMonthView() : switchToYearView());
    prevMonthBtn.addEventListener('click', () => { currentMonth = (currentMonth - 1 + 12) % 12; if (currentMonth === 11) currentYear--; updateViewTitle(); generateMonthView(); });
    nextMonthBtn.addEventListener('click', () => { currentMonth = (currentMonth + 1) % 12; if (currentMonth === 0) currentYear++; updateViewTitle(); generateMonthView(); });
    todayBtn.addEventListener('click', () => { currentYear = new Date().getFullYear(); currentMonth = new Date().getMonth(); switchToMonthView(); });

    prevYearBtn.addEventListener('click', () => { currentYear--; updateViewTitle(); generateYearView(); });
    nextYearBtn.addEventListener('click', () => { currentYear++; updateViewTitle(); generateYearView(); });

    monthView.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (isWheeling) return;
        isWheeling = true;

        if (e.deltaY < 0) { // Scrolling Up -> Previous Month
            prevMonthBtn.click();
        } else { // Scrolling Down -> Next Month
            nextMonthBtn.click();
        }

        setTimeout(() => { isWheeling = false; }, 200); // Throttle to prevent rapid scrolling
    });

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startDate = eventStartDateInput.value;
        const endDate = eventEndDateInput.value;

        if (endDate && endDate < startDate) {
            alert("End date cannot be before the start date.");
            return;
        }

        const eventData = {
            title: eventTitleInput.value,
            type: eventTypeInput.value,
            date: startDate,
            endDate: endDate || null,
            description: eventDescriptionInput.value,
            recurring: eventRecurringSelect.value,
            isCountdown: eventCountdownCheckbox.checked,
            emoji: eventEmojiInput.value,
            color: eventColorInput.value
        };

        try {
            if (eventIdInput.value) {
                await updateDoc(doc(db, "events", eventIdInput.value), eventData);
            } else {
                await addDoc(collection(db, "events"), eventData);
            }
            closeModal(eventModal);
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Error saving event (see console)");
        }
    });
    cancelBtn.addEventListener('click', () => closeModal(eventModal));
    deleteEventBtn.addEventListener('click', async () => {
        if (!eventIdInput.value) return;
        try {
            await deleteDoc(doc(db, "events", eventIdInput.value));
            closeModal(eventModal);
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    });

    detailsCloseBtn.addEventListener('click', () => closeModal(detailsModal));
    eventModal.addEventListener('click', (e) => e.target === eventModal && closeModal(eventModal));
    detailsModal.addEventListener('click', (e) => e.target === detailsModal && closeModal(detailsModal));

    // Initial Load
    initPickers();
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth();
    switchToMonthView();
});
