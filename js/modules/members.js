// js/modules/members.js - Enhanced with validation & multiple NOK

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';
import { renderMembersTable, renderCreateMemberForm } from './ui.js';

let members = loadMembers();

// Validation Helpers
function isValidKenyanPhone(phone) {
    phone = phone.trim().replace(/\s/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+254')) phone = '254' + phone.slice(4);
    else if (!phone.startsWith('254')) return false;
    return /^254[17]\d{8}$/.test(phone);
}

function isValidEmail(email) {
    if (!email.trim()) return true; // Optional
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

// Core Renderers
function createMemberSection() {
    document.getElementById('main-content').innerHTML = renderCreateMemberForm();

    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    const addNokBtn = document.getElementById('add-nok');
    const nokContainer = document.getElementById('nok-container');

    roleSelect.addEventListener('change', () => {
        customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
    });

    let nokCount = 1;
    addNokBtn.addEventListener('click', () => {
        if (nokCount >= 3) {
            showAlert('Maximum 3 next of kin allowed.');
            return;
        }
        nokCount++;
        const entry = document.createElement('div');
        entry.className = 'nok-entry';
        entry.innerHTML = `
            <h4>Next of Kin ${nokCount}</h4>
            <div class="form-group"><label>Name *</label><input type="text" class="nok-name" required></div>
            <div class="form-group"><label>Phone *</label><input type="tel" class="nok-phone" required></div>
            <div class="form-group"><label>Share % *</label><input type="number" class="nok-share" min="1" max="100" required></div>
            <button type="button" style="background:#dc3545;color:white;padding:8px;margin-top:10px;" onclick="this.parentElement.remove();">Remove</button>
        `;
        nokContainer.appendChild(entry);
    });

    document.getElementById('create-member-form').addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic fields
        const name = document.getElementById('full-name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!name || !phone) {
            showAlert('Full Name and Phone are required!');
            return;
        }

        if (!isValidKenyanPhone(phone)) {
            showAlert('Invalid Kenyan mobile number. Use 07xx, +2547xx or 2547xx format.');
            return;
        }

        if (email && !isValidEmail(email)) {
            showAlert('Invalid email address.');
            return;
        }

        if (members.some(m => m.phone === phone)) {
            showAlert('A member with this phone number already exists!');
            return;
        }

        // Role
        const roleValue = roleSelect.value;
        const customRole = document.getElementById('custom-role').value.trim();
        const finalRole = roleValue === 'Other' ? customRole : roleValue;
        if (roleValue === 'Other' && !customRole) {
            showAlert('Please enter custom role name.');
            return;
        }

        // Next of Kin
        const nokEntries = document.querySelectorAll('.nok-entry');
        if (nokEntries.length === 0) {
            showAlert('At least one next of kin is required.');
            return;
        }

        let totalShare = 0;
        const nextOfKin = [];
        let validNok = true;

        nokEntries.forEach(entry => {
            const nokName = entry.querySelector('.nok-name').value.trim();
            const nokPhone = entry.querySelector('.nok-phone').value.trim();
            const share = parseFloat(entry.querySelector('.nok-share').value);

            if (!nokName || !nokPhone || isNaN(share)) {
                validNok = false;
                return;
            }

            if (!isValidKenyanPhone(nokPhone)) {
                showAlert('Invalid phone for next of kin.');
                validNok = false;
                return;
            }

            totalShare += share;
            nextOfKin.push({ name: nokName, phone: nokPhone, share });
        });

        if (!validNok) return;

        if (Math.abs(totalShare - 100) > 0.01) {
            showAlert(`Share percentages must total exactly 100%. Current: ${totalShare}%`);
            return;
        }

        // Create member
        const newMember = {
            id: Date.now(),
            name,
            phone,
            email,
            idNumber: document.getElementById('id-number').value.trim(),
            gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value,
            role: finalRole || 'Member',
            nextOfKin,  // Array of {name, phone, share}
            balance: 0,
            ledger: [],
            active: true
        };

        members.push(newMember);
        saveMembers(members);
        showAlert('Member created successfully!');
        membersListSection();
    });
}

// Keep other functions (membersListSection, viewLedger, showAddTransactionForm, suspendMember, reactivateMember, export/import) as before
// ... (no changes needed to them — nextOfKin will display in table as JSON or formatted string if you want)

// Initializer
export function initMembersModule() {
    window.createMemberSection = createMemberSection;
    window.membersListSection = membersListSection;
    window.viewLedger = viewLedger;
    window.showAddTransactionForm = showAddTransactionForm;
    window.suspendMember = suspendMember;
    window.reactivateMember = reactivateMember;
    window.exportMembersToCSV = exportMembersToCSV;
    window.importMembers = importMembers;
}
