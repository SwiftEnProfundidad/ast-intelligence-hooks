const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pushFileFinding } = require('../ast-core');

async function runDetektNative(findings) {
  try {
    const { getRepoRoot } = require('../ast-core');
    const projectRoot = getRepoRoot();
    const customRulesPath = path.join(projectRoot, 'custom-rules');

    if (!fs.existsSync(customRulesPath)) {
      console.log('[Detekt Native] custom-rules module not found - skipping');
      return;
    }

    console.log('[Detekt Native] Building custom-rules...');

    try {
      execSync('./gradlew :custom-rules:build', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (buildError) {
      console.log('[Detekt Native] Build skipped (not critical)');
      return;
    }

    console.log('[Detekt Native] Running Detekt with custom rules...');

    const detektConfig = path.join(projectRoot, 'detekt.yml');
    const hasConfig = fs.existsSync(detektConfig);

    const configArg = hasConfig ? `--config ${detektConfig}` : '';
    const customRulesJar = path.join(customRulesPath, 'build/libs/custom-rules.jar');

    const cmd = `./gradlew detekt ${configArg} --plugins ${customRulesJar}`;

    const result = execSync(cmd, {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 120000
    });

    parseDetektOutput(result, findings);

    console.log('[Detekt Native] ✅ Custom rules executed');

  } catch (error) {
    if (error.stdout) {
      parseDetektOutput(error.stdout, findings);
    }
    console.log('[Detekt Native] Completed with violations');
  }
}

function parseDetektOutput(output, findings) {
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.match(/(.+\.kt):(\d+):(\d+):\s*(.+?)\s*\[(.+?)\]/);
    if (match) {
      const [, filePath, lineNum, col, message, ruleId] = match;

      const level = determineSeverity(ruleId);
      const mappedRuleId = mapDetektRuleId(ruleId);

      pushFileFinding(
        mappedRuleId,
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

function determineSeverity(ruleId) {
  if (ruleId.includes('SRP') || ruleId.includes('Singleton') || ruleId.includes('InstallIn')) {
    return 'high';
  }
  if (ruleId.includes('OCP') || ruleId.includes('Layer') || ruleId.includes('Encrypted')) {
    return 'high';
  }
  return 'medium';
}

const DETEKT_RULE_MAPPING = {
  'SRP': 'srp_cohesion',
  'OCP': 'ocp_when',
  'LSP': 'lsp_contract',
  'ISP': 'isp_interface',
  'DIP': 'dip_hilt',
  'Layer': 'layer_validator',
  'Feature': 'feature_first',
  'Anemic': 'ddd_anemic',
  'Command': 'cqrs',
  'Query': 'cqrs',
  'Singleton': 'singleton',
  'ForceUnwrap': 'force_unwrap'
};

function mapDetektRuleId(ruleId) {
  const prefix = 'android.native.';
  
  for (const [key, value] of Object.entries(DETEKT_RULE_MAPPING)) {
    if (ruleId.includes(key)) {
      return prefix + value;
    }
  }

  return prefix + ruleId.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

module.exports = { runDetektNative };
