# Invoice Number Field for Billing Statements — Design Spec

**Date:** 2026-08-10  
**Status:** Approved  
**Scope:** Add invoice number tracking to billing records with inline editing and filtering

---

## Overview

Currently, billing statements are created in the system, exported as PDFs, sent to the manager for approval, and the manager assigns an invoice number manually. However, there's no way to track which invoice number corresponds to which billing record in the system. This creates a disconnect between the billing records and their official invoice numbers.

**Goal:** Enable users to enter invoice numbers directly against billing records as they receive them from the manager, with clear visibility into which billings are still waiting on invoice numbers.

---

## Requirements

### Functional Requirements

1. **Invoice Number Field**
   - Add `invoice_number` column to `billing_statements` table (TEXT, nullable, default NULL)
   - Field is optional — billing records can exist without an invoice number
   - Supports free-text input (no format validation)
   - Editable at any time, not just at creation

2. **UI Display**
   - New "Invoice #" column in the billing table
   - Column placement: between "Amount" and "Status" columns
   - Cell display:
     - If value exists: show invoice number in prominent text
     - If NULL (pending): show "Click to add" placeholder in light gray italic text
   - Table currently has 7 columns → will have 8 columns after this change

3. **Inline Editing**
   - Click on invoice # cell to enter edit mode
   - Edit mode behavior:
     - Cell border highlights (light blue or accent color)
     - Background changes to indicate active edit state
     - Input field auto-focuses
     - Field pre-fills with current value (or empty if null)
   - User can type any text (alphanumeric, special characters allowed)
   - Save triggers on:
     - Press Enter key
     - Click outside the cell (blur event)
   - Cancel on:
     - Press Escape key
     - Reverts to previous value without saving
   - Feedback:
     - On successful save: show brief checkmark (✓) indicator for ~1.5 seconds
     - Optional: brief toast notification "Invoice # saved"
     - Table cell updates to show new value

4. **Pending Invoice Filter**
   - New filter dropdown labeled "Invoice Status" (placed below existing paid/unpaid filter)
   - Options:
     - "All" (default, shows all records)
     - "Pending Invoice" (shows only records where `invoice_number IS NULL`)
     - "Has Invoice" (shows only records where `invoice_number IS NOT NULL`)
   - Filter works independently of paid/unpaid status
   - User can combine filters: e.g., view "Unpaid AND Pending Invoice" together

