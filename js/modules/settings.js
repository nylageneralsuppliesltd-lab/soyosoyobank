// js/modules/settings.js - Complete Settings Module with All Requested Fields & Full Details

import { getItem, setItem } from '../storage.js';
import { showAlert } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function loadSettings() {
    let settings = getItem('settings');

    if (!settings) {
        settings = {
            contributionTypes: [],
            invoiceTemplates: [],
            expenseCategories: [],
            fineCategories: [],
            groupRoles: [],
            assetCategories: [],
            incomeCategories: [],
            accounts: {
                pettyCash: [],
                mobileMoney: [],
                bank: []
            }
        };
        setItem('settings', settings);

        setTimeout(() => {
            showAlert(
                'Welcome to Settings! Start by adding Contribution Types, Bank Accounts, Expense Categories, and Roles to unlock full features.',
                'info',
                10000
            );
        }, 500);
    }

    return settings;
}

export function saveSettings(settings) {
    setItem('settings', settings);
}

// Main Settings Dashboard - FULL & FINAL VERSION (All Cards Clickable)

export function renderSettings() {
    document.getElementById('main-content').innerHTML = `
        <div class="settings-page">
            <h1>Settings & Configuration</h1>
            <p class="subtitle">Click any card below to add, edit, or manage items. All changes are saved automatically.</p>

            <div class="settings-grid">
                <!-- Contribution Types -->
                <div class="section-card nav-card" onclick="loadSection('settings-contributions')">
                    <h3>Contribution Types</h3>
                    <p class="help-text">Monthly Shares, Registration Fee, Building Fund, Education Fund, etc.<br>
                    Configure amount, arrears rules, statement display, and refundability.</p>
                </div>

                <!-- Invoice Templates -->
                <div class="section-card nav-card" onclick="loadSection('settings-invoices')">
                    <h3>Invoice Templates</h3>
                    <p class="help-text">Create invoice types with amount payable, due date, sending options, and description.</p>
                </div>

                <!-- Expense Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-expenses')">
                    <h3>Expense Categories</h3>
                    <p class="help-text">Office Rent, Staff Salaries, Utilities, Transport, Stationery.<br>
                    Add description and mark as administrative expense if needed.</p>
                </div>

                <!-- Fine Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-fines')">
                    <h3>Fine Categories</h3>
                    <p class="help-text">Late Payment Fine, Meeting Absence, Loan Default Interest, etc.</p>
                </div>

                <!-- Group Roles -->
                <div class="section-card nav-card" onclick="loadSection('settings-roles')">
                    <h3>Group Roles</h3>
                    <p class="help-text">Chairman, Vice Chairman, Secretary, Treasurer, Committee Member.<br>
                    Assign role description and permissions (view, edit, approve, etc.).</p>
                </div>

                <!-- Asset Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-assets')">
                    <h3>Asset Categories</h3>
                    <p class="help-text">Land, Buildings, Vehicles, Furniture, Office Equipment, Investments.</p>
                </div>

                <!-- Income Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-income')">
                    <h3>Income Categories</h3>
                    <p class="help-text">Interest Received, Donations, Fines Collected, Asset Sales, Other Income.</p>
                </div>

                <!-- Accounts -->
                <div class="section-card nav-card" onclick="loadSection('settings-accounts')">
                    <h3>Accounts</h3>
                    <p class="help-text">Petty Cash, M-Pesa Till, Airtel Money, Equity Bank, Co-op Bank, etc.<br>
                    Track balances and account details.</p>
                </div>
            </div>

            <div class="save-note">
                <strong>✓ All changes are saved automatically • Start with Contribution Types and Bank Accounts</strong>
            </div>
        </div>
    `;
}
// Generic List View (for all categories)
function renderListView(key, title, fields = ['name']) {
    const settings = loadSettings();
    const items = settings[key] || [];

    document.getElementById('main-content').innerHTML = `
        <h1>${title}</h1>
        <p class="subtitle">Total: ${items.length}</p>

        <button class="submit-btn" style="background:#28a745;" onclick="renderAddEditForm('${key}', '${title}', null)">
            + Add New ${title.slice(0, -1)}
        </button>
        <button class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderSettings()">
            ← Back
        </button>

        ${items.length === 0 ?
            `<p style="color:#999; margin:30px 0; font-style:italic;">No items yet. Click "+ Add New" above.</p>` :
            `
            <div class="table-container" style="margin-top:20px;">
                <table class="members-table">
                    <thead>
                        <tr>
                            ${fields.map(f => `<th>${f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1')}</th>`).join('')}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, index) => `
                            <tr>
                                ${fields.map(field => `<td>${item[field] ?? ''}</td>`).join('')}
                                <td>
                                    <button onclick="renderAddEditForm('${key}', '${title}', ${index})" style="font-size:12px;padding:4px 8px;margin:2px;">Edit</button>
                                    <button onclick="deleteItem('${key}', ${index}, '${title}')" style="background:#dc3545;font-size:12px;padding:4px 8px;margin:2px;">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            `
        }
    `;
}

window.deleteItem = function(key, index, title) {
    if (confirm('Delete this item permanently?')) {
        const settings = loadSettings();
        settings[key].splice(index, 1);
        saveSettings(settings);
        showAlert(`${title.slice(0, -1)} deleted.`);
        renderListView(key, title);
    }
};

// Generic Add/Edit Form Router
window.renderAddEditForm = function(key, title, editIndex) {
    if (key === 'contributionTypes') renderContributionForm(editIndex);
    else if (key === 'invoiceTemplates') renderInvoiceForm(editIndex);
    else if (key === 'expenseCategories') renderExpenseCategoryForm(editIndex);
    else if (key === 'fineCategories') renderFineCategoryForm(editIndex);
    else if (key === 'groupRoles') renderGroupRoleForm(editIndex);
    else if (key === 'assetCategories') renderAssetCategoryForm(editIndex);
    else if (key === 'incomeCategories') renderIncomeCategoryForm(editIndex);
    else if (key === 'accounts') renderAccountsDashboard();
};

// === CONTRIBUTION TYPES ===
function renderContributionForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.contributionTypes[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Add'} Contribution Type</h1>
            <form id="contrib-form">
                <div class="form-group">
                    <label class="required-label">Contribution Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Contribution Amount per Member</label>
                    <input type="number" id="amount" value="${item.amount || ''}" min="0" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Contribution Type</label>
                    <select id="type">
                        <option value="Shares" ${item.type === 'Shares' ? 'selected' : ''}>Shares</option>
                        <option value="Savings" ${item.type === 'Savings' ? 'selected' : ''}>Savings</option>
                        <option value="Loan" ${item.type === 'Loan' ? 'selected' : ''}>Loan Related</option>
                        <option value="Other" ${item.type === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="required-label">Contribution Category</label>
                    <input type="text" id="category" value="${item.category || ''}" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="disable-arrears" ${item.disableArrears ? 'checked' : ''}>
                        Disable arrears for this contribution?
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="show-statement" ${item.showInStatement !== false ? 'checked' : ''}>
                        Display this contribution in the member's statement report?
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="non-refundable" ${item.nonRefundable ? 'checked' : ''}>
                        Is this contribution non-refundable?
                    </label>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('contributionTypes', 'Contribution Types')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('contrib-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim(),
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value.trim(),
            disableArrears: document.getElementById('disable-arrears').checked,
            showInStatement: document.getElementById('show-statement').checked,
            nonRefundable: document.getElementById('non-refundable').checked
        };

        if (editIndex !== null) {
            settings.contributionTypes[editIndex] = newItem;
        } else {
            settings.contributionTypes.push(newItem);
        }

        saveSettings(settings);
        showAlert('Contribution type saved successfully!');
        renderListView('contributionTypes', 'Contribution Types');
    };
}

// === INVOICE TEMPLATES ===
function renderInvoiceForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.invoiceTemplates[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Invoice Template</h1>
            <form id="invoice-form">
                <div class="form-group">
                    <label class="required-label">Invoice Type</label>
                    <input type="text" id="type" value="${item.type || ''}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Send Invoices To</label>
                    <select id="sendTo">
                        <option value="All Members" ${item.sendTo === 'All Members' ? 'selected' : ''}>All Members</option>
                        <option value="Active Only" ${item.sendTo === 'Active Only' ? 'selected' : ''}>Active Only</option>
                        <option value="Specific Members" ${item.sendTo === 'Specific Members' ? 'selected' : ''}>Specific Members</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="required-label">Amount Payable</label>
                    <input type="number" id="amount" value="${item.amount || ''}" min="0" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Invoice Date</label>
                    <input type="date" id="invoiceDate" value="${item.invoiceDate || new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Contribution Date / Due Date</label>
                    <input type="date" id="dueDate" value="${item.dueDate || new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="description" rows="4">${item.description || ''}</textarea>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('invoiceTemplates', 'Invoice Templates')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('invoice-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            type: document.getElementById('type').value.trim(),
            sendTo: document.getElementById('sendTo').value,
            amount: parseFloat(document.getElementById('amount').value),
            invoiceDate: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            description: document.getElementById('description').value.trim()
        };

        if (editIndex !== null) {
            settings.invoiceTemplates[editIndex] = newItem;
        } else {
            settings.invoiceTemplates.push(newItem);
        }

        saveSettings(settings);
        showAlert('Invoice template saved!');
        renderListView('invoiceTemplates', 'Invoice Templates');
    };
}

// === EXPENSE CATEGORIES ===
function renderExpenseCategoryForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.expenseCategories[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Add'} Expense Category</h1>
            <form id="expense-form">
                <div class="form-group">
                    <label class="required-label">Group Expense Category Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Group Expense Category Description</label>
                    <textarea id="description" rows="3">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="isAdmin" ${item.isAdmin ? 'checked' : ''}>
                        Is an Administrative Expense Category?
                    </label>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('expenseCategories', 'Expense Categories')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('expense-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim(),
            isAdmin: document.getElementById('isAdmin').checked
        };

        if (editIndex !== null) {
            settings.expenseCategories[editIndex] = newItem;
        } else {
            settings.expenseCategories.push(newItem);
        }

        saveSettings(settings);
        showAlert('Expense category saved!');
        renderListView('expenseCategories', 'Expense Categories');
    };
}

// === FINE CATEGORIES ===
function renderFineCategoryForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.fineCategories[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Add'} Fine Category</h1>
            <form id="fine-form">
                <div class="form-group">
                    <label class="required-label">Group Fine Category Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('fineCategories', 'Fine Categories')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('fine-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim()
        };

        if (editIndex !== null) {
            settings.fineCategories[editIndex] = newItem;
        } else {
            settings.fineCategories.push(newItem);
        }

        saveSettings(settings);
        showAlert('Fine category saved!');
        renderListView('fineCategories', 'Fine Categories');
    };
}

// === GROUP ROLES WITH PERMISSIONS ===
function renderGroupRoleForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.groupRoles[editIndex] : { permissions: [] };

    const allPermissions = [
        'View Members', 'Edit Members', 'Record Deposits', 'Record Expenses',
        'View Reports', 'Approve Loans', 'Manage Settings', 'Manage Roles'
    ];

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Add'} Group Role</h1>
            <form id="role-form">
                <div class="form-group">
                    <label class="required-label">Group Role Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Group Role Description</label>
                    <textarea id="description" rows="3">${item.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Role Permissions</label>
                    <div style="columns:2; gap:20px;">
                        ${allPermissions.map(perm => `
                            <label style="display:block; margin:8px 0;">
                                <input type="checkbox" value="${perm}" ${item.permissions?.includes(perm) ? 'checked' : ''}>
                                ${perm}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('groupRoles', 'Group Roles')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('role-form').onsubmit = (e) => {
        e.preventDefault();
        const permissions = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        const newItem = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim(),
            permissions
        };

        if (editIndex !== null) {
            settings.groupRoles[editIndex] = newItem;
        } else {
            settings.groupRoles.push(newItem);
        }

        saveSettings(settings);
        showAlert('Role saved with permissions!');
        renderListView('groupRoles', 'Group Roles');
    };
}

