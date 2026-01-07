// js/modules/ui.js - Updated UI Rendering Functions

import { formatCurrency } from '../utils/helpers.js';

export function renderCreateMemberForm() {
    return `
        <h1>Create New Member</h1>
        <p class="subtitle">All fields marked * are required. Phone must be a valid Kenyan mobile number.</p>
        <form class="form-card" id="create-member-form">
            <div class="form-group"><label>Full Name *</label><input type="text" id="full-name" required placeholder="e.g. John Doe"></div>
            <div class="form-group">
                <label>Phone Number *<br><small>(07xx, +2547xx or 2547xx)</small></label>
                <input type="tel" id="phone" required placeholder="0712345678">
            </div>
            <div class="form-group"><label>Email Address (Optional)</label><input type="email" id="email" placeholder="john@example.com"></div>
            <div class="form-group"><label>ID / Passport Number</label><input type="text" id="id-number" placeholder="e.g. 12345678"></div>
            <div class="form-group">
                <label>Gender</label>
                <select id="gender">
                    <option>Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                </select>
            </div>
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

            <h3 style="margin-top:30px;">Next of Kin (Beneficiaries)</h3>
            <p><small>Add up to 3. Percentage shares must total exactly 100%.</small></p>

            <div id="nok-container">
                <div class="nok-entry">
                    <h4>Next of Kin 1 *</h4>
                    <div class="form-group"><label>Name *</label><input type="text" class="nok-name" required></div>
                    <div class="form-group"><label>Phone *</label><input type="tel" class="nok-phone" required placeholder="07xx or +254"></div>
                    <div class="form-group"><label>Share % *</label><input type="number" class="nok-share" min="1" max="100" step="1" required></div>
                </div>
            </div>

            <button type="button" id="add-nok" class="submit-btn" style="background:#007bff;width:auto;padding:10px 20px;margin:20px 0;">
                + Add Another Next of Kin (max 3)
            </button>

            <button type="submit" class="submit-btn">Create Member</button>
        </form>
    `;
}

export function renderMembersTable(members) {
    // Calculate financial summaries per member
    const enrichedMembers = members.map(m => {
        let contributions = 0;
        let loansOut = 0;
        m.ledger.forEach(tx => {
            if (['Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) {
                contributions += tx.amount;
            } else if (tx.type === 'Loan Disbursement') {
                loansOut += tx.amount;
            }
        });
        return { ...m, contributions, loansOut };
    });

    return `
        <h1>View Members</h1>
        <p class="subtitle">
            Total Members: ${members.length} | 
            Active: ${members.filter(m => m.active).length} | 
            Suspended: ${members.filter(m => !m.active).length}
        </p>
        
        <div style="margin-bottom:25px;">
            <button class="submit-btn" style="background:#28a745;" onclick="window.exportMembersToCSV()">
                Download Members (CSV)
            </button>
            <label class="submit-btn" style="background:#007bff;margin-left:10px;cursor:pointer;">
                Import from CSV/Excel 
                <input type="file" id="import-file" accept=".csv,.xlsx,.xls" style="display:none;" onchange="window.importMembers(event)">
            </label>
        </div>

        ${members.length === 0 ? 
            '<p>No members registered yet. Create one or import from CSV.</p>' : 
            `
            <table class="members-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Next of Kin</th>
                        <th>Contributions</th>
                        <th>Loans Out</th>
                        <th>Net Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${enrichedMembers.map(m => `
                        <tr class="${m.active ? '' : 'inactive-row'}">
                            <td><strong>${m.name}</strong></td>
                            <td>${m.phone}</td>
                            <td>${m.role}</td>
                            <td style="font-size:13px;line-height:1.4;">
                                ${m.nextOfKin && m.nextOfKin.length > 0 
                                    ? m.nextOfKin.map((nok, idx) => `
                                        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:${idx < m.nextOfKin.length - 1 ? '1px dotted #ccc' : 'none'}">
                                            <strong>${nok.name}</strong><br>
                                            <small>${nok.phone} — ${nok.share}% share</small>
                                        </div>
                                    `).join('')
                                    : '<em>No beneficiaries</em>'
                                }
                            </td>
                            <td>${formatCurrency(m.contributions)}</td>
                            <td>${formatCurrency(m.loansOut)}</td>
                            <td><strong>${formatCurrency(m.balance)}</strong></td>
                            <td>${m.active ? '<span style="color:#28a745;">Active</span>' : '<span style="color:#dc3545;">Suspended</span>'}</td>
                            <td>
                                <button onclick="window.viewLedger(${m.id})">Ledger</button>
                                <button onclick="window.editMember(${m.id})">Edit</button>
                                ${m.active 
                                    ? `<button onclick="window.suspendMember(${m.id})">Suspend</button>` 
                                    : `<button onclick="window.reactivateMember(${m.id})" style="background:#28a745;">Reactivate</button>`
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            `
        }
    `;
}
