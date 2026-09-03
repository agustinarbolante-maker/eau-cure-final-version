// GLOBAL STATE
let currentUser = null;
let currentToken = null;
let trendChart = null;
let invoiceStatusFilter = 'all';

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
      loadHistoryData();
      // Initialize history tab as default with all-time view
      showRecordsTab('history');
      loadAllDeliveriesHistory();
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
    loadBillings(),
    loadHistoryData(),
    loadDashboardData()
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
      let data = await response.json();

      // Apply invoice status filter
      if (invoiceStatusFilter === 'pending') {
        data = data.filter(b => !b.invoice_number);
      } else if (invoiceStatusFilter === 'has') {
        data = data.filter(b => b.invoice_number);
      }
      // if 'all', no additional filtering

      renderBillings(data);
    } else {
      console.error('Error loading billings:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading billings:', error);
  }
}

function handleInvoiceStatusFilterChange(value) {
  invoiceStatusFilter = value;
  loadBillings(); // Reload and re-render with new filter applied
}

async function loadDashboardData() {
  try {
    console.log('loadDashboardData() called');
    // Always fetch fresh data from server
    const response = await fetch('/api/deliveries', {
      headers: getHeaders(),
      cache: 'no-cache'
    });
    console.log('API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Fetched', data.length, 'deliveries from API');
      console.log('Latest delivery (first in list):', {
        id: data[0]?.id,
        company: data[0]?.company,
        delivered: data[0]?.bottles_delivered,
        timestamp: data[0]?.timestamp
      });
      // Also show the most recently added one (check for today's deliveries)
      const today = new Date().toISOString().split('T')[0];
      const todayDeliveries = data.filter(d => d.timestamp.split('T')[0] === today);
      if (todayDeliveries.length > 0) {
        console.log('Deliveries added TODAY:', todayDeliveries.length);
        console.log('Today\'s deliveries:', todayDeliveries);
      }
      calculateStats(data);
      await calculateEarnings(data);
      renderDeliveryChart(data);
    } else {
      console.error('Dashboard data fetch failed:', response.status);
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
    // FIX: Use bottles_delivered/bottles_returned (correct API field names)
    stats.totalDelivered += (del.bottles_delivered || del.delivered || 0);
    stats.totalReturned += (del.bottles_returned || del.returned || 0);
  });

  document.getElementById('statDeliveries').textContent = stats.totalDeliveries;
  document.getElementById('statDelivered').textContent = stats.totalDelivered;
  document.getElementById('statReturned').textContent = stats.totalReturned;
  document.getElementById('statNet').textContent = stats.totalDelivered - stats.totalReturned;
}

async function calculateEarnings(deliveries) {
  try {
    // Get companies to look up unit prices
    const companiesResponse = await fetch('/api/companies/all', { headers: getHeaders() });
    const companies = companiesResponse.ok ? await companiesResponse.json() : [];

    // Create company map for quick lookup
    const companyMap = {};
    companies.forEach(c => {
      companyMap[c.name] = { unitPrice: parseFloat(c.unit_price) || 0 };
    });

    // Helper function to calculate earnings for a date range
    function earningsForRange(start, end) {
      const startUTC = new Date(start);
      startUTC.setHours(0, 0, 0, 0);
      const endUTC = new Date(end);
      endUTC.setHours(23, 59, 59, 999);

      let total = 0;
      deliveries.forEach(del => {
        const delDate = new Date(del.timestamp);
        if (delDate >= startUTC && delDate <= endUTC) {
          const qty = del.bottles_delivered || del.delivered || 0;
          const unitPrice = companyMap[del.company]?.unitPrice || 0;
          total += qty * unitPrice;
        }
      });
      return total;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Today
    const earningsToday = earningsForRange(todayStr, todayStr);
    document.getElementById('earningsToday').textContent = `₱${earningsToday.toFixed(2)}`;

    // This Week (Sunday to today)
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const earningsWeek = earningsForRange(weekStartStr, todayStr);
    document.getElementById('earningsWeek').textContent = `₱${earningsWeek.toFixed(2)}`;

    // Last Week
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(weekStart.getDate() - 1);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];
    const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0];
    const earningsLastWeek = earningsForRange(lastWeekStartStr, lastWeekEndStr);
    document.getElementById('earningsLastWeek').textContent = `₱${earningsLastWeek.toFixed(2)}`;

    // This Month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const earningsMonth = earningsForRange(monthStartStr, todayStr);
    document.getElementById('earningsMonth').textContent = `₱${earningsMonth.toFixed(2)}`;

    // All Time
    let earningsAllTime = 0;
    deliveries.forEach(del => {
      const qty = del.bottles_delivered || del.delivered || 0;
      const unitPrice = companyMap[del.company]?.unitPrice || 0;
      earningsAllTime += qty * unitPrice;
    });
    document.getElementById('earningsAllTime').textContent = `₱${earningsAllTime.toFixed(2)}`;
  } catch (error) {
    console.error('Error calculating earnings:', error);
  }
}

