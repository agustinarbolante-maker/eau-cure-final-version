// GLOBAL STATE
let currentUser = null;
let currentToken = null;
let trendChart = null;

// Get authorization headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentToken}`
  };
}

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('current_user');

  if (token && user) {
    currentToken = token;
    currentUser = JSON.parse(user);

    try {
      const response = await fetch('/api/auth/me', {
        headers: getHeaders()
      });

      if (response.ok) {
        showAppPage();
        loadAllData();
        return;
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    }
  }

  showLoginPage();
}

function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appPage').style.display = 'none';
}

function showAppPage() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'flex';
  updateUserDisplay();
  setupSidebarNavigation();
  showAdminOnlyElements();
}

function updateUserDisplay() {
  const username = currentUser.username || 'User';
  const role = currentUser.role || 'employee';

  document.getElementById('headerUser').textContent = `${username} (${role})`;
  document.getElementById('sidebarUser').textContent = username;
  document.getElementById('sidebarRole').textContent = role.replace('_', ' ');
}

// ============================================
// LOGIN/LOGOUT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();
      currentToken = data.token;
      currentUser = data.user;

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('current_user', JSON.stringify(data.user));

      document.getElementById('loginForm').reset();
      errorDiv.style.display = 'none';
      showAppPage();
      loadAllData();
    } else {
      errorDiv.textContent = 'Invalid username or password';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
  }
});

function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  currentToken = null;
  currentUser = null;
  showLoginPage();
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('headerLogout')?.addEventListener('click', logout);
document.getElementById('sidebarLogout')?.addEventListener('click', logout);

// ============================================
// SIDEBAR NAVIGATION
// ============================================

function setupSidebarNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      switchPage(page);

      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function switchPage(page) {
  document.querySelectorAll('.page-content').forEach(section => {
    section.classList.remove('active');
  });

  const pageElement = document.getElementById(`${page}-page`);
  if (pageElement) {
    pageElement.classList.add('active');
    document.getElementById('pageTitle').textContent =
      page.charAt(0).toUpperCase() + page.slice(1);

    if (page === 'dashboard') {
      loadDashboardData();
      renderCalendar();
    } else if (page === 'records') {
      loadDeliveries();
    } else if (page === 'companies') {
      loadCompanies();
    } else if (page === 'billing') {
      loadBillings();
    } else if (page === 'settings') {
      loadUsers();
    }
  }
}

