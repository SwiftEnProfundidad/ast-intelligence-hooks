const NotificationCenterService = require('../NotificationCenterService');

describe('NotificationCenterService', () => {
  describe('module structure', () => {
    it('should export a class', () => {
      expect(NotificationCenterService).toBeDefined();
      expect(typeof NotificationCenterService).toBe('function');
    });

    it('should be instantiable with default config', () => {
      const instance = new NotificationCenterService();
      expect(instance).toBeDefined();
    });

    it('should accept custom config', () => {
      const instance = new NotificationCenterService({ repoRoot: '/tmp' });
      expect(instance.repoRoot).toBe('/tmp');
    });
  });

  describe('core methods', () => {
    let service;

    beforeEach(() => {
      service = new NotificationCenterService({ repoRoot: '/tmp' });
    });

    it('should have enqueue method', () => {
      expect(typeof service.enqueue).toBe('function');
    });

    it('should have flush method', () => {
      expect(typeof service.flush).toBe('function');
    });

    it('should have sleep helper', () => {
      expect(typeof service.sleep).toBe('function');
    });
  });
});
