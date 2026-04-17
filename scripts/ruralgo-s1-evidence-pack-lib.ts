import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type RuralGoS1EvidenceEntry = {
  title: string;
  mode: 'shell' | 'mcp';
  command: string;
  capture: ReadonlyArray<string>;
  expectedFragments: ReadonlyArray<string>;
  incs: ReadonlyArray<string>;
};

export type RuralGoS1EvidencePackOptions = {
  cwd: string;
  consumerRoot: string;
  packageVersion: string;
  generatedAt: string;
};

const resolvePumukiPackageSelector = (packageVersion: string): string => {
  const trimmed = packageVersion.trim();
  const isStableSemver = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(trimmed);
  if (isStableSemver) {
    return `pumuki@${trimmed}`;
  }
  return 'pumuki@latest';
};

const EVIDENCE_ENTRIES: ReadonlyArray<RuralGoS1EvidenceEntry> = [
  {
    title: 'Lifecycle status',
    mode: 'shell',
    command: 'npm run pumuki:status',
    capture: [
      'Bloque `governance truth` completo.',
      'Indicadores de contrato efectivo, rama y skills surface.',
    ],
    expectedFragments: [
      'governance truth',
      'governance_effective',
      'contract_surface',
      'current_branch',
    ],
    incs: ['PUMUKI-INC-070', 'PUMUKI-INC-071', 'PUMUKI-INC-073', 'PUMUKI-INC-076'],
  },
  {
    title: 'Lifecycle doctor',
    mode: 'shell',
    command: 'npm run pumuki:doctor',
    capture: [
      'Veredicto humano final.',
      'Bloque `governance truth` con `next_action` visible.',
    ],
    expectedFragments: [
      'governance truth',
      'next_action',
      'reason_code',
      'WARN',
    ],
    incs: ['PUMUKI-INC-070', 'PUMUKI-INC-071', 'PUMUKI-INC-073'],
  },
  {
    title: 'PRE_WRITE canónico',
    mode: 'shell',
    command: 'npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json',
    capture: [
      'Salida JSON completa.',
      'Campos de session/mode y remediación inmediata.',
    ],
    expectedFragments: [
      '"stage":"PRE_WRITE"',
      '"decision"',
      '"next_action"',
    ],
    incs: ['PUMUKI-INC-070', 'PUMUKI-INC-072'],
  },
  {
    title: 'Hook pre-commit / gate',
    mode: 'shell',
    command: 'git commit --allow-empty -m "test: pumuki s1 validation"',
    capture: [
      'Bloque de gate con `reason_code`, `instruction` y `next_action`.',
      'Si bloquea, conservar `NEXT:` y `REMEDIATION:`.',
    ],
    expectedFragments: [
      'reason_code=',
      'instruction=',
      'next_action=',
    ],
    incs: ['PUMUKI-INC-071', 'PUMUKI-INC-073', 'PUMUKI-INC-076'],
  },
  {
    title: 'MCP pre_flight_check',
    mode: 'mcp',
    command: 'mcp::pre_flight_check(stage=PRE_WRITE)',
    capture: [
      'Payload completo de `result`.',
      'Campos `reason_code`, `instruction`, `next_action`, `hints`.',
    ],
    expectedFragments: [
      'reason_code',
      'instruction',
      'next_action',
      'hints',
    ],
    incs: ['PUMUKI-INC-071', 'PUMUKI-INC-072', 'PUMUKI-INC-073'],
  },
  {
    title: 'MCP auto_execute_ai_start',
    mode: 'mcp',
    command: 'mcp::auto_execute_ai_start(stage=PRE_WRITE)',
    capture: [
      'Payload completo de `result`.',
      'Campos `action`, `reason_code`, `next_action`, `confidence_pct`.',
    ],
    expectedFragments: [
      'action',
      'reason_code',
      'next_action',
      'confidence_pct',
    ],
    incs: ['PUMUKI-INC-071', 'PUMUKI-INC-073', 'PUMUKI-INC-076'],
  },
];

const renderEntry = (params: {
  entry: RuralGoS1EvidenceEntry;
  consumerRoot: string;
}): string => {
  const command = params.entry.mode === 'shell'
    ? `cd ${params.consumerRoot} && ${params.entry.command}`
    : params.entry.command;

  return [
    `### ${params.entry.title}`,
    '',
    `- mode: ${params.entry.mode}`,
    `- command: \`${command}\``,
    `- incs: ${params.entry.incs.join(', ')}`,
    '- capture:',
    ...params.entry.capture.map((item) => `  - ${item}`),
    '- expected_fragments:',
    ...params.entry.expectedFragments.map((item) => `  - ${item}`),
    '',
  ].join('\n');
};

export const buildRuralGoS1EvidencePackMarkdown = (
  options: RuralGoS1EvidencePackOptions
): string => {
  const pumukiPackageSelector = resolvePumukiPackageSelector(options.packageVersion);
  const evidenceEntries: ReadonlyArray<RuralGoS1EvidenceEntry> = EVIDENCE_ENTRIES.map((entry) =>
    entry.title === 'PRE_WRITE canónico'
      ? {
        ...entry,
        command: `npx --yes --package ${pumukiPackageSelector} pumuki sdd validate --stage=PRE_WRITE --json`,
      }
      : entry
  );

  return [
    '# RuralGo S1 Evidence Pack',
    '',
    `- generated_at: ${options.generatedAt}`,
    `- consumer_root: \`${options.consumerRoot}\``,
    `- package_version: ${options.packageVersion}`,
    '- objective: validar S1 contra PUMUKI-INC-071/073/076 y reunir soporte adicional para 070/072.',
    '',
    '## Uso',
    '',
    '- Ejecuta los comandos shell desde el consumer real tras repinear la semver publicada.',
    '- Captura las respuestas MCP desde una sesión conectada al servidor enterprise.',
    '- No muevas un INC a `FIXED` si falta convergencia entre lifecycle, hooks y MCP.',
    '',
    ...evidenceEntries.map((entry) =>
      renderEntry({
        entry,
        consumerRoot: options.consumerRoot,
      })
    ),
    '## Criterio rápido de cierre',
    '',
    '- `PUMUKI-INC-071`: candidato a FIXED si lifecycle, hooks y MCP exponen contrato efectivo del repo.',
    '- `PUMUKI-INC-073`: candidato a FIXED si el verde parcial desaparece y se ve governance real.',
    '- `PUMUKI-INC-076`: candidato a FIXED si hooks y surfaces muestran GitFlow/naming como parte del gate.',
    '- `PUMUKI-INC-072`: no cerrar salvo que el pre-edit gate aparezca de forma homogénea y automática.',
    '',
  ].join('\n');
};

export const writeRuralGoS1EvidencePack = (params: {
  cwd: string;
  outFile: string;
  markdown: string;
}): string => {
  const outputPath = resolve(params.cwd, params.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, params.markdown, 'utf8');
  return outputPath;
};
