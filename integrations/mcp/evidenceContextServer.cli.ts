import { startEvidenceContextServer } from './evidenceContextServer';

const parsedPort = Number.parseInt(process.env.PUMUKI_EVIDENCE_PORT ?? '', 10);
const port = Number.isFinite(parsedPort) ? parsedPort : 7341;
const host = process.env.PUMUKI_EVIDENCE_HOST ?? '127.0.0.1';
const route = process.env.PUMUKI_EVIDENCE_ROUTE ?? '/ai-evidence';

const started = startEvidenceContextServer({
  host,
  port,
  route,
});

process.stdout.write(
  `Evidence context server running at http://${started.host}:${started.port}${started.route}\n`
);
