# Invoice Number Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional invoice number field to billing statements, allow inline editing with visual feedback, and filter billings by invoice assignment status.

**Architecture:** 
1. Database: Add nullable `invoice_number` column to track manager-assigned invoice numbers
2. API: New PUT endpoint to update invoice numbers per billing record
3. Frontend: Render new table column, implement inline edit mode with Save/Cancel/Escape handlers, add visual feedback (checkmark animation), and dual filtering (paid/unpaid + invoice status)
4. Styling: Add CSS for edit state, placeholder text, and success animation

**Tech Stack:** 
- SQLite (database)
- Express.js (backend API)
- Vanilla JavaScript (frontend, no frameworks)
- CSS3 (animations)

## Global Constraints

- Invoice numbers are free-text input (no format validation)
- Field is optional (nullable in database, starts empty for all new billings)
- Filter must work independently of paid/unpaid status (allow combining both)
- Inline edit: Enter/blur saves, Escape cancels, checkmark feedback on success
- No breaking changes to existing API endpoints or database structure
- Must maintain compatibility with existing billing export (PDF/Excel) functionality

---

## Database Schema

### Task 1: Add invoice_number Column to billing_statements Table

**Files:**
- Modify: `database.js` — initBillingStatementsTable() function

**Interfaces:**
- Consumes: None (standalone database initialization)
- Produces: `billing_statements` table with new `invoice_number TEXT DEFAULT NULL` column

- [ ] **Step 1: Locate the initBillingStatementsTable() function**

Open `database.js` and find the `initBillingStatementsTable()` function around line 66. It currently creates the billing_statements table with these columns:
- id, company_name, start_date, end_date, total_amount, is_paid, created_date, paid_date

- [ ] **Step 2: Update CREATE TABLE statement**

Modify the `CREATE TABLE IF NOT EXISTS billing_statements` to add the invoice_number column:

```javascript
function initBillingStatementsTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS billing_statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        is_paid INTEGER DEFAULT 0,
        invoice_number TEXT DEFAULT NULL,
        created_date TEXT DEFAULT CURRENT_TIMESTAMP,
        paid_date TEXT
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
```

