const fs = require('fs');

class CodeClassificationAnalyzer {
    detectMainThread(violation, filePath) {
        const indicators = [
            '@MainActor',
            'DispatchQueue.main',
            'runOnUiThread',
            'withContext(Dispatchers.Main)',
            'UI thread',
            'main thread'
        ];

        const message = violation.message || '';
        return indicators.some(indicator => message.includes(indicator)) ||
            filePath.includes('/presentation/') ||
            filePath.includes('/views/') ||
            filePath.includes('/ui/');
    }

    isProductionCode(filePath) {
        const testPatterns = ['/test/', '/__tests__/', '.test.', '.spec.', '/Tests/', '/androidTest/', '/testDebug/'];
        return !testPatterns.some(pattern => filePath.includes(pattern));
    }

    isTestCode(filePath) {
        return !this.isProductionCode(filePath);
    }

    detectLayer(filePath) {
        if (filePath.includes('/domain/') || filePath.includes('/Domain/')) return 'DOMAIN';
        if (filePath.includes('/application/') || filePath.includes('/Application/')) return 'APPLICATION';
        if (filePath.includes('/infrastructure/') || filePath.includes('/Infrastructure/') ||
            filePath.includes('/data/')) return 'INFRASTRUCTURE';
        if (filePath.includes('/presentation/') || filePath.includes('/Presentation/') ||
            filePath.includes('/ui/')) return 'PRESENTATION';
        return 'UNKNOWN';
    }

    isPublicAPI(filePath) {
        if (!fs.existsSync(filePath)) return false;

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('export ') ||
                content.includes('public ') ||
                filePath.includes('/api/') ||
                filePath.includes('/public/');
        } catch {
            return false;
        }
    }

    isSharedKernel(filePath) {
        return filePath.includes('/shared/') ||
            filePath.includes('/common/') ||
            filePath.includes('/core/') ||
            filePath.includes('@pumuki-mock-consumer/shared');
    }

    hasBusinessLogic(filePath, layer) {
        // layer can be passed in or detected again if not provided
        const detectedLayer = layer || this.detectLayer(filePath);
        return detectedLayer === 'DOMAIN' ||
            detectedLayer === 'APPLICATION' ||
            filePath.includes('/use-case/') ||
            filePath.includes('/UseCase/');
    }
}

module.exports = { CodeClassificationAnalyzer };
