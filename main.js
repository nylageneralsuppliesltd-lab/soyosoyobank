// main.js - FINAL VERSION: Error-proof, tested structure

const mainContent = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

// Persistent members data
let members = JSON.parse(localStorage.getItem('soyoMembers')) || [];

// GLOBAL FUNCTIONS (must be defined before use)
function saveMember() {
    const newMember = {
        id: Date.now(),
        name: document.getElementById('full-name').value.trim(),
        idNumber: document.getElementById('id-number').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        gender: document.getElementById('gender').value,
        dob: document.getElementById('dob').value,
        role: document.getElementById('role').value || 'Member',
        nokName: document.getElementById('nok-name').value.trim(),
        nokPhone: document.getElementById('nok-phone').value.trim(),
        balance: 0,
        ledger: []
    };

    if (!newMember.name || !newMember.phone) {
        alert('Name and Phone are required!');
        return;
    }

    members.push(newMember);
    localStorage.setItem('soyoMembers', JSON.stringify(members));
    alert('Member created successfully!');
    loadSection('members-list');
}

window.viewLedger = function(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let ledgerHtml = `<h1>Ledger & Statement - ${member.name}</h1>
        <p class="subtitle">Current eWallet Balance: KSh ${member.balance.toLocaleString()}</p>
        <table class="members-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount (KSh)</th><th>Description</th><th>Balance After</th></tr></thead>
            <tbody>`;

    if (member.ledger.length === 0) {
        ledgerHtml += '<tr><td colspan="5">No transactions yet.</td></tr>';
    } else {
        member.ledger.forEach(tx => {
            ledgerHtml += `<tr><td>${tx.date}</td><td>${tx.type}</td><td>${tx.amount.toLocaleString()}</td><td>${tx.description}</td><td>${tx.balanceAfter.toLocaleString()}</td></tr>`;
        });
    }

    ledgerHtml += `</tbody></table>
        <button class="submit-btn" style="width:auto;padding:12px 20px;margin-top:20px;" onclick="showAddTransactionForm(${memberId})">Add Transaction</button>
        <button class="submit-btn" style="width:auto;padding:12px 20px;margin-top:20px;margin-left:10px;background:#6c757d;" onclick="loadSection('members-list')">Back</button>`;

    mainContent.innerHTML = ledgerHtml;
};

window.showAddTransactionForm = function(memberId) {
    const member = members.find(m => m.id === memberId);
    mainContent.innerHTML = `
        <h1>Add Transaction - ${member.name}</h1>
        <form id="transaction-form" class="form-card">
            <div class="form-group"><label>Type</label>
                <select id="tx-type">
                    <option>Deposit</option><option>Withdrawal</option><option>Loan Disbursement</option><option>Loan Repayment</option><option>Share Contribution</option>
                </select>
            </div>
            <div class="form-group"><label>Amount (KSh)</label><input type="number" id="tx-amount" min="1" required></div>
            <div class="form-group"><label>Description</label><input type="text" id="tx-desc" placeholder="e.g., Monthly savings via M-Pesa"></div>
            <button type="submit" class="submit-btn">Record Transaction</button>
            <button type="button" class="submit-btn" style="background:#6c757d;margin-left:10px;" onclick="viewLedger(${memberId})">Cancel</button>
        </form>
    `;

    document.getElementById('transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('tx-type').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const desc = document.getElementById('tx-desc').value.trim() || type;

        let amountChange = (type === 'Withdrawal' || type === 'Loan Disbursement') ? -amount : amount;
        const newBalance = member.balance + amountChange;

        const transaction = {
            date: new Date().toLocaleDateString('en-GB'),
            type,
            amount,
            description: desc,
            balanceAfter: newBalance
        };

        member.ledger.push(transaction);
        member.balance = newBalance;
        localStorage.setItem('soyoMembers', JSON.stringify(members));
        alert('Transaction recorded!');
        viewLedger(memberId);
    });
};

window.editRole = function(memberId) {
    const member = members.find(m => m.id === memberId);
    const newRole = prompt(`Current role: ${member.role}\nEnter new role:`, member.role);
    if (newRole !== null && newRole.trim() !== '') {
        member.role = newRole.trim();
        localStorage.setItem('soyoMembers', JSON.stringify(members));
        alert('Role updated!');
        loadSection('members-list');
    }
};

// Menu toggles & clicks (unchanged)
document.querySelectorAll('.menu-item.has-submenu > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.stopPropagation();
        link.parentElement.classList.toggle('active');
    });
});

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
    if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// loadSection function
function loadSection(section) {
    let title = section.replace(/-/g, " ").toUpperCase();

    if (section === "create-member") {
        mainContent.innerHTML = `
            <h1>Create New Member</h1>
            <p class="subtitle">Register a new member with role, next of kin, and eWallet setup.</p>
            <form class="form-card" id="create-member-form">
                <div class="form-group"><label>Full Name *</label><input type="text" id="full-name" required></div>
                <div class="form-group"><label>ID / Passport</label><input type="text" id="id-number"></div>
                <div class="form-group"><label>Phone Number *</label><input type="tel" id="phone" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="email"></div>
                <div class="form-group"><label>Gender</label><select id="gender"><option>Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <div class="form-group"><label>Date of Birth</label><input type="date" id="dob"></div>
                <div class="form-group"><label>Role</label><select id="role"><option>Member</option><option>Admin</option><option>Treasurer</option><option>Guest</option></select></div>
                <div class="form-group"><label>Next of Kin Name</label><input type="text" id="nok-name"></div>
                <div class="form-group"><label>Next of Kin Phone</label><input type="tel" id="nok-phone"></div>
                <button type="submit" class="submit-btn">Create Member</button>
            </form>
        `;

        // Attach AFTER HTML is injected
        document.getElementById('create-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveMember();
        });
        return;
    }

    if (section === "members-list") {
        // ... (same members-list HTML as before)
        mainContent.innerHTML = `
            <h1>View Members</h1>
            <p class="subtitle">Total: ${members.length}</p>
            ${members.length === 0 ? '<p>No members yet.</p>' : `
            <table class="members-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Next of Kin</th><th>Balance</th><th>Actions</th></tr></thead>
                <tbody>
                    ${members.map(m => `
                        <tr>
                            <td>${m.name}</td><td>${m.phone}</td><td>${m.role}</td>
                            <td>${m.nokName || '-'}<br><small>${m.nokPhone || ''}</small></td>
                            <td>KSh ${m.balance.toLocaleString()}</td>
                            <td>
                                <button onclick="viewLedger(${m.id})">Ledger</button>
                                <button onclick="editRole(${m.id})">Edit Role</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`}
        `;
        return;
    }

    mainContent.innerHTML = `<h1>${title}</h1><p>Under development.</p>`;
}

// Start
loadSection('dashboard');
