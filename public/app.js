const API_URL = '/api/deliveries';
const COMPANIES_API = '/api/companies';
let deliveries = [];
let companies = [];
let editingId = null;

const socket = io();
socket.on('connect', () => {
  console.log('Connected to server');
});
socket.on('deliveries_updated', (updatedDeliveries) => {
  console.log('Deliveries updated from server');
  deliveries = updatedDeliveries;
  for (const key in deliveryCountByDate) {
    delete deliveryCountByDate[key];
  }
  deliveries.forEach(delivery => {
    const deliveryDate = new Date(delivery.timestamp);
    const dateStr = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}-${String(deliveryDate.getDate()).padStart(2, '0')}`;
    deliveryCountByDate[dateStr] = (deliveryCountByDate[dateStr] || 0) + 1;
  });
  renderTable();
  renderCalendar();
  updateStats();
  renderDeliveryChart();
});
socket.on('companies_updated', (updatedCompanies) => {
  console.log('Companies updated from server');
  companies = updatedCompanies;
  populateCompanyDropdowns();
});

const deliveryForm = document.getElementById('deliveryForm');
const tableBody = document.getElementById('tableBody');
const formMessage = document.getElementById('formMessage');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModalBtn = document.getElementById('closeModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const companySelect = document.getElementById('company');
const editCompanySelect = document.getElementById('editCompany');
const backupBtn = document.getElementById('backupBtn');
const backupModal = document.getElementById('backupModal');
const closeBackupModalBtn = document.getElementById('closeBackupModal');
const closeBackupModal2Btn = document.getElementById('closeBackupModal2');
const manualBackupBtn = document.getElementById('manualBackupBtn');
const backupList = document.getElementById('backupList');
const companyStatsModal = document.getElementById('companyStatsModal');
const closeCompanyStatsModalBtn = document.getElementById('closeCompanyStatsModal');
const closeCompanyStatsModal2Btn = document.getElementById('closeCompanyStatsModal2');
const filterCompanySelect = document.getElementById('filterCompany');
const filterStartDateInput = document.getElementById('filterStartDate');
const filterEndDateInput = document.getElementById('filterEndDate');
const exportBtn = document.getElementById('exportBtn');
const printBtn = document.getElementById('printBtn');
const settingsHeaderBtn = document.getElementById('settingsHeaderBtn') || {};
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModal');
const closeSettingsModal2Btn = document.getElementById('closeSettingsModal2');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsDefaultCompany = document.getElementById('settingsDefaultCompany');
const settingsRowsPerPage = document.getElementById('settingsRowsPerPage');
const settingsAutoRefresh = document.getElementById('settingsAutoRefresh');
const settingsDarkMode = document.getElementById('settingsDarkMode');
const deliveryTime = document.getElementById('deliveryTime');
const calendar = document.getElementById('calendar');
const calendarMonth = document.getElementById('calendarMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDateFromCalendar = document.getElementById('selectedDateFromCalendar');
const formDateDisplay = document.getElementById('formDateDisplay');
const billingModal = document.getElementById('billingModal');
const closeBillingModalBtn = document.getElementById('closeBillingModal');
const closeBillingModal2Btn = document.getElementById('closeBillingModal2');
const billingCompanySelect = document.getElementById('billingCompany');
const billingStartDateInput = document.getElementById('billingStartDate');
const billingEndDateInput = document.getElementById('billingEndDate');
const billingContent = document.getElementById('billingContent');
const printBillingBtn = document.getElementById('printBillingBtn');
const downloadBillingPdfBtn = document.getElementById('downloadBillingPdfBtn');
const saveBillingBtn = document.getElementById('saveBillingBtn');
const billingHistoryModal = document.getElementById('billingHistoryModal');
const closeBillingHistoryModalBtn = document.getElementById('closeBillingHistoryModal');
const closeBillingHistoryModal2Btn = document.getElementById('closeBillingHistoryModal2');
const billingHistoryContent = document.getElementById('billingHistoryContent');
const addCompanyModal = document.getElementById('addCompanyModal');
const closeAddCompanyModalBtn = document.getElementById('closeAddCompanyModal');
const closeAddCompanyModal2Btn = document.getElementById('closeAddCompanyModal2');
const addCompanyForm = document.getElementById('addCompanyForm');
const addCompanyMessage = document.getElementById('addCompanyMessage');
const dailyReportModal = document.getElementById('dailyReportModal');
const closeDailyReportModalBtn = document.getElementById('closeDailyReportModal');
const closeDailyReportModal2Btn = document.getElementById('closeDailyReportModal2');
const reportDateInput = document.getElementById('reportDate');
const dailyReportContent = document.getElementById('dailyReportContent');
const printDailyReportBtn = document.getElementById('printDailyReportBtn');
const downloadDailyReportBtn = document.getElementById('downloadDailyReportBtn');

let currentCalendarDate = new Date();
let selectedDateForDeliveries = new Date();
const deliveryCountByDate = {};

deliveryForm.addEventListener('submit', handleFormSubmit);
editForm.addEventListener('submit', handleEditSubmit);
closeModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);
backupBtn.addEventListener('click', openBackupModal);
closeBackupModalBtn.addEventListener('click', closeBackupModal);
closeBackupModal2Btn.addEventListener('click', closeBackupModal);
manualBackupBtn.addEventListener('click', createManualBackup);
closeCompanyStatsModalBtn.addEventListener('click', closeCompanyStatsModal);
closeCompanyStatsModal2Btn.addEventListener('click', closeCompanyStatsModal);
exportBtn.addEventListener('click', exportToCSV);
printBtn.addEventListener('click', printRecords);
if (settingsHeaderBtn && settingsHeaderBtn.addEventListener) {
  settingsHeaderBtn.addEventListener('click', openSettingsModal);
}
if (closeSettingsModalBtn) closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
if (closeSettingsModal2Btn) closeSettingsModal2Btn.addEventListener('click', closeSettingsModal);
saveSettingsBtn.addEventListener('click', saveSettings);
const saveSettingsBtnPage = document.getElementById('saveSettingsBtnPage');
if (saveSettingsBtnPage) saveSettingsBtnPage.addEventListener('click', saveSettings);
if (settingsDarkMode) settingsDarkMode.addEventListener('change', toggleDarkMode);
prevMonthBtn.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
});
closeBillingModalBtn.addEventListener('click', closeBillingModal);
closeBillingModal2Btn.addEventListener('click', closeBillingModal);
closeAddCompanyModalBtn.addEventListener('click', closeAddCompanyModal);
closeAddCompanyModal2Btn.addEventListener('click', closeAddCompanyModal);
printBillingBtn.addEventListener('click', printBillingStatement);
downloadBillingPdfBtn.addEventListener('click', downloadBillingPdf);
saveBillingBtn.addEventListener('click', saveBillingStatement);
billingCompanySelect.addEventListener('change', generateBillingStatement);
billingStartDateInput.addEventListener('change', generateBillingStatement);
billingEndDateInput.addEventListener('change', generateBillingStatement);
closeBillingHistoryModalBtn.addEventListener('click', closeBillingHistoryModal);
closeBillingHistoryModal2Btn.addEventListener('click', closeBillingHistoryModal);
closeDailyReportModalBtn.addEventListener('click', closeDailyReportModal);
closeDailyReportModal2Btn.addEventListener('click', closeDailyReportModal);
reportDateInput.addEventListener('change', generateDailyReport);
printDailyReportBtn.addEventListener('click', printDailyReport);
downloadDailyReportBtn.addEventListener('click', downloadDailyReport);

async function fetchCompanies() {
  try {
    const response = await fetch(COMPANIES_API);
    if (!response.ok) throw new Error('Failed to fetch companies: ' + response.status);
    companies = await response.json();
    console.log('Companies loaded:', companies.length);
    populateCompanyDropdowns();
  } catch (err) {
    console.error('Error loading companies:', err);
    showMessage('Error loading companies: ' + err.message, 'error');
  }
}

function populateCompanyDropdowns() {
  const options = companies.map(company =>
    `<option value="${company}">${company}</option>`
  ).join('');

  companySelect.innerHTML = '<option value="">-- Select a Company --</option>' + options;
  editCompanySelect.innerHTML = '<option value="">-- Select a Company --</option>' + options;
  settingsDefaultCompany.innerHTML = '<option value="">None</option>' + options;
  populateFilterCompanyDropdown();
}

function renderDeliveryChart() {
  const canvas = document.getElementById('deliveryChart');
  if (!canvas) return;

  // Get last 7 days of data
  const last7Days = [];
  const deliveryCount = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const count = deliveryCountByDate[dateStr] || 0;

    last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    deliveryCount.push(count);
  }

  // Get text color based on dark mode
  const isDarkMode = document.body.classList.contains('dark-mode');
  const textColor = isDarkMode ? '#f5f5f5' : '#333';

  const ctx = canvas.getContext('2d');

  // Destroy existing chart if it exists
  if (window.deliveryChartInstance) {
    window.deliveryChartInstance.destroy();
  }

  window.deliveryChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Deliveries',
        data: deliveryCount,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { size: 14, weight: '600' }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            font: { size: 12 }
          },
          grid: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            color: textColor,
            font: { size: 12 }
          },
          grid: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });
}

async function fetchDeliveries() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch deliveries');
    deliveries = await response.json();

    for (const key in deliveryCountByDate) {
      delete deliveryCountByDate[key];
    }

    deliveries.forEach(delivery => {
      const deliveryDate = new Date(delivery.timestamp);
      const dateStr = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}-${String(deliveryDate.getDate()).padStart(2, '0')}`;
      deliveryCountByDate[dateStr] = (deliveryCountByDate[dateStr] || 0) + 1;
    });

    renderTable();
    renderCalendar();
    renderDeliveryChart();
  } catch (err) {
    showMessage('Error loading deliveries: ' + err.message, 'error');
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const company = document.getElementById('company').value;
  const bottlesDelivered = parseInt(document.getElementById('bottlesDelivered').value);
  const bottlesReturned = parseInt(document.getElementById('bottlesReturned').value);
  const drNumber = document.getElementById('drNumber').value;
  const time = deliveryTime.value;

  const dateStr = selectedDateForDeliveries.toISOString().split('T')[0];
  const timestamp = new Date(`${dateStr}T${time}:00`).toISOString();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, bottlesDelivered, bottlesReturned, drNumber, timestamp })
    });

    if (!response.ok) throw new Error('Failed to add delivery');

    showMessage('Delivery added to ' + selectedDateForDeliveries.toLocaleDateString() + '!', 'success');
    deliveryForm.reset();
    fetchDeliveries();
    loadStats();
    renderCalendar();
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

function openEditModal(id) {
  const delivery = deliveries.find(d => d.id === id);
  if (!delivery) return;

  editingId = id;
  document.getElementById('editId').value = id;
  document.getElementById('editCompany').value = delivery.company;
  document.getElementById('editBottlesDelivered').value = delivery.bottles_delivered;
  document.getElementById('editBottlesReturned').value = delivery.bottles_returned;
  document.getElementById('editDrNumber').value = delivery.dr_number;

  editModal.classList.remove('hidden');
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingId = null;
}

function selectDateFromCalendar(date) {
  selectedDateForDeliveries = new Date(date);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = selectedDateForDeliveries.toLocaleDateString('en-US', options);

  selectedDateFromCalendar.textContent = formatted;
  formDateDisplay.textContent = formatted;
  renderCalendar();

  showMessage(`Selected date: ${formatted}`, 'success');
}

function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarMonth.textContent = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div class="calendar-grid">';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="calendar-day other-month"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = date.toDateString() === selectedDateForDeliveries.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();

    const count = deliveryCountByDate[dateStr] || 0;
    const countBadge = count > 0 ? `<span class="delivery-count">${count}</span>` : '';

    html += `
      <div class="calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div class="day-number">${day}</div>
        ${countBadge}
      </div>
    `;
  }

  for (let day = 1; day <= (42 - daysInMonth - firstDay); day++) {
    html += `<div class="calendar-day other-month"></div>`;
  }

  html += '</div>';
  calendar.innerHTML = html;

  document.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
    dayEl.addEventListener('click', function() {
      const dateStr = this.getAttribute('data-date');
      if (dateStr) {
        selectDateFromCalendar(dateStr);
      }
    });
  });
}

async function handleEditSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const company = document.getElementById('editCompany').value;
  const bottlesDelivered = parseInt(document.getElementById('editBottlesDelivered').value);
  const bottlesReturned = parseInt(document.getElementById('editBottlesReturned').value);
  const drNumber = document.getElementById('editDrNumber').value;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, bottlesDelivered, bottlesReturned, drNumber })
    });

    if (!response.ok) throw new Error('Failed to update delivery');

    showMessage('Delivery updated successfully!', 'success');
    closeEditModal();
    fetchDeliveries();
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

async function deleteDelivery(id) {
  const delivery = deliveries.find(d => d.id === id);

  Swal.fire({
    title: 'Delete Delivery?',
    text: `Remove delivery for ${delivery.company}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete delivery');

        Swal.fire('Deleted!', 'Delivery deleted successfully.', 'success');
        fetchDeliveries();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete: ' + err.message, 'error');
      }
    }
  });
}

function renderTable() {
  if (deliveries.length === 0) {
    tableBody.innerHTML = '<tr class="empty-state"><td colspan="7">No deliveries recorded yet</td></tr>';
    return;
  }

  tableBody.innerHTML = deliveries.map(delivery => {
    const timestamp = new Date(delivery.timestamp).toLocaleString();
    return `
      <tr>
        <td>${delivery.id}</td>
        <td>${delivery.company}</td>
        <td>${delivery.bottles_delivered}</td>
        <td>${delivery.bottles_returned}</td>
        <td>${delivery.dr_number}</td>
        <td>${timestamp}</td>
        <td class="actions">
          <button class="btn btn-edit" onclick="openEditModal(${delivery.id})">Edit</button>
          <button class="btn btn-delete" onclick="deleteDelivery(${delivery.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function showMessage(msg, type) {
  formMessage.textContent = msg;
  formMessage.className = `form-message show ${type}`;
  setTimeout(() => {
    formMessage.classList.remove('show');
  }, 3000);
}

function openBackupModal() {
  backupModal.classList.remove('hidden');
  loadBackupList();
}

function closeBackupModal() {
  backupModal.classList.add('hidden');
}

async function loadBackupList() {
  try {
    backupList.innerHTML = '<p class="loading">Loading backups...</p>';
    const response = await fetch('/api/backups');
    if (!response.ok) throw new Error('Failed to load backups');
    const backups = await response.json();

    if (backups.length === 0) {
      backupList.innerHTML = '<p class="loading">No backups yet. Automatic backups run daily.</p>';
      return;
    }

    backupList.innerHTML = backups.map(backup => {
      const date = new Date(backup.created).toLocaleString();
      const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
      return `
        <div class="backup-item">
          <div class="backup-info">
            <strong>${backup.filename}</strong>
            <br>
            <small>Created: ${date}</small>
            <br>
            <small>Size: ${sizeMB} MB</small>
          </div>
          <div class="backup-actions">
            <button class="btn btn-small btn-restore" onclick="restoreBackup('${backup.filename}')">Restore</button>
            <button class="btn btn-small btn-download" onclick="downloadBackup('${backup.filename}')">Download</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    backupList.innerHTML = `<p class="error">Error loading backups: ${err.message}</p>`;
  }
}

async function createManualBackup() {
  try {
    manualBackupBtn.disabled = true;
    manualBackupBtn.textContent = 'Creating...';

    const response = await fetch('/api/backups', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to create backup');

    const result = await response.json();
    showMessage('Backup created successfully!', 'success');
    loadBackupList();
  } catch (err) {
    showMessage('Error creating backup: ' + err.message, 'error');
  } finally {
    manualBackupBtn.disabled = false;
    manualBackupBtn.textContent = 'Create Backup Now';
  }
}

async function restoreBackup(filename) {
  Swal.fire({
    title: 'Restore Backup?',
    text: 'This will replace your current data with the selected backup. This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, restore it!',
    cancelButtonText: 'Cancel'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/backups/restore/${filename}`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to restore backup');

        Swal.fire('Restored!', 'Database restored successfully. Reloading...', 'success');
        setTimeout(() => {
          fetchDeliveries();
          loadBackupList();
          loadStats();
        }, 1000);
      } catch (err) {
        Swal.fire('Error!', 'Failed to restore backup: ' + err.message, 'error');
      }
    }
  });
}

function downloadBackup(filename) {
  window.location.href = `/api/backups/download/${filename}`;
}

function populateFilterCompanyDropdown() {
  const options = companies.map(company =>
    `<option value="${company}">${company}</option>`
  ).join('');
  filterCompanySelect.innerHTML = '<option value="">All Companies</option>' + options;
}

async function applyFilters() {
  const company = filterCompanySelect.value;
  const startDate = filterStartDateInput.value;
  const endDate = filterEndDateInput.value;

  try {
    let url = '/api/deliveries?';
    if (company) url += `company=${encodeURIComponent(company)}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to filter deliveries');
    deliveries = await response.json();
    renderTable();

    await loadStats(startDate, endDate);
  } catch (err) {
    showMessage('Error filtering data: ' + err.message, 'error');
  }
}

function resetFilters() {
  filterCompanySelect.value = '';
  filterStartDateInput.value = '';
  filterEndDateInput.value = '';
  applyFilters();
}

async function loadStats(startDate, endDate) {
  try {
    let url = '/api/stats?';
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load stats');
    const stats = await response.json();

    document.getElementById('totalDeliveries').textContent = stats.total_deliveries || 0;
    document.getElementById('totalDelivered').textContent = stats.total_delivered || 0;
    document.getElementById('totalReturned').textContent = stats.total_returned || 0;

    const net = (stats.total_delivered || 0) - (stats.total_returned || 0);
    document.getElementById('netBottles').textContent = net;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

function filterQuickRange(range) {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'all':
      filterStartDateInput.value = '';
      filterEndDateInput.value = '';
      applyFilters();
      return;
  }

  filterStartDateInput.value = start.toISOString().split('T')[0];
  filterEndDateInput.value = end.toISOString().split('T')[0];
  applyFilters();
}

function closeCompanyStatsModal() {
  companyStatsModal.classList.add('hidden');
}

async function openCompanyStatsModal() {
  companyStatsModal.classList.remove('hidden');
  try {
    const startDate = filterStartDateInput.value;
    const endDate = filterEndDateInput.value;

    let url = '/api/stats/companies?';
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load company stats');
    const stats = await response.json();

    const tbody = document.getElementById('companyStatsBody');
    if (stats.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading">No data available</td></tr>';
      return;
    }

    tbody.innerHTML = stats.map(stat => `
      <tr>
        <td>${stat.company}</td>
        <td>${stat.delivery_count}</td>
        <td>${stat.total_delivered || 0}</td>
        <td>${stat.total_returned || 0}</td>
      </tr>
    `).join('');
  } catch (err) {
    showMessage('Error loading company stats: ' + err.message, 'error');
  }
}

async function exportToCSV() {
  try {
    const company = filterCompanySelect.value;
    const startDate = filterStartDateInput.value;
    const endDate = filterEndDateInput.value;

    let url = '/api/deliveries/export/csv?';
    if (company) url += `company=${encodeURIComponent(company)}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    window.location.href = url;
    showMessage('CSV exported successfully!', 'success');
  } catch (err) {
    showMessage('Error exporting CSV: ' + err.message, 'error');
  }
}

function printRecords() {
  const printWindow = window.open('', '', 'height=600,width=800');
  const table = document.getElementById('deliveriesTable').outerHTML;
  const stats = `
    <h2>Delivery Summary</h2>
    <p><strong>Total Deliveries:</strong> ${document.getElementById('totalDeliveries').textContent}</p>
    <p><strong>Bottles Delivered:</strong> ${document.getElementById('totalDelivered').textContent}</p>
    <p><strong>Bottles Returned:</strong> ${document.getElementById('totalReturned').textContent}</p>
    <p><strong>Net Bottles:</strong> ${document.getElementById('netBottles').textContent}</p>
  `;

  const filters = `
    <h3>Filters Applied:</h3>
    <p>${filterCompanySelect.value ? 'Company: ' + filterCompanySelect.value + '<br>' : ''}
       ${filterStartDateInput.value ? 'From: ' + filterStartDateInput.value + '<br>' : ''}
       ${filterEndDateInput.value ? 'To: ' + filterEndDateInput.value : ''}</p>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Eau Cure - Delivery Records</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { color: #667eea; margin-top: 20px; }
        h3 { color: #764ba2; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #667eea; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        p { line-height: 1.6; }
        .print-date { color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Eau Cure - Water Station Delivery Tracker</h1>
      <p class="print-date">Printed: ${new Date().toLocaleString()}</p>
      ${stats}
      ${filterCompanySelect.value || filterStartDateInput.value || filterEndDateInput.value ? filters : ''}
      ${table}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('eauCureSettings') || '{}');
  settingsDefaultCompany.value = settings.defaultCompany || '';
  settingsRowsPerPage.value = settings.rowsPerPage || '10';
  settingsAutoRefresh.checked = settings.autoRefresh || false;
  settingsDarkMode.checked = settings.darkMode || false;
}

function openSettingsModal() {
  loadSettings();
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

function toggleDarkMode() {
  const isDarkMode = settingsDarkMode.checked;
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  // Re-render chart with new theme colors
  renderDeliveryChart();
}

function saveSettings() {
  const settings = {
    defaultCompany: settingsDefaultCompany.value,
    rowsPerPage: settingsRowsPerPage.value,
    autoRefresh: settingsAutoRefresh.checked,
    darkMode: settingsDarkMode.checked
  };

  localStorage.setItem('eauCureSettings', JSON.stringify(settings));

  if (settings.defaultCompany) {
    filterCompanySelect.value = settings.defaultCompany;
    applyFilters();
  }

  toggleDarkMode();

  Swal.fire('Saved!', 'Settings saved successfully.', 'success');
  closeSettingsModal();
}

function openBillingModal() {
  billingModal.classList.remove('hidden');
  // Set default dates to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  billingStartDateInput.value = firstDay.toISOString().split('T')[0];
  billingEndDateInput.value = lastDay.toISOString().split('T')[0];
  // Populate company dropdown
  billingCompanySelect.innerHTML = '<option value="">-- Select a Company --</option>';
  companies.forEach(company => {
    billingCompanySelect.innerHTML += `<option value="${company}">${company}</option>`;
  });
}

function closeBillingModal() {
  billingModal.classList.add('hidden');
  billingContent.innerHTML = '';
  printBillingBtn.style.display = 'none';
  downloadBillingPdfBtn.style.display = 'none';
}

async function generateBillingStatement() {
  const company = billingCompanySelect.value;
  const startDate = billingStartDateInput.value;
  const endDate = billingEndDateInput.value;

  if (!company || !startDate || !endDate) {
    showMessage('Please select a company and date range', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/billing/${encodeURIComponent(company)}?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) throw new Error('Failed to fetch billing statement');
    const data = await response.json();

    renderBillingStatement(data);
    printBillingBtn.style.display = 'inline-block';
    downloadBillingPdfBtn.style.display = 'inline-block';
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

function renderBillingStatement(data) {
  const { company, unitPrice, deliveries, startDate, endDate } = data;

  const price = parseFloat(unitPrice) || 0;

  // Store data for saving later
  currentBillingStatementData = { company, startDate, endDate, totalAmount: 0 };

  let html = `<h3 style="text-align: center; margin-bottom: 20px;">Billing Statement</h3>`;
  html += `<div style="font-size: 13px; margin-bottom: 15px;">`;
  html += `<p><strong>Company:</strong> ${company}</p>`;
  html += `<p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>`;
  html += `<p><strong>Unit Price:</strong> ₱${price.toFixed(2)} per bottle</p>`;
  html += `</div>`;

  if (deliveries.length === 0) {
    html += `<p style="text-align: center; color: #999;">No deliveries found for this period</p>`;
    billingContent.innerHTML = html;
    return;
  }

  html += `<table class="billing-table">`;
  html += `<thead><tr>`;
  html += `<th>Date</th><th>DR Number</th><th>Particulars</th><th>Quantity</th><th>Unit Price</th><th>Amount</th>`;
  html += `</tr></thead><tbody>`;

  let totalQuantity = 0, totalAmount = 0;

  deliveries.forEach(delivery => {
    const date = new Date(delivery.timestamp).toLocaleDateString();
    const quantity = parseInt(delivery.bottles_delivered) || 0;
    const amount = quantity * price;

    totalQuantity += quantity;
    totalAmount += amount;

    html += `<tr>`;
    html += `<td>${date}</td>`;
    html += `<td>${delivery.dr_number}</td>`;
    html += `<td>5 gal round</td>`;
    html += `<td>${quantity}</td>`;
    html += `<td>₱${price.toFixed(2)}</td>`;
    html += `<td>₱${amount.toFixed(2)}</td>`;
    html += `</tr>`;
  });

  html += `</tbody></table>`;

  html += `<div class="billing-summary">`;
  html += `<div class="billing-summary-row"><span>Total Quantity:</span><span style="color: #dc3545; font-weight: 600;">${totalQuantity} bottles</span></div>`;
  html += `<div class="billing-summary-row"><span>Unit Price:</span><span style="color: #dc3545; font-weight: 600;">₱${price.toFixed(2)}</span></div>`;
  html += `<div class="billing-summary-row total"><span style="color: #dc3545;">TOTAL AMOUNT DUE:</span><span style="color: #dc3545;">₱${totalAmount.toFixed(2)}</span></div>`;
  html += `</div>`;

  billingContent.innerHTML = html;

  // Store total amount for saving
  currentBillingStatementData.totalAmount = totalAmount;
  saveBillingBtn.style.display = 'inline-block';
}

function printBillingStatement() {
  window.print();
}

function downloadBillingPdf() {
  const company = billingCompanySelect.value;
  const startDate = billingStartDateInput.value;
  const endDate = billingEndDateInput.value;

  // Extract data from the current billing statement
  const titleEl = billingContent.querySelector('h3');
  const infoEls = billingContent.querySelectorAll('div > p');
  const tableEl = billingContent.querySelector('table');
  const summaryEl = billingContent.querySelector('.billing-summary');

  let infoHtml = '';
  infoEls.forEach(el => {
    infoHtml += `<p>${el.textContent}</p>`;
  });

  let tableHtml = tableEl.outerHTML;
  let summaryHtml = '';

  if (summaryEl) {
    summaryEl.querySelectorAll('.billing-summary-row').forEach((row, idx) => {
      const isTotal = row.classList.contains('total');
      const rowText = row.textContent;
      const [label, value] = rowText.split(/(?<=:)\s*/);

      if (isTotal) {
        summaryHtml += `<div style="font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 15px; padding: 10px 0; display: flex; justify-content: space-between;">
          <span>${label}</span>
          <span style="color: #dc3545;">${value}</span>
        </div>`;
      } else {
        const isColored = label.includes('Total Quantity') || label.includes('Unit Price');
        summaryHtml += `<div style="padding: 10px 0; display: flex; justify-content: space-between;">
          <span>${label}</span>
          <span style="${isColored ? 'color: #dc3545; font-weight: 600;' : 'color: #000;'}">${value}</span>
        </div>`;
      }
    });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Billing Statement - ${company}</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px 20px; color: #000; }
        h3 { text-align: center; margin-bottom: 30px; font-size: 24px; color: #dc3545; font-weight: bold; }
        .info { margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
        .info p { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        th { background: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; color: #000; }
        td { border: 1px solid #000; padding: 8px; color: #000; }
        .billing-summary { margin-top: 20px; }
        .billing-summary > div { padding: 10px 0; display: flex; justify-content: space-between; font-size: 13px; }
        .billing-summary > div:last-child { border-top: 2px solid #000; padding-top: 15px; font-weight: bold; font-size: 14px; }
        .billing-summary > div:last-child span:last-child { color: #dc3545; font-size: 16px; }
        @media print {
          body { padding: 20px; }
          h3 { page-break-after: avoid; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h3>BILLING STATEMENT</h3>
      <div class="info">
        ${infoHtml}
      </div>
      ${tableHtml}
      <div class="billing-summary">
        ${summaryHtml}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billing_${company}_${startDate}_${endDate}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function openAddCompanyModal() {
  addCompanyModal.classList.remove('hidden');
  addCompanyForm.reset();
  addCompanyMessage.innerHTML = '';
}

function closeAddCompanyModal() {
  addCompanyModal.classList.add('hidden');
  addCompanyForm.reset();
  addCompanyMessage.innerHTML = '';
}

async function submitAddCompany() {
  const name = document.getElementById('newCompanyName').value.trim();
  const price = document.getElementById('newCompanyPrice').value.trim();

  if (!name || !price) {
    addCompanyMessage.innerHTML = '<span style="color: #dc3545;">Please enter both name and price</span>';
    return;
  }

  try {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, unitPrice: parseFloat(price) })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add company');
    }

    const result = await response.json();
    addCompanyMessage.innerHTML = `<span style="color: #28a745;">${result.message}</span>`;

    await fetchCompanies();
    setTimeout(() => closeAddCompanyModal(), 1000);
  } catch (err) {
    addCompanyMessage.innerHTML = `<span style="color: #dc3545;">Error: ${err.message}</span>`;
  }
}

function openDailyReportModal() {
  dailyReportModal.classList.remove('hidden');
  reportDateInput.value = new Date().toISOString().split('T')[0];
  dailyReportContent.innerHTML = '';
  printDailyReportBtn.style.display = 'none';
  downloadDailyReportBtn.style.display = 'none';
}

function closeDailyReportModal() {
  dailyReportModal.classList.add('hidden');
  dailyReportContent.innerHTML = '';
  printDailyReportBtn.style.display = 'none';
  downloadDailyReportBtn.style.display = 'none';
}

async function generateDailyReport() {
  const date = reportDateInput.value;
  if (!date) {
    showMessage('Please select a date', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/deliveries?startDate=${date}&endDate=${date}`);
    if (!response.ok) throw new Error('Failed to fetch daily deliveries');
    const deliveries = await response.json();

    renderDailyReport(date, deliveries);
    printDailyReportBtn.style.display = 'inline-block';
    downloadDailyReportBtn.style.display = 'inline-block';
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

function renderDailyReport(date, allDeliveries) {
  const reportDate = new Date(date);
  const dateFormatted = reportDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const companiesData = {};
  let totalDelivered = 0;
  let totalReturned = 0;

  allDeliveries.forEach(delivery => {
    if (!companiesData[delivery.company]) {
      companiesData[delivery.company] = { delivered: 0, returned: 0 };
    }
    companiesData[delivery.company].delivered += delivery.bottles_delivered;
    companiesData[delivery.company].returned += delivery.bottles_returned;
    totalDelivered += delivery.bottles_delivered;
    totalReturned += delivery.bottles_returned;
  });

  const companies = Object.keys(companiesData).sort();

  let html = `<h3 style="text-align: center; margin-bottom: 20px; color: #dc3545;">DAILY DELIVERY REPORT</h3>`;
  html += `<div style="font-size: 13px; margin-bottom: 15px;">`;
  html += `<p><strong>Date:</strong> ${dateFormatted}</p>`;
  html += `<p><strong>Total Companies:</strong> ${companies.length}</p>`;
  html += `</div>`;

  if (companies.length === 0) {
    html += `<p style="text-align: center; color: #999;">No deliveries found for this date</p>`;
    dailyReportContent.innerHTML = html;
    return;
  }

  html += `<table class="daily-report-table">`;
  html += `<thead><tr>`;
  html += `<th>Company</th><th>Delivered</th><th>Returned</th>`;
  html += `</tr></thead><tbody>`;

  companies.forEach(company => {
    const data = companiesData[company];
    html += `<tr>`;
    html += `<td>${company}</td>`;
    html += `<td style="color: #dc3545; font-weight: 600;">${data.delivered}</td>`;
    html += `<td>${data.returned}</td>`;
    html += `</tr>`;
  });

  html += `</tbody></table>`;

  html += `<div class="daily-report-summary">`;
  html += `<div class="daily-report-summary-row"><span>Total Delivered:</span><span style="color: #dc3545; font-weight: 600;">${totalDelivered}</span></div>`;
  html += `<div class="daily-report-summary-row"><span>Total Returned:</span><span>${totalReturned}</span></div>`;
  html += `<div class="daily-report-summary-row total"><span>Total Companies:</span><span>${companies.length}</span></div>`;
  html += `</div>`;

  dailyReportContent.innerHTML = html;
}

function printDailyReport() {
  window.print();
}

function downloadDailyReport() {
  const date = reportDateInput.value;
  const reportDate = new Date(date);
  const dateFormatted = reportDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const content = dailyReportContent.innerHTML;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Daily Report - ${date}</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px 20px; color: #000; }
        h3 { text-align: center; margin-bottom: 30px; font-size: 24px; color: #dc3545; font-weight: bold; }
        .info { margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
        .info p { margin-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        th { background: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; color: #000; }
        td { border: 1px solid #000; padding: 8px; color: #000; }
        .daily-report-summary { margin-top: 20px; }
        .daily-report-summary > div { padding: 10px 0; display: flex; justify-content: space-between; font-size: 13px; }
        .daily-report-summary > div.total { border-top: 2px solid #000; padding-top: 15px; font-weight: bold; font-size: 14px; color: #dc3545; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daily_report_${date}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
}

let currentBillingStatementData = null;

async function saveBillingStatement() {
  if (!currentBillingStatementData) {
    showMessage('No billing statement to save', 'error');
    return;
  }

  try {
    const response = await fetch('/api/billing-statements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: currentBillingStatementData.company,
        startDate: currentBillingStatementData.startDate,
        endDate: currentBillingStatementData.endDate,
        totalAmount: currentBillingStatementData.totalAmount
      })
    });

    if (!response.ok) throw new Error('Failed to save billing statement');
    const result = await response.json();
    showMessage('Billing statement saved successfully!', 'success');
    saveBillingBtn.style.display = 'none';
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

function openBillingHistoryModal() {
  billingHistoryModal.classList.remove('hidden');
  loadBillingHistory();
}

function closeBillingHistoryModal() {
  billingHistoryModal.classList.add('hidden');
}

async function loadBillingHistory() {
  try {
    const response = await fetch('/api/billing-statements');
    if (!response.ok) throw new Error('Failed to load billing history');
    const statements = await response.json();

    if (statements.length === 0) {
      billingHistoryContent.innerHTML = '<p style="text-align: center; color: #999;">No billing statements saved yet</p>';
      return;
    }

    let html = '<table class="billing-history-table"><thead><tr>';
    html += '<th>Company</th><th>Period</th><th>Amount</th><th>Status</th><th>Action</th>';
    html += '</tr></thead><tbody>';

    statements.forEach(stmt => {
      const startDate = new Date(stmt.start_date).toLocaleDateString();
      const endDate = new Date(stmt.end_date).toLocaleDateString();
      const statusClass = stmt.is_paid ? 'status-paid' : 'status-unpaid';
      const statusText = stmt.is_paid ? 'PAID' : 'UNPAID';

      html += '<tr>';
      html += `<td>${stmt.company_name}</td>`;
      html += `<td>${startDate} - ${endDate}</td>`;
      html += `<td>₱${parseFloat(stmt.total_amount).toFixed(2)}</td>`;
      html += `<td><span class="status-badge ${statusClass}" onclick="togglePaidStatus(${stmt.id}, ${stmt.is_paid})">${statusText}</span></td>`;
      html += `<td><button class="btn btn-sm" onclick="deleteBillingStatement(${stmt.id})">Delete</button></td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    billingHistoryContent.innerHTML = html;
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

async function togglePaidStatus(id, currentStatus) {
  try {
    const response = await fetch(`/api/billing-statements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaid: !currentStatus })
    });

    if (!response.ok) throw new Error('Failed to update status');
    showMessage('Status updated successfully!', 'success');

    // Update both modal and page view
    loadBillingHistory();
    showBillingPage();
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

async function deleteBillingStatement(id) {
  if (!confirm('Are you sure you want to delete this billing statement?')) {
    return;
  }

  try {
    const response = await fetch(`/api/billing-statements/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete statement');
    showMessage('Billing statement deleted!', 'success');

    // Update both modal and page view
    loadBillingHistory();
    showBillingPage();
  } catch (err) {
    showMessage('Error: ' + err.message, 'error');
  }
}

function switchPage(pageName) {
  event.preventDefault();

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.classList.add('active');

  // Close any open modals
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });

  // Show/hide sections based on page
  const mainContent = document.querySelector('.main-content');
  const dashboardSection = document.getElementById('dashboardSection');
  const filterSection = document.querySelector('.filter-section');
  const calendarSection = document.querySelector('.calendar-section');
  const formSection = document.querySelector('.form-section');
  const tableSection = document.querySelector('.table-section');

  // Reset all sections first
  if (dashboardSection) dashboardSection.style.display = 'none';
  if (filterSection) filterSection.style.display = 'none';
  if (calendarSection) calendarSection.style.display = 'none';
  if (formSection) formSection.style.display = 'none';
  if (tableSection) tableSection.style.display = 'none';

  // Update main-content layout
  if (mainContent) {
    mainContent.classList.remove('deliveries-layout');
  }

  // DASHBOARD: Only stats
  if (pageName === 'dashboard') {
    if (dashboardSection) dashboardSection.style.display = 'block';
  }

  // DELIVERIES: Calendar + Form (NO FILTERS, NO TABLE)
  if (pageName === 'deliveries') {
    if (mainContent) mainContent.classList.add('deliveries-layout');
    if (filterSection) filterSection.style.display = 'none';
    if (calendarSection) calendarSection.style.display = 'block';
    if (formSection) {
      formSection.style.display = 'block';
      // Restore delivery form if it was overwritten
      restoreDeliveryForm();
    }
  }

  // RECORDS: Just the table with export/print buttons
  if (pageName === 'records') {
    if (filterSection) filterSection.style.display = 'block';
    if (tableSection) tableSection.style.display = 'block';
  }

  // COMPANIES: Company list
  if (pageName === 'companies') {
    if (formSection) formSection.style.display = 'block';
    showCompanyList();
  }

  // BILLING: Show billing history directly (no modal)
  if (pageName === 'billing') {
    if (formSection) formSection.style.display = 'block';
    showBillingPage();
  }

  // SETTINGS: Show settings page
  if (pageName === 'settings') {
    const settingsPage = document.getElementById('settingsPage');
    if (settingsPage) {
      settingsPage.style.display = 'block';
      loadSettings();
    }
  } else {
    const settingsPage = document.getElementById('settingsPage');
    if (settingsPage) settingsPage.style.display = 'none';
  }

  console.log('Switched to page:', pageName);
}

async function showBillingPage() {
  try {
    const response = await fetch('/api/billing-statements');
    if (!response.ok) throw new Error('Failed to load billing history');
    const statements = await response.json();

    let html = '<h2>📄 Billing Statements</h2>';
    html += '<div style="margin-bottom: 20px;">';
    html += '<button type="button" class="btn btn-billing" onclick="openBillingModal()">➕ Create New Billing Statement</button>';
    html += '</div>';

    if (statements.length === 0) {
      html += '<p style="text-align: center; color: #999;">No billing statements yet. Create one to get started!</p>';
    } else {
      html += '<table style="width: 100%; border-collapse: collapse;">';
      html += '<thead><tr style="background: #f0f0f0;"><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Company</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Period</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Amount</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Status</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Action</th></tr></thead>';
      html += '<tbody>';

      statements.forEach(stmt => {
        const startDate = new Date(stmt.start_date).toLocaleDateString();
        const endDate = new Date(stmt.end_date).toLocaleDateString();
        const statusClass = stmt.is_paid ? 'status-paid' : 'status-unpaid';
        const statusText = stmt.is_paid ? 'PAID' : 'UNPAID';

        html += '<tr style="border: 1px solid #ddd;">';
        html += `<td style="padding: 12px; border: 1px solid #ddd;">${stmt.company_name}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;">${startDate} - ${endDate}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;">₱${parseFloat(stmt.total_amount).toFixed(2)}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;"><span class="status-badge ${statusClass}" onclick="togglePaidStatus(${stmt.id}, ${stmt.is_paid})" style="cursor: pointer;">${statusText}</span></td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;"><button class="btn btn-sm" onclick="deleteBillingStatement(${stmt.id})">Delete</button></td>`;
        html += '</tr>';
      });

      html += '</tbody></table>';
    }

    const formSection = document.querySelector('.form-section');
    if (formSection) {
      formSection.innerHTML = html;
    }
  } catch (err) {
    console.error('Error loading billing page:', err);
  }
}

async function showCompanyList() {
  try {
    const response = await fetch('/api/companies/all');
    if (!response.ok) throw new Error('Failed to load companies');
    const companies = await response.json();

    let html = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">';
    html += '<h2 style="margin: 0;">👥 Companies</h2>';
    html += '<button type="button" class="btn btn-add-company" onclick="openAddCompanyModal()">➕ Add Company</button>';
    html += '</div>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f0f0f0;"><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Company Name</th><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Unit Price (₱)</th></tr></thead>';
    html += '<tbody>';

    companies.forEach(company => {
      html += `<tr style="border: 1px solid #ddd;"><td style="padding: 12px; border: 1px solid #ddd;">${company.name}</td><td style="padding: 12px; border: 1px solid #ddd;">₱${parseFloat(company.unit_price).toFixed(2)}</td></tr>`;
    });

    html += '</tbody></table>';

    // Replace form section with company list
    const formSection = document.querySelector('.form-section');
    if (formSection) {
      formSection.innerHTML = html.substring(html.indexOf('<div'));
    }
  } catch (err) {
    console.error('Error loading companies:', err);
  }
}

function switchDashboardTab(tabName) {
  // Update active tab
  document.querySelectorAll('.dashboard-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');

  // Show/hide content based on tab
  console.log('Switched to tab:', tabName);
}

function restoreDeliveryForm() {
  const formSection = document.querySelector('.form-section');
  if (!formSection) return;

  // Check if it's showing company list (has table content)
  if (formSection.innerHTML.includes('Company Name') && formSection.innerHTML.includes('Unit Price')) {
    // Re-render the delivery form
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    formSection.innerHTML = `
      <h2>📝 New Delivery Entry</h2>
      <div class="date-picker-section">
        <span class="form-selected-date">Adding for: <strong id="formDateDisplay">Today</strong></span>
        <input type="time" id="deliveryTime" value="09:00" required style="display: none;">
      </div>

      <form id="deliveryForm">
        <div class="form-group">
          <label for="company">Company Delivered:</label>
          <select id="company" name="company" required>
            <option value="">-- Select a Company --</option>
          </select>
        </div>

        <div class="form-group">
          <label for="bottlesDelivered">Number of Bottles Delivered:</label>
          <input type="number" id="bottlesDelivered" name="bottlesDelivered" min="0" required>
        </div>

        <div class="form-group">
          <label for="bottlesReturned">Number of Bottles Returned:</label>
          <input type="number" id="bottlesReturned" name="bottlesReturned" min="0" required>
        </div>

        <div class="form-group">
          <label for="drNumber">DR Number:</label>
          <input type="text" id="drNumber" name="drNumber" required>
        </div>

        <button type="submit" class="btn btn-submit">Add Delivery</button>
      </form>
      <div id="formMessage" class="form-message"></div>
    `;

    // Re-attach event listeners
    const deliveryForm = document.getElementById('deliveryForm');
    const companySelect = document.getElementById('company');

    if (deliveryForm) {
      deliveryForm.removeEventListener('submit', handleFormSubmit);
      deliveryForm.addEventListener('submit', handleFormSubmit);
    }

    if (companySelect) {
      companySelect.innerHTML = '<option value="">-- Select a Company --</option>';
      companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companySelect.appendChild(option);
      });
    }

    // Update form date display
    const formDateDisplay = document.getElementById('formDateDisplay');
    if (formDateDisplay) {
      const selectedDate = new Date(selectedDateForDeliveries);
      formDateDisplay.textContent = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  }
}

// Initialize page to show dashboard by default
function initPage() {
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.remove('deliveries-layout');
  }

  const dashboardSection = document.getElementById('dashboardSection');
  const filterSection = document.querySelector('.filter-section');
  const calendarSection = document.querySelector('.calendar-section');
  const formSection = document.querySelector('.form-section');
  const tableSection = document.querySelector('.table-section');

  if (dashboardSection) dashboardSection.style.display = 'block';
  if (filterSection) filterSection.style.display = 'none';
  if (calendarSection) calendarSection.style.display = 'none';
  if (formSection) formSection.style.display = 'none';
  if (tableSection) tableSection.style.display = 'none';
}

// Load dark mode preference on startup
const savedSettings = JSON.parse(localStorage.getItem('eauCureSettings') || '{}');
if (savedSettings.darkMode) {
  document.body.classList.add('dark-mode');
  if (settingsDarkMode) settingsDarkMode.checked = true;
}

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

initPage();
selectDateFromCalendar(todayStr);

fetchCompanies();
fetchDeliveries();
