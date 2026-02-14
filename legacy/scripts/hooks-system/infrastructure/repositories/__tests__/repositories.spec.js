describe('infrastructure/repositories', () => {
  describe('FileFindingsRepository', () => {
    it('should export class', () => {
      const FileFindingsRepository = require('../FileFindingsRepository');
      expect(FileFindingsRepository).toBeDefined();
    });

    it('should be instantiable', () => {
      const FileFindingsRepository = require('../FileFindingsRepository');
      const instance = new FileFindingsRepository('/tmp');
      expect(instance).toBeDefined();
    });

    it('should have save method', () => {
      const FileFindingsRepository = require('../FileFindingsRepository');
      const instance = new FileFindingsRepository('/tmp');
      expect(typeof instance.save).toBe('function');
    });
  });
});
