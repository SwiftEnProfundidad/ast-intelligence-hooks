#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MANIFEST_RELATIVE_PATH = '.ast-intelligence/install-manifest.json';

function findProjectRoot(startDir) {
    let current = startDir;
    while (current !== '/') {
        if (fs.existsSync(path.join(current, 'package.json'))) {
            return current;
        }
        current = path.dirname(current);
    }
    return startDir;
}

function loadManifest(projectRoot) {
    const manifestPath = path.join(projectRoot, MANIFEST_RELATIVE_PATH);
    if (!fs.existsSync(manifestPath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
        return null;
    }
}

function buildUninstallPlanFromManifest(projectRoot, manifest) {
    const paths = [];

    for (const relPath of manifest.createdFiles || []) {
        const fullPath = path.join(projectRoot, relPath);
        if (fs.existsSync(fullPath)) {
            paths.push(fullPath);
        }
    }

    for (const relPath of manifest.createdDirs || []) {
        const fullPath = path.join(projectRoot, relPath);
        if (fs.existsSync(fullPath)) {
            paths.push(fullPath);
        }
    }

    paths.push(path.join(projectRoot, MANIFEST_RELATIVE_PATH));

    const unique = Array.from(new Set(paths.filter(p => fs.existsSync(p))));
    return {
        projectRoot,
        paths: unique.sort(),
        fromManifest: true
    };
}

function isPumukiHookContent(content) {
    if (!content) return false;
    const text = String(content);
    return text.includes('pumuki-ast-hooks') ||
        text.includes('AST Intelligence') ||
        text.includes('gitflow-enforcer.sh') ||
        text.includes('Hook-System Git Flow Enforcer');
}

function safeReadFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
}

function shouldRemoveGitHook(hookPath) {
    if (!fs.existsSync(hookPath)) return false;
    const content = safeReadFile(hookPath);
    return isPumukiHookContent(content);
}

function buildUninstallPlan(projectRoot) {
    const paths = [];

    const artifactPaths = [
        '.ast-intelligence',
        '.AI_EVIDENCE.json',
        '.evidence-guard.pid',
        '.evidence-guard.log',
        '.audit_tmp',
        '.audit-reports'
    ];

    for (const rel of artifactPaths) {
        const p = path.join(projectRoot, rel);
        if (fs.existsSync(p)) {
            paths.push(p);
        }
    }

    const gitHooksDir = path.join(projectRoot, '.git', 'hooks');
    const preCommit = path.join(gitHooksDir, 'pre-commit');
    const prePush = path.join(gitHooksDir, 'pre-push');

    if (shouldRemoveGitHook(preCommit)) {
        paths.push(preCommit);
    }
    if (shouldRemoveGitHook(prePush)) {
        paths.push(prePush);
    }

    const vendoredRoot = path.join(projectRoot, 'scripts', 'hooks-system');
    if (fs.existsSync(vendoredRoot)) {
        paths.push(vendoredRoot);
    }

    const cursorDir = path.join(projectRoot, '.cursor');
    const windsurfDir = path.join(projectRoot, '.windsurf');
    const vscodeDir = path.join(projectRoot, '.vscode');

    const cursorMcp = path.join(cursorDir, 'mcp.json');
    const windsurfMcp = path.join(windsurfDir, 'mcp.json');

    if (fs.existsSync(cursorMcp) || fs.existsSync(windsurfMcp)) {
        if (fs.existsSync(cursorDir)) paths.push(cursorDir);
        if (fs.existsSync(windsurfDir)) paths.push(windsurfDir);
    }

    if (fs.existsSync(vscodeDir)) {
        paths.push(vscodeDir);
    }

    const unique = Array.from(new Set(paths));
    return {
        projectRoot,
        paths: unique.sort()
    };
}

function removePath(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    const stat = fs.lstatSync(targetPath);
    if (stat.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        return;
    }
    fs.rmSync(targetPath, { force: true });
}

function stopEvidenceGuard(projectRoot) {
    const pidPath = path.join(projectRoot, '.evidence-guard.pid');
    if (!fs.existsSync(pidPath)) return;

    const raw = safeReadFile(pidPath);
    const pid = raw ? parseInt(raw.trim(), 10) : NaN;
    if (Number.isNaN(pid)) return;

    try {
        process.kill(pid, 0);
    } catch {
        return;
    }

    try {
        process.kill(pid, 'SIGTERM');
    } catch {
        return;
    }
}

function parseArgs(argv) {
    const args = argv.slice(2);
    return {
        apply: args.includes('--apply'),
        dryRun: args.includes('--dry-run') || !args.includes('--apply'),
        yes: args.includes('--yes'),
        help: args.includes('--help') || args.includes('-h'),
        projectRootArg: (() => {
            const p = args.find(a => a.startsWith('--project-root='));
            if (!p) return null;
            return p.split('=').slice(1).join('=');
        })()
    };
}

function printUsage() {
    process.stdout.write(`\nUsage:\n  npx ast-uninstall [--dry-run] [--apply] [--yes] [--project-root=/path]\n\nDefaults:\n  --dry-run is default (no changes)\n\nExamples:\n  npx ast-uninstall\n  npx ast-uninstall --apply\n  npx ast-uninstall --apply --yes\n  npx ast-uninstall --project-root=/path/to/repo\n\n`);
}

function planUninstall({ projectRoot }) {
    const manifest = loadManifest(projectRoot);
    if (manifest) {
        return buildUninstallPlanFromManifest(projectRoot, manifest);
    }
    return buildUninstallPlan(projectRoot);
}

function applyUninstall({ projectRoot, apply, yes }) {
    const manifest = loadManifest(projectRoot);
    const plan = manifest
        ? buildUninstallPlanFromManifest(projectRoot, manifest)
        : buildUninstallPlan(projectRoot);

    if (!apply) {
        return { applied: false, plan };
    }

    if (!yes && process.stdout.isTTY) {
        process.stdout.write('This will delete files from your repository. Re-run with --yes to confirm.\n');
        return { applied: false, plan, needsConfirmation: true };
    }

    stopEvidenceGuard(projectRoot);

    for (const p of plan.paths) {
        removePath(p);
    }

    return { applied: true, plan };
}

function main() {
    const options = parseArgs(process.argv);

    if (options.help) {
        printUsage();
        process.exit(0);
    }

    const cwd = process.cwd();
    const rootFromCwd = findProjectRoot(cwd);
    const projectRoot = options.projectRootArg ? path.resolve(options.projectRootArg) : rootFromCwd;

    const manifest = loadManifest(projectRoot);
    const plan = manifest
        ? buildUninstallPlanFromManifest(projectRoot, manifest)
        : buildUninstallPlan(projectRoot);

    if (options.dryRun) {
        process.stdout.write(`Project root: ${projectRoot}\n`);
        if (plan.fromManifest) {
            process.stdout.write('Using install manifest for precise cleanup.\n');
        } else {
            process.stdout.write('No manifest found, using heuristic detection.\n');
        }
        process.stdout.write('Planned removals:\n');
        for (const p of plan.paths) {
            process.stdout.write(`- ${p}\n`);
        }
        process.exit(0);
    }

    const result = applyUninstall({ projectRoot, apply: true, yes: options.yes });

    if (result.needsConfirmation) {
        process.exit(2);
    }

    process.stdout.write('Uninstall completed.\n');
    process.exit(0);
}

if (require.main === module) {
    main();
}

module.exports = { planUninstall, applyUninstall, findProjectRoot };
