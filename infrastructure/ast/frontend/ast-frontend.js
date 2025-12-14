
const path = require('path');
const { pushFinding, mapToLevel, SyntaxKind, isTestFile, platformOf, getRepoRoot } = require(path.join(__dirname, '../ast-core'));
const fs = require('fs');
const { FrontendArchitectureDetector } = require(path.join(__dirname, 'analyzers/FrontendArchitectureDetector'));

/**
 * Run Frontend-specific AST intelligence analysis
 * @param {Project} project - TypeScript morph project
 * @param {Array} findings - Findings array to populate
 * @param {string} platform - Platform identifier
 */
function runFrontendIntelligence(project, findings, platform) {
  try {
    const root = getRepoRoot();
    const architectureDetector = new FrontendArchitectureDetector(root);
    const detectedPattern = architectureDetector.detect();
    const detectionSummary = architectureDetector.getDetectionSummary();

    console.log(`[Frontend Architecture] Pattern detected: ${detectedPattern} (confidence: ${detectionSummary.confidence}%)`);

    if (detectionSummary.warnings.length > 0) {
      detectionSummary.warnings.forEach(warning => {
        pushFinding('frontend.architecture.detection_warning', warning.severity.toLowerCase(), null, null, warning.message + '\n\n' + warning.recommendation, findings);
      });
    }
  } catch (error) {
    console.error('[Frontend Architecture] Error during architecture detection:', error.message);
  }

  project.getSourceFiles().forEach((sf) => {
    if (!sf || typeof sf.getFilePath !== 'function') return;
    const filePath = sf.getFilePath();
    const isInfrastructure = /\/infrastructure\/|\/lib\/api\/|\/services\//.test(filePath);
    const isComponent = /\/(components|app|presentation)\//.test(filePath) && !isInfrastructure;

    if (platformOf(filePath) !== "frontend") return;

    if (/\/ast-[^/]+\.js$/.test(filePath)) return;
    if (/\/app\/middleware\.ts$|\/middleware\.ts$|\/app\/headers\.ts$/.test(filePath)) {
      if (!/Content\-Security\-Policy/i.test(sf.getFullText())) {
        pushFinding("frontend.security.missing_csp", "high", sf, sf, "CSP header not set in middleware/headers", findings);
      }
    }

    const hookCalls = sf.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
      const expr = call.getExpression().getText();
      return /^(use[A-Z]|useState|useEffect|useCallback|useMemo|useContext|useReducer|useRef)\b/.test(expr);
    });

    hookCalls.forEach((hookCall) => {
      let parent = hookCall.getParent();
      let depth = 0;
      const maxDepth = 10; // Limit traversal to avoid false positives in deeply nested code

      while (parent && depth < maxDepth) {
        const kind = parent.getKind();

        if (kind === SyntaxKind.FunctionDeclaration ||
          kind === SyntaxKind.FunctionExpression ||
          kind === SyntaxKind.ArrowFunction) {
          break;
        }

        if (kind === SyntaxKind.IfStatement || kind === SyntaxKind.ConditionalExpression) {
          pushFinding("frontend.hooks.conditional", "error", sf, hookCall, "Hook called conditionally", findings);
          break;
        }

        parent = parent.getParent();
        depth++;
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((fn) => {
      const name = fn.getName();
      if (name && /^[A-Z]/.test(name)) {
        const params = fn.getParameters();
        if (params.length > 0 && params[0].getTypeNode() === undefined) {
          pushFinding("frontend.props.missing_types", "warning", sf, fn, `Component ${name} missing prop types`, findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (/useQuery|useMutation/.test(expr)) {
        const parent = call.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
        if (parent) {
          const text = parent.getText();
          if (!/error|Error/.test(text)) {
            pushFinding("frontend.react_query.missing_error", "warning", sf, call, "React Query hook without error handling", findings);
          }
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((fn) => {
      const name = fn.getName();
      if (name && /^[A-Z]/.test(name)) {
        const params = fn.getParameters();
        if (params.length > 0) {
          const firstParam = params[0];
          const typeNode = firstParam.getTypeNode();
          if (typeNode) {
            const typeText = typeNode.getText();
            const propMatches = typeText.match(/[:;]/g);
            if (propMatches && propMatches.length > 7) {
              pushFinding("frontend.component.too_many_props", "warning", sf, fn, `Component ${name} has ${propMatches.length} props`, findings);
            }
          }
        }
      }
    });

    const isDomUtilityFile = /\/(scripts|utils|helpers|lib|core)\//i.test(filePath);
    const isCustomHook = /\/hooks\//i.test(filePath) || /^use[A-Z]/.test(filePath.split('/').pop() || '');
    const isChartMapComponent = /\/(charts|maps|visualization)\//i.test(filePath) || /(Map|Chart|Graph|Plot)\.tsx?$/.test(filePath);
    const isDomTestFile = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filePath) || /\/(tests?|__tests__)\//i.test(filePath);
    const isDomConfigFile = /(config|setup|polyfill|main\.tsx?)$/i.test(filePath) || /\/config\//i.test(filePath);
    const isE2ETest = /\/(e2e|playwright|cypress)\//i.test(filePath);
    const isThirdPartyIntegration = /(google|leaflet|mapbox|d3|chart)/i.test(sf.getFullText().substring(0, 500));
    const isLegitimateContext = isDomUtilityFile || isCustomHook || isChartMapComponent || isDomTestFile || isDomConfigFile || isE2ETest || isThirdPartyIntegration;

    if (!isLegitimateContext) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (/^(document\.|window\.(scroll|location|URL)|getElementById|getElementsBy|querySelector)/.test(expr)) {
          const fullCallText = call.getText();
          const functionName = call.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration)?.getName() || '';
          const isUtilityFunction = /^(setup|init|configure|attach|mount|render)/i.test(functionName);

          const isReactEntry = /createRoot\s*\(\s*document\.getElementById/.test(fullCallText); // React 18 entry
          const isLangAttribute = /document\.documentElement\.(setAttribute|lang)/.test(fullCallText); // i18n
          const isHeadManipulation = /document\.(head|body)\.append/.test(fullCallText); // Script injection (Maps, etc)
          const isMetaTag = /document\.querySelector\(['"]meta\[name=/.test(fullCallText); // Meta tags (SEO, theme)
          const isFileDownload = /document\.createElement\(['"]a['"]\)/.test(fullCallText) && /\.download\s*=/.test(sf.getFullText().substring(call.getStart() - 100, call.getEnd() + 100)); // File export
          const isBlobURL = /URL\.createObjectURL|URL\.revokeObjectURL/.test(fullCallText); // Blob downloads
          const isWindowReload = /window\.location\.reload/.test(fullCallText); // Page reload (legitimate retry)
          const isScrollRestoration = /scrollY|scrollTop|scrollPosition|scrollTo/.test(sf.getFullText().substring(call.getStart() - 200, call.getEnd() + 50)) && /sessionStorage|localStorage/.test(sf.getFullText().substring(call.getStart() - 200, call.getEnd() + 50)); // Scroll save/restore
          const isModalPattern = /Modal|Dialog|Drawer/.test(filePath) && (/body\.style\.overflow|addEventListener\(['"]keydown/.test(sf.getFullText().substring(call.getStart() - 100, call.getEnd() + 100))); // Modal escape key + body scroll lock

          if (!isUtilityFunction && !isReactEntry && !isLangAttribute && !isHeadManipulation && !isMetaTag && !isFileDownload && !isBlobURL && !isWindowReload && !isScrollRestoration && !isModalPattern) {
            pushFinding("frontend.dom.direct", "error", sf, call, "Direct DOM manipulation detected", findings);
          }
        }
      });
    }

    sf.getDescendantsOfKind(SyntaxKind.JsxElement).forEach((jsx) => {
      const tag = jsx.getOpeningElement()?.getTagNameNode()?.getText();
      if (tag && /^[A-Z]/.test(tag)) {
        const parent = jsx.getParent();
        if (parent && parent.getKind && parent.getKind() === SyntaxKind.ArrayLiteralExpression) {
          const attrs = jsx.getOpeningElement()?.getAttributes();
          const hasKey = attrs?.some((a) => {
            const name = a.getNameNode?.();
            return name && name.getText() === "key";
          });
          if (!hasKey) {
            pushFinding("frontend.list.missing_key", "error", sf, jsx, "Missing key prop in list item", findings);
          }
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((fn) => {
      const name = fn.getName();
      if (!name || !/^[A-Z]/.test(name)) return;
      const params = fn.getParameters();
      if (params.length === 0) return;
      const p = params[0];
      const typeNode = p.getTypeNode();
      const paramName = p.getName();
      const body = fn.getBody();
      if (!body) return;
      const propNames = new Set();
      if (typeNode && typeNode.getKind && typeNode.getKind() !== undefined) {
        const typeText = typeNode.getText();
        (typeText.match(/\b(\w+)\s*:/g) || []).forEach((m) => {
          const k = m.replace(/[:\s]/g, "");
          if (k) propNames.add(k);
        });
      }
      let forwards = 0;
      body.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
        const n = attr.getNameNode();
        const init = attr.getInitializer();
        if (!n || !init) return;
        const attrName = n.getText();
        const initText = init.getText().replace(/[{}\s]/g, "");
        if (propNames.has(attrName) && initText === attrName) {
          forwards += 1;
        }
        if (attr.getKind && attr.getKind() === SyntaxKind.JsxSpreadAttribute) {
          const t = attr.getText();
          if (t.includes(paramName)) forwards += 1;
        }
      });
      if (forwards >= 6) {
        pushFinding("frontend.props.prop_drilling", "warning", sf, fn, `Possible prop drilling detected in ${name} (forwards=${forwards})`, findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((fn) => {
      const name = fn.getName();
      if (!name || !/^[A-Z]/.test(name)) return;
      const body = fn.getBody();
      if (!body) return;
      const t = body.getText();
      const branches = (t.match(/\b(if|for|while|case |catch|\?:|&&|\|\|)\b/g) || []).length;
      const complexity = 1 + branches;
      if (complexity > 20) {
        pushFinding("frontend.component.cyclomatic_complexity", "warning", sf, fn, `High cyclomatic complexity in ${name} (=${complexity})`, findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.ClassDeclaration).forEach((cls) => {
      const name = cls.getName();
      if (name && /^[A-Z]/.test(name)) {
        const heritage = cls.getHeritageClauses();
        const isReactComponent = heritage.some((h) =>
          h.getText().includes("extends") &&
          h.getTypeNodes().some((t) => /Component|PureComponent/.test(t.getText()))
        );
        const hasRender = cls.getMembers().some((m) =>
          m.getKind() === SyntaxKind.MethodDeclaration &&
          m.getName() === "render"
        );
        if (isReactComponent || hasRender) {
          pushFinding("frontend.react.class_components", "error", sf, cls, `Class component ${name} detected (use functional components only)`, findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxElement).forEach((jsx) => {
      const tag = jsx.getOpeningElement()?.getTagNameNode()?.getText();
      if (tag && /^[A-Z]/.test(tag)) {
        const parent = jsx.getParent();
        if (parent && parent.getKind && parent.getKind() === SyntaxKind.ArrayLiteralExpression) {
          const attrs = jsx.getOpeningElement()?.getAttributes();
          const keyAttr = attrs?.find((a) => a.getNameNode && a.getNameNode()?.getText() === "key");
          if (keyAttr) {
            const init = keyAttr.getInitializer();
            const keyText = init?.getText();
            if (keyText && /\bindex\b|\bi\b/.test(keyText)) {
              pushFinding("frontend.react.index_as_key", "warning", sf, jsx, "Using index as key in list (use stable unique identifier)", findings);
            }
          }
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((fn) => {
      const name = fn.getName();
      if (!name || !/^[A-Z]/.test(name)) return;
      const start = fn.getStart();
      const end = fn.getEnd();
      const lineCount = sf.getLineAndColumnAtPos(end).line - sf.getLineAndColumnAtPos(start).line + 1;
      const body = fn.getBody();
      if (!body) return;
      const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement);
      const jsxSelfClosing = body.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
      const totalJsx = jsxElements.length + jsxSelfClosing.length;
      if (lineCount > 50 && totalJsx > 10) {
        pushFinding("frontend.react.missing_composition", "high", sf, fn, `Large component ${name} (${lineCount} lines, ${totalJsx} JSX elements) violates SRP (Single Responsibility Principle)`, findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).forEach((el) => {
      const tag = el.getTagNameNode()?.getText();
      if (tag === "img") {
        const attrs = el.getAttributes();
        const hasAlt = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "alt");
        if (!hasAlt) {
          pushFinding("frontend.a11y.img_missing_alt", "error", sf, el, "<img> without alt attribute", findings);
        }
        const hasLazy = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "loading" && /lazy/.test(a.getInitializer()?.getText() || ""));
        if (!hasLazy) {
          pushFinding("frontend.performance.img_missing_lazy", "warning", sf, el, "<img> without loading=\"lazy\"", findings);
        }
        pushFinding("frontend.next.image_not_used", "warning", sf, el, "<img> tag used - prefer next/image", findings);
      }
    });
    sf.getDescendantsOfKind(SyntaxKind.JsxElement).forEach((el) => {
      const tag = el.getOpeningElement()?.getTagNameNode()?.getText();
      if (tag === "img") {
        const attrs = el.getOpeningElement()?.getAttributes() || [];
        const hasAlt = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "alt");
        if (!hasAlt) {
          pushFinding("frontend.a11y.img_missing_alt", "error", sf, el, "<img> without alt attribute", findings);
        }
      }
    });

    const fileContent = sf.getFullText();
    const isChartFile = /(recharts|chart\.js|d3|victory|nivo|visx)/i.test(fileContent.substring(0, 500));

    sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).forEach((open) => {
      const tag = open.getTagNameNode()?.getText();
      const attrs = open.getAttributes();
      const hasOnClick = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "onClick");

      const isSemanticNative = tag === "button" || tag === "a" || tag === "input" || tag === "select" || tag === "textarea";
      const isSemanticComponent = /^(Button|Link|IconButton|MenuItem|Tab|Chip|Card|Badge)$/i.test(tag || '');
      const isThirdPartyLibComponent = /^(Recharts|Chart|Leaflet|Map|Dialog|Popover|Dropdown|Select|Combobox)/i.test(tag || '');
      const isChartComponent = isChartFile && /^(Pie|Bar|Line|Area|Scatter|Radar|Legend|Tooltip|Cell)$/i.test(tag || '');

      if (hasOnClick && !isSemanticNative && !isSemanticComponent && !isThirdPartyLibComponent && !isChartComponent) {
        const hasRole = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "role");
        const hasAria = attrs.some((a) => a.getNameNode && /^aria-/.test(a.getNameNode()?.getText() || ""));
        const hasLabel = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "aria-label");
        if (!hasRole && !(hasAria || hasLabel)) {
          pushFinding("frontend.a11y.interactive_missing_aria", "error", sf, open, "Interactive element without role/aria-label", findings);
        }
      }
    });
    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const name = attr.getNameNode()?.getText();
      if (name !== "tabIndex") return;
      const val = attr.getInitializer()?.getText() || "";
      if (/\b[1-9][0-9]*\b/.test(val)) {
        pushFinding("frontend.a11y.tabindex_positive", "warning", sf, attr, "Positive tabIndex detected", findings);
      }
    });

    const imports = sf.getImportDeclarations();
    const hasNextImage = imports.some((imp) => imp.getModuleSpecifierValue() === "next/image");
    const usesLink = imports.some((imp) => imp.getModuleSpecifierValue() === "next/link");

    sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).forEach((el) => {
      const tag = el.getTagNameNode()?.getText();
      if (tag === "Image" && hasNextImage) {
        const attrs = el.getAttributes();
        const hasAlt = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "alt");
        const hasFill = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "fill");
        const hasWidth = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "width");
        const hasHeight = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "height");
        if (!hasAlt) {
          pushFinding("frontend.next.image_missing_alt", "error", sf, el, "next/image without alt", findings);
        }
        if (!(hasFill || (hasWidth && hasHeight))) {
          pushFinding("frontend.next.image_missing_size", "warning", sf, el, "next/image without width/height or fill", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).forEach((open) => {
      const tag = open.getTagNameNode()?.getText();
      if (tag === "a") {
        const attrs = open.getAttributes();
        const hrefAttr = attrs.find((a) => a.getNameNode && a.getNameNode()?.getText() === "href");
        const hrefText = hrefAttr?.getInitializer()?.getText()?.replace(/['"`]/g, "");
        if (hrefText && hrefText.startsWith("/") && !usesLink) {
          pushFinding("frontend.next.link_mandatory", "warning", sf, open, "Internal link should use next/link", findings);
        }
        if (hrefText && /^(http:|https:)/.test(hrefText) && usesLink) {
          pushFinding("frontend.next.link_external_wrong", "warning", sf, open, "External URL should not use next/link", findings);
        }
        if (!hrefAttr) {
          pushFinding("frontend.a11y.anchor_missing_href", "warning", sf, open, "Anchor without href attribute", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const name = attr.getNameNode()?.getText();
      if (name === "dangerouslySetInnerHTML") {
        const jsxAttributes = attr.getParent();
        const jsxOpening = jsxAttributes?.getParent();
        const tagName = jsxOpening?.getTagNameNode()?.getText() || '';
        const isStyleTag = tagName === 'style';
        const isCSSGeneration = isStyleTag || /__html.*THEMES|__html.*colorConfig|css`|styled\./i.test(sf.getFullText().substring(attr.getStart() - 100, attr.getEnd() + 200));

        const sanitized = imports.some((imp) => /dompurify|sanitize-html/.test(imp.getModuleSpecifierValue())) || sf.getFullText().includes("sanitize(");
        if (!sanitized && !isCSSGeneration) {
          pushFinding("frontend.security.dangerous_html_unsanitized", "critical", sf, attr, "dangerouslySetInnerHTML without sanitizer", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr === "eval" || expr === "Function") {
        pushFinding("frontend.security.eval", "critical", sf, call, "eval/new Function usage detected", findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const name = attr.getNameNode()?.getText();
      if (name === "key") {
        const initText = attr.getInitializer()?.getText() || "";
        if (/Math\.random\(\)|Date\.now\(\)/.test(initText)) {
          pushFinding("frontend.react.random_key", "warning", sf, attr, "Random key used in list", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((mapCall) => {
      const e = mapCall.getExpression().getText();
      if (/\.map$/.test(e) || /\.map\(/.test(e)) {
        const arrow = mapCall.getArguments()[0];
        if (!arrow || !arrow.getBody) return;
        const body = arrow.getBody();
        const jsx = body && (body.getKind && (body.getKind() === SyntaxKind.JsxElement || body.getKind() === SyntaxKind.JsxSelfClosingElement)) ? body : null;
        if (jsx) {
          const open = jsx.getKind() === SyntaxKind.JsxElement ? jsx.getOpeningElement() : jsx;
          const attrs = open.getAttributes ? open.getAttributes() : [];
          const hasKey = attrs && attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "key");
          if (!hasKey) {
            pushFinding("frontend.list.map_missing_key", "error", sf, jsx, "JSX returned from map without key", findings);
          }
        }
      }
    });

    if (filePath.includes("/pages/")) {
      pushFinding("frontend.nextjs.pages_directory", "warning", sf, sf, "Using legacy pages/ directory (use app/ directory for Next.js 13+)", findings);
    }

    const hasUseClient = sf.getFullText().includes('"use client"') || sf.getFullText().includes("'use client'");
    if (hasUseClient) {
      const hasInteractiveCode = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
        const expr = call.getExpression().getText();
        return /^(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\b/.test(expr);
      });
      const hasEventHandlers = sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).some((attr) => {
        const name = attr.getNameNode()?.getText();
        return name && /^on[A-Z]/.test(name);
      });
      const hasFormElements = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).some((el) => {
        const tag = el.getTagNameNode()?.getText();
        return tag && /^(input|textarea|select|form|button)$/.test(tag);
      });
      if (!hasInteractiveCode && !hasEventHandlers && !hasFormElements) {
        pushFinding("frontend.nextjs.unnecessary_client", "warning", sf, sf, '"use client" directive may be unnecessary (component could be Server Component)', findings);
      }
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((c) => {
        const expr = c.getExpression().getText();
        if (expr !== "fetch") return;
        const args = c.getArguments();
        const opt = args[1] ? args[1].getText() : "";
        const ok = /cache\s*:\s*"no-store"|next\s*:\s*\{[^}]*revalidate/.test(opt);
        if (!ok) {
          pushFinding("frontend.next.client_fetch_without_cache", "warning", sf, c, "Client fetch without cache/no-store or next.revalidate", findings);
        }
      });
      if (sf.getFullText().includes("window.location") || sf.getFullText().includes("location.href")) {
        pushFinding("frontend.next.navigation_missing_useRouter", "info", sf, sf, "Navigation via window.location in client component (prefer next/navigation)", findings);
      }
    }

    const isNextTestFile = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filePath);
    const isServerComponent = !sf.getFullText().includes('"use client"') && !sf.getFullText().includes("'use client'");

    if (isServerComponent && (filePath.includes("/app/") || filePath.includes("/app\\")) && !isNextTestFile) {
      const hasDomAccess = sf.getDescendantsOfKind(SyntaxKind.Identifier).some((id) => {
        const t = id.getText();
        return t === "window" || t === "document" || t === "localStorage";
      });
      if (hasDomAccess) {
        pushFinding("frontend.next.server_component_dom_access", "error", sf, sf, "Server Component accessing window/document/localStorage", findings);
      }
    }

    const usesNextHead = sf.getImportDeclarations().some((imp) => imp.getModuleSpecifierValue() === "next/head");
    if (usesNextHead && (filePath.includes("/app/") || filePath.includes("/app\\"))) {
      pushFinding("frontend.next.head_legacy", "warning", sf, sf, "next/head used in App Router - prefer Metadata API", findings);
    }

    if (/page\.(t|j)sx?$/.test(filePath) && (filePath.includes("/app/") || filePath.includes("/app\\"))) {
      const hasMetadata = /export\s+const\s+metadata\s*=/.test(sf.getFullText());
      if (!hasMetadata) {
        pushFinding("frontend.next.missing_metadata", "warning", sf, sf, "page.tsx without exported metadata", findings);
      }
    }

    const heavyLibs = ["lodash", "moment", "chart.js", "highcharts", "firebase", "@mui/material"];
    const heavyImported = sf.getImportDeclarations().filter((imp) => heavyLibs.some((l) => imp.getModuleSpecifierValue() === l));
    if (heavyImported.length > 0) {
      const hasDynamic = sf.getFullText().includes("next/dynamic") || sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((c) => c.getExpression().getText() === "import");
      if (!hasDynamic) {
        pushFinding("frontend.performance.heavy_no_dynamic", "warning", sf, sf, "Heavy library imported without code splitting", findings);
      }
    }

    sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).forEach((open) => {
      const tag = open.getTagNameNode()?.getText();
      if (tag !== "div" && tag !== "span") return;
      const attrs = open.getAttributes();
      const hasOnClick = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "onClick");
      if (!hasOnClick) return;
      const hasRole = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "role");
      const hasTabIndex = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "tabIndex");
      if (!hasRole || !hasTabIndex) {
        pushFinding("frontend.a11y.clickable_without_role", "error", sf, open, "Clickable non-interactive element without role and tabIndex", findings);
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr === "useEffect") {
        const args = call.getArguments();
        if (args.length < 2 || args[1].getKind && args[1].getKind() !== SyntaxKind.ArrayLiteralExpression) {
          pushFinding("frontend.react.useeffect_missing_deps", "warning", sf, call, "useEffect without dependency array", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const name = attr.getNameNode()?.getText();
      if (!name || !/^on[A-Z]/.test(name)) return;
      const init = attr.getInitializer();
      const txt = init ? init.getText() : "";
      if (/=>|function\s*\(/.test(txt)) {
        pushFinding("frontend.react.inline_handler", "info", sf, attr, "Inline function in JSX handler - consider useCallback", findings);
      }
    });

    const usesI18n = sf.getImportDeclarations().some((imp) => /i18n|react-i18next|next-i18next/.test(imp.getModuleSpecifierValue())) || sf.getFullText().includes("useTranslation");
    if (!usesI18n) {
      const jsxTexts = sf.getDescendantsOfKind(SyntaxKind.JsxText).filter((t) => {
        const v = t.getText().trim();
        return v.length > 3 && /[a-zA-Z]/.test(v) && !/^\{|\}/.test(v);
      });
      if (jsxTexts.length > 0) {
        pushFinding("frontend.i18n.hardcoded_jsx_text", "warning", sf, sf, `Hardcoded JSX text detected (${jsxTexts.length})`, findings);
      }
    }

    const usesLegacyRouter = sf.getImportDeclarations().some((imp) => imp.getModuleSpecifierValue() === "next/router");
    if (usesLegacyRouter) {
      pushFinding("frontend.next.router_legacy", "warning", sf, sf, "Using next/router legacy API - prefer next/navigation", findings);
    }

    sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).forEach((open) => {
      const tag = open.getTagNameNode()?.getText();
      if (tag !== "a") return;
      const attrs = open.getAttributes();
      const hasBlank = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "target" && /_blank/.test(a.getInitializer()?.getText() || ""));
      if (!hasBlank) return;
      const hasRel = attrs.some((a) => a.getNameNode && a.getNameNode()?.getText() === "rel" && /(noopener|noreferrer)/.test(a.getInitializer()?.getText() || ""));
      if (!hasRel) {
        pushFinding("frontend.security.target_blank", "high", sf, open, "target=_blank without rel=\"noopener noreferrer\"", findings);
      }
    });

    const usesLazy = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => call.getExpression().getText() === "lazy" || call.getExpression().getText() === "React.lazy");
    if (usesLazy) {
      const hasSuspense = sf.getFullText().includes("<Suspense") || sf.getFullText().includes("React.Suspense");
      if (!hasSuspense) {
        pushFinding("frontend.performance.lazy_without_suspense", "warning", sf, sf, "React.lazy used without Suspense boundary", findings);
      }
    }

    const isInnerHTMLTestFile = /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(filePath) || /\/(tests?|__tests__|helpers)\/.*dom\./i.test(filePath);
    const isPluginLoader = /(leaflet|mapbox|google.*maps|chart.*plugin)/i.test(sf.getFullText().substring(0, 500));

    if (!isInnerHTMLTestFile && !isPluginLoader) {
      sf.getDescendantsOfKind(SyntaxKind.BinaryExpression).forEach((bin) => {
        const left = bin.getLeft().getText();
        if (/\.innerHTML\b/.test(left)) {
          pushFinding("frontend.security.innerhtml_assignment", "error", sf, bin, "Assignment to innerHTML detected", findings);
        }
      });
    }
    sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((fn) => {
      const name = fn.getName();
      if (!name || !/^[A-Z]/.test(name)) return;
      const props = fn.getParameters();
      if (props.length === 0) return;
      const hasProps = props[0].getTypeNode();
      if (!hasProps) return;

      const isMemoized = sf.getImportDeclarations().some((imp) =>
        imp.getModuleSpecifierValue() === "react" &&
        imp.getNamedImports().some((n) => n.getName() === "memo")
      );
      const isWrappedInMemo = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
        const expr = call.getExpression().getText();
        return expr === "memo" || expr === "React.memo";
      });

      if (!isMemoized && !isWrappedInMemo) {
        pushFinding("frontend.react.missing_memo", "info", sf, fn, `Component ${name} with props should consider React.memo for performance`, findings);
      }
    });

    const useCallbackCalls = sf.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
      const expr = call.getExpression().getText();
      return expr === "useCallback";
    });

    sf.getDescendantsOfKind(SyntaxKind.ArrowFunction).forEach((arrow) => {
      const parent = arrow.getParent();
      if (parent && parent.getKind && parent.getKind() === SyntaxKind.VariableDeclaration) {
        const varDecl = parent;
        const name = varDecl.getName();
        if (name && /^on[A-Z]/.test(name)) { // Probablemente un event handler
          const isCallback = useCallbackCalls.some((callback) =>
            callback.getAncestors().some((anc) => anc === varDecl)
          );
          if (!isCallback) {
            pushFinding("frontend.react.missing_usecallback", "info", sf, varDecl, `Event handler ${name} should use useCallback to prevent re-renders`, findings);
          }
        }
      }
    });

    if (isComponent) {
      sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
        const expr = call.getExpression().getText();
        if (/\.(filter|map|reduce|sort|find|some|every|includes)\(/.test(expr)) {
          const parent = call.getParent();
          if (parent && parent.getKind && parent.getKind() === SyntaxKind.VariableDeclaration) {
            const varDecl = parent;
            const isMemoized = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((memoCall) => {
              const memoExpr = memoCall.getExpression().getText();
              return memoExpr === "useMemo" && memoCall.getAncestors().some((anc) => anc === varDecl);
            });
            if (!isMemoized) {
              pushFinding("frontend.react.missing_usememo", "info", sf, call, `Expensive computation should use useMemo`, findings);
            }
          }
        }
      });
    }

    // i18n: strings hardcodeados sin useTranslation
    const hasUseTranslation = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
      const expr = call.getExpression().getText();
      return /^useTranslation|translate\(|t\(/.test(expr);
    });
    if (hasUseTranslation) {
      const stringLiterals = sf.getDescendantsOfKind(SyntaxKind.StringLiteral).filter((str) => {
        const text = str.getLiteralValue();
        const parent = str.getParent();
        const isInTypeDefinition = parent && parent.getKind && (
          parent.getKind() === SyntaxKind.UnionType ||
          parent.getKind() === SyntaxKind.TypeLiteral
        );

        const isCssClass = /^(bg-|text-|border-|shadow-|rounded|flex|grid|hover:|focus:|dark:|animate-|transition|space-|gap-|p-|m-|w-|h-|opacity-|cursor-|overflow-|absolute|relative|fixed|sticky|top-|left-|right-|bottom-|z-|from-|to-|via-)/.test(text);
        const isTestId = /^(data-testid|aria-|role)/.test(text) || text.includes('-banner') || text.includes('-button') || text.includes('-modal');
        const isStorageKey = text.endsWith('Position') || text.endsWith('State') || text.endsWith('Cache') || text.endsWith('Token');
        const isTerminalCommand = /^(cd |npm |git |yarn |pnpm |node |npx |bun )/.test(text);
        const isErrorMatching = text.includes('server is not running') || text.includes('Backend') || text.includes('Network error');

        return text.length > 10 &&
          !isInTypeDefinition &&
          !isCssClass &&
          !isTestId &&
          !isStorageKey &&
          !isTerminalCommand &&
          !isErrorMatching &&
          !text.includes("http") &&
          !text.includes("/") &&
          !text.includes("px") &&
          !text.includes("#") &&
          !text.includes("use client") &&
          !text.includes("use server") &&
          !/^[A-Z_]+$/.test(text) &&
          !/^[a-z]+\.[a-z.]+$/i.test(text) &&
          !/^[a-z]{2}-[A-Z]{2}$/.test(text) &&
          /\b[a-z]/.test(text) &&
          /\s/.test(text);
      });
      if (stringLiterals.length > 5) {
        pushFinding("frontend.i18n.hardcoded_strings", "warning", sf, sf, `Possible hardcoded strings detected (${stringLiterals.length}) - consider using useTranslation`, findings);
      }
    }

    // i18n namespaces (skip if custom implementation doesn't support namespaces)
    const hasCustomI18n = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes('@/i18n') ||
      imp.getModuleSpecifierValue().includes('i18n/index')
    );
    if (!hasCustomI18n && /useTranslation\(/.test(sf.getFullText()) && /useTranslation\(\)/.test(sf.getFullText())) {
      pushFinding("frontend.i18n.missing_namespaces", "warning", sf, sf, "useTranslation without namespace argument", findings);
    }
    if (!isInfrastructure && sf.getFullText().match(/new\s+Date\(|Date\.now\(/) && !/Intl\.|date\-fns|dayjs/.test(sf.getFullText())) {
      pushFinding("frontend.i18n.missing_formatting", "warning", sf, sf, "Date used in UI without localized formatting", findings);
    }
    const projectRoot = getRepoRoot();
    const hasConfig =
      fs.existsSync(path.join(projectRoot, 'next-i18next.config.js')) ||
      fs.existsSync(path.join(projectRoot, 'i18n.ts')) ||
      fs.existsSync(path.join(projectRoot, 'apps/admin-dashboard/i18n.ts')) ||
      fs.existsSync(path.join(projectRoot, 'apps/admin-dashboard/src/infrastructure/config/i18n.config.ts')) ||
      fs.existsSync(path.join(projectRoot, 'src/infrastructure/config/i18n.config.ts'));
    if (!hasConfig && /\/app\//.test(filePath)) {
      pushFinding("frontend.i18n.from_day_one", "info", sf, sf, "i18n config not found (heuristic)", findings);
      pushFinding("frontend.i18n.fallback_locale", "info", sf, sf, "Fallback locale not configured (heuristic)", findings);
    }

    const hasZustand = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes("zustand") ||
      imp.getModuleSpecifierValue().includes("zustand/")
    );
    const hasRedux = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes("redux") ||
      imp.getModuleSpecifierValue().includes("react-redux")
    );
    const hasContext = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) =>
      call.getExpression().getText() === "createContext" ||
      call.getExpression().getText() === "React.createContext"
    );

    if ((hasRedux || hasContext) && !hasZustand) {
      pushFinding("frontend.state.missing_zustand", "info", sf, sf, "Consider using Zustand for global state management (simpler than Redux/Context)", findings);
    }

    const hasReactQuery = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes("@tanstack/react-query") ||
      imp.getModuleSpecifierValue().includes("react-query")
    );
    const hasFetchCalls = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
      const expr = call.getExpression().getText();
      return expr === "fetch" || expr.includes("axios") || expr.includes("api");
    });

    if (hasFetchCalls && !hasReactQuery && isComponent) {
      pushFinding("frontend.state.missing_react_query", "warning", sf, sf, "Server state management without React Query - consider using for caching and synchronization", findings);
    }

    const hasTailwindImport = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes("tailwind") ||
      imp.getModuleSpecifierValue().includes("clsx") ||
      imp.getModuleSpecifierValue().includes("cn")
    );
    const hasClassNameUsage = sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).some((attr) => {
      const name = attr.getNameNode()?.getText();
      return name === "className";
    });
    const hasTailwind = hasTailwindImport || hasClassNameUsage;

    const hasInlineStyles = sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).some((attr) => {
      const name = attr.getNameNode()?.getText();
      return name === "style";
    });
    const hasCssModules = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().endsWith(".module.css") ||
      imp.getModuleSpecifierValue().endsWith(".module.scss")
    );

    if (hasInlineStyles && !hasTailwind && !hasCssModules) {
      pushFinding("frontend.styling.missing_tailwind", "info", sf, sf, "Consider using Tailwind CSS for consistent utility-first styling", findings);
    }

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr === "fetch" || expr.includes("axios") || expr.includes("useQuery")) {
        const hasLoadingState = sf.getFullText().includes("loading") || sf.getFullText().includes("isLoading") || sf.getFullText().includes("pending");
        if (!hasLoadingState) {
          pushFinding("frontend.api.loading_states", "info", sf, call, "API call without loading state - consider showing skeleton screens or spinners", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression().getText();
      if (expr === "fetch" || expr.includes("axios")) {
        const hasRetry = sf.getFullText().includes("retry") || sf.getFullText().includes("retryOnError");
        if (!hasRetry) {
          pushFinding("frontend.api.retry_logic", "info", sf, call, "API call without retry logic - consider exponential backoff for failed requests", findings);
        }
      }
    });
    if (/\/app\/api\//.test(filePath) || /\/pages\/api\//.test(filePath)) {
      const txt = sf.getFullText();
      const usesResponse = /NextResponse|Response/.test(txt);
      const hasCache = /Cache-Control/i.test(txt);
      if (usesResponse && !hasCache) {
        pushFinding("frontend.api.missing_cache_headers", "warning", sf, sf, "API route without Cache-Control header", findings);
      }
    }

    const hasAppRouter = sf.getFullText().includes("app/") || sf.getFullText().includes("layout.tsx") || sf.getFullText().includes("page.tsx");
    if (hasAppRouter) {
      pushFinding("frontend.nextjs.app_router", "info", sf, sf, "Using Next.js App Router - good for modern React Server Components", findings);
    }

    if (/\/app\/api\//.test(filePath) && filePath.endsWith('.ts')) {
      const hasHandler = /export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=/.test(sf.getFullText());
      if (!hasHandler) {
        pushFinding("frontend.nextjs.route_handlers", "warning", sf, sf, "Route inside app/api without exported HTTP handlers", findings);
      }
    }
    if (/\/app\//.test(filePath) && filePath.endsWith('.tsx')) {
      const fileContent = sf.getFullText();
      const isClientComponent = /^['"]use client['"];?\s*$/m.test(fileContent);

      if (!isClientComponent && /fetch\(/.test(fileContent) && !/cache\s*:\s*"no\-store"|next\s*:\s*\{\s*revalidate\s*:/.test(fileContent)) {
        pushFinding("frontend.nextjs.data_fetching", "warning", sf, sf, "Server fetch without cache/revalidate options", findings);
      }
    }

    const hasStrict = sf.getFullText().includes('"strict": true') || sf.getFullText().includes("'strict': true");
    if (!hasStrict && sf.getFullText().includes("tsconfig.json")) {
      pushFinding("frontend.typescript.strict_mode", "warning", sf, sf, "TypeScript strict mode not enabled - consider enabling for better type safety", findings);
    }

    sf.getDescendantsOfKind(SyntaxKind.AnyKeyword).forEach((anyKeyword) => {
      pushFinding("frontend.typescript.any_usage", "warning", sf, anyKeyword, "Usage of 'any' type - prefer specific types for better type safety", findings);
    });

    sf.getDescendantsOfKind(SyntaxKind.Parameter).forEach((param) => {
      if (!param.getTypeNode()) {
        pushFinding("frontend.typescript.implicit_any", "warning", sf, param, "Parameter without explicit type - add type annotation", findings);
      }
    });

    if (filePath.endsWith('.ts') && !filePath.endsWith('.d.ts')) {
      sf.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
        const varDecl = catchClause.getVariableDeclaration();
        if (varDecl) {
          const typeNode = varDecl.getTypeNode();
          if (!typeNode) {
            pushFinding(
              "frontend.error_handling.untyped_catch",
              "high",
              sf,
              catchClause,
              "Catch parameter MUST be typed as ': unknown' - use type guards (error instanceof ApiError)",
              findings
            );
          }
        }
      });
    }

    sf.getDescendantsOfKind(SyntaxKind.ExpressionStatement).forEach((stmt) => {
      const text = stmt.getText().trim();
      if (/^void\s+(err|error)\s*;?\s*$/.test(text)) {
        pushFinding(
          "frontend.error_handling.void_error",
          "high",
          sf,
          stmt,
          "NEVER use 'void err' - handle errors with type guards (ApiError/Error) and error state",
          findings
        );
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach((varDecl) => {
      const typeNode = varDecl.getTypeNode();
      if (typeNode && typeNode.getText() === 'unknown') {
        const parent = varDecl.getParent();
        const scope = varDecl.getFirstAncestorByKind(SyntaxKind.Block);
        if (scope) {
          const scopeText = scope.getText();
          const varName = varDecl.getName();
          const hasTypeGuard = new RegExp(`${varName}\\s+instanceof|typeof\\s+${varName}|${varName}\\.constructor`).test(scopeText);
          if (!hasTypeGuard) {
            pushFinding(
              "frontend.typescript.unknown_without_guard",
              "high",
              sf,
              varDecl,
              `Variable '${varName}: unknown' used without type guards - add instanceof/typeof checks`,
              findings
            );
          }
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const expr = call.getExpression();
      if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const text = expr.getText();
        if (text === 'console.error') {
          const catchBlock = call.getFirstAncestor((node) => node.getKind() === SyntaxKind.CatchClause);
          if (catchBlock) {
            pushFinding(
              "frontend.error_handling.console_in_catch",
              "medium",
              sf,
              call,
              "Avoid console.error in catch - use error state management (setError, setChartError)",
              findings
            );
          }
        }
      }
    });

    const hasReactHookForm = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes("react-hook-form")
    );
    const hasFormElements = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).some((el) => {
      const tag = el.getTagNameNode()?.getText();
      return tag === "form" || tag === "input" || tag === "textarea" || tag === "select";
    });

    if (hasFormElements && !hasReactHookForm) {
      pushFinding("frontend.forms.missing_react_hook_form", "info", sf, sf, "Forms without React Hook Form - consider using for better form management and validation", findings);
    }

    const hasZod = sf.getImportDeclarations().some((imp) =>
      imp.getModuleSpecifierValue().includes("zod")
    );
    if (hasReactHookForm && !hasZod) {
      pushFinding("frontend.forms.missing_zod", "info", sf, sf, "React Hook Form without Zod - consider using Zod for type-safe form validation", findings);
    }

    const hasDynamicImport = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
      const expr = call.getExpression().getText();
      return expr === "import" || expr.includes("next/dynamic");
    });

    if (!hasDynamicImport && sf.getFullText().length > 10000) { // Large file
      pushFinding("frontend.performance.code_splitting", "info", sf, sf, "Large component without code splitting - consider lazy loading with React.lazy or next/dynamic", findings);
      pushFinding("frontend.performance.missing_code_splitting", "info", sf, sf, "Large component without code splitting - consider lazy loading with React.lazy or next/dynamic", findings);
    }

    sf.getDescendantsOfKind(SyntaxKind.JsxElement).forEach((jsx) => {
      const tag = jsx.getOpeningElement()?.getTagNameNode()?.getText();
      if (tag && (tag.includes("List") || tag.includes("Grid") || tag === "ul" || tag === "ol")) {
        const hasVirtualization = sf.getImportDeclarations().some((imp) =>
          imp.getModuleSpecifierValue().includes("react-window") ||
          imp.getModuleSpecifierValue().includes("react-virtualized")
        );
        if (!hasVirtualization) {
          pushFinding("frontend.performance.virtualization", "info", sf, jsx, "Large list without virtualization - consider react-window for better performance", findings);
          pushFinding("frontend.performance.missing_virtual_scrolling", "info", sf, jsx, "Large list without virtualization - consider react-window for better performance", findings);
        }
      }
    });

    const totalLines = sf.getText().split(/\r?\n/).length;
    if (totalLines > 500) {
      pushFinding("frontend.file.too_large", "info", sf, sf, `Large TSX file (${totalLines} lines)`, findings);
    }

    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const name = attr.getNameNode()?.getText();
      if (name === "dangerouslySetInnerHTML") {
        pushFinding("frontend.security.dangerous_html", "warning", sf, attr, "dangerouslySetInnerHTML usage - ensure HTML is sanitized to prevent XSS attacks", findings);
      }
    });
    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const n = attr.getNameNode()?.getText();
      if (n === "style") {
        const parent = attr.getParent();
        const elementName = parent?.getFirstChildByKind(SyntaxKind.Identifier)?.getText() || '';
        const isChartComponent = /Chart|Legend/.test(filePath);
        const isSvgElement = ['Label', 'text', 'circle', 'path', 'rect', 'line'].includes(elementName);

        const styleValue = attr.getInitializer()?.getText() || '';
        const hasDynamicColorProp = /\{\s*(backgroundColor|color|fill)[\s:}]/.test(styleValue);
        const isChartFile = /Chart|Legend|chart/.test(filePath);
        const isDynamicColor = hasDynamicColorProp && isChartFile;

        if (!isSvgElement && !isDynamicColor) {
          pushFinding("frontend.styling.inline_style", "warning", sf, attr, "Inline style detected - prefer className with Tailwind/CSS Modules", findings);
        }
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((attr) => {
      const name = attr.getNameNode()?.getText();
      const value = attr.getInitializer()?.getText();
      if (name && /^on[A-Z]/.test(name) && value && value.includes("javascript:")) {
        pushFinding("frontend.security.inline_handlers", "error", sf, attr, "Inline JavaScript in event handler - potential XSS vulnerability", findings);
      }
    });

    const isConfigFile = /\.(config|spec|test)\.(ts|tsx|js|jsx)$/.test(filePath);
    sf.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((str) => {
      const text = str.getLiteralValue();
      if (text.startsWith("http://")) {
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:|\/|$)/i.test(text);
        const isEnvVar = /process\.env\.|NEXT_PUBLIC_|API_URL/.test(sf.getFullText());
        const isDevOnly = isConfigFile || /development|test|local/i.test(sf.getFullText());
        const isXMLNamespace = /xmlns=|http:\/\/(www\.)?w3\.org\/(1999|2000)\/(svg|xhtml)/i.test(text);

        if (!isLocalhost && !isDevOnly && !isXMLNamespace) {
          pushFinding("frontend.security.https_always", "error", sf, str, "HTTP URL detected - always use HTTPS in production", findings);
        }
      }
    });

    const isTest = isTestFile(filePath);
    if (!isTest && sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).some((fn) =>
      fn.getName() && /^[A-Z]/.test(fn.getName())
    )) {
      const testFilePath = filePath.replace(/\.tsx?$/, `.test.$&`);
      if (!fs.existsSync(testFilePath)) {
        pushFinding("frontend.testing.missing_tests", "info", sf, sf, `Missing test file: ${testFilePath}`, findings);
      }
    }

    if (isTest) {
      const hasRTL = sf.getImportDeclarations().some((imp) =>
        imp.getModuleSpecifierValue().includes("@testing-library/react")
      );
      const hasEnzyme = sf.getImportDeclarations().some((imp) =>
        imp.getModuleSpecifierValue().includes("enzyme")
      );

      if (hasEnzyme && !hasRTL) {
        pushFinding("frontend.testing.missing_rtl", "warning", sf, sf, "Using Enzyme instead of React Testing Library - prefer RTL for user-centric testing", findings);
      }
    }

    if (isTest) {
      const hasMSW = sf.getImportDeclarations().some((imp) =>
        imp.getModuleSpecifierValue().includes("msw")
      );
      const hasFetch = sf.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) =>
        call.getExpression().getText() === "fetch"
      );

      if (hasFetch && !hasMSW) {
        pushFinding("frontend.testing.missing_msw", "info", sf, sf, "API calls in tests without MSW - consider using Mock Service Worker for API mocking", findings);
        pushFinding("frontend.testing.msw", "info", sf, sf, "API calls in tests without MSW - consider using Mock Service Worker for API mocking", findings);
      }
      const usesRTL = sf.getImportDeclarations().some((imp) => imp.getModuleSpecifierValue().includes("@testing-library/react"));
      const usesUserEvent = sf.getImportDeclarations().some((imp) => imp.getModuleSpecifierValue().includes("@testing-library/user-event"));
      if (usesRTL && !usesUserEvent && /fireEvent\./.test(sf.getFullText())) {
        pushFinding("frontend.testing.missing_userevent", "warning", sf, sf, "fireEvent used without userEvent – prefer userEvent for realistic interactions", findings);
      }
      if (/toMatchSnapshot\(/.test(sf.getFullText())) {
        pushFinding("frontend.testing.snapshot_moderation", "warning", sf, sf, "Snapshot assertions detected – use sparingly on stable components", findings);
      }
      if (/page\.tsx$/.test(filePath)) {
        const candidate = filePath.replace(/\/app\//, '/e2e/').replace(/\.tsx$/, '.spec.ts');
        try { 
          if (!fs.existsSync(candidate)) { 
            pushFinding("frontend.testing.missing_e2e", "info", sf, sf, "No E2E spec found for this page (heuristic)", findings); 
          } 
        } catch (error) {
          if (process.env.DEBUG) {
            console.debug(`[frontend-ast] Failed to check E2E spec file: ${error.message}`);
          }
        }
      }
    }

    // ==========================================
    // ==========================================

    const content = sf.getFullText();


    const componentPattern = /^(export\s+)?(?:const|function)\s+([A-Z]\w+)\s*[=:].*(?:React\.FC|JSX\.Element|\(\)\s*=>|function)/gm;
    const components = Array.from(content.matchAll(componentPattern));
    if (components.length > 3 && !filePath.includes('.stories.') && !filePath.includes('index.tsx')) {
      pushFinding(
        "frontend.solid.srp_multiple_components",
        "high",
        sf,
        sf,
        `File defines ${components.length} components - split into separate files (SRP: one component per file)`,
        findings
      );
    }

    if (components.length >= 1) {
      components.forEach((compMatch) => {
        const componentName = compMatch[2];
        const componentStart = compMatch.index || 0;
        const componentEnd = content.indexOf('\n}\n', componentStart) || content.length;
        const componentBody = content.substring(componentStart, componentEnd);

        const hookCount = (componentBody.match(/\buse[A-Z]\w+\(/g) || []).length;
        const functionCount = (componentBody.match(/(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\(/g) || []).length;
        const totalComplexity = hookCount + functionCount;

        if (totalComplexity > 20) {
          pushFinding(
            "frontend.solid.srp_god_component",
            "critical",
            sf,
            sf,
            `Component '${componentName}' has ${hookCount} hooks + ${functionCount} functions = ${totalComplexity} - split responsibilities (SRP)`,
            findings
          );
        }
      });
    }


    const switchPattern = /switch\s*\([^)]+\)\s*\{[\s\S]{300,}?\}/g;
    let switchMatch;
    while ((switchMatch = switchPattern.exec(content)) !== null) {
      const caseCount = (switchMatch[0].match(/case\s+/g) || []).length;
      if (caseCount > 5) {
        const lineNumber = content.substring(0, switchMatch.index).split('\n').length;
        pushFinding(
          "frontend.solid.ocp_switch_polymorphism",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Large switch (${caseCount} cases) - use lookup table/strategy pattern (OCP: open for extension)`,
          findings
        );
      }
    }

    const ifElseRenderPattern = /if\s*\([^)]+\)\s*\{[\s\S]{50,}?return\s+<[\s\S]{50,}?else\s+if\s*\([^)]+\)\s*\{[\s\S]{50,}?return\s+</g;
    if (ifElseRenderPattern.test(content)) {
      pushFinding(
        "frontend.solid.ocp_conditional_render",
        "medium",
        sf,
        sf,
        'Multiple if-else for rendering - use component mapping/strategies (OCP: polymorphic components)',
        findings
      );
    }


    const extendsPattern = /(?:interface|type)\s+(\w+Props)\s+extends\s+(\w+Props)/g;
    let extendsMatch;
    while ((extendsMatch = extendsPattern.exec(content)) !== null) {
      const childProps = extendsMatch[1];
      const parentProps = extendsMatch[2];

      const propsDefStart = content.indexOf(extendsMatch[0]);
      const propsDefEnd = content.indexOf('}', propsDefStart);
      const propsDef = content.substring(propsDefStart, propsDefEnd);

      const requiredPropsCount = (propsDef.match(/\w+\s*:\s*[^?]/g) || []).length;
      if (requiredPropsCount > 3) {
        const lineNumber = content.substring(0, propsDefStart).split('\n').length;
        pushFinding(
          "frontend.solid.lsp_props_narrowing",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: ${childProps} extends ${parentProps} but adds ${requiredPropsCount} required props - violates LSP (subtypes should be substitutable)`,
          findings
        );
      }
    }


    const propsInterfacePattern = /(?:interface|type)\s+(\w+Props)\s*\{([^}]{200,})\}/g;
    let propsMatch;
    while ((propsMatch = propsInterfacePattern.exec(content)) !== null) {
      const propsName = propsMatch[1];
      const propsBody = propsMatch[2];
      const propsCount = (propsBody.match(/\w+\s*[?:]?\s*:/g) || []).length;

      if (propsCount > 10) {
        const lineNumber = content.substring(0, propsMatch.index).split('\n').length;
        pushFinding(
          "frontend.solid.isp_fat_props",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: ${propsName} has ${propsCount} properties - split into smaller interfaces (ISP: clients shouldn't depend on unused props)`,
          findings
        );
      }
    }


    if (filePath.includes('/components/') || filePath.includes('/presentation/')) {
      const concreteImports = ['axios', 'fetch', 'localStorage', 'sessionStorage', '@supabase/supabase-js'];
      concreteImports.forEach((concrete) => {
        if (content.includes(`import`) && content.includes(concrete) && !filePath.includes('infrastructure/')) {
          const lineNumber = content.indexOf(concrete) > -1 ? content.substring(0, content.indexOf(concrete)).split('\n').length : 1;
          pushFinding(
            "frontend.solid.dip_concrete_dependency",
            "critical",
            sf,
            sf,
            `Line ${lineNumber}: Component/View depends on concrete ${concrete} - inject via props/context (DIP: depend on abstractions)`,
            findings
          );
        }
      });
    }

    if (filePath.includes('/hooks/') || /^use[A-Z]/.test(path.basename(filePath))) {
      if (content.includes('new ') && (content.includes('Service(') || content.includes('Client(') || content.includes('Api('))) {
        pushFinding(
          "frontend.solid.dip_hook_instantiation",
          "high",
          sf,
          sf,
          'Hook instantiates service directly - receive as parameter (DIP: high-level shouldn\'t know low-level construction)',
          findings
        );
      }
    }

    // ==========================================
    // ==========================================


    if (filePath.includes('/presentation/') || filePath.includes('/components/')) {
      const forbiddenImports = ['axios', 'supabase', 'prisma', 'mongoose', 'fetch'];
      forbiddenImports.forEach((forbidden) => {
        if (content.includes(`from '${forbidden}'`) || content.includes(`from "${forbidden}"`)) {
          pushFinding(
            "frontend.clean_arch.presentation_infrastructure",
            "critical",
            sf,
            sf,
            `Presentation layer imports ${forbidden} - use repository abstraction (Clean Arch: dependencies point inward)`,
            findings
          );
        }
      });
    }

    if (filePath.includes('/components/') || filePath.includes('/pages/') || filePath.includes('/app/') && filePath.endsWith('.tsx')) {
      const businessPatterns = [
        /fetch\s*\(/,
        /axios\./,
        /\.\s*post\s*\(/,
        /\.\s*put\s*\(/,
        /\.\s*delete\s*\(/,
        /localStorage\.setItem/,
        /sessionStorage\.setItem/,
        /new\s+Date\(\).*format/
      ];

      businessPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          const match = content.match(pattern);
          if (match && match.index !== undefined) {
            const lineNumber = content.substring(0, match.index).split('\n').length;
            pushFinding(
              "frontend.clean_arch.business_logic_in_ui",
              "high",
              sf,
              sf,
              `Line ${lineNumber}: Business logic in UI component - move to use-case/service (Clean Arch: UI coordinates, doesn't decide)`,
              findings
            );
          }
        }
      });
    }

    if (filePath.includes('/utils/') || filePath.includes('/helpers/') || filePath.includes('/lib/')) {
      if (!filePath.includes('node_modules') && filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        pushFinding(
          "frontend.clean_arch.forbidden_directory",
          "critical",
          sf,
          sf,
          'utils/helpers/lib directories forbidden - move to infrastructure/ or application/ (Clean Arch: proper layer organization)',
          findings
        );
      }
    }

    if ((content.includes('Repository') || content.includes('Api')) &&
      content.includes('class ') &&
      !filePath.includes('/infrastructure/')) {
      pushFinding(
        "frontend.clean_arch.repository_location",
        "high",
        sf,
        sf,
        'Repository/API implementation outside infrastructure/ - move to infrastructure/repositories/',
        findings
      );
    }

    // ==========================================
    // ==========================================

    if (isTestFile(filePath)) {
      const testPattern = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let testMatch;
      const testNames = [];

      while ((testMatch = testPattern.exec(content)) !== null) {
        const testName = testMatch[1];
        testNames.push({ name: testName, index: testMatch.index });
      }

      testNames.forEach((test) => {
        const hasBDDStructure = /given|when|then|should/i.test(test.name);
        const isDescriptive = test.name.length > 20;

        if (!hasBDDStructure && isDescriptive) {
          const lineNumber = content.substring(0, test.index).split('\n').length;
          pushFinding(
            "frontend.bdd.test_naming",
            "medium",
            sf,
            sf,
            `Line ${lineNumber}: Test '${test.name.substring(0, 40)}...' - use BDD naming: 'should X when Y' or 'given X, when Y, then Z'`,
            findings
          );
        }
      });

      if (!content.includes('makeSUT') && !content.includes('createSUT') && !content.includes('setup')) {
        const hasMultipleTests = testNames.length > 3;
        if (hasMultipleTests) {
          pushFinding(
            "frontend.bdd.missing_make_sut",
            "medium",
            sf,
            sf,
            'Test file with multiple tests - extract SUT creation to makeSUT factory (BDD: reusable test setup)',
            findings
          );
        }
      }

      if (content.includes('jest.mock') && !content.includes('jest.spyOn')) {
        pushFinding(
          "frontend.bdd.prefer_spies",
          "low",
          sf,
          sf,
          'Test uses jest.mock - prefer jest.spyOn (BDD: spy on real behavior, don\'t replace entirely)',
          findings
        );
      }

      if (!isTestFile(filePath) && (content.includes('Mock') || content.includes('Stub') || content.includes('Fake')) && content.includes('export')) {
        pushFinding(
          "frontend.testing.mock_in_production",
          "critical",
          sf,
          sf,
          'Mock/Stub/Fake exported from production code - move to test files',
          findings
        );
      }
    }

    // ==========================================
    // ==========================================

    const commentPattern = /\/\/(?!\s*TODO:)(?!\s*FIXME:)(?!\s*eslint-)(?!\s*@ts-)(?!\s*prettier-)[\s]*\w{3,}[^\n]{15,}/g;
    let commentMatch;
    let commentCount = 0;

    while ((commentMatch = commentPattern.exec(content)) !== null && commentCount < 5) {
      const lineNumber = content.substring(0, commentMatch.index).split('\n').length;
      const commentText = commentMatch[0].substring(0, 50);
      pushFinding(
        "frontend.code_quality.comment",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: Comment '${commentText}...' - refactor to self-descriptive code (No comments rule)`,
        findings
      );
      commentCount++;
    }

    const nestedIfPattern = /if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{/g;
    if (nestedIfPattern.test(content)) {
      pushFinding(
        "frontend.code_quality.nested_conditionals",
        "high",
        sf,
        sf,
        'Deeply nested if statements - use early returns/guard clauses (Clean Code: reduce cognitive complexity)',
        findings
      );
    }

    // Magic numbers
    const magicNumberPattern = /[^a-zA-Z0-9_]\d{3,}(?!\s*px|ms|rem|em|%|vh|vw)/g;
    let magicCount = 0;
    let magicMatch;

    while ((magicMatch = magicNumberPattern.exec(content)) !== null && magicCount < 5) {
      const number = magicMatch[0].trim();
      const lineNumber = content.substring(0, magicMatch.index).split('\n').length;

      if (!['1000', '2000', '3000', '5000', '10000'].includes(number.trim()) || content.substring(magicMatch.index - 20, magicMatch.index).includes('Date')) {
        pushFinding(
          "frontend.code_quality.magic_number",
          "low",
          sf,
          sf,
          `Line ${lineNumber}: Magic number ${number} - use named constant`,
          findings
        );
        magicCount++;
      }
    }

    const callbackPattern = /\([^)]*\)\s*=>\s*\{[^}]*\([^)]*\)\s*=>\s*\{[^}]*\([^)]*\)\s*=>\s*\{/g;
    if (callbackPattern.test(content)) {
      pushFinding(
        "frontend.code_quality.callback_hell",
        "high",
        sf,
        sf,
        'Deeply nested callbacks - use async/await or extract functions (Clean Code: flatten structure)',
        findings
      );
    }

    // ==========================================
    // ==========================================

    if ((filePath.includes('/models/') || filePath.includes('/views/') || filePath.includes('/controllers/')) &&
      !filePath.includes('/features/') && !filePath.includes('/domain/')) {
      pushFinding(
        "frontend.ddd.technical_grouping",
        "low",
        sf,
        sf,
        'Technical grouping (models/views/controllers) - consider feature-first organization (DDD: organize by domain/feature)',
        findings
      );
    }

    if (filePath.includes('/domain/') || filePath.includes('/entities/')) {
      const hasClass = content.includes('class ');
      const hasInterface = content.includes('interface ') || content.includes('type ');
      const hasMethods = content.includes('() {') || content.includes('function');

      if ((hasClass || hasInterface) && !hasMethods) {
        pushFinding(
          "frontend.ddd.anemic_model",
          "medium",
          sf,
          sf,
          'Entity/Domain model with no behavior - add domain logic methods (DDD: rich domain models)',
          findings
        );
      }
    }

    // ==========================================
    // ==========================================

    if (content.includes('dangerouslySetInnerHTML')) {
      const hasDOMPurify = content.includes('DOMPurify') || content.includes('sanitize');

      if (!hasDOMPurify) {
        pushFinding(
          "frontend.security.xss_danger",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL XSS Risk: dangerouslySetInnerHTML without DOMPurify sanitization. Install DOMPurify: npm i dompurify; Use: dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(html)}}. Prevents: Script injection, data theft, account hijacking',
          findings
        );
      }
    }

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const callText = call.getText();

      if (callText.startsWith('useEffect(')) {
        const effectBody = call.getArguments()[0]?.getText() || '';

        const hasSubscription = effectBody.includes('.subscribe') ||
          effectBody.includes('addEventListener') ||
          effectBody.includes('setInterval') ||
          effectBody.includes('setTimeout') ||
          effectBody.includes('WebSocket') ||
          effectBody.includes('.on(');

        const hasCleanup = effectBody.includes('return () =>') ||
          effectBody.includes('return function');

        if (hasSubscription && !hasCleanup) {
          pushFinding(
            "frontend.hooks.useeffect_cleanup",
            "critical",
            sf,
            call,
            '🚨 CRITICAL Memory Leak: useEffect with subscription/listener missing cleanup function. Add: return () => { subscription.unsubscribe(); removeEventListener(); clearInterval(); }. Prevents: Memory leaks, zombie listeners, multiple subscriptions',
            findings
          );
        }
      }
    });

    // 3. any Type Forbidden
    sf.getDescendantsOfKind(SyntaxKind.AnyKeyword).forEach((anyNode) => {
      const parent = anyNode.getParent();
      const parentText = parent?.getText() || '';

      const isThirdPartyType = parentText.includes('@types/') || parentText.includes('declare module');

      if (!isThirdPartyType) {
        pushFinding(
          "frontend.typescript.any_type_forbidden",
          "critical",
          sf,
          anyNode,
          '🚨 CRITICAL Type Safety: any type forbidden. Use unknown + type guard, or specific union type. Example: function process(data: unknown) { if (isValidData(data)) { /* typed */ } }. Prevents: Runtime errors, loss of IntelliSense, bugs in production',
          findings
        );
      }
    });

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const callText = call.getText();

      if (callText.startsWith('useCallback(')) {
        const args = call.getArguments();
        const callback = args[0]?.getText() || '';
        const depsArray = args[1]?.getText() || '';

        const usedVariables = callback.match(/\b[a-z]\w+/gi) || [];
        const declaredDeps = depsArray.match(/\b[a-z]\w+/gi) || [];

        const suspiciousMissing = usedVariables.filter(v =>
          !['console', 'window', 'document', 'Math', 'Date', 'JSON', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean'].includes(v) &&
          !declaredDeps.includes(v) &&
          v.length > 2
        );

        if (suspiciousMissing.length > 0 && !depsArray.includes('eslint-disable')) {
          pushFinding(
            "frontend.hooks.usecallback_deps",
            "critical",
            sf,
            call,
            `🚨 CRITICAL Stale Closure: useCallback possibly missing dependencies: [${suspiciousMissing.join(', ')}]. Add to dependency array or verify. Prevents: Stale closures, incorrect behavior, hard-to-debug bugs. See: https://react.dev/reference/react/useCallback#my-callback-runs-too-often`,
            findings
          );
        }
      }
    });

    const functionComponents = sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
      .concat(sf.getDescendantsOfKind(SyntaxKind.ArrowFunction))
      .filter(fn => {
        const name = fn.getName?.() || fn.getParent()?.getText() || '';
        return /^[A-Z]/.test(name) || fn.getText().includes('use');
      });

    functionComponents.forEach(comp => {
      const statements = comp.getDescendantsOfKind(SyntaxKind.CallExpression);
      let foundConditional = false;
      let foundHookAfterConditional = false;

      statements.forEach(stmt => {
        const stmtText = stmt.getText();
        const isConditional = stmt.getParent()?.getKind() === SyntaxKind.IfStatement ||
          stmt.getParent()?.getKind() === SyntaxKind.ConditionalExpression;

        const isHook = /^use[A-Z]/.test(stmtText);

        if (isConditional) foundConditional = true;
        if (foundConditional && isHook) foundHookAfterConditional = true;
      });

      if (foundHookAfterConditional) {
        pushFinding(
          "frontend.hooks.hook_call_order",
          "critical",
          sf,
          comp,
          '🚨 CRITICAL React Rules Violation: Hook called after conditional/loop. Hooks MUST be at top level. Move hooks before any conditionals. Prevents: Rules of Hooks violation, inconsistent renders, React crash. See: https://react.dev/reference/rules/rules-of-hooks',
          findings
        );
      }
    });

    const tokenInURLPattern = /(\?|&)(token|auth|key|apikey|api_key|access_token)=[a-zA-Z0-9_\-\.]+/gi;
    let tokenMatch;

    while ((tokenMatch = tokenInURLPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, tokenMatch.index).split('\n').length;

      pushFinding(
        "frontend.security.token_in_url",
        "critical",
        sf,
        sf,
        `🚨 CRITICAL Security: Auth token in URL query params (line ${lineNumber}). URLs are logged, cached, shared. Use Authorization header instead: headers: { 'Authorization': \`Bearer \${token}\` }. Prevents: Token theft, session hijacking, compliance violations`,
        findings
      );
    }

    if (filePath.includes('/app/layout') || filePath.includes('/middleware')) {
      const hasCSP = content.includes('Content-Security-Policy') ||
        content.includes('contentSecurityPolicy');

      if (!hasCSP && !content.includes('TODO: CSP')) {
        pushFinding(
          "frontend.security.missing_csp_headers",
          "critical",
          sf,
          sf,
          '🚨 CRITICAL Security: Missing Content-Security-Policy headers. Add to Next.js config or middleware. Example: "Content-Security-Policy": "default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'". Prevents: XSS, clickjacking, code injection, data exfiltration',
          findings
        );
      }
    }

    // ==========================================
    // ==========================================

    const hasUseClientDirective = content.includes("'use client'") || content.includes('"use client"');
    const hasHooks = content.includes('useState') || content.includes('useEffect');
    const hasEventHandlers = content.includes('onClick') || content.includes('onChange');

    if (hasUseClientDirective && !hasHooks && !hasEventHandlers && !filePath.includes('/components/ui/')) {
      pushFinding(
        "frontend.nextjs.unnecessary_use_client",
        "high",
        sf,
        sf,
        '🚨 HIGH: Unnecessary "use client" directive. Server Components by default (Next.js 15). Only add "use client" when using: useState, useEffect, onClick, browser APIs. Benefit: Smaller bundle, faster load, better SEO',
        findings
      );
    }

    if (content.includes('React.memo(') || content.includes('memo(')) {
      const hasMemoJustification = content.includes('// memo:') || content.includes('/* memo:');

      if (!hasMemoJustification) {
        pushFinding(
          "frontend.performance.memo_without_justification",
          "high",
          sf,
          sf,
          '🚨 HIGH: React.memo without justification. Premature optimization. Add comment: // memo: Prevents re-render when X changes. Only use if profiled performance issue. Most components don\'t need memo.',
          findings
        );
      }
    }

    if ((content.includes('<img ') || content.includes('<img>')) && !content.includes('<Image')) {
      pushFinding(
        "frontend.nextjs.missing_next_image",
        "high",
        sf,
        sf,
        '🚨 HIGH: Use Next/Image instead of <img>. Import: import Image from \'next/image\'. Benefits: Automatic optimization, lazy loading, WebP format, responsive sizes, CLS prevention. Performance: 3x faster load',
        findings
      );
    }

    const divSoupPattern = /<div[^>]*>\\s*<div[^>]*>\\s*<div[^>]*>\\s*<div/g;
    if (divSoupPattern.test(content)) {
      pushFinding(
        "frontend.accessibility.semantic_html",
        "high",
        sf,
        sf,
        '🚨 HIGH: Div soup detected (4+ nested divs). Use semantic HTML: <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>. Benefits: SEO, accessibility, screen readers',
        findings
      );
    }

    const inputWithoutLabelPattern = /<input[^>]*(?!aria-label|aria-labelledby)[^>]*>/g;
    let inputMatch;
    let inputCount = 0;

    while ((inputMatch = inputWithoutLabelPattern.exec(content)) !== null && inputCount < 3) {
      const lineNumber = content.substring(0, inputMatch.index).split('\\n').length;
      pushFinding(
        "frontend.accessibility.input_label",
        "high",
        sf,
        sf,
        `🚨 HIGH: Input without label (line ${lineNumber}). Add aria-label or associated <label>. Screen readers need text description. Example: <input aria-label="Email address" /> or <label htmlFor="email">Email</label><input id="email" />`,
        findings
      );
      inputCount++;
    }

    if (content.includes('onClick') && !content.includes('onKeyDown') && !content.includes('onKeyPress')) {
      pushFinding(
        "frontend.accessibility.keyboard_navigation",
        "high",
        sf,
        sf,
        '🚨 HIGH: onClick without keyboard handler. Add onKeyDown={(e) => e.key === \'Enter\' && handleClick()}. Keyboard-only users need access. Or use <button> (has keyboard support).',
        findings
      );
    }

    const largeListPattern = /\{.*\.map\(.*=>.*\).*\}/s;
    if (largeListPattern.test(content) && content.includes('.map(') && !content.includes('react-window') && !content.includes('react-virtualized')) {
      const mapCount = (content.match(/\.map\(/g) || []).length;

      if (mapCount > 2) {
        pushFinding(
          "frontend.performance.missing_virtualization",
          "high",
          sf,
          sf,
          '🚨 HIGH: Large list without virtualization. For 100+ items use react-window or react-virtualized. Example: <FixedSizeList itemCount={items.length} itemSize={50} height={600} />. Performance: Renders only visible items.',
          findings
        );
      }
    }

    if ((content.includes('modal') || content.includes('Modal') || content.includes('dialog')) && !content.includes('focus') && !content.includes('ref')) {
      pushFinding(
        "frontend.accessibility.focus_trap",
        "high",
        sf,
        sf,
        '🚨 HIGH: Modal without focus management. Install: npm i focus-trap-react. Trap focus inside modal: <FocusTrap><Modal>...</Modal></FocusTrap>. Prevents keyboard users escaping modal.',
        findings
      );
    }

  });


  const useStateCallsInComponent = sf.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getExpression().getText() === 'useState');

  sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach(fn => {
    const name = fn.getName();
    if (name && /^[A-Z]/.test(name)) {
      const useStatesInFn = useStateCallsInComponent.filter(call =>
        fn.getDescendants().includes(call)
      );

      if (useStatesInFn.length >= 4) {
        pushFinding(
          "frontend.hooks.useState_overuse",
          "medium",
          sf,
          fn,
          `Component ${name} has ${useStatesInFn.length}+ useState. Consider useReducer for complex state. Benefits: Single state object, predictable updates, easier testing.`,
          findings
        );
      }
    }
  });

  const contextCreations = sf.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => call.getExpression().getText() === 'createContext');

  if (contextCreations.length >= 3 && !sf.getFilePath().includes('context')) {
    pushFinding(
      "frontend.state.context_overuse",
      "medium",
      sf,
      sf,
      `Multiple Context creations (${contextCreations.length}). Consider Zustand for global state. Context rerenders all consumers. Zustand: Selective subscriptions, better performance.`,
      findings
    );
  }

  sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach(fn => {
    const name = fn.getName();
    const body = fn.getBody()?.getText() || '';
    const hasHookCall = /use[A-Z]/.test(body);

    if (name && hasHookCall && !/^use[A-Z]/.test(name)) {
      pushFinding(
        "frontend.hooks.naming_convention",
        "medium",
        sf,
        fn,
        `Function ${name} uses hooks but doesn't start with 'use'. Rename to use${name[0].toUpperCase()}${name.slice(1)}. React ESLint requires 'use' prefix for hook functions.`,
        findings
      );
    }
  });

  const hasLargeImports = fullText.includes('import * as') ||
    fullText.match(/import\s+\{[^}]{200,}\}/);

  if (hasLargeImports) {
    pushFinding(
      "frontend.performance.large_imports",
      "medium",
      sf,
      sf,
      'Large import detected. Use tree-shaking: import { Button } from \'@mui/material/Button\' (not from \'@mui/material\'). Reduces bundle size by importing only needed components.',
      findings
    );
  }

  if (content.includes('class') && content.includes('extends Component') &&
    !content.includes('componentDidCatch') && !content.includes('getDerivedStateFromError')) {

    const hasChildrenRender = content.includes('render()') && content.includes('children');

    if (hasChildrenRender) {
      pushFinding(
        "frontend.error_handling.missing_error_boundary",
        "medium",
        sf,
        sf,
        'Component renders children without error boundary. Add: componentDidCatch(error, errorInfo) { logError(error); }. Prevents whole app crash from single component error.',
        findings
      );
    }
  }

  const hasRoutes = content.includes('Route') || content.includes('router');
  const hasLazy = content.includes('React.lazy') || content.includes('dynamic(');

  if (hasRoutes && !hasLazy && sf.getFilePath().includes('app')) {
    pushFinding(
      "frontend.performance.missing_lazy_loading",
      "medium",
      sf,
      sf,
      'Routes without lazy loading. Use: const Dashboard = lazy(() => import(\'./Dashboard\')). Wrap with <Suspense>. Reduces initial bundle, faster First Contentful Paint.',
      findings
    );
  }


  if (sf.getFilePath().includes('layout.tsx') || sf.getFilePath().includes('page.tsx')) {
    const hasMetadata = content.includes('metadata') || content.includes('generateMetadata');

    if (!hasMetadata) {
      pushFinding(
        "frontend.seo.missing_metadata",
        "low",
        sf,
        sf,
        'Missing SEO metadata. Export: export const metadata = { title, description, openGraph }. Improves Google ranking, social media previews.',
        findings
      );
    }
  }

  if (sf.getFilePath().includes('sitemap')) {
    const hasDynamicRoutes = content.includes('fetch') || content.includes('database');

    if (!hasDynamicRoutes && content.length < 200) {
      pushFinding(
        "frontend.seo.static_sitemap",
        "low",
        sf,
        sf,
        'Static sitemap. Generate dynamically: fetch all routes from API/DB. Update automatically when content changes. Better SEO indexing.',
        findings
      );
    }
  }

  if (sf.getFilePath().includes('robots')) {
    const hasDisallow = content.includes('Disallow');

    if (!hasDisallow) {
      pushFinding(
        "frontend.seo.robots_config",
        "low",
        sf,
        sf,
        'Robots.txt incomplete. Add Disallow rules for: /api, /admin, /_next. Prevents search engines indexing private routes.',
        findings
      );
    }
  }

  if (sf.getFilePath().includes('manifest')) {
    const hasIcons = content.includes('icons');
    const hasThemeColor = content.includes('theme_color');

    if (!hasIcons || !hasThemeColor) {
      pushFinding(
        "frontend.pwa.manifest_incomplete",
        "low",
        sf,
        sf,
        'PWA manifest incomplete. Add: icons (192x192, 512x512), theme_color, background_color, display: standalone. Enables Add to Home Screen.',
        findings
      );
    }
  }

  if (content.includes('serviceWorker') && !content.includes('unregister')) {
    pushFinding(
      "frontend.pwa.missing_sw_unregister",
      "low",
      sf,
      sf,
      'Service Worker registration without unregister fallback. Add: if (!production) navigator.serviceWorker.unregister(). Prevents caching issues in development.',
      findings
    );
  }

  if (sf.getFilePath().includes('lighthouse') || sf.getFilePath().includes('performance')) {
    const hasThresholds = content.includes('performance') && content.includes('accessibility');

    if (!hasThresholds) {
      pushFinding(
        "frontend.performance.lighthouse_monitoring",
        "low",
        sf,
        sf,
        'Lighthouse config without thresholds. Set CI thresholds: performance: 90, accessibility: 95, best-practices: 90, seo: 90. Prevents performance regressions.',
        findings
      );
    }
  }

  const hasWebVitals = content.includes('reportWebVitals') || content.includes('web-vitals');
  const hasAnalytics = content.includes('analytics') || content.includes('gtag');

  if (hasWebVitals && !hasAnalytics) {
    pushFinding(
      "frontend.monitoring.web_vitals_no_analytics",
      "low",
      sf,
      sf,
      'Web Vitals captured but not sent to analytics. Send to Google Analytics: gtag(\'event\', metric.name, { value: metric.value }). Track LCP, FID, CLS in production.',
      findings
    );
  }

  if (sf.getFilePath().includes('layout') && !content.includes('analytics') && !content.includes('gtag')) {
    pushFinding(
      "frontend.monitoring.missing_analytics",
      "low",
      sf,
      sf,
      'Root layout without analytics. Add Google Analytics: <Script src="https://www.googletagmanager.com/gtag/js" />. Track user behavior, conversion rates.',
      findings
    );
  }

  if (sf.getFilePath().includes('error.tsx') && !content.includes('Sentry') && !content.includes('captureException')) {
    pushFinding(
      "frontend.monitoring.missing_error_tracking",
      "low",
      sf,
      sf,
      'Error page without error tracking. Install: npm i @sentry/nextjs. Track production errors: Sentry.captureException(error). Get alerts when users hit errors.',
      findings
    );
  }

  if (content.includes('if (') && /feature|experiment|rollout|beta/i.test(content)) {
    const hasFeatureFlagLib = content.includes('unleash') || content.includes('launchdarkly') || content.includes('flagsmith');

    if (!hasFeatureFlagLib) {
      pushFinding(
        "frontend.devops.hardcoded_feature_flag",
        "low",
        sf,
        sf,
        'Hardcoded feature flag. Use feature flag service: Unleash, LaunchDarkly, Flagsmith. Benefits: Toggle features without deployment, gradual rollout, A/B testing.',
        findings
      );
    }
  }

  if (content.includes('variant') && content.includes('Math.random')) {
    pushFinding(
      "frontend.devops.manual_ab_testing",
      "low",
      sf,
      sf,
      'Manual A/B testing with Math.random. Use: Google Optimize, Optimizely, VWO. Benefits: Statistical significance, reporting, targeting rules.',
      findings
    );
  }

  if (content.includes('fetch') && !content.includes('cache') && !content.includes('revalidate')) {
    const isFetchInServerComponent = content.includes('async function') && !content.includes('\'use client\'');

    if (isFetchInServerComponent) {
      pushFinding(
        "frontend.performance.missing_cache_strategy",
        "low",
        sf,
        sf,
        'Fetch without cache strategy. Add: { cache: \'force-cache\' } or { next: { revalidate: 3600 } }. Default behavior may change. Be explicit.',
        findings
      );
    }
  }
}

module.exports = {
  runFrontendIntelligence,
};
