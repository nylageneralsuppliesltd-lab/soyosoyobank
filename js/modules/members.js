// js/modules/members.js - Complete Members Module (Final Fixed Version)

import { loadMembers, saveMembers } from '../storage.js';
import { showAlert, formatCurrency } from '../utils/helpers.js';

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
// SHARED FORM HTML
// ======================

function getMemberFormHTML() {
    return `
        <div class="form-card">
            <h1 id="form-title">Register New Member</h1>
            <form id="create-member-form">
                <div class="form-group">
                    <label class="required-label">Full Name</label>
                    <input type="text" id="full-name" required placeholder="e.g. John Kamau">
                </div>

                <div class="form-group">
                    <label class="required-label">Mobile Number</label>
                    <input type="tel" id="phone" required placeholder="e.g. 0712345678 or +254712345678">
                </div>

                <div class="form-group">
                    <label>Email (optional)</label>
                    <input type="email" id="email" placeholder="john@example.com">
                </div>

                <div class="form-group">
                    <label>ID Number (optional)</label>
                    <input type="text" id="id-number" placeholder="e.g. 12345678">
                </div>

                <div class="form-group">
                    <label>Date of Birth (optional)</label>
                    <input type="date" id="dob">
                </div>

                <!-- Gender as Dropdown -->
                <div class="form-group">
                    <label>Gender</label>
                    <select id="gender">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Physical Address</label>
                    <input type="text" id="physical-address" placeholder="e.g. Plot 123, Ngong Road">
                </div>

                <div class="form-group">
                    <label>Town/City</label>
                    <input type="text" id="town" placeholder="e.g. Nairobi">
                </div>

                <!-- Employment Status as Dropdown -->
                <div class="form-group">
                    <label>Employment Status</label>
                    <select id="employment-status">
                        <option value="">Select Status</option>
                        <option value="Employed">Employed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Retired">Retired</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Employer Name (if employed)</label>
                    <input type="text" id="employer-name">
                </div>

                <div class="form-group">
                    <label>Registration No. (if applicable)</label>
                    <input type="text" id="reg-no">
                </div>

                <div class="form-group">
                    <label>Employer Address</label>
                    <input type="text" id="employer-address">
                </div>

                <div class="form-group">
                    <label class="required-label">Role in SACCO</label>
                    <select id="role">
                        <option value="Member">Member</option>
                        <option value="Chairman">Chairman</option>
                        <option value="Vice Chairman">Vice Chairman</option>
                        <option value="Secretary">Secretary</option>
                        <option value="Treasurer">Treasurer</option>
                        <option value="Admin">Admin</option>
                        <option value="Other">Other (specify)</option>
                    </select>
                    <div id="custom-role-group" style="display:none; margin-top:8px;">
                        <input type="text" id="custom-role" placeholder="e.g. Committee Member">
                    </div>
                </div>

                <div class="form-group">
                    <label class="required-label">Introducer Name</label>
                    <input type="text" id="introducer-name" required>
                </div>

                <div class="form-group">
                    <label class="required-label">Introducer Member No.</label>
                    <input type="text" id="introducer-member-no" required>
                </div>

                <div id="nok-container"></div>

                <button type="button" id="add-nok" class="submit-btn" style="background:#17a2b8; margin:20px 0;">
                    + Add Nominee (Optional, max 3)
                </button>

                <div style="text-align:center; margin-top:20px;">
                    <button type="submit" class="submit-btn">Register Member</button>
                </div>
            </form>
        </div>
    `;
}

// ======================
// CREATE MEMBER
// ======================

export function renderCreateMemberForm() {
    document.getElementById('main-content').innerHTML = getMemberFormHTML();
    document.getElementById('form-title').textContent = 'Register New Member';

    setupFormLogic(null); // null = create mode
}

// ======================
// EDIT MEMBER
// ======================

export function renderEditMemberForm(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) {
        showAlert('Member not found.');
        return;
    }

    document.getElementById('main-content').innerHTML = getMemberFormHTML();
    document.getElementById('form-title').textContent = 'Edit Member';

    // Pre-fill all fields
    document.getElementById('full-name').value = member.name || '';
    document.getElementById('phone').value = member.phone || '';
    document.getElementById('email').value = member.email || '';
    document.getElementById('id-number').value = member.idNumber || '';
    document.getElementById('dob').value = member.dob || '';
    document.getElementById('gender').value = member.gender || '';
    document.getElementById('physical-address').value = member.physicalAddress || '';
    document.getElementById('town').value = member.town || '';
    document.getElementById('employment-status').value = member.employmentStatus || '';
    document.getElementById('employer-name').value = member.employerName || '';
    document.getElementById('reg-no').value = member.regNo || '';
    document.getElementById('employer-address').value = member.employerAddress || '';
    document.getElementById('introducer-name').value = member.introducerName || '';
    document.getElementById('introducer-member-no').value = member.introducerMemberNo || '';

    // Role handling
    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    const commonRoles = ['Member', 'Chairman', 'Vice Chairman', 'Secretary', 'Treasurer', 'Admin'];
    if (commonRoles.includes(member.role)) {
        roleSelect.value = member.role;
        customGroup.style.display = 'none';
    } else {
        roleSelect.value = 'Other';
        customGroup.style.display = 'block';
        document.getElementById('custom-role').value = member.role || '';
    }

    // Load existing nominees
    const nokContainer = document.getElementById('nok-container');
    nokContainer.innerHTML = '';
    if (member.nextOfKin && member.nextOfKin.length > 0) {
        member.nextOfKin.forEach((nok, index) => addNomineeEntry(nok, index + 1));
    }

    // Change submit button
    document.querySelector('#create-member-form button[type="submit"]').textContent = 'Update Member';

    setupFormLogic(memberId); // memberId = edit mode
}

