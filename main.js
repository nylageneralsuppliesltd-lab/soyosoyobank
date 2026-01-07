// main.js - Enhanced with submenu support, sidebar toggle for mobile, and section loading

const menuItems = document.querySelectorAll('.menu > li.has-submenu');
const submenuParents = document.querySelectorAll('.menu > li.has-submenu');
const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

// Toggle submenus
submenuParents.forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('active');

        // Remove active from other top-level items (optional: allow multiple open)
        // submenuParents.forEach(other => { if (other !== item) other.classList.remove('active'); });
    });
});

// Click on submenu items to load section and close mobile sidebar
document.querySelectorAll('.submenu li').forEach(subItem => {
    subItem.addEventListener('click', (e) => {
        e.stopPropagation();

        // Remove active from all top-level
        document.querySelectorAll('.menu > li').forEach(i => i.classList.remove('active'));

        // Add active to parent
        subItem.closest('.has-submenu').classList.add('active');

        loadSection(subItem.dataset.section);

        // Close sidebar on mobile
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('open');
        }
    });
});

// Top-level menu items without submenu
document.querySelectorAll('.menu > li:not(.has-submenu)').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu > li').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        loadSection(item.dataset.section);

        if (window.innerWidth <= 992) {
            sidebar.classList.remove('open');
        }
    });
});

// Mobile sidebar toggle
toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Click outside sidebar to close on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

function loadSection(section) {
    let title = section.replace("-", " ").toUpperCase();

    if (section === "create-member") {
        mainContent.innerHTML = `
            <h1>Create New Member</h1>
            <p class="subtitle">Register a new member into the SoyoSoyo SACCO system</p>

            <form class="form-card">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="Enter full name">
                </div>

                <div class="form-group">
                    <label>ID / Passport Number</label>
                    <input type="text" placeholder="Enter ID or passport">
                </div>

                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="07XX XXX XXX">
                </div>

                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="Enter email address">
                </div>

                <div class="form-group">
                    <label>Gender</label>
                    <select>
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date">
                </div>

                <button type="submit" class="submit-btn">Create Member</button>
            </form>
        `;
        return;
    }

    // Default placeholder for other sections
    mainContent.innerHTML = `
        <h1>${title}</h1>
        <p>This section is under development. Add more content here for ${title}.</p>
    `;
}
