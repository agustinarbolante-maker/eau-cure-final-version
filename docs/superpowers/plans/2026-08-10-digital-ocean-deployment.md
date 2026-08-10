# Eau Cure Digital Ocean Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Eau Cure Express server and React frontend to a Digital Ocean Ubuntu droplet with automated process management, reverse proxy, and SSL/TLS security.

**Architecture:** The deployment strategy separates the Electron desktop app from the web backend. We'll run the Express server (currently embedded in the Electron app) as a standalone Node.js application on a Digital Ocean droplet. Nginx will act as a reverse proxy, routing HTTP/HTTPS traffic to the Node.js server. PM2 will manage the Node.js process, ensuring automatic restarts and logging. The SQLite database will be stored on the droplet with regular backups.

**Tech Stack:** Ubuntu 22.04 LTS, Node.js 18+, Express.js, SQLite3, Nginx, PM2, Let's Encrypt (SSL/TLS), Git

## Global Constraints

- Node.js version: 18.x or higher (required for full ES2020+ support)
- SQLite3: v5.1.6 (as specified in package.json)
- Environment: Production (no Electron, headless Node.js only)
- Database location: `/var/www/eau-cure/data/eau-cure.db` (persistent storage)
- Application root: `/var/www/eau-cure`
- Process manager: PM2 with auto-startup
- SSL/TLS: Let's Encrypt with auto-renewal via Certbot
- Domain requirement: Valid domain name pointing to droplet IP (configure before SSL setup)
- Droplet IP: 165.232.175.101

---

## Task 1: Digital Ocean Droplet Setup & Initial Configuration

**Files:**
- N/A (infrastructure setup)

**Interfaces:**
- Produces: Droplet with public IP, SSH access, Node.js installed, firewall configured

- [ ] **Step 2: SSH into the droplet**

Open terminal/PowerShell and run:
```bash
ssh root@165.232.175.101
```

When prompted for password, enter the password from your Digital Ocean email.

**Expected:** Logged in as `root@ubuntu` with shell prompt

- [ ] **Step 3: Create non-root user for security**

```bash
adduser eaucure
# Follow prompts, set a strong password

# Add user to sudo group
usermod -aG sudo eaucure

# Switch to new user
su - eaucure
```

**Expected:** Logged in as `eaucure` user with sudo access

- [ ] **Step 4: Update system packages**

```bash
sudo apt update
sudo apt upgrade -y
```

**Expected:** All packages updated successfully

- [ ] **Step 5: Install Node.js 18**

```bash
# Add NodeSource repository for Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs git curl wget build-essential
```

Verify installation:
```bash
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher
```

**Expected:** Both commands return version numbers

- [ ] **Step 6: Install PM2 globally**

```bash
sudo npm install -g pm2
```

**Expected:** PM2 installed and available globally

