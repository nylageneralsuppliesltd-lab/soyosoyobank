// js/modules/menu.js - Smooth & Reliable Menu Logic (Final Fix)

export function initMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    if (!sidebar || !toggleBtn || !closeBtn) {
        console.warn('Menu elements missing: sidebar, toggle-sidebar, or close-sidebar');
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

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // === Submenu Toggle - ONLY on the caret icon ===
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Critical: prevents bubbling to parent

            const parentItem = toggle.closest('.menu-item.has-submenu');
            if (parentItem) {
                parentItem.classList.toggle('active');
            }
        });
    });

    // === On Mobile: Allow tapping the whole menu item to toggle submenu ===
    // This gives a large touch target without breaking desktop navigation
    document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // If clicking the caret, let the caret handler deal with it
            if (e.target.closest('.submenu-toggle')) {
                return;
            }

            if (window.innerWidth <= 992) {
                // Mobile: toggle submenu on full item tap
                e.preventDefault();
                e.stopPropagation();
                const parentItem = link.parentElement;
                parentItem.classList.toggle('active');
            }
            // Desktop: do nothing here — main.js handles navigation via data-section on submenu items
        });
    });
}
