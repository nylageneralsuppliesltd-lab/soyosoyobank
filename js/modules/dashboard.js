// js/modules/dashboard.js - Dynamic Real-Data Dashboard (2026)

import { loadMembers } from '../storage.js';
import { getItem } from '../storage.js';
import { loadSettings } from './settings.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

export function renderDashboard() {
    const members = loadMembers();
    const deposits = getItem('deposits') || [];
   const withdrawals = getItem('withdrawals') || [];
    const settings = loadSettings();

    // === Membership Metrics ===
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.active !== false).length;
    const suspendedMembers = totalMembers - activeMembers;

    // Total shares/contributions balance from members
    const totalBalance = members.reduce((sum, m) => sum + (m.balance || 0), 0);

    // === Financial Metrics from Real Transactions ===
    const contributionsTotal = deposits
        .filter(d => d.type === 'contribution')
        .reduce((sum, d) => sum + d.amount, 0);

    const incomeTotal = deposits
        .filter(d => d.type === 'income' || d.type === 'fine')
        .reduce((sum, d) => sum + d.amount, 0);

    const expensesTotal = withdrawals
    .filter(w => w.type === 'expense')  // Only count actual expenses
    .reduce((sum, w) => sum + (w.amount || 0), 0);

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
            expenses: 0
        };
    });

    // Populate contributions & income from deposits
    deposits.forEach(d => {
        const date = new Date(d.date);
        if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            if (d.type === 'contribution') {
                monthly[monthIndex].contributions += d.amount;
            } else if (d.type === 'income' || d.type === 'fine') {
                monthly[monthIndex].income += d.amount;
            }
        }
    });

    // Populate withdrawals
    withdrawals.forEach(w => {
    if (w.type !== 'expense') return;  // Only count expenses in chart
    const date = new Date(w.date);
    if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        monthly[monthIndex].expenses += w.amount;
    }
});

    const monthlyLabels = monthly.map(m => m.label);
    const monthlyContributions = monthly.map(m => m.contributions);
    const monthlyIncome = monthly.map(m => m.income);
    const monthlyExpenses = monthly.map(m => m.expenses);

    // === Render Dashboard ===
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1>${saccoConfig.name} Dashboard</h1>
            <p class="subtitle">Financial & Membership Overview – ${now.toLocaleDateString('en-GB')}</p>

            <!-- Key Metric Cards -->
            <div class="metrics-grid">
                <div class="metric-card" onclick="loadSection('members-list')">
                    <h3>Total SACCO Balance</h3>
                    <h2>${formatCurrency(totalBalance)}</h2>
                    <p class="metric-link">Bank & eWallet Distribution →</p>
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

                <div class="metric-card" onclick="loadSection('deposits-contributions')">
                    <h3>Total Contributions</h3>
                    <h2>${formatCurrency(contributionsTotal)}</h2>
                    <p class="metric-link">Record / View Contributions →</p>
                </div>

                <div class="metric-card" onclick="loadSection('deposits-income')">
                    <h3>Other Income</h3>
                    <h2>${formatCurrency(incomeTotal)}</h2>
                    <p class="metric-link">Fines, Interest, etc. →</p>
                </div>

                <div class="metric-card expenses-card" onclick="loadSection('withdrawals-list')">
    <h3>Total Expenses</h3>
    <h2>${formatCurrency(expensesTotal)}</h2>
    <p class="metric-link">View all withdrawals →</p>
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
                    ${deposits.length + expenses.length === 0 
                        ? 'Start recording transactions to see trends here' 
                        : 'Contributions (bars) • Income & Expenses (lines)'
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
