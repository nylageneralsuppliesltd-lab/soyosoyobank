export function initMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    if (!sidebar || !toggleBtn || !closeBtn) {
        console.warn('Menu elements missing');
        return;
    }

    // === Mobile Sidebar Open/Close ===
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.add('open');
    });

    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.remove('open');
    });

    // === Prevent sidebar clicks from bubbling to document ===
    sidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // === Close when clicking outside (mobile only) ===
    document.addEventListener('click', () => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // === Submenu toggle (caret only, ALL devices) ===
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const parent = toggle.closest('.menu-item.has-submenu');
            if (!parent) return;

            // Close other open submenus (optional but recommended)
            document.querySelectorAll('.menu-item.has-submenu.active')
                .forEach(item => {
                    if (item !== parent) item.classList.remove('active');
                });

            parent.classList.toggle('active');
        });
    });

    // === Mobile: tap menu-link toggles submenu ONLY if it has submenu ===
    document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth > 992) return;

            e.preventDefault();
            e.stopPropagation();

            const parent = link.parentElement;
            parent.classList.toggle('active');
        });
    });
}
