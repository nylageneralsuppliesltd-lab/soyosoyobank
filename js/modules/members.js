// js/modules/members.js
import { loadMembers, saveMembers } from '../storage.js';
import { showAlert } from '../utils/helpers.js';
import { renderMembersTable, renderCreateMemberForm } from './ui.js';

let members = loadMembers();

export function initMembersModule(loadSection) {
    // Global functions for onclick
    window.viewLedger = viewLedger;
    window.editMember = editMember;
    window.suspendMember = suspendMember;
    window.reactivateMember = reactivateMember;
    window.exportMembersToCSV = exportMembersToCSV;
    window.importMembers = importMembers;

    window.createMemberSection = function() {
        document.getElementById('main-content').innerHTML = renderCreateMemberForm();
        // ... (attach form submit as before)
    };

    window.membersListSection = function() {
        members = loadMembers(); // Refresh data
        document.getElementById('main-content').innerHTML = renderMembersTable(members);
    };
}

// Reactivate member
function reactivateMember(memberId) {
    if (confirm('Reactivate this member? They will regain access.')) {
        const member = members.find(m => m.id === memberId);
        member.active = true;
        saveMembers(members);
        showAlert('Member reactivated!');
        window.membersListSection();
    }
}

// Export to CSV
function exportMembersToCSV() {
    if (members.length === 0) {
        showAlert('No members to export!');
        return;
    }

    const headers = ['Name','Phone','Email','Role','Next of Kin Name','Next of Kin Phone','Contributions','Loans Outstanding','Net Balance','Status'];
    const rows = members.map(m => {
        let contributions = 0;
        let loansOut = 0;
        m.ledger.forEach(tx => {
            if (['Deposit', 'Share Contribution', 'Loan Repayment'].includes(tx.type)) contributions += tx.amount;
            if (tx.type === 'Loan Disbursement') loansOut += tx.amount;
        });
        return [
            m.name,
            m.phone,
            m.email || '',
            m.role,
            m.nokName || '',
            m.nokPhone || '',
            contributions,
            loansOut,
            m.balance,
            m.active ? 'Active' : 'Suspended'
        ];
    });

    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "soyosoyo_members.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Members exported successfully!');
}

// Import from CSV/Excel
function importMembers(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        let data;
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_csv(sheet);
        } else {
            data = e.target.result;
        }

        Papa.parse(data, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                let imported = 0;
                results.data.forEach(row => {
                    if (!row.name || !row.phone) return; // Skip invalid
                    const existing = members.find(m => m.phone === row.phone.trim());
                    if (existing) return; // Avoid duplicates

                    members.push({
                        id: Date.now() + imported,
                        name: row.name?.trim() || '',
                        phone: row.phone?.trim() || '',
                        email: row.email?.trim() || '',
                        role: row.role?.trim() || 'Member',
                        nokName: row['Next of Kin Name']?.trim() || row.nokName?.trim() || '',
                        nokPhone: row['Next of Kin Phone']?.trim() || row.nokPhone?.trim() || '',
                        balance: 0,
                        ledger: [],
                        active: true
                    });
                    imported++;
                });
                saveMembers(members);
                showAlert(`${imported} members imported successfully!`);
                window.membersListSection();
            }
        });
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsText(file);
    }
}

// Keep viewLedger, editMember, suspendMember from previous (add reactivate call if needed)
