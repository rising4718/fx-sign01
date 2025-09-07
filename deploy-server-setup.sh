#!/bin/bash

# FX Sign Tool - Server Setup Script
# Ubuntu 24.04 LTS + Node.js 22 LTS + Nginx + PostgreSQL

set -e  # Exit on any error

echo "🚀 Starting FX Sign Tool deployment setup..."
echo "📅 Date: $(date)"
echo "💻 Server: $(hostname -I | awk '{print $1}')"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt install -y curl wget git unzip build-essential software-properties-common ufw htop

# Install Node.js 22 LTS
echo "🟢 Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PM2 globally
echo "🔄 Installing PM2 process manager..."
npm install -g pm2

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable services
echo "🚀 Starting services..."
systemctl start nginx
systemctl enable nginx
systemctl start postgresql
systemctl enable postgresql

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432  # PostgreSQL
ufw --force enable

# Create database user and database
echo "🗃️ Setting up PostgreSQL database..."
sudo -u postgres createuser --interactive --pwprompt fxuser || echo "User may already exist"
sudo -u postgres createdb -O fxuser fxsigndb || echo "Database may already exist"

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /var/www/fxsign
cd /var/www/fxsign

# Set permissions
chown -R www-data:www-data /var/www/fxsign
chmod -R 755 /var/www/fxsign

# Clone repository (you'll need to set this up)
echo "📥 Cloning repository..."
echo "⚠️  Please run: git clone <YOUR_REPO_URL> ."
echo "⚠️  Then run: npm install"

# Create Nginx configuration
echo "🌐 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/fxsign << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Serve static files directly
    location /static/ {
        alias /var/www/fxsign/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/fxsign /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

echo "✅ Server setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Clone your repository to /var/www/fxsign"
echo "2. Run 'npm install' to install dependencies"
echo "3. Create .env file with database connection"
echo "4. Run 'npm run build' to build the React app"
echo "5. Start the app with PM2: 'pm2 start app.js --name fxsign'"
echo "6. Configure SSL: 'certbot --nginx -d your-domain.com'"
echo "7. Save PM2 configuration: 'pm2 save && pm2 startup'"
echo ""
echo "🌐 Server Status:"
echo "- Node.js: $(node --version)"
echo "- PM2: $(pm2 --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo "- PostgreSQL: $(sudo -u postgres psql --version)"
echo ""
echo "🚀 Ready for application deployment!"