// js/main.js - Fixed & Working Entry Point (Direct Imports)

import { initMenu } from './modules/menu.js';

// Members Module
import { renderCreateMemberForm, renderMembersTable } from './modules/members.js';
import { initMembersModule } from './modules/members.js';

// Deposits Module
import { 
    renderContributionForm,
    renderFineForm,
    renderIncomeForm,
    renderLoanRepaymentForm,
    renderDepositsHistory
} from './modules/deposits.js';
import { initDepositsModule } from './modules/deposits.js';

// Dashboard
import { renderDashboard } from './modules/dashboard.js';

// Settings
import { renderSettings } from './modules/settings.js';

// Expenses
import { renderExpenses } from './modules/expenses.js';

import { saccoConfig } from './config.js';

// References
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title');

document.title = `${saccoConfig.name} • Management System`;

function loadSection(section = 'dashboard') {
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
            renderMembersTable();
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

        // === Future Modules ===
        default:
            titleText = section.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            mainContent.innerHTML = `
                <div class="section-card" style="text-align:center; padding:60px;">
                    <h1>${titleText}</h1>
                    <p>This module is under development.</p>
                    <small>Coming soon...</small>
                </div>
            `;
            break;
    }

    if (pageTitle) pageTitle.textContent = titleText;

    // Update URL hash for navigation
    history.pushState({ section }, titleText, `#${section}`);

    // Update active menu
    setActiveMenu(section);
}

function setActiveMenu(section) {
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.submenu li').forEach(item => item.classList.remove('active'));

    const menuItem = document.querySelector(`[data-section="${section}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
        const parent = menuItem.closest('.has-submenu');
        if (parent) parent.classList.add('active');
    } else if (section === 'dashboard') {
        document.querySelector('[data-section="dashboard"]')?.classList.add('active');
    }
}

// Top-level menu clicks
document.querySelectorAll('.menu-item > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuItem = link.parentElement;
        const section = menuItem.dataset.section || 'dashboard';
        loadSection(section);
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Submenu clicks
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

// Handle back/forward
window.addEventListener('popstate', (e) => {
    const section = e.state?.section || 'dashboard';
    loadSection(section);
});

// Initialize modules
initMenu();
initMembersModule();
initDepositsModule();

// Load initial section
const initialSection = location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
