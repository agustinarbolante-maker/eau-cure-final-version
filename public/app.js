// ============== AUTHENTICATION ==============
let authToken = localStorage.getItem('authToken');
let currentUser = localStorage.getItem('currentUser');
let currentUserRole = localStorage.getItem('currentUserRole');

const loginPage = document.getElementById('loginPage');
const appPage = document.getElementById('appPage');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');

// ============== DATA STORAGE ==============
let deliveries = [];
let companies = [];
let billings = [];
let users = [];

// ============== INITIALIZATION ==============
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  setupTabButtons();
  setupForms();
  setupCloseButtons();
});

// ============== AUTH FUNCTIONS ==============
function checkAuth() {
  if (!authToken) {
    showLoginPage();
  } else {
    showAppPage();
    loadAllData();
    updateAdminVisibility();
  }
}

function showLoginPage() {
  loginPage.style.display = 'flex';
  appPage.style.display = 'none';
  loginForm.addEventListener('submit', handleLogin);
}

function showAppPage() {
  loginPage.style.display = 'none';
  appPage.style.display = 'block';
  currentUserSpan.textContent = `${currentUser} (${currentUserRole})`;
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const error = document.getElementById('loginError');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      error.textContent = data.error || 'Login failed';
      error.style.display = 'block';
      return;
    }

    authToken = data.token;
    currentUser = data.user.username;
    currentUserRole = data.user.role;

    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('currentUserRole', currentUserRole);

    loginForm.reset();
    error.style.display = 'none';
    showAppPage();
    loadAllData();
    updateAdminVisibility();
  } catch (err) {
    error.textContent = 'Network error';
    error.style.display = 'block';
  }
}

function handleLogout() {
  authToken = null;
  currentUser = null;
  currentUserRole = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentUserRole');
  showLoginPage();
  loginForm.reset();
}

function updateAdminVisibility() {
  const adminTabs = document.querySelectorAll('.admin-only');
  const isAdmin = ['owner', 'software_engineer'].includes(currentUserRole);
  adminTabs.forEach(tab => {
    tab.classList.toggle('admin-hidden', !isAdmin);
  });
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };
}

// ============== TAB FUNCTIONS ==============
function setupTabButtons() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      showTab(tabName);
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  const tab = document.getElementById(tabName + '-tab');
  if (tab) tab.classList.add('active');
}

// ============== MODAL FUNCTIONS ==============
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function setupCloseButtons() {
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.modal').classList.remove('show');
    });
  });

  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
}

// ============== DATA LOADING ==============
async function loadAllData() {
  loadDeliveries();
  loadCompanies();
  loadBillings();
  loadReports();
  if (['owner', 'software_engineer'].includes(currentUserRole)) {
    loadUsers();
  }
}

async function loadDeliveries() {
  try {
    const res = await fetch('/api/deliveries', { headers: getHeaders() });
    if (!res.ok) throw new Error();
    deliveries = await res.json();
    renderDeliveries();
  } catch (err) {
    console.error('Error loading deliveries:', err);
  }
}

async function loadCompanies() {
  try {
    const res = await fetch('/api/companies', { headers: getHeaders() });
    if (!res.ok) throw new Error();
    companies = await res.json();
    renderCompanies();
    updateCompanySelects();
  } catch (err) {
    console.error('Error loading companies:', err);
  }
}

async function loadBillings() {
  try {
    const res = await fetch('/api/billing-statements', { headers: getHeaders() });
    if (!res.ok) throw new Error();
    billings = await res.json();
    renderBillings();
  } catch (err) {
    console.error('Error loading billings:', err);
  }
}

