// js/main.js - Entry point (with Deposits module integrated)

import { initMenu } from './modules/menu.js';
import { initMembersModule } from './modules/members.js';
import { initDepositsModule } from './modules/deposits.js';
import { saccoConfig } from './config.js';

const mainContent = document.getElementById('main-content');

// Set dynamic title using config
document.title = `${saccoConfig.name} • Dashboard`;

function loadSection(section) {
    // Members sections
    if (section === 'create-member') {
        if (typeof window.createMemberSection === 'function') {
            window.createMemberSection();
        } else {
            mainContent.innerHTML = '<h1>Create Member</h1><p>Loading form...</p>';
        }
    } else if (section === 'members-list') {
        if (typeof window.membersListSection === 'function') {
            window.membersListSection();
        } else {
            mainContent.innerHTML = '<h1>View Members</h1><p>No members data available yet.</p>';
        }

    // Deposits submodules
    } else if (section === 'deposits-contributions') {
        if (typeof window.depositContributions === 'function') {
            window.depositContributions();
        } else {
            mainContent.innerHTML = '<h1>Contributions</h1><p>Deposit module loading...</p>';
        }
    } else if (section === 'deposits-fines') {
        if (typeof window.depositFines === 'function') {
            window.depositFines();
        } else {
            mainContent.innerHTML = '<h1>Fines</h1><p>Deposit module loading...</p>';
        }
    } else if (section === 'deposits-income') {
        if (typeof window.depositIncome === 'function') {
            window.depositIncome();
        } else {
            mainContent.innerHTML = '<h1>Income Deposits</h1><p>Deposit module loading...</p>';
        }
    } else if (section === 'deposits-loan-repayments') {
        if (typeof window.depositLoanRepayments === 'function') {
            window.depositLoanRepayments();
        } else {
            mainContent.innerHTML = '<h1>Loan Repayments</h1><p>Deposit module loading...</p>';
        }

    // Default for other sections
    } else {
        const title = section
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        mainContent.innerHTML = `
            <h1>${title}</h1>
            <p>This module is under development.</p>
        `;
    }
}

// Navigation: Submenu items (Members, Deposits submenus, etc.)
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();

        // Update active state
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.closest('.menu-item').classList.add('active');

        loadSection(item.dataset.section);

        // Close mobile sidebar
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Top-level menu items without submenu (Dashboard, Reports, Settings, etc.)
document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        link.parentElement.classList.add('active');

        const section = link.parentElement.dataset.section || 'dashboard';
        loadSection(section);

        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Initialize all modules
initMenu();
initMembersModule();
initDepositsModule();  // ← Initializes deposit submenus

// Load default section
loadSection('dashboard');
