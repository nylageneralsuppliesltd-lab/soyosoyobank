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
// Members Data Simulation (localStorage)
let members = JSON.parse(localStorage.getItem('members')) || [];

// Save new member
function saveMember() {
    const newMember = {
        id: Date.now(),
        name: document.getElementById('full-name').value,
        idNumber: document.getElementById('id-number').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        role: document.getElementById('role').value,
        nokName: document.getElementById('nok-name').value,
        nokPhone: document.getElementById('nok-phone').value,
        ledger: [] // Array of transactions {date, type, amount, description}
    };
    members.push(newMember);
    localStorage.setItem('members', JSON.stringify(members));
    alert('Member created!');
    loadSection('members-list'); // Redirect to list
}

// Update loadSection for members-list
if (section === "members-list") {
    let html = '<h1>View Members</h1><p class="subtitle">List of all SACCO members with roles and ledgers.</p><table class="members-table"><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Next of Kin</th><th>Actions</th></tr></thead><tbody>';
    members.forEach(member => {
        html += `<tr><td>${member.id}</td><td>${member.name}</td><td>${member.role}</td><td>${member.nokName} (${member.nokPhone})</td><td><button onclick="viewLedger(${member.id})">View Ledger</button> <button onclick="editRole(${member.id})">Edit Role</button></td></tr>`;
    });
    html += '</tbody></table>';
    mainContent.innerHTML = html;
    return;
}

// View individual ledger
window.viewLedger = function(id) {
    const member = members.find(m => m.id === id);
    let html = `<h1>Ledger for ${member.name}</h1><p>Individual statement and transactions.</p><table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead><tbody>`;
    member.ledger.forEach(tx => {
        html += `<tr><td>${tx.date}</td><td>${tx.type}</td><td>${tx.amount}</td><td>${tx.description}</td></tr>`;
    });
    html += '</tbody></table><button onclick="addTransaction(${id})">Add Transaction</button>';
    mainContent.innerHTML = html;
};

// Add transaction (simulates deposit/loan/etc)
window.addTransaction = function(id) {
    // Placeholder - in real, add form
    const tx = {date: new Date().toLocaleDateString(), type: 'Deposit', amount: 1000, description: 'Monthly savings'};
    const member = members.find(m => m.id === id);
    member.ledger.push(tx);
    localStorage.setItem('members', JSON.stringify(members));
    viewLedger(id);
};

// Edit role
window.editRole = function(id) {
    const newRole = prompt('Enter new role (Member/Admin/Guest):');
    const member = members.find(m => m.id === id);
    member.role = newRole;
    localStorage.setItem('members', JSON.stringify(members));
    loadSection('members-list');
};
// Initial load
loadSection('dashboard');
