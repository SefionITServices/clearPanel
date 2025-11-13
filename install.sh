#!/bin/bash
set -e

echo "🚀 Installing hPanel on VPS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/hpanel"
SERVICE_USER="hpanel"
SERVICE_FILE="hpanel.service"
NGINX_CONF="nginx.conf.example"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   echo "Usage: sudo ./install.sh"
   exit 1
fi

echo -e "${YELLOW}📋 Installing system dependencies...${NC}"
# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt-get"
    apt-get update
    apt-get install -y nodejs npm nginx git curl
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    dnf install -y nodejs npm nginx git curl
else
    echo -e "${RED}Unsupported package manager${NC}"
    exit 1
fi
    
    # Generate random session secret
    SESSION_SECRET=$(openssl rand -hex 32)
    sed -i "s/change-this-to-a-random-secure-string/$SESSION_SECRET/" .env
    
    echo "Configuration file created: .env"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env to change default credentials!"
    echo "   Default username: admin"
    echo "   Default password: admin123"
    echo ""
    read -p "Press Enter to edit .env now, or Ctrl+C to skip..."

# Install Node.js 18+ if not present
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}📦 Installing Node.js 18 LTS...${NC}"
    if [ "$PKG_MANAGER" = "apt-get" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        dnf install -y nodejs
    fi
fi

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    echo -e "${YELLOW}👤 Creating service user: $SERVICE_USER${NC}"
    useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
fi

# Create installation directory
echo -e "${YELLOW}📁 Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/data"

# Copy current directory to install location (if not already there)
if [ "$PWD" != "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}📋 Copying application files...${NC}"
    cp -r backend "$INSTALL_DIR/" 2>/dev/null || true
    cp -r frontend "$INSTALL_DIR/" 2>/dev/null || true
    cp hpanel.service "$INSTALL_DIR/" 2>/dev/null || true
    cp nginx.conf.example "$INSTALL_DIR/" 2>/dev/null || true
fi

# Set ownership
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd "$INSTALL_DIR/backend"
sudo -u "$SERVICE_USER" npm install

# Build backend
echo -e "${YELLOW}🔧 Building backend...${NC}"
sudo -u "$SERVICE_USER" npm run build

# Install frontend dependencies and build
echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd "$INSTALL_DIR/frontend"
sudo -u "$SERVICE_USER" npm install
sudo -u "$SERVICE_USER" npm run build

# Create environment file
echo -e "${YELLOW}📝 Creating environment configuration...${NC}"
cat > "$INSTALL_DIR/backend/.env" << EOF
# Server Configuration
NODE_ENV=production
PORT=3334

# Session Secret (CHANGE THIS!)
SESSION_SECRET=$(openssl rand -hex 32)

# Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# File Manager Settings
ROOT_PATH=/opt/hpanel/data
ALLOWED_EXTENSIONS=*
MAX_FILE_SIZE=104857600
EOF

chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/backend/.env"
chmod 600 "$INSTALL_DIR/backend/.env"

# Setup systemd service
echo -e "${YELLOW}⚙️  Setting up systemd service...${NC}"
cp "$INSTALL_DIR/hpanel.service" "/etc/systemd/system/hpanel.service"
systemctl daemon-reload
systemctl enable hpanel

# Configure nginx
echo -e "${YELLOW}🌐 Configuring nginx...${NC}"
cp "$INSTALL_DIR/nginx.conf.example" "/etc/nginx/sites-available/hpanel" 2>/dev/null || \
    cp "$INSTALL_DIR/nginx.conf.example" "/etc/nginx/conf.d/hpanel.conf"

if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf "/etc/nginx/sites-available/hpanel" "/etc/nginx/sites-enabled/hpanel"
    rm -f /etc/nginx/sites-enabled/default
fi

# Test and reload nginx
nginx -t && systemctl enable nginx && systemctl restart nginx

# Start hPanel service
echo -e "${YELLOW}🚀 Starting hPanel service...${NC}"
systemctl start hpanel

sleep 2

# Check status
if systemctl is-active --quiet hpanel; then
    echo ""
    echo -e "${GREEN}✅ Installation successful!${NC}"
    echo ""
    echo -e "${GREEN}hPanel is now running${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
    echo "1. Edit /opt/hpanel/backend/.env and change:"
    echo "   - ADMIN_USERNAME"
    echo "   - ADMIN_PASSWORD"
    echo "   - SESSION_SECRET (already generated)"
    echo ""
    echo "2. Edit nginx config:"
    echo "   /etc/nginx/sites-available/hpanel (Debian/Ubuntu)"
    echo "   /etc/nginx/conf.d/hpanel.conf (CentOS/RHEL)"
    echo "   Replace 'your-domain.com' with your actual domain"
    echo ""
    echo "3. Restart services:"
    echo "   sudo systemctl restart hpanel"
    echo "   sudo systemctl restart nginx"
    echo ""
    echo "4. (Optional) Setup SSL with Let's Encrypt:"
    echo "   sudo certbot --nginx -d your-domain.com"
    echo ""
    echo -e "${GREEN}Access your panel at: http://your-server-ip${NC}"
    echo ""
    echo "Useful commands:"
    echo "  View logs: sudo journalctl -u hpanel -f"
    echo "  Restart: sudo systemctl restart hpanel"
    echo "  Stop: sudo systemctl stop hpanel"
    echo ""
else
    echo -e "${RED}❌ Installation failed - service is not running${NC}"
    journalctl -u hpanel -n 50 --no-pager
    exit 1
fi
