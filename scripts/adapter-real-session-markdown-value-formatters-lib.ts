type YesNo = 'YES' | 'NO';
type PassFailUnknown = 'PASS' | 'FAIL' | 'UNKNOWN';

export const toYesNo = (value: boolean): YesNo => {
  return value ? 'YES' : 'NO';
};

export const toPassFail = (value: boolean): PassFailUnknown => {
  return value ? 'PASS' : 'FAIL';
};
