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
    } else if (page === 'deliveries') {
      renderDeliveryCalendar();
      loadCompanies();
    } else if (page === 'records') {
      loadDeliveries();
    } else if (page === 'companies') {
      loadCompanies();
    } else if (page === 'billing') {
      loadBillings();
      loadCompanies();
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
    loadBillings()
  ]);
}

async function loadDeliveries() {
  try {
    const response = await fetch('/api/deliveries', { headers: getHeaders() });
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
    const response = await fetch('/api/companies/all', { headers: getHeaders() });
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
    const response = await fetch('/api/billing-statements', { headers: getHeaders() });
    if (response.ok) {
      const data = await response.json();
      renderBillings(data);
    } else {
      console.error('Error loading billings:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading billings:', error);
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch('/api/deliveries', { headers: getHeaders() });
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
    const response = await fetch('/api/users', { headers: getHeaders() });
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
  let stats = { totalDeliveries: 0, totalDelivered: 0, totalReturned: 0 };

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

  last7Days.forEach(date => { data[date] = 0; });

  deliveries.forEach(del => {
    const date = new Date(del.timestamp).toISOString().split('T')[0];
    if (data[date] !== undefined) {
      data[date] += del.delivered - del.returned;
    }
  });

  if (trendChart) trendChart.destroy();

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
      plugins: { legend: { display: true, labels: { usePointStyle: true } } },
      scales: { y: { beginAtZero: true } }
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

  if (deliveries.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="6">No records yet</td></tr>';
    return;
  }

  tbody.innerHTML = deliveries.map(del => `
    <tr>
      <td>${del.company || 'Unknown'}</td>
      <td>${del.bottles_delivered || del.delivered || 0}</td>
      <td>${del.bottles_returned || del.returned || 0}</td>
      <td>${del.dr_number || '-'}</td>
      <td>${new Date(del.timestamp).toLocaleString()}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="editDelivery(${del.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDelivery(${del.id})">Delete</button>
      </td>
    </tr>
  `).join('');
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

  if (billings.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="7">No billing statements yet</td></tr>';
    return;
  }

  tbody.innerHTML = billings.map(bill => `
    <tr>
      <td>${bill.company_name || bill.company || 'Unknown'}</td>
      <td>${bill.start_date ? new Date(bill.start_date).toLocaleDateString() : 'N/A'} - ${bill.end_date ? new Date(bill.end_date).toLocaleDateString() : 'N/A'}</td>
      <td>₱${parseFloat(bill.total_amount || bill.amount || 0).toFixed(2)}</td>
      <td><span class="badge ${bill.is_paid || bill.paid ? 'badge-success' : 'badge-danger'}">${bill.is_paid || bill.paid ? 'Paid' : 'Unpaid'}</span></td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="exportBillingExcel(${bill.id}, '${bill.company_name || bill.company}', '${bill.start_date}', '${bill.end_date}')">📊 Excel</button>
        <button class="btn btn-secondary btn-sm" onclick="exportBillingPdf(${bill.id}, '${bill.company_name || bill.company}', '${bill.start_date}', '${bill.end_date}')">📄 PDF</button>
      </td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" onclick="toggleBillingStatus(${bill.id})">Toggle</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBilling(${bill.id})">Delete</button>
      </td>
    </tr>
  `).join('');
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

let currentCalendarDate = new Date();

function renderDeliveryCalendar() {
  const calendarDiv = document.getElementById('deliveryCalendar');
  if (!calendarDiv) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
      <button type="button" onclick="prevCalendarMonth()" class="btn btn-secondary btn-sm" style="padding: 6px 10px; font-size: 0.85em;">←</button>
      <div style="text-align: center; flex: 1; font-weight: 600; color: #667eea; font-size: 0.95em;">
        ${firstDay.toLocaleString('default', { month: 'short', year: 'numeric' })}
      </div>
      <button type="button" onclick="nextCalendarMonth()" class="btn btn-secondary btn-sm" style="padding: 6px 10px; font-size: 0.85em;">→</button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 0.85em;">
  `;

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  dayNames.forEach(day => {
    html += `<div style="text-align: center; font-weight: 600; color: #667eea; padding: 4px 0;">${day}</div>`;
  });

  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div style="padding: 4px;"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    html += `<button type="button" onclick="selectDeliveryDate('${dateStr}')" style="padding: 4px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; font-size: 0.85em; font-weight: 500;" class="calendar-day">${day}</button>`;
  }

  html += '</div>';
  calendarDiv.innerHTML = html;
}

function prevCalendarMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderDeliveryCalendar();
}

function nextCalendarMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderDeliveryCalendar();
}

function selectDeliveryDate(dateStr) {
  document.getElementById('delDate').value = dateStr;
}

// ============================================
// CRUD OPERATIONS - DELIVERIES
// ============================================

document.getElementById('deliveryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const companyId = document.getElementById('delCompany').value;
  const date = document.getElementById('delDate').value;

  if (!companyId) {
    showNotification('Please select a company', 'error');
    return;
  }

  if (!date) {
    showNotification('Please select a delivery date', 'error');
    return;
  }

  const timestamp = new Date(date).toISOString();

  const data = {
    company_id: parseInt(companyId),
    delivered: parseInt(document.getElementById('delDelivered').value) || 0,
    returned: parseInt(document.getElementById('delReturned').value) || 0,
    dr_number: document.getElementById('delDRNumber').value || 'N/A',
    notes: document.getElementById('delNotes').value,
    timestamp: timestamp
  };

  try {
    const response = await fetch('/api/deliveries', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      showNotification('✓ Delivery added successfully!', 'success');
      document.getElementById('deliveryForm').reset();
      loadDeliveries();
      loadDashboardData();
    } else {
      const error = await response.json().catch(() => ({}));
      showNotification(error.message || 'Error adding delivery', 'error');
    }
  } catch (error) {
    console.error('Error adding delivery:', error);
    showNotification('Connection error - could not add delivery', 'error');
  }
});

async function editDelivery(id) {
  try {
    const response = await fetch(`/api/deliveries/${id}`, { headers: getHeaders() });
    if (response.ok) {
      const delivery = await response.json();
      const companyResponse = await fetch(`/api/companies/${delivery.company_id}`, { headers: getHeaders() });
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
  if (!confirm('Delete this delivery record?')) return;

  try {
    const response = await fetch(`/api/deliveries/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (response.ok) {
      loadDeliveries();
      loadDashboardData();
    }
  } catch (error) {
    console.error('Error deleting delivery:', error);
  }
}

// ============================================
// CRUD OPERATIONS - COMPANIES
// ============================================

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
      showNotification('✓ Company added successfully!', 'success');
      document.getElementById('companyForm').reset();
      loadCompanies();
    } else {
      const error = await response.json().catch(() => ({}));
      showNotification(error.message || 'Error adding company', 'error');
    }
  } catch (error) {
    console.error('Error adding company:', error);
    showNotification('Connection error - could not add company', 'error');
  }
});

