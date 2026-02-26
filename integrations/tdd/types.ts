export type TddBddSnapshot = {
  status: 'skipped' | 'passed' | 'blocked' | 'waived';
  scope: {
    in_scope: boolean;
    is_new_feature: boolean;
    is_complex_change: boolean;
    reasons: string[];
    metrics: {
      changed_files: number;
      estimated_loc: number;
      critical_path_files: number;
      public_interface_files: number;
    };
  };
  evidence: {
    path: string;
    state: 'missing' | 'invalid' | 'valid' | 'not_required';
    version?: string;
    slices_total: number;
    slices_valid: number;
    slices_invalid: number;
    integrity_ok: boolean;
    errors: string[];
  };
  waiver: {
    applied: boolean;
    path?: string;
    approver?: string;
    reason?: string;
    expires_at?: string;
    invalid_reason?: string;
  };
};
