const { SourceKittenParser } = require('../SourceKittenParser');

describe('SourceKittenParser', () => {
  let parser;

  beforeEach(() => {
    parser = new SourceKittenParser();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(parser).toBeInstanceOf(SourceKittenParser);
    });

    it('should set default sourceKittenPath', () => {
      expect(parser.sourceKittenPath).toBe('/opt/homebrew/bin/sourcekitten');
    });

    it('should set default timeout', () => {
      expect(parser.timeout).toBe(30000);
    });
  });

  describe('isInstalled', () => {
    it('should be an async method', () => {
      expect(typeof parser.isInstalled).toBe('function');
    });

    it('should return boolean', async () => {
      const result = await parser.isInstalled();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('exports', () => {
    it('should export SourceKittenParser', () => {
      const mod = require('../SourceKittenParser');
      expect(mod.SourceKittenParser).toBeDefined();
    });
  });
});
