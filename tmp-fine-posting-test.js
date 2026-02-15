async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(url + " -> " + res.status + " " + text);
  }
  return res.json();
}

async function run() {
  require("./react-ui/backend/node_modules/dotenv").config({
    path: "react-ui/backend/.env",
  });
  const api = "http://localhost:3000/api";

  const fine = await fetchJson(api + "/fines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memberId: 6,
      loanId: 8,
      amount: 123,
      reason: "Test fine accrual",
      type: "late_payment",
    }),
  });

  console.log("Fine created:", fine.id);

  await fetchJson(api + "/fines/" + fine.id + "/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountPaid: 50 }),
  });

  await fetchJson(api + "/fines/" + fine.id + "/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountPaid: 123 }),
  });

  const fineEntries = await fetchJson(
    api + "/ledger/transactions?category=fine"
  );
  const finePaymentEntries = await fetchJson(
    api + "/ledger/transactions?category=fine_payment"
  );
  const summary = await fetchJson(api + "/ledger/summary");

  const fineRefs = new Set(["FINE-" + fine.id, "FINE-PAY-" + fine.id]);
  const filteredEntries = [...fineEntries, ...finePaymentEntries].filter(
    (entry) => fineRefs.has(entry.reference)
  );

  const summaryAccounts = (summary.accounts || []).filter((acc) =>
    ["Fines Receivable", "Fine Income", "Cashbox"].includes(acc.name)
  );

  console.log(
    "Journal entries:",
    filteredEntries.map((e) => ({
      reference: e.reference,
      description: e.description,
      debit: e.debitAmount,
      credit: e.creditAmount,
      debitAccount: e.debitAccount?.name,
      creditAccount: e.creditAccount?.name,
    }))
  );

  console.log(
    "Accounts:",
    summaryAccounts.map((a) => ({ name: a.name, balance: a.balance }))
  );
}

run().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
