#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REFRESH_INTERVAL_MS = 180000;
const WATCHDOG_INTERVAL_MS = 30000;
const EVIDENCE_FILE = '.AI_EVIDENCE.json';
const PID_FILE = '.evidence-guard.pid';
const WATCHDOG_ARG = '--watchdog';
const WATCHDOG_PID_ARG = '--pid';
const WATCHDOG_ROOT_ARG = '--root';

function getArgValue(args, name) {
    const index = args.indexOf(name);
    if (index === -1) return null;
    return args[index + 1] || null;
}

function isPidAlive(pid) {
    if (!pid || Number.isNaN(pid)) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return false;
    }
}

function getStagedFiles(projectRoot) {
    try {
        const result = spawnSync('git', ['diff', '--cached', '--name-only'], {
            cwd: projectRoot,
            encoding: 'utf8'
        });
        if (result.status !== 0) {
            return [];
        }
        return result.stdout.split('\n').map((line) => line.trim()).filter(Boolean);
    } catch (error) {
        return [];
    }
}

class EvidenceGuard {
    constructor() {
        this.projectRoot = this.findProjectRoot();
        this.pidFile = path.join(this.projectRoot, PID_FILE);
        this.evidenceFile = path.join(this.projectRoot, EVIDENCE_FILE);
        this.updateScript = this.findUpdateScript();
        this.isRunning = false;
        this.intervalId = null;
    }

    findProjectRoot() {
        let currentDir = process.cwd();
        while (currentDir !== '/') {
            if (fs.existsSync(path.join(currentDir, 'package.json'))) {
                return currentDir;
            }
            currentDir = path.dirname(currentDir);
        }
        return process.cwd();
    }

    findUpdateScript() {
        const possiblePaths = [
            path.join(this.projectRoot, 'scripts/hooks-system/bin/update-evidence.sh'),
            path.join(this.projectRoot, 'node_modules/pumuki-ast-hooks/scripts/hooks-system/bin/update-evidence.sh'),
            path.join(__dirname, '../../bin/update-evidence.sh')
        ];

        for (const scriptPath of possiblePaths) {
            if (fs.existsSync(scriptPath)) {
                return scriptPath;
            }
        }

        throw new Error('update-evidence.sh not found');
    }

    writePidFile() {
        try {
            fs.writeFileSync(this.pidFile, process.pid.toString(), 'utf8');
        } catch (error) {
            console.error('[EvidenceGuard] Failed to write PID file:', error.message);
        }
    }

    removePidFile() {
        try {
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        } catch (error) {
            console.error('[EvidenceGuard] Failed to remove PID file:', error.message);
        }
    }

    isAlreadyRunning() {
        if (!fs.existsSync(this.pidFile)) {
            return false;
        }

        try {
            const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8').trim(), 10);
            process.kill(pid, 0);
            return true;
        } catch (error) {
            this.removePidFile();
            return false;
        }
    }

    async refreshEvidence() {
        return new Promise((resolve) => {
            const skipWhenNoStaged = process.env.EVIDENCE_GUARD_SKIP_NO_STAGED !== 'false';
            const stagedOnly = process.env.EVIDENCE_GUARD_STAGED_ONLY !== 'false';
            const stagedFiles = (skipWhenNoStaged || stagedOnly) ? getStagedFiles(this.projectRoot) : [];
            if (skipWhenNoStaged && stagedFiles.length === 0) {
                console.log('[EvidenceGuard] Skipping refresh (no staged files)');
                resolve();
                return;
            }
            console.log('[EvidenceGuard] Running evidence update...');
            const args = ['--auto'];
            if (stagedOnly) args.push('--staged');
            if (skipWhenNoStaged) args.push('--if-staged');
            const child = spawn('bash', [this.updateScript, ...args], {
                cwd: this.projectRoot,
                stdio: 'ignore',
                detached: false
            });

            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`[EvidenceGuard] Evidence refreshed at ${new Date().toISOString()}`);
                } else {
                    console.error(`[EvidenceGuard] Refresh failed with code ${code}`);
                }
                resolve();
            });

            child.on('error', (error) => {
                console.error('[EvidenceGuard] Refresh error:', error.message);
                resolve();
            });
        });
    }

    startWatchdog() {
        if (process.env.HOOK_GUARD_SELF_HEAL === 'false') return;
        const args = [__filename, WATCHDOG_ARG, WATCHDOG_PID_ARG, String(process.pid), WATCHDOG_ROOT_ARG, this.projectRoot];
        const child = spawn(process.execPath, args, {
            cwd: this.projectRoot,
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
    }

    async start() {
        if (this.isAlreadyRunning()) {
            console.log('[EvidenceGuard] Already running');
            process.exit(0);
        }

        this.writePidFile();
        this.isRunning = true;
        this.startWatchdog();

        console.log('[EvidenceGuard] Started');
        console.log(`[EvidenceGuard] Project root: ${this.projectRoot}`);
        console.log(`[EvidenceGuard] Refresh interval: ${REFRESH_INTERVAL_MS / 1000}s`);

        await this.refreshEvidence();

        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.refreshEvidence();
            }
        }, REFRESH_INTERVAL_MS);

        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
        process.on('exit', () => this.cleanup());
    }

    stop() {
        console.log('[EvidenceGuard] Stopping...');
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.cleanup();
        process.exit(0);
    }

    cleanup() {
        this.removePidFile();
    }
}

function runWatchdog(pidValue, rootPath) {
    const pid = Number(pidValue);
    const root = rootPath || process.cwd();
    if (!pid || Number.isNaN(pid)) {
        process.exit(1);
    }
    const tick = () => {
        if (isPidAlive(pid)) return;
        const args = [__filename];
        spawn(process.execPath, args, {
            cwd: root,
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, HOOK_GUARD_SELF_HEAL: 'false' }
        }).unref();
        process.exit(0);
    };
    setInterval(tick, WATCHDOG_INTERVAL_MS).unref();
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.includes(WATCHDOG_ARG)) {
        runWatchdog(getArgValue(args, WATCHDOG_PID_ARG), getArgValue(args, WATCHDOG_ROOT_ARG));
    } else {
        const guard = new EvidenceGuard();
        guard.start().catch((error) => {
            console.error('[EvidenceGuard] Fatal error:', error);
            process.exit(1);
        });
    }
}

module.exports = EvidenceGuard;
