// main.js - Fixed & working

const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

// Toggle submenus
document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = link.parentElement;
        parent.classList.toggle('active');
    });
});

// Submenu clicks
document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = item.closest('.menu-item');
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        parent.classList.add('active');
        loadSection(item.dataset.section);
        if (window.innerWidth <= 992) sidebar.classList.remove('open');
    });
});

// Top-level without submenu
document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        link.parentElement.classList.add('active');
        loadSection(link.parentElement.dataset.section);
        if (window.innerWidth <= 992) sidebar.classList.remove('open');
    });
});

// Mobile toggle
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    console.log('Sidebar opened'); // Debug
});
closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    console.log('Sidebar closed'); // Debug
});

// Outside click close
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
            <p class="subtitle">Register a new member with roles and next of kin.</p>
            <form class="form-card" id="create-member-form">
                <div class="form-group"><label>Full Name</label><input type="text" id="full-name" placeholder="Enter full name"></div>
                <div class="form-group"><label>ID / Passport Number</label><input type="text" id="id-number" placeholder="Enter ID or passport"></div>
                <div class="form-group"><label>Phone Number</label><input type="tel" id="phone" placeholder="07XX XXX XXX"></div>
                <div class="form-group"><label>Email Address</label><input type="email" id="email" placeholder="Enter email address"></div>
                <div class="form-group"><label>Gender</label><select id="gender"><option>Select Gender</option><option>Male</option><option>Female</option></select></div>
                <div class="form-group"><label>Date of Birth</label><input type="date" id="dob"></div>
                <div class="form-group"><label>Role</label><select id="role"><option>Select Role</option><option>Member</option><option>Admin</option><option>Guest</option></select></div>
                <div class="form-group"><label>Next of Kin Name</label><input type="text" id="nok-name" placeholder="Enter next of kin name"></div>
                <div class="form-group"><label>Next of Kin Phone</label><input type="tel" id="nok-phone" placeholder="07XX XXX XXX"></div>
                <button type="submit" class="submit-btn">Create Member</button>
            </form>
        `;

        // Add form submit handler
        document.getElementById('create-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveMember();
        });
        return;
    }

    mainContent.innerHTML = `
        <h1>${title}</h1>
        <p>This section is under development.</p>
    `;
}

// Initial load
loadSection('dashboard');
