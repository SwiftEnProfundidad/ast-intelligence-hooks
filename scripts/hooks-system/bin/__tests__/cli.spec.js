describe('cli', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../cli.js'))).toBe(true);
  });

  it('should be valid JavaScript', () => {
    expect(() => require.resolve('../cli.js')).not.toThrow();
  });

  it('should expose proposeHumanIntent and infer goal from recent commits', () => {
    const childProcess = require('child_process');

    const originalExecSync = childProcess.execSync;
    const originalExecFileSync = childProcess.execFileSync;
    childProcess.execSync = (cmd) => {
      const command = String(cmd);
      if (command.includes('git log') && command.includes('--pretty=%s')) {
        return 'fix: token economy docs, assets and MCP outputs\nRelease: 2026-01-11\n';
      }
      return '';
    };

    const { proposeHumanIntent } = require('../cli.js');
    expect(typeof proposeHumanIntent).toBe('function');

    const proposed = proposeHumanIntent({
      evidence: { ai_gate: { status: 'ALLOWED' }, platforms: {} },
      branch: 'develop',
      stagedFiles: []
    });
    expect(proposed && typeof proposed.primary_goal).toBe('string');
    expect(proposed.primary_goal.toLowerCase()).toContain('token economy');

    childProcess.execSync = originalExecSync;
    childProcess.execFileSync = originalExecFileSync;
  });

  it('wrap-up should auto-save human_intent by default', () => {
    const fs = require('fs');
    const childProcess = require('child_process');

    const originalConsoleLog = console.log;
    const logSpy = jest.fn();
    console.log = logSpy;

    const originalArgv = process.argv;
    const originalExecSync = childProcess.execSync;
    const originalExecFileSync = childProcess.execFileSync;

    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify({ ai_gate: { status: 'ALLOWED' }, platforms: {} }));
    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { });

    childProcess.execSync = (cmd) => {
      const command = String(cmd);
      if (command.includes('git rev-parse --show-toplevel')) {
        return '/tmp/repo\n';
      }
      if (command.includes('git branch --show-current')) {
        return 'main\n';
      }
      if (command.includes('git diff --cached --name-only')) {
        return '\n';
      }
      if (command.includes('git log') && command.includes('--pretty=%s')) {
        return 'fix: token economy docs, assets and MCP outputs\n';
      }
      return '';
    };

    childProcess.execFileSync = () => {
      return '';
    };

    process.argv = ['node', 'cli.js', 'wrap-up'];
    jest.resetModules();
    const { commands } = require('../cli.js');
    commands['wrap-up']();

    expect(logSpy.mock.calls.map(c => String(c[0] || '')).join('\n')).toContain('auto-saved');
    expect(writeFileSyncSpy).toHaveBeenCalled();
    const written = writeFileSyncSpy.mock.calls.map(c => String(c[1] || '')).join('\n');
    expect(written).toContain('"human_intent"');
    expect(written.toLowerCase()).toContain('token economy');

    console.log = originalConsoleLog;
    process.argv = originalArgv;
    childProcess.execSync = originalExecSync;
    childProcess.execFileSync = originalExecFileSync;
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  it('wrap-up should not save when --no-save is provided', () => {
    const fs = require('fs');
    const childProcess = require('child_process');

    const originalConsoleLog = console.log;
    const logSpy = jest.fn();
    console.log = logSpy;

    const originalArgv = process.argv;
    const originalExecSync = childProcess.execSync;
    const originalExecFileSync = childProcess.execFileSync;

    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify({ ai_gate: { status: 'ALLOWED' }, platforms: {} }));
    const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { });

    childProcess.execSync = (cmd) => {
      const command = String(cmd);
      if (command.includes('git rev-parse --show-toplevel')) {
        return '/tmp/repo\n';
      }
      if (command.includes('git branch --show-current')) {
        return 'main\n';
      }
      if (command.includes('git diff --cached --name-only')) {
        return '\n';
      }
      if (command.includes('git log') && command.includes('--pretty=%s')) {
        return 'fix: token economy docs, assets and MCP outputs\n';
      }
      return '';
    };

    childProcess.execFileSync = () => {
      return '';
    };

    process.argv = ['node', 'cli.js', 'wrap-up', '--no-save'];
    jest.resetModules();
    const { commands } = require('../cli.js');
    commands['wrap-up']();

    expect(logSpy.mock.calls.map(c => String(c[0] || '')).join('\n')).toContain('proposal only');
    expect(writeFileSyncSpy).toHaveBeenCalled();
    const written = writeFileSyncSpy.mock.calls.map(c => String(c[1] || '')).join('\n');
    expect(written).not.toContain('"human_intent"');

    console.log = originalConsoleLog;
    process.argv = originalArgv;
    childProcess.execSync = originalExecSync;
    childProcess.execFileSync = originalExecFileSync;
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  it('install should execute install.js using execFileSync with args', () => {
    const path = require('path');
    const childProcess = require('child_process');

    const originalArgv = process.argv;
    const originalExecFileSync = childProcess.execFileSync;

    const execFileSyncSpy = jest.fn();
    childProcess.execFileSync = execFileSyncSpy;

    process.argv = ['node', 'cli.js', 'install'];
    jest.resetModules();
    const { commands } = require('../cli.js');
    commands.install();

    const expectedInstallPath = path.join(__dirname, '..', '..', 'bin', 'install.js');
    expect(execFileSyncSpy).toHaveBeenCalledWith(process.execPath, [expectedInstallPath], { stdio: 'inherit' });

    process.argv = originalArgv;
    childProcess.execFileSync = originalExecFileSync;
  });
});
