// js/modules/generalLedger.js - FULLY FIXED & COMPLETE General Ledger Module

import { getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderGeneralLedger() {
    const deposits = getItem('deposits') || [];
    const withdrawals = getItem('withdrawals') || [];

    let transactions = [];

    // === Credits (Income from Deposits) ===
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
            date: d.date || new Date().toISOString().split('T')[0],
            description: description,
            reference: d.id ? `DEP${d.id.toString().padStart(6, '0')}` : 'N/A',
            debit: 0,
            credit: d.amount || 0,
            category: category
        });
    });

    // === Debits (Outflows from Withdrawals) ===
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
            date: w.date || new Date().toISOString().split('T')[0],
            description: description.trim() || 'Withdrawal',
            reference: w.id ? `WD${w.id.toString().padStart(6, '0')}` : 'N/A',
            debit: w.amount || 0,
            credit: 0,
            category: category
        });
    });

    // Sort by date (oldest first)
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    transactions = transactions.map(tx => {
        runningBalance += (tx.credit - tx.debit);
        return { ...tx, runningBalance };
    });

    // Totals
    const totalDebit = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalCredit = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const netBalance = totalCredit - totalDebit;

    // Render HTML
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="general-ledger">
            <h1>General Ledger / Transaction Statement</h1>
            <p class="subtitle">SACCO-Wide Financial Journal – As of ${new Date().toLocaleDateString('en-GB')}</p>

            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Debits (Outflows)</h3>
                    <h2 class="amount-debit">${formatCurrency(totalDebit)}</h2>
                </div>
                <div class="metric-card">
                    <h3>Total Credits (Income)</h3>
                    <h2 class="amount-credit">${formatCurrency(totalCredit)}</h2>
                </div>
                <div class="metric-card">
                    <h3>Net Balance</h3>
                    <h2 class="${netBalance >= 0 ? 'amount-credit' : 'amount-debit'}">${formatCurrency(netBalance)}</h2>
                </div>
            </div>

            ${transactions.length === 0 ? 
                `<p class="empty-message">
                    No transactions recorded yet. Record contributions, income, or expenses to see the ledger.
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
                                    <td><small>${tx.reference || 'N/A'}</small></td>
                                    <td>${tx.description || ''}</td>
                                    <td>${tx.category || ''}</td>
                                    <td class="amount-debit">${tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                    <td class="amount-credit">${tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                    <td class="running-balance">${formatCurrency(tx.runningBalance)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="4"><strong>TOTALS</strong></td>
                                <td class="amount-debit"><strong>${formatCurrency(totalDebit)}</strong></td>
                                <td class="amount-credit"><strong>${formatCurrency(totalCredit)}</strong></td>
                                <td class="running-balance"><strong>${formatCurrency(netBalance)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                `
            }
        </div>
    `;
}

// Optional: Initialization (if needed in main.js)
export function initGeneralLedgerModule() {
    console.log('General Ledger module initialized');
}
