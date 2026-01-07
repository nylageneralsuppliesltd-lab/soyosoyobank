// js/modules/members.js - Complete Members Module (Modern ES6 Exports)

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { renderMembersTable, renderCreateMemberForm } from './ui.js';

let members = loadMembers();

// ======================
// VALIDATION HELPERS
// ======================

function isValidKenyanPhone(phone) {
    phone = phone.trim().replace(/\s+/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+254')) phone = '254' + phone.slice(4);
    else if (!phone.startsWith('254')) return false;
    return /^254(7[0-9]|1[0-9])\d{7}$/.test(phone);
}

function isValidEmail(email) {
    if (!email.trim()) return true;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

// ======================
// CREATE MEMBER FORM
// ======================

export function renderCreateMemberForm() {
    document.getElementById('main-content').innerHTML = renderCreateMemberForm();

    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    const addNokBtn = document.getElementById('add-nok');
    const nokContainer = document.getElementById('nok-container');

    // Custom role toggle
    roleSelect.addEventListener('change', () => {
        customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
    });

    // Add nominee (max 3)
    let nokCount = 0;
    addNokBtn.addEventListener('click', () => {
        if (nokCount >= 3) {
            showAlert('Maximum of 3 nominees allowed.');
            return;
        }
        nokCount++;

        const entry = document.createElement('div');
        entry.className = 'nok-entry';
        entry.innerHTML = `
            <h4 style="margin-top:20px;">Nominee ${nokCount}</h4>
            <div class="form-group"><label class="required-label">Name</label><input type="text" class="nok-name" required></div>
            <div class="form-group"><label class="required-label">Relationship</label><input type="text" class="nok-relationship" required placeholder="e.g. Spouse, Child"></div>
            <div class="form-group"><label class="required-label">ID No.</label><input type="text" class="nok-id" required></div>
            <div class="form-group"><label class="required-label">Mobile Number</label><input type="tel" class="nok-phone" required></div>
            <div class="form-group"><label class="required-label">Percentage Allocation %</label><input type="number" class="nok-share" min="1" max="100" step="1" required></div>
            <button type="button" style="background:#dc3545;color:#fff;padding:8px 12px;margin-top:10px;border:none;border-radius:6px;">
                Remove Nominee
            </button>
        `;
        entry.querySelector('button').addEventListener('click', () => {
            entry.remove();
            nokCount--;
        });
        nokContainer.appendChild(entry);
    });

    // Form submission
    document.getElementById('create-member-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleMemberSubmit(null); // null = create new
    });
}

// ======================
// EDIT MEMBER FORM
// ======================

export function renderEditMemberForm(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Member not found.');
        return;
    }

    renderCreateMemberForm(); // Reuse same form HTML

    // Pre-fill fields
    document.getElementById('full-name').value = member.name || '';
    document.getElementById('id-number').value = member.idNumber || '';
    document.getElementById('dob').value = member.dob || '';
    document.getElementById('phone').value = member.phone || '';
    document.getElementById('email').value = member.email || '';
    document.getElementById('physical-address').value = member.physicalAddress || '';
    document.getElementById('town').value = member.town || '';

    if (member.gender) {
        const radio = document.querySelector(`input[name="gender"][value="${member.gender}"]`);
        if (radio) radio.checked = true;
    }
    if (member.employmentStatus) {
        const radio = document.querySelector(`input[name="employment-status"][value="${member.employmentStatus}"]`);
        if (radio) radio.checked = true;
    }

    document.getElementById('employer-name').value = member.employerName || '';
    document.getElementById('reg-no').value = member.regNo || '';
    document.getElementById('employer-address').value = member.employerAddress || '';

    // Role
    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    const predefinedRoles = ['Member', 'Admin', 'Chairman', 'Vice Chairman', 'Secretary', 'Treasurer'];
    if (predefinedRoles.includes(member.role)) {
        roleSelect.value = member.role;
        customGroup.style.display = 'none';
    } else {
        roleSelect.value = 'Other';
        customGroup.style.display = 'block';
        document.getElementById('custom-role').value = member.role || '';
    }

    // Introducer
    document.getElementById('introducer-name').value = member.introducerName || '';
    document.getElementById('introducer-member-no').value = member.introducerMemberNo || '';

    // Nominees
    const nokContainer = document.getElementById('nok-container');
    nokContainer.innerHTML = '';
    let nokCount = 0;
    if (member.nextOfKin && member.nextOfKin.length > 0) {
        member.nextOfKin.forEach(nok => {
            nokCount++;
            const entry = document.createElement('div');
            entry.className = 'nok-entry';
            entry.innerHTML = `
                <h4 style="margin-top:20px;">Nominee ${nokCount}</h4>
                <div class="form-group"><label class="required-label">Name</label><input type="text" class="nok-name" value="${nok.name}" required></div>
                <div class="form-group"><label class="required-label">Relationship</label><input type="text" class="nok-relationship" value="${nok.relationship || ''}" required></div>
                <div class="form-group"><label class="required-label">ID No.</label><input type="text" class="nok-id" value="${nok.id || ''}" required></div>
                <div class="form-group"><label class="required-label">Mobile Number</label><input type="tel" class="nok-phone" value="${nok.phone}" required></div>
                <div class="form-group"><label class="required-label">Percentage Allocation %</label><input type="number" class="nok-share" value="${nok.share}" min="1" max="100" step="1" required></div>
                <button type="button" style="background:#dc3545;color:#fff;padding:8px 12px;margin-top:10px;border:none;border-radius:6px;">
                    Remove Nominee
                </button>
            `;
            entry.querySelector('button').addEventListener('click', () => entry.remove());
            nokContainer.appendChild(entry);
        });
    }

    // Change button text
    document.querySelector('#create-member-form button[type="submit"]').textContent = 'Update Member';

    // Override submit for update
    document.getElementById('create-member-form').onsubmit = (e) => {
        e.preventDefault();
        handleMemberSubmit(memberId); // pass ID = update
    };
}

