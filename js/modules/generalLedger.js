// js/modules/generalLedger.js - Fixed T24-Style General Ledger (Safe Fallbacks + Category Handling)

import { getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderGeneralLedger() {
    const deposits = getItem('deposits') || [];
    const withdrawals = getItem('withdrawals') || [];  // ← CHANGED FROM expenses

    let transactions = [];

    // === Income Transactions (Credits) ===
    deposits.forEach(d => {
        const typeStr = d.type || 'unknown';
        const capitalizedType = typeStr.charAt(0).toUpperCase() + typeStr.slice(1).replace('-', ' ');

        let description = '';
        if (d.memberName) {
            description = `${capitalizedType} - ${d.memberName}`;
        } else {
            description = d.description || capitalizedType || 'Income Transaction';
        }

        let category = 'Uncategorized Income';
        if (d.type === 'contribution') category = 'Member Contribution';
        else if (d.type === 'income') category = d.description || 'Other Income';
        else if (d.type === 'fine') category = 'Fines & Penalties';
        else if (d.type === 'loan-repayment') category = 'Loan Repayment';

        transactions.push({
            date: d.date || 'Unknown Date',
            description: description,
            reference: d.id ? `DEP${d.id}` : 'N/A',
            debit: 0,
            credit: d.amount || 0,
            category: category
        });
    });

    // === Withdrawal Transactions (Debits) ===
    withdrawals.forEach(w => {
        let description = w.description || '';
        if (w.memberName) {
            description = `${w.type.charAt(0).toUpperCase() + w.type.slice(1)} - ${w.memberName}: ${description}`;
        } else {
            description = description || `${w.type.charAt(0).toUpperCase() + w.type.slice(1)}`;
        }

        let category = 'Other Outflow';
        if (w.type === 'expense') category = 'Operating Expense';
        else if (w.type === 'dividend') category = 'Dividend Payout';
        else if (w.type === 'refund') category = 'Contribution Refund';
        else if (w.type === 'transfer') category = 'Account Transfer';

        transactions.push({
            date: w.date || 'Unknown Date',
            description: description.trim() || 'Withdrawal',
            reference: w.id ? `WD${w.id}` : 'N/A',
            debit: w.amount || 0,
            credit: 0,
            category: category
        });
    });

    // Sort oldest first
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Running balance
    let runningBalance = 0;
    transactions = transactions.map(tx => {
        runningBalance += (tx.credit - tx.debit);
        return { ...tx, runningBalance };
    });

    // Totals
    const totalDebit = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalCredit = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const netBalance = totalCredit - totalDebit;

    // Render HTML (same as before, just updated variables)
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="general-ledger">
            <h1>General Ledger / Transaction Statement</h1>
            <p class="subtitle">SACCO-Wide Financial Journal – As of ${new Date().toLocaleDateString('en-GB')}</p>

            <div class="metrics-grid" style="margin-bottom:30px;">
                <div class="metric-card">
                    <h3>Total Debits (Outflows)</h3>
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
                    No transactions recorded yet.
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
