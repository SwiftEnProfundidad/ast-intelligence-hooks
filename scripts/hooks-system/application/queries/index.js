const { NotFoundError } = require('../../domain/errors');

class GetEvidenceStatusQuery {
    constructor() {
        this.type = 'GET_EVIDENCE_STATUS';
    }
}

class GetViolationsQuery {
    constructor(filters = {}) {
        this.type = 'GET_VIOLATIONS';
        this.filters = filters;
    }
}

class GetBranchInfoQuery {
    constructor() {
        this.type = 'GET_BRANCH_INFO';
    }
}

class GetPlatformQuery {
    constructor(filePath) {
        this.type = 'GET_PLATFORM';
        this.payload = { filePath };
    }
}

class GetStagedFilesQuery {
    constructor() {
        this.type = 'GET_STAGED_FILES';
    }
}

class QueryBus {
    constructor() {
        this.handlers = new Map();
    }

    register(queryType, handler) {
        this.handlers.set(queryType, handler);
    }

    async execute(query) {
        const handler = this.handlers.get(query.type);
        if (!handler) {
            throw new NotFoundError('Query handler', query.type);
        }
        return handler(query);
    }
}

module.exports = {
    GetEvidenceStatusQuery,
    GetViolationsQuery,
    GetBranchInfoQuery,
    GetPlatformQuery,
    GetStagedFilesQuery,
    QueryBus
};
