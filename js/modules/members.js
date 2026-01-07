// js/modules/members.js
import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { renderMembersTable, renderCreateMemberForm } from './ui.js';

let members = loadMembers();

// Core functions (private to module)
function createMemberSection() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = renderCreateMemberForm();

    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    
    roleSelect.addEventListener('change', () => {
        customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
    });

    document.getElementById('create-member-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const roleValue = roleSelect.value;
        const customRole = document.getElementById('custom-role').value.trim();
        const finalRole = roleValue === 'Other' ? customRole : roleValue;

        if (roleValue === 'Other' && !customRole) {
            showAlert('Please enter a custom role name');
            return;
        }

        const newMember = {
            id: Date.now(),
            name: document.getElementById('full-name').value.trim(),
            idNumber: document.getElementById('id-number').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value,
            role: finalRole || 'Member',
            nokName: document.getElementById('nok-name').value.trim(),
            nokPhone: document.getElementById('nok-phone').value.trim(),
            balance: 0,
            ledger: [],
            active: true
        };

        if (!newMember.name || !newMember.phone) {
            showAlert('Name and Phone are required!');
            return;
        }

        members.push(newMember);
        saveMembers(members);
        showAlert('Member created successfully!');
        membersListSection(); // Refresh list
    });
}

function membersListSection() {
    members = loadMembers(); // Always fresh
    document.getElementById('main-content').innerHTML = renderMembersTable(members);
}

function viewLedger(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let contributions = 0;
    let loansOut = 0;
    member.ledger.forEach(tx => {
        if (['Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) contributions += tx.amount;
        if (tx.type === 'Loan Disbursement') loansOut += tx.amount;
    });

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h1>Ledger - ${member.name}</h1>
        <p class="subtitle">
            Status: ${member.active ? 'Active' : 'Suspended'} | 
            Contributions: ${formatCurrency(contributions)} | 
            Loans Outstanding: ${formatCurrency(loansOut)} | 
            Balance: ${formatCurrency(member.balance)}
        </p>
        <table class="members-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr></thead>
            <tbody>
                ${member.ledger.length === 0 
                    ? '<tr><td colspan="5">No transactions yet</td></tr>' 
                    : member.ledger.map(tx => `
                        <tr>
                            <td>${tx.date}</td>
                            <td>${tx.type}</td>
                            <td>${formatCurrency(tx.amount)}</td>
                            <td>${tx.description}</td>
                            <td>${formatCurrency(tx.balanceAfter)}</td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
        <button class="submit-btn" style="margin-top:20px;" onclick="showAddTransactionForm(${memberId})">Add Transaction</button>
        <button class="submit-btn" style="margin-top:20px;margin-left:10px;background:#6c757d;" onclick="membersListSection()">Back to Members</button>
    `;
}

function suspendMember(memberId) {
    if (confirm('Suspend this member? They will lose access.')) {
        const member = members.find(m => m.id === memberId);
        member.active = false;
        saveMembers(members);
        showAlert('Member suspended');
        membersListSection();
    }
}

function reactivateMember(memberId) {
    if (confirm('Reactivate this member?')) {
        const member = members.find(m => m.id === memberId);
        member.active = true;
        saveMembers(members);
        showAlert('Member reactivated!');
        membersListSection();
    }
}

// Export the initializer — this exposes functions to window safely
export function initMembersModule() {
    // Expose to window so inline onclick works
    window.createMemberSection = createMemberSection;
    window.membersListSection = membersListSection;
    window.viewLedger = viewLedger;
    window.suspendMember = suspendMember;
    window.reactivateMember = reactivateMember;
    window.showAddTransactionForm = showAddTransactionForm; // define below if needed
    window.exportMembersToCSV = exportMembersToCSV;
    window.importMembers = importMembers;
}

// Keep export/import functions here (same as before)
function exportMembersToCSV() {
    // ... (same code as before)
}

function importMembers(event) {
    // ... (same code as before)
}

function showAddTransactionForm(memberId) {
    // We'll build this fully next
    alert('Add Transaction form coming soon!');
}
