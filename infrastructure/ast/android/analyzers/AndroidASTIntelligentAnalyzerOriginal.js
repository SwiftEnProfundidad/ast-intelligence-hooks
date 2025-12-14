// ===== Android AST INTELLIGENT ANALYZER =====
// Comprehensive Kotlin AST analysis for Android
// Covers: SOLID, Clean Architecture, Compose, Coroutines, Flow, Hilt, Room, Security

const fs = require('fs');
const path = require('path');

class AndroidASTIntelligentAnalyzer {
    constructor(findings) {
        this.findings = findings;
        this.content = '';
        this.lines = [];
        this.filePath = '';
        this.imports = [];
        this.classes = [];
        this.functions = [];
        this.annotations = [];
    }

    analyzeFile(filePath) {
        if (!filePath.endsWith('.kt') && !filePath.endsWith('.kts')) return;

        try {
            this.content = fs.readFileSync(filePath, 'utf8');
            this.lines = this.content.split('\n');
            this.filePath = filePath;

            this.extractImports();
            this.classes = this.extractClasses();
            this.functions = this.extractTopLevelFunctions();
            this.annotations = this.extractAnnotations();

            this.analyzeImportsRules();
            this.analyzeClasses();
            this.analyzeCompose();
            this.analyzeCoroutines();
            this.analyzeFlow();
            this.analyzeHilt();
            this.analyzeRoom();
            this.analyzeSecurity();
            this.analyzeCleanArchitecture();
            this.analyzeAntiPatterns();
            this.analyzeNullSafety();
            this.analyzeAdditionalRules();
        } catch (error) {
            // Silent fail
        }
    }

    extractImports() {
        this.imports = [];
        const importRegex = /^import\s+(.+)$/gm;
        let match;
        while ((match = importRegex.exec(this.content)) !== null) {
            const line = this.content.substring(0, match.index).split('\n').length;
            this.imports.push({ name: match[1].trim(), line });
        }
    }

    extractClasses() {
        const classes = [];
        const classRegex = /^(\s*)(data\s+|sealed\s+|abstract\s+|open\s+)?class\s+(\w+)(?:<[^>]+>)?\s*(?:\(([^)]*)\))?\s*(?::\s*([^{]+))?\s*\{?/gm;

        let match;
        while ((match = classRegex.exec(this.content)) !== null) {
            const lineNum = this.content.substring(0, match.index).split('\n').length;
            const body = this.extractBody(this.content, match.index);
            const methods = this.extractMethods(body);
            const properties = this.extractProperties(body);

            classes.push({
                name: match[3],
                line: lineNum,
                modifier: (match[2] || '').trim(),
                constructor: match[4] || '',
                inheritance: match[5] || '',
                methods,
                properties,
                bodyLength: body.split('\n').length,
                body,
            });
        }
        return classes;
    }

    extractBody(content, startIndex) {
        let braceCount = 0;
        let started = false;
        let body = '';

        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') { braceCount++; started = true; }
            else if (content[i] === '}') braceCount--;
            if (started) body += content[i];
            if (started && braceCount === 0) break;
        }
        return body;
    }

