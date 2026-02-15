import { z } from 'zod';

const severitySchema = z.enum(['ERROR', 'WARN', 'INFO', 'OFF']);

const conditionSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('FileChange'),
      where: z
        .object({
          pathPrefix: z.string().optional(),
          changeType: z.enum(['added', 'modified', 'deleted']).optional(),
        })
        .optional(),
    }),
    z.object({
      kind: z.literal('Heuristic'),
      where: z
        .object({
          ruleId: z.string().optional(),
          code: z.string().optional(),
          filePathPrefix: z.string().optional(),
        })
        .optional(),
    }),
    z.object({
      kind: z.literal('FileContent'),
      contains: z.array(z.string()).readonly().optional(),
      regex: z.array(z.string()).readonly().optional(),
    }),
    z.object({
      kind: z.literal('Dependency'),
      where: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
        })
        .optional(),
    }),
    z.object({
      kind: z.literal('All'),
      conditions: z.array(conditionSchema).readonly(),
    }),
    z.object({
      kind: z.literal('Any'),
      conditions: z.array(conditionSchema).readonly(),
    }),
    z.object({
      kind: z.literal('Not'),
      condition: conditionSchema,
    }),
  ])
);

const consequenceSchema = z.object({
  kind: z.literal('Finding'),
  message: z.string(),
});

const ruleDefinitionSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
  severity: severitySchema,
  when: conditionSchema,
  then: consequenceSchema,
  locked: z.boolean().optional(),
  platform: z
    .enum(['ios', 'android', 'backend', 'frontend', 'text', 'generic'])
    .optional(),
  stage: z.enum(['PRE_COMMIT', 'PRE_PUSH', 'CI', 'STAGED']).optional(),
  scope: z
    .object({
      include: z.array(z.string()).optional(),
      exclude: z.array(z.string()).optional(),
    })
    .optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

export const projectRulesConfigSchema = z.object({
  rules: z.array(ruleDefinitionSchema).readonly().optional(),
  allowOverrideLocked: z.boolean().optional(),
});

export type ValidatedProjectRulesConfig = z.infer<typeof projectRulesConfigSchema>;
