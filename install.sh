#!/bin/bash

# hPanel Installation Script for AlmaLinux
# Run as root: sudo bash install.sh

set -e

echo "======================================"
echo "hPanel Installation Script"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: Please run as root (use sudo)"
    exit 1
fi

# Check OS
if [ ! -f /etc/almalinux-release ]; then
    echo "Warning: This script is designed for AlmaLinux"
    read -p "Continue anyway? (y/N): " continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
fi

echo "Step 1: Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    dnf install -y nodejs
    echo "Node.js installed: $(node --version)"
else
    echo "Node.js already installed: $(node --version)"
fi

echo ""
echo "Step 2: Creating application directory..."
INSTALL_DIR="/opt/hpanel"
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

echo ""
echo "Step 3: Installing dependencies..."
npm install

echo ""
echo "Step 4: Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    
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
    nano .env
else
    echo ".env already exists, skipping..."
fi

echo ""
echo "Step 5: Setting up systemd service..."
cp hpanel.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable hpanel
systemctl start hpanel

echo ""
echo "Step 6: Configuring firewall..."
if command -v firewall-cmd &> /dev/null; then
    PORT=$(grep PORT .env | cut -d '=' -f2)
    PORT=${PORT:-3000}
    firewall-cmd --permanent --add-port=${PORT}/tcp
    firewall-cmd --reload
    echo "Firewall configured for port $PORT"
else
    echo "firewalld not found, skipping firewall configuration"
fi

echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "Service Status:"
systemctl status hpanel --no-pager
echo ""
echo "Access the panel at: http://$(hostname -I | awk '{print $1}'):${PORT:-3000}"
echo ""
echo "⚠️  Security Reminders:"
echo "  1. Change default admin password in .env"
echo "  2. Restart service: sudo systemctl restart hpanel"
echo "  3. Consider setting up Nginx reverse proxy with SSL"
echo ""
echo "Useful commands:"
echo "  View logs: sudo journalctl -u hpanel -f"
echo "  Restart: sudo systemctl restart hpanel"
echo "  Stop: sudo systemctl stop hpanel"
echo ""
