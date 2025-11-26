const EvidenceStatus = require('../../domain/entities/EvidenceStatus');

describe('EvidenceStatus', () => {
    test('builds from valid evidence json and marks stale when age exceeds maxAgeSeconds', () => {
        const now = new Date('2025-01-01T00:05:00.000Z');
        const evidenceJson = {
            timestamp: '2025-01-01T00:00:00.000Z',
            session_id: 'session-123',
            work_type: 'backend-refactor',
            platforms: ['backend'],
            current_context: {
                branch: 'feature/ast-violations-phase1'
            },
            files_modified: ['apps/backend/src/index.ts'],
            infra_modified: ['scripts/hooks-system/bin/update-evidence.sh']
        };

        const status = EvidenceStatus.fromEvidenceJson(evidenceJson, {
            now,
            maxAgeSeconds: 60
        });

        expect(status.ageSeconds).toBe(300);
        expect(status.isStale()).toBe(true);
        expect(status.getStatus()).toBe('stale');
        expect(status.sessionId).toBe('session-123');
        expect(status.workType).toBe('backend-refactor');
        expect(status.platforms).toEqual(['backend']);
        expect(status.branch).toBe('feature/ast-violations-phase1');
        expect(status.filesModified).toEqual(['apps/backend/src/index.ts']);
        expect(status.infraModified).toEqual(['scripts/hooks-system/bin/update-evidence.sh']);
    });

    test('marks evidence as fresh when age is within maxAgeSeconds', () => {
        const now = new Date('2025-01-01T00:01:00.000Z');
        const evidenceJson = {
            timestamp: '2025-01-01T00:00:30.000Z',
            session_id: 'session-456',
            platforms: ['backend']
        };

        const status = EvidenceStatus.fromEvidenceJson(evidenceJson, {
            now,
            maxAgeSeconds: 120
        });

        expect(status.isStale()).toBe(false);
        expect(status.getStatus()).toBe('fresh');
    });
});
