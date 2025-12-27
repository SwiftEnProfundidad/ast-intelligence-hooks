
class GenerateAuditReportUseCase {
  constructor(outputFormatter, auditAnalyzer, auditScorer) {
    this.outputFormatter = outputFormatter;
    this.auditAnalyzer = auditAnalyzer; // Inject Analyzer
    this.auditScorer = auditScorer;     // Inject Scorer
  }

  async execute(auditResult, options = {}) {
    const reportType = options.reportType || 'console';
    const includeSignature = options.includeSignature !== false;

    try {
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

      return report;

    } catch (error) {
      throw error;
    }
  }

  generateJSONReport(auditResult) {
    // AuditResult.toJSON already handles serialization via serializer
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
    const findings = auditResult.findings;

    // Use injected analyzer/scorer or fallback to helpers if not injected (for backward compat/tests)
    // Assuming for now they are passed or we use the ones attached to result if refactor isn't 100% complete in consumers
    // But target is to decouple. Let's assume we use the methods on result which we are about to move?
    // No, we are moving them OUT. So we must compute them here or use the helper.
    // To properly decouple, we should use the Analyzer here.

    // Fallback instantiation if not provided in DI (to keep robust)
    const AuditAnalyzer = require('../../domain/services/AuditAnalyzer');
    const AuditScorer = require('../../domain/services/AuditScorer');

    const scorer = this.auditScorer || new AuditScorer();
    const analyzer = this.auditAnalyzer || new AuditAnalyzer(scorer);

    if (includeSignature) {
      if (this.outputFormatter && this.outputFormatter.generateSignature) {
        lines.push(this.outputFormatter.generateSignature());
      } else {
        lines.push(this.generateDefaultSignature());
      }
      lines.push('');
    }

    lines.push('📊 AUDIT SUMMARY');
    lines.push('═'.repeat(60));
    lines.push(`Total Violations: ${auditResult.getTotalViolations()}`);

    const bySeverity = analyzer.getViolationsBySeverity(findings);
    lines.push(`  🔴 CRITICAL: ${bySeverity.critical}`);
    lines.push(`  🟠 HIGH:     ${bySeverity.high}`);
    lines.push(`  🟡 MEDIUM:   ${bySeverity.medium}`);
    lines.push(`  🟢 LOW:      ${bySeverity.low}`);
    lines.push('');

    const debt = scorer.calculateTechnicalDebt(findings);
    const maintainability = scorer.calculateMaintainabilityIndex(findings);

    lines.push(`⏱️  Technical Debt: ${debt.toFixed(1)} hours`);
    lines.push(`📈 Maintainability Index: ${maintainability.toFixed(1)}/100`);
    lines.push('');

    const byPlatform = analyzer.getViolationsByPlatform(findings);
    if (Object.keys(byPlatform).length > 0) {
      lines.push('🔧 BY PLATFORM');
      lines.push('─'.repeat(60));
      Object.entries(byPlatform).forEach(([platform, stats]) => {
        lines.push(`${platform.toUpperCase()}: ${stats.total} violations`);
        lines.push(`  Critical: ${stats.critical}, High: ${stats.high}, Medium: ${stats.medium}, Low: ${stats.low}`);
      });
      lines.push('');
    }

    const topRules = analyzer.getTopViolatedRules(findings, 5);
    if (topRules.length > 0) {
      lines.push('🔝 TOP VIOLATED RULES');
      lines.push('─'.repeat(60));
      topRules.forEach((rule, index) => {
        lines.push(`${index + 1}. ${rule.ruleId} (${rule.count}x) - Severity: ${rule.severity}`);
      });
      lines.push('');
    }

    const topFiles = analyzer.getTopViolatedFiles(findings, 5);
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

    if (includeSignature) {
      lines.push('');
      lines.push('═'.repeat(60));
      lines.push('');
      lines.push('  🐈💚 PUMUKI TEAM® - Advanced Project Intelligence');
      lines.push(`  Generated: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`);
      lines.push(`  Project: ${this.getProjectName()}`);
      lines.push('');
    }

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
