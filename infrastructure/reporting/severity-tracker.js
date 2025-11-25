// ===== SEVERITY TRACKER =====
// Tracks severity history across sessions for trend analysis

const fs = require('fs');
const path = require('path');

class SeverityTracker {
  constructor(historyPath = '.audit_tmp/severity-history.jsonl') {
    this.historyPath = historyPath;
    this.ensureHistoryFile();
  }
  
  ensureHistoryFile() {
    const dir = path.dirname(this.historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.historyPath)) {
      fs.writeFileSync(this.historyPath, '');
    }
  }
  
  /**
   * Record violations for this session
   */
  record(violations, gateResult) {
    const entry = {
      timestamp: new Date().toISOString(),
      commit: this.getCurrentCommit(),
      branch: this.getCurrentBranch(),
      summary: {
        total: violations.length,
        CRITICAL: violations.filter(v => v.severity === 'CRITICAL').length,
        HIGH: violations.filter(v => v.severity === 'HIGH').length,
        MEDIUM: violations.filter(v => v.severity === 'MEDIUM').length,
        LOW: violations.filter(v => v.severity === 'LOW').length
      },
      averageScore: this.calculateAverageScore(violations),
      gatePassed: gateResult.passed,
      blockedBy: gateResult.blockedBy
    };
    
    // Append to JSONL (JSON Lines format)
    fs.appendFileSync(this.historyPath, JSON.stringify(entry) + '\n');
    
    return entry;
  }
  
  /**
   * Get trend analysis (last N sessions)
   */
  getTrend(limit = 10) {
    const lines = fs.readFileSync(this.historyPath, 'utf8')
      .split('\n')
      .filter(l => l.trim())
      .slice(-limit);
    
    const history = lines.map(l => JSON.parse(l));
    
    if (history.length < 2) {
      return { trend: 'INSUFFICIENT_DATA', history };
    }
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const scoreDelta = latest.averageScore - previous.averageScore;
    const totalDelta = latest.summary.total - previous.summary.total;
    
    let trend = 'STABLE';
    if (scoreDelta > 10 || totalDelta > 5) trend = 'WORSENING';
    if (scoreDelta < -10 || totalDelta < -5) trend = 'IMPROVING';
    
    return {
      trend,
      latest,
      previous,
      scoreDelta,
      totalDelta,
      history
    };
  }
  
  getCurrentCommit() {
    try {
      return require('child_process').execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }
  
  getCurrentBranch() {
    try {
      return require('child_process').execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }
  
  calculateAverageScore(violations) {
    const withScores = violations.filter(v => v.severityScore);
    if (withScores.length === 0) return 0;
    
    return Math.round(withScores.reduce((sum, v) => sum + v.severityScore, 0) / withScores.length);
  }
}

module.exports = { SeverityTracker };

