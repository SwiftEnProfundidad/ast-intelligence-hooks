#!/usr/bin/env node

/**
 * AST Intelligence Hooks - Main CLI
 * 
 * CLI unificado para ejecutar auditorías desde cualquier proyecto
 */

const { execSync } = require('child_process');
const path = require('path');

const command = process.argv[2];
const args = process.argv.slice(3);

const HOOKS_ROOT = path.join(__dirname, '..');

const commands = {
  audit: () => {
    execSync(`bash ${path.join(HOOKS_ROOT, 'presentation/cli/audit.sh')}`, { stdio: 'inherit' });
  },
  
  ast: () => {
    execSync(`node ${path.join(HOOKS_ROOT, 'infrastructure/ast/ast-intelligence.js')}`, { stdio: 'inherit' });
  },
  
  install: () => {
    execSync(`node ${path.join(HOOKS_ROOT, 'bin/install.js')}`, { stdio: 'inherit' });
  },
  
  'verify-policy': () => {
    execSync(`bash ${path.join(HOOKS_ROOT, 'bin/verify-no-verify.sh')}`, { stdio: 'inherit' });
  },
  
  'progress': () => {
    execSync(`bash ${path.join(HOOKS_ROOT, 'bin/generate-progress-report.sh')}`, { stdio: 'inherit' });
  },
  
  'gitflow': () => {
    const subcommand = args[0] || 'check';
    execSync(`bash ${path.join(HOOKS_ROOT, 'infrastructure/shell/gitflow-enforcer.sh')} ${subcommand}`, { stdio: 'inherit' });
  },
  
  help: () => {
    console.log(`
AST Intelligence Hooks CLI v3.3.0

Usage:
  ast-hooks <command> [options]

Commands:
  audit            Run interactive audit menu
  ast              Run AST Intelligence analysis only
  install          Install hooks in new project
  verify-policy    Verify --no-verify policy compliance
  progress         Show violation progress report
  gitflow          Check Git Flow compliance (check|reset)
  help             Show this help message
  version          Show version

Examples:
  ast-hooks audit
  ast-hooks ast
  ast-hooks install
  ast-hooks verify-policy
  ast-hooks progress

Environment Variables:
  GIT_BYPASS_HOOK=1    Bypass hook validation (emergency)
  DEBUG_AST=1          Enable AST debug logging
  AUDIT_STRICT=1       Force strict mode

Progress Tracking:
  Use 'progress' to see violations delta since baseline
  Reports saved in .audit-reports/ after each audit

Policy Verification:
  Use 'verify-policy' to check for unauthorized --no-verify usage
  See docs/NO_VERIFY_POLICY.md for details

Documentation:
  See scripts/hooks-system/docs/guides/USAGE.md
`);
  },
  
  version: () => {
    const pkg = require('../package.json');
    console.log(`v${pkg.version}`);
  }
};

if (!command || !commands[command]) {
  commands.help();
  process.exit(command ? 1 : 0);
}

commands[command]();

