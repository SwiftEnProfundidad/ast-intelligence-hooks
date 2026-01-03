const { execSync } = require('child_process');
const path = require('path');
const { ValidationError, ConfigurationError } = require('../../domain/errors');
const AuditLogger = require('../../application/services/logging/AuditLogger');

function resolveUpdateEvidenceScript(repoRoot) {
  const candidates = [
    path.join(repoRoot, 'scripts/hooks-system/bin/update-evidence.sh'),
    path.join(repoRoot, 'node_modules/@pumuki/ast-intelligence-hooks/bin/update-evidence.sh'),
    path.join(repoRoot, 'bin/update-evidence.sh')
  ];

  const fs = require('fs');
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

class AutoExecuteAIStartUseCase {
  constructor(orchestrator, repoRoot, logger = console) {
    this.orchestrator = orchestrator;
    this.repoRoot = repoRoot || process.cwd();
    this.logger = logger;
    this.updateEvidenceScript = resolveUpdateEvidenceScript(this.repoRoot);
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
        .map(p => {
          if (!p) return null;
          if (typeof p === 'object') return p.platform;
          return p;
        })
        .filter(Boolean)
        .join(',');

      if (!platformsStr) {
        throw new ValidationError('No valid platforms to execute', 'platforms');
      }

      if (!this.updateEvidenceScript) {
        throw new ConfigurationError('update-evidence.sh not found', 'updateEvidenceScript');
      }

      const command = `bash "${this.updateEvidenceScript}" --auto --platforms "${platformsStr}"`;

      this.logger.info(`[AutoExecuteAIStartUseCase] Executing AI Start`, { command, platforms: platformsStr });

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

      this.logger.info(`[AutoExecuteAIStartUseCase] Execution successful`, { platforms: platformsStr });

      return {
        success: true,
        action: 'auto-executed',
        confidence,
        platforms,
        message: `AI Start executed automatically for: ${platformsStr}`,
        output: parsedOutput
      };

    } catch (error) {
      this.logger.error(`[AutoExecuteAIStartUseCase] Execution failed`, { error: error.message, platforms });

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
