const { detectMissingMakeSUT, detectMissingLeakTracking } = require('../ast-ios');

describe('iOS testing rules - makeSUT / leak tracking', () => {
    it('flags missing makeSUT as HIGH when 3+ tests exist', () => {
        const filePath = '/SomeModule/Tests/FooTests.swift';
        const content = [
            'import XCTest',
            'final class FooTests: XCTestCase {',
            '  func test_one() { XCTAssertTrue(true) }',
            '  func test_two() { XCTAssertTrue(true) }',
            '  func test_three() { XCTAssertTrue(true) }',
            '}'
        ].join('\n');

        const finding = detectMissingMakeSUT({ filePath, content });
        expect(finding).not.toBeNull();
        expect(finding.ruleId).toBe('ios.testing.missing_make_sut');
        expect(finding.severity).toBe('high');
    });

    it('does not flag missing makeSUT when file defines makeSUT()', () => {
        const filePath = '/SomeModule/Tests/FooTests.swift';
        const content = [
            'import XCTest',
            'final class FooTests: XCTestCase {',
            '  func makeSUT() -> Foo { Foo() }',
            '  func test_one() { let _ = makeSUT() }',
            '}'
        ].join('\n');

        expect(detectMissingMakeSUT({ filePath, content })).toBeNull();
    });

    it('flags missing leak tracking as HIGH when tests exist and no tracking is present', () => {
        const filePath = '/SomeModule/Tests/FooTests.swift';
        const content = [
            'import XCTest',
            'final class FooTests: XCTestCase {',
            '  func makeSUT() -> Foo { Foo() }',
            '  func test_one() { let _ = makeSUT() }',
            '}'
        ].join('\n');

        const finding = detectMissingLeakTracking({ filePath, content });
        expect(finding).not.toBeNull();
        expect(finding.ruleId).toBe('ios.testing.missing_leak_tracking');
        expect(finding.severity).toBe('high');
    });

    it('does not flag leak tracking when makeSUT includes trackForMemoryLeaks', () => {
        const filePath = '/SomeModule/Tests/FooTests.swift';
        const content = [
            'import XCTest',
            'final class FooTests: XCTestCase {',
            '  func makeSUT() -> Foo {',
            '    let sut = Foo()',
            '    trackForMemoryLeaks(sut)',
            '    return sut',
            '  }',
            '  func test_one() { _ = makeSUT() }',
            '}'
        ].join('\n');

        expect(detectMissingLeakTracking({ filePath, content })).toBeNull();
    });
});
