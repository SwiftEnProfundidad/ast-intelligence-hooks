import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import { renderMarkdownFence } from './adapter-real-session-markdown-snippets-lib';

export const appendAttachedSnippetsSection = (
  lines: string[],
  params: AdapterRealSessionReportParams
): void => {
  lines.push('## Attached Snippets');
  lines.push('');
  lines.push('### hooks.json snippet');
  lines.push('');
  lines.push('```json');
  lines.push(
    renderMarkdownFence(
      (params.hookConfigContent ?? '(missing)').split(/\r?\n/).slice(0, 80).join('\n')
    )
  );
  lines.push('```');
  lines.push('');
  lines.push(`### ${params.runtimeLogPath ?? '.audit_tmp/cascade-hook-runtime-*.log'}`);
  lines.push('');
  lines.push('```text');
  lines.push(renderMarkdownFence(params.runtimeLogTail));
  lines.push('```');
  lines.push('');
  lines.push(`### ${params.smokeLogPath ?? '.audit_tmp/cascade-hook-smoke-*.log'}`);
  lines.push('');
  lines.push('```text');
  lines.push(renderMarkdownFence(params.smokeLogTail));
  lines.push('```');
  lines.push('');
  lines.push(`### ${params.hookLogPath}`);
  lines.push('');
  lines.push('```text');
  lines.push(renderMarkdownFence(params.hookLogTail));
  lines.push('```');
  lines.push('');
  lines.push(`### ${params.writesLogPath}`);
  lines.push('');
  lines.push('```text');
  lines.push(renderMarkdownFence(params.writesLogTail));
  lines.push('```');
  lines.push('');
};
