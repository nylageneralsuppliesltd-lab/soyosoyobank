// js/main.js - FINAL & FULLY WORKING VERSION (All Modules Integrated)

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

// Settings
import { renderSettings, initSettingsModule } from './modules/settings.js';

// Expenses
import { renderExpenses } from './modules/expenses.js';

// Reports (if you have reports.js)
import { initReportsModule } from './modules/reports.js'; // Add this if you have reports

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

        // === SETTINGS - All sub-pages handled by initSettingsModule() ===
        case 'settings':
        case 'settings-contributions':
        case 'settings-invoices':
        case 'settings-expenses':
        case 'settings-fines':
        case 'settings-roles':
        case 'settings-assets':
        case 'settings-income':
        case 'settings-accounts':
            initSettingsModule();
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
                    <p style="color:#666; margin-top:20px;">
                        Upcoming: Loans Management, Reports, Dividends...
                    </p>
                </div>
            `;
            break;
    }

    // Update title
    if (pageTitle) pageTitle.textContent = titleText;
    document.title = `${titleText} • ${saccoConfig.name}`;

    // Update URL and history
    history.pushState({ section }, titleText, `#${section}`);

    // Highlight active menu
    setActiveMenu(section);
}

/**
 * Highlight active menu item (including submenus)
 */
function setActiveMenu(section) {
    // Reset all
    document.querySelectorAll('.menu-item, .submenu li').forEach(el => el.classList.remove('active'));

    // Find and activate the matching item
    const target = document.querySelector(`[data-section="${section}"]`);
    if (target) {
        target.classList.add('active');
        // Activate parent menu if it's a submenu item
        const parentMenu = target.closest('.menu-item.has-submenu');
        if (parentMenu) parentMenu.classList.add('active');
    }

    // Special case for dashboard
    if (section === 'dashboard') {
        document.querySelector('[data-section="dashboard"]')?.classList.add('active');
    }
}

// ===================================================================
// NAVIGATION LISTENERS
// ===================================================================

// Top-level menu items (non-submenu)
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

// Submenu items
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

// Browser back/forward
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
initSettingsModule();  // Always initialize settings module
// initReportsModule(); // Uncomment when you add reports.js

// Load initial section from URL or default to dashboard
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);

// Expose loadSection globally (for inline onclicks in HTML)
window.loadSection = loadSection;
