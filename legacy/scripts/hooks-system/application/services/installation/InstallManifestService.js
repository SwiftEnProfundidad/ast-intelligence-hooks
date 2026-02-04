const fs = require('fs');
const path = require('path');

const MANIFEST_RELATIVE_PATH = '.ast-intelligence/install-manifest.json';

class InstallManifestService {
    constructor(projectRoot, version = 'unknown') {
        this.projectRoot = projectRoot;
        this.version = version;
        this.createdFiles = [];
        this.modifiedFiles = [];
        this.createdDirs = [];
        this.installedAt = new Date().toISOString();
    }

    recordCreatedFile(relativePath) {
        if (!this.createdFiles.includes(relativePath)) {
            this.createdFiles.push(relativePath);
        }
    }

    recordModifiedFile(relativePath, backupPath) {
        const existing = this.modifiedFiles.find(m => m.path === relativePath);
        if (!existing) {
            this.modifiedFiles.push({ path: relativePath, backup: backupPath });
        }
    }

    recordCreatedDir(relativePath) {
        if (!this.createdDirs.includes(relativePath)) {
            this.createdDirs.push(relativePath);
        }
    }

    getManifest() {
        return {
            version: this.version,
            installedAt: this.installedAt,
            createdFiles: [...this.createdFiles],
            modifiedFiles: [...this.modifiedFiles],
            createdDirs: [...this.createdDirs]
        };
    }

    save() {
        const manifestPath = path.join(this.projectRoot, MANIFEST_RELATIVE_PATH);
        const manifestDir = path.dirname(manifestPath);

        if (!fs.existsSync(manifestDir)) {
            fs.mkdirSync(manifestDir, { recursive: true });
        }

        fs.writeFileSync(manifestPath, JSON.stringify(this.getManifest(), null, 2));
    }

    static load(projectRoot) {
        const manifestPath = path.join(projectRoot, MANIFEST_RELATIVE_PATH);

        if (!fs.existsSync(manifestPath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(manifestPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    static getManifestPath(projectRoot) {
        return path.join(projectRoot, MANIFEST_RELATIVE_PATH);
    }
}

module.exports = InstallManifestService;
