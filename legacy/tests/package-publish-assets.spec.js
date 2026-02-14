const fs = require('fs');
const path = require('path');

describe('npm package contents', () => {
    it('should include assets/ folder in package.json files whitelist (README images rely on it)', () => {
        const pkgPath = path.join(__dirname, '..', '..', 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

        expect(Array.isArray(pkg.files)).toBe(true);
        expect(pkg.files).toContain('assets/');
    });
});
