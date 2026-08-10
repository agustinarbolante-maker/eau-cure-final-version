# Quick Deploy Guide

**For deploying new features to https://eaucure.store**

## One-Minute Deploy

```bash
# 1. Make sure your changes are committed and pushed
git push origin main

# 2. SSH into server
ssh eaucure@165.232.175.101

# 3. Pull and restart
cd /var/www/eau-cure
git pull origin main
pm2 restart eau-cure

# 4. Verify
# Visit https://eaucure.store to see your changes live
```

## Server Details

| Item | Value |
|------|-------|
| **Live URL** | https://eaucure.store |
| **Server IP** | 165.232.175.101 |
| **SSH User** | eaucure |
| **App Directory** | /var/www/eau-cure |
| **Process Manager** | PM2 |
| **Database** | SQLite (water_station.db) |
| **Logs** | /var/log/eau-cure/ |

## Common Commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs eau-cure

# Restart app
pm2 restart eau-cure

# Stop app
pm2 stop eau-cure

# Start app
pm2 start eau-cure

# Check database backups
ls -la /var/www/eau-cure/data/backups/

# Check health status
cat /var/log/eau-cure/health-check.log
```

## If Deploy Breaks

1. Check logs: `pm2 logs eau-cure`
2. Restart: `pm2 restart eau-cure`
3. If issue persists:
   - `git pull origin main` again
   - Check if packages changed: `npm install`
   - `pm2 restart eau-cure`

## Before Deploying

- ✅ Test feature locally
- ✅ Commit changes with clear messages
- ✅ Push to GitHub (`git push origin main`)
- ✅ Check for database migrations (might need manual SQL)
- ✅ Verify no breaking changes to existing features

---

**Full deployment details:** See `DIGITALOCEAN_SETUP.md`  
**Development guide:** See `../CLAUDE.md` in project root
