// js/main.js - Final Working Entry Point (Direct Named Imports)

import { initMenu } from './modules/menu.js';

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
import { renderSettings } from './modules/settings.js';

// Expenses
import { renderExpenses } from './modules/expenses.js';

import { saccoConfig } from './config.js';

// DOM References
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title');

// Set page title
document.title = `${saccoConfig.name} • Management System`;

/**
 * Load a section by ID
 */
function loadSection(section = 'dashboard') {
    // Clear content
    if (mainContent) mainContent.innerHTML = '';
    if (pageTitle) pageTitle.textContent = 'Loading...';

    let titleText = '';

    switch (section) {
        case 'dashboard':
            renderDashboard();
            titleText = 'Dashboard';
            break;

        case 'settings':
            renderSettings();
            titleText = 'Settings & Configuration';
            break;

        case 'expenses':
            renderExpenses();
            titleText = 'Expenses';
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

        // === Placeholder for Future Modules (Loans, Reports) ===
        default:
            titleText = section
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            mainContent.innerHTML = `
                <div class="section-card" style="text-align:center; padding:60px; max-width:600px; margin:0 auto;">
                    <h1>${titleText}</h1>
                    <p>This feature is under development and will be available soon.</p>
                    <small style="color:#666;">Coming next: Loans Management, Reports, Member Portal...</small>
                </div>
            `;
            break;
    }

    // Update page title
    if (pageTitle) pageTitle.textContent = titleText;

    // Update browser history
    history.pushState({ section }, titleText, `#${section}`);

    // Highlight active menu item
    setActiveMenu(section);
}

/**
 * Highlight the active menu item
 */
function setActiveMenu(section) {
    // Reset all
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.submenu li').forEach(item => item.classList.remove('active'));

    // Activate matching item
    const target = document.querySelector(`[data-section="${section}"]`);
    if (target) {
        target.classList.add('active');
        // Also activate parent submenu if exists
        const parentMenu = target.closest('.has-submenu');
        if (parentMenu) parentMenu.classList.add('active');
    }

    // Special case: dashboard is usually top-level
    if (section === 'dashboard') {
        const dashboardItem = document.querySelector('[data-section="dashboard"]');
        if (dashboardItem) dashboardItem.classList.add('active');
    }
}

// === Navigation Event Listeners ===

// Top-level menu items (Dashboard, Settings, Expenses, etc.)
document.querySelectorAll('.menu-item > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuItem = link.parentElement;
        const section = menuItem.dataset.section || 'dashboard';
        loadSection(section);

        // Close mobile sidebar
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Submenu items (inside Members, Deposits, etc.)
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = item.dataset.section;
        if (section) {
            loadSection(section);

            // Close mobile sidebar
            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('open');
            }
        }
    });
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    const section = e.state?.section || 'dashboard';
    loadSection(section);
});

// === Initialize All Modules ===
initMenu();
initMembersModule();
initDepositsModule();

// === Load Initial Section from URL or Default to Dashboard ===
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);
