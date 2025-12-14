const { BackendPatternDetector } = require('../BackendPatternDetector');

class CQRSDetector extends BackendPatternDetector {
  detect(files) {
    let score = 0;

    const cqrsIndicators = [
      '/commands/',
      '/queries/',
      'CommandHandler',
      'QueryHandler',
      'ICommandHandler',
      'IQueryHandler',
      'Command<',
      'Query<'
    ];

    files.forEach(file => {
      const content = this.readFile(file);
      const matches = cqrsIndicators.filter(indicator =>
        file.includes(indicator) || content.includes(indicator)
      ).length;

      if (matches >= 2) {
        score += matches * 2;
      }
    });

    const hasCommands = files.some(f => f.includes('/commands/'));
    const hasQueries = files.some(f => f.includes('/queries/'));

    if (hasCommands && hasQueries) {
      score += 10;
    }

    return score;
  }
}

module.exports = { CQRSDetector };

