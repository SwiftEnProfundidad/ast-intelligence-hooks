const fs = require('fs');
const path = require('path');

describe('pre-tool-use-evidence-validator', () => {
    const filePath = path.join(__dirname, '..', 'pre-tool-use-evidence-validator.ts');

    it('should exist', () => {
        expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should include auto-refresh execution of update-evidence', () => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).toMatch(/update-evidence\.sh/);
        expect(content).toMatch(/--auto/);
    });
});
