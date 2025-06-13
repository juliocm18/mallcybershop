const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo SDK 53 specific resolver configuration for Node.js modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Disable problematic Node.js modules for React Native
  if (
    moduleName === 'ws' ||
    moduleName === 'stream' ||
    moduleName === 'crypto' ||
    moduleName === 'buffer' ||
    moduleName === 'util' ||
    moduleName === 'events' ||
    moduleName === 'fs' ||
    moduleName === 'path' ||
    moduleName === 'os' ||
    moduleName.startsWith('node:')
  ) {
    return {
      type: 'empty',
    };
  }
  
  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;