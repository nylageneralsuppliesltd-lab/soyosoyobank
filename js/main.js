// js/main.js - FINAL VERSION WITH FULL REPORTS SUPPORT

import { initMenu } from './modules/menu.js';
import { renderGeneralLedger } from './modules/generalLedger.js';

// Members Module
import { 
    renderCreateMemberForm, 
    renderMembersList, 
    initMembersModule 
} from './modules/members.js';

// Deposits Module
import { 
    renderContributionForm,
    renderFineForm,
    renderIncomeForm,
    renderLoanRepaymentForm,
    renderDepositsHistory,
    initDepositsModule 
} from './modules/deposits.js';

// Withdrawals Module
import { 
    renderExpenseForm,
    renderDividendPayoutForm,
    renderContributionRefundForm,
    renderAccountTransferForm,
    renderWithdrawalsList,
    initWithdrawalsModule 
} from './modules/withdrawals.js';

// Loans Module
import { 
    renderLoanApplications,
    renderLoanTypes,
    renderLoanCalculator,
    renderMemberLoans,
    renderBankLoans,
    initLoansModule 
} from './modules/loans.js';

// Dashboard
import { renderDashboard } from './modules/dashboard.js';

// Settings
import { renderSettings, initSettingsModule } from './modules/settings.js';



// Reports - FULLY INTEGRATED
import { 
    balanceSheet,
    incomeStatement,
    memberStatements,
    depositsSummary,
    loansPortfolio,
    sasraMonthly,
    sasraAnnual,
    dividendRecommendation,
    loanAging,
    initReportsModule 
} from './modules/reports.js';

import { saccoConfig } from './config.js';

// DOM References
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title');

document.title = `${saccoConfig.name} • Management System`;

/**
 * Load a section
 */
