import type { AdapterRealSessionCliOptions } from './adapter-real-session-contract';

export type AdapterRealSessionValueArg =
  '--out'
  | '--status-report'
  | '--operator'
  | '--adapter-version'
  | '--tail-lines';

export const isAdapterRealSessionValueArg = (arg: string): arg is AdapterRealSessionValueArg =>
  arg === '--out' ||
  arg === '--status-report' ||
  arg === '--operator' ||
  arg === '--adapter-version' ||
  arg === '--tail-lines';

const parsePositiveInteger = (value: string, label: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} value: ${value}`);
  }
  return parsed;
};

export const applyAdapterRealSessionValueArg = (params: {
  options: AdapterRealSessionCliOptions;
  arg: AdapterRealSessionValueArg;
  value: string;
}): void => {
  if (params.arg === '--out') {
    params.options.outFile = params.value;
    return;
  }
  if (params.arg === '--status-report') {
    params.options.statusReportFile = params.value;
    return;
  }
  if (params.arg === '--operator') {
    params.options.operator = params.value;
    return;
  }
  if (params.arg === '--adapter-version') {
    params.options.adapterVersion = params.value;
    return;
  }
  params.options.tailLines = parsePositiveInteger(params.value, '--tail-lines');
};
