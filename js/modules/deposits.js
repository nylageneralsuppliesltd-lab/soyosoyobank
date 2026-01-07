// js/modules/deposits.js - Dynamic Deposits Module (Integrated with Settings)

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

// Load fresh data when needed
function refreshData() {
    members = loadMembers();
    deposits = getItem('deposits') || [];
}

// Common deposit methods (can be extended in future)
const paymentMethods = [
    'M-Pesa',
    'Bank Transfer',
    'Cash',
    'Check-off',
    'Bank Deposit'
];

// Render form for Contribution
export function renderContributionForm() {
    const settings = loadSettings();
    const contribTypes = settings.contributionTypes || [];

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="deposits-page">
            <h1>Record Contribution</h1>
            <p class="subtitle">Record member share contributions or other defined types</p>

            <form class="form-card" id="deposit-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="deposit-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Member</label>
                    <select id="deposit-member" required>
                        <option value="">Select Member</option>
                        ${members.map(m => `
                            <option value="${m.id}">${m.name} (${m.phone}) - ID: ${m.idNumber || 'N/A'}</option>
                        `).join('')}
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
                        <p style="color:#d39e00;">
                            No contribution types defined yet. 
                            <a href="#" onclick="loadSection('settings')">Go to Settings → Contribution Types</a> to add some.
                        </p>
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
        document.getElementById('contrib-type').addEventListener('change', (e) => {
            const defaultAmt = e.target.selectedOptions[0].dataset.amount;
            if (defaultAmt) {
                document.getElementById('deposit-amount').value = defaultAmt;
            }
        });
    }

    setupFormSubmission('contribution');
}

// Render form for Other Income
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
                        <p style="color:#d39e00;">
                            No income types defined. 
                            <a href="#" onclick="loadSection('settings')">Add in Settings → Other Income Types</a>
                        </p>
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

// Render form for Fine (uses income types or free text)
export function renderFineForm() {
    renderIncomeForm(); // Fines are a type of income — reuse with context
    document.querySelector('h1').textContent = 'Record Fine / Penalty';
    document.querySelector('.subtitle').textContent = 'Record member fines or penalties';
    document.querySelector('#income-type')?.selectedIndex >= 0 && 
        (document.querySelector('#income-type').value = 'Fines & Penalties');
}

// Render form for Loan Repayment
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
                        ${members.map(m => `
                            <option value="${m.id}">${m.name} (${m.phone})</option>
                        `).join('')}
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

// Shared form submission logic
function setupFormSubmission(depositType) {
    document.getElementById('deposit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        refreshData();

        const date = document.getElementById('deposit-date').value;
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const method = document.getElementById('deposit-method')?.value || 'Cash';

        if (isNaN(amount) || amount <= 0 || !date) {
            showAlert('Please enter a valid amount and date.', 'error');
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

            // Update member balance & ledger
            member.balance += amount;
            member.ledger = member.ledger || [];
            member.ledger.push({
                date,
                type: depositType === 'contribution' ? 'Contribution' : 'Loan Repayment',
                amount,
                description: `${description} via ${method}`,
                balanceAfter: member.balance
            });
            saveMembers(members);
        } else if (depositType === 'income') {
            description = document.getElementById('income-type')?.value || 'Other Income';
            if (document.getElementById('income-desc')) {
                const extra = document.getElementById('income-desc').value.trim();
                if (extra) description += `: ${extra}`;
            }
        }

        // Record deposit transaction
        deposits.push({
            id: Date.now(),
            date,
            recordedAt: new Date().toLocaleString('en-GB'),
            type: depositType, // 'contribution', 'income', 'fine', 'loan-repayment'
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
        e.target.reset();
        document.getElementById('deposit-date').value = new Date().toISOString().split('T')[0];
    });
}

// Deposits History List
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
                                    <td><strong>${d.type.charAt(0).toUpperCase() + d.type.slice(1).replace('-', ' ')}</strong></td>
                                    <td>${d.memberName}</td>
                                    <td>${d.description}</td>
                                    <td>${d.method}</td>
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

// Initialize module — expose functions to main.js
export function initDepositsModule() {
    window.recordContribution = renderContributionForm;
    window.recordFine = renderFineForm;
    window.recordIncome = renderIncomeForm;
    window.recordLoanRepayment = renderLoanRepaymentForm;
    window.renderDepositsHistory = renderDepositsHistory; // Updated name for clarity
}