// ======================
// SHARED SUBMIT HANDLER (Create & Update)
// ======================

function handleMemberSubmit(memberId = null) {
    const isEdit = memberId !== null;
    const member = isEdit ? members.find(m => m.id === memberId) : null;

    const name = document.getElementById('full-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !phone) {
        showAlert('Full Name and Phone Number are required!');
        return;
    }

    if (!isValidKenyanPhone(phone)) {
        showAlert('Invalid phone number. Use 07xx, +2547xx or 2547xx format.');
        return;
    }

    if (email && !isValidEmail(email)) {
        showAlert('Invalid email address.');
        return;
    }

    // Check duplicate phone (except for current member in edit mode)
    if (members.some(m => m.id !== memberId && m.phone === phone)) {
        showAlert('A member with this phone number already exists!');
        return;
    }

    // Role
    const roleSelect = document.getElementById('role');
    const roleValue = roleSelect.value;
    const customRole = document.getElementById('custom-role').value.trim();
    const finalRole = roleValue === 'Other' ? customRole : roleValue;
    if (roleValue === 'Other' && !customRole) {
        showAlert('Please enter a custom role name.');
        return;
    }

    // Introducer
    const introducerName = document.getElementById('introducer-name').value.trim();
    const introducerNo = document.getElementById('introducer-member-no').value.trim();
    if (!introducerName || !introducerNo) {
        showAlert('Introducer Name and Member No. are required.');
        return;
    }

    // Nominees
    const nokEntries = document.querySelectorAll('.nok-entry');
    let nextOfKin = [];
    let totalShare = 0;

    if (nokEntries.length > 0) {
        for (const entry of nokEntries) {
            const nokName = entry.querySelector('.nok-name').value.trim();
            const nokRelationship = entry.querySelector('.nok-relationship').value.trim();
            const nokId = entry.querySelector('.nok-id').value.trim();
            const nokPhone = entry.querySelector('.nok-phone').value.trim();
            const shareInput = entry.querySelector('.nok-share').value;
            const share = parseFloat(shareInput);

            if (!nokName || !nokRelationship || !nokId || !nokPhone || !shareInput) {
                showAlert('All fields for added nominees are required.');
                return;
            }

            if (!isValidKenyanPhone(nokPhone)) {
                showAlert('Invalid mobile number for nominee.');
                return;
            }

            if (isNaN(share) || share < 1 || share > 100) {
                showAlert('Percentage must be between 1 and 100.');
                return;
            }

            totalShare += share;
            nextOfKin.push({ name: nokName, relationship: nokRelationship, id: nokId, phone: nokPhone, share });
        }

        if (Math.abs(totalShare - 100) > 0.01) {
            showAlert(`Nominee percentages must total 100%. Current: ${totalShare.toFixed(1)}%`);
            return;
        }
    }

    // Create or update member object
    const memberData = {
        name,
        phone,
        email: email || null,
        idNumber: document.getElementById('id-number').value.trim() || null,
        gender: document.querySelector('input[name="gender"]:checked')?.value || null,
        dob: document.getElementById('dob').value || null,
        role: finalRole || 'Member',
        physicalAddress: document.getElementById('physical-address')?.value.trim() || null,
        town: document.getElementById('town')?.value.trim() || null,
        employmentStatus: document.querySelector('input[name="employment-status"]:checked')?.value || null,
        employerName: document.getElementById('employer-name')?.value.trim() || null,
        regNo: document.getElementById('reg-no')?.value.trim() || null,
        employerAddress: document.getElementById('employer-address')?.value.trim() || null,
        introducerName,
        introducerMemberNo: introducerNo,
        nextOfKin: nextOfKin.length > 0 ? nextOfKin : null,
        balance: isEdit ? member.balance : 0,
        ledger: isEdit ? member.ledger : [],
        active: isEdit ? member.active : true
    };

    if (isEdit) {
        Object.assign(member, memberData);
    } else {
        memberData.id = Date.now();
        members.push(memberData);
    }

    saveMembers(members);
    showAlert(isEdit ? 'Member updated successfully!' : 'Member registered successfully!');
    renderMembersList();
}

// ======================
// MEMBERS LIST
// ======================

