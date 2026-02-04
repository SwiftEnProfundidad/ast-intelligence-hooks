const { ValidationError } = require('../errors');

class Severity {
    constructor(value) {
        this.value = this.normalize(value);
        if (!this.value) {
            throw new ValidationError(`Invalid severity: ${value}`, 'severity', value);
        }
    }

    static get LEVELS() {
        return {
            CRITICAL: 'critical',
            HIGH: 'high',
            MEDIUM: 'medium',
            LOW: 'low',
            INFO: 'info'
        };
    }

    normalize(severity) {
        if (!severity) return null;

        const sev = severity.toLowerCase();
        const map = {
            'error': Severity.LEVELS.HIGH,
            'warning': Severity.LEVELS.MEDIUM,
            'critical': Severity.LEVELS.CRITICAL,
            'high': Severity.LEVELS.HIGH,
            'medium': Severity.LEVELS.MEDIUM,
            'low': Severity.LEVELS.LOW,
            'info': Severity.LEVELS.INFO
        };

        return map[sev] || null;
    }

    toString() {
        return this.value;
    }

    toUpperCase() {
        return this.value.toUpperCase();
    }

    isCritical() {
        return this.value === Severity.LEVELS.CRITICAL;
    }

    isHigh() {
        return this.value === Severity.LEVELS.HIGH;
    }

    isMedium() {
        return this.value === Severity.LEVELS.MEDIUM;
    }

    isLow() {
        return this.value === Severity.LEVELS.LOW;
    }

    isInfo() {
        return this.value === Severity.LEVELS.INFO;
    }

    isBlocking() {
        const mode = (process.env.AST_BLOCKING_MODE || 'DEFAULT').toUpperCase();
        if (mode === 'LEGACY') {
            return this.isCritical() || this.isHigh();
        }
        return this.isCritical() || this.isHigh() || this.isMedium() || this.isLow();
    }

    getWeight() {
        const weights = {
            [Severity.LEVELS.CRITICAL]: 4,
            [Severity.LEVELS.HIGH]: 3,
            [Severity.LEVELS.MEDIUM]: 2,
            [Severity.LEVELS.LOW]: 1,
            [Severity.LEVELS.INFO]: 0
        };
        return weights[this.value] || 0;
    }

    getDebtHours() {
        const hours = {
            [Severity.LEVELS.CRITICAL]: 4,
            [Severity.LEVELS.HIGH]: 2,
            [Severity.LEVELS.MEDIUM]: 1,
            [Severity.LEVELS.LOW]: 0.5,
            [Severity.LEVELS.INFO]: 0
        };
        return hours[this.value] || 0;
    }
}

module.exports = Severity;
