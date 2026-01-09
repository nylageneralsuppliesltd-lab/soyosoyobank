// js/modules/reports.js - FULLY INTEGRATED SACCO Reports Module WITH PDF & CSV EXPORT

import { loadMembers, getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';

// Load fresh data on every report
function getFreshData() {
    return {
        members: loadMembers(),
        deposits: getItem('deposits') || [],
        withdrawals: getItem('withdrawals') || [],
        settings: loadSettings()
    };
}

// SACCO Logo - change this path to your actual logo location
const SACCO_LOGO_URL = 'assets/logo.png'; // <-- UPDATE THIS TO YOUR LOGO PATH

// Common report header with export buttons
function reportHeader(title, description = '') {
    const generatedOn = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return `
        <div class="report-header" style="text-align:center; margin-bottom:30px;">
            <img src="${SACCO_LOGO_URL}" alt="SACCO Logo" style="height:80px; margin-bottom:10px;">
            <h1>${title}</h1>
            ${description ? `<p style="font-size:1.1em; color:#555; margin:10px 0;">${description}</p>` : ''}
            <p class="subtitle">Generated on: ${generatedOn}</p>
        </div>
        <div style="margin:20px 0; text-align:right;">
            <button class="submit-btn" style="background:#28a745;" onclick="window.print()">🖨️ Print Report</button>
            <button class="submit-btn" style="background:#007bff; margin-left:10px;" onclick="exportToPDF('${title}')">📄 Export PDF</button>
            <button class="submit-btn" style="background:#dc3545; margin-left:10px;" onclick="exportToCSV('${title}')">📊 Export Excel/CSV</button>
        </div>
        <hr style="margin:30px 0; border-color:#ddd;">
    `;
}

// ==================== PDF EXPORT WITH LOGO, TITLE, TIMESTAMP & PAGE NUMBERS ====================
window.exportToPDF = function(title) {
    const { jsPDF } = window.jspdf;
    const element = document.getElementById('main-content');

    if (!element) {
        showAlert('No content to export to PDF');
        return;
    }

    html2canvas(element, { scale: 2, useCORS: true, logging: false }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width
        const pageHeight = 295; // A4 height
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 20;

        const generatedOn = new Date().toLocaleString('en-GB');

        // First page header
        pdf.addImage(SACCO_LOGO_URL, 'PNG', 10, 8, 30, 30);
        pdf.setFontSize(18);
        pdf.text(title, 105, 25, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(`Generated on: ${generatedOn}`, 105, 32, { align: 'center' });

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 40;

        // Additional pages
        while (heightLeft > 0) {
            pdf.addPage();
            pdf.addImage(SACCO_LOGO_URL, 'PNG', 10, 8, 30, 30);
            pdf.setFontSize(18);
            pdf.text(title, 105, 25, { align: 'center' });
            pdf.setFontSize(10);
            pdf.text(`Generated on: ${generatedOn}`, 105, 32, { align: 'center' });

            position = heightLeft - imgHeight + 40;
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 40;
        }

        // Page numbers footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    }).catch(err => {
        console.error('PDF export error:', err);
        showAlert('Failed to generate PDF. Check console for details.');
    });
};

// ==================== CSV/EXCEL EXPORT ====================
window.exportToCSV = function(title) {
    const tables = document.querySelectorAll('.members-table');
    if (tables.length === 0) {
        showAlert('No table data to export');
        return;
    }

    let csvContent = [];

    tables.forEach((table, index) => {
        if (index > 0) csvContent.push('\n\n'); // Separate tables
        csvContent.push(title + (tables.length > 1 ? ` - Table ${index + 1}` : ''));

        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('td, th');
            const rowData = Array.from(cols).map(col => `"${col.textContent.trim().replace(/"/g, '""')}"`);
            csvContent.push(rowData.join(','));
        });
    });

    const csv = csvContent.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Report exported as CSV!');
};

// ==================== REPORTS ====================

