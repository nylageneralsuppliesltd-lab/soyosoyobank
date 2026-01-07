// js/modules/expenses.js - Full Expenses Module (Dynamic + Real Data)

import { loadExpenses, saveExpenses, loadMembers } from '../storage.js';
import { loadSettings } from './settings.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

let expenses = loadExpenses();
let members = loadMembers(); // For future: assign expense to staff/member

function save() {
    saveExpenses(expenses);
}

// Render the main Expenses page: Record + History
export function renderExpenses() {
    const settings = loadSettings();
    const categories = settings.expenseCategories || [];
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="expenses-page">
            <h1>Record Expense</h1>
            <p class="subtitle">Track all SACCO outflows and operational costs</p>

            <form class="form-card" id="expense-form">
                <div class="form-group">
                    <label class="required-label">Date</label>
                    <input type="date" id="expense-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label class="required-label">Category</label>
                    ${categories.length > 0 ? `
                        <select id="expense-category" required>
                            ${categories.map(cat => `
                                <option value="${cat.name}">${cat.name}</option>
                            `).join('')}
                        </select>
                    ` : `
                        <p style="color:#d39e00; margin:10px 0;">
                            No expense categories defined yet. 
                            <a href="#" onclick="loadSection('settings')">Go to Settings → Expense Categories</a> to add some.
                        </p>
                    `}
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="expense-desc" placeholder="e.g. Monthly office rent, Staff salary for December">
                </div>

                <div class="form-group">
                    <label class="required-label">Amount (${saccoConfig.currency})</label>
                    <input type="number" id="expense-amount" min="1" step="1" required placeholder="e.g. 15000">
                </div>

                <div class="form-group">
                    <label>Paid Via</label>
                    <select id="expense-method">
                        ${settings.bankAccounts?.length > 0 ? 
                            settings.bankAccounts.map(acc => `<option>${acc.name}</option>`).join('') :
                            `<option>Cash</option><option>Bank Transfer</option><option>M-Pesa</option>`
                        }
                    </select>
                </div>

                <button type="submit" class="submit-btn" ${categories.length === 0 ? 'disabled' : ''}>
                    Record Expense
                </button>
            </form>

            <!-- Expenses History -->
            <div style="margin-top: 50px;">
                <h2>Expense History</h2>
                <p class="subtitle">
                    Total Expenses Recorded: ${expenses.length} | 
                    Total Amount: <strong>${formatCurrency(totalExpenses)}</strong>
                </p>

                ${expenses.length === 0 ? 
                    `<p style="text-align:center; color:#666; margin:40px;">
                        No expenses recorded yet. Start by adding one above.
                    </p>` :
                    `
                    <div class="table-container">
                        <table class="members-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Paid Via</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expenses
                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                    .map(e => `
                                        <tr>
                                            <td>${new Date(e.date).toLocaleDateString('en-GB')}</td>
                                            <td>${e.category}</td>
                                            <td>${e.description || '-'}</td>
                                            <td>${e.method || 'Cash'}</td>
                                            <td><strong>${formatCurrency(e.amount)}</strong></td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                    `
                }
            </div>
        </div>
    `;

    // Form submission
    document.getElementById('expense-form')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('expense-date').value;
        const category = document.getElementById('expense-category')?.value;
        const desc = document.getElementById('expense-desc').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const method = document.getElementById('expense-method')?.value || 'Cash';

        if (!date || !category || isNaN(amount) || amount <= 0) {
            showAlert('Please fill all required fields correctly.', 'error');
            return;
        }

        expenses.push({
            id: Date.now(),
            date,
            category,
            description: desc || null,
            amount,
            method,
            recordedAt: new Date().toLocaleString('en-GB')
        });

        save();
        showAlert(`Expense of ${formatCurrency(amount)} recorded successfully!`, 'success');

        // Reset form
        e.target.reset();
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

        // Refresh history
        renderExpenses();
    });
}

// Initialize module
export function initExpensesModule() {
    // No window functions needed since we use direct call in main.js
}
