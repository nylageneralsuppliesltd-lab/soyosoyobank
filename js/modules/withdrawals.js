// js/modules/withdrawals.js - FULLY FUNCTIONAL Withdrawals Module

import { getItem, setItem } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';
import { saccoConfig } from '../config.js';

let members = getItem('members') || [];
let withdrawals = getItem('withdrawals') || [];

// Save withdrawals
function saveWithdrawals() {
    setItem('withdrawals', withdrawals);
}

// Refresh data
function refreshData() {
    members = getItem('members') || [];
    withdrawals = getItem('withdrawals') || [];
}

// Get all SACCO accounts (for "Paid From")
function getAllAccounts() {
    const settings = loadSettings();
    const accounts = [];

    accounts.push({ type: 'cash', name: 'Cash (Physical)', id: 'cash' });

    (settings.accounts?.pettyCash || []).forEach(acc => {
        accounts.push({ type: 'petty', name: `Petty Cash - ${acc.name}`, id: `petty_${acc.name}` });
    });

    (settings.accounts?.mobileMoney || []).forEach(acc => {
        accounts.push({ type: 'mobile', name: `${acc.provider} - ${acc.name || acc.number}`, id: `mobile_${acc.number}` });
    });

    (settings.accounts?.bank || []).forEach(acc => {
        accounts.push({ type: 'bank', name: `${acc.bankName} - ${acc.accountName || acc.accountNumber}`, id: `bank_${acc.accountNumber}` });
    });

    return accounts;
}

