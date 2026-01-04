describe('install', () => {
  it('should exist as a file', () => {
    const fs = require('fs');
    const path = require('path');
    expect(fs.existsSync(path.join(__dirname, '../install.js'))).toBe(true);
  });

  it('should be valid JavaScript', () => {
    expect(() => require.resolve('../install.js')).not.toThrow();
  });
});

describe('InstallService - cleanupDuplicateRules', () => {
  const fs = require('fs');
  const path = require('path');
  const InstallService = require('../../application/services/installation/InstallService');

  let testRoot;
  let service;

  beforeEach(() => {
    testRoot = path.join(__dirname, '.tmp-cleanup-test');
    fs.mkdirSync(testRoot, { recursive: true });
    service = new InstallService();
    service.targetRoot = testRoot;
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  it('should skip cleanup when HOOK_CLEANUP_DUPLICATES is false', () => {
    process.env.HOOK_CLEANUP_DUPLICATES = 'false';
    service.cleanupDuplicateRules();
    expect(fs.existsSync(testRoot)).toBe(true);
  });

  it('should skip cleanup when HOOK_CLEANUP_DUPLICATES is not set', () => {
    delete process.env.HOOK_CLEANUP_DUPLICATES;
    service.cleanupDuplicateRules();
    expect(fs.existsSync(testRoot)).toBe(true);
  });

  it('should delete .md files when .mdc exists and cleanup is enabled', () => {
    process.env.HOOK_CLEANUP_DUPLICATES = 'true';

    const cursorRules = path.join(testRoot, '.cursor', 'rules');
    fs.mkdirSync(cursorRules, { recursive: true });

    fs.writeFileSync(path.join(cursorRules, 'test.md'), 'duplicate');
    fs.writeFileSync(path.join(cursorRules, 'test.mdc'), 'canonical');

    service.cleanupDuplicateRules();

    expect(fs.existsSync(path.join(cursorRules, 'test.md'))).toBe(false);
    expect(fs.existsSync(path.join(cursorRules, 'test.mdc'))).toBe(true);
  });

  it('should not delete .md files when .mdc does not exist', () => {
    process.env.HOOK_CLEANUP_DUPLICATES = 'true';

    const cursorRules = path.join(testRoot, '.cursor', 'rules');
    fs.mkdirSync(cursorRules, { recursive: true });

    fs.writeFileSync(path.join(cursorRules, 'test.md'), 'only md');

    service.cleanupDuplicateRules();

    expect(fs.existsSync(path.join(cursorRules, 'test.md'))).toBe(true);
  });

  it('should cleanup both .cursor and .windsurf rules directories', () => {
    process.env.HOOK_CLEANUP_DUPLICATES = 'true';

    const cursorRules = path.join(testRoot, '.cursor', 'rules');
    const windsurfRules = path.join(testRoot, '.windsurf', 'rules');
    fs.mkdirSync(cursorRules, { recursive: true });
    fs.mkdirSync(windsurfRules, { recursive: true });

    fs.writeFileSync(path.join(cursorRules, 'cursor.md'), 'duplicate');
    fs.writeFileSync(path.join(cursorRules, 'cursor.mdc'), 'canonical');
    fs.writeFileSync(path.join(windsurfRules, 'windsurf.md'), 'duplicate');
    fs.writeFileSync(path.join(windsurfRules, 'windsurf.mdc'), 'canonical');

    service.cleanupDuplicateRules();

    expect(fs.existsSync(path.join(cursorRules, 'cursor.md'))).toBe(false);
    expect(fs.existsSync(path.join(cursorRules, 'cursor.mdc'))).toBe(true);
    expect(fs.existsSync(path.join(windsurfRules, 'windsurf.md'))).toBe(false);
    expect(fs.existsSync(path.join(windsurfRules, 'windsurf.mdc'))).toBe(true);
  });
});
