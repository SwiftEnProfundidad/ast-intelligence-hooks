
const { ValidationError } = require('../errors');
const Severity = require('../values/Severity');

class Finding {
  constructor(ruleId, severity, message, filePath, line, platform) {
    this.validateInputs(ruleId, message, filePath);

    this.ruleId = ruleId;
    this.severity = new Severity(severity);
    this.message = message;
    this.filePath = filePath;
    this.line = line || 1;
    this.platform = platform ? platform.toLowerCase() : 'unknown';
    this.timestamp = new Date();
    this.id = this.generateId();
  }

  validateInputs(ruleId, message, filePath) {
    if (!ruleId || typeof ruleId !== 'string') {
      throw new ValidationError('Finding requires valid ruleId (string)', 'ruleId', ruleId);
    }
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Finding requires valid message (string)', 'message', message);
    }
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('Finding requires valid filePath (string)', 'filePath', filePath);
    }
  }

  generateId() {
    const hash = `${this.ruleId}:${this.filePath}:${this.line}:${this.timestamp.getTime()}`;
    return Buffer.from(hash).toString('base64').substring(0, 16);
  }

  isCritical() { return this.severity.isCritical(); }
  isHigh() { return this.severity.isHigh(); }
  isMedium() { return this.severity.isMedium(); }
  isLow() { return this.severity.isLow(); }
  isInfo() { return this.severity.isInfo(); }
  isBlockingLevel() { return this.severity.isBlocking(); }

  belongsToPlatform(platform) {
    return this.platform === platform.toLowerCase();
  }

  getSeverityWeight() {
    return this.severity.getWeight();
  }

  getTechnicalDebtHours() {
    return this.severity.getDebtHours();
  }

  toJSON() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      severity: this.severity.toString(),
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
