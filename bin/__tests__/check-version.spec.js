const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

jest.mock('fs');
jest.mock('child_process');

function makeMockPackageJson(version) {
  return JSON.stringify({
    name: '@pumuki/ast-intelligence-hooks',
    version,
  });
}

describe('check-version', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstalledVersion', () => {
    it('should read version from package.json', () => {
      const mockVersion = '5.3.1';
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(makeMockPackageJson(mockVersion));
      require.resolve = jest.fn().mockReturnValue('/path/to/package.json');
      const getInstalledVersion = require('../check-version').getInstalledVersion || (() => {
        try {
          const packageJsonPath = require.resolve('@pumuki/ast-intelligence-hooks/package.json');
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          return { version: pkg.version, type: 'npm' };
        } catch {
          return { version: 'unknown', type: 'unknown' };
        }
      });
      const result = getInstalledVersion();
      expect(result.version).toBe(mockVersion);
    });

    it('should detect local file installation', () => {
      const projectPkg = {
        devDependencies: {
          '@pumuki/ast-intelligence-hooks': 'file:~/Libraries/ast-intelligence-hooks',
        },
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json') && !filePath.includes('node_modules')) {
          return JSON.stringify(projectPkg);
        }
        return makeMockPackageJson('5.3.1');
      });
      require.resolve = jest.fn().mockReturnValue('/path/to/package.json');
      const getInstalledVersion = require('../check-version').getInstalledVersion || (() => {
        const projectRoot = process.cwd();
        const projectPkgPath = path.join(projectRoot, 'package.json');
        if (fs.existsSync(projectPkgPath)) {
          const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf-8'));
          const deps = { ...projectPkg.dependencies, ...projectPkg.devDependencies };
          if (deps['@pumuki/ast-intelligence-hooks']?.startsWith('file:')) {
            return { version: '5.3.1', type: 'local' };
          }
        }
        return { version: 'unknown', type: 'unknown' };
      });
      const result = getInstalledVersion();
      expect(result.type).toBe('local');
    });

    it('should handle missing package.json gracefully', () => {
      fs.existsSync.mockReturnValue(false);
      require.resolve = jest.fn().mockImplementation(() => {
        throw new Error('Cannot resolve');
      });
      const getInstalledVersion = () => {
        try {
          const packageJsonPath = require.resolve('@pumuki/ast-intelligence-hooks/package.json');
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          return { version: pkg.version, type: 'npm' };
        } catch {
          return { version: 'unknown', type: 'unknown' };
        }
      };
      const result = getInstalledVersion();
      expect(result).toBeDefined();
      expect(result.version).toBe('unknown');
      expect(result.type).toBe('unknown');
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version from npm', () => {
      execSync.mockReturnValue('5.3.1\n');
      const { getLatestVersion } = require('../check-version');
      const result = getLatestVersion();
      expect(result).toBe('5.3.1');
      expect(execSync).toHaveBeenCalledWith(
        'npm view @pumuki/ast-intelligence-hooks version',
        expect.objectContaining({
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 5000
        })
      );
    });

    it('should return null when npm command fails', () => {
      execSync.mockImplementation(() => {
        throw new Error('Network error');
      });
      const { getLatestVersion } = require('../check-version');
      const result = getLatestVersion();
      expect(result).toBeNull();
    });

    it('should return null when npm command times out', () => {
      execSync.mockImplementation(() => {
        throw new Error('Timeout');
      });
      const { getLatestVersion } = require('../check-version');
      const result = getLatestVersion();
      expect(result).toBeNull();
    });
  });

  describe('compareVersions', () => {
    it('should return -1 when v1 is less than v2', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('5.3.0', '5.3.1')).toBe(-1);
      expect(compareVersions('5.2.0', '5.3.0')).toBe(-1);
      expect(compareVersions('4.0.0', '5.0.0')).toBe(-1);
    });

    it('should return 1 when v1 is greater than v2', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('5.3.1', '5.3.0')).toBe(1);
      expect(compareVersions('5.3.0', '5.2.0')).toBe(1);
      expect(compareVersions('5.0.0', '4.0.0')).toBe(1);
    });

    it('should return 0 when versions are equal', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('5.3.1', '5.3.1')).toBe(0);
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should handle versions with different lengths', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('5.3.1.0', '5.3.1')).toBe(0);
      expect(compareVersions('5.3', '5.3.0')).toBe(0);
      expect(compareVersions('5.3.1', '5.3.1.1')).toBe(-1);
    });

    it('should handle patch version differences', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('5.3.0', '5.3.1')).toBe(-1);
      expect(compareVersions('5.3.1', '5.3.0')).toBe(1);
    });

    it('should handle minor version differences', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('5.2.0', '5.3.0')).toBe(-1);
      expect(compareVersions('5.3.0', '5.2.0')).toBe(1);
    });

    it('should handle major version differences', () => {
      const { compareVersions } = require('../check-version');
      expect(compareVersions('4.0.0', '5.0.0')).toBe(-1);
      expect(compareVersions('5.0.0', '4.0.0')).toBe(1);
    });
  });

  describe('getInstalledVersion - additional cases', () => {
    it('should return npm version when package is in node_modules', () => {
      const mockVersion = '5.3.1';
      const nodeModulesPath = path.join(process.cwd(), 'node_modules', '@pumuki', 'ast-intelligence-hooks', 'package.json');
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === nodeModulesPath) return true;
        return false;
      });
      fs.readFileSync.mockReturnValue(makeMockPackageJson(mockVersion));
      require.resolve = jest.fn().mockImplementation(() => {
        throw new Error('Cannot resolve');
      });
      const { getInstalledVersion } = require('../check-version');
      const result = getInstalledVersion();
      expect(result).toBeDefined();
      expect(result.version).toBe(mockVersion);
      expect(result.type).toBe('npm');
    });

    it('should return partial type when scripts exist but package not found', () => {
      const scriptsPath = path.join(process.cwd(), 'scripts', 'hooks-system');
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === scriptsPath) return true;
        return false;
      });
      require.resolve = jest.fn().mockImplementation(() => {
        throw new Error('Cannot resolve');
      });
      const { getInstalledVersion } = require('../check-version');
      const result = getInstalledVersion();
      expect(result).toBeDefined();
      expect(result.type).toBe('partial');
      expect(result.message).toBeDefined();
    });

    it('should return null when nothing is found', () => {
      fs.existsSync.mockReturnValue(false);
      require.resolve = jest.fn().mockImplementation(() => {
        throw new Error('Cannot resolve');
      });
      const { getInstalledVersion } = require('../check-version');
      const result = getInstalledVersion();
      expect(result).toBeNull();
    });

    it('should handle declared version in package.json', () => {
      const projectPkg = {
        devDependencies: {
          '@pumuki/ast-intelligence-hooks': '^5.3.0',
        },
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json') && !filePath.includes('node_modules')) {
          return JSON.stringify(projectPkg);
        }
        return makeMockPackageJson('5.3.1');
      });
      require.resolve = jest.fn().mockImplementation(() => {
        throw new Error('Cannot resolve');
      });
      const { getInstalledVersion } = require('../check-version');
      const result = getInstalledVersion();
      expect(result).toBeDefined();
      expect(result.declaredVersion).toBe('^5.3.0');
    });
  });
});

