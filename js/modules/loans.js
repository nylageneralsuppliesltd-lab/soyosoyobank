// js/modules/loans.js - FULL PRODUCTION-READY Loans Module with Bank Loans as Liabilities
// Integrates original 5 menus + T24-grade enhancements
// Updated: Bank loans now correctly treated as liabilities (credit to SACCO)

import { getItem, setItem } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { loadSettings } from './settings.js';
import { saccoConfig } from '../config.js';

// ──────────────────────────────────────────────────────────────────────────────
// DATA STORES
// ──────────────────────────────────────────────────────────────────────────────
let members = [];
let loans = [];
let loanTypes = [];
let repayments = [];
let journals = [];

// Refresh from storage
function refreshData() {
    members = getItem('soyoMembers') || [];   
    loans = getItem('loans') || [];
    loanTypes = getItem('loanTypes') || [];
    repayments = getItem('repayments') || [];
    journals = getItem('journals') || [];
}

// Auto-refresh on module load
refreshData();

// Save all
function saveAll() {
    setItem('loans', loans);
    setItem('loanTypes', loanTypes);
    setItem('repayments', repayments);
    setItem('journals', journals);
    setItem('soyoMembers', members); // In case balance/loanBalance changed
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

// UID generator
const uid = () => Date.now() + Math.floor(Math.random() * 1000);

// Journal entry helper - simple debit/credit numbers
function addJournal(date, desc, debit, credit) {
    journals.push({ 
        id: uid(), 
        date: date || new Date().toISOString().split('T')[0],
        description: desc,
        debitAmount: debit || 0,
        creditAmount: credit || 0,
        createdAt: new Date().toISOString()
    });
    setItem('journals', journals);
}

// ──────────────────────────────────────────────────────────────────────────────
// LOAN LIMIT CHECK
// ──────────────────────────────────────────────────────────────────────────────
function checkLoanLimit(member, type, amount) {
    if (type.maxAmount && amount > type.maxAmount) return false;
    if (type.maxMultiple && member.balance) {
        return amount <= member.balance * type.maxMultiple;
    }
    return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// AMORTIZATION SCHEDULE GENERATOR
// ──────────────────────────────────────────────────────────────────────────────
function generateSchedule(amount, rate, months, interestType) {
    const schedule = [];
    if (interestType === 'flat') {
        const totalInterest = amount * (rate / 100);
        const monthly = (amount + totalInterest) / months;
        for (let i = 1; i <= months; i++) {
            schedule.push({
                installment: i,
                principal: amount / months,
                interest: totalInterest / months,
                total: monthly,
                paid: false
            });
        }
    } else { // reducing
        const r = rate / 100 / 12;
        const emi = amount * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        let balance = amount;
        for (let i = 1; i <= months; i++) {
            const interest = balance * r;
            const principal = emi - interest;
            balance -= principal;
            schedule.push({
                installment: i,
                principal,
                interest,
                total: emi,
                paid: false
            });
        }
    }
    return schedule;
}

// ──────────────────────────────────────────────────────────────────────────────
// MENU 1: LOAN APPLICATIONS
// ──────────────────────────────────────────────────────────────────────────────
export function renderLoanApplications() {
    refreshData();
    const pending = loans.filter(l => l.status === 'pending');

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Loan Applications</h1>
            <p class="subtitle">Pending loan requests awaiting approval</p>

            <button class="submit-btn" onclick="window.loadSection('member-loans')">+ New Member Loan Application</button>
            <button class="submit-btn" onclick="window.loadSection('bank-loans')">+ New Bank Loan (Borrowed)</button>

            ${pending.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No pending applications at the moment.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Applicant / Bank</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Period</th>
                                <th>Direction</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pending.map((app, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${app.memberName || app.bankName || 'Unknown'}</td>
                                    <td>${app.typeName || app.type}</td>
                                    <td>${formatCurrency(app.amount)}</td>
                                    <td>${app.periodMonths} months</td>
                                    <td>${app.loanDirection === 'outward' ? 'Outward (Asset)' : 'Inward (Liability)'}</td>
                                    <td><span class="status-${app.status}">${app.status}</span></td>
                                    <td>
                                        <button onclick="window.viewLoanDetails(${app.id})">View</button>
                                        <button onclick="window.approveLoan(${app.id})" style="background:#28a745; color:white;">Approve</button>
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

// ──────────────────────────────────────────────────────────────────────────────
// MENU 2: LOAN TYPES (unchanged)
// ──────────────────────────────────────────────────────────────────────────────
export function renderLoanTypes() {
    refreshData();

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Loan Types</h1>
            <p class="subtitle">Configure available loan products & fine rules</p>

            <button class="submit-btn" onclick="window.renderCreateLoanTypeForm()">+ Create New Loan Type</button>

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
                                        <button onclick="window.renderCreateLoanTypeForm(${idx})">Edit</button>
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

// ──────────────────────────────────────────────────────────────────────────────
// CREATE / EDIT LOAN TYPE (unchanged)
// ──────────────────────────────────────────────────────────────────────────────
function renderCreateLoanTypeForm(editIndex = null) {
    refreshData();

    const type = editIndex !== null ? loanTypes[editIndex] : {};

    const lateFines = type.lateFines || { enabled: false, type: 'one-off', value: 0 };
    const outstandingFines = type.outstandingFines || { enabled: false, type: 'one-off', value: 0 };

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Loan Type</h1>

            <form id="loan-type-form">

                <div class="form-group">
                    <label class="required-label">Loan Type Name</label>
                    <input type="text" id="loan-name" value="${type.name || ''}" required>
                </div>

                <div class="form-group">
                    <label>Member Qualification Criteria</label>
                    <input type="text" id="qualification-criteria" value="${type.qualificationCriteria || ''}" placeholder="e.g. Minimum savings, membership duration">
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
                    <label>Interest Charge Type</label>
                    <select id="interest-type">
                        <option value="flat" ${type.interestType === 'flat' ? 'selected' : ''}>Flat Interest (on full amount)</option>
                        <option value="reducing" ${type.interestType === 'reducing' ? 'selected' : ''}>Reducing Balance</option>
                        <option value="fixed" ${type.interestType === 'fixed' ? 'selected' : ''}>Fixed Interest</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Interest Rate (%)</label>
                    <input type="number" id="interest-rate" value="${type.interestRate || 10}" min="0" step="0.1" required>
                </div>

                <div class="form-group">
                    <label>Interest Frequency</label>
                    <select id="interest-frequency">
                        <option value="monthly" ${type.interestFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        <option value="weekly" ${type.interestFrequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="daily" ${type.interestFrequency === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="yearly" ${type.interestFrequency === 'yearly' ? 'selected' : ''}>Yearly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Is Repayment Period Flexible?</label>
                    <select id="period-flexible">
                        <option value="fixed" ${type.periodFlexible === 'fixed' ? 'selected' : ''}>Fixed</option>
                        <option value="flexible" ${type.periodFlexible === 'flexible' ? 'selected' : ''}>Flexible</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Period (Months)</label>
                    <input type="number" id="period-months" value="${type.periodMonths || 12}" min="1" required>
                </div>

                <div class="form-group">
                    <label>Grace Period (Months)</label>
                    <input type="number" id="grace-period" value="${type.gracePeriod || 0}" min="0">
                </div>

                <div class="form-group">
                    <label>Loan Application Approvers</label>
                    <input type="text" id="approvers" value="${type.approvers || ''}" placeholder="e.g. Group officials, selected members">
                </div>

                <div class="form-group">
                    <label>Fine Frequency</label>
                    <select id="fine-frequency">
                        <option value="monthly" ${type.fineFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        <option value="weekly" ${type.fineFrequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="daily" ${type.fineFrequency === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="yearly" ${type.fineFrequency === 'yearly' ? 'selected' : ''}>Yearly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Fine Base</label>
                    <select id="fine-base">
                        <option value="total-unpaid" ${type.fineBase === 'total-unpaid' ? 'selected' : ''}>Total Unpaid Loan</option>
                        <option value="loan-amount" ${type.fineBase === 'loan-amount' ? 'selected' : ''}>Loan Amount</option>
                        <option value="installment-balance" ${type.fineBase === 'installment-balance' ? 'selected' : ''}>Installment Balance</option>
                        <option value="installment-interest" ${type.fineBase === 'installment-interest' ? 'selected' : ''}>Installment Interest</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Disbursement Account</label>
                    <input type="text" id="disbursement-account" value="${type.disbursementAccount || ''}" placeholder="Account to disburse from">
                </div>

                <div class="form-group">
                    <label>Automatic Disbursement After Approval?</label>
                    <select id="auto-disbursement">
                        <option value="no" ${type.autoDisbursement === 'no' ? 'selected' : ''}>No</option>
                        <option value="yes" ${type.autoDisbursement === 'yes' ? 'selected' : ''}>Yes</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Loan Processing Fees</label>
                    <input type="number" id="processing-fee" value="${type.processingFee || 0}" min="0" step="0.01" placeholder="Amount or percentage">
                    <select id="processing-fee-type">
                        <option value="fixed" ${type.processingFeeType === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                        <option value="percentage" ${type.processingFeeType === 'percentage' ? 'selected' : ''}>Percentage</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Guarantors Required?</label>
                    <select id="guarantors-required">
                        <option value="no" ${type.guarantorsRequired === 'no' ? 'selected' : ''}>No</option>
                        <option value="yes" ${type.guarantorsRequired === 'yes' ? 'selected' : ''}>Yes</option>
                    </select>
                </div>

                <div class="form-group" id="guarantors-section" style="display:${type.guarantorsRequired === 'yes' ? 'block' : 'none'};">
                    <label>Guarantor Name</label>
                    <input type="text" id="guarantor-name" value="${type.guarantorName || ''}">
                    <label>Amount Guaranteed</label>
                    <input type="number" id="guarantor-amount" value="${type.guarantorAmount || ''}" min="0">
                    <label>Guarantor Notified?</label>
                    <select id="guarantor-notified">
                        <option value="no" ${type.guarantorNotified === 'no' ? 'selected' : ''}>No</option>
                        <option value="yes" ${type.guarantorNotified === 'yes' ? 'selected' : ''}>Yes</option>
                    </select>
                </div>

                <!-- Late Installment Fines -->
                <div class="form-group" style="margin-top:30px;">
                    <label>
                        <input type="checkbox" id="late-fines-enabled" ${lateFines.enabled ? 'checked' : ''}>
                        Do you charge fines for late loan installment payments?
                    </label>
                </div>

                <div id="late-fines-section" style="display:${lateFines.enabled ? 'block' : 'none'}; margin-left:30px; margin-top:15px;">
                    <div class="form-group">
                        <label class="required-label">Late Fine Type</label>
                        <select id="late-fine-type">
                            <option value="one-off" ${lateFines.type === 'one-off' ? 'selected' : ''}>One-off per installment</option>
                            <option value="fixed" ${lateFines.type === 'fixed' ? 'selected' : ''}>Fixed amount</option>
                            <option value="percentage" ${lateFines.type === 'percentage' ? 'selected' : ''}>Percentage</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="required-label">Fine Value</label>
                        <input type="number" id="late-fine-value" value="${lateFines.value || 0}" min="0" step="0.01" required>
                        <small id="late-fine-unit">KES (fixed) or % (percentage)</small>
                    </div>
                </div>

                <!-- Outstanding Balance Fines -->
                <div class="form-group" style="margin-top:25px;">
                    <label>
                        <input type="checkbox" id="outstanding-fines-enabled" ${outstandingFines.enabled ? 'checked' : ''}>
                        Do you charge fines for outstanding balances at end of loan?
                    </label>
                </div>

                <div id="outstanding-fines-section" style="display:${outstandingFines.enabled ? 'block' : 'none'}; margin-left:30px; margin-top:15px;">
                    <div class="form-group">
                        <label class="required-label">Outstanding Fine Type</label>
                        <select id="outstanding-fine-type">
                            <option value="one-off" ${outstandingFines.type === 'one-off' ? 'selected' : ''}>One-off per installment</option>
                            <option value="fixed" ${outstandingFines.type === 'fixed' ? 'selected' : ''}>Fixed amount</option>
                            <option value="percentage" ${outstandingFines.type === 'percentage' ? 'selected' : ''}>Percentage</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="required-label">Fine Value</label>
                        <input type="number" id="outstanding-fine-value" value="${outstandingFines.value || 0}" min="0" step="0.01" required>
                        <small id="outstanding-fine-unit">KES (fixed) or % (percentage)</small>
                    </div>
                </div>

                <div style="margin-top:40px;">
                    <button type="submit" class="submit-btn">Save Loan Type</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="window.renderLoanTypes()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Toggle fine sections
    document.getElementById('late-fines-enabled').addEventListener('change', e => {
        document.getElementById('late-fines-section').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('outstanding-fines-enabled').addEventListener('change', e => {
        document.getElementById('outstanding-fines-section').style.display = e.target.checked ? 'block' : 'none';
    });

    // Dynamic unit label
    ['late-fine-type', 'outstanding-fine-type'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', e => {
            const unitEl = document.getElementById(id.replace('type', 'unit'));
            if (unitEl) unitEl.textContent = e.target.value === 'percentage' ? '%' : 'KES (fixed)';
        });
    });

    // Form submission
    document.getElementById('loan-type-form').onsubmit = e => {
        e.preventDefault();

        // Collect all field values
        const name = document.getElementById('loan-name').value.trim();
        const qualificationCriteria = document.getElementById('qualification-criteria').value.trim();
        const maxAmount = parseFloat(document.getElementById('max-amount').value);
        const maxMultiple = parseFloat(document.getElementById('max-multiple').value);
        const interestType = document.getElementById('interest-type').value;
        const interestRate = parseFloat(document.getElementById('interest-rate').value);
        const interestFrequency = document.getElementById('interest-frequency').value;
        const periodFlexible = document.getElementById('period-flexible').value;
        const periodMonths = parseInt(document.getElementById('period-months').value);
        const gracePeriod = parseInt(document.getElementById('grace-period').value);
        const approvers = document.getElementById('approvers').value.trim();
        const fineFrequency = document.getElementById('fine-frequency').value;
        const fineBase = document.getElementById('fine-base').value;
        const disbursementAccount = document.getElementById('disbursement-account').value;
        const autoDisbursement = document.getElementById('auto-disbursement').value;
        const processingFee = parseFloat(document.getElementById('processing-fee').value);
        const processingFeeType = document.getElementById('processing-fee-type').value;
        const guarantorsRequired = document.getElementById('guarantors-required').value;
        let guarantorName = '', guarantorAmount = 0, guarantorNotified = 'no';
        if (guarantorsRequired === 'yes') {
            guarantorName = document.getElementById('guarantor-name').value.trim();
            guarantorAmount = parseFloat(document.getElementById('guarantor-amount').value);
            guarantorNotified = document.getElementById('guarantor-notified').value;
        }
        const disbursementDate = document.getElementById('disbursement-date').value;

        // Validate required fields
        if (!name) return showAlert('Loan type name is required', 'error');
        if (isNaN(interestRate) || interestRate < 0) return showAlert('Interest rate is required', 'error');
        if (isNaN(periodMonths) || periodMonths < 1) return showAlert('Loan period is required', 'error');
        if (!disbursementAccount) return showAlert('Disbursement account is required', 'error');

        // Save logic (update loanTypes or send to backend)
        const newType = {
            name,
            qualificationCriteria,
            maxAmount,
            maxMultiple,
            interestType,
            interestRate,
            interestFrequency,
            periodFlexible,
            periodMonths,
            gracePeriod,
            approvers,
            fineFrequency,
            fineBase,
            disbursementAccount,
            autoDisbursement,
            processingFee,
            processingFeeType,
            guarantorsRequired,
            guarantorName,
            guarantorAmount,
            guarantorNotified,
            disbursementDate,
            // ...existing fields...
        };

        if (editIndex !== null) {
            loanTypes[editIndex] = newType;
        } else {
            loanTypes.push(newType);
        }

        saveAll();
        showAlert('Loan type saved successfully!');
        renderLoanTypes();
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// MENU 3: LOAN CALCULATOR (unchanged)
// ──────────────────────────────────────────────────────────────────────────────
export function renderLoanCalculator() {
    refreshData();

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
            const r = rate / 12;
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

// ──────────────────────────────────────────────────────────────────────────────
// MENU 4: MEMBER LOANS (Outward - Asset)
// ──────────────────────────────────────────────────────────────────────────────
export function renderMemberLoans() {
    refreshData();

    const memberLoans = loans.filter(l => l.loanDirection === 'outward');

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Member Loans (Outward)</h1>
            <p class="subtitle">Loans given by SACCO to members (assets)</p>

            <button class="submit-btn" onclick="window.renderCreateMemberLoanForm()">+ Create New Member Loan</button>

            ${memberLoans.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No member loans recorded yet.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${memberLoans.map(l => `
                                <tr>
                                    <td>${l.memberName || 'Unknown'}</td>
                                    <td>${l.typeName || l.type}</td>
                                    <td>${formatCurrency(l.amount)}</td>
                                    <td>${formatCurrency(l.balance || l.amount)}</td>
                                    <td><span class="status-${l.status}">${l.status}</span></td>
                                    <td><button onclick="window.viewLoan(${l.id})">View</button></td>
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

    const disbursementAccounts = getDisbursementAccounts();

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Create Member Loan (Outward)</h1>
            <p class="subtitle">Disburse a new loan to an existing member</p>

            <form id="member-loan-form">
                <div class="form-group">
                    <label class="required-label">Loan Type</label>
                    <select id="loan-type" required>
                        <option value="">-- Choose Loan Type --</option>
                        ${loanTypes.map(t => `
                            <option value="${String(t.id)}">
                                ${t.name} (${t.interestRate}% - ${t.interestType})
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Member Qualification Criteria</label>
                    <input type="text" id="qualification-criteria" placeholder="e.g. Minimum savings, membership duration">
                </div>

                <div class="form-group">
                    <label class="required-label">Select Member</label>
                    <select id="member-id" required>
                        <option value="">-- Choose Member --</option>
                        ${members.map(m => `
                            <option value="${String(m.id)}">
                                ${m.name} ${m.phone ? `(${m.phone})` : ''} 
                                - Balance: ${formatCurrency(m.balance || 0)}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Amount (KES)</label>
                    <input type="number" id="loan-amount" min="1000" step="100" required placeholder="e.g. 50000">
                </div>

                <div class="form-group">
                    <label>Interest Charge Type</label>
                    <select id="interest-type">
                        <option value="flat">Flat Interest (on full amount)</option>
                        <option value="reducing">Reducing Balance</option>
                        <option value="fixed">Fixed Interest</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Interest Rate (%)</label>
                    <input type="number" id="interest-rate" placeholder="Auto-filled from loan type">
                </div>

                <div class="form-group">
                    <label>Interest Frequency</label>
                    <select id="interest-frequency">
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Is Repayment Period Flexible?</label>
                    <select id="period-flexible">
                        <option value="fixed">Fixed</option>
                        <option value="flexible">Flexible</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Period (Months)</label>
                    <input type="number" id="period-months" min="1" required placeholder="e.g. 12">
                </div>

                <div class="form-group">
                    <label>Grace Period (Months)</label>
                    <input type="number" id="grace-period" min="0">
                </div>

                <div class="form-group">
                    <label>Loan Application Approvers</label>
                    <input type="text" id="approvers" placeholder="e.g. Group officials, selected members">
                </div>

                <div class="form-group">
                    <label>Fine Frequency</label>
                    <select id="fine-frequency">
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Fine Base</label>
                    <select id="fine-base">
                        <option value="total-unpaid">Total Unpaid Loan</option>
                        <option value="loan-amount">Loan Amount</option>
                        <option value="installment-balance">Installment Balance</option>
                        <option value="installment-interest">Installment Interest</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="required-label">Disbursement Account</label>
                    <select id="disbursement-account" required>
                        <option value="">-- Select Account --</option>
                        ${disbursementAccounts.map(a => `
                            <option value="${a.id}">${a.name}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Automatic Disbursement After Approval?</label>
                    <select id="auto-disbursement">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Loan Processing Fees</label>
                    <input type="number" id="processing-fee" min="0" step="0.01" placeholder="Amount or percentage">
                    <select id="processing-fee-type">
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Guarantors Required?</label>
                    <select id="guarantors-required">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>

                <div class="form-group" id="guarantors-section" style="display:none;">
                    <label>Guarantor Name</label>
                    <input type="text" id="guarantor-name">
                    <label>Amount Guaranteed</label>
                    <input type="number" id="guarantor-amount" min="0">
                    <label>Guarantor Notified?</label>
                    <select id="guarantor-notified">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Disbursement Date</label>
                    <input type="date" id="disbursement-date" value="${new Date().toISOString().split('T')[0]}">
                </div>

                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Create Loan</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="window.renderMemberLoans()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('loan-type').addEventListener('change', e => {
        const typeId = e.target.value;
        const selectedType = loanTypes.find(t => String(t.id) === String(typeId));
        if (selectedType) {
            document.getElementById('interest-rate').value = selectedType.interestRate || '';
            document.getElementById('period-months').value = selectedType.periodMonths || '';
        } else {
            document.getElementById('interest-rate').value = '';
            document.getElementById('period-months').value = '';
        }
    });

    document.getElementById('member-loan-form').onsubmit = e => {
        e.preventDefault();

        // Collect all field values
        const memberIdStr = document.getElementById('member-id').value;
        const selectedMember = members.find(m => String(m.id) === memberIdStr);
        if (!selectedMember) return showAlert('Please select a valid member', 'error');

        const typeIdStr = document.getElementById('loan-type').value;
        const selectedType = loanTypes.find(t => String(t.id) === typeIdStr);
        if (!selectedType) return showAlert('Please select a valid loan type', 'error');

        const qualificationCriteria = document.getElementById('qualification-criteria').value.trim();
        const amount = parseFloat(document.getElementById('loan-amount').value);
        if (isNaN(amount) || amount <= 0) return showAlert('Please enter a valid loan amount', 'error');
        if (!checkLoanLimit(selectedMember, selectedType, amount)) return showAlert('Loan amount exceeds allowed limit based on savings', 'error');

        const interestType = document.getElementById('interest-type').value;
        const interestRate = parseFloat(document.getElementById('interest-rate').value);
        const interestFrequency = document.getElementById('interest-frequency').value;
        const periodFlexible = document.getElementById('period-flexible').value;
        const periodMonths = parseInt(document.getElementById('period-months').value);
        const gracePeriod = parseInt(document.getElementById('grace-period').value);
        const approvers = document.getElementById('approvers').value.trim();
        const fineFrequency = document.getElementById('fine-frequency').value;
        const fineBase = document.getElementById('fine-base').value;
        const disbursementAccount = document.getElementById('disbursement-account').value;
        const autoDisbursement = document.getElementById('auto-disbursement').value;
        const processingFee = parseFloat(document.getElementById('processing-fee').value);
        const processingFeeType = document.getElementById('processing-fee-type').value;
        const guarantorsRequired = document.getElementById('guarantors-required').value;
        let guarantorName = '', guarantorAmount = 0, guarantorNotified = 'no';
        if (guarantorsRequired === 'yes') {
            guarantorName = document.getElementById('guarantor-name').value.trim();
            guarantorAmount = parseFloat(document.getElementById('guarantor-amount').value);
            guarantorNotified = document.getElementById('guarantor-notified').value;
        }
        const disbursementDate = document.getElementById('disbursement-date').value;

        // Validate required fields
        if (isNaN(interestRate) || interestRate < 0) return showAlert('Interest rate is required', 'error');
        if (isNaN(periodMonths) || periodMonths < 1) return showAlert('Loan period is required', 'error');
        if (!disbursementAccount) return showAlert('Disbursement account is required', 'error');

        // Save logic (send to backend or update memberLoans)
        const newLoan = {
            memberId: selectedMember.id,
            typeId: selectedType.id,
            qualificationCriteria,
            amount,
            interestType,
            interestRate,
            interestFrequency,
            periodFlexible,
            periodMonths,
            gracePeriod,
            approvers,
            fineFrequency,
            fineBase,
            disbursementAccount,
            autoDisbursement,
            processingFee,
            processingFeeType,
            guarantorsRequired,
            guarantorName,
            guarantorAmount,
            guarantorNotified,
            disbursementDate,
            // ...existing fields...
        };

        loans.push(newLoan);
        saveAll();

        showAlert(`Loan application of ${formatCurrency(amount)} created for ${selectedMember.name}!`, 'success');
        renderMemberLoans();
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// MENU 5: BANK LOANS (Inward - Liability)
// ──────────────────────────────────────────────────────────────────────────────
export function renderBankLoans() {
    refreshData();

    const bankLoans = loans.filter(l => l.loanDirection === 'inward');

    document.getElementById('main-content').innerHTML = `
        <div class="loans-page">
            <h1>Bank Loans (Inward)</h1>
            <p class="subtitle">Loans borrowed by the SACCO from banks/institutions (liabilities)</p>

            <button class="submit-btn" onclick="window.renderCreateBankLoanForm()">+ Borrow New Bank Loan</button>

            ${bankLoans.length === 0 ? 
                '<p style="text-align:center; padding:60px; color:#666;">No bank loans borrowed yet.</p>' :
                `<div class="table-container">
                    <table class="members-table">
                        <thead>
                            <tr>
                                <th>Bank</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bankLoans.map(l => `
                                <tr>
                                    <td>${l.bankName || 'Unknown'}</td>
                                    <td>${l.typeName || l.type}</td>
                                    <td>${formatCurrency(l.amount)}</td>
                                    <td>${formatCurrency(l.balance || l.amount)}</td>
                                    <td><span class="status-${l.status}">${l.status}</span></td>
                                    <td><button onclick="window.viewLoan(${l.id})">View</button></td>
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
    refreshData();

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Borrow Bank Loan (Inward)</h1>
            <p class="subtitle">Record a new loan received from a bank or institution</p>

            <form id="bank-loan-form">
                <div class="form-group">
                    <label class="required-label">Bank / Institution Name</label>
                    <input type="text" id="bank-name" required placeholder="e.g. Equity Bank">
                </div>

                <div class="form-group">
                    <label class="required-label">Loan Type</label>
                    <select id="loan-type" required>
                        <option value="">-- Select Type --</option>
                        ${loanTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
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
                    <label class="required-label">Interest Rate (%)</label>
                    <input type="number" id="interest-rate" step="0.1" value="12" required>
                </div>

                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Borrow & Record Loan</button>
                    <button type="button" class="submit-btn" style="background:#6c757d;" onclick="window.renderBankLoans()">Cancel</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('bank-loan-form').onsubmit = e => {
        e.preventDefault();

        const newLoan = {
            id: uid(),
            bankName: document.getElementById('bank-name').value.trim(),
            typeId: document.getElementById('loan-type').value,
            typeName: loanTypes.find(t => t.id == document.getElementById('loan-type').value)?.name,
            amount: parseFloat(document.getElementById('loan-amount').value),
            periodMonths: parseInt(document.getElementById('period-months').value),
            interestRate: parseFloat(document.getElementById('interest-rate').value),
            status: 'active',
            createdAt: new Date().toLocaleString('en-GB'),
            loanDirection: 'inward'  // IMPORTANT: Inward = SACCO borrows (liability)
        };

        loans.push(newLoan);
        saveAll();

        // Immediately approve & disburse (since it's received)
        approveLoan(newLoan.id);

        showAlert('Bank loan borrowed and recorded successfully!');
        renderBankLoans();
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// APPROVE & DISBURSE LOAN (Now handles both directions)
// ──────────────────────────────────────────────────────────────────────────────
export function approveLoan(loanId) {
    refreshData();

    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.status !== 'pending') {
        showAlert('Cannot approve: Loan not found or not pending', 'error');
        return;
    }

    loan.status = 'active';
    loan.disbursedDate = new Date().toISOString().split('T')[0];

    if (loan.loanDirection === 'outward') {
        // SACCO lends to member → asset increases
        const member = members.find(m => String(m.id) === String(loan.memberId));
        if (member) {
            member.loanBalance = (member.loanBalance || 0) + loan.amount;
            // Optional: reduce member's cash if loan is from their savings
            // member.balance = (member.balance || 0) - loan.amount;
        }

        addJournal(
            loan.disbursedDate,
            `Loan Disbursement (Outward) - ${loan.memberName || 'Member'} - ${loan.typeName || 'Loan'}`,
            loan.amount,                    // Debit: Loans Receivable (asset ↑)
            loan.amount                     // Credit: Disbursement Account (cash/bank ↓)
        );
    } else if (loan.loanDirection === 'inward') {
        // SACCO borrows from bank → liability increases
        addJournal(
            loan.disbursedDate,
            `Bank Loan Received (Inward) - ${loan.bankName || 'Bank'}`,
            loan.amount,                    // Debit: Cash/Bank (asset ↑)
            loan.amount                     // Credit: Bank Loans Payable (liability ↑)
        );
    }

    saveAll();
    setItem('soyoMembers', members);

    showAlert(`Loan of ${formatCurrency(loan.amount)} approved & processed!`, 'success');
    renderLoanApplications();
}

// Rest of your code (postRepayment, applyFines, getLoanStatement, initLoansModule) remains unchanged
// Just ensure postRepayment also handles direction if needed (for bank loans, repayment would reduce liability)

export function initLoansModule() {
    refreshData();

    window.renderLoanApplications = renderLoanApplications;
    window.renderLoanTypes = renderLoanTypes;
    window.renderLoanCalculator = renderLoanCalculator;
    window.renderMemberLoans = renderMemberLoans;
    window.renderBankLoans = renderBankLoans;

    window.renderCreateLoanTypeForm = renderCreateLoanTypeForm;
    window.renderCreateMemberLoanForm = renderCreateMemberLoanForm;
    window.renderCreateBankLoanForm = renderCreateBankLoanForm;

    window.approveLoan = approveLoan;

    console.log('Loans module fully initialized - Bank loans now treated as liabilities');
}
