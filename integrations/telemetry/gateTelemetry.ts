import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import type { Severity } from '../../core/rules/Severity';
import type { RepoState } from '../evidence/schema';
import type { ResolvedStagePolicy } from '../gate/stagePolicies';
import type { SddDecision } from '../sdd';

const TELEMETRY_EVENT_SCHEMA = 'telemetry_event_v1';
const TELEMETRY_EVENT_SCHEMA_VERSION = '1.0';
const DEFAULT_OTEL_SERVICE_NAME = 'pumuki';
const DEFAULT_OTEL_TIMEOUT_MS = 1500;

type PolicyTrace = ResolvedStagePolicy['trace'] & {
  version?: string;
  signature?: string;
  policySource?: string;
  validation?: {
    status: 'valid' | 'invalid' | 'expired' | 'unknown-source' | 'unsigned';
    code: string;
  };
  degraded?: {
    enabled: true;
    action: 'allow' | 'block';
    reason: string;
    source: 'env' | 'file:.pumuki/degraded-mode.json';
    code: 'DEGRADED_MODE_ALLOWED' | 'DEGRADED_MODE_BLOCKED';
  };
};

const toSeverityCounts = (
  findings: ReadonlyArray<Finding>
): Record<Severity, number> => {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    ERROR: 0,
    WARN: 0,
    INFO: 0,
  };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  return counts;
};

const toBlockingFindingsCount = (findings: ReadonlyArray<Finding>): number => {
  let count = 0;
  for (const finding of findings) {
    if (finding.severity === 'CRITICAL' || finding.severity === 'ERROR') {
      count += 1;
    }
  }
  return count;
};

const toGateSeverityText = (outcome: GateOutcome): string => {
  if (outcome === 'BLOCK') {
    return 'ERROR';
  }
  if (outcome === 'WARN') {
    return 'WARN';
  }
  return 'INFO';
};

const toGateSeverityNumber = (outcome: GateOutcome): number => {
  if (outcome === 'BLOCK') {
    return 17;
  }
  if (outcome === 'WARN') {
    return 13;
  }
  return 9;
};

const toOtelTimeoutMs = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_OTEL_TIMEOUT_MS;
  }
  return parsed;
};

const toTelemetryJsonlMaxBytes = (value: string | undefined): number | null => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const resolveTargetPath = (repoRoot: string, targetPath: string): string => {
  if (isAbsolute(targetPath)) {
    return targetPath;
  }
  return join(repoRoot, targetPath);
};

const defaultAppendJsonlLine = (targetPath: string, line: string): void => {
  mkdirSync(dirname(targetPath), { recursive: true });
  appendFileSync(targetPath, line, 'utf8');
};

const rotateTelemetryJsonlIfNeeded = (params: {
  targetPath: string;
  line: string;
  maxBytes: number;
}): void => {
  mkdirSync(dirname(params.targetPath), { recursive: true });

  const lineBytes = Buffer.byteLength(params.line, 'utf8');
  let currentSize = 0;
  if (existsSync(params.targetPath)) {
    currentSize = statSync(params.targetPath).size;
  }
  if (currentSize + lineBytes <= params.maxBytes) {
    return;
  }

  const rotatedPath = `${params.targetPath}.1`;
  if (existsSync(rotatedPath)) {
    unlinkSync(rotatedPath);
  }
  if (existsSync(params.targetPath)) {
    renameSync(params.targetPath, rotatedPath);
  }
};

