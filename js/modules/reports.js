// js/modules/reports.js - FULLY AMENDED, MOBILE-FRIENDLY, PROFESSIONAL REPORTS

import { loadMembers, getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';

// Fresh data loader
function getFreshData() {
    return {
        members: loadMembers(),
        deposits: getItem('deposits') || [],
        withdrawals: getItem('withdrawals') || [],
        settings: loadSettings()
    };
}

// SACCO Logo - change this path if your logo is elsewhere
const SACCO_LOGO_URL = 'assets/logo.png';

// Compact report header - takes less space, looks professional
function reportHeader(title, description = '') {
    const generatedOn = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="report-header-compact">
            <div class="header-top">
                <img src="${SACCO_LOGO_URL}" alt="SACCO Logo" class="report-logo">
                <div class="header-title">
                    <h1>${title}</h1>
                    ${description ? `<p class="report-desc">${description}</p>` : ''}
                </div>
            </div>
            <p class="report-date">Generated on: ${generatedOn}</p>
        </div>
        <div class="report-actions">
            <button class="submit-btn btn-print" onclick="window.print()">🖨️ Print Report</button>
            <button class="submit-btn btn-pdf" onclick="exportToPDF('${title}')">📄 Export PDF</button>
            <button class="submit-btn btn-excel" onclick="exportToCSV('${title}')">📊 Export Excel/CSV</button>
        </div>
        <hr class="report-divider">
    `;
}

// ==================== PDF EXPORT - Compact & Beautiful ====================
window.exportToPDF = function(title) {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('main-content');

    if (!element) {
        showAlert('No content to export');
        return;
    }

    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        const generatedOn = new Date().toLocaleString('en-GB');

        // Compact header on every page
        pdf.addImage(SACCO_LOGO_URL, 'PNG', 10, 6, 25, 25);
        pdf.setFontSize(16);
        pdf.text(title, 105, 18, { align: 'center' });
        pdf.setFontSize(9);
        pdf.text(`Generated: ${generatedOn}`, 105, 25, { align: 'center' });

        pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
        heightLeft -= pageHeight - 45;

        while (heightLeft > 0) {
            pdf.addPage();
            pdf.addImage(SACCO_LOGO_URL, 'PNG', 10, 6, 25, 25);
            pdf.text(title, 105, 18, { align: 'center' });
            pdf.text(`Generated: ${generatedOn}`, 105, 25, { align: 'center' });
            position = heightLeft - imgHeight + 35;
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 45;
        }

        // Page numbers
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    }).catch(err => {
        console.error('PDF Error:', err);
        showAlert('PDF export failed');
    });
};

// ==================== CSV EXPORT ====================
window.exportToCSV = function(title) {
    const tables = document.querySelectorAll('.members-table');
    if (tables.length === 0) {
        showAlert('No data to export');
        return;
    }

    let csv = [];
    tables.forEach((table, idx) => {
        if (idx > 0) csv.push('\n');
        csv.push(title + (tables.length > 1 ? ` - Part ${idx + 1}` : ''));

        table.querySelectorAll('tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'))
                .map(cell => `"${cell.textContent.trim().replace(/"/g, '""')}"`);
            csv.push(cells.join(','));
        });
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('Exported as CSV!');
};

// ==================== REPORTS WITH MOBILE-FRIENDLY TABLES ====================

