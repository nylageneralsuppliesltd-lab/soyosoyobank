// js/modules/deposits.js - Fully Amended & Fixed Deposits Module

import { loadMembers, saveMembers, getItem, setItem } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';
import { saccoConfig } from '../config.js';

let members = loadMembers();
let deposits = getItem('deposits') || [];

// Save deposits
function saveDeposits() {
    setItem('deposits', deposits);
}

// Load fresh data
function refreshData() {
    members = loadMembers();
    deposits = getItem('deposits') || [];
}
// Get all available accounts from settings
function getAllAccounts() {
    const settings = loadSettings();
    const accounts = [];

    // Cash is always available
    accounts.push({ type: 'cash', name: 'Cash', id: 'cash' });

    // Petty Cash
    (settings.accounts?.pettyCash || []).forEach(acc => {
        accounts.push({ type: 'pettyCash', name: acc.name, id: `petty_${acc.name}` });
    });

    // Mobile Money
    (settings.accounts?.mobileMoney || []).forEach(acc => {
        accounts.push({ type: 'mobileMoney', name: `${acc.provider} - ${acc.name || acc.number}`, id: `mobile_${acc.number}` });
    });

    // Bank Accounts
    (settings.accounts?.bank || []).forEach(acc => {
        accounts.push({ type: 'bank', name: `${acc.bankName} - ${acc.accountName || acc.accountNumber}`, id: `bank_${acc.accountNumber}` });
    });

    return accounts;
}

// Payment methods
const paymentMethods = [
    'M-Pesa',
    'Bank Transfer',
    'Cash',
    'Check-off',
    'Bank Deposit'
];

