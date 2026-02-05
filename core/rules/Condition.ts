export type Condition =
  | {
      kind: 'FileChange';
      where?: {
        pathPrefix?: string;
        changeType?: 'added' | 'modified' | 'deleted';
      };
    }
  | {
      kind: 'FileContent';
      contains?: ReadonlyArray<string>;
      regex?: ReadonlyArray<string>;
    }
  | {
      kind: 'Dependency';
      where?: {
        from?: string;
        to?: string;
      };
    }
  | {
      kind: 'All';
      conditions: ReadonlyArray<Condition>;
    }
  | {
      kind: 'Any';
      conditions: ReadonlyArray<Condition>;
    }
  | {
      kind: 'Not';
      condition: Condition;
    };
