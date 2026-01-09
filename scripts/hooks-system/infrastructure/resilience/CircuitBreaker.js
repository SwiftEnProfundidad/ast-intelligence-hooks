/**
 * =============================================================================
 * CircuitBreaker - Enterprise Resilience for AST Intelligence
 * =============================================================================
 * Implements Circuit Breaker pattern to prevent cascading failures
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
 */

const STATES = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
    constructor(options = {}) {
        this.name = options.name || 'default';
        this.failureThreshold = options.failureThreshold || 5;
        this.successThreshold = options.successThreshold || 2;
        this.timeout = options.timeout || 30000;
        this.resetTimeout = options.resetTimeout || 60000;

        this.state = STATES.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.nextAttempt = null;

        this.listeners = {
            stateChange: [],
            failure: [],
            success: [],
            rejected: []
        };
    }

    async execute(fn, fallback = null) {
        if (this.state === STATES.OPEN) {
            if (Date.now() < this.nextAttempt) {
                this._emit('rejected', { reason: 'Circuit is OPEN' });
                if (fallback) return fallback();
                throw new CircuitBreakerError(`Circuit ${this.name} is OPEN`, this.state);
            }
            this._transition(STATES.HALF_OPEN);
        }

        try {
            const result = await this._executeWithTimeout(fn);
            this._onSuccess();
            return result;
        } catch (error) {
            this._onFailure(error);
            if (fallback) return fallback();
            throw error;
        }
    }

    async _executeWithTimeout(fn) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Circuit ${this.name} timeout after ${this.timeout}ms`));
            }, this.timeout);

            Promise.resolve(fn())
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    _onSuccess() {
        this.failures = 0;
        this._emit('success', { state: this.state });

        if (this.state === STATES.HALF_OPEN) {
            this.successes++;
            if (this.successes >= this.successThreshold) {
                this._transition(STATES.CLOSED);
            }
        }
    }

    _onFailure(error) {
        this.failures++;
        this.lastFailureTime = Date.now();
        this._emit('failure', { error, failures: this.failures, state: this.state });

        if (this.state === STATES.HALF_OPEN) {
            this._transition(STATES.OPEN);
        } else if (this.failures >= this.failureThreshold) {
            this._transition(STATES.OPEN);
        }
    }

    _transition(newState) {
        const oldState = this.state;
        this.state = newState;

        if (newState === STATES.OPEN) {
            this.nextAttempt = Date.now() + this.resetTimeout;
            this.successes = 0;
        } else if (newState === STATES.CLOSED) {
            this.failures = 0;
            this.successes = 0;
            this.nextAttempt = null;
        } else if (newState === STATES.HALF_OPEN) {
            this.successes = 0;
        }

        this._emit('stateChange', { from: oldState, to: newState });
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
        return this;
    }

    _emit(event, data) {
        if (this.listeners[event]) {
            for (const callback of this.listeners[event]) {
                try {
                    callback({ ...data, circuitName: this.name, timestamp: Date.now() });
                } catch (listenerError) {
                    if (process.env.DEBUG) {
                        process.stderr.write(`[CircuitBreaker] Listener error: ${listenerError.message}\n`);
                    }
                }
            }
        }
    }

    getState() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.nextAttempt,
            isOpen: this.state === STATES.OPEN,
            isClosed: this.state === STATES.CLOSED,
            isHalfOpen: this.state === STATES.HALF_OPEN
        };
    }

    reset() {
        this._transition(STATES.CLOSED);
    }

    forceOpen() {
        this._transition(STATES.OPEN);
    }
}

class CircuitBreakerError extends Error {
    constructor(message, state) {
        super(message);
        this.name = 'CircuitBreakerError';
        this.state = state;
    }
}

class CircuitBreakerRegistry {
    constructor() {
        this.breakers = new Map();
    }

    get(name, options = {}) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker({ name, ...options }));
        }
        return this.breakers.get(name);
    }

    getAll() {
        const result = {};
        for (const [name, breaker] of this.breakers) {
            result[name] = breaker.getState();
        }
        return result;
    }

    resetAll() {
        for (const [, breaker] of this.breakers) {
            breaker.reset();
        }
    }
}

const globalRegistry = new CircuitBreakerRegistry();

const mcpCircuit = globalRegistry.get('mcp', {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 30000
});

const gitCircuit = globalRegistry.get('git', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 60000
});

const astCircuit = globalRegistry.get('ast', {
    failureThreshold: 3,
    successThreshold: 1,
    timeout: 15000,
    resetTimeout: 45000
});

module.exports = {
    CircuitBreaker,
    CircuitBreakerError,
    CircuitBreakerRegistry,
    globalRegistry,
    mcpCircuit,
    gitCircuit,
    astCircuit,
    STATES
};
