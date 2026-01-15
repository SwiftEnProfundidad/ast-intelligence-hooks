const fs = require('fs');
const path = require('path');
const os = require('os');

const InstallManifestService = require('../InstallManifestService');

function makeSUT() {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pumuki-manifest-test-'));
    const manifestPath = path.join(projectRoot, '.ast-intelligence', 'install-manifest.json');
    const sut = new InstallManifestService(projectRoot);
    return { sut, projectRoot, manifestPath };
}

function cleanupSUT({ projectRoot }) {
    fs.rmSync(projectRoot, { recursive: true, force: true });
}

describe('InstallManifestService', () => {
    describe('recordCreatedFile', () => {
        it('should add file path to manifest', () => {
            const { sut, projectRoot, manifestPath } = makeSUT();

            sut.recordCreatedFile('.ast-intelligence/skills/SKILL.md');
            sut.save();

            expect(fs.existsSync(manifestPath)).toBe(true);
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            expect(manifest.createdFiles).toContain('.ast-intelligence/skills/SKILL.md');

            cleanupSUT({ projectRoot });
        });
    });

    describe('recordModifiedFile', () => {
        it('should add modified file with backup path to manifest', () => {
            const { sut, projectRoot, manifestPath } = makeSUT();

            sut.recordModifiedFile('package.json', '_package.json.bak');
            sut.save();

            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            expect(manifest.modifiedFiles).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        path: 'package.json',
                        backup: '_package.json.bak'
                    })
                ])
            );

            cleanupSUT({ projectRoot });
        });
    });

    describe('recordCreatedDir', () => {
        it('should add directory path to manifest', () => {
            const { sut, projectRoot, manifestPath } = makeSUT();

            sut.recordCreatedDir('.ast-intelligence');
            sut.save();

            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            expect(manifest.createdDirs).toContain('.ast-intelligence');

            cleanupSUT({ projectRoot });
        });
    });

    describe('getManifest', () => {
        it('should return manifest structure with metadata', () => {
            const { sut, projectRoot } = makeSUT();

            sut.recordCreatedFile('.AI_EVIDENCE.json');
            const manifest = sut.getManifest();

            expect(manifest).toHaveProperty('version');
            expect(manifest).toHaveProperty('installedAt');
            expect(manifest).toHaveProperty('createdFiles');
            expect(manifest).toHaveProperty('modifiedFiles');
            expect(manifest).toHaveProperty('createdDirs');

            cleanupSUT({ projectRoot });
        });
    });

    describe('load', () => {
        it('should load existing manifest from disk', () => {
            const { sut, projectRoot, manifestPath } = makeSUT();

            fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
            fs.writeFileSync(manifestPath, JSON.stringify({
                version: '6.1.8',
                installedAt: '2026-01-15T00:00:00.000Z',
                createdFiles: ['.AI_EVIDENCE.json'],
                modifiedFiles: [],
                createdDirs: ['.ast-intelligence']
            }));

            const loaded = InstallManifestService.load(projectRoot);

            expect(loaded.createdFiles).toContain('.AI_EVIDENCE.json');
            expect(loaded.createdDirs).toContain('.ast-intelligence');

            cleanupSUT({ projectRoot });
        });

        it('should return null if manifest does not exist', () => {
            const { sut, projectRoot } = makeSUT();

            const loaded = InstallManifestService.load(projectRoot);

            expect(loaded).toBeNull();

            cleanupSUT({ projectRoot });
        });
    });
});
