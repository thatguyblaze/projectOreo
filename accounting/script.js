// --- Constants, State, Utilities, Persistence ---
const LOCAL_STORAGE_KEY = 'financeHubApple_v5_gamified'; // Key for localStorage

// Expense Category Details (color is used for icons on calendar/lists)
const CATEGORY_DETAILS = {
    'Food': { color: 'var(--accent-yellow)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path d="M12.018 3.207 8.055 2.012A3.001 3.001 0 0 0 4.803 7.17a3.001 3.001 0 0 0 2.63 2.805l3.963 1.196A3.001 3.001 0 0 0 15.197 6.03a3.001 3.001 0 0 0-3.179-2.823ZM9.244 12.012l-.002-.002-.002-.002a1.5 1.5 0 0 0-2.088 1.994l.002.002.002.002L10.5 17.25l3.344-3.244a1.5 1.5 0 0 0-2.088-1.994l-.002.002Z" /></svg>` },
    'Transport': { color: 'var(--accent-teal)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path fill-rule="evenodd" d="M6.622 4.062A9.502 9.502 0 0 0 3.5 10.5c0 1.463.33 2.84.917 4.065a.75.75 0 0 1-1.215.87 11 11 0 1 1 13.595 0 .75.75 0 0 1-1.214-.87A9.503 9.503 0 0 0 16.5 10.5c0-1.463-.33-2.84-.917-4.065a.75.75 0 0 1 1.214-.87 11.003 11.003 0 0 1-13.595 0 .75.75 0 0 1 1.214.87ZM10 13.25a.75.75 0 0 0 .75-.75V8.75a.75.75 0 0 0-1.5 0v3.75a.75.75 0 0 0 .75.75Z" clip-rule="evenodd" /></svg>` },
    'Housing': { color: 'var(--accent-purple)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path fill-rule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clip-rule="evenodd" /></svg>` },
    'Utilities': { color: 'var(--accent-orange)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path d="M11.983 3.004a1 1 0 0 0-1.415-1.415L3.3 8.855a1 1 0 0 0 0 1.414l7.268 7.269a1 1 0 0 0 1.415-1.415L5.414 10l6.57-6.996Z" /><path d="m13.222 6.344 2.468-2.468a.75.75 0 0 1 1.061 0l.353.353a.75.75 0 0 1 0 1.06L14.282 8.12l-1.06-1.061Z" /><path d="m16.531 9.656-2.469 2.469a.75.75 0 0 1-1.06 0l-.354-.354a.75.75 0 0 1 0-1.06L15.47 7.88l1.061 1.06Z" /></svg>` },
    'Entertainment': { color: 'var(--accent-pink)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>` },
    'Shopping': { color: '#ff80ed', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path fill-rule="evenodd" d="M10.237 4.22A2.25 2.25 0 0 0 8.5 3.25H7.25a.75.75 0 0 0 0 1.5h1.25a.75.75 0 0 1 .75.75v.128a3.738 3.738 0 0 0-2.438 1.242l-.08.088a3.75 3.75 0 0 0 .08 5.212l.092.09a3.75 3.75 0 0 0 5.212-.08l.088-.08a3.738 3.738 0 0 0 1.242-2.438V5.5a.75.75 0 0 1 .75-.75h1.25a.75.75 0 0 0 0-1.5h-1.25a2.25 2.25 0 0 0-1.963-1.03ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>` },
    'Health': { color: 'var(--accent-red)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clip-rule="evenodd" /></svg>` },
    'Personal': { color: '#a0a0a5', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>` },
    'Debt': { color: '#ff6b2e', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path fill-rule="evenodd" d="M1 10a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 10Z" clip-rule="evenodd" /></svg>` },
    'Subscription': { color: 'var(--accent-cyan)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path d="M2.5 2A1.5 1.5 0 0 0 1 3.5v13A1.5 1.5 0 0 0 2.5 18h15a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 2h-15Zm13.5 0a.5.5 0 0 1 .5.5V4H3V2.5a.5.5 0 0 1 .5-.5h13Z" /></svg>`}, // For subscription category
    'Other': { color: 'var(--text-tertiary)', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd" /></svg>` }
};
const EXPENSE_CATEGORIES = Object.keys(CATEGORY_DETAILS);
const SUBSCRIPTION_CATEGORIES = ["Entertainment", "Software", "Productivity", "News", "Health & Fitness", "Education", "Other"];


// Icons for other calendar items
const BILL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon" style="color: var(--accent-bill-icon);"><path d="M3.505 2.365A4.5 4.5 0 0 1 7.75 1.5h4.5a4.5 4.5 0 0 1 4.245.865L18.5 3.75a.5.5 0 0 1 .5.5v11.5a.5.5 0 0 1-.5.5h-17a.5.5 0 0 1-.5-.5V4.25a.5.5 0 0 1 .5-.5l2.005-1.385ZM7.5 3a2.5 2.5 0 0 0-2.359.501L3.5 4.754V15.5h13V4.754l-1.641-1.253A2.5 2.5 0 0 0 12.5 3h-5Z" /><path d="M12.5 8.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5Z" /><path d="M7.5 8.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5Z" /><path d="M12.5 11.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5Z" /><path d="M7.5 11.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5Z" /></svg>`;
const PAYCHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon" style="color: var(--accent-paycheck-icon);"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm1.91-6.776A.75.75 0 0 0 11.25 11h-2.5a.75.75 0 0 0 0 1.5h.098a1.607 1.607 0 0 1 .02 0l.09.006a2.005 2.005 0 0 1 1.606 1.037c.36.648.584 1.352.584 2.081a.75.75 0 0 0 .75.75c.414 0 .75-.336.75-.75 0-1.119-.386-2.172-1.03-3.048Zm-3.74-4.446a.75.75 0 0 0-1.06-1.06L6.049 6.775A3.505 3.505 0 0 0 8.75 6a.75.75 0 0 0 0-1.5A5.006 5.006 0 0 0 4.25 8.5a.75.75 0 0 0 .75.75c.414 0 .75-.336.75-.75a3.502 3.502 0 0 1 2.728-3.427Z" clip-rule="evenodd" /></svg>`;
const BIRTHDAY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon" style="color: var(--accent-birthday-icon);"><path d="M10 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" /><path fill-rule="evenodd" d="M8 1a1.5 1.5 0 0 0-1.447 1.035L4.273 7.5H2.5A1.5 1.5 0 0 0 1 9v3.5A1.5 1.5 0 0 0 2.5 14h15a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5h-1.773l-2.28-5.465A1.5 1.5 0 0 0 12 1H8Zm0 1.5h4l2.053 4.928A1.5 1.5 0 0 0 15.447 9H14.5a.5.5 0 0 1 0-1h.447L13 5.5H7l-1.947 2.5H5.5a.5.5 0 0 1 0 1h-.947a1.5 1.5 0 0 0 1.394-1.572L8 2.5Z" clip-rule="evenodd" /><path d="M3.5 10.5a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1h-13Z" /></svg>`;
const HOLIDAY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon" style="color: var(--accent-holiday-icon);"><path fill-rule="evenodd" d="M9.422 2.22a.75.75 0 0 1 1.156 0l1.348 1.753c.1.13.25.214.416.237l2.14.295a.75.75 0 0 1 .416 1.28l-1.58 1.483a.753.753 0 0 0-.22.515l.41 2.094a.75.75 0 0 1-1.096.796l-1.882-1.03a.75.75 0 0 0-.702 0l-1.882 1.03a.75.75 0 0 1-1.096-.796l.41-2.094a.753.753 0 0 0-.22-.515L2.08 5.885a.75.75 0 0 1 .416-1.28l2.14-.295a.75.75 0 0 0 .416-.237l1.348-1.753Zm0 11.058a.75.75 0 0 1 1.156 0l1.348 1.753c.1.13.25.214.416.237l2.14.295a.75.75 0 0 1 .416 1.28l-1.58 1.483a.753.753 0 0 0-.22.515l.41 2.094a.75.75 0 0 1-1.096.796l-1.882-1.03a.75.75 0 0 0-.702 0l-1.882 1.03a.75.75 0 0 1-1.096-.796l.41-2.094a.753.753 0 0 0-.22-.515L2.08 17.165a.75.75 0 0 1 .416-1.28l2.14-.295a.75.75 0 0 0 .416-.237l1.348-1.753Z" clip-rule="evenodd" /></svg>`;
const SUBSCRIPTION_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="calendar-icon" style="color: var(--accent-subscription-icon);"><path d="M2.5 2A1.5 1.5 0 0 0 1 3.5v13A1.5 1.5 0 0 0 2.5 18h15a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 2h-15Zm13.5 0a.5.5 0 0 1 .5.5V4H3V2.5a.5.5 0 0 1 .5-.5h13Z" /></svg>`;


const HOLIDAYS_2025 = { 
    "2025-01-01": "New Year's Day", "2025-01-20": "MLK Jr. Day", 
    "2025-02-17": "Washington's Birthday", "2025-05-26": "Memorial Day",
    "2025-06-19": "Juneteenth", "2025-07-04": "Independence Day",
    "2025-09-01": "Labor Day", "2025-10-13": "Columbus Day",
    "2025-11-11": "Veterans Day", "2025-11-27": "Thanksgiving Day",
    "2025-12-25": "Christmas Day"
};
const USER_BIRTHDAY = { month: 3, day: 11, name: "Your Birthday!" }; // April = 3 (0-indexed)

// UI Element selectors
const elements = {
    heroSection: document.getElementById('heroSection'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    visitStreakCounter: document.getElementById('visitStreakCounter'),
    streakCountText: document.getElementById('streakCountText'),
    getStartedBtn: document.getElementById('getStartedBtn'), 
    mainContent: document.getElementById('mainContent'),
    fabAddTransaction: document.getElementById('fabAddTransaction'),
    
    calendarGrid: document.getElementById('calendarGrid'), 
    calendarHeaders: document.getElementById('calendarHeaders'),
    currentMonthYearDisplay: document.getElementById('currentMonthYear'), 
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'), 
    calendarPlaceholder: document.getElementById('calendar-placeholder'),
    
    dayDetailsModal: document.getElementById('dayDetailsModal'), 
    dayDetailsModalTitle: document.getElementById('dayDetailsModalTitle'),
    dayDetailsList: document.getElementById('dayDetailsList'),
    closeDayDetailsModalBtn: document.getElementById('closeDayDetailsModalBtn'),
    dayDetailsAddBtn: document.getElementById('dayDetailsAddBtn'),

    transactionModal: document.getElementById('transactionModal'), 
    modalTitle: document.getElementById('modalTitle'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'), 
    cancelModalBtnRecurring: document.getElementById('cancelModalBtnRecurring'),
    globalErrorModal: document.getElementById('global-error-modal'), 
    tabExpense: document.getElementById('tab-expense'),
    tabBill: document.getElementById('tab-bill'), 
    expenseFormModal: document.getElementById('expense-form-modal'),
    expenseIdModal: document.getElementById('expense-id-modal'), 
    expenseDescInputModal: document.getElementById('expense-desc-modal'),
    expenseCategorySelectModal: document.getElementById('expense-category-modal'), 
    expenseAmountInputModal: document.getElementById('expense-amount-modal'),
    expenseDateInputModal: document.getElementById('expense-date-modal'), 
    recurringFormModal: document.getElementById('recurring-form-modal'),
    recurringIdModal: document.getElementById('recurring-id-modal'), 
    recurringDescInputModal: document.getElementById('recurring-desc-modal'),
    recurringAmountInputModal: document.getElementById('recurring-amount-modal'), 
    recurringDayInputModal: document.getElementById('recurring-day-modal'),
    
    incomeForm: document.getElementById('income-form'), 
    weeklyIncomeInput: document.getElementById('weekly-income'),
    paydaySelect: document.getElementById('payday'), 
    displayIncome: document.getElementById('display-income'),
    displayPayday: document.getElementById('display-payday'), 
    expenseListSidebar: document.getElementById('expense-list-sidebar'),
    filterCategorySelectSidebar: document.getElementById('filter-category-sidebar'), 
    recurringListSidebar: document.getElementById('recurring-list-sidebar'),
    dashboardSummaryIncome: document.getElementById('dashboard-summary-income'), 
    dashboardSummaryExpenses: document.getElementById('dashboard-summary-expenses'),
    dashboardSummaryNet: document.getElementById('dashboard-summary-net'), 
    
    addGoalForm: document.getElementById('add-goal-form'), 
    goalNameInput: document.getElementById('goal-name'),
    goalTargetInput: document.getElementById('goal-target'), 
    savingsGoalsList: document.getElementById('savings-goals-list'),
    
    insightContent: document.getElementById('insight-content'),
    budgetTipsList: document.getElementById('budget-tips-list'),

    addSubscriptionForm: document.getElementById('add-subscription-form'),
    subscriptionNameInput: document.getElementById('subscription-name'),
    subscriptionAmountInput: document.getElementById('subscription-amount'),
    subscriptionRenewalDateInput: document.getElementById('subscription-renewal-date'),
    subscriptionCategorySelect: document.getElementById('subscription-category'),
    subscriptionList: document.getElementById('subscription-list'),
    totalMonthlySubscriptionsDisplay: document.getElementById('total-monthly-subscriptions'),

    addAssetForm: document.getElementById('add-asset-form'),
    assetNameInput: document.getElementById('asset-name'),
    assetValueInput: document.getElementById('asset-value'),
    assetList: document.getElementById('asset-list'),
    addLiabilityForm: document.getElementById('add-liability-form'),
    liabilityNameInput: document.getElementById('liability-name'),
    liabilityValueInput: document.getElementById('liability-value'),
    liabilityList: document.getElementById('liability-list'),
    netWorthDisplay: document.getElementById('netWorthDisplay'),

    addDebtForm: document.getElementById('add-debt-form'),
    debtNameInput: document.getElementById('debt-name'),
    debtBalanceInput: document.getElementById('debt-balance'),
    debtAprInput: document.getElementById('debt-apr'),
    debtMinPaymentInput: document.getElementById('debt-min-payment'),
    debtListPlanner: document.getElementById('debt-list-planner'),
    debtPlanOutput: document.getElementById('debt-plan-output'),
    
    footerYear: document.getElementById('footer-year'),
};

// Application State
let state = {
    weeklyIncome: null, paydayOfWeek: null, 
    expenses: [], recurringCharges: [], 
    savingsGoals: [], 
    subscriptions: [], // { id, name, amount, renewalDate, category }
    assets: [], // { id, name, value }
    liabilities: [], // { id, name, value }
    debts: [], // { id, name, balance, apr, minPayment }
    currentCalendarDate: new Date(), 
    editingExpenseId: null, editingRecurringId: null, editingSubscriptionId: null,
    currentFilterCategorySidebar: 'all',
    selectedDateForDayDetails: null,
    lastVisitDate: null, 
    visitStreak: 0,      
    hasCelebratedToday: false, // For daily visit confetti
    hasCelebratedSavingsThisMonth: false // For monthly savings confetti
};

// Set initial calendar date (e.g., Jan 2025 for holiday relevance if no data)
const todayForCalendarInit = new Date();
if (!state.currentCalendarDate || isNaN(new Date(state.currentCalendarDate).getTime())) {
    state.currentCalendarDate = new Date(todayForCalendarInit.getFullYear() === 2025 ? 2025 : todayForCalendarInit.getFullYear(), 0, 1);
}


// --- Utility Functions ---
function formatCurrency(amount) { if (amount == null || isNaN(amount)) return '$0.00'; return Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
function getDayName(dayIndex) { const d = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; const i = parseInt(dayIndex, 10); return (i >= 0 && i <= 6) ? d[i] : 'N/A'; }
function displayModalError(message, modalElement = elements.globalErrorModal) {
    if (modalElement) {
        modalElement.textContent = message;
        modalElement.classList.remove('hidden');
        setTimeout(() => { modalElement.classList.add('hidden'); }, 4000);
    } else { console.warn("Error display element not found for message:", message); alert(message); }
}
function playConfetti(options = {}) {
    if (typeof confetti === 'function') { // Check if confetti library is loaded
        const defaults = { particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 };
        confetti({ ...defaults, ...options });
    } else {
        console.warn("Confetti library not loaded.");
    }
}

// --- Data Persistence ---
function saveData() { try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)); } catch (e) { displayModalError("Save failed. LocalStorage might be full or disabled."); } }
function loadData() {
    try {
        const d = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (d) {
            const parsed = JSON.parse(d);
            // Ensure all date strings are properly converted to Date objects or maintained as YYYY-MM-DD strings
            parsed.expenses = (parsed.expenses || []).map(exp => ({ ...exp, date: exp.date ? new Date(exp.date + 'T00:00:00').toISOString().split('T')[0] : new Date().toISOString().split('T')[0] }));
            parsed.subscriptions = (parsed.subscriptions || []).map(sub => ({ ...sub, renewalDate: sub.renewalDate ? new Date(sub.renewalDate + 'T00:00:00').toISOString().split('T')[0] : new Date().toISOString().split('T')[0] }));
            
            parsed.savingsGoals = parsed.savingsGoals || [];
            parsed.assets = parsed.assets || [];
            parsed.liabilities = parsed.liabilities || [];
            parsed.debts = parsed.debts || [];

            if (parsed.currentCalendarDate) { parsed.currentCalendarDate = new Date(parsed.currentCalendarDate); } 
            else { const todayForCalendar = new Date(); parsed.currentCalendarDate = new Date(todayForCalendar.getFullYear() === 2025 ? 2025 : todayForCalendar.getFullYear(), 0, 1); }
            
            parsed.lastVisitDate = parsed.lastVisitDate ? new Date(parsed.lastVisitDate) : null;
            parsed.visitStreak = parsed.visitStreak || 0;
            
            state = { ...state, ...parsed, hasCelebratedToday: false, hasCelebratedSavingsThisMonth: false };
        }
    } catch (e) { console.error("Load fail:", e); displayModalError("Could not load saved data."); localStorage.removeItem(LOCAL_STORAGE_KEY); }
}

// --- Visit Tracking & Streak Logic ---
function checkDailyVisit() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    if (state.lastVisitDate) {
        const lastVisit = new Date(state.lastVisitDate); 
        lastVisit.setHours(0, 0, 0, 0);

        if (today.getTime() > lastVisit.getTime()) { 
            state.hasCelebratedToday = false; 
            if (today.getTime() === lastVisit.getTime() + (24 * 60 * 60 * 1000)) { 
                state.visitStreak++;
            } else { 
                state.visitStreak = 1; 
            }
            if (!state.hasCelebratedToday) {
                playConfetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }});
                state.hasCelebratedToday = true;
            }
        }
    } else { 
        state.visitStreak = 1;
        if (!state.hasCelebratedToday) {
            playConfetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }});
            state.hasCelebratedToday = true;
        }
    }
    state.lastVisitDate = today.toISOString(); // Store as ISO string
    elements.streakCountText.textContent = `${state.visitStreak} Day Streak`;
    elements.visitStreakCounter.classList.add('visible');
    
    if (state.visitStreak > 1) {
        elements.heroSubtitle.textContent = `Welcome back! You're on a ${state.visitStreak}-day streak. Keep crushing those financial goals!`;
    } else {
        elements.heroSubtitle.textContent = `Visually track spending, manage bills, and reach your savings goals. Your financial journey, simplified.`;
    }
    saveData(); 
}

// --- Calendar Logic ---
function renderCalendar() {
    elements.calendarGrid.innerHTML = ''; elements.calendarHeaders.innerHTML = ''; 
    const today = new Date(); today.setHours(0,0,0,0); 
    const year = state.currentCalendarDate.getFullYear(); const month = state.currentCalendarDate.getMonth();
    elements.currentMonthYearDisplay.textContent = `${state.currentCalendarDate.toLocaleString('default', { month: 'long' })} ${year}`;
    const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => { const h = document.createElement('div'); h.classList.add('calendar-header-cell'); h.textContent = day; elements.calendarHeaders.appendChild(h); });
    let itemsInMonth = false;
    for (let i = 0; i < firstDayOfMonth; i++) { const p = document.createElement('div'); p.classList.add('calendar-day-cell', 'other-month'); elements.calendarGrid.appendChild(p); }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div'); dayCell.classList.add('calendar-day-cell');
        const currentDate = new Date(year, month, day); currentDate.setHours(0,0,0,0); 
        const currentDateStr = currentDate.toISOString().split('T')[0];
        if (currentDate.getTime() === today.getTime()) { dayCell.classList.add('today'); }
        const dayNumSpan = document.createElement('span'); dayNumSpan.classList.add('day-number'); dayNumSpan.textContent = day; dayCell.appendChild(dayNumSpan);
        const itemIndicatorContainer = document.createElement('div'); itemIndicatorContainer.classList.add('item-indicator-container');
        let dayHasItems = false;

        if (year === 2025 && HOLIDAYS_2025[currentDateStr]) {
            dayCell.classList.add('holiday-cell');
            const nameSpan = document.createElement('span'); nameSpan.classList.add('event-name-display', 'holiday-name-display'); nameSpan.textContent = HOLIDAYS_2025[currentDateStr]; dayCell.appendChild(nameSpan);
            const iconDiv = document.createElement('div'); iconDiv.innerHTML = HOLIDAY_ICON_SVG; itemIndicatorContainer.appendChild(iconDiv.firstChild);
            dayHasItems = true;
        }
        if (currentDate.getMonth() === USER_BIRTHDAY.month && currentDate.getDate() === USER_BIRTHDAY.day) {
            dayCell.classList.add('birthday-cell');
            const nameSpan = document.createElement('span'); nameSpan.classList.add('event-name-display', 'birthday-name-display'); nameSpan.textContent = USER_BIRTHDAY.name; dayCell.appendChild(nameSpan);
            const iconDiv = document.createElement('div'); iconDiv.innerHTML = BIRTHDAY_ICON_SVG; itemIndicatorContainer.appendChild(iconDiv.firstChild);
            dayHasItems = true;
        }
        const expensesForDay = state.expenses.filter(e => e.date === currentDateStr);
        expensesForDay.forEach(exp => {
            dayHasItems = true;
            const catDet = CATEGORY_DETAILS[exp.category] || CATEGORY_DETAILS['Other'];
            const ind = document.createElement('div'); ind.innerHTML = catDet.icon;
            const svg = ind.querySelector('svg'); if (svg) { let c = catDet.color; if (c.startsWith('var(')) c = getComputedStyle(document.documentElement).getPropertyValue(c.substring(4,c.length-1)).trim(); svg.style.color = c; }
            itemIndicatorContainer.appendChild(ind.firstChild);
        });
        const billsForDay = state.recurringCharges.filter(b => b.dayDue === day);
        billsForDay.forEach(() => { dayHasItems = true; const iconDiv = document.createElement('div'); iconDiv.innerHTML = BILL_ICON_SVG; itemIndicatorContainer.appendChild(iconDiv.firstChild); });
        
        const subscriptionsRenewingToday = state.subscriptions.filter(s => {
            const renewalDate = new Date(s.renewalDate + 'T00:00:00');
            return renewalDate.getTime() === currentDate.getTime();
        });
        subscriptionsRenewingToday.forEach(() => {
            dayHasItems = true; const iconDiv = document.createElement('div'); iconDiv.innerHTML = SUBSCRIPTION_ICON_SVG; itemIndicatorContainer.appendChild(iconDiv.firstChild);
        });

        if (state.weeklyIncome && state.paydayOfWeek !== null && currentDate.getDay() === state.paydayOfWeek) {
            dayHasItems = true; const iconDiv = document.createElement('div'); iconDiv.innerHTML = PAYCHECK_ICON_SVG; itemIndicatorContainer.appendChild(iconDiv.firstChild);
        }
        if (dayHasItems) itemsInMonth = true;
        if (itemIndicatorContainer.hasChildNodes()) dayCell.appendChild(itemIndicatorContainer);
        dayCell.addEventListener('click', () => openDayDetailsModal(currentDateStr));
        elements.calendarGrid.appendChild(dayCell);
    }
    elements.calendarPlaceholder.classList.toggle('hidden', itemsInMonth);
    const totalCells = firstDayOfMonth + daysInMonth; const remainingCells = (7-(totalCells % 7))%7;
    for (let i=0; i<remainingCells; i++) { const n = document.createElement('div'); n.classList.add('calendar-day-cell','other-month'); elements.calendarGrid.appendChild(n); }
}

// --- Day Details Modal ---
function openDayDetailsModal(dateStr) {
    state.selectedDateForDayDetails = dateStr;
    const dateObj = new Date(dateStr + 'T00:00:00');
    elements.dayDetailsModalTitle.textContent = `Details for ${dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    elements.dayDetailsList.innerHTML = ''; 
    let itemsFound = false;

    if (dateObj.getFullYear() === 2025 && HOLIDAYS_2025[dateStr]) {
        elements.dayDetailsList.appendChild(createDayDetailItem(HOLIDAYS_2025[dateStr], '', HOLIDAY_ICON_SVG, 'var(--accent-holiday-icon)')); itemsFound = true;
    }
    if (dateObj.getMonth() === USER_BIRTHDAY.month && dateObj.getDate() === USER_BIRTHDAY.day) {
        elements.dayDetailsList.appendChild(createDayDetailItem(USER_BIRTHDAY.name, '', BIRTHDAY_ICON_SVG, 'var(--accent-birthday-icon)')); itemsFound = true;
    }
    if (state.weeklyIncome && state.paydayOfWeek !== null && dateObj.getDay() === state.paydayOfWeek) {
        elements.dayDetailsList.appendChild(createDayDetailItem('Paycheck Received', formatCurrency(state.weeklyIncome), PAYCHECK_ICON_SVG, 'var(--accent-paycheck-icon)')); itemsFound = true;
    }
    state.expenses.filter(exp => exp.date === dateStr).forEach(exp => {
        const catDet = CATEGORY_DETAILS[exp.category] || CATEGORY_DETAILS['Other'];
        elements.dayDetailsList.appendChild(createDayDetailItem(exp.desc, formatCurrency(exp.amount), catDet.icon, catDet.color, 'expense', exp.id)); itemsFound = true;
    });
    state.recurringCharges.filter(bill => bill.dayDue === dateObj.getDate()).forEach(bill => {
        elements.dayDetailsList.appendChild(createDayDetailItem(bill.desc, formatCurrency(bill.amount) + " (Bill)", BILL_ICON_SVG, 'var(--accent-bill-icon)', 'recurring', bill.id)); itemsFound = true;
    });
    state.subscriptions.filter(sub => sub.renewalDate === dateStr).forEach(sub => {
        elements.dayDetailsList.appendChild(createDayDetailItem(`${sub.name} (Subscription)`, formatCurrency(sub.amount), SUBSCRIPTION_ICON_SVG, 'var(--accent-subscription-icon)', 'subscription', sub.id)); itemsFound = true;
    });


    if (!itemsFound) { elements.dayDetailsList.innerHTML = `<p class="text-center text-[var(--text-secondary)] p-4">Nothing scheduled for this day.</p>`; }
    elements.dayDetailsModal.classList.add('active');
}
function createDayDetailItem(description, amountText, iconSvgStr, iconColorVar, itemType = null, itemId = null) {
    const itemDiv = document.createElement('div'); itemDiv.className = 'day-details-item';
    if (itemType && itemId && itemType !== 'subscription') { // Subscriptions not editable from day details for now
        itemDiv.classList.add('day-details-item-clickable');
        itemDiv.addEventListener('click', () => {
            closeDayDetailsModal(); 
            if (itemType === 'expense') openTransactionModal(state.selectedDateForDayDetails, itemId, null);
            if (itemType === 'recurring') openTransactionModal(state.selectedDateForDayDetails, null, itemId);
        });
    }
    let iconColor = iconColorVar.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(iconColorVar.substring(4, iconColorVar.length - 1)).trim() : iconColorVar;
    const tempIconDiv = document.createElement('div'); tempIconDiv.innerHTML = iconSvgStr;
    const svgElement = tempIconDiv.querySelector('svg');
    if(svgElement) { svgElement.style.color = iconColor; svgElement.classList.add('day-details-item-icon'); }
    itemDiv.innerHTML = `${svgElement ? svgElement.outerHTML : '<div class="day-details-item-icon"></div>'}<span class="day-details-item-desc">${description}</span><span class="day-details-item-amount">${amountText}</span>`;
    return itemDiv;
}
function closeDayDetailsModal() { elements.dayDetailsModal.classList.remove('active'); }

// --- Transaction Modal Logic (Add/Edit) ---
function openTransactionModal(date = null, expenseId = null, recurringId = null) {
    elements.transactionModal.classList.add('active');
    elements.modalTitle.textContent = 'Add Transaction';
    elements.globalErrorModal.classList.add('hidden'); 
    elements.expenseFormModal.reset(); elements.recurringFormModal.reset();
    state.editingExpenseId = null; state.editingRecurringId = null;
    elements.expenseIdModal.value = ''; elements.recurringIdModal.value = '';
    elements.expenseDateInputModal.value = date ? date : new Date().toISOString().split('T')[0];

    if (expenseId) { 
        const exp = state.expenses.find(e => e.id === expenseId);
        if (exp) {
            elements.modalTitle.textContent = 'Edit Expense'; state.editingExpenseId = expenseId;
            elements.expenseIdModal.value = exp.id; elements.expenseDescInputModal.value = exp.desc;
            elements.expenseCategorySelectModal.value = exp.category; elements.expenseAmountInputModal.value = exp.amount;
            elements.expenseDateInputModal.value = exp.date; 
            switchModalForm('expense');
        }
    } else if (recurringId) { 
         const bill = state.recurringCharges.find(b => b.id === recurringId);
        if (bill) {
            elements.modalTitle.textContent = 'Edit Bill'; state.editingRecurringId = recurringId;
            elements.recurringIdModal.value = bill.id; elements.recurringDescInputModal.value = bill.desc;
            elements.recurringAmountInputModal.value = bill.amount; elements.recurringDayInputModal.value = bill.dayDue;
            switchModalForm('bill');
        }
    } else { switchModalForm('expense'); }
}
function closeModal() { elements.transactionModal.classList.remove('active'); state.editingExpenseId = null; state.editingRecurringId = null;}
function switchModalForm(formType) {
    const isExpense = formType === 'expense';
    ['tabExpense', 'tabBill'].forEach(tabId => {
        const tab = elements[tabId];
        const isActive = (tabId === 'tab-expense' && isExpense) || (tabId === 'tab-bill' && !isExpense);
        tab.classList.toggle('active', isActive); tab.classList.toggle('border-[var(--accent-primary)]', isActive);
        tab.classList.toggle('text-[var(--accent-primary)]', isActive); tab.classList.toggle('text-[var(--text-secondary)]', !isActive);
        tab.classList.toggle('border-transparent', !isActive);
    });
    elements.expenseFormModal.classList.toggle('hidden', !isExpense); elements.recurringFormModal.classList.toggle('hidden', isExpense);
    if (isExpense && !state.editingExpenseId) elements.modalTitle.textContent = 'Add Expense';
    if (!isExpense && !state.editingRecurringId) elements.modalTitle.textContent = 'Add Bill';
}

// --- Form Handlers ---
function handleExpenseSubmitModal(event) {
    event.preventDefault();
    const id = elements.expenseIdModal.value || Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const desc = elements.expenseDescInputModal.value.trim(); const category = elements.expenseCategorySelectModal.value;
    const amount = parseFloat(elements.expenseAmountInputModal.value); const date = elements.expenseDateInputModal.value; 
    if (!desc || !category || isNaN(amount) || amount <= 0 || !date) { displayModalError("Please fill all expense fields correctly."); return; }
    const newExpense = { id, desc, category, amount, date };
    if (state.editingExpenseId) { state.expenses = state.expenses.map(exp => exp.id === state.editingExpenseId ? newExpense : exp); } 
    else { state.expenses.push(newExpense); }
    saveData(); renderAll(); closeModal();
}
function handleRecurringSubmitModal(event) {
    event.preventDefault();
    const id = elements.recurringIdModal.value || Date.now().toString() + Math.random().toString(36).substring(2,9);
    const desc = elements.recurringDescInputModal.value.trim(); const amount = parseFloat(elements.recurringAmountInputModal.value);
    const dayDue = parseInt(elements.recurringDayInputModal.value, 10);
    if (!desc || isNaN(amount) || amount <= 0 || isNaN(dayDue) || dayDue < 1 || dayDue > 31) { displayModalError("Please fill all bill fields correctly."); return; }
    const newBill = { id, desc, amount, dayDue };
    if (state.editingRecurringId) { state.recurringCharges = state.recurringCharges.map(b => b.id === state.editingRecurringId ? newBill : b); } 
    else { state.recurringCharges.push(newBill); }
    saveData(); renderAll(); closeModal();
}
function handleIncomeSubmit(event) {
    event.preventDefault();
    const weeklyAmount = parseFloat(elements.weeklyIncomeInput.value); 
    const payday = elements.paydaySelect.value; // This will be a string "0" through "6" or ""

    if (isNaN(weeklyAmount) || weeklyAmount < 0) { 
        displayModalError("Invalid income amount.", elements.incomeForm.querySelector('button[type="submit"]')); // Show error near form
        return; 
    }
    if (payday === "" || payday === null) { // Check if a payday is selected
        displayModalError("Please select a payday.", elements.incomeForm.querySelector('button[type="submit"]')); 
        return; 
    }
    state.weeklyIncome = weeklyAmount; 
    state.paydayOfWeek = parseInt(payday, 10); // Ensure it's an integer
    saveData(); 
    renderIncomeDisplay(); 
    renderMonthlySummary(); 
    renderCalendar(); // Re-render calendar to show paychecks
}
function handleAddGoalSubmit(event) {
    event.preventDefault();
    const name = elements.goalNameInput.value.trim(); const targetAmount = parseFloat(elements.goalTargetInput.value);
    if (!name || isNaN(targetAmount) || targetAmount <= 0) { displayModalError("Valid goal name & target amount required.", elements.savingsGoalsList.parentElement.querySelector('h3')); return; }
    const newGoal = { id: Date.now().toString(), name, targetAmount, currentAmount: 0, monthlyContribution: 0 }; // Added monthlyContribution
    state.savingsGoals.push(newGoal); saveData(); renderSavingsGoals(); elements.addGoalForm.reset();
}
function handleAddToGoal(goalId, amount) {
    const goal = state.savingsGoals.find(g => g.id === goalId);
    if (goal && !isNaN(amount) && amount > 0) {
        goal.currentAmount = Math.min(goal.targetAmount, (goal.currentAmount || 0) + amount);
        saveData(); renderSavingsGoals();
        playConfetti({ particleCount: 70, spread: 60, origin: { y: 0.7 }, colors: ['#FFD700', '#FFBF00', '#FDB813'] }); 
    } else if (goal && (isNaN(amount) || amount <=0)) { alert("Please enter a valid positive amount to add."); }
}
function handleDeleteGoal(goalId) {
    if (confirm("Are you sure you want to delete this savings goal?")) { state.savingsGoals = state.savingsGoals.filter(g => g.id !== goalId); saveData(); renderSavingsGoals(); }
}
function handleAddSubscriptionSubmit(event) {
    event.preventDefault();
    const name = elements.subscriptionNameInput.value.trim();
    const amount = parseFloat(elements.subscriptionAmountInput.value);
    const renewalDate = elements.subscriptionRenewalDateInput.value;
    const category = elements.subscriptionCategorySelect.value;

    if (!name || isNaN(amount) || amount <= 0 || !renewalDate || !category) {
        displayModalError("Please fill all subscription fields.", elements.addSubscriptionForm.querySelector('button[type="submit"]'));
        return;
    }
    const newSubscription = { id: Date.now().toString(), name, amount, renewalDate, category };
    state.subscriptions.push(newSubscription);
    saveData();
    renderSubscriptions();
    renderCalendar(); // Update calendar for new subscription renewal dates
    elements.addSubscriptionForm.reset();
}
function handleDeleteSubscription(subscriptionId) {
    if (confirm("Are you sure you want to delete this subscription?")) {
        state.subscriptions = state.subscriptions.filter(sub => sub.id !== subscriptionId);
        saveData();
        renderSubscriptions();
        renderCalendar();
    }
}
function handleAddAsset(event) {
    event.preventDefault();
    const name = elements.assetNameInput.value.trim();
    const value = parseFloat(elements.assetValueInput.value);
    if (!name || isNaN(value) || value < 0) {
        displayModalError("Valid asset name & value required.", elements.addAssetForm); return;
    }
    state.assets.push({ id: Date.now().toString(), name, value });
    saveData(); renderNetWorth(); elements.addAssetForm.reset();
}
function handleAddLiability(event) {
    event.preventDefault();
    const name = elements.liabilityNameInput.value.trim();
    const value = parseFloat(elements.liabilityValueInput.value);
    if (!name || isNaN(value) || value < 0) {
        displayModalError("Valid liability name & value required.", elements.addLiabilityForm); return;
    }
    state.liabilities.push({ id: Date.now().toString(), name, value });
    saveData(); renderNetWorth(); elements.addLiabilityForm.reset();
}
function handleDeleteAssetOrLiability(id, type) {
    if (confirm(`Delete this ${type}?`)) {
        if (type === 'asset') state.assets = state.assets.filter(a => a.id !== id);
        else if (type === 'liability') state.liabilities = state.liabilities.filter(l => l.id !== id);
        saveData(); renderNetWorth();
    }
}
function handleAddDebt(event) {
    event.preventDefault();
    const name = elements.debtNameInput.value.trim();
    const balance = parseFloat(elements.debtBalanceInput.value);
    const apr = parseFloat(elements.debtAprInput.value);
    const minPayment = parseFloat(elements.debtMinPaymentInput.value);
    if (!name || isNaN(balance) || balance <=0 || isNaN(apr) || apr < 0 || isNaN(minPayment) || minPayment <=0) {
        displayModalError("Valid debt details required.", elements.addDebtForm); return;
    }
    state.debts.push({id: Date.now().toString(), name, balance, apr, minPayment});
    saveData(); renderDebtPlanner(); elements.addDebtForm.reset();
}
function handleDeleteDebt(debtId) {
     if (confirm("Delete this debt from the planner?")) {
        state.debts = state.debts.filter(d => d.id !== debtId);
        saveData(); renderDebtPlanner();
    }
}


// --- Rendering Functions ---
function renderIncomeDisplay() {
    elements.displayIncome.textContent = formatCurrency(state.weeklyIncome);
    elements.displayPayday.textContent = getDayName(state.paydayOfWeek);
    elements.weeklyIncomeInput.value = state.weeklyIncome ?? ''; // Use nullish coalescing for empty string if null
    elements.paydaySelect.value = state.paydayOfWeek !== null ? state.paydayOfWeek.toString() : ''; // Ensure value is string for select
}
function renderExpensesSidebar() {
    elements.expenseListSidebar.innerHTML = '';
    const filteredExpenses = state.expenses.filter(exp => state.currentFilterCategorySidebar === 'all' || exp.category === state.currentFilterCategorySidebar)
                            .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00')).slice(0, 15); 
    if (filteredExpenses.length === 0) { elements.expenseListSidebar.innerHTML = `<li class="text-[var(--text-secondary)] italic p-2 text-center">No expenses match filter.</li>`; return; }
    filteredExpenses.forEach(exp => {
        const li = document.createElement('li'); li.classList.add('transaction-list-item');
        const catDet = CATEGORY_DETAILS[exp.category] || CATEGORY_DETAILS['Other'];
        const getColor = (c) => c.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(c.substring(4,c.length-1)).trim() : c;
        const actualColor = getColor(catDet.color);
        li.innerHTML = `
            <div class="flex-grow mr-2">
                <span class="font-medium text-[var(--text-primary)] block text-sm">${exp.desc}</span>
                <div class="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                    <span>${formatCurrency(exp.amount)}</span>
                    <span>${new Date(exp.date + 'T00:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                    <span class="category-badge-list" style="background-color: ${actualColor}26; color: ${actualColor}; border-color: ${actualColor}4D;">
                       ${catDet.icon} ${exp.category}</span></div></div>
            <div class="flex-shrink-0 flex gap-1">
                <button data-id="${exp.id}" data-type="expense" class="transaction-edit-button text-[var(--accent-primary)] opacity-70 hover:opacity-100 p-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343Z" /></svg></button>
                <button data-id="${exp.id}" data-type="expense" class="transaction-delete-button"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button></div>`;
        elements.expenseListSidebar.appendChild(li);
    });
}
function renderRecurringBillsSidebar() {
    elements.recurringListSidebar.innerHTML = '';
    const sortedBills = [...state.recurringCharges].sort((a,b) => a.dayDue - b.dayDue);
    if (sortedBills.length === 0) { elements.recurringListSidebar.innerHTML = `<li class="text-[var(--text-secondary)] italic p-2 text-center">No bills added.</li>`; return; }
    sortedBills.forEach(bill => {
        const li = document.createElement('li'); li.classList.add('sidebar-list-item'); // Changed class for consistency
        li.innerHTML = `
            <div class="flex-grow mr-2"><span class="font-medium text-[var(--text-primary)] block text-sm">${bill.desc}</span>
                <span class="text-xs text-[var(--text-secondary)]">Due Day: ${bill.dayDue} (${formatCurrency(bill.amount)})</span></div>
            <div class="flex-shrink-0 flex gap-1">
                 <button data-id="${bill.id}" data-type="recurring" class="transaction-edit-button text-[var(--accent-primary)] opacity-70 hover:opacity-100 p-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343Z" /></svg></button>
                <button data-id="${bill.id}" data-type="recurring" class="transaction-delete-button"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button></div>`;
        elements.recurringListSidebar.appendChild(li);
    });
}
function renderSavingsGoals() {
    elements.savingsGoalsList.innerHTML = '';
    if (state.savingsGoals.length === 0) { elements.savingsGoalsList.innerHTML = `<li class="text-center text-xs text-[var(--text-secondary)]">No savings goals yet.</li>`; return; }
    state.savingsGoals.forEach(goal => {
        const li = document.createElement('li'); li.classList.add('savings-goal-item');
        const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
        // Placeholder for time to goal
        let timeToGoalText = "";
        if (goal.monthlyContribution > 0 && goal.currentAmount < goal.targetAmount) {
            const monthsNeeded = Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution);
            timeToGoalText = `Est. ${monthsNeeded} month${monthsNeeded > 1 ? 's' : ''}`;
        } else if (goal.currentAmount >= goal.targetAmount) {
            timeToGoalText = "Goal Reached!";
        }

        li.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-medium text-sm">${goal.name}</span>
                <span class="text-xs text-[var(--text-secondary)]">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</span>
            </div>
            <div class="savings-goal-progress-bar-bg mb-1"><div class="savings-goal-progress-bar-fg" style="width: ${percentage.toFixed(2)}%;"></div></div>
            <div class="text-xs text-[var(--text-tertiary)] mb-2 text-right">${timeToGoalText}</div>
            <div class="grid grid-cols-3 gap-2 items-center">
                <input type="number" class="apple-input !text-xs !py-1 col-span-1 add-to-goal-amount-input" placeholder="Amt" data-goal-id="${goal.id}" step="10">
                <input type="number" class="apple-input !text-xs !py-1 col-span-1 monthly-contrib-input" placeholder="Contrib/mo" data-goal-id="${goal.id}" value="${goal.monthlyContribution || ''}" step="10">
                <div class="flex justify-end gap-1 col-span-1">
                    <button class="apple-button apple-button-secondary add-to-goal-btn !p-1 !text-xs" data-goal-id="${goal.id}" title="Add to Goal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4"><path d="M8.75 3.5a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5V3.5Z" /></svg>
                    </button>
                    <button class="transaction-delete-button delete-goal-btn !p-1" data-goal-id="${goal.id}" title="Delete Goal">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2 5.75A.75.75 0 0 1 2.75 5h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 5.75Zm1.06-2.28a.75.75 0 0 1 .75-.06l.22.09L5.5 5h5l1.47-1.5a.75.75 0 0 1 .97.06l.22.19a.75.75 0 0 1 .06.97L12.5 5H13a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h.5L4.03 3.47a.75.75 0 0 1 .06-.97Z" /></svg>
                    </button>
                </div>
            </div>`;
        elements.savingsGoalsList.appendChild(li);
    });
    document.querySelectorAll('.add-to-goal-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const goalId = e.target.closest('button').dataset.goalId; // Ensure we get goalId from button itself
            const amountInput = document.querySelector(`.add-to-goal-amount-input[data-goal-id="${goalId}"]`);
            if (amountInput) { handleAddToGoal(goalId, parseFloat(amountInput.value)); amountInput.value = ''; }
        });
    });
    document.querySelectorAll('.delete-goal-btn').forEach(button => {
        button.addEventListener('click', (e) => handleDeleteGoal(e.currentTarget.dataset.goalId));
    });
    document.querySelectorAll('.monthly-contrib-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const goalId = e.target.dataset.goalId;
            const monthlyContribution = parseFloat(e.target.value);
            const goal = state.savingsGoals.find(g => g.id === goalId);
            if (goal && !isNaN(monthlyContribution) && monthlyContribution >= 0) {
                goal.monthlyContribution = monthlyContribution;
                saveData();
                renderSavingsGoals(); // Re-render to update estimated time
            }
        });
    });
}
function renderSubscriptions() {
    elements.subscriptionList.innerHTML = '';
    let totalMonthlyCost = 0;
    if (state.subscriptions.length === 0) {
        elements.subscriptionList.innerHTML = `<li class="text-center text-xs text-[var(--text-secondary)]">No subscriptions tracked yet.</li>`;
        elements.totalMonthlySubscriptionsDisplay.textContent = `Total Monthly: ${formatCurrency(0)}`;
        return;
    }
    state.subscriptions.sort((a,b) => new Date(a.renewalDate + 'T00:00:00') - new Date(b.renewalDate + 'T00:00:00')).forEach(sub => {
        const li = document.createElement('li');
        li.className = 'list-item-sm flex justify-between items-center';
        const renewalDateObj = new Date(sub.renewalDate + 'T00:00:00');
        const isPastDue = renewalDateObj < new Date(); // Check if renewal date is in the past

        li.innerHTML = `
            <div class="flex items-center">
                ${SUBSCRIPTION_ICON_SVG} <span class="item-name ml-2 block">${sub.name} (${sub.category})</span>
            </div>
            <div class="text-right">
                <span class="item-value block">${formatCurrency(sub.amount)}</span>
                <span class="item-renewal ${isPastDue ? 'text-red-400' : 'text-[var(--accent-orange)]'}">Renews: ${renewalDateObj.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</span>
            </div>
            <button data-id="${sub.id}" class="transaction-delete-button delete-subscription-btn !ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2 5.75A.75.75 0 0 1 2.75 5h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 5.75Zm1.06-2.28a.75.75 0 0 1 .75-.06l.22.09L5.5 5h5l1.47-1.5a.75.75 0 0 1 .97.06l.22.19a.75.75 0 0 1 .06.97L12.5 5H13a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h.5L4.03 3.47a.75.75 0 0 1 .06-.97Z" /></svg>
            </button>
        `;
        elements.subscriptionList.appendChild(li);
        totalMonthlyCost += sub.amount; // Assuming all are monthly for simplicity
    });
    elements.totalMonthlySubscriptionsDisplay.textContent = `Total Monthly: ${formatCurrency(totalMonthlyCost)}`;
    document.querySelectorAll('.delete-subscription-btn').forEach(button => {
        button.addEventListener('click', (e) => handleDeleteSubscription(e.currentTarget.dataset.id));
    });
}
function renderNetWorth() {
    elements.assetList.innerHTML = '';
    elements.liabilityList.innerHTML = '';
    let totalAssets = 0;
    let totalLiabilities = 0;

    state.assets.forEach(asset => {
        const li = document.createElement('li');
        li.className = 'list-item-sm flex justify-between items-center';
        li.innerHTML = `<span>${asset.name}</span><span>${formatCurrency(asset.value)} <button data-id="${asset.id}" data-type="asset" class="transaction-delete-button !p-0 !ml-1 text-xs">&times;</button></span>`;
        elements.assetList.appendChild(li);
        totalAssets += asset.value;
    });
    state.liabilities.forEach(lia => {
        const li = document.createElement('li');
        li.className = 'list-item-sm flex justify-between items-center';
        li.innerHTML = `<span>${lia.name}</span><span>${formatCurrency(lia.value)} <button data-id="${lia.id}" data-type="liability" class="transaction-delete-button !p-0 !ml-1 text-xs">&times;</button></span>`;
        elements.liabilityList.appendChild(li);
        totalLiabilities += lia.value;
    });
    const netWorth = totalAssets - totalLiabilities;
    elements.netWorthDisplay.textContent = `Net Worth: ${formatCurrency(netWorth)}`;
    elements.netWorthDisplay.className = `text-xl font-bold mt-4 pt-3 border-t border-[var(--border-color)] text-center ${netWorth >= 0 ? 'text-positive' : 'text-negative'}`;

    elements.assetList.querySelectorAll('.transaction-delete-button').forEach(btn => btn.addEventListener('click', (e) => handleDeleteAssetOrLiability(e.target.dataset.id, 'asset')));
    elements.liabilityList.querySelectorAll('.transaction-delete-button').forEach(btn => btn.addEventListener('click', (e) => handleDeleteAssetOrLiability(e.target.dataset.id, 'liability')));
}
function renderDebtPlanner() {
    elements.debtListPlanner.innerHTML = '';
    if(state.debts.length === 0) {
        elements.debtListPlanner.innerHTML = `<li class="text-center text-xs text-[var(--text-secondary)]">No debts added to planner.</li>`;
        elements.debtPlanOutput.textContent = 'Add debts to see payoff projections.';
        return;
    }
    state.debts.sort((a,b) => b.apr - a.apr) // Default sort by APR (Avalanche)
        .forEach(debt => {
        const li = document.createElement('li');
        li.className = 'list-item-sm flex justify-between items-center';
        li.innerHTML = `
            <div>
                <span class="item-name block">${debt.name} (${debt.apr}%)</span>
                <span class="text-xs text-[var(--text-tertiary)]">Bal: ${formatCurrency(debt.balance)}, Min: ${formatCurrency(debt.minPayment)}</span>
            </div>
            <button data-id="${debt.id}" class="transaction-delete-button delete-debt-btn !p-0 !ml-1 text-xs">&times;</button>`;
        elements.debtListPlanner.appendChild(li);
    });
    elements.debtListPlanner.querySelectorAll('.delete-debt-btn').forEach(btn => btn.addEventListener('click', (e) => handleDeleteDebt(e.target.dataset.id)));
    // Basic plan output (can be expanded)
    const totalMinPayments = state.debts.reduce((sum, d) => sum + d.minPayment, 0);
    elements.debtPlanOutput.textContent = `Total minimum payments: ${formatCurrency(totalMinPayments)}/month. Add extra to accelerate payoff.`;
}
function renderFinancialInsights() { 
    elements.insightContent.innerHTML = ''; let insightsGenerated = 0;
    let monthlyIncome = 0;
    if (state.weeklyIncome && state.paydayOfWeek !== null) {
        const currentMonth = state.currentCalendarDate.getMonth(); const currentYear = state.currentCalendarDate.getFullYear();
        let paydaysInMonth = 0; const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInCurrentMonth; day++) { if (new Date(currentYear, currentMonth, day).getDay() === state.paydayOfWeek) paydaysInMonth++; }
        monthlyIncome = state.weeklyIncome * paydaysInMonth;
    }

    if (monthlyIncome > 0) {
        const monthlyExpensesTotal = state.expenses.filter(exp => { const d=new Date(exp.date+'T00:00:00'); return d.getMonth()===state.currentCalendarDate.getMonth() && d.getFullYear()===state.currentCalendarDate.getFullYear(); }).reduce((s,e)=>s+e.amount,0);
        const monthlyRecurringTotal = state.recurringCharges.reduce((s,c)=>s+c.amount,0);
        const monthlySubscriptionTotal = state.subscriptions.reduce((s,sub)=>s+sub.amount,0); // Assuming all are monthly
        const totalSpending = monthlyExpensesTotal + monthlyRecurringTotal + monthlySubscriptionTotal; 
        const netSavings = monthlyIncome - totalSpending;

        const savingsRate = (netSavings / monthlyIncome) * 100;
        const p = document.createElement('p');
        p.innerHTML = `This month's est. savings rate: <strong class="${savingsRate >= 0 ? 'text-positive' : 'text-negative'}">${savingsRate.toFixed(1)}%</strong>`;
        elements.insightContent.appendChild(p); insightsGenerated++;
        if (netSavings > 0 && !state.hasCelebratedSavingsThisMonth) { 
            playConfetti({particleCount: 120, spread: 80, origin: {y: 0.6}, colors: ['#30D158', '#34C759', '#2E8540']}); // Green confetti
            state.hasCelebratedSavingsThisMonth = true; 
        } else if (netSavings <= 0) {
            state.hasCelebratedSavingsThisMonth = false; 
        }
    }
    
    const currentMonthExpenses = state.expenses.filter(exp => { const d=new Date(exp.date+'T00:00:00'); return d.getMonth()===state.currentCalendarDate.getMonth() && d.getFullYear()===state.currentCalendarDate.getFullYear(); }).reduce((s,e)=>s+e.amount,0);
    const lastMonthDate = new Date(state.currentCalendarDate); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthExpenses = state.expenses.filter(exp => { const d=new Date(exp.date+'T00:00:00'); return d.getMonth()===lastMonthDate.getMonth() && d.getFullYear()===lastMonthDate.getFullYear(); }).reduce((s,e)=>s+e.amount,0);

    if (currentMonthExpenses > 0 && lastMonthExpenses > 0) {
        const diff = currentMonthExpenses - lastMonthExpenses;
        const percentageDiff = (diff / lastMonthExpenses) * 100;
        const p = document.createElement('p');
        p.innerHTML = `Spending this month (${formatCurrency(currentMonthExpenses)}) is <strong class="${percentageDiff >= 0 ? 'text-negative' : 'text-positive'}">${Math.abs(percentageDiff).toFixed(0)}% ${percentageDiff >= 0 ? 'higher' : 'lower'}</strong> than last month (${formatCurrency(lastMonthExpenses)}).`;
        elements.insightContent.appendChild(p); insightsGenerated++;
    }
    
    if (insightsGenerated === 0) { elements.insightContent.innerHTML = `<p class="text-[var(--text-secondary)]">Add more income and expense data to see insights.</p>`; state.hasCelebratedSavingsThisMonth = false;}
}
function renderBudgetTips() {
    elements.budgetTipsList.innerHTML = '';
    let tipsGenerated = 0;

    // Tip 1: High spending category
    if (state.expenses.length > 0 && state.weeklyIncome > 0) {
        const monthlyIncome = state.weeklyIncome * 4.33; // Approximate
        const categoryTotals = state.expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});
        const sortedCategories = Object.entries(categoryTotals).sort(([,a],[,b]) => b-a);
        if (sortedCategories.length > 0) {
            const topCategory = sortedCategories[0][0];
            const topAmount = sortedCategories[0][1];
            const percentageOfIncome = (topAmount / monthlyIncome) * 100;
            if (percentageOfIncome > 20) { // Arbitrary threshold
                const li = document.createElement('li');
                li.innerHTML = `Your spending on <strong>${topCategory}</strong> (${formatCurrency(topAmount)}) is about <strong>${percentageOfIncome.toFixed(0)}%</strong> of your estimated monthly income. Consider reviewing this category for potential savings.`;
                elements.budgetTipsList.appendChild(li);
                tipsGenerated++;
            }
        }
    }
    // Tip 2: Subscription Costs
    const totalSubscriptionCost = state.subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    if (totalSubscriptionCost > 0 && state.weeklyIncome > 0) {
        const monthlyIncome = state.weeklyIncome * 4.33;
        const subPercentage = (totalSubscriptionCost / monthlyIncome) * 100;
        if (subPercentage > 5) { // If subscriptions are more than 5% of income
             const li = document.createElement('li');
             li.innerHTML = `Your monthly subscriptions total <strong>${formatCurrency(totalSubscriptionCost)}</strong>. That's about <strong>${subPercentage.toFixed(0)}%</strong> of your income. Review if all are still necessary.`;
             elements.budgetTipsList.appendChild(li);
             tipsGenerated++;
        }
    }
    // Tip 3: Savings Goal Progress
    const activeGoals = state.savingsGoals.filter(g => g.currentAmount < g.targetAmount && g.monthlyContribution > 0);
    if (activeGoals.length > 0) {
        const nextGoal = activeGoals.sort((a,b) => (a.targetAmount - a.currentAmount)/a.monthlyContribution - (b.targetAmount - b.currentAmount)/b.monthlyContribution )[0]; // Simplistic: goal closest to completion by contribution
        if(nextGoal) {
            const li = document.createElement('li');
            li.innerHTML = `Keep contributing to your "<strong>${nextGoal.name}</strong>" goal! You're making great progress.`;
            elements.budgetTipsList.appendChild(li);
            tipsGenerated++;
        }
    }

    if (tipsGenerated === 0) {
        elements.budgetTipsList.innerHTML = `<li class="text-[var(--text-secondary)]">No specific tips right now. Keep tracking!</li>`;
    }
}
function renderMonthlySummary() { 
    const currentMonth = state.currentCalendarDate.getMonth(); const currentYear = state.currentCalendarDate.getFullYear();
    let monthlyIncome = 0;
    if (state.weeklyIncome && state.paydayOfWeek !== null) {
        let paydaysInMonth = 0; const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInCurrentMonth; day++) { if (new Date(currentYear, currentMonth, day).getDay() === state.paydayOfWeek) paydaysInMonth++; }
        monthlyIncome = state.weeklyIncome * paydaysInMonth;
    }
    const monthlyExpensesTotal = state.expenses.filter(exp => { const d=new Date(exp.date+'T00:00:00'); return d.getMonth()===currentMonth && d.getFullYear()===currentYear; }).reduce((s,e)=>s+e.amount,0);
    const monthlyRecurringTotal = state.recurringCharges.reduce((s,c)=>s+c.amount,0);
    const monthlySubscriptionTotal = state.subscriptions.reduce((s,sub)=>s+sub.amount,0);
    const totalSpending = monthlyExpensesTotal + monthlyRecurringTotal + monthlySubscriptionTotal; 
    const net = monthlyIncome - totalSpending;
    elements.dashboardSummaryIncome.textContent = formatCurrency(monthlyIncome);
    elements.dashboardSummaryExpenses.textContent = formatCurrency(totalSpending);
    elements.dashboardSummaryNet.textContent = formatCurrency(net);
    elements.dashboardSummaryNet.classList.remove('text-positive', 'text-negative', 'text-white');
    if (net > 0) elements.dashboardSummaryNet.classList.add('text-positive');
    else if (net < 0) elements.dashboardSummaryNet.classList.add('text-negative');
    else elements.dashboardSummaryNet.classList.add('text-white'); 
}
function populateCategoryFilters() { 
    elements.expenseCategorySelectModal.innerHTML = '<option value="" disabled selected>Select Category</option>';
    EXPENSE_CATEGORIES.forEach(cat => { const o=document.createElement('option'); o.value=cat; o.textContent=cat; elements.expenseCategorySelectModal.appendChild(o); });
    elements.filterCategorySelectSidebar.innerHTML = '<option value="all">All Categories</option>';
    EXPENSE_CATEGORIES.forEach(cat => { const o=document.createElement('option'); o.value=cat; o.textContent=cat; elements.filterCategorySelectSidebar.appendChild(o); });
    elements.filterCategorySelectSidebar.value = state.currentFilterCategorySidebar;

    // Populate subscription categories
    elements.subscriptionCategorySelect.innerHTML = '<option value="" disabled selected>Category</option>';
    SUBSCRIPTION_CATEGORIES.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        elements.subscriptionCategorySelect.appendChild(option);
    });
}

