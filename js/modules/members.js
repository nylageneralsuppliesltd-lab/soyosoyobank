// js/modules/members.js
import { loadMembers, saveMembers } from '../storage.js';
import { showAlert } from '../utils/helpers.js';
import { renderMembersTable, renderCreateMemberForm } from './ui.js';

let members = loadMembers();

export function initMembersModule(loadSection) {
    // Make functions available globally for onclick
    window.viewLedger = viewLedger;
    window.editMember = editMember;
    window.suspendMember = suspendMember;

    // Create member
    window.createMemberSection = function() {
        document.getElementById('main-content').innerHTML = renderCreateMemberForm();

        const roleSelect = document.getElementById('role');
        const customGroup = document.getElementById('custom-role-group');
        roleSelect.addEventListener('change', () => {
            customGroup.style.display = roleSelect.value === 'Other' ? 'block' : 'none';
        });

        document.getElementById('create-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const role = roleSelect.value === 'Other' ? document.getElementById('custom-role').value.trim() : roleSelect.value;
            if (roleSelect.value === 'Other' && !role) {
                showAlert('Please enter custom role name');
                return;
            }

            const newMember = {
                id: Date.now(),
                name: document.getElementById('full-name').value.trim(),
                idNumber: document.getElementById('id-number').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                gender: document.getElementById('gender').value,
                dob: document.getElementById('dob').value,
                role: role || 'Member',
                nokName: document.getElementById('nok-name').value.trim(),
                nokPhone: document.getElementById('nok-phone').value.trim(),
                balance: 0,
                ledger: [],
                active: true
            };

            if (!newMember.name || !newMember.phone) {
                showAlert('Name and phone are required!');
                return;
            }

            members.push(newMember);
            saveMembers(members);
            showAlert('Member created successfully!');
            loadSection('members-list');
        });
    };

    // Members list
    window.membersListSection = function() {
        members = loadMembers(); // Refresh
        document.getElementById('main-content').innerHTML = renderMembersTable(
            members,
            viewLedger,
            editMember,
            suspendMember
        );
    };
}

// Member actions (global because used in inline onclick)
function viewLedger(memberId) {
    const member = members.find(m => m.id === memberId);
    // We'll expand this later with full ledger UI
    alert(`Ledger for ${member.name}\nBalance: ${member.balance}\nTransactions: ${member.ledger.length}`);
    // Next step: build full ledger view here
}

function editMember(memberId) {
    // Full edit form - we'll build this next
    alert('Edit functionality coming in next update!');
}

function suspendMember(memberId) {
    if (confirm('Suspend this member? They will become inactive.')) {
        const member = members.find(m => m.id === memberId);
        member.active = false;
        saveMembers(members);
        showAlert('Member suspended');
        window.membersListSection();
    }
}
