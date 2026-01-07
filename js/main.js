// js/main.js - Entry point (clean & working)

import { initMenu } from './modules/menu.js';
import { initMembersModule } from './modules/members.js';
import { saccoConfig } from './config.js';

const mainContent = document.getElementById('main-content');

function loadSection(section) {
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
    } else {
        // Capitalize and format section name
        const title = section
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        mainContent.innerHTML = `<h1>${title}</h1><p>This module is under development.</p>`;
    }
}

// Navigation: Submenu items (e.g., Create Member, View Members)
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();

        // Update active menu state
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.closest('.menu-item').classList.add('active');

        // Load the section
        loadSection(item.dataset.section);

        // Close mobile sidebar
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Navigation: Top-level menu items without submenu (e.g., Deposits, Reports)
document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        link.parentElement.classList.add('active');

        // Load section using dataset from the <li>
        const section = link.parentElement.dataset.section;
        loadSection(section);

        // Close mobile sidebar
        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

// Initialize app
initMenu();
initMembersModule(); // ← No arguments! Functions are attached to window inside members.js

// Default load
loadSection('dashboard');
