#!/bin/bash
# Domain Web Server Setup Script for hPanel

DOMAIN=$1
DOMAIN_ROOT="/home/sefion/Domains/$DOMAIN"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain-name>"
    echo "Example: $0 example.com"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  Setting up web server for: $DOMAIN"
echo "═══════════════════════════════════════════════════════════════"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx not installed."
    echo ""
    read -p "Do you want to install Nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt update
        sudo apt install nginx -y
        echo "✅ Nginx installed successfully"
    else
        echo "Aborted. Please install Nginx manually: sudo apt install nginx"
        exit 1
    fi
fi

# Check if domain folder exists
if [ ! -d "$DOMAIN_ROOT" ]; then
    echo "⚠️  Domain folder not found: $DOMAIN_ROOT"
    read -p "Create domain in hPanel first. Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    mkdir -p "$DOMAIN_ROOT"
    echo "✅ Created domain folder"
fi

# Create Nginx config
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"
echo "📝 Creating Nginx configuration..."

sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name $DOMAIN www.$DOMAIN;
    
    root $DOMAIN_ROOT;
    index index.html index.htm index.php;
    
    # Logging
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # PHP support (if PHP-FPM is installed)
    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
EOF

echo "✅ Nginx config created: $NGINX_CONFIG"

# Enable site
if [ ! -L "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    sudo ln -s "$NGINX_CONFIG" "/etc/nginx/sites-enabled/$DOMAIN"
    echo "✅ Site enabled"
fi

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration test failed"
    echo "Please check the configuration and try again"
    exit 1
fi

# Create sample index.html if it doesn't exist
if [ ! -f "$DOMAIN_ROOT/index.html" ]; then
    cat > "$DOMAIN_ROOT/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to $DOMAIN</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3rem; margin: 0; }
        p { font-size: 1.2rem; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Welcome!</h1>
        <p>Your website <strong>$DOMAIN</strong> is now live!</p>
        <p>Upload your website files to: <code>$DOMAIN_ROOT</code></p>
    </div>
</body>
</html>
EOF
    echo "✅ Created sample index.html"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Point your domain DNS to this server:"
echo "   → Add A record: $DOMAIN → 204.83.99.245"
echo "   → Add A record: www.$DOMAIN → 204.83.99.245"
echo ""
echo "2. Open firewall ports (if needed):"
echo "   sudo ufw allow 80/tcp"
echo "   sudo ufw allow 443/tcp"
echo ""
echo "3. Configure router port forwarding:"
echo "   External Port 80 → 172.16.1.211:80"
echo "   External Port 443 → 172.16.1.211:443"
echo ""
echo "4. Add SSL certificate (recommended):"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "5. Upload your website files to:"
echo "   $DOMAIN_ROOT"
echo ""
echo "Test your site: http://$DOMAIN"
echo "═══════════════════════════════════════════════════════════════"
