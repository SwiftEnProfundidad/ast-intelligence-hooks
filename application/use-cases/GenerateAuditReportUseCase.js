
class GenerateAuditReportUseCase {
  constructor(outputFormatter) {
    this.outputFormatter = outputFormatter;
  }

  async execute(auditResult, options = {}) {
    const reportType = options.reportType || 'console'; // console | json | html
    const includeSignature = options.includeSignature !== false;

    try {
      console.log(`[GenerateAuditReportUseCase] Generating ${reportType} report...`);

      let report;

      switch (reportType) {
        case 'json':
          report = this.generateJSONReport(auditResult);
          break;
        case 'html':
          report = this.generateHTMLReport(auditResult);
          break;
        case 'console':
        default:
          report = this.generateConsoleReport(auditResult, includeSignature);
          break;
      }

      console.log(`[GenerateAuditReportUseCase] Report generated`);
      return report;

    } catch (error) {
      console.error(`[GenerateAuditReportUseCase] Error:`, error.message);
      throw error;
    }
  }

  generateJSONReport(auditResult) {
    return JSON.stringify(auditResult.toJSON(), null, 2);
  }

  generateHTMLReport(auditResult) {
    const json = auditResult.toJSON();
    const summary = json.summary;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .critical { color: #d32f2f; }
    .high { color: #f57c00; }
    .medium { color: #fbc02d; }
    .low { color: #388e3c; }
  </style>
</head>
<body>
  <h1>Professional Code Quality Audit Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Violations:</strong> ${summary.totalViolations}</p>
    <p><strong>Critical:</strong> <span class="critical">${summary.bySeverity.critical}</span></p>
    <p><strong>High:</strong> <span class="high">${summary.bySeverity.high}</span></p>
    <p><strong>Medium:</strong> <span class="medium">${summary.bySeverity.medium}</span></p>
    <p><strong>Low:</strong> <span class="low">${summary.bySeverity.low}</span></p>
    <p><strong>Technical Debt:</strong> ${summary.technicalDebtHours.toFixed(1)} hours</p>
    <p><strong>Maintainability Index:</strong> ${summary.maintainabilityIndex.toFixed(1)}/100</p>
  </div>
</body>
</html>`;
  }

  generateConsoleReport(auditResult, includeSignature) {
    const lines = [];

    if (includeSignature) {
      if (this.outputFormatter && this.outputFormatter.generateSignature) {
        lines.push(this.outputFormatter.generateSignature());
      } else {
        lines.push(this.generateDefaultSignature());
      }
      lines.push('');
    }

    // Summary
    lines.push('📊 AUDIT SUMMARY');
    lines.push('═'.repeat(60));
    lines.push(`Total Violations: ${auditResult.getTotalViolations()}`);

    const bySeverity = auditResult.getViolationsBySeverity();
    lines.push(`  🔴 CRITICAL: ${bySeverity.critical}`);
    lines.push(`  🟠 HIGH:     ${bySeverity.high}`);
    lines.push(`  🟡 MEDIUM:   ${bySeverity.medium}`);
    lines.push(`  🟢 LOW:      ${bySeverity.low}`);
    lines.push('');

    // Metrics
    lines.push(`⏱️  Technical Debt: ${auditResult.getTechnicalDebtHours().toFixed(1)} hours`);
    lines.push(`📈 Maintainability Index: ${auditResult.getMaintainabilityIndex().toFixed(1)}/100`);
    lines.push('');

    // By Platform
    const byPlatform = auditResult.getViolationsByPlatform();
    if (Object.keys(byPlatform).length > 0) {
      lines.push('🔧 BY PLATFORM');
      lines.push('─'.repeat(60));
      Object.entries(byPlatform).forEach(([platform, stats]) => {
        lines.push(`${platform.toUpperCase()}: ${stats.total} violations`);
        lines.push(`  Critical: ${stats.critical}, High: ${stats.high}, Medium: ${stats.medium}, Low: ${stats.low}`);
      });
      lines.push('');
    }

    // Top Violated Rules
    const topRules = auditResult.getTopViolatedRules(5);
    if (topRules.length > 0) {
      lines.push('🔝 TOP VIOLATED RULES');
      lines.push('─'.repeat(60));
      topRules.forEach((rule, index) => {
        lines.push(`${index + 1}. ${rule.ruleId} (${rule.count}x) - Severity: ${rule.severity}`);
      });
      lines.push('');
    }

    // Top Violated Files
    const topFiles = auditResult.getTopViolatedFiles(5);
    if (topFiles.length > 0) {
      lines.push('📁 TOP VIOLATED FILES');
      lines.push('─'.repeat(60));
      topFiles.forEach((file, index) => {
        const fileName = file.filePath.split('/').pop();
        lines.push(`${index + 1}. ${fileName} (${file.count} violations)`);
        lines.push(`   Critical: ${file.bySeverity.critical}, High: ${file.bySeverity.high}`);
      });
      lines.push('');
    }

    // Footer signature (always included)
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('');
    lines.push('  🐈💚 PUMUKI TEAM® - Advanced Project Intelligence');
    lines.push(`  Generated: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`);
    lines.push(`  Project: ${this.getProjectName()}`);
    lines.push('');

    return lines.join('\n');
  }

  getProjectName() {
    try {
      const packageJson = require('../../../../package.json');
      return packageJson.name || 'unknown-project';
    } catch {
      return 'unknown-project';
    }
  }

  generateDefaultSignature() {
    return `
╔═══════════════════════════════════════════════════════════╗
║   🐈💚 PUMUKI TEAM® - ARCHITECTURE COMPLIANCE AUDIT       ║
║   Generated: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}    ║
╚═══════════════════════════════════════════════════════════╝`;
  }
}

module.exports = GenerateAuditReportUseCase;
