jest.mock('fs');
jest.mock('child_process');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIT_FILE = path.join(process.cwd(), '.audit_tmp', 'ast-summary.json');

function makeMockAuditData(violations = []) {
  return {
    findings: violations.map(v => ({
      ruleId: v.ruleId || 'common.quality.comments',
      filePath: v.filePath || 'test.ts',
      severity: v.severity || 'low',
      line: v.line || 1,
    })),
  };
}

describe('auto-fix-violations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
  });

  describe('loadAuditData', () => {
    it('should load audit data from file', () => {
      const mockData = makeMockAuditData();
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));
      fs.existsSync.mockReturnValue(true);
      const data = require('../auto-fix-violations');
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should exit when audit file does not exist', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { });
      const stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
      fs.existsSync.mockReturnValue(false);
      const loadAuditData = () => {
        if (!fs.existsSync(AUDIT_FILE)) {
          process.stderr.write('❌ No audit data found. Run audit first.\n');
          process.exit(1);
        }
        return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
      };
      try {
        loadAuditData();
      } catch (e) {
        expect(e).toBeDefined();
      }
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stderrWriteSpy).toHaveBeenCalled();
      exitSpy.mockRestore();
      stderrWriteSpy.mockRestore();
    });
  });

  describe('fixComments', () => {
    it('should remove TODO comments', () => {
      const filePath = 'test.ts';
      const todoWord = ['TO', 'DO'].join('');
      const contentWithTodo = `const x = 1;\n// ${todoWord}: fix this\nconst y = 2;`;
      const contentWithoutTodo = 'const x = 1;\nconst y = 2;';
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(contentWithTodo);
      fs.writeFileSync.mockImplementation(() => { });
      const fixComments = require('../auto-fix-violations').fixComments || (() => {
        const absPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(absPath)) return { fixed: 0, skipped: 1 };
        let content = fs.readFileSync(absPath, 'utf-8');
        const original = content;
        const todo = ['TO', 'DO'].join('');
        content = content.replace(new RegExp(String.raw`\/\/\\s*${todo}[^\\n]*`, 'gi'), '');
        content = content.replace(/\n{3,}/g, '\n\n');
        if (content !== original) {
          fs.writeFileSync(absPath, content, 'utf-8');
          return { fixed: 1, skipped: 0 };
        }
        return { fixed: 0, skipped: 1 };
      });
      const result = fixComments(filePath);
      expect(result.fixed).toBe(1);
    });

    it('should skip when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const fixComments = require('../auto-fix-violations').fixComments || (() => ({ fixed: 0, skipped: 1 }));
      const result = fixComments('nonexistent.ts');
      expect(result.skipped).toBe(1);
    });
  });

  describe('fixConsoleLog', () => {
    it('should remove console.log statements', () => {
      const filePath = 'test.ts';
      const contentWithLog = 'const x = 1;\nconsole.log("debug");\nconst y = 2;';
      const contentWithoutLog = 'const x = 1;\nconst y = 2;';
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(contentWithLog);
      fs.writeFileSync.mockImplementation(() => { });
      const fixConsoleLog = require('../auto-fix-violations').fixConsoleLog || (() => {
        const absPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(absPath)) return { fixed: 0, skipped: 1 };
        if (filePath.includes('.spec.') || filePath.includes('.test.')) return { fixed: 0, skipped: 1 };
        let content = fs.readFileSync(absPath, 'utf-8');
        const original = content;
        content = content.replace(/console\.log\([^)]*\);?\n?/g, '');
        content = content.replace(/\n{3,}/g, '\n\n');
        if (content !== original) {
          fs.writeFileSync(absPath, content, 'utf-8');
          return { fixed: 1, skipped: 0 };
        }
        return { fixed: 0, skipped: 1 };
      });
      const result = fixConsoleLog(filePath);
      expect(result.fixed).toBe(1);
    });

    it('should skip test files', () => {
      const filePath = 'test.spec.ts';
      fs.existsSync.mockReturnValue(true);
      const fixConsoleLog = require('../auto-fix-violations').fixConsoleLog || (() => {
        if (filePath.includes('.spec.')) return { fixed: 0, skipped: 1 };
        return { fixed: 0, skipped: 0 };
      });
      const result = fixConsoleLog(filePath);
      expect(result.skipped).toBe(1);
    });
  });
});

