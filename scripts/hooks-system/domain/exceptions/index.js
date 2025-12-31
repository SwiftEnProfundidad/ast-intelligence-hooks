/**
 * Custom Exception Classes for AST Intelligence System
 * Provides structured error handling with specific exception types
 */

class BaseException extends Error {
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

class ValidationException extends BaseException {
    constructor(message, field = null) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }
}

class BadRequestException extends BaseException {
    constructor(message) {
        super(message, 'BAD_REQUEST', 400);
    }
}

class NotFoundException extends BaseException {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404);
    }
}

class UnauthorizedException extends BaseException {
    constructor(message = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED', 401);
    }
}

class ForbiddenException extends BaseException {
    constructor(message = 'Forbidden access') {
        super(message, 'FORBIDDEN', 403);
    }
}

class ConflictException extends BaseException {
    constructor(message) {
        super(message, 'CONFLICT', 409);
    }
}

class InternalServerException extends BaseException {
    constructor(message = 'Internal server error') {
        super(message, 'INTERNAL_SERVER_ERROR', 500);
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
