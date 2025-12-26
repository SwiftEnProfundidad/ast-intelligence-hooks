
const { ValidationError } = require('../errors');

class Finding {
  constructor(ruleId, severity, message, filePath, line, platform) {
    this.validateInputs(ruleId, severity, message, filePath, line, platform);

    this.ruleId = ruleId;
    this.severity = this.normalizeSeverity(severity);
    this.message = message;
    this.filePath = filePath;
    this.line = line || 1;
    this.platform = platform ? platform.toLowerCase() : 'unknown';
    this.timestamp = new Date();
    this.id = this.generateId();
  }

  validateInputs(ruleId, severity, message, filePath, line, platform) {
    if (!ruleId || typeof ruleId !== 'string') {
      throw new ValidationError('Finding requires valid ruleId (string)', 'ruleId', ruleId);
    }

    const normalizedSeverity = this.normalizeSeverity(severity);
    if (!normalizedSeverity) {
      throw new ValidationError(`Invalid severity: ${severity}. Must be critical, high, medium, low, info, warning, or error`, 'severity', severity);
    }

    if (!message || typeof message !== 'string') {
      throw new ValidationError('Finding requires valid message (string)', 'message', message);
    }
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('Finding requires valid filePath (string)', 'filePath', filePath);
    }
  }

  normalizeSeverity(severity) {
    if (!severity) return null;

    const sev = severity.toLowerCase();

    const severityMap = {
      'error': 'high',
      'warning': 'medium',
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
      'info': 'info',
    };

    return severityMap[sev] || null;
  }

  generateId() {
    const hash = `${this.ruleId}:${this.filePath}:${this.line}:${this.timestamp.getTime()}`;
    return Buffer.from(hash).toString('base64').substring(0, 16);
  }

  isCritical() {
    return this.severity === 'critical';
  }

  isHigh() {
    return this.severity === 'high';
  }

  isMedium() {
    return this.severity === 'medium';
  }

  isLow() {
    return this.severity === 'low';
  }

  isInfo() {
    return this.severity === 'info';
  }

  isBlockingLevel() {
    return this.isCritical() || this.isHigh();
  }

  belongsToPlatform(platform) {
    return this.platform === platform.toLowerCase();
  }

  getSeverityWeight() {
    const weights = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };
    return weights[this.severity] || 0;
  }

  getTechnicalDebtHours() {
    const hoursPerSeverity = {
      critical: 4,
      high: 2,
      medium: 1,
      low: 0.5,
      info: 0,
    };
    return hoursPerSeverity[this.severity] || 0;
  }

  toJSON() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      severity: this.severity,
      message: this.message,
      filePath: this.filePath,
      line: this.line,
      platform: this.platform,
      timestamp: this.timestamp.toISOString(),
      technicalDebtHours: this.getTechnicalDebtHours(),
    };
  }

  static fromJSON(json) {
    const finding = new Finding(
      json.ruleId,
      json.severity,
      json.message,
      json.filePath,
      json.line,
      json.platform
    );
    if (json.timestamp) {
      finding.timestamp = new Date(json.timestamp);
    }
    if (json.id) {
      finding.id = json.id;
    }
    return finding;
  }

  toString() {
    return `[${this.severity.toUpperCase()}] ${this.ruleId} at ${this.filePath}:${this.line} - ${this.message}`;
  }
}

module.exports = Finding;
