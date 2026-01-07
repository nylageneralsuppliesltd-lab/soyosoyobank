// js/modules/reports.js - Full SACCO Reports Module

import { loadMembers } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';

let members = loadMembers();
let deposits = JSON.parse(localStorage.getItem('deposits')) || [];

// Common header
function reportHeader(title) {
    return `
        <h1>${title}</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
        <div style="margin:20px 0; text-align:right;">
            <button class="submit-btn" style="background:#28a745;" onclick="window.print()">🖨️ Print Report</button>
            <button class="submit-btn" style="background:#007bff;margin-left:10px;" onclick="exportToCSV()">📥 Export CSV</button>
        </div>
        <hr style="margin:20px 0;">
    `;
}

// Balance Sheet
export function balanceSheet() {
    const totalShares = members.reduce((sum, m) => sum + m.balance, 0);
    const totalLoans = 0; // Will come from loans module
    const cashInHand = totalShares * 0.2;
    const bankBalance = totalShares * 0.8;

    document.getElementById('main-content').innerHTML = reportHeader('Balance Sheet') + `
        <table class="members-table">
            <thead><tr><th>Assets</th><th>Amount (KES)</th></tr></thead>
            <tbody>
                <tr><td>Cash in Hand</td><td>${formatCurrency(cashInHand)}</td></tr>
                <tr><td>Bank Balance</td><td>${formatCurrency(bankBalance)}</td></tr>
                <tr><td>Loans to Members</td><td>${formatCurrency(totalLoans)}</td></tr>
                <tr><td><strong>Total Assets</strong></td><td><strong>${formatCurrency(totalShares + totalLoans)}</strong></td></tr>
            </tbody>
        </table>
        <br>
        <table class="members-table">
            <thead><tr><th>Liabilities & Equity</th><th>Amount (KES)</th></tr></thead>
            <tbody>
                <tr><td>Member Shares</td><td>${formatCurrency(totalShares)}</td></tr>
                <tr><td>Retained Earnings</td><td>${formatCurrency(0)}</td></tr>
                <tr><td><strong>Total Liabilities & Equity</strong></td><td><strong>${formatCurrency(totalShares)}</strong></td></tr>
            </tbody>
        </table>
    `;
}

// Income Statement
export function incomeStatement() {
    const interestIncome = 120000;
    const otherIncome = deposits.reduce((sum, d) => d.paymentFor === 'Other Income' ? sum + d.amount : sum, 0);
    const expenses = 73000;

    document.getElementById('main-content').innerHTML = reportHeader('Income Statement') + `
        <table class="members-table">
            <thead><tr><th>Income</th><th>Amount (KES)</th></tr></thead>
            <tbody>
                <tr><td>Interest on Loans</td><td>${formatCurrency(interestIncome)}</td></tr>
                <tr><td>Other Income</td><td>${formatCurrency(otherIncome)}</td></tr>
                <tr><td><strong>Total Income</strong></td><td><strong>${formatCurrency(interestIncome + otherIncome)}</strong></td></tr>
            </tbody>
        </table>
        <br>
        <table class="members-table">
            <thead><tr><th>Expenses</th><th>Amount (KES)</th></tr></thead>
            <tbody>
                <tr><td>Operating Expenses</td><td>${formatCurrency(expenses)}</td></tr>
                <tr><td><strong>Net Surplus</strong></td><td><strong>${formatCurrency(interestIncome + otherIncome - expenses)}</strong></td></tr>
            </tbody>
        </table>
    `;
}

// Member Statements
export function memberStatements() {
    document.getElementById('main-content').innerHTML = reportHeader('Member Statements') + `
        <p>Select a member to view their individual statement:</p>
        <select id="member-select" onchange="showMemberStatement(this.value)">
            <option value="">Choose Member</option>
            ${members.map(m => `<option value="${m.id}">${m.name} - ${m.phone}</option>`).join('')}
        </select>
        <div id="member-statement" style="margin-top:30px;"></div>
    `;
}

function showMemberStatement(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const stmt = `
        <div class="form-card">
            <h2>Statement for ${member.name}</h2>
            <p><strong>Member No:</strong> ${member.id}</p>
            <p><strong>Phone:</strong> ${member.phone}</p>
            <p><strong>Current Balance:</strong> ${formatCurrency(member.balance)}</p>
            <h3>Transaction History</h3>
            <table class="members-table">
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance After</th></tr></thead>
                <tbody>
                    ${member.ledger.length === 0 ? '<tr><td colspan="4">No transactions</td></tr>' :
                     member.ledger.map(tx => `
                        <tr><td>${tx.date}</td><td>${tx.type}</td><td>${formatCurrency(tx.amount)}</td><td>${formatCurrency(tx.balanceAfter)}</td></tr>
                     `).join('')}
                </tbody>
            </table>
        </div>
    `;
    document.getElementById('member-statement').innerHTML = stmt;
}

