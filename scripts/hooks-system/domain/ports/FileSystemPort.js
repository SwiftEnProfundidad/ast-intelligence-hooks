class FileSystemPort {
    readDir(path) {
        throw new Error('readDir must be implemented');
    }

    readFile(path, encoding) {
        throw new Error('readFile must be implemented');
    }

    resolvePath(...paths) {
        throw new Error('resolvePath must be implemented');
    }

    exists(path) {
        throw new Error('exists must be implemented');
    }
}

module.exports = FileSystemPort;