**Why this placement:** `invoice_number` column goes after `is_paid` (since it's related to payment tracking) and before `created_date` (system timestamps last).

- [ ] **Step 3: Verify the change by checking the CREATE TABLE statement**

Look at the modified function to ensure it has the new column in the correct position.

- [ ] **Step 4: Commit database schema change**

```bash
git add database.js
git commit -m "feat: add invoice_number column to billing_statements table"
```

---

## API Backend

### Task 2: Implement PUT Endpoint for Invoice Number

**Files:**
- Modify: `server.js` — Add new route handler

**Interfaces:**
- Consumes: Express app instance with existing auth middleware, billing data from database
- Produces: `PUT /api/billing-statements/:id/invoice-number` endpoint
  - Request: `{ "invoiceNumber": "string or empty" }`
  - Response: `{ id, company_name, start_date, end_date, total_amount, is_paid, invoice_number, ... }` (200)
  - Error: `{ "error": "message" }` (400/500)

- [ ] **Step 1: Locate existing billing endpoints in server.js**

Open `server.js` and search for the existing billing endpoints. Look for:
- `GET /api/billing-statements`
- `POST /api/billing-statements`
- `PUT /api/billing-statements/:id` (if it exists, for toggling paid status)

These will be your reference for auth patterns and response format.

- [ ] **Step 2: Add the new PUT endpoint for invoice number**

Insert this route **after** the existing billing endpoints (around line 500-700 depending on file size):

```javascript
// Update invoice number for a billing statement
app.put('/api/billing-statements/:id/invoice-number', (req, res) => {
  const { invoiceNumber } = req.body;
  const billingId = req.params.id;

  // Validate input
  if (invoiceNumber === undefined || invoiceNumber === null) {
    return res.status(400).json({ error: 'invoiceNumber is required' });
  }

  // Allow empty string to clear invoice number
  const invoiceValue = invoiceNumber.trim() === '' ? null : invoiceNumber.trim();

  db.run(
    `UPDATE billing_statements SET invoice_number = ? WHERE id = ?`,
    [invoiceValue, billingId],
    function(err) {
      if (err) {
        console.error('Error updating invoice number:', err);
        return res.status(500).json({ error: 'Failed to update invoice number' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Billing statement not found' });
      }

      // Fetch and return updated record
      db.get(
        `SELECT * FROM billing_statements WHERE id = ?`,
        [billingId],
        (err, row) => {
          if (err) {
            console.error('Error fetching updated billing:', err);
            return res.status(500).json({ error: 'Failed to fetch updated record' });
          }

          res.json(row);
        }
      );
    }
  );
});
```

**Why this approach:**
- Uses parameterized queries to prevent SQL injection
- Allows empty string input to clear the invoice number (sets to NULL)
- Returns the updated billing record so frontend can refresh without another GET call
- Follows existing error handling patterns in the codebase

- [ ] **Step 3: Test the endpoint manually (optional but recommended)**

After adding the route, test it with curl or Postman:

```bash
curl -X PUT http://localhost:3000/api/billing-statements/1/invoice-number \
  -H "Content-Type: application/json" \
  -d '{"invoiceNumber": "INV-2026-0847"}'
```

Expected response: Updated billing record with invoice_number field populated.

- [ ] **Step 4: Commit API endpoint**

```bash
git add server.js
git commit -m "feat: add PUT endpoint for updating invoice number"
```

---

## Frontend - Display & Filtering

### Task 3: Update renderBillings() to Include Invoice # Column

**Files:**
- Modify: `public/app.js` — renderBillings() function (currently around line 497)

**Interfaces:**
- Consumes: `billings` array with objects `{ id, company_name, start_date, end_date, total_amount, is_paid, invoice_number, ... }`
- Produces: Rendered table with 8 columns including new "Invoice #" column between "Amount" and "Status"

- [ ] **Step 1: Locate renderBillings() function**

Open `public/app.js` and find `function renderBillings(billings)` around line 497.

- [ ] **Step 2: Update the table HTML template**

Replace the current `tbody.innerHTML` map with the updated template that includes the invoice # column:

```javascript
function renderBillings(billings) {
  const tbody = document.getElementById('billingBody');

  if (billings.length === 0) {
    tbody.innerHTML = '<tr class="empty-state"><td colspan="8">No billing statements yet</td></tr>';
    return;
  }

  tbody.innerHTML = billings.map(bill => `
    <tr>
      <td>${bill.company_name || bill.company || 'Unknown'}</td>
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
```

**Key changes:**
- Added `colspan="8"` to empty state (was 7, now 8 columns)
- Added new `<td class="invoice-number-cell">` with data attributes for edit mode
- Uses `bill.invoice_number` — conditionally shows value or placeholder text
- Calls `setupInvoiceNumberEdit()` at the end to attach click handlers (Task 6)

- [ ] **Step 3: Update table header**

Find the `<thead>` section in `public/index.html` or in the JavaScript that generates it. Add a new `<th>` for "Invoice #":

**In index.html, find the billing table header (search for `<table` and `billingBody`):**

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Company</th>
      <th>Date Range</th>
      <th>Amount</th>
      <th>Invoice #</th>
      <th>Status</th>
      <th colspan="2">Actions</th>
    </tr>
  </thead>
  <tbody id="billingBody"></tbody>
</table>
```

If the table header is generated dynamically in JavaScript, add the header update to the appropriate function.

- [ ] **Step 4: Verify the column count**

Make sure the table now has 8 columns (was 7):
1. Company
2. Date Range
3. Amount
4. **Invoice #** (NEW)
5. Status
6. Actions (Export)
7. Actions (Toggle/Delete)

Plus the empty state colspan should be `8`.

- [ ] **Step 5: Commit**

```bash
git add public/app.js public/index.html
git commit -m "feat: add invoice number column to billing table"
```

---

### Task 4: Add Invoice Status Filter Dropdown

**Files:**
- Modify: `public/app.js` — Add filter state variable and filtering logic
- Modify: `public/index.html` — Add filter dropdown HTML

**Interfaces:**
- Consumes: `billings` array with `invoice_number` field
- Produces: Filter dropdown with options "All", "Pending Invoice", "Has Invoice"
  - Global variable: `let invoiceStatusFilter = 'all'` (default)
  - Function: `filterBillingsByStatus()` that applies both paid/unpaid and invoice status filters

- [ ] **Step 1: Add filter state variable to app.js**

At the top of `public/app.js`, add a global variable for the invoice status filter (near any existing filter variables):

```javascript
let invoiceStatusFilter = 'all'; // 'all', 'pending', 'has'
```

- [ ] **Step 2: Create filter dropdown HTML in index.html**

Find the section where filters are displayed (look for paid/unpaid filter). Add the invoice status filter dropdown:

```html
<div class="filter-group">
  <label for="invoiceStatusFilter">Invoice Status:</label>
  <select id="invoiceStatusFilter" onchange="handleInvoiceStatusFilterChange(this.value)">
    <option value="all">All</option>
    <option value="pending">Pending Invoice</option>
    <option value="has">Has Invoice</option>
  </select>
</div>
```

**Placement:** Below the existing paid/unpaid filter, so filters are stacked vertically.

- [ ] **Step 3: Add filter change handler in app.js**

Add this function to handle dropdown changes:

```javascript
function handleInvoiceStatusFilterChange(value) {
  invoiceStatusFilter = value;
  loadBillings(); // Reload and re-render with new filter applied
}
```

- [ ] **Step 4: Update loadBillings() to apply filter**

Modify the `loadBillings()` function to apply both filters. Find this section:

```javascript
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
```

Update it to filter data before rendering:

```javascript
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
```

**Why this approach:**
- Filters on the client-side (data already loaded)
- Uses `!b.invoice_number` to check for null/empty (pending)
- Uses `b.invoice_number` to check for non-null (has)
- Works independently from any paid/unpaid filter

- [ ] **Step 5: Test filter logic**

After implementing, test that:
- Selecting "All" shows all records
- Selecting "Pending Invoice" shows only records where invoice_number is null or empty
- Selecting "Has Invoice" shows only records with a value in invoice_number
- Switching filters refreshes the table

- [ ] **Step 6: Commit**

```bash
git add public/app.js public/index.html
git commit -m "feat: add invoice status filter dropdown"
```

---

### Task 5: Test Filtering with Existing Data

**Files:**
- No code changes; testing only

**Interfaces:**
- Consumes: Running app with billing data in database
- Produces: Verified filter behavior

- [ ] **Step 1: Start the app**

```bash
npm run dev
# or: node server.js (for web server only)
```

- [ ] **Step 2: Navigate to Billing page**

Open the app and click on "Billing" in the sidebar.

- [ ] **Step 3: Verify columns display correctly**

Check that:
- All 8 columns are visible
- "Invoice #" column shows "Click to add" for records without invoice numbers
- Existing invoice numbers display correctly (if any)

- [ ] **Step 4: Test filter dropdown**

- Click "Invoice Status" dropdown
- Select "Pending Invoice" — table should show only records without invoice numbers
- Select "Has Invoice" — table should show only records with invoice numbers
- Select "All" — table should show all records

- [ ] **Step 5: If any issues found**

Revisit Task 4 and debug the filter logic. Check browser console for errors.

- [ ] **Step 6: Commit test verification**

No code to commit, but note in a comment that filtering is verified working.

---

## Frontend - Inline Editing

### Task 6: Implement Inline Edit Mode (Click to Edit)

**Files:**
- Modify: `public/app.js` — Add setupInvoiceNumberEdit() function and click handler

**Interfaces:**
- Consumes: Rendered billing table with cells having `class="invoice-number-cell"` and data attributes
- Produces: Click handler that converts cell to edit mode
  - Function: `setupInvoiceNumberEdit()` — Attach click handlers
  - Function: `enterInvoiceEditMode(cell)` — Convert cell to input field

- [ ] **Step 1: Add setupInvoiceNumberEdit() function**

Add this function to `public/app.js`:

```javascript
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
```

- [ ] **Step 2: Add enterInvoiceEditMode() function**

Add this function to handle entering edit mode:

```javascript
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
```

**Key behaviors:**
- Adds `editing` class to cell for visual styling
- Creates an `<input type="text">` field
- Pre-fills with current value and selects it (for easy replacement)
- Attaches Enter, Escape, and blur event handlers
- Auto-focuses input so user can start typing immediately

- [ ] **Step 3: Verify click handler attachment**

After rendering billings (Task 3), `setupInvoiceNumberEdit()` is called. Verify that the `renderBillings()` function includes this call at the end (it should from Task 3).

- [ ] **Step 4: Test in browser**

- Start the app and navigate to Billing
- Click on a cell showing "Click to add"
- Verify that the cell becomes an input field with focus
- Type a value (don't save yet — we'll test that in Task 7)
- Press Escape to cancel (test Task 8 first)

- [ ] **Step 5: Commit**

```bash
git add public/app.js
git commit -m "feat: implement inline edit mode for invoice number"
```

---

### Task 7: Implement Save Functionality (Enter & Blur)

**Files:**
- Modify: `public/app.js` — Add saveInvoiceNumber() function

**Interfaces:**
- Consumes: `cell` (DOM element), `billingId` (integer), `newValue` (string from input)
- Produces: API call to PUT endpoint, updates cell display with new value
  - API call: `PUT /api/billing-statements/:id/invoice-number` with `{ "invoiceNumber": "value" }`
  - Response: Updated billing record

- [ ] **Step 1: Add saveInvoiceNumber() function**

Add this to `public/app.js`:

```javascript
async function saveInvoiceNumber(billingId, newValue, cell) {
  const trimmedValue = newValue.trim();

  try {
    const response = await fetch(`/api/billing-statements/${billingId}/invoice-number`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders() // Include auth headers
      },
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
```

**Key logic:**
- Trims whitespace from input
- Sends PUT request with the new value (empty string if blank)
- On success: updates cell display, shows checkmark feedback, re-attaches handlers
- On error: shows error message, reverts to previous value, re-attaches handlers
- Always removes `editing` class after save attempt

- [ ] **Step 2: Test save functionality**

- Start the app and navigate to Billing
- Click on a "Click to add" cell
- Type "INV-TEST-001"
- Press Enter
- Verify the cell updates to show "INV-TEST-001"
- Refresh the page — the value should persist (prove data saved to database)

- [ ] **Step 3: Test editing existing invoice number**

- Click on a cell with an invoice number
- Value should be selected/highlighted in input
- Change the value and press Enter
- Verify the update appears and persists on refresh

- [ ] **Step 4: Test error handling (Task 8 has error display)**

For now, test basic flow is working.

- [ ] **Step 5: Commit**

```bash
git add public/app.js
git commit -m "feat: implement save functionality for invoice number (Enter and blur)"
```

---

### Task 8: Implement Cancel Functionality (Escape Key)

**Files:**
- Modify: `public/app.js` — Update enterInvoiceEditMode() to handle Escape (already partially done), add cancelInvoiceEdit()

**Interfaces:**
- Consumes: `cell` (DOM element), `originalValue` (string from data attribute)
- Produces: Function that cancels edit without saving and restores original display

- [ ] **Step 1: Add cancelInvoiceEdit() function**

Add this to `public/app.js`:

```javascript
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
```

- [ ] **Step 2: Verify Escape key is already handled**

Check the `enterInvoiceEditMode()` function from Task 6. It should already have:

```javascript
else if (e.key === 'Escape') {
  cancelInvoiceEdit(cell, currentValue);
}
```

If not, add it to the keydown handler.

- [ ] **Step 3: Test Escape cancellation**

- Click on a cell to enter edit mode
- Type a value
- Press Escape
- Verify the cell returns to its original display without saving
- Verify the value was NOT saved (check after page refresh)

- [ ] **Step 4: Test cancellation with existing value**

- Click on a cell with an existing invoice number
- Modify the value
- Press Escape
- Verify the original value is restored

- [ ] **Step 5: Commit**

```bash
git add public/app.js
git commit -m "feat: implement cancel functionality for invoice number edit (Escape key)"
```

---

### Task 9: Add Visual Feedback (Checkmark Animation & Edit State)

**Files:**
- Modify: `public/app.js` — Add showInvoiceSaveSuccess() and showInvoiceSaveError() functions
- Modify: `public/styles.css` — Add animations and edit state styling

**Interfaces:**
- Consumes: `cell` (DOM element), optional error message
- Produces: Brief checkmark animation on success or error message on failure
  - Function: `showInvoiceSaveSuccess(cell)` — Show checkmark and fade out
  - Function: `showInvoiceSaveError(cell, message)` — Show error notification

- [ ] **Step 1: Add feedback functions to app.js**

Add these functions to `public/app.js`:

```javascript
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
```

- [ ] **Step 2: Add CSS animations to styles.css**

Add these styles to `public/styles.css`:

```css
/* Invoice Number Cell Styling */
.invoice-number-cell {
  cursor: pointer;
  position: relative;
  padding: 0.5rem;
}

.invoice-number-cell:hover {
  background-color: rgba(0, 123, 255, 0.05);
  border-radius: 4px;
}

.invoice-placeholder {
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
}

.invoice-value {
  font-weight: 500;
  color: #333;
}

/* Edit Mode Styling */
.invoice-number-cell.editing {
  background-color: #e7f3ff;
  border: 2px solid #0078d4;
  border-radius: 4px;
  padding: 0.25rem;
}

.invoice-input {
  width: 100%;
  padding: 0.35rem;
  border: none;
  background-color: transparent;
  font-size: 1rem;
  font-weight: 500;
}

.invoice-input:focus {
  outline: none;
}

/* Checkmark Animation */
.invoice-checkmark {
  display: inline-block;
  margin-left: 0.5rem;
  color: #28a745;
  font-weight: bold;
  font-size: 1.2rem;
  animation: fadeOutCheckmark 1.5s ease-out forwards;
}

@keyframes fadeOutCheckmark {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Error State */
.invoice-number-cell.invoice-error {
  background-color: #ffe7e7;
  border-radius: 4px;
}
```

**Why these styles:**
- Hover effect indicates clickability
- Edit state has blue border and background to show active editing
- Placeholder text is subtle (gray, italic)
- Invoice values are bold for prominence
- Checkmark animates and fades over 1.5 seconds
- Error state briefly shows red background

- [ ] **Step 3: Test visual feedback in browser**

- Click a cell to enter edit mode → Verify blue border and background appear
- Type a value and press Enter → Verify checkmark appears briefly and fades
- Hover over cells → Verify subtle background appears on hover

- [ ] **Step 4: Commit**

```bash
git add public/app.js public/styles.css
git commit -m "feat: add visual feedback for invoice number edits (checkmark animation, edit state styling)"
```

---

### Task 10: Error Handling for Failed Saves

**Files:**
- Modify: `public/app.js` — Enhance error handling in saveInvoiceNumber()

**Interfaces:**
- Consumes: API error responses from PUT endpoint
- Produces: User-visible error messages and graceful recovery
  - Error states: Network error, 404 (billing not found), 400/500 (server error)
  - Behavior: Show error notification, revert cell to original value, re-attach handlers

- [ ] **Step 1: Verify error handling is implemented**

Look at the `saveInvoiceNumber()` function from Task 7. It should already have try/catch and error handling:

```javascript
} else {
  const errorData = await response.json();
  showInvoiceSaveError(cell, errorData.error || 'Failed to save');
  // ... revert cell
}
```

and

```javascript
} catch (error) {
  console.error('Error saving invoice number:', error);
  showInvoiceSaveError(cell, 'Network error');
  // ... revert cell
}
```

If not present, add it now.

- [ ] **Step 2: Test error scenarios**

To test error handling, temporarily modify the API endpoint or intentionally cause errors:

**Test 404 (billing not found):**
- Manually change the billingId in the fetch URL to a non-existent ID
- Try to save
- Verify error message appears and cell reverts

**Test network error:**
- Close the server while editing
- Try to save
- Verify error notification appears

**Test server error:**
- No need to test manually — the endpoint handles validation

- [ ] **Step 3: Ensure error messages are clear**

Edit the `showInvoiceSaveError()` function if needed to make messages user-friendly:

```javascript
function showInvoiceSaveError(cell, message) {
  // Map error messages to user-friendly text
  const friendlyMessage = message.includes('not found')
    ? 'Billing record not found'
    : message || 'Failed to save invoice number';

  showNotification(`Invoice #: ${friendlyMessage}`, 'error');
  
  cell.classList.add('invoice-error');
  setTimeout(() => {
    cell.classList.remove('invoice-error');
  }, 1500);
}
```

- [ ] **Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: add error handling for invoice number save failures"
```