// === ASSET CATEGORIES ===
function renderAssetCategoryForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.assetCategories[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Add'} Asset Category</h1>
            <form id="asset-form">
                <div class="form-group">
                    <label class="required-label">Group Asset Category Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Group Asset Category Description</label>
                    <textarea id="description" rows="3">${item.description || ''}</textarea>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('assetCategories', 'Asset Categories')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('asset-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim()
        };

        if (editIndex !== null) {
            settings.assetCategories[editIndex] = newItem;
        } else {
            settings.assetCategories.push(newItem);
        }

        saveSettings(settings);
        showAlert('Asset category saved!');
        renderListView('assetCategories', 'Asset Categories');
    };
}

// === INCOME CATEGORIES ===
function renderIncomeCategoryForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.incomeCategories[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Income Category</h1>
            <form id="income-form">
                <div class="form-group">
                    <label class="required-label">Income Category Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="description" rows="3">${item.description || ''}</textarea>
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderListView('incomeCategories', 'Income Categories')">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('income-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim()
        };

        if (editIndex !== null) {
            settings.incomeCategories[editIndex] = newItem;
        } else {
            settings.incomeCategories.push(newItem);
        }

        saveSettings(settings);
        showAlert('Income category saved!');
        renderListView('incomeCategories', 'Income Categories');
    };
}

