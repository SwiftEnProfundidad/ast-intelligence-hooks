const TRUE_VALUES = new Set(['1', 'true', 'on', 'yes']);

export const isMenuUiV2Enabled = (): boolean => {
  const value = (process.env.PUMUKI_MENU_UI_V2 ?? '').trim().toLowerCase();
  return TRUE_VALUES.has(value);
};