const defaultPostOtelPayload = async (params: {
  endpoint: string;
  payload: unknown;
  timeoutMs: number;
}): Promise<void> => {
  if (typeof fetch !== 'function') {
    return;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, params.timeoutMs);
  try {
    await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(params.payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export type GateTelemetryEventV1 = {
  schema: typeof TELEMETRY_EVENT_SCHEMA;
  schema_version: typeof TELEMETRY_EVENT_SCHEMA_VERSION;
  emitted_at: string;
  stage: GateStage;
  audit_mode: 'gate' | 'engine';
  gate_outcome: GateOutcome;
  files_scanned: number;
  findings_total: number;
  blocking_findings: number;
  severity_counts: Record<Severity, number>;
  repo: {
    root: string;
    branch: string | null;
    upstream: string | null;
    dirty: boolean;
    staged: number;
    unstaged: number;
    ahead: number;
    behind: number;
  };
  policy?: {
    source: PolicyTrace['source'];
    bundle: string;
    hash: string;
    version?: string;
    signature?: string;
    policy_source?: string;
    validation_status?: 'valid' | 'invalid' | 'expired' | 'unknown-source' | 'unsigned';
    validation_code?: string;
    degraded_mode_enabled?: boolean;
    degraded_mode_action?: 'allow' | 'block';
    degraded_mode_reason?: string;
    degraded_mode_source?: 'env' | 'file:.pumuki/degraded-mode.json';
    degraded_mode_code?: 'DEGRADED_MODE_ALLOWED' | 'DEGRADED_MODE_BLOCKED';
  };
  sdd?: {
    allowed: boolean;
    code: string;
    message: string;
  };
};

export type EmitGateTelemetryResult = {
  skipped: boolean;
  jsonl_path?: string;
  otel_dispatched: boolean;
  event: GateTelemetryEventV1;
};

export type EmitGateTelemetryDependencies = {
  env: NodeJS.ProcessEnv;
  now: () => Date;
  appendJsonlLine: (targetPath: string, line: string) => void;
  postOtelPayload: (params: {
    endpoint: string;
    payload: unknown;
    timeoutMs: number;
  }) => Promise<void>;
};

const defaultDependencies: EmitGateTelemetryDependencies = {
  env: process.env,
  now: () => new Date(),
  appendJsonlLine: defaultAppendJsonlLine,
  postOtelPayload: defaultPostOtelPayload,
};

const toTelemetryEvent = (params: {
  stage: GateStage;
  auditMode: 'gate' | 'engine';
  gateOutcome: GateOutcome;
  filesScanned: number;
  findings: ReadonlyArray<Finding>;
  repoRoot: string;
  repoState: RepoState;
  policyTrace?: PolicyTrace;
  sddDecision?: Pick<SddDecision, 'allowed' | 'code' | 'message'>;
  emittedAt: Date;
}): GateTelemetryEventV1 => {
  return {
    schema: TELEMETRY_EVENT_SCHEMA,
    schema_version: TELEMETRY_EVENT_SCHEMA_VERSION,
    emitted_at: params.emittedAt.toISOString(),
    stage: params.stage,
    audit_mode: params.auditMode,
    gate_outcome: params.gateOutcome,
    files_scanned: params.filesScanned,
    findings_total: params.findings.length,
    blocking_findings: toBlockingFindingsCount(params.findings),
    severity_counts: toSeverityCounts(params.findings),
    repo: {
      root: params.repoRoot,
      branch: params.repoState.git.branch,
      upstream: params.repoState.git.upstream,
      dirty: params.repoState.git.dirty,
      staged: params.repoState.git.staged,
      unstaged: params.repoState.git.unstaged,
      ahead: params.repoState.git.ahead,
      behind: params.repoState.git.behind,
    },
    ...(params.policyTrace
      ? {
        policy: {
          source: params.policyTrace.source,
          bundle: params.policyTrace.bundle,
          hash: params.policyTrace.hash,
          ...(params.policyTrace.version ? { version: params.policyTrace.version } : {}),
          ...(params.policyTrace.signature ? { signature: params.policyTrace.signature } : {}),
          ...(params.policyTrace.policySource
            ? { policy_source: params.policyTrace.policySource }
            : {}),
          ...(params.policyTrace.validation
            ? {
              validation_status: params.policyTrace.validation.status,
              validation_code: params.policyTrace.validation.code,
            }
            : {}),
          ...(params.policyTrace.degraded
            ? {
              degraded_mode_enabled: params.policyTrace.degraded.enabled,
              degraded_mode_action: params.policyTrace.degraded.action,
              degraded_mode_reason: params.policyTrace.degraded.reason,
              degraded_mode_source: params.policyTrace.degraded.source,
              degraded_mode_code: params.policyTrace.degraded.code,
            }
            : {}),
        },
      }
      : {}),
    ...(params.sddDecision
      ? {
        sdd: {
          allowed: params.sddDecision.allowed,
          code: params.sddDecision.code,
          message: params.sddDecision.message,
        },
      }
      : {}),
  };
};

const toOtelPayload = (params: {
  event: GateTelemetryEventV1;
  serviceName: string;
}): unknown => {
  const eventBody = JSON.stringify(params.event);
  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            {
              key: 'service.name',
              value: { stringValue: params.serviceName },
            },
            {
              key: 'pumuki.telemetry.schema',
              value: { stringValue: params.event.schema },
            },
          ],
        },
        scopeLogs: [
          {
            scope: {
              name: 'pumuki.telemetry',
              version: params.event.schema_version,
            },
            logRecords: [
              {
                timeUnixNano: `${Date.parse(params.event.emitted_at) * 1000000}`,
                severityNumber: toGateSeverityNumber(params.event.gate_outcome),
                severityText: toGateSeverityText(params.event.gate_outcome),
                body: { stringValue: eventBody },
                attributes: [
                  {
                    key: 'pumuki.stage',
                    value: { stringValue: params.event.stage },
                  },
                  {
                    key: 'pumuki.gate_outcome',
                    value: { stringValue: params.event.gate_outcome },
                  },
                  {
                    key: 'pumuki.policy_hash',
                    value: {
                      stringValue: params.event.policy?.hash ?? '',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
};

export const emitGateTelemetryEvent = async (
  params: {
    stage: GateStage;
    auditMode: 'gate' | 'engine';
    gateOutcome: GateOutcome;
    filesScanned: number;
    findings: ReadonlyArray<Finding>;
    repoRoot: string;
    repoState: RepoState;
    policyTrace?: PolicyTrace;
    sddDecision?: Pick<SddDecision, 'allowed' | 'code' | 'message'>;
  },
  dependencies: Partial<EmitGateTelemetryDependencies> = {}
): Promise<EmitGateTelemetryResult> => {
  const activeDependencies: EmitGateTelemetryDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const jsonlPathRaw = activeDependencies.env.PUMUKI_TELEMETRY_JSONL_PATH?.trim() ?? '';
  const otelEndpoint = activeDependencies.env.PUMUKI_TELEMETRY_OTEL_ENDPOINT?.trim() ?? '';
  const otelServiceName =
    activeDependencies.env.PUMUKI_TELEMETRY_OTEL_SERVICE_NAME?.trim() ||
    DEFAULT_OTEL_SERVICE_NAME;
  const otelTimeoutMs = toOtelTimeoutMs(
    activeDependencies.env.PUMUKI_TELEMETRY_OTEL_TIMEOUT_MS
  );
  const telemetryJsonlMaxBytes = toTelemetryJsonlMaxBytes(
    activeDependencies.env.PUMUKI_TELEMETRY_JSONL_MAX_BYTES
  );

  const event = toTelemetryEvent({
    ...params,
    emittedAt: activeDependencies.now(),
  });

  if (jsonlPathRaw.length === 0 && otelEndpoint.length === 0) {
    return {
      skipped: true,
      otel_dispatched: false,
      event,
    };
  }

  let jsonlPath: string | undefined;
  if (jsonlPathRaw.length > 0) {
    jsonlPath = resolveTargetPath(params.repoRoot, jsonlPathRaw);
    const line = `${JSON.stringify(event)}\n`;
    if (typeof telemetryJsonlMaxBytes === 'number') {
      rotateTelemetryJsonlIfNeeded({
        targetPath: jsonlPath,
        line,
        maxBytes: telemetryJsonlMaxBytes,
      });
    }
    activeDependencies.appendJsonlLine(jsonlPath, line);
  }

  let otelDispatched = false;
  if (otelEndpoint.length > 0) {
    const payload = toOtelPayload({
      event,
      serviceName: otelServiceName,
    });
    try {
      await activeDependencies.postOtelPayload({
        endpoint: otelEndpoint,
        payload,
        timeoutMs: otelTimeoutMs,
      });
      otelDispatched = true;
    } catch {
      otelDispatched = false;
    }
  }

  return {
    skipped: false,
    ...(jsonlPath ? { jsonl_path: jsonlPath } : {}),
    otel_dispatched: otelDispatched,
    event,
  };
};
