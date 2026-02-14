describe('Installation mode (npm-runtime vs vendored)', () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    const ConfigurationGeneratorService = require('../../application/services/installation/ConfigurationGeneratorService');
    const InstallService = require('../../application/services/installation/InstallService');

    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('ConfigurationGeneratorService.addNpmScripts writes node_modules scripts by default', () => {
        const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-hooks-install-mode-'));
        const pkgPath = path.join(testRoot, 'package.json');
        fs.writeFileSync(pkgPath, JSON.stringify({ name: 'test', version: '1.0.0', scripts: {} }, null, 2));

        const service = new ConfigurationGeneratorService(testRoot, __dirname);
        delete process.env.HOOK_INSTALL_MODE;

        service.addNpmScripts();

        const written = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        expect(written.scripts['ast:audit']).toContain('node_modules/pumuki-ast-hooks');
        expect(written.scripts['ast:guard:start']).toContain('node_modules/pumuki-ast-hooks');

        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    it('ConfigurationGeneratorService.addNpmScripts writes vendored scripts when HOOK_INSTALL_MODE=vendored', () => {
        const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-hooks-install-mode-'));
        const pkgPath = path.join(testRoot, 'package.json');
        fs.writeFileSync(pkgPath, JSON.stringify({ name: 'test', version: '1.0.0', scripts: {} }, null, 2));

        const service = new ConfigurationGeneratorService(testRoot, __dirname);
        process.env.HOOK_INSTALL_MODE = 'vendored';

        service.addNpmScripts();

        const written = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        expect(written.scripts['ast:audit']).toContain('scripts/hooks-system');
        expect(written.scripts['ast:guard:start']).toContain('scripts/hooks-system');

        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    it('InstallService does not copy system files in npm runtime mode by default', async () => {
        const service = new InstallService();

        service.gitService = { checkGitRepository: () => true, ensureGitInfoExclude: () => { }, installGitHooks: () => { } };
        service.platformService = { detect: () => ['backend'] };

        const fsInstaller = {
            createDirectoryStructure: jest.fn(),
            copySystemFiles: jest.fn(),
            copyManageLibraryScript: jest.fn()
        };

        service.fsInstaller = fsInstaller;
        service.configGenerator = { installESLintConfigs: () => { }, createProjectConfig: () => { }, addNpmScripts: () => { } };
        service.ideIntegration = { installCursorHooks: () => { }, configureVSCodeTasks: () => { } };
        service.checkCriticalDependencies = () => { };
        service.startEvidenceGuard = () => { };

        delete process.env.HOOK_INSTALL_MODE;

        await service.run();

        expect(fsInstaller.copySystemFiles).not.toHaveBeenCalled();
    });

    it('InstallService copies system files when HOOK_INSTALL_MODE=vendored', async () => {
        const service = new InstallService();

        service.gitService = { checkGitRepository: () => true, ensureGitInfoExclude: () => { }, installGitHooks: () => { } };
        service.platformService = { detect: () => ['backend'] };

        const fsInstaller = {
            createDirectoryStructure: jest.fn(),
            copySystemFiles: jest.fn(),
            copyManageLibraryScript: jest.fn()
        };

        service.fsInstaller = fsInstaller;
        service.configGenerator = { installESLintConfigs: () => { }, createProjectConfig: () => { }, addNpmScripts: () => { } };
        service.ideIntegration = { installCursorHooks: () => { }, configureVSCodeTasks: () => { } };
        service.checkCriticalDependencies = () => { };
        service.startEvidenceGuard = () => { };

        process.env.HOOK_INSTALL_MODE = 'vendored';

        await service.run();

        expect(fsInstaller.copySystemFiles).toHaveBeenCalled();
    });
});
