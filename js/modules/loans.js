// js/modules/loans.js - Complete Loans Module (Applications, Types, Calculator, Member & Bank Loans)

import { getItem, setItem } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';
import { saccoConfig } from '../config.js';

let members = getItem('members') || [];
let loans = getItem('loans') || []; // { id, memberId, type, amount, period, interest, status, guarantors, approvals, disbursementDate, disbursedFrom, ... }
let loanTypes = getItem('loanTypes') || []; // [{ name, maxMultiple, periodMonths, interestRate, interestType, ... }]

function saveLoans() { setItem('loans', loans); }
function saveLoanTypes() { setItem('loanTypes', loanTypes); }

function refreshData() {
    members = getItem('members') || [];
    loans = getItem('loans') || [];
    loanTypes = getItem('loanTypes') || [];
}

// Get SACCO accounts for disbursement
function getDisbursementAccounts() {
    const settings = loadSettings();
    const accounts = [{ id: 'cash', name: 'Cash' }];

    (settings.accounts?.pettyCash || []).forEach(a => accounts.push({ id: `petty_${a.name}`, name: `Petty Cash - ${a.name}` }));
    (settings.accounts?.mobileMoney || []).forEach(a => accounts.push({ id: `mobile_${a.number}`, name: `${a.provider} - ${a.name || a.number}` }));
    (settings.accounts?.bank || []).forEach(a => accounts.push({ id: `bank_${a.accountNumber}`, name: `${a.bankName} - ${a.accountName || a.accountNumber}` }));

    return accounts;
}

