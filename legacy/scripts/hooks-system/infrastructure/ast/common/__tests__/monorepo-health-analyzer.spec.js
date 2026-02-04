jest.mock('fs');
jest.mock('glob');

const {
  buildDependencyGraph,
  detectCircularDependencies,
  calculateBuildComplexity,
  calculateHealthScore
} = require('../monorepo-health-analyzer');
const fs = require('fs');

describe('monorepo-health-analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildDependencyGraph', () => {
    it('should build graph from apps with package.json', () => {
      const apps = [
        { name: 'frontend', path: '/apps/frontend', packageJsonPath: '/apps/frontend/package.json' },
        { name: 'backend', path: '/apps/backend', packageJsonPath: '/apps/backend/package.json' }
      ];

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((file) => {
        if (file.includes('frontend')) {
          return JSON.stringify({ dependencies: { '@app/backend': '1.0.0' } });
        }
        return JSON.stringify({ dependencies: {} });
      });

      const graph = buildDependencyGraph(apps);

      expect(graph).toHaveProperty('frontend');
      expect(graph).toHaveProperty('backend');
    });

    it('should handle missing package.json', () => {
      const apps = [
        { name: 'app1', path: '/apps/app1', packageJsonPath: '/apps/app1/package.json' }
      ];

      fs.existsSync.mockReturnValue(false);

      const graph = buildDependencyGraph(apps);

      expect(graph.app1).toEqual([]);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect circular dependency', () => {
      const graph = {
        a: ['b'],
        b: ['c'],
        c: ['a']
      };

      const cycles = detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty for acyclic graph', () => {
      const graph = {
        a: ['b'],
        b: ['c'],
        c: []
      };

      const cycles = detectCircularDependencies(graph);

      expect(cycles).toHaveLength(0);
    });

    it('should handle empty graph', () => {
      const graph = {};

      const cycles = detectCircularDependencies(graph);

      expect(cycles).toHaveLength(0);
    });
  });

  describe('calculateBuildComplexity', () => {
    it('should be a function', () => {
      expect(typeof calculateBuildComplexity).toBe('function');
    });
  });

  describe('calculateHealthScore', () => {
    it('should return high score for healthy monorepo', () => {
      const score = calculateHealthScore(2, 0, 0, 50);

      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should penalize excessive apps', () => {
      const healthyScore = calculateHealthScore(3, 0, 0, 50);
      const excessiveScore = calculateHealthScore(6, 0, 0, 50);

      expect(excessiveScore).toBeLessThan(healthyScore);
    });

    it('should penalize circular dependencies', () => {
      const noCircular = calculateHealthScore(3, 0, 0, 50);
      const withCircular = calculateHealthScore(3, 2, 0, 50);

      expect(withCircular).toBeLessThan(noCircular);
    });

    it('should never return negative score', () => {
      const score = calculateHealthScore(10, 10, 100, 1000);

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });
});
