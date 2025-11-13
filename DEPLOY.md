# hPanel - Internet Access Setup Guide

## Quick Start

Your server is accessible at:
- **Local Network**: http://192.168.x.x:3334
- **Internet**: http://204.83.99.245:3334 (after port forwarding)

## Method 1: Simple Port Forwarding (Quick)

### Step 1: Configure Firewall
```bash
# Allow port 3334
sudo ufw allow 3334/tcp
sudo ufw reload
```

### Step 2: Router Port Forwarding
1. Access your router admin panel (usually http://192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server" settings
3. Add new rule:
   - External Port: 3334
   - Internal IP: Your local IP (run `hostname -I`)
   - Internal Port: 3334
   - Protocol: TCP
4. Save and apply

### Step 3: Start Server
```bash
cd /home/hasim/Documents/project/hpanel
chmod +x start-online.sh
./start-online.sh
```

### Step 4: Test Access
From external network or mobile data:
```bash
curl http://204.83.99.245:3334/api/auth/status
```
Or visit: http://204.83.99.245:3334

---

## Method 2: Production Setup with Nginx + SSL (Recommended)

### Prerequisites
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### 1. Build for Production
```bash
cd /home/hasim/Documents/project/hpanel

# Build frontend
cd frontend
npm run build

# Build backend
cd ../backend
npm run build

# Copy frontend to backend public directory
mkdir -p public
cp -r ../frontend/dist/* public/
```

### 2. Configure Nginx
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/hpanel
sudo ln -s /etc/nginx/sites-available/hpanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL (HTTPS)
If you have a domain name:
```bash
sudo certbot --nginx -d yourdomain.com
```

For self-signed certificate (development):
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/hpanel.key \
  -out /etc/ssl/certs/hpanel.crt
```

### 4. Start with PM2 (Process Manager)
```bash
npm install -g pm2

# Start backend
cd /home/hasim/Documents/project/hpanel/backend
pm2 start dist/main.js --name hpanel

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

### 5. Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Or manually:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw reload
```

---

## Method 3: Use ngrok (No Port Forwarding Required)

For testing or if you can't configure router:

```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Sign up at https://ngrok.com and get auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Start backend
cd /home/hasim/Documents/project/hpanel/backend
node dist/main.js &

# Create tunnel
ngrok http 3334
```

You'll get a public URL like: `https://abc123.ngrok.io`

---

## Security Checklist

⚠️ **CRITICAL** - Before making public:

1. **Change Default Credentials**
   ```bash
   # Edit backend/.env
   ADMIN_USERNAME=your_username
   ADMIN_PASSWORD=strong_password_here
   SESSION_SECRET=random-32-character-string
   ```

2. **Use HTTPS** - Never expose HTTP on public internet
3. **Rate Limiting** - Consider adding rate limiting to prevent brute force
4. **Firewall Rules** - Only open necessary ports
5. **Regular Updates** - Keep dependencies updated
6. **Monitor Logs** - Check for suspicious activity
7. **Backup** - Regular backups of domains and DNS data

---

## Troubleshooting

### Can't access from internet:
1. Check firewall: `sudo ufw status`
2. Verify server is running: `lsof -i :3334`
3. Test locally first: `curl http://localhost:3334/api/auth/status`
4. Verify port forwarding in router
5. Check if ISP blocks port 3334 (try different port)

### Backend not starting:
```bash
# Check logs
tail -f /home/hasim/Documents/project/hpanel/logs/backend.log

# Check if port is in use
lsof -ti:3334 | xargs kill -9

# Rebuild
cd backend && npm run build
```

---

## Management Commands

```bash
# Start
./start-online.sh

# Stop
pm2 stop hpanel
# or
pkill -f "node dist/main.js"

# Restart
pm2 restart hpanel

# View logs
pm2 logs hpanel
# or
tail -f logs/backend.log

# Status
pm2 status
```

---

## Current Configuration

- **Backend Port**: 3334
- **Public IP**: 204.83.99.245
- **Local Path**: /home/hasim/Documents/project/hpanel
- **Domains Path**: /home/hasim/hpanel-domains

Access URLs:
- Development: http://localhost:8081 (Vite dev server)
- Production Backend: http://204.83.99.245:3334
- With Nginx: http://yourdomain.com (or https:// with SSL)
