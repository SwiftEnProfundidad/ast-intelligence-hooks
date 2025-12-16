const fs = require('fs');
const path = require('path');
const glob = require('glob');

jest.mock('fs');
jest.mock('glob');

jest.mock('../detectors/FeatureFirstCleanDetector', () => ({
  FeatureFirstCleanDetector: jest.fn()
}));
jest.mock('../detectors/CleanArchitectureDetector', () => ({
  CleanArchitectureDetector: jest.fn()
}));
jest.mock('../detectors/OnionArchitectureDetector', () => ({
  OnionArchitectureDetector: jest.fn()
}));
jest.mock('../detectors/LayeredArchitectureDetector', () => ({
  LayeredArchitectureDetector: jest.fn()
}));
jest.mock('../detectors/CQRSDetector', () => ({
  CQRSDetector: jest.fn()
}));
jest.mock('../detectors/MVCDetector', () => ({
  MVCDetector: jest.fn()
}));

const { FeatureFirstCleanDetector } = require('../detectors/FeatureFirstCleanDetector');
const { CleanArchitectureDetector } = require('../detectors/CleanArchitectureDetector');
const { OnionArchitectureDetector } = require('../detectors/OnionArchitectureDetector');
const { LayeredArchitectureDetector } = require('../detectors/LayeredArchitectureDetector');
const { CQRSDetector } = require('../detectors/CQRSDetector');
const { MVCDetector } = require('../detectors/MVCDetector');

const { BackendArchitectureDetector } = require('../BackendArchitectureDetector');

function makeSUT(projectRoot = '/test/project') {
  return new BackendArchitectureDetector(projectRoot);
}

