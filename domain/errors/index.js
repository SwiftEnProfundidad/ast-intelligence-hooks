/**
 * Base domain error class
 * All custom exceptions should extend this
 */
class DomainError extends Error {
    constructor(message, code = null, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Validation errors for invalid input/data
 */
class ValidationError extends DomainError {
    constructor(message, field = null, value = null) {
        super(message, 'VALIDATION_ERROR', { field, value });
    }
}

/**
 * Authentication/Authorization errors
 */
class AuthenticationError extends DomainError {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends DomainError {
    constructor(message = 'Access denied') {
        super(message, 'AUTHORIZATION_ERROR');
    }
}

/**
 * Business rule violations
 */
class BusinessRuleError extends DomainError {
    constructor(message, rule = null) {
        super(message, 'BUSINESS_RULE_ERROR', { rule });
    }
}

/**
 * Resource not found errors
 */
class NotFoundError extends DomainError {
    constructor(resource = 'Resource', id = null) {
        super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', { resource, id });
    }
}

/**
 * Conflict/State errors
 */
class ConflictError extends DomainError {
    constructor(message, currentState = null) {
        super(message, 'CONFLICT_ERROR', { currentState });
    }
}

/**
 * External service errors
 */
class ExternalServiceError extends DomainError {
    constructor(service, message, statusCode = null) {
        super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', { service, statusCode });
    }
}

/**
 * Configuration errors
 */
class ConfigurationError extends DomainError {
    constructor(message, configKey = null) {
        super(message, 'CONFIGURATION_ERROR', { configKey });
    }
}

/**
 * Audit/Guard specific errors
 */
class GuardError extends DomainError {
    constructor(message, gate = null) {
        super(message, 'GUARD_ERROR', { gate });
    }
}

class EvidenceError extends DomainError {
    constructor(message, evidencePath = null) {
        super(message, 'EVIDENCE_ERROR', { evidencePath });
    }
}

/**
 * Git operation errors
 */
class GitError extends DomainError {
    constructor(message, operation = null) {
        super(message, 'GIT_ERROR', { operation });
    }
}

/**
 * Not implemented errors for interface methods
 */
class NotImplementedError extends DomainError {
    constructor(message = 'Not implemented') {
        super(message, 'NOT_IMPLEMENTED');
    }
}

module.exports = {
    DomainError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    BusinessRuleError,
    NotFoundError,
    ConflictError,
    ExternalServiceError,
    ConfigurationError,
    GuardError,
    EvidenceError,
    GitError,
    NotImplementedError
};
