import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';

const gateWaiverEntrySchema = z.object({
  id: z.string().min(1),
  stage: z.enum(['PRE_COMMIT', 'PRE_PUSH', 'CI']),
  reason: z.string().min(1),
  owner: z.string().min(1),
  approved_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
  branch: z.string().min(1).optional(),
});

const gateWaiverFileSchema = z.object({
  version: z.literal('1'),
  waivers: z.array(gateWaiverEntrySchema),
});

export type GateWaiverEntry = z.infer<typeof gateWaiverEntrySchema>;

export type GateWaiverResult =
  | {
      kind: 'none';
      path: string;
    }
  | {
      kind: 'invalid';
      path: string;
      reason: string;
    }
  | {
      kind: 'expired';
      path: string;
      waiver: GateWaiverEntry;
    }
  | {
      kind: 'applied';
      path: string;
      waiver: GateWaiverEntry;
    };

const DEFAULT_GATE_WAIVER_PATH = '.pumuki/waivers/gate.json';

export const resolveGateWaiverPath = (repoRoot: string): string => {
  const candidate = process.env.PUMUKI_GATE_WAIVER_PATH?.trim();
  if (!candidate) {
    return resolve(repoRoot, DEFAULT_GATE_WAIVER_PATH);
  }
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

const parseDate = (value: string): Date | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

export const resolveActiveGateWaiver = (params: {
  repoRoot: string;
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  branch: string | null;
  now?: Date;
}): GateWaiverResult => {
  const path = resolveGateWaiverPath(params.repoRoot);
  if (!existsSync(path)) {
    return {
      kind: 'none',
      path,
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    const validation = gateWaiverFileSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        kind: 'invalid',
        path,
        reason: validation.error.issues[0]?.message ?? 'invalid_schema',
      };
    }

    const now = params.now ?? new Date();
    let expiredCandidate: GateWaiverEntry | undefined;

    for (const waiver of validation.data.waivers) {
      if (waiver.stage !== params.stage) {
        continue;
      }
      if (waiver.branch && params.branch && waiver.branch !== params.branch) {
        continue;
      }
      if (waiver.branch && !params.branch) {
        continue;
      }

      const expiresAt = parseDate(waiver.expires_at);
      if (!expiresAt) {
        return {
          kind: 'invalid',
          path,
          reason: `invalid expires_at for waiver ${waiver.id}`,
        };
      }
      if (expiresAt.getTime() <= now.getTime()) {
        if (!expiredCandidate) {
          expiredCandidate = waiver;
        }
        continue;
      }
      return {
        kind: 'applied',
        path,
        waiver,
      };
    }

    if (expiredCandidate) {
      return {
        kind: 'expired',
        path,
        waiver: expiredCandidate,
      };
    }

    return {
      kind: 'none',
      path,
    };
  } catch (error) {
    return {
      kind: 'invalid',
      path,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
};
