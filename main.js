// main.js - Enhanced with Edit, Suspend, expanded roles, custom role creation

const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

// Data storage
let members = JSON.parse(localStorage.getItem('soyoMembers')) || [];

// Global functions
function saveMember(isEdit = false, memberId = null) {
    const memberData = {
        name: document.getElementById('full-name').value.trim(),
        idNumber: document.getElementById('id-number').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        role: document.getElementById('role').value === 'Other' ? 
              document.getElementById('custom-role').value.trim() : 
              document.getElementById('role').value,
        nokName: document.getElementById('nok-name').value.trim(),
        nokPhone: document.getElementById('nok-phone').value.trim()
    };

    if (!memberData.name || !memberData.phone) {
        alert('Name and Phone are required!');
        return;
    }

    if (isEdit) {
        const member = members.find(m => m.id === memberId);
        Object.assign(member, memberData);
        alert('Member updated!');
    } else {
        members.push({
            ...memberData,
            id: Date.now(),
            balance: 0,
            ledger: [],
            active: true
        });
        alert('Member created!');
    }

    localStorage.setItem('soyoMembers', JSON.stringify(members));
    loadSection('members-list');
}

window.editMember = function(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    mainContent.innerHTML = `
        <h1>Edit Member - ${member.name}</h1>
        <p class="subtitle">Update member details.</p>
        <form class="form-card" id="edit-member-form">
            <div class="form-group"><label>Full Name *</label><input type="text" id="full-name" value="${member.name}" required></div>
            <div class="form-group"><label>ID / Passport</label><input type="text" id="id-number" value="${member.idNumber || ''}"></div>
            <div class="form-group"><label>Phone Number *</label><input type="tel" id="phone" value="${member.phone}" required></div>
            <div class="form-group"><label>Email</label><input type="email" id="email" value="${member.email || ''}"></div>
            <div class="form-group"><label>Gender</label><select id="gender"><option ${member.gender === '' ? 'selected' : ''}>Select</option><option ${member.gender === 'Male' ? 'selected' : ''}>Male</option><option ${member.gender === 'Female' ? 'selected' : ''}>Female</option><option ${member.gender === 'Other' ? 'selected' : ''}>Other</option></select></div>
            <div class="form-group"><label>Date of Birth</label><input type="date" id="dob" value="${member.dob || ''}"></div>
            <div class="form-group"><label>Role</label><select id="role"><option ${member.role === 'Member' ? 'selected' : ''}>Member</option><option ${member.role === 'Admin' ? 'selected' : ''}>Admin</option><option ${member.role === 'Chairman' ? 'selected' : ''}>Chairman</option><option ${member.role === 'Vice Chairman' ? 'selected' : ''}>Vice Chairman</option><option ${member.role === 'Secretary' ? 'selected' : ''}>Secretary</option><option ${member.role === 'Treasurer' ? 'selected' : ''}>Treasurer</option><option ${['Member', 'Admin', 'Chairman', 'Vice Chairman', 'Secretary', 'Treasurer'].includes(member.role) ? '' : 'selected'}>Other</option></select>
                <div id="custom-role-group"><label>Custom Role Name</label><input type="text" id="custom-role" value="${['Member', 'Admin', 'Chairman', 'Vice Chairman', 'Secretary', 'Treasurer'].includes(member.role) ? '' : member.role}" required></div>
            </div>
            <div class="form-group"><label>Next of Kin Name</label><input type="text" id="nok-name" value="${member.nokName || ''}"></div>
            <div class="form-group"><label>Next of Kin Phone</label><input type="tel" id="nok-phone" value="${member.nokPhone || ''}"></div>
            <button type="submit" class="submit-btn">Update Member</button>
            <button type="button" class="submit-btn" style="background:#6c757d;margin-top:10px;" onclick="loadSection('members-list')">Cancel</button>
        </form>
    `;

    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    if (roleSelect.value === 'Other') customGroup.style.display = 'block';

    roleSelect.addEventListener('change', () => {
        customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
    });

    document.getElementById('edit-member-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveMember(true, memberId);
    });
};

window.suspendMember = function(memberId) {
    if (!confirm('Suspend this member? They will be deactivated and shown as inactive in reports.')) return;
    const member = members.find(m => m.id === memberId);
    member.active = false;
    localStorage.setItem('soyoMembers', JSON.stringify(members));
    alert('Member suspended!');
    loadSection('members-list');
};

window.viewLedger = function(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let ledgerHtml = `<h1>Ledger for ${member.name} (${member.active ? 'Active' : 'Inactive'})</h1>
        <p class="subtitle">Balance: KSh ${member.balance.toLocaleString()}</p>
        <table class="members-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr></thead>
            <tbody>${member.ledger.map(tx => `<tr><td>${tx.date}</td><td>${tx.type}</td><td>${tx.amount.toLocaleString()}</td><td>${tx.description}</td><td>${tx.balanceAfter.toLocaleString()}</td></tr>`).join('') || '<tr><td colspan="5">No transactions.</td></tr>'}</tbody>
        </table>
        <button class="submit-btn" style="width:auto;margin-top:20px;" onclick="showAddTransactionForm(${memberId})">Add Transaction</button>
        <button class="submit-btn" style="width:auto;margin-top:20px;margin-left:10px;background:#6c757d;" onclick="loadSection('members-list')">Back</button>`;
    mainContent.innerHTML = ledgerHtml;
};

