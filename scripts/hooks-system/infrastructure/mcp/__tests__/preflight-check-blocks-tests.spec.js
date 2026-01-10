const { preFlightCheck } = require('../ast-intelligence-automation');

describe('pre_flight_check - tests are first-class', () => {
    it('blocks test edits when AST analysis finds CRITICAL violations', () => {
        const result = preFlightCheck({
            action_type: 'edit',
            target_file: '/SomeModule/Tests/FooTests.swift',
            proposed_code: 'import XCTest\nfinal class FooTests: XCTestCase { func testX() { do { } catch { } } }'
        });

        expect(result.allowed).toBe(false);
        expect(result.blocked).toBe(true);
    });
});