function showAdminOnlyElements() {
  const isAdmin = currentUser.role === 'admin';
  const adminElements = document.querySelectorAll('.admin-only');

  adminElements.forEach(el => {
    if (isAdmin) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

// ============================================
// DATA LOADING
// ============================================

async function loadAllData() {
  await Promise.all([
    loadCompanies(),
    loadDeliveries(),
    loadBillings(),
    loadDashboardData()
  ]);
}

async function loadDeliveries() {
  try {
    const response = await fetch('/api/deliveries', {
      headers: getHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      renderDeliveries(data);
    }
  } catch (error) {
    console.error('Error loading deliveries:', error);
  }
}

async function loadCompanies() {
  try {
    const response = await fetch('/api/companies', {
      headers: getHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      renderCompanies(data);
      populateCompanySelects(data);
    }
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

async function loadBillings() {
  try {
    const response = await fetch('/api/billings', {
      headers: getHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      renderBillings(data);
    }
  } catch (error) {
    console.error('Error loading billings:', error);
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch('/api/deliveries', {
      headers: getHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      calculateStats(data);
      renderDeliveryChart(data);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadUsers() {
  try {
    const response = await fetch('/api/users', {
      headers: getHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      renderUsers(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function calculateStats(deliveries) {
  let stats = {
    totalDeliveries: 0,
    totalDelivered: 0,
    totalReturned: 0
  };

  deliveries.forEach(del => {
    stats.totalDeliveries++;
    stats.totalDelivered += del.delivered;
    stats.totalReturned += del.returned;
  });

  document.getElementById('statDeliveries').textContent = stats.totalDeliveries;
  document.getElementById('statDelivered').textContent = stats.totalDelivered;
  document.getElementById('statReturned').textContent = stats.totalReturned;
  document.getElementById('statNet').textContent = stats.totalDelivered - stats.totalReturned;
}

function renderDeliveryChart(deliveries) {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  const last7Days = getLast7Days();
  const data = {};

  last7Days.forEach(date => {
    data[date] = 0;
  });

  deliveries.forEach(del => {
    const date = new Date(del.timestamp).toISOString().split('T')[0];
    if (data[date] !== undefined) {
      data[date] += del.delivered - del.returned;
    }
  });

  if (trendChart) {
    trendChart.destroy();
  }

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Net Bottles (Delivered - Returned)',
        data: last7Days.map(date => data[date]),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

function renderDeliveries(deliveries) {
  const tbody = document.getElementById('recordsBody');
  const companies = {};

  // Load companies for display
  fetch('/api/companies', { headers: getHeaders() })
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      data.forEach(com => companies[com.id] = com.name);

      if (deliveries.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No records yet</td></tr>';
        return;
      }

      tbody.innerHTML = deliveries.map(del => `
        <tr>
          <td>${companies[del.company_id] || 'Unknown'}</td>
          <td>${del.delivered}</td>
          <td>${del.returned}</td>
          <td>${del.dr_number || '-'}</td>
          <td>${new Date(del.timestamp).toLocaleString()}</td>
          <td class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editDelivery(${del.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteDelivery(${del.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    });
}

function renderCompanies(companies) {
  const tbody = document.getElementById('companiesBody');

  if (companies.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="4">No companies yet</td></tr>';
    return;
  }

  tbody.innerHTML = companies.map(com => `
    <tr>
      <td>${com.name}</td>
      <td>₱${parseFloat(com.unit_price).toFixed(2)}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="showCompanyStats(${com.id})">View</button></td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="editCompany(${com.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCompany(${com.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderBillings(billings) {
  const tbody = document.getElementById('billingBody');
  const companies = {};

  fetch('/api/companies', { headers: getHeaders() })
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      data.forEach(com => companies[com.id] = com.name);

      if (billings.length === 0) {
        tbody.innerHTML = '<tr class="empty-state"><td colspan="5">No billing statements yet</td></tr>';
        return;
      }

      tbody.innerHTML = billings.map(bill => `
        <tr>
          <td>${companies[bill.company_id] || 'Unknown'}</td>
          <td>${bill.period}</td>
          <td>₱${parseFloat(bill.amount).toFixed(2)}</td>
          <td><span class="badge ${bill.paid ? 'badge-success' : 'badge-danger'}">${bill.paid ? 'Paid' : 'Unpaid'}</span></td>
          <td class="actions">
            <button class="btn btn-secondary btn-sm" onclick="toggleBillingStatus(${bill.id})">Toggle</button>
            <button class="btn btn-danger btn-sm" onclick="deleteBilling(${bill.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    });
}

function renderUsers(users) {
  const tbody = document.getElementById('usersBody');

  if (users.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="4">No users yet</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role.replace('_', ' ')}</td>
      <td class="actions">
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function populateCompanySelects(companies) {
  const selects = ['delCompany', 'bilCompany', 'dashCompanyFilter'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      const current = select.value;
      select.innerHTML = '<option value="">Select a company</option>' +
        companies.map(com => `<option value="${com.id}">${com.name}</option>`).join('');
      select.value = current;
    }
  });
}

// ============================================
// CALENDAR
// ============================================

function renderCalendar() {
  const calendarDiv = document.getElementById('calendar');
  if (!calendarDiv) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  let html = `
    <div style="margin-bottom: 16px; text-align: center;">
      <h3>${firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
    </div>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
  `;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    html += `<div style="text-align: center; font-weight: 600; color: #667eea;">${day}</div>`;
  });

  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    html += `<div class="calendar-day">${day}</div>`;
  }

  html += '</div>';
  calendarDiv.innerHTML = html;
}

// ============================================
// CRUD OPERATIONS
// ============================================

// Deliveries
document.getElementById('deliveryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    company_id: parseInt(document.getElementById('delCompany').value),
    delivered: parseInt(document.getElementById('delDelivered').value),
    returned: parseInt(document.getElementById('delReturned').value),
    dr_number: document.getElementById('delDRNumber').value,
    notes: document.getElementById('delNotes').value
  };

  try {
    const response = await fetch('/api/deliveries', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      document.getElementById('deliveryForm').reset();
      loadDeliveries();
      loadDashboardData();
    }
  } catch (error) {
    console.error('Error adding delivery:', error);
  }
});

async function editDelivery(id) {
  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      headers: getHeaders()
    });

    if (response.ok) {
      const delivery = await response.json();

      // Load company name
      const companyResponse = await fetch(`/api/companies/${delivery.company_id}`, {
        headers: getHeaders()
      });
      const company = companyResponse.ok ? await companyResponse.json() : { name: 'Unknown' };

      document.getElementById('editDelId').value = id;
      document.getElementById('editDelCompany').value = company.name;
      document.getElementById('editDelDelivered').value = delivery.delivered;
      document.getElementById('editDelReturned').value = delivery.returned;
      document.getElementById('editDelDRNumber').value = delivery.dr_number || '';
      document.getElementById('editDelNotes').value = delivery.notes || '';

      openModal('editDeliveryModal');
    }
  } catch (error) {
    console.error('Error loading delivery:', error);
  }
}

document.getElementById('editDeliveryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editDelId').value;
  const data = {
    delivered: parseInt(document.getElementById('editDelDelivered').value),
    returned: parseInt(document.getElementById('editDelReturned').value),
    dr_number: document.getElementById('editDelDRNumber').value,
    notes: document.getElementById('editDelNotes').value
  };

  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModal('editDeliveryModal');
      loadDeliveries();
      loadDashboardData();
    }
  } catch (error) {
    console.error('Error updating delivery:', error);
  }
});

async function deleteDelivery(id) {
  if (!confirm('Are you sure you want to delete this delivery record?')) return;

  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (response.ok) {
      loadDeliveries();
      loadDashboardData();
    }
  } catch (error) {
    console.error('Error deleting delivery:', error);
  }
}

// Companies
document.getElementById('companyForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById('comName').value,
    unit_price: parseFloat(document.getElementById('comPrice').value)
  };

  try {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      document.getElementById('companyForm').reset();
      loadCompanies();
    }
  } catch (error) {
    console.error('Error adding company:', error);
  }
});

async function editCompany(id) {
  try {
    const response = await fetch(`/api/companies/${id}`, {
      headers: getHeaders()
    });

    if (response.ok) {
      const company = await response.json();
      document.getElementById('editComId').value = id;
      document.getElementById('editComName').value = company.name;
      document.getElementById('editComPrice').value = company.unit_price;
      openModal('editCompanyModal');
    }
  } catch (error) {
    console.error('Error loading company:', error);
  }
}

document.getElementById('editCompanyForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editComId').value;
  const data = {
    name: document.getElementById('editComName').value,
    unit_price: parseFloat(document.getElementById('editComPrice').value)
  };

  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      closeModal('editCompanyModal');
      loadCompanies();
    }
  } catch (error) {
    console.error('Error updating company:', error);
  }
});

async function deleteCompany(id) {
  if (!confirm('Are you sure you want to delete this company?')) return;

  try {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (response.ok) {
      loadCompanies();
    }
  } catch (error) {
    console.error('Error deleting company:', error);
  }
}

async function showCompanyStats(id) {
  try {
    const companyResponse = await fetch(`/api/companies/${id}`, {
      headers: getHeaders()
    });
    const company = await companyResponse.ok ? companyResponse.json() : { name: 'Unknown' };

    const deliveriesResponse = await fetch('/api/deliveries', {
      headers: getHeaders()
    });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const stats = { delivered: 0, returned: 0, count: 0 };
    deliveries.forEach(del => {
      if (del.company_id === id) {
        stats.count++;
        stats.delivered += del.delivered;
        stats.returned += del.returned;
      }
    });

    document.getElementById('statsCompanyName').textContent = company.name;
    document.getElementById('statsDeliveries').textContent = stats.count;
    document.getElementById('statsDelivered').textContent = stats.delivered;
    document.getElementById('statsReturned').textContent = stats.returned;
    document.getElementById('statsNet').textContent = stats.delivered - stats.returned;

    openModal('companyStatsModal');
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Billing
document.getElementById('billingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    company_id: parseInt(document.getElementById('bilCompany').value),
    period: document.getElementById('bilMonth').value,
    amount: parseFloat(document.getElementById('bilAmount').value),
    paid: false
  };

  try {
    const response = await fetch('/api/billings', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      document.getElementById('billingForm').reset();
      loadBillings();
    }
  } catch (error) {
    console.error('Error adding billing:', error);
  }
});

async function toggleBillingStatus(id) {
  try {
    const response = await fetch(`/api/billings/${id}`, {
      headers: getHeaders()
    });

    if (response.ok) {
      const billing = await response.json();
      document.getElementById('editBilId').value = id;
      document.getElementById('billingStatusText').textContent =
        `Current status: ${billing.paid ? 'Paid' : 'Unpaid'}`;
      openModal('editBillingModal');
    }
  } catch (error) {
    console.error('Error loading billing:', error);
  }
}

document.getElementById('editBillingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editBilId').value;

  try {
    const response = await fetch(`/api/billings/${id}`, {
      headers: getHeaders()
    });
    const billing = response.ok ? await response.json() : null;

    const updateResponse = await fetch(`/api/billings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ paid: !billing.paid })
    });

    if (updateResponse.ok) {
      closeModal('editBillingModal');
      loadBillings();
    }
  } catch (error) {
    console.error('Error updating billing:', error);
  }
});

async function deleteBilling(id) {
  if (!confirm('Are you sure you want to delete this billing statement?')) return;

  try {
    const response = await fetch(`/api/billings/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (response.ok) {
      loadBillings();
    }
  } catch (error) {
    console.error('Error deleting billing:', error);
  }
}

// Users (Admin Only)
document.getElementById('userForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser || currentUser.role !== 'admin') {
    alert('Only admins can create users');
    return;
  }

  const data = {
    username: document.getElementById('usrUsername').value,
    email: document.getElementById('usrEmail').value,
    password: document.getElementById('usrPassword').value,
    role: document.getElementById('usrRole').value
  };

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      document.getElementById('userForm').reset();
      loadUsers();
    } else {
      alert('Error creating user');
    }
  } catch (error) {
    console.error('Error adding user:', error);
  }
});

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (response.ok) {
      loadUsers();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
  }
});

// ============================================
// EXPORT/PRINT/BACKUP
// ============================================

document.getElementById('exportBtn')?.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/deliveries', {
      headers: getHeaders()
    });
    if (response.ok) {
      const deliveries = await response.json();
      const csv = [
        ['Company', 'Delivered', 'Returned', 'DR Number', 'Timestamp'],
        ...deliveries.map(d => [
          d.company_id,
          d.delivered,
          d.returned,
          d.dr_number || '',
          new Date(d.timestamp).toISOString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deliveries-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  } catch (error) {
    console.error('Export error:', error);
  }
});

document.getElementById('printBtn')?.addEventListener('click', () => {
  window.print();
});

document.getElementById('backupBtn')?.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/backup', {
      headers: getHeaders()
    });
    if (response.ok) {
      alert('Backup created successfully!');
    }
  } catch (error) {
    console.error('Backup error:', error);
  }
});

// ============================================
// SETUP EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Overview tabs
  document.querySelectorAll('.overview-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.overview-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Load filtered data based on selected filter
    });
  });

  // Dashboard filters
  document.getElementById('dashFilterBtn')?.addEventListener('click', () => {
    // TODO: Implement filtering
  });
}
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
