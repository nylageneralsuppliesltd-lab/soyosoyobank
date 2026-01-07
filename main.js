// main.js - Fixed active states, submenu clicks, mobile close

const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

// Toggle submenus (click on parent)
document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = link.parentElement;
        parent.classList.toggle('active');
    });
});

// Submenu item click → load section + highlight parent
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = item.closest('.menu-item');
        
        // Set active on parent
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        parent.classList.add('active');

        loadSection(item.dataset.section);

        // Close mobile sidebar
        if (window.innerWidth <= 992) sidebar.classList.remove('open');
    });
});

// Top-level items without submenu
document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        link.parentElement.classList.add('active');
        loadSection(link.parentElement.dataset.section);

        if (window.innerWidth <= 992) sidebar.classList.remove('open');
    });
});

// Mobile toggle
toggleSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

// Click outside to close mobile sidebar
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

function loadSection(section) {
    let title = section.replace(/-/g, " ").toUpperCase();

    if (section === "create-member") {
        mainContent.innerHTML = `
            <h1>Create New Member</h1>
            <p class="subtitle">Register a new member into SoyoSoyoApp</p>
            <form class="form-card">
                <!-- (same form fields as before) -->
                <div class="form-group"><label>Full Name</label><input type="text" placeholder="Enter full name"></div>
                <div class="form-group"><label>ID / Passport Number</label><input type="text" placeholder="Enter ID or passport"></div>
                <div class="form-group"><label>Phone Number</label><input type="tel" placeholder="07XX XXX XXX"></div>
                <div class="form-group"><label>Email Address</label><input type="email" placeholder="Enter email address"></div>
                <div class="form-group"><label>Gender</label><select><option>Select Gender</option><option>Male</option><option>Female</option></select></div>
                <div class="form-group"><label>Date of Birth</label><input type="date"></div>
                <button type="submit" class="submit-btn">Create Member</button>
            </form>
        `;
        return;
    }

    mainContent.innerHTML = `
        <h1>${title}</h1>
        <p>This section is under development.</p>
    `;
}

// Initial load
loadSection('dashboard');
