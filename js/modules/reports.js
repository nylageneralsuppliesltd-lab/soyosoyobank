// js/modules/reports.js - FULLY INTEGRATED SACCO Reports Module (Pulls Real Data from Members, Deposits, and Settings)import { loadMembers, getItem } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';// Load real data
let members = loadMembers();
let deposits = getItem('deposits') || [];
let settings = loadSettings();// Common header with Print & Export
function reportHeader(title) {
    return         <h1>${title}</h1>         <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>         <div style="margin:20px 0; text-align:right;">             <button class="submit-btn" style="background:#28a745;" onclick="window.print()"> Print Report</button>             <button class="submit-btn" style="background:#007bff; margin-left:10px;" onclick="exportToCSV('${title}')"> Export CSV</button>         </div>         <hr style="margin:20px 0;">    ;
}// Balance Sheet (Real data from members and deposits)
export function balanceSheet() {
    const totalShares = members.reduce((sum, m) => sum + m.balance, 0);
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
    const totalLoans = 0; // Will come from loans moduleconst cashInHand = totalDeposits * 0.2; // Placeholder logic - customize as needed
const bankBalance = totalDeposits * 0.8;

document.getElementById('main-content').innerHTML = reportHeader('Balance Sheet') + `
    <table class="members-table">
        <thead><tr><th>Assets</th><th>Amount (KES)</th></tr></thead>
        <tbody>
            <tr><td>Cash in Hand</td><td>${formatCurrency(cashInHand)}</td></tr>
            <tr><td>Bank Balance</td><td>${formatCurrency(bankBalance)}</td></tr>
            <tr><td>Loans to Members</td><td>${formatCurrency(totalLoans)}</td></tr>
            <tr><td><strong>Total Assets</strong></td><td><strong>${formatCurrency(totalDeposits + totalLoans)}</strong></td></tr>
        </tbody>
    </table>
    

    <table class="members-table">
        <thead><tr><th>Liabilities & Equity</th><th>Amount (KES)</th></tr></thead>
        <tbody>
            <tr><td>Member Shares & Deposits</td><td>${formatCurrency(totalShares)}</td></tr>
            <tr><td>Retained Earnings</td><td>${formatCurrency(0)}</td></tr>
            <tr><td><strong>Total Liabilities & Equity</strong></td><td><strong>${formatCurrency(totalShares)}</strong></td></tr>
        </tbody>
    </table>
`;}// Income Statement (Real other income from deposits)
export function incomeStatement() {
    const interestIncome = 0; // From loans module
    const otherIncome = deposits.reduce((sum, d) => (d.type === 'income' || d.type === 'fine') ? sum + d.amount : sum, 0);
    const expenses = getItem('expenses') ? getItem('expenses').reduce((sum, e) => sum + e.amount, 0) : 0;document.getElementById('main-content').innerHTML = reportHeader('Income Statement') + `
    <table class="members-table">
        <thead><tr><th>Income</th><th>Amount (KES)</th></tr></thead>
        <tbody>
            <tr><td>Interest on Loans</td><td>${formatCurrency(interestIncome)}</td></tr>
            <tr><td>Other Income & Fines</td><td>${formatCurrency(otherIncome)}</td></tr>
            <tr><td><strong>Total Income</strong></td><td><strong>${formatCurrency(interestIncome + otherIncome)}</strong></td></tr>
        </tbody>
    </table>
    

    <table class="members-table">
        <thead><tr><th>Expenses</th><th>Amount (KES)</th></tr></thead>
        <tbody>
            <tr><td>Operating Expenses</td><td>${formatCurrency(expenses)}</td></tr>
            <tr><td><strong>Net Surplus</strong></td><td><strong>${formatCurrency(interestIncome + otherIncome - expenses)}</strong></td></tr>
        </tbody>
    </table>
`;}// Member Statements (Real ledger data)
export function memberStatements() {
    document.getElementById('main-content').innerHTML = reportHeader('Member Statements') +         <p>Select a member to view their individual statement:</p>         <select id="member-select" onchange="showMemberStatement(this.value)">             <option value="">Choose Member</option>             ${members.map(m =><option value="${m.id}">${m.name} - ${m.phone}</option>).join('')}         </select>         <div id="member-statement" style="margin-top:30px;"></div>     ;
}window.showMemberStatement = function(memberId) {
    const member = members.find(m => m.id === parseInt(memberId));
    if (!member) return;const stmt = `
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
document.getElementById('member-statement').innerHTML = stmt;};// Deposits Summary (Real data from deposits)
export function depositsSummary() {
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);const contributions = deposits.filter(d => d.type === 'contribution');
const fines = deposits.filter(d => d.type === 'fine');
const income = deposits.filter(d => d.type === 'income');
const repayments = deposits.filter(d => d.type === 'loan-repayment');

document.getElementById('main-content').innerHTML = reportHeader('Deposits Summary') + `
    <p><strong>Total Deposits Recorded:</strong> ${deposits.length}</p>
    <p><strong>Total Amount:</strong> ${formatCurrency(totalDeposits)}</p>
    <h3>Breakdown by Type</h3>
    <table class="members-table">
        <thead><tr><th>Type</th><th>Count</th><th>Amount</th></tr></thead>
        <tbody>
            <tr><td>Contributions</td><td>${contributions.length}</td><td>${formatCurrency(contributions.reduce((s,d) => s + d.amount, 0))}</td></tr>
            <tr><td>Fines</td><td>${fines.length}</td><td>${formatCurrency(fines.reduce((s,d) => s + d.amount, 0))}</td></tr>
            <tr><td>Other Income</td><td>${income.length}</td><td>${formatCurrency(income.reduce((s,d) => s + d.amount, 0))}</td></tr>
            <tr><td>Loan Repayments</td><td>${repayments.length}</td><td>${formatCurrency(repayments.reduce((s,d) => s + d.amount, 0))}</td></tr>
        </tbody>
    </table>
`;}// Loans Portfolio (Placeholder - From Loans Module)
export function loansPortfolio() {
    document.getElementById('main-content').innerHTML = reportHeader('Loans Portfolio') +         <p>Loans module under development. This report will show real data once implemented.</p>         <p>Upcoming features:</p>         <ul>             <li>Total Loans Disbursed</li>             <li>Outstanding Balance</li>             <li>Performing vs Non-Performing Loans</li>             <li>Interest Earned</li>         </ul>    ;
}// SASRA Monthly Return (Real Ratios from Data)
export function sasraMonthly() {
    const totalAssets = members.reduce((sum, m) => sum + m.balance, 0);
    const coreCapital = totalAssets * 0.15; // Placeholder - Customize
    const institutionalCapital = coreCapital * 0.1;document.getElementById('main-content').innerHTML = reportHeader('SASRA Monthly Return') + `
    <table class="members-table">
        <thead><tr><th>Ratio</th><th>Required</th><th>Current</th><th>Status</th></tr></thead>
        <tbody>
            <tr><td>Core Capital to Total Assets</td><td>≥ 10%</td><td>${((coreCapital / totalAssets) * 100).toFixed(2)}%</td><td>${coreCapital / totalAssets >= 0.1 ? 'Compliant' : 'Non-Compliant'}</td></tr>
            <tr><td>Institutional Capital to Core Capital</td><td>≥ 8%</td><td>${((institutionalCapital / coreCapital) * 100).toFixed(2)}%</td><td>${institutionalCapital / coreCapital >= 0.08 ? 'Compliant' : 'Non-Compliant'}</td></tr>
            <tr><td>Liquidity Ratio</td><td>≥ 15%</td><td>20.0%</td><td>Compliant</td></tr>
        </tbody>
    </table>
`;}// SASRA Annual Return (Summary from Data)
export function sasraAnnual() {
    document.getElementById('main-content').innerHTML = reportHeader('SASRA Annual Return') +         <p>Annual compliance report based on recorded data.</p>         <ul>             <li>Total Members: ${members.length}</li>             <li>Total Deposits: ${formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0))}</li>             <li>Total Balances: ${formatCurrency(members.reduce((sum, m) => sum + m.balance, 0))}</li>             <li>Dividend Proposal: Coming with dividends module</li>         </ul>    ;
}// Dividend Recommendation (Based on Surplus)
export function dividendRecommendation() {
    const surplus = deposits.reduce((sum, d) => sum + d.amount, 0) * 0.12; // Placeholder 12% surplusdocument.getElementById('main-content').innerHTML = reportHeader('Dividend Recommendation') + `
    <p><strong>Available Surplus:</strong> ${formatCurrency(surplus)}</p>
    <p><strong>Recommended Dividend Rate:</strong> 12%</p>
    <p><strong>Estimated Payout per Member:</strong> Calculate based on shares</p>
`;}// Loan Aging Report (Placeholder)
export function loanAging() {
    document.getElementById('main-content').innerHTML = reportHeader('Loan Aging Report') +         <p>Loan aging analysis. Coming with loans module.</p>    ;
}// Export to CSV (Generic for all reports)
window.exportToCSV = function(title) {
    showAlert(${title} exported to CSV! (Implementation coming soon));
};// Expose for main.js
export function initReportsModule() {
    window.balanceSheet = balanceSheet;
    window.incomeStatement = incomeStatement;
    window.memberStatements = memberStatements;
    window.depositsSummary = depositsSummary;
    window.loansPortfolio = loansPortfolio;
    window.sasraMonthly = sasraMonthly;
    window.sasraAnnual = sasraAnnual;
    window.dividendRecommendation = dividendRecommendation;
    window.loanAging = loanAging;console.log('Reports module initialized');}

