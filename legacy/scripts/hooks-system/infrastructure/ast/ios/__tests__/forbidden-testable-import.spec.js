const { detectForbiddenTestableImport } = require('../ast-ios');

describe('ios.imports.forbidden_testable', () => {
    it('returns a finding when @testable is present in XCTest test file', () => {
        const filePath = '/SomeModule/Tests/FooTests.swift';
        const content = 'import XCTest\n@testable import Foo\nfinal class FooTests: XCTestCase {}';

        const finding = detectForbiddenTestableImport({ filePath, content });

        expect(finding).not.toBeNull();
        expect(finding.ruleId).toBe('ios.imports.forbidden_testable');
        expect(finding.severity).toBe('high');
    });

    it('returns null when @testable is not present', () => {
        const filePath = '/SomeModule/Tests/FooTests.swift';
        const content = 'import XCTest\nimport Foo\nfinal class FooTests: XCTestCase {}';

        expect(detectForbiddenTestableImport({ filePath, content })).toBeNull();
    });
});
