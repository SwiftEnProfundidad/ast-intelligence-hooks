const { ValidationError } = require('../errors');

class DomainEvent {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
        this.timestamp = new Date().toISOString();
        this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    validate() {
        if (!this.type) throw new ValidationError('Event type is required', 'type', this.type);
        if (!this.payload) throw new ValidationError('Event payload is required', 'payload', this.payload);
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
        if (!this.payload.evidencePath) {
            throw new ValidationError('Evidence path is required', 'payload.evidencePath', this.payload.evidencePath);
        }
    }
}

class GitFlowViolationEvent extends DomainEvent {
    constructor(branch, violation) {
        super('GITFLOW_VIOLATION', { branch, violation });
        this.validate();
    }

    validate() {
        super.validate();
        if (!this.payload.branch) {
            throw new ValidationError('Branch name is required', 'payload.branch', this.payload.branch);
        }
        if (!this.payload.violation) {
            throw new ValidationError('Violation details are required', 'payload.violation', this.payload.violation);
        }
    }
}

class AstCriticalFoundEvent extends DomainEvent {
    constructor(findings) {
        super('AST_CRITICAL_FOUND', { findings, count: findings.length });
        this.validate();
    }

    validate() {
        super.validate();
        if (!Array.isArray(this.payload.findings)) {
            throw new ValidationError('Findings must be an array', 'payload.findings', this.payload.findings);
        }
    }
}

class PreCommitBlockedEvent extends DomainEvent {
    constructor(reason, violations) {
        super('PRE_COMMIT_BLOCKED', { reason, violations });
        this.validate();
    }
}

class AnalysisCompletedEvent extends DomainEvent {
    constructor(summary) {
        super('ANALYSIS_COMPLETED', summary);
        this.validate();
    }
}

class EventBus {
    constructor() {
        this.subscribers = new Map();
        this.processedIds = new Set();
        this.maxProcessed = 500;
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
        if (event?.id && this.processedIds.has(event.id)) {
            return event;
        }
        const handlers = this.subscribers.get(event.type) || [];
        const wildcardHandlers = this.subscribers.get('*') || [];
        const allHandlers = [...handlers, ...wildcardHandlers];

        await Promise.all(allHandlers.map(handler => handler(event)));

        if (event?.id) {
            this.processedIds.add(event.id);
            if (this.processedIds.size > this.maxProcessed) {
                const iter = this.processedIds.values();
                for (let i = 0; i < 50 && this.processedIds.size > this.maxProcessed; i++) {
                    const next = iter.next();
                    if (!next.done) this.processedIds.delete(next.value);
                }
            }
        }
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
