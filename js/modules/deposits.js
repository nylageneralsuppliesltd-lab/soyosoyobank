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

// Payment methods
const paymentMethods = [
    'M-Pesa',
    'Bank Transfer',
    'Cash',
    'Check-off',
    'Bank Deposit'
];

// ============== CONTRIBUTION FORM ==============
export function renderContributionForm() {
    const settings = loadSettings();
    const contribTypes = settings.contributionTypes || [];

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
                                <option value="${t.name}" data-amount="${t.defaultAmount || ''}">
                                    ${t.name} ${t.defaultAmount ? `(Default: ${formatCurrency(t.defaultAmount)})` : ''}
                                </option>
                            `).join('')}
                        </select>
                    ` : `
                        <div style="background:#fff3cd; border-left:4px solid #ffc107; padding:15px; border-radius:8px; margin:10px 0;">
                            <strong style="color:#856404;">No contribution types defined yet.</strong><br>
                            <a href="javascript:void(0)" onclick="loadSection('settings-contributions')" 
                               style="color:#007bff; text-decoration:underline; font-weight:600;">
                                → Click here to go to Settings → Contribution Types and add some
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group">
                    <label class="required-label">Amount (${saccoConfig.currency})</label>
                    <input type="number" id="deposit-amount" min="1" step="1" required placeholder="Enter amount">
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <select id="deposit-method">
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="send-notification" checked> 
                        Send Notification to Member (SMS/Email)
                    </label>
                </div>

                <button type="submit" class="submit-btn" ${contribTypes.length === 0 ? 'disabled' : ''}>
                    Record Contribution
                </button>
            </form>
        </div>
    `;

    // Auto-fill amount when type selected
    if (contribTypes.length > 0) {
        const select = document.getElementById('contrib-type');
        if (select) {
            select.addEventListener('change', (e) => {
                const defaultAmt = e.target.selectedOptions[0].dataset.amount;
                if (defaultAmt) {
                    document.getElementById('deposit-amount').value = defaultAmt;
                }
            });
        }
    }

    setupFormSubmission('contribution');
}

// ============== OTHER INCOME FORM ==============
export function renderIncomeForm() {
    const settings = loadSettings();
    const incomeTypes = settings.incomeTypes || [];

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Other Income</h1>
            <p class="subtitle">Record fines, interest received, donations, etc.</p>

            <form class="form-card" id="deposit-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="deposit-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Income Type</label>
                    ${incomeTypes.length > 0 ? `
                        <select id="income-type" required>
                            ${incomeTypes.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                        </select>
                    ` : `
                        <div style="background:#fff3cd; border-left:4px solid #ffc107; padding:15px; border-radius:8px; margin:10px 0;">
                            <strong style="color:#856404;">No income types defined yet.</strong><br>
                            <a href="javascript:void(0)" onclick="loadSection('settings-income')" 
                               style="color:#007bff; text-decoration:underline; font-weight:600;">
                                → Click here to go to Settings → Income Categories and add some
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group">
                    <label>Description (optional)</label>
                    <input type="text" id="income-desc" placeholder="e.g. Fine for late payment">
                </div>

                <div class="form-group">
                    <label class="required-label">Amount (${saccoConfig.currency})</label>
                    <input type="number" id="deposit-amount" min="1" step="1" required>
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <select id="deposit-method">
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
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

// ============== FINE FORM (Reuses Income Form) ==============
export function renderFineForm() {
    renderIncomeForm();
    document.querySelector('h1').textContent = 'Record Fine / Penalty';
    document.querySelector('.subtitle').textContent = 'Record member fines or penalties';
}

// ============== LOAN REPAYMENT FORM ==============
export function renderLoanRepaymentForm() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Loan Repayment</h1>
            <p class="subtitle">Record repayment towards a member's loan</p>

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
                    <label class="required-label">Amount (${saccoConfig.currency})</label>
                    <input type="number" id="deposit-amount" min="1" step="1" required>
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <select id="deposit-method">
                        ${paymentMethods.map(m => `<option>${m}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn">Record Loan Repayment</button>
            </form>
        </div>
    `;

    setupFormSubmission('loan-repayment');
}

// ============== SHARED FORM SUBMISSION ==============
function setupFormSubmission(depositType) {
    const form = document.getElementById('deposit-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        refreshData();

        const date = document.getElementById('deposit-date').value;
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const method = document.getElementById('deposit-method')?.value || 'Cash';

        if (!date || isNaN(amount) || amount <= 0) {
            showAlert('Please enter a valid date and amount.', 'error');
            return;
        }

        let member = null;
        let description = '';

        if (depositType === 'contribution' || depositType === 'loan-repayment') {
            const memberId = parseInt(document.getElementById('deposit-member')?.value);
            if (!memberId) {
                showAlert('Please select a member.', 'error');
                return;
            }
            member = members.find(m => m.id === memberId);
            if (!member) {
                showAlert('Member not found.', 'error');
                return;
            }

            if (depositType === 'contribution') {
                description = document.getElementById('contrib-type')?.value || 'Contribution';
            } else {
                description = 'Loan Repayment';
            }

            // Update member balance and ledger
            member.balance += amount;
            member.ledger = member.ledger || [];
            member.ledger.push({
                date,
                type: depositType === 'contribution' ? 'Contribution' : 'Loan Repayment',
                amount,
                description: `${description} via ${method}`,
                balanceAfter: member.balance,
                recordedAt: new Date().toLocaleString('en-GB')
            });
            saveMembers(members);
        } else if (depositType === 'income') {
            description = document.getElementById('income-type')?.value || 'Other Income';
            const extra = document.getElementById('income-desc')?.value.trim();
            if (extra) description += `: ${extra}`;
        }

        // Record the deposit
        deposits.push({
            id: Date.now(),
            date,
            recordedAt: new Date().toLocaleString('en-GB'),
            type: depositType,
            memberId: member?.id || null,
            memberName: member?.name || 'SACCO (Non-Member)',
            description,
            amount,
            method,
            notificationSent: document.getElementById('send-notification')?.checked ?? false
        });

        saveDeposits();
        showAlert(`${description} of ${formatCurrency(amount)} recorded successfully!`, 'success');

        // Reset form
        form.reset();
        document.getElementById('deposit-date').value = new Date().toISOString().split('T')[0];
    });
}

// ============== DEPOSITS HISTORY ==============
export function renderDepositsHistory() {
    refreshData();
    const total = deposits.reduce((sum, d) => sum + d.amount, 0);

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>All Deposits & Transactions</h1>
            <p class="subtitle">
                Total Records: ${deposits.length} | 
                Total Amount: <strong>${formatCurrency(total)}</strong>
            </p>

            ${deposits.length === 0 ? 
                '<p style="text-align:center; color:#666; margin:40px;">No transactions recorded yet. Start by recording a contribution.</p>' :
                `
                <div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Member</th>
                                <th>Description</th>
                                <th>Method</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deposits.sort((a, b) => new Date(b.date) - new Date(a.date)).map(d => `
                                <tr>
                                    <td>${new Date(d.date).toLocaleDateString('en-GB')}</td>
                                    <td><strong>${(d.type || 'Unknown').charAt(0).toUpperCase() + (d.type || 'unknown').slice(1).replace('-', ' ')}</strong></td>
                                    <td>${d.memberName || 'SACCO'}</td>
                                    <td>${d.description || '-'}</td>
                                    <td>${d.method || '-'}</td>
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
