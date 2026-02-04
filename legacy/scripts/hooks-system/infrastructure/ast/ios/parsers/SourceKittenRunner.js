const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execPromise = util.promisify(exec);

class SourceKittenRunner {
    constructor({
        binaryPath = '/opt/homebrew/bin/sourcekitten',
        defaultTimeoutMs = 30000,
        logger = console
    } = {}) {
        this.binaryPath = binaryPath;
        this.defaultTimeoutMs = defaultTimeoutMs;
        this.logger = logger;
    }

    async version() {
        return this.execRaw(`${this.binaryPath} version`, 5000);
    }

    async structure(filePath) {
        const cmd = `${this.binaryPath} structure --file "${path.resolve(filePath)}"`;
        return this.execJson(cmd, this.defaultTimeoutMs);
    }

    async syntax(filePath) {
        const cmd = `${this.binaryPath} syntax --file "${path.resolve(filePath)}"`;
        return this.execJson(cmd, this.defaultTimeoutMs);
    }

    async projectDoc(projectPath, scheme, isWorkspace = false) {
        const projectFlag = isWorkspace ? '-workspace' : '-project';
        const cmd = `${this.binaryPath} doc ${projectFlag} "${projectPath}" -scheme "${scheme}"`;
        return this.execJson(cmd, 120000);
    }

    async execJson(command, timeoutMs) {
        const { stdout, stderr } = await this.execRaw(command, timeoutMs);
        return { stdout: this.safeJson(stdout), stderr };
    }

    async execRaw(command, timeoutMs) {
        try {
            return await execPromise(command, { timeout: timeoutMs });
        } catch (error) {
            const msg = error && error.message ? error.message : String(error);
            this.logger?.debug?.('[SourceKittenRunner] exec error', { command, error: msg });
            throw error;
        }
    }

    safeJson(text) {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }
}

module.exports = SourceKittenRunner;
