// js/main.js - App Entry Point (Updated with Settings & Clean Navigation)

import { initMenu } from './modules/menu.js';
import { initMembersModule } from './modules/members.js';
import { initDepositsModule } from './modules/deposits.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderSettings } from './modules/settings.js';
import { saccoConfig } from './config.js';

// Global references
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title'); // Assuming you have <h1 id="page-title"> in index.html

// Set dynamic page title
document.title = `${saccoConfig.name} Management System`;

/**
 * Main navigation handler
 * @param {string} section - The section ID to load
 */
function loadSection(section = 'dashboard') {
    // Clear previous content
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

        // Members Module Sections
        case 'create-member':
            if (typeof window.renderCreateMemberForm === 'function') {
                window.renderCreateMemberForm();
                titleText = 'Register New Member';
            }
            break;
        case 'members-list':
            if (typeof window.renderMembersTable === 'function') {
                window.renderMembersTable();
                titleText = 'Members List';
            }
            break;

        // Deposits Module Sections
        case 'deposits-contributions':
            if (typeof window.renderContributionForm === 'function') {
                window.renderContributionForm();
                titleText = 'Record Contribution';
            }
            break;
        case 'deposits-fines':
            if (typeof window.renderFineForm === 'function') {
                window.renderFineForm();
                titleText = 'Record Fine / Penalty';
            }
            break;
        case 'deposits-income':
            if (typeof window.renderIncomeForm === 'function') {
                window.renderIncomeForm();
                titleText = 'Record Other Income';
            }
            break;
        case 'deposits-loan-repayments':
            if (typeof window.renderLoanRepaymentForm === 'function') {
                window.renderLoanRepaymentForm();
                titleText = 'Record Loan Repayment';
            }
            break;
        case 'deposits-list':
            if (typeof window.renderDepositsHistory === 'function') {
                window.renderDepositsHistory();
                titleText = 'All Deposits & Transactions';
            }
            break;

        // Future modules (Loans, Reports, etc.)
        default:
            titleText = section
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            mainContent.innerHTML = `
                <div class="section-card" style="text-align:center; padding:40px;">
                    <h1>${titleText}</h1>
                    <p>This feature is under development and will be available in a future update.</p>
                    <small>Coming soon: Loans, Reports, Exports, Member Portal...</small>
                </div>
            `;
            break;
    }

    // Update page title
    if (pageTitle) pageTitle.textContent = titleText;

    // Update URL hash (optional, for bookmarking)
    history.pushState({ section }, titleText, `#${section}`);
}

/**
 * Highlight active menu item based on current section
 * @param {string} section
 */
function setActiveMenu(section) {
    // Remove all active classes
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.submenu li').forEach(item => {
        item.classList.remove('active');
    });

    // Find and activate the correct menu item
    const menuItem = document.querySelector(`[data-section="${section}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
        // If it's in a submenu, also activate parent
        const parent = menuItem.closest('.has-submenu');
        if (parent) parent.classList.add('active');
    } else if (section === 'dashboard') {
        // Dashboard is usually the top "Home" item
        const homeItem = document.querySelector('.menu-item:not(.has-submenu)');
        if (homeItem) homeItem.classList.add('active');
    }
}

// Event Listeners for Navigation

// Top-level menu items (Dashboard, Settings, etc.)
document.querySelectorAll('.menu-item > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const menuItem = link.parentElement;
        const section = menuItem.dataset.section || 'dashboard';

        loadSection(section);
        setActiveMenu(section);

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
            setActiveMenu(section);

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
    setActiveMenu(section);
});

// Initialize all modules
initMenu();
initMembersModule();
initDepositsModule();

// Load initial section from URL hash or default to dashboard
const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);
