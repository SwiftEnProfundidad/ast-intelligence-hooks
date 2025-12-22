#!/usr/bin/env node

const PredictiveHookAdvisor = require('../application/services/PredictiveHookAdvisor');

const advisor = new PredictiveHookAdvisor();
const suggestions = advisor.suggestPreemptiveActions();

if (suggestions.length === 0) {
  console.log('No predictive actions required (insufficient data or low failure rates).');
  process.exit(0);
}

console.log('Predictive hook suggestions:');
for (const suggestion of suggestions) {
  console.log(
    `- ${suggestion.hook}: ${(suggestion.probability * 100).toFixed(1)}% failure rate (${suggestion.failures}/${suggestion.total})`
  );
}
