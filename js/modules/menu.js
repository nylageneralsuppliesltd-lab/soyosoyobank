// js/modules/menu.js - Fixed & Improved Menu Logic

export function initMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    if (!sidebar || !toggleBtn || !closeBtn) {
        console.warn('Menu elements not found. Check IDs: sidebar, toggle-sidebar, close-sidebar');
        return;
    }

    // === Mobile Sidebar Open/Close ===
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

    // === Submenu Toggle - Only on Caret Icon (Best UX) ===
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent link
            const parentItem = toggle.closest('.menu-item.has-submenu');
            if (parentItem) {
                parentItem.classList.toggle('active');
            }
        });
    });

    // === Optional: Allow clicking entire menu item to open submenu on mobile ===
    // This improves mobile UX for large touch targets
    if (window.innerWidth <= 992) {
        document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Only toggle submenu if clicking text/icon (not caret)
                if (!e.target.closest('.submenu-toggle')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const parentItem = link.parentElement;
                    parentItem.classList.toggle('active');
                }
            });
        });
    }
}
