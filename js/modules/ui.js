// js/modules/ui.js - Updated with requested field changes

import { formatCurrency } from '../utils/helpers.js';

export function renderCreateMemberForm() {
    return `
        <style>
            .required-label::after {
                content: " *";
                color: red;
                font-weight: bold;
            }
            .optional-section {
                opacity: 0.8;
                font-style: italic;
            }
        </style>

        <h1>SACCO Membership Registration</h1>
        <p class="subtitle">Fields marked with <span style="color:red;font-weight:bold;">*</span> are required.</p>

        <form class="form-card" id="create-member-form">

            <!-- Section A: Personal Details -->
            <h3 style="margin-top:0;">Section A: Personal Details</h3>
            <div class="form-group"><label class="required-label">Full Name</label><input type="text" id="full-name" required placeholder="Enter full name as per ID"></div>
            <div class="form-group"><label class="required-label">National ID / Passport No.</label><input type="text" id="id-number" required placeholder="e.g. 12345678"></div>
            <div class="form-group"><label class="required-label">Date of Birth</label><input type="date" id="dob" required></div>
            <div class="form-group">
                <label class="required-label">Gender</label><br>
                <label><input type="radio" name="gender" value="Male" required> Male</label>&nbsp;&nbsp;
                <label><input type="radio" name="gender" value="Female"> Female</label>&nbsp;&nbsp;
                <label><input type="radio" name="gender" value="Other"> Other</label>
            </div>
            <div class="form-group"><label>Passport Photo (Optional)</label><input type="file" id="photo" accept="image/*"></div>

            <!-- Section B: Contact Information -->
            <h3>Section B: Contact Information</h3>
            <div class="form-group"><label class="required-label">Mobile Number<br><small>(Kenyan format: 07xx or +254)</small></label><input type="tel" id="phone" required placeholder="0712345678"></div>
            <div class="form-group"><label>Email Address (Optional)</label><input type="email" id="email" placeholder="member@example.com"></div>
            <div class="form-group"><label>Physical Address (Optional)</label><input type="text" id="physical-address"></div>
            <div class="form-group"><label>Town/City (Optional)</label><input type="text" id="town"></div>

            <!-- Section C: Employment / Business Details (Optional) -->
            <h3>Section C: Employment / Business Details (Optional)</h3>
            <div class="form-group">
                <label>Employment Status</label><br>
                <label><input type="radio" name="employment-status" value="Employed"> Employed</label>&nbsp;&nbsp;
                <label><input type="radio" name="employment-status" value="Self-Employed"> Self-Employed</label>&nbsp;&nbsp;
                <label><input type="radio" name="employment-status" value="Unemployed"> Unemployed</label>
            </div>
            <div class="form-group"><label>Employer / Business Name</label><input type="text" id="employer-name"></div>
            <div class="form-group"><label>Staff / Business Registration No.</label><input type="text" id="reg-no"></div>
            <div class="form-group"><label>Employer / Business Address</label><input type="text" id="employer-address"></div>

            <!-- Section E & F: Next of Kin / Nominees (Optional Section) -->
            <h3>Section E & F: Next of Kin / Nominees (Beneficiaries) <span class="optional-section">(Optional)</span></h3>
            <p><small>If you add any nominee, all their fields become required and percentages must total 100%.</small></p>

            <div id="nok-container">
                <!-- First nominee starts empty and optional -->
                <div class="nok-entry" style="display:none;"></div> <!-- Hidden placeholder -->
            </div>

            <button type="button" id="add-nok" class="submit-btn" style="background:#007bff;width:auto;padding:10px 20px;margin:20px 0;">
                + Add Nominee (Optional - Max 3)
            </button>

            <!-- Section G: Introducer -->
            <h3>Section G: Introducer (Existing Member)</h3>
            <div class="form-group"><label class="required-label">Introducer Name</label><input type="text" id="introducer-name" required></div>
            <div class="form-group"><label class="required-label">Introducer Member No.</label><input type="text" id="introducer-member-no" required></div>

            <!-- Submit -->
            <button type="submit" class="submit-btn" style="margin-top:30px;">Submit Membership Application</button>
        </form>
    `;
}
export function renderMembersTable(members) {
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
        <h1>Registered Members</h1>
        <p class="subtitle">Total: ${members.length} | Active: ${members.filter(m => m.active).length}</p>

        <div style="margin-bottom:20px;">
            <button class="submit-btn" style="background:#28a745;" onclick="window.exportMembersToCSV()">Download Members (CSV)</button>
            <label class="submit-btn" style="background:#007bff;margin-left:10px;cursor:pointer;">
                Import from CSV <input type="file" accept=".csv" style="display:none;" onchange="window.importMembers(event)">
            </label>
        </div>

        ${members.length === 0 ? '<p>No members registered yet.</p>' : `
        <table class="members-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>ID No.</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Nominees</th>
                    <th>Contributions</th>
                    <th>Loans Out</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${enrichedMembers.map(m => `
                    <tr class="${m.active ? '' : 'inactive-row'}">
                        <td><strong>${m.name}</strong></td>
                        <td>${m.idNumber || '-'}</td>
                        <td>${m.phone}</td>
                        <td>${m.role}</td>
                        <td style="font-size:13px;">
                            ${m.nextOfKin && m.nextOfKin.length > 0 
                                ? m.nextOfKin.map(n => `<div><strong>${n.name}</strong> (${n.relationship || 'Nominee'})<br><small>${n.phone} — ${n.share}%</small></div>`).join('<hr style="margin:6px 0;">')
                                : 'None'}
                        </td>
                        <td>${formatCurrency(m.contributions)}</td>
                        <td>${formatCurrency(m.loansOut)}</td>
                        <td><strong>${formatCurrency(m.balance)}</strong></td>
                        <td>${m.active ? '<span style="color:#28a745;">Active</span>' : '<span style="color:#dc3545;">Suspended</span>'}</td>
                        <td>
                            <button onclick="window.viewLedger(${m.id})">Ledger</button>
                            <button onclick="window.editMember(${m.id})">Edit</button>
                            ${m.active ? `<button onclick="window.suspendMember(${m.id})">Suspend</button>` : `<button onclick="window.reactivateMember(${m.id})" style="background:#28a745;">Reactivate</button>`}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`}
    `;
}