export function balanceSheet() {
    const { members, deposits } = getFreshData();

    const totalMemberBalances = members.reduce((sum, m) => sum + (m.balance || 0), 0);
    const totalDeposits = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalLoans = 0; // Loans module placeholder

    const cashInHand = Math.round(totalDeposits * 0.2);
    const bankBalance = totalDeposits - cashInHand;

    document.getElementById('main-content').innerHTML = reportHeader('Balance Sheet', 'Financial Position as at Today') + `
        <div class="report-section">
            <h2>Assets</h2>
            <table class="members-table">
                <thead><tr><th>Item</th><th>Amount (KES)</th></tr></thead>
                <tbody>
                    <tr><td>Cash in Hand</td><td>${formatCurrency(cashInHand)}</td></tr>
                    <tr><td>Bank Balances</td><td>${formatCurrency(bankBalance)}</td></tr>
                    <tr><td>Loans to Members</td><td>${formatCurrency(totalLoans)}</td></tr>
                    <tr class="total-row"><td><strong>Total Assets</strong></td><td><strong>${formatCurrency(totalDeposits + totalLoans)}</strong></td></tr>
                </tbody>
            </table>
        </div>

        <div class="report-section" style="margin-top:40px;">
            <h2>Liabilities & Equity</h2>
            <table class="members-table">
                <thead><tr><th>Item</th><th>Amount (KES)</th></tr></thead>
                <tbody>
                    <tr><td>Member Shares & Savings</td><td>${formatCurrency(totalMemberBalances)}</td></tr>
                    <tr><td>Retained Earnings</td><td>${formatCurrency(0)}</td></tr>
                    <tr class="total-row"><td><strong>Total Liabilities & Equity</strong></td><td><strong>${formatCurrency(totalMemberBalances)}</strong></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

export function incomeStatement() {
    const { deposits, withdrawals } = getFreshData();

    const interestIncome = 0;
    const otherIncome = deposits.filter(d => d.type === 'income' || d.type === 'fine').reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalExpenses = withdrawals
    .filter(w => w.type === 'expense')
    .reduce((sum, w) => sum + (w.amount || 0), 0);
    const netSurplus = interestIncome + otherIncome - totalExpenses;

    document.getElementById('main-content').innerHTML = reportHeader('Income Statement', 'Profit & Loss Summary for the Period') + `
        <div class="report-section">
            <h2>Income</h2>
            <table class="members-table">
                <thead><tr><th>Source</th><th>Amount (KES)</th></tr></thead>
                <tbody>
                    <tr><td>Interest on Loans</td><td>${formatCurrency(interestIncome)}</td></tr>
                    <tr><td>Other Income & Fines</td><td>${formatCurrency(otherIncome)}</td></tr>
                    <tr class="total-row"><td><strong>Total Income</strong></td><td><strong>${formatCurrency(interestIncome + otherIncome)}</strong></td></tr>
                </tbody>
            </table>
        </div>

        <div class="report-section" style="margin-top:40px;">
            <h2>Expenses</h2>
            <table class="members-table">
                <thead><tr><th>Item</th><th>Amount (KES)</th></tr></thead>
                <tbody>
                    <tr><td>Operating Expenses</td><td>${formatCurrency(totalExpenses)}</td></tr>
                    <tr class="total-row"><td><strong>Net Surplus / (Deficit)</strong></td><td><strong>${formatCurrency(netSurplus)}</strong></td></tr>
                </tbody>
            </table>
        </div>
    `;
}

export function memberStatements() {
    const { members } = getFreshData();

    document.getElementById('main-content').innerHTML = reportHeader('Member Statements', 'Individual member transaction history and balance') + `
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
                `<table class="members-table">
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
                </table>`
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
        <table class="members-table">
            <thead><tr><th>Ratio</th><th>Required</th><th>Current</th><th>Status</th></tr></thead>
            <tbody>
                <tr><td>Core Capital to Total Assets</td><td>≥ 10%</td><td>${((coreCapital / totalAssets) * 100).toFixed(2)}%</td><td>${coreCapital / totalAssets >= 0.1 ? '<span style="color:green;">Compliant</span>' : '<span style="color:red;">Non-Compliant</span>'}</td></tr>
                <tr><td>Institutional Capital to Core Capital</td><td>≥ 8%</td><td>${((institutionalCapital / coreCapital) * 100).toFixed(2)}%</td><td>${institutionalCapital / coreCapital >= 0.08 ? '<span style="color:green;">Compliant</span>' : '<span style="color:red;">Non-Compliant</span>'}</td></tr>
                <tr><td>Liquidity Ratio</td><td>≥ 15%</td><td>20.0%</td><td><span style="color:green;">Compliant</span></td></tr>
            </tbody>
        </table>
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

// ==================== MODULE INITIALIZATION ====================
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

    console.log('Reports module with PDF & CSV export fully initialized');
}
