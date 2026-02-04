
const { GitOperations } = require('../infrastructure/core/GitOperations');
const { SeverityConfig } = require('../domain/entities/SeverityConfig');
const path = require('path');

describe('Hook System Integration Tests', () => {
    describe('GitOperations', () => {
        test('should get staged files', () => {
            const stagedFiles = GitOperations.getStagedFiles();
            expect(Array.isArray(stagedFiles)).toBe(true);
        });

        test('should detect if in git repository', () => {
            const isGit = GitOperations.isInGitRepository();
            expect(typeof isGit).toBe('boolean');
        });

        test('should get repository root', () => {
            const root = GitOperations.getRepositoryRoot();
            expect(typeof root).toBe('string');
            expect(root.length).toBeGreaterThan(0);
        });
    });

    describe('SeverityConfig', () => {
        test('should map severity values', () => {
            expect(SeverityConfig.getSeverityValue('HIGH')).toBe('HIGH');
            expect(SeverityConfig.getSeverityValue('high')).toBe('HIGH');
            expect(SeverityConfig.getSeverityValue('error')).toBe('HIGH');
            expect(SeverityConfig.getSeverityValue('unknown')).toBe('MEDIUM');
        });

        test('should check if blocking', () => {
            expect(SeverityConfig.isBlocking('CRITICAL')).toBe(true);
            expect(SeverityConfig.isBlocking('HIGH')).toBe(true);
            expect(SeverityConfig.isBlocking('MEDIUM')).toBe(false);
            expect(SeverityConfig.isBlocking('LOW')).toBe(false);
        });

        test('should filter violations by severity', () => {
            const violations = [
                { severity: 'CRITICAL', message: 'test1' },
                { severity: 'HIGH', message: 'test2' },
                { severity: 'MEDIUM', message: 'test3' }
            ];

            const critical = SeverityConfig.filterBySeverity(violations, 'CRITICAL');
            const high = SeverityConfig.filterBySeverity(violations, 'HIGH');

            expect(critical).toHaveLength(1);
            expect(high).toHaveLength(1);
            expect(critical[0].severity).toBe('CRITICAL');
        });

        test('should sort violations by severity', () => {
            const violations = [
                { severity: 'LOW', message: 'low' },
                { severity: 'CRITICAL', message: 'critical' },
                { severity: 'HIGH', message: 'high' }
            ];

            const sorted = SeverityConfig.sortBySeverity(violations);

            expect(sorted[0].severity).toBe('CRITICAL');
            expect(sorted[1].severity).toBe('HIGH');
            expect(sorted[2].severity).toBe('LOW');
        });
    });

    describe('File Structure', () => {
        test('should have GitOperations file', () => {
            const gitOpsPath = path.join(__dirname, '../infrastructure/core/GitOperations.js');
            const fs = require('fs');
            expect(fs.existsSync(gitOpsPath)).toBe(true);
        });

        test('should have SeverityConfig file', () => {
            const severityPath = path.join(__dirname, '../domain/entities/SeverityConfig.js');
            const fs = require('fs');
            expect(fs.existsSync(severityPath)).toBe(true);
        });
    });
});
