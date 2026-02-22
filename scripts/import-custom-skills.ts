import { loadCoreSkillsLock } from '../integrations/config/coreSkillsLock';
import {
  importCustomSkillsRules,
  resolveSkillImportSources,
} from '../integrations/config/skillsCustomRules';

type ParsedArgs = {
  repoRoot: string;
  sources: string[];
};

const parseArgs = (argv: string[]): ParsedArgs => {
  const parsed: ParsedArgs = {
    repoRoot: process.cwd(),
    sources: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if ((token === '--source' || token === '--from') && argv[index + 1]) {
      parsed.sources.push(argv[index + 1] as string);
      index += 1;
      continue;
    }
    if (token === '--repo-root' && argv[index + 1]) {
      parsed.repoRoot = argv[index + 1] as string;
      index += 1;
      continue;
    }
  }

  return parsed;
};

const args = parseArgs(process.argv.slice(2));
const sourceFiles = resolveSkillImportSources({
  repoRoot: args.repoRoot,
  explicitSources: args.sources,
});

if (sourceFiles.length === 0) {
  process.stderr.write(
    '[pumuki] No se detectaron fuentes de skills. Usa --source <path> o define rutas SKILL.md en AGENTS.md/SKILLS.md.\n'
  );
  process.exit(1);
}

const result = importCustomSkillsRules({
  repoRoot: args.repoRoot,
  sourceFiles,
});

const coreRuleIds = new Set(
  (loadCoreSkillsLock()?.bundles ?? [])
    .flatMap((bundle) => bundle.rules)
    .map((rule) => rule.id)
);
const overrideRuleIds = result.importedRules
  .filter((rule) => coreRuleIds.has(rule.id))
  .map((rule) => rule.id)
  .sort();

process.stdout.write('\n[pumuki] Custom skills import completed.\n');
process.stdout.write(`- sources_detected: ${result.sourceFiles.length}\n`);
process.stdout.write(`- imported_rules: ${result.importedRules.length}\n`);
process.stdout.write(`- output: ${result.outputPath}\n`);
process.stdout.write(
  `- overridden_core_rules: ${overrideRuleIds.length > 0 ? overrideRuleIds.join(', ') : 'none'}\n`
);
