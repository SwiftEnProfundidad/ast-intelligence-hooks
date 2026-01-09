const fs = require('fs').promises;
const path = require('path');
const FileSystemPort = require('../../domain/ports/FileSystemPort');

class NodeFileSystemAdapter extends FileSystemPort {
    async readDir(dirPath) {
        return fs.readdir(dirPath);
    }

    async readFile(filePath, encoding = 'utf8') {
        return fs.readFile(filePath, encoding);
    }

    resolvePath(...paths) {
        return path.resolve(...paths);
    }

    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = NodeFileSystemAdapter;