    extractMethods(body) {
        const methods = [];
        const funcRegex = /(?:override\s+)?(?:suspend\s+)?(?:private\s+|internal\s+|protected\s+)?fun\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^\s{=]+))?/g;

        let match;
        while ((match = funcRegex.exec(body)) !== null) {
            const funcBody = this.extractBody(body, match.index);
            methods.push({
                name: match[1],
                params: match[2],
                returnType: match[3] || 'Unit',
                bodyLength: funcBody.split('\n').length,
                body: funcBody,
                isSuspend: body.substring(Math.max(0, match.index - 20), match.index).includes('suspend'),
            });
        }
        return methods;
    }

    extractProperties(body) {
        const properties = [];
        const propRegex = /(?:private\s+|protected\s+|internal\s+|public\s+)?(?:val|var)\s+(\w+)\s*(?::\s*([^\s=]+))?/g;

        let match;
        while ((match = propRegex.exec(body)) !== null) {
            properties.push({ name: match[1], type: match[2] || 'inferred' });
        }
        return properties;
    }

    extractTopLevelFunctions() {
        const functions = [];
        const funcRegex = /^(?:private\s+|internal\s+)?(?:suspend\s+)?fun\s+(\w+)/gm;

        let match;
        while ((match = funcRegex.exec(this.content)) !== null) {
            const lineNum = this.content.substring(0, match.index).split('\n').length;
            const funcBody = this.extractBody(this.content, match.index);
            functions.push({
                name: match[1],
                line: lineNum,
                bodyLength: funcBody.split('\n').length,
                body: funcBody,
            });
        }
        return functions;
    }

    extractAnnotations() {
        const annotations = [];
        const annoRegex = /@(\w+)(?:\([^)]*\))?/g;

        let match;
        while ((match = annoRegex.exec(this.content)) !== null) {
            const line = this.content.substring(0, match.index).split('\n').length;
            annotations.push({ name: match[1], line });
        }
        return annotations;
    }

    // ===== SOLID & Architecture =====
    analyzeClasses() {
        for (const cls of this.classes) {
            // God class
            if (cls.methods.length > 15 || cls.properties.length > 10 || cls.bodyLength > 300) {
                this.pushFinding('android.solid.srp.god_class', 'critical', cls.line,
                    `God class '${cls.name}': ${cls.methods.length} methods, ${cls.properties.length} props - VIOLATES SRP`);
            }

            // Massive ViewModel
            if (cls.name.includes('ViewModel') && cls.bodyLength > 200) {
                this.pushFinding('android.architecture.massive_viewmodel', 'high', cls.line,
                    `Massive ViewModel '${cls.name}': ${cls.bodyLength} lines - extract to UseCases`);
            }

            // God naming
            if (/Manager$|Helper$|Utils$|Handler$/.test(cls.name)) {
                this.pushFinding('android.naming.god_naming', 'medium', cls.line,
                    `Suspicious name '${cls.name}' - often indicates SRP violation`);
            }

            // Unused properties (ISP)
            for (const prop of cls.properties) {
                let used = false;
                for (const m of cls.methods) {
                    if (new RegExp(`\\b${prop.name}\\b`).test(m.body)) { used = true; break; }
                }
                if (!used) {
                    this.pushFinding('android.solid.isp.unused_property', 'high', cls.line,
                        `Unused property '${prop.name}' in '${cls.name}' - ISP violation`);
                }
            }

            // DIP: concrete dependencies
            if (cls.name.includes('ViewModel') || cls.name.includes('UseCase')) {
                const params = cls.constructor.split(',').filter(p => p.trim());
                for (const p of params) {
                    const type = p.split(':')[1]?.trim();
                    if (type && /Impl$|Repository(?!Interface)|Service(?!Interface)/.test(type) && !type.includes('Interface')) {
                        this.pushFinding('android.solid.dip.concrete_dependency', 'high', cls.line,
                            `'${cls.name}' depends on concrete '${type}' - use interface`);
                    }
                }
            }

            // Fat protocol/interface (ISP)
            if (cls.modifier === 'abstract' || this.content.includes(`interface ${cls.name}`)) {
                if (cls.methods.length > 5) {
                    this.pushFinding('android.solid.isp.fat_interface', 'medium', cls.line,
                        `Interface '${cls.name}' has ${cls.methods.length} methods - consider splitting`);
                }
            }

            // Long functions
            for (const m of cls.methods) {
                if (m.bodyLength > 50) {
                    this.pushFinding('android.quality.long_function', 'high', cls.line,
                        `Function '${cls.name}.${m.name}' is ${m.bodyLength} lines - extract smaller functions`);
                }

                const complexity = this.calculateComplexity(m.body);
                if (complexity > 10) {
                    this.pushFinding('android.quality.high_complexity', 'high', cls.line,
                        `Function '${m.name}' has complexity ${complexity} - simplify`);
                }
            }

            // Repository no interface
            if (cls.name.includes('Repository') && !cls.name.includes('Impl')) {
                if (!cls.inheritance.includes('Repository')) {
                    this.pushFinding('android.architecture.repository_no_interface', 'high', cls.line,
                        `Repository '${cls.name}' should implement an interface`);
                }
            }

            // UseCase no execute
            if (cls.name.includes('UseCase')) {
                const hasExecute = cls.methods.some(m => /^(execute|invoke|run)$/.test(m.name));
                if (!hasExecute) {
                    this.pushFinding('android.architecture.usecase_no_execute', 'medium', cls.line,
                        `UseCase '${cls.name}' missing execute/invoke method`);
                }
            }
        }
    }

    // ===== Jetpack Compose =====
    analyzeCompose() {
        const hasComposable = this.annotations.some(a => a.name === 'Composable');
        if (!hasComposable) return;

        // mutableStateOf without remember
        if (this.content.includes('mutableStateOf') && !this.content.includes('remember')) {
            const line = this.findLine('mutableStateOf');
            this.pushFinding('android.compose.missing_remember', 'high', line,
                'mutableStateOf without remember - state resets on recomposition');
        }

        // Too many @State in one composable
        const stateCount = (this.content.match(/remember\s*\{/g) || []).length;
        if (stateCount > 5) {
            this.pushFinding('android.compose.too_many_state', 'medium', 1,
                `${stateCount} remember blocks - consider ViewModel for complex state`);
        }

        // Missing key in LazyColumn/LazyRow
        if (/Lazy(Column|Row|Grid)/.test(this.content)) {
            if (!/items\s*\([^)]*key\s*=/.test(this.content) && !/item\s*\(key\s*=/.test(this.content)) {
                const line = this.findLine('Lazy');
                this.pushFinding('android.compose.missing_key', 'high', line,
                    'LazyColumn/Row without key - causes recomposition issues');
            }
        }

        // derivedStateOf misuse
        if (this.content.includes('derivedStateOf') && !this.content.includes('remember { derivedStateOf')) {
            const line = this.findLine('derivedStateOf');
            this.pushFinding('android.compose.derivedstate_no_remember', 'high', line,
                'derivedStateOf should be wrapped in remember');
        }

        // Side effects outside LaunchedEffect
        for (const cls of this.classes) {
            for (const m of cls.methods) {
                if (m.body.includes('@Composable') || this.content.includes(`@Composable`)) {
                    if (m.body.includes('viewModel.') && !m.body.includes('LaunchedEffect') && !m.body.includes('SideEffect')) {
                        // Check for direct calls
                        if (/viewModel\.\w+\(/.test(m.body) && !/onClick|onValueChange/.test(m.body)) {
                            this.pushFinding('android.compose.side_effect_outside', 'medium', cls.line,
                                `Side effect in composable '${m.name}' - use LaunchedEffect`);
                        }
                    }
                }
            }
        }

        // Too many previews
        const previewCount = (this.content.match(/@Preview/g) || []).length;
        if (previewCount > 5) {
            this.pushFinding('android.compose.too_many_previews', 'low', 1,
                `${previewCount} @Preview - consider PreviewParameter`);
        }

        // Complex body (too many nested composables)
        const nestedDepth = (this.content.match(/\{\s*\n\s*@Composable|\{\s*@Composable/g) || []).length;
        if (nestedDepth > 10) {
            this.pushFinding('android.compose.complex_body', 'high', 1,
                'Complex composable hierarchy - extract subcomposables');
        }
    }

    // ===== Coroutines =====
    analyzeCoroutines() {
        // GlobalScope
        if (this.content.includes('GlobalScope')) {
            const line = this.findLine('GlobalScope');
            this.pushFinding('android.coroutines.global_scope', 'critical', line,
                'GlobalScope detected - use viewModelScope or lifecycleScope');
        }

        // runBlocking
        if (this.content.includes('runBlocking')) {
            const line = this.findLine('runBlocking');
            this.pushFinding('android.coroutines.run_blocking', 'critical', line,
                'runBlocking blocks thread - use suspend function');
        }

        // Dispatchers.Main without withContext
        if (/Dispatchers\.Main(?!\s*\))/.test(this.content) && !this.content.includes('withContext(Dispatchers.Main)')) {
            const line = this.findLine('Dispatchers.Main');
            this.pushFinding('android.coroutines.main_dispatcher', 'medium', line,
                'Dispatchers.Main used directly - prefer withContext');
        }

        // Missing error handling in launch
        if (/launch\s*\{/.test(this.content) && !/launch\s*\{[^}]*try/.test(this.content)) {
            if (!this.content.includes('CoroutineExceptionHandler') && !this.content.includes('supervisorScope')) {
                const line = this.findLine('launch');
                this.pushFinding('android.coroutines.missing_error_handling', 'high', line,
                    'launch without try-catch or CoroutineExceptionHandler');
            }
        }

        // async without await
        const asyncCount = (this.content.match(/async\s*\{/g) || []).length;
        const awaitCount = (this.content.match(/\.await\(\)/g) || []).length;
        if (asyncCount > 0 && awaitCount === 0) {
            const line = this.findLine('async');
            this.pushFinding('android.coroutines.async_no_await', 'high', line,
                'async without await - result is ignored');
        }
    }

    // ===== Flow =====
    analyzeFlow() {
        // Flow without catch
        if (/\.collect\s*\{/.test(this.content) && !this.content.includes('.catch')) {
            const line = this.findLine('.collect');
            this.pushFinding('android.flow.missing_catch', 'high', line,
                'Flow.collect without .catch - handle errors');
        }

        // stateIn without scope
        if (this.content.includes('stateIn') && !this.content.includes('viewModelScope') && !this.content.includes('lifecycleScope')) {
            const line = this.findLine('stateIn');
            this.pushFinding('android.flow.statein_no_scope', 'medium', line,
                'stateIn should use viewModelScope');
        }

        // MutableStateFlow exposed directly
        if (/val\s+\w+\s*=\s*MutableStateFlow/.test(this.content) && !/private\s+val/.test(this.content)) {
            const line = this.findLine('MutableStateFlow');
            this.pushFinding('android.flow.mutable_exposed', 'high', line,
                'MutableStateFlow should be private - expose as StateFlow');
        }

        // collectAsState without lifecycle
        if (this.content.includes('collectAsState') && !this.content.includes('collectAsStateWithLifecycle')) {
            const line = this.findLine('collectAsState');
            this.pushFinding('android.flow.collect_no_lifecycle', 'medium', line,
                'Use collectAsStateWithLifecycle for lifecycle-awareness');
        }
    }

    // ===== Hilt DI =====
    analyzeHilt() {
        const hasHiltViewModel = this.annotations.some(a => a.name === 'HiltViewModel');
        const hasInject = this.annotations.some(a => a.name === 'Inject');

        for (const cls of this.classes) {
            // ViewModel without @HiltViewModel
            if (cls.name.includes('ViewModel') && cls.constructor.length > 0) {
                if (!hasHiltViewModel && !hasInject) {
                    this.pushFinding('android.hilt.missing_annotation', 'high', cls.line,
                        `ViewModel '${cls.name}' needs @HiltViewModel and @Inject constructor`);
                }
            }

            // @Singleton overuse
            if (this.content.includes('@Singleton') && !this.filePath.includes('Module')) {
                const line = this.findLine('@Singleton');
                this.pushFinding('android.hilt.singleton_overuse', 'medium', line,
                    '@Singleton should only be in @Module - use scoped annotations');
            }
        }

        // Missing @AndroidEntryPoint
        if (this.content.includes('class') && this.content.includes('Activity') || this.content.includes('Fragment')) {
            if (!this.annotations.some(a => a.name === 'AndroidEntryPoint')) {
                this.pushFinding('android.hilt.missing_entry_point', 'high', 1,
                    'Activity/Fragment needs @AndroidEntryPoint for Hilt injection');
            }
        }
    }

    // ===== Room Database =====
    analyzeRoom() {
        const hasEntity = this.annotations.some(a => a.name === 'Entity');
        const hasDao = this.annotations.some(a => a.name === 'Dao');

        if (hasEntity) {
            // Entity without primary key
            if (!this.content.includes('@PrimaryKey')) {
                this.pushFinding('android.room.missing_primary_key', 'critical', 1,
                    '@Entity without @PrimaryKey');
            }

            // Missing index for frequently queried columns
            if (!this.content.includes('@Index') && this.content.includes('@ColumnInfo')) {
                this.pushFinding('android.room.missing_index', 'low', 1,
                    'Consider @Index for frequently queried columns');
            }
        }

        if (hasDao) {
            // DAO returning non-Flow for queries
            if (/@Query.*SELECT/.test(this.content) && !this.content.includes('Flow<') && !this.content.includes('suspend fun')) {
                const line = this.findLine('@Query');
                this.pushFinding('android.room.query_not_reactive', 'medium', line,
                    'DAO query should return Flow<T> or be suspend fun');
            }

            // Missing @Transaction for multiple operations
            if ((this.content.match(/@(Insert|Update|Delete)/g) || []).length > 1) {
                if (!this.content.includes('@Transaction')) {
                    this.pushFinding('android.room.missing_transaction', 'high', 1,
                        'Multiple DB operations without @Transaction');
                }
            }
        }
    }

    // ===== Security =====
    analyzeSecurity() {
        // Hardcoded secrets
        const secretPattern = /(api_?key|secret|password|token)\s*[:=]\s*["']([^"']{8,})["']/gi;
        let match;
        while ((match = secretPattern.exec(this.content)) !== null) {
            const value = match[2];
            if (!/placeholder|example|test|mock|fake|your-|xxx/i.test(value)) {
                const line = this.content.substring(0, match.index).split('\n').length;
                this.pushFinding('android.security.hardcoded_secret', 'critical', line,
                    'Hardcoded secret - use BuildConfig or secrets-gradle-plugin');
            }
        }

        // SharedPreferences for sensitive data
        if (this.content.includes('SharedPreferences') && /password|token|secret/i.test(this.content)) {
            const line = this.findLine('SharedPreferences');
            this.pushFinding('android.security.sensitive_in_prefs', 'critical', line,
                'Sensitive data in SharedPreferences - use EncryptedSharedPreferences');
        }

        // HTTP without HTTPS
        if (/http:\/\/(?!localhost|127\.0\.0\.1|10\.)/.test(this.content)) {
            const line = this.findLine('http://');
            this.pushFinding('android.security.http_cleartext', 'critical', line,
                'HTTP cleartext traffic - use HTTPS');
        }

        // Log with sensitive data
        if (/Log\.[diewv]\([^)]*(?:password|token|secret)/i.test(this.content)) {
            const line = this.findLine('Log.');
            this.pushFinding('android.security.log_sensitive', 'critical', line,
                'Logging sensitive data - remove before production');
        }
    }

    // ===== Clean Architecture =====
    analyzeCleanArchitecture() {
        const pathLower = this.filePath.toLowerCase();

        // Domain importing data/presentation
        if (pathLower.includes('/domain/')) {
            const forbiddenImports = ['retrofit', 'room', 'compose', 'android.view', 'android.widget'];
            for (const imp of this.imports) {
                for (const forbidden of forbiddenImports) {
                    if (imp.name.toLowerCase().includes(forbidden)) {
                        this.pushFinding('android.architecture.domain_violation', 'critical', imp.line,
                            `Domain layer importing ${forbidden} - violates Clean Architecture`);
                    }
                }
            }
        }

        // Data layer exposing entities
        if (pathLower.includes('/data/') && pathLower.includes('repository')) {
            for (const cls of this.classes) {
                for (const m of cls.methods) {
                    if (m.returnType && /Entity$|Dto$/.test(m.returnType)) {
                        this.pushFinding('android.architecture.data_exposes_entity', 'high', cls.line,
                            `Repository '${cls.name}.${m.name}' returns ${m.returnType} - return domain model`);
                    }
                }
            }
        }

        // Presentation importing data directly
        if (pathLower.includes('/presentation/') || pathLower.includes('/ui/')) {
            for (const imp of this.imports) {
                if (imp.name.includes('.data.') && !imp.name.includes('.domain.')) {
                    this.pushFinding('android.architecture.presentation_imports_data', 'high', imp.line,
                        'Presentation imports data layer directly - use domain layer');
                }
            }
        }
    }

    // ===== Anti-patterns =====
    analyzeAntiPatterns() {
        // Java collections
        if (this.imports.some(i => /java\.util\.(ArrayList|HashMap|HashSet)/.test(i.name))) {
            this.pushFinding('android.kotlin.java_collections', 'low', 1,
                'Java collections imported - use Kotlin collections');
        }

        // android.util.Log instead of Timber
        if (this.imports.some(i => i.name.includes('android.util.Log'))) {
            this.pushFinding('android.logging.android_log', 'medium', 1,
                'android.util.Log - use Timber for logging');
        }

        // AsyncTask (deprecated)
        if (this.content.includes('AsyncTask')) {
            const line = this.findLine('AsyncTask');
            this.pushFinding('android.deprecated.asynctask', 'critical', line,
                'AsyncTask is deprecated - use Coroutines');
        }

        // RxJava in new code
        if (this.imports.some(i => i.name.includes('io.reactivex'))) {
            this.pushFinding('android.deprecated.rxjava', 'medium', 1,
                'RxJava detected - prefer Kotlin Flow for new code');
        }

        // findViewById
        if (this.content.includes('findViewById')) {
            const line = this.findLine('findViewById');
            this.pushFinding('android.deprecated.findviewbyid', 'medium', line,
                'findViewById - use View Binding or Compose');
        }

        // XML layouts imported
        if (this.content.includes('R.layout.')) {
            const line = this.findLine('R.layout');
            this.pushFinding('android.deprecated.xml_layout', 'low', line,
                'XML layout - consider Jetpack Compose');
        }

        // Callback hell (nested callbacks)
        const callbackDepth = (this.content.match(/\{\s*\n[^}]*\{\s*\n[^}]*\{/g) || []).length;
        if (callbackDepth > 3) {
            this.pushFinding('android.antipattern.callback_hell', 'high', 1,
                'Nested callbacks detected - use Coroutines');
        }
    }

    // ===== Null Safety =====
    analyzeNullSafety() {
        // Force unwrap (!!)
        const forceUnwrapCount = (this.content.match(/!!/g) || []).length;
        if (forceUnwrapCount > 0) {
            const line = this.findLine('!!');
            this.pushFinding('android.nullsafety.force_unwrap', 'high', line,
                `${forceUnwrapCount} force unwrap (!!) - use ?, ?:, let, or requireNotNull`);
        }

        // lateinit var without isInitialized check
        if (this.content.includes('lateinit var')) {
            if (!this.content.includes('::') || !this.content.includes('.isInitialized')) {
                const line = this.findLine('lateinit');
                this.pushFinding('android.nullsafety.lateinit_unchecked', 'medium', line,
                    'lateinit var without isInitialized check');
            }
        }

        // Unsafe cast (as Type instead of as? Type)
        const unsafeCasts = this.content.match(/\bas\s+(?![\?\s])\w+/g) || [];
        if (unsafeCasts.length > 0) {
            const line = this.findLine(' as ');
            this.pushFinding('android.nullsafety.unsafe_cast', 'medium', line,
                `${unsafeCasts.length} unsafe casts - use 'as?' for safe casting`);
        }
    }

    // ===== Import Rules =====
    analyzeImportsRules() {
        const importedClasses = this.imports.map(i => i.name.split('.').pop()).filter(Boolean);
        const bodyWithoutImports = this.content.replace(/^import\s+.+$/gm, '');

        for (const cls of importedClasses) {
            if (cls && !bodyWithoutImports.includes(cls)) {
                this.pushFinding('android.imports.unused', 'low', 1, `Unused import: ${cls}`);
            }
        }
    }

    // ===== Additional Rules from rulesandroid.mdc =====
    analyzeAdditionalRules() {
        // Sealed class for states (UiState pattern)
        if (this.content.includes('UiState') || this.content.includes('ViewState')) {
            if (!this.content.includes('sealed class') && !this.content.includes('sealed interface')) {
                const line = this.findLine('UiState') || this.findLine('ViewState');
                this.pushFinding('android.architecture.state_not_sealed', 'medium', line,
                    'UiState should be sealed class/interface for exhaustive when');
            }
        }

        // Data class for DTOs
        for (const cls of this.classes) {
            if (/Dto$|DTO$|Response$|Request$/.test(cls.name) && cls.modifier !== 'data') {
                this.pushFinding('android.kotlin.dto_not_data_class', 'medium', cls.line,
                    `'${cls.name}' should be data class for DTOs`);
            }
        }

        // rememberSaveable for surviving process death
        if (this.content.includes('remember {') && this.content.includes('mutableStateOf')) {
            if (!this.content.includes('rememberSaveable')) {
                const line = this.findLine('remember {');
                this.pushFinding('android.compose.consider_saveable', 'low', line,
                    'Consider rememberSaveable to survive process death');
            }
        }

        // LaunchedEffect without key
        if (/LaunchedEffect\s*\(\s*\)/.test(this.content) || /LaunchedEffect\s*\{\s*\}/.test(this.content)) {
            const line = this.findLine('LaunchedEffect');
            this.pushFinding('android.compose.launchedeffect_no_key', 'high', line,
                'LaunchedEffect without key - will run on every recomposition');
        }

        // DisposableEffect missing onDispose
        if (this.content.includes('DisposableEffect') && !this.content.includes('onDispose')) {
            const line = this.findLine('DisposableEffect');
            this.pushFinding('android.compose.disposable_no_ondispose', 'high', line,
                'DisposableEffect without onDispose - cleanup required');
        }

        // Modifier order matters
        if (/\.background\([^)]+\)\.padding/.test(this.content)) {
            const line = this.findLine('.background');
            this.pushFinding('android.compose.modifier_order', 'medium', line,
                'Modifier order: padding before background for correct visual');
        }

        // WorkManager for background tasks
        if (this.content.includes('Thread(') || this.content.includes('Executors.')) {
            const line = this.findLine('Thread(') || this.findLine('Executors.');
            this.pushFinding('android.deprecated.raw_threads', 'high', line,
                'Raw threads - use WorkManager or Coroutines for background work');
        }

        // DataStore instead of SharedPreferences
        if (this.content.includes('SharedPreferences') && !this.content.includes('EncryptedSharedPreferences')) {
            const line = this.findLine('SharedPreferences');
            this.pushFinding('android.deprecated.sharedprefs', 'low', line,
                'SharedPreferences - consider DataStore for new code');
        }

        // Paging 3 for large lists
        if (/LazyColumn|LazyRow/.test(this.content) && this.content.includes('.size > 50')) {
            const line = this.findLine('LazyColumn') || this.findLine('LazyRow');
            this.pushFinding('android.performance.consider_paging', 'low', line,
                'Large list - consider Paging 3 for better performance');
        }

        // Coil/Glide for images
        if (this.content.includes('BitmapFactory') || this.content.includes('Bitmap.create')) {
            const line = this.findLine('Bitmap');
            this.pushFinding('android.performance.manual_bitmap', 'medium', line,
                'Manual bitmap handling - use Coil or Glide for caching');
        }

        // Context leak
        if (/private\s+(val|var)\s+\w+\s*:\s*Context/.test(this.content) && !this.filePath.includes('Application')) {
            const line = this.findLine(': Context');
            this.pushFinding('android.memory.context_leak', 'critical', line,
                'Storing Context reference - potential memory leak');
        }

        // ProGuard/R8 rules check
        if (this.content.includes('@SerializedName') && !this.content.includes('@Keep')) {
            const line = this.findLine('@SerializedName');
            this.pushFinding('android.proguard.missing_keep', 'medium', line,
                '@SerializedName without @Keep - may be stripped by R8');
        }

        // Accessibility - contentDescription
        if (/Image\s*\(|Icon\s*\(/.test(this.content)) {
            if (!this.content.includes('contentDescription')) {
                const line = this.findLine('Image(') || this.findLine('Icon(');
                this.pushFinding('android.accessibility.missing_content_description', 'medium', line,
                    'Image/Icon without contentDescription - add for TalkBack');
            }
        }

        // Touch target size
        if (/\.size\s*\(\s*\d+\.dp\s*\)/.test(this.content)) {
            const sizeMatch = this.content.match(/\.size\s*\(\s*(\d+)\.dp\s*\)/);
            if (sizeMatch && parseInt(sizeMatch[1]) < 48) {
                const line = this.findLine('.size(');
                this.pushFinding('android.accessibility.small_touch_target', 'medium', line,
                    `Touch target ${sizeMatch[1]}dp < 48dp minimum`);
            }
        }

        // Hardcoded strings (i18n)
        const hardcodedStrings = this.content.match(/Text\s*\(\s*"[^"]{10,}"\s*\)/g) || [];
        if (hardcodedStrings.length > 3) {
            this.pushFinding('android.i18n.hardcoded_strings', 'medium', 1,
                `${hardcodedStrings.length} hardcoded strings - use stringResource()`);
        }

        // Version catalog usage
        if (this.filePath.includes('build.gradle') && this.content.includes('implementation "')) {
            this.pushFinding('android.gradle.no_version_catalog', 'low', 1,
                'Direct dependency declaration - use libs.versions.toml');
        }

        // Detekt/Lint suppressions
        const suppressCount = (this.content.match(/@Suppress|@SuppressLint/g) || []).length;
        if (suppressCount > 3) {
            this.pushFinding('android.quality.too_many_suppressions', 'medium', 1,
                `${suppressCount} lint suppressions - fix issues instead of suppressing`);
        }
    }

    // ===== Helpers =====
    calculateComplexity(body) {
        let complexity = 1;
        const patterns = [/\bif\s*\(/g, /\belse\s+if\s*\(/g, /\bwhen\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bcatch\s*\(/g, /\?\./g, /\?:/g, /&&/g, /\|\|/g];
        for (const p of patterns) complexity += (body.match(p) || []).length;
        return complexity;
    }

    findLine(text) {
        const idx = this.content.indexOf(text);
        if (idx === -1) return 1;
        return this.content.substring(0, idx).split('\n').length;
    }

    pushFinding(ruleId, severity, line, message) {
        this.findings.push({
            ruleId,
            severity: severity.toUpperCase(),
            filePath: this.filePath,
            line,
            column: 1,
            message,
        });
    }
}

module.exports = { AndroidASTIntelligentAnalyzer };
