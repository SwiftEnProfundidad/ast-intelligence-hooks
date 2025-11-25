// ===== TOKEN MANAGEMENT SYSTEM =====
// Monitors and warns about token consumption

const fs = require('fs');
const path = require('path');

class TokenManager {
  constructor() {
    this.limit = 1000000;  // 1M tokens
    this.warningThresholds = [
      { percent: 75, level: 'INFO' },
      { percent: 85, level: 'WARNING' },
      { percent: 95, level: 'CRITICAL' }
    ];
    
    this.historyPath = '.audit_tmp/token-usage.jsonl';
    this.ensureHistoryFile();
  }
  
  ensureHistoryFile() {
    const dir = path.dirname(this.historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  /**
   * Estimate tokens used in current operation
   * @param {Array} violations - Violations array
   * @param {Object} report - Generated report
   * @returns {Object} Token usage estimate
   */
  estimate(violations, report) {
    // Rough estimation (actual usage tracked by AI)
    const baseTokens = 50000;  // Base session
    const violationTokens = violations.length * 100;  // ~100 tokens per violation
    const reportTokens = JSON.stringify(report).length / 4;  // ~4 chars per token
    
    const estimated = baseTokens + violationTokens + reportTokens;
    
    return {
      estimated,
      percentUsed: (estimated / this.limit) * 100,
      remaining: this.limit - estimated
    };
  }
  
  /**
   * Check if warning should be issued
   */
  checkWarnings(usage) {
    const percent = usage.percentUsed;
    
    for (const threshold of this.warningThresholds.reverse()) {
      if (percent >= threshold.percent) {
        return {
          shouldWarn: true,
          level: threshold.level,
          message: this.generateWarningMessage(threshold.level, usage)
        };
      }
    }
    
    return { shouldWarn: false };
  }
  
  generateWarningMessage(level, usage) {
    const messages = {
      INFO: `ℹ️  Token usage at ${Math.round(usage.percentUsed)}% (${usage.estimated.toLocaleString()} / ${this.limit.toLocaleString()})`,
      WARNING: `⚠️  HIGH token usage: ${Math.round(usage.percentUsed)}% - Consider wrapping up session soon`,
      CRITICAL: `🚨 CRITICAL token usage: ${Math.round(usage.percentUsed)}% - Session will end soon! Save context to .AI_EVIDENCE.json`
    };
    
    return messages[level] || messages.INFO;
  }
  
  /**
   * Record token usage
   */
  record(usage) {
    const entry = {
      timestamp: new Date().toISOString(),
      estimated: usage.estimated,
      percentUsed: usage.percentUsed,
      remaining: usage.remaining
    };
    
    fs.appendFileSync(this.historyPath, JSON.stringify(entry) + '\n');
  }
  
  /**
   * Get usage trend
   */
  getTrend() {
    if (!fs.existsSync(this.historyPath)) {
      return { trend: 'NO_DATA' };
    }
    
    const lines = fs.readFileSync(this.historyPath, 'utf8')
      .split('\n')
      .filter(l => l.trim());
    
    if (lines.length < 2) {
      return { trend: 'INSUFFICIENT_DATA' };
    }
    
    const history = lines.map(l => JSON.parse(l));
    const latest = history[history.length - 1];
    const first = history[0];
    
    const totalIncrease = latest.estimated - first.estimated;
    const avgPerEntry = totalIncrease / history.length;
    
    return {
      trend: totalIncrease > 500000 ? 'HIGH_CONSUMPTION' : 'NORMAL',
      totalUsed: latest.estimated,
      averagePerOperation: Math.round(avgPerEntry),
      entriesInSession: history.length,
      projectedToLimit: Math.round((this.limit - latest.estimated) / avgPerEntry)
    };
  }
}

module.exports = { TokenManager };

