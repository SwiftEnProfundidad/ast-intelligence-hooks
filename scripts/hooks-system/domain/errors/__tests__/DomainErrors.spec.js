const { DomainError, GuardError, EvidenceError } = require('../index');

describe('Domain Errors', () => {
    describe('DomainError', () => {
        it('should correctly identify fatal errors', () => {
            const fatalError = new DomainError('Fatal', 'CRITICAL_ERROR');
            const nonFatalError = new DomainError('Warn', 'VALIDATION_ERROR');

            expect(fatalError.isFatal()).toBe(true);
            expect(nonFatalError.isFatal()).toBe(false);
        });

        it('should provide correct logging levels', () => {
            const fatalError = new DomainError('Fatal', 'CRITICAL_ERROR');
            const nonFatalError = new DomainError('Warn', 'VALIDATION_ERROR');

            expect(fatalError.getLoggingLevel()).toBe('error');
            expect(nonFatalError.getLoggingLevel()).toBe('warn');
        });

        it('should serialize correctly to JSON including isFatal flag', () => {
            const error = new DomainError('Test', 'TEST_CODE');
            const json = error.toJSON();

            expect(json).toMatchObject({
                name: 'DomainError',
                message: 'Test',
                code: 'TEST_CODE',
                isFatal: false
            });
            expect(json.timestamp).toBeDefined();
            expect(json.stack).toBeDefined();
        });
    });

    describe('GuardError', () => {
        it('should create from violation using factory method', () => {
            const error = GuardError.fromViolation('Forbidden file', 'CommitGate');
            expect(error.message).toContain('Forbidden file');
            expect(error.details.gate).toBe('CommitGate');
            expect(error.code).toBe('GUARD_ERROR');
        });
    });

    describe('EvidenceError', () => {
        it('should create stale error via factory', () => {
            const error = EvidenceError.stale('/path/to/evidence', 300);
            expect(error.message).toContain('stale');
            expect(error.message).toContain('300s');
            expect(error.details.evidencePath).toBe('/path/to/evidence');
        });

        it('should create missing error via factory', () => {
            const error = EvidenceError.missing('/path/to/evidence');
            expect(error.message).toContain('not found');
            expect(error.details.evidencePath).toBe('/path/to/evidence');
        });
    });
});
