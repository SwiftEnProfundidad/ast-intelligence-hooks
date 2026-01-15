const fs = require('fs');
const os = require('os');
const path = require('path');

function makeTempProject() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pumuki-uninstall-'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'tmp', version: '0.0.0' }));
    fs.mkdirSync(path.join(root, '.ast-intelligence'), { recursive: true });
    fs.writeFileSync(path.join(root, '.AI_EVIDENCE.json'), JSON.stringify({ ok: true }));
    fs.writeFileSync(path.join(root, '.evidence-guard.pid'), '99999');
    fs.writeFileSync(path.join(root, '.evidence-guard.log'), 'log');

    const gitHooksDir = path.join(root, '.git', 'hooks');
    fs.mkdirSync(gitHooksDir, { recursive: true });
    fs.writeFileSync(path.join(gitHooksDir, 'pre-commit'), 'node_modules/pumuki-ast-hooks/scripts/hooks-system/infrastructure/shell/gitflow/gitflow-enforcer.sh');
    fs.writeFileSync(path.join(gitHooksDir, 'pre-push'), 'node_modules/pumuki-ast-hooks/scripts/hooks-system/infrastructure/shell/gitflow/gitflow-enforcer.sh');

    return root;
}

describe('ast-uninstall', () => {
    it('should default to dry-run (no deletions)', () => {
        const projectRoot = makeTempProject();
        const { planUninstall, applyUninstall } = require('../uninstall');

        const plan = planUninstall({ projectRoot });
        expect(Array.isArray(plan.paths)).toBe(true);
        expect(plan.paths.length).toBeGreaterThan(0);

        const result = applyUninstall({ projectRoot, apply: false, yes: true });
        expect(result.applied).toBe(false);
        expect(fs.existsSync(path.join(projectRoot, '.ast-intelligence'))).toBe(true);
    });

    it('should delete pumuki artifacts when apply=true', () => {
        const projectRoot = makeTempProject();
        const { applyUninstall } = require('../uninstall');

        const result = applyUninstall({ projectRoot, apply: true, yes: true });
        expect(result.applied).toBe(true);

        expect(fs.existsSync(path.join(projectRoot, '.ast-intelligence'))).toBe(false);
        expect(fs.existsSync(path.join(projectRoot, '.AI_EVIDENCE.json'))).toBe(false);
        expect(fs.existsSync(path.join(projectRoot, '.evidence-guard.pid'))).toBe(false);
        expect(fs.existsSync(path.join(projectRoot, '.evidence-guard.log'))).toBe(false);

        expect(fs.existsSync(path.join(projectRoot, '.git', 'hooks', 'pre-commit'))).toBe(false);
        expect(fs.existsSync(path.join(projectRoot, '.git', 'hooks', 'pre-push'))).toBe(false);
    });
});
