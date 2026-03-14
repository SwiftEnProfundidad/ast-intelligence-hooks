import { resolve } from 'node:path';
import {
  assertLegacyParityStrictScope,
  buildLegacyParityRuleCountMap,
  buildLegacyParityScopeMatches,
  buildLegacyParitySeverityCountMap,
  normalizeLegacyParityPayload,
  parseLegacyParityJson,
} from './legacy-parity-report-normalize';
import { SEVERITY_ORDER, type LegacyParityReport, type LegacyParityRow, type LegacyParitySeverityRow } from './legacy-parity-report-types';

export const buildLegacyParityReport = (params: {
  legacyPath: string;
  enterprisePath: string;
  strictScope?: boolean;
}): LegacyParityReport => {
  const legacyPath = resolve(params.legacyPath);
  const enterprisePath = resolve(params.enterprisePath);
  const strictScope = params.strictScope ?? true;

  const legacyPayload = normalizeLegacyParityPayload(parseLegacyParityJson(legacyPath));
  const enterprisePayload = normalizeLegacyParityPayload(parseLegacyParityJson(enterprisePath));
  const scopeMatches = buildLegacyParityScopeMatches({
    legacy: legacyPayload.scope,
    enterprise: enterprisePayload.scope,
  });
  if (strictScope) {
    assertLegacyParityStrictScope({
      legacy: legacyPayload.scope,
      enterprise: enterprisePayload.scope,
      matches: scopeMatches,
    });
  }

  const legacyRows = legacyPayload.rows;
  const enterpriseRows = enterprisePayload.rows;
  const legacyRuleMap = buildLegacyParityRuleCountMap(legacyRows);
  const enterpriseRuleMap = buildLegacyParityRuleCountMap(enterpriseRows);
  const legacySeverityMap = buildLegacyParitySeverityCountMap(legacyRows);
  const enterpriseSeverityMap = buildLegacyParitySeverityCountMap(enterpriseRows);

  const keys = [...legacyRuleMap.keys()].sort((left, right) => left.localeCompare(right));
  const rows: LegacyParityRow[] = keys.map((key) => {
    const [platform, ruleId] = key.split('::');
    const legacyCount = legacyRuleMap.get(key) ?? 0;
    const enterpriseCount = enterpriseRuleMap.get(key) ?? 0;
    return {
      platform: platform ?? 'other',
      ruleId: ruleId ?? 'unknown',
      legacyCount,
      enterpriseCount,
      dominance: enterpriseCount >= legacyCount ? 'PASS' : 'FAIL',
    };
  });
  const failedRules = rows.filter((row) => row.dominance === 'FAIL').length;
  const passedRules = rows.length - failedRules;
  const ruleDominance: LegacyParityReport['ruleDominance'] = failedRules === 0 ? 'PASS' : 'FAIL';

  const severityRows: LegacyParitySeverityRow[] = SEVERITY_ORDER.map((severity) => {
    const legacyCount = legacySeverityMap.get(severity) ?? 0;
    const enterpriseCount = enterpriseSeverityMap.get(severity) ?? 0;
    return {
      severity,
      legacyCount,
      enterpriseCount,
      dominance: enterpriseCount >= legacyCount ? 'PASS' : 'FAIL',
    };
  });
  const severityHardBlock = severityRows.some((row) => row.dominance === 'FAIL');

  return {
    legacyPath,
    enterprisePath,
    generatedAt: new Date().toISOString(),
    dominance: severityHardBlock ? 'FAIL' : 'PASS',
    ruleDominance,
    totals: {
      comparedRules: rows.length,
      passedRules,
      failedRules,
      legacyFindings: legacyRows.length,
      enterpriseFindings: enterpriseRows.length,
    },
    severity: {
      hardBlock: severityHardBlock,
      rows: severityRows,
    },
    scope: {
      strict: strictScope,
      legacy: legacyPayload.scope,
      enterprise: enterprisePayload.scope,
      matches: scopeMatches,
    },
    rows,
  };
};
