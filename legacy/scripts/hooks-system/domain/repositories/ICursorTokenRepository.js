const { NotImplementedError } = require('../../domain/errors');

class ICursorTokenRepository {
    async getUsageFromApi() {
        throw new NotImplementedError('getUsageFromApi must be implemented');
    }

    async getUsageFromFile() {
        throw new NotImplementedError('getUsageFromFile must be implemented');
    }
}

module.exports = ICursorTokenRepository;
