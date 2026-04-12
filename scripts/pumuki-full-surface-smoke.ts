import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  installedBinMarkerPath,
  resolveSmokeLayout,
} from './pumuki-full-surface-smoke-lib';

type SmokeRow = {
  id: string;
  bin: string;
  args: ReadonlyArray<string>;
  timeoutMs: number;
  allowNonZero?: boolean;
};

const layout = resolveSmokeLayout({
  scriptFileUrl: import.meta.url,
  env: process.env,
});

const { pumukiPackageRoot, smokeCwd, binStrategy, binRoot } = layout;
const node = process.execPath;
const binPath = (name: string): string => join(binRoot, 'bin', name);

const run = (row: SmokeRow): { code: number | null; signal: NodeJS.Signals | null; ms: number } => {
  const started = Date.now();
  const r = spawnSync(node, [binPath(row.bin), ...row.args], {
    cwd: smokeCwd,
    encoding: 'utf8',
    timeout: row.timeoutMs,
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  return { code: r.status, signal: r.signal, ms: Date.now() - started };
};

const rows: ReadonlyArray<SmokeRow> = [
  { id: 'cli.help_implicit', bin: 'pumuki.js', args: [], timeoutMs: 15_000, allowNonZero: true },
  { id: 'cli.help_explicit', bin: 'pumuki.js', args: ['--help'], timeoutMs: 15_000 },
  {
    id: 'cli.unknown_subcommand',
    bin: 'pumuki.js',
    args: ['__no_such_lifecycle_command__'],
    timeoutMs: 15_000,
    allowNonZero: true,
  },
  { id: 'doctor.json', bin: 'pumuki.js', args: ['doctor', '--json'], timeoutMs: 60_000 },
  {
    id: 'doctor.deep_json',
    bin: 'pumuki.js',
    args: ['doctor', '--deep', '--json'],
    timeoutMs: 180_000,
    allowNonZero: true,
  },
  { id: 'doctor.parity_json', bin: 'pumuki.js', args: ['doctor', '--parity', '--json'], timeoutMs: 120_000 },
  { id: 'status.json', bin: 'pumuki.js', args: ['status', '--json'], timeoutMs: 90_000 },
  {
    id: 'audit.default_json',
    bin: 'pumuki.js',
    args: ['audit', '--json'],
    timeoutMs: 300_000,
    allowNonZero: true,
  },
  {
    id: 'audit.pre_push_json',
    bin: 'pumuki.js',
    args: ['audit', '--stage=PRE_PUSH', '--json'],
    timeoutMs: 300_000,
    allowNonZero: true,
  },
  {
    id: 'audit.ci_engine_json',
    bin: 'pumuki.js',
    args: ['audit', '--stage=CI', '--engine', '--json'],
    timeoutMs: 300_000,
    allowNonZero: true,
  },
  {
    id: 'watch.once_json',
    bin: 'pumuki.js',
    args: [
      'watch',
      '--once',
      '--json',
      '--stage=PRE_COMMIT',
      '--scope=repo',
      '--interval-ms=200',
      '--no-notify',
    ],
    timeoutMs: 180_000,
  },
  {
    id: 'watch.once_staged_json',
    bin: 'pumuki.js',
    args: [
      'watch',
      '--once',
      '--json',
      '--stage=PRE_COMMIT',
      '--scope=staged',
      '--interval-ms=200',
      '--no-notify',
    ],
    timeoutMs: 180_000,
    allowNonZero: true,
  },
  { id: 'loop.list_json', bin: 'pumuki.js', args: ['loop', 'list', '--json'], timeoutMs: 30_000 },
  {
    id: 'loop.run_smoke',
    bin: 'pumuki.js',
    args: ['loop', 'run', '--objective=smoke-surface', '--max-attempts=1', '--json'],
    timeoutMs: 300_000,
    allowNonZero: true,
  },
  {
    id: 'adapter.install_dry_repo_json',
    bin: 'pumuki.js',
    args: ['adapter', 'install', '--agent=repo', '--dry-run', '--json'],
    timeoutMs: 30_000,
  },
  {
    id: 'adapter.install_dry_codex_json',
    bin: 'pumuki.js',
    args: ['adapter', 'install', '--agent=codex', '--dry-run', '--json'],
    timeoutMs: 30_000,
  },
  {
    id: 'analytics.hotspots_report',
    bin: 'pumuki.js',
    args: ['analytics', 'hotspots', 'report', '--top=3', '--since-days=30', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  {
    id: 'analytics.hotspots_diagnose',
    bin: 'pumuki.js',
    args: ['analytics', 'hotspots', 'diagnose', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  {
    id: 'policy.reconcile_json',
    bin: 'pumuki.js',
    args: ['policy', 'reconcile', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  {
    id: 'policy.reconcile_strict_json',
    bin: 'pumuki.js',
    args: ['policy', 'reconcile', '--strict', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  { id: 'sdd.status_json', bin: 'pumuki.js', args: ['sdd', 'status', '--json'], timeoutMs: 60_000 },
  {
    id: 'sdd.validate_pre_write_json',
    bin: 'pumuki.js',
    args: ['sdd', 'validate', '--stage=PRE_WRITE', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  {
    id: 'sdd.validate_precommit_json',
    bin: 'pumuki.js',
    args: ['sdd', 'validate', '--stage=PRE_COMMIT', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  {
    id: 'sdd.validate_prepush_json',
    bin: 'pumuki.js',
    args: ['sdd', 'validate', '--stage=PRE_PUSH', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  {
    id: 'sdd.validate_ci_json',
    bin: 'pumuki.js',
    args: ['sdd', 'validate', '--stage=CI', '--json'],
    timeoutMs: 120_000,
    allowNonZero: true,
  },
  { id: 'hook.pre_write', bin: 'pumuki-pre-write.js', args: [], timeoutMs: 300_000, allowNonZero: true },
  { id: 'hook.pre_commit', bin: 'pumuki-pre-commit.js', args: [], timeoutMs: 300_000, allowNonZero: true },
  { id: 'hook.pre_push', bin: 'pumuki-pre-push.js', args: [], timeoutMs: 300_000, allowNonZero: true },
  { id: 'hook.ci', bin: 'pumuki-ci.js', args: [], timeoutMs: 300_000, allowNonZero: true },
];

const main = (): number => {
  if (binStrategy === 'installed') {
    const marker = installedBinMarkerPath(layout);
    if (!existsSync(marker)) {
      process.stderr.write(
        `[pumuki] smoke: PUMUKI_SMOKE_BIN_STRATEGY=installed pero no existe ${marker}. ` +
          'Ejecuta npm install en el consumidor o revisa PUMUKI_SMOKE_REPO_ROOT.\n'
      );
      return 2;
    }
  }

  const lines: string[] = [];
  lines.push('# Pumuki superficie — smoke');
  lines.push('');
  lines.push(`- binStrategy: \`${binStrategy}\` (PUMUKI_SMOKE_BIN_STRATEGY=source|installed)`);
  lines.push(`- binRoot: \`${binRoot}\``);
  lines.push(`- pumukiPackageRoot (script host): \`${pumukiPackageRoot}\``);
  lines.push(`- smokeCwd (gate/doctor cwd): \`${smokeCwd}\``);
  lines.push(`- node: \`${node}\``);
  lines.push(`- filas: **${rows.length}** (incluye CLI, doctor/status, audit×3, watch×2, loop, adapter×2, analytics×2, policy×2, sdd×5, hooks×4)`);
  lines.push('');
  lines.push('| id | exit | ms | ok |');
  lines.push('|----|------|----|----|');
  let failed = 0;
  for (const row of rows) {
    const { code, signal, ms } = run(row);
    const exit = signal ? `signal:${signal}` : String(code ?? 'null');
    const ok =
      signal !== null
        ? false
        : row.allowNonZero
          ? true
          : code === 0;
    if (!ok) {
      failed += 1;
    }
    lines.push(`| ${row.id} | ${exit} | ${ms} | ${ok ? 'yes' : 'no'} |`);
  }
  lines.push('');
  lines.push('## Interpretación de exit codes');
  lines.push('');
  lines.push('- `audit` devuelve el **mismo código que el gate** del alcance auditado (p. ej. 1 si hay `BLOCK` en el repo). Eso es correcto, no indica CLI roto.');
  lines.push('- `doctor --deep` puede devolver **1** si `doctorHasBlockingIssues` (issues `error` o `deep.blocking`) o mismatch de parity esperado.');
  lines.push('- Los **hooks** (`pre-commit`, etc.) reflejan el gate sobre el estado actual del worktree; 1 con cambios locales o rama protegida es esperable.');
  lines.push('- `sdd validate` y `policy reconcile --strict` pueden devolver **1** según política del repo; el smoke los marca con `allowNonZero`.');
  lines.push('');
  lines.push('## No cubierto aquí (manual o destructivo)');
  lines.push('');
  lines.push('- `pumuki install|uninstall|remove|update|bootstrap` (mutan hooks/artefactos).');
  lines.push('- `pumuki framework` / menú interactivo (`pumuki-framework.js`).');
  lines.push('- Servidores MCP stdio (`pumuki-mcp-*-stdio.js`): esperan JSON-RPC por stdin; probar con cliente MCP.');
  lines.push('- `pumuki sdd session|sync|learn|evidence|state-sync|auto-sync`: requieren ids / evidencia / cambios reales.');
  lines.push('- `pumuki doctor|status --remote-checks`: dependen de red / GitHub.');
  lines.push('');
  lines.push('## Otro repo (consumidor)');
  lines.push('');
  lines.push(
    '- **Bins del tree pumuki (desarrollo):** `PUMUKI_SMOKE_REPO_ROOT=/ruta/al/repo npm run -s smoke:pumuki-surface` desde la raíz de **pumuki** (`PUMUKI_SMOKE_BIN_STRATEGY=source` por defecto).'
  );
  lines.push(
    '- **Bins instalados en el consumidor (`node_modules/pumuki`):** `PUMUKI_SMOKE_REPO_ROOT=/ruta/al/repo PUMUKI_SMOKE_BIN_STRATEGY=installed npm run -s smoke:pumuki-surface` o `npm run -s smoke:pumuki-surface-installed` (exige `PUMUKI_SMOKE_REPO_ROOT`).'
  );
  lines.push('');
  lines.push(`**Resumen:** ${failed} filas con fallo estricto (sin allowNonZero).`);
  process.stdout.write(lines.join('\n'));
  process.stdout.write('\n');
  return failed > 0 ? 1 : 0;
};

process.exitCode = main();
