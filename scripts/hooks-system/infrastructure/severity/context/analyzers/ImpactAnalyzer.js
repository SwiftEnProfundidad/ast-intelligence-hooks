const { execSync } = require('child_process');
const path = require('path');

class ImpactAnalyzer {
    estimateCallFrequency(violation, filePath, gitCommitCountFn) {
        if (filePath.includes('/dashboard/') || filePath.includes('/home/')) return 5000;
        if (filePath.includes('/payment/') || filePath.includes('/checkout/')) return 1000;
        if (filePath.includes('/admin/')) return 100;
        if (filePath.includes('/settings/')) return 50;

        // Use passed function or default logic if needed, but ContextBuilder had it inline.
        // We will assume gitCommitCountFn is passed or logic moved here.
        // For now, let's keep the git logic here if it's specific to this estimation, 
        // or assume we get the commit count passed in to keep this class IO-free if possible?
        // The original code mixed them. Let's replicate original logic but maybe delegate git operations.

        // Ideally, Git operations should be in a GitAdapter, but for this refactor we keep behavior similar.
        if (typeof gitCommitCountFn === 'function') {
            const commits = gitCommitCountFn(filePath, 30);
            if (commits > 10) return 2000;
            if (commits > 5) return 500;
        }

        return 100;
    }

    isUserFacing(filePath) {
        const uiFolders = ['/views/', '/ui/', '/components/', '/pages/', '/screens/'];
        return uiFolders.some(folder => filePath.includes(folder));
    }

    isCriticalPath(violation, filePath) {
        const criticalPaths = [
            '/payment/',
            '/checkout/',
            '/auth/',
            '/signup/',
            '/login/',
            '/order/',
            '/transaction/'
        ];

        return criticalPaths.some(p => filePath.toLowerCase().includes(p)) ||
            (violation.message && violation.message.toLowerCase().includes('payment')) ||
            (violation.message && violation.message.toLowerCase().includes('auth'));
    }

    isHotPath(filePath) {
        return filePath.includes('/render/') ||
            filePath.includes('/animation/') ||
            filePath.includes('/scroll/');
    }

    countDependents(filePath) {
        try {
            const fileName = path.basename(filePath, path.extname(filePath));
            const result = execSync(
                `git grep -l "import.*${fileName}" | wc -l`,
                { encoding: 'utf8', cwd: process.cwd(), stdio: ['pipe', 'pipe', 'ignore'] }
            );
            return parseInt(result.trim()) || 0;
        } catch {
            return 0;
        }
    }
}

module.exports = { ImpactAnalyzer };
