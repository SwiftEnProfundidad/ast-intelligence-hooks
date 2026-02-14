const fs = require('fs');

class SafetyAnalyzer {
    hasErrorBoundary(violation, filePath) {
        if (!fs.existsSync(filePath)) return false;

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('try {') ||
                content.includes('ErrorBoundary') ||
                content.includes('catch {') ||
                content.includes('do {');
        } catch {
            return false;
        }
    }

    hasFallback(violation, filePath) {
        if (!fs.existsSync(filePath)) return false;

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('fallback') ||
                content.includes('default value') ||
                content.includes('?? ') ||
                content.includes('|| ');
        } catch {
            return false;
        }
    }

    hasRetryLogic(filePath) {
        if (!fs.existsSync(filePath)) return false;

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('retry') ||
                content.includes('maxRetries') ||
                content.includes('exponentialBackoff');
        } catch {
            return false;
        }
    }

    handlesCredentials(filePath) {
        if (!fs.existsSync(filePath)) return false;

        try {
            const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
            return content.includes('password') ||
                content.includes('token') ||
                content.includes('apikey') ||
                content.includes('secret') ||
                content.includes('credential');
        } catch {
            return false;
        }
    }

    handlesPII(filePath) {
        if (!fs.existsSync(filePath)) return false;

        try {
            const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
            return content.includes('email') ||
                content.includes('phone') ||
                content.includes('address') ||
                content.includes('ssn') ||
                content.includes('personaldata') ||
                content.includes('pii');
        } catch {
            return false;
        }
    }

    handlesPayments(filePath) {
        const paymentPatterns = ['/payment/', '/checkout/', '/billing/', '/stripe/', '/paypal/'];
        return paymentPatterns.some(p => filePath.toLowerCase().includes(p));
    }
}

module.exports = { SafetyAnalyzer };
