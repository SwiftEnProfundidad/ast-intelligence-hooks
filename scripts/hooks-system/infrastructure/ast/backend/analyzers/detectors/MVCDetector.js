const { BackendPatternDetector } = require('../BackendPatternDetector');

class MVCDetector extends BackendPatternDetector {
  detect(files) {
    let score = 0;

    files.forEach(file => {
      if (!file.includes('controller') && !file.includes('Controller')) return;
      
      const content = this.readFile(file);
      
      if (content.includes('@InjectRepository') || content.includes('TypeORM') || content.includes('Prisma')) {
        const hasService = files.some(f => 
          f.includes('.service.ts') && !f.includes('controller')
        );
        
        if (!hasService) {
          score += 3;
        }
      }

      if (content.match(/async\s+\w+\(.*\)\s*{[\s\S]{0,500}if\s*\(.*\)\s*{[\s\S]{0,500}if\s*\(.*\)\s*{/)) {
        score += 2;
      }
    });

    return score;
  }
}

module.exports = { MVCDetector };

