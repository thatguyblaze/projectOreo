import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

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
// Analytics removed to prevent ad-blocker issues

// AUTH LOGIC moved inside DOMContentLoaded to ensure elements exist


document.addEventListener('DOMContentLoaded', () => {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let events = [];
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
    const detailsCloseBtn = document.getElementById('detailsCloseBtn');
    const addEventFromDetailsBtn = document.getElementById('addEventFromDetailsBtn');
    const quarterViewBtn = document.getElementById('quarterViewBtn');
    const quarterView = document.getElementById('quarterView');
    const quarterGrid = document.getElementById('quarterGrid');

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const emojis = ['📱', '💼', '🎂', '✈️', '❤️', '💰', '💳', '🏡', '💪', '🍽️', '🎓', '🩺', '🚗', '🛜', '🎮', '🏀', '🎵', '🎨', '🏖️', '🐾'];
    // Expanded color palette
    const eventColors = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#06b6d4', // Cyan
        '#84cc16', // Lime
        '#14b8a6', // Teal
        '#f43f5e', // Rose
        '#d946ef', // Fuchsia
        '#6366f1', // Indigo
        '#eab308', // Yellow
        '#f97316', // Orange
        '#64748b'  // Slate
    ];

    const holidayIcons = { "new year": '🥳', "valentine": '❤️', "patrick": '🍀', "easter": '🐰', "mother": '👩‍👧‍👦', "father": '👨‍👧‍👦', "juneteenth": '✊🏿', "independence": '🎆', "halloween": '🎃', "thanksgiving": '🦃', "christmas": '🎄', "king": '🕊️', "history": '📖' };

    function getEaster(year) {
        const f = Math.floor,
            G = year % 19,
            C = f(year / 100),
            H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
            I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
            J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
            L = I - J,
            month = 3 + f((L + 40) / 44),
            day = L + 28 - 31 * f(month / 4);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    function getNthWeekdayOfMonth(year, month, weekday, n) {
        const firstDay = new Date(year, month, 1);
        let count = 0;
        for (let day = 1; day <= 31; day++) {
            const date = new Date(year, month, day);
            if (date.getMonth() !== month) break;
            if (date.getDay() === weekday) {
                count++;
                if (n === 5) {
                    const nextWeek = new Date(year, month, day + 7);
                    if (nextWeek.getMonth() !== month) return getISODate(date);
                } else {
                    if (count === n) return getISODate(date);
                }
            }
        }
        return null;
    }

    function calculateHolidays(year) {
        const holidays = [
            { date: `${year}-01-01`, title: "New Year's Day", desc: "Celebrates the start of a new Gregorian year. A time for resolutions and fresh starts." },
            { date: getNthWeekdayOfMonth(year, 0, 1, 3), title: "Martin Luther King, Jr. Day", desc: "Honors the civil rights leader Dr. Martin Luther King Jr., focusing on equality and service." },
            { date: `${year}-02-02`, title: "Groundhog Day", desc: "Folklore states if a groundhog sees its shadow, there will be six more weeks of winter." },
            { date: `${year}-02-14`, title: "Valentine's Day", desc: "A day celebrating love and affection between intimate companions." },
            { date: getNthWeekdayOfMonth(year, 1, 1, 3), title: "Presidents' Day", desc: "Commemorates the birthdays of George Washington and Abraham Lincoln." },
            { date: `${year}-03-17`, title: "St. Patrick's Day", desc: "Cultural and religious celebration of the death date of Saint Patrick, the patron saint of Ireland." },
            { date: getEaster(year), title: "Easter Sunday", desc: "Christian festival celebrating the resurrection of Jesus from the dead." },
            { date: getNthWeekdayOfMonth(year, 4, 0, 2), title: "Mother's Day", desc: "Honoring the mother of the family, as well as motherhood, maternal bonds, and the influence of mothers in society." },
            { date: getNthWeekdayOfMonth(year, 4, 1, 5), title: "Memorial Day", desc: "A federal holiday for honoring and mourning the U.S. military personnel who have died in the discharge of their duties." },
            { date: getNthWeekdayOfMonth(year, 5, 0, 3), title: "Father's Day", desc: "Honoring fathers and celebrating fatherhood, paternal bonds, and the influence of fathers in society." },
            { date: `${year}-06-19`, title: "Juneteenth", desc: "Commemorating the emancipation of enslaved African Americans." },
            { date: `${year}-07-04`, title: "Independence Day", desc: "Commemorates the Declaration of Independence, which was ratified by the Second Continental Congress on July 4, 1776." },
            { date: getNthWeekdayOfMonth(year, 8, 1, 1), title: "Labor Day", desc: "Honors the American labor movement and the contributions that workers have made to the development of the country." },
            { date: getNthWeekdayOfMonth(year, 9, 1, 2), title: "Columbus Day", desc: "Anniversary of Christopher Columbus's arrival in the Americas." },
            { date: `${year}-10-31`, title: "Halloween", desc: "A celebration known for trick-or-treating, costume parties, and carving pumpkins into jack-o'-lanterns." },
            { date: `${year}-11-11`, title: "Veterans Day", desc: "A federal holiday for honoring military veterans of the United States Armed Forces." },
            { date: getNthWeekdayOfMonth(year, 10, 4, 4), title: "Thanksgiving Day", desc: "A harvest festival. It is a time for family gatherings and giving thanks." },
            { date: `${year}-12-25`, title: "Christmas Day", desc: "An annual festival commemorating the birth of Jesus Christ, observed primarily on December 25." },
            { date: `${year}-12-31`, title: "New Year's Eve", desc: "The last day of the year, celebrated with parties and social gatherings spanning the transition of the year." }
        ];
        const easter = new Date(getEaster(year));
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        holidays.push({ date: getISODate(goodFriday), title: "Good Friday", desc: "Commemorates the crucifixion of Jesus and his death at Calvary." });

        return holidays.reduce((acc, h) => {
            if (h.date) acc[h.date.substring(5)] = { title: h.title, desc: h.desc };
            return acc;
        }, {});
    }

    const historicalEvents = [
        // January
        { month: 0, day: 1, title: "Emancipation Proclamation", desc: "1863: President Lincoln's order declaring slaves in Confederate territory free." },
        { month: 0, day: 22, title: "Roe v. Wade", desc: "1973: Supreme Court landmark decision legalizing abortion in the United States." },
        { month: 0, day: 27, title: "Liberation of Auschwitz", desc: "1945: Soviet troops liberated the Auschwitz concentration camp." },

        // February
        { month: 1, day: 11, title: "Nelson Mandela Released", desc: "1990: Nelson Mandela walked free after 27 years of imprisonment." },
        { month: 1, day: 14, title: "History of Valentine's", desc: "Origins in the Roman festival of Lupercalia to honor St. Valentine." },
        { month: 1, day: 21, title: "Malcolm X Assassination", desc: "1965: Civil rights activist Malcolm X was assassinated in New York City." },

        // March
        { month: 2, day: 8, title: "International Women's Day", desc: "A global day celebrating the social, economic, cultural, and political achievements of women." },
        { month: 2, day: 15, title: "Ides of March", desc: "44 BC: Assassination of Julius Caesar effectively ending the Roman Republic." },
        { month: 2, day: 31, title: "Eiffel Tower Opens", desc: "1889: The Eiffel Tower was officially opened to the public." },

        // April
        { month: 3, day: 4, title: "MLK Assassination", desc: "1968: Civil rights leader Dr. Martin Luther King Jr. was assassinated in Memphis." },
        { month: 3, day: 12, title: "First Man in Space", desc: "1961: Yuri Gagarin became the first human to journey into outer space." },
        { month: 3, day: 15, title: "Sinking of the Titanic", desc: "1912: RMS Titanic sank in the North Atlantic after hitting an iceberg." },
        { month: 3, day: 22, title: "Earth Day", desc: "1970: First Earth Day celebrated to demonstrate support for environmental protection." },

        // May
        { month: 4, day: 8, title: "V-E Day", desc: "1945: Victory in Europe Day marking the end of WWII in Europe." },
        { month: 4, day: 17, title: "Global Warming Alert", desc: "1956: Scientists first warned that CO2 emissions were warming the planet." },
        { month: 4, day: 29, title: "Summit of Everest", desc: "1953: Edmund Hillary and Tenzing Norgay became the first to reach the summit of Mt. Everest." },

        // June
        { month: 5, day: 5, title: "First Awareness of HIV", desc: "1981: The CDC reported the first cases of a rare pneumonia, marking the start of the AIDS epidemic." },
        { month: 5, day: 6, title: "D-Day", desc: "1944: Allied forces invaded Normandy, the largest seaborne invasion in history." },
        { month: 5, day: 19, title: "History of Juneteenth", desc: "1865: Union soldiers arrived in Texas with news that the war had ended and the enslaved were free." },
        { month: 5, day: 28, title: "Stonewall Riots", desc: "1969: Demonstrations by the LGBT community at the Stonewall Inn in NYC, sparking the gay rights movement." },

        // July
        { month: 6, day: 4, title: "Declaration of Independence", desc: "1776: Adoption of the Declaration of Independence severing ties with Britain." },
        { month: 6, day: 14, title: "Storming of the Bastille", desc: "1789: Revolutionaries stormed the Bastille prison in Paris, igniting the French Revolution." },
        { month: 6, day: 16, title: "First Atomic Test", desc: "1945: The 'Trinity' test was conducted in New Mexico, the first detonation of a nuclear weapon." },
        { month: 6, day: 20, title: "Moon Landing", desc: "1969: Apollo 11 landed on the moon. 'One small step for man, one giant leap for mankind'." },

        // August
        { month: 7, day: 6, title: "Hiroshima Bombing", desc: "1945: First use of an atomic bomb in warfare on the city of Hiroshima." },
        { month: 7, day: 15, title: "Woodstock Festival", desc: "1969: Half a million people gathered for '3 Days of Peace & Music'." },
        { month: 7, day: 26, title: "Women's Equality Day", desc: "1920: The 19th Amendment guaranteed women the constitutional right to vote." },
        { month: 7, day: 28, title: "I Have a Dream", desc: "1963: MLK delivered his famous speech during the March on Washington." },

        // September
        { month: 8, day: 11, title: "September 11 Attacks", desc: "2001: Terrorist attacks on the WTC and Pentagon changed global security." },
        { month: 8, day: 17, title: "Constitution Signed", desc: "1787: The US Constitution was signed in Philadelphia." },
        { month: 8, day: 22, title: "Emancipation Proclamation Prelim", desc: "1862: Lincoln issued the preliminary proclamation warning he would free slaves." },

        // October
        { month: 9, day: 9, title: "Fall of Berlin Wall", desc: "1989: The wall dividing East and West Berlin fell, symbolizing the end of the Cold War." },
        { month: 9, day: 12, title: "Columbus Arrives", desc: "1492: Christopher Columbus arrived in the Americas." },
        { month: 9, day: 24, title: "United Nations Day", desc: "1945: The UN Charter entered into force." },
        { month: 9, day: 29, title: "Stock Market Crash", desc: "1929: Black Tuesday, the most devastating stock market crash in US history." },

        // November
        { month: 10, day: 7, title: "Bolshevik Revolution", desc: "1917: Lenin led the revolution that launched the Soviet era." },
        { month: 10, day: 11, title: "Armistice Day", desc: "1918: WWI ended on the 11th hour of the 11th day of the 11th month." },
        { month: 10, day: 22, title: "JFK Assassination", desc: "1963: President John F. Kennedy was assassinated in Dallas, Texas." },

        // December
        { month: 11, day: 1, title: "Rosa Parks", desc: "1955: Rosa Parks was arrested for refusing to give up her bus seat, sparking the Montgomery Bus Boycott." },
        { month: 11, day: 7, title: "Pearl Harbor", desc: "1941: Surprise military strike by Japan on the US naval base in Hawaii." },
        { month: 11, day: 10, title: "Human Rights Day", desc: "1948: The UN adopted the Universal Declaration of Human Rights." },
        { month: 11, day: 25, title: "History of Christmas", desc: "Commemorating the birth of Jesus, evolving from winter solstice traditions." },
        { month: 11, day: 26, title: "Dissolution of USSR", desc: "1991: The Soviet Union was officially dissolved." }
    ];

    function getHistoricalEventsList(year) {
        return historicalEvents.map(h => {
            const date = new Date(year, h.month, h.day);
            return {
                id: `history-${year}-${h.month}-${h.day}`,
                date: getISODate(date),
                title: h.title,
                description: h.desc,
                type: 'history',
                color: '#8B5CF6',
                emoji: '📖'
            };
        });
    }

    function getHolidayIcon(title, type = 'holiday') {
        if (type === 'history') return '📖';
        const lowerTitle = title.toLowerCase();
        for (const key in holidayIcons) if (lowerTitle.includes(key)) return holidayIcons[key];
        return '⭐';
    }

    const getISODate = (date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

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
        eventBarsContainer.style.position = 'absolute';
        eventBarsContainer.style.inset = '0';
        eventBarsContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to cells
        eventBarsContainer.style.zIndex = '20'; // Above cells (z-10 on hover), below modals

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

            let cellStyle = '';
            const activePaydays = events.filter(e => e.type === 'payday' && (
                (e.date === isoDate) || (e.recurring && e.recurring !== 'none' && isoDate > e.date && checkRecurring(e, date))
            ));
            if (activePaydays.length > 0) {
                const color = activePaydays[0].color || '#3B82F6';
                cellStyle = `background-color: ${color}26;`; // ~15% opacity hex
            }

            const dayCellHTML = `<div class="day-cell-wrapper">
                <div class="day-cell flex flex-col p-1 sm:p-2 rounded-lg cursor-pointer ${date.toDateString() === new Date().toDateString() ? 'today-highlight' : ''} ${isWeekend ? 'day-cell-weekend' : ''} ${isOtherMonth ? 'day-cell-other-month' : ''}" data-date="${isoDate}" style="animation-delay:${dayCounter++ * 0.01}s; ${cellStyle}">
                    <div class="add-day-event-btn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
                    <span class="self-start day-number">${day}</span>
                </div>
            </div>`;
            calendarGrid.insertAdjacentHTML('beforeend', dayCellHTML);
        });

        requestAnimationFrame(() => {
            void calendarGrid.offsetWidth; // Force Reflow
            requestAnimationFrame(() => {
                renderEventBars(firstDayOfMonth, daysInMonth);
            });
        });

        calendarGrid.querySelectorAll('.day-cell').forEach(cell => {
            cell.addEventListener('click', () => openDetailsModal(cell.dataset.date));
            cell.querySelector('.add-day-event-btn').addEventListener('click', (e) => { e.stopPropagation(); openEventModal(cell.dataset.date); });
        });
    }
    function renderEventBars(firstDayOfMonth, daysInMonth) {
        const eventBarsContainer = document.getElementById('event-bars-container');
        if (!eventBarsContainer) return;
        eventBarsContainer.innerHTML = '';

        document.querySelectorAll('.more-events-indicator').forEach(el => el.remove());

        // Reset grid rows to ensure natural layout
        calendarGrid.style.gridTemplateRows = '';

        const monthEvents = getEventsForMonth(currentYear, currentMonth);
        const layout = [];
        const gridViewStartDate = new Date(currentYear, currentMonth, 1 - firstDayOfMonth);
        const startOfGridView = new Date(`${getISODate(gridViewStartDate)}T12:00:00`);

        // 1. Packing Algorithm
        monthEvents.forEach(event => {
            if (event.type === 'payday') return;

            const eventStartDate = new Date(`${event.date}T12:00:00`);
            const eventEndDate = event.endDate ? new Date(`${event.endDate}T12:00:00`) : eventStartDate;
            const startIndex = Math.round((eventStartDate - startOfGridView) / (1000 * 60 * 60 * 24));
            const endIndex = Math.round((eventEndDate - startOfGridView) / (1000 * 60 * 60 * 24));

            if (endIndex < 0 || startIndex > 41) return;

            const effectiveStartIndex = Math.max(0, startIndex);
            const effectiveEndIndex = Math.min(41, Math.max(endIndex, startIndex));

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

            for (let i = effectiveStartIndex; i <= effectiveEndIndex; i++) {
                if (!layout[i]) layout[i] = [];
                layout[i][track] = true;
            }

            event._renderTrack = track;
            event._renderStart = effectiveStartIndex;
            event._renderEnd = effectiveEndIndex;
            event._isRenderable = true;
        });

        // 2. Render Events using DOM Geometry
        // Index Offset: 7 headers + 1 container = 8. So cell 0 is child 8.
        const CHILD_OFFSET = 8;
        const dotsMap = {}; // Map of dayIndex -> count of dots

        monthEvents.forEach(event => {
            if (!event._isRenderable) return;

            // IS DOT MODE? (Track >= 2)
            if (event._renderTrack >= 2) {
                // Render Dots
                for (let i = event._renderStart; i <= event._renderEnd; i++) {
                    const cell = calendarGrid.children[i + CHILD_OFFSET];
                    if (!cell) continue;

                    const dotsInCell = dotsMap[i] || 0;
                    if (dotsInCell >= 5) continue; // Max 5 dots to prevent overflow
                    dotsMap[i] = dotsInCell + 1;

                    const dot = document.createElement('div');
                    dot.className = 'absolute w-1.5 h-1.5 rounded-full z-10 hover:scale-150 transition-transform cursor-pointer';
                    dot.style.backgroundColor = event.color || '#3B82F6';
                    dot.style.pointerEvents = 'auto'; // Re-enable clicks

                    // Position relative to the CELL limits
                    const cellTop = cell.offsetTop;
                    const cellLeft = cell.offsetLeft;
                    const cellHeight = cell.offsetHeight;

                    // Bottom Left Corner
                    const topPos = cellTop + cellHeight - 10;
                    const leftPos = cellLeft + 8 + (dotsInCell * 10);

                    dot.style.top = `${topPos}px`;
                    dot.style.left = `${leftPos}px`;
                    dot.title = event.title;

                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDetailsModal(event.date);
                    });

                    eventBarsContainer.appendChild(dot);
                }
                return;
            }

            // BAR MODE (Track 0 or 1)
            let currentRenderIndex = event._renderStart;
            while (currentRenderIndex <= event._renderEnd) {
                const weekRow = Math.floor(currentRenderIndex / 7);
                let segmentEndIndex = currentRenderIndex;
                while (segmentEndIndex + 1 <= event._renderEnd && Math.floor((segmentEndIndex + 1) / 7) === weekRow) {
                    segmentEndIndex++;
                }

                // Get DOM Elements for geometry
                const startCell = calendarGrid.children[currentRenderIndex + CHILD_OFFSET];
                const endCell = calendarGrid.children[segmentEndIndex + CHILD_OFFSET];

                if (startCell && endCell) {
                    // Adjusted offset to align with day cells more tightly on mobile
                    const topPos = startCell.offsetTop + 32 + (event._renderTrack * 24);
                    const leftPos = startCell.offsetLeft + 2;
                    // Width spans from start of startCell to end of endCell (minus margins)
                    const width = (endCell.offsetLeft + endCell.offsetWidth) - startCell.offsetLeft - 4;

                    const bar = document.createElement('div');
                    bar.className = 'event-bar text-xs'; // Added text-xs for smaller font on mobile
                    bar.style.top = `${topPos}px`;
                    bar.style.left = `${leftPos}px`;
                    bar.style.width = `${width}px`;
                    bar.style.height = '20px'; // Forced smaller height
                    bar.style.lineHeight = '20px'; // Vertically center text
                    bar.style.padding = '0 4px'; // Tighten padding
                    bar.style.backgroundColor = event.color || '#3B82F6';
                    bar.style.pointerEvents = 'auto'; // Re-enable clicks
                    bar.dataset.eventId = event.id.toString().startsWith('holiday-') ? event.id : event.id.split('-')[0];
                    bar.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openDetailsModal(event.date);
                    });

                    const icon = (event.type === 'holiday' || event.type === 'history') ? getHolidayIcon(event.title, event.type) : (event.emoji || (event.type === 'bill' ? '💰' : '🎉'));
                    bar.innerHTML = `<span>${icon}</span><span class="truncate">${event.title}</span>`;
                    eventBarsContainer.appendChild(bar);
                }

                currentRenderIndex = segmentEndIndex + 1;
            }
        });
    }

    function checkRecurring(event, currentDate) {
        if (!event.date) return false;
        const eventDate = new Date(`${event.date}T12:00:00`);
        if (isNaN(eventDate.getTime())) return false; // Invalid date check

        if (currentDate < eventDate) return false;

        let recurrence = event.recurring;
        // Treat 'bill' as monthly if no recurrence is set (case-insensitive check for robustness)
        if (event.type && event.type.toLowerCase() === 'bill' && (!recurrence || recurrence === 'none')) {
            recurrence = 'monthly';
        }

        // Safety check: if no recurrence is set after bill logic, it's not recurring
        if (!recurrence || recurrence === 'none') return false;

        switch (recurrence) {
            case 'weekly':
                return currentDate.getDay() === eventDate.getDay();
            case 'biweekly':
                const diffTime = Math.abs(currentDate - eventDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return currentDate.getDay() === eventDate.getDay() && Math.floor(diffDays / 7) % 2 === 0;
            case 'monthly':
            case true: // Backward compatibility for old boolean 'recurring' field
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
            if (!event.date) return;
            const eventStart = new Date(`${event.date}T12:00:00`);
            const eventEnd = event.endDate ? new Date(`${event.endDate}T12:00:00`) : eventStart;
            // Basic overlap check
            if (eventStart <= gridEndDate && eventEnd >= gridStartDate) {
                uniqueEvents.set(event.id, event);
            }
        });

        // 2. Generate recurring instances and holidays for the entire grid view
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(gridStartDate);
            currentDate.setDate(gridStartDate.getDate() + i);
            const isoDate = getISODate(currentDate);

            // Handle recurring events & Implicit Bills
            events.forEach(event => {
                try {
                    // Robust Bill Detection: Check type OR title
                    const typeIsBill = event.type && event.type.toLowerCase() === 'bill';
                    const titleIsBill = event.title && event.title.toLowerCase().includes('bill');
                    const isBill = typeIsBill || titleIsBill;

                    // pass 'isBill' to checkRecurring via a temporary property or handle it in the check?
                    // actually, checkRecurring checks 'event.type'. We should temporarily force it if title matches.

                    // Let's rely on the fact that if we pass the check, we create an instance.
                    // But checkRecurring internally checks for 'bill' type to force monthly.
                    // We need to make sure checkRecurring knows it's a bill even if type is wrong.

                    const hasRecurrence = event.recurring && event.recurring !== 'none';

                    if (hasRecurrence || isBill) {
                        // We need a version of the event that DEFINITELY has type='bill' for the check to work
                        // if we are relying on the title fallback.
                        let eventToCheck = event;
                        if (titleIsBill && !typeIsBill) {
                            eventToCheck = { ...event, type: 'bill' };
                        }

                        if (isoDate > event.date && checkRecurring(eventToCheck, currentDate)) {
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
                } catch (err) {
                    console.error("Error processing event recurrence:", event, err);
                }
            });

            // Handle holidays
            const currentYearHolidays = calculateHolidays(currentDate.getFullYear());
            const monthDay = isoDate.substring(5);
            if (currentYearHolidays[monthDay]) {
                const holidayId = `holiday-${isoDate}`;
                const holidayData = currentYearHolidays[monthDay];
                if (!uniqueEvents.has(holidayId)) {
                    uniqueEvents.set(holidayId, {
                        id: holidayId,
                        date: isoDate,
                        title: holidayData.title,
                        description: holidayData.desc,
                        type: 'holiday',
                        color: '#10B981'
                    });
                }
            }

            // Handle Historical Events
            const histEvents = getHistoricalEventsList(currentDate.getFullYear());
            const histEvent = histEvents.find(h => h.date === isoDate);
            if (histEvent) {
                if (!uniqueEvents.has(histEvent.id)) {
                    uniqueEvents.set(histEvent.id, histEvent);
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

        const currentYearHolidays = calculateHolidays(currentDate.getFullYear());
        const monthDay = isoDate.substring(5);
        const holidayData = currentYearHolidays[monthDay];
        if (holidayData) {
            dayEvents.unshift({ id: `holiday-${isoDate}`, date: isoDate, title: holidayData.title, description: holidayData.desc, type: 'holiday', color: '#10B981' });
        }

        const histEvents = getHistoricalEventsList(currentDate.getFullYear());
        const histEvent = histEvents.find(h => h.date === isoDate);
        if (histEvent) dayEvents.push(histEvent);

        return [...new Set(dayEvents)].sort((a, b) => {
            if (a.type === 'holiday') return -1;
            if (b.type === 'holiday') return 1;
            return 0;
        });
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
        monthView.classList.toggle('view-hidden', view === 'year'); // view === 'month' basically
        // Reset Quarter View visibility
        quarterView.classList.add('view-hidden');

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

    function openDetailsModal_Deprecated(isoDate) {
        detailsModal.dataset.date = isoDate;
        openModal(detailsModal);
        const date = new Date(`${isoDate}T12:00:00`);
        detailsDate.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        detailsDay.textContent = dayNames[date.getDay()];

        let dayEvents = getEventsForDate(isoDate);

        // Check for Payday
        const paydayEvent = dayEvents.find(e => e.type === 'payday');

        // Filter out payday from the visible list "Don't show payday in the list of options"
        dayEvents = dayEvents.filter(e => e.type !== 'payday');

        // Manage Payday Header Button
        const existingPaydayBtn = document.getElementById('paydayHeaderBtn');
        if (existingPaydayBtn) existingPaydayBtn.remove();

        const btnContainer = document.querySelector('#detailsModal .flex.items-center.gap-2.-mt-2.-mr-2');
        if (paydayEvent) {
            const paydayBtn = document.createElement('button');
            paydayBtn.id = 'paydayHeaderBtn';
            paydayBtn.className = 'p-2 rounded-full hover:bg-gray-700 transition-colors text-green-400';
            paydayBtn.innerHTML = '💸';
            paydayBtn.title = 'Edit Payday';
            paydayBtn.onclick = () => {
                const originalId = paydayEvent.id.toString().split('-')[0];
                const originalEvent = events.find(e => e.id === originalId);
                closeModal(detailsModal);
                openEventModal(isoDate, originalEvent || paydayEvent);
            };
            btnContainer.prepend(paydayBtn);
        }

        detailsContent.innerHTML = dayEvents.length === 0
            ? '<p class="text-text-secondary">No items for this day.</p>'
            : dayEvents.map(event => {
                const isEditable = event.type !== 'holiday' && event.type !== 'history';
                // Note: We remove the '&& !event.isRecurringInstance' check to allow clicking them.
                // We will handle the "editing series" logic in the click handler.

                const icon = (event.type === 'holiday' || event.type === 'history') ? getHolidayIcon(event.title, event.type) : (event.emoji || (event.type === 'bill' ? '💰' : '🎉'));
                const originalId = event.id.toString().split('-')[0];

                return `<div class="flex items-start justify-between p-3 rounded-lg bg-bg-tertiary ${isEditable ? 'cursor-pointer hover:bg-gray-700' : ''}" ${isEditable ? `data-event-id="${originalId}"` : ''}>
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

        // Listeners handled in element creation
    }

    // Quarter View Logic
    function switchToQuarterView() {
        currentView = 'quarter';
        monthView.classList.remove('view-visible');
        setTimeout(() => monthView.classList.add('view-hidden'), 100);
        yearView.classList.remove('view-visible');
        setTimeout(() => yearView.classList.add('view-hidden'), 100);

        quarterView.classList.remove('view-hidden');
        quarterViewBtn.classList.remove('hidden');

        generateQuarterView();
        updateViewTitle();
    }

    function generateQuarterView() {
        quarterGrid.innerHTML = '';
        const startMonth = currentMonth;
        const year = currentYear;
        const seasons = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10] };
        const seasonInfo = { winter: '❄️ Winter', spring: '🌸 Spring', summer: '☀️ Summer', autumn: '🍂 Autumn' };

        // Render Current Month + Next 2
        for (let i = 0; i < 3; i++) {
            // Calculate actual month/year for this slice
            let m = startMonth + i;
            let y = year;
            if (m > 11) {
                m -= 12;
                y++;
            }

            // Determine Season
            let seasonKey = Object.keys(seasons).find(key => seasons[key].includes(m));
            let seasonDisplay = seasonInfo[seasonKey];
            let seasonClass = `month-card-${seasonKey}`;

            // Create month card
            const monthCard = document.createElement('div');
            monthCard.className = `month-card p-4 rounded-xl border border-transparent ${seasonClass} flex flex-col h-full`;

            // Header
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-4 pb-2 border-b border-white/10';
            header.innerHTML = `
                <h3 class="font-bold text-xl text-accent-primary">${monthNames[m]} ${y}</h3>
                <span class="text-sm font-medium text-text-secondary">${seasonDisplay}</span>
            `;
            monthCard.appendChild(header);

            // Grid Container (mimics the main calendar grid structure)
            const gridWrapper = document.createElement('div');
            gridWrapper.className = 'flex-grow bg-bg-secondary rounded-lg p-1';

            const grid = document.createElement('div');
            // Removed content-start, added style for stretching rows
            grid.className = 'grid grid-cols-7 gap-1 flex-grow h-full';
            grid.style.gridAutoRows = '1fr';

            // Weekday headers (mini)
            dayNamesShort.forEach(d => {
                const dEl = document.createElement('div');
                dEl.className = 'text-center text-xs text-text-secondary font-medium uppercase tracking-wider mb-2';
                dEl.textContent = d;
                grid.appendChild(dEl);
            });

            // Days
            const firstDay = new Date(y, m, 1).getDay();
            const daysInMonth = new Date(y, m + 1, 0).getDate();

            // Empty slots
            for (let j = 0; j < firstDay; j++) {
                grid.appendChild(document.createElement('div'));
            }

            // Day cells
            for (let d = 1; d <= daysInMonth; d++) {
                const dayDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const cell = document.createElement('div');
                cell.className = 'text-center p-2 rounded-lg text-sm cursor-pointer hover:bg-white/10 transition-colors relative flex flex-col items-center justify-start min-h-[40px]';

                // Highlight today
                const today = new Date();
                if (d === today.getDate() && m === today.getMonth() && y === today.getFullYear()) {
                    cell.classList.add('bg-accent-primary', 'text-white', 'font-bold');
                } else {
                    cell.classList.add('text-text-primary');
                }

                // Dot indicators for events
                const dayEvents = getEventsForDate(dayDate);
                if (dayEvents.length > 0) {
                    const dotContainer = document.createElement('div');
                    dotContainer.className = 'absolute bottom-1 right-1 flex gap-0.5';

                    // Show up to 3 dots
                    dayEvents.slice(0, 3).forEach(evt => {
                        const dot = document.createElement('div');
                        dot.className = 'w-1.5 h-1.5 rounded-full';
                        // Handle history color
                        if (evt.type === 'history') dot.style.backgroundColor = '#8B5CF6';
                        else dot.style.backgroundColor = evt.color || '#3B82F6';

                        if (evt.type === 'bill') dot.style.backgroundColor = '#EF4444';
                        else if (evt.type === 'payday') dot.style.backgroundColor = '#10B981';

                        dotContainer.appendChild(dot);
                    });
                    cell.appendChild(dotContainer);
                }

                const dayNum = document.createElement('span');
                dayNum.textContent = d;
                cell.appendChild(dayNum);

                cell.onclick = () => {
                    openDetailsModal(dayDate);
                };

                grid.appendChild(cell);
            }

            // Fill remaining grid slots to ensure consistent height if needed?
            // Actually gridAutoRows 1fr with the natural grid items should work fine.

            gridWrapper.appendChild(grid); // Wrapped
            monthCard.appendChild(gridWrapper);
            quarterGrid.appendChild(monthCard);
        }
    }

    // Update existing nav logic
    // We'll replace the event listeners for buttons below

    // Event Listeners
    viewToggleBtn.addEventListener('click', () => {
        if (currentView !== 'year') switchToYearView();
        else switchToMonthView();
    });

    quarterViewBtn.addEventListener('click', switchToQuarterView);

    prevMonthBtn.addEventListener('click', () => {
        if (currentView === 'quarter') {
            currentMonth -= 3;
            if (currentMonth < 0) {
                currentMonth += 12;
                currentYear--;
            }
            generateQuarterView();
        } else {
            currentMonth = (currentMonth - 1 + 12) % 12;
            if (currentMonth === 11) currentYear--;
            generateMonthView();
        }
        updateViewTitle();
    });

    nextMonthBtn.addEventListener('click', () => {
        if (currentView === 'quarter') {
            currentMonth += 3;
            if (currentMonth > 11) {
                currentMonth -= 12;
                currentYear++;
            }
            generateQuarterView();
        } else {
            currentMonth = (currentMonth + 1) % 12;
            if (currentMonth === 0) currentYear++;
            generateMonthView();
        }
        updateViewTitle();
    });

    todayBtn.addEventListener('click', () => {
        currentYear = new Date().getFullYear();
        currentMonth = new Date().getMonth();
        // Force switch to Month View
        switchToMonthView();
        updateViewTitle();
    });

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
    addEventFromDetailsBtn.addEventListener('click', () => {
        const isoDate = detailsModal.dataset.date;
        if (isoDate) {
            closeModal(detailsModal);
            openEventModal(isoDate);
        }
    });
    eventModal.addEventListener('click', (e) => e.target === eventModal && closeModal(eventModal));
    detailsModal.addEventListener('click', (e) => e.target === detailsModal && closeModal(detailsModal));
    function openDetailsModal(isoDate) {
        detailsModal.dataset.date = isoDate;
        openModal(detailsModal);
        const date = new Date(`${isoDate}T12:00:00`);
        detailsDate.textContent = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        detailsDay.textContent = dayNames[date.getDay()];

        let dayEvents = getEventsForDate(isoDate);

        // Check for Payday
        const paydayEvent = dayEvents.find(e => e.type === 'payday');

        // Filter out payday from the visible list "Don't show payday in the list of options"
        dayEvents = dayEvents.filter(e => e.type !== 'payday');

        // Manage Payday Header Button
        const existingPaydayBtn = document.getElementById('paydayHeaderBtn');
        if (existingPaydayBtn) existingPaydayBtn.remove();

        const btnContainer = document.querySelector('#detailsModal .flex.items-center.gap-2.-mt-2.-mr-2');
        if (paydayEvent) {
            const paydayBtn = document.createElement('button');
            paydayBtn.id = 'paydayHeaderBtn';
            paydayBtn.className = 'p-2 rounded-full hover:bg-gray-700 transition-colors text-green-400';
            paydayBtn.innerHTML = '💸';
            paydayBtn.title = 'Edit Payday';
            paydayBtn.onclick = () => {
                const originalId = paydayEvent.id.toString().split('-')[0];
                const originalEvent = events.find(e => e.id === originalId);
                closeModal(detailsModal);
                openEventModal(isoDate, originalEvent || paydayEvent);
            };
            btnContainer.prepend(paydayBtn);
        }

        detailsContent.innerHTML = '';
        if (dayEvents.length === 0) {
            detailsContent.innerHTML = '<p class="text-text-secondary">No items for this day.</p>';
        } else {
            dayEvents.forEach(event => {
                const isEditable = event.type !== 'holiday' && event.type !== 'history';
                const isHistory = event.type === 'history';
                const icon = (event.type === 'holiday' || event.type === 'history') ? getHolidayIcon(event.title, event.type) : (event.emoji || (event.type === 'bill' ? '💰' : '🎉'));
                const originalId = event.id.toString().split('-')[0];

                // Item Container
                const itemEl = document.createElement('div');
                itemEl.className = 'rounded-lg bg-bg-tertiary overflow-hidden transition-colors hover:bg-white/5 mb-2';

                // Header
                const headerEl = document.createElement('div');
                headerEl.className = 'flex items-center justify-between p-3 cursor-pointer select-none';
                headerEl.innerHTML = `
                    <div class="flex items-center gap-3 pointer-events-none overflow-hidden pr-2">
                         <div class="event-color-dot shrink-0" style="background-color:${event.color || '#3B82F6'}"></div>
                         <span class="text-lg leading-none shrink-0">${icon}</span>
                         <div class="min-w-0 flex-1">
                             <p class="font-medium leading-none mt-0.5 truncate">${event.title} ${event.isRecurringInstance ? '<span class="text-xs text-accent-secondary ml-1">(Recurring)</span>' : ''}</p>
                             ${event.description ? `<p class="text-xs text-text-secondary mt-1 truncate opacity-70">${event.description}</p>` : ''}
                         </div>
                    </div>
                    <div class="arrow-icon transform transition-transform duration-200 text-text-secondary shrink-0">▼</div>
                `;

                // Content Body
                const bodyEl = document.createElement('div');
                bodyEl.className = 'px-3 pb-3 pt-0 hidden text-sm text-text-secondary border-t border-white/5 mt-2';

                // Construct Body Content
                let bodyHTML = '';

                // Years Ago Logic
                if (isHistory) {
                    const descText = event.description || '';
                    const eventYear = parseInt(descText.substring(0, 4)); // Get first 4 chars as year
                    if (!isNaN(eventYear)) {
                        const diff = date.getFullYear() - eventYear;
                        if (diff > 0) {
                            bodyHTML += `<p class="text-accent-primary font-bold mb-2 pt-2">${diff} years ago on this day</p>`;
                        }
                    }
                } else {
                    bodyHTML += `<div class="pt-2"></div>`;
                }

                if (event.description) {
                    bodyHTML += `<p class="leading-relaxed">${event.description}</p>`;
                } else {
                    bodyHTML += `<p class="italic opacity-50">No description</p>`;
                }

                bodyEl.innerHTML = bodyHTML;

                if (isEditable) {
                    const editBtn = document.createElement('button');
                    editBtn.className = 'mt-3 text-xs bg-bg-primary px-3 py-1.5 rounded border border-gray-600 hover:bg-gray-700 hover:border-accent-primary transition-colors text-white';
                    editBtn.textContent = 'Edit Event';
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        // Find original event object
                        const originalEventObj = events.find(e => e.id === originalId);
                        closeModal(detailsModal);
                        openEventModal(isoDate, originalEventObj || event);
                    };
                    bodyEl.appendChild(editBtn);
                }

                // Toggle Logic
                headerEl.onclick = () => {
                    const isHidden = bodyEl.classList.contains('hidden');
                    const arrow = headerEl.querySelector('.arrow-icon');
                    if (isHidden) {
                        bodyEl.classList.remove('hidden');
                        if (arrow) arrow.style.transform = 'rotate(180deg)';
                    } else {
                        bodyEl.classList.add('hidden');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    }
                };

                itemEl.appendChild(headerEl);
                itemEl.appendChild(bodyEl);
                detailsContent.appendChild(itemEl);
            });
        }
    }

    // Initial Load
    initPickers();
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth();
    switchToMonthView();

    // Resize Handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (currentView === 'month') {
                const text = monthYearHeader.textContent;
                if (text) generateMonthView();
            } else {
                updateView();
            }
        }, 200);
    });
});
