# Off-site Database Backups

The server already keeps 30 days of backups in `/var/www/eau-cure/data/backups/`,
but those die with the server. `scripts/offsite-backup.sh` runs nightly and pushes
a compressed snapshot of the live database to the **private** GitHub repo
`agustinarbolante-maker/eau-cure-backups`.

- Snapshot uses SQLite `VACUUM INTO` (`scripts/snapshotDb.js`) — safe while the app runs
- Newest 90 snapshots are kept in the repo; older ones remain in git history
- The server pushes with a deploy key that can only write to the backups repo

## One-time server setup

Run these on the server (`ssh eaucure@165.232.175.101`):

```bash
# 1. Get the new scripts
cd /var/www/eau-cure && git pull origin main

# 2. Create a key used only for pushing backups
ssh-keygen -t ed25519 -f ~/.ssh/eau_cure_backups -N "" -C "eau-cure-server-backups"
cat ~/.ssh/eau_cure_backups.pub
```

3. Add that public key on GitHub: **eau-cure-backups → Settings → Deploy keys → Add deploy key**,
   title `server`, tick **Allow write access**.

```bash
# 4. Tell SSH to use that key for the backups repo
cat >> ~/.ssh/config <<'EOF'
Host github-backups
  HostName github.com
  User git
  IdentityFile ~/.ssh/eau_cure_backups
  IdentitiesOnly yes
EOF

# 5. Clone the backups repo next to the app
git clone git@github-backups:agustinarbolante-maker/eau-cure-backups.git /var/www/eau-cure-backups
git -C /var/www/eau-cure-backups config user.name "Eau Cure Server"
git -C /var/www/eau-cure-backups config user.email "server@eaucure.store"

# 6. Test it once — should print "Off-site backup pushed"
bash /var/www/eau-cure/scripts/offsite-backup.sh

# 7. Schedule nightly at 02:30 UTC (after the app's own 2 AM backup)
(crontab -l 2>/dev/null; echo '30 2 * * * bash /var/www/eau-cure/scripts/offsite-backup.sh >> /var/log/eau-cure/offsite-backup.log 2>&1') | crontab -
```

## Checking it works

- GitHub: the `eau-cure-backups` repo should get a new commit every day
- Server: `tail /var/log/eau-cure/offsite-backup.log`

## Restoring from an off-site backup

```bash
git clone https://github.com/agustinarbolante-maker/eau-cure-backups.git
gunzip -c eau-cure-backups/daily/water_station_<timestamp>.db.gz > water_station.db
# On the server: pm2 stop eau-cure, replace /var/www/eau-cure/data/water_station.db, pm2 start eau-cure
```
