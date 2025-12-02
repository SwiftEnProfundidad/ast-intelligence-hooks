class DomainEvent {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
        this.timestamp = new Date().toISOString();
        this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

class EvidenceStaleEvent extends DomainEvent {
    constructor(evidencePath, lastUpdated) {
        super('EVIDENCE_STALE', { evidencePath, lastUpdated });
    }
}

class GitFlowViolationEvent extends DomainEvent {
    constructor(branch, violation) {
        super('GITFLOW_VIOLATION', { branch, violation });
    }
}

class AstCriticalFoundEvent extends DomainEvent {
    constructor(findings) {
        super('AST_CRITICAL_FOUND', { findings, count: findings.length });
    }
}

class PreCommitBlockedEvent extends DomainEvent {
    constructor(reason, violations) {
        super('PRE_COMMIT_BLOCKED', { reason, violations });
    }
}

class AnalysisCompletedEvent extends DomainEvent {
    constructor(summary) {
        super('ANALYSIS_COMPLETED', summary);
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
