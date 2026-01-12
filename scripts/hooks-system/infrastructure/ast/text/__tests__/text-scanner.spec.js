const { runTextScanner } = require('../text-scanner');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('Text Scanner Module', () => {
  describe('runTextScanner', () => {
    it('should be a function', () => {
      expect(typeof runTextScanner).toBe('function');
    });

    it('should be callable', () => {
      expect(runTextScanner).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export runTextScanner', () => {
      const mod = require('../text-scanner');
      expect(mod.runTextScanner).toBeDefined();
    });
  });

  describe('ios rules', () => {
    it('does not flag missing DI when Package.swift has empty dependencies', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-text-'));
      const packagePath = path.join(root, 'Package.swift');
      const content = [
        '// swift-tools-version: 5.9',
        'import PackageDescription',
        '',
        'let package = Package(',
        '  name: "Demo",',
        '  dependencies: [],',
        '  targets: [',
        '    .target(name: "Demo")',
        '  ]',
        ')'
      ].join('\n');

      fs.writeFileSync(packagePath, content, 'utf8');

      const findings = [];
      runTextScanner(root, findings);

      const diFinding = findings.find(f => f.ruleId === 'ios.spm.dependency_injection');
      expect(diFinding).toBeUndefined();
    });

    it('does not flag Any usage when Security context is present', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-text-'));
      const filePath = path.join(root, 'KeychainHelper.swift');
      const content = [
        'import Security',
        'struct KeychainHelper {',
        '  func baseQuery() -> [String: Any] { [:] }',
        '}'
      ].join('\n');

      fs.writeFileSync(filePath, content, 'utf8');

      const findings = [];
      runTextScanner(root, findings);

      const typeSafety = findings.find(f => f.ruleId === 'ios.optionals.type_safety');
      expect(typeSafety).toBeUndefined();
    });
  });
});
