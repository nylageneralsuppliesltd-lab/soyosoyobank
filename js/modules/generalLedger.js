// js/modules/generalLedger.js - T24-Style General Ledger / Group Transaction Statement

import { getItem } from '../storage.js';
import { loadSettings } from './settings.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderGeneralLedger() {
    const deposits = getItem('deposits') || [];
    const expenses = getItem('expenses') || [];

    // Combine all transactions into one array
    let transactions = [];

    // Income transactions (Credit)
    deposits.forEach(d => {
        let description = '';
        if (d.memberName) {
            description = `${d.type.charAt(0).toUpperCase() + d.type.slice(1).replace('-', ' ')} - ${d.memberName}`;
        } else {
            description = d.description || d.type.charAt(0).toUpperCase() + d.type.slice(1).replace('-', ' ');
        }

        transactions.push({
            date: d.date,
            description: description,
            reference: d.id ? `DEP${d.id}` : 'N/A',
            debit: 0,
            credit: d.amount,
            memberName: d.memberName || 'Non-Member',
            category: d.description || d.type
        });
    });

    // Expense transactions (Debit)
    expenses.forEach(e => {
        transactions.push({
            date: e.date,
            description: e.description || e.category,
            reference: e.id ? `EXP${e.id}` : 'N/A',
            debit: e.amount,
            credit: 0,
            memberName: 'SACCO',
            category: e.category
        });
    });

    // Sort chronologically (oldest first for proper running balance)
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    transactions = transactions.map(tx => {
        runningBalance += (tx.credit - tx.debit);
        return { ...tx, runningBalance };
    });

    // Totals
    const totalDebit = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = deposits.reduce((sum, d) => sum + d.amount, 0);
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
                                    <td style="color:#dc3545; text-align:right;">${tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                    <td style="color:#28a745; text-align:right;">${tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                    <td style="font-weight:600; text-align:right;">${formatCurrency(tx.runningBalance)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background:#f8f9fa; font-weight:600;">
                                <td colspan="3">TOTALS</td>
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
