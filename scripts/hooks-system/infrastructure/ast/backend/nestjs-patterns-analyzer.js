function analyzeNestJSPatterns(sf, findings, pushFinding) {
  const filePath = sf.getFilePath();
  const content = sf.getFullText();

  if (!filePath.endsWith('.ts')) return;
  if (!filePath.includes('.controller.')) return;
  if (!content.includes('@Controller')) return;

}

module.exports = { analyzeNestJSPatterns };
