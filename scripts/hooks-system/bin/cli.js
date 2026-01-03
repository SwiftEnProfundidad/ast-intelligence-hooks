#!/usr/bin/env node

/**
 * AST Intelligence Hooks - Main CLI
 *
 * Unified CLI to run audits from any project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const command = process.argv[2];
const args = process.argv.slice(3);

const HOOKS_ROOT = path.join(__dirname, '..');

function resolveRepoRoot() {
  try {
    const output = execSync('git rev-parse --show-toplevel', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const trimmed = output.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch (e) {
    return process.cwd();
  }
  return process.cwd();
}

function buildHealthSnapshot() {
  const repoRoot = resolveRepoRoot();
  const result = {
    ok: true,
    repoRoot,
    branch: null,
    evidence: {
      exists: false
    },
    astWatch: {
      running: false
    }
  };

  try {
    const branchOutput = execSync('git branch --show-current', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const branch = branchOutput.trim();
    if (branch) {
      result.branch = branch;
    }
  } catch (e) {
    result.branch = null;
  }

  const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
  if (fs.existsSync(evidencePath)) {
    result.evidence.exists = true;
    try {
      const raw = fs.readFileSync(evidencePath, 'utf8');
      const json = JSON.parse(raw);
      if (json && typeof json === 'object') {
        if (json.timestamp) {
          result.evidence.timestamp = json.timestamp;
        }
        if (json.session_id) {
          result.evidence.sessionId = json.session_id;
        }
        if (json.action) {
          result.evidence.action = json.action;
        }
      }
    } catch (e) {
      result.evidence.parseError = e.message;
      result.ok = false;
    }
  } else {
    result.ok = false;
  }

  const pidPath = path.join(repoRoot, '.ast_watch.pid');
  const logPath = path.join(repoRoot, '.ast_watch.log');
  if (fs.existsSync(pidPath)) {
    try {
      const pidRaw = fs.readFileSync(pidPath, 'utf8').trim();
      const pid = parseInt(pidRaw, 10);
      if (!Number.isNaN(pid)) {
        result.astWatch.pid = pid;
        try {
          const psOutput = execSync(`ps -p ${pid} -o args=`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
          if (psOutput && psOutput.includes('watch-hooks.js')) {
            result.astWatch.running = true;
            result.astWatch.command = psOutput.trim();
          } else {
            result.ok = false;
          }
        } catch (e) {
          result.ok = false;
        }
      } else {
        result.astWatch.pid = null;
        result.ok = false;
      }
    } catch (e) {
      result.astWatch.error = e.message;
      result.ok = false;
    }
  } else {
    result.ok = false;
  }

  if (fs.existsSync(logPath)) {
    result.astWatch.logPath = logPath;
  }

  return result;
}

const commands = {
  audit: () => {
    execSync(`bash ${path.join(HOOKS_ROOT, 'presentation/cli/audit.sh')}`, { stdio: 'inherit' });
  },

  'evidence:update': () => {
    const repoRoot = resolveRepoRoot();
    const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');

    const payload = {
      timestamp: new Date().toISOString(),
      trigger: process.env.AUTO_EVIDENCE_TRIGGER,
      reason: process.env.AUTO_EVIDENCE_REASON,
      summary: process.env.AUTO_EVIDENCE_SUMMARY,
      action: 'evidence:update'
    };

    fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2), 'utf8');
    process.stdout.write(`${evidencePath}\n`);
  },

  ast: () => {
    const filteredArgs = [];
    let stagingOnlyMode = false;

    for (const arg of args) {
      if (arg === '--staged') {
        stagingOnlyMode = true;
      } else {
        filteredArgs.push(arg);
      }
    }

    const execEnv = { ...process.env };
    if (stagingOnlyMode) {
      execEnv.STAGING_ONLY_MODE = '1';
    }

    execSync(
      `node ${path.join(HOOKS_ROOT, 'infrastructure/ast/ast-intelligence.js')} ${filteredArgs.join(' ')}`,
      { stdio: 'inherit', env: execEnv }
    );
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

  health: () => {
    const snapshot = buildHealthSnapshot();
    console.log(JSON.stringify(snapshot));
  },

  watch: () => {
    execSync(`node ${path.join(HOOKS_ROOT, 'bin/watch-hooks.js')}`, { stdio: 'inherit' });
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
  health           Show hook-system health snapshot (JSON)
  gitflow          Check Git Flow compliance (check|reset)
  help             Show this help message
  version          Show version

Examples:
  ast-hooks audit
  ast-hooks ast
  ast-hooks install
  ast-hooks verify-policy
  ast-hooks progress
  ast-hooks health

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
