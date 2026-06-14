const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// The monorepo root is two levels up from this app
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo root so Metro sees workspace packages
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve modules from the app first, then from the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Enable symlink support for pnpm's virtual store
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