// === ACCOUNTS DASHBOARD ===
function renderAccountsDashboard() {
    document.getElementById('main-content').innerHTML = `
        <div class="settings-page">
            <h1>Accounts Management</h1>
            <p class="subtitle">Add and manage Petty Cash, Mobile Money, and Bank Accounts</p>

            <div class="settings-grid">
                <div class="section-card nav-card" onclick="renderPettyCashForm()">
                    <h3>Petty Cash Account</h3>
                    <p class="help-text">Manage cash held at office or safe.</p>
                </div>
                <div class="section-card nav-card" onclick="renderMobileMoneyForm()">
                    <h3>Mobile Money Account</h3>
                    <p class="help-text">M-Pesa Till, Airtel Money, etc.</p>
                </div>
                <div class="section-card nav-card" onclick="renderBankAccountForm()">
                    <h3>Bank Account</h3>
                    <p class="help-text">Equity, Co-op, KCB, etc.</p>
                </div>
            </div>
            <button class="submit-btn" style="background:#6c757d; margin-top:20px;" onclick="renderSettings()">
                ← Back to Settings
            </button>
        </div>
    `;
}

// Petty Cash
function renderPettyCashForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.accounts.pettyCash[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Petty Cash Account</h1>
            <form id="petty-form">
                <div class="form-group">
                    <label class="required-label">Petty Cash Account Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Initial Balance (KES)</label>
                    <input type="number" id="balance" value="${item.balance || '0'}" min="0">
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderAccountsDashboard()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('petty-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim(),
            balance: parseFloat(document.getElementById('balance').value) || 0
        };

        if (editIndex !== null) {
            settings.accounts.pettyCash[editIndex] = newItem;
        } else {
            settings.accounts.pettyCash.push(newItem);
        }

        saveSettings(settings);
        showAlert('Petty cash account saved!');
        renderAccountsDashboard();
    };
}

