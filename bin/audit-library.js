#!/usr/bin/env node

/**
 * Audit the library's own code
 * This script runs AST intelligence on the library itself to ensure
 * it follows its own rules (practice what we preach)
 */

const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${COLORS.blue}
╔════════════════════════════════════════════════════════════════╗
║        AST Intelligence - Library Self-Audit                   ║
║        "Practice What We Preach"                               ║
╚════════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

const libraryRoot = path.join(__dirname, '..');
const astScript = path.join(libraryRoot, 'infrastructure', 'ast', 'ast-intelligence.js');

console.log(`${COLORS.cyan}📋 Auditing library code at: ${libraryRoot}${COLORS.reset}\n`);

try {
  process.chdir(libraryRoot);
  
  console.log(`${COLORS.cyan}🔍 Running AST intelligence...${COLORS.reset}\n`);
  
  execSync(`node "${astScript}"`, {
    stdio: 'inherit',
    cwd: libraryRoot,
    env: {
      ...process.env,
      AUDIT_LIBRARY: 'true'
    }
  });
  
  console.log(`\n${COLORS.green}✅ Library audit completed${COLORS.reset}`);
  console.log(`${COLORS.yellow}📊 Check ast-summary.json for detailed results${COLORS.reset}\n`);
  
} catch (error) {
  console.error(`${COLORS.red}❌ Audit failed: ${error.message}${COLORS.reset}`);
  process.exit(1);
}

