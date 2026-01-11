jest.mock('child_process', () => ({
    execSync: jest.fn(() => {
        const err = new Error('audit failed');
        err.status = 1;
        throw err;
    })
}));

describe('cli audit', () => {
    it('exits with the same status instead of throwing a stacktrace', () => {
        const cli = require('../cli.js');

        const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit:${code}`);
        });

        expect(() => cli.commands.audit()).toThrow('process.exit:1');
        expect(exitSpy).toHaveBeenCalledWith(1);

        exitSpy.mockRestore();
    });
});
