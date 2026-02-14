const fs = require('fs');
const path = require('path');

describe('session-loader.sh', () => {
    it('should not hardcode the displayed version header', () => {
        const filePath = path.join(__dirname, '..', 'session-loader.sh');
        const content = fs.readFileSync(filePath, 'utf8');

        expect(content).not.toContain('AST Intelligence Hooks v5.5.22');
        expect(content).toMatch(/\bVERSION=/);
        expect(content).toContain('package.json');
        expect(content).toMatch(/AST Intelligence Hooks v\$VERSION/);
    });
});
