const fs = require('fs');
const os = require('os');
const path = require('path');

describe('nightly-metrics-report', () => {
  let tmpDir;
  let originalCwd;

  const createModule = () => {
    jest.resetModules();
    jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    return require('../nightly-metrics-report');
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nightly-metrics-'));
    originalCwd = process.cwd();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.resetModules();
    jest.spyOn(process, 'cwd').mockReturnValue(originalCwd);
  });

  it('aggregates metrics per hook and status inside the window', () => {
    const module = createModule();
    const { readMetricsWindow, aggregateMetrics } = module;

    const metricsPath = path.join(tmpDir, '.audit_tmp', 'hook-metrics.jsonl');
    fs.mkdirSync(path.dirname(metricsPath), { recursive: true });

    const now = Date.now();
    const entries = [
      { timestamp: now, hook: 'validate-ai-evidence', status: 'success', durationMs: 120 },
      { timestamp: now - 1000, hook: 'validate-ai-evidence', status: 'failure', durationMs: 200 },
      { timestamp: now - (30 * 60 * 1000), hook: 'enforce-english-literals', status: 'success' },
      { timestamp: now - (48 * 60 * 60 * 1000), hook: 'old-event', status: 'success' }
    ];

    fs.writeFileSync(
      metricsPath,
      entries.map(item => JSON.stringify(item)).join('\n') + '\n',
      'utf8'
    );

    const windowEntries = readMetricsWindow(24 * 60 * 60 * 1000);
    const summary = aggregateMetrics(windowEntries);

    expect(summary.total).toBe(3);
    expect(summary.success).toBe(2);
    expect(summary.failure).toBe(1);
    expect(summary.hooks['validate-ai-evidence']).toMatchObject({
      total: 2,
      success: 1,
      failure: 1
    });
    expect(summary.hooks['enforce-english-literals']).toMatchObject({
      total: 1,
      success: 1,
      failure: 0
    });
    expect(summary.hooks['validate-ai-evidence'].avgDurationMs).toBeCloseTo(160);
  });

  it('writes nightly report to audit directory', () => {
    const module = createModule();
    const { run } = module;

    const metricsPath = path.join(tmpDir, '.audit_tmp', 'hook-metrics.jsonl');
    fs.mkdirSync(path.dirname(metricsPath), { recursive: true });

    const baseEntry = {
      timestamp: Date.now(),
      hook: 'validate-ai-evidence',
      status: 'success',
      durationMs: 150
    };
    fs.writeFileSync(metricsPath, `${JSON.stringify(baseEntry)}\n`, 'utf8');

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    run();
    logSpy.mockRestore();

    const nightlyDir = path.join(tmpDir, '.audit-reports', 'nightly');
    const files = fs.readdirSync(nightlyDir);
    expect(files.length).toBe(1);

    const report = JSON.parse(fs.readFileSync(path.join(nightlyDir, files[0]), 'utf8'));
    expect(report.totals.total).toBe(1);
    expect(report.totals.success).toBe(1);
  });
});
