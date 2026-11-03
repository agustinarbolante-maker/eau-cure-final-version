# Eau Cure - Project Guidelines

## Quick Deploy Checklist
After implementing features:
1. `git commit` with clear messages
2. `git push origin main`
3. SSH into server: `ssh eaucure@165.232.175.101`
4. `cd /var/www/eau-cure && git pull origin main`
5. `pm2 restart eau-cure`
6. Verify at https://eaucure.store

---

## Git & Version Control

**IMPORTANT: Regular commits and pushes are required to maintain project history and prevent data loss.**

As you work on this project:
- Make commits frequently with **clean, descriptive commit messages**
- Push commits to GitHub regularly (after each feature, fix, or significant change)
- Always include context in commit messages explaining the "why" behind changes
- Never allow work to accumulate without being pushed to GitHub
- This ensures we always have a saved version and can track project progress

### Commit Message Guidelines
- Use clear, concise subject lines (50 characters or less)
- Include the reason for the change, not just what was changed
- Example: "Add water quality monitoring to dashboard" (not "Update UI")

---

## Deployment (DigitalOcean)

**Live Site:** https://eaucure.store  
**Server IP:** 165.232.175.101  
**Server User:** eaucure  
**App Directory:** /var/www/eau-cure  

### How to Deploy New Features

```bash
# Step 1: Push changes to GitHub
git push origin main

# Step 2: SSH into server
ssh eaucure@165.232.175.101

# Step 3: Pull latest code
cd /var/www/eau-cure
git pull origin main

# Step 4: If new packages were added
npm install

# Step 5: Restart the app
pm2 restart eau-cure

# Step 6: Verify deployment
# Check app at https://eaucure.store
# Check logs: pm2 logs eau-cure
```

### Important Notes
- Database: SQLite at `/var/www/eau-cure/data/water_station.db`
- Logs: `/var/log/eau-cure/`
- Backups: Automatic daily at 2 AM UTC, stored in `/var/www/eau-cure/data/backups/`
- Off-site backups: cron at 02:30 UTC runs `scripts/offsite-backup.sh`, pushing a snapshot to the
  private repo `agustinarbolante-maker/eau-cure-backups` (clone at `/var/www/eau-cure-backups`,
  deploy key via SSH host alias `github-backups`). Log: `/var/log/eau-cure/offsite-backup.log`.
  Setup/restore steps: `docs/deployment/OFFSITE_BACKUPS.md`
- Secrets: `/var/www/eau-cure/.env` (loaded by dotenv in `server.js`) holds `JWT_SECRET`. Without it,
  logins are signed with a public default and anyone can forge an Owner token — the server logs
  `WARNING: JWT_SECRET is not set` if so. Never paste `.env` contents into chats/tickets; check keys
  with `cut -d= -f1 .env`. When appending to it use `printf '\n...'` (the file may lack a trailing newline).
- SSL: Let's Encrypt (auto-renews every 90 days)
- Process Manager: PM2 (auto-restarts on crash or server reboot)

### Test Credentials
- Owner: `Olimar` / `Olimar123`
- Admin: `Admin` / `Admin123`

### If Something Breaks
```bash
# Check what happened
pm2 logs eau-cure

# Restart the app
pm2 restart eau-cure

# If that doesn't work, restart everything
pm2 stop eau-cure
pm2 start eau-cure

# Check PM2 status
pm2 status
```

---

## Project Setup

- Node.js 18.20.8+
- npm 10.8.2+
- Express.js server (port 3000, proxied through Nginx)
- SQLite database (water_station.db)
- Electron app for desktop (optional)

## Development Guidelines

### Creating Features
1. Use `superpowers:brainstorming` to design features
2. Create isolated git worktree for implementation
3. Use `superpowers:writing-plans` for task breakdown
4. Test thoroughly before merging
5. Follow commit message guidelines above
6. Push to GitHub, then deploy to server

### Code Structure
- `database.js` — SQLite schema and query functions
- `server.js` — Express API endpoints
- `public/app.js` — Frontend logic (vanilla JavaScript)
- `public/index.html` — HTML structure
- `public/styles.css` — Styling
- `main.js`, `preload.js` — Electron app files
- `scripts/snapshotDb.js` — consistent DB copy via `VACUUM INTO` (safe while app runs)
- `scripts/offsite-backup.sh` — nightly off-site backup (see Deployment)

### Business Rules (keep consistent everywhere)
- **Sales** = `bottles_delivered × company's current unit_price` (Dashboard cards, trend chart and
  summary report all use this; changing a price changes past sales totals).
- **Income** = Sales − Expenses.
- **A delivery's date** = first 10 chars of `deliveries.timestamp` (stored as UTC midnight of the chosen day).
- **Weeks run Monday to Sunday** (client's convention) — use `getWeekRange()` in `public/app.js`.
- **Dates in the browser:** use `toLocalDateString()` / `parseLocalDate()`, never
  `toISOString().split('T')[0]` — the client is in UTC+8 and the UTC conversion shifts days.
- **Expense categories** are a fixed list in `EXPENSE_CATEGORIES` (`database.js`); the server rejects others.
- **Backup endpoints** (restore/delete/download/upload) require Owner or Software Engineer.

### Local Development
- `npm install`, then `npm start` → http://localhost:3000 (DB and Olimar/Admin users are auto-created).
- The server writes `data/backups/backup_*.db` on every start. Local ones are test data — **don't
  commit them**; add files by name instead of `git add -A`.
- No test framework: test APIs with curl and the UI with Playwright (set `timezone_id="Asia/Manila"`).

### Testing Before Deployment
- Test locally in development environment
- Use worktree for isolated testing
- Verify all related features still work
- Check for console errors and warnings

---

## Change Log

### 2026-11-03
**Security & data protection**
- Fixed unauthenticated `DELETE /api/backups/:filename` + path traversal that could delete the live DB,
  and unauthenticated upload that could write files anywhere (`7754592`).
- Loaded `.env` so production uses a real `JWT_SECRET`; set a fresh secret on the server (`b098fde`).
- Added nightly off-site backups to the private `eau-cure-backups` repo; first backup verified on GitHub (`5ffc637`).

**Client features** (`74d9e16`)
- Expenses page: add/edit/delete, 15 fixed categories, date/category filters, running total.
- Dashboard trend chart: Sales / Expenses / Income selector (replaced net-bottles chart).
- Records → Sales & Expenses Summary: Daily / Weekly (Mon–Sun) / Custom, per-category breakdown,
  net income, Print button.
- Fixed trend chart dropping today (UTC date bug).

**Fixes** (`37d5251`)
- Earnings cards use Monday–Sunday weeks; fixed "This Month" including the previous month's last
  day and "Today" showing yesterday before 8 AM.

### Open Items
- Confirm `eau-cure-backups` gets a new file each day (`tail /var/log/eau-cure/offsite-backup.log`).
- Turn on DigitalOcean droplet backups (client decision, ~20% of droplet price).
- `npm audit`: 38 vulnerabilities (2 critical) in dependencies — review in a separate session.
- Sales use current unit price; storing price per delivery would preserve history if prices change.
- Trend chart "This Week" = last 7 days and "All Time" = last 90 days (not calendar weeks / all data).
- Earnings cards cut off amounts on laptop-width screens; on phones the sidebar covers the page.
