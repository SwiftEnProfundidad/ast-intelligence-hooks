#!/usr/bin/env node

/**
 * Check installed version vs latest available
 * Helps detect when updates are available
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function getInstalledVersion() {
  const projectRoot = process.cwd();
  
  // Method 1: Try to resolve from installed npm package (works when installed from npm)
  try {
    const packageJsonPath = require.resolve('@pumuki/ast-intelligence-hooks/package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const packageRoot = path.dirname(path.dirname(packageJsonPath));
    
    // Check if it's a local file: installation
    const projectPkgPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(projectPkgPath)) {
      const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf-8'));
      const deps = { ...projectPkg.dependencies, ...projectPkg.devDependencies };
      const depVersion = deps['@pumuki/ast-intelligence-hooks'];
      
      if (depVersion && depVersion.startsWith('file:')) {
        return { version: pkg.version, type: 'local', path: packageRoot };
      }
    }
    
    return { version: pkg.version, type: 'npm', path: packageRoot };
  } catch (err) {
    // Package not installed or not resolvable
  }
  
  // Method 2: Try to get from project's package.json (for version range info)
  const projectPkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(projectPkgPath)) {
    const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf-8'));
    const deps = { ...projectPkg.dependencies, ...projectPkg.devDependencies };
    
    if (deps['@pumuki/ast-intelligence-hooks']) {
      let version = deps['@pumuki/ast-intelligence-hooks'];
      
      // Handle file: paths (local development)
      if (version.startsWith('file:')) {
        const libPath = path.resolve(projectRoot, version.replace('file:', ''));
        const libPackageJson = path.join(libPath, 'package.json');
        if (fs.existsSync(libPackageJson)) {
          const libPkg = JSON.parse(fs.readFileSync(libPackageJson, 'utf-8'));
          return { version: libPkg.version, type: 'local', path: libPath };
        }
        return { version: 'unknown (local)', type: 'local', path: libPath };
      }
      
      // If it's a version range, try to get actual installed version from node_modules
      const nodeModulesPath = path.join(projectRoot, 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'package.json');
      if (fs.existsSync(nodeModulesPath)) {
        const installedPkg = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf-8'));
        return { version: installedPkg.version, type: 'npm', declaredVersion: version };
      }
      
      // Fallback: return declared version range
      return { version: version.replace(/^[\^~]/, ''), type: 'npm', declaredVersion: version };
    }
  }
  
  // Method 3: Try direct node_modules path
  const nodeModulesPath = path.join(projectRoot, 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'package.json');
  if (fs.existsSync(nodeModulesPath)) {
    const pkg = JSON.parse(fs.readFileSync(nodeModulesPath, 'utf-8'));
    return { version: pkg.version, type: 'npm' };
  }
  
  // Method 4: Check if scripts are installed (but no package found)
  const scriptsPath = path.join(projectRoot, 'scripts', 'hooks-system');
  if (fs.existsSync(scriptsPath)) {
    // Scripts are installed but we can't determine version
    return { version: 'unknown', type: 'partial', message: 'Scripts installed but package not found in node_modules' };
  }
  
  return null;
}

function getLatestVersion() {
  try {
    // Try npm view
    const output = execSync('npm view @pumuki/ast-intelligence-hooks version', { 
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000
    });
    return output.trim();
  } catch (err) {
    return null;
  }
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  return 0;
}

function main() {
  console.log(`${COLORS.blue}╔══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.blue}║     AST Intelligence Hooks - Version Check                   ║${COLORS.reset}`);
  console.log(`${COLORS.blue}╚══════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
  
  const installed = getInstalledVersion();
  
  if (!installed) {
    console.log(`${COLORS.red}❌ ast-intelligence-hooks not found in this project${COLORS.reset}`);
    console.log(`\n${COLORS.cyan}Install it with:${COLORS.reset}`);
    console.log(`  npm install --save-dev @pumuki/ast-intelligence-hooks`);
    console.log(`  npm run install-hooks\n`);
    process.exit(1);
  }
  
  console.log(`${COLORS.cyan}Installed version:${COLORS.reset}`);
  console.log(`  ${COLORS.green}${installed.version}${COLORS.reset} (${installed.type})`);
  if (installed.path) {
    console.log(`  Path: ${installed.path}`);
  }
  if (installed.declaredVersion) {
    console.log(`  Declared in package.json: ${installed.declaredVersion}`);
  }
  if (installed.message) {
    console.log(`  ${COLORS.yellow}⚠️  ${installed.message}${COLORS.reset}`);
  }
  console.log();
  
  if (installed.type === 'local') {
    console.log(`${COLORS.yellow}ℹ️  Using local installation (development mode)${COLORS.reset}`);
    console.log(`  Updates come from the linked library directory.\n`);
    process.exit(0);
  }
  
  if (installed.type === 'partial') {
    console.log(`${COLORS.yellow}⚠️  Partial installation detected${COLORS.reset}`);
    console.log(`  It seems hooks are installed but the package is missing.\n`);
    console.log(`${COLORS.cyan}Try reinstalling:${COLORS.reset}`);
    console.log(`  npm install --save-dev @pumuki/ast-intelligence-hooks`);
    console.log(`  npm run install-hooks\n`);
    process.exit(0);
  }
  
  if (installed.version === 'unknown') {
    console.log(`${COLORS.red}❌ Cannot determine installed version${COLORS.reset}\n`);
    process.exit(1);
  }
  
  console.log(`${COLORS.cyan}Checking latest version on npm...${COLORS.reset}`);
  const latest = getLatestVersion();
  
  if (!latest) {
    console.log(`${COLORS.yellow}⚠️  Could not check latest version (network issue or package not published)${COLORS.reset}\n`);
    process.exit(0);
  }
  
  console.log(`  Latest: ${COLORS.green}${latest}${COLORS.reset}\n`);
  
  const comparison = compareVersions(installed.version, latest);
  
  if (comparison < 0) {
    // Installed is older
    console.log(`${COLORS.yellow}⚠️  UPDATE AVAILABLE${COLORS.reset}`);
    console.log(`\n${COLORS.cyan}To update:${COLORS.reset}`);
    console.log(`  1. Update package:${COLORS.reset}`);
    console.log(`     npm install --save-dev @pumuki/ast-intelligence-hooks@latest`);
    console.log(`\n  2. Re-install hooks (to get latest features):${COLORS.reset}`);
    console.log(`     npm run install-hooks`);
    console.log(`\n${COLORS.cyan}What's new in ${latest}:${COLORS.reset}`);
    console.log(`  Check CHANGELOG.md: https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/blob/main/CHANGELOG.md\n`);
    process.exit(0);
  } else if (comparison > 0) {
    // Installed is newer (beta/rc/development)
    console.log(`${COLORS.green}✅ You're running a newer version than published${COLORS.reset}`);
    console.log(`  This might be a development or beta version.\n`);
    process.exit(0);
  } else {
    // Same version
    console.log(`${COLORS.green}✅ You're up to date!${COLORS.reset}\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getInstalledVersion, getLatestVersion, compareVersions };

