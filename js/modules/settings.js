// js/modules/settings.js - Fully Customizable Settings (All Categories + Your Original Code Preserved)

import { getItem, setItem } from '../storage.js';
import { showAlert } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

// === YOUR ORIGINAL HELPER FUNCTIONS (KEEP THESE!) ===
export function loadSettings() {
    let settings = getItem('settings');

    if (!settings) {
        settings = {
            accountManagers: [],
            accounts: [],
            contributionTypes: [],
            invoices: [],
            expenseCategories: [],
            fineCategories: [],
            groupRoles: [],
            assetCategories: [],
            incomeCategories: []
        };
        setItem('settings', settings);

        // Welcome message (shown only once)
        setTimeout(() => {
            showAlert(
                'Welcome to Settings! Define your SACCO structure: add contribution types, income sources, expense categories, bank accounts, and more.',
                'info',
                8000
            );
        }, 500);
    }

    return settings;
}

export function saveSettings(settings) {
    setItem('settings', settings);
}

// === MAIN SETTINGS DASHBOARD ===
export function renderSettings() {
    document.getElementById('main-content').innerHTML = `
        <div class="settings-page">
            <h1>Settings & Configuration</h1>
            <p class="subtitle">Click any card to add or manage items. All changes save automatically.</p>

            <div class="settings-grid">
                <!-- Account Managers -->
                <div class="section-card nav-card" onclick="loadSection('settings-account-managers')">
                    <h3>Account Managers</h3>
                    <p class="help-text">Add treasurers, secretaries, etc.</p>
                </div>

                <!-- Bank & eWallet Accounts -->
                <div class="section-card nav-card" onclick="loadSection('settings-accounts')">
                    <h3>Bank & eWallet Accounts</h3>
                    <p class="help-text">Track balances in Equity, M-Pesa, etc.</p>
                </div>

                <!-- Contribution Types -->
                <div class="section-card nav-card" onclick="loadSection('settings-contributions')">
                    <h3>Contribution Types</h3>
                    <p class="help-text">Monthly Shares, Registration Fee, etc.</p>
                </div>

                <!-- Invoice Templates -->
                <div class="section-card nav-card" onclick="loadSection('settings-invoices')">
                    <h3>Invoice Templates</h3>
                    <p class="help-text">Customize invoice formats</p>
                </div>

                <!-- Expense Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-expenses')">
                    <h3>Expense Categories</h3>
                    <p class="help-text">Rent, Salaries, Utilities, etc.</p>
                </div>

                <!-- Fine Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-fines')">
                    <h3>Fine Categories</h3>
                    <p class="help-text">Late Payment, Meeting Absence, etc.</p>
                </div>

                <!-- Group Roles -->
                <div class="section-card nav-card" onclick="loadSection('settings-roles')">
                    <h3>Group Roles</h3>
                    <p class="help-text">Chairman, Secretary, Treasurer, etc.</p>
                </div>

                <!-- Asset Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-assets')">
                    <h3>Asset Categories</h3>
                    <p class="help-text">Land, Vehicles, Equipment, etc.</p>
                </div>

                <!-- Income Categories -->
                <div class="section-card nav-card" onclick="loadSection('settings-income')">
                    <h3>Income Categories</h3>
                    <p class="help-text">Interest, Donations, Fines, etc.</p>
                </div>
            </div>

            <div class="save-note">
                <strong>✓ All changes are saved automatically</strong>
            </div>
        </div>
    `;
}

