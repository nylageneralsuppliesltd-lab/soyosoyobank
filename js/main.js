// js/main.js - Final & Complete Entry Point (All Fixes Applied)

import { initMenu } from './modules/menu.js';

// Members Module
import { 
    renderCreateMemberForm, 
    renderMembersList, 
    initMembersModule 
} from './modules/members.js';

// Deposits Module
import { initDepositsModule } from './modules/deposits.js';

// Dashboard
import { renderDashboard } from './modules/dashboard.js';

// Settings (Future - placeholder ready)
import { renderSettings } from './modules/settings.js';

// Expenses (Future - placeholder ready)
import { renderExpenses } from './modules/expenses.js';

import { saccoConfig } from './config.js';

// DOM References
const mainContent = document.getElementById('main-content');

// Set base title
document.title = `${saccoConfig.name} • Management System`;

/**
 * Load a section by ID
 */
function loadSection(section = 'dashboard') {
    if (mainContent) mainContent.innerHTML = '';

    let titleText = 'Dashboard';

    switch (section) {
        // === Core Modules ===
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

        // === Deposits ===
        case 'deposits-contributions':
            if (typeof window.recordContribution === 'function') {
                window.recordContribution();
                titleText = 'Record Contribution';
            }
            break;

        case 'deposits-fines':
            if (typeof window.recordFine === 'function') {
                window.recordFine();
                titleText = 'Record Fine';
            }
            break;

        case 'deposits-income':
            if (typeof window.recordIncome === 'function') {
                window.recordIncome();
                titleText = 'Record Other Income';
            }
            break;

        case 'deposits-loan-repayments':
            if (typeof window.recordLoanRepayment === 'function') {
                window.recordLoanRepayment();
                titleText = 'Record Loan Repayment';
            }
            break;

        case 'deposits-list':
            if (typeof window.depositsListSection === 'function') {
                window.depositsListSection();
                titleText = 'Deposits History';
            }
            break;

        // === Future Modules (Loans, Reports) ===
        default:
            titleText = section
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
    document.title = `${titleText} • ${saccoConfig.name}`;

    // Update URL hash
    if (history.pushState) {
        history.pushState({ section }, titleText, `#${section}`);
    } else {
        window.location.hash = section;
    }

    // Highlight active menu
    setActiveMenu(section);
}

/**
 * Highlight active menu item
 */
function setActiveMenu(section) {
    // Reset all
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.submenu li').forEach(item => item.classList.remove('active'));

    // Activate current section
    const target = document.querySelector(`[data-section="${section}"]`);
    if (target) {
        target.classList.add('active');
        const parent = target.closest('.menu-item.has-submenu');
        if (parent) parent.classList.add('active');
    }

    // Dashboard special case
    if (section === 'dashboard') {
        const dash = document.querySelector('[data-section="dashboard"]');
        if (dash) dash.classList.add('active');
    }
}

// === Navigation Listeners ===

// Top-level menu items (Dashboard, Settings, Expenses)
document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = link.parentElement.dataset.section || 'dashboard';
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

// Back/forward button support
window.addEventListener('popstate', (e) => {
    const section = e.state?.section || window.location.hash.slice(1) || 'dashboard';
    loadSection(section);
});

// === Initialize Modules ===
initMenu();
initMembersModule();
initDepositsModule();

// === Load Initial Section ===
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);

// === EXPOSE loadSection GLOBALLY (for any onclick in HTML) ===
window.loadSection = loadSection;
