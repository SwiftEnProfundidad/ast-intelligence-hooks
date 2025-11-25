function analyzeImagesBackend(project, findings) {
  project.getSourceFiles().forEach(sf => {
    const content = sf.getFullText();
    const filePath = sf.getFilePath();
    
    if (content.match(/@Post.*upload|multer|multipart/i)) {
      const hasValidation = /maxFileSize|fileSize|limits/i.test(content);
      if (!hasValidation) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'HIGH',
          ruleId: 'backend.images.missing_file_size_limit',
          message: 'Image upload without size validation - limit to 10MB for rural bandwidth',
          category: 'Images', suggestion: 'Add multer limits: { fileSize: 10 * 1024 * 1024 }'
        });
      }
      
      const hasCompression = /sharp|jimp|imagemin/i.test(content);
      if (!hasCompression) {
        findings.push({
          filePath, line: 1, column: 0, severity: 'MEDIUM',
          ruleId: 'backend.images.missing_server_compression',
          message: 'Image upload without server-side compression - compress with sharp for storage efficiency',
          category: 'Images', suggestion: 'Use sharp to resize and compress: sharp().resize(1920).jpeg({ quality: 80 })'
        });
      }
    }
  });
}

module.exports = { analyzeImagesBackend };

