// js/modules/ui.js
import { formatCurrency } from '../utils/helpers.js';

export function renderMembersTable(members) {
    // Calculate aggregates per member
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
        <p class="subtitle">Total: ${members.length} | Active: ${members.filter(m => m.active).length}</p>
        
        <div style="margin-bottom:20px;">
            <button class="submit-btn" style="background:#28a745;" onclick="window.exportMembersToCSV()">Download Members (CSV)</button>
            <label class="submit-btn" style="background:#007bff;margin-left:10px;cursor:pointer;">
                Import from CSV/Excel <input type="file" id="import-file" accept=".csv,.xlsx,.xls" style="display:none;" onchange="window.importMembers(event)">
            </label>
        </div>

        ${members.length === 0 ? '<p>No members registered yet.</p>' : `
        <table class="members-table">
            <thead>
                <tr>
                    <th>Name</th><th>Phone</th><th>Role</th><th>Next of Kin</th>
                    <th>Contributions</th><th>Loans Out</th><th>Net Balance</th><th>Status</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${enrichedMembers.map(m => `
                    <tr class="${m.active ? '' : 'inactive-row'}">
                        <td>${m.name}</td>
                        <td>${m.phone}</td>
                        <td>${m.role}</td>
                        <td>${m.nokName || '-'}<br><small>${m.nokPhone || ''}</small></td>
                        <td>${formatCurrency(m.contributions)}</td>
                        <td>${formatCurrency(m.loansOut)}</td>
                        <td>${formatCurrency(m.balance)}</td>
                        <td>${m.active ? 'Active' : 'Suspended'}</td>
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
        </table>`}
    `;
}

// Keep the create form (unchanged or minor updates if needed)
export function renderCreateMemberForm() {
    // Same as before...
    return `...`; // (use previous version)
}
