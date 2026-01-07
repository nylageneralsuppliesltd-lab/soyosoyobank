// js/utils/helpers.js
export function formatCurrency(amount) {
    return 'KSh ' + Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0 });
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB');
}

export function showAlert(message, type = 'success') {
    alert(message); // Can upgrade to nice toast later
}
export function showAlert(message) {
    alert(message); // Simple for now - can upgrade to modal later
}
