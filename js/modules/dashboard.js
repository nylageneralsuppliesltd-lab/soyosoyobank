// js/modules/dashboard.js - Modern SACCO Dashboard

import { loadMembers } from '../storage.js';
import { formatCurrency } from '../utils/helpers.js';
import { saccoConfig } from '../config.js';

let members = loadMembers();

export function renderDashboard() {
    // Calculate key metrics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.active).length;
    const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);

    // Placeholder for future dynamic ledger types from Settings
    const contributions = members.reduce((sum, m) => sum + m.contributions || 0, 0);
    const otherIncome = members.reduce((sum, m) => sum + m.otherIncome || 0, 0);
    const expenses = 73000; // Will come from expenses ledger in future

    // Placeholder bank/eWallet distribution (configurable in Settings later)
    const balanceDistribution = {
        'Bank A': totalBalance * 0.38,
        'Bank B': totalBalance * 0.24,
        'Bank C': totalBalance * 0.14,
        'eWallet': totalBalance * 0.24
    };

    // Monthly data placeholder - will be dynamic from ledger
    const monthlyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        contributions: [12000, 15000, 18000, 14000, 16000, 20000, 22000, 19000, 17000, 21000, 23000, 25000],
        income: [5000, 6000, 4500, 7000, 8000, 6500, 9000, 7500, 6000, 8500, 9500, 10000],
        expenses: [6000, 6500, 7000, 6200, 6800, 7200, 7500, 7000, 6800, 7300, 7600, 8000]
    };

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="dashboard">
            <h1>${saccoConfig.name} Dashboard</h1>
            <p class="subtitle">Financial & Membership Overview – ${new Date().toLocaleDateString('en-GB')}</p>

            <!-- Key Metric Cards -->
            <div class="metrics-grid">
                <div class="metric-card" onclick="loadSection('members-list')">
                    <h3>Total Balance</h3>
                    <h2>${formatCurrency(totalBalance)}</h2>
                    <p class="metric-link">Click for Banking & eWallet Breakdown →</p>
                    <div class="balance-dist">
                        ${Object.entries(balanceDistribution).map(([bank, amt]) => `
                            <div><strong>${bank}:</strong> ${formatCurrency(amt)}</div>
                        `).join('')}
                    </div>
                </div>

                <div class="metric-card" onclick="loadSection('deposits-contributions')">
                    <h3>Contributions</h3>
                    <h2>${formatCurrency(contributions)}</h2>
                    <p class="metric-link">Record / View Contributions →</p>
                </div>

                <div class="metric-card" onclick="loadSection('deposits-income')">
                    <h3>Other Income</h3>
                    <h2>${formatCurrency(otherIncome)}</h2>
                    <p class="metric-link">Record / View Income →</p>
                </div>

                <div class="metric-card expenses-card">
                    <h3>Total Expenses</h3>
                    <h2>${formatCurrency(expenses)}</h2>
                    <p class="metric-link">Click to expand breakdown ↓</p>
                    <details style="margin-top:10px;">
                        <summary style="cursor:pointer;color:#dc3545;font-weight:600;">View Breakdown</summary>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li>Office Rent → KSh 15,000</li>
                            <li>Staff Salaries → KSh 45,000</li>
                            <li>Utilities → KSh 5,000</li>
                            <li>Other → KSh 8,000</li>
                        </ul>
                    </details>
                </div>
            </div>

            <!-- Members Summary -->
            <div class="section-card" onclick="loadSection('members-list')">
                <h3>Membership Summary <span class="section-link">→ Full List</span></h3>
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
                        <h2 style="color:#fd7e14;">${totalMembers - activeMembers}</h2>
                        <p>Suspended</p>
                    </div>
                </div>
            </div>

            <!-- Monthly Trend Chart -->
            <div class="section-card">
                <h3>Monthly Financial Trends (2025)</h3>
                <p class="chart-note">Hover for exact values • Contributions (bars) • Income & Expenses (lines)</p>
                <div id="financial-chart"></div>
            </div>
        </div>
    `;

    // Render Chart (using Chart.js - include CDN in index.html)
    const ctx = document.getElementById('financial-chart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Contributions',
                        data: monthlyData.contributions,
                        type: 'bar',
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: '#28a745',
                        borderWidth: 2
                    },
                    {
                        label: 'Other Income',
                        data: monthlyData.income,
                        type: 'line',
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: monthlyData.expenses,
                        type: 'line',
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });
    }
}
