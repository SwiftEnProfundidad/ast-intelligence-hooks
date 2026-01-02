const { recordMetric } = require('./metrics-logger');

function truncateString(value, maxLen) {
    if (typeof value !== 'string') {
        return value;
    }
    if (!Number.isFinite(maxLen) || maxLen <= 0) {
        return value;
    }
    if (value.length <= maxLen) {
        return value;
    }
    return value.substring(0, maxLen);
}

function sanitizeMeta(meta, { maxStringLength = 120 } = {}) {
    if (!meta || typeof meta !== 'object') {
        return {};
    }

    const out = {};
    for (const [k, v] of Object.entries(meta)) {
        if (v == null) {
            continue;
        }
        if (typeof v === 'string') {
            out[k] = truncateString(v, maxStringLength);
            continue;
        }
        if (typeof v === 'number' || typeof v === 'boolean') {
            out[k] = v;
            continue;
        }
        if (v instanceof Error) {
            out[k] = truncateString(v.message, maxStringLength);
            continue;
        }

        try {
            out[k] = JSON.parse(JSON.stringify(v));
        } catch {
            out[k] = truncateString(String(v), maxStringLength);
        }
    }
    return out;
}

function toErrorMeta(error, { maxStringLength = 160 } = {}) {
    if (!error) {
        return {};
    }

    if (typeof error === 'string') {
        return { error: truncateString(error, maxStringLength) };
    }

    const err = error instanceof Error ? error : null;
    if (!err) {
        return { error: truncateString(String(error), maxStringLength) };
    }

    return {
        error: truncateString(err.message, maxStringLength),
        errorName: truncateString(err.name, 80)
    };
}

function createMetricScope({ hook, operation, baseMeta = {}, options = {} } = {}) {
    const base = sanitizeMeta({ ...baseMeta }, options);

    const startedAt = Date.now();

    function emit(status, meta = {}) {
        recordMetric({
            hook,
            operation,
            status,
            ...base,
            ...sanitizeMeta(meta, options)
        });
    }

    return {
        started(meta = {}) {
            emit('started', meta);
        },
        success(meta = {}) {
            emit('success', { durationMs: Date.now() - startedAt, ...meta });
        },
        failed(error, meta = {}) {
            emit('failed', { durationMs: Date.now() - startedAt, ...toErrorMeta(error, options), ...meta });
        }
    };
}

module.exports = {
    createMetricScope
};