// Mobile Money
function renderMobileMoneyForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.accounts.mobileMoney[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Mobile Money Account</h1>
            <form id="mobile-form">
                <div class="form-group">
                    <label class="required-label">Mobile Money Account Name</label>
                    <input type="text" id="name" value="${item.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Mobile Money Provider Name</label>
                    <input type="text" id="provider" value="${item.provider || ''}" required placeholder="e.g. Safaricom M-Pesa">
                </div>
                <div class="form-group">
                    <label class="required-label">Account Number / Till Number / Phone Number</label>
                    <input type="text" id="number" value="${item.number || ''}" required>
                </div>
                <div class="form-group">
                    <label>Initial Balance (KES)</label>
                    <input type="number" id="balance" value="${item.balance || '0'}" min="0">
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderAccountsDashboard()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('mobile-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('name').value.trim(),
            provider: document.getElementById('provider').value.trim(),
            number: document.getElementById('number').value.trim(),
            balance: parseFloat(document.getElementById('balance').value) || 0
        };

        if (editIndex !== null) {
            settings.accounts.mobileMoney[editIndex] = newItem;
        } else {
            settings.accounts.mobileMoney.push(newItem);
        }

        saveSettings(settings);
        showAlert('Mobile money account saved!');
        renderAccountsDashboard();
    };
}

