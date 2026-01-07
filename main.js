const menuItems = document.querySelectorAll('.menu li');
const mainContent = document.getElementById('main-content');

menuItems.forEach(item => {
    item.addEventListener('click', () => {

        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        loadSection(item.dataset.section);
    });
});

function loadSection(section) {

    if (section === "create-member") {
        mainContent.innerHTML = `
            <h1>Create New Member</h1>
            <p class="subtitle">Register a member into the SoyoSoyo Bank system</p>

            <form class="form-card">

                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" placeholder="Enter full name">
                </div>

                <div class="form-group">
                    <label>ID / Passport Number</label>
                    <input type="text" placeholder="Enter ID or passport">
                </div>

                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="07XX XXX XXX">
                </div>

                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="Enter email address">
                </div>

                <div class="form-group">
                    <label>Gender</label>
                    <select>
                        <option value="">Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date">
                </div>

                <button type="submit" class="submit-btn">Create Member</button>
            </form>
        `;
        return;
    }

    // Default sections
    mainContent.innerHTML = `
        <h1>${section.replace("-", " ").toUpperCase()}</h1>
        <p>This section is under development.</p>
    `;
}