// === Generic List View (Edit & Delete) ===
function renderListView(key, title, fields = ['name']) {
    const settings = loadSettings();
    const items = settings[key];

    document.getElementById('main-content').innerHTML = `
        <h1>${title}</h1>
        <p class="subtitle">Total: ${items.length}</p>

        <button class="submit-btn" style="background:#28a745;" onclick="renderAddForm('${key}', '${title}')">
            + Add New ${title.slice(0, -1)}
        </button>
        <button class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderSettings()">
            Back to Settings
        </button>

        ${items.length === 0 ? 
            '<p style="color:#999; margin-top:20px;">No items yet. Click "+ Add New" to create one.</p>' :
            `
            <div class="table-container" style="margin-top:20px;">
                <table class="members-table">
                    <thead>
                        <tr>
                            ${fields.map(f => `<th>${f.charAt(0).toUpperCase() + f.slice(1)}</th>`).join('')}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, index) => `
                            <tr>
                                ${fields.map(field => `
                                    <td>
                                        <input type="${field.includes('amount') || field === 'balance' ? 'number' : 'text'}"
                                               value="${item[field] || ''}"
                                               data-section="${key}"
                                               data-index="${index}"
                                               data-field="${field}"
                                               class="edit-input"
                                               style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px;">
                                    </td>
                                `).join('')}
                                <td>
                                    <button class="btn btn-danger btn-sm" data-section="${key}" data-index="${index}">Remove</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            `
        }
    `;

    // Auto-save on edit
    document.querySelectorAll('.edit-input').forEach(input => {
        input.addEventListener('change', () => {
            const section = input.dataset.section;
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            let value = input.value.trim();

            if (input.type === 'number') {
                value = value === '' ? null : parseFloat(value);
                if (isNaN(value)) value = null;
            }

            const settings = loadSettings();
            if (settings[section][index]) {
                settings[section][index][field] = value;
                saveSettings(settings);
            }
        });
    });

    // Remove item
    document.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Delete this item?')) {
                const section = btn.dataset.section;
                const index = parseInt(btn.dataset.index);
                const settings = loadSettings();
                settings[section].splice(index, 1);
                saveSettings(settings);
                renderListView(section, title, fields);
            }
        });
    });
}

// === Generic Add Form ===
function renderAddForm(key, title) {
    const fieldConfig = {
        accountManagers: ['name', 'role', 'phone', 'email'],
        accounts: ['name', 'bankName', 'accountNumber', 'balance'],
        contributionTypes: ['name', 'defaultAmount'],
        invoices: ['templateName', 'description'],
        expenseCategories: ['name'],
        fineCategories: ['name', 'defaultAmount'],
        groupRoles: ['name', 'description'],
        assetCategories: ['name'],
        incomeCategories: ['name']
    };

    const fields = fieldConfig[key] || ['name'];

    document.getElementById('main-content').innerHTML = `
        <div class="form-card">
            <h1>Add New ${title.slice(0, -1)}</h1>
            <form id="add-form">
                ${fields.map(field => `
                    <div class="form-group">
                        <label class="required-label">${field.charAt(0).toUpperCase() + field.slice(1).replace('Amount', ' Amount')}</label>
                        <input type="${field.includes('Amount') || field === 'balance' ? 'number' : 'text'}"
                               id="${field}"
                               ${field === 'name' || field === 'templateName' ? 'required' : ''}
                               placeholder="${field === 'balance' ? '0' : ''}">
                    </div>
                `).join('')}
                <button type="submit" class="submit-btn">Save ${title.slice(0, -1)}</button>
                <button type="button" class="submit-btn" style="background:#6c757d; margin-left:10px;" onclick="renderSettings()">
                    Cancel
                </button>
            </form>
        </div>
    `;

    document.getElementById('add-form').onsubmit = (e) => {
        e.preventDefault();
        const settings = loadSettings();
        const newItem = {};
        fields.forEach(field => {
            const value = document.getElementById(field).value.trim();
            newItem[field] = field.includes('Amount') || field === 'balance' 
                ? (value === '' ? 0 : parseFloat(value)) 
                : value;
        });
        settings[key].push(newItem);
        saveSettings(settings);
        showAlert(`${title.slice(0, -1)} added successfully!`, 'success');
        renderListView(key, title, fields);
    };
}

// === Routing for All Settings Sub-Views ===
export function initSettingsModule() {
    const hash = window.location.hash.slice(1);

    if (hash === 'settings') {
        renderSettings();
        return;
    }

    const map = {
        'settings-account-managers': { key: 'accountManagers', title: 'Account Managers', fields: ['name', 'role', 'phone', 'email'] },
        'settings-accounts': { key: 'accounts', title: 'Bank & eWallet Accounts', fields: ['name', 'bankName', 'accountNumber', 'balance'] },
        'settings-contributions': { key: 'contributionTypes', title: 'Contribution Types', fields: ['name', 'defaultAmount'] },
        'settings-invoices': { key: 'invoices', title: 'Invoice Templates', fields: ['templateName', 'description'] },
        'settings-expenses': { key: 'expenseCategories', title: 'Expense Categories', fields: ['name'] },
        'settings-fines': { key: 'fineCategories', title: 'Fine Categories', fields: ['name', 'defaultAmount'] },
        'settings-roles': { key: 'groupRoles', title: 'Group Roles', fields: ['name', 'description'] },
        'settings-assets': { key: 'assetCategories', title: 'Asset Categories', fields: ['name'] },
        'settings-income': { key: 'incomeCategories', title: 'Income Categories', fields: ['name'] }
    };

    const config = map[hash];
    if (config) {
        renderListView(config.key, config.title, config.fields);
    }
}

// Listen for navigation changes
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#settings')) {
        initSettingsModule();
    }
});
