const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

// Fix: zustand's package.json resolves `zustand/middleware` to its ESM file on web,
// which uses `import.meta.env` — a SyntaxError in Metro's non-module bundles.
// Force the CJS version (middleware.js) on web; it is identical in API but import.meta-free.
const existingResolveRequest = nativeWindConfig.resolver.resolveRequest;
nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'zustand/middleware') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
    };
  }
  if (existingResolveRequest) {
    return existingResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
