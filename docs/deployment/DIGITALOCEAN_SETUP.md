# 🚀 DigitalOcean Deployment Guide - Option B

**Cost**: $6-11/month | **Uptime**: 99.9% | **Data Protection**: ✅ Automatic Backups

---

## 📋 Requirements

- DigitalOcean account (sign up at [digitalocean.com](https://digitalocean.com))
- GitHub account with your code pushed
- Basic terminal knowledge

---

## 💰 Costs Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| Droplet (Ubuntu 22.04, 1GB RAM, 25GB SSD) | $6/month | Main server |
| DigitalOcean Spaces (250GB, for backups) | $5/month | Optional but recommended |
| **Total** | **$11/month** | **$132/year** |
| **Droplet Only** | **$6/month** | **$72/year** (no offsite backups) |

---

## 🛠️ Step 1: Create a DigitalOcean Droplet

1. Log in to DigitalOcean dashboard
2. Click **Create** → **Droplets**
3. Configure:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic ($6/month) - 1GB RAM, 25GB SSD
   - **Region**: Choose closest to your location
   - **Authentication**: SSH Key (recommended) or password
   - **Hostname**: `eau-cure-prod`
4. Click **Create Droplet**
5. Wait 2-3 minutes for creation

---

## 📱 Step 2: Connect to Your Droplet

### Via Terminal (Mac/Linux):
```bash
ssh root@YOUR_DROPLET_IP
```

### Via PuTTY (Windows):
1. Download PuTTY
2. Enter IP address
3. Use SSH key or password

---

## ⚙️ Step 3: Setup Droplet

Once connected to your Droplet, run these commands:

### Update System
```bash
apt update && apt upgrade -y
```

### Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version
npm --version
```

### Install Git
```bash
apt install -y git
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Create App Directory
```bash
mkdir -p /var/www/eau-cure
cd /var/www/eau-cure
```

---

## 📦 Step 4: Deploy from GitHub

### Clone Your Repository
```bash
git clone https://github.com/YOUR_USERNAME/eau-cure.git .
```

### Install Dependencies
```bash
npm install
```

### Create Environment File (if needed)
```bash
cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_PATH=/var/www/eau-cure/data/water_station.db
EOF
```

### Test Locally on Droplet
```bash
npm start
```

If it says "Server running on http://localhost:3000" ✅ you're good!

Stop with `Ctrl+C`

---

## 🔄 Step 5: Setup PM2 (Auto-restart on reboot)

Start app with PM2:
```bash
pm2 start server.js --name "eau-cure"
```

Enable auto-start on reboot:
```bash
pm2 startup
pm2 save
```

Check status:
```bash
pm2 status
pm2 logs
```

---

## 🌐 Step 6: Setup Nginx Reverse Proxy

### Install Nginx
```bash
apt install -y nginx
```

### Create Nginx Config
```bash
cat > /etc/nginx/sites-available/eau-cure << 'EOF'
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### Enable Config
```bash
ln -s /etc/nginx/sites-available/eau-cure /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Your app is now accessible at: `http://YOUR_DROPLET_IP`

---

## 🔐 Step 7: Setup SSL Certificate (HTTPS)

### Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### Get Certificate (replace with your domain)
```bash
certbot certonly --nginx -d your-domain.com
```

Or for droplet IP (self-signed):
```bash
# This is optional - IP addresses don't need SSL
```

---

## 💾 Step 8: Setup Backups

### Option A: DigitalOcean Spaces (Recommended)
1. Go to DigitalOcean Dashboard → Spaces
2. Create new Space (e.g., `eau-cure-backups`)
3. Generate API key
4. Add backup script to droplet:

```bash
cat > /var/www/eau-cure/backup.sh << 'EOF'
#!/bin/bash
BACKUP_FILE="data/water_station.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP.db"

# Upload to Spaces (requires aws-cli)
aws s3 cp "$BACKUP_FILE" s3://eau-cure-backups/"$BACKUP_NAME" \
    --endpoint-url https://nyc3.digitaloceanspaces.com

echo "Backup uploaded to Spaces"
EOF

chmod +x /var/www/eau-cure/backup.sh
```

Schedule with cron (daily at 2 AM):
```bash
crontab -e
# Add: 0 2 * * * /var/www/eau-cure/backup.sh
```

### Option B: Local Backups Only
Already included! The app creates automatic backups in `data/backups/`

---

## 🧪 Step 9: Verify Deployment

1. Open browser: `http://YOUR_DROPLET_IP`
2. Login with test credentials:
   - **Owner**: `Olimar` / `Olimar123`
   - **Admin**: `Admin` / `Admin123`
3. Test features:
   - Add a delivery ✅
   - View dashboard ✅
   - Generate report ✅
   - Export to PDF ✅

---

## 📊 Step 10: Monitor Your App

### Check Logs
```bash
pm2 logs eau-cure
```

### Restart if Needed
```bash
pm2 restart eau-cure
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

---

## 🔧 Maintenance

### Weekly: Check Status
```bash
pm2 status
pm2 logs
```

### Monthly: Update Dependencies
```bash
cd /var/www/eau-cure
git pull
npm install
pm2 restart eau-cure
```

### Monthly: Check Backups
```bash
ls -la data/backups/
```

Oldest backups auto-deleted after 30 days

---

## 🚨 Troubleshooting

### App not starting?
```bash
pm2 logs eau-cure
```
Check error message and fix

### Can't access from browser?
```bash
# Check Nginx
sudo systemctl status nginx

# Check firewall
sudo ufw status

# If needed, allow HTTP/HTTPS:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Database corrupted?
```bash
# Restore from backup
cp data/backups/backup_LATEST.db data/water_station.db
pm2 restart eau-cure
```

---

## 🎯 Next Steps

1. ✅ Deploy this guide
2. Set up a domain name (optional but recommended)
3. Set up SSL certificate (for HTTPS)
4. Enable automated Spaces backups
5. Monitor performance

---

## 📈 Scale as You Grow

If costs are too high later, upgrade to:
- **Dedicated CPU** ($12/month) - Better performance
- **PostgreSQL** instead of SQLite - More reliable for many users
- **CDN** - Faster static file delivery

---

## 💬 Support

**DigitalOcean Docs**: https://docs.digitalocean.com  
**Community**: https://www.digitalocean.com/community  
**Support Email**: support@digitalocean.com

---

**Last Updated**: 2026-08-09  
**Status**: ✅ Ready to Deploy
