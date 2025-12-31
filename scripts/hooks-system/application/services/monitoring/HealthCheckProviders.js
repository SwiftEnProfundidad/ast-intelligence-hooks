const fs = require('fs');
const path = require('path');

const {
    createMetricScope: createMetricScope
} = require('../../../infrastructure/telemetry/metric-scope');

const defaultHeartbeatPath = repoRoot => path.join(repoRoot, '.audit_tmp', 'guard-heartbeat.json');
const defaultTokenUsagePath = repoRoot => path.join(repoRoot, '.audit_tmp', 'token-usage.jsonl');
const defaultEvidencePath = repoRoot => path.join(repoRoot, '.AI_EVIDENCE.json');

const resolvePath = (maybePath, fallback) => {
    if (!maybePath) {
        return fallback();
    }
    return path.isAbsolute(maybePath) ? maybePath : path.join(process.cwd(), maybePath);
};

const safeReadJson = targetPath => {
    const content = fs.readFileSync(targetPath, 'utf8');
    return JSON.parse(content);
};

const makeEvidenceProvider = ({ repoRoot, evidencePath }) => async () => {
    const target = evidencePath || defaultEvidencePath(repoRoot);
    if (!fs.existsSync(target)) {
        return { name: 'evidence', status: 'error', details: { message: 'missing .AI_EVIDENCE.json' } };
    }

    try {
        const content = safeReadJson(target);
        const timestamp = new Date(content.timestamp || 0).getTime();
        if (!Number.isFinite(timestamp) || timestamp === 0) {
            return { name: 'evidence', status: 'error', details: { message: 'invalid timestamp' } };
        }
        const ageMs = Date.now() - timestamp;
        const status = ageMs > 15 * 60 * 1000 ? 'error' : ageMs > 5 * 60 * 1000 ? 'warn' : 'ok';
        return {
            name: 'evidence',
            status,
            details: {
                ageMs,
                timestamp: content.timestamp
            }
        };
    } catch (error) {
        return { name: 'evidence', status: 'error', details: { message: error.message } };
    }
};

const makeGitTreeProvider = ({ repoRoot, getGitTreeState, warningThreshold = 12, errorThreshold = 24 }) => async () => {
    if (typeof getGitTreeState !== 'function') {
        return { name: 'gitTree', status: 'error', details: { message: 'getGitTreeState not provided' } };
    }

    try {
        const state = await getGitTreeState({ repoRoot });
        if (!state) {
            return { name: 'gitTree', status: 'warn', details: { message: 'no state returned' } };
        }
        const unique = state.uniqueCount || 0;
        const status = unique > errorThreshold ? 'error' : unique > warningThreshold ? 'warn' : 'ok';
        return { name: 'gitTree', status, details: state };
    } catch (error) {
        return { name: 'gitTree', status: 'error', details: { message: error.message } };
    }
};

const makeHeartbeatProvider = ({ repoRoot, heartbeatPath }) => async () => {
    const target = heartbeatPath || defaultHeartbeatPath(repoRoot);
    if (!fs.existsSync(target)) {
        return { name: 'heartbeat', status: 'error', details: { message: 'missing heartbeat file' } };
    }

    try {
        const data = safeReadJson(target);
        const timestamp = Date.parse(data.timestamp);
        if (!Number.isFinite(timestamp)) {
            return { name: 'heartbeat', status: 'error', details: { message: 'invalid timestamp' } };
        }
        const ageMs = Date.now() - timestamp;
        const statusField = (data.status || '').toLowerCase();
        const status = ageMs > 60000 || (statusField && statusField !== 'healthy') ? 'warn' : 'ok';
        return { name: 'heartbeat', status, details: data };
    } catch (error) {
        return { name: 'heartbeat', status: 'error', details: { message: error.message } };
    }
};

const makeTokenProvider = ({ repoRoot, tokenUsagePath }) => async () => {
    const target = tokenUsagePath || defaultTokenUsagePath(repoRoot);
    if (!fs.existsSync(target)) {
        return { name: 'tokens', status: 'warn', details: { message: 'no usage log found' } };
    }

    try {
        const lines = fs.readFileSync(target, 'utf8').trim().split('\n').filter(Boolean);
        if (!lines.length) {
            return { name: 'tokens', status: 'warn', details: { message: 'empty token usage log' } };
        }
        const last = JSON.parse(lines[lines.length - 1]);
        const percent = Number.isFinite(Number(last.percentUsed)) ? Number(last.percentUsed) : Number((last.tokensUsed / last.maxTokens) * 100);
        if (!Number.isFinite(percent)) {
            return { name: 'tokens', status: 'warn', details: { message: 'token usage percent unavailable' } };
        }
        const status = percent >= 95 ? 'error' : percent >= 85 ? 'warn' : 'ok';
        return { name: 'tokens', status, details: { percent } };
    } catch (error) {
        return { name: 'tokens', status: 'error', details: { message: error.message } };
    }
};

const makeProcessProvider = ({ name, pidResolver }) => async () => {
    if (typeof pidResolver !== 'function') {
        return { name, status: 'warn', details: { message: 'pid resolver missing' } };
    }
    try {
        const pid = await pidResolver();
        if (!pid) {
            return { name, status: 'error', details: { message: 'process not running' } };
        }
        try {
            process.kill(pid, 0);
            return { name, status: 'ok', details: { pid } };
        } catch (error) {
            return { name, status: 'error', details: { message: 'process unreachable', pid } };
        }
    } catch (error) {
        return { name, status: 'error', details: { message: error.message } };
    }
};

const createHealthCheckProviders = ({
    repoRoot = process.cwd(),
    getGitTreeState,
    heartbeatPath,
    tokenUsagePath,
    evidencePath,
    processes = []
} = {}) => {
    const providers = [
        makeEvidenceProvider({ repoRoot, evidencePath }),
        makeGitTreeProvider({ repoRoot, getGitTreeState }),
        makeHeartbeatProvider({ repoRoot, heartbeatPath }),
        makeTokenProvider({ repoRoot, tokenUsagePath })
    ];

    processes.forEach(processConfig => {
        providers.push(makeProcessProvider(processConfig));
    });

    return providers;
};

module.exports = {
    createHealthCheckProviders
};