// ==================== SUBMENU 1: LOAN APPLICATIONS ====================
export function renderLoanApplications() {
    refreshData();
    const pending = loans.filter(l => l.status === 'pending');

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Loan Applications</h1>
            <p class="subtitle">Pending loan requests awaiting approval</p>

            <button class="submit-btn" onclick="loadSection('create-loan')">+ New Loan Application</button>

            ${pending.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No pending applications.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Applicant</th>
                                <th>Loan Details</th>
                                <th>Guarantors</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pending.map((app, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${app.memberName || 'Unknown'}</td>
                                    <td>
                                        ${app.type}<br>
                                        Amount: ${formatCurrency(app.amount)}<br>
                                        Period: ${app.periodMonths} months
                                    </td>
                                    <td>${app.guarantors?.length || 0} guarantors</td>
                                    <td><span class="status-pending">Pending Approval</span></td>
                                    <td>
                                        <button onclick="viewLoanDetails(${app.id})">View</button>
                                        <button onclick="approveLoan(${app.id})" style="background:#28a745;">Approve</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>
    `;
}

// Placeholder functions (expand later)
function viewLoanDetails(id) { showAlert(`Viewing loan ID: ${id}`); }
function approveLoan(id) { showAlert(`Loan ${id} approved!`); }

// ==================== SUBMENU 2: LOAN TYPES ====================
export function renderLoanTypes() {
    refreshData();

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Loan Types</h1>
            <p class="subtitle">Configure available loan products</p>

            <button class="submit-btn" onclick="renderCreateLoanTypeForm()">+ Create New Loan Type</button>

            ${loanTypes.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No loan types defined yet.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead><tr><th>Name</th><th>Max Amount</th><th>Period</th><th>Interest</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${loanTypes.map(t => `
                                <tr>
                                    <td>${t.name}</td>
                                    <td>${t.maxMultiple ? `Up to ${t.maxMultiple}x savings` : formatCurrency(t.maxAmount || 0)}</td>
                                    <td>${t.periodMonths} months</td>
                                    <td>${t.interestRate}% ${t.interestType || 'flat'}</td>
                                    <td><button onclick="editLoanType(${loanTypes.indexOf(t)})">Edit</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>
    `;
}

function renderCreateMemberLoanForm() {
    refreshData(); // Ensures latest members are loaded

    const accounts = getDisbursementAccounts();

    // Debug: Log to confirm members are loaded
    console.log('Available members for dropdown:', members);

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Create Member Loan</h1>
            <p class="subtitle">Disburse a new loan to an existing member</p>

            <form id="member-loan-form">
                <div class="form-group">
                    <label class="required-label">Select Loan Type</label>
                    <select id="loan-type" required>
                        <option value="">-- Choose Loan Type --</option>
                        ${loanTypes.length === 0 
                            ? '<option disabled>No loan types defined yet</option>' 
                            : loanTypes.map(t => `<option value="${t.name}">${t.name} (${t.interestRate}%)</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Select Member</label>
                    <select id="member-id" required>
                        <option value="">-- Choose Member --</option>
                        ${members.length === 0 
                            ? '<option disabled>No members found</option>' 
                            : members.map(m => `
                                <option value="${m.id}">
                                    ${m.name} ${m.phone ? `(${m.phone})` : ''} 
                                    - Balance: ${formatCurrency(m.balance || 0)}
                                </option>
                            `).join('')}
                    </select>
                    <small style="color:#666; display:block; margin-top:6px;">
                        Only active members with sufficient savings may be eligible (check loan type rules).
                    </small>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Amount (KES)</label>
                    <input type="number" id="loan-amount" min="1000" step="100" required placeholder="e.g. 50000">
                </div>

                <div class="form-group">
                    <label class="required-label">Repayment Period (Months)</label>
                    <input type="number" id="period-months" min="1" required placeholder="e.g. 12">
                </div>

                <div class="form-group">
                    <label class="required-label">Disbursement Account</label>
                    <select id="disbursement-account" required>
                        <option value="">-- Select Account --</option>
                        ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Disbursement Date</label>
                    <input type="date" id="disbursement-date" value="${new Date().toISOString().split('T')[0]}">
                </div>

                <!-- Optional: Add guarantors toggle, fines, etc. later -->

                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Create & Disburse Loan</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="renderMemberLoans()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Form submission - Save the loan
    document.getElementById('member-loan-form').onsubmit = e => {
        e.preventDefault();

        const memberId = parseInt(document.getElementById('member-id').value);
        const selectedMember = members.find(m => m.id === memberId);

        if (!selectedMember) {
            showAlert('Please select a valid member', 'error');
            return;
        }

        const newLoan = {
            id: Date.now(),
            memberId: memberId,
            memberName: selectedMember.name,
            type: document.getElementById('loan-type').value,
            amount: parseFloat(document.getElementById('loan-amount').value),
            periodMonths: parseInt(document.getElementById('period-months').value),
            disbursementDate: document.getElementById('disbursement-date').value,
            disbursedFrom: document.getElementById('disbursement-account').value,
            status: 'pending', // or 'approved' if you want auto-approve for now
            createdAt: new Date().toLocaleString('en-GB'),
            // Add more fields later: interest, guarantors, fines, schedule, etc.
        };

        loans.push(newLoan);
        saveLoans();

        // Optional: Update member balance (disburse loan increases liability)
        selectedMember.balance = (selectedMember.balance || 0) + newLoan.amount;
        setItem('members', members);

        showAlert(`Loan of ${formatCurrency(newLoan.amount)} created for ${selectedMember.name}!`, 'success');
        renderMemberLoans(); // Go back to list
    };
}

// ==================== SUBMENU 3: LOAN CALCULATOR ====================
export function renderLoanCalculator() {
    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Loan Calculator</h1>
            <p class="subtitle">Estimate monthly repayments</p>

            <form id="loan-calc-form">
                <div class="form-group">
                    <label>Loan Amount (KES)</label>
                    <input type="number" id="calc-amount" min="1000" value="50000" required>
                </div>

                <div class="form-group">
                    <label>Interest Rate (% per period)</label>
                    <input type="number" id="calc-rate" step="0.1" value="10" required>
                </div>

                <div class="form-group">
                    <label>Repayment Period (Months)</label>
                    <input type="number" id="calc-period" min="1" value="12" required>
                </div>

                <div class="form-group">
                    <label>Interest Type</label>
                    <select id="calc-type">
                        <option value="flat">Flat Interest</option>
                        <option value="reducing">Reducing Balance</option>
                    </select>
                </div>

                <button type="submit" class="submit-btn">Calculate</button>
            </form>

            <div id="calc-result" style="margin-top:30px;"></div>
        </div>
    `;

    document.getElementById('loan-calc-form').onsubmit = e => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('calc-amount').value);
        const rate = parseFloat(document.getElementById('calc-rate').value) / 100;
        const months = parseInt(document.getElementById('calc-period').value);
        const type = document.getElementById('calc-type').value;

        let monthlyPayment = 0;
        let totalInterest = 0;

        if (type === 'flat') {
            totalInterest = amount * rate;
            monthlyPayment = (amount + totalInterest) / months;
        } else {
            // Reducing balance (simple EMI formula)
            const r = rate / 12; // monthly rate if annual %
            monthlyPayment = amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
            totalInterest = (monthlyPayment * months) - amount;
        }

        document.getElementById('calc-result').innerHTML = `
            <div class="result-box">
                <p><strong>Monthly Installment:</strong> ${formatCurrency(monthlyPayment)}</p>
                <p><strong>Total Interest:</strong> ${formatCurrency(totalInterest)}</p>
                <p><strong>Total Repayment:</strong> ${formatCurrency(amount + totalInterest)}</p>
            </div>
        `;
    };
}

// ==================== SUBMENU 4: MEMBER LOANS ====================
export function renderMemberLoans() {
    refreshData();
    const memberLoans = loans.filter(l => l.memberId);

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Member Loans</h1>
            <p class="subtitle">All active and repaid loans to members</p>

            <button class="submit-btn" onclick="renderCreateMemberLoanForm()">+ Create New Member Loan</button>

            ${memberLoans.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No member loans recorded.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead><tr><th>Member</th><th>Type</th><th>Amount</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${memberLoans.map(l => `
                                <tr>
                                    <td>${l.memberName || 'Unknown'}</td>
                                    <td>${l.type}</td>
                                    <td>${formatCurrency(l.amount)}</td>
                                    <td>${l.periodMonths} months</td>
                                    <td><span class="status-${l.status}">${l.status}</span></td>
                                    <td><button onclick="viewLoan(${l.id})">View</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>
    `;
}



// ==================== SUBMENU 5: BANK LOANS ====================
export function renderBankLoans() {
    refreshData();
    const bankLoans = loans.filter(l => !l.memberId); // Loans without member = bank loans

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Bank Loans</h1>
            <p class="subtitle">Loans from financial institutions</p>

            <button class="submit-btn" onclick="renderCreateBankLoanForm()">+ Create New Bank Loan</button>

            ${bankLoans.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No bank loans recorded.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead><tr><th>Bank</th><th>Type</th><th>Amount</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${bankLoans.map(l => `
                                <tr>
                                    <td>${l.bankName || 'Unknown'}</td>
                                    <td>${l.type}</td>
                                    <td>${formatCurrency(l.amount)}</td>
                                    <td>${l.periodMonths} months</td>
                                    <td><span class="status-${l.status}">${l.status}</span></td>
                                    <td><button onclick="viewLoan(${l.id})">View</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>
    `;
}

function renderCreateBankLoanForm() {
    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Create Bank Loan</h1>
            <p class="subtitle">Record loan received from a bank or financial institution</p>

            <form id="bank-loan-form">
                <div class="form-group">
                    <label class="required-label">Bank/Institution Name</label>
                    <input type="text" id="bank-name" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Type</label>
                    <select id="loan-type" required>
                        <option value="">Select Type</option>
                        ${loanTypes.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Amount (KES)</label>
                    <input type="number" id="loan-amount" min="1000" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Repayment Period (Months)</label>
                    <input type="number" id="period-months" min="1" required>
                </div>

                <div class="form-group">
                    <label>Interest Rate (%)</label>
                    <input type="number" id="interest-rate" step="0.1" value="12">
                </div>

                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Create Bank Loan</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="renderBankLoans()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('bank-loan-form').onsubmit = e => {
        e.preventDefault();

        const newLoan = {
            id: Date.now(),
            bankName: document.getElementById('bank-name').value.trim(),
            type: document.getElementById('loan-type').value,
            amount: parseFloat(document.getElementById('loan-amount').value),
            periodMonths: parseInt(document.getElementById('period-months').value),
            interestRate: parseFloat(document.getElementById('interest-rate').value),
            status: 'active',
            createdAt: new Date().toLocaleString('en-GB')
        };

        loans.push(newLoan);
        saveLoans();
        showAlert('Bank loan recorded!');
        renderBankLoans();
    };
}


// ==================== MODULE INITIALIZATION ====================
export function initLoansModule() {
    console.log('Loans module initialized');
}


// Expose functions globally so inline onclick="..." works
window.renderLoanApplications = renderLoanApplications;
window.renderLoanTypes = renderLoanTypes;
window.renderLoanCalculator = renderLoanCalculator;
window.renderMemberLoans = renderMemberLoans;
window.renderBankLoans = renderBankLoans;

// Also expose the form renderers (critical for buttons)
window.renderCreateLoanTypeForm = renderCreateLoanTypeForm;
window.renderCreateMemberLoanForm = renderCreateMemberLoanForm;
window.renderCreateBankLoanForm = renderCreateBankLoanForm;

// Optional: expose any other internal functions used in onclick
// window.viewLoan = viewLoan;
// window.approveLoan = approveLoan;
