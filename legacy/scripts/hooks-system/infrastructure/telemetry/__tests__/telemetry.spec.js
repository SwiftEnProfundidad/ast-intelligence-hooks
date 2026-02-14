describe('telemetry', () => {
  describe('TelemetryService', () => {
    it('should export class', () => {
      const TelemetryService = require('../TelemetryService');
      expect(TelemetryService).toBeDefined();
    });
  });

  describe('metrics-logger', () => {
    it('should export module', () => {
      const mod = require('../metrics-logger');
      expect(mod).toBeDefined();
    });
  });
});
