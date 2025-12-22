const fs = require('fs');
const os = require('os');
const path = require('path');

const UnifiedLogger = require('../UnifiedLogger');

describe('UnifiedLogger', () => {
    let tmpDir;
    const originalConsole = { ...console };

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unified-logger-'));
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
        console.debug = jest.fn();
    });

    afterEach(() => {
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.debug = originalConsole.debug;
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('logs to console and file with structured entry', () => {
        const logPath = path.join(tmpDir, 'hook.log');
        const logger = new UnifiedLogger({
            component: 'TestComponent',
            console: { enabled: true, level: 'info' },
            file: { enabled: true, level: 'debug', path: logPath, maxSizeBytes: 1024, maxFiles: 2 }
        });

        logger.info('TEST_EVENT', { value: 42 });

        expect(console.info).toHaveBeenCalledTimes(1);
        const consoleArgs = console.info.mock.calls[0];
        expect(consoleArgs[0]).toContain('[TestComponent]');
        expect(consoleArgs[0]).toContain('TEST_EVENT');

        const content = fs.readFileSync(logPath, 'utf8').trim();
        const parsed = JSON.parse(content);
        expect(parsed.component).toBe('TestComponent');
        expect(parsed.event).toBe('TEST_EVENT');
        expect(parsed.data.value).toBe(42);
    });

    it('rotates files when the max size is exceeded', () => {
        const logPath = path.join(tmpDir, 'rotate.log');
        const logger = new UnifiedLogger({
            component: 'RotateComponent',
            console: { enabled: false },
            file: { enabled: true, level: 'debug', path: logPath, maxSizeBytes: 200, maxFiles: 2 }
        });

        for (let index = 0; index < 20; index += 1) {
            logger.info('ROTATE_EVENT', { index });
        }

        const rotatedExists = fs.existsSync(`${logPath}.1`);
        const mainExists = fs.existsSync(logPath);
        expect(rotatedExists).toBe(true);
        expect(mainExists).toBe(true);
    });
});