// ======================
// SETUP FORM LOGIC (Shared)
// ======================

function setupFormLogic(editMemberId = null) {
    const roleSelect = document.getElementById('role');
    const customGroup = document.getElementById('custom-role-group');
    const addNokBtn = document.getElementById('add-nok');
    const nokContainer = document.getElementById('nok-container');

    // Custom role toggle
    roleSelect.addEventListener('change', () => {
        customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
    });

    // Add nominee
    let nokCount = nokContainer.children.length;
    addNokBtn.addEventListener('click', () => {
        if (nokCount >= 3) {
            showAlert('Maximum of 3 nominees allowed.');
            return;
        }
        addNomineeEntry(null, ++nokCount);
    });

    function addNomineeEntry(nok = null, count) {
        const entry = document.createElement('div');
        entry.className = 'nok-entry';
        entry.innerHTML = `
            <h4 style="margin-top:20px;">Nominee ${count}</h4>
            <div class="form-group"><label class="required-label">Name</label><input type="text" class="nok-name" value="${nok?.name || ''}" required></div>
            <div class="form-group"><label class="required-label">Relationship</label><input type="text" class="nok-relationship" value="${nok?.relationship || ''}" required placeholder="e.g. Spouse, Child"></div>
            <div class="form-group"><label class="required-label">ID No.</label><input type="text" class="nok-id" value="${nok?.id || ''}" required></div>
            <div class="form-group"><label class="required-label">Mobile Number</label><input type="tel" class="nok-phone" value="${nok?.phone || ''}" required></div>
            <div class="form-group"><label class="required-label">Percentage Allocation %</label><input type="number" class="nok-share" value="${nok?.share || ''}" min="1" max="100" step="1" required></div>
            <button type="button" style="background:#dc3545;color:#fff;padding:8px 12px;margin-top:10px;border:none;border-radius:6px;">Remove Nominee</button>
        `;
        entry.querySelector('button').addEventListener('click', () => {
            entry.remove();
            nokCount--;
        });
        nokContainer.appendChild(entry);
    }

    // Form submit
    document.getElementById('create-member-form').onsubmit = (e) => {
        e.preventDefault();
        handleMemberSubmit(editMemberId);
    };
}

// ======================
// SUBMIT HANDLER (Create & Edit)
// ======================

