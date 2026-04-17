import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import type { RepoTrackingDeclaration, RepoTrackingState } from './schema';

const TRACKING_DECLARATION_SOURCES = [
  'AGENTS.md',
  'docs/README.md',
  'docs/validation/README.md',
  'docs/strategy/README.md',
] as const;

const TRACKING_KEYWORDS =
  /(seguimiento|tracking interno|tracking can[oó]nico|canonical tracking|fuente viva|fuente can[oó]nica|source of truth|single source)/i;
const TRACKING_PRIORITY_SOURCE = new Set(['AGENTS.md']);
const IN_PROGRESS_PATTERNS = [
  /^- Estado:\s*🚧/m,
  /^- 🚧 (\`?P[0-9A-Za-z.-]+\`?)/m,
  /^\`?\[\s*🚧\s*\]\s*-\`?/m,
  /^\|\s*🚧(?:\s|\|)/m,
  /^\|[^|\n]+\|\s*🚧(?:\s|\|)/m,
  /^\|[^|\n]+\|\s*\`?\[\s*🚧\s*\]\s*-\`?/m,
] as const;

const toRepoRelativePath = (repoRoot: string, absolutePath: string): string => {
  const relativePath = relative(repoRoot, absolutePath).replace(/\\/g, '/');
  return relativePath.length > 0 && !relativePath.startsWith('..') ? relativePath : absolutePath.replace(/\\/g, '/');
};

const collectDeclaredPathsFromLine = (line: string): string[] => {
  const matches = new Set<string>();
  for (const regex of [/`([^`]+\.md)`/g, /\[[^\]]+\]\(([^)]+\.md)\)/g]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      const candidate = match[1]?.trim();
      if (candidate) {
        matches.add(candidate);
      }
    }
  }
  return [...matches];
};

const collectTrackingDeclarations = (repoRoot: string): ReadonlyArray<RepoTrackingDeclaration> => {
  const declarations: RepoTrackingDeclaration[] = [];
  for (const sourceFile of TRACKING_DECLARATION_SOURCES) {
    const absoluteSourcePath = resolve(repoRoot, sourceFile);
    if (!existsSync(absoluteSourcePath)) {
      continue;
    }
    const content = readFileSync(absoluteSourcePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      if (!TRACKING_KEYWORDS.test(line)) {
        continue;
      }
      for (const declaredPath of collectDeclaredPathsFromLine(line)) {
        const resolvedPath = declaredPath.startsWith('./') || declaredPath.startsWith('../')
          ? resolve(repoRoot, dirname(sourceFile), declaredPath)
          : resolve(repoRoot, declaredPath);
        declarations.push({
          source_file: sourceFile,
          declared_path: declaredPath,
          resolved_path: toRepoRelativePath(repoRoot, resolvedPath),
        });
      }
    }
  }
  const deduped = new Map<string, RepoTrackingDeclaration>();
  for (const declaration of declarations) {
    deduped.set(
      `${declaration.source_file}::${declaration.resolved_path}`,
      declaration
    );
  }
  return [...deduped.values()];
};

const resolveCanonicalTrackingPath = (
  declarations: ReadonlyArray<RepoTrackingDeclaration>
): { canonicalPath: string | null; sourceFile: string | null; conflict: boolean } => {
  if (declarations.length === 0) {
    return {
      canonicalPath: null,
      sourceFile: null,
      conflict: false,
    };
  }

  const agentsDeclarations = declarations.filter((entry) => TRACKING_PRIORITY_SOURCE.has(entry.source_file));
  const preferred = agentsDeclarations.length > 0 ? agentsDeclarations : declarations;
  const preferredPaths = [...new Set(preferred.map((entry) => entry.resolved_path))];
  const allPaths = [...new Set(declarations.map((entry) => entry.resolved_path))];

  if (preferredPaths.length === 0) {
    return {
      canonicalPath: null,
      sourceFile: null,
      conflict: allPaths.length > 1,
    };
  }

  const canonicalPath = preferredPaths[0] ?? null;
  const sourceFile =
    preferred.find((entry) => entry.resolved_path === canonicalPath)?.source_file
    ?? null;
  return {
    canonicalPath,
    sourceFile,
    conflict: allPaths.length > 1 || preferredPaths.length > 1,
  };
};

const countInProgressMarkers = (absolutePath: string): number => {
  if (!existsSync(absolutePath)) {
    return 0;
  }
  const content = readFileSync(absolutePath, 'utf8');
  const matchedLines = new Set<number>();
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (IN_PROGRESS_PATTERNS.some((pattern) => pattern.test(line))) {
      matchedLines.add(index);
    }
  });
  return matchedLines.size;
};

export const readRepoTrackingState = (repoRoot: string): RepoTrackingState => {
  const declarations = collectTrackingDeclarations(repoRoot);
  const enforced = declarations.length > 0;
  const resolution = resolveCanonicalTrackingPath(declarations);
  const canonicalAbsolutePath = resolution.canonicalPath
    ? resolve(repoRoot, resolution.canonicalPath.split('/').join(sep))
    : null;
  const canonicalPresent = canonicalAbsolutePath ? existsSync(canonicalAbsolutePath) : false;
  const inProgressCount = canonicalPresent && canonicalAbsolutePath
    ? countInProgressMarkers(canonicalAbsolutePath)
    : null;

  return {
    enforced,
    canonical_path: resolution.canonicalPath,
    canonical_present: canonicalPresent,
    source_file: resolution.sourceFile,
    in_progress_count: inProgressCount,
    single_in_progress_valid: inProgressCount === null ? null : inProgressCount === 1,
    conflict: resolution.conflict,
    declarations,
  };
};
