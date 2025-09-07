#!/bin/bash

# FX Sign Tool - Application Deployment Script
# Run this after server-setup.sh

set -e  # Exit on any error

echo "🚀 Starting FX Sign Tool application deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the application root directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install additional production dependencies
npm install express cors helmet morgan compression dotenv
npm install socket.io ws
npm install pg sequelize  # PostgreSQL
npm install pm2 -g

# Build React application
echo "🏗️ Building React application..."
npm run build

# Create production environment file
echo "⚙️ Creating production environment configuration..."
cat > .env.production << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fxsigndb
DB_USER=fxuser
DB_PASSWORD=your_db_password

# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# Session Configuration
SESSION_SECRET=your_super_secret_session_key_here

# API Keys (if needed)
# OANDA_API_KEY=your_oanda_api_key
# OANDA_API_SECRET=your_oanda_api_secret

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/fxsign.log
EOF

# Create simple Express server if it doesn't exist
if [ ! -f "server.js" ]; then
    echo "🌐 Creating Express server..."
    cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for React development
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// API routes (placeholder)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// FX data endpoint (placeholder)
app.get('/api/fx-data', (req, res) => {
  // This would connect to your FX data source
  res.json({
    symbol: 'USD/JPY',
    price: 150.123,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FX Sign Tool server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📅 Started: ${new Date().toISOString()}`);
});

module.exports = app;
EOF
fi

# Create PM2 ecosystem configuration
echo "🔄 Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'fxsign',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '/var/log/fxsign-error.log',
    out_file: '/var/log/fxsign-out.log',
    log_file: '/var/log/fxsign-combined.log',
    merge_logs: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Set proper permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data .
chmod +x server.js

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 delete fxsign 2>/dev/null || echo "App not running, starting fresh..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup | grep sudo | bash || echo "PM2 startup may need manual configuration"

# Check application status
echo "📊 Application Status:"
pm2 status
pm2 logs fxsign --lines 10

echo ""
echo "✅ Application deployment completed!"
echo ""
echo "🎯 Final steps:"
echo "1. Update database password in .env.production"
echo "2. Configure your domain in Nginx: /etc/nginx/sites-available/fxsign"
echo "3. Install SSL certificate: certbot --nginx -d your-domain.com"
echo "4. Monitor logs: pm2 logs fxsign"
echo "5. Restart app: pm2 restart fxsign"
echo ""
echo "🌐 Your application should be running on:"
echo "- HTTP: http://$(hostname -I | awk '{print $1}'):3000"
echo "- With domain: http://your-domain.com (after DNS configuration)"
echo ""
echo "🔧 Useful commands:"
echo "- pm2 status         # Check app status"
echo "- pm2 logs fxsign    # View logs"
echo "- pm2 restart fxsign # Restart app"
echo "- pm2 stop fxsign    # Stop app"
echo "- pm2 delete fxsign  # Delete app"