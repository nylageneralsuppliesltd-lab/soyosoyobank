// js/modules/loans.js - COMPLETE & PROFESSIONAL Loans Module (Ferrari Style)

import { getItem, setItem } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';
import { saccoConfig } from '../config.js';

let members = getItem('members') || [];
let loans = getItem('loans') || [];          // All loans (member + bank)
let loanTypes = getItem('loanTypes') || [];  // Configured loan products

function saveLoans() { setItem('loans', loans); }
function saveLoanTypes() { setItem('loanTypes', loanTypes); }

function refreshData() {
    members = getItem('members') || [];
    loans = getItem('loans') || [];
    loanTypes = getItem('loanTypes') || [];
}

// Helper: Get disbursement accounts from settings
function getDisbursementAccounts() {
    const settings = loadSettings();
    const accounts = [{ id: 'cash', name: 'Cash (Physical)' }];

    (settings.accounts?.pettyCash || []).forEach(a => {
        accounts.push({ id: `petty_${a.name}`, name: `Petty Cash - ${a.name}` });
    });

    (settings.accounts?.mobileMoney || []).forEach(a => {
        accounts.push({ id: `mobile_${a.number}`, name: `${a.provider} - ${a.name || a.number}` });
    });

    (settings.accounts?.bank || []).forEach(a => {
        accounts.push({ id: `bank_${a.accountNumber}`, name: `${a.bankName} - ${a.accountName || a.accountNumber}` });
    });

    return accounts;
}

// ==================== 1. LOAN APPLICATIONS ====================
export function renderLoanApplications() {
    refreshData();
    const pending = loans.filter(l => l.status === 'pending');

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Loan Applications</h1>
            <p class="subtitle">Pending loan requests awaiting approval</p>

            <button class="submit-btn" onclick="loadSection('member-loans')">+ New Member Loan Application</button>

            ${pending.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No pending applications at the moment.</p>' :
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
                                    <td>${app.memberName || app.bankName || 'Unknown'}</td>
                                    <td>
                                        ${app.type}<br>
                                        Amount: ${formatCurrency(app.amount)}<br>
                                        Period: ${app.periodMonths} months
                                    </td>
                                    <td>${app.guarantors?.length || 0} guarantors</td>
                                    <td><span class="status-pending">Pending Approval</span></td>
                                    <td>
                                        <button onclick="viewLoanDetails(${app.id})">View</button>
                                        <button onclick="approveLoan(${app.id})" style="background:#28a745; color:white;">Approve</button>
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

// Placeholder actions (expand later)
window.viewLoanDetails = function(id) {
    showAlert(`Viewing details for loan ID: ${id}`);
};

window.approveLoan = function(id) {
    const loan = loans.find(l => l.id === id);
    if (loan) {
        loan.status = 'approved';
        saveLoans();
        showAlert(`Loan ${id} approved!`);
        renderLoanApplications();
    }
};

// ==================== 2. LOAN TYPES ====================
export function renderLoanTypes() {
    refreshData();

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Loan Types</h1>
            <p class="subtitle">Configure available loan products & fine rules</p>

            <button class="submit-btn" onclick="renderCreateLoanTypeForm()">+ Create New Loan Type</button>

            ${loanTypes.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No loan types defined yet.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Max Amount / Multiple</th>
                                <th>Period</th>
                                <th>Interest</th>
                                <th>Late Fines</th>
                                <th>Outstanding Fines</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${loanTypes.map((t, idx) => `
                                <tr>
                                    <td>${t.name}</td>
                                    <td>${t.maxMultiple ? `${t.maxMultiple}× savings` : formatCurrency(t.maxAmount || 0)}</td>
                                    <td>${t.periodMonths} months</td>
                                    <td>${t.interestRate}% ${t.interestType}</td>
                                    <td>${t.lateFines?.enabled ? 'Yes' : 'No'}</td>
                                    <td>${t.outstandingFines?.enabled ? 'Yes' : 'No'}</td>
                                    <td>
                                        <button onclick="renderCreateLoanTypeForm(${idx})">Edit</button>
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

// ==================== CREATE / EDIT LOAN TYPE ====================
function renderCreateLoanTypeForm(editIndex = null) {
    const type = editIndex !== null ? loanTypes[editIndex] : {};

    // Fine defaults
    const lateFines = type.lateFines || { enabled: false, type: 'one-off', value: 0 };
    const outstandingFines = type.outstandingFines || { enabled: false, type: 'one-off', value: 0 };

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Loan Type</h1>

            <form id="loan-type-form">
                <!-- Basic Details -->
                <div class="form-group">
                    <label class="required-label">Loan Type Name</label>
                    <input type="text" id="loan-name" value="${type.name || ''}" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Maximum Loan Amount (KES)</label>
                    <input type="number" id="max-amount" value="${type.maxAmount || ''}" min="0">
                    <small>Leave blank if using savings multiple</small>
                </div>

                <div class="form-group">
                    <label>Maximum Multiple of Savings</label>
                    <input type="number" id="max-multiple" value="${type.maxMultiple || ''}" min="1" step="0.5">
                    <small>e.g. 3 = up to 3× member's savings</small>
                </div>

                <div class="form-group">
                    <label class="required-label">Repayment Period (Months)</label>
                    <input type="number" id="period-months" value="${type.periodMonths || 12}" min="1" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Interest Rate (%)</label>
                    <input type="number" id="interest-rate" value="${type.interestRate || 10}" min="0" step="0.1" required>
                </div>

                <div class="form-group">
                    <label>Interest Type</label>
                    <select id="interest-type">
                        <option value="flat" ${type.interestType === 'flat' ? 'selected' : ''}>Flat Interest (on full amount)</option>
                        <option value="reducing" ${type.interestType === 'reducing' ? 'selected' : ''}>Reducing Balance</option>
                    </select>
                </div>

                <!-- LATE INSTALLMENT FINES -->
                <div class="form-group" style="margin-top:30px;">
                    <label>
                        <input type="checkbox" id="late-fines-enabled" ${lateFines.enabled ? 'checked' : ''}>
                        Do you charge fines for late loan installment payments?
                    </label>
                </div>

                <div id="late-fines-section" style="display:${lateFines.enabled ? 'block' : 'none'}; margin-left:30px; margin-top:15px;">
                    <div class="form-group">
                        <label class="required-label">What type of Late Loan Payment fine do you charge?</label>
                        <select id="late-fine-type">
                            <option value="one-off" ${lateFines.type === 'one-off' ? 'selected' : ''}>One-off fine per installment</option>
                            <option value="fixed" ${lateFines.type === 'fixed' ? 'selected' : ''}>Fixed fine amount</option>
                            <option value="percentage" ${lateFines.type === 'percentage' ? 'selected' : ''}>Percentage fine</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="required-label">Fine Value</label>
                        <input type="number" id="late-fine-value" value="${lateFines.value || 0}" min="0" step="0.01" required>
                        <small id="late-fine-unit">KES (fixed) or % (percentage)</small>
                    </div>
                </div>

                <!-- OUTSTANDING BALANCE FINES -->
                <div class="form-group" style="margin-top:25px;">
                    <label>
                        <input type="checkbox" id="outstanding-fines-enabled" ${outstandingFines.enabled ? 'checked' : ''}>
                        Do you charge fines for any outstanding loan balances at the end of the loan?
                    </label>
                </div>

                <div id="outstanding-fines-section" style="display:${outstandingFines.enabled ? 'block' : 'none'}; margin-left:30px; margin-top:15px;">
                    <div class="form-group">
                        <label class="required-label">What type of fine do you charge for outstanding balances?</label>
                        <select id="outstanding-fine-type">
                            <option value="one-off" ${outstandingFines.type === 'one-off' ? 'selected' : ''}>One-off fine per installment</option>
                            <option value="fixed" ${outstandingFines.type === 'fixed' ? 'selected' : ''}>Fixed fine amount</option>
                            <option value="percentage" ${outstandingFines.type === 'percentage' ? 'selected' : ''}>Percentage fine</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="required-label">Fine Value</label>
                        <input type="number" id="outstanding-fine-value" value="${outstandingFines.value || 0}" min="0" step="0.01" required>
                        <small id="outstanding-fine-unit">KES (fixed) or % (percentage)</small>
                    </div>
                </div>

                <!-- Actions -->
                <div style="margin-top:40px;">
                    <button type="submit" class="submit-btn">Save Loan Type</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="renderLoanTypes()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Toggle fine sections visibility
    document.getElementById('late-fines-enabled').addEventListener('change', e => {
        document.getElementById('late-fines-section').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('outstanding-fines-enabled').addEventListener('change', e => {
        document.getElementById('outstanding-fines-section').style.display = e.target.checked ? 'block' : 'none';
    });

    // Update unit label dynamically
    ['late-fine-type', 'outstanding-fine-type'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', e => {
            const unitEl = document.getElementById(id.replace('type', 'unit'));
            if (unitEl) {
                unitEl.textContent = e.target.value === 'percentage' ? '%' : 'KES (fixed)';
            }
        });
    });

    // Form submission
    document.getElementById('loan-type-form').onsubmit = e => {
        e.preventDefault();

        const newType = {
            name: document.getElementById('loan-name').value.trim(),
            maxAmount: parseFloat(document.getElementById('max-amount').value) || null,
            maxMultiple: parseFloat(document.getElementById('max-multiple').value) || null,
            periodMonths: parseInt(document.getElementById('period-months').value),
            interestRate: parseFloat(document.getElementById('interest-rate').value),
            interestType: document.getElementById('interest-type').value,

            lateFines: {
                enabled: document.getElementById('late-fines-enabled').checked,
                type: document.getElementById('late-fine-type').value,
                value: parseFloat(document.getElementById('late-fine-value').value) || 0
            },

            outstandingFines: {
                enabled: document.getElementById('outstanding-fines-enabled').checked,
                type: document.getElementById('outstanding-fine-type').value,
                value: parseFloat(document.getElementById('outstanding-fine-value').value) || 0
            }
        };

        if (editIndex !== null) {
            loanTypes[editIndex] = newType;
        } else {
            loanTypes.push(newType);
        }

        saveLoanTypes();
        showAlert('Loan type saved successfully!');
        renderLoanTypes();
    };
}

// ==================== 3. LOAN CALCULATOR ====================
export function renderLoanCalculator() {
    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Loan Calculator</h1>
            <p class="subtitle">Estimate monthly repayments and total cost</p>

            <form id="loan-calc-form">
                <div class="form-group">
                    <label class="required-label">Loan Amount (KES)</label>
                    <input type="number" id="calc-amount" min="1000" value="50000" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Interest Rate (%)</label>
                    <input type="number" id="calc-rate" step="0.1" value="10" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Repayment Period (Months)</label>
                    <input type="number" id="calc-period" min="1" value="12" required>
                </div>

                <div class="form-group">
                    <label>Interest Type</label>
                    <select id="calc-type">
                        <option value="flat">Flat Interest (full amount)</option>
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
            // Reducing balance EMI formula
            const r = rate / 12; // monthly rate
            monthlyPayment = amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
            totalInterest = (monthlyPayment * months) - amount;
        }

        document.getElementById('calc-result').innerHTML = `
            <div class="result-box" style="padding:20px; background:#f8f9fa; border-radius:12px;">
                <p><strong>Monthly Installment:</strong> <span style="font-size:1.4em;">${formatCurrency(monthlyPayment)}</span></p>
                <p><strong>Total Interest:</strong> ${formatCurrency(totalInterest)}</p>
                <p><strong>Total Repayment:</strong> ${formatCurrency(amount + totalInterest)}</p>
            </div>
        `;
    };
}

// ==================== 4. MEMBER LOANS ====================
export function renderMemberLoans() {
    refreshData();
    const memberLoans = loans.filter(l => l.memberId);

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Member Loans</h1>
            <p class="subtitle">All active, pending & repaid loans to members</p>

            <button class="submit-btn" onclick="renderCreateMemberLoanForm()">+ Create New Member Loan</button>

            ${memberLoans.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No member loans recorded yet.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Period</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
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

function renderCreateMemberLoanForm() {
    refreshData();
    const accounts = getDisbursementAccounts();

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Create Member Loan</h1>
            <p class="subtitle">Disburse a new loan to an existing member</p>

            <form id="member-loan-form">
                <div class="form-group">
                    <label class="required-label">Loan Type</label>
                    <select id="loan-type" required>
                        <option value="">-- Choose Loan Type --</option>
                        ${loanTypes.map(t => `<option value="${t.name}">${t.name} (${t.interestRate}%)</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Select Member</label>
                    <select id="member-id" required>
                        <option value="">-- Choose Member --</option>
                        ${members.map(m => `
                            <option value="${m.id}">
                                ${m.name} ${m.phone ? `(${m.phone})` : ''} 
                                - Balance: ${formatCurrency(m.balance || 0)}
                            </option>
                        `).join('')}
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

                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Create Loan</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="renderMemberLoans()">Cancel</button>
                </div>
            </form>
        </div>
    `;

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
            status: 'pending',
            createdAt: new Date().toLocaleString('en-GB')
        };

        loans.push(newLoan);
        saveLoans();

        // Optional: Increase member liability (loan taken)
        selectedMember.balance = (selectedMember.balance || 0) + newLoan.amount;
        setItem('members', members);

        showAlert(`Loan application of ${formatCurrency(newLoan.amount)} created for ${selectedMember.name}!`);
        renderMemberLoans();
    };
}

// ==================== 5. BANK LOANS ====================
export function renderBankLoans() {
    refreshData();
    const bankLoans = loans.filter(l => !l.memberId);

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Bank Loans</h1>
            <p class="subtitle">Loans received from financial institutions</p>

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
            <p class="subtitle">Record a loan received from a bank or financial institution</p>

            <form id="bank-loan-form">
                <div class="form-group">
                    <label class="required-label">Bank / Institution Name</label>
                    <input type="text" id="bank-name" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Type</label>
                    <select id="loan-type" required>
                        <option value="">-- Select Type --</option>
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
        showAlert('Bank loan recorded successfully!');
        renderBankLoans();
    };
}

// ==================== MODULE INITIALIZATION ====================
export function initLoansModule() {
    // Expose all render functions globally (for inline onclick & menu)
    window.renderLoanApplications = renderLoanApplications;
    window.renderLoanTypes = renderLoanTypes;
    window.renderLoanCalculator = renderLoanCalculator;
    window.renderMemberLoans = renderMemberLoans;
    window.renderBankLoans = renderBankLoans;

    window.renderCreateLoanTypeForm = renderCreateLoanTypeForm;
    window.renderCreateMemberLoanForm = renderCreateMemberLoanForm;
    window.renderCreateBankLoanForm = renderCreateBankLoanForm;

    console.log('Loans module fully initialized');
}
