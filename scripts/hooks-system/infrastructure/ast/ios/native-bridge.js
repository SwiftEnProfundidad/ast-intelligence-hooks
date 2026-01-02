const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pushFileFinding } = require('../ast-core');
const env = require(path.join(__dirname, '../../../config/env'));

function getStagedSwiftFiles(repoRoot) {
  try {
    return execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })
      .trim()
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(p => p.endsWith('.swift'));
  } catch {
    return [];
  }
}

async function runSwiftLintNative(findings) {
  try {
    const { getRepoRoot } = require('../ast-core');
    const projectRoot = getRepoRoot();
    const customRulesPath = path.join(projectRoot, 'CustomLintRules');
    const stagingOnly = env.get('STAGING_ONLY_MODE', '0') === '1';
    const stagedSwiftRel = stagingOnly ? getStagedSwiftFiles(projectRoot) : null;

    if (!fs.existsSync(customRulesPath)) {
      console.log('[SwiftLint Native] CustomLintRules package not found - skipping');
      return;
    }

    console.log('[SwiftLint Native] Building CustomLintRules...');

    try {
      execSync('swift build', {
        cwd: customRulesPath,
        stdio: 'pipe',
        timeout: 30000
      });
    } catch (buildError) {
      console.log('[SwiftLint Native] Build skipped (not critical)');
      return;
    }

    console.log('[SwiftLint Native] Running custom rules...');

    const result = execSync('swift run CustomLintAnalyzer', {
      cwd: customRulesPath,
      encoding: 'utf8',
      timeout: 60000
    });

    parseSwiftLintOutput(result, findings, {
      repoRoot: projectRoot,
      stagedSwiftRel
    });

    console.log('[SwiftLint Native] ✅ Custom rules executed');

  } catch (error) {
    console.log('[SwiftLint Native] Error:', error.message);
  }
}

function parseSwiftLintOutput(output, findings, options = {}) {
  const { repoRoot, stagedSwiftRel } = options;
  const stagingOnly = Array.isArray(stagedSwiftRel);
  const stagedAbs = stagingOnly && repoRoot
    ? new Set(stagedSwiftRel.map(rel => path.join(repoRoot, rel)))
    : null;

  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes('warning:') || line.includes('error:')) {
      const match = line.match(/(.+\.swift):(\d+):(\d+):\s*(warning|error):\s*(.+)/);
      if (match) {
        const [, filePath, lineNum, col, severity, message] = match;

        if (stagingOnly && stagedAbs) {
          const normalized = String(filePath || '');
          const isStaged = stagedAbs.has(normalized) || Array.from(stagedAbs).some(p => normalized.endsWith(p));
          if (!isStaged) {
            continue;
          }
        }

        const level = severity === 'error' ? 'high' : 'medium';
        const ruleId = extractRuleId(message);

        pushFileFinding(
          ruleId,
          level,
          filePath,
          parseInt(lineNum),
          parseInt(col),
          message,
          findings
        );
      }
    }
  }
}

function extractRuleId(message) {
  if (message.includes('SRP')) return 'ios.native.srp_cohesion';
  if (message.includes('OCP')) return 'ios.native.ocp_switch';
  if (message.includes('LSP')) return 'ios.native.lsp_contract';
  if (message.includes('ISP')) return 'ios.native.isp_protocol';
  if (message.includes('DIP')) return 'ios.native.dip_dependency';
  if (message.includes('Layer')) return 'ios.native.layer_validator';
  if (message.includes('Feature')) return 'ios.native.feature_first';
  if (message.includes('Anemic')) return 'ios.native.ddd_anemic';
  if (message.includes('Command') || message.includes('Query')) return 'ios.native.cqrs';
  if (message.includes('Singleton')) return 'ios.native.singleton';
  if (message.includes('Force unwrap')) return 'ios.native.force_unwrap';
  if (message.includes('weak self')) return 'ios.native.weak_self';
  if (message.includes('God Class')) return 'ios.native.god_class';
  if (message.includes('Magic')) return 'ios.native.magic_number';

  return 'ios.native.custom_rule';
}

module.exports = { runSwiftLintNative };
