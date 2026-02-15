// Loan repayment and statement API test
// Run with: node api-loan-repayment-test.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function getLoans() {
  const res = await fetch(`${API_BASE}/loans`);
  if (!res.ok) throw new Error('Failed to fetch loans');
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

async function postRepayment(loanId, amount) {
  const payload = {
    loanId,
    amount,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: 'API Test Repayment'
  };
  const res = await fetch(`${API_BASE}/repayments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Repayment failed: ' + err);
  }
  return await res.json();
}

async function getLoanStatement(loanId) {
  const res = await fetch(`${API_BASE}/loans/${loanId}/statement`);
  if (!res.ok) throw new Error('Failed to fetch statement');
  return await res.json();
}

(async () => {
  try {
    const loans = await getLoans();
    if (!loans.length) throw new Error('No loans found');
    const loan = loans[0];
    console.log('Using loan:', loan.id, loan.memberName || loan.member?.name, 'Balance:', loan.balance);
    const repaymentAmount = Math.min(loan.balance || 100, 100); // Repay up to 100 or remaining balance
    const repayment = await postRepayment(loan.id, repaymentAmount);
    console.log('Repayment posted:', repayment);
    const statement = await getLoanStatement(loan.id);
    console.log('Loan statement:', JSON.stringify(statement, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
