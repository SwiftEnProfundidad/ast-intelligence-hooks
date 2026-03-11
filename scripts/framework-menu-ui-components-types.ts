export type CliPaletteRole =
  | 'title'
  | 'subtitle'
  | 'switch'
  | 'sectionTitle'
  | 'statusWarning'
  | 'rule'
  | 'goal'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'muted'
  | 'border';

export type CliDesignTokens = {
  colorEnabled: boolean;
  asciiMode: boolean;
  panelOuterWidth: number;
  panelInnerWidth: number;
  border: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
  };
  palette: Record<CliPaletteRole, string>;
};