// ============== RECORD EXPENSE ==============
export function renderExpenseForm() {
    const settings = loadSettings();
    const expenseCategories = settings.expenseCategories || [];
    const accounts = getAllAccounts();

    document.getElementById('main-content').innerHTML = `
        <div class="deposits-page">
            <h1>Record Expense</h1>
            <p class="subtitle">Record SACCO operational or administrative expenses</p>

            <form class="form-card" id="withdrawal-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="withdrawal-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Expense Category</label>
                    ${expenseCategories.length > 0 ? `
                        <select id="expense-category" required>
                            ${expenseCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
                        </select>
                    ` : `
                        <div class="warning-box">
                            <strong>No expense categories defined.</strong><br>
                            <a href="javascript:void(0)" onclick="loadSection('settings-expenses')" class="link">
                                → Go to Settings → Expense Categories
                            </a>
                        </div>
                    `}
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="expense-desc" placeholder="e.g. Office rent, staff salary">
                </div>

                <div class="form-group">
                    <label class="required-label">Amount (KES)</label>
                    <input type="number" id="withdrawal-amount" min="1" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Paid From Account</label>
                    <select id="withdrawal-account" required>
                        <option value="">Select Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn" ${expenseCategories.length === 0 ? 'disabled' : ''}>
                    Record Expense
                </button>
            </form>
        </div>
    `;

    setupWithdrawalSubmission('expense');
}

// ============== RECORD DIVIDEND PAYOUT ==============
export function renderDividendPayoutForm() {
    document.getElementById('main-content').innerHTML = `
        <div class="deposits-page">
            <h1>Record Dividend Payout</h1>
            <p class="subtitle">Pay dividends to members based on shares</p>

            <form class="form-card" id="withdrawal-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="withdrawal-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Member</label>
                    <select id="withdrawal-member" required>
                        <option value="">Select Member</option>
                        ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone}) - Balance: ${formatCurrency(m.balance)}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Dividend Amount</label>
                    <input type="number" id="withdrawal-amount" min="1" required placeholder="Amount to pay as dividend">
                </div>

                <div class="form-group">
                    <label class="required-label">Paid From Account</label>
                    <select id="withdrawal-account" required>
                        <option value="">Select Account</option>
                        ${getAllAccounts().map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn">Record Dividend Payout</button>
            </form>
        </div>
    `;

    setupWithdrawalSubmission('dividend');
}

// ============== CONTRIBUTION REFUND ==============
export function renderContributionRefundForm() {
    document.getElementById('main-content').innerHTML = `
        <div class="deposits-page">
            <h1>Contribution Refund</h1>
            <p class="subtitle">Refund contributions to exiting or eligible members</p>

            <form class="form-card" id="withdrawal-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="withdrawal-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Member</label>
                    <select id="withdrawal-member" required>
                        <option value="">Select Member</option>
                        ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone}) - Balance: ${formatCurrency(m.balance)}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Refund Amount</label>
                    <input type="number" id="withdrawal-amount" min="1" required max="member.balance">
                </div>

                <div class="form-group">
                    <label>Reason for Refund</label>
                    <input type="text" id="refund-reason" placeholder="e.g. Member withdrawal">
                </div>

                <div class="form-group">
                    <label class="required-label">Paid From Account</label>
                    <select id="withdrawal-account" required>
                        <option value="">Select Account</option>
                        ${getAllAccounts().map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <button type="submit" class="submit-btn">Record Refund</button>
            </form>
        </div>
    `;

    setupWithdrawalSubmission('refund');
}

// ============== ACCOUNT TO ACCOUNT TRANSFER ==============
export function renderAccountTransferForm() {
    const accounts = getAllAccounts();

    document.getElementById('main-content').innerHTML = `
        <div class="deposits-page">
            <h1>Account to Account Transfer</h1>
            <p class="subtitle">Move funds between SACCO accounts</p>

            <form class="form-card" id="withdrawal-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="withdrawal-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">From Account</label>
                    <select id="from-account" required>
                        <option value="">Select Source Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">To Account</label>
                    <select id="to-account" required>
                        <option value="">Select Destination Account</option>
                        ${accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Amount</label>
                    <input type="number" id="withdrawal-amount" min="1" required>
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="transfer-desc" placeholder="e.g. Transfer to bank">
                </div>

                <button type="submit" class="submit-btn">Record Transfer</button>
            </form>
        </div>
    `;

    setupWithdrawalSubmission('transfer');
}

// ============== LIST OF WITHDRAWALS ==============
export function renderWithdrawalsList() {
    refreshData();

    document.getElementById('main-content').innerHTML = `
        <div class="deposits-page">
            <h1>List of Withdrawals</h1>
            <p class="subtitle">All expenses, dividends, refunds, and transfers</p>

            ${withdrawals.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No withdrawals recorded yet.</p>' :
                `
                <div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Details</th>
                                <th>Account</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)).map(w => `
                                <tr>
                                    <td>${new Date(w.date).toLocaleDateString('en-GB')}</td>
                                    <td><strong>${w.type.charAt(0).toUpperCase() + w.type.slice(1)}</strong></td>
                                    <td>${w.description}</td>
                                    <td>${w.account}</td>
                                    <td><strong>${formatCurrency(w.amount)}</strong></td>
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

// ============== SHARED SUBMISSION LOGIC ==============
function setupWithdrawalSubmission(type) {
    const form = document.getElementById('withdrawal-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        refreshData();

        const date = document.getElementById('withdrawal-date').value;
        const amount = parseFloat(document.getElementById('withdrawal-amount').value);
        const accountId = document.getElementById('withdrawal-account')?.value || document.getElementById('from-account')?.value;
        const accounts = getAllAccounts();
        const selectedAccount = accounts.find(acc => acc.id === accountId) || { name: 'Unknown' };

        if (!date || isNaN(amount) || amount <= 0) {
            showAlert('Valid date and amount required.', 'error');
            return;
        }

        let description = '';
        let member = null;

        if (type === 'expense') {
            const category = document.getElementById('expense-category')?.value;
            const desc = document.getElementById('expense-desc')?.value.trim();
            description = `Expense: ${category}${desc ? ' - ' + desc : ''}`;
        } else if (type === 'dividend') {
            const memberId = parseInt(document.getElementById('withdrawal-member')?.value);
            member = members.find(m => m.id === memberId);
            description = `Dividend payout to ${member?.name || 'Member'}`;
            if (member) member.balance -= amount;
        } else if (type === 'refund') {
            const memberId = parseInt(document.getElementById('withdrawal-member')?.value);
            member = members.find(m => m.id === memberId);
            const reason = document.getElementById('refund-reason')?.value.trim();
            description = `Refund to ${member?.name || 'Member'}${reason ? ' - ' + reason : ''}`;
            if (member) member.balance -= amount;
        } else if (type === 'transfer') {
            const fromAcc = document.getElementById('from-account')?.selectedOptions[0]?.text || 'Unknown';
            const toAcc = document.getElementById('to-account')?.selectedOptions[0]?.text || 'Unknown';
            const desc = document.getElementById('transfer-desc')?.value.trim();
            description = `Transfer from ${fromAcc} to ${toAcc}${desc ? ' - ' + desc : ''}`;
        }

        // Save withdrawal
        withdrawals.push({
            id: Date.now(),
            date,
            type,
            description,
            amount,
            account: selectedAccount.name,
            memberId: member?.id || null,
            memberName: member?.name || null,
            recordedAt: new Date().toLocaleString('en-GB')
        });

        saveWithdrawals();
        if (member) setItem('members', members);

        showAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} of ${formatCurrency(amount)} recorded from ${selectedAccount.name}`, 'success');
        form.reset();
        document.getElementById('withdrawal-date').value = new Date().toISOString().split('T')[0];
    });
}

// ============== MODULE INITIALIZATION ==============
export function initWithdrawalsModule() {
    console.log('Withdrawals module initialized');
}
