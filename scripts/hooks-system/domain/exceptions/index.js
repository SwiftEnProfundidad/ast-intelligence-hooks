/**
 * Custom Exception Classes for AST Intelligence System
 * Provides structured error handling with specific exception types
 */

class BaseException extends Error {
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, context = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
        this.context = context;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error()).stack;
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }
}

class ValidationException extends BaseException {
    constructor(message, field = null, context = {}) {
        super(message, 'VALIDATION_ERROR', 400, context);
        this.field = field;
    }
}

class BadRequestException extends BaseException {
    constructor(message, context = {}) {
        super(message, 'BAD_REQUEST', 400, context);
    }
}

class NotFoundException extends BaseException {
    constructor(resource = 'Resource', context = {}) {
        super(`${resource} not found`, 'NOT_FOUND', 404, context);
    }
}

class UnauthorizedException extends BaseException {
    constructor(message = 'Unauthorized access', context = {}) {
        super(message, 'UNAUTHORIZED', 401, context);
    }
}

class ForbiddenException extends BaseException {
    constructor(message = 'Forbidden access', context = {}) {
        super(message, 'FORBIDDEN', 403, context);
    }
}

class ConflictException extends BaseException {
    constructor(message, context = {}) {
        super(message, 'CONFLICT', 409, context);
    }
}

class InternalServerException extends BaseException {
    constructor(message = 'Internal server error', context = {}) {
        super(message, 'INTERNAL_SERVER_ERROR', 500, context);
    }
}

module.exports = {
    BaseException,
    ValidationException,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    InternalServerException
};