---

## Styling & Polish

### Task 11: Add CSS for Edit States, Placeholders, and Animations

**Files:**
- Modify: `public/styles.css` — Ensure all CSS is in place (mostly done in Task 9)

**Interfaces:**
- Consumes: HTML classes and data attributes from frontend
- Produces: Cohesive visual styling for invoice # column and interactions

- [ ] **Step 1: Review CSS already added in Task 9**

Open `public/styles.css` and verify all these blocks are present:
- `.invoice-number-cell` (normal state)
- `.invoice-number-cell:hover` (hover effect)
- `.invoice-placeholder` (pending text styling)
- `.invoice-value` (value text styling)
- `.invoice-number-cell.editing` (edit mode styling)
- `.invoice-input` (input field styling)
- `.invoice-checkmark` (checkmark animation)
- `@keyframes fadeOutCheckmark` (animation definition)
- `.invoice-number-cell.invoice-error` (error state)

- [ ] **Step 2: Check for dark mode compatibility**

If the app has a dark mode or theme toggle, ensure the invoice styles work in both light and dark themes. Update colors if needed:

```css
/* For dark mode, if applicable */
@media (prefers-color-scheme: dark) {
  .invoice-value {
    color: #e0e0e0;
  }

  .invoice-placeholder {
    color: #666;
  }

  .invoice-number-cell:hover {
    background-color: rgba(0, 123, 255, 0.15);
  }

  .invoice-number-cell.editing {
    background-color: #1e3a5f;
    border-color: #0078d4;
  }
}
```

