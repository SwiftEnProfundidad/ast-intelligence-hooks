const MacOSNotificationAdapter = require('../MacOSNotificationAdapter');

describe('MacOSNotificationAdapter', () => {
  describe('constructor', () => {
    it('should be a class', () => {
      expect(typeof MacOSNotificationAdapter).toBe('function');
    });

    it('should initialize with default config', () => {
      const adapter = new MacOSNotificationAdapter();
      expect(adapter.enabled).toBe(true);
      expect(adapter.defaultTitle).toBeDefined();
    });

    it('should accept custom config', () => {
      const adapter = new MacOSNotificationAdapter({ enabled: false });
      expect(adapter.enabled).toBe(false);
    });

    it('should have sound map', () => {
      const adapter = new MacOSNotificationAdapter();
      expect(adapter.soundMap).toBeDefined();
      expect(adapter.soundMap.info).toBeDefined();
      expect(adapter.soundMap.error).toBeDefined();
    });
  });

  describe('exports', () => {
    it('should export MacOSNotificationAdapter class', () => {
      expect(MacOSNotificationAdapter).toBeDefined();
    });
  });
});
