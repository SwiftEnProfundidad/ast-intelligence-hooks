import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';

const waiverEntrySchema = z.object({
  id: z.string().min(1),
  rule: z.literal('tdd-bdd-vertical'),
  reason: z.string().min(1),
  approved_by: z.string().min(1),
  approved_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
  branch: z.string().min(1).optional(),
});

const waiverFileSchema = z.object({
  version: z.literal('1'),
  waivers: z.array(waiverEntrySchema),
});

export type TddBddWaiverEntry = z.infer<typeof waiverEntrySchema>;

export type TddBddWaiverResult =
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
      kind: 'applied';
      path: string;
      waiver: TddBddWaiverEntry;
    };

const DEFAULT_WAIVER_PATH = '.pumuki/waivers/tdd-bdd.json';

export const resolveTddBddWaiverPath = (repoRoot: string): string => {
  const candidate = process.env.PUMUKI_TDD_BDD_WAIVER_PATH?.trim();
  if (!candidate) {
    return resolve(repoRoot, DEFAULT_WAIVER_PATH);
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

export const resolveActiveTddBddWaiver = (params: {
  repoRoot: string;
  branch: string | null;
  now?: Date;
}): TddBddWaiverResult => {
  const path = resolveTddBddWaiverPath(params.repoRoot);
  if (!existsSync(path)) {
    return {
      kind: 'none',
      path,
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    const validation = waiverFileSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        kind: 'invalid',
        path,
        reason: validation.error.issues[0]?.message ?? 'invalid_schema',
      };
    }
    const now = params.now ?? new Date();
    for (const waiver of validation.data.waivers) {
      if (waiver.branch && params.branch && waiver.branch !== params.branch) {
        continue;
      }
      if (waiver.branch && !params.branch) {
        continue;
      }
      const expiresAt = parseDate(waiver.expires_at);
      if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
        continue;
      }
      return {
        kind: 'applied',
        path,
        waiver,
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
