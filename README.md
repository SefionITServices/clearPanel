# hPanel - File Manager

A web-based control panel for AlmaLinux VPS with a powerful file manager interface. This is the first module of a complete cPanel-like control panel system.

## Features

✅ **File Manager**
- Browse directories with breadcrumb navigation
- Upload files (up to 100MB by default)
- Download files and folders (as ZIP)
- Create, rename, and delete files/folders
- Built-in text editor for common file types
- Modern, responsive UI with icons
- Real-time file operations

✅ **Security**
- Session-based authentication
- Path traversal protection
- Configurable root directory access
- Secure file operations

## Installation on AlmaLinux VPS

### 1. Install Node.js (if not already installed)

```bash
# Install Node.js 18.x LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install the Application

```bash
# Clone or upload the project to your VPS
cd /opt
sudo mkdir hpanel
cd hpanel

# If uploading files, use scp or sftp:
# scp -r ./project/* user@your-vps-ip:/opt/hpanel/

# Set up the application
sudo npm install

# Create environment configuration
sudo cp .env.example .env
sudo nano .env
```

### 3. Configure Environment Variables

Edit `.env` file:

```env
PORT=3000
SESSION_SECRET=your-random-secure-string-here

# Change these credentials!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=StrongPassword123!

# File Manager Settings
ROOT_PATH=/home
ALLOWED_EXTENSIONS=*
MAX_FILE_SIZE=104857600
```

**Important Security Notes:**
- Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` immediately
- Use a strong, random `SESSION_SECRET` (generate with: `openssl rand -hex 32`)
- Set `ROOT_PATH` to limit file access (e.g., `/home` or `/var/www`)

### 4. Set Up as a System Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/hpanel.service
```

Paste this configuration:

```ini
[Unit]
Description=VPS Control Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/vps-control-panel
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vps-panel

Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable hpanel

# Start the service
sudo systemctl start hpanel

# Check status
sudo systemctl status hpanel
```

### 5. Configure Firewall

```bash
# Open port 3000 (or your configured port)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-ports
```

### 6. Access the Panel

Open your browser and navigate to:
```
http://your-vps-ip:3000
```

Login with your configured credentials.

## Optional: Set Up with Nginx Reverse Proxy

For production use, it's recommended to use Nginx as a reverse proxy with SSL:

### Install Nginx

```bash
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Configure Nginx

```bash
sudo nano /etc/nginx/conf.d/vps-panel.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart Nginx:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Add SSL with Let's Encrypt

```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Usage

## Connectivity modes (Cloudflare Tunnel vs Direct IP)

If your ISP blocks port forwarding (CGNAT) or you're on a home/office network, you can expose hPanel using Cloudflare Tunnel without opening ports. Otherwise, you can host it directly via your public IP with Nginx.

- Direct (Public IP): open port 3334 or proxy via Nginx on 80/443; use A records at your registrar. Best for VPS.
- Cloudflare Tunnel: install cloudflared and map a hostname to http://localhost:3334; no port-forwarding needed.

See docs/CONNECTIVITY.md for step-by-step instructions and examples.

### File Manager Operations

- **Navigate**: Click on folders to open them, use breadcrumbs to go back
- **Upload**: Click "Upload" button, select file(s), and confirm
- **New Folder**: Click "New Folder", enter name
- **Select**: Click on any file/folder to select it
- **Delete**: Select item, click "Delete" (confirmation required)
- **Rename**: Select item, click "Rename", enter new name
- **Download**: Select file, click "Download"
- **Edit**: Double-click text files to open in built-in editor

### Service Management

```bash
# Start service
sudo systemctl start hpanel

# Stop service
sudo systemctl stop hpanel

# Restart service
sudo systemctl restart hpanel

# View logs
sudo journalctl -u hpanel -f

# Check status
sudo systemctl status hpanel
```

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u hpanel -n 50

# Check if port is already in use
sudo netstat -tulpn | grep 3000

# Test manually
cd /opt/hpanel
node server.js
```

### Permission errors

```bash
# Ensure correct ownership
sudo chown -R root:root /opt/hpanel

# Check file permissions
ls -la /opt/hpanel
```

### Can't access from browser

```bash
# Check firewall
sudo firewall-cmd --list-all

# Check if service is running
sudo systemctl status hpanel

# Check if port is listening
sudo netstat -tulpn | grep 3000
```

## Security Recommendations

1. **Change default credentials** immediately after first login
2. **Use HTTPS** with Nginx reverse proxy and SSL certificate
3. **Limit ROOT_PATH** to only necessary directories
4. **Set strong SESSION_SECRET** (32+ random characters)
5. **Regular updates**: Keep Node.js and dependencies updated
6. **Firewall**: Only open necessary ports
7. **Consider fail2ban** for brute-force protection
8. **Regular backups** of important data

## Future Modules

This file manager is the first module. Planned additions:

- 📊 System monitoring (CPU, RAM, Disk usage)
- 🗄️ Database management (MySQL, PostgreSQL)
- 🌐 Web server management (Nginx, Apache)
- 📧 Email management
- 🔐 User management
- 📦 Package manager
- 🔄 Backup & restore
- 📈 Analytics dashboard

## Development

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run in development mode with auto-reload
npm run dev

# Or run normally
npm start
```

### Project Structure

```
hpanel/
├── public/              # Frontend files
│   ├── index.html      # Main HTML
│   ├── css/
│   │   └── style.css   # Styles
│   └── js/
│       └── app.js      # Frontend JavaScript
├── routes/             # API routes
│   ├── auth.js         # Authentication
│   └── files.js        # File operations
├── server.js           # Main server
├── package.json        # Dependencies
├── .env               # Configuration (create from .env.example)
└── README.md          # This file
```

## License

MIT License - Feel free to modify and use for your projects.

## Support

For issues or questions, please check:
- Server logs: `sudo journalctl -u hpanel -f`
- Application logs in the browser console
- Ensure all dependencies are installed: `npm install`

---

**Note**: This is a development version. For production use, consider additional security measures and regular updates.
