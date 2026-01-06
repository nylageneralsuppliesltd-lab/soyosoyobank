const menuItems = document.querySelectorAll('.sidebar li');
const mainContent = document.getElementById('main-content');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    // Remove active from all
    menuItems.forEach(i => i.classList.remove('active'));
    // Set current as active
    item.classList.add('active');

    const section = item.dataset.section;
    loadSection(section);
  });
});

function loadSection(section) {
  switch(section) {
    case 'dashboard':
      mainContent.innerHTML = '<h2>Dashboard</h2><p>Overview of SoyoSoyo Bank.</p>';
      break;
    case 'members':
      mainContent.innerHTML = '<h2>Members</h2><p>List of all members will appear here.</p>';
      break;
    case 'contributions':
      mainContent.innerHTML = '<h2>Contributions</h2><p>Track contributions and deposits.</p>';
      break;
    case 'loans':
      mainContent.innerHTML = '<h2>Loans</h2><p>Manage loans and repayments.</p>';
      break;
    case 'reports':
      mainContent.innerHTML = '<h2>Reports</h2><p>Generate financial reports.</p>';
      break;
    case 'settings':
      mainContent.innerHTML = '<h2>Settings</h2><p>Configure system options.</p>';
      break;
    default:
      mainContent.innerHTML = '<p>Select a menu option to get started.</p>';
  }
}
