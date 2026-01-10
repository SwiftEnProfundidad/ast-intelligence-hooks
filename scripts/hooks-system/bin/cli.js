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

function formatLocalTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const offsetMins = String(absolute % 60).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${sign}${offsetHours}:${offsetMins}`;
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
    try {
      execSync(`bash ${path.join(HOOKS_ROOT, 'presentation/cli/audit.sh')}`, { stdio: 'inherit' });
    } catch (err) {
      const status = (err && typeof err.status === 'number') ? err.status : 1;
      process.exit(status);
    }
  },

  'evidence:update': () => {
    const repoRoot = resolveRepoRoot();
    const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');

    let existing = {};
    try {
      if (fs.existsSync(evidencePath)) {
        const raw = fs.readFileSync(evidencePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          existing = parsed;
        }
      }
    } catch (e) {
      existing = {};
    }

    const next = {
      ...existing,
      timestamp: formatLocalTimestamp(),
      trigger: process.env.AUTO_EVIDENCE_TRIGGER ?? existing.trigger,
      reason: process.env.AUTO_EVIDENCE_REASON ?? existing.reason,
      summary: process.env.AUTO_EVIDENCE_SUMMARY ?? existing.summary,
      action: 'evidence:update'
    };

    fs.writeFileSync(evidencePath, JSON.stringify(next, null, 2), 'utf8');
    process.stdout.write(`${evidencePath}\n`);
  },

  'evidence:full-update': () => {
    const auditScript = path.join(HOOKS_ROOT, 'infrastructure/orchestration/intelligent-audit.js');

    if (!fs.existsSync(auditScript)) {
      console.error('❌ intelligent-audit.js not found');
      process.exit(1);
    }

    console.log('🔍 Running full AST analysis and updating evidence...');

    try {
      execSync(`node "${auditScript}"`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          AUTO_EVIDENCE_TRIGGER: process.env.AUTO_EVIDENCE_TRIGGER || 'manual',
          AUTO_EVIDENCE_REASON: process.env.AUTO_EVIDENCE_REASON || 'full_update',
          AUTO_EVIDENCE_SUMMARY: process.env.AUTO_EVIDENCE_SUMMARY || 'Full evidence update with AST analysis'
        }
      });

      console.log('✅ Evidence updated with full AST analysis');

      commands['evidence:update']();

    } catch (error) {
      console.error('❌ Failed to run full evidence update:', error.message);
      process.exit(1);
    }
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

  'intent': () => {
    const repoRoot = resolveRepoRoot();
    const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');

    const subcommand = args[0];

    if (!subcommand || subcommand === 'show') {
      if (!fs.existsSync(evidencePath)) {
        console.log('❌ No .AI_EVIDENCE.json found');
        process.exit(1);
      }
      const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      const intent = evidence.human_intent || {};
      console.log('\n🎯 Current Human Intent:');
      console.log(`  Primary Goal: ${intent.primary_goal || '(not set)'}`);
      console.log(`  Secondary:    ${(intent.secondary_goals || []).join(', ') || '(none)'}`);
      console.log(`  Non-Goals:    ${(intent.non_goals || []).join(', ') || '(none)'}`);
      console.log(`  Constraints:  ${(intent.constraints || []).join(', ') || '(none)'}`);
      console.log(`  Confidence:   ${intent.confidence_level || 'unset'}`);
      console.log(`  Expires:      ${intent.expires_at || '(never)'}`);
      console.log(`  Preserved:    ${intent.preservation_count || 0} times\n`);
      return;
    }

    if (subcommand === 'set') {
      const goalArg = args.find(a => a.startsWith('--goal='));
      const expiresArg = args.find(a => a.startsWith('--expires='));
      const confidenceArg = args.find(a => a.startsWith('--confidence='));
      const secondaryArg = args.find(a => a.startsWith('--secondary='));
      const nonGoalsArg = args.find(a => a.startsWith('--non-goals='));
      const constraintsArg = args.find(a => a.startsWith('--constraints='));

      if (!goalArg) {
        console.log('❌ Usage: ast-hooks intent set --goal="Your primary goal" [--expires=24h] [--confidence=high]');
        process.exit(1);
      }

      const goal = goalArg.split('=').slice(1).join('=');
      const expiresIn = expiresArg ? expiresArg.split('=')[1] : '24h';
      const confidence = confidenceArg ? confidenceArg.split('=')[1] : 'medium';
      const secondary = secondaryArg ? secondaryArg.split('=')[1].split(',').map(s => s.trim()) : [];
      const nonGoals = nonGoalsArg ? nonGoalsArg.split('=')[1].split(',').map(s => s.trim()) : [];
      const constraints = constraintsArg ? constraintsArg.split('=')[1].split(',').map(s => s.trim()) : [];

      const hoursMatch = expiresIn.match(/^(\d+)h$/);
      const daysMatch = expiresIn.match(/^(\d+)d$/);
      let expiresAt = null;
      if (hoursMatch) {
        expiresAt = new Date(Date.now() + parseInt(hoursMatch[1], 10) * 3600000).toISOString();
      } else if (daysMatch) {
        expiresAt = new Date(Date.now() + parseInt(daysMatch[1], 10) * 86400000).toISOString();
      }

      let evidence = {};
      if (fs.existsSync(evidencePath)) {
        evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      }

      evidence.human_intent = {
        primary_goal: goal,
        secondary_goals: secondary,
        non_goals: nonGoals,
        constraints: constraints,
        confidence_level: confidence,
        set_by: 'cli',
        set_at: new Date().toISOString(),
        expires_at: expiresAt,
        preserved_at: new Date().toISOString(),
        preservation_count: 0
      };

      fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
      console.log(`✅ Human intent set: "${goal}"`);
      console.log(`   Expires: ${expiresAt || 'never'}`);
      return;
    }

    if (subcommand === 'clear') {
      if (!fs.existsSync(evidencePath)) {
        console.log('❌ No .AI_EVIDENCE.json found');
        process.exit(1);
      }
      const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      evidence.human_intent = {
        primary_goal: null,
        secondary_goals: [],
        non_goals: [],
        constraints: [],
        confidence_level: 'unset',
        set_by: null,
        set_at: null,
        expires_at: null,
        preserved_at: new Date().toISOString(),
        preservation_count: 0,
        _hint: 'Set via CLI: ast-hooks intent set --goal="your goal"'
      };
      fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
      console.log('✅ Human intent cleared');
      return;
    }

    console.log('❌ Unknown subcommand. Use: show, set, clear');
    process.exit(1);
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
  intent           Manage human intent (show|set|clear)
  help             Show this help message
  version          Show version

Examples:
  ast-hooks audit
  ast-hooks ast
  ast-hooks install
  ast-hooks verify-policy
  ast-hooks progress
  ast-hooks health
  ast-hooks intent show
  ast-hooks intent set --goal="Implement feature X" --expires=24h
  ast-hooks intent clear

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

if (require.main === module) {
  if (!command || !commands[command]) {
    commands.help();
    process.exit(command ? 1 : 0);
  }
  commands[command]();
}

module.exports = { commands };
