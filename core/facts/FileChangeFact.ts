export interface FileChangeFact {
  kind: 'FileChange';
  path: string;
  changeType: 'added' | 'modified' | 'deleted';
}
