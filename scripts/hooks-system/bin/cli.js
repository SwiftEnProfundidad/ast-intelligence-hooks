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

let command = process.argv[2];
let args = process.argv.slice(3);

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

function getCurrentBranchSafe() {
  try {
    const output = execSync('git branch --show-current', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output.trim() || null;
  } catch (e) {
    return null;
  }
}

function getStagedFilesSafe() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output.trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

function getRecentCommitSubjects(limit = 10) {
  try {
    const output = execSync(`git log -n ${limit} --pretty=%s`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return String(output || '').split('\n').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function proposeHumanIntent({ evidence, branch, stagedFiles }) {
  const safeEvidence = (evidence && typeof evidence === 'object') ? evidence : {};
  const safeBranch = branch || safeEvidence.current_context?.current_branch || 'unknown';
  const staged = Array.isArray(stagedFiles) ? stagedFiles : [];

  const detectedPlatforms = ['ios', 'android', 'backend', 'frontend']
    .filter(p => safeEvidence.platforms && safeEvidence.platforms[p] && safeEvidence.platforms[p].detected);

  const gateStatus = safeEvidence.ai_gate?.status || safeEvidence.severity_metrics?.gate_status || 'unknown';

  const branchLower = String(safeBranch).toLowerCase();
  const hasIosTouch = staged.some(f => String(f).toLowerCase().endsWith('.swift')) || detectedPlatforms.includes('ios');
  const hasAndroidTouch = staged.some(f => /\.(kt|kts|java)$/i.test(String(f))) || detectedPlatforms.includes('android');
  const hasBackendTouch = staged.some(f => String(f).toLowerCase().includes('backend') || String(f).toLowerCase().includes('services/')) || detectedPlatforms.includes('backend');
  const hasFrontendTouch = staged.some(f => String(f).toLowerCase().includes('frontend') || /\.(tsx?|jsx?)$/i.test(String(f))) || detectedPlatforms.includes('frontend');

  const platforms = [
    hasIosTouch ? 'ios' : null,
    hasAndroidTouch ? 'android' : null,
    hasBackendTouch ? 'backend' : null,
    hasFrontendTouch ? 'frontend' : null
  ].filter(Boolean);

  const platformLabel = platforms.length > 0 ? platforms.join('+') : (detectedPlatforms.length > 0 ? detectedPlatforms.join('+') : 'repo');

  let primaryGoal = `Continue work on ${platformLabel} changes`;
  if (platformLabel === 'repo' && staged.length === 0 && detectedPlatforms.length === 0) {
    const subjects = getRecentCommitSubjects(12).join(' | ').toLowerCase();
    if (subjects.includes('token economy')) {
      primaryGoal = 'Continue token economy improvements (docs + MCP outputs)';
    } else if (subjects.includes('release') || subjects.includes('publish') || subjects.includes('version')) {
      primaryGoal = 'Continue release/publish workflow maintenance';
    } else if (subjects.includes('gitflow')) {
      primaryGoal = 'Continue Git Flow automation maintenance';
    } else if (subjects.includes('mcp')) {
      primaryGoal = 'Continue MCP automation maintenance';
    } else if (subjects.includes('readme') || subjects.includes('docs')) {
      primaryGoal = 'Continue documentation improvements';
    }
  }
  if (gateStatus === 'BLOCKED') {
    primaryGoal = `Unblock AI gate by fixing ${platformLabel} violations`;
  }

  if (branchLower.startsWith('fix/') || branchLower.startsWith('bugfix/') || branchLower.startsWith('hotfix/')) {
    primaryGoal = gateStatus === 'BLOCKED'
      ? `Unblock AI gate by fixing ${platformLabel} violations (bugfix)`
      : `Fix ${platformLabel} issues on ${safeBranch}`;
  }

  const secondary = [];
  if (gateStatus === 'BLOCKED') {
    secondary.push('Fix HIGH/CRITICAL violations first');
  }
  if (platforms.includes('ios')) {
    secondary.push('Keep tests compliant (makeSUT + trackForMemoryLeaks)');
  }

  const constraints = [];
  constraints.push('Do not bypass hooks (--no-verify)');
  constraints.push('Follow platform rules (rules*.mdc)');

  const confidence = platforms.length > 0 || detectedPlatforms.length > 0 ? 'medium' : 'low';

  return {
    primary_goal: primaryGoal,
    secondary_goals: secondary,
    non_goals: [],
    constraints,
    confidence_level: confidence,
    derived_from: {
      branch: safeBranch,
      staged_files_count: staged.length,
      platforms: platforms.length > 0 ? platforms : detectedPlatforms,
      gate_status: gateStatus
    }
  };
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

  'wrap-up': () => {
    commands['evidence:full-update']();
    try {
      const repoRoot = resolveRepoRoot();
      const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
      if (!fs.existsSync(evidencePath)) {
        return;
      }

      let evidence = {};
      try {
        evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      } catch {
        if (process.env.DEBUG) {
          process.stderr.write('[wrap-up] Failed to parse .AI_EVIDENCE.json\n');
        }
        return;
      }

      const branch = getCurrentBranchSafe();
      const stagedFiles = getStagedFilesSafe();
      const proposed = proposeHumanIntent({ evidence, branch, stagedFiles });

      const shouldSave = !process.argv.includes('--no-save');
      if (shouldSave) {
        const now = new Date();
        const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
        evidence.human_intent = {
          primary_goal: proposed.primary_goal,
          secondary_goals: proposed.secondary_goals || [],
          non_goals: proposed.non_goals || [],
          constraints: proposed.constraints || [],
          confidence_level: proposed.confidence_level || 'medium',
          set_by: 'wrap-up',
          set_at: now.toISOString(),
          expires_at: expiresAt,
          preserved_at: now.toISOString(),
          preservation_count: 0
        };

        try {
          fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');
        } catch (e) {
          if (process.env.DEBUG) {
            process.stderr.write(`[wrap-up] Failed to save human_intent: ${e && e.message ? e.message : String(e)}\n`);
          }
        }
      }

      console.log(`\n💡 Suggested Human Intent (${shouldSave ? 'auto-saved' : 'proposal only'}):`);
      console.log(`  Primary Goal: ${proposed.primary_goal}`);
      console.log(`  Secondary:    ${(proposed.secondary_goals || []).join(', ') || '(none)'}`);
      console.log(`  Constraints:  ${(proposed.constraints || []).join(', ') || '(none)'}`);
      console.log(`  Confidence:   ${proposed.confidence_level || 'unset'}`);
      console.log(`  Branch:       ${(proposed.derived_from && proposed.derived_from.branch) || '(unknown)'}`);
      console.log(`  Gate:         ${(proposed.derived_from && proposed.derived_from.gate_status) || '(unknown)'}`);

      const suggestedCmd = `ast-hooks intent set --goal="${proposed.primary_goal}" --confidence=${proposed.confidence_level || 'medium'} --expires=24h`;
      if (shouldSave) {
        console.log('\n✅ Saved to .AI_EVIDENCE.json');
        console.log('');
      } else {
        console.log('\n✅ To apply it, run:');
        console.log(`  ${suggestedCmd}`);
        console.log('');
      }
    } catch (error) {
      if (process.env.DEBUG) {
        process.stderr.write(`[wrap-up] Intent suggestion failed: ${error && error.message ? error.message : String(error)}\n`);
      }
      // Best-effort: wrap-up should succeed even if suggestion fails
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

    if (subcommand === 'suggest') {
      if (!fs.existsSync(evidencePath)) {
        console.log('❌ No .AI_EVIDENCE.json found');
        process.exit(1);
      }

      let evidence = {};
      try {
        evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      } catch (e) {
        console.log(`❌ Failed to read .AI_EVIDENCE.json: ${e.message}`);
        process.exit(1);
      }

      const branch = getCurrentBranchSafe();
      const stagedFiles = getStagedFilesSafe();
      const proposed = proposeHumanIntent({ evidence, branch, stagedFiles });

      console.log('\n💡 Suggested Human Intent (proposal only):');
      console.log(`  Primary Goal: ${proposed.primary_goal}`);
      console.log(`  Secondary:    ${(proposed.secondary_goals || []).join(', ') || '(none)'}`);
      console.log(`  Constraints:  ${(proposed.constraints || []).join(', ') || '(none)'}`);
      console.log(`  Confidence:   ${proposed.confidence_level || 'unset'}`);
      console.log(`  Branch:       ${(proposed.derived_from && proposed.derived_from.branch) || '(unknown)'}`);
      console.log(`  Gate:         ${(proposed.derived_from && proposed.derived_from.gate_status) || '(unknown)'}`);

      const suggestedCmd = `ast-hooks intent set --goal="${proposed.primary_goal}" --confidence=${proposed.confidence_level || 'medium'} --expires=24h`;
      console.log('\n✅ To apply it, run:');
      console.log(`  ${suggestedCmd}`);
      console.log('');
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

    console.log('❌ Unknown subcommand. Use: show, suggest, set, clear');
    process.exit(1);
  },

  help: () => {
    console.log(`
AST Intelligence Hooks CLI v3.3.0

Usage:
  ast-hooks <command> [options]

Commands:
  audit            Run interactive audit menu
  wrap-up          End of day: refresh evidence + propose human intent (no writes)
  ast              Run AST Intelligence analysis only
  install          Install hooks in new project
  verify-policy    Verify --no-verify policy compliance
  progress         Show violation progress report
  health           Show hook-system health snapshot (JSON)
  gitflow          Check Git Flow compliance (check|reset)
  intent           Manage human intent (show|suggest|set|clear)
  help             Show this help message
  version          Show version

Examples:
  ast-hooks audit
  ast-hooks wrap-up
  ast-hooks ast
  ast-hooks install
  ast-hooks verify-policy
  ast-hooks progress
  ast-hooks health
  ast-hooks intent show
  ast-hooks intent suggest
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
    const pkg = require(path.join(__dirname, '../../../package.json'));
    console.log(`v${pkg.version}`);
  }
};

function runCli(argv = process.argv) {
  command = argv[2];
  args = argv.slice(3);

  if (!command || !commands[command]) {
    commands.help();
    process.exit(command ? 1 : 0);
  }
  commands[command]();
}

if (require.main === module) {
  runCli(process.argv);
}

module.exports = { commands, proposeHumanIntent, runCli };
