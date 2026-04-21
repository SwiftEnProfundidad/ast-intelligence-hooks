import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

export type TrackingDeclaration = {
  source_file: string;
  declared_path: string;
  resolved_path: string;
};

export type RepoTrackingState = {
  enforced: boolean;
  canonical_path: string | null;
  canonical_present: boolean;
  source_file: string | null;
  in_progress_count: number;
  single_in_progress_valid: boolean;
  conflict: boolean;
  declarations: ReadonlyArray<TrackingDeclaration>;
  active_task_id?: string | null;
  last_run_path?: string | null;
  last_run_status?: string | null;
};

type TrackingDeclarationSource = {
  sourceFile: string;
  priority: number;
  patterns: ReadonlyArray<RegExp>;
};

type TrackingCandidate = TrackingDeclaration & {
  priority: number;
};

type InProgressEntry = {
  lineNumber: number;
  taskId: string | null;
};

const TRACKING_DECLARATION_SOURCES: ReadonlyArray<TrackingDeclarationSource> = [
  {
    sourceFile: 'AGENTS.md',
    priority: 100,
    patterns: [
      /única fuente viva del tracking interno es [`']([^`'\n]+)[`']/i,
      /ningun documento de seguimiento fuera de [`']([^`'\n]+)[`']/i,
    ],
  },
  {
    sourceFile: 'docs/README.md',
    priority: 80,
    patterns: [
      /todo el seguimiento operativo[\s\S]{0,240}?\[[^\]]+\]\(([^)]+)\)/i,
      /única fuente de verdad[^`\n]*[`']([^`'\n]+)[`']/i,
      /quiero saber en qué estamos ahora:\s*[\s\S]{0,80}[-*]\s*[`']([^`'\n]+)[`']/i,
    ],
  },
  {
    sourceFile: 'docs/validation/README.md',
    priority: 60,
    patterns: [/única fuente de seguimiento:\s*[`']([^`'\n]+)[`']/i],
  },
];

const toRepoRelativePath = (repoRoot: string, candidatePath: string): string | null => {
  const repoRootAbsolute = resolve(repoRoot);
  const resolved = resolve(candidatePath);
  const rel = relative(repoRootAbsolute, resolved);
  if (
    rel === '..' ||
    rel.startsWith('../') ||
    rel.startsWith('..\\')
  ) {
    return null;
  }
  return rel.length > 0 ? rel.split('\\').join('/') : '.';
};

const normalizeDeclaredPath = (value: string): string => value.trim().replace(/[#?].*$/, '');

const resolveDeclaredPath = (params: {
  repoRoot: string;
  sourceFile: string;
  declaredPath: string;
}): string | null => {
  const sourceAbsolutePath = resolve(params.repoRoot, params.sourceFile);
  const candidate = normalizeDeclaredPath(params.declaredPath);
  if (candidate.length === 0) {
    return null;
  }
  const resolved = resolve(dirname(sourceAbsolutePath), candidate);
  return toRepoRelativePath(params.repoRoot, resolved);
};

const collectTrackingCandidates = (repoRoot: string): ReadonlyArray<TrackingCandidate> => {
  const candidates = new Map<string, TrackingCandidate>();

  for (const source of TRACKING_DECLARATION_SOURCES) {
    const sourcePath = resolve(repoRoot, source.sourceFile);
    if (!existsSync(sourcePath)) {
      continue;
    }
    const markdown = readFileSync(sourcePath, 'utf8');
    for (const pattern of source.patterns) {
      const match = pattern.exec(markdown);
      const declaredPath = match?.[1]?.trim();
      if (!declaredPath) {
        continue;
      }
      const resolvedPath = resolveDeclaredPath({
        repoRoot,
        sourceFile: source.sourceFile,
        declaredPath,
      });
      if (!resolvedPath) {
        continue;
      }
      const key = `${source.sourceFile}::${resolvedPath}`;
      if (candidates.has(key)) {
        continue;
      }
      candidates.set(key, {
        source_file: source.sourceFile,
        declared_path: declaredPath,
        resolved_path: resolvedPath,
        priority: source.priority,
      });
    }
  }

  return Array.from(candidates.values()).sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    const bySource = left.source_file.localeCompare(right.source_file);
    return bySource !== 0 ? bySource : left.resolved_path.localeCompare(right.resolved_path);
  });
};

const extractTaskId = (value: string): string | null => {
  const directMatch = value.match(/\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\b/);
  if (directMatch?.[1]) {
    return directMatch[1];
  }
  const dottedMatch = value.match(/\b([A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)+)\b/);
  return dottedMatch?.[1] ?? null;
};

const collectInProgressEntries = (markdown: string): ReadonlyArray<InProgressEntry> => {
  const lines = markdown.split(/\r?\n/);
  const entries: InProgressEntry[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return;
    }

    if (trimmed.startsWith('|')) {
      const cells = trimmed
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      const firstCell = cells[0] ?? '';
      const secondCell = cells[1] ?? '';
      if (firstCell === '🚧') {
        entries.push({
          lineNumber: index + 1,
          taskId: extractTaskId(secondCell),
        });
        return;
      }
      const bracketCell = cells.find((cell) => /\[\s*🚧\s*\]\s*-/.test(cell));
      if (bracketCell) {
        entries.push({
          lineNumber: index + 1,
          taskId: extractTaskId(bracketCell),
        });
        return;
      }
    }

    if (/^- Estado:\s*🚧\b/.test(trimmed) || /\[\s*🚧\s*\]\s*-/.test(trimmed)) {
      entries.push({
        lineNumber: index + 1,
        taskId: extractTaskId(trimmed),
      });
    }
  });

  return entries;
};

const readActiveTaskHeader = (markdown: string): string | null => {
  const explicitHeader = markdown.match(/- Tarea activa principal:\s*`([^`]+)`/i)?.[1]?.trim();
  if (explicitHeader && explicitHeader.length > 0) {
    return explicitHeader;
  }
  const bracketTask = markdown.match(/`\[\s*🚧\s*\]\s*-\s*([^`]+)`/)?.[1]?.trim();
  return bracketTask && bracketTask.length > 0 ? bracketTask : null;
};

const readLastRunAlignment = (params: {
  repoRoot: string;
  canonicalPath: string;
  activeTaskId: string | null;
  inProgressCount: number;
  activeTaskHeader: string | null;
}): {
  path: string | null;
  status: string | null;
  valid: boolean;
} => {
  const lastRunPath = resolve(params.repoRoot, 'docs', 'validation', 'refactor', 'last-run.json');
  if (!existsSync(lastRunPath)) {
    return {
      path: null,
      status: null,
      valid: params.inProgressCount === 1,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(lastRunPath, 'utf8')) as unknown;
  } catch {
    return {
      path: toRepoRelativePath(params.repoRoot, lastRunPath),
      status: null,
      valid: false,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      path: toRepoRelativePath(params.repoRoot, lastRunPath),
      status: null,
      valid: false,
    };
  }

  const payload = parsed as Record<string, unknown>;
  const status = typeof payload.status === 'string' ? payload.status.trim().toUpperCase() : null;
  const planFile = typeof payload.plan_file === 'string' ? payload.plan_file.trim() : null;
  const nextValue = typeof payload.next === 'string' ? payload.next : '';
  const lastRunRelativePath = toRepoRelativePath(params.repoRoot, lastRunPath);
  const planMatches = planFile === params.canonicalPath;

  if (status === 'IN_PROGRESS') {
    const headerMatches =
      !params.activeTaskHeader ||
      params.activeTaskHeader === params.activeTaskId ||
      (params.activeTaskHeader === 'NINGUNA' && params.activeTaskId === null);
    const nextMatches = !params.activeTaskId || nextValue.includes(params.activeTaskId);
    return {
      path: lastRunRelativePath,
      status,
      valid:
        planMatches &&
        params.inProgressCount === 1 &&
        headerMatches &&
        nextMatches,
    };
  }

  if (status === 'DONE') {
    return {
      path: lastRunRelativePath,
      status,
      valid:
        planMatches &&
        params.inProgressCount === 0 &&
        (params.activeTaskHeader === null || params.activeTaskHeader === 'NINGUNA'),
    };
  }

  return {
    path: lastRunRelativePath,
    status,
    valid: false,
  };
};

export const resolveRepoTrackingState = (repoRoot: string): RepoTrackingState => {
  const declarations = collectTrackingCandidates(repoRoot);
  const enforced = declarations.length > 0;
  if (!enforced) {
    return {
      enforced: false,
      canonical_path: null,
      canonical_present: false,
      source_file: null,
      in_progress_count: 0,
      single_in_progress_valid: false,
      conflict: false,
      declarations: [],
      active_task_id: null,
      last_run_path: null,
      last_run_status: null,
    };
  }

  const highestPriority = declarations[0]?.priority ?? 0;
  const highestPriorityDeclarations = declarations.filter(
    (declaration) => declaration.priority === highestPriority
  );
  const uniqueCanonicalPaths = Array.from(
    new Set(highestPriorityDeclarations.map((declaration) => declaration.resolved_path))
  );
  const canonicalPath = uniqueCanonicalPaths.length === 1 ? uniqueCanonicalPaths[0] : null;
  const canonicalPresent =
    typeof canonicalPath === 'string' && canonicalPath.length > 0
      ? existsSync(resolve(repoRoot, canonicalPath))
      : false;
  const sourceFile =
    canonicalPath === null
      ? null
      : highestPriorityDeclarations.find(
          (declaration) => declaration.resolved_path === canonicalPath
        )?.source_file ?? null;

  if (!canonicalPath || !canonicalPresent) {
    return {
      enforced: true,
      canonical_path: canonicalPath,
      canonical_present: canonicalPresent,
      source_file: sourceFile,
      in_progress_count: 0,
      single_in_progress_valid: false,
      conflict: uniqueCanonicalPaths.length > 1,
      declarations: declarations.map(({ priority: _priority, ...declaration }) => declaration),
      active_task_id: null,
      last_run_path: null,
      last_run_status: null,
    };
  }

  const markdown = readFileSync(resolve(repoRoot, canonicalPath), 'utf8');
  const inProgressEntries = collectInProgressEntries(markdown);
  const inProgressCount = inProgressEntries.length;
  const activeTaskId = inProgressEntries[0]?.taskId ?? null;
  const activeTaskHeader = readActiveTaskHeader(markdown);
  const lastRunAlignment = readLastRunAlignment({
    repoRoot,
    canonicalPath,
    activeTaskId,
    inProgressCount,
    activeTaskHeader,
  });

  return {
    enforced: true,
    canonical_path: canonicalPath,
    canonical_present: true,
    source_file: sourceFile,
    in_progress_count: inProgressCount,
    single_in_progress_valid:
      uniqueCanonicalPaths.length === 1 && lastRunAlignment.valid,
    conflict: uniqueCanonicalPaths.length > 1,
    declarations: declarations.map(({ priority: _priority, ...declaration }) => declaration),
    active_task_id: activeTaskId,
    last_run_path: lastRunAlignment.path,
    last_run_status: lastRunAlignment.status,
  };
};
