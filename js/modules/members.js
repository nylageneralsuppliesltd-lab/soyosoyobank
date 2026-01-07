// js/modules/members.js - Complete Members Module

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { renderMembersTable, renderCreateMemberForm } from './ui.js';

let members = loadMembers();

// ======================
// CORE SECTION RENDERERS
// ======================

function createMemberSection() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = renderCreateMemberForm();

    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');

    // Show/hide custom role input
    roleSelect.addEventListener('change', () => {
        customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
    });

    // Form submission
    document.getElementById('create-member-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const roleValue = roleSelect.value;
        const customRole = document.getElementById('custom-role').value.trim();
        const finalRole = roleValue === 'Other' ? customRole : roleValue;

        if (roleValue === 'Other' && !customRole) {
            showAlert('Please enter a custom role name.');
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
            showAlert('Full Name and Phone Number are required!');
            return;
        }

        members.push(newMember);
        saveMembers(members);
        showAlert('Member created successfully!');
        membersListSection(); // Refresh the list
    });
}

function membersListSection() {
    members = loadMembers(); // Always get fresh data
    document.getElementById('main-content').innerHTML = renderMembersTable(members);
}

// ======================
// LEDGER & TRANSACTIONS
// ======================

function viewLedger(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Member not found.');
        return;
    }

    // Calculate summaries
    let contributions = 0;
    let loansOut = 0;
    member.ledger.forEach(tx => {
        if (['Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) {
            contributions += tx.amount;
        } else if (tx.type === 'Loan Disbursement') {
            loansOut += tx.amount;
        }
    });

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h1>Ledger - ${member.name}</h1>
        <p class="subtitle">
            Status: <strong>${member.active ? 'Active' : 'Suspended'}</strong> | 
            Contributions: <strong>${formatCurrency(contributions)}</strong> | 
            Loans Outstanding: <strong>${formatCurrency(loansOut)}</strong> | 
            Net Balance: <strong>${formatCurrency(member.balance)}</strong>
        </p>

        <table class="members-table">
            <thead>
                <tr>
                    <th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th>
                </tr>
            </thead>
            <tbody>
                ${member.ledger.length === 0 
                    ? '<tr><td colspan="5" style="text-align:center;">No transactions recorded yet.</td></tr>'
                    : member.ledger.map(tx => `
                        <tr>
                            <td>${tx.date}</td>
                            <td>${tx.type}</td>
                            <td>${formatCurrency(tx.amount)}</td>
                            <td>${tx.description || '-'}</td>
                            <td>${formatCurrency(tx.balanceAfter)}</td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 30px;">
            <button class="submit-btn" onclick="showAddTransactionForm(${memberId})">
                Add Transaction
            </button>
            <button class="submit-btn" style="background:#6c757d;margin-left:10px;" onclick="membersListSection()">
                Back to Members List
            </button>
        </div>
    `;
}

function showAddTransactionForm(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <h1>Add Transaction - ${member.name}</h1>
        <p class="subtitle">Current Balance: ${formatCurrency(member.balance)}</p>

        <form class="form-card" id="add-transaction-form">
            <div class="form-group">
                <label>Transaction Type</label>
                <select id="tx-type">
                    <option value="Deposit">Deposit</option>
                    <option value="Share Contribution">Share Contribution</option>
                    <option value="Loan Disbursement">Loan Disbursement</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                    <option value="Withdrawal">Withdrawal</option>
                </select>
            </div>

            <div class="form-group">
                <label>Amount (KSh)</label>
                <input type="number" id="tx-amount" min="1" step="1" required placeholder="Enter amount">
            </div>

            <div class="form-group">
                <label>Description (Optional)</label>
                <input type="text" id="tx-desc" placeholder="e.g. Monthly savings via M-Pesa">
            </div>

            <button type="submit" class="submit-btn">Record Transaction</button>
            <button type="button" class="submit-btn" style="background:#6c757d;margin-left:10px;" onclick="viewLedger(${memberId})">
                Cancel
            </button>
        </form>
    `;

    document.getElementById('add-transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const type = document.getElementById('tx-type').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const description = document.getElementById('tx-desc').value.trim() || type;

        if (isNaN(amount) || amount <= 0) {
            showAlert('Please enter a valid amount.');
            return;
        }

        // Calculate balance change
        let balanceChange = amount;
        if (['Withdrawal', 'Loan Disbursement'].includes(type)) {
            balanceChange = -amount;
        }

        const newBalance = member.balance + balanceChange;

        const transaction = {
            date: new Date().toLocaleDateString('en-GB'),
            type,
            amount,
            description,
            balanceAfter: newBalance
        };

        member.ledger.push(transaction);
        member.balance = newBalance;

        saveMembers(members);
        showAlert('Transaction recorded successfully!');
        viewLedger(memberId); // Return to ledger view
    });
}

// ======================
// MEMBER MANAGEMENT
// ======================

function suspendMember(memberId) {
    if (!confirm('Suspend this member? They will be marked as inactive.')) return;

    const member = members.find(m => m.id === memberId);
    if (member) {
        member.active = false;
        saveMembers(members);
        showAlert('Member has been suspended.');
        membersListSection();
    }
}

function reactivateMember(memberId) {
    if (!confirm('Reactivate this member?')) return;

    const member = members.find(m => m.id === memberId);
    if (member) {
        member.active = true;
        saveMembers(members);
        showAlert('Member has been reactivated!');
        membersListSection();
    }
}

// ======================
// IMPORT / EXPORT
// ======================

function exportMembersToCSV() {
    if (members.length === 0) {
        showAlert('No members to export!');
        return;
    }

    const enriched = members.map(m => {
        let contributions = 0;
        let loansOut = 0;
        m.ledger.forEach(tx => {
            if (['Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) contributions += tx.amount;
            if (tx.type === 'Loan Disbursement') loansOut += tx.amount;
        });
        return { ...m, contributions, loansOut };
    });

    const headers = [
        'Name', 'Phone', 'Email', 'Role',
        'Next of Kin Name', 'Next of Kin Phone',
        'Contributions', 'Loans Outstanding', 'Net Balance', 'Status'
    ];

    const rows = enriched.map(m => [
        m.name,
        m.phone,
        m.email || '',
        m.role,
        m.nokName || '',
        m.nokPhone || '',
        m.contributions,
        m.loansOut,
        m.balance,
        m.active ? 'Active' : 'Suspended'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field =>
            `"${(field + '').replace(/"/g, '""')}"`
        ).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'soyosoyo_members.csv';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('Members exported successfully!');
}

