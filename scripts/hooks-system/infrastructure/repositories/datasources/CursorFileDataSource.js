const fs = require('fs');

class CursorFileDataSource {
    constructor({
        usageFile,
        fsModule = fs,
        logger = console
    } = {}) {
        this.usageFile = usageFile;
        this.fs = fsModule;
        this.logger = logger;
    }

    async readUsage() {
        try {
            await this.fs.promises.access(this.usageFile, this.fs.constants.F_OK);
        } catch (error) {
            if (this.logger && this.logger.debug) {
                this.logger.debug('CURSOR_FILE_DATASOURCE_NOT_FOUND', { path: this.usageFile, error: error.message });
            }
            return null;
        }

        try {
            const content = await this.fs.promises.readFile(this.usageFile, 'utf8');
            const lines = content.trimEnd().split('\n');

            // Read from end (latest)
            for (let index = lines.length - 1; index >= 0; index -= 1) {
                const line = lines[index].trim();
                if (!line) {
                    continue;
                }
                try {
                    const parsed = JSON.parse(line);
                    if (parsed && typeof parsed === 'object') {
                        return parsed;
                    }
                } catch (error) {
                    if (this.logger && this.logger.debug) {
                        this.logger.debug('CURSOR_FILE_DATASOURCE_MALFORMED_LINE', { error: error.message });
                    }
                }
            }
            return null;
        } catch (error) {
            if (this.logger && this.logger.error) {
                this.logger.error('CURSOR_FILE_DATASOURCE_READ_FAILED', { error: error.message });
            }
            return null;
        }
    }
}

module.exports = CursorFileDataSource;
