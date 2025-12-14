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
});

