import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const loopSessionAttemptSchema = z
  .object({
    attempt: z.number().int().positive(),
    started_at: z.string().datetime({ offset: true }),
    finished_at: z.string().datetime({ offset: true }),
    outcome: z.enum(['pass', 'block', 'error', 'stopped']),
    gate_allowed: z.boolean(),
    gate_code: z.string().min(1),
    evidence_path: z.string().min(1).optional(),
    notes: z.string().min(1).optional(),
  })
  .strict();

const loopSessionContractSchema = z
  .object({
    version: z.literal('1'),
    session_id: z.string().min(1),
    objective: z.string().min(1),
    status: z.enum(['running', 'blocked', 'stopped', 'completed']),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
    max_attempts: z.number().int().positive(),
    current_attempt: z.number().int().min(0),
    attempts: z.array(loopSessionAttemptSchema),
  })
  .strict();

const loopSessionTransitions: Readonly<Record<LoopSessionStatus, ReadonlyArray<LoopSessionStatus>>> = {
  running: ['blocked', 'stopped', 'completed'],
  blocked: ['running', 'stopped', 'completed'],
  stopped: ['running'],
  completed: [],
};

const parseValidationError = (error: z.ZodError): string =>
  error.issues[0]
    ? `${error.issues[0].path.join('.') || 'contract'}: ${error.issues[0].message}`
    : 'invalid_loop_session_contract';

export type LoopSessionStatus = z.infer<typeof loopSessionContractSchema>['status'];
export type LoopSessionAttemptOutcome = z.infer<typeof loopSessionAttemptSchema>['outcome'];
export type LoopSessionAttemptV1 = z.infer<typeof loopSessionAttemptSchema>;
export type LoopSessionContractV1 = z.infer<typeof loopSessionContractSchema>;

export type CreateLoopSessionContractParams = {
  sessionId?: string;
  objective: string;
  generatedAt?: string;
  maxAttempts: number;
};

export type ParseLoopSessionContractResult =
  | {
      kind: 'valid';
      contract: LoopSessionContractV1;
    }
  | {
      kind: 'invalid';
      reason: string;
    };

export const createLoopSessionId = (): string => `loop-${randomUUID()}`;

export const isLoopSessionTransitionAllowed = (
  current: LoopSessionStatus,
  next: LoopSessionStatus
): boolean => {
  if (current === next) {
    return false;
  }
  return loopSessionTransitions[current].includes(next);
};

export const createLoopSessionContract = (
  params: CreateLoopSessionContractParams
): LoopSessionContractV1 => {
  const generatedAt = params.generatedAt ?? new Date().toISOString();
  return loopSessionContractSchema.parse({
    version: '1',
    session_id: params.sessionId?.trim() || createLoopSessionId(),
    objective: params.objective.trim(),
    status: 'running',
    created_at: generatedAt,
    updated_at: generatedAt,
    max_attempts: params.maxAttempts,
    current_attempt: 0,
    attempts: [],
  });
};

const hasValidAttemptOrder = (attempts: ReadonlyArray<LoopSessionAttemptV1>): boolean => {
  let expected = 1;
  for (const attempt of attempts) {
    if (attempt.attempt !== expected) {
      return false;
    }
    expected += 1;
  }
  return true;
};

export const parseLoopSessionContract = (candidate: unknown): ParseLoopSessionContractResult => {
  const parsed = loopSessionContractSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      kind: 'invalid',
      reason: parseValidationError(parsed.error),
    };
  }
  const contract = parsed.data;
  if (contract.current_attempt > contract.max_attempts) {
    return {
      kind: 'invalid',
      reason: `current_attempt exceeds max_attempts (${contract.current_attempt} > ${contract.max_attempts})`,
    };
  }
  if (contract.attempts.length > contract.max_attempts) {
    return {
      kind: 'invalid',
      reason: `attempts length exceeds max_attempts (${contract.attempts.length} > ${contract.max_attempts})`,
    };
  }
  if (contract.current_attempt !== contract.attempts.length) {
    return {
      kind: 'invalid',
      reason: `current_attempt must match attempts length (${contract.current_attempt} != ${contract.attempts.length})`,
    };
  }
  if (!hasValidAttemptOrder(contract.attempts)) {
    return {
      kind: 'invalid',
      reason: 'attempt sequence must be contiguous starting at 1',
    };
  }
  return {
    kind: 'valid',
    contract,
  };
};
