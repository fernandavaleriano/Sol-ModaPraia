(function () {
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const DEFAULTS = {
    API_ORIGIN: isLocalHost ? 'http://localhost:3000' : window.location.origin,
    SITE_URL: isLocalHost ? 'http://127.0.0.1:5500/front-end' : window.location.origin,
    GOOGLE_CLIENT_ID: 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    WHATSAPP_PHONE: '5511999999999',
    PIX_KEY: 'SUA_CHAVE_PIX',
    ENABLE_MANUAL_PIX: false,
    ENABLE_WHATSAPP_CHECKOUT: true
  };

  const runtimeConfig = window.SOL_RUNTIME_CONFIG || {};
  const config = { ...DEFAULTS, ...runtimeConfig };

  config.API_BASE_URL = `${config.API_ORIGIN.replace(/\/$/, '')}/api`;
  config.ADMIN_API_BASE_URL = `${config.API_BASE_URL}/admin`;

  window.SOL_CONFIG = config;
})();
