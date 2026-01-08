// js/modules/generalLedger.js - Fixed T24-Style General Ledger (Safe Fallbacks + Category Handling)

import { getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderGeneralLedger() {
    const deposits = getItem('deposits') || [];
    const expenses = getItem('expenses') || [];

    let transactions = [];

    // === Income Transactions (Credits) ===
    deposits.forEach(d => {
        // Safe type handling with fallback
        const typeStr = d.type || 'unknown';
        const capitalizedType = typeStr.charAt(0).toUpperCase() + typeStr.slice(1).replace('-', ' ');

        let description = '';
        if (d.memberName) {
            description = `${capitalizedType} - ${d.memberName}`;
        } else {
            description = d.description || capitalizedType || 'Income Transaction';
        }

        // Safe category fallback
        let category = 'Uncategorized Income';
        if (d.type === 'contribution') {
            category = d.description || 'Member Contribution';
        } else if (d.type === 'income') {
            category = d.description || 'Other Income';
        } else if (d.type === 'fine') {
            category = 'Fines & Penalties';
        } else if (d.type === 'loan-repayment') {
            category = 'Loan Repayment';
        }

        transactions.push({
            date: d.date || 'Unknown Date',
            description: description,
            reference: d.id ? `DEP${d.id}` : 'N/A',
            debit: 0,
            credit: d.amount || 0,
            category: category
        });
    });

    // === Expense Transactions (Debits) ===
    expenses.forEach(e => {
        const description = e.description || e.category || 'Expense';
        const category = e.category || 'Uncategorized Expense';

        transactions.push({
            date: e.date || 'Unknown Date',
            description: description,
            reference: e.id ? `EXP${e.id}` : 'N/A',
            debit: e.amount || 0,
            credit: 0,
            category: category
        });
    });

    // Sort chronologically (oldest first for correct running balance)
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    transactions = transactions.map(tx => {
        runningBalance += (tx.credit - tx.debit);
        return { ...tx, runningBalance };
    });

    // Totals
    const totalDebit = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCredit = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const netBalance = totalCredit - totalDebit;

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="general-ledger">
            <h1>General Ledger / Transaction Statement</h1>
            <p class="subtitle">SACCO-Wide Financial Journal – As of ${new Date().toLocaleDateString('en-GB')}</p>

            <div class="metrics-grid" style="margin-bottom:30px;">
                <div class="metric-card">
                    <h3>Total Debits (Expenses)</h3>
                    <h2 style="color:#dc3545;">${formatCurrency(totalDebit)}</h2>
                </div>
                <div class="metric-card">
                    <h3>Total Credits (Income)</h3>
                    <h2 style="color:#28a745;">${formatCurrency(totalCredit)}</h2>
                </div>
                <div class="metric-card">
                    <h3>Net Balance</h3>
                    <h2 style="${netBalance >= 0 ? 'color:#28a745' : 'color:#dc3545'};">${formatCurrency(netBalance)}</h2>
                </div>
            </div>

            ${transactions.length === 0 ? 
                `<p style="text-align:center; color:#666; padding:80px; font-size:1.1em;">
                    No transactions recorded yet. Start recording contributions, income, or expenses to populate the ledger.
                </p>` :
                `
                <div class="table-container">
                    <table class="members-table ledger-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Reference</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Debit (${saccoConfig.currency})</th>
                                <th>Credit (${saccoConfig.currency})</th>
                                <th>Running Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(tx => `
                                <tr>
                                    <td>${new Date(tx.date).toLocaleDateString('en-GB')}</td>
                                    <td><small>${tx.reference}</small></td>
                                    <td>${tx.description}</td>
                                    <td>${tx.category}</td>
                                    <td style="color:#dc3545; text-align:right;">${tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                    <td style="color:#28a745; text-align:right;">${tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                    <td style="font-weight:600; text-align:right;">${formatCurrency(tx.runningBalance)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background:#f8f9fa; font-weight:600;">
                                <td colspan="4">TOTALS</td>
                                <td style="color:#dc3545; text-align:right;">${formatCurrency(totalDebit)}</td>
                                <td style="color:#28a745; text-align:right;">${formatCurrency(totalCredit)}</td>
                                <td style="text-align:right;">${formatCurrency(netBalance)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                `
            }
        </div>
    `;
}
