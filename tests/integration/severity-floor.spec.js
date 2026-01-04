const { evaluateViolations } = require('../../scripts/hooks-system/infrastructure/severity/severity-evaluator');

describe('severity floor', () => {
    it('should not downgrade CRITICAL base severity', () => {
        const violations = [
            {
                ruleId: 'ios.security.missing_ssl_pinning',
                severity: 'CRITICAL',
                filePath: '/tmp/LoginView.swift',
                line: 1,
                message: 'SSL pinning missing'
            }
        ];

        const evaluated = evaluateViolations(violations);

        expect(evaluated).toHaveLength(1);
        expect(evaluated[0].originalSeverity).toBe('CRITICAL');
        expect(evaluated[0].severity).toBe('CRITICAL');
    });

    it('should not downgrade HIGH base severity', () => {
        const violations = [
            {
                ruleId: 'ios.force_unwrapping',
                severity: 'HIGH',
                filePath: '/tmp/LoginView.swift',
                line: 1,
                message: 'Force unwrapping detected'
            }
        ];

        const evaluated = evaluateViolations(violations);

        expect(evaluated).toHaveLength(1);
        expect(evaluated[0].originalSeverity).toBe('HIGH');
        expect(['HIGH', 'CRITICAL']).toContain(evaluated[0].severity);
    });
});
