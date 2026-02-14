const path = require('path');
const { spawnSync } = require('child_process');

describe('install-wizard CLI', () => {
    it('runs successfully when user confirms', () => {
        const script = path.join(__dirname, '..', 'install-wizard.js');
        const result = spawnSync('node', [script], {
            cwd: path.join(__dirname, '../../..'),
            stdio: ['pipe', 'pipe', 'pipe'],
            input: Buffer.from('y\n')
        });

        expect(result.status).toBe(0);
        expect(result.stdout.toString()).toContain('Hook-system install wizard completed.');
    });
});
