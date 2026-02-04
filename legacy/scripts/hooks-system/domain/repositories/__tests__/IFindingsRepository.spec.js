describe('IFindingsRepository', () => {
  it('should export interface/class', () => {
    const IFindingsRepository = require('../IFindingsRepository');
    expect(IFindingsRepository).toBeDefined();
  });

  it('should be instantiable', () => {
    const IFindingsRepository = require('../IFindingsRepository');
    const instance = new IFindingsRepository();
    expect(instance).toBeDefined();
  });

  it('should have save method', () => {
    const IFindingsRepository = require('../IFindingsRepository');
    const instance = new IFindingsRepository();
    expect(typeof instance.save).toBe('function');
  });
});
