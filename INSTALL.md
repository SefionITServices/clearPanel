# hPanel Installation Guide

## Quick Install (Recommended)

For a fresh VPS/server installation:

```bash
git clone https://github.com/SefionITServices/hpanel.git
cd hpanel
sudo ./install.sh
```

The script will automatically:
- Detect your package manager (apt-get or dnf)
- Install Node.js 18+ if needed
- Create a dedicated `hpanel` system user
- Build and install the application to `/opt/hpanel`
- Configure systemd service
- Setup nginx reverse proxy
- Generate secure environment configuration

---

## Manual Installation

### Prerequisites

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y curl git nginx
```

#### CentOS/RHEL/AlmaLinux
```bash
sudo dnf install -y curl git nginx
```

### Install Node.js 18 LTS

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

#### CentOS/RHEL/AlmaLinux
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs
```

### Install hPanel

1. **Clone the repository**
   ```bash
   cd /opt
   sudo git clone https://github.com/SefionITServices/hpanel.git
   cd hpanel
   ```

2. **Create service user**
   ```bash
   sudo useradd -r -s /bin/false -d /opt/hpanel hpanel
   sudo mkdir -p /opt/hpanel/data
   sudo chown -R hpanel:hpanel /opt/hpanel
   ```

3. **Install backend dependencies**
   ```bash
   cd /opt/hpanel/backend
   sudo -u hpanel npm install
   ```

4. **Build backend**
   ```bash
   sudo -u hpanel npm run build
   ```

5. **Install and build frontend**
   ```bash
   cd /opt/hpanel/frontend
   sudo -u hpanel npm install
   sudo -u hpanel npm run build
   ```

6. **Configure environment**
   ```bash
   sudo nano /opt/hpanel/backend/.env
   ```
   
   Add the following (customize as needed):
   ```env
   NODE_ENV=production
   PORT=3334
   SESSION_SECRET=your-random-secret-here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   ROOT_PATH=/opt/hpanel/data
   ALLOWED_EXTENSIONS=*
   MAX_FILE_SIZE=104857600
   ```

7. **Setup systemd service**
   ```bash
   sudo cp /opt/hpanel/hpanel.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable hpanel
   sudo systemctl start hpanel
   ```

8. **Configure nginx**

   #### Ubuntu/Debian
   ```bash
   sudo cp /opt/hpanel/nginx.conf.example /etc/nginx/sites-available/hpanel
   sudo ln -s /etc/nginx/sites-available/hpanel /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

   #### CentOS/RHEL/AlmaLinux
   ```bash
   sudo cp /opt/hpanel/nginx.conf.example /etc/nginx/conf.d/hpanel.conf
   ```

   Edit the config and replace `your-domain.com` with your actual domain:
   ```bash
   # Ubuntu/Debian
   sudo nano /etc/nginx/sites-available/hpanel
   
   # CentOS/RHEL
   sudo nano /etc/nginx/conf.d/hpanel.conf
   ```

9. **Start nginx**
   ```bash
   sudo nginx -t
   sudo systemctl enable nginx
   sudo systemctl restart nginx
   ```

---

## Post-Installation

### Verify Installation

Check if hPanel is running:
```bash
sudo systemctl status hpanel
```

View logs:
```bash
sudo journalctl -u hpanel -f
```

### Access the Panel

Open your browser and navigate to:
- **HTTP**: `http://your-server-ip`
- **With domain**: `http://your-domain.com`

Default login:
- Username: `admin`
- Password: (whatever you set in `.env`)

### Setup SSL (Recommended)

Install Certbot:

#### Ubuntu/Debian
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

#### CentOS/RHEL
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update your nginx configuration for HTTPS.

---

## Updating

To update hPanel to the latest version:

```bash
cd /opt/hpanel
sudo ./deploy.sh
```

Or manually:
```bash
cd /opt/hpanel
sudo git pull
cd frontend
sudo -u hpanel npm install
sudo -u hpanel npm run build
cd ../backend
sudo -u hpanel npm install
sudo -u hpanel npm run build
sudo systemctl restart hpanel
```

---

## Firewall Configuration

### UFW (Ubuntu/Debian)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### firewalld (CentOS/RHEL)
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
sudo journalctl -u hpanel -n 50

# Check if port is in use
sudo ss -ltnp | grep :3334

# Check file permissions
ls -la /opt/hpanel/backend
```

### Nginx shows 502 Bad Gateway
```bash
# Verify backend is running
sudo systemctl status hpanel

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify nginx can connect to backend
curl http://localhost:3334/api/auth/status
```

### Can't login
```bash
# Verify environment variables
sudo cat /opt/hpanel/backend/.env

# Check session secret is set
sudo grep SESSION_SECRET /opt/hpanel/backend/.env

# Restart service after changing .env
sudo systemctl restart hpanel
```

### Permission issues
```bash
# Fix ownership
sudo chown -R hpanel:hpanel /opt/hpanel
sudo chown -R hpanel:hpanel /opt/hpanel/data

# Verify service user
id hpanel
```

---

## Service Management

```bash
# Start service
sudo systemctl start hpanel

# Stop service
sudo systemctl stop hpanel

# Restart service
sudo systemctl restart hpanel

# View status
sudo systemctl status hpanel

# View logs
sudo journalctl -u hpanel -f

# Enable on boot
sudo systemctl enable hpanel

# Disable on boot
sudo systemctl disable hpanel
```

---

## Uninstallation

```bash
# Stop and disable service
sudo systemctl stop hpanel
sudo systemctl disable hpanel
sudo rm /etc/systemd/system/hpanel.service

# Remove nginx config
sudo rm /etc/nginx/sites-enabled/hpanel    # Ubuntu/Debian
sudo rm /etc/nginx/sites-available/hpanel  # Ubuntu/Debian
sudo rm /etc/nginx/conf.d/hpanel.conf      # CentOS/RHEL

# Restart nginx
sudo systemctl restart nginx

# Remove application
sudo rm -rf /opt/hpanel

# Remove user
sudo userdel hpanel

# Reload systemd
sudo systemctl daemon-reload
```

---

## Security Recommendations

1. **Change default credentials immediately**
   ```bash
   sudo nano /opt/hpanel/backend/.env
   # Update ADMIN_USERNAME and ADMIN_PASSWORD
   sudo systemctl restart hpanel
   ```

2. **Use strong SESSION_SECRET**
   ```bash
   # Generate a new one
   openssl rand -hex 32
   ```

3. **Enable HTTPS with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

4. **Restrict file access**
   ```bash
   sudo chmod 600 /opt/hpanel/backend/.env
   ```

5. **Regular updates**
   ```bash
   cd /opt/hpanel
   sudo git pull
   sudo ./deploy.sh
   ```

6. **Monitor logs**
   ```bash
   sudo journalctl -u hpanel -f
   ```

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/SefionITServices/hpanel/issues
- Documentation: https://github.com/SefionITServices/hpanel