// --- Event Handlers for Deletion/Editing from Sidebar ---
function handleDeleteClickSidebar(event) { 
    const button = event.target.closest('.transaction-delete-button'); if (!button) return;
    const id = button.dataset.id; const type = button.dataset.type; if (!id || !type) return;
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        if (type === 'expense') { state.expenses = state.expenses.filter(item => item.id !== id); } 
        else if (type === 'recurring') { state.recurringCharges = state.recurringCharges.filter(item => item.id !== id); }
        saveData(); renderAll();
    }
}
function handleEditClickSidebar(event) { 
    const button = event.target.closest('.transaction-edit-button'); if (!button) return;
    const id = button.dataset.id; const type = button.dataset.type;
    if (type === 'expense') { openTransactionModal(null, id, null); } 
    else if (type === 'recurring') { openTransactionModal(null, null, id); }
}

// --- Initialization ---
function renderAll() {
    renderCalendar(); renderIncomeDisplay(); renderExpensesSidebar(); renderRecurringBillsSidebar();
    renderMonthlySummary(); populateCategoryFilters(); renderSavingsGoals(); renderFinancialInsights();
    renderSubscriptions(); renderNetWorth(); renderDebtPlanner(); renderBudgetTips();

    document.querySelectorAll('.apple-card, #financialLiteracySection').forEach((el, index) => {
        // Check if animation already applied to prevent re-triggering on every renderAll
        if (!el.classList.contains('animation-applied')) {
            el.classList.add('animate-fadeInUp', 'animation-applied');
            el.style.animationDelay = `${index * 0.05}s`; 
        } else { // If already animated, just ensure it's visible
             el.style.opacity = '1';
        }
    });
    elements.fabAddTransaction.classList.add('visible'); 
}
function initializeApp() {
    elements.footerYear.textContent = new Date().getFullYear(); 
    loadData(); 
    checkDailyVisit(); 
    renderAll(); 
    
    elements.getStartedBtn.addEventListener('click', () => elements.mainContent.scrollIntoView({ behavior: 'smooth' }));
    elements.prevMonthBtn.addEventListener('click', () => { state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1); saveData(); renderAll(); });
    elements.nextMonthBtn.addEventListener('click', () => { state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1); saveData(); renderAll(); });
    
    elements.fabAddTransaction.addEventListener('click', () => openTransactionModal(state.selectedDateForDayDetails || new Date().toISOString().split('T')[0] ));
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.cancelModalBtn.addEventListener('click', closeModal);
    elements.cancelModalBtnRecurring.addEventListener('click', closeModal);
    elements.tabExpense.addEventListener('click', () => switchModalForm('expense'));
    elements.tabBill.addEventListener('click', () => switchModalForm('bill'));
    elements.expenseFormModal.addEventListener('submit', handleExpenseSubmitModal);
    elements.recurringFormModal.addEventListener('submit', handleRecurringSubmitModal);
    elements.incomeForm.addEventListener('submit', handleIncomeSubmit);
    elements.addGoalForm.addEventListener('submit', handleAddGoalSubmit);
    elements.addSubscriptionForm.addEventListener('submit', handleAddSubscriptionSubmit);
    elements.addAssetForm.addEventListener('submit', handleAddAsset);
    elements.addLiabilityForm.addEventListener('submit', handleAddLiability);
    elements.addDebtForm.addEventListener('submit', handleAddDebt);


    elements.filterCategorySelectSidebar.addEventListener('change', (e) => { state.currentFilterCategorySidebar = e.target.value; renderExpensesSidebar(); });
    elements.expenseListSidebar.addEventListener('click', (event) => { handleDeleteClickSidebar(event); handleEditClickSidebar(event); });
    elements.recurringListSidebar.addEventListener('click', (event) => { handleDeleteClickSidebar(event); handleEditClickSidebar(event); });
    
    elements.transactionModal.addEventListener('click', (e) => { if (e.target === elements.transactionModal) closeModal(); });
    elements.dayDetailsModal.addEventListener('click', (e) => { if (e.target === elements.dayDetailsModal) closeDayDetailsModal(); });
    elements.closeDayDetailsModalBtn.addEventListener('click', closeDayDetailsModal);
    elements.dayDetailsAddBtn.addEventListener('click', () => {
        const selectedDate = state.selectedDateForDayDetails || new Date().toISOString().split('T')[0];
        closeDayDetailsModal(); 
        openTransactionModal(selectedDate); 
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.dayDetailsModal.classList.contains('active')) closeDayDetailsModal();
            else if (elements.transactionModal.classList.contains('active')) closeModal();
        }
    });

    elements.heroSection.style.opacity = '1'; 
    elements.visitStreakCounter.classList.add('animate-fadeIn', 'animate-delay-700'); // Delay streak counter slightly more
}

// --- Start Application ---
document.addEventListener('DOMContentLoaded', initializeApp);