describe('BackendArchitectureDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      const detector = makeSUT('/test/project');
      expect(detector.projectRoot).toBe('/test/project');
      expect(detector.patterns).toBeDefined();
    });

    it('should initialize patterns with zero scores', () => {
      const detector = makeSUT();
      expect(detector.patterns.featureFirstClean).toBe(0);
      expect(detector.patterns.cleanArchitecture).toBe(0);
      expect(detector.patterns.onionArchitecture).toBe(0);
      expect(detector.patterns.layeredArchitecture).toBe(0);
      expect(detector.patterns.cqrs).toBe(0);
      expect(detector.patterns.mvc).toBe(0);
    });
  });

  describe('loadManualConfig', () => {
    it('should load manual config from .ast-architecture.json', () => {
      const configPath = path.join('/test/project', '.ast-architecture.json');
      const config = {
        backend: {
          architecturePattern: 'CLEAN_ARCHITECTURE'
        }
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(config));
      const detector = makeSUT('/test/project');
      expect(detector.manualConfig).toBeDefined();
      expect(detector.manualConfig.architecturePattern).toBe('CLEAN_ARCHITECTURE');
    });

    it('should return null when config file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const detector = makeSUT();
      expect(detector.manualConfig).toBeNull();
    });

    it('should return null when config file is invalid JSON', () => {
      const configPath = path.join('/test/project', '.ast-architecture.json');
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      const detector = makeSUT('/test/project');
      expect(detector.manualConfig).toBeNull();
    });
  });

  describe('detect', () => {
    it('should return manual pattern when config exists', () => {
      const config = {
        backend: {
          architecturePattern: 'FEATURE_FIRST_CLEAN_DDD'
        }
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(config));
      const detector = makeSUT('/test/project');
      const result = detector.detect();
      expect(result).toBe('FEATURE_FIRST_CLEAN_DDD');
    });

    it('should return UNKNOWN when no TypeScript files found', () => {
      glob.sync.mockReturnValue([]);
      const detector = makeSUT();
      const result = detector.detect();
      expect(result).toBe('UNKNOWN');
    });

    it('should detect patterns when TypeScript files exist', () => {
      glob.sync.mockReturnValue(['src/app.ts', 'src/service.ts']);
      const featureFirstDetector = { detect: jest.fn().mockReturnValue(10) };
      const cleanDetector = { detect: jest.fn().mockReturnValue(5) };
      const onionDetector = { detect: jest.fn().mockReturnValue(3) };
      const layeredDetector = { detect: jest.fn().mockReturnValue(2) };
      const cqrsDetector = { detect: jest.fn().mockReturnValue(1) };
      const mvcDetector = { detect: jest.fn().mockReturnValue(0) };
      FeatureFirstCleanDetector.mockImplementation(() => featureFirstDetector);
      CleanArchitectureDetector.mockImplementation(() => cleanDetector);
      OnionArchitectureDetector.mockImplementation(() => onionDetector);
      LayeredArchitectureDetector.mockImplementation(() => layeredDetector);
      CQRSDetector.mockImplementation(() => cqrsDetector);
      MVCDetector.mockImplementation(() => mvcDetector);
      const detector = makeSUT();
      const result = detector.detect();
      expect(result).toBe('FEATURE_FIRST_CLEAN_DDD');
    });

    it('should call all detectors with correct parameters', () => {
      const files = ['src/app.ts', 'src/service.ts'];
      glob.sync.mockReturnValue(files);
      const featureFirstDetector = { detect: jest.fn().mockReturnValue(10) };
      const cleanDetector = { detect: jest.fn().mockReturnValue(5) };
      const onionDetector = { detect: jest.fn().mockReturnValue(3) };
      const layeredDetector = { detect: jest.fn().mockReturnValue(2) };
      const cqrsDetector = { detect: jest.fn().mockReturnValue(1) };
      const mvcDetector = { detect: jest.fn().mockReturnValue(0) };
      FeatureFirstCleanDetector.mockImplementation(() => featureFirstDetector);
      CleanArchitectureDetector.mockImplementation(() => cleanDetector);
      OnionArchitectureDetector.mockImplementation(() => onionDetector);
      LayeredArchitectureDetector.mockImplementation(() => layeredDetector);
      CQRSDetector.mockImplementation(() => cqrsDetector);
      MVCDetector.mockImplementation(() => mvcDetector);
      const detector = makeSUT();
      detector.detect();
      expect(featureFirstDetector.detect).toHaveBeenCalledWith(files);
      expect(cleanDetector.detect).toHaveBeenCalledWith(files);
      expect(onionDetector.detect).toHaveBeenCalledWith(files, 5);
      expect(layeredDetector.detect).toHaveBeenCalledWith(files);
      expect(cqrsDetector.detect).toHaveBeenCalledWith(files);
      expect(mvcDetector.detect).toHaveBeenCalledWith(files);
    });
  });

  describe('getDominantPattern', () => {
    it('should return UNKNOWN when all scores are zero', () => {
      const detector = makeSUT();
      const result = detector.getDominantPattern();
      expect(result).toBe('UNKNOWN');
    });

    it('should return FEATURE_FIRST_CLEAN_DDD when featureFirstClean has highest score', () => {
      const detector = makeSUT();
      detector.patterns.featureFirstClean = 10;
      detector.patterns.cleanArchitecture = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('FEATURE_FIRST_CLEAN_DDD');
    });

    it('should return CLEAN_ARCHITECTURE when cleanArchitecture has highest score', () => {
      const detector = makeSUT();
      detector.patterns.cleanArchitecture = 10;
      detector.patterns.featureFirstClean = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('CLEAN_ARCHITECTURE');
    });

    it('should return ONION_ARCHITECTURE when onionArchitecture has highest score', () => {
      const detector = makeSUT();
      detector.patterns.onionArchitecture = 10;
      detector.patterns.cleanArchitecture = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('ONION_ARCHITECTURE');
    });

    it('should return LAYERED_ARCHITECTURE when layeredArchitecture has highest score', () => {
      const detector = makeSUT();
      detector.patterns.layeredArchitecture = 10;
      detector.patterns.cleanArchitecture = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('LAYERED_ARCHITECTURE');
    });

    it('should return CQRS when cqrs has highest score', () => {
      const detector = makeSUT();
      detector.patterns.cqrs = 10;
      detector.patterns.cleanArchitecture = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('CQRS');
    });

    it('should return MVC when mvc has highest score', () => {
      const detector = makeSUT();
      detector.patterns.mvc = 10;
      detector.patterns.cleanArchitecture = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('MVC');
    });
  });

  describe('getDetectionSummary', () => {
    it('should return summary with all pattern scores', () => {
      const detector = makeSUT();
      detector.patterns.featureFirstClean = 10;
      detector.patterns.cleanArchitecture = 5;
      detector.patterns.onionArchitecture = 3;
      const summary = detector.getDetectionSummary();
      expect(summary).toBeDefined();
      expect(summary.scores).toBeDefined();
      expect(summary.scores.featureFirstClean).toBe(10);
      expect(summary.scores.cleanArchitecture).toBe(5);
      expect(summary.pattern).toBeDefined();
      expect(summary.confidence).toBeDefined();
    });

    it('should include warnings when pattern is UNKNOWN', () => {
      const detector = makeSUT();
      const summary = detector.getDetectionSummary();
      expect(summary.warnings).toBeDefined();
      expect(summary.warnings.length).toBeGreaterThan(0);
    });
  });
});