async function editCompany(id) {
  try {
    const response = await fetch(`/api/companies/${id}`, { headers: getHeaders() });
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
      showNotification('✓ Company updated successfully!', 'success');
    } else {
      const error = await response.json().catch(() => ({}));
      showNotification(error.message || 'Error updating company', 'error');
    }
  } catch (error) {
    console.error('Error updating company:', error);
    showNotification('Connection error - could not update company', 'error');
  }
});

async function deleteCompany(id) {
  if (!confirm('Delete this company? This will also delete all associated deliveries.')) return;

  try {
    const response = await fetch(`/api/companies/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (response.ok) {
      loadCompanies();
      showNotification('✓ Company deleted successfully!', 'success');
    } else {
      const error = await response.json().catch(() => ({}));
      showNotification(error.message || 'Error deleting company', 'error');
    }
  } catch (error) {
    console.error('Error deleting company:', error);
    showNotification('Connection error - could not delete company', 'error');
  }
}

async function showCompanyStats(id) {
  try {
    const companyResponse = await fetch(`/api/companies/${id}`, { headers: getHeaders() });
    const company = companyResponse.ok ? await companyResponse.json() : { name: 'Unknown' };

    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
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

// ============================================
// CRUD OPERATIONS - BILLING
// ============================================

document.getElementById('billingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const companyId = parseInt(document.getElementById('bilCompany').value);
  const startDate = document.getElementById('bilStartDate').value;
  const endDate = document.getElementById('bilEndDate').value;

  if (!companyId || !startDate || !endDate) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  try {
    // Get company details
    const companiesResponse = await fetch('/api/companies/all', { headers: getHeaders() });
    const companies = companiesResponse.ok ? await companiesResponse.json() : [];
    const company = companies.find(c => c.id === companyId);

    if (!company) {
      showNotification('Company not found', 'error');
      return;
    }

    // Get all deliveries
    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    // Calculate total for this company in date range
    let totalBottles = 0;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    deliveries.forEach(del => {
      const delDate = new Date(del.timestamp);
      if ((del.company === company.name || del.company_id === companyId) &&
          delDate >= startDateObj &&
          delDate <= endDateObj) {
        totalBottles += (del.bottles_delivered || del.delivered || 0);
      }
    });

    const unitPrice = parseFloat(company.unit_price) || 0;
    const totalAmount = totalBottles * unitPrice;

    // Create billing statement
    const data = {
      company: company.name,
      startDate: startDate,
      endDate: endDate,
      totalAmount: totalAmount
    };

    console.log('Sending billing data:', data);

    const response = await fetch('/api/billing-statements', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    console.log('Billing response status:', response.status);

    if (response.ok) {
      showNotification(`✓ Billing created! ${company.name} - ₱${totalAmount.toFixed(2)} (${totalBottles} bottles)`, 'success');
      document.getElementById('billingForm').reset();
      loadBillings();
    } else {
      const errorText = await response.text();
      let errorMsg = 'Error creating billing statement';
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch (e) {
        errorMsg = errorText || errorMsg;
      }
      console.error('Billing API Error:', errorMsg);
      showNotification(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Error creating billing:', error);
    showNotification('Connection error - could not create billing statement', 'error');
  }
});

async function toggleBillingStatus(id) {
  try {
    const response = await fetch(`/api/billing-statements/${id}`, { headers: getHeaders() });
    if (response.ok) {
      const billing = await response.json();
      document.getElementById('editBilId').value = id;
      document.getElementById('billingStatusText').textContent = `Current status: ${billing.paid ? 'Paid' : 'Unpaid'}`;
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
    const response = await fetch(`/api/billing-statements/${id}`, { headers: getHeaders() });
    const billing = response.ok ? await response.json() : null;

    const updateResponse = await fetch(`/api/billing-statements/${id}`, {
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
  if (!confirm('Delete this billing statement?')) return;

  try {
    const response = await fetch(`/api/billing-statements/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (response.ok) {
      loadBillings();
    }
  } catch (error) {
    console.error('Error deleting billing:', error);
  }
}

// ============================================
// CRUD OPERATIONS - USERS
// ============================================

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
  if (!confirm('Delete this user?')) return;

  try {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getHeaders() });
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
    const response = await fetch('/api/deliveries', { headers: getHeaders() });
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
    const response = await fetch('/api/backup', { headers: getHeaders() });
    if (response.ok) {
      alert('Backup created successfully!');
    }
  } catch (error) {
    console.error('Backup error:', error);
  }
});

// ============================================
// BILLING EXPORT FUNCTIONS
// ============================================

async function exportBillingExcel(billingId, company, startDate, endDate) {
  try {
    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Filter deliveries for this billing statement
    const billingDeliveries = deliveries.filter(d => {
      const delDate = new Date(d.timestamp);
      return (d.company === company || d.company_id === company) &&
             delDate >= startDateObj &&
             delDate <= endDateObj;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // CSV content
    let csv = 'EAU CURE WATER REFILLING STATION\n';
    csv += 'F33 A. Soriano Highway, Daang Amaya, Tanza, Cavite\n';
    csv += '(046) 437-6331\n\n';
    csv += `Billing Statement: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}\n`;
    csv += `BILL TO: ${company}\n\n`;
    csv += 'Date,DR #,QTY,Particulars,Unit Price,Amount\n';

    let totalQty = 0;
    let totalAmount = 0;

    billingDeliveries.forEach(d => {
      const qty = d.bottles_delivered || d.delivered || 0;
      const unitPrice = 17; // Default, should come from company data
      const amount = qty * unitPrice;
      totalQty += qty;
      totalAmount += amount;

      const dateStr = new Date(d.timestamp).toLocaleDateString();
      csv += `${dateStr},${d.dr_number || ''},${qty},5 gal round,${unitPrice},${amount}\n`;
    });

    csv += `\nTOTAL,${totalQty},5 gal round,,${totalAmount}\n`;
    csv += `\nPREPARED BY:\n\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${company}-billing-${new Date(startDate).toISOString().split('T')[0]}.csv`);
    link.click();
    showNotification('✓ Billing statement exported to Excel', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Error exporting to Excel', 'error');
  }
}

async function exportBillingPdf(billingId, company, startDate, endDate) {
  try {
    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Filter deliveries for this billing statement
    const billingDeliveries = deliveries.filter(d => {
      const delDate = new Date(d.timestamp);
      return (d.company === company || d.company_id === company) &&
             delDate >= startDateObj &&
             delDate <= endDateObj;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let totalQty = 0;
    let totalAmount = 0;
    let tableRows = '';

    billingDeliveries.forEach(d => {
      const qty = d.bottles_delivered || d.delivered || 0;
      const unitPrice = 17; // Default
      const amount = qty * unitPrice;
      totalQty += qty;
      totalAmount += amount;

      const dateStr = new Date(d.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      tableRows += `
        <tr>
          <td>${dateStr}</td>
          <td>${d.dr_number || ''}</td>
          <td style="text-align: center;">${qty}</td>
          <td>5 gal round</td>
          <td style="text-align: right;">${unitPrice.toFixed(2)}</td>
          <td style="text-align: right;">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    });

    const startDateStr = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const endDateStr = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .company-info { font-size: 12px; color: #666; }
            .statement-header { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-start; }
            .statement-title { font-size: 20px; font-weight: bold; color: #d32f2f; }
            .date-range { font-size: 14px; text-align: right; }
            .bill-to { margin-bottom: 20px; }
            .bill-to-label { font-weight: bold; }
            .bill-to-name { font-weight: bold; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: white; border-bottom: 2px solid #333; padding: 12px; text-align: left; font-weight: bold; }
            td { padding: 10px 12px; border-bottom: 1px solid #ddd; }
            .total-row { background-color: #fff; border-top: 2px solid #d32f2f; border-bottom: 2px solid #d32f2f; font-weight: bold; color: #d32f2f; }
            .total-row td { padding: 12px; }
            .footer { margin-top: 40px; font-size: 12px; }
            .prepared-by { margin-bottom: 40px; }
            .signature-line { border-top: 1px solid #333; width: 300px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">EAU CURE WATER REFILLING STATION</div>
            <div class="company-info">F33 A. Soriano Highway, Daang Amaya, Tanza, Cavite</div>
            <div class="company-info">(046) 437-6331</div>
          </div>

          <div class="statement-header">
            <div class="statement-title">Billing Statement</div>
            <div class="date-range">${startDateStr} - ${endDateStr}</div>
          </div>

          <div class="bill-to">
            <span class="bill-to-label">BILL TO:</span>
            <span class="bill-to-name">${company}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>DR #</th>
                <th>QTY</th>
                <th>Particulars</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td></td>
                <td></td>
                <td style="text-align: center;">${totalQty}</td>
                <td>5 gal round</td>
                <td style="text-align: right;">17.00</td>
                <td style="text-align: right;">AMOUNT: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="prepared-by">
              <div>PREPARED BY: _________________________</div>
              <div style="margin-top: 30px;">Original Invoices / Statement Received By:</div>
              <div class="signature-line"></div>
              <div style="font-size: 10px; margin-top: 5px;">(Signature Over Printed Name)</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=800,width=900');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    showNotification('✓ Billing statement ready to print/save as PDF', 'success');
  } catch (error) {
    console.error('PDF export error:', error);
    showNotification('Error exporting to PDF', 'error');
  }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';

  if (type === 'success') {
    notification.style.backgroundColor = '#28a745';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#dc3545';
  } else if (type === 'info') {
    notification.style.backgroundColor = '#667eea';
  }

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}


// ============================================
// SETUP EVENT LISTENERS
// ============================================

// ============================================
// UNIFIED DELIVERY REPORT
// ============================================

let currentReportData = null;

// Populate company dropdown on page load
document.addEventListener('DOMContentLoaded', async () => {
  const companySelect = document.getElementById('repCompany');
  if (companySelect && companySelect.options.length === 1) {
    try {
      const response = await fetch('/api/companies/all', { headers: getHeaders() });
      if (response.ok) {
        const companies = await response.json();
        companies.forEach(c => {
          const option = document.createElement('option');
          option.value = c.id;
          option.textContent = c.name;
          companySelect.appendChild(option);
        });
      }
    } catch (e) {
      console.error('Error loading companies:', e);
    }
  }
});

document.getElementById('deliveryReportForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const startDate = document.getElementById('repStartDate').value;
  const endDate = document.getElementById('repEndDate').value;
  const companyId = document.getElementById('repCompany').value;

  if (!startDate || !endDate) {
    showNotification('Please select start and end dates', 'error');
    return;
  }

  try {
    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const companiesResponse = await fetch('/api/companies/all', { headers: getHeaders() });
    const companies = companiesResponse.ok ? await companiesResponse.json() : [];

    // Create company map
    const companyMap = {};
    companies.forEach(c => {
      companyMap[c.name] = { id: c.id, unitPrice: parseFloat(c.unit_price) || 0 };
    });

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const isAllCompanies = companyId === 'all';

    // Filter deliveries
    let filteredDeliveries = deliveries.filter(del => {
      const delDate = new Date(del.timestamp);
      const inDateRange = delDate >= startDateObj && delDate <= endDateObj;
      const inCompany = isAllCompanies || companyMap[del.company]?.id === parseInt(companyId);
      return inDateRange && inCompany;
    });

    if (filteredDeliveries.length === 0) {
      showNotification('No deliveries found for the selected criteria', 'error');
      return;
    }

    // Sort by date
    filteredDeliveries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Add calculated fields
    filteredDeliveries = filteredDeliveries.map(del => {
      const unitPrice = companyMap[del.company]?.unitPrice || 0;
      const qty = del.bottles_delivered || del.delivered || 0;
      const amount = qty * unitPrice;
      const returns = del.bottles_returned || del.returned || 0;
      const earnings = amount; // earnings = amount (delivered × price)

      return {
        ...del,
        unitPrice,
        qty,
        amount,
        returns,
        earnings
      };
    });

    currentReportData = {
      startDate,
      endDate,
      isAllCompanies,
      selectedCompanyId: companyId,
      selectedCompanyName: isAllCompanies ? null : document.querySelector(`#repCompany option[value="${companyId}"]`)?.textContent,
      deliveries: filteredDeliveries
    };

    renderDeliveryReport(currentReportData);
    showNotification('✓ Report generated successfully', 'success');
  } catch (error) {
    console.error('Error generating report:', error);
    showNotification('Error generating report', 'error');
  }
});

function renderDeliveryReport(reportData) {
  const tbody = document.getElementById('reportTableBody');
  const tfoot = document.getElementById('reportTableFooter');
  const container = document.getElementById('reportContainer');
  const empty = document.getElementById('reportEmpty');
  const companyHeader = document.getElementById('companyColHeader');

  if (reportData.deliveries.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  empty.style.display = 'none';

  // Show/hide company column based on filter
  if (reportData.isAllCompanies) {
    companyHeader.style.display = '';
  } else {
    companyHeader.style.display = 'none';
  }

  // Render body rows
  tbody.innerHTML = reportData.deliveries.map(del => {
    const companyCol = reportData.isAllCompanies
      ? `<td style="padding: 8px; border: 1px solid #ddd;">${del.company}</td>`
      : '';

    return `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(del.timestamp).toLocaleDateString()}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${del.dr_number || '-'}</td>
        ${companyCol}
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${del.qty}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">Water Refill</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${del.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${del.amount.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${del.returns}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #28a745; font-weight: bold;">₱${del.earnings.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Calculate totals
  const totalQty = reportData.deliveries.reduce((sum, d) => sum + d.qty, 0);
  const totalAmount = reportData.deliveries.reduce((sum, d) => sum + d.amount, 0);
  const totalReturns = reportData.deliveries.reduce((sum, d) => sum + d.returns, 0);
  const totalEarnings = reportData.deliveries.reduce((sum, d) => sum + d.earnings, 0);

  // Update totals
  document.getElementById('totalQty').textContent = totalQty;
  document.getElementById('totalAmount').textContent = `₱${totalAmount.toFixed(2)}`;
  document.getElementById('totalReturns').textContent = totalReturns;
  document.getElementById('totalEarnings').textContent = `₱${totalEarnings.toFixed(2)}`;

  // Update footer colspan based on company column visibility
  const footerFirstTd = tfoot.querySelector('tr td:first-child');
  if (reportData.isAllCompanies) {
    footerFirstTd.colSpan = 3;
  } else {
    footerFirstTd.colSpan = 2;
  }
}

// Export to Excel
document.getElementById('reportExcelBtn')?.addEventListener('click', () => {
  if (!currentReportData) {
    showNotification('Please generate a report first', 'error');
    return;
  }

  const { startDate, endDate, isAllCompanies, deliveries } = currentReportData;

  let csv = 'Delivery Report\n';
  csv += `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}\n\n`;

  // Headers
  if (isAllCompanies) {
    csv += 'Date,DR #,Company,Qty,Particulars,Unit Price,Amount,Returns,Earnings\n';
  } else {
    csv += 'Date,DR #,Qty,Particulars,Unit Price,Amount,Returns,Earnings\n';
  }

  // Data
  let totalQty = 0, totalAmount = 0, totalReturns = 0, totalEarnings = 0;
  deliveries.forEach(d => {
    totalQty += d.qty;
    totalAmount += d.amount;
    totalReturns += d.returns;
    totalEarnings += d.earnings;

    if (isAllCompanies) {
      csv += `${new Date(d.timestamp).toLocaleDateString()},"${d.dr_number || '-'}","${d.company}",${d.qty},"Water Refill",₱${d.unitPrice.toFixed(2)},₱${d.amount.toFixed(2)},${d.returns},₱${d.earnings.toFixed(2)}\n`;
    } else {
      csv += `${new Date(d.timestamp).toLocaleDateString()},"${d.dr_number || '-'}",${d.qty},"Water Refill",₱${d.unitPrice.toFixed(2)},₱${d.amount.toFixed(2)},${d.returns},₱${d.earnings.toFixed(2)}\n`;
    }
  });

  // Totals
  if (isAllCompanies) {
    csv += `\n"TOTAL","",""," ${totalQty}","",,"₱${totalAmount.toFixed(2)}",${totalReturns},"₱${totalEarnings.toFixed(2)}"\n`;
  } else {
    csv += `\n"TOTAL","","${totalQty}","",,"₱${totalAmount.toFixed(2)}",${totalReturns},"₱${totalEarnings.toFixed(2)}"\n`;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `delivery_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
});

// Export to PDF
document.getElementById('reportPdfBtn')?.addEventListener('click', () => {
  if (!currentReportData) {
    showNotification('Please generate a report first', 'error');
    return;
  }

  const { startDate, endDate, isAllCompanies, deliveries } = currentReportData;
  const win = window.open('', '', 'height=800,width=1000');

  let html = `
    <html>
    <head>
      <title>Delivery Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
        h1 { font-size: 16px; margin: 0 0 10px 0; }
        p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; border: 1px solid #000; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .total-row { font-weight: bold; background: #f0f0f0; }
        .total-row td { border-top: 2px solid #000; }
      </style>
    </head>
    <body>
      <h1>Delivery Report</h1>
      <p><strong>Date Range:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>DR #</th>
            ${isAllCompanies ? '<th>Company</th>' : ''}
            <th class="text-center">Qty</th>
            <th>Particulars</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Amount</th>
            <th class="text-center">Returns</th>
            <th class="text-right">Earnings</th>
          </tr>
        </thead>
        <tbody>
  `;

  let totalQty = 0, totalAmount = 0, totalReturns = 0, totalEarnings = 0;
  deliveries.forEach(d => {
    totalQty += d.qty;
    totalAmount += d.amount;
    totalReturns += d.returns;
    totalEarnings += d.earnings;

    const companyCol = isAllCompanies ? `<td>${d.company}</td>` : '';
    html += `
      <tr>
        <td>${new Date(d.timestamp).toLocaleDateString()}</td>
        <td>${d.dr_number || '-'}</td>
        ${companyCol}
        <td class="text-center">${d.qty}</td>
        <td>Water Refill</td>
        <td class="text-right">₱${d.unitPrice.toFixed(2)}</td>
        <td class="text-right">₱${d.amount.toFixed(2)}</td>
        <td class="text-center">${d.returns}</td>
        <td class="text-right">₱${d.earnings.toFixed(2)}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="${isAllCompanies ? 3 : 2}">TOTAL</td>
            <td class="text-center">${totalQty}</td>
            <td></td>
            <td></td>
            <td class="text-right">₱${totalAmount.toFixed(2)}</td>
            <td class="text-center">${totalReturns}</td>
            <td class="text-right">₱${totalEarnings.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  win.document.write(html);
  setTimeout(() => { win.print(); }, 500);
});

function setupEventListeners() {
  document.querySelectorAll('.overview-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.overview-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  document.getElementById('dashFilterBtn')?.addEventListener('click', () => {
    // TODO: Implement filtering
  });
}