function loadSection(section = 'dashboard') {
    if (mainContent) mainContent.innerHTML = '';
    if (pageTitle) pageTitle.textContent = 'Loading...';

    let titleText = 'Dashboard';

    switch (section) {
        case 'dashboard':
            renderDashboard();
            titleText = 'Dashboard';
            break;

        // === SETTINGS ===
        case 'settings':
        case 'settings-contributions':
        case 'settings-invoices':
        case 'settings-expenses':
        case 'settings-fines':
        case 'settings-roles':
        case 'settings-assets':
        case 'settings-income':
        case 'settings-accounts':
            initSettingsModule();
            titleText = 'Settings & Configuration';
            break;

        

        case 'general-ledger':
            renderGeneralLedger();
            titleText = 'General Ledger';
            break;

        // === Members ===
        case 'create-member':
            renderCreateMemberForm();
            titleText = 'Register New Member';
            break;

        case 'members-list':
            renderMembersList();
            titleText = 'Members List';
            break;

        // === Deposits ===
        case 'deposits-contributions':
            renderContributionForm();
            titleText = 'Record Contribution';
            break;

        case 'deposits-fines':
            renderFineForm();
            titleText = 'Record Fine / Penalty';
            break;

        case 'deposits-income':
            renderIncomeForm();
            titleText = 'Record Other Income';
            break;

        case 'deposits-loan-repayments':
            renderLoanRepaymentForm();
            titleText = 'Record Loan Repayment';
            break;

        case 'deposits-list':
            renderDepositsHistory();
            titleText = 'All Deposits & Transactions';
            break;
        // === Withdrawals ===
        case 'record-expense':
            renderExpenseForm();
            titleText = 'Record Expense';
            break;

        case 'record-dividend':
            renderDividendPayoutForm();
            titleText = 'Record Dividend Payout';
            break;

        case 'contribution-refund':
            renderContributionRefundForm();
            titleText = 'Contribution Refund';
            break;

        case 'account-transfer':
            renderAccountTransferForm();
            titleText = 'Account to Account Transfer';
            break;

        case 'withdrawals-list':
            renderWithdrawalsList();
            titleText = 'List of Withdrawals';
            break;
                   // === Loans ===
        case 'loan-applications':
            renderLoanApplications();
            titleText = 'Loan Applications';
            break;

        case 'loan-types':
            renderLoanTypes();
            titleText = 'Loan Types';
            break;

        case 'loan-calculator':
            renderLoanCalculator();
            titleText = 'Loan Calculator';
            break;

        case 'member-loans':
            renderMemberLoans();
            titleText = 'Member Loans';
            break;

        case 'bank-loans':
            renderBankLoans();
            titleText = 'Bank Loans';
            break;
            
        // === REPORTS - NOW FULLY WORKING ===
        case 'balance-sheet':
            balanceSheet();
            titleText = 'Balance Sheet';
            break;

        case 'income-statement':
            incomeStatement();
            titleText = 'Income Statement';
            break;

        case 'member-statements':
            memberStatements();
            titleText = 'Member Statements';
            break;

        case 'deposits-summary':
            depositsSummary();
            titleText = 'Deposits Summary';
            break;

        case 'loans-portfolio':
            loansPortfolio();
            titleText = 'Loans Portfolio';
            break;

        case 'sasra-monthly':
            sasraMonthly();
            titleText = 'SASRA Monthly Return';
            break;

        case 'sasra-annual':
            sasraAnnual();
            titleText = 'SASRA Annual Return';
            break;

        case 'dividend-recommendation':
            dividendRecommendation();
            titleText = 'Dividend Recommendation';
            break;

        case 'loan-aging':
            loanAging();
            titleText = 'Loan Aging Report';
            break;

        // === Fallback ===
        default:
            titleText = section
                .split('-')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

            mainContent.innerHTML = `
                <div class="section-card" style="text-align:center; padding:60px; max-width:700px; margin:0 auto;">
                    <h1>${titleText}</h1>
                    <p>This module is under development and will be available soon.</p>
                    <p style="color:#666; margin-top:20px;">
                        Upcoming: Loans Management, Dividends...
                    </p>
                </div>
            `;
            break;
    }

    if (pageTitle) pageTitle.textContent = titleText;
    document.title = `${titleText} • ${saccoConfig.name}`;

    history.pushState({ section }, titleText, `#${section}`);
    setActiveMenu(section);
}

/**
 * Highlight active menu item
 */
function setActiveMenu(section) {
    document.querySelectorAll('.menu-item, .submenu li').forEach(el => el.classList.remove('active'));

    const target = document.querySelector(`[data-section="${section}"]`);
    if (target) {
        target.classList.add('active');
        const parentMenu = target.closest('.menu-item.has-submenu');
        if (parentMenu) parentMenu.classList.add('active');
    }

    if (section === 'dashboard') {
        document.querySelector('[data-section="dashboard"]')?.classList.add('active');
    }
}

// ===================================================================
// NAVIGATION LISTENERS
// ===================================================================

document.querySelectorAll('.menu-item > .menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const parentItem = link.parentElement;

        if (parentItem.classList.contains('has-submenu')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const section = parentItem.dataset.section || 'dashboard';
        loadSection(section);

        if (window.innerWidth <= 992) {
            document.getElementById('sidebar').classList.remove('open');
        }
    });
});

document.querySelectorAll('.submenu li').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const section = item.dataset.section;
        if (section) {
            loadSection(section);
            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('open');
            }
        }
    });
});

window.addEventListener('popstate', (e) => {
    const section = e.state?.section || window.location.hash.slice(1) || 'dashboard';
    loadSection(section);
});

// ===================================================================
// INITIALIZATION
// ===================================================================

initMenu();
initMembersModule();
initDepositsModule();
initSettingsModule();
initReportsModule();  // NOW UNCOMMENTED - REPORTS WORK!
initLoansModule();

const initialSection = window.location.hash.slice(1) || 'dashboard';
loadSection(initialSection);
setActiveMenu(initialSection);

window.loadSection = loadSection;