window.showAddTransactionForm = function(memberId) {
    const member = members.find(m => m.id === memberId);
    mainContent.innerHTML = `
        <h1>Add Transaction - ${member.name}</h1>
        <form id="transaction-form" class="form-card">
            <div class="form-group"><label>Type</label><select id="tx-type"><option>Deposit</option><option>Withdrawal</option><option>Loan Disbursement</option><option>Loan Repayment</option><option>Share Contribution</option></select></div>
            <div class="form-group"><label>Amount (KSh)</label><input type="number" id="tx-amount" min="1" required></div>
            <div class="form-group"><label>Description</label><input type="text" id="tx-desc"></div>
            <button type="submit" class="submit-btn">Record</button>
            <button type="button" class="submit-btn" style="background:#6c757d;margin-left:10px;" onclick="viewLedger(${memberId})">Cancel</button>
        </form>
    `;

    document.getElementById('transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('tx-type').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const desc = document.getElementById('tx-desc').value.trim() || type;

        const amountChange = (type === 'Withdrawal' || type === 'Loan Disbursement') ? -amount : amount;
        member.balance += amountChange;

        member.ledger.push({
            date: new Date().toLocaleDateString('en-GB'),
            type,
            amount,
            description: desc,
            balanceAfter: member.balance
        });

        localStorage.setItem('soyoMembers', JSON.stringify(members));
        alert('Transaction added!');
        viewLedger(memberId);
    });
};

window.editRole = function(memberId) {
    const member = members.find(m => m.id === memberId);
    const newRole = prompt('Enter new role:', member.role);
    if (newRole && newRole.trim()) {
        member.role = newRole.trim();
        localStorage.setItem('soyoMembers', JSON.stringify(members));
        alert('Role updated!');
        loadSection('members-list');
    }
};

// Menu handlers (unchanged)
document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        link.parentElement.classList.toggle('active');
    });
});

document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.closest('.menu-item').classList.add('active');
        loadSection(item.dataset.section);
        if (window.innerWidth <= 992) sidebar.classList.remove('open');
    });
});

document.querySelectorAll('.menu-item:not(.has-submenu) > .menu-link').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        link.parentElement.classList.add('active');
        loadSection(link.parentElement.dataset.section);
        if (window.innerWidth <= 992) sidebar.classList.remove('open');
    });
});

toggleSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

function loadSection(section) {
    let title = section.replace(/-/g, " ").toUpperCase();

    if (section === "create-member") {
        mainContent.innerHTML = `
            <h1>Create New Member</h1>
            <p class="subtitle">Add member with advanced roles and details.</p>
            <form class="form-card" id="create-member-form">
                <div class="form-group"><label>Full Name *</label><input type="text" id="full-name" required></div>
                <div class="form-group"><label>ID / Passport</label><input type="text" id="id-number"></div>
                <div class="form-group"><label>Phone Number *</label><input type="tel" id="phone" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="email"></div>
                <div class="form-group"><label>Gender</label><select id="gender"><option>Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div class="form-group"><label>Date of Birth</label><input type="date" id="dob"></div>
                <div class="form-group"><label>Role</label><select id="role"><option>Member</option><option>Admin</option><option>Chairman</option><option>Vice Chairman</option><option>Secretary</option><option>Treasurer</option><option>Other</option></select>
                    <div id="custom-role-group"><label>Custom Role Name</label><input type="text" id="custom-role" required></div>
                </div>
                <div class="form-group"><label>Next of Kin Name</label><input type="text" id="nok-name"></div>
                <div class="form-group"><label>Next of Kin Phone</label><input type="tel" id="nok-phone"></div>
                <button type="submit" class="submit-btn">Create Member</button>
            </form>
        `;

        const roleSelect = document.getElementById('role');
        const customGroup = document.getElementById('custom-role-group');
        roleSelect.addEventListener('change', () => {
            customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
        });

        document.getElementById('create-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveMember();
        });
        return;
    }

    if (section === "members-list") {
        mainContent.innerHTML = `
            <h1>View Members</h1>
            <p class="subtitle">Total: ${members.length} (Active: ${members.filter(m => m.active).length})</p>
            <table class="members-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Next of Kin</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${members.map(m => `
                        <tr class="${m.active ? '' : 'inactive-row'}">
                            <td>${m.name}</td>
                            <td>${m.phone}</td>
                            <td>${m.role}</td>
                            <td>${m.nokName || '-'} (${m.nokPhone || ''})</td>
                            <td>KSh ${m.balance.toLocaleString()}</td>
                            <td>${m.active ? 'Active' : 'Suspended'}</td>
                            <td>
                                <button onclick="viewLedger(${m.id})">Ledger</button>
                                <button onclick="editMember(${m.id})">Edit</button>
                                <button onclick="suspendMember(${m.id})" ${m.active ? '' : 'disabled'}>Suspend</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        `;
        return;
    }

    mainContent.innerHTML = `<h1>${title}</h1><p>Under development. Note: Suspended members will appear as inactive in future reports.</p>`;
}

// Initial load
loadSection('dashboard');