async function loadReports() {
  try {
    const res = await fetch('/api/deliveries', { headers: getHeaders() });
    if (!res.ok) throw new Error();
    const dels = await res.json();
    renderReports(dels);
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users', { headers: getHeaders() });
    if (!res.ok) throw new Error();
    users = await res.json();
    renderUsers();
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// ============== DELIVERIES ==============
function renderDeliveries() {
  const tbody = document.getElementById('deliveriesBody');
  if (deliveries.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No deliveries yet</td></tr>';
    return;
  }

  tbody.innerHTML = deliveries.map(d => `
    <tr>
      <td>${escapeHtml(d.company)}</td>
      <td>${d.bottles_delivered}</td>
      <td>${d.bottles_returned}</td>
      <td>${escapeHtml(d.location || '-')}</td>
      <td>${new Date(d.timestamp).toLocaleString()}</td>
      <td class="actions">
        <button class="btn btn-sm btn-primary" onclick="editDelivery(${d.id})">Edit</button>
        <button class="btn btn-sm btn-delete" onclick="deleteDelivery(${d.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function setupForms() {
  document.getElementById('deliveryForm').addEventListener('submit', addDelivery);
  document.getElementById('editDeliveryForm').addEventListener('submit', saveDelivery);
  document.getElementById('companyForm').addEventListener('submit', addCompany);
  document.getElementById('editCompanyForm').addEventListener('submit', saveCompany);
  document.getElementById('billingForm').addEventListener('submit', addBilling);
  document.getElementById('editBillingForm').addEventListener('submit', toggleBillingStatus);
  document.getElementById('userForm').addEventListener('submit', addUser);
}

async function addDelivery(e) {
  e.preventDefault();
  try {
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        company: document.getElementById('delCompany').value,
        bottles_delivered: parseInt(document.getElementById('delDelivered').value),
        bottles_returned: parseInt(document.getElementById('delReturned').value),
        location: document.getElementById('delLocation').value,
        notes: document.getElementById('delNotes').value
      })
    });
    if (!res.ok) throw new Error();
    e.target.reset();
    loadDeliveries();
  } catch (err) {
    alert('Error adding delivery');
  }
}

function editDelivery(id) {
  const d = deliveries.find(x => x.id === id);
  if (!d) return;
  document.getElementById('editDelId').value = id;
  document.getElementById('editDelCompany').value = d.company;
  document.getElementById('editDelDelivered').value = d.bottles_delivered;
  document.getElementById('editDelReturned').value = d.bottles_returned;
  document.getElementById('editDelLocation').value = d.location || '';
  document.getElementById('editDelNotes').value = d.notes || '';
  openModal('editDeliveryModal');
}

async function saveDelivery(e) {
  e.preventDefault();
  const id = document.getElementById('editDelId').value;
  try {
    const res = await fetch(`/api/deliveries/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        company: document.getElementById('editDelCompany').value,
        bottles_delivered: parseInt(document.getElementById('editDelDelivered').value),
        bottles_returned: parseInt(document.getElementById('editDelReturned').value),
        location: document.getElementById('editDelLocation').value,
        notes: document.getElementById('editDelNotes').value
      })
    });
    if (!res.ok) throw new Error();
    closeModal('editDeliveryModal');
    loadDeliveries();
  } catch (err) {
    alert('Error saving delivery');
  }
}

async function deleteDelivery(id) {
  if (!confirm('Delete this delivery?')) return;
  try {
    const res = await fetch(`/api/deliveries/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error();
    loadDeliveries();
  } catch (err) {
    alert('Error deleting delivery');
  }
}

// ============== COMPANIES ==============
function renderCompanies() {
  const tbody = document.getElementById('companiesBody');
  if (companies.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="3">No companies yet</td></tr>';
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>₱${parseFloat(c.unit_price).toFixed(2)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-primary" onclick="editCompany('${escapeHtml(c.name)}', ${c.unit_price})">Edit</button>
        <button class="btn btn-sm btn-delete" onclick="deleteCompany('${escapeHtml(c.name)}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function updateCompanySelects() {
  [document.getElementById('delCompany'), document.getElementById('bilCompany')].forEach(sel => {
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Company</option>' +
      companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  });
}

async function addCompany(e) {
  e.preventDefault();
  try {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: document.getElementById('comName').value,
        unitPrice: parseFloat(document.getElementById('comPrice').value)
      })
    });
    if (!res.ok) throw new Error();
    e.target.reset();
    loadCompanies();
  } catch (err) {
    alert('Error adding company');
  }
}

function editCompany(name, price) {
  document.getElementById('editComId').value = name;
  document.getElementById('editComName').value = name;
  document.getElementById('editComPrice').value = price;
  openModal('editCompanyModal');
}

async function saveCompany(e) {
  e.preventDefault();
  const oldName = document.getElementById('editComId').value;
  const newName = document.getElementById('editComName').value;
  const price = parseFloat(document.getElementById('editComPrice').value);

  try {
    const res = await fetch(`/api/companies/${oldName}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name: newName, unitPrice: price })
    });
    if (!res.ok) throw new Error();
    closeModal('editCompanyModal');
    loadCompanies();
  } catch (err) {
    alert('Error saving company');
  }
}

