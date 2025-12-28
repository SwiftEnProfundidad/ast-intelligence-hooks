
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
    this.platform = (platform || 'unknown').toLowerCase();
    this.timestamp = new Date();
    this.id = this.generateId();
    this.metadata = {};
  }

  validateInputs(ruleId, message, filePath) {
    if (!ruleId || typeof ruleId !== 'string' || ruleId.trim().length === 0) {
      throw new ValidationError('Finding requires non-empty ruleId (string)', 'ruleId', ruleId);
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('Finding requires non-empty message (string)', 'message', message);
    }
    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
      throw new ValidationError('Finding requires non-empty filePath (string)', 'filePath', filePath);
    }
  }

  generateId() {
    // Deterministic ID based on content, not timestamp, for better deduplication
    const hashData = `${this.ruleId}:${this.filePath}:${this.line}:${this.message}:${this.platform}`;
    return Buffer.from(hashData).toString('base64').substring(0, 16);
  }

  isCritical() { return this.severity.isCritical(); }
  isHigh() { return this.severity.isHigh(); }
  isMedium() { return this.severity.isMedium(); }
  isLow() { return this.severity.isLow(); }
  isInfo() { return this.severity.isInfo(); }
  isBlockingLevel() { return this.severity.isBlocking(); }

  belongsToPlatform(platform) {
    if (!platform) return false;
    return this.platform === platform.toLowerCase();
  }

  getSeverityWeight() {
    return this.severity.getWeight();
  }

  getTechnicalDebtHours() {
    return this.severity.getDebtHours();
  }

  getDisplayPath() {
    return `${this.filePath}:${this.line}`;
  }

  getFormattedSummary() {
    return `[${this.severity.toUpperCase()}] ${this.ruleId}: ${this.message} (${this.getDisplayPath()})`;
  }

  addMetadata(key, value) {
    this.metadata[key] = value;
    return this;
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
      metadata: this.metadata
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
    if (json.metadata) {
      finding.metadata = json.metadata;
    }
    return finding;
  }

  toString() {
    return this.getFormattedSummary();
  }
}

module.exports = Finding;
