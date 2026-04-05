# Swift Testing Expert

Use this skill when designing or reviewing modern Swift tests that should align with Swift Testing instead of legacy XCTest-only patterns.

## Focus areas

- ✅ Prefer `import Testing` in unit and integration tests.
- ✅ Use `#expect` and `#require` instead of `XCTAssert*` and `XCTUnwrap` in modern Swift tests.
- ✅ Keep `XCTest` only for UI, performance, or unavoidable legacy compatibility targets.
- ✅ Prefer `@Test` suites over `XCTestCase` + `test...` methods when the target already supports Swift Testing.
- ✅ Prefer `await fulfillment(of:)` over `wait(for:)` and `waitForExpectations(timeout:)` in async XCTest migration paths.
- ✅ Prefer `confirmation` over legacy `expectation(description:)` scaffolding when a modern Swift Testing flow is available.
- ✅ Preserve repository-specific test contracts such as `makeSUT()` and memory-leak tracking helpers when they are mandatory.
- ✅ Keep tests isolated, expressive, and aligned with Swift Concurrency.

## What good looks like

- Prefer `@Test` functions over `test...` methods when the target already supports Swift Testing.
- Prefer `#expect(value == expected)` over `XCTAssertEqual(value, expected)`.
- Prefer `let value = try #require(optionalValue)` over `let value = try XCTUnwrap(optionalValue)`.
- Keep async tests structured with `async` and `await`.
- Prefer `await fulfillment(of: [expectation])` over `wait(for: [expectation], timeout: ...)`.

## What to avoid

- ❌ New XCTest-only unit tests when Swift Testing is available.
- ❌ `XCTAssert*` in non-UI, non-performance tests that can use `#expect`.
- ❌ `XCTUnwrap` in tests that can use `#require`.
- ❌ `wait(for:)` or `waitForExpectations(timeout:)` in async tests that can use `await fulfillment(of:)`.
- ❌ `expectation(description:)` flows that remain on legacy waiting APIs when `await fulfillment(of:)` or `confirmation` can be used.
- ❌ Mixing legacy XCTest style into new Swift Testing suites without an explicit compatibility reason.
