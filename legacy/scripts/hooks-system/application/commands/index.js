const path = require('path');
const { NotFoundError } = require('../../domain/errors');

class ValidateEvidenceCommand {
    constructor(evidencePath) {
        this.type = 'VALIDATE_EVIDENCE';
        this.payload = { evidencePath };
    }
}

class RunPreCommitCommand {
    constructor(stagedFiles) {
        this.type = 'RUN_PRE_COMMIT';
        this.payload = { stagedFiles };
    }
}

class CheckGitFlowCommand {
    constructor(branch) {
        this.type = 'CHECK_GITFLOW';
        this.payload = { branch };
    }
}

class UpdateEvidenceCommand {
    constructor(data) {
        this.type = 'UPDATE_EVIDENCE';
        this.payload = data;
    }
}

class RunAstAnalysisCommand {
    constructor(files, platform) {
        this.type = 'RUN_AST_ANALYSIS';
        this.payload = { files, platform };
    }
}

class CommandBus {
    constructor() {
        this.handlers = new Map();
    }

    register(commandType, handler) {
        this.handlers.set(commandType, handler);
    }

    async execute(command) {
        const handler = this.handlers.get(command.type);
        if (!handler) {
            throw new NotFoundError('Command handler', command.type);
        }
        return handler(command.payload);
    }
}

module.exports = {
    ValidateEvidenceCommand,
    RunPreCommitCommand,
    CheckGitFlowCommand,
    UpdateEvidenceCommand,
    RunAstAnalysisCommand,
    CommandBus
};
