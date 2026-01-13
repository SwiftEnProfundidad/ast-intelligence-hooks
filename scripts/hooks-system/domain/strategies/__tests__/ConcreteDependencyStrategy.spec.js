const ConcreteDependencyStrategy = require('../ConcreteDependencyStrategy');

describe('ConcreteDependencyStrategy', () => {
  it('skips generic constraint when type uses any and bound is UseCaseProtocol', () => {
    const strategy = new ConcreteDependencyStrategy({
      targetClasses: ['Auth'],
      allowedTypes: [],
      protocolIndicators: [],
      concretePatterns: ['^Login$'],
      genericTypePatterns: {
        singleLetter: false,
        camelCase: '^$',
        contextHints: []
      }
    });

    const context = {
      className: 'AuthLoginRepo',
      filePath: '/tmp/AuthLoginRepo.swift',
      properties: [
        { 'key.typename': 'any Login', 'key.name': 'loginUseCase' }
      ],
      analyzer: {
        fileContent: 'class AuthLoginRepo<Login: LoginUseCaseProtocol> {}'
      }
    };

    const violations = strategy.detect({}, context);

    expect(violations).toHaveLength(0);
  });
});