Add this if the app supports dark mode.

- [ ] **Step 3: Test styling in browser**

- Start the app and navigate to Billing
- Verify the invoice # column displays correctly
- Hover over cells → subtle background should appear
- Click to edit → blue border and background
- Type and save → checkmark should appear and fade
- Check on different screen sizes (responsiveness)

- [ ] **Step 4: Adjust colors if needed**

If colors don't match the app's design system, update the CSS values. Key colors to adjust:
- Blue (edit state border/background): `#0078d4` → your primary color
- Success checkmark: `#28a745` → your success color
- Gray (placeholder): `#999` → your secondary color

- [ ] **Step 5: Commit**

```bash
git add public/styles.css
git commit -m "feat: add CSS styling for invoice number column (edit states, animations, dark mode)"
```

---

### Task 12: End-to-End Testing and Refinement

**Files:**
- No code changes; comprehensive testing and verification only

**Interfaces:**
- Consumes: Complete implementation of all tasks
- Produces: Verified working feature, all acceptance criteria met

- [ ] **Step 1: Fresh start — Clear browser cache and restart app**

```bash
# Stop the app if running
# Clear node_modules cache (optional)
npm install
npm run dev  # or node server.js
```

- [ ] **Step 2: Test data setup**

Create 3-4 test billing records with different states:
- One with no invoice number (pending)
- One with an invoice number (assigned)
- One paid, no invoice
- One unpaid, no invoice

