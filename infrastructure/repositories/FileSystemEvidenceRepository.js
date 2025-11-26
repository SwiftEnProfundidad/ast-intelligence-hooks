const fs = require('fs');
const path = require('path');

const EvidenceStatus = require('../../domain/entities/EvidenceStatus');

class FileSystemEvidenceRepository {
    constructor(options) {
        const opts = options || {};
        this.repoRoot = typeof opts.repoRoot === 'string' && opts.repoRoot.length > 0 ? opts.repoRoot : process.cwd();
        this.maxAgeSeconds = typeof opts.maxAgeSeconds === 'number' ? opts.maxAgeSeconds : 180;
        this.evidencePath = path.join(this.repoRoot, '.AI_EVIDENCE.json');
    }

    loadStatus() {
        const now = new Date();
        if (!fs.existsSync(this.evidencePath)) {
            throw new Error(`Evidence file not found at ${this.evidencePath}`);
        }
        const raw = fs.readFileSync(this.evidencePath, 'utf8');
        let json;
        try {
            json = JSON.parse(raw);
        } catch (e) {
            throw new Error(`Invalid JSON in evidence file: ${e.message}`);
        }
        return EvidenceStatus.fromEvidenceJson(json, { now, maxAgeSeconds: this.maxAgeSeconds });
    }
}

module.exports = FileSystemEvidenceRepository;
