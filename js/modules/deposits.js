// js/modules/deposits.js - Full & Working Deposits Module

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

let members = loadMembers();
let deposits = JSON.parse(localStorage.getItem('deposits')) || [];

// Save deposits to localStorage
function saveDeposits() {
    localStorage.setItem('deposits', JSON.stringify(deposits));
}

// Render the deposit form for any type
function renderDepositForm(type) {
    const typeName = {
        'contributions': 'Contribution',
        'fines': 'Fine',
        'income': 'Other Income',
        'loan-repayments': 'Loan Repayment'
    }[type] || 'Deposit';

    return `
        <h1>Record ${typeName}</h1>
        <p class="subtitle">All fields marked with * are required.</p>

        <form class="form-card" id="deposit-form">
            <div class="form-group">
                <label class="required-label">Deposit Date</label>
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
                <label class="required-label">Payment For</label>
                <input type="text" value="${typeName}" readonly style="background:#f8f9fa;">
            </div>

            <div class="form-group">
                <label class="required-label">Account</label>
                <select id="deposit-account" required>
                    <option value="Shares">Shares</option>
                    <option value="Savings">Savings</option>
                    <option value="Loan Account">Loan Account</option>
                    <option value="Fines">Fines</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="form-group">
                <label class="required-label">Deposit Method</label>
                <select id="deposit-method" required>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check-off">Check-off</option>
                </select>
            </div>

            <div class="form-group">
                <label class="required-label">Amount (${saccoConfig.currency})</label>
                <input type="number" id="deposit-amount" min="1" step="1" required placeholder="e.g. 5000">
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="send-notification" checked> 
                    Send Notification (SMS/Email) to member
                </label>
            </div>

            <button type="submit" class="submit-btn">Record ${typeName}</button>
        </form>
    `;
}

// Render full deposits history
function renderDepositsList() {
    const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

    return `
        <h1>All Deposits History</h1>
        <p class="subtitle">
            Total Deposits: ${deposits.length} | 
            Total Amount: <strong>${formatCurrency(totalAmount)}</strong>
        </p>

        ${deposits.length === 0 ? 
            '<p>No deposits have been recorded yet.</p>' : 
            `
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Deposit Date</th>
                        <th>Recorded On</th>
                        <th>Member</th>
                        <th>Payment For</th>
                        <th>Account</th>
                        <th>Method</th>
                        <th>Amount</th>
                        <th>Notification</th>
                    </tr>
                </thead>
                <tbody>
                    ${deposits.map(d => {
                        const member = members.find(m => m.id === d.memberId);
                        return `
                            <tr>
                                <td>${d.depositDate}</td>
                                <td><small>${d.recordedAt}</small></td>
                                <td>${member ? member.name : 'Unknown Member'}</td>
                                <td>${d.paymentFor}</td>
                                <td>${d.account}</td>
                                <td>${d.method}</td>
                                <td><strong>${formatCurrency(d.amount)}</strong></td>
                                <td>${d.notificationSent ? 'Sent' : 'No'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            `
        }
    `;
}

// Main function to load deposit form
function recordDeposit(type) {
    document.getElementById('main-content').innerHTML = renderDepositForm(type);

    document.getElementById('deposit-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const memberId = parseInt(document.getElementById('deposit-member').value);
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const depositDate = document.getElementById('deposit-date').value;

        if (!memberId || isNaN(amount) || amount <= 0 || !depositDate) {
            showAlert('Please fill all required fields with valid data.');
            return;
        }

        const member = members.find(m => m.id === memberId);
        if (!member) {
            showAlert('Selected member not found.');
            return;
        }

        const typeName = {
            'contributions': 'Contribution',
            'fines': 'Fine',
            'income': 'Other Income',
            'loan-repayments': 'Loan Repayment'
        }[type];

        // Update member balance and ledger
        member.balance += amount;
        member.ledger.push({
            date: depositDate,
            type: typeName,
            amount,
            description: `${typeName} via ${document.getElementById('deposit-method').value}`,
            balanceAfter: member.balance
        });

        // Record full deposit entry
        deposits.push({
            id: Date.now(),
            depositDate,
            recordedAt: new Date().toLocaleString('en-GB'),
            memberId,
            paymentFor: typeName,
            account: document.getElementById('deposit-account').value,
            method: document.getElementById('deposit-method').value,
            amount,
            notificationSent: document.getElementById('send-notification').checked
        });

        saveMembers(members);
        saveDeposits();

        showAlert(`${typeName} of ${formatCurrency(amount)} recorded successfully!`);
        
        // Reset form or stay
        document.getElementById('deposit-form').reset();
        document.getElementById('deposit-date').value = new Date().toISOString().split('T')[0];
    });
}

// View all deposits
function depositsListSection() {
    document.getElementById('main-content').innerHTML = renderDepositsList();
}

// Expose functions to window for main.js
export function initDepositsModule() {
    window.recordContribution = () => recordDeposit('contributions');
    window.recordFine = () => recordDeposit('fines');
    window.recordIncome = () => recordDeposit('income');
    window.recordLoanRepayment = () => recordDeposit('loan-repayments');
    window.depositsListSection = depositsListSection;
}
