jest.mock('fs');

const { findDuplicateContent, findBrokenLinks } = require('../documentation-analyzer');
const fs = require('fs');
const path = require('path');

describe('documentation-analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findDuplicateContent', () => {
    it('should detect duplicate content between files', () => {
      const files = ['/docs/file1.md', '/docs/file2.md'];
      const commonContent = Array(15).fill('This is a common line that appears in both files').join('\n');

      fs.readFileSync.mockImplementation((file) => {
        if (file === '/docs/file1.md') return commonContent + '\nUnique line 1';
        if (file === '/docs/file2.md') return commonContent + '\nUnique line 2';
        return '';
      });

      const duplicates = findDuplicateContent(files);

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].file1).toBe('/docs/file1.md');
      expect(duplicates[0].file2).toBe('/docs/file2.md');
    });

    it('should not flag files with low similarity', () => {
      const files = ['/docs/file1.md', '/docs/file2.md'];

      fs.readFileSync.mockImplementation((file) => {
        if (file === '/docs/file1.md') return 'Completely different content here\nLine 2\nLine 3';
        if (file === '/docs/file2.md') return 'Nothing in common at all\nOther line\nMore content';
        return '';
      });

      const duplicates = findDuplicateContent(files);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle empty files', () => {
      const files = ['/docs/empty1.md', '/docs/empty2.md'];

      fs.readFileSync.mockReturnValue('');

      const duplicates = findDuplicateContent(files);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('findBrokenLinks', () => {
    it('should detect broken relative links', () => {
      const content = 'Check [this guide](./non-existent.md) for more info.';
      const filePath = '/docs/readme.md';

      fs.existsSync.mockReturnValue(false);

      const brokenLinks = findBrokenLinks(content, filePath, '/project');

      expect(brokenLinks).toHaveLength(1);
      expect(brokenLinks[0].url).toBe('./non-existent.md');
      expect(brokenLinks[0].type).toBe('relative');
    });

    it('should not flag valid relative links', () => {
      const content = 'Check [this guide](./existing.md) for more info.';
      const filePath = '/docs/readme.md';

      fs.existsSync.mockReturnValue(true);

      const brokenLinks = findBrokenLinks(content, filePath, '/project');

      expect(brokenLinks).toHaveLength(0);
    });

    it('should skip external http links', () => {
      const content = 'Visit [Google](https://google.com) for search.';
      const filePath = '/docs/readme.md';

      const brokenLinks = findBrokenLinks(content, filePath, '/project');

      expect(brokenLinks).toHaveLength(0);
    });

    it('should skip anchor links', () => {
      const content = 'Jump to [section](#installation) below.';
      const filePath = '/docs/readme.md';

      const brokenLinks = findBrokenLinks(content, filePath, '/project');

      expect(brokenLinks).toHaveLength(0);
    });

    it('should return correct line number for broken link', () => {
      const content = 'Line 1\nLine 2\n[broken](./missing.md)\nLine 4';
      const filePath = '/docs/readme.md';

      fs.existsSync.mockReturnValue(false);

      const brokenLinks = findBrokenLinks(content, filePath, '/project');

      expect(brokenLinks[0].line).toBe(3);
    });

    it('should detect multiple broken links', () => {
      const content = '[link1](./a.md)\n[link2](./b.md)\n[link3](./c.md)';
      const filePath = '/docs/readme.md';

      fs.existsSync.mockReturnValue(false);

      const brokenLinks = findBrokenLinks(content, filePath, '/project');

      expect(brokenLinks).toHaveLength(3);
    });
  });
});
