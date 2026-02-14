describe('reporting', () => {
  describe('report-generator', () => {
    it('should export module', () => {
      const mod = require('../report-generator');
      expect(mod).toBeDefined();
    });
  });

  describe('severity-tracker', () => {
    it('should export module', () => {
      const mod = require('../severity-tracker');
      expect(mod).toBeDefined();
    });
  });
});
