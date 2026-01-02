const env = require('../../config/env');

const fs = require('fs');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m'
};

class FileSystemInstallerService {
    constructor(targetRoot, hookSystemRoot, logger = null) {
        this.targetRoot = targetRoot || process.cwd();
        this.hookSystemRoot = hookSystemRoot;
        this.logger = logger;
    }

    createDirectoryStructure() {
        const dirs = [
            'scripts/hooks-system',
            'scripts/hooks-system/docs',
            'scripts/hooks-system/config'
        ];

        dirs.forEach(dir => {
            const fullPath = path.join(this.targetRoot, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                if (this.logger) this.logger.debug('DIR_CREATED', { path: fullPath });
            }
        });
        this.logSuccess('Directory structure created');
    }

    copySystemFiles() {
        const itemsToCopy = [
            'domain/',
            'application/',
            'infrastructure/',
            'presentation/',
            'docs/examples/',
            'docs/guides/',
            'config/',
            'bin/',
            'index.js'
        ];

        itemsToCopy.forEach(item => {
            const source = path.join(this.hookSystemRoot, item);
            const dest = path.join(this.targetRoot, 'scripts/hooks-system', item);

            if (fs.existsSync(source)) {
                if (item === 'infrastructure/') {
                    this.copyRecursiveExcluding(source, dest, ['scripts']);
                } else {
                    this.copyRecursive(source, dest);
                }
            }
        });
        this.logSuccess('System files copied');
        if (this.logger) this.logger.info('SYSTEM_FILES_COPIED');
    }

    copyManageLibraryScript() {
        // Assuming hookSystemRoot is .../scripts/hooks-system or .../node_modules/@package/
        // We need to go up to the root of the library package
        const libraryRoot = path.resolve(this.hookSystemRoot, '..');
        const source = path.join(libraryRoot, 'manage-library.sh');
        const dest = path.join(this.targetRoot, 'manage-library.sh');

        if (fs.existsSync(source) && !fs.existsSync(dest)) {
            fs.copyFileSync(source, dest);
            fs.chmodSync(dest, '755');
            this.logSuccess('Copied manage-library.sh to project root');
        }
    }

    copyRecursive(source, dest) {
        if (fs.statSync(source).isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(source).forEach(file => {
                this.copyRecursive(path.join(source, file), path.join(dest, file));
            });
        } else {
            fs.copyFileSync(source, dest);
        }
    }

    copyRecursiveExcluding(source, dest, excludeDirs) {
        if (fs.statSync(source).isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(source).forEach(file => {
                if (excludeDirs.includes(file)) {
                    return;
                }
                this.copyRecursiveExcluding(
                    path.join(source, file),
                    path.join(dest, file),
                    excludeDirs
                );
            });
        } else {
            fs.copyFileSync(source, dest);
        }
    }

    logSuccess(msg) { process.stdout.write(`${COLORS.green}✓ ${msg}${COLORS.reset}\n`); }
}

module.exports = FileSystemInstallerService;
