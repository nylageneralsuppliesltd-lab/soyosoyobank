// js/modules/menu.js
export function initMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');

    toggleBtn.addEventListener('click', () => sidebar.classList.add('open'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Submenu toggle
    document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            link.parentElement.classList.toggle('active');
        });
    });
}
