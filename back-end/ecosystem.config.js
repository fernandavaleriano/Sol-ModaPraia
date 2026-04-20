module.exports = {
  apps: [{
    name: 'sol-api',
    script: 'server.js',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000
    },
    // Reinicia automaticamente em caso de crash, mas limita para evitar loop
    max_restarts: 5,
    min_uptime: '10s',
    // Ignora mudanças em node_modules e .git
    ignore_watch: ['node_modules', '.git', 'data.json']
  }]
}