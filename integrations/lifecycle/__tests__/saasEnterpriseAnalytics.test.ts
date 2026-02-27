import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSaasEnterpriseDistributedReport,
  buildSaasEnterpriseKpiSnapshot,
  evaluateSaasEnterpriseAdoptionDecision,
} from '../saasEnterpriseAnalytics';

test('buildSaasEnterpriseKpiSnapshot calcula precision/drift/lead_time/debt_risk', () => {
  const kpi = buildSaasEnterpriseKpiSnapshot({
    evaluated_signals: 100,
    true_positive_signals: 80,
    false_positive_signals: 20,
    baseline_risk_score: 10,
    current_risk_score: 8,
    lead_time_hours: 12.5,
    debt_score: 0.3,
  });

  assert.equal(kpi.precision, 0.8);
  assert.equal(kpi.drift, 0.2);
  assert.equal(kpi.lead_time_hours, 12.5);
  assert.equal(kpi.debt_risk, 0.3);
});

test('buildSaasEnterpriseDistributedReport ordena unidades y consolida totales', () => {
  const report = buildSaasEnterpriseDistributedReport({
    generatedAt: '2026-02-26T10:00:00.000Z',
    units: [
      {
        unit_id: 'unit-b',
        repositories: 2,
        coverage_ratio: 0.8,
        blocked_ratio: 0.2,
        weighted_risk: 10,
      },
      {
        unit_id: 'unit-a',
        repositories: 3,
        coverage_ratio: 1,
        blocked_ratio: 0,
        weighted_risk: 5,
      },
    ],
  });

  assert.equal(report.units[0]?.unit_id, 'unit-a');
  assert.equal(report.totals.repositories, 5);
  assert.equal(report.totals.coverage_ratio, 0.9);
});

test('evaluateSaasEnterpriseAdoptionDecision decide blocked/pilot/scale por umbrales', () => {
  const kpiBlocked = buildSaasEnterpriseKpiSnapshot({
    evaluated_signals: 20,
    true_positive_signals: 8,
    false_positive_signals: 12,
    baseline_risk_score: 10,
    current_risk_score: 12,
    lead_time_hours: 10,
    debt_score: 0.5,
  });
  const reportBlocked = buildSaasEnterpriseDistributedReport({
    units: [
      {
        unit_id: 'unit-a',
        repositories: 1,
        coverage_ratio: 0.8,
        blocked_ratio: 0.3,
        weighted_risk: 3,
      },
    ],
  });
  assert.equal(
    evaluateSaasEnterpriseAdoptionDecision({
      kpi: kpiBlocked,
      report: reportBlocked,
    }).stage,
    'blocked'
  );

  const kpiScale = buildSaasEnterpriseKpiSnapshot({
    evaluated_signals: 100,
    true_positive_signals: 90,
    false_positive_signals: 10,
    baseline_risk_score: 10,
    current_risk_score: 9,
    lead_time_hours: 8,
    debt_score: 0.2,
  });
  const reportScale = buildSaasEnterpriseDistributedReport({
    units: [
      {
        unit_id: 'unit-a',
        repositories: 2,
        coverage_ratio: 0.9,
        blocked_ratio: 0.1,
        weighted_risk: 4,
      },
    ],
  });
  assert.equal(
    evaluateSaasEnterpriseAdoptionDecision({
      kpi: kpiScale,
      report: reportScale,
    }).stage,
    'scale'
  );
});
