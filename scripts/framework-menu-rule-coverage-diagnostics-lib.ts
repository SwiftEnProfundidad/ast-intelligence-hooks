import { buildRuleCoverageDiagnostics } from './framework-menu-rule-coverage-diagnostics-build';
import { formatRuleCoverageDiagnostics } from './framework-menu-rule-coverage-diagnostics-format';

export type {
  RuleCoverageDiagnosticsDependencies,
  RuleCoverageDiagnosticsReport,
  RuleCoverageStage,
  RuleCoverageStageDiagnostics,
} from './framework-menu-rule-coverage-diagnostics-types';
export { buildRuleCoverageDiagnostics, formatRuleCoverageDiagnostics };

export default {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
};
