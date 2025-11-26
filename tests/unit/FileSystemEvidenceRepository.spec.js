const fs = require('fs');
const os = require('os');
const path = require('path');

const FileSystemEvidenceRepository = require('../../infrastructure/repositories/FileSystemEvidenceRepository');

describe('FileSystemEvidenceRepository', () => {
    test('loads EvidenceStatus from .AI_EVIDENCE.json on disk', () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-repo-'));
        const evidencePath = path.join(tempDir, '.AI_EVIDENCE.json');

        const now = new Date();
        const recentTimestamp = new Date(now.getTime() - 1000).toISOString();

        const evidenceJson = {
            timestamp: recentTimestamp,
            session_id: 'session-filesystem',
            platforms: ['backend'],
            current_context: {
                branch: 'feature/test-branch'
            }
        };

        fs.writeFileSync(evidencePath, JSON.stringify(evidenceJson), 'utf8');

        const repository = new FileSystemEvidenceRepository({
            repoRoot: tempDir,
            maxAgeSeconds: 600
        });

        const status = repository.loadStatus();

        expect(status.sessionId).toBe('session-filesystem');
        expect(status.platforms).toEqual(['backend']);
        expect(status.branch).toBe('feature/test-branch');
        expect(typeof status.ageSeconds).toBe('number');
        expect(status.getStatus()).toBe('fresh');
    });
});
