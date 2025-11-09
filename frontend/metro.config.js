const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Metro to listen on all interfaces (0.0.0.0) so it's accessible via LAN IP
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return middleware;
  },
};

// Override the default hostname
if (!config.server.rewriteRequestUrl) {
  config.server.rewriteRequestUrl = (url) => {
    // Replace localhost with LAN IP in URLs
    return url.replace(/localhost|127\.0\.0\.1/g, '192.168.1.76');
  };
}

module.exports = config;