Use the Billing page form to create these if needed.

- [ ] **Step 3: Run full acceptance criteria checklist**

**Database:**
- [ ] Invoice numbers persist after page refresh
- [ ] New billings default to NULL invoice_number
- [ ] Empty string in input clears the invoice number

**Display:**
- [ ] Invoice # column shows between Amount and Status
- [ ] Values display in bold
- [ ] Pending (NULL) show "Click to add" in light gray italic
- [ ] Column header is "Invoice #"

**Inline Editing:**
- [ ] Click cell → input appears with focus
- [ ] Click cell with value → value is selected for easy replacement
- [ ] Type new value and press Enter → saves and shows checkmark
- [ ] Type new value and click outside → saves and shows checkmark
- [ ] Escape key → cancels without saving
- [ ] Escaped edits don't save (verify by refresh)

**Filtering:**
- [ ] "All" filter shows all records
- [ ] "Pending Invoice" shows only records without invoice numbers
- [ ] "Has Invoice" shows only records with invoice numbers
- [ ] Filter dropdown persists selection when navigating away and back
- [ ] Filters work independently of paid/unpaid status

**Error Handling:**
- [ ] Typo or invalid input still saves (free-text, no validation)
- [ ] Network error shows error notification and reverts cell
- [ ] Invalid billing ID shows error and reverts cell