5. **Data Persistence**
   - Invoice numbers stored in database
   - Survives page refresh, application restart
   - No duplicate checking (manager's responsibility)

---

## Technical Design

### Database Changes

**Schema alteration:**
```sql
ALTER TABLE billing_statements ADD COLUMN invoice_number TEXT DEFAULT NULL;
```

**Notes:**
- Uses NULL to represent "no invoice number yet" (simplifies filtering)
- TEXT type supports any length of invoice number format
- No uniqueness constraint (same invoice number could theoretically be assigned to multiple billings if needed)

---

### API Changes

**New endpoint: Update Invoice Number**
- **Method:** PUT
- **Path:** `/api/billing-statements/:id/invoice-number`
- **Authentication:** Required (pass existing headers)
- **Request body:**
  ```json
  {
    "invoiceNumber": "INV-2026-0847"
  }
  ```
  Or empty string to clear: `{ "invoiceNumber": "" }`

- **Success response (200):**
  ```json
  {
    "id": 5,
    "company_name": "HRD",
    "start_date": "2026-08-01",
    "end_date": "2026-08-10",
    "total_amount": 15000,
    "is_paid": 0,
    "invoice_number": "INV-2026-0847",
    "created_date": "2026-08-10T10:30:00",
    "paid_date": null
  }
  ```

- **Error response (400/401/500):**
  ```json
  {
    "error": "Failed to update invoice number"
  }
  ```

**Updated endpoint: Get Billing Statements**
- **Path:** `GET /api/billing-statements`
- **No changes to endpoint itself** — but response now includes `invoice_number` field for each record
- Filter logic handled on frontend (JavaScript can filter the data client-side)

---

### Frontend Changes

**Components/Functions affected:**
1. `renderBillings()` — Add invoice # column to table HTML template
2. New function: `setupInvoiceNumberEdit()` — Attach click handlers to invoice # cells, manage edit state
3. New function: `saveInvoiceNumber(billingId, newNumber)` — Call API, handle response
4. `loadBillings()` — Refresh table after save
5. Add filter state variables for "Invoice Status" filter
6. Update filter rendering logic to include new dropdown

**Edit mode implementation:**
- Use data attributes or event delegation to track which cell is in edit mode
- On click, replace cell content with `<input type="text">` element
- On Enter/blur, read input value, call save function
- On Escape, restore original content
- Visual styling via CSS class (e.g., `.invoice-edit-active`)

**Filter implementation:**
- Add filter dropdown HTML below current filters
- Add JavaScript variable: `let invoiceStatusFilter = 'all'` (default)
- Update `renderBillings()` to filter data based on both `is_paid` and `invoice_number` before rendering
- Filter logic:
  ```javascript
  if (invoiceStatusFilter === 'pending') {
    filtered = filtered.filter(b => b.invoice_number === null);
  } else if (invoiceStatusFilter === 'has') {
    filtered = filtered.filter(b => b.invoice_number !== null);
  }
  // if 'all', no additional filtering
  ```

---

### User Experience Flow

**Scenario 1: Add an invoice number**
1. User views billing table, sees "Click to add" in invoice # column
2. Clicks the cell
3. Cell enters edit mode (border highlights, input appears, auto-focuses)
4. User types "INV-2026-0847"
5. User presses Enter
6. Cell shows brief checkmark (✓)
7. Cell updates to show "INV-2026-0847" and returns to normal display state
8. Record is now hidden from "Pending Invoice" filter

**Scenario 2: Edit an existing invoice number**
1. User sees billing record with "INV-2026-0800"
2. Clicks the cell to correct it
3. Field highlights, input appears with current value selected
4. User clears and types "INV-2026-0847"
5. Clicks outside the cell
6. Checkmark appears, cell updates

**Scenario 3: Filter pending invoices**
1. User clicks "Invoice Status" filter dropdown
2. Selects "Pending Invoice"
3. Table refreshes, showing only records without invoice numbers
4. User can still filter by paid/unpaid independently
5. E.g., "Show me unpaid billings that still need invoice numbers"

---

## Column Order

**New table column structure:**
1. Company Name
2. Date Range (Start – End)
3. Amount
4. **Invoice # (NEW)**
5. Status (Paid/Unpaid badge)
6. Actions (Export buttons)
7. Actions (Toggle/Delete buttons)

---

## Styling Considerations

**Invoice # Cell (Normal state):**
- If value exists: bold or accent color
- If pending: light gray, italic "Click to add"
- Subtle pointer cursor on hover to indicate clickability

**Invoice # Cell (Edit state):**
- Light blue or accent color border
- Light background (e.g., light gray or blue tint)
- Input field inherits styling

**Checkmark feedback:**
- Brief green checkmark (✓) appears, fades out over 1.5 seconds
- Can use CSS animation (`@keyframes fadeOut`)

**Filter dropdown:**
- Consistent styling with existing filters
- Clear labeling: "Invoice Status"

---

## Testing Checklist

- [ ] Database migration/alteration succeeds
- [ ] API endpoint PUT `/api/billing-statements/:id/invoice-number` works
- [ ] Inline edit: click cell → input field appears
- [ ] Inline edit: Enter key saves
- [ ] Inline edit: Click outside cell saves
- [ ] Inline edit: Escape cancels without saving
- [ ] Inline edit: Checkmark appears on successful save
- [ ] Inline edit: Error handling on failed save (show error message)
- [ ] Table column displays invoice # correctly (value or "Click to add")
- [ ] Filter dropdown works: "All" shows all records
- [ ] Filter dropdown works: "Pending Invoice" shows only NULL records
- [ ] Filter dropdown works: "Has Invoice" shows only non-NULL records
- [ ] Filters combine correctly: paid/unpaid + invoice status
- [ ] Page refresh preserves invoice numbers (data persists)
- [ ] New billing records default to NULL invoice number

---

## Future Enhancements (Out of Scope)

- Invoice number format validation (if needed later)
- Duplicate invoice number detection/warning
- Invoice number auto-generation
- Bulk invoice number assignment
- Invoice # search/filter by value
- History/audit log of invoice number changes

---

## Success Criteria

✓ Users can assign invoice numbers to billing records  
✓ Invoice numbers are editable inline with clear feedback  
✓ Users can filter billing records by pending vs. assigned invoice status  
✓ Data persists across sessions  
✓ No required validation — any text accepted  

---

## Acceptance Notes

This spec was approved by the user with the following decisions:
- Separate column for invoice # (not inline with status badge)
- Inline editing with enhanced UX (edit state, confirmation, feedback)
- Dual filtering: both paid/unpaid status AND invoice assignment status
- Free-text invoice numbers (no format validation)