function handleMemberSubmit(editMemberId = null) {
    const isEdit = editMemberId !== null;
    const member = isEdit ? members.find(m => m.id === editMemberId) : null;

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

    if (members.some(m => m.id !== editMemberId && m.phone === phone)) {
        showAlert('A member with this phone number already exists!');
        return;
    }

    const roleSelect = document.getElementById('role');
    const roleValue = roleSelect.value;
    const customRole = document.getElementById('custom-role')?.value.trim() || '';
    const finalRole = roleValue === 'Other' ? customRole : roleValue;
    if (roleValue === 'Other' && !customRole) {
        showAlert('Please enter a custom role name.');
        return;
    }

    const introducerName = document.getElementById('introducer-name').value.trim();
    const introducerNo = document.getElementById('introducer-member-no').value.trim();
    if (!introducerName || !introducerNo) {
        showAlert('Introducer Name and Member No. are required.');
        return;
    }

    // Nominees validation
    const nokEntries = document.querySelectorAll('.nok-entry');
    let nextOfKin = [];
    let totalShare = 0;

    if (nokEntries.length > 0) {
        for (const entry of nokEntries) {
            const nokName = entry.querySelector('.nok-name').value.trim();
            const relationship = entry.querySelector('.nok-relationship').value.trim();
            const idNo = entry.querySelector('.nok-id').value.trim();
            const nokPhone = entry.querySelector('.nok-phone').value.trim();
            const share = parseFloat(entry.querySelector('.nok-share').value);

            if (!nokName || !relationship || !idNo || !nokPhone || isNaN(share)) {
                showAlert('All nominee fields are required.');
                return;
            }

            if (!isValidKenyanPhone(nokPhone)) {
                showAlert('Invalid nominee mobile number.');
                return;
            }

            if (share < 1 || share > 100) {
                showAlert('Nominee share must be between 1 and 100.');
                return;
            }

            totalShare += share;
            nextOfKin.push({ name: nokName, relationship, id: idNo, phone: nokPhone, share });
        }

        if (Math.abs(totalShare - 100) > 0.01) {
            showAlert(`Nominee percentages must total 100%. Current total: ${totalShare}%`);
            return;
        }
    }

    const memberData = {
        name,
        phone,
        email: email || null,
        idNumber: document.getElementById('id-number').value.trim() || null,
        dob: document.getElementById('dob').value || null,
        gender: document.getElementById('gender').value || null,
        physicalAddress: document.getElementById('physical-address').value.trim() || null,
        town: document.getElementById('town').value.trim() || null,
        employmentStatus: document.getElementById('employment-status').value || null,
        employerName: document.getElementById('employer-name').value.trim() || null,
        regNo: document.getElementById('reg-no').value.trim() || null,
        employerAddress: document.getElementById('employer-address').value.trim() || null,
        role: finalRole,
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
    members = loadMembers();
    // Replace this with your actual renderMembersTable(members) HTML when ready
    // For now, a clean placeholder:
    document.getElementById('main-content').innerHTML = `
        <h1>Members List</h1>
        <p class="subtitle">Total Members: ${members.length}</p>
        <div class="table-container">
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(m => `
                        <tr class="${!m.active ? 'inactive-row' : ''}">
                            <td>${m.name}</td>
                            <td>${m.phone}</td>
                            <td>${m.role}</td>
                            <td>${formatCurrency(m.balance)}</td>
                            <td>${m.active ? 'Active' : 'Suspended'}</td>
                            <td>
                                <button onclick="renderMemberLedger(${m.id})">Ledger</button>
                                <button onclick="renderEditMemberForm(${m.id})">Edit</button>
                                ${m.active 
                                    ? `<button onclick="suspendMember(${m.id})" style="background:#dc3545;">Suspend</button>`
                                    : `<button onclick="reactivateMember(${m.id})" style="background:#28a745;">Reactivate</button>`
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ======================
// LEDGER, SUSPEND, EXPORT, ETC. (Unchanged from your version)
// ======================

export function renderMemberLedger(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return showAlert('Member not found.');

    let contributions = 0;
    let loansOut = 0;
    member.ledger.forEach(tx => {
        if (['Contribution', 'Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) contributions += tx.amount;
        if (tx.type === 'Loan Disbursement') loansOut += tx.amount;
    });

    document.getElementById('main-content').innerHTML = `
        <h1>Ledger - ${member.name}</h1>
        <p class="subtitle">
            Status: ${member.active ? '<span style="color:#28a745">Active</span>' : '<span style="color:#dc3545">Suspended</span>'} | 
            Contributions: ${formatCurrency(contributions)} | 
            Loans: ${formatCurrency(loansOut)} | 
            Balance: ${formatCurrency(member.balance)}
        </p>
        <div class="table-container">
            <table class="members-table">
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th></tr></thead>
                <tbody>
                    ${member.ledger.length === 0 ? '<tr><td colspan="5">No transactions</td></tr>' :
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
        <button class="submit-btn" style="margin-top:20px;" onclick="renderMembersList()">Back to List</button>
    `;
}

export function suspendMember(memberId) {
    if (confirm('Suspend this member?')) {
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
// EXPORT MEMBERS TO CSV
// ======================

export function exportMembersToCSV() {
    if (members.length === 0) {
        showAlert('No members to export.');
        return;
    }

    // Enrich with calculated contributions and loans
    const enriched = members.map(m => {
        let contributions = 0;
        let loansOut = 0;
        if (m.ledger) {
            m.ledger.forEach(tx => {
                if (['Contribution', 'Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) {
                    contributions += tx.amount;
                }
                if (tx.type === 'Loan Disbursement') {
                    loansOut += tx.amount;
                }
            });
        }
        return {
            ...m,
            contributions,
            loansOut
        };
    });

    const headers = [
        'Name', 'Phone', 'Email', 'ID Number', 'Role',
        'Introducer Name', 'Introducer Member No.',
        'Contributions', 'Loans Out', 'Balance', 'Status'
    ];

    const rows = enriched.map(m => [
        m.name,
        m.phone,
        m.email || '',
        m.idNumber || '',
        m.role || 'Member',
        m.introducerName || '',
        m.introducerMemberNo || '',
        m.contributions || 0,
        m.loansOut || 0,
        m.balance || 0,
        m.active ? 'Active' : 'Suspended'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'soyosoyo_members.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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
// MODULE INITIALIZATION – Expose functions to window for onclick handlers
// ======================

export function initMembersModule() {
    // Expose key functions to global scope so onclick handlers can find them
    window.renderMembersList = renderMembersList;
    window.renderCreateMemberForm = renderCreateMemberForm;
    window.renderEditMemberForm = renderEditMemberForm;
    window.renderMemberLedger = renderMemberLedger;
    window.suspendMember = suspendMember;
    window.reactivateMember = reactivateMember;
    window.exportMembersToCSV = exportMembersToCSV;
    window.importMembers = importMembers;

    console.log('Members module initialized and functions exposed to window');
}
