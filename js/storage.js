// js/storage.js - Central LocalStorage Manager with Named Exports

// Storage keys for different data types
const STORAGE_KEYS = {
    members: 'soyoMembers',        // Legacy key for backward compatibility
    deposits: 'soyoDeposits',
    expenses: 'soyoExpenses',
    loans: 'soyoLoans',
    settings: 'soyoSettings'
};

// Generic low-level functions (used by all modules)
export function getItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading "${key}" from localStorage:`, error);
        return null;
    }
}

export function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving "${key}" to localStorage:`, error);
        alert('Storage full or blocked. Could not save data.');
    }
}

// === Members ===
export function loadMembers() {
    const members = getItem(STORAGE_KEYS.members);
    return Array.isArray(members) ? members : [];
}

export function saveMembers(members) {
    setItem(STORAGE_KEYS.members, members);
}

// === Deposits ===
export function loadDeposits() {
    const deposits = getItem(STORAGE_KEYS.deposits);
    return Array.isArray(deposits) ? deposits : [];
}

export function saveDeposits(deposits) {
    setItem(STORAGE_KEYS.deposits, deposits);
}

// === Expenses ===
export function loadExpenses() {
    const expenses = getItem(STORAGE_KEYS.expenses);
    return Array.isArray(expenses) ? expenses : [];
}

export function saveExpenses(expenses) {
    setItem(STORAGE_KEYS.expenses, expenses);
}

// === Loans (Future-proof) ===
export function loadLoans() {
    const loans = getItem(STORAGE_KEYS.loans);
    return Array.isArray(loans) ? loans : [];
}

export function saveLoans(loans) {
    setItem(STORAGE_KEYS.loans, loans);
}

// === Settings ===
export function loadSettings() {
    return getItem(STORAGE_KEYS.settings) || null;
}

export function saveSettings(settings) {
    setItem(STORAGE_KEYS.settings, settings);
}

// === Utility: Clear all app data (for testing/reset) ===
export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    console.log('All SoyoSoyo SACCO data cleared from localStorage');
    alert('All data has been reset. Page will reload.');
    location.reload();
}

// Optional: Export keys for advanced use
export { STORAGE_KEYS };
