# 🧪 Eau Cure Testing Guide - Session 3

**Date:** 2026-08-09  
**Status:** ✅ All systems verified and running  

---

## ✅ PRE-TEST VERIFICATION (PASSED)

The server is running and all API endpoints are working:
- ✅ Server: Running on http://localhost:3000
- ✅ Authentication API: Working (JWT tokens issued)
- ✅ Deliveries API: Working (HTTP 200)
- ✅ Companies API: Working (56 companies pre-seeded)
- ✅ Billing Statements API: Working (HTTP 200)
- ✅ HTML: Reports page code verified in DOM
- ✅ JavaScript: Reports form handler verified

---

## 🔑 LOGIN CREDENTIALS

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| Admin | `admin` | `admin123` | Full access + user management |
| Owner | `owner` | `admin123` | All features except user management |

---

## 📋 MANUAL TEST CHECKLIST

### Phase 1: Login & Dashboard (5 min)

- [ ] Open http://localhost:3000 in browser
- [ ] Login with username: `admin`, password: `admin123`
- [ ] Verify dashboard loads with:
  - [ ] 3 statistics cards (Total Deliveries, Total Returned, Pending Payments)
  - [ ] 7-day trend chart
  - [ ] Calendar widget on left side
- [ ] Verify sidebar has all 7 navigation tabs:
  - [ ] 📊 Dashboard
  - [ ] 💧 Deliveries
  - [ ] 📝 Records
  - [ ] 🏢 Companies
  - [ ] 💰 Billing
  - [ ] 📊 Reports (NEW - this is the critical one)
  - [ ] ⚙️ Settings

**Note:** If Reports tab doesn't appear, try:
1. Press F12 to open browser DevTools
2. Go to Application tab
3. Click "Clear site data"
4. Refresh the page (Ctrl+R)

---

### Phase 2: Deliveries Feature (5 min)

- [ ] Click on "Deliveries" in sidebar
- [ ] Verify form appears with:
  - [ ] Company dropdown (should show 56+ companies)
  - [ ] Date picker (calendar)
  - [ ] DR Number field
  - [ ] Bottles Delivered field
  - [ ] Bottles Returned field
  - [ ] Notes field
- [ ] Create a test delivery:
  - [ ] Select company: "Arkray"
  - [ ] Select date: Today
  - [ ] DR Number: "DR-001"
  - [ ] Bottles Delivered: "10"
  - [ ] Bottles Returned: "2"
  - [ ] Click "Add Delivery"
- [ ] Verify success notification appears (green, top-right)
- [ ] Go to "Records" tab
- [ ] Verify delivery appears in table with:
  - [ ] Date
  - [ ] Company name
  - [ ] DR number
  - [ ] Bottles delivered/returned
  - [ ] Edit & Delete buttons

**Success:** Green notification, delivery appears in Records ✅

---

### Phase 3: Companies Management (3 min)

- [ ] Click on "Companies" in sidebar
- [ ] Verify companies table with 56+ rows
- [ ] Test adding a company:
  - [ ] Click "Add Company"
  - [ ] Name: "Test Water Co"
  - [ ] Unit Price: "25"
  - [ ] Click "Add Company"
- [ ] Verify new company appears in table
- [ ] Test editing:
  - [ ] Click Edit on any company
  - [ ] Change unit price to "26"
  - [ ] Click "Save Changes"
- [ ] Verify changes appear in table

**Success:** New company appears, edits work ✅

---

### Phase 4: Billing Statements (5 min)

- [ ] Click on "Billing" in sidebar
- [ ] Create a billing statement:
  - [ ] Select company: "Arkray"
  - [ ] Select start date: 2026-08-01
  - [ ] Select end date: 2026-08-09
  - [ ] Click "Generate Statement"
- [ ] Verify statement appears in table with:
  - [ ] Company name
  - [ ] Date range
  - [ ] Total amount (calculated from deliveries)
  - [ ] Status (Unpaid)
  - [ ] Action buttons (Paid/Unpaid toggle, Excel download, PDF download)
