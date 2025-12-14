const { FrontendArchitectureDetector } = require('../FrontendArchitectureDetector');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

jest.mock('fs');
jest.mock('glob');

function makeSUT(projectRoot = '/test/project') {
  return new FrontendArchitectureDetector(projectRoot);
}

describe('FrontendArchitectureDetector', () => {
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
      expect(detector.patterns.componentBased).toBe(0);
      expect(detector.patterns.atomicDesign).toBe(0);
      expect(detector.patterns.stateManagement).toBe(0);
      expect(detector.patterns.mvc).toBe(0);
    });
  });

  describe('loadManualConfig', () => {
    it('should load manual config from .ast-architecture.json', () => {
      const configPath = path.join('/test/project', '.ast-architecture.json');
      const config = {
        frontend: {
          architecturePattern: 'FEATURE_FIRST_CLEAN'
        }
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(config));
      const detector = makeSUT('/test/project');
      expect(detector.manualConfig).toBeDefined();
      expect(detector.manualConfig.architecturePattern).toBe('FEATURE_FIRST_CLEAN');
    });

    it('should return null when config file does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      const detector = makeSUT();
      expect(detector.manualConfig).toBeNull();
    });
  });

  describe('detect', () => {
    it('should return manual pattern when config exists', () => {
      const config = {
        frontend: {
          architecturePattern: 'FEATURE_FIRST_CLEAN'
        }
      };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(config));
      const detector = makeSUT('/test/project');
      const result = detector.detect();
      expect(result).toBe('FEATURE_FIRST_CLEAN');
    });

    it('should return UNKNOWN when no files found', () => {
      glob.sync.mockReturnValue([]);
      const detector = makeSUT();
      const result = detector.detect();
      expect(result).toBe('UNKNOWN');
    });

    it('should detect feature first clean pattern', () => {
      const files = [
        'src/features/orders/domain/Order.ts',
        'src/features/orders/application/CreateOrderUseCase.ts',
        'src/features/orders/infrastructure/OrderRepository.ts',
        'src/features/orders/presentation/OrderScreen.tsx'
      ];
      glob.sync.mockReturnValue(files);
      const detector = makeSUT();
      const result = detector.detect();
      expect(result).toBe('FEATURE_FIRST_CLEAN');
    });

    it('should detect component based pattern', () => {
      const files = [
        'src/components/Button.tsx',
        'src/components/Card.tsx',
        'src/components/Modal.tsx',
        'src/pages/Home.tsx'
      ];
      glob.sync.mockReturnValue(files);
      const detector = makeSUT();
      const result = detector.detect();
      expect(result).toBe('COMPONENT_BASED');
    });

    it('should detect atomic design pattern', () => {
      const files = [
        'src/components/atoms/Button.tsx',
        'src/components/molecules/FormField.tsx',
        'src/components/organisms/Header.tsx',
        'src/components/templates/PageLayout.tsx'
      ];
      glob.sync.mockReturnValue(files);
      const detector = makeSUT();
      const result = detector.detect();
      expect(result).toBe('ATOMIC_DESIGN');
    });
  });

  describe('getDominantPattern', () => {
    it('should return UNKNOWN when all scores are zero', () => {
      const detector = makeSUT();
      const result = detector.getDominantPattern();
      expect(result).toBe('UNKNOWN');
    });

    it('should return FEATURE_FIRST_CLEAN when featureFirstClean has highest score', () => {
      const detector = makeSUT();
      detector.patterns.featureFirstClean = 10;
      detector.patterns.componentBased = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('FEATURE_FIRST_CLEAN');
    });

    it('should return COMPONENT_BASED when componentBased has highest score', () => {
      const detector = makeSUT();
      detector.patterns.componentBased = 10;
      detector.patterns.featureFirstClean = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('COMPONENT_BASED');
    });

    it('should return ATOMIC_DESIGN when atomicDesign has highest score', () => {
      const detector = makeSUT();
      detector.patterns.atomicDesign = 10;
      detector.patterns.componentBased = 5;
      const result = detector.getDominantPattern();
      expect(result).toBe('ATOMIC_DESIGN');
    });
  });
});

