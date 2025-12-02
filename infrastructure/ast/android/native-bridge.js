const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { pushFileFinding } = require('../ast-core');

async function runDetektNative(findings) {
  try {
    const customRulesPath = path.join(process.cwd(), 'custom-rules');

    if (!fs.existsSync(customRulesPath)) {
      console.log('[Detekt Native] custom-rules module not found - skipping');
      return;
    }

    console.log('[Detekt Native] Building custom-rules...');

    try {
      execSync('./gradlew :custom-rules:build', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000
      });
    } catch (buildError) {
      console.log('[Detekt Native] Build skipped (not critical)');
      return;
    }

    console.log('[Detekt Native] Running Detekt with custom rules...');

    const detektConfig = path.join(process.cwd(), 'detekt.yml');
    const hasConfig = fs.existsSync(detektConfig);

    const configArg = hasConfig ? `--config ${detektConfig}` : '';
    const customRulesJar = path.join(customRulesPath, 'build/libs/custom-rules.jar');

    const cmd = `./gradlew detekt ${configArg} --plugins ${customRulesJar}`;

    const result = execSync(cmd, {
      cwd: process.cwd(),
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

function mapDetektRuleId(ruleId) {
  const prefix = 'android.native.';

  if (ruleId.includes('SRP')) return prefix + 'srp_cohesion';
  if (ruleId.includes('OCP')) return prefix + 'ocp_when';
  if (ruleId.includes('LSP')) return prefix + 'lsp_contract';
  if (ruleId.includes('ISP')) return prefix + 'isp_interface';
  if (ruleId.includes('DIP')) return prefix + 'dip_hilt';
  if (ruleId.includes('Layer')) return prefix + 'layer_validator';
  if (ruleId.includes('Feature')) return prefix + 'feature_first';
  if (ruleId.includes('Anemic')) return prefix + 'ddd_anemic';
  if (ruleId.includes('Command') || ruleId.includes('Query')) return prefix + 'cqrs';
  if (ruleId.includes('Singleton')) return prefix + 'singleton';
  if (ruleId.includes('ForceUnwrap')) return prefix + 'force_unwrap';

  return prefix + ruleId.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

module.exports = { runDetektNative };