async function deleteCompany(name) {
  if (!confirm('Delete this company?')) return;
  try {
    const res = await fetch(`/api/companies/${name}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error();
    loadCompanies();
  } catch (err) {
    alert('Error deleting company');
  }
}

// ============== BILLING ==============
function renderBillings() {
  const tbody = document.getElementById('billingBody');
  if (billings.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="5">No billing statements yet</td></tr>';
    return;
  }

  tbody.innerHTML = billings.map(b => `
    <tr>
      <td>${escapeHtml(b.company_name)}</td>
      <td>${b.start_date} to ${b.end_date}</td>
      <td>₱${parseFloat(b.total_amount).toFixed(2)}</td>
      <td><span class="badge ${b.is_paid ? 'badge-success' : 'badge-warning'}">${b.is_paid ? 'Paid' : 'Pending'}</span></td>
      <td class="actions">
        <button class="btn btn-sm btn-primary" onclick="editBilling(${b.id}, ${b.is_paid})">Toggle</button>
      </td>
    </tr>
  `).join('');
}

async function addBilling(e) {
  e.preventDefault();
  try {
    const res = await fetch('/api/billing-statements', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        company: document.getElementById('bilCompany').value,
        startDate: document.getElementById('bilMonth').value + '-01',
        endDate: document.getElementById('bilMonth').value + '-31',
        totalAmount: parseFloat(document.getElementById('bilAmount').value)
      })
    });
    if (!res.ok) throw new Error();
    e.target.reset();
    loadBillings();
  } catch (err) {
    alert('Error adding billing');
  }
}

function editBilling(id, isPaid) {
  document.getElementById('editBilId').value = id;
  document.getElementById('billingStatusText').textContent = `Current status: ${isPaid ? 'Paid' : 'Pending'}`;
  openModal('editBillingModal');
}

async function toggleBillingStatus(e) {
  e.preventDefault();
  const id = document.getElementById('editBilId').value;
  try {
    const res = await fetch(`/api/billing-statements/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isPaid: true })
    });
    if (!res.ok) throw new Error();
    closeModal('editBillingModal');
    loadBillings();
  } catch (err) {
    alert('Error updating billing');
  }
}

// ============== REPORTS ==============
function renderReports(dels) {
  const statsGrid = document.getElementById('statsGrid');
  const tbody = document.getElementById('reportsBody');

  if (dels.length === 0) {
    statsGrid.innerHTML = '';
    tbody.innerHTML = '<tr class="empty-state"><td colspan="4">No data yet</td></tr>';
    return;
  }

  const totalBottles = dels.reduce((sum, d) => sum + (d.bottles_delivered || 0), 0);
  const totalReturned = dels.reduce((sum, d) => sum + (d.bottles_returned || 0), 0);

  statsGrid.innerHTML = `
    <div class="stat-card">
      <h3>Total Deliveries</h3>
      <div class="stat-value">${dels.length}</div>
    </div>
    <div class="stat-card">
      <h3>Total Delivered</h3>
      <div class="stat-value">${totalBottles}</div>
    </div>
    <div class="stat-card">
      <h3>Total Returned</h3>
      <div class="stat-value">${totalReturned}</div>
    </div>
    <div class="stat-card">
      <h3>Avg per Delivery</h3>
      <div class="stat-value">${(totalBottles / dels.length).toFixed(0)}</div>
    </div>
  `;

  tbody.innerHTML = dels.slice(0, 10).map(d => `
    <tr>
      <td>${escapeHtml(d.company)}</td>
      <td>${d.bottles_delivered}</td>
      <td>${d.bottles_returned}</td>
      <td>${new Date(d.timestamp).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// ============== USERS ==============
function renderUsers() {
  const tbody = document.getElementById('usersBody');
  if (users.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="4">No users yet</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${u.role}</td>
      <td class="actions">
        <button class="btn btn-sm btn-delete" onclick="deleteUser(${u.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function addUser(e) {
  e.preventDefault();
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        username: document.getElementById('usrUsername').value,
        email: document.getElementById('usrEmail').value,
        password: document.getElementById('usrPassword').value,
        role: document.getElementById('usrRole').value
      })
    });
    if (!res.ok) throw new Error();
    e.target.reset();
    loadUsers();
  } catch (err) {
    alert('Error adding user');
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error();
    loadUsers();
  } catch (err) {
    alert('Error deleting user');
  }
}

// ============== UTILITIES ==============
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

logoutBtn.addEventListener('click', handleLogout);
