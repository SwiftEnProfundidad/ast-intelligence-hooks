class DomainError extends Error {
    constructor(message, code = null, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends DomainError {
    constructor(message, field = null, value = null) {
        super(message, 'VALIDATION_ERROR', { field, value });
    }
}

class ConfigurationError extends DomainError {
    constructor(message, configKey = null) {
        super(message, 'CONFIGURATION_ERROR', { configKey });
    }
}

class NotFoundError extends DomainError {
    constructor(resource = 'Resource', id = null) {
        super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', { resource, id });
    }
}

class NotImplementedError extends DomainError {
    constructor(message = 'Not implemented') {
        super(message, 'NOT_IMPLEMENTED');
    }
}

module.exports = {
    DomainError,
    ValidationError,
    ConfigurationError,
    NotFoundError,
    NotImplementedError
};