// ============== CONTRIBUTION FORM (Payment Method + Account) ==============
export function renderContributionForm() {
    const settings = loadSettings();
    const contribTypes = settings.contributionTypes || [];
    const accounts = getAllAccounts();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Contribution</h1>
            <p class="subtitle">Record member share contributions</p>

            <form class="form-card" id="deposit-form">
                <div class="form-group">
                    <label class="required-label">Transaction Date</label>
                    <input type="date" id="deposit-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Member</label>
                    <select id="deposit-member" required>
                        <option value="">Select Member</option>
                        ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Contribution Type</label>
                    ${contribTypes.length > 0 ? `
                        <select id="contrib-type" required>
                            ${contribTypes.map(t => `
                                <option value="${t.name}" data-amount="${t.amount || ''}">
                                    ${t.name} ${t.amount ? `(KSh ${formatCurrency(t.amount)})` : ''}
                                </option>
                            `).join('')}
                        </select>
                    ` : `
                        <div class="warning-box">
                            <strong>No contribution types defined.</strong><br>
                            <a href="javascript:void(0)" onclick="loadSection('settings-contributions')" class="link">
                                → Go to Settings → Contribution Types
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group">
                    <label class="required-label">Amount (KES)</label>
                    <input type="number" id="deposit-amount" min="1" step="1" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Payment Method (How member paid)</label>
                    <select id="payment-method" required>
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Received Into (SACCO Account)</label>
                    <select id="deposit-account" required>
                        <option value="">Select Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                    ${accounts.length === 1 ? `
                        <p class="help-text" style="margin-top:8px;">
                            Only Cash available. <a href="javascript:void(0)" onclick="loadSection('settings-accounts')" class="link">
                                → Add Bank/Mobile Accounts
                            </a>
                        </p>
                    ` : ''}
                </div>

                <button type="submit" class="submit-btn" ${contribTypes.length === 0 ? 'disabled' : ''}>
                    Record Contribution
                </button>
            </form>
        </div>
    `;

    if (contribTypes.length > 0) {
        document.getElementById('contrib-type').addEventListener('change', (e) => {
            const amt = e.target.selectedOptions[0].dataset.amount;
            if (amt) document.getElementById('deposit-amount').value = amt;
        });
    }

    setupFormSubmission('contribution');
}

// ============== INCOME FORM (Same dual fields) ==============
export function renderIncomeForm() {
    const settings = loadSettings();
    const incomeTypes = settings.incomeCategories || [];
    const accounts = getAllAccounts();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Other Income</h1>
            <form class="form-card" id="deposit-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="deposit-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Income Category</label>
                    ${incomeTypes.length > 0 ? `
                        <select id="income-type" required>
                            ${incomeTypes.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                        </select>
                    ` : `
                        <div class="warning-box">
                            <strong>No income categories defined.</strong><br>
                            <a href="javascript:void(0)" onclick="loadSection('settings-income')" class="link">
                                → Go to Settings → Income Categories
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="income-desc">
                </div>

                <div class="form-group">
                    <label class="required-label">Amount</label>
                    <input type="number" id="deposit-amount" min="1" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Payment Method</label>
                    <select id="payment-method" required>
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Received Into Account</label>
                    <select id="deposit-account" required>
                        <option value="">Select Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn" ${incomeTypes.length === 0 ? 'disabled' : ''}>
                    Record Income
                </button>
            </form>
        </div>
    `;

    setupFormSubmission('income');
}

// ============== FINE FORM - NOW FULLY FUNCTIONAL & SEPARATE ==============
export function renderFineForm() {
    const settings = loadSettings();
    const fineTypes = settings.fineCategories || [];
    const accounts = getAllAccounts();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Fine / Penalty</h1>
            <p class="subtitle">Record fines charged to members</p>

            <form class="form-card" id="deposit-form">
                <div class="form-group">
                    <label class="required-label">Transaction Date</label>
                    <input type="date" id="deposit-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Member</label>
                    <select id="deposit-member" required>
                        <option value="">Select Member</option>
                        ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Fine Category</label>
                    ${fineTypes.length > 0 ? `
                        <select id="fine-type" required>
                            ${fineTypes.map(t => `
                                <option value="${t.name}" data-amount="${t.defaultAmount || ''}">
                                    ${t.name} ${t.defaultAmount ? `(Default: ${formatCurrency(t.defaultAmount)})` : ''}
                                </option>
                            `).join('')}
                        </select>
                    ` : `
                        <div class="warning-box">
                            <strong>No fine categories defined.</strong><br>
                            <a href="javascript:void(0)" onclick="loadSection('settings-fines')" class="link">
                                → Go to Settings → Fine Categories
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group">
                    <label class="required-label">Amount</label>
                    <input type="number" id="deposit-amount" min="1" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Payment Method</label>
                    <select id="payment-method" required>
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Received Into Account</label>
                    <select id="deposit-account" required>
                        <option value="">Select Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn" ${fineTypes.length === 0 ? 'disabled' : ''}>
                    Record Fine
                </button>
            </form>
        </div>
    `;

    if (fineTypes.length > 0) {
        document.getElementById('fine-type').addEventListener('change', (e) => {
            const amt = e.target.selectedOptions[0].dataset.amount;
            if (amt) document.getElementById('deposit-amount').value = amt;
        });
    }

    setupFormSubmission('fine');
}

// ============== LOAN REPAYMENT FORM ==============
export function renderLoanRepaymentForm() {
    const accounts = getAllAccounts();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Loan Repayment</h1>
            <form class="form-card" id="deposit-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="deposit-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Member</label>
                    <select id="deposit-member" required>
                        <option value="">Select Member</option>
                        ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Amount</label>
                    <input type="number" id="deposit-amount" min="1" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Payment Method</label>
                    <select id="payment-method" required>
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Received Into Account</label>
                    <select id="deposit-account" required>
                        <option value="">Select Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn">Record Repayment</button>
            </form>
        </div>
    `;

    setupFormSubmission('loan-repayment');
}

// ============== SHARED SUBMISSION - FULL NARRATION ==============
function setupFormSubmission(depositType) {
    const form = document.getElementById('deposit-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        refreshData();

        const date = document.getElementById('deposit-date').value;
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const paymentMethod = document.getElementById('payment-method')?.value || 'Cash';
        const accountId = document.getElementById('deposit-account')?.value || 'cash';
        const accounts = getAllAccounts();
        const selectedAccount = accounts.find(acc => acc.id === accountId) || { name: 'Cash' };

        if (!date || isNaN(amount) || amount <= 0) {
            showAlert('Valid date and amount required.', 'error');
            return;
        }

        let member = null;
        let category = '';
        let description = '';

        if (depositType === 'contribution' || depositType === 'loan-repayment' || depositType === 'fine') {
            const memberId = parseInt(document.getElementById('deposit-member')?.value);
            if (!memberId) return showAlert('Select a member.', 'error');

            member = members.find(m => m.id === memberId);
            if (!member) return showAlert('Member not found.', 'error');

            if (depositType === 'contribution') {
                category = document.getElementById('contrib-type')?.value || 'Contribution';
            } else if (depositType === 'fine') {
                category = document.getElementById('fine-type')?.value || 'Fine';
            } else {
                category = 'Loan Repayment';
            }

            description = category;
        } else if (depositType === 'income') {
            category = document.getElementById('income-type')?.value || 'Income';
            const extra = document.getElementById('income-desc')?.value.trim();
            description = extra ? `${category}: ${extra}` : category;
        }

        // Full narration
        const narration = `${description} via ${paymentMethod} (received into ${selectedAccount.name})`;

        // Update member ledger
        if (member) {
            member.balance += amount;
            member.ledger = member.ledger || [];
            member.ledger.push({
                date,
                type: depositType.charAt(0).toUpperCase() + depositType.slice(1).replace('-', ' '),
                amount,
                description: narration,
                paymentMethod,
                account: selectedAccount.name,
                balanceAfter: member.balance,
                recordedAt: new Date().toLocaleString('en-GB')
            });
            saveMembers(members);
        }

        // Save deposit record
        deposits.push({
            id: Date.now(),
            date,
            recordedAt: new Date().toLocaleString('en-GB'),
            type: depositType,
            memberId: member?.id || null,
            memberName: member?.name || 'SACCO',
            category,
            description: narration,
            amount,
            paymentMethod,
            account: selectedAccount.name,
            accountId
        });

        saveDeposits();
        showAlert(`${description} of ${formatCurrency(amount)} recorded successfully!`, 'success');
        form.reset();
        document.getElementById('deposit-date').value = new Date().toISOString().split('T')[0];
    });
}

// ============== DEPOSITS HISTORY ==============
export function renderDepositsHistory() {
    refreshData();
    const total = deposits.filter(d => !d.voided).reduce((sum, d) => sum + d.amount, 0);

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>All Deposits & Transactions</h1>
            <p class="subtitle">Total: <strong>${formatCurrency(total)}</strong></p>

            ${deposits.length === 0 ? 
                '<p style="text-align:center;padding:60px;color:#666;">No transactions recorded yet.</p>' :
                `
                <div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Member</th>
                                <th>Narration</th>
                                <th>Payment Method</th>
                                <th>Account</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deposits.sort((a, b) => new Date(b.date) - new Date(a.date)).map(d => `
                                <tr>
                                    <td>${new Date(d.date).toLocaleDateString('en-GB')}</td>
                                    <td><strong>${d.type.charAt(0).toUpperCase() + d.type.slice(1)}</strong></td>
                                    <td>${d.memberName}</td>
                                    <td>${d.description}</td>
                                    <td>${d.paymentMethod || '-'}</td>
                                    <td>${d.account || 'Cash'}</td>
                                    <td><strong>${formatCurrency(d.amount)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                `
            }
        </div>
    `;
}

// ============== EDIT DEPOSIT ==============

window.editDeposit = function(depositId) {
    const deposit = deposits.find(d => d.id === depositId);
    if (!deposit || deposit.voided) return showAlert('Cannot edit voided transaction.');

    const member = deposit.memberId ? members.find(m => m.id === deposit.memberId) : null;

    const newAmount = prompt(`Edit amount for "${deposit.description}" (Current: ${formatCurrency(deposit.amount)}):`, deposit.amount);
    if (newAmount === null) return;
    const parsed = parseFloat(newAmount);
    if (isNaN(parsed) || parsed <= 0) return showAlert('Invalid amount.');

    const newDate = prompt(`Edit transaction date (Current: ${deposit.date}):`, deposit.date);
    if (newDate === null) return;

    const newDesc = prompt(`Edit description (Current: ${deposit.description}):`, deposit.description);
    if (newDesc === null) return;

    // Reverse old effect on member balance
    if (member) {
        member.balance -= deposit.amount;
        const ledgerIndex = member.ledger.findIndex(tx => tx.description.includes(deposit.description) && tx.amount === deposit.amount && tx.date === deposit.date);
        if (ledgerIndex !== -1) member.ledger.splice(ledgerIndex, 1);
    }

    // Apply new values
    deposit.amount = parsed;
    deposit.date = newDate;
    deposit.description = newDesc.trim() || deposit.description;

    // Re-apply to member
    if (member) {
        member.balance += parsed;
        member.ledger.push({
            date: newDate,
            type: deposit.type === 'contribution' ? 'Contribution' : deposit.type === 'loan-repayment' ? 'Loan Repayment' : 'Income',
            amount: parsed,
            description: `${newDesc || deposit.description} via ${deposit.method} (edited)`,
            balanceAfter: member.balance,
            recordedAt: new Date().toISOString()
        });
        saveMembers(members);
    }

    saveDeposits();
    showAlert('Deposit updated successfully.');
    renderDepositsHistory();
};

// ============== VOID DEPOSIT ==============

window.voidDeposit = function(depositId) {
    const deposit = deposits.find(d => d.id === depositId);
    if (!deposit) return;

    const reason = prompt('Reason for voiding this transaction:');
    if (!reason) return showAlert('Reason required to void.');

    if (!confirm(`Void ${formatCurrency(deposit.amount)} transaction from ${deposit.memberName || 'SACCO'}?`)) return;

    deposit.voided = true;
    deposit.voidReason = reason.trim();
    deposit.voidedAt = new Date().toLocaleString('en-GB');

    // Reverse from member balance
    if (deposit.memberId) {
        const member = members.find(m => m.id === deposit.memberId);
        if (member) {
            member.balance -= deposit.amount;
            // Optional: add void note to ledger
            member.ledger.push({
                date: deposit.date,
                type: 'Voided Transaction',
                amount: -deposit.amount,
                description: `Voided: ${deposit.description} (${reason})`,
                balanceAfter: member.balance
            });
            saveMembers(members);
        }
    }

    saveDeposits();
    showAlert('Transaction voided.');
    renderDepositsHistory();
};

// ============== INIT ==============

export function initDepositsModule() {
    // No window exposure needed if main.js uses direct imports
    console.log('Deposits module initialized');
}
