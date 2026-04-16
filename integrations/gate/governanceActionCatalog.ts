import type { AiGateStage } from './evaluateAiGate';

export type GovernanceCatalogNextAction = {
  kind: 'info' | 'run_command';
  message: string;
  command?: string;
};

export type GovernanceCatalogAction = {
  reason_code: string;
  instruction: string;
  next_action: GovernanceCatalogNextAction;
};

const PRE_WRITE_VALIDATE_COMMAND =
  'npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json';

export const buildGovernanceValidateCommand = (stage: AiGateStage): string =>
  PRE_WRITE_VALIDATE_COMMAND.replace('PRE_WRITE', stage);

export const buildGovernancePolicyReconcileCommand = (stage: AiGateStage): string =>
  `npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && ${buildGovernanceValidateCommand(stage)}`;

const buildFallbackAction = (code: string): GovernanceCatalogAction => ({
  reason_code: code,
  instruction: 'Corrige el bloqueante primario y vuelve a ejecutar la validación del stage actual.',
  next_action: {
    kind: 'info',
    message: 'Corrige el bloqueante primario y vuelve a ejecutar el mismo comando.',
  },
});

export const resolveGovernanceCatalogAction = (params: {
  code: string;
  stage?: AiGateStage;
  fallback?: GovernanceCatalogAction;
}): GovernanceCatalogAction => {
  const stage = params.stage ?? 'PRE_WRITE';
  const validateCommand = buildGovernanceValidateCommand(stage);
  switch (params.code) {
    case 'READY':
      return {
        reason_code: 'READY',
        instruction: 'Puedes continuar con la siguiente slice mínima y volver a validar al cerrar.',
        next_action: {
          kind: 'info',
          message: 'Gate en verde. Continúa con la implementación.',
        },
      };
    case 'EVIDENCE_INVALID_OR_CHAIN':
      return {
        reason_code: 'EVIDENCE_INVALID_OR_CHAIN',
        instruction: 'Regenera la evidencia canónica antes de continuar.',
        next_action: {
          kind: 'run_command',
          message: 'Regenera o corrige la evidencia canónica (.ai_evidence.json) y vuelve a validar governance.',
          command: validateCommand,
        },
      };
    case 'AI_GATE_BLOCKED':
      return {
        reason_code: 'AI_GATE_BLOCKED',
        instruction: 'Corrige primero el bloqueo principal del gate antes de continuar.',
        next_action: {
          kind: 'run_command',
          message: 'Revalida el stage tras corregir la evidencia y el bloqueo principal.',
          command: validateCommand,
        },
      };
    case 'SDD_SESSION_MISSING':
      return {
        reason_code: 'SDD_SESSION_MISSING',
        instruction: 'Abre una sesión SDD válida antes de seguir trabajando.',
        next_action: {
          kind: 'run_command',
          message: 'Abre la sesión SDD del cambio activo y vuelve a validar.',
          command: 'npx --yes --package pumuki@latest pumuki sdd session --open --change=<id>',
        },
      };
    case 'SDD_SESSION_INVALID':
    case 'SDD_SESSION_INVALID_OR_EXPIRED':
      return {
        reason_code: 'SDD_SESSION_INVALID_OR_EXPIRED',
        instruction: 'Refresca o reabre la sesión SDD antes de seguir trabajando.',
        next_action: {
          kind: 'run_command',
          message: 'Refresca la sesión SDD y vuelve a validar governance.',
          command: 'npx --yes --package pumuki@latest pumuki sdd session --refresh --ttl-minutes=90',
        },
      };
    case 'PRE_PUSH_UPSTREAM_MISSING':
      return {
        reason_code: 'PRE_PUSH_UPSTREAM_MISSING',
        instruction: 'Configura el upstream remoto antes de continuar con PRE_PUSH.',
        next_action: {
          kind: 'run_command',
          message: 'Configura tracking remoto para la rama actual.',
          command: 'git push --set-upstream origin <branch>',
        },
      };
    case 'PRE_PUSH_UPSTREAM_MISALIGNED':
      return {
        reason_code: 'PRE_PUSH_UPSTREAM_MISALIGNED',
        instruction: 'Alinea el upstream remoto con la rama actual antes de continuar.',
        next_action: {
          kind: 'run_command',
          message: 'Reconfigura el upstream remoto de la rama actual.',
          command: 'git branch --unset-upstream && git push --set-upstream origin <branch>',
        },
      };
    case 'GITFLOW_PROTECTED_BRANCH':
    case 'GITFLOW_PROTECTED_BRANCH_CONTEXT':
      return {
        reason_code: 'GITFLOW_PROTECTED_BRANCH_CONTEXT',
        instruction: 'Sal de la rama protegida y mueve el trabajo a feature/* o refactor/*.',
        next_action: {
          kind: 'run_command',
          message: 'Crea una rama válida de trabajo antes de seguir.',
          command: 'git checkout -b feature/<descripcion-kebab-case>',
        },
      };
    case 'GITFLOW_BRANCH_NAMING_INVALID':
    case 'GITFLOW_BRANCH_NAMING_INVALID_CONTEXT':
      return {
        reason_code: 'GITFLOW_BRANCH_NAMING_INVALID_CONTEXT',
        instruction:
          'Renombra o recrea la rama actual con un prefijo GitFlow válido antes de continuar.',
        next_action: {
          kind: 'run_command',
          message: 'Crea una rama válida y mueve el trabajo a esa rama antes de seguir.',
          command: 'git checkout -b feature/<descripcion-kebab-case>',
        },
      };
    case 'TRACKING_CANONICAL_SOURCE_CONFLICT':
      return {
        reason_code: 'TRACKING_CANONICAL_SOURCE_CONFLICT',
        instruction:
          'Alinea AGENTS.md y los README canónicos para que todos apunten al mismo MD de seguimiento.',
        next_action: {
          kind: 'info',
          message:
            'Deja una única fuente canónica de tracking y elimina referencias legacy o contradictorias.',
        },
      };
    case 'TRACKING_CANONICAL_FILE_MISSING':
      return {
        reason_code: 'TRACKING_CANONICAL_FILE_MISSING',
        instruction:
          'Crea o restaura el MD de seguimiento canónico declarado por el repo antes de continuar.',
        next_action: {
          kind: 'info',
          message:
            'Restaura el archivo canónico de tracking y vuelve a validar governance.',
        },
      };
    case 'TRACKING_CANONICAL_IN_PROGRESS_INVALID':
      return {
        reason_code: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
        instruction:
          'El tracking canónico debe tener exactamente una tarea o fase en construcción.',
        next_action: {
          kind: 'info',
          message:
            'Corrige el MD canónico para dejar exactamente una `🚧` antes de continuar.',
        },
      };
    case 'POLICY_STAGE_NOT_STRICT':
      return {
        reason_code: 'POLICY_STAGE_NOT_STRICT',
        instruction: 'Reconcilia policy/skills en modo estricto antes de seguir.',
        next_action: {
          kind: 'run_command',
          message: 'Converge policy-as-code y revalida el stage actual.',
          command: buildGovernancePolicyReconcileCommand(stage),
        },
      };
    case 'SKILLS_CONTRACT_SURFACE_INCOMPLETE':
    case 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE':
      return {
        reason_code: 'SKILLS_CONTRACT_SURFACE_INCOMPLETE',
        instruction: 'Materializa el lock/sources de skills antes de dar governance efectiva.',
        next_action: {
          kind: 'run_command',
          message: 'Reconcilia policy/skills y vuelve a validar governance.',
          command: buildGovernancePolicyReconcileCommand(stage),
        },
      };
    case 'ADAPTER_WIRING_MISSING':
      return {
        reason_code: 'ADAPTER_WIRING_MISSING',
        instruction: 'Instala el adaptador canónico si quieres wiring explícito de IDE/MCP.',
        next_action: {
          kind: 'run_command',
          message: 'Genera `.pumuki/adapter.json` desde la instalación canónica.',
          command: 'npx --yes --package pumuki@latest pumuki install --with-mcp',
        },
      };
    case 'EVIDENCE_STALE':
    case 'EVIDENCE_BRANCH_MISMATCH':
    case 'EVIDENCE_SNAPSHOT_WARN':
      return {
        reason_code: params.code === 'EVIDENCE_SNAPSHOT_WARN' ? 'EVIDENCE_SNAPSHOT_WARN' : 'EVIDENCE_STALE',
        instruction: 'Refresca evidencia y revisa hallazgos WARN antes de continuar.',
        next_action: {
          kind: 'run_command',
          message: 'Revalida el stage actual y revisa findings WARN.',
          command: validateCommand,
        },
      };
    case 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH':
    case 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES':
      return {
        reason_code: 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES',
        instruction: 'Reconcilia policy/skills en modo estricto y revalida el stage actual.',
        next_action: {
          kind: 'run_command',
          message: 'Converge policy-as-code y vuelve a validar cobertura de active_rule_ids para reglas activas.',
          command: buildGovernancePolicyReconcileCommand(stage),
        },
      };
    case 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE':
    case 'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING':
      return {
        reason_code: params.code,
        instruction: 'Completa cobertura de skills por plataforma y vuelve a validar.',
        next_action: {
          kind: 'run_command',
          message: 'Completa bundles/prefijos de skills requeridos y revalida el stage actual.',
          command: validateCommand,
        },
      };
    case 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING':
    case 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE':
      return {
        reason_code: params.code,
        instruction: 'Reconcilia policy/skills en modo estricto para enforcement crítico y revalida.',
        next_action: {
          kind: 'run_command',
          message: 'Materializa reglas críticas de plataforma y vuelve a validar el stage actual.',
          command: buildGovernancePolicyReconcileCommand(stage),
        },
      };
    case 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT':
    case 'EVIDENCE_PREWRITE_WORKTREE_WARN':
      return {
        reason_code: params.code,
        instruction: 'Particiona el worktree en slices atómicos antes de continuar.',
        next_action: {
          kind: 'run_command',
          message: 'Reduce el worktree pendiente y revalida el stage actual.',
          command: `git status --short && git add -p && ${validateCommand}`,
        },
      };
    case 'SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS':
      return {
        reason_code: 'SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS',
        instruction: 'Aplica refactor incremental por componente/hook y vuelve a validar.',
        next_action: {
          kind: 'info',
          message: 'Aplica refactor incremental: extrae 1 componente/hook por commit y vuelve a ejecutar el gate.',
        },
      };
    case 'GOVERNANCE_ATTENTION':
      return {
        reason_code: 'GOVERNANCE_ATTENTION',
        instruction: 'Revisa governance truth y corrige el primer hueco del contrato antes de continuar.',
        next_action: {
          kind: 'info',
          message: 'Revisa governance truth, corrige el primer gap visible y vuelve a validar.',
        },
      };
    default:
      return params.fallback ?? buildFallbackAction(params.code);
  }
};
