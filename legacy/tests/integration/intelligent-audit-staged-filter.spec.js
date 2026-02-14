describe('intelligent-audit staged filtering', () => {
    it('matches only exact staged paths and ignores .audit_tmp', () => {
        const mod = require('../../scripts/hooks-system/infrastructure/orchestration/intelligent-audit');

        const stagedSet = new Set(['apps/ios/Application/AppCoordinator.swift']);

        expect(mod.isViolationInStagedFiles('apps/ios/Application/AppCoordinator.swift', stagedSet)).toBe(true);
        expect(mod.isViolationInStagedFiles('apps/ios/Application/AppCoordinator.swift.backup', stagedSet)).toBe(false);
        expect(mod.isViolationInStagedFiles('.audit_tmp/AppCoordinator.123.staged.swift', stagedSet)).toBe(false);
        expect(mod.isViolationInStagedFiles('some/dir/.audit_tmp/AppCoordinator.123.staged.swift', stagedSet)).toBe(false);
        expect(mod.isViolationInStagedFiles('apps/ios/Application/AppCoordinator', stagedSet)).toBe(false);
    });
});
