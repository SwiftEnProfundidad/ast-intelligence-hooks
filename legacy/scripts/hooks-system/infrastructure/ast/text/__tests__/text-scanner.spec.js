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

    it('flags switch-based message provider mapping to string literals', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-text-'));
      const filePath = path.join(root, 'SupportMessageProvider.swift');
      const content = [
        'enum SupportStatus {',
        '  case active',
        '  case inactive',
        '}',
        '',
        'struct SupportMessageProvider {',
        '  func message(for status: SupportStatus) -> String {',
        '    switch status {',
        '    case .active:',
        '      return "support.active"',
        '    case .inactive:',
        '      return "support.inactive"',
        '    }',
        '  }',
        '}'
      ].join('\n');

      fs.writeFileSync(filePath, content, 'utf8');

      const findings = [];
      runTextScanner(root, findings);

      const ocpFinding = findings.find(f => f.ruleId === 'ios.solid.ocp_switch_to_string');
      expect(ocpFinding).toBeDefined();
    });
  });

  describe('android rules', () => {
    it('flags when-based message provider mapping to string literals', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-text-'));
      const filePath = path.join(root, 'SupportMessageProvider.kt');
      const content = [
        'enum class SupportStatus {',
        '  ACTIVE,',
        '  INACTIVE',
        '}',
        '',
        'class SupportMessageProvider {',
        '  fun message(status: SupportStatus): String {',
        '    return when (status) {',
        '      SupportStatus.ACTIVE -> "support.active"',
        '      SupportStatus.INACTIVE -> "support.inactive"',
        '    }',
        '  }',
        '}'
      ].join('\n');

      fs.writeFileSync(filePath, content, 'utf8');

      const findings = [];
      runTextScanner(root, findings);

      const ocpFinding = findings.find(f => f.ruleId === 'android.solid.ocp_switch_to_string');
      expect(ocpFinding).toBeDefined();
    });
  });
});
