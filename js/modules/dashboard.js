// js/modules/dashboard.js - Dynamic Real-Data Dashboard (2026) - Now with Loans & Interest

import { loadMembers } from '../storage.js';
import { getItem } from '../storage.js';
import { loadSettings } from './settings.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderDashboard() {
    const members = getItem('soyoMembers') || [];
    const deposits = getItem('soyoDeposits') || [];
    const withdrawals = getItem('soyoExpenses') || [];
    const repayments = getItem('soyoRepayments') || [];
    const settings = getItem('soyoSettings') || {};

    // Fetch loans from backend API for production-grade accuracy
    let loans = [];
    try {
        // Synchronous XHR for legacy dashboard, replace with async/await if possible
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/loans', false); // false = synchronous
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send(null);
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            loans = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        } else {
            console.warn('Failed to fetch loans from backend, falling back to localStorage.');
            loans = getItem('soyoLoans') || [];
        }
    } catch (err) {
        console.error('Error fetching loans from backend:', err);
        loans = getItem('soyoLoans') || [];
    }

    // === Membership Metrics ===
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.active !== false).length;
    const suspendedMembers = totalMembers - activeMembers;

    // Total shares/contributions balance from members
    const totalBalance = members.reduce((sum, m) => sum + (m.balance || 0), 0);

    // === Financial Metrics from Real Transactions ===
    const contributionsTotal = deposits
        .filter(d => d.type === 'contribution')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    const incomeTotal = deposits
        .filter(d => d.type === 'income' || d.type === 'fine')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    const expensesTotal = withdrawals
        .filter(w => w.type === 'expense')
        .reduce((sum, w) => sum + (w.amount || 0), 0);

    // NEW: Interest Income (approximate 20% of repayments as interest)
    const interestIncomeTotal = repayments.reduce((sum, r) => {
        // In production: use real interest portion from loan schedule
        // Here: simple 20% approximation (common for reducing balance loans)
        return sum + (r.amount * 0.2);
    }, 0);

    // NEW: Total Loans Disbursed (only active loans)
    const totalLoansDisbursed = loans
        .filter(l => l.status === 'active' && l.disbursedDate)
        .reduce((sum, l) => sum + (l.amount || 0), 0);

    // NEW: Outstanding Loans (principal not yet repaid)
    // Use backend-calculated balance if available, else fallback
    const outstandingLoans = loans
        .filter(l => l.status === 'active' && l.disbursedDate)
        .reduce((sum, l) => sum + (typeof l.balance === 'number' ? l.balance : ((l.amount || 0) - (l.principalPaid || 0))), 0);

    // === Bank & eWallet Distribution (from Settings) ===
    const bankAccounts = settings.bankAccounts || [];
    const bankDistribution = bankAccounts.length > 0
        ? bankAccounts
        : [{ name: 'Main Account (Not Configured)', balance: totalBalance }];

    // === Monthly Trend Data (Real from Transactions) ===
    const now = new Date();
    const currentYear = now.getFullYear();

    // Initialize 12 months
    const monthly = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentYear, i, 1);
        return {
            label: date.toLocaleString('default', { month: 'short' }),
            contributions: 0,
            income: 0,
            expenses: 0,
            interest: 0  // NEW: for interest income
        };
    });

    // Populate contributions & other income from deposits
    deposits.forEach(d => {
        const date = new Date(d.date);
        if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            if (d.type === 'contribution') {
                monthly[monthIndex].contributions += (d.amount || 0);
            } else if (d.type === 'income' || d.type === 'fine') {
                monthly[monthIndex].income += (d.amount || 0);
            }
        }
    });

    // Populate expenses from withdrawals
    withdrawals.forEach(w => {
        if (w.type !== 'expense') return;
        const date = new Date(w.date);
        if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            monthly[monthIndex].expenses += (w.amount || 0);
        }
    });

    // NEW: Populate interest income from loan repayments
    repayments.forEach(r => {
        const date = new Date(r.date);
        if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            // Approximate interest portion (in production: use real schedule)
            const interestApprox = r.amount * 0.2;
            monthly[monthIndex].interest += interestApprox;
        }
    });

    const monthlyLabels = monthly.map(m => m.label);
    const monthlyContributions = monthly.map(m => m.contributions);
    const monthlyIncome = monthly.map(m => m.income);
    const monthlyExpenses = monthly.map(m => m.expenses);
    const monthlyInterest = monthly.map(m => m.interest);  // NEW

    // Check if any financial transaction exists
    const hasTransactions = deposits.length > 0 || withdrawals.length > 0 || loans.length > 0 || repayments.length > 0;

    // === Render Dashboard ===
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1>${saccoConfig.name} Dashboard</h1>
            <p class="subtitle">Financial & Membership Overview – ${now.toLocaleDateString('en-GB')}</p>

            <!-- Key Metric Cards -->
            <div class="metrics-grid">
                <!-- Total SACCO Balance -->
                <div class="metric-card" onclick="loadSection('members-list')">
                    <h3>Total SACCO Balance</h3>
                    <h2>${formatCurrency(totalBalance)}</h2>
                    <p class="metric-link">View member balances & distribution →</p>
                    <div class="balance-dist">
                        ${bankDistribution.map(acc => `
                            <div><strong>${acc.name}:</strong> ${formatCurrency(acc.balance || 0)}</div>
                        `).join('')}
                        ${bankAccounts.length === 0 ? 
                            `<small style="color:#856404; grid-column:1/-1; margin-top:8px;">
                                Configure accounts in Settings → Banking
                            </small>` : ''
                        }
                    </div>
                </div>

                <!-- Total Contributions -->
                <div class="metric-card" onclick="loadSection('deposits-contributions')">
                    <h3>Total Contributions</h3>
                    <h2>${formatCurrency(contributionsTotal)}</h2>
                    <p class="metric-link">Record or view contributions →</p>
                </div>

                <!-- Other Income -->
                <div class="metric-card" onclick="loadSection('deposits-list')">
                    <h3>Other Income</h3>
                    <h2>${formatCurrency(incomeTotal)}</h2>
                    <p class="metric-link">View all income transactions →</p>
                </div>

                <!-- Total Expenses -->
                <div class="metric-card expenses-card" onclick="loadSection('withdrawals-list')">
                    <h3>Total Expenses</h3>
                    <h2>${formatCurrency(expensesTotal)}</h2>
                    <p class="metric-link">${expensesTotal > 0 ? 'View all expenses & outflows →' : 'No expenses recorded yet'}</p>
                </div>

                <!-- NEW: Interest Income from Loans -->
                <div class="metric-card" onclick="loadSection('general-ledger')">
                    <h3>Interest Income (YTD)</h3>
                    <h2 style="color:#28a745;">${formatCurrency(interestIncomeTotal)}</h2>
                    <p class="metric-link">View in ledger →</p>
                </div>

                <!-- NEW: Outstanding Loans -->
                <div class="metric-card" onclick="loadSection('active-loans')">
                    <h3>Outstanding Loans</h3>
                    <h2 style="color:#007bff;">${formatCurrency(outstandingLoans)}</h2>
                    <p class="metric-link">View active loans →</p>
                </div>

                <!-- NEW: Total Loans Disbursed -->
                <div class="metric-card" onclick="loadSection('active-loans')">
                    <h3>Total Loans Disbursed</h3>
                    <h2 style="color:#6c757d;">${formatCurrency(totalLoansDisbursed)}</h2>
                    <p class="metric-link">View all loans →</p>
                </div>
            </div>

            <!-- Membership Summary -->
            <div class="section-card" onclick="loadSection('members-list')">
                <h3>Membership Summary <span class="section-link">→ View Full List</span></h3>
                <div class="members-summary">
                    <div class="stat">
                        <h2>${totalMembers}</h2>
                        <p>Total Members</p>
                    </div>
                    <div class="stat">
                        <h2 style="color:#28a745;">${activeMembers}</h2>
                        <p>Active</p>
                    </div>
                    <div class="stat">
                        <h2 style="color:#fd7e14;">${suspendedMembers}</h2>
                        <p>Suspended</p>
                    </div>
                </div>
            </div>

            <!-- Monthly Trend Chart -->
            <div class="section-card">
                <h3>Financial Trends ${currentYear}</h3>
                <p class="chart-note">
                    ${hasTransactions
                        ? 'Contributions (bars) • Income, Expenses & Interest (lines)'
                        : 'Start recording transactions to see trends here'
                    }
                </p>
                <canvas id="financial-chart" height="400"></canvas>
            </div>
        </div>
    `;

    // === Render Chart ===
    const ctx = document.getElementById('financial-chart');
    if (ctx) {
        // Destroy previous chart if exists
        if (ctx.chart) ctx.chart.destroy();

        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyLabels,
                datasets: [
                    {
                        label: 'Contributions',
                        data: monthlyContributions,
                        type: 'bar',
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: '#28a745',
                        borderWidth: 2,
                        barThickness: 30
                    },
                    {
                        label: 'Other Income',
                        data: monthlyIncome,
                        type: 'line',
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Expenses',
                        data: monthlyExpenses,
                        type: 'line',
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    },
                    // NEW: Interest Income line
                    {
                        label: 'Interest Income',
                        data: monthlyInterest,
                        type: 'line',
                        borderColor: '#17a2b8',  // Cyan for interest
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${formatCurrency(value)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, padding: 20 }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    }
                }
            }
        });
    }
}
