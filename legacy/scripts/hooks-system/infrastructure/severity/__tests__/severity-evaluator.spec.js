describe('severity-evaluator', () => {
  it('should export SeverityEvaluator class', () => {
    const { SeverityEvaluator } = require('../severity-evaluator');
    expect(SeverityEvaluator).toBeDefined();
  });

  it('should be instantiable', () => {
    const { SeverityEvaluator } = require('../severity-evaluator');
    const instance = new SeverityEvaluator();
    expect(instance).toBeDefined();
  });

  it('should have evaluate method', () => {
    const { SeverityEvaluator } = require('../severity-evaluator');
    const instance = new SeverityEvaluator();
    expect(typeof instance.evaluate).toBe('function');
  });
});
