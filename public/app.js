const deliveryForm = document.getElementById('deliveryForm');
const tableBody = document.getElementById('tableBody');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');

let allDeliveries = [];

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function loadDeliveries() {
  try {
    const response = await fetch('/api/deliveries');
    if (!response.ok) throw new Error('Failed to load deliveries');
    allDeliveries = await response.json();
    renderTable();
  } catch (error) {
    console.error('Error loading deliveries:', error);
    tableBody.innerHTML = '<tr class="error-state"><td colspan="6">Error loading data</td></tr>';
  }
}

function renderTable() {
  if (allDeliveries.length === 0) {
    tableBody.innerHTML = '<tr class="empty-state"><td colspan="6">No deliveries recorded yet</td></tr>';
    return;
  }

  tableBody.innerHTML = allDeliveries.map(delivery => `
    <tr>
      <td>${escapeHtml(delivery.company)}</td>
      <td>${delivery.bottles_delivered}</td>
      <td>${delivery.bottles_returned}</td>
      <td>${escapeHtml(delivery.dr_number)}</td>
      <td>${formatDate(delivery.timestamp)}</td>
      <td class="actions">
        <button class="btn btn-sm btn-edit" onclick="openEditModal(${delivery.id}, '${escapeHtml(delivery.company)}', ${delivery.bottles_delivered}, ${delivery.bottles_returned}, '${escapeHtml(delivery.dr_number)}')">Edit</button>
        <button class="btn btn-sm btn-delete" onclick="deleteDelivery(${delivery.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openEditModal(id, company, bottlesDelivered, bottlesReturned, drNumber) {
  document.getElementById('editId').value = id;
  document.getElementById('editCompany').value = company;
  document.getElementById('editBottlesDelivered').value = bottlesDelivered;
  document.getElementById('editBottlesReturned').value = bottlesReturned;
  document.getElementById('editDrNumber').value = drNumber;
  editModal.style.display = 'block';
}

function closeEditModal() {
  editModal.style.display = 'none';
}

async function addDelivery(e) {
  e.preventDefault();

  const company = document.getElementById('company').value.trim();
  const bottlesDelivered = parseInt(document.getElementById('bottlesDelivered').value);
  const bottlesReturned = parseInt(document.getElementById('bottlesReturned').value);
  const drNumber = document.getElementById('drNumber').value.trim();

  if (!company || isNaN(bottlesDelivered) || isNaN(bottlesReturned) || !drNumber) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company,
        bottlesDelivered,
        bottlesReturned,
        drNumber
      })
    });

    if (!response.ok) throw new Error('Failed to add delivery');

    deliveryForm.reset();
    await loadDeliveries();
  } catch (error) {
    console.error('Error adding delivery:', error);
    alert('Error adding delivery');
  }
}

async function updateDelivery(e) {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const company = document.getElementById('editCompany').value.trim();
  const bottlesDelivered = parseInt(document.getElementById('editBottlesDelivered').value);
  const bottlesReturned = parseInt(document.getElementById('editBottlesReturned').value);
  const drNumber = document.getElementById('editDrNumber').value.trim();

  if (!company || isNaN(bottlesDelivered) || isNaN(bottlesReturned) || !drNumber) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company,
        bottlesDelivered,
        bottlesReturned,
        drNumber
      })
    });

    if (!response.ok) throw new Error('Failed to update delivery');

    closeEditModal();
    await loadDeliveries();
  } catch (error) {
    console.error('Error updating delivery:', error);
    alert('Error updating delivery');
  }
}

async function deleteDelivery(id) {
  if (!confirm('Are you sure you want to delete this delivery record?')) {
    return;
  }

  try {
    const response = await fetch(`/api/deliveries/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete delivery');

    await loadDeliveries();
  } catch (error) {
    console.error('Error deleting delivery:', error);
    alert('Error deleting delivery');
  }
}

deliveryForm.addEventListener('submit', addDelivery);
editForm.addEventListener('submit', updateDelivery);
closeBtn.addEventListener('click', closeEditModal);
cancelBtn.addEventListener('click', closeEditModal);

window.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

loadDeliveries();