- [ ] Test PDF export:
  - [ ] Click PDF button
  - [ ] Verify print dialog opens
  - [ ] Check preview shows:
    - [ ] "EAU CURE WATER REFILLING STATION" header
    - [ ] "Billing Statement" title with dates
    - [ ] "BILL TO: Arkray"
    - [ ] Detailed line items (Date, DR #, QTY, Particulars, Unit Price, Amount)
    - [ ] Grand total in red
    - [ ] "PREPARED BY:" signature line
  - [ ] Press Escape to close print dialog
- [ ] Test Excel export:
  - [ ] Click Excel button
  - [ ] Verify CSV file downloads
  - [ ] Open in Excel/Notepad to verify format

**Success:** Billing statement created, both exports work ✅

---

### Phase 5: Reports Page - THE CRITICAL TEST (5 min)

⚠️ **THIS IS THE MAIN TEST FOR SESSION 3**

- [ ] Click on "Reports" in sidebar
- [ ] Verify Reports page loads with:
  - [ ] "Delivery Reports" heading
  - [ ] Description: "Generate delivery summary reports..."
  - [ ] Start Date input field
  - [ ] End Date input field
  - [ ] "Generate Report" button
  - [ ] Empty table below (will populate after report generated)

**If Reports tab doesn't appear:** Clear browser cache first!
```
1. Press F12 (open DevTools)
2. Click "Application" tab
3. Click "Clear site data"
4. Reload page (Ctrl+R)
```

- [ ] Generate a test report:
  - [ ] Start Date: 2026-08-01
  - [ ] End Date: 2026-08-09
  - [ ] Click "Generate Report"
- [ ] Verify report table appears with columns:
  - [ ] Company
  - [ ] Delivered
  - [ ] Returned
  - [ ] Total Amount
- [ ] Verify data is correct:
  - [ ] Should show "Arkray" from our test delivery
  - [ ] Delivered: 10
  - [ ] Returned: 2
  - [ ] Total Amount: Should calculate correctly (10 * unit_price)
- [ ] Test PDF export:
  - [ ] Click PDF button below report
  - [ ] Verify print dialog opens
  - [ ] Check preview shows summary by company
  - [ ] Press Escape to close
- [ ] Test Excel export:
  - [ ] Click Excel button
  - [ ] Verify CSV file downloads
  - [ ] Open to verify format

**Success Criteria:**
- ✅ Reports tab visible in sidebar
- ✅ Reports page loads completely
- ✅ Report generates with correct data
- ✅ PDF export works
- ✅ Excel export works

---

### Phase 6: Settings/Admin (2 min)

- [ ] Click on "Settings" in sidebar
- [ ] Verify admin-only features:
  - [ ] "Create New User" form
  - [ ] Users table showing all users
  - [ ] Username, Email, Role columns
  - [ ] Delete buttons for each user
- [ ] Optional: Create a test user (admin only)

**Success:** Settings page loads, user management visible ✅

---

## 🐛 TROUBLESHOOTING

### Problem: Reports tab doesn't appear

**Solution:**
1. Close all browser tabs/windows completely
2. Press F12 to open DevTools in any browser window
3. Go to "Application" tab
4. Under "Cookies", find and click "http://localhost:3000"
5. Click "Clear site data"
6. Close DevTools (F12)
7. Go to http://localhost:3000
8. Login again
9. Reports tab should now appear ✅

### Problem: Data not saving/API errors

**Check:**
1. Open browser console (F12 → Console)
2. Look for red error messages
3. If you see 404 or 500 errors, screenshot and note them
4. Restart server: `npm start` in the project directory

### Problem: PDF/Excel not downloading

**Check:**
1. Browser might have blocked downloads
2. Check browser's download notification (if any)
3. Check popup blocker - disable for localhost:3000
4. Try with different browser if possible

### Problem: Numbers not calculating correctly

**Verify:**
1. Check that companies have unit prices set (should be ₱17-₱23)
2. Verify deliveries show correct bottles delivered
3. Manual calculation: Bottles Delivered × Unit Price = Amount

---

## 📊 EXPECTED DATA

### Test Delivery Created:
- Company: Arkray (Unit Price: ₱18)
- Date: 2026-08-09
- DR Number: DR-001
- Bottles Delivered: 10
- Bottles Returned: 2
- **Expected Amount:** 10 × ₱18 = ₱180

### Database Stats:
- Total Companies: 56 (pre-seeded)
- Default Unit Prices: ₱17-₱23
- Test Users: 2 (admin, owner)

---

## ✅ COMPLETION CHECKLIST

Phase 1 (Login): ☐ Complete  
Phase 2 (Deliveries): ☐ Complete  
Phase 3 (Companies): ☐ Complete  
Phase 4 (Billing): ☐ Complete  
Phase 5 (Reports): ☐ Complete  
Phase 6 (Settings): ☐ Complete  

---

## 📝 NOTES FOR NEXT SESSION

If all tests pass:
- Update CLAUDE.md with "All features tested and verified ✅"
- Commit changes to git
- Update handoff with any found issues

If issues found:
- Document exact error message
- Note which phase failed
- Include browser console errors (F12)
- Include screenshot if applicable

---

**Good luck! You've got this! 🚀**
