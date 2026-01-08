const path = require('path');
const { pushFinding, SyntaxKind, platformOf, getRepoRoot } = require(path.join(__dirname, '../ast-core'));
const { BDDTDDWorkflowRules } = require(path.join(__dirname, 'BDDTDDWorkflowRules'));

function getTypeContext(node) {
  const parent = node.getParent();
  if (!parent) return 'unknown';

  const parentKind = parent.getKind();
  const grandParent = parent.getParent();

  if (parentKind === SyntaxKind.Parameter) {
    const func = parent.getFirstAncestorByKind(SyntaxKind.MethodDeclaration) ||
      parent.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
    if (func) {
      const funcText = func.getText();
      if (/interface\s+\w+/.test(funcText) || func.getParent()?.getKind() === SyntaxKind.InterfaceDeclaration) {
        return 'interface_method_param';
      }
      return 'function_param';
    }
    return 'parameter';
  }

  if (parentKind === SyntaxKind.PropertySignature || parentKind === SyntaxKind.PropertyDeclaration) {
    const iface = parent.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration);
    if (iface && iface.isExported()) {
      return 'public_interface_property';
    }
    return 'property';
  }

  if (parentKind === SyntaxKind.TypeReference && grandParent) {
    const gpKind = grandParent.getKind();
    if (gpKind === SyntaxKind.TypeReference) {
      const gpText = grandParent.getText();
      if (/Promise<|Observable</.test(gpText)) {
        return 'return_type';
      }
    }
  }

  if (parentKind === SyntaxKind.VariableDeclaration) {
    return 'variable';
  }

  return 'other';
}

function determineAnySeverity(context) {
  switch (context) {
    case 'interface_method_param':
    case 'public_interface_property':
    case 'return_type':
      return 'critical';

    case 'function_param':
    case 'parameter':
      return 'high';

    case 'property':
    case 'variable':
      return 'high';

    default:
      return 'high';
  }
}

function getAnyTypeMessage(context) {
  const contextMessages = {
    'interface_method_param': 'any type in public interface method parameter - define specific type or use generics',
    'public_interface_property': 'any type in public interface property - define specific interface type',
    'return_type': 'any type in return type - define specific return type or use union types',
    'function_param': 'any type in function parameter - define specific parameter type',
    'parameter': 'any type in parameter - replace with specific type',
    'property': 'any type in property - define specific property type',
    'variable': 'any type in variable - infer type or define explicitly',
    'other': 'any type detected - replace with specific type'
  };

  return contextMessages[context] || contextMessages['other'];
}

