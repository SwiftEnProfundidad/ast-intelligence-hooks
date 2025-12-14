// ===== PLATFORM DETECTION SERVICE =====
// Detects which platforms are present in the codebase

const fs = require('fs').promises;
const path = require('path');

class PlatformDetectionService {
  constructor() {
    this.cache = {
      detections: new Map(),
      timestamp: 0,
      ttl: 30000
    };

    this.platformIndicators = {
      backend: [
        'nest-cli.json',
        'tsconfig.server.json',
        '/apps/backend/',
        '/services/',
        '/functions/',
      ],
      frontend: [
        'next.config.js',
        'next.config.ts',
        '/apps/web-app/',
        '/apps/admin-dashboard/',
        '/apps/admin/',
        'package.json', // Generic indicator
      ],
      ios: [
        '.xcodeproj',
        '.xcworkspace',
        'Podfile',
        'Package.swift',
        '/apps/ios/',
        '*.swift',
      ],
      android: [
        'build.gradle',
        'settings.gradle',
        'AndroidManifest.xml',
        '/apps/android/',
        '*.kt',
        '*.java',
      ],
    };
  }

  async detectPlatforms(targetPath) {
    const platforms = new Set();

    try {
      // Check for platform indicators
      for (const [platform, indicators] of Object.entries(this.platformIndicators)) {
        for (const indicator of indicators) {
          if (await this.checkIndicator(targetPath, indicator)) {
            platforms.add(platform);
            break; // Found platform, move to next
          }
        }
      }

      // Convert Set to Array
      return Array.from(platforms);

    } catch (error) {
      return [];
    }
  }

  async checkIndicator(targetPath, indicator) {
    try {
      if (indicator.startsWith('/')) {
        // Directory indicator
        const dirPath = path.join(targetPath, indicator);
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
      } else if (indicator.includes('*')) {
        // File pattern indicator (simplified check)
        const ext = indicator.replace('*', '');
        return await this.hasFilesWithExtension(targetPath, ext);
      } else {
        // File indicator
        const filePath = path.join(targetPath, indicator);
        await fs.access(filePath);
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  async hasFilesWithExtension(targetPath, extension) {
    try {
      const files = await fs.readdir(targetPath);
      return files.some(file => file.endsWith(extension));
    } catch (error) {
      return false;
    }
  }

  detectPlatformFromFile(filePath) {
    if (this.cache.detections.has(filePath)) {
      const cached = this.cache.detections.get(filePath);
      if (Date.now() - cached.timestamp < this.cache.ttl) {
        return cached.platform;
      }
    }

    const platform = this._detectPlatformUncached(filePath);

    this.cache.detections.set(filePath, {
      platform,
      timestamp: Date.now()
    });

    return platform;
  }

  _detectPlatformUncached(filePath) {
    const lowerPath = filePath.toLowerCase();

    // Fix: Support both /apps/backend/ and apps/backend/ (Git staging has no leading /)
    if (lowerPath.includes('apps/backend/') || lowerPath.includes('scripts/hooks-system/') || lowerPath.includes('/services/') || lowerPath.includes('services/') || lowerPath.includes('/functions/') || lowerPath.includes('functions/')) {
      return 'backend';
    }
    if (lowerPath.includes('apps/web-app/') || lowerPath.includes('apps/admin')) {
      return 'frontend';
    }
    if (lowerPath.includes('apps/ios/') || filePath.endsWith('.swift')) {
      return 'ios';
    }
    if (lowerPath.includes('apps/android/') || filePath.endsWith('.kt') || filePath.endsWith('.java')) {
      return 'android';
    }

    const ext = path.extname(filePath);

    if (ext === '.swift') return 'ios';
    if (ext === '.kt' || ext === '.java') return 'android';
    if (ext === '.ts' || ext === '.tsx') {
      if (lowerPath.includes('server') || lowerPath.includes('api') || lowerPath.includes('backend')) {
        return 'backend';
      }
      return 'frontend';
    }

    return 'other';
  }

  getAmbiguityScore(filePath) {
    const platform = this._detectPlatformUncached(filePath);
    const lowerPath = filePath.toLowerCase();
    const ext = path.extname(filePath);

    if (ext === '.swift') return 0;
    if (ext === '.kt' || ext === '.kts') return 0;

    if (lowerPath.includes('/apps/backend/')) return 10;
    if (lowerPath.includes('/apps/ios/')) return 10;
    if (lowerPath.includes('/apps/android/')) return 10;

    if (ext === '.ts' || ext === '.tsx') return 60;
    if (ext === '.js' || ext === '.jsx') return 70;

    return 100;
  }

  clearCache() {
    this.cache.detections.clear();
    this.cache.timestamp = Date.now();
  }
}

module.exports = PlatformDetectionService;
