const {
    ValidationException,
    BadRequestException,
    InternalServerException
} = require('../exceptions');

class DomainEvent {
    constructor(type, payload) {
        if (!type) throw new ValidationException('Event type is required', { field: 'type' });
        if (!payload) throw new ValidationException('Event payload is required', { field: 'payload' });
        this.type = type;
        this.payload = payload;
        this.timestamp = new Date().toISOString();
        this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    validate() {
        if (!this.type) throw new ValidationException('Event type is required', { field: 'type' });
        if (!this.payload) throw new ValidationException('Event payload is required', { field: 'payload' });
        return true;
    }

    getSummary() {
        return `[${this.timestamp}] ${this.type}: ${JSON.stringify(this.payload)}`;
    }

    isCritical() {
        return this.type.includes('CRITICAL') || this.type.includes('BLOCKED');
    }
}

class EvidenceStaleEvent extends DomainEvent {
    constructor(evidencePath, lastUpdated) {
        super('EVIDENCE_STALE', { evidencePath, lastUpdated });
        this.validate();
    }

    validate() {
        super.validate();
        if (!this.payload.evidencePath) throw new ValidationException('Evidence path is required', { field: 'evidencePath' });
    }
}

class GitFlowViolationEvent extends DomainEvent {
    constructor(branch, violation) {
        super('GITFLOW_VIOLATION', { branch, violation });
        this.validate();
    }

    validate() {
        super.validate();
        if (!this.payload.branch) throw new ValidationException('Branch name is required', { field: 'branch' });
        if (!this.payload.violation) throw new ValidationException('Violation details are required', { field: 'violation' });
    }
}

class AstCriticalFoundEvent extends DomainEvent {
    constructor(findings) {
        super('AST_CRITICAL_FOUND', { findings, count: findings.length });
        this.validate();
    }

    validate() {
        super.validate();
        if (!Array.isArray(this.payload.findings)) throw new ValidationException('Findings must be an array', { field: 'findings' });
    }
}

class PreCommitBlockedEvent extends DomainEvent {
    constructor(reason, violations) {
        super('PRE_COMMIT_BLOCKED', { reason, violations });
        this.validate();
    }

    validate() {
        super.validate();
        if (!this.payload.reason) throw new ValidationException('Reason is required', { field: 'reason' });
        if (!this.payload.violations) throw new ValidationException('Violations are required', { field: 'violations' });
    }
}

class AnalysisCompletedEvent extends DomainEvent {
    constructor(summary) {
        super('ANALYSIS_COMPLETED', summary);
        this.validate();
    }

    validate() {
        super.validate();
        if (!this.payload) throw new ValidationException('Summary is required', { field: 'summary' });
    }
}

class EventBus {
    constructor() {
        this.subscribers = new Map();
    }

    subscribe(eventType, handler) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(handler);
        return () => this.unsubscribe(eventType, handler);
    }

    unsubscribe(eventType, handler) {
        const handlers = this.subscribers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) handlers.splice(index, 1);
        }
    }

    async publish(event) {
        const handlers = this.subscribers.get(event.type) || [];
        const wildcardHandlers = this.subscribers.get('*') || [];
        const allHandlers = [...handlers, ...wildcardHandlers];

        await Promise.all(allHandlers.map(handler => handler(event)));
        return event;
    }

    subscribeAll(handler) {
        return this.subscribe('*', handler);
    }
}

const globalEventBus = new EventBus();

module.exports = {
    DomainEvent,
    EvidenceStaleEvent,
    GitFlowViolationEvent,
    AstCriticalFoundEvent,
    PreCommitBlockedEvent,
    AnalysisCompletedEvent,
    EventBus,
    globalEventBus
};