**Visual Feedback:**
- [ ] Checkmark appears on successful save
- [ ] Checkmark fades out after ~1.5 seconds
- [ ] Edit mode has blue border and light background
- [ ] Hover shows subtle background highlight
- [ ] Error state briefly shows red background (if error occurs)

**Compatibility:**
- [ ] Billing PDF/Excel export still works (invoice # doesn't break exports)
- [ ] Paid/unpaid toggle still works
- [ ] Delete billing still works

- [ ] **Step 4: Cross-browser / Device Testing**

If possible, test on:
- Desktop (Chrome, Firefox, Safari, Edge)
- Mobile/Tablet (responsive design)
- Different screen sizes (invoice column should be readable)

- [ ] **Step 5: Performance Check**

- Load page with many billing records (50+)
- Click to edit should be snappy
- Save should be fast (< 1 second)
- Filter switching should be instant

If slow, identify bottleneck (network, rendering, etc.)

- [ ] **Step 6: Document any issues found**

If issues are found during testing:
1. Identify which task(s) need fixes
2. Go back to that task and fix the code
3. Re-test the specific functionality
4. Commit the fix

- [ ] **Step 7: Final commit**

After all testing passes:

```bash
git add -A
git commit -m "feat: complete invoice number field implementation and end-to-end testing"
```

---

## Spec Coverage & Self-Review

**Checking spec requirements against plan:**

✓ **Invoice Number Field** — Task 1 (DB column), Task 3 (display), Task 6-10 (editing)  
✓ **UI Display** — Task 3 (column rendering), Task 11 (styling)  
✓ **Inline Editing** — Task 6 (click mode), Task 7 (save), Task 8 (cancel), Task 9 (feedback)  
✓ **Pending Invoice Filter** — Task 4 (filter dropdown, logic)  
✓ **Data Persistence** — Task 1 (database), Task 7 (save to API)  
✓ **API Endpoint** — Task 2 (PUT endpoint)  
✓ **Testing** — Task 5 (filter test), Task 12 (end-to-end)  

**No placeholders found.** All tasks contain concrete code and steps.

**Type consistency verified:** Function names (`setupInvoiceNumberEdit`, `saveInvoiceNumber`, `cancelInvoiceEdit`, `showInvoiceSaveSuccess`, `showInvoiceSaveError`) are consistent across tasks.

**No gaps identified.** All spec requirements are covered by at least one task.

---

## Summary

**Total tasks:** 12  
**Estimated time:** 3-4 hours for an experienced developer  
**Key deliverables:**
- Database column for invoice_number (nullable TEXT)
- PUT endpoint for updating invoice numbers
- Invoice # column in billing table
- Inline edit mode with Enter/Escape/blur handlers
- Pending invoice filter
- Visual feedback (checkmark animation, edit state styling)
- Comprehensive error handling

**Code changes:** ~400 lines of JavaScript, ~200 lines of CSS, minimal SQL

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-08-10-invoice-number-field-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (Recommended)** — I dispatch a fresh subagent per task (or few tasks), review output, fast iteration. Safer for complex tasks, better error handling.

**2. Inline Execution** — Execute tasks in this session, batch execution with checkpoints. Faster feedback loop, better for simple/straightforward tasks.

**Which approach would you prefer?**
