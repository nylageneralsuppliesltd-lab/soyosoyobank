// js/modules/settings.js - Fully Customizable Settings (User-Defined Only)

import { getItem, setItem } from '../storage.js';
import { showAlert } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function loadSettings() {
    let settings = getItem('settings');

    if (!settings) {
        // Start with EMPTY arrays — user defines everything
        settings = {
            contributionTypes: [],
            incomeTypes: [],
            expenseCategories: [],
            bankAccounts: []
        };
        setItem('settings', settings);
        // Show welcome message only once
        setTimeout(() => {
            showAlert(
                'Welcome to Settings! Add your own contribution types, income sources, expense categories, and bank accounts below.',
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

export function renderSettings() {
    const settings = loadSettings();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="settings-page">
            <h1>Settings & Configuration</h1>
            <p class="subtitle">Define your SACCO's financial structure. All items below are fully customizable.</p>

            <div class="settings-grid">

                <!-- Contribution Types -->
                <div class="section-card">
                    <h3>Contribution Types</h3>
                    <p class="help-text">e.g., Monthly Shares, Registration Fee, Building Fund, Education Fund</p>
                    <div id="contribution-types" class="items-list">
                        ${settings.contributionTypes.length === 0 
                            ? '<p style="color:#666; font-style:italic;">No contribution types yet. Click "+ Add" to create one.</p>' 
                            : ''
                        }
                    </div>
                    <button class="btn btn-primary btn-sm" id="add-contribution">
                        + Add Contribution Type
                    </button>
                </div>

                <!-- Other Income Types -->
                <div class="section-card">
                    <h3>Other Income Types</h3>
                    <p class="help-text">e.g., Fines, Interest Received, Donations, Sale of Assets</p>
                    <div id="income-types" class="items-list">
                        ${settings.incomeTypes.length === 0 
                            ? '<p style="color:#666; font-style:italic;">No income types yet. Click "+ Add" to create one.</p>' 
                            : ''
                        }
                    </div>
                    <button class="btn btn-primary btn-sm" id="add-income">
                        + Add Income Type
                    </button>
                </div>

                <!-- Expense Categories -->
                <div class="section-card">
                    <h3>Expense Categories</h3>
                    <p class="help-text">e.g., Rent, Salaries, Stationery, Transport, Loan Losses</p>
                    <div id="expense-categories" class="items-list">
                        ${settings.expenseCategories.length === 0 
                            ? '<p style="color:#666; font-style:italic;">No expense categories yet. Click "+ Add" to create one.</p>' 
                            : ''
                        }
                    </div>
                    <button class="btn btn-primary btn-sm" id="add-expense">
                        + Add Expense Category
                    </button>
                </div>

                <!-- Bank & eWallet Accounts -->
                <div class="section-card">
                    <h3>Bank & eWallet Accounts</h3>
                    <p class="help-text">Track cash in different accounts (e.g., Equity Bank, M-Pesa, Cash Tin)</p>
                    <div id="bank-accounts" class="items-list">
                        ${settings.bankAccounts.length === 0 
                            ? '<p style="color:#666; font-style:italic;">No accounts yet. Click "+ Add" to create one.</p>' 
                            : ''
                        }
                    </div>
                    <button class="btn btn-primary btn-sm" id="add-bank">
                        + Add Bank / eWallet Account
                    </button>
                </div>

            </div>

            <div class="save-note">
                <strong>✓ All changes are saved automatically</strong>
            </div>
        </div>
    `;

    // Render current items
    renderList('contribution-types', settings.contributionTypes, ['name', 'defaultAmount'], 'contributionTypes');
    renderList('income-types', settings.incomeTypes, ['name'], 'incomeTypes');
    renderList('expense-categories', settings.expenseCategories, ['name'], 'expenseCategories');
    renderList('bank-accounts', settings.bankAccounts, ['name', 'balance'], 'bankAccounts');

    // Attach button listeners
    document.getElementById('add-contribution')?.addEventListener('click', () => addItem('contributionTypes', { name: 'New Contribution', defaultAmount: 1000 }));
    document.getElementById('add-income')?.addEventListener('click', () => addItem('incomeTypes', { name: 'New Income Source' }));
    document.getElementById('add-expense')?.addEventListener('click', () => addItem('expenseCategories', { name: 'New Expense Category' }));
    document.getElementById('add-bank')?.addEventListener('click', () => addItem('bankAccounts', { name: 'New Account', balance: 0 }));
}

function renderList(containerId, items, fields, section) {
    const container = document.getElementById(containerId);
    if (items.length === 0) return;

    container.innerHTML = items.map((item, index) => `
        <div class="form-group inline-edit">
            <input type="text" value="${item.name}" data-index="${index}" data-field="name" data-section="${section}" placeholder="Name">
            ${fields.includes('defaultAmount') ? `
                <input type="number" value="${item.defaultAmount || ''}" placeholder="Default Amount" data-index="${index}" data-field="defaultAmount" data-section="${section}" style="width:140px;">
            ` : ''}
            ${fields.includes('balance') ? `
                <input type="number" value="${item.balance || 0}" data-index="${index}" data-field="balance" data-section="${section}" style="width:140px;" placeholder="Current Balance">
            ` : ''}
            <button class="btn btn-danger btn-sm" data-index="${index}" data-section="${section}">Remove</button>
        </div>
    `).join('');

    // Attach remove listeners
    container.querySelectorAll('button.btn-danger').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const section = btn.dataset.section;
            removeItem(section, index);
        });
    });
}

function addItem(section, defaultItem) {
    const settings = loadSettings();
    settings[section].push(defaultItem);
    saveSettings(settings);
    renderSettings();
    showAlert('New item added! You can now edit it.', 'success');
}

function removeItem(section, index) {
    const settings = loadSettings();
    settings[section].splice(index, 1);
    saveSettings(settings);
    renderSettings();
    showAlert('Item removed', 'info');
}

// Auto-save on input change
document.addEventListener('input', (e) => {
    if (e.target.matches('input[data-section]')) {
        const section = e.target.dataset.section;
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;

        let value;
        if (e.target.type === 'number') {
            value = e.target.value === '' ? null : parseFloat(e.target.value);
            if (isNaN(value)) value = null;
        } else {
            value = e.target.value.trim();
        }

        const settings = loadSettings();
        if (settings[section][index]) {
            settings[section][index][field] = value;
            saveSettings(settings);
        }
    }
});