function importMembers(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);

        if (lines.length < 2) {
            showAlert('CSV file is empty or has no data rows.');
            return;
        }

        // Parse headers (handle quoted)
        let headerLine = lines[0];
        const headers = [];
        let current = '';
        let inQuotes = false;
        for (let char of headerLine + ',') {  // Add comma to flush last
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                headers.push(current.trim().toLowerCase());
                current = '';
            } else {
                current += char;
            }
        }

        console.log('Parsed headers:', headers);  // Debug in console

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i] + ',';  // Flush last field
            const values = [];
            current = '';
            inQuotes = false;
            for (let char of line) {
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }

            if (values.length < headers.length) continue;  // Invalid row

            const row = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });

            // Map possible header variations
            const name = row['name'] || '';
            const phone = row['phone'] || '';
            if (!name || !phone) continue;

            // Check duplicate by phone
            if (members.some(m => m.phone === phone)) continue;

            members.push({
                id: Date.now() + imported,
                name,
                phone,
                email: row['email'] || '',
                role: row['role'] || 'Member',
                nokName: row['next of kin name'] || '',
                nokPhone: row['next of kin phone'] || '',
                balance: 0,
                ledger: [],
                active: true
            });
            imported++;
        }

        if (imported === 0) {
            showAlert('No new members imported (possible duplicates or invalid data). Check console for details.');
        } else {
            saveMembers(members);
            showAlert(`${imported} members imported successfully!`);
            membersListSection();
        }
    };

    reader.readAsText(file);
}
// ======================
// INITIALIZER - Expose to window
// ======================

export function initMembersModule() {
    window.createMemberSection = createMemberSection;
    window.membersListSection = membersListSection;
    window.viewLedger = viewLedger;
    window.showAddTransactionForm = showAddTransactionForm;
    window.suspendMember = suspendMember;
    window.reactivateMember = reactivateMember;
    window.exportMembersToCSV = exportMembersToCSV;
    window.importMembers = importMembers;
}