- [ ] **Step 7: Configure firewall**

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (critical!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verify rules
sudo ufw status
```

**Expected:** Firewall enabled with SSH, HTTP, HTTPS allowed; output shows "active"

- [ ] **Step 8: Commit this stage**

This is infrastructure setup, no code commit needed. Document the droplet IP in your project notes or team wiki.

---

## Task 2: Clone Project & Prepare Environment

**Files:**
- Create: `/var/www/eau-cure/.env` (environment variables)
- Modify: `/var/www/eau-cure/server.js` (if PORT needs override, but not required)

**Interfaces:**
- Produces: Project code deployed, .env configured, npm dependencies installed, database directory ready

- [ ] **Step 1: Create application directory**

```bash
sudo mkdir -p /var/www/eau-cure
sudo chown eaucure:eaucure /var/www/eau-cure
cd /var/www/eau-cure
```

**Expected:** Directory created and owned by eaucure user

- [ ] **Step 2: Clone project from GitHub**

```bash
cd /var/www/eau-cure
git clone https://github.com/YOUR_USERNAME/eau-cure-final-version.git .
# Replace YOUR_USERNAME with your GitHub username
# Note the dot (.) at end to clone into current directory
```

If you haven't set up SSH keys for GitHub on this droplet, use HTTPS:
```bash
git clone https://github.com/YOUR_USERNAME/eau-cure-final-version.git .
```

**Expected:** All project files present in `/var/www/eau-cure`

- [ ] **Step 3: Verify project structure**

```bash
ls -la
# Should show: main.js, server.js, database.js, package.json, public/, data/, etc.
```

**Expected:** All expected files and directories present

- [ ] **Step 4: Install npm dependencies**

```bash
cd /var/www/eau-cure
npm install
```

This will take 2-3 minutes.

**Expected:** `node_modules` directory created, no major errors (warnings are OK)

- [ ] **Step 5: Create data directory for database**

```bash
mkdir -p /var/www/eau-cure/data
mkdir -p /var/www/eau-cure/data/uploads
```

**Expected:** Directories created

- [ ] **Step 6: Create .env file with environment variables**

```bash
cat > /var/www/eau-cure/.env << 'EOF'
PORT=3000
NODE_ENV=production
DB_PATH=/var/www/eau-cure/data/eau-cure.db
JWT_SECRET=your_very_secure_random_string_here_change_this
SESSION_SECRET=your_very_secure_session_secret_change_this
EOF
```

⚠️ **IMPORTANT:** Replace the JWT_SECRET and SESSION_SECRET with actual random strings. Generate them:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run this command twice, use first result for JWT_SECRET, second for SESSION_SECRET
```

Then edit the .env file:
```bash
nano /var/www/eau-cure/.env
# Paste the random strings, save with Ctrl+X, Y, Enter
```

**Expected:** .env file created with unique secret values

- [ ] **Step 7: Verify server.js can start**

```bash
cd /var/www/eau-cure
timeout 5 node server.js || true
# This will start the server and stop after 5 seconds (we expect it to timeout)
# Should see: "Server running on port 3000" message
```

**Expected:** Server starts without errors, listens on port 3000

- [ ] **Step 8: Commit this stage**

Not a code commit (already in git), but document this in your deployment log that the environment setup is complete.

---

## Task 3: Build React Frontend

**Files:**
- Build target: `/var/www/eau-cure/public/react-app/build/` (will be created)

**Interfaces:**
- Consumes: Express server expects React build at `public/react-app/build/` (as per server.js line 44)
- Produces: Static HTML/CSS/JS files optimized for production serving

- [ ] **Step 1: Check if React build exists**

```bash
ls -la /var/www/eau-cure/public/react-app/build/
```

**Expected:** If directory exists with files, React is already built. If not found or empty, proceed to step 2.

- [ ] **Step 2: Check for React source code**

```bash
find /var/www/eau-cure -name "package.json" -type f | grep -i react
```

**Expected:** Should find React package.json or indicate whether React source exists

- [ ] **Step 3: If React source exists, build it**

```bash
# Check if React build script exists
cat /var/www/eau-cure/public/react-app/package.json | grep '"build"'
```

If the build script exists:
```bash
cd /var/www/eau-cure/public/react-app
npm install
npm run build
```

This will create `build/` directory with optimized production files.

**Expected:** `build/` directory created with `index.html` and static assets

- [ ] **Step 4: If no React build exists, verify fallback**

The server.js has a fallback to `public/` directory (line 52). Check what's there:
```bash
ls -la /var/www/eau-cure/public/
```

**Expected:** Either React build exists or legacy public files are present for fallback

- [ ] **Step 5: Verify Express will find frontend**

```bash
# Test that one of these paths exists:
test -f /var/www/eau-cure/public/react-app/build/index.html && echo "React build found" || echo "Using fallback public files"
```

**Expected:** One of the paths exists and is verified

- [ ] **Step 6: Commit (if any new builds added to git)**

Not needed unless you committed build artifacts (which is unusual). Builds are typically gitignored.

---

## Task 4: Initialize Database & Run Seeds

**Files:**
- Create: `/var/www/eau-cure/data/eau-cure.db` (SQLite database)
- Reference: `database.js` (initialization), `scripts/createInitialUsers.js` (seeding)

**Interfaces:**
- Produces: SQLite database with schema, default users (Olimar/Admin as per git history)

- [ ] **Step 1: Initialize database**

The database.js module should auto-initialize on first run. Test it:
```bash
cd /var/www/eau-cure
node -e "const db = require('./database'); db.initializeDatabase().then(() => { console.log('Database initialized'); process.exit(0); }).catch(err => { console.error('Error:', err); process.exit(1); });"
```

**Expected:** Message says "Database initialized" and exits cleanly

- [ ] **Step 2: Check if database file was created**

```bash
ls -lh /var/www/eau-cure/data/eau-cure.db
```

**Expected:** Database file exists with size > 0 bytes

- [ ] **Step 3: Seed default users**

According to git history, there are default users (Olimar as Owner, Admin as Admin). Run the seed script:
```bash
cd /var/www/eau-cure
npm run seed
```

Or manually:
```bash
node scripts/createInitialUsers.js
```

**Expected:** Script runs without errors, default users created

- [ ] **Step 4: Verify database has data**

```bash
# Install sqlite3 CLI if not present
sudo apt install -y sqlite3

# Check tables
sqlite3 /var/www/eau-cure/data/eau-cure.db ".tables"
```

**Expected:** Output shows database tables (users, companies, deliveries, etc.)

- [ ] **Step 5: Backup initial database**

```bash
cp /var/www/eau-cure/data/eau-cure.db /var/www/eau-cure/data/eau-cure.db.initial-backup
```

**Expected:** Backup file created for reference

- [ ] **Step 6: Commit**

If you've added the database to Git (not recommended, but possible):
```bash
git add data/eau-cure.db
git commit -m "Initial database setup for production"
git push
```

More typically, the database is gitignored and managed on the server separately.

---

## Task 5: Configure PM2 Process Manager

**Files:**
- Create: `/var/www/eau-cure/ecosystem.config.js` (PM2 ecosystem file)
- Create: `/var/www/eau-cure/.env.production` (optional, for production-specific vars)

**Interfaces:**
- Produces: PM2 configuration for auto-starting, logging, monitoring

- [ ] **Step 1: Create PM2 ecosystem configuration file**

```bash
cat > /var/www/eau-cure/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'eau-cure-server',
      script: './server.js',
      cwd: '/var/www/eau-cure',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/eau-cure/error.log',
      out_file: '/var/log/eau-cure/out.log',
      log_file: '/var/log/eau-cure/combined.log',
      time: true
    }
  ]
};
EOF
```

**Expected:** ecosystem.config.js created in project root

- [ ] **Step 2: Create log directory**

```bash
sudo mkdir -p /var/log/eau-cure
sudo chown eaucure:eaucure /var/log/eau-cure
```

**Expected:** Log directory created with proper permissions

- [ ] **Step 3: Start the application with PM2**

```bash
cd /var/www/eau-cure
pm2 start ecosystem.config.js
```

**Expected:** Output shows "eau-cure-server" running with PID and online status

- [ ] **Step 4: Verify the application is running**

```bash
pm2 status
pm2 logs eau-cure-server --lines 20
```

**Expected:** Status shows "online", logs show no errors and "Server running on port 3000" message

- [ ] **Step 5: Configure PM2 to start on boot**

```bash
pm2 startup
# This outputs a command like: sudo env PATH=... pm2 startup ...
# Copy and run that exact command

# Then save the current PM2 configuration:
pm2 save
```

**Expected:** PM2 configured to auto-start on system reboot

- [ ] **Step 6: Test PM2 configuration**

```bash
# Restart the app
pm2 restart eau-cure-server

# Wait a moment then check status
sleep 2
pm2 status
```

**Expected:** App restarted and shows "online" status

- [ ] **Step 7: Commit ecosystem.config.js**

```bash
cd /var/www/eau-cure
git add ecosystem.config.js
git commit -m "Add PM2 ecosystem configuration for production"
git push
```

**Expected:** File committed and pushed to GitHub

---

## Task 6: Configure Nginx Reverse Proxy

**Files:**
- Create: `/etc/nginx/sites-available/eau-cure` (Nginx server block configuration)

**Interfaces:**
- Produces: Nginx configuration routing HTTP traffic to Express server on localhost:3000

- [ ] **Step 1: Install Nginx**

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Expected:** Nginx installed and running

- [ ] **Step 2: Create Nginx configuration file**

Replace `YOUR_DOMAIN` with your actual domain (e.g., eaucure.com):

```bash
sudo tee /etc/nginx/sites-available/eau-cure > /dev/null << 'EOF'
upstream eau_cure_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    client_max_body_size 50M;

    # Redirect HTTP to HTTPS (after SSL is set up, keep this)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;

    # SSL certificates (will be added by Certbot in Task 7)
    # ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;

    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://eau_cure_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://eau_cure_backend/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

Then replace `YOUR_DOMAIN` with your actual domain:
```bash
sudo sed -i 's/YOUR_DOMAIN/your-domain-com/g' /etc/nginx/sites-available/eau-cure
# Example: sudo sed -i 's/YOUR_DOMAIN/eaucure.com/g' /etc/nginx/sites-available/eau-cure
```

**Expected:** Configuration file created with correct domain

- [ ] **Step 3: Enable the site**

```bash
sudo ln -s /etc/nginx/sites-available/eau-cure /etc/nginx/sites-enabled/eau-cure
```

**Expected:** Symbolic link created

- [ ] **Step 4: Remove default site (optional but recommended)**

```bash
sudo rm /etc/nginx/sites-enabled/default
```

**Expected:** Default site disabled

- [ ] **Step 5: Test Nginx configuration**

```bash
sudo nginx -t
```

**Expected:** Output says "syntax is ok" and "test is successful"

- [ ] **Step 6: Reload Nginx**

```bash
sudo systemctl reload nginx
```

**Expected:** Command completes without errors

- [ ] **Step 7: Test HTTP connection**

Get your droplet IP:
```bash
curl http://165.232.175.101/
```

You should get a 301 redirect to HTTPS (this is expected before SSL is set up). Or test with curl:
```bash
curl -I http://165.232.175.101/
# Should show: HTTP/1.1 301 Moved Permanently
```

**Expected:** HTTP request returns 301 redirect or similar response (not connection refused)

- [ ] **Step 8: Commit (if storing Nginx config in repo)**

Typically Nginx configs aren't stored in the app repo. But if you want to document them:
```bash
# Just document in a deployment guide, don't commit to app repo
echo "Nginx configuration applied to /etc/nginx/sites-available/eau-cure"
```

No git commit needed for infrastructure configuration.

---

## Task 7: Set Up SSL/TLS with Let's Encrypt

**Files:**
- Create: `/etc/letsencrypt/live/YOUR_DOMAIN/` (certificates, auto-managed)
- Modify: `/etc/nginx/sites-available/eau-cure` (SSL directives uncommented)

**Interfaces:**
- Produces: Valid SSL certificate, auto-renewal every 60 days, HTTPS accessible

- [ ] **Step 1: Install Certbot**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

**Expected:** Certbot and Nginx plugin installed

- [ ] **Step 2: Obtain SSL certificate**

Replace `your-domain.com` with your actual domain:

```bash
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
# Example: sudo certbot certonly --nginx -d eaucure.com -d www.eaucure.com
```

Follow the prompts:
- Enter email address (for renewal notifications)
- Agree to terms
- Choose whether to share email (optional)

**Expected:** Certificate obtained, message shows "Congratulations!"

- [ ] **Step 3: Verify certificate files**

```bash
sudo ls -la /etc/letsencrypt/live/your-domain.com/
# Should show: fullchain.pem, privkey.pem, chain.pem, cert.pem
```

**Expected:** Certificate files present

- [ ] **Step 4: Uncomment SSL directives in Nginx config**

```bash
sudo sed -i 's/# ssl_certificate/ssl_certificate/g' /etc/nginx/sites-available/eau-cure
sudo sed -i "s|/YOUR_DOMAIN|/your-domain.com|g" /etc/nginx/sites-available/eau-cure
```

Or manually edit:
```bash
sudo nano /etc/nginx/sites-available/eau-cure
# Uncomment the two ssl_certificate lines, save with Ctrl+X
```

**Expected:** SSL directives now uncommented with correct paths

- [ ] **Step 5: Test and reload Nginx**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Expected:** Both commands report success

- [ ] **Step 6: Test HTTPS connection**

```bash
curl -I https://your-domain.com/
# Should show: HTTP/2 200 or HTTP/1.1 200 (success)
```

**Expected:** HTTPS request succeeds, shows certificate is valid

- [ ] **Step 7: Configure auto-renewal**

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

**Expected:** Renewal process runs without errors

- [ ] **Step 8: Verify application is accessible**

Visit your domain in a browser (replace with your actual domain):
```
https://your-domain.com
```

**Expected:** Application loads, lock icon shows valid certificate in browser

- [ ] **Step 9: Commit (document in deployment guide)**

Not a code commit. Document that SSL is set up for your domain.

---

## Task 8: Configure Firewall & Security Hardening

**Files:**
- N/A (system configuration only)

**Interfaces:**
- Produces: Hardened firewall rules, fail2ban protection against brute-force

- [ ] **Step 1: Verify firewall status**

```bash
sudo ufw status
```

**Expected:** Shows status "active" with rules for SSH (22), HTTP (80), HTTPS (443)

- [ ] **Step 2: Block Node.js port from external access**

The app runs on port 3000 but should only be accessed through Nginx on port 80/443:

```bash
sudo ufw deny 3000/tcp
sudo ufw status
```

**Expected:** Rule added showing 3000/tcp denied

- [ ] **Step 3: Install fail2ban to protect against brute-force attacks**

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

**Expected:** fail2ban installed and running

- [ ] **Step 4: Create fail2ban configuration for SSH**

```bash
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
destemail = YOUR_EMAIL@gmail.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 600
bantime = 3600
EOF
```

Replace `YOUR_EMAIL@gmail.com` with your email for failure notifications.

**Expected:** Configuration file created

- [ ] **Step 5: Restart fail2ban**

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

**Expected:** fail2ban running with no errors

- [ ] **Step 6: Disable root login over SSH (optional but recommended)**

```bash
sudo nano /etc/ssh/sshd_config
# Find the line "PermitRootLogin yes" and change to "PermitRootLogin no"
# Save with Ctrl+X

sudo systemctl restart ssh
```

**Expected:** SSH restarted, root login disabled

- [ ] **Step 7: Commit (document security measures)**

Document these firewall and security configurations in a DEPLOYMENT.md file in your repo:

```bash
cd /var/www/eau-cure
cat > DEPLOYMENT.md << 'EOF'
# Eau Cure Production Deployment

## Security Configuration
- UFW firewall enabled with SSH (22), HTTP (80), HTTPS (443) allowed
- Port 3000 (Node.js) blocked from external access (Nginx proxy only)
- fail2ban configured to protect SSH with 5-attempt max per 10 minutes
- Root login disabled via SSH

## SSL/TLS
- Let's Encrypt certificate for your-domain.com
- Auto-renewal configured with certbot.timer

## Application
- Express server managed by PM2 with auto-restart
- Nginx reverse proxy on ports 80/443
- Node.js process runs on localhost:3000 only
EOF

git add DEPLOYMENT.md
git commit -m "Document production deployment configuration"
git push
```

**Expected:** Documentation committed

---

## Task 9: Set Up Database Backups & Monitoring

**Files:**
- Create: `/usr/local/bin/backup-eau-cure.sh` (backup script)
- Create: `/etc/cron.d/eau-cure-backup` (automated backup cron job)

**Interfaces:**
- Produces: Automated daily database backups, monitoring logs

- [ ] **Step 1: Create backup script**

```bash
sudo tee /usr/local/bin/backup-eau-cure.sh > /dev/null << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/eau-cure"
DB_PATH="/var/www/eau-cure/data/eau-cure.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/eau-cure_$DATE.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database backup
cp "$DB_PATH" "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.db.gz" -mtime +30 -delete

# Log the backup
echo "$(date): Backup created at $BACKUP_FILE.gz" >> /var/log/eau-cure/backup.log
EOF

sudo chmod +x /usr/local/bin/backup-eau-cure.sh
```

**Expected:** Backup script created and executable

- [ ] **Step 2: Create backup directory**

```bash
sudo mkdir -p /var/backups/eau-cure
sudo chown eaucure:eaucure /var/backups/eau-cure
```

**Expected:** Directory created

- [ ] **Step 3: Test the backup script**

```bash
sudo /usr/local/bin/backup-eau-cure.sh
ls -la /var/backups/eau-cure/
```

**Expected:** Backup file created in `/var/backups/eau-cure/`

- [ ] **Step 4: Create cron job for automatic daily backups**

```bash
sudo tee /etc/cron.d/eau-cure-backup > /dev/null << 'EOF'
# Run database backup daily at 2 AM
0 2 * * * root /usr/local/bin/backup-eau-cure.sh
EOF
```

**Expected:** Cron job created

- [ ] **Step 5: Verify cron job is registered**

```bash
sudo crontab -l | grep backup
```

**Expected:** Shows the backup cron job

- [ ] **Step 6: Set up basic monitoring script**

```bash
sudo tee /usr/local/bin/check-eau-cure-health.sh > /dev/null << 'EOF'
#!/bin/bash

# Check if Express server is running
if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "$(date): Express server is running" >> /var/log/eau-cure/health.log
else
    echo "$(date): ALERT - Express server is NOT responding" >> /var/log/eau-cure/health.log
    # Optional: restart the app
    # cd /var/www/eau-cure && pm2 restart eau-cure-server
fi

# Check disk space
USAGE=$(df /var/www/eau-cure | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$USAGE" -gt 80 ]; then
    echo "$(date): ALERT - Disk usage at ${USAGE}%" >> /var/log/eau-cure/health.log
fi

# Check database file exists
if [ -f /var/www/eau-cure/data/eau-cure.db ]; then
    SIZE=$(du -h /var/www/eau-cure/data/eau-cure.db | cut -f1)
    echo "$(date): Database size: $SIZE" >> /var/log/eau-cure/health.log
else
    echo "$(date): ALERT - Database file not found" >> /var/log/eau-cure/health.log
fi
EOF

sudo chmod +x /usr/local/bin/check-eau-cure-health.sh
```

**Expected:** Health check script created and executable

- [ ] **Step 7: Create cron job for health checks**

```bash
sudo tee -a /etc/cron.d/eau-cure-backup > /dev/null << 'EOF'
# Run health check every 6 hours
0 */6 * * * root /usr/local/bin/check-eau-cure-health.sh
EOF
```

**Expected:** Health check cron job added

- [ ] **Step 8: Commit scripts (optional, for documentation)**

```bash
cd /var/www/eau-cure
mkdir -p deployment/scripts
cp /usr/local/bin/backup-eau-cure.sh deployment/scripts/
cp /usr/local/bin/check-eau-cure-health.sh deployment/scripts/

git add deployment/scripts/
git commit -m "Add backup and monitoring scripts for production"
git push
```

**Expected:** Scripts committed for reference

---

## Task 10: Final Testing & Verification

**Files:**
- N/A (testing only)

**Interfaces:**
- Verifies: All systems operational, application accessible, database responsive

- [ ] **Step 1: Test API endpoints**

```bash
# Get JWT token first (replace with actual credentials from database)
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"olimar","password":"password"}' \
  2>/dev/null | jq .

# If above fails, test unauthenticated endpoint:
curl -I http://127.0.0.1:3000/
```

**Expected:** API responds (200 OK or 401 if auth required)

- [ ] **Step 2: Check PM2 is running**

```bash
pm2 status
pm2 logs eau-cure-server --lines 5
```

**Expected:** Process shows "online" status, no critical errors in logs

- [ ] **Step 3: Verify database connectivity**

```bash
sqlite3 /var/www/eau-cure/data/eau-cure.db "SELECT COUNT(*) as user_count FROM users;"
```

**Expected:** Returns a number (row count of users table)

- [ ] **Step 4: Load test via browser**

Visit `https://your-domain.com` in a web browser.

**Expected:** Application loads, UI displays correctly, no console errors (press F12 to check)

- [ ] **Step 5: Test Socket.IO connection**

Open browser console (F12) and check for any WebSocket connection errors. Look for messages like:
- `connected` = Socket.IO working
- No connection errors = success

**Expected:** No Socket.IO errors in console

- [ ] **Step 6: Verify SSL certificate**

```bash
ssl-cert-check -f /etc/letsencrypt/live/your-domain.com/cert.pem
```

Or visit https://www.ssllabs.com/ssltest/ and enter your domain.

**Expected:** Certificate valid and shows green/excellent rating

- [ ] **Step 7: Check logs for errors**

```bash
tail -50 /var/log/eau-cure/combined.log
sudo tail -50 /var/log/nginx/error.log
```

**Expected:** No critical errors, typical request logs visible

- [ ] **Step 8: Test file upload (backup feature)**

If the app has a backup upload feature:
```bash
# Create a test backup file
cd /tmp
sqlite3 test.db "CREATE TABLE test(id INTEGER);"

# Upload via curl (example, adjust endpoint as needed):
curl -X POST http://127.0.0.1:3000/api/database/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.db"
```

**Expected:** Upload succeeds or returns appropriate error

- [ ] **Step 9: Commit final deployment notes**

```bash
cd /var/www/eau-cure
cat > DEPLOYMENT_SUCCESS.md << 'EOF'
# Deployment Successful

## Deployment Date
[DATE]

## Server Information
- Domain: your-domain.com
- Droplet IP: 165.232.175.101
- Node.js Version: 18.x
- Nginx: Configured as reverse proxy
- PM2: Managing Express server

## Verification Completed
- [x] Application accessible via HTTPS
- [x] API endpoints responding
- [x] Database initialized and accessible
- [x] SSL certificate valid
- [x] PM2 auto-restart configured
- [x] Backups scheduled daily
- [x] Firewall and security hardened

## Accessing the Application
- Main URL: https://your-domain.com
- Login with default credentials from seed script

## Maintenance Tasks
- SSL renewal: Automatic (certbot.timer)
- Database backups: Daily at 2 AM UTC
- Health checks: Every 6 hours

## Support
For issues:
1. Check PM2 logs: `pm2 logs eau-cure-server`
2. Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`
3. Check application logs: `tail -f /var/log/eau-cure/combined.log`
EOF

git add DEPLOYMENT_SUCCESS.md
git commit -m "Record successful production deployment to Digital Ocean"
git push
```

**Expected:** Documentation committed, deployment complete

---

**Plan complete and ready for execution!**