const { execSync } = require('child_process');

const extractFilePath = line => {
    if (!line) {
        return '';
    }
    if (line.startsWith('??')) {
        return line.slice(3).trim();
    }
    return line.length > 3 ? line.slice(3).trim() : line.trim();
};

const buildStateFromStatus = (statusOutput = '') => {
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

    return {
        stagedFiles: Array.from(stagedSet),
        workingFiles: Array.from(workingSet),
        stagedCount: stagedSet.size,
        workingCount: workingSet.size,
        uniqueCount: uniqueSet.size
    };
};

const getGitTreeState = ({ repoRoot = process.cwd() } = {}) => {
    try {
        const statusOutput = execSync('git status --porcelain', {
            cwd: repoRoot,
            encoding: 'utf8'
        });
        return buildStateFromStatus(statusOutput);
    } catch (error) {
        return {
            stagedFiles: [],
            workingFiles: [],
            stagedCount: 0,
            workingCount: 0,
            uniqueCount: 0,
            error: error.message
        };
    }
};

const isTreeBeyondLimit = (state, limit) => {
    if (!state || !Number.isFinite(limit) || limit <= 0) {
        return false;
    }
    return (
        state.stagedCount > limit ||
        state.workingCount > limit ||
        state.uniqueCount > limit
    );
};

const summarizeTreeState = (state, limit) => {
    if (!state) {
        return 'no data';
    }
    const parts = [
        `staged ${state.stagedCount}`,
        `working ${state.workingCount}`,
        `unique ${state.uniqueCount}`
    ];
    if (Number.isFinite(limit) && limit > 0) {
        parts.push(`limit ${limit}`);
    }
    return parts.join(', ');
};

module.exports = {
    getGitTreeState,
    isTreeBeyondLimit,
    summarizeTreeState,
    buildStateFromStatus
};
