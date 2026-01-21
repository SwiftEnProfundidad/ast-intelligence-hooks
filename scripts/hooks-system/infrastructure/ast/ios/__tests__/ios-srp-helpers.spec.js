const { summarizeSwiftTypes, evaluateMultipleTypeGroups, resolveSrpSeverity, isThinWrapperSummary } = require('../utils/ios-srp-helpers');

describe('ios srp heuristics', () => {
  it('flags multiple unrelated types by group', () => {
    const content = `
struct User { let id: String }
struct Order { let id: String }
struct Product { let id: String }
`;
    const summaries = summarizeSwiftTypes(content);
    const result = evaluateMultipleTypeGroups(summaries);
    expect(result.shouldFlag).toBe(true);
    expect(result.distinctGroups).toBeGreaterThan(1);
  });

  it('does not flag multiple types with shared prefix', () => {
    const content = `
struct UserView { var body: some View { Text("x") } }
final class UserViewModel { func load() {} }
final class UserRouter { func route() {} }
`;
    const summaries = summarizeSwiftTypes(content);
    const result = evaluateMultipleTypeGroups(summaries);
    expect(result.shouldFlag).toBe(false);
  });

  it('counts methods without nested type members', () => {
    const content = `
struct Wrapper {
  struct Nested { func inner() {} }
  func outer() {}
}
`;
    const summaries = summarizeSwiftTypes(content);
    const wrapper = summaries.find((item) => item.name === 'Wrapper');
    expect(wrapper.methodsCount).toBe(1);
  });

  it('detects thin wrappers', () => {
    const content = `
struct TokenSpyStorageState {
  var savedTokens: [String]
  var deletedTokensCount: Int
}

final class AccessTokenSpyStorage {
  var state: TokenSpyStorageState
}
`;
    const summaries = summarizeSwiftTypes(content);
    const wrapper = summaries.find((item) => item.name === 'AccessTokenSpyStorage');
    expect(isThinWrapperSummary(wrapper)).toBe(true);
  });

  it('resolves severity by layer', () => {
    const config = { coreSeverity: 'critical', defaultSeverity: 'high', testSeverity: 'low' };
    expect(resolveSrpSeverity('Apps/Domain/User.swift', config)).toBe('critical');
    expect(resolveSrpSeverity('Apps/Application/UserUseCase.swift', config)).toBe('critical');
    expect(resolveSrpSeverity('Apps/Tests/UserTests.swift', config)).toBe('low');
    expect(resolveSrpSeverity('Apps/Presentation/UserView.swift', config)).toBe('high');
  });
});
