describe('CommitBlockingRules', () => {
  it('should export class', () => {
    const CommitBlockingRules = require('../CommitBlockingRules');
    expect(CommitBlockingRules).toBeDefined();
  });

  it('should be instantiable', () => {
    const CommitBlockingRules = require('../CommitBlockingRules');
    const instance = new CommitBlockingRules();
    expect(instance).toBeDefined();
  });

  it('should have shouldBlockCommit method', () => {
    const CommitBlockingRules = require('../CommitBlockingRules');
    const instance = new CommitBlockingRules();
    expect(typeof instance.shouldBlockCommit).toBe('function');
  });
});
