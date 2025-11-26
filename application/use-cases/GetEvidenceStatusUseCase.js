class GetEvidenceStatusUseCase {
    constructor(evidenceRepository) {
        this.evidenceRepository = evidenceRepository;
    }

    execute() {
        if (!this.evidenceRepository || typeof this.evidenceRepository.loadStatus !== 'function') {
            throw new Error('GetEvidenceStatusUseCase requires an evidenceRepository with loadStatus()');
        }
        return this.evidenceRepository.loadStatus();
    }
}

module.exports = GetEvidenceStatusUseCase;
