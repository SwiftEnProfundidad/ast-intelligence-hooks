const { execSync } = require('child_process');
const path = require('path');

class AutoExecuteAIStartUseCase {
  constructor(orchestrator, repoRoot) {
    this.orchestrator = orchestrator;
    this.repoRoot = repoRoot || process.cwd();
    this.updateEvidenceScript = path.join(
      this.repoRoot,
      'scripts/hooks-system/bin/update-evidence.sh'
    );
  }

  async execute(platforms, confidence) {
    if (!platforms || platforms.length === 0) {
      return {
        success: false,
        action: 'error',
        message: 'No platforms provided'
      };
    }

    if (confidence < 70) {
      return {
        success: true,
        action: 'ignored',
        confidence,
        message: `Confidence too low (${confidence}%) - threshold is 70%`
      };
    }

    if (confidence >= 90) {
      return await this.autoExecute(platforms, confidence);
    }

    return {
      success: true,
      action: 'ask',
      confidence,
      platforms,
      message: `Medium confidence (${confidence}%) - AI should ask user for confirmation`
    };
  }

  async autoExecute(platforms, confidence) {
    try {
      const platformsStr = platforms
        .map(p => p.platform || p)
        .filter(Boolean)
        .join(',');

      if (!platformsStr) {
        throw new Error('No valid platforms to execute');
      }

      const command = `bash "${this.updateEvidenceScript}" --auto --platforms "${platformsStr}"`;

      console.log(`[AutoExecuteAIStartUseCase] Executing: ${command}`);

      const output = execSync(command, {
        cwd: this.repoRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim();

      let parsedOutput;
      try {
        parsedOutput = JSON.parse(output);
      } catch (e) {
        parsedOutput = { raw: output };
      }

      return {
        success: true,
        action: 'auto-executed',
        confidence,
        platforms,
        message: `AI Start executed automatically for: ${platformsStr}`,
        output: parsedOutput
      };

    } catch (error) {
      console.error(`[AutoExecuteAIStartUseCase] Error:`, error.message);

      return {
        success: false,
        action: 'error',
        confidence,
        platforms,
        message: `Failed to execute ai-start: ${error.message}`,
        error: error.stderr || error.message
      };
    }
  }
}

module.exports = AutoExecuteAIStartUseCase;
