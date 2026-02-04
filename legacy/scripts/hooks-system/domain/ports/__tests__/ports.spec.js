describe('domain/ports', () => {
  describe('IAstPort', () => {
    it('should export interface', () => {
      const mod = require('../IAstPort');
      expect(mod).toBeDefined();
    });
  });

  describe('IEvidencePort', () => {
    it('should export interface', () => {
      const mod = require('../IEvidencePort');
      expect(mod).toBeDefined();
    });
  });

  describe('IGitPort', () => {
    it('should export interface', () => {
      const mod = require('../IGitPort');
      expect(mod).toBeDefined();
    });
  });

  describe('INotificationPort', () => {
    it('should export interface', () => {
      const mod = require('../INotificationPort');
      expect(mod).toBeDefined();
    });
  });

  describe('index', () => {
    it('should export all ports', () => {
      const ports = require('../index');
      expect(ports).toBeDefined();
    });
  });
});
