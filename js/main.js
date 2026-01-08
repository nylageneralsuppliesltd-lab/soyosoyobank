// js/main.js - Final Entry Point (All Modules Integrated)

import { initMenu } from './modules/menu.js';

// Members Module
import { 
    renderCreateMemberForm, 
    renderMembersList, 
    initMembersModule 
} from './modules/members.js';

// Deposits Module
import { 
    initDepositsModule 
} from './modules/deposits.js';

// Dashboard
import { renderDashboard } from './modules/dashboard.js';

import { saccoConfig } from './config.js';

// DOM References
const mainContent = document.getElementById('main-content');
const pageTitle = document.querySelector('title'); // For dynamic title

// Set base page title
document.title = `${saccoConfig.name} • Management System`;

/**
 * Load a section by ID
 */
function loadSection(section = 'dashboard') {
    // Clear content
    if (mainContent) mainContent.innerHTML = '';
    
    let titleText = 'Dashboard';

    switch (section) {
        case 'dashboard':
            renderDashboard();
            titleText = 'Dashboard';
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
            } else {
                mainContent.innerHTML = '<h1>Record Contribution</h1><p>Deposits module loading...</p>';
            }
            titleText = 'Record Contribution';
            break;

        case 'deposits-fines':
            if (typeof window.recordFine === 'function') {
                window.recordFine();
            }
            titleText = 'Record Fine';
            break;

        case 'deposits-income':
            if (typeof window.recordIncome === 'function') {
                window.recordIncome();
            }
            titleText = 'Record Other Income';
            break;

        case 'deposits-loan-repayments':
            if (typeof window.recordLoanRepayment === 'function') {
                window.recordLoanRepayment();
            }
            titleText = 'Record Loan Repayment';
            break;

        case 'deposits-list':
            if (typeof window.depositsListSection === 'function') {
                window.depositsListSection();
            }
            titleText = 'All Deposits History';
            break;

        // === Future Modules (Loans, Reports, Settings, Expenses) ===
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
                        Upcoming features: Loans Management, Full Reports, Settings, Expenses, Member Portal...
                    </p>
                </div>
            `;
            break;
    }

    // Update browser title
    document.title = `${titleText} • ${saccoConfig.name}`;

    // Update URL hash without reloading
    if (history.pushState) {
        history.pushState({ section }, titleText, `#${section}`);
    }

    // Highlight active menu
    setActiveMenu(section);
}

/**
 * Highlight the active menu item based on current section
 */
function setActiveMenu(section) {
    // Reset all
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.submenu li').forEach(item => item.classList.remove('active'));

    // Find and activate the matching item
    const targetItem = document.querySelector(`[data-section="${section}"]`);
    if (targetItem) {
        targetItem.classList.add('active');

        // If it's in a submenu, open the parent
        const parentHasSubmenu = targetItem.closest('.has-submenu');
        if (parentHasSubmenu) {
            parentHasSubmenu.classList.add('active');
        }
    }

    // Special case: Dashboard is top-level
    if (section === 'dashboard') {
        const dashboardItem = document.querySelector('.menu-item[data-section="dashboard"]');
        if (dashboardItem) dashboardItem.classList.add('active');
    }
}

// === Navigation Event Listeners ===

// Top-level menu items (Dashboard, Reports, Settings, etc.)
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

// Submenu items (inside Members, Deposits, Loans, etc.)
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
    const section = e.state?.section || window.location.hash.slice(1) || 'dashboard';
    loadSection(section);
});

// === Initialize All Modules ===
initMenu();
initMembersModule();
initDepositsModule();

// === Load Initial Section ===
// On first load: use URL hash, fallback to dashboard
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);

// === EXPOSE loadSection FOR onclick HANDLERS ===
window.loadSection = loadSection;
