// js/modules/deposits.js - Deposit Module Logic

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

let members = loadMembers();

// Add deposit to member's ledger
function addDeposit(memberId, type, amount, description) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (amount <= 0) {
        showAlert('Amount must be positive.');
        return;
    }

    member.balance += amount;
    member.ledger.push({
        date: new Date().toLocaleDateString('en-GB'),
        type: type,
        amount,
        description,
        balanceAfter: member.balance
    });

    saveMembers(members);
    showAlert('Deposit recorded successfully!');
}

// Render deposit form for a type
function renderDepositForm(type) {
    return `
        <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Deposit</h1>
        <p class="subtitle">Record a ${type} deposit for a member.</p>
        <form class="form-card" id="deposit-form">
            <div class="form-group">
                <label>Member *</label>
                <select id="deposit-member" required>
                    <option value="">Select Member</option>
                    ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Amount (${saccoConfig.currency}) *</label>
                <input type="number" id="deposit-amount" min="1" required>
            </div>
            <div class="form-group">
                <label>Description (Optional)</label>
                <input type="text" id="deposit-desc" placeholder="e.g. Monthly Contribution via M-Pesa">
            </div>
            <button type="submit" class="submit-btn">Record Deposit</button>
        </form>
    `;
}

// Deposit section loader
function depositSection(type) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = renderDepositForm(type);

    document.getElementById('deposit-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const memberId = parseInt(document.getElementById('deposit-member').value);
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const description = document.getElementById('deposit-desc').value.trim() || type;

        if (!memberId || isNaN(amount) || amount <= 0) {
            showAlert('Please select a member and enter a valid amount.');
            return;
        }

        addDeposit(memberId, type, amount, description);
        // Redirect back to deposits list or dashboard
    });
}

// Initializer for deposit module
export function initDepositsModule() {
    window.depositContributions = () => depositSection('Contribution');
    window.depositFines = () => depositSection('Fine');
    window.depositIncome = () => depositSection('Income');
    window.depositLoanRepayments = () => depositSection('Loan Repayment');
}
