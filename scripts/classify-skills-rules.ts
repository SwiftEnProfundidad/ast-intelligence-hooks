import { loadSkillsLock } from '../integrations/config/skillsLock';
import { classifySkillsRules } from '../integrations/config/skillsRuleClassification';

const repoRoot = process.argv[2] ?? process.cwd();
const lock = loadSkillsLock(repoRoot);

if (!lock) {
  process.stderr.write(`skills.lock.json not found or invalid at ${repoRoot}\n`);
  process.exit(1);
}

const summary = classifySkillsRules(lock);

process.stdout.write(`${JSON.stringify({
  total: summary.total,
  byStatus: summary.byStatus,
  byPlatform: summary.byPlatform,
  samples: {
    AST_IMPLEMENTED: summary.rules
      .filter((rule) => rule.status === 'AST_IMPLEMENTED')
      .slice(0, 12),
    IMPLEMENTAR_DETECTOR: summary.rules
      .filter((rule) => rule.status === 'IMPLEMENTAR_DETECTOR')
      .slice(0, 12),
    REQUIERE_ESTUDIO: summary.rules
      .filter((rule) => rule.status === 'REQUIERE_ESTUDIO')
      .slice(0, 12),
    NO_ES_REGLA_DE_CODIGO: summary.rules
      .filter((rule) => rule.status === 'NO_ES_REGLA_DE_CODIGO')
      .slice(0, 12),
  },
}, null, 2)}\n`);
