// js/main.js - Entry point
import { initMenu } from './modules/menu.js';
import { initMembersModule } from './modules/members.js';

const mainContent = document.getElementById('main-content');

function loadSection(section) {
    if (section === 'create-member') {
        window.createMemberSection();
    } else if (section === 'members-list') {
        window.membersListSection();
    } else {
        mainContent.innerHTML = `<h1>${section.replace(/-/g, " ").toUpperCase()}</h1><p>Module under development.</p>`;
    }
}

// Navigation clicks
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.closest('.menu-item').classList.add('active');
        loadSection(item.dataset.section);
        if (window.innerWidth <= 992) document.getElementById('sidebar').classList.remove('open');
    });
});

document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        link.parentElement.classList.add('active');
        loadSection(link.parentElement.dataset.section);
        if (window.innerWidth <= 992) document.getElementById('sidebar').classList.remove('open');
    });
});

// Initialize everything
initMenu();
initMembersModule(loadSection);

loadSection('dashboard');
