async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(url + " -> " + res.status + " " + text);
  }
  return res.json();
}

function toISODateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function run() {
  const api = "http://localhost:3000/api";

  const loanTypes = await fetchJson(api + "/loan-types");
  const usableType = (loanTypes || []).find((type) => {
    const lateEnabled = !!type.lateFineEnabled;
    const outstandingEnabled = !!type.outstandingFineEnabled;
    const lateValue = Number(type.lateFineValue || 0);
    const outstandingValue = Number(type.outstandingFineValue || 0);
    return (lateEnabled && lateValue > 0) || (outstandingEnabled && outstandingValue > 0);
  });

  let loanTypeId = usableType?.id;

  if (!loanTypeId) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const created = await fetchJson(api + "/loan-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Fine Test " + stamp,
        description: "Auto-created for fine testing",
        interestRate: 12,
        interestType: "flat",
        interestRatePeriod: "year",
        periodMonths: 6,
        amortizationMethod: "equal_installment",
        repaymentFrequency: "monthly",
        lateFineEnabled: true,
        lateFineType: "fixed",
        lateFineValue: 100,
        lateFineFrequency: "once_off",
        lateFineChargeOn: "per_installment",
        outstandingFineEnabled: true,
        outstandingFineType: "fixed",
        outstandingFineValue: 50,
        outstandingFineFrequency: "monthly",
        outstandingFineChargeOn: "total_unpaid",
      }),
    });

    loanTypeId = created.data?.id || created.id;
  }

  const backdateStart = new Date();
  backdateStart.setMonth(backdateStart.getMonth() - 6);
  backdateStart.setDate(1);

  const loan = await fetchJson(api + "/loans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: 6,
      loanTypeId,
      amount: 10000,
      disbursementDate: toISODateOnly(backdateStart),
      startDate: toISODateOnly(backdateStart),
      status: "pending",
    }),
  });

  const loanId = loan.id || loan.data?.id;
  if (!loanId) {
    throw new Error("Loan creation failed");
  }

  await fetchJson(api + "/loans/" + loanId + "/approve", {
    method: "PATCH",
  });

  await fetchJson(api + "/loans/" + loanId + "/process-fines", {
    method: "POST",
  });

  const statement = await fetchJson(api + "/loans/" + loanId + "/statement");
  const fines = statement.fines || [];

  if (!fines.length) {
    throw new Error("No fines generated for backdated loan");
  }

  await fetchJson(api + "/repayments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      loanId,
      memberId: 6,
      amount: 500,
      date: toISODateOnly(new Date()),
      method: "cash",
    }),
  });

  const fineEntries = await fetchJson(api + "/ledger/transactions?category=fine");
  const finePaymentEntries = await fetchJson(api + "/ledger/transactions?category=fine_payment");

  const fineRefs = new Set(fines.map((fine) => "FINE-" + fine.id));
  const finePosting = fineEntries.filter((entry) => fineRefs.has(entry.reference));
  const finePayments = finePaymentEntries.filter((entry) => entry.reference && entry.reference.includes("REPAY-"));

  console.log("Loan type used:", loanTypeId);
  console.log("Loan created:", loanId);
  console.log("Fines generated:", fines.map((f) => ({ id: f.id, amount: f.amount, status: f.status, reason: f.reason })));
  console.log("Fine postings:", finePosting.map((e) => ({ reference: e.reference, debit: e.debitAmount, credit: e.creditAmount })));
  console.log("Fine payment postings (latest repayment):", finePayments.slice(-5).map((e) => ({ reference: e.reference, debit: e.debitAmount, credit: e.creditAmount })));
}

run().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
