// js/config.js - Customizable SACCO Branding & General Settings

export const saccoConfig = {
    name: 'SoyoSoyoApp',              // SACCO name shown in title, header, etc.
    primaryColor: '#28a745',          // Main brand color (e.g., green for SoyoSoyo)
    accentColor: '#fd7e14',           // Buttons, highlights (orange)
    logoPath: './assets/logo.png',    // Path to SACCO logo
    currency: 'KSh',                  // Currency symbol (can be changed to TZS, UGX, etc.)
    dateFormat: 'en-GB',              // Date format: DD/MM/YYYY
    phoneCountryCode: '254',          // Default country code for phone validation
    maxNominees: 3,                   // Maximum number of next of kin/nominees
    allowCustomRoles: true,           // Allow "Other" role with custom name

    // Future: These will come from Settings module (admin-defined)
    // contributionTypes: ['Monthly Shares', 'Registration Fee', 'Building Fund'],
    // fineTypes: ['Late Contribution', 'Loan Default', 'Meeting Absence'],
    // minAmounts: { contribution: 500, fine: 100 }

    // Placeholder for future dynamic settings
    settings: {
        contributions: [],
        fines: [],
        loanProducts: []
    }
};
