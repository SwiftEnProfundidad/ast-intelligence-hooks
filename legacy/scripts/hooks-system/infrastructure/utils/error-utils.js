function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return String(error);
}

function toErrorDetails(error) {
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
            name: error.name,
            cause: error.cause
        };
    }
    return {
        message: toErrorMessage(error),
        stack: undefined,
        name: 'UnknownError',
        cause: undefined
    };
}

module.exports = { toErrorMessage, toErrorDetails };
