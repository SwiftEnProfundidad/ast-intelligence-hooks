class IEvidenceRepository {
    async loadStatus() {
        throw new Error('IEvidenceRepository.loadStatus() must be implemented');
    }
}

module.exports = IEvidenceRepository;
