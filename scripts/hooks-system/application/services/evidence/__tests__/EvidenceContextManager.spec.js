const fs = require('fs');
const os = require('os');
const path = require('path');

const { EvidenceContextManager } = require('../EvidenceContextManager');

describe('EvidenceContextManager', () => {
    let repoRoot;
    let evidencePath;

    beforeEach(() => {
        repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-manager-'));
        evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
    });

    afterEach(() => {
        fs.rmSync(repoRoot, { recursive: true, force: true });
    });

    const writeEvidence = timestamp => {
        fs.writeFileSync(evidencePath, JSON.stringify({
            timestamp,
            protocol_3_questions: { answered: true },
            justification: 'test'
        }), 'utf8');
    };

    it('detects stale evidence and triggers refresh', async () => {
        const now = new Date();
        const stale = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
        writeEvidence(stale);

        const runCommand = jest.fn().mockResolvedValue({ stdout: 'ok' });
        const manager = new EvidenceContextManager({
            repoRoot,
            runCommand,
            thresholdSeconds: 60
        });

        const result = await manager.ensureFresh('test');

        expect(result.refreshed).toBe(true);
        expect(runCommand).toHaveBeenCalled();
    });

    it('skips refresh when evidence is recent', async () => {
        writeEvidence(new Date().toISOString());

        const runCommand = jest.fn();
        const manager = new EvidenceContextManager({
            repoRoot,
            runCommand,
            thresholdSeconds: 300
        });

        const result = await manager.ensureFresh('test');

        expect(result.refreshed).toBe(false);
        expect(runCommand).not.toHaveBeenCalled();
    });

    it('handles missing evidence by refreshing', async () => {
        const runCommand = jest.fn().mockResolvedValue({ stdout: 'ok' });
        const manager = new EvidenceContextManager({
            repoRoot,
            runCommand
        });

        await manager.ensureFresh('missing');

        expect(runCommand).toHaveBeenCalled();
    });

    it('prevents concurrent refresh executions', async () => {
        writeEvidence('1970-01-01T00:00:00Z');

        const resolverQueue = [];
        const runCommand = jest.fn().mockImplementation(
            () =>
                new Promise(resolve => {
                    resolverQueue.push(resolve);
                })
        );

        const manager = new EvidenceContextManager({
            repoRoot,
            runCommand
        });

        const promiseA = manager.refresh({ reason: 'a' });
        const promiseB = manager.refresh({ reason: 'b' });
        expect(runCommand).toHaveBeenCalledTimes(1);
        resolverQueue.forEach(resolve => resolve({ stdout: 'ok' }));
        await promiseA;
        const skipped = await promiseB;
        expect(skipped.status).toBe('skipped');
    });
});
