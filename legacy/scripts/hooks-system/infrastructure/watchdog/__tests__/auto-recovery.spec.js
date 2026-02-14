const path = require('path');
const { spawnSync } = require('child_process');

describe('auto-recovery CLI', () => {
    it('runs without errors and writes logs', () => {
        const script = path.join(__dirname, '..', 'auto-recovery.js');
        const result = spawnSync('node', [script, 'test-reason', 'guard'], {
            cwd: path.join(__dirname, '../../..'),
            stdio: 'pipe'
        });

        expect(result.status).toBe(0);
    });
});
