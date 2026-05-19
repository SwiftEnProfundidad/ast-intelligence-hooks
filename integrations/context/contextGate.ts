import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../../core/gate/Finding';
import type { GateStage } from '../../core/gate/GateStage';

export type ContextGateStatus = 'applied' | 'blocked' | 'disabled';

export type ContextGateResult = {
  status: ContextGateStatus;
  finding?: Finding;
};

export const CONTEXT_FILE = '.pumuki/context/context.json';
const CONTEXT_GATE_ENV = 'PUMUKI_CONTEXT_GATE';
const CONTEXT_SCHEMA_VERSION = 1;

const isStrictContextGate = (): boolean => {
  const normalized = process.env[CONTEXT_GATE_ENV]?.trim().toLowerCase();
  return normalized !== 'off' && normalized !== '0' && normalized !== 'false' && normalized !== 'disabled';
};

type LocalContextDocument = {
  schema_version: number;
  repo_root: string;
  generated_at: string;
  contract: {
    status: 'applied';
    required_before_gate: true;
    agent_instruction: string;
    user_remediation: string;
  };
};

export type ContextLifecycleResult = {
  status: 'ok' | 'blocked';
  path: string;
  message: string;
  document?: LocalContextDocument;
};

const buildContextDocument = (repoRoot: string): LocalContextDocument => ({
  schema_version: CONTEXT_SCHEMA_VERSION,
  repo_root: repoRoot,
  generated_at: new Date().toISOString(),
  contract: {
    status: 'applied',
    required_before_gate: true,
    agent_instruction:
      'STOP si este contexto no se puede leer o validar antes de editar, auditar, commitear o pushear.',
    user_remediation:
      'Ejecuta `npx pumuki context repair` y reejecuta el gate antes de continuar.',
  },
});

const contextPathForRepo = (repoRoot: string): string => join(repoRoot, CONTEXT_FILE);

const parseContextDocument = (repoRoot: string): LocalContextDocument => {
  const contextPath = contextPathForRepo(repoRoot);
  const parsed: unknown = JSON.parse(readFileSync(contextPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${CONTEXT_FILE} no contiene un objeto JSON valido`);
  }
  const candidate = parsed as Partial<LocalContextDocument>;
  if (candidate.schema_version !== CONTEXT_SCHEMA_VERSION) {
    throw new Error(`${CONTEXT_FILE} tiene schema_version invalido`);
  }
  if (candidate.repo_root !== repoRoot) {
    throw new Error(`${CONTEXT_FILE} pertenece a otro repo_root`);
  }
  if (
    !candidate.contract ||
    candidate.contract.status !== 'applied' ||
    candidate.contract.required_before_gate !== true ||
    typeof candidate.contract.agent_instruction !== 'string' ||
    candidate.contract.agent_instruction.trim().length === 0 ||
    typeof candidate.contract.user_remediation !== 'string' ||
    candidate.contract.user_remediation.trim().length === 0
  ) {
    throw new Error(`${CONTEXT_FILE} no declara contrato aplicado para usuario y agente IA`);
  }
  return candidate as LocalContextDocument;
};

export const writeLocalContext = (repoRoot: string): ContextLifecycleResult => {
  const contextPath = contextPathForRepo(repoRoot);
  const document = buildContextDocument(repoRoot);
  mkdirSync(join(repoRoot, '.pumuki/context'), { recursive: true });
  writeFileSync(contextPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return {
    status: 'ok',
    path: contextPath,
    message: 'Contexto local Pumuki inicializado y aplicado.',
    document,
  };
};

export const readLocalContextStatus = (repoRoot: string): ContextLifecycleResult => {
  const contextPath = contextPathForRepo(repoRoot);
  if (!existsSync(contextPath)) {
    return {
      status: 'blocked',
      path: contextPath,
      message:
        `Pumuki bloqueado: falta ${CONTEXT_FILE}. Ejecuta ` +
        '`npx pumuki context init` o `npx pumuki context repair`.',
    };
  }
  try {
    const document = parseContextDocument(repoRoot);
    return {
      status: 'ok',
      path: contextPath,
      message: 'Contexto local Pumuki leido, validado y aplicado.',
      document,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'context validation error';
    return {
      status: 'blocked',
      path: contextPath,
      message:
        `Pumuki bloqueado: contexto local invalido. Causa: ${reason}. Ejecuta ` +
        '`npx pumuki context repair`.',
    };
  }
};

export const repairLocalContext = (repoRoot: string): ContextLifecycleResult =>
  writeLocalContext(repoRoot);

const contextBlockedFinding = (params: {
  stage: GateStage;
  code: string;
  cause: string;
  evidence: string;
}): Finding => ({
  ruleId: 'governance.context.local-context-not-applied',
  severity: 'ERROR',
  code: params.code,
  message:
    `Pumuki bloqueado: contexto local obligatorio no aplicado en ${params.stage}. ` +
    `Causa: ${params.cause}. ` +
    `Evidencia: ${params.evidence}. ` +
    'Usuario: ejecuta `npx pumuki context init` si el repo no tiene contexto, o `npx pumuki context repair` si existe pero no valida. ' +
    'Agente IA: STOP. No edites archivos ni continues la tarea hasta leer, validar y aplicar el contexto local del repo.',
  filePath: CONTEXT_FILE,
  matchedBy: 'PumukiContextGate',
  source: 'pumuki-context-store',
  why: 'Pumuki no puede garantizar continuidad entre sesiones ni aplicar el contrato activo del repo sin contexto local validado.',
  impact: 'El agente y el usuario podrian trabajar con task, contrato o evidencia stale.',
  expected_fix:
    'Inicializa o repara el contexto local: `npx pumuki context init` o `npx pumuki context repair`, y reejecuta el gate.',
});

export const evaluateContextGate = (params: {
  repoRoot: string;
  stage: GateStage;
}): ContextGateResult => {
  if (!isStrictContextGate()) {
    return { status: 'disabled' };
  }

  const contextPath = contextPathForRepo(params.repoRoot);
  if (!existsSync(contextPath)) {
    return {
      status: 'blocked',
      finding: contextBlockedFinding({
        stage: params.stage,
        code: 'CONTEXT_NOT_APPLIED',
        cause: `No existe ${CONTEXT_FILE}`,
        evidence: contextPath,
      }),
    };
  }

  try {
    parseContextDocument(params.repoRoot);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'JSON parse error';
    return {
      status: 'blocked',
      finding: contextBlockedFinding({
        stage: params.stage,
        code: 'CONTEXT_INVALID',
        cause: reason,
        evidence: contextPath,
      }),
    };
  }

  return { status: 'applied' };
};
