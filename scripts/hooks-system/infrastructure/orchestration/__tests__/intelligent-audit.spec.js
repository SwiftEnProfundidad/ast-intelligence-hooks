describe('intelligent-audit', () => {
  it('should export module', () => {
    const mod = require('../intelligent-audit');
    expect(mod).toBeDefined();
  });

  it('should have runIntelligentAudit function', () => {
    const mod = require('../intelligent-audit');
    expect(typeof mod.runIntelligentAudit).toBe('function');
  });
});
