#!/usr/bin/env node

/**
 * AST Intelligence Hooks - Main CLI
 *
 * Unified CLI to run audits from any project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const command = process.argv[2];
const args = process.argv.slice(3);

const HOOKS_ROOT = path.join(__dirname, '..');

function isPidRunning(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

function readPidFile(pidPath) {
  try {
    if (!fs.existsSync(pidPath)) return null;
    const raw = fs.readFileSync(pidPath, 'utf8').trim();
    const pid = parseInt(raw, 10);
    return Number.isNaN(pid) ? null : pid;
  } catch (e) {
    return null;
  }
}

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

function getStagedSourceFiles(repoRoot) {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return out
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(file => /\.(ts|tsx|js|jsx|swift|kt)$/.test(file));
  } catch (e) {
    return [];
  }
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
    },
    guards: {
      realtime: {
        running: false
      },
      tokenMonitor: {
        running: false
      }
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
          }
        } catch (e) {
          result.astWatch.running = false;
        }
      } else {
        result.astWatch.pid = null;
      }
    } catch (e) {
      result.astWatch.error = e.message;
    }
  }

  if (fs.existsSync(logPath)) {
    result.astWatch.logPath = logPath;
  }

  const realtimePidPath = path.join(repoRoot, '.realtime-guard.pid');
  const tokenPidPath = path.join(repoRoot, '.token-monitor-guard.pid');
  const realtimePid = readPidFile(realtimePidPath);
  const tokenPid = readPidFile(tokenPidPath);

  if (realtimePid !== null) {
    result.guards.realtime.pid = realtimePid;
    result.guards.realtime.running = isPidRunning(realtimePid);
    if (!result.guards.realtime.running) {
      result.ok = false;
    }
  } else {
    result.ok = false;
  }

  if (tokenPid !== null) {
    result.guards.tokenMonitor.pid = tokenPid;
    result.guards.tokenMonitor.running = isPidRunning(tokenPid);
    if (!result.guards.tokenMonitor.running) {
      result.ok = false;
    }
  } else {
    result.ok = false;
  }

  return result;
}

function resolveGuardsScriptPath(repoRoot) {
  const candidates = [
    path.join(repoRoot, 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'bin', 'start-guards.sh'),
    path.join(HOOKS_ROOT, 'bin', 'start-guards.sh')
  ];

  return candidates.find(candidate => fs.existsSync(candidate));
}

const commands = {
  audit: () => {
    execSync(`bash ${path.join(HOOKS_ROOT, 'presentation/cli/audit.sh')}`, { stdio: 'inherit' });
  },

  ast: () => {
    const repoRoot = resolveRepoRoot();
    const stagedFiles = getStagedSourceFiles(repoRoot);
    const adapterCandidates = [
      path.join(repoRoot, 'scripts', 'hooks-system', 'bin', 'run-ast-adapter.js'),
      path.join(HOOKS_ROOT, 'bin', 'run-ast-adapter.js')
    ];
    const adapterPath = adapterCandidates.find(candidate => fs.existsSync(candidate));

    if (stagedFiles.length > 0 && adapterPath) {
      execSync(`node ${adapterPath}`, { stdio: 'inherit', cwd: repoRoot });
      return;
    }

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

  health: () => {
    const snapshot = buildHealthSnapshot();
    console.log(JSON.stringify(snapshot));
  },

  watch: () => {
    execSync(`node ${path.join(HOOKS_ROOT, 'bin/watch-hooks.js')}`, { stdio: 'inherit' });
  },

  guards: () => {
    const subcommand = args[0] || 'status';
    const allowed = new Set(['start', 'stop', 'restart', 'status', 'health']);
    if (!allowed.has(subcommand)) {
      console.error('Usage: ast-hooks guards {start|stop|restart|status|health}');
      process.exit(1);
    }

    if (subcommand === 'health') {
      const snapshot = buildHealthSnapshot();
      console.log(JSON.stringify(snapshot));
      process.exit(snapshot.ok ? 0 : 1);
    }

    const repoRoot = resolveRepoRoot();
    const startGuardsPath = resolveGuardsScriptPath(repoRoot);
    if (!startGuardsPath) {
      console.error('Unable to locate start-guards.sh');
      process.exit(1);
    }

    execSync(`bash ${startGuardsPath} ${subcommand}`, { stdio: 'inherit' });
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
  guards           Manage guards (start|stop|restart|status|health)
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
  ast-hooks guards restart
  ast-hooks gitflow

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
