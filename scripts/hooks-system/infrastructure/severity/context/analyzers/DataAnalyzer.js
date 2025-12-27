const { execSync } = require('child_process');

class DataAnalyzer {
    handlesUserContent(filePath) {
        return filePath.includes('/comments/') ||
            filePath.includes('/posts/') ||
            filePath.includes('/reviews/') ||
            filePath.includes('/messages/');
    }

    isSharedState(violation, filePath) {
        const message = violation.message || '';
        return message.includes('shared') ||
            message.includes('global') ||
            filePath.includes('/store/') ||
            filePath.includes('/state/');
    }

    isMultiStepOperation(violation) {
        const message = violation.message || '';
        return message.includes('transaction') ||
            message.includes('multi-step') ||
            message.includes('atomic');
    }

    canBeNil(violation) {
        const message = violation.message || '';
        return message.includes('optional') ||
            message.includes('nullable') ||
            message.includes('?') ||
            message.includes('nil');
    }

    estimateDataSize(violation) {
        const metrics = violation.metrics || {};
        return metrics.dataSize || metrics.arraySize || 0;
    }

    estimateListSize(violation) {
        const metrics = violation.metrics || {};
        return metrics.listSize || 0;
    }

    getModificationFrequency(filePath, gitCommitCountFn) {
        if (typeof gitCommitCountFn === 'function') {
            return gitCommitCountFn(filePath, 30);
        }
        return 0;
    }

    getLastModified(filePath) {
        try {
            const result = execSync(
                `git log -1 --format=%cd --date=iso -- "${filePath}"`,
                { encoding: 'utf8', cwd: process.cwd(), stdio: ['pipe', 'pipe', 'ignore'] }
            );
            return result.trim();
        } catch {
            return null;
        }
    }
}

module.exports = { DataAnalyzer };
