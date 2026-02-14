jest.mock('fs');

const { BackendPatternDetector } = require('../BackendPatternDetector');
const fs = require('fs');
const path = require('path');

function makeSUT(projectRoot = '/test/project') {
  return new BackendPatternDetector(projectRoot);
}

describe('BackendPatternDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with project root', () => {
      const detector = makeSUT('/test/project');
      expect(detector.projectRoot).toBe('/test/project');
    });
  });

  describe('readFile', () => {
    it('should read file content successfully', () => {
      const filePath = 'src/app.ts';
      const content = 'export class App {}';
      fs.readFileSync.mockReturnValue(content);
      const detector = makeSUT();
      const result = detector.readFile(filePath);
      expect(result).toBe(content);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join('/test/project', filePath),
        'utf-8'
      );
    });

    it('should return empty string when file read fails', () => {
      const filePath = 'src/nonexistent.ts';
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      const detector = makeSUT();
      const result = detector.readFile(filePath);
      expect(result).toBe('');
    });

    it('should handle errors gracefully', () => {
      const filePath = 'src/error.ts';
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const detector = makeSUT();
      const result = detector.readFile(filePath);
      expect(result).toBe('');
    });
  });
});

