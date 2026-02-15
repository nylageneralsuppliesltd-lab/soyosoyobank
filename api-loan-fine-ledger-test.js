// Automated test: Backdate loan, create late repayments, pay fines, check ledger
// Run with: node api-loan-fine-ledger-test.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function getTestMember() {
  const res = await fetch(`${API_BASE}/members`);
  const data = await res.json();
  // API returns { data: [...] }
  return data.data.find(m => m.name === 'Test Member') || data.data[0];
}

async function getTestLoanType() {
  const res = await fetch(`${API_BASE}/loan-types`);
  const data = await res.json();
  // API returns an array
  return data.find(l => l.name === 'Test Loan Type') || data[0];
}

async function createLoan(memberId, loanTypeId) {
  const payload = {
    memberId,
    loanTypeId,
    amount: 10000,
    periodMonths: 6,
    interestRate: 12,
    disbursementDate: '2025-08-01', // Backdated 6+ months
    startDate: '2025-08-01',
    status: 'active',
    purpose: 'Backdated test loan',
  };
  const res = await fetch(`${API_BASE}/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Loan create failed: ' + await res.text());
  return await res.json();
}

async function approveLoan(loanId) {
  const res = await fetch(`${API_BASE}/loans/${loanId}/approve`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Loan approve failed: ' + await res.text());
  return await res.json();
}

async function postRepayment(loanId, amount, date) {
  const payload = {
    loanId,
    amount,
    date,
    paymentMethod: 'cash',
    reference: 'Automated test repayment'
  };
  const res = await fetch(`${API_BASE}/repayments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Repayment failed: ' + await res.text());
  return await res.json();
}

async function getLoanStatement(loanId) {
  const res = await fetch(`${API_BASE}/loans/${loanId}/statement`);
  if (!res.ok) throw new Error('Statement fetch failed: ' + await res.text());
  return await res.json();
}

async function getLedger(memberId) {
  const res = await fetch(`${API_BASE}/members/${memberId}/ledger`);
  if (!res.ok) throw new Error('Ledger fetch failed: ' + await res.text());
  return await res.json();
}

(async () => {
  try {
    const member = await getTestMember();
    const loanType = await getTestLoanType();
    console.log('Using member:', member.id, member.name);
    console.log('Using loan type:', loanType.id, loanType.name);
    const loan = await createLoan(member.id, loanType.id);
    console.log('Loan created:', loan.id);
    await approveLoan(loan.id);
    console.log('Loan approved.');
    // Repayment 1: On time (no fine)
    await postRepayment(loan.id, 2000, '2025-09-01');
    // Repayment 2: Late (should trigger fine)
    await postRepayment(loan.id, 2000, '2025-11-15');
    // Repayment 3: Pay all fines and principal
    await postRepayment(loan.id, 7000, '2026-02-01');
    console.log('Repayments posted.');
    const statement = await getLoanStatement(loan.id);
    console.log('Loan statement:', JSON.stringify(statement, null, 2));
    const ledger = await getLedger(member.id);
    console.log('Member ledger:', JSON.stringify(ledger, null, 2));
    // Check fines in statement
    if (statement.fines && statement.fines.length > 0) {
      console.log('Fines:');
      statement.fines.forEach(f => console.log(f));
    } else {
      console.log('No fines found.');
    }
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
