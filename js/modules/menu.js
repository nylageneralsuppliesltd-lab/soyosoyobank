// js/modules/menu.js - Fixed Submenu & Mobile Menu Logic

export function initMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    if (!sidebar || !toggleBtn || !closeBtn) {
        console.warn('Menu elements not found!');
        return;
    }

    // === Mobile Sidebar Toggle ===
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('open');
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.remove('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // === Submenu Toggle - Click on Caret Only ===
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent parent click
            const parentItem = toggle.closest('.menu-item.has-submenu');
            if (parentItem) {
                // Toggle only this submenu
                const isActive = parentItem.classList.contains('active');
                // Optional: close all others when opening one (uncomment if desired)
                // document.querySelectorAll('.menu-item.has-submenu').forEach(item => item.classList.remove('active'));
                parentItem.classList.toggle('active');
            }
        });
    });

    // === Prevent Menu Link from Triggering Submenu Toggle on Mobile ===
    // This allows clicking the text to navigate on desktop, but not interfere on mobile
    document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // Only prevent default if clicking the text/icon (not the caret)
            if (!e.target.closest('.submenu-toggle')) {
                if (window.innerWidth > 992) {
                    // On desktop: do nothing (let main.js handle navigation if needed)
                    e.preventDefault();
                } else {
                    // On mobile: toggle submenu instead of navigating
                    e.preventDefault();
                    e.stopPropagation();
                    const parentItem = link.parentElement;
                    parentItem.classList.toggle('active');
                }
            }
        });
    });
}
