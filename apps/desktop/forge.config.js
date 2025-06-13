module.exports = {
  packagerConfig: {
    name: 'CookbookAI',
    executableName: 'cookbook-ai',
    productName: '@cookbook-ai/source',
    asar: true,
    extraResources: [
      { "from": "./dist/backend", "to": "./backend" },
      { "from": "./dist/frontend/browser", "to": "./frontend" }
    ],
    rebuildConfig: {},
    osxUniversal: {
      x64ArchFiles: '*/**/*.{node,dylib}',
      arm64ArchFiles: '*/**/*.{node,dylib}',
    },
    osxSign: false,
    appBundleId: 'com.yourcompany.cookbookai',
    extendInfo: {
      LSUIElement: false
    }
  },
  hooks: {
    prePackage: async () => {
      const fs = require('fs');
      const path = require('path');

      // Check if frontend files exist
      const frontendPath = path.resolve('./dist/frontend/browser');
      const indexHtmlPath = path.join(frontendPath, 'index.html');

      if (!fs.existsSync(frontendPath)) {
        console.error('ERROR: Frontend directory does not exist:', frontendPath);
        console.error('Make sure to run the build command before packaging');
        process.exit(1);
      }

      if (!fs.existsSync(indexHtmlPath)) {
        console.error('ERROR: index.html does not exist:', indexHtmlPath);
        console.error('Make sure the frontend build completed successfully');
        process.exit(1);
      }

      console.log('Frontend files verified successfully');

      // Check if backend files exist
      const backendPath = path.resolve('./dist/backend');
      if (!fs.existsSync(backendPath)) {
        console.error('ERROR: Backend directory does not exist:', backendPath);
        console.error('Make sure to run the build command before packaging');
        process.exit(1);
      }

      console.log('Backend files verified successfully');
    },
    postPackage: async (forgeConfig, packageResult) => {
      console.log(`Built package at: ${packageResult.outputPaths[0]}`);
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ]
};