function renderDeliveryChart(deliveries, filter = 'week') {
  const canvasContainer = document.getElementById('trendChart')?.parentElement;
  if (!canvasContainer) return;

  // Destroy old chart and canvas
  if (trendChart) {
    trendChart.destroy();
  }

  // Remove and recreate canvas to ensure clean state
  const oldCanvas = document.getElementById('trendChart');
  if (oldCanvas) {
    oldCanvas.remove();
  }

  const newCanvas = document.createElement('canvas');
  newCanvas.id = 'trendChart';
  canvasContainer.appendChild(newCanvas);

  const dateRange = getDateRangeByFilter(filter);
  const data = {};

  dateRange.forEach(date => { data[date] = 0; });

  deliveries.forEach(del => {
    const date = new Date(del.timestamp).toISOString().split('T')[0];
    if (data[date] !== undefined) {
      const delivered = del.bottles_delivered || del.delivered || 0;
      const returned = del.bottles_returned || del.returned || 0;
      data[date] += delivered - returned;
    }
  });

  trendChart = new Chart(newCanvas, {
    type: 'line',
    data: {
      labels: dateRange,
      datasets: [{
        label: 'Net Bottles (Delivered - Returned)',
        data: dateRange.map(date => data[date]),
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

function getDateRangeByFilter(filter) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === 'today') {
    // Just today
    days.push(today.toISOString().split('T')[0]);
  } else if (filter === 'week') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
  } else if (filter === 'month') {
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
  } else if (filter === 'all') {
    // Last 90 days (or all available data)
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
  }

  return days;
}

function renderDeliveries(deliveries) {
  const tbody = document.getElementById('recordsBody');

  // Only render if the element exists (it's not used in current layout)
  if (!tbody) return;

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
    tbody.innerHTML = '<tr class="empty-state"><td colspan="8">No billing statements yet</td></tr>';
    return;
  }

  tbody.innerHTML = billings.map(bill => `
    <tr>
      <td>${bill.start_date ? new Date(bill.start_date).toLocaleDateString() : 'N/A'} - ${bill.end_date ? new Date(bill.end_date).toLocaleDateString() : 'N/A'}</td>
      <td>₱${parseFloat(bill.total_amount || bill.amount || 0).toFixed(2)}</td>
      <td class="invoice-number-cell" data-billing-id="${bill.id}" data-current-value="${bill.invoice_number || ''}">
        ${bill.invoice_number ? `<span class="invoice-value">${bill.invoice_number}</span>` : '<span class="invoice-placeholder">Click to add</span>'}
      </td>
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

  // Re-attach inline edit handlers after rendering
  setupInvoiceNumberEdit();
}

// ============================================
// INVOICE NUMBER INLINE EDITING
// ============================================

function setupInvoiceNumberEdit() {
  const cells = document.querySelectorAll('.invoice-number-cell');

  cells.forEach(cell => {
    cell.addEventListener('click', function(e) {
      // Don't enter edit mode if clicking on an existing input field
      if (e.target.tagName === 'INPUT') return;

      enterInvoiceEditMode(this);
    });
  });
}

function enterInvoiceEditMode(cell) {
  // If already in edit mode, do nothing
  if (cell.classList.contains('editing')) return;

  const billingId = cell.dataset.billingId;
  const currentValue = cell.dataset.currentValue || '';

  // Mark as editing
  cell.classList.add('editing');

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'invoice-input';
  input.value = currentValue;

  // Clear cell and add input
  cell.innerHTML = '';
  cell.appendChild(input);

  // Auto-focus and select text
  input.focus();
  if (currentValue) {
    input.select();
  }

  // Handle Enter key (save)
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      saveInvoiceNumber(billingId, this.value, cell);
    } else if (e.key === 'Escape') {
      cancelInvoiceEdit(cell, currentValue);
    }
  });

  // Handle blur (save)
  input.addEventListener('blur', function() {
    // Small delay to check if user is clicking on something else
    setTimeout(() => {
      if (document.activeElement !== input) {
        saveInvoiceNumber(billingId, this.value, cell);
      }
    }, 100);
  });
}

function cancelInvoiceEdit(cell, originalValue) {
  // Remove editing class
  cell.classList.remove('editing');

  // Restore original display
  if (originalValue) {
    cell.innerHTML = `<span class="invoice-value">${originalValue}</span>`;
  } else {
    cell.innerHTML = '<span class="invoice-placeholder">Click to add</span>';
  }

  // Re-attach click handler
  setupInvoiceNumberEdit();
}

async function saveInvoiceNumber(billingId, newValue, cell) {
  const trimmedValue = newValue.trim();

  try {
    const response = await fetch(`/api/billing-statements/${billingId}/invoice-number`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        invoiceNumber: trimmedValue || '' // Empty string to clear
      })
    });

    if (response.ok) {
      const updatedBilling = await response.json();

      // Update cell's data attribute
      cell.dataset.currentValue = trimmedValue;

      // Update cell display with new value
      cell.classList.remove('editing');
      if (trimmedValue) {
        cell.innerHTML = `<span class="invoice-value">${trimmedValue}</span>`;
      } else {
        cell.innerHTML = '<span class="invoice-placeholder">Click to add</span>';
      }

      // Show success feedback (checkmark animation)
      showInvoiceSaveSuccess(cell);

      // Re-attach click handler
      setupInvoiceNumberEdit();
    } else {
      const errorData = await response.json();
      showInvoiceSaveError(cell, errorData.error || 'Failed to save');
      cell.classList.remove('editing');
      cell.innerHTML = `<span class="invoice-value">${cell.dataset.currentValue || ''}</span>`;
      setupInvoiceNumberEdit();
    }
  } catch (error) {
    console.error('Error saving invoice number:', error);
    showInvoiceSaveError(cell, 'Network error');
    cell.classList.remove('editing');
    cell.innerHTML = `<span class="invoice-value">${cell.dataset.currentValue || ''}</span>`;
    setupInvoiceNumberEdit();
  }
}

function showInvoiceSaveSuccess(cell) {
  const checkmark = document.createElement('span');
  checkmark.className = 'invoice-checkmark';
  checkmark.textContent = '✓';

  // Temporarily append checkmark to cell
  cell.appendChild(checkmark);

  // Remove after animation completes (1.5 seconds)
  setTimeout(() => {
    checkmark.remove();
  }, 1500);
}

function showInvoiceSaveError(cell, message) {
  // Show brief error notification
  showNotification(`Invoice #: ${message}`, 'error');

  // Optional: Add error state to cell briefly
  cell.classList.add('invoice-error');
  setTimeout(() => {
    cell.classList.remove('invoice-error');
  }, 1500);
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
      console.log('✓ Delivery added to DB:', result);
      showNotification('✓ Delivery added successfully!', 'success');
      document.getElementById('deliveryForm').reset();
      console.log('Calling loadDeliveries...');
      await loadDeliveries();
      console.log('Calling loadDashboardData...');
      await loadDashboardData();
    } else {
      const errorText = await response.text();
      let errorMsg = 'Error adding delivery';
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch (e) {
        errorMsg = errorText || errorMsg;
      }
      console.error('Add delivery error:', response.status, errorMsg);
      console.log('Sent data:', data);
      showNotification(errorMsg, 'error');
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
    unitPrice: parseFloat(document.getElementById('comPrice').value)
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
      const errorText = await response.text();
      let errorMsg = 'Error adding company';
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.message || errorJson.error || errorMsg;
      } catch (e) {
        errorMsg = errorText || errorMsg;
      }
      console.error('Add company failed:', response.status, errorMsg);
      showNotification(errorMsg, 'error');
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
      // Match by company NAME (not ID) since API returns company name, not ID
      if (del.company === company.name) {
        stats.count++;
        // Use correct field names from API (bottles_delivered/bottles_returned)
        stats.delivered += (del.bottles_delivered || del.delivered || 0);
        stats.returned += (del.bottles_returned || del.returned || 0);
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

  const selectedCompanies = window.billingCreateCompanyMultiSelect?.getSelectedIds() || 'all';
  const startDate = document.getElementById('bilStartDate').value;
  const endDate = document.getElementById('bilEndDate').value;

  if (!startDate || !endDate) {
    showNotification('Please select date range', 'error');
    return;
  }

  if (selectedCompanies === 'all' || (Array.isArray(selectedCompanies) && selectedCompanies.length === 0)) {
    showNotification('Please select at least one company', 'error');
    return;
  }

  try {
    // Get company details and deliveries
    const companiesResponse = await fetch('/api/companies/all', { headers: getHeaders() });
    const companies = companiesResponse.ok ? await companiesResponse.json() : [];

    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Get the company IDs to create billing for
    const companyIds = Array.isArray(selectedCompanies) ? selectedCompanies : [selectedCompanies];

    // Get company names for all selected companies
    const selectedCompanyNames = companyIds
      .map(id => companies.find(c => c.id === id)?.name)
      .filter(name => name);

    if (selectedCompanyNames.length === 0) {
      showNotification('No valid companies selected', 'error');
      return;
    }

    // Calculate total amount across ALL selected companies
    let totalBottles = 0;
    let totalUnitPrice = 0;

    companyIds.forEach(companyId => {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;

      const companyDeliveries = deliveries.filter(del => {
        const delDate = new Date(del.timestamp);
        return (del.company === company.name || del.company_id === companyId) &&
               delDate >= startDateObj &&
               delDate <= endDateObj;
      });

      const bottles = companyDeliveries.reduce((sum, del) => sum + (del.bottles_delivered || del.delivered || 0), 0);
      totalBottles += bottles;
      totalUnitPrice = Math.max(totalUnitPrice, parseFloat(company.unit_price) || 0);
    });

    const totalAmount = totalBottles * totalUnitPrice;

    // Create ONE combined billing statement for all selected companies
    // Store company names as JSON array in company_name field
    const data = {
      company: JSON.stringify(selectedCompanyNames),
      startDate: startDate,
      endDate: endDate,
      totalAmount: totalAmount
    };

    const response = await fetch('/api/billing-statements', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showNotification(`✓ Created combined billing statement for ${selectedCompanyNames.length} company(ies) - Total: ₱${totalAmount.toFixed(2)}`, 'success');
      document.getElementById('billingForm').reset();
      window.billingCreateCompanyMultiSelect.selectedIds.clear();
      window.billingCreateCompanyMultiSelect.updateDisplay();
      loadBillings();
    } else {
      showNotification('Error creating billing statement', 'error');
    }
  } catch (error) {
    console.error('Error creating billing:', error);
    showNotification('Connection error - could not create billing statement', 'error');
  }
});

async function toggleBillingStatus(id) {
  try {
    console.log('Fetching billing statement:', id);
    const response = await fetch(`/api/billing-statements/${id}`, { headers: getHeaders() });
    console.log('Response status:', response.status);

    if (response.ok) {
      const billing = await response.json();
      console.log('Billing data:', billing);
      document.getElementById('editBilId').value = id;
      // Database field is is_paid (SQLite returns it as is_paid)
      const isPaid = billing.is_paid || billing.paid;
      document.getElementById('billingStatusText').textContent = `Current status: ${isPaid ? 'Paid' : 'Unpaid'}`;
      openModal('editBillingModal');
    } else {
      const errorText = await response.text();
      console.error('GET billing error:', response.status, errorText);
      showNotification(`Error loading billing status: ${response.status}`, 'error');
    }
  } catch (error) {
    console.error('Error loading billing:', error);
    showNotification(`Connection error: ${error.message}`, 'error');
  }
}

document.getElementById('editBillingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('editBilId').value;

  try {
    const response = await fetch(`/api/billing-statements/${id}`, { headers: getHeaders() });
    const billing = response.ok ? await response.json() : null;

    if (!billing) {
      showNotification('Error: Billing statement not found', 'error');
      return;
    }

    // Database field is is_paid (SQLite returns it as is_paid)
    const currentIsPaid = billing.is_paid || billing.paid;

    const updateResponse = await fetch(`/api/billing-statements/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ isPaid: !currentIsPaid })
    });

    if (updateResponse.ok) {
      closeModal('editBillingModal');
      loadBillings();
      showNotification('✓ Billing status updated!', 'success');
    } else {
      const error = await updateResponse.json().catch(() => ({}));
      showNotification(error.error || 'Error updating billing status', 'error');
    }
  } catch (error) {
    console.error('Error updating billing:', error);
    showNotification('Connection error', 'error');
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
    // Fetch companies to get current unit prices
    const companiesResponse = await fetch('/api/companies/all', { headers: getHeaders() });
    const companiesAll = companiesResponse.ok ? await companiesResponse.json() : [];

    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Parse company field (could be JSON array or single string)
    let companyNames = [];
    try {
      companyNames = JSON.parse(company);
      if (!Array.isArray(companyNames)) {
        companyNames = [company];
      }
    } catch (e) {
      // Not JSON, treat as single company name
      companyNames = [company];
    }

    // Get average unit price from selected companies
    let totalUnitPrice = 0;
    companyNames.forEach(name => {
      const companyData = companiesAll.find(c => c.name === name);
      if (companyData) {
        totalUnitPrice = Math.max(totalUnitPrice, parseFloat(companyData.unit_price) || 0);
      }
    });

    // Filter deliveries for ALL selected companies in this billing statement
    const billingDeliveries = deliveries.filter(d => {
      const delDate = new Date(d.timestamp);
      return companyNames.includes(d.company) &&
             delDate >= startDateObj &&
             delDate <= endDateObj;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // CSV content
    let csv = 'EAU CURE WATER REFILLING STATION\n';
    csv += 'F33 A. Soriano Highway, Daang Amaya, Tanza, Cavite\n';
    csv += '(046) 437-6331\n\n';
    csv += `Billing Statement: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}\n`;
    csv += `BILL TO: ${companyNames.join(', ')}\n\n`;
    csv += 'Date,DR #,QTY,Particulars,Unit Price,Amount\n';

    let totalQty = 0;
    let totalAmount = 0;

    billingDeliveries.forEach(d => {
      const qty = d.bottles_delivered || d.delivered || 0;
      const amount = qty * totalUnitPrice;
      totalQty += qty;
      totalAmount += amount;

      const dateStr = new Date(d.timestamp).toLocaleDateString();
      csv += `${dateStr},${d.dr_number || ''},${qty},5 gal round,${totalUnitPrice.toFixed(2)},${amount.toFixed(2)}\n`;
    });

    csv += `\nTOTAL,${totalQty},5 gal round,,${totalAmount.toFixed(2)}\n`;
    csv += `\nPREPARED BY:\n\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = companyNames.length === 1 ? companyNames[0] : 'combined';
    link.setAttribute('download', `${filename}-billing-${new Date(startDate).toISOString().split('T')[0]}.csv`);
    link.click();
    showNotification('✓ Billing statement exported to Excel', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Error exporting to Excel', 'error');
  }
}

async function exportBillingPdf(billingId, company, startDate, endDate) {
  try {
    // Fetch companies to get current unit prices
    const companiesResponse = await fetch('/api/companies/all', { headers: getHeaders() });
    const companiesAll = companiesResponse.ok ? await companiesResponse.json() : [];

    const deliveriesResponse = await fetch('/api/deliveries', { headers: getHeaders() });
    const deliveries = deliveriesResponse.ok ? await deliveriesResponse.json() : [];

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Parse company field (could be JSON array or single string)
    let companyNames = [];
    try {
      companyNames = JSON.parse(company);
      if (!Array.isArray(companyNames)) {
        companyNames = [company];
      }
    } catch (e) {
      // Not JSON, treat as single company name
      companyNames = [company];
    }

    // Get average unit price from selected companies
    let totalUnitPrice = 0;
    companyNames.forEach(name => {
      const companyData = companiesAll.find(c => c.name === name);
      if (companyData) {
        totalUnitPrice = Math.max(totalUnitPrice, parseFloat(companyData.unit_price) || 0);
      }
    });

    // Filter deliveries for ALL selected companies in this billing statement
    const billingDeliveries = deliveries.filter(d => {
      const delDate = new Date(d.timestamp);
      return companyNames.includes(d.company) &&
             delDate >= startDateObj &&
             delDate <= endDateObj;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let totalQty = 0;
    let totalAmount = 0;
    let tableRows = '';

    billingDeliveries.forEach(d => {
      const qty = d.bottles_delivered || d.delivered || 0;
      const amount = qty * totalUnitPrice;
      totalQty += qty;
      totalAmount += amount;

      const dateStr = new Date(d.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      tableRows += `
        <tr>
          <td>${dateStr}</td>
          <td>${d.dr_number || ''}</td>
          <td style="text-align: center;">${qty}</td>
          <td>5 gal round</td>
          <td style="text-align: right;">${totalUnitPrice.toFixed(2)}</td>
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
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; font-size: 11px; line-height: 1.3; }
            .header { text-align: center; margin-bottom: 12px; }
            .company-name { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
            .company-info { font-size: 9px; color: #666; line-height: 1.2; }
            .statement-header { display: flex; justify-content: space-between; margin-bottom: 10px; align-items: flex-start; }
            .statement-title { font-size: 14px; font-weight: bold; color: #d32f2f; }
            .date-range { font-size: 9px; text-align: right; }
            .bill-to { margin-bottom: 6px; font-size: 9px; }
            .bill-to-label { font-weight: bold; }
            .bill-to-name { font-weight: bold; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
            th { background-color: white; border-bottom: 1px solid #333; padding: 4px 6px; text-align: left; font-weight: bold; }
            td { padding: 3px 5px; border-bottom: 0.5px solid #ddd; }
            .total-row { background-color: #fff; border-top: 1px solid #d32f2f; border-bottom: 1px solid #d32f2f; font-weight: bold; color: #d32f2f; }
            .total-row td { padding: 4px 6px; }
            .footer { margin-top: 10px; font-size: 9px; }
            .prepared-by { margin-bottom: 0px; }
            .signature-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 3px; }
            .signature-label { white-space: nowrap; line-height: 1; }
            .signature-line-container { display: flex; flex-direction: column; align-items: flex-start; }
            .signature-line { border-bottom: 0.5px solid #333; width: 160px; flex-grow: 0; height: 0.5px; }
            .signature-caption { font-size: 8px; margin-top: 1px; text-align: center; }
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
            <span class="bill-to-name">${companyNames.join(', ')}</span>
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
                <td>-</td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;">AMOUNT: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <div class="prepared-by">
              <div style="margin-bottom: 15px;">PREPARED BY: ___________________</div>
              <div class="signature-row">
                <span class="signature-label">Original Invoices / Statement Received By:</span>
                <div class="signature-line-container">
                  <div class="signature-line"></div>
                  <div class="signature-caption">(Signature Over Printed Name)</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=800,width=900');
    printWindow.document.write(html);
    printWindow.document.title = `Billing Statement - ${companyNames.join(', ')} - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
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

// Helper: Parse date as UTC (FIX for timezone bug)
function parseUTCDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return new Date(Date.UTC(year, month - 1, day));
}

// Helper: Get date range for filtering
function getDateRangeFilterFunction(startDate, endDate) {
  // Parse dates as UTC to avoid timezone issues
  const startUTC = parseUTCDate(startDate);
  const endUTC = parseUTCDate(endDate);
  // Include entire end day by going to next day at 00:00 UTC
  endUTC.setUTCDate(endUTC.getUTCDate() + 1);

  return (delivery) => {
    const delDate = new Date(delivery.timestamp);
    return delDate >= startUTC && delDate < endUTC;
  };
}

document.getElementById('deliveryReportForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const startDate = document.getElementById('repStartDate').value;
  const endDate = document.getElementById('repEndDate').value;
  const selectedCompanies = window.repCompanyMultiSelect?.getSelectedIds() || 'all';

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

    const isAllCompanies = selectedCompanies === 'all';
    const selectedCompanyIds = isAllCompanies ? null : new Set(Array.isArray(selectedCompanies) ? selectedCompanies : [selectedCompanies]);
    const dateFilter = getDateRangeFilterFunction(startDate, endDate);

    // Filter deliveries (with timezone fix)
    let filteredDeliveries = deliveries.filter(del => {
      const inDateRange = dateFilter(del);
      const inCompany = isAllCompanies || selectedCompanyIds.has(companyMap[del.company]?.id);
      return inDateRange && inCompany;
    });

    console.log('Total in DB:', deliveries.length, '| Filtered:', filteredDeliveries.length);

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
      selectedCompanyIds: selectedCompanyIds,
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
  const container = document.getElementById('reportContainer');
  const empty = document.getElementById('reportEmpty');
  const thead = document.querySelector('#deliveryReportTable thead');

  if (reportData.deliveries.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  // Determine if we should show company column
  const showCompanyColumn = reportData.isAllCompanies || (reportData.selectedCompanyIds && reportData.selectedCompanyIds.size > 1);

  // Update table header to show/hide Company column
  const companyHeaderCells = thead.querySelectorAll('th');
  if (companyHeaderCells.length > 0) {
    companyHeaderCells[0].style.display = showCompanyColumn ? '' : 'none';
  }

  container.style.display = 'block';
  empty.style.display = 'none';

  // Render body rows - Company | DR # | Delivered | Returned | Unit Price | Earnings | Actions
  tbody.innerHTML = reportData.deliveries.map(del => {
    return `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; border: 1px solid #ddd; display: ${showCompanyColumn ? '' : 'none'};">${del.company}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${del.dr_number || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${del.qty}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${del.returns}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${del.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #28a745; font-weight: bold;">₱${del.earnings.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><button class="btn btn-danger btn-sm" onclick="deleteDelivery(${del.id})">Delete</button></td>
      </tr>
    `;
  }).join('');

  // Calculate totals
  const totalDelivered = reportData.deliveries.reduce((sum, d) => sum + d.qty, 0);
  const totalReturned = reportData.deliveries.reduce((sum, d) => sum + d.returns, 0);
  const totalEarnings = reportData.deliveries.reduce((sum, d) => sum + d.earnings, 0);

  // Update totals
  document.getElementById('totalDelivered').textContent = totalDelivered;
  document.getElementById('totalReturned').textContent = totalReturned;
  document.getElementById('totalEarnings').textContent = `₱${totalEarnings.toFixed(2)}`;
}

// Export to Excel
document.getElementById('reportExcelBtn')?.addEventListener('click', () => {
  if (!currentReportData) {
    showNotification('Please generate a report first', 'error');
    return;
  }

  const { startDate, endDate, deliveries } = currentReportData;

  let csv = 'Delivery Report\n';
  csv += `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}\n\n`;

  // Headers: Company,DR #,Delivered,Returned,Unit Price,Earnings
  csv += 'Company,DR #,Delivered,Returned,Unit Price,Earnings\n';

  // Data
  let totalDelivered = 0, totalReturned = 0, totalEarnings = 0;
  deliveries.forEach(d => {
    totalDelivered += d.qty;
    totalReturned += d.returns;
    totalEarnings += d.earnings;

    csv += `"${d.company}","${d.dr_number || '-'}",${d.qty},${d.returns},"₱${d.unitPrice.toFixed(2)}","₱${d.earnings.toFixed(2)}"\n`;
  });

  // Totals
  csv += `\n"TOTAL","",${totalDelivered},${totalReturned},,"₱${totalEarnings.toFixed(2)}"\n`;

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

  const { startDate, endDate, deliveries } = currentReportData;
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
            <th>Company</th>
            <th>DR #</th>
            <th class="text-center">Delivered</th>
            <th class="text-center">Returned</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Earnings</th>
          </tr>
        </thead>
        <tbody>
  `;

  let totalDelivered = 0, totalReturned = 0, totalEarnings = 0;
  deliveries.forEach(d => {
    totalDelivered += d.qty;
    totalReturned += d.returns;
    totalEarnings += d.earnings;

    html += `
      <tr>
        <td>${d.company}</td>
        <td>${d.dr_number || '-'}</td>
        <td class="text-center">${d.qty}</td>
        <td class="text-center">${d.returns}</td>
        <td class="text-right">₱${d.unitPrice.toFixed(2)}</td>
        <td class="text-right">₱${d.earnings.toFixed(2)}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">TOTAL</td>
            <td class="text-center">${totalDelivered}</td>
            <td class="text-center">${totalReturned}</td>
            <td></td>
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

// ============================================
// DELIVERY HISTORY
// ============================================

let allDeliveries = [];
let allCompanies = [];

// Load data on page load
async function loadHistoryData() {
  try {
    const [delRes, comRes] = await Promise.all([
      fetch('/api/deliveries', { headers: getHeaders() }),
      fetch('/api/companies/all', { headers: getHeaders() })
    ]);

    allDeliveries = delRes.ok ? await delRes.json() : [];
    allCompanies = comRes.ok ? await comRes.json() : [];
  } catch (e) {
    console.error('Error loading history data:', e);
  }
}

// Load all deliveries by default when history tab is shown
function loadAllDeliveriesHistory() {
  // Create company map
  const companyMap = {};
  allCompanies.forEach(c => {
    companyMap[c.name] = { id: c.id, unitPrice: parseFloat(c.unit_price) || 0 };
  });

  // Use all deliveries
  let filtered = allDeliveries.slice();

  // Sort by date descending (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Add calculated fields
  filtered = filtered.map(del => {
    const unitPrice = companyMap[del.company]?.unitPrice || 0;
    const qty = del.bottles_delivered || del.delivered || 0;
    const amount = qty * unitPrice;
    const returns = del.bottles_returned || del.returned || 0;
    const earnings = amount;

    return {
      ...del,
      unitPrice,
      qty,
      amount,
      returns,
      earnings
    };
  });

  renderDeliveryHistory(filtered, '', '', '');
}

// History date range filter
document.getElementById('historyShowBtn')?.addEventListener('click', () => {
  const startDate = document.getElementById('historyStartDate').value;
  const endDate = document.getElementById('historyEndDate').value;
  const selectedCompanies = window.historyCompanyMultiSelect?.getSelectedIds() || 'all';

  if (!startDate || !endDate) {
    showNotification('Please select start and end dates', 'error');
    return;
  }

  showDeliveryHistory(startDate, endDate, selectedCompanies);
});

function showDeliveryHistory(startDate, endDate, selectedCompanies) {
  const dateFilter = getDateRangeFilterFunction(startDate, endDate);

  // Create company map
  const companyMap = {};
  allCompanies.forEach(c => {
    companyMap[c.name] = { id: c.id, unitPrice: parseFloat(c.unit_price) || 0 };
  });

  // Handle company filtering
  const isAllCompanies = selectedCompanies === 'all';
  const selectedCompanyIds = isAllCompanies ? null : new Set(Array.isArray(selectedCompanies) ? selectedCompanies : [selectedCompanies]);

  // Filter deliveries
  let filtered = allDeliveries.filter(del => {
    const inDateRange = dateFilter(del);
    const inCompany = isAllCompanies || selectedCompanyIds.has(companyMap[del.company]?.id);
    return inDateRange && inCompany;
  });

  // Sort by date
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Add calculated fields
  filtered = filtered.map(del => {
    const unitPrice = companyMap[del.company]?.unitPrice || 0;
    const qty = del.bottles_delivered || del.delivered || 0;
    const amount = qty * unitPrice;
    const returns = del.bottles_returned || del.returned || 0;
    const earnings = amount;

    return {
      ...del,
      unitPrice,
      qty,
      amount,
      returns,
      earnings
    };
  });

  renderDeliveryHistory(filtered, startDate, endDate, isAllCompanies, selectedCompanyIds);
}

function renderDeliveryHistory(deliveries, startDate, endDate, isAllCompanies, selectedCompanyIds) {
  const container = document.getElementById('historyContainer');
  const empty = document.getElementById('historyEmpty');
  const tbody = document.getElementById('historyTableBody');
  const dateRangeEl = document.getElementById('historyDateRange');
  const thead = document.querySelector('#historyTable thead');

  if (deliveries.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  empty.style.display = 'none';

  // Determine if we should show company column
  const showCompanyColumn = isAllCompanies || (selectedCompanyIds && selectedCompanyIds.size > 1);

  // Update table header to show/hide Company column
  const companyHeaderCells = thead.querySelectorAll('th');
  if (companyHeaderCells.length > 0) {
    companyHeaderCells[0].style.display = showCompanyColumn ? '' : 'none';
  }

  // Format date range text
  let dateRangeText = '';
  if (!startDate && !endDate) {
    // All-time view
    dateRangeText = `All Deliveries (${deliveries.length} total)`;
  } else if (startDate === endDate) {
    dateRangeText = `${new Date(startDate).toLocaleDateString()} - ${deliveries.length} deliveries`;
  } else {
    dateRangeText = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()} (${deliveries.length} deliveries)`;
  }
  dateRangeEl.textContent = dateRangeText;

  // Company | DR # | Delivered | Returned | Unit Price | Earnings | Actions
  tbody.innerHTML = deliveries.map(del => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 8px; border: 1px solid #ddd; display: ${showCompanyColumn ? '' : 'none'};">${del.company}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${del.dr_number || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${del.qty}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${del.returns}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₱${del.unitPrice.toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #28a745; font-weight: bold;">₱${del.earnings.toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;"><button class="btn btn-danger btn-sm" onclick="deleteDelivery(${del.id})">Delete</button></td>
    </tr>
  `).join('');
}

function getChartTimeRangeLabel(filter) {
  const labels = {
    'today': 'Today',
    'week': 'This Week',
    'month': 'This Month',
    'all': 'All Time'
  };
  return labels[filter] || 'This Week';
}

function setupEventListeners() {
  document.querySelectorAll('.overview-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const filter = tab.getAttribute('data-filter');
      document.querySelectorAll('.overview-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update chart title
      const chartTimeRangeEl = document.getElementById('chartTimeRange');
      if (chartTimeRangeEl) {
        chartTimeRangeEl.textContent = getChartTimeRangeLabel(filter);
      }

      // Re-fetch and render dashboard data with the selected filter
      try {
        const response = await fetch('/api/deliveries', {
          headers: getHeaders(),
          cache: 'no-cache'
        });
        if (response.ok) {
          const deliveries = await response.json();
          renderDeliveryChart(deliveries, filter);
        }
      } catch (error) {
        console.error('Error loading deliveries for chart:', error);
      }
    });
  });

  document.getElementById('dashFilterBtn')?.addEventListener('click', () => {
    // TODO: Implement filtering
  });

  // Records page tab switching
  document.querySelectorAll('.records-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      showRecordsTab(tabName);
    });
  });
}

function showRecordsTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.records-tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.records-tab').forEach(btn => {
    btn.classList.remove('active');
    btn.style.color = '#999';
    btn.style.borderBottom = '3px solid transparent';
  });

  // Show selected tab
  const tabElement = document.getElementById(`${tabName}Tab`);
  if (tabElement) {
    tabElement.style.display = 'block';
  }

  // Activate tab button
  const activeBtn = document.querySelector(`.records-tab[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.color = '#667eea';
    activeBtn.style.borderBottom = '3px solid #667eea';
  }
}

// ============================================
// MULTI-SELECT COMPONENT
// ============================================

class MultiSelect {
  constructor(config) {
    this.inputEl = config.inputEl;
    this.dropdownEl = config.dropdownEl;
    this.options = config.options || [];
    this.selectedIds = new Set();
    this.onChangeCallback = config.onChange;
    // Use unique prefix from dropdownEl ID to prevent duplicate checkbox IDs across tabs
    this.idPrefix = config.dropdownEl?.id?.replace('Dropdown', '') || 'select';

    this.init();
  }

  init() {
    this.renderDropdown();
    this.setupEventListeners();
  }

  setOptions(options) {
    this.options = options;
    this.renderDropdown();
  }

  renderDropdown() {
    this.dropdownEl.innerHTML = '';

    // Add "All Companies" option
    const allOption = document.createElement('div');
    allOption.className = 'multi-select-option';
    const allCheckboxId = `${this.idPrefix}-option-all`;
    allOption.innerHTML = `
      <input type="checkbox" id="${allCheckboxId}" value="all" ${this.selectedIds.size === 0 ? 'checked' : ''}>
      <label for="${allCheckboxId}">All Companies</label>
    `;
    allOption.addEventListener('change', (e) => {
      e.stopPropagation(); // Prevent click from bubbling to document listener
      if (e.target.checked) {
        this.selectedIds.clear();
        this.updateDisplay();
        this.renderDropdown();
      }
    });
    // Prevent dropdown from closing when clicking on the "All Companies" option
    allOption.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    this.dropdownEl.appendChild(allOption);

    // Add company options
    this.options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'multi-select-option';
      const isChecked = this.selectedIds.has(String(option.id));
      const checkboxId = `${this.idPrefix}-option-${option.id}`;
      optionEl.innerHTML = `
        <input type="checkbox" id="${checkboxId}" value="${option.id}" ${isChecked ? 'checked' : ''}>
        <label for="${checkboxId}">${option.name}</label>
      `;
      optionEl.addEventListener('change', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to document listener
        if (e.target.checked) {
          this.selectedIds.add(String(option.id));
        } else {
          this.selectedIds.delete(String(option.id));
        }
        this.updateDisplay();
        if (this.onChangeCallback) this.onChangeCallback(this.getSelectedIds());
      });
      // Prevent dropdown from closing when clicking on the option
      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      this.dropdownEl.appendChild(optionEl);
    });
  }

  updateDisplay() {
    const tagsContainer = this.inputEl;
    const searchInput = tagsContainer.querySelector('.multi-select-search');
    const tags = tagsContainer.querySelectorAll('.multi-select-tag');
    tags.forEach(tag => tag.remove());

    if (this.selectedIds.size === 0) {
      const allTag = document.createElement('div');
      allTag.className = 'multi-select-tag all';
      allTag.innerHTML = 'All Companies';
      tagsContainer.insertBefore(allTag, searchInput);
    } else {
      this.selectedIds.forEach(id => {
        const option = this.options.find(o => String(o.id) === id);
        if (option) {
          const tag = document.createElement('div');
          tag.className = 'multi-select-tag';
          tag.innerHTML = `
            ${option.name}
            <span class="multi-select-tag-remove" data-id="${option.id}">×</span>
          `;
          tag.querySelector('.multi-select-tag-remove').addEventListener('click', () => {
            this.selectedIds.delete(id);
            this.updateDisplay();
            this.renderDropdown();
            if (this.onChangeCallback) this.onChangeCallback(this.getSelectedIds());
          });
          tagsContainer.insertBefore(tag, searchInput);
        }
      });
    }
  }

  getSelectedIds() {
    if (this.selectedIds.size === 0) {
      return 'all';
    }
    return Array.from(this.selectedIds).map(id => parseInt(id));
  }

  setupEventListeners() {
    const searchInput = this.inputEl.querySelector('.multi-select-search');

    // Toggle dropdown
    this.inputEl.addEventListener('click', () => {
      this.dropdownEl.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.inputEl.contains(e.target) && !this.dropdownEl.contains(e.target)) {
        this.dropdownEl.classList.remove('open');
      }
    });

    // Filter options
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const options = this.dropdownEl.querySelectorAll('.multi-select-option');
      options.forEach(optionEl => {
        const label = optionEl.querySelector('label').textContent.toLowerCase();
        optionEl.style.display = label.includes(query) ? '' : 'none';
      });
    });
  }
}

// Initialize multi-select components when page loads
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for companies to be loaded
  await new Promise(resolve => {
    const checkCompanies = () => {
      if (allCompanies && allCompanies.length > 0) {
        resolve();
      } else {
        setTimeout(checkCompanies, 100);
      }
    };
    checkCompanies();
  });

  // Initialize Delivery Report multi-select (INDEPENDENT state)
  const repInput = document.getElementById('repCompanyInput');
  const repDropdown = document.getElementById('repCompanyDropdown');
  if (repInput && repDropdown) {
    window.repCompanyMultiSelect = new MultiSelect({
      inputEl: repInput,
      dropdownEl: repDropdown,
      options: allCompanies,
      onChange: () => {} // Independent from Delivery History
    });
  }

  // Initialize Delivery History multi-select (INDEPENDENT state)
  const histInput = document.getElementById('historyCompanyInput');
  const histDropdown = document.getElementById('historyCompanyDropdown');
  if (histInput && histDropdown) {
    window.historyCompanyMultiSelect = new MultiSelect({
      inputEl: histInput,
      dropdownEl: histDropdown,
      options: allCompanies,
      onChange: () => {} // Independent from Delivery Report
    });
  }

  // Initialize Billing Statement Creation multi-select
  const bilCreateInput = document.getElementById('billingCreateCompanyInput');
  const bilCreateDropdown = document.getElementById('billingCreateCompanyDropdown');
  if (bilCreateInput && bilCreateDropdown) {
    window.billingCreateCompanyMultiSelect = new MultiSelect({
      inputEl: bilCreateInput,
      dropdownEl: bilCreateDropdown,
      options: allCompanies,
      onChange: () => {} // Used in form submission
    });
  }
});