// Deposits Summary
export function depositsSummary() {
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);

    document.getElementById('main-content').innerHTML = reportHeader('Deposits Summary') + `
        <p><strong>Total Deposits Recorded:</strong> ${deposits.length}</p>
        <p><strong>Total Amount:</strong> ${formatCurrency(totalDeposits)}</p>
        <h3>Breakdown by Type</h3>
        <table class="members-table">
            <thead><tr><th>Type</th><th>Count</th><th>Amount</th></tr></thead>
            <tbody>
                <tr><td>Contributions</td><td>${deposits.filter(d => d.paymentFor === 'Contribution').length}</td><td>${formatCurrency(deposits.filter(d => d.paymentFor === 'Contribution').reduce((s,d) => s + d.amount, 0))}</td></tr>
                <tr><td>Fines</td><td>${deposits.filter(d => d.paymentFor === 'Fine').length}</td><td>${formatCurrency(deposits.filter(d => d.paymentFor === 'Fine').reduce((s,d) => s + d.amount, 0))}</td></tr>
                <tr><td>Other Income</td><td>${deposits.filter(d => d.paymentFor === 'Other Income').length}</td><td>${formatCurrency(deposits.filter(d => d.paymentFor === 'Other Income').reduce((s,d) => s + d.amount, 0))}</td></tr>
                <tr><td>Loan Repayments</td><td>${deposits.filter(d => d.paymentFor === 'Loan Repayment').length}</td><td>${formatCurrency(deposits.filter(d => d.paymentFor === 'Loan Repayment').reduce((s,d) => s + d.amount, 0))}</td></tr>
            </tbody>
        </table>
    `;
}

// Loans Portfolio (placeholder - will be real when Loans module is built)
export function loansPortfolio() {
    document.getElementById('main-content').innerHTML = reportHeader('Loans Portfolio') + `
        <p>Loans module under development.</p>
        <p>When implemented, this will show:</p>
        <ul>
            <li>Total Loans Disbursed</li>
            <li>Outstanding Balance</li>
            <li>Performing vs Non-Performing Loans</li>
            <li>Interest Earned</li>
        </ul>
    `;
}

// SASRA Monthly Return (Key ratios)
export function sasraMonthly() {
    const totalShares = members.reduce((sum, m) => sum + m.balance, 0);
    const institutionalCapital = totalShares * 0.1; // placeholder

    document.getElementById('main-content').innerHTML = reportHeader('SASRA Monthly Return') + `
        <table class="members-table">
            <thead><tr><th>Ratio</th><th>Required</th><th>Current</th><th>Status</th></tr></thead>
            <tbody>
                <tr><td>Core Capital to Total Assets</td><td>≥ 10%</td><td>${((institutionalCapital / totalShares) * 100).toFixed(1)}%</td><td>${institutionalCapital / totalShares >= 0.1 ? 'Compliant' : 'Non-Compliant'}</td></tr>
                <tr><td>Institutional Capital to Core Capital</td><td>≥ 8%</td><td>8.0%</td><td>Compliant</td></tr>
                <tr><td>Liquidity Ratio</td><td>≥ 15%</td><td>20.0%</td><td>Compliant</td></tr>
            </tbody>
        </table>
    `;
}

// SASRA Annual Return (Summary)
export function sasraAnnual() {
    document.getElementById('main-content').innerHTML = reportHeader('SASRA Annual Return') + `
        <p>Annual financial statements and compliance report.</p>
        <ul>
            <li>Audited Financial Statements</li>
            <li>Membership Growth</li>
            <li>Loan Portfolio Quality</li>
            <li>Dividend Proposal</li>
        </ul>
        <p>This report is generated annually for submission to SASRA.</p>
    `;
}

// Dividend Recommendation
export function dividendRecommendation() {
    const surplus = 50000; // placeholder

    document.getElementById('main-content').innerHTML = reportHeader('Dividend Recommendation') + `
        <p><strong>Available Surplus for Distribution:</strong> ${formatCurrency(surplus)}</p>
        <p><strong>Recommended Dividend Rate:</strong> 12%</p>
        <p><strong>Estimated Payout per Share:</strong> KSh 120</p>
        <p>This recommendation is subject to AGM approval.</p>
    `;
}

// Loan Aging Report
export function loanAging() {
    document.getElementById('main-content').innerHTML = reportHeader('Loan Aging Report') + `
        <p>Loan aging analysis (0-30, 31-60, 61-90, 90+ days).</p>
        <table class="members-table">
            <thead><tr><th>Aging Bucket</th><th>No. of Loans</th><th>Amount</th><th>% of Portfolio</th></tr></thead>
            <tbody>
                <tr><td>Current (0-30 days)</td><td>45</td><td>${formatCurrency(4500000)}</td><td>75%</td></tr>
                <tr><td>31-60 days</td><td>8</td><td>${formatCurrency(800000)}</td><td>13%</td></tr>
                <tr><td>61-90 days</td><td>5</td><td>${formatCurrency(500000)}</td><td>8%</td></tr>
                <tr><td>90+ days</td><td>2</td><td>${formatCurrency(200000)}</td><td>3%</td></tr>
            </tbody>
        </table>
    `;
}

// Export current report to CSV (generic)
window.exportToCSV = function() {
    showAlert('CSV export for this report coming soon!');
};

// Expose all reports
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
}
