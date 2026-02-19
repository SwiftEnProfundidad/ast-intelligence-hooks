import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { sortPlatforms, toPlatformConfidenceCounts } from '../evidenceFacetsPlatforms';

const samplePlatforms: AiEvidenceV2_1['platforms'] = {
  web: { detected: true, confidence: 'MEDIUM' },
  ios: { detected: false, confidence: 'LOW' },
  backend: { detected: true, confidence: 'HIGH' },
  android: { detected: true, confidence: 'HIGH' },
};

test('sortPlatforms returns deterministic platform ordering with original values', () => {
  const sorted = sortPlatforms(samplePlatforms);

  assert.deepEqual(
    sorted.map((entry) => `${entry.platform}:${entry.detected}:${entry.confidence}`),
    [
      'android:true:HIGH',
      'backend:true:HIGH',
      'ios:false:LOW',
      'web:true:MEDIUM',
    ]
  );
});

test('toPlatformConfidenceCounts returns deterministic confidence histogram', () => {
  assert.deepEqual(toPlatformConfidenceCounts(samplePlatforms), {
    HIGH: 2,
    LOW: 1,
    MEDIUM: 1,
  });
});

test('toPlatformConfidenceCounts returns empty object for empty input', () => {
  assert.deepEqual(toPlatformConfidenceCounts({}), {});
});
