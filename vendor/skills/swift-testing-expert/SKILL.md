# Swift Testing Expert

Use this skill when designing or reviewing modern Swift tests that should align with Swift Testing instead of legacy XCTest-only patterns.

## Focus areas

- ✅ Prefer `import Testing` in unit and integration tests.
- ✅ Use `#expect` and `#require` instead of `XCTAssert*` and `XCTUnwrap` in modern Swift tests.
- ✅ Keep `XCTest` only for UI, performance, or unavoidable legacy compatibility targets.
- ✅ Preserve repository-specific test contracts such as `makeSUT()` and memory-leak tracking helpers when they are mandatory.
- ✅ Keep tests isolated, expressive, and aligned with Swift Concurrency.

## What good looks like

- Prefer `@Test` functions over `test...` methods when the target already supports Swift Testing.
- Prefer `#expect(value == expected)` over `XCTAssertEqual(value, expected)`.
- Prefer `let value = try #require(optionalValue)` over `let value = try XCTUnwrap(optionalValue)`.
- Keep async tests structured with `async` and `await`.

## What to avoid

- ❌ New XCTest-only unit tests when Swift Testing is available.
- ❌ `XCTAssert*` in non-UI, non-performance tests that can use `#expect`.
- ❌ `XCTUnwrap` in tests that can use `#require`.
- ❌ Mixing legacy XCTest style into new Swift Testing suites without an explicit compatibility reason.
