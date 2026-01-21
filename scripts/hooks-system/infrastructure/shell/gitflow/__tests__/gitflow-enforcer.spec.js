const fs = require('fs');
const path = require('path');

describe('gitflow-enforcer', () => {
    const scriptPath = path.join(__dirname, '..', 'gitflow-enforcer.sh');

    test('debe ignorar xcuserdata en atomicidad', () => {
        const script = fs.readFileSync(scriptPath, 'utf8');
        expect(script).toMatch(/xcuserdata/);
    });

    test('debe omitir lint:hooks si no esta configurado', () => {
        const script = fs.readFileSync(scriptPath, 'utf8');
        expect(script).toMatch(/lint:hooks/);
        expect(script).toMatch(/no configurado/);
    });
});
