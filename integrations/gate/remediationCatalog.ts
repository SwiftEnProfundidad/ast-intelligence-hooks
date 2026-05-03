export const DEFAULT_GATE_REMEDIATION =
  'Corrige la causa del bloqueo y vuelve a ejecutar el gate.';

export const REMEDIATION_HINT_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Regenera .ai_evidence.json ejecutando una auditoría.',
  EVIDENCE_INVALID: 'Corrige/regenera .ai_evidence.json y vuelve a ejecutar el gate.',
  EVIDENCE_CHAIN_INVALID: 'Regenera evidencia para restaurar la cadena criptográfica.',
  EVIDENCE_STAGE_SYNC_FAILED:
    'Sincroniza la evidencia trackeada y reintenta: git add -- .ai_evidence.json && git commit --amend --no-edit',
  EVIDENCE_STALE: 'Refresca evidencia antes de continuar.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este mismo repositorio.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en la rama actual y reintenta.',
  TDD_BDD_BASELINE_BLOCKED:
    'Corrige el baseline TDD/BDD roto y regenera la evidencia antes de continuar.',
  EVIDENCE_RULES_COVERAGE_MISSING: 'Ejecuta auditoría completa para recalcular rules_coverage.',
  EVIDENCE_RULES_COVERAGE_INCOMPLETE: 'Asegura coverage_ratio=1 y unevaluated=0.',
  ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH:
    'Reconcilia policy/skills y reintenta PRE_COMMIT: npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && npx --yes --package pumuki@latest pumuki-pre-commit',
  EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES:
    'Reconcilia policy/skills y revalida PRE_WRITE: npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json',
  GITFLOW_PROTECTED_BRANCH: 'Trabaja en feature/* y evita ramas protegidas.',
  GITFLOW_BRANCH_NAMING_INVALID:
    'Renombra o recrea la rama con un prefijo GitFlow válido (feature/*, bugfix/*, hotfix/*, release/*, chore/*, refactor/* o docs/*).',
  TRACKING_CANONICAL_SOURCE_CONFLICT:
    'Alinea AGENTS.md y los README canónicos para que todos apunten al mismo MD de seguimiento.',
  TRACKING_CANONICAL_FILE_MISSING:
    'Crea o restaura el archivo canónico de tracking declarado por el repo.',
  TRACKING_CANONICAL_IN_PROGRESS_INVALID:
    'Deja exactamente una tarea o fase `🚧` en el MD canónico de seguimiento antes de continuar.',
  EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT:
    'Reduce archivos staged/unstaged por debajo del umbral (o ajusta PUMUKI_PREWRITE_WORKTREE_*); divide el trabajo en commits más pequeños.',
  EVIDENCE_PREWRITE_WORKTREE_WARN:
    'El worktree supera el umbral de aviso; reduce alcance antes del siguiente commit/push.',
  PRE_PUSH_UPSTREAM_MISSING: 'Ejecuta: git push --set-upstream origin <branch>',
  PRE_PUSH_UPSTREAM_MISALIGNED:
    'Alinea upstream con la rama actual: git branch --unset-upstream && git push --set-upstream origin <branch>',
  MANIFEST_MUTATION_DETECTED:
    'Los hooks/gates no deben modificar manifests. Revisa wiring y ejecuta upgrade explícito solo cuando aplique (por ejemplo: pumuki update --latest).',
};

export const resolveRemediationHintForViolationCode = (code: string): string | undefined => {
  const trimmed = code.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return REMEDIATION_HINT_BY_CODE[trimmed];
};

export const resolveRemediationHintOrDefault = (code: string): string =>
  resolveRemediationHintForViolationCode(code) ?? DEFAULT_GATE_REMEDIATION;
