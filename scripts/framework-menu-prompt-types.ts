import type { Interface } from 'node:readline/promises';

export type Questioner = Pick<Interface, 'question'>;

export const parsePositive = (value: string): boolean => {
  return value.trim().toLowerCase().startsWith('y');
};

export const parseInteger = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
