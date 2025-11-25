import { Project, SourceFile, Node, SyntaxKind } from "ts-morph";
import path from "path";
import fs from "fs";

type Severity = "error" | "warning" | "info";

type Finding = {
  ruleId: string;
  severity: Severity;
  filePath: string;
  line: number;
  column: number;
  message: string;
};

type Rule = {
  id: string;
  description: string;
  severity: Severity;
  check: (sf: SourceFile) => Finding[];
};

function getRepoRoot(): string {
  return process.cwd();
}

function shouldIgnore(file: string): boolean {
  const p = file.replace(/\\/g, "/");
  if (p.includes("node_modules/")) return true;
  if (p.includes("/.next/")) return true;
  if (p.includes("/dist/")) return true;
  if (p.includes("/.turbo/")) return true;
  if (p.includes("/.vercel/")) return true;
  if (p.includes("/coverage/")) return true;
  if (p.includes("/build/")) return true;
  if (p.includes("/out/")) return true;
  if (p.endsWith(".d.ts")) return true;
  if (p.endsWith(".map")) return true;
  if (/\.min\./.test(p)) return true;
  return false;
}

function listSourceFiles(root: string): string[] {
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
  const result: string[] = [];
  const stack: string[] = [root];
  while (stack.length) {
    const dir = stack.pop() as string;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const norm = full.replace(/\\/g, "/");
      if (e.isDirectory()) {
        if (shouldIgnore(norm + "/")) continue;
        stack.push(full);
      } else {
        const ext = path.extname(e.name);
        if (exts.has(ext) && !shouldIgnore(norm)) result.push(full);
      }
    }
  }
  return result;
}

function positionOf(node: Node, sf: SourceFile): { line: number; column: number } {
  const pos = sf.getLineAndColumnAtPos(node.getStart());
  return { line: pos.line, column: pos.column };
}

function ruleAnyType(): Rule {
  return {
    id: "types.any",
    description: "Disallow explicit any",
    severity: "error",
    check: (sf) => {
      const findings: Finding[] = [];
      sf.forEachDescendant((n) => {
        if (Node.isKeywordTypeNode(n) && n.getKind() === SyntaxKind.AnyKeyword) {
          const { line, column } = positionOf(n, sf);
          findings.push({ ruleId: "types.any", severity: "error", filePath: sf.getFilePath(), line, column, message: "Explicit any" });
        }
      });
      return findings;
    },
  };
}

function ruleConsoleLog(): Rule {
  return {
    id: "debug.console",
    description: "Disallow console.*",
    severity: "warning",
    check: (sf) => {
      const findings: Finding[] = [];
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (/^console\.(log|debug|warn)\b/.test(expr)) {
          const { line, column } = positionOf(call, sf);
          findings.push({ ruleId: "debug.console", severity: "warning", filePath: sf.getFilePath(), line, column, message: expr });
        }
      });
      return findings;
    },
  };
}

function ruleHardcodedSecrets(): Rule {
  return {
    id: "security.secret",
    description: "Hardcoded secret patterns",
    severity: "error",
    check: (sf) => {
      const findings: Finding[] = [];
      const literals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral);
      for (const lit of literals) {
        const v = lit.getLiteralValue();
        if (/(API_KEY|SECRET|TOKEN|PASSWORD)\s*[:=]?\s*[A-Za-z0-9_\-]{8,}/i.test(v)) {
          const { line, column } = positionOf(lit, sf);
          findings.push({ ruleId: "security.secret", severity: "error", filePath: sf.getFilePath(), line, column, message: v.slice(0, 50) });
        }
      }
      return findings;
    },
  };
}

function ruleRawSQLInStrings(): Rule {
  return {
    id: "security.sql.raw",
    description: "Raw SQL keywords in strings",
    severity: "error",
    check: (sf) => {
      const findings: Finding[] = [];
      const literals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral);
      for (const lit of literals) {
        const v = lit.getLiteralValue();
        if (/(SELECT |INSERT |UPDATE |DELETE |DROP |ALTER |TRUNCATE )/i.test(v)) {
          const { line, column } = positionOf(lit, sf);
          findings.push({ ruleId: "security.sql.raw", severity: "error", filePath: sf.getFilePath(), line, column, message: v.slice(0, 60) });
        }
      }
      return findings;
    },
  };
}