// Bank Account
function renderBankAccountForm(editIndex = null) {
    const settings = loadSettings();
    const item = editIndex !== null ? settings.accounts.bank[editIndex] : {};

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>${editIndex !== null ? 'Edit' : 'Create'} Group Bank Account</h1>
            <form id="bank-form">
                <div class="form-group">
                    <label class="required-label">Bank Name</label>
                    <input type="text" id="bankName" value="${item.bankName || ''}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Branch</label>
                    <input type="text" id="branch" value="${item.branch || ''}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Account Name</label>
                    <input type="text" id="accountName" value="${item.accountName || ''}" required>
                </div>
                <div class="form-group">
                    <label class="required-label">Account Number</label>
                    <input type="text" id="accountNumber" value="${item.accountNumber || ''}" required>
                </div>
                <div class="form-group">
                    <label>Initial Bank Balance (KES)</label>
                    <input type="number" id="balance" value="${item.balance || '0'}" min="0">
                </div>
                <div class="form-group">
                    <label>Account Password (for reference only)</label>
                    <input type="password" id="password" placeholder="Not stored securely">
                </div>
                <div style="margin-top:30px;">
                    <button type="submit" class="submit-btn">Save</button>
                    <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderAccountsDashboard()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('bank-form').onsubmit = (e) => {
        e.preventDefault();
        const newItem = {
            bankName: document.getElementById('bankName').value.trim(),
            branch: document.getElementById('branch').value.trim(),
            accountName: document.getElementById('accountName').value.trim(),
            accountNumber: document.getElementById('accountNumber').value.trim(),
            balance: parseFloat(document.getElementById('balance').value) || 0
            // Password not saved
        };

        if (editIndex !== null) {
            settings.accounts.bank[editIndex] = newItem;
        } else {
            settings.accounts.bank.push(newItem);
        }

        saveSettings(settings);
        showAlert('Bank account saved!');
        renderAccountsDashboard();
    };
}

// === ROUTING ===
export function initSettingsModule() {
    const hash = window.location.hash.slice(1);

    if (hash === 'settings') {
        renderSettings();
    } else if (hash === 'settings-contributions') {
        renderListView('contributionTypes', 'Contribution Types');
    } else if (hash === 'settings-invoices') {
        renderListView('invoiceTemplates', 'Invoice Templates');
    } else if (hash === 'settings-expenses') {
        renderListView('expenseCategories', 'Expense Categories');
    } else if (hash === 'settings-fines') {
        renderListView('fineCategories', 'Fine Categories');
    } else if (hash === 'settings-roles') {
        renderListView('groupRoles', 'Group Roles');
    } else if (hash === 'settings-assets') {
        renderListView('assetCategories', 'Asset Categories');
    } else if (hash === 'settings-income') {
        renderListView('incomeCategories', 'Income Categories');
    } else if (hash === 'settings-accounts') {
        renderAccountsDashboard();
    } else {
        renderSettings();
    }
}

window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#settings')) {
        initSettingsModule();
    }
});