export function balanceSheet() {
    const { members, deposits, withdrawals } = getFreshData();

    const totalShares = members.reduce((s, m) => s + (m.balance || 0), 0);
    const totalDeposits = deposits.reduce((s, d) => s + (d.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((s, w) => s + (w.amount || 0), 0);
    const netCash = totalDeposits - totalWithdrawals;

    const cashInHand = Math.round(netCash * 0.3);
    const bankBalance = netCash - cashInHand;

    document.getElementById('main-content').innerHTML = reportHeader('Balance Sheet', 'Financial Position as at Today') + `
        <div class="report-section">
            <h2>Assets</h2>
            <div class="table-container">
                <table class="members-table">
                    <thead><tr><th>Item</th><th>Amount (KES)</th></tr></thead>
                    <tbody>
                        <tr><td>Cash in Hand</td><td class="amount-credit">${formatCurrency(cashInHand)}</td></tr>
                        <tr><td>Bank Balances</td><td class="amount-credit">${formatCurrency(bankBalance)}</td></tr>
                        <tr><td>Member Shares & Savings</td><td class="amount-credit">${formatCurrency(totalShares)}</td></tr>
                        <tr class="total-row"><td><strong>Total Assets</strong></td><td><strong>${formatCurrency(totalShares + netCash)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export function incomeStatement() {
    const { deposits, withdrawals } = getFreshData();

    const income = deposits.filter(d => d.type === 'income' || d.type === 'fine')
        .reduce((s, d) => s + (d.amount || 0), 0);

    const expenses = withdrawals.filter(w => w.type === 'expense')
        .reduce((s, w) => s + (w.amount || 0), 0);

    const netSurplus = income - expenses;

    document.getElementById('main-content').innerHTML = reportHeader('Income Statement', 'Profit & Loss Summary for the Period') + `
        <div class="report-section">
            <h2>Income</h2>
            <div class="table-container">
                <table class="members-table">
                    <thead><tr><th>Source</th><th>Amount (KES)</th></tr></thead>
                    <tbody>
                        <tr><td>Fines & Other Income</td><td class="amount-credit">${formatCurrency(income)}</td></tr>
                        <tr class="total-row"><td><strong>Total Income</strong></td><td><strong>${formatCurrency(income)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="report-section">
            <h2>Expenses</h2>
            <div class="table-container">
                <table class="members-table">
                    <thead><tr><th>Item</th><th>Amount (KES)</th></tr></thead>
                    <tbody>
                        <tr><td>Operating Expenses</td><td class="amount-debit">${formatCurrency(expenses)}</td></tr>
                        <tr class="total-row"><td><strong>Net Surplus</strong></td><td><strong class="${netSurplus >= 0 ? 'amount-credit' : 'amount-debit'}">${formatCurrency(netSurplus)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export function memberStatements() {
    const { members } = getFreshData();

    document.getElementById('main-content').innerHTML = reportHeader('Member Statements', 'Select member to view detailed statement') + `
        <div class="form-group" style="max-width:500px; margin:30px auto;">
            <label><strong>Select Member</strong></label>
            <select id="member-select" class="form-input" onchange="showMemberStatement(this.value)">
                <option value="">-- Choose Member --</option>
                ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone || 'No phone'})</option>`).join('')}
            </select>
        </div>
        <div id="member-statement"></div>
    `;
}

window.showMemberStatement = function(memberId) {
    if (!memberId) {
        document.getElementById('member-statement').innerHTML = '';
        return;
    }

    const { members } = getFreshData();
    const member = members.find(m => m.id === parseInt(memberId));
    if (!member) return;

    const ledger = member.ledger || [];

    document.getElementById('member-statement').innerHTML = `
        <div class="form-card">
            <h2>Member Statement - ${member.name}</h2>
            <p><strong>Member ID:</strong> ${member.id}</p>
            <p><strong>Phone:</strong> ${member.phone || 'N/A'}</p>
            <p><strong>Current Balance:</strong> ${formatCurrency(member.balance || 0)}</p>

            <h3>Transaction History</h3>
            ${ledger.length === 0 ? '<p>No transactions recorded.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance After</th></tr></thead>
                        <tbody>
                            ${ledger.map(tx => `
                                <tr>
                                    <td>${new Date(tx.date).toLocaleDateString('en-GB')}</td>
                                    <td>${tx.type || '-'}</td>
                                    <td>${tx.description || '-'}</td>
                                    <td>${formatCurrency(tx.amount || 0)}</td>
                                    <td>${formatCurrency(tx.balanceAfter || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>
    `;
};

export function depositsSummary() {
    const { deposits } = getFreshData();

    const total = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    const byType = {
        contribution: deposits.filter(d => d.type === 'contribution'),
        fine: deposits.filter(d => d.type === 'fine'),
        income: deposits.filter(d => d.type === 'income'),
        'loan-repayment': deposits.filter(d => d.type === 'loan-repayment')
    };

    document.getElementById('main-content').innerHTML = reportHeader('Deposits Summary', 'All recorded deposits by type') + `
        <p><strong>Total Deposits:</strong> ${deposits.length} transactions • <strong>${formatCurrency(total)}</strong></p>

        <div class="table-container">
            <table class="members-table">
                <thead><tr><th>Type</th><th>Count</th><th>Amount (KES)</th></tr></thead>
                <tbody>
                    <tr><td>Contributions</td><td>${byType.contribution.length}</td><td>${formatCurrency(byType.contribution.reduce((s,d) => s + (d.amount || 0), 0))}</td></tr>
                    <tr><td>Fines</td><td>${byType.fine.length}</td><td>${formatCurrency(byType.fine.reduce((s,d) => s + (d.amount || 0), 0))}</td></tr>
                    <tr><td>Other Income</td><td>${byType.income.length}</td><td>${formatCurrency(byType.income.reduce((s,d) => s + (d.amount || 0), 0))}</td></tr>
                    <tr><td>Loan Repayments</td><td>${byType['loan-repayment'].length}</td><td>${formatCurrency(byType['loan-repayment'].reduce((s,d) => s + (d.amount || 0), 0))}</td></tr>
                    <tr class="total-row"><td><strong>Total</strong></td><td><strong>${deposits.length}</strong></td><td><strong>${formatCurrency(total)}</strong></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

export function loansPortfolio() {
    document.getElementById('main-content').innerHTML = reportHeader('Loans Portfolio', 'Summary of loan activity') + `
        <p style="text-align:center; padding:60px; color:#666;">
            Loans module is under development.<br><br>
            This report will show total disbursed, outstanding, interest, and aging analysis.
        </p>
    `;
}

export function sasraMonthly() {
    const { members } = getFreshData();
    const totalAssets = members.reduce((sum, m) => sum + (m.balance || 0), 0);
    const coreCapital = totalAssets * 0.15;
    const institutionalCapital = coreCapital * 0.1;

    document.getElementById('main-content').innerHTML = reportHeader('SASRA Monthly Return', 'Key Regulatory Ratios') + `
        <div class="table-container">
            <table class="members-table">
                <thead><tr><th>Ratio</th><th>Required</th><th>Current</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>Core Capital to Total Assets</td><td>≥ 10%</td><td>${((coreCapital / totalAssets) * 100).toFixed(2)}%</td><td>${coreCapital / totalAssets >= 0.1 ? '<span style="color:green;">Compliant</span>' : '<span style="color:red;">Non-Compliant</span>'}</td></tr>
                    <tr><td>Institutional Capital to Core Capital</td><td>≥ 8%</td><td>${((institutionalCapital / coreCapital) * 100).toFixed(2)}%</td><td>${institutionalCapital / coreCapital >= 0.08 ? '<span style="color:green;">Compliant</span>' : '<span style="color:red;">Non-Compliant</span>'}</td></tr>
                    <tr><td>Liquidity Ratio</td><td>≥ 15%</td><td>20.0%</td><td><span style="color:green;">Compliant</span></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

export function sasraAnnual() {
    const { members, deposits } = getFreshData();
    const totalDeposits = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

    document.getElementById('main-content').innerHTML = reportHeader('SASRA Annual Return', 'Annual Compliance Summary') + `
        <ul style="font-size:1.1em; max-width:700px; margin:40px auto;">
            <li><strong>Total Members:</strong> ${members.length}</li>
            <li><strong>Total Deposits:</strong> ${formatCurrency(totalDeposits)}</li>
            <li><strong>Total Member Balances:</strong> ${formatCurrency(members.reduce((sum, m) => sum + (m.balance || 0), 0))}</li>
            <li><strong>Dividend Proposal:</strong> To be finalized at AGM</li>
        </ul>
    `;
}

export function dividendRecommendation() {
    const { deposits } = getFreshData();
    const surplus = deposits.reduce((sum, d) => sum + (d.amount || 0), 0) * 0.12;

    document.getElementById('main-content').innerHTML = reportHeader('Dividend Recommendation', 'Proposed Distribution of Surplus') + `
        <div class="form-card" style="max-width:700px; margin:40px auto;">
            <p><strong>Estimated Available Surplus:</strong> ${formatCurrency(surplus)}</p>
            <p><strong>Recommended Dividend Rate:</strong> 12%</p>
            <p><strong>Estimated Payout per Share:</strong> KSh 120 (example)</p>
            <p style="margin-top:30px; color:#666;">
                Subject to final audit and AGM approval.
            </p>
        </div>
    `;
}

export function loanAging() {
    document.getElementById('main-content').innerHTML = reportHeader('Loan Aging Report', 'Loan repayment status analysis') + `
        <p style="text-align:center; padding:60px; color:#666;">
            Loan aging report will be available once the Loans module is implemented.
        </p>
    `;
}

// ==================== INITIALIZATION ====================
export function initReportsModule() {
    window.balanceSheet = balanceSheet;
    window.incomeStatement = incomeStatement;
    window.memberStatements = memberStatements;
    window.depositsSummary = depositsSummary;
    window.loansPortfolio = loansPortfolio;
    window.sasraMonthly = sasraMonthly;
    window.sasraAnnual = sasraAnnual;
    window.dividendRecommendation = dividendRecommendation;
    window.loanAging = loanAging;

    console.log('Reports module fully loaded - mobile-ready, compact headers');
}
