const { execSync } = require('child_process');
const path = require('path');
const AuditLogger = require('./logging/AuditLogger');

// Import recordMetric for prometheus metrics
const { recordMetric } = require(path.join(__dirname, '..', '..', 'infrastructure', 'telemetry', 'metrics-logger'));

const extractFilePath = line => {
    recordMetric({
        hook: 'git_tree_state',
        operation: 'extract_file_path',
        status: 'started',
        lineLength: line ? line.length : 0
    });

    if (!line) {
        recordMetric({
            hook: 'git_tree_state',
            operation: 'extract_file_path',
            status: 'success',
            result: ''
        });
        return '';
    }
    if (line.startsWith('??')) {
        const result = line.slice(3).trim();
        recordMetric({
            hook: 'git_tree_state',
            operation: 'extract_file_path',
            status: 'success',
            resultLength: result.length
        });
        return result;
    }
    const result = line.length > 3 ? line.slice(3).trim() : line.trim();
    recordMetric({
        hook: 'git_tree_state',
        operation: 'extract_file_path',
        status: 'success',
        resultLength: result.length
    });
    return result;
};

const buildStateFromStatus = (statusOutput = '') => {
    recordMetric({
        hook: 'git_tree_state',
        operation: 'build_state_from_status',
        status: 'started',
        statusOutputLength: statusOutput ? statusOutput.length : 0
    });

    const lines = statusOutput
        .split('\n')
        .map(entry => entry.replace(/\r$/, ''))
        .filter(entry => entry && entry.length >= 3);

    const stagedSet = new Set();
    const workingSet = new Set();

    lines.forEach(line => {
        if (line.startsWith('??')) {
            const file = extractFilePath(line);
            if (file) {
                workingSet.add(file);
            }
            return;
        }

        const stagedFlag = line[0];
        const workingFlag = line[1];
        const file = extractFilePath(line);

        if (file) {
            if (stagedFlag && stagedFlag !== ' ') {
                stagedSet.add(file);
            }
            if (workingFlag && workingFlag !== ' ') {
                workingSet.add(file);
            }
        }
    });

    const uniqueSet = new Set([...stagedSet, ...workingSet]);

    const result = {
        stagedFiles: Array.from(stagedSet),
        workingFiles: Array.from(workingSet),
        stagedCount: stagedSet.size,
        workingCount: workingSet.size,
        uniqueCount: uniqueSet.size
    };

    recordMetric({
        hook: 'git_tree_state',
        operation: 'build_state_from_status',
        status: 'success',
        stagedCount: stagedSet.size,
        workingCount: workingSet.size,
        uniqueCount: uniqueSet.size
    });

    return result;
};

const getGitTreeState = ({ repoRoot = process.cwd() } = {}) => {
    recordMetric({
        hook: 'git_tree_state',
        operation: 'get_git_tree_state',
        status: 'started',
        repoRoot: repoRoot.substring(0, 100)
    });

    try {
        const statusOutput = execSync('git status --porcelain', {
            cwd: repoRoot,
            encoding: 'utf8'
        });
        const result = buildStateFromStatus(statusOutput);
        recordMetric({
            hook: 'git_tree_state',
            operation: 'get_git_tree_state',
            status: 'success',
            stagedCount: result.stagedCount,
            workingCount: result.workingCount,
            uniqueCount: result.uniqueCount
        });
        return result;
    } catch (error) {
        const result = {
            stagedFiles: [],
            workingFiles: [],
            stagedCount: 0,
            workingCount: 0,
            uniqueCount: 0,
            error: error.message
        };
        recordMetric({
            hook: 'git_tree_state',
            operation: 'get_git_tree_state',
            status: 'failed',
            error: error.message
        });
        return result;
    }
};

const isTreeBeyondLimit = (state, limits) => {
    recordMetric({
        hook: 'git_tree_state',
        operation: 'is_tree_beyond_limit',
        status: 'started',
        hasState: !!state,
        limitsType: typeof limits
    });

    if (!state) {
        recordMetric({
            hook: 'git_tree_state',
            operation: 'is_tree_beyond_limit',
            status: 'success',
            result: false
        });
        return false;
    }

    if (typeof limits === 'number') {
        const limit = limits;
        if (!Number.isFinite(limit) || limit <= 0) {
            recordMetric({
                hook: 'git_tree_state',
                operation: 'is_tree_beyond_limit',
                status: 'success',
                result: false
            });
            return false;
        }
        const result = (
            state.stagedCount > limit ||
            state.workingCount > limit ||
            state.uniqueCount > limit
        );
        recordMetric({
            hook: 'git_tree_state',
            operation: 'is_tree_beyond_limit',
            status: 'success',
            result: result
        });
        return result;
    }

    const { stagedLimit = 10, unstagedLimit = 15, totalLimit = 20 } = limits || {};

    const stagedExceeded = Number.isFinite(stagedLimit) && stagedLimit > 0 && state.stagedCount > stagedLimit;
    const unstagedExceeded = Number.isFinite(unstagedLimit) && unstagedLimit > 0 && state.workingCount > unstagedLimit;
    const totalExceeded = Number.isFinite(totalLimit) && totalLimit > 0 && state.uniqueCount > totalLimit;

    const result = stagedExceeded || unstagedExceeded || totalExceeded;
    recordMetric({
        hook: 'git_tree_state',
        operation: 'is_tree_beyond_limit',
        status: 'success',
        result: result
    });
    return result;
};

const summarizeTreeState = (state, limits) => {
    recordMetric({
        hook: 'git_tree_state',
        operation: 'summarize_tree_state',
        status: 'started',
        hasState: !!state,
        limitsType: typeof limits
    });

    if (!state) {
        recordMetric({
            hook: 'git_tree_state',
            operation: 'summarize_tree_state',
            status: 'success',
            result: 'no data'
        });
        return 'no data';
    }
    const parts = [
        `staged ${state.stagedCount}`,
        `working ${state.workingCount}`,
        `unique ${state.uniqueCount}`
    ];

    if (typeof limits === 'number') {
        const limit = limits;
        if (Number.isFinite(limit) && limit > 0) {
            parts.push(`limit ${limit}`);
        }
    } else if (limits && typeof limits === 'object') {
        const { stagedLimit = 10, unstagedLimit = 15, totalLimit = 20 } = limits;
        const limitParts = [];
        if (Number.isFinite(stagedLimit) && stagedLimit > 0) {
            limitParts.push(`staged limit ${stagedLimit}`);
        }
        if (Number.isFinite(unstagedLimit) && unstagedLimit > 0) {
            limitParts.push(`unstaged limit ${unstagedLimit}`);
        }
        if (Number.isFinite(totalLimit) && totalLimit > 0) {
            limitParts.push(`total limit ${totalLimit}`);
        }
        if (limitParts.length > 0) {
            parts.push(`(${limitParts.join(', ')})`);
        }
    }
    const result = parts.join(', ');
    recordMetric({
        hook: 'git_tree_state',
        operation: 'summarize_tree_state',
        status: 'success',
        resultLength: result.length
    });
    return result;
};

module.exports = {
    getGitTreeState,
    isTreeBeyondLimit,
    summarizeTreeState,
    buildStateFromStatus
};
