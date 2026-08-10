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

### Testing Before Deployment
- Test locally in development environment
- Use worktree for isolated testing
- Verify all related features still work
- Check for console errors and warnings
