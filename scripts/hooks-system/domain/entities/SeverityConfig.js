const SEVERITY_LEVELS = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
};

const SEVERITY_MAP = {
    'CRITICAL': 'CRITICAL',
    'HIGH': 'HIGH',
    'MEDIUM': 'MEDIUM',
    'LOW': 'LOW',
    'error': 'HIGH',
    'warning': 'MEDIUM',
    'info': 'LOW',
    'critical': 'CRITICAL',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW'
};

const SEVERITY_ICONS = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢'
};

const SEVERITY_LABELS = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
};

const BLOCKING_MODES = {
    STRICT: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    DEFAULT: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    LEGACY: ['CRITICAL', 'HIGH']
};

class SeverityConfig {
    static getBlockingMode() {
        const mode = (process.env.AST_BLOCKING_MODE || 'DEFAULT').toUpperCase();
        return BLOCKING_MODES[mode] || BLOCKING_MODES.DEFAULT;
    }

    static getSeverityValue(severity) {
        return SEVERITY_MAP[severity] || 'MEDIUM';
    }

    static getSeverityIcon(severity) {
        return SEVERITY_ICONS[this.getSeverityValue(severity)] || SEVERITY_ICONS.MEDIUM;
    }

    static getSeverityLabel(severity) {
        return SEVERITY_LABELS[this.getSeverityValue(severity)] || SEVERITY_LABELS.MEDIUM;
    }

    static isBlocking(severity) {
        const level = this.getSeverityValue(severity);
        const blockingSeverities = this.getBlockingMode();
        return blockingSeverities.includes(level);
    }

    static filterBySeverity(violations, severity) {
        return violations.filter(v => this.getSeverityValue(v.severity) === severity);
    }

    static sortBySeverity(violations) {
        return violations.sort((a, b) => {
            const aLevel = SEVERITY_LEVELS[this.getSeverityValue(a.severity)] || 0;
            const bLevel = SEVERITY_LEVELS[this.getSeverityValue(b.severity)] || 0;
            return bLevel - aLevel;
        });
    }
}

module.exports = {
    SEVERITY_LEVELS,
    SEVERITY_MAP,
    SEVERITY_ICONS,
    SEVERITY_LABELS,
    BLOCKING_MODES,
    SeverityConfig
};
