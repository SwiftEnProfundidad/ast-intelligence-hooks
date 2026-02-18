import { startEnterpriseMcpServer } from './enterpriseServer';

const parsedPort = Number.parseInt(process.env.PUMUKI_ENTERPRISE_MCP_PORT ?? '', 10);
const port = Number.isFinite(parsedPort) ? parsedPort : 7391;
const host = process.env.PUMUKI_ENTERPRISE_MCP_HOST ?? '127.0.0.1';

const started = startEnterpriseMcpServer({
  host,
  port,
});

process.stdout.write(`Pumuki MCP enterprise running at http://${started.host}:${started.port}\n`);
