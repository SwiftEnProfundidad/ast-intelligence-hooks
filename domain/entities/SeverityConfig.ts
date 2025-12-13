export const SEVERITY_LEVELS = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
} as const;

export type SeverityLevel = keyof typeof SEVERITY_LEVELS;
export type SeverityValue = typeof SEVERITY_LEVELS[SeverityLevel];

export const SEVERITY_MAP: Record<string, string> = {
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

export const SEVERITY_ICONS: Record<string, string> = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢'
};

export const SEVERITY_LABELS: Record<string, string> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
};

export interface Violation {
    severity: string;
    message?: string;
    file?: string;
    line?: number;
    rule?: string;
}

/**
 * Severity Configuration Service
 * Centralized severity mapping and utilities
 */
export class SeverityConfig {
    static getSeverityValue(severity: string): string {
        return SEVERITY_MAP[severity] || 'MEDIUM';
    }

    static getSeverityIcon(severity: string): string {
        return SEVERITY_ICONS[this.getSeverityValue(severity)] || SEVERITY_ICONS.MEDIUM;
    }

    static getSeverityLabel(severity: string): string {
        return SEVERITY_LABELS[this.getSeverityValue(severity)] || SEVERITY_LABELS.MEDIUM;
    }

    static isBlocking(severity: string): boolean {
        const level = this.getSeverityValue(severity);
        return level === 'CRITICAL' || level === 'HIGH';
    }

    static filterBySeverity(violations: Violation[], severity: string): Violation[] {
        return violations.filter(v => this.getSeverityValue(v.severity) === severity);
    }

    static sortBySeverity(violations: Violation[]): Violation[] {
        return violations.sort((a, b) => {
            const aLevel = SEVERITY_LEVELS[this.getSeverityValue(a.severity) as SeverityLevel] || 0;
            const bLevel = SEVERITY_LEVELS[this.getSeverityValue(b.severity) as SeverityLevel] || 0;
            return bLevel - aLevel;
        });
    }

    static getSeverityNumericValue(severity: string): number {
        return SEVERITY_LEVELS[this.getSeverityValue(severity) as SeverityLevel] || 0;
    }

    static compareSeverity(a: string, b: string): number {
        return this.getSeverityNumericValue(b) - this.getSeverityNumericValue(a);
    }
}

export default SeverityConfig;
