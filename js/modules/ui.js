// js/modules/ui.js
import { formatCurrency } from '../utils/helpers.js';

export function renderMembersTable(members, onViewLedger, onEdit, onSuspend) {
    return `
        <h1>View Members</h1>
        <p class="subtitle">Total: ${members.length} | Active: ${members.filter(m => m.active).length}</p>
        ${members.length === 0 ? '<p>No members registered yet.</p>' : `
        <table class="members-table">
            <thead>
                <tr>
                    <th>Name</th><th>Phone</th><th>Role</th><th>Next of Kin</th><th>Balance</th><th>Status</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${members.map(m => `
                    <tr class="${m.active ? '' : 'inactive-row'}">
                        <td>${m.name}</td>
                        <td>${m.phone}</td>
                        <td>${m.role}</td>
                        <td>${m.nokName || '-'}<br><small>${m.nokPhone || ''}</small></td>
                        <td>${formatCurrency(m.balance)}</td>
                        <td>${m.active ? 'Active' : 'Suspended'}</td>
                        <td>
                            <button onclick="window.viewLedger(${m.id})">Ledger</button>
                            <button onclick="window.editMember(${m.id})">Edit</button>
                            <button onclick="window.suspendMember(${m.id})" ${m.active ? '' : 'disabled'}>Suspend</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`}
    `;
}

export function renderCreateMemberForm(onSubmit) {
    return `
        <h1>Create New Member</h1>
        <p class="subtitle">Register a new SACCO member</p>
        <form class="form-card" id="create-member-form">
            <div class="form-group"><label>Full Name *</label><input type="text" id="full-name" required></div>
            <div class="form-group"><label>ID / Passport</label><input type="text" id="id-number"></div>
            <div class="form-group"><label>Phone Number *</label><input type="tel" id="phone" required></div>
            <div class="form-group"><label>Email</label><input type="email" id="email"></div>
            <div class="form-group"><label>Gender</label><select id="gender"><option>Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div class="form-group"><label>Date of Birth</label><input type="date" id="dob"></div>
            <div class="form-group">
                <label>Role</label>
                <select id="role">
                    <option>Member</option>
                    <option>Admin</option>
                    <option>Chairman</option>
                    <option>Vice Chairman</option>
                    <option>Secretary</option>
                    <option>Treasurer</option>
                    <option>Other</option>
                </select>
                <div id="custom-role-group" style="display:none;margin-top:10px;">
                    <label>Custom Role Name</label><input type="text" id="custom-role">
                </div>
            </div>
            <div class="form-group"><label>Next of Kin Name</label><input type="text" id="nok-name"></div>
            <div class="form-group"><label>Next of Kin Phone</label><input type="tel" id="nok-phone"></div>
            <button type="submit" class="submit-btn">Create Member</button>
        </form>
    `;
}