function checkForTypeGuard(node) {
  const parent = node.getParent();
  if (!parent) return false;

  const nextSiblings = parent.getNextSiblings();
  for (const sibling of nextSiblings.slice(0, 3)) {
    const text = sibling.getText();
    if (/typeof|instanceof|Array\.isArray|is\w+\(/.test(text)) {
      return true;
    }
  }

  return false;
}

function runCommonIntelligence(project, findings) {
  try {
    const repoRoot = getRepoRoot();
    const workflowRules = new BDDTDDWorkflowRules(findings, repoRoot);
    workflowRules.analyze();
  } catch (error) {
    if (process.stderr) {
      process.stderr.write(`[BDD/TDD Workflow] Error: ${error.message}\n`);
    }
  }

  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();
    const plat = platformOf(filePath) || 'other';

    if (/\/hooks-system\/infrastructure\/ast\//i.test(filePath)) return;
    if (/\/ast-(?:backend|frontend|android|ios|common|core|intelligence)\.js$/.test(filePath)) return;


    sf.getDescendantsOfKind(SyntaxKind.TypeReference).forEach((tref) => {
      const txt = tref.getText();
      if (txt === 'any' || /<\s*any\s*>/.test(txt)) {
        const isUtilityScript = /\/(scripts?|migrations?|seeders?|fixtures?)\//i.test(filePath);
        if (isUtilityScript) return;

        if (/node_modules|\.d\.ts$|@types/.test(filePath)) return;

        const parent = tref.getParent();
        if (parent?.getKind() === SyntaxKind.Parameter) {
          const paramName = parent.getText().split(':')[0].trim();
          if (/^(e|event|evt|args?|payload)$/i.test(paramName)) {
            return;
          }
        }

        const ancestors = tref.getAncestors();
        const inCatchClause = ancestors.some(a => a.getKind() === SyntaxKind.CatchClause);
        if (inCatchClause) {
          return;
        }

        const context = getTypeContext(tref);
        const severity = determineAnySeverity(context);
        const message = getAnyTypeMessage(context);
        pushFinding('common.types.any', severity, sf, tref, message, findings);
      }
    });

    // Skip Swift files - they should only be analyzed by iOS-specific detectors
    if (!/\.swift$/i.test(filePath)) {
      sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((clause) => {
        const block = typeof clause.getBlock === 'function' ? clause.getBlock() : null;
        const statements = block && typeof block.getStatements === 'function' ? block.getStatements() : [];

        if ((statements || []).length === 0) {
          const blockText = block ? block.getText() : '';
          const hasTestAssertions = /XCTFail|XCTAssert|guard\s+case|expect\(|assert/i.test(blockText);
          const hasErrorHandling = /throw|console\.|logger\.|log\(|print\(/i.test(blockText);

          if (!hasTestAssertions && !hasErrorHandling) {
            pushFinding(
              'common.error.empty_catch',
              'critical',
              sf,
              clause,
              'Empty catch block detected - always handle errors (log, rethrow, wrap, or return Result)',
              findings
            );
          }
        }
      });
    }

    sf.getDescendantsOfKind(SyntaxKind.AnyKeyword).forEach((node) => {

      const isUtilityScript = /\/(scripts?|migrations?|seeders?|fixtures?)\//i.test(filePath);
      if (isUtilityScript) return;

      if (/node_modules|\.d\.ts$|@types/.test(filePath)) return;

      const parent = node.getParent();
      if (parent?.getKind() === SyntaxKind.Parameter) {
        const paramText = parent.getText();
        const paramName = paramText.split(':')[0].trim();
        if (/^(e|event|evt|args?|payload)$/i.test(paramName)) return;
      }

      const ancestors = node.getAncestors();
      const inCatchClause = ancestors.some(a => a.getKind() === SyntaxKind.CatchClause);
      if (inCatchClause) return;

      const context = getTypeContext(node);
      const severity = determineAnySeverity(context);
      const message = getAnyTypeMessage(context);
      pushFinding('common.types.any', severity, sf, node, message, findings);
    });

    sf.getDescendantsOfKind(SyntaxKind.AsExpression).forEach((node) => {
      const nodeText = node.getText();
      if (nodeText.includes(' as any')) {
        const isUtilityScript = /\/(scripts?|migrations?|seeders?|fixtures?)\//i.test(filePath);
        if (isUtilityScript) return;

        if (/node_modules|\.d\.ts$|@types/.test(filePath)) return;

        if (/event|evt|handler/.test(nodeText.toLowerCase())) return;

        const ancestors = node.getAncestors();
        const inCatchClause = ancestors.some(a => a.getKind() === SyntaxKind.CatchClause);
        if (inCatchClause) return;

        const context = 'type_assertion';
        pushFinding('common.types.any', 'high', sf, node, 'Type assertion to any - replace with specific type or use type guards', findings);
      } else if (nodeText.includes(' as unknown')) {
        const isRecordUnknown = /Record<string,\s*unknown>/.test(nodeText);
        if (!isRecordUnknown) {
          const hasTypeGuard = checkForTypeGuard(node);
          if (!hasTypeGuard) {
            pushFinding('common.types.unknown_without_guard', 'medium', sf, node, 'Type assertion to unknown without type guard - add proper type narrowing', findings);
          }
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.TypeReference).forEach((tref) => {
      const text = tref.getText();
      const hasRecordUnknown = /Record<string,\s*unknown>/.test(text);

      if (hasRecordUnknown) {
        const parent = tref.getParent();
        if (!parent) return;

        const interfaceDecl = parent.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration);
        const typeAliasDecl = parent.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration);

        const isPartOfUnionType = typeAliasDecl && /\|/.test(typeAliasDecl.getType().getText());

        const isDefinedType = typeAliasDecl !== undefined;

        if (!isDefinedType || !isPartOfUnionType) {
          pushFinding('common.types.record_unknown_requires_type', 'high', sf, tref, 'Record<string, unknown> detected - define value type union (string | number | boolean | null | Date)', findings);
        }
      }

      const hasUndefinedInBaseType = /:\s*(?:string|number|boolean|object)\s*\|\s*undefined|:\s*undefined\s*\|/i.test(text);
      const hasUndefinedInIndexSignature = /\[key:\s*string\]:\s*[^}]*\|\s*undefined|\[key:\s*string\]:\s*undefined/i.test(text);
      const hasUndefinedInRecord = /Record<[^>]*\|\s*undefined|Record<[^>]*undefined\s*\|/i.test(text);
      const hasUndefinedInArray = /Array<[^>]*\|\s*undefined|Array<[^>]*undefined\s*\|/i.test(text);

      const fullText = sf.getFullText();
      const nodeStart = tref.getStart();
      const lineStart = fullText.lastIndexOf('\n', nodeStart) + 1;
      const lineEnd = fullText.indexOf('\n', nodeStart);
      const fullLine = lineEnd === -1 ? fullText.substring(lineStart) : fullText.substring(lineStart, lineEnd);
      const hasUndefinedInLine = /\|\s*undefined|undefined\s*\|/.test(fullLine) && !/typeof\s+\w+\s*===\s*['"]undefined['"]/.test(fullLine);

      if (hasUndefinedInBaseType || hasUndefinedInIndexSignature || hasUndefinedInRecord || hasUndefinedInArray || hasUndefinedInLine) {
        const parent = tref.getParent();
        if (!parent) return;

        const isOptionalProperty = parent.getKind() === SyntaxKind.PropertySignature && parent.getQuestionTokenNode() !== undefined;
        if (isOptionalProperty) return;

        const interfaceDecl = parent.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration);
        const typeAliasDecl = parent.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration);
        const isInInterfaceOrType = interfaceDecl !== undefined || typeAliasDecl !== undefined;

        if (isInInterfaceOrType) {
          pushFinding('common.types.undefined_in_base_type', 'critical', sf, tref, 'undefined in base type - normalize at boundary with mapper/type guard, base type must be non-nullable', findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression();
      if (!expr) return;
      const exprText = expr.getText();
      if (/console\.\w+\(/.test(exprText)) {
        pushFinding('common.debug.console', 'medium', sf, call, 'Console usage detected - use Logger instead', findings);
      }
    });

    const full = sf.getFullText();
    const isSpecFile = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filePath);
    const isSwiftFile = /\.swift$/i.test(filePath);

    // Skip secret detection for Swift struct/class properties - they're not hardcoded secrets
    if (isSwiftFile) return;

    const secretPattern = /(PASSWORD|TOKEN|SECRET|API_KEY)\s*[:=]\s*['"]([^'"]{8,})['"]/gi;
    const matches = Array.from(full.matchAll(secretPattern));

    for (const match of matches) {
      const fullMatch = match[0];
      const credentialValue = match[2];

      const matchIndex = match.index || 0;
      const lineStart = full.lastIndexOf('\n', matchIndex) + 1;
      const lineEnd = full.indexOf('\n', matchIndex);
      const fullLine = full.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

      const isEnvVar = /process\.env\.|env\.|config\.|from.*env/i.test(fullMatch);

      const isPlaceholderPattern = /^(placeholder|example|test-|mock-|fake-|dummy-|your-|xxx|abc|000|123|bearer\s)/i.test(credentialValue);
      const hasObviousTestWords = /(valid|invalid|wrong|expired|reset|sample|demo|user-\d|customer-\d|store-\d)/i.test(credentialValue);
      const isShortRepeating = credentialValue.length <= 20 && /^(.)\1+$/.test(credentialValue);
      const isPlaceholder = isPlaceholderPattern || hasObviousTestWords || isShortRepeating;

      const isTestContext = isSpecFile && /mock|jest\.fn|describe|it\(|beforeEach|afterEach/.test(full);
      const isTestFile = isSpecFile || /\/(tests?|__tests__|e2e|spec|playwright)\//i.test(filePath);
      const hasStorageContext = (
        /localStorage|sessionStorage|AsyncStorage|getItem|setItem|removeItem/i.test(fullLine) ||
        /const\s+\w*(KEY|STORAGE|CACHE|Token|Key|Storage)\s*=/i.test(fullLine)
      );
      const hasKeyNamingPattern = /_(?:key|token|storage|cache|slots)$/i.test(credentialValue);
      const hasDescriptivePrefix = /^(?:admin|user|auth|session|cache|storage|local|temp)_/i.test(credentialValue);
      const isStorageKey = (hasStorageContext || hasKeyNamingPattern || hasDescriptivePrefix) &&
        !/^eyJ/.test(credentialValue) && credentialValue.length < 50;

      const isCacheKey = credentialValue.includes(':') || /^(?:products|orders|users|stores|cache|metrics|session):/i.test(credentialValue);

      const isConstantKey = /(?:const|let|var)\s+\w*(?:KEY|TOKEN|STORAGE)\s*=/i.test(fullLine) &&
        credentialValue.length < 30 &&
        !/^(?:eyJ|sk_|pk_|live_|prod_|[a-f0-9]{32,})/.test(credentialValue);
      const isRolesDecorator = /ROLES_KEY\s*=\s*['"`]roles['"`]/.test(fullLine);

      const prodFormatRegex = /^(eyJ|sk_|pk_|live_|prod_|[a-f0-9]{32,}|\$2[aby]\$)/;
      const looksLikeProdValue = prodFormatRegex.test(credentialValue);
      const isTestData = isTestFile && credentialValue.length < 50 && !looksLikeProdValue;

      if (!isEnvVar && !isPlaceholder && !isTestContext && !isStorageKey && !isCacheKey && !isConstantKey && !isRolesDecorator && !isTestData && credentialValue.length >= 8) {
        pushFinding('common.security.secret', 'critical', sf, sf, 'Hardcoded secret detected - replace with environment variable', findings);
      }
    }
    const lintDisablePattern = new RegExp(['eslint', 'disable'].join('-') + '|' + ['ts', 'ignore'].join('-'));
    if (lintDisablePattern.test(full)) {
      pushFinding('common.quality.disabled_lint', 'low', sf, sf, 'Disabled lint directive present', findings);
    }
    const taskMarkerPattern = new RegExp('(^|\\s)(' + ['TO', 'DO'].join('') + '|' + ['FIX', 'ME'].join('') + ')(:| \\s)');
    if (taskMarkerPattern.test(full)) {
      pushFinding('common.quality.todo_fixme', 'medium', sf, sf, 'Task marker present in code', findings);
    }
    if (/\/\/|\/\*/.test(full)) {
      if (/^#![^\n]*$/m.test(full)) return;
      const withoutShebang = full.replace(/^#![^\n]*$/gm, '');
      if (!/\/\/|\/\*/.test(withoutShebang)) return;

      let withoutStrings = withoutShebang;
      withoutStrings = withoutStrings.replace(/`[^`]*`/g, '');
      withoutStrings = withoutStrings.replace(/"[^"]*"/g, '');
      withoutStrings = withoutStrings.replace(/'[^']*'/g, '');

      if (!/\/\/|\/\*/.test(withoutStrings)) return;

      const withoutUrls = withoutStrings.replace(/https?:\/\//g, '');
      if (!/\/\/|\/\*/.test(withoutUrls)) return;

      const withoutJSDoc = withoutUrls.replace(/\/\*\*[\s\S]*?\*\//g, '');
      const hasOnlyJSDoc = !/\/\/|\/\*/.test(withoutJSDoc);
      if (hasOnlyJSDoc) return;

      const withoutAllComments = withoutJSDoc.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      if (!/\/\/|\/\*/.test(withoutAllComments)) return;

      const lines = full.split('\n');
      const firstNonEmptyLine = lines.findIndex(l => l.trim().length > 0);
      if (firstNonEmptyLine >= 0 && firstNonEmptyLine < 5 && /copyright|license|author/i.test(lines[firstNonEmptyLine])) {
        return;
      }

      pushFinding('common.quality.comments', 'high', sf, sf, 'Comments present in code - prefer self-documenting code with clear naming', findings);
    }
  });
}

module.exports = { runCommonIntelligence };
