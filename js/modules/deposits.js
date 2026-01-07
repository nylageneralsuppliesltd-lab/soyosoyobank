// js/modules/deposits.js - Full Deposits Module

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

let members = loadMembers();
let deposits = JSON.parse(localStorage.getItem('deposits')) || [];

// Save deposits
function saveDeposits() {
    localStorage.setItem('deposits', JSON.stringify(deposits));
}

// Render deposit form
function renderDepositForm(type) {
    const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    return `
        <h1>Record ${typeName} Deposit</h1>
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
                    ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone}) - ID: ${m.idNumber || 'N/A'}</option>`).join('')}
                </select>
            </div>

            <div class="form-group">
                <label class="required-label">Payment For</label>
                <select id="payment-for" required>
                    <option value="${type}">${typeName}</option>
                </select>
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
                <label class="required-label">Amount (KES)</label>
                <input type="number" id="deposit-amount" min="1" step="1" required placeholder="e.g. 5000">
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="send-notification" checked> 
                    Send Notification (SMS/Email) to member
                </label>
            </div>

            <button type="submit" class="submit-btn">Record Deposit</button>
        </form>
    `;
}

// Render deposits list
function renderDepositsList() {
    return `
        <h1>All Deposits</h1>
        <p class="subtitle">Total Deposits: ${deposits.length} | Total Amount: ${formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0))}</p>

        ${deposits.length === 0 ? '<p>No deposits recorded yet.</p>' : `
        <table class="members-table">
            <thead>
                <tr>
                    <th>Date</th>
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
                            <td>${member ? member.name : 'Unknown'}</td>
                            <td>${d.paymentFor}</td>
                            <td>${d.account}</td>
                            <td>${d.method}</td>
                            <td><strong>${formatCurrency(d.amount)}</strong></td>
                            <td>${d.notificationSent ? 'Yes' : 'No'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>`}
    `;
}

// Record deposit
function recordDeposit(type) {
    document.getElementById('main-content').innerHTML = renderDepositForm(type);

    document.getElementById('deposit-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const memberId = parseInt(document.getElementById('deposit-member').value);
        const amount = parseFloat(document.getElementById('deposit-amount').value);

        if (!memberId || isNaN(amount) || amount <= 0) {
            showAlert('Please select a member and enter a valid amount.');
            return;
        }

        const member = members.find(m => m.id === memberId);
        if (!member) {
            showAlert('Member not found.');
            return;
        }

        // Update member balance and ledger
        member.balance += amount;
        member.ledger.push({
            date: document.getElementById('deposit-date').value,
            type: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
            amount,
            description: `${type} via ${document.getElementById('deposit-method').value}`,
            balanceAfter: member.balance
        });

        // Record deposit
        deposits.push({
            id: Date.now(),
            depositDate: document.getElementById('deposit-date').value,
            recordedAt: new Date().toLocaleString('en-GB'),
            memberId,
            paymentFor: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
            account: document.getElementById('deposit-account').value,
            method: document.getElementById('deposit-method').value,
            amount,
            notificationSent: document.getElementById('send-notification').checked
        });

        saveMembers(members);
        saveDeposits();
        showAlert('Deposit recorded successfully!');
        // Stay on form or go to list?
    });
}

// View all deposits
function depositsListSection() {
    document.getElementById('main-content').innerHTML = renderDepositsList();
}

// Expose functions
export function initDepositsModule() {
    window.recordContribution = () => recordDeposit('contributions');
    window.recordFine = () => recordDeposit('fines');
    window.recordIncome = () => recordDeposit('income');
    window.recordLoanRepayment = () => recordDeposit('loan-repayments');
    window.depositsListSection = depositsListSection;
}
