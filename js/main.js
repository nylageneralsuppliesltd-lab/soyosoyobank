// js/main.js - FINAL FIXED & OPTIMIZED VERSION

import { initMenu } from './modules/menu.js';
import { renderGeneralLedger } from './modules/generalLedger.js';

// Members Module - Direct imports
import { 
    renderCreateMemberForm, 
    renderMembersList, 
    initMembersModule 
} from './modules/members.js';

// Deposits Module - Direct imports (updated to match latest deposits.js)
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
import { renderSettings } from './modules/settings.js'; // initSettingsModule not needed if it handles internally

// Expenses
import { renderExpenses } from './modules/expenses.js';

import { saccoConfig } from './config.js';

// DOM References
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title'); // Recommended: add <h1 id="page-title"> in index.html

// Base title
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

        case 'settings':
        case 'settings-account-managers':
        case 'settings-account-managers-add':
        case 'settings-accounts':
        case 'settings-accounts-add':
        case 'settings-contributions':
        case 'settings-contributions-add':
        case 'settings-invoices':
        case 'settings-invoices-add':
        case 'settings-expenses':
        case 'settings-expenses-add':
        case 'settings-fines':
        case 'settings-fines-add':
        case 'settings-roles':
        case 'settings-roles-add':
        case 'settings-assets':
        case 'settings-assets-add':
        case 'settings-income':
        case 'settings-income-add':
            renderSettings();
            titleText = 'Settings & Configuration';
            break;

        case 'expenses':
            renderExpenses();
            titleText = 'Record Expenses';
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

        // === Deposits - Now using direct function calls ===
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
case 'general-ledger':
    renderGeneralLedger();
    titleText = 'General Ledger';
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
                        Upcoming: Loans Management, Full Reports, Member Portal, Dividends...
                    </p>
                </div>
            `;
            break;
    }

    // Update page title
    if (pageTitle) pageTitle.textContent = titleText;
    document.title = `${titleText} • ${saccoConfig.name}`;

    // Update URL
    history.pushState({ section }, titleText, `#${section}`);

    // Highlight menu
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
// NAVIGATION LISTENERS - FIXED FOR SUBMENU BEHAVIOR
// ===================================================================

// Top-level menu items: ONLY navigate if NOT has-submenu
document.querySelectorAll('.menu-item > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const parentItem = link.parentElement;

        // If this is a parent with submenu → do NOT navigate, just let menu.js toggle it
        if (parentItem.classList.contains('has-submenu')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Otherwise: normal navigation
        const section = parentItem.dataset.section || 'dashboard';
        loadSection(section);

        // Close mobile menu
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Submenu items: These ARE the navigation triggers
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling to parent

        const section = item.dataset.section;
        if (section) {
            loadSection(section);

            // Close mobile menu
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

// Load initial view
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);

// Optional: Expose globally if any inline onclick still exists
window.loadSection = loadSection;
