module.exports = {
  apps: [{
    name: 'fx-sign-backend',
    script: './backend/dist/server.js',
    cwd: '/var/www/fx-sign01',
    env: {
      PORT: 3002,
      NODE_ENV: 'production',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'fx_sign_db',
      DB_USER: 'fxuser',
      DB_PASSWORD: 'fxpass123'
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true,
    watch: false,
    log_file: '/var/log/pm2/fx-sign-backend.log',
    out_file: '/var/log/pm2/fx-sign-backend-out.log',
    error_file: '/var/log/pm2/fx-sign-backend-error.log',
    time: true
  }]
};