// js/modules/expenses.js

import { getItem, setItem } from '../storage.js';
import { formatCurrency, showAlert } from '../utils/helpers.js';
import { loadSettings } from './settings.js';

export function loadExpenses() {
    return getItem('expenses') || [];
}

export function saveExpenses(expenses) {
    setItem('expenses', expenses);
}

export function recordExpense(amount, category, description = '', date = new Date().toISOString().split('T')[0]) {
    const expenses = loadExpenses();
    const settings = loadSettings();
    const categoryObj = settings.expenseCategories.find(c => c.name === category || c.id === category);

    expenses.push({
        id: Date.now(),
        amount: parseFloat(amount),
        category: categoryObj ? categoryObj.name : category,
        description,
        date
    });

    saveExpenses(expenses);
    showAlert(`Expense of ${formatCurrency(amount)} recorded`, 'success');
}

export function renderExpensesHistory() {
    const expenses = loadExpenses();
    const settings = loadSettings();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="expenses-page">
            <h1>Record Expense</h1>
            <div class="form-card">
                <div class="form-group">
                    <label>Amount (${saccoConfig.currency})</label>
                    <input type="number" id="expense-amount" placeholder="e.g. 5000">
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="expense-category">
                        ${settings.expenseCategories.map(cat => 
                            `<option value="${cat.name}">${cat.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Description (optional)</label>
                    <input type="text" id="expense-desc" placeholder="e.g. Monthly rent">
                </div>
                <button class="btn btn-primary" onclick="submitExpense()">Record Expense</button>
            </div>

            <h2 style="margin-top:40px;">Expense History</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.length === 0 ? 
                            `<tr><td colspan="4" style="text-align:center;color:#666;">No expenses recorded yet</td></tr>` :
                            expenses.map(exp => `
                                <tr>
                                    <td>${new Date(exp.date).toLocaleDateString('en-GB')}</td>
                                    <td>${exp.category}</td>
                                    <td>${exp.description || '-'}</td>
                                    <td>${formatCurrency(exp.amount)}</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.submitExpense = () => {
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const desc = document.getElementById('expense-desc').value;

    if (!amount || amount <= 0) {
        showAlert('Please enter a valid amount', 'error');
        return;
    }

    recordExpense(amount, category, desc);
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-desc').value = '';
    renderExpensesHistory(); // Refresh list
};
