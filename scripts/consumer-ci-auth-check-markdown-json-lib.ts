import type { JsonResult } from './consumer-ci-auth-check-contract';

export const buildConsumerCiAuthJsonProbeLines = <T>(params: {
  title: string;
  probe: JsonResult<T>;
}): ReadonlyArray<string> => {
  if (params.probe.ok && params.probe.data) {
    return [
      params.title,
      '',
      '```json',
      JSON.stringify(params.probe.data, null, 2),
      '```',
      '',
    ];
  }

  return [params.title, '', `- error: ${params.probe.error}`, ''];
};