function ruleSupabaseNoPagination(): Rule {
  return {
    id: "performance.pagination",
    description: "Select without pagination",
    severity: "warning",
    check: (sf) => {
      const findings: Finding[] = [];
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const text = call.getExpression().getText();
        if (/\bsupabase\b.*\.from\(/.test(text)) {
          const chain = call.getFirstAncestorByKind(SyntaxKind.ExpressionStatement)?.getText() || call.getText();
          const hasRange = /\.range\(/.test(chain) || /\.limit\(/.test(chain);
          if (!hasRange) {
            const { line, column } = positionOf(call, sf);
            findings.push({ ruleId: "performance.pagination", severity: "warning", filePath: sf.getFilePath(), line, column, message: "Missing pagination on query" });
          }
        }
      });
      return findings;
    },
  };
}

function ruleInLoopQueries(): Rule {
  return {
    id: "performance.nplus1",
    description: "Query inside loop",
    severity: "warning",
    check: (sf) => {
      const findings: Finding[] = [];
      const loops = [
        ...sf.getDescendantsOfKind(SyntaxKind.ForStatement),
        ...sf.getDescendantsOfKind(SyntaxKind.ForOfStatement),
        ...sf.getDescendantsOfKind(SyntaxKind.ForInStatement),
        ...sf.getDescendantsOfKind(SyntaxKind.WhileStatement),
      ];
      for (const lp of loops) {
        const innerCalls = lp.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of innerCalls) {
          const t = call.getExpression().getText();
          if (/\bsupabase\b.*\.from\(/.test(t)) {
            const { line, column } = positionOf(call, sf);
            findings.push({ ruleId: "performance.nplus1", severity: "warning", filePath: sf.getFilePath(), line, column, message: "Query in loop" });
          }
        }
      }
      return findings;
    },
  };
}

function ruleLayeringImports(): Rule {
  return {
    id: "architecture.layering",
    description: "Wrong direction imports",
    severity: "error",
    check: (sf) => {
      const findings: Finding[] = [];
      const p = sf.getFilePath().replace(/\\/g, "/");
      const imports = sf.getImportDeclarations();
      for (const imp of imports) {
        const spec = imp.getModuleSpecifierValue();
        if (/domain\//.test(p) && (/infrastructure\//.test(spec) || /application\//.test(spec))) {
          const { line, column } = positionOf(imp, sf);
          findings.push({ ruleId: "architecture.layering", severity: "error", filePath: p, line, column, message: `domain->${spec}` });
        }
        if (/application\//.test(p) && /infrastructure\//.test(spec)) {
          const { line, column } = positionOf(imp, sf);
          findings.push({ ruleId: "architecture.layering", severity: "error", filePath: p, line, column, message: `application->${spec}` });
        }
      }
      return findings;
    },
  };
}

function run(): void {
  const root = getRepoRoot();
  const files = listSourceFiles(root);
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  files.forEach((f) => project.addSourceFileAtPathIfExists(f) || project.addSourceFileAtPath(f));
  const rules: Rule[] = [
    ruleAnyType(),
    ruleConsoleLog(),
    ruleHardcodedSecrets(),
    ruleRawSQLInStrings(),
    ruleSupabaseNoPagination(),
    ruleInLoopQueries(),
    ruleLayeringImports(),
  ];

  const findings: Finding[] = [];
  for (const sf of project.getSourceFiles()) {
    for (const rule of rules) {
      const res = rule.check(sf);
      findings.push(...res);
    }
  }

  const totals = findings.reduce(
    (acc, f) => {
      if (f.severity === "error") acc.errors += 1;
      else if (f.severity === "warning") acc.warnings += 1;
      else acc.infos += 1;
      return acc;
    },
    { errors: 0, warnings: 0, infos: 0 }
  );

  const grouped: Record<string, number> = {};
  for (const f of findings) grouped[f.ruleId] = (grouped[f.ruleId] || 0) + 1;

  const green = "\x1b[32m";
  const yellow = "\x1b[33m";
  const red = "\x1b[31m";
  const nc = "\x1b[0m";

  process.stdout.write(`${yellow}AST Intelligence running on ${files.length} files${nc}\n`);
  Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([k, v]) => {
      const sev = rules.find((r) => r.id === k)?.severity || "info";
      const emoji = sev === "error" ? "🔴" : sev === "warning" ? "🟡" : "🔵";
      process.stdout.write(`${emoji} ${k}:${v}\n`);
    });
  process.stdout.write(`${green}AST Totals: errors=${totals.errors} warnings=${totals.warnings} infos=${totals.infos}${nc}\n`);
}

run();