export function renderMembersList() {
    members = loadMembers(); // Refresh
    document.getElementById('main-content').innerHTML = renderMembersTable(members);
}

// ======================
// LEDGER VIEW
// ======================

export function renderMemberLedger(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Member not found.');
        return;
    }

    let contributions = 0;
    let loansOut = 0;
    member.ledger.forEach(tx => {
        if (['Deposit', 'Share Contribution', 'Loan Repayment', 'Contribution'].includes(tx.type)) {
            contributions += tx.amount;
        }
        if (tx.type === 'Loan Disbursement') loansOut += tx.amount;
    });

    document.getElementById('main-content').innerHTML = `
        <h1>Ledger - ${member.name}</h1>
        <p class="subtitle">
            Status: ${member.active ? '<span style="color:#28a745">Active</span>' : '<span style="color:#dc3545">Suspended</span>'} | 
            Contributions: ${formatCurrency(contributions)} | 
            Loans Out: ${formatCurrency(loansOut)} | 
            Balance: ${formatCurrency(member.balance)}
        </p>
        <div class="table-container">
            <table class="members-table">
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr></thead>
                <tbody>
                    ${member.ledger.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No transactions yet</td></tr>' : 
                     member.ledger.map(tx => `
                        <tr>
                            <td>${new Date(tx.date).toLocaleDateString('en-GB')}</td>
                            <td>${tx.type}</td>
                            <td>${formatCurrency(tx.amount)}</td>
                            <td>${tx.description || '-'}</td>
                            <td>${formatCurrency(tx.balanceAfter)}</td>
                        </tr>
                     `).join('')}
                </tbody>
            </table>
        </div>
        <button class="submit-btn" style="margin-top:20px;" onclick="alert('Transaction recording is done via Deposits/Loans modules')">
            Add Transaction (via Deposits/Loans)
        </button>
        <button class="submit-btn" style="background:#6c757d;margin-left:10px;" onclick="renderMembersList()">
            Back to Members List
        </button>
    `;
}

// ======================
// SUSPEND / REACTIVATE
// ======================

export function suspendMember(memberId) {
    if (confirm('Suspend this member? They will no longer be able to transact.')) {
        const member = members.find(m => m.id === memberId);
        if (member) {
            member.active = false;
            saveMembers(members);
            showAlert('Member suspended.');
            renderMembersList();
        }
    }
}

export function reactivateMember(memberId) {
    if (confirm('Reactivate this member?')) {
        const member = members.find(m => m.id === memberId);
        if (member) {
            member.active = true;
            saveMembers(members);
            showAlert('Member reactivated.');
            renderMembersList();
        }
    }
}

// ======================
// EXPORT / IMPORT CSV
// ======================

export function exportMembersToCSV() {
    if (members.length === 0) {
        showAlert('No members to export.');
        return;
    }

    const enriched = members.map(m => {
        let contributions = 0;
        let loansOut = 0;
        m.ledger.forEach(tx => {
            if (['Deposit', 'Share Contribution', 'Loan Repayment', 'Contribution'].includes(tx.type)) contributions += tx.amount;
            if (tx.type === 'Loan Disbursement') loansOut += tx.amount;
        });
        return { ...m, contributions, loansOut };
    });

    const headers = ['Name','Phone','Email','ID Number','Role','Introducer Name','Introducer Member No.','Contributions','Loans Out','Balance','Status'];
    const rows = enriched.map(m => [
        m.name,
        m.phone,
        m.email || '',
        m.idNumber || '',
        m.role,
        m.introducerName || '',
        m.introducerMemberNo || '',
        m.contributions,
        m.loansOut,
        m.balance,
        m.active ? 'Active' : 'Suspended'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${(field + '').replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'soyosoyo_members.csv';
    link.click();
    URL.revokeObjectURL(url);

    showAlert('Members exported successfully!');
}

export function importMembers(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            showAlert('CSV is empty or invalid.');
            return;
        }

        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') inQuotes = !inQuotes;
                else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const headerRow = parseCSVLine(lines[0]);
        const headers = headerRow.map(h => h.toLowerCase());

        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;

            const row = {};
            headers.forEach((h, idx) => row[h] = values[idx] || '');

            const name = row['name']?.trim();
            const phone = row['phone']?.trim();
            if (!name || !phone || !isValidKenyanPhone(phone)) continue;
            if (members.some(m => m.phone === phone)) continue;

            members.push({
                id: Date.now() + imported,
                name,
                phone,
                email: row['email'] || null,
                idNumber: row['id number'] || null,
                role: row['role'] || 'Member',
                introducerName: row['introducer name'] || null,
                introducerMemberNo: row['introducer member no.'] || null,
                nextOfKin: null,
                balance: 0,
                ledger: [],
                active: true
            });
            imported++;
        }

        saveMembers(members);
        showAlert(`${imported} members imported successfully!`);
        renderMembersList();
    };
    reader.readAsText(file);
}

// ======================
// MODULE INITIALIZATION
// ======================

export function initMembersModule() {
    // Optional: any setup code
    console.log('Members module initialized');
}
