export type Consequence = {
  kind: 'Finding';
  message: string;
  code?: string;
  source?: string;
};
