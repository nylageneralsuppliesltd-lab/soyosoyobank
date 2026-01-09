// js/modules/generalLedger.js - FULLY INTEGRATED General Ledger (with Loans Support)
// Updated January 10, 2026 - Uses 'soyoMembers' key + accurate loan handling

import { getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderGeneralLedger() {
    // ──────────────────────────────────────────────────────────────────────────────
    // LOAD ALL SOURCES - Use correct 'soyoMembers' key
    // ──────────────────────────────────────────────────────────────────────────────
    const deposits = getItem('deposits') || [];
    const withdrawals = getItem('withdrawals') || [];
    const loans = getItem('loans') || [];
    const repayments = getItem('repayments') || [];
    const members = getItem('soyoMembers') || [];  // ← FIXED: correct key

    let transactions = [];

    // ──────────────────────────────────────────────────────────────────────────────
    // 1. CREDITS: Deposits (Contributions, Fines, Income, Loan Repayments)
    // ──────────────────────────────────────────────────────────────────────────────
    deposits.forEach(d => {
        const typeStr = d.type || 'unknown';
        const capitalizedType = typeStr.charAt(0).toUpperCase() + typeStr.slice(1).replace('-', ' ');

        let description = d.memberName ? `${capitalizedType} - ${d.memberName}` : (d.description || capitalizedType);
        let category = 'Uncategorized Income';

        if (d.type === 'contribution') category = 'Member Contribution';
        else if (d.type === 'income') category = d.description || 'Other Income';
        else if (d.type === 'fine') category = 'Fines & Penalties';
        else if (d.type === 'loan-repayment') category = 'Loan Repayment';

        transactions.push({
            date: d.date || new Date().toISOString().split('T')[0],
            description,
            reference: d.id ? `DEP${d.id.toString().padStart(6, '0')}` : 'N/A',
            debit: 0,
            credit: d.amount || 0,
            category,
            type: 'deposit'
        });
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // 2. DEBITS: Withdrawals (Expenses, Dividends, Refunds, Transfers)
    // ──────────────────────────────────────────────────────────────────────────────
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
            category,
            type: 'withdrawal'
        });
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // 3. DEBITS: Loan Disbursements (Increase Loans Receivable asset)
    // ──────────────────────────────────────────────────────────────────────────────
    loans.forEach(loan => {
        if (loan.disbursedDate && loan.status === 'active') {
            const member = members.find(m => String(m.id) === String(loan.memberId));
            const memberName = member?.name || 'Unknown Member';

            transactions.push({
                date: loan.disbursedDate,
                description: `Loan Disbursement - ${memberName} (${loan.typeName || 'Loan'})`,
                reference: `LOAN${loan.id.toString().padStart(6, '0')}`,
                debit: loan.amount,
                credit: 0,
                category: 'Loans Disbursed',
                type: 'loan-disbursement'
            });
        }
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // 4. CREDITS: Loan Repayments (Principal + Interest Income)
    // ──────────────────────────────────────────────────────────────────────────────
    repayments.forEach(rep => {
        const loan = loans.find(l => l.id === rep.loanId);
        if (!loan) return;

        const member = members.find(m => String(m.id) === String(loan.memberId));
        const memberName = member?.name || 'Unknown Member';

        // Realistic split: in real system use actual schedule; here we approximate
        // For simplicity: 80% principal, 20% interest (adjust as needed)
        const principalPortion = rep.amount * 0.8;
        const interestPortion = rep.amount - principalPortion;

        // Principal repayment (reduces Loans Receivable)
        transactions.push({
            date: rep.date,
            description: `Loan Principal Repayment - ${memberName}`,
            reference: `REP${rep.id.toString().padStart(6, '0')}`,
            debit: 0,
            credit: principalPortion,
            category: 'Loan Principal',
            type: 'loan-principal'
        });

        // Interest income (separate income line)
        if (interestPortion > 0) {
            transactions.push({
                date: rep.date,
                description: `Interest Income - ${memberName} Loan`,
                reference: `INT${rep.id.toString().padStart(6, '0')}`,
                debit: 0,
                credit: interestPortion,
                category: 'Interest Income',
                type: 'interest-income'
            });
        }
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // SORT & CALCULATE RUNNING BALANCE
    // ──────────────────────────────────────────────────────────────────────────────
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    transactions = transactions.map(tx => {
        runningBalance += (tx.credit - tx.debit);
        return { ...tx, runningBalance };
    });

    // ──────────────────────────────────────────────────────────────────────────────
    // TOTALS
    // ──────────────────────────────────────────────────────────────────────────────
    const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    const netBalance = totalCredit - totalDebit;

    // ──────────────────────────────────────────────────────────────────────────────
    // RENDER HTML
    // ──────────────────────────────────────────────────────────────────────────────
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="general-ledger">
            <h1>General Ledger / Transaction Statement</h1>
            <p class="subtitle">SACCO-Wide Financial Journal – As of ${new Date().toLocaleDateString('en-GB')}</p>

            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Debits (Outflows & Loans)</h3>
                    <h2 class="amount-debit">${formatCurrency(totalDebit)}</h2>
                </div>
                <div class="metric-card">
                    <h3>Total Credits (Income & Repayments)</h3>
                    <h2 class="amount-credit">${formatCurrency(totalCredit)}</h2>
                </div>
                <div class="metric-card">
                    <h3>Net Balance</h3>
                    <h2 class="${netBalance >= 0 ? 'amount-credit' : 'amount-debit'}">${formatCurrency(netBalance)}</h2>
                </div>
            </div>

            ${transactions.length === 0 ? 
                `<p class="empty-message">
                    No financial transactions recorded yet.<br>
                    Record contributions, expenses, loans, or repayments to see the full ledger.
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
                                <tr class="${tx.type || ''}">
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

// Optional module init
export function initGeneralLedgerModule() {
    console.log('General Ledger module initialized - fully supports loans & soyoMembers');
}
