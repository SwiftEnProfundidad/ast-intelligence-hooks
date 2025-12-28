const {
    DomainEvent,
    EvidenceStaleEvent,
    GitFlowViolationEvent,
    AstCriticalFoundEvent
} = require('../index');

describe('Domain Events', () => {
    describe('DomainEvent', () => {
        it('should validate presence of type and payload', () => {
            const validEvent = new DomainEvent('TEST', { data: 1 });
            expect(validEvent.validate()).toBe(true);

            const invalidEvent = new DomainEvent(null, null);
            expect(() => invalidEvent.validate()).toThrow();
        });

        it('should correctly identify critical events', () => {
            const critical = new DomainEvent('CRITICAL_ALERT', {});
            const blocked = new DomainEvent('PRE_COMMIT_BLOCKED', {});
            const normal = new DomainEvent('INFO_EVENT', {});

            expect(critical.isCritical()).toBe(true);
            expect(blocked.isCritical()).toBe(true);
            expect(normal.isCritical()).toBe(false);
        });

        it('should generate a summary string', () => {
            const event = new DomainEvent('TEST', { key: 'val' });
            const summary = event.getSummary();
            expect(summary).toContain('TEST');
            expect(summary).toContain('val');
        });
    });

    describe('EvidenceStaleEvent', () => {
        it('should validate specific payload requirements', () => {
            expect(() => new EvidenceStaleEvent(null, Date.now())).toThrow(/Evidence path/);
            const event = new EvidenceStaleEvent('/path', Date.now());
            expect(event.type).toBe('EVIDENCE_STALE');
        });
    });

    describe('GitFlowViolationEvent', () => {
        it('should validate branch and violation details', () => {
            expect(() => new GitFlowViolationEvent(null, 'error')).toThrow(/Branch name/);
            expect(() => new GitFlowViolationEvent('main', null)).toThrow(/Violation details/);
            const event = new GitFlowViolationEvent('main', 'Protected branch write');
            expect(event.payload.branch).toBe('main');
        });
    });

    describe('AstCriticalFoundEvent', () => {
        it('should validate findings is an array', () => {
            expect(() => new AstCriticalFoundEvent('not-an-array')).toThrow(/Findings must be an array/);
            const event = new AstCriticalFoundEvent([{ id: 1 }]);
            expect(event.payload.count).toBe(1);
        });
    });
});
