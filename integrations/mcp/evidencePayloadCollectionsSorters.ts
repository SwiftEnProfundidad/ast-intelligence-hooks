import type { AiEvidenceV2_1 } from '../evidence/schema';
import { inferPlatformFromFilePath } from './evidenceFacets';

export const sortSnapshotFindings = (
  findings: AiEvidenceV2_1['snapshot']['findings']
): AiEvidenceV2_1['snapshot']['findings'] => {
  return [...findings].sort((left, right) => {
    const byRule = left.ruleId.localeCompare(right.ruleId);
    if (byRule !== 0) {
      return byRule;
    }
    const byFile = left.file.localeCompare(right.file);
    if (byFile !== 0) {
      return byFile;
    }
    const leftLines = left.lines ? (Array.isArray(left.lines) ? left.lines.join(',') : String(left.lines)) : '';
    const rightLines = right.lines ? (Array.isArray(right.lines) ? right.lines.join(',') : String(right.lines)) : '';
    const byLines = leftLines.localeCompare(rightLines);
    if (byLines !== 0) {
      return byLines;
    }
    const byCode = left.code.localeCompare(right.code);
    if (byCode !== 0) {
      return byCode;
    }
    const bySeverity = left.severity.localeCompare(right.severity);
    if (bySeverity !== 0) {
      return bySeverity;
    }
    return left.message.localeCompare(right.message);
  });
};

export const sortLedger = (ledger: AiEvidenceV2_1['ledger']): AiEvidenceV2_1['ledger'] => {
  return [...ledger].sort((left, right) => {
    const byRule = left.ruleId.localeCompare(right.ruleId);
    if (byRule !== 0) {
      return byRule;
    }
    const byFile = left.file.localeCompare(right.file);
    if (byFile !== 0) {
      return byFile;
    }
    const leftLines = left.lines ? (Array.isArray(left.lines) ? left.lines.join(',') : String(left.lines)) : '';
    const rightLines = right.lines ? (Array.isArray(right.lines) ? right.lines.join(',') : String(right.lines)) : '';
    const byLines = leftLines.localeCompare(rightLines);
    if (byLines !== 0) {
      return byLines;
    }
    const byFirstSeen = left.firstSeen.localeCompare(right.firstSeen);
    if (byFirstSeen !== 0) {
      return byFirstSeen;
    }
    return left.lastSeen.localeCompare(right.lastSeen);
  });
};

export const inferFindingPlatform = (
  finding: AiEvidenceV2_1['snapshot']['findings'][number]
): 'ios' | 'backend' | 'frontend' | 'android' | 'generic' => {
  return inferPlatformFromFilePath(finding.file);
};
