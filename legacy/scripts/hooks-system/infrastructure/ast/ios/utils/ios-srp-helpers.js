function resolveSrpSeverity(filePath, { coreSeverity, defaultSeverity, testSeverity }) {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  const isTest = /Tests|Test|Spec/.test(normalized);
  if (isTest) return testSeverity || defaultSeverity;
  const isCore = normalized.includes('/Domain/') || normalized.includes('/Application/');
  if (isCore) return coreSeverity || defaultSeverity;
  return defaultSeverity;
}

function findMatchingBraceIndex(content, startIndex) {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = startIndex; i < content.length; i += 1) {
    const current = content[i];
    const next = content[i + 1];

    if (inLineComment) {
      if (current === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (current === '\\') {
        i += 1;
        continue;
      }
      if (current === stringChar) {
        inString = false;
      }
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (current === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (current === '"' || current === "'") {
      inString = true;
      stringChar = current;
      continue;
    }

    if (current === '{') depth += 1;
    if (current === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function extractSwiftTypeBlocks(content) {
  const blocks = [];
  const pattern = /(^|\n)\s*(?:public|internal|fileprivate|private|open)?\s*(?:final\s+)?(class|struct|enum|protocol)\s+([A-Za-z_][A-Za-z0-9_]*)[^\n{]*\{/g;
  let match = pattern.exec(content);
  while (match) {
    const name = match[3];
    const braceIndex = match.index + match[0].lastIndexOf('{');
    const endIndex = findMatchingBraceIndex(content, braceIndex);
    if (endIndex !== -1) {
      blocks.push({
        name,
        openIndex: braceIndex,
        closeIndex: endIndex,
        body: content.slice(braceIndex + 1, endIndex)
      });
      pattern.lastIndex = endIndex + 1;
    }
    match = pattern.exec(content);
  }
  return blocks;
}

function stripNestedTypeBlocks(content) {
  const nestedBlocks = extractSwiftTypeBlocks(content);
  if (nestedBlocks.length === 0) return content;
  const sorted = nestedBlocks.slice().sort((a, b) => b.openIndex - a.openIndex);
  let output = content;
  for (const block of sorted) {
    const length = block.closeIndex - block.openIndex + 1;
    output = `${output.slice(0, block.openIndex)}${' '.repeat(length)}${output.slice(block.closeIndex + 1)}`;
  }
  return output;
}

function countFunctions(content) {
  const matches = content.match(/\bfunc\s+[A-Za-z_][A-Za-z0-9_]*/g) || [];
  return matches.length;
}

function countProperties(content) {
  const matches = content.match(/(^|\n)\s*(?:@[A-Za-z0-9_.]+\s*)*(var|let)\s+[A-Za-z_][A-Za-z0-9_]*/g) || [];
  return matches.length;
}

function splitTypeName(name) {
  return String(name).match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|[0-9]+/g) || [name];
}

function getTypeGroupKey(name) {
  const parts = splitTypeName(name);
  return parts[0] || name;
}

function summarizeSwiftTypes(content) {
  const blocks = extractSwiftTypeBlocks(String(content || ''));
  return blocks.map((block) => {
    const sanitizedBody = stripNestedTypeBlocks(block.body);
    return {
      name: block.name,
      methodsCount: countFunctions(sanitizedBody),
      propertiesCount: countProperties(sanitizedBody),
      groupKey: getTypeGroupKey(block.name)
    };
  });
}

function evaluateMultipleTypeGroups(summaries) {
  const groups = new Set((summaries || []).map((item) => item.groupKey).filter(Boolean));
  const totalTypes = (summaries || []).length;
  const distinctGroups = groups.size;
  const shouldFlag = totalTypes >= 3 && distinctGroups >= 2;
  return {
    totalTypes,
    distinctGroups,
    shouldFlag,
    groups: Array.from(groups)
  };
}

function isThinWrapperSummary(summary) {
  if (!summary) return false;
  return summary.methodsCount === 0 && summary.propertiesCount <= 1;
}

module.exports = {
  summarizeSwiftTypes,
  evaluateMultipleTypeGroups,
  resolveSrpSeverity,
  isThinWrapperSummary
};
