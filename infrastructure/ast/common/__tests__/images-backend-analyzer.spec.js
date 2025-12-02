const { analyzeImagesBackend } = require('../images-backend-analyzer');

function createMockProject(files) {
  return {
    getSourceFiles: () => files.map(f => ({
      getFilePath: () => f.path,
      getFullText: () => f.content
    }))
  };
}

describe('images-backend-analyzer', () => {
  describe('analyzeImagesBackend', () => {
    it('should detect upload without size validation', () => {
      const project = createMockProject([{
        path: '/app/controllers/upload.controller.ts',
        content: '@Post("upload") handleUpload(@UploadedFile() file) {}'
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings).toHaveLength(2);
      expect(findings[0].ruleId).toBe('backend.images.missing_file_size_limit');
      expect(findings[0].severity).toBe('HIGH');
    });

    it('should not flag when size validation present', () => {
      const project = createMockProject([{
        path: '/app/controllers/upload.controller.ts',
        content: '@Post("upload") multer({ limits: { fileSize: 10485760 } })'
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings.filter(f => f.ruleId === 'backend.images.missing_file_size_limit')).toHaveLength(0);
    });

    it('should detect upload without compression', () => {
      const project = createMockProject([{
        path: '/app/services/image.service.ts',
        content: 'multer({ limits: { maxFileSize: 10000000 } })'
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('backend.images.missing_server_compression');
      expect(findings[0].severity).toBe('MEDIUM');
    });

    it('should not flag when sharp compression present', () => {
      const project = createMockProject([{
        path: '/app/services/image.service.ts',
        content: `
          multer({ limits: { maxFileSize: 10000000 } });
          sharp(buffer).resize(1920).jpeg({ quality: 80 });
        `
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should detect multipart uploads', () => {
      const project = createMockProject([{
        path: '/app/routes/files.ts',
        content: 'app.post("/files", multipart(), handler)'
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings.length).toBeGreaterThan(0);
    });

    it('should accept jimp as compression library', () => {
      const project = createMockProject([{
        path: '/app/services/image.service.ts',
        content: `
          multer({ limits: { fileSize: 5000000 } });
          jimp.read(buffer).then(img => img.resize(800));
        `
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should accept imagemin as compression library', () => {
      const project = createMockProject([{
        path: '/app/services/image.service.ts',
        content: `
          multer({ limits: { fileSize: 5000000 } });
          imagemin([input], { destination: output });
        `
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings).toHaveLength(0);
    });

    it('should not flag non-upload files', () => {
      const project = createMockProject([{
        path: '/app/services/user.service.ts',
        content: 'class UserService { getUsers() { return []; } }'
      }]);
      const findings = [];

      analyzeImagesBackend(project, findings);

      expect(findings).toHaveLength(0);
    });
  });
});
