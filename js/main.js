// js/main.js - FINAL FIXED VERSION (Settings Sub-Pages Now Work)

import { initMenu } from './modules/menu.js';
import { renderGeneralLedger } from './modules/generalLedger.js';

// Members Module
import { 
    renderCreateMemberForm, 
    renderMembersList, 
    initMembersModule 
} from './modules/members.js';

// Deposits Module
import { 
    renderContributionForm,
    renderFineForm,
    renderIncomeForm,
    renderLoanRepaymentForm,
    renderDepositsHistory,
    initDepositsModule 
} from './modules/deposits.js';

// Dashboard
import { renderDashboard } from './modules/dashboard.js';

// Settings - Import the initializer!
import { renderSettings, initSettingsModule } from './modules/settings.js';

// Expenses
import { renderExpenses } from './modules/expenses.js';

import { saccoConfig } from './config.js';

// DOM References
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title');

document.title = `${saccoConfig.name} • Management System`;

/**
 * Load a section
 */
function loadSection(section = 'dashboard') {
    if (mainContent) mainContent.innerHTML = '';
    if (pageTitle) pageTitle.textContent = 'Loading...';

    let titleText = 'Dashboard';

    switch (section) {
        case 'dashboard':
            renderDashboard();
            titleText = 'Dashboard';
            break;

        // === ALL SETTINGS SUB-PAGES NOW CALL initSettingsModule() ===
        case 'settings':
        case 'settings-contributions':
        case 'settings-invoices':
        case 'settings-expenses':
        case 'settings-fines':
        case 'settings-roles':
        case 'settings-assets':
        case 'settings-income':
        case 'settings-accounts':
            initSettingsModule();  // This handles ALL sub-pages correctly
            titleText = 'Settings & Configuration';
            break;

        case 'expenses':
            renderExpenses();
            titleText = 'Record Expenses';
            break;

        case 'general-ledger':
            renderGeneralLedger();
            titleText = 'General Ledger';
            break;

        // === Members ===
        case 'create-member':
            renderCreateMemberForm();
            titleText = 'Register New Member';
            break;

        case 'members-list':
            renderMembersList();
            titleText = 'Members List';
            break;

        // === Deposits ===
        case 'deposits-contributions':
            renderContributionForm();
            titleText = 'Record Contribution';
            break;

        case 'deposits-fines':
            renderFineForm();
            titleText = 'Record Fine / Penalty';
            break;

        case 'deposits-income':
            renderIncomeForm();
            titleText = 'Record Other Income';
            break;

        case 'deposits-loan-repayments':
            renderLoanRepaymentForm();
            titleText = 'Record Loan Repayment';
            break;

        case 'deposits-list':
            renderDepositsHistory();
            titleText = 'All Deposits & Transactions';
            break;

        // === Fallback ===
        default:
            titleText = section
                .split('-')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            mainContent.innerHTML = `
                <div class="section-card" style="text-align:center; padding:60px; max-width:700px; margin:0 auto;">
                    <h1>${titleText}</h1>
                    <p>This module is under development and will be available soon.</p>
                </div>
            `;
            break;
    }

    if (pageTitle) pageTitle.textContent = titleText;
    document.title = `${titleText} • ${saccoConfig.name}`;

    history.pushState({ section }, titleText, `#${section}`);
    setActiveMenu(section);
}

/**
 * Set active menu state
 */
function setActiveMenu(section) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.submenu li').forEach(item => item.classList.remove('active'));

    const target = document.querySelector(`[data-section="${section}"]`);
    if (target) {
        target.classList.add('active');
        const parent = target.closest('.has-submenu');
        if (parent) parent.classList.add('active');
    }

    if (section === 'dashboard') {
        document.querySelector('[data-section="dashboard"]')?.classList.add('active');
    }
}

// ===================================================================
// NAVIGATION LISTENERS
// ===================================================================

document.querySelectorAll('.menu-item > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const parentItem = link.parentElement;

        if (parentItem.classList.contains('has-submenu')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const section = parentItem.dataset.section || 'dashboard';
        loadSection(section);

        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();

        const section = item.dataset.section;
        if (section) {
            loadSection(section);

            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('open');
            }
        }
    });
});

// Back/Forward support
window.addEventListener('popstate', (e) => {
    const section = e.state?.section || window.location.hash.slice(1) || 'dashboard';
    loadSection(section);
});

// ===================================================================
// INITIALIZATION
// ===================================================================

initMenu();
initMembersModule();
initDepositsModule();

// Call initSettingsModule on load if needed
if (window.location.hash.startsWith('#settings')) {
    initSettingsModule();
}

// Load initial view
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);

// Expose globally
window.loadSection = loadSection;
