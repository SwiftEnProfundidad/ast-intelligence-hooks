#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const REFRESH_INTERVAL_MS = 180000;
const EVIDENCE_FILE = '.AI_EVIDENCE.json';
const PID_FILE = '.evidence-guard.pid';

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
            const astScript = path.join(
                this.projectRoot,
                'node_modules/pumuki-ast-hooks/scripts/hooks-system/infrastructure/orchestration/intelligent-audit.js'
            );

            if (fs.existsSync(astScript)) {
                console.log('[EvidenceGuard] Running full AST analysis...');
                const child = spawn('node', [astScript], {
                    cwd: this.projectRoot,
                    stdio: 'ignore',
                    detached: false,
                    env: {
                        ...process.env,
                        REPO_ROOT: this.projectRoot,
                        AUTO_EVIDENCE_TRIGGER: 'auto',
                        AUTO_EVIDENCE_REASON: 'evidence_guard_refresh',
                        AUTO_EVIDENCE_SUMMARY: 'Automatic refresh by evidence guard'
                    }
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        console.log(`[EvidenceGuard] Full AST analysis completed at ${new Date().toISOString()}`);
                    } else {
                        console.error(`[EvidenceGuard] AST analysis failed with code ${code}`);
                    }
                    resolve();
                });

                child.on('error', (error) => {
                    console.error('[EvidenceGuard] Failed to spawn AST analysis:', error.message);
                    resolve();
                });
            } else {
                console.warn('[EvidenceGuard] intelligent-audit.js not found, falling back to update-evidence.sh');
                const child = spawn('bash', [this.updateScript, '--auto'], {
                    cwd: this.projectRoot,
                    stdio: 'ignore',
                    detached: false
                });

                child.on('close', (code) => {
                    if (code === 0) {
                        console.log(`[EvidenceGuard] Evidence refreshed (fallback) at ${new Date().toISOString()}`);
                    } else {
                        console.error(`[EvidenceGuard] Refresh failed with code ${code}`);
                    }
                    resolve();
                });

                child.on('error', (error) => {
                    console.error('[EvidenceGuard] Refresh error:', error.message);
                    resolve();
                });
            }
        });
    }

    async start() {
        if (this.isAlreadyRunning()) {
            console.log('[EvidenceGuard] Already running');
            process.exit(0);
        }

        this.writePidFile();
        this.isRunning = true;

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

if (require.main === module) {
    const guard = new EvidenceGuard();
    guard.start().catch((error) => {
        console.error('[EvidenceGuard] Fatal error:', error);
        process.exit(1);
    });
}

module.exports = EvidenceGuard;
