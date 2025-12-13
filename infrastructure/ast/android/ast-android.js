// ===== AST ANDROID MODULE =====
// Android-specific AST intelligence rules
// Clean Architecture: Infrastructure Layer - Android AST Analysis

const path = require('path');
const glob = require('glob');
const { pushFinding, mapToLevel, SyntaxKind, platformOf } = require(path.join(__dirname, '../ast-core'));
const { analyzeAndroidFiles: runDetektAnalysis } = require(path.join(__dirname, './detekt-runner'));
const { AndroidSOLIDAnalyzer } = require(path.join(__dirname, 'analyzers/AndroidSOLIDAnalyzer'));
const { AndroidForbiddenLiteralsAnalyzer } = require(path.join(__dirname, 'analyzers/AndroidForbiddenLiteralsAnalyzer'));
const { AndroidASTIntelligentAnalyzer } = require(path.join(__dirname, 'analyzers/AndroidASTIntelligentAnalyzer'));
const { AndroidArchitectureDetector } = require(path.join(__dirname, 'analyzers/AndroidArchitectureDetector'));

/**
 * Run Android-specific AST intelligence analysis
 * @param {Project} project - TypeScript morph project
 * @param {Array} findings - Findings array to populate
 * @param {string} platform - Platform identifier
 */
function runAndroidIntelligence(project, findings, platform) {
  // STEP 0: Run Kotlin AST Intelligent Analyzer (PRIORITY)
  console.log(`[Android AST Intelligence] Running Kotlin AST analysis...`);
  const astAnalyzer = new AndroidASTIntelligentAnalyzer(findings);
  const { getRepoRoot } = require(path.join(__dirname, '../ast-core'));
  const root = getRepoRoot();
  const kotlinFiles = glob.sync('**/*.kt', {
    cwd: root,
    ignore: ['**/node_modules/**', '**/build/**', '**/.gradle/**'],
    absolute: true,
  });

  for (const kotlinFile of kotlinFiles) {
    astAnalyzer.analyzeFile(kotlinFile);
  }
  console.log(`[Android AST Intelligence] Analyzed ${kotlinFiles.length} Kotlin files with AST`);

  // STEP 1: Detect Architecture Pattern
  if (kotlinFiles.length > 0) {
    try {
      const architectureDetector = new AndroidArchitectureDetector(root);
      const detectedPattern = architectureDetector.detect();
      const detectionSummary = architectureDetector.getDetectionSummary();

      console.log(`[Android Architecture] Pattern detected: ${detectedPattern} (confidence: ${detectionSummary.confidence}%)`);

      // Log warnings if any
      if (detectionSummary.warnings.length > 0) {
        detectionSummary.warnings.forEach(warning => {
          pushFinding('android.architecture.detection_warning', warning.severity.toLowerCase(), null, null, warning.message + '\n\n' + warning.recommendation, findings);
        });
      }
    } catch (error) {
      console.error('[Android Architecture] Error during architecture detection:', error.message);
    }
  }

  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();

    // Skip if not Android platform
    if (platformOf(filePath) !== "android") return;

    // Skip AST infrastructure files (avoid self-analysis - they contain patterns that trigger rules)
    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const text = call.getExpression().getText();

      // Android: Security - hardcoded secrets
      if (text.includes("password") || text.includes("token") || text.includes("secret") || text.includes("key") || text.includes("api_key")) {
        if (!sf.getFullText().includes("BuildConfig") && !sf.getFullText().includes("EncryptedSharedPreferences") && !sf.getFullText().includes("Keystore")) {
          pushFinding("android.hardcoded_secrets", "critical", sf, call, "Hardcoded sensitive data - use EncryptedSharedPreferences, Keystore, or BuildConfig", findings);
        }
      }

      // Android: Force unwrapping
      if (text.includes("!!")) {
        pushFinding("android.force_unwrapping", "critical", sf, call, "Force unwrapping (!) detected - use safe calls or null checks", findings);
      }

      // Android: Java code in new files
      if (filePath.endsWith(".java") && !filePath.includes("legacy") && !filePath.includes("old")) {
        pushFinding("android.java_code", "critical", sf, sf, "Java file detected - use Kotlin for new development", findings);
      }

      // Android: XML layouts
      if (filePath.includes("layout") && filePath.endsWith(".xml")) {
        pushFinding("android.xml_layouts", "critical", sf, sf, "XML layout detected - use Jetpack Compose for new UIs", findings);
      }

      // Android: Singletons
      if (text.includes("Singleton") || text.includes("INSTANCE") || text.includes("getInstance()")) {
        pushFinding("android.singletons", "critical", sf, call, "Singleton pattern detected - use dependency injection instead", findings);
      }

      // Android: Context leaks
      if (text.includes("this@") || text.includes("context") && (text.includes("static") || text.includes("companion"))) {
        pushFinding("android.context_leaks", "critical", sf, call, "Potential context leak - avoid storing context in static fields", findings);
      }

      // Kotlin specific checks
      if (filePath.endsWith(".kt")) {
        // Null safety
        if (text.includes("Any?") || text.includes("Any!") || text.includes("as?")) {
          pushFinding("android.missing_null_safety", "high", sf, call, "Unsafe null handling - leverage Kotlin's null safety", findings);
        }

        // Missing composable
        if (text.includes("@Composable") && !sf.getFullText().includes("@Preview")) {
          const hasPreview = sf.getDescendantsOfKind(SyntaxKind.Decorator).some(d =>
            d.expression?.expression?.escapedText === "Preview"
          );
          if (!hasPreview) {
            pushFinding("android.missing_composable", "high", sf, call, "Composable without @Preview - add previews for better development", findings);
          }
        }

        // Side effects in composable
        if (text.includes("@Composable") && (text.includes("LaunchedEffect") || text.includes("DisposableEffect"))) {
          if (!text.includes("key") || text.includes("Unit")) {
            pushFinding("android.side_effects_composable", "medium", sf, call, "Composable with side effects - specify proper keys for LaunchedEffect/DisposableEffect", findings);
          }
        }

        // Missing entity
        if (text.includes("@Entity") && !sf.getFullText().includes("data class")) {
          pushFinding("android.missing_entity", "medium", sf, call, "Entity not using data class - Room entities should be data classes", findings);
        }

        // Missing ViewModel
        if (text.includes("ViewModel") && !sf.getFullText().includes("androidx.lifecycle.ViewModel")) {
          pushFinding("android.missing_viewmodel", "high", sf, call, "Custom ViewModel without extending androidx.lifecycle.ViewModel", findings);
        }

        // Missing JUnit5
        if (filePath.includes("test") && !sf.getFullText().includes("org.junit.jupiter")) {
          pushFinding("android.missing_junit5", "high", sf, sf, "Test file not using JUnit5 - prefer JUnit5 over JUnit4", findings);
        }
      }

      // Android specific patterns
      if (text.includes("findViewById")) {
        pushFinding("android.findviewbyid", "high", sf, call, "findViewById usage - use View Binding or Compose instead", findings);
      }

      if (text.includes("AsyncTask")) {
        pushFinding("android.asynctask", "high", sf, call, "AsyncTask usage - deprecated, use Coroutines instead", findings);
      }

      if (text.includes("startActivity") && !text.includes("Intent")) {
        pushFinding("android.startactivity", "medium", sf, call, "Direct activity navigation - consider Navigation Component", findings);
      }

      if (text.includes("SharedPreferences") && !text.includes("Encrypted")) {
        pushFinding("android.sharedpreferences", "medium", sf, call, "Plain SharedPreferences - use EncryptedSharedPreferences for sensitive data", findings);
      }

      if (text.includes("Handler") && text.includes("postDelayed")) {
        pushFinding("android.handler_leak", "medium", sf, call, "Handler potential leak - use weak references or ViewModel scope", findings);
      }

      if (text.includes("Thread") || text.includes("Runnable")) {
        pushFinding("android.raw_threads", "medium", sf, call, "Raw threads - prefer Coroutines for concurrency", findings);
      }

      if (text.includes("LiveData") && !text.includes("observe")) {
        pushFinding("android.livedata_observe", "low", sf, call, "LiveData not observed - ensure LiveData is observed in UI", findings);
      }

      if (text.includes("Flow") && !text.includes("collect")) {
        pushFinding("android.flow_collect", "low", sf, call, "Flow not collected - Flows need to be collected to emit values", findings);
      }

      if (text.includes("suspend") && !text.includes("viewModelScope") && !text.includes("lifecycleScope")) {
        pushFinding("android.suspend_scope", "medium", sf, call, "Suspend function without proper scope - use viewModelScope or lifecycleScope", findings);
      }

      if (text.includes("MutableLiveData") && text.includes("public")) {
        pushFinding("android.mutable_exposure", "medium", sf, call, "Mutable LiveData exposed publicly - expose only immutable LiveData", findings);
      }

      if (text.includes("data class") && text.includes("var")) {
        pushFinding("android.data_class_var", "low", sf, call, "Data class with var properties - prefer val for immutable data", findings);
      }

      if (text.includes("sealed class") && !text.includes("when")) {
        pushFinding("android.sealed_when", "low", sf, call, "Sealed class without exhaustive when - use when for sealed classes", findings);
      }

      if (text.includes("enum class") && !text.includes("companion object")) {
        pushFinding("android.enum_companion", "low", sf, call, "Enum without companion object - consider adding utility functions", findings);
      }

      if (text.includes("inline") && text.includes("reified")) {
        pushFinding("android.inline_reified", "low", sf, call, "Inline reified function - good for type-safe generics", findings);
      }

      if (text.includes("@SuppressLint")) {
        pushFinding("android.suppress_lint", "medium", sf, call, "@SuppressLint usage - avoid suppressing lint warnings, fix the issues instead", findings);
      }

      if (text.includes("lateinit") && !text.includes("private")) {
        pushFinding("android.lateinit_visibility", "medium", sf, call, "Public lateinit property - prefer private lateinit with public getter", findings);
      }

      if (text.includes("by lazy") && text.includes("public")) {
        pushFinding("android.lazy_public", "low", sf, call, "Public lazy property - ensure thread safety if accessed from multiple threads", findings);
      }

      if (text.includes("companion object") && text.includes("const val")) {
        pushFinding("android.companion_const", "low", sf, call, "Companion object constants - good practice for static constants", findings);
      }

      if (text.includes("operator fun")) {
        pushFinding("android.operator_overload", "low", sf, call, "Operator overloading - use judiciously for clarity", findings);
      }

      if (text.includes("init") && text.includes("block")) {
        pushFinding("android.init_block", "low", sf, call, "Init block usage - prefer primary constructor for simple initialization", findings);
      }

      if (text.includes("typealias")) {
        pushFinding("android.typealias", "low", sf, call, "Typealias usage - good for simplifying complex types", findings);
      }

      if (text.includes("@Parcelize")) {
        pushFinding("android.parcelize", "low", sf, call, "Parcelize usage - good for passing data between components", findings);
      }

      if (text.includes("remember") && !text.includes("key")) {
        pushFinding("android.remember_key", "medium", sf, call, "Remember without key - provide keys for proper recomposition", findings);
      }

      if (text.includes("derivedStateOf") && !text.includes("remember")) {
        pushFinding("android.derived_state", "low", sf, call, "Derived state - good for computed values from state", findings);
      }

      if (text.includes("LaunchedEffect") && text.includes("Unit")) {
        pushFinding("android.launched_effect", "medium", sf, call, "LaunchedEffect with Unit key - may restart unnecessarily", findings);
      }

      if (text.includes("DisposableEffect") && !text.includes("onDispose")) {
        pushFinding("android.disposable_effect", "medium", sf, call, "DisposableEffect without onDispose - add cleanup logic", findings);
      }

      if (text.includes("Modifier") && text.includes("then")) {
        pushFinding("android.modifier_chain", "low", sf, call, "Modifier chaining - good practice for composable styling", findings);
      }

      if (text.includes("@Preview") && !text.includes("name")) {
        pushFinding("android.preview_name", "low", sf, call, "Preview without name - add descriptive names for better organization", findings);
      }

      if (text.includes("Scaffold") && !text.includes("content")) {
        pushFinding("android.scaffold_usage", "low", sf, call, "Scaffold usage - good for Material Design structure", findings);
      }

      if (text.includes("Column") || text.includes("Row")) {
        pushFinding("android.layout_composables", "low", sf, call, "Layout composables - good for structuring UI", findings);
      }

      if (text.includes("LazyColumn") || text.includes("LazyRow")) {
        pushFinding("android.lazy_lists", "low", sf, call, "Lazy lists - good for performance with large datasets", findings);
      }

      if (text.includes("ViewModel") && text.includes("factory")) {
        pushFinding("android.viewmodel_factory", "low", sf, call, "ViewModel factory - good for dependency injection in ViewModels", findings);
      }

      if (text.includes("HiltViewModel")) {
        pushFinding("android.hilt_viewmodel", "low", sf, call, "Hilt ViewModel - good for DI in ViewModels", findings);
      }

      if (text.includes("@Inject")) {
        pushFinding("android.hilt_injection", "low", sf, call, "Hilt injection - good dependency injection practice", findings);
      }

      if (text.includes("@Module")) {
        pushFinding("android.hilt_module", "low", sf, call, "Hilt module - good for providing dependencies", findings);
      }

      if (text.includes("@Provides")) {
        pushFinding("android.provides", "low", sf, call, "@Provides - good for providing third-party or interface implementations", findings);
      }

      if (text.includes("@Binds")) {
        pushFinding("android.binds", "low", sf, call, "@Binds - good for binding interfaces to implementations", findings);
      }

      if (text.includes("@Singleton")) {
        pushFinding("android.singleton_scope", "low", sf, call, "Singleton scope - appropriate for application-wide dependencies", findings);
      }

      if (text.includes("@ViewModelScoped")) {
        pushFinding("android.viewmodel_scoped", "low", sf, call, "ViewModel scoped - good for ViewModel-specific dependencies", findings);
      }

      if (text.includes("Retrofit")) {
        pushFinding("android.retrofit_usage", "low", sf, call, "Retrofit usage - good REST client", findings);
      }

      if (text.includes("suspend") && text.includes("Retrofit")) {
        pushFinding("android.suspend_functions", "low", sf, call, "Suspend functions with Retrofit - good for async networking", findings);
      }

      if (text.includes("OkHttp")) {
        pushFinding("android.okhttp", "low", sf, call, "OkHttp usage - good HTTP client with interceptors", findings);
      }

      if (text.includes("Moshi") || text.includes("Gson")) {
        pushFinding("android.json_serialization", "low", sf, call, "JSON serialization - good for parsing API responses", findings);
      }

      if (text.includes("Room")) {
        pushFinding("android.room_usage", "low", sf, call, "Room usage - good type-safe SQLite wrapper", findings);
      }

      if (text.includes("@Dao")) {
        pushFinding("android.dao_pattern", "low", sf, call, "DAO pattern - good for data access abstraction", findings);
      }

      if (text.includes("@Query") || text.includes("@Insert") || text.includes("@Update") || text.includes("@Delete")) {
        pushFinding("android.room_annotations", "low", sf, call, "Room annotations - good for defining database operations", findings);
      }

      if (text.includes("Flow") && text.includes("Room")) {
        pushFinding("android.room_flow", "low", sf, call, "Room with Flow - good for reactive database queries", findings);
      }

      if (text.includes("WorkManager")) {
        pushFinding("android.work_manager", "low", sf, call, "WorkManager usage - good for background tasks", findings);
      }

      if (text.includes("StateFlow") || text.includes("SharedFlow")) {
        pushFinding("android.state_flow", "low", sf, call, "State/SharedFlow usage - good for reactive state management", findings);
      }

      if (text.includes("collectAsState")) {
        pushFinding("android.collect_state", "low", sf, call, "collectAsState - good for observing flows in Compose", findings);
      }

      if (text.includes("stateIn")) {
        pushFinding("android.state_in", "low", sf, call, "stateIn operator - good for converting cold flows to hot StateFlows", findings);
      }

      if (text.includes("combine")) {
        pushFinding("android.combine", "low", sf, call, "Combine operator - good for combining multiple flows", findings);
      }

      if (text.includes("flatMapLatest")) {
        pushFinding("android.flatmap_latest", "low", sf, call, "flatMapLatest - good for switching between flows", findings);
      }

      if (text.includes("JUnit5") || text.includes("jupiter")) {
        pushFinding("android.junit5", "low", sf, call, "JUnit5 usage - good modern testing framework", findings);
      }

      if (text.includes("MockK")) {
        pushFinding("android.mockk", "low", sf, call, "MockK usage - good mocking library for Kotlin", findings);
      }

      if (text.includes("Turbine")) {
        pushFinding("android.turbine", "low", sf, call, "Turbine - good for testing flows", findings);
      }

      if (text.includes("ComposeTestRule")) {
        pushFinding("android.compose_testing", "low", sf, call, "Compose testing - good for UI testing", findings);
      }

      if (text.includes("Robolectric")) {
        pushFinding("android.robolectric", "low", sf, call, "Robolectric - good for testing Android framework code", findings);
      }

      if (text.includes("Truth")) {
        pushFinding("android.truth_assertions", "low", sf, call, "Truth assertions - good for readable test assertions", findings);
      }

      if (text.includes("Coil")) {
        pushFinding("android.coil", "low", sf, call, "Coil usage - good async image loading for Compose", findings);
      }

      if (text.includes("Paging")) {
        pushFinding("android.paging", "low", sf, call, "Paging library - good for handling large datasets", findings);
      }

      if (text.includes("Navigation")) {
        pushFinding("android.navigation", "low", sf, call, "Navigation component - good for app navigation", findings);
      }

      if (text.includes("DataStore")) {
        pushFinding("android.datastore", "low", sf, call, "DataStore - good modern replacement for SharedPreferences", findings);
      }

      if (text.includes("BiometricPrompt")) {
        pushFinding("android.biometric", "low", sf, call, "Biometric authentication - good for secure user authentication", findings);
      }

      if (text.includes("SafetyNet")) {
        pushFinding("android.safetynet", "low", sf, call, "SafetyNet - good for device integrity checks", findings);
      }

      if (text.includes("LeakCanary")) {
        pushFinding("android.leakcanary", "low", sf, call, "LeakCanary - good for detecting memory leaks", findings);
      }

      if (text.includes("BaselineProfile")) {
        pushFinding("android.baseline_profile", "low", sf, call, "Baseline profiles - good for app startup optimization", findings);
      }

      if (text.includes("Kotlin DSL")) {
        pushFinding("android.kotlin_dsl", "low", sf, call, "Kotlin DSL for Gradle - good for type-safe build scripts", findings);
      }

      if (text.includes("version catalogs")) {
        pushFinding("android.version_catalogs", "low", sf, call, "Version catalogs - good for centralized dependency management", findings);
      }

      if (text.includes("buildSrc")) {
        pushFinding("android.buildsrc", "low", sf, call, "buildSrc - good for shared build logic", findings);
      }

      if (text.includes("product flavors")) {
        pushFinding("android.product_flavors", "low", sf, call, "Product flavors - good for different app variants", findings);
      }

      if (text.includes("build variants")) {
        pushFinding("android.build_variants", "low", sf, call, "Build variants - good for different build configurations", findings);
      }

      if (text.includes("Detekt")) {
        pushFinding("android.detekt", "low", sf, call, "Detekt - good static analysis for Kotlin", findings);
      }

      if (text.includes("Firebase App Distribution")) {
        pushFinding("android.firebase_distribution", "low", sf, call, "Firebase App Distribution - good for beta testing", findings);
      }

      if (text.includes("Play Console")) {
        pushFinding("android.play_console", "low", sf, call, "Play Console - good for production deployments", findings);
      }

      if (text.includes("Timber")) {
        pushFinding("android.timber", "low", sf, call, "Timber - good logging library", findings);
      }

      if (text.includes("Crashlytics")) {
        pushFinding("android.crashlytics", "low", sf, call, "Crashlytics - good for crash reporting", findings);
      }

      if (text.includes("Analytics")) {
        pushFinding("android.analytics", "low", sf, call, "Analytics - good for user behavior tracking", findings);
      }

      if (text.includes("strings.xml")) {
        pushFinding("android.strings_xml", "low", sf, call, "strings.xml usage - good for localization", findings);
      }

      if (text.includes("plurals")) {
        pushFinding("android.plurals", "low", sf, call, "Plurals support - good for proper pluralization", findings);
      }

      if (text.includes("DateFormat")) {
        pushFinding("android.date_format", "low", sf, call, "DateFormat - good for localized date formatting", findings);
      }

      if (text.includes("NumberFormat")) {
        pushFinding("android.number_format", "low", sf, call, "NumberFormat - good for localized number formatting", findings);
      }

      if (text.includes("TalkBack")) {
        pushFinding("android.talkback", "low", sf, call, "TalkBack support - good for accessibility", findings);
      }

      if (text.includes("contentDescription")) {
        pushFinding("android.content_description", "low", sf, call, "Content description - good for screen reader support", findings);
      }

      if (text.includes("semantics")) {
        pushFinding("android.semantics", "low", sf, call, "Semantics modifier - good for accessibility in Compose", findings);
      }

      if (text.includes("DTO")) {
        pushFinding("android.dto_sharing", "low", sf, call, "DTO classes - consider sharing with backend via code generation", findings);
      }

      if (text.includes("Repository")) {
        pushFinding("android.repository_pattern", "low", sf, call, "Repository pattern - good for data abstraction", findings);
      }

      if (text.includes("UseCase")) {
        pushFinding("android.use_case", "low", sf, call, "Use case pattern - good for business logic encapsulation", findings);
      }

      if (text.includes("ViewModel")) {
        pushFinding("android.viewmodel_pattern", "low", sf, call, "ViewModel pattern - good for UI state management", findings);
      }
    });
  });

  // CRITICAL: Android Kotlin Error Handling Rules (text-based analysis)
  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();
    if (platformOf(filePath) !== "android" || !filePath.endsWith('.kt')) return;

    const content = sf.getFullText();

    // Kotlin: Empty catch blocks
    const emptyCatchPattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
    let match;
    while ((match = emptyCatchPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "android.error_handling.empty_catch",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Empty catch block - handle exception or use specific exception types`,
        findings
      );
    }

    // Kotlin: catch (e: Exception) - too generic
    const genericExceptionPattern = /catch\s*\(\s*\w+\s*:\s*Exception\s*\)/g;
    while ((match = genericExceptionPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const hasSpecific = content.includes('IOException') || content.includes('NetworkException') ||
        content.includes('HttpException') || content.includes('SQLException');
      if (!hasSpecific) {
        pushFinding(
          "android.error_handling.generic_exception",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Catch generic Exception - prefer specific exceptions (IOException, HttpException, etc.)`,
          findings
        );
      }
    }

    // Kotlin: Force unwrapping (!!)
    const forceUnwrapPattern = /!!/g;
    while ((match = forceUnwrapPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "android.error_handling.force_unwrap",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: NEVER use '!!' force unwrap - use safe calls (?.) or requireNotNull() with message`,
        findings
      );
    }

    // Kotlin: Any type used without type checking (equivalent to unknown sin guards)
    const anyTypePattern = /:\s*Any\b/g;
    while ((match = anyTypePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      const varName = lineText.match(/\b(\w+)\s*:\s*Any\b/)?.[1];
      if (varName) {
        const subsequentLines = content.split('\n').slice(lineNumber, lineNumber + 10).join('\n');
        const hasTypeCheck = new RegExp(`${varName}\\s+is\\s+|${varName}\\s+as\\?|when\\s*\\(\\s*${varName}\\s*\\)`).test(subsequentLines);
        if (!hasTypeCheck) {
          pushFinding(
            "android.typescript.any_without_guard",
            "high",
            sf,
            sf,
            `Line ${lineNumber}: Variable '${varName}: Any' used without type checking - use 'is', 'as?', or 'when' guards`,
            findings
          );
        }
      }
    }

    // ==========================================
    // COMPREHENSIVE RULES FROM rulesandroid.mdc
    // ==========================================

    // 1. JETPACK COMPOSE

    // findViewById usage (should use Compose)
    if (content.includes('findViewById')) {
      const lineNumber = content.indexOf('findViewById') ? content.substring(0, content.indexOf('findViewById')).split('\n').length : 1;
      pushFinding(
        "android.compose.findviewbyid",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: findViewById detected - use Jetpack Compose for new UI`,
        findings
      );
    }

    // Missing @Composable annotation
    const composableFunctionPattern = /fun\s+([A-Z]\w+)\s*\([^)]*\)\s*\{[^}]*\b(Text|Button|Column|Row|Box|Card|LazyColumn)\b/g;
    while ((match = composableFunctionPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const functionBlock = content.substring(match.index - 50, match.index);
      if (!functionBlock.includes('@Composable')) {
        pushFinding(
          "android.compose.missing_annotation",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Function '${match[1]}' renders Compose UI - add @Composable annotation`,
          findings
        );
      }
    }

    // Side effects without LaunchedEffect
    const sideEffectPattern = /@Composable[^{]*\{[^}]*\b(viewModel\.|repository\.|api\.)/g;
    while ((match = sideEffectPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const block = content.substring(match.index, match.index + 300);
      if (!block.includes('LaunchedEffect') && !block.includes('DisposableEffect')) {
        pushFinding(
          "android.compose.side_effect_without_effect",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Side effect in Composable without LaunchedEffect - wrap in LaunchedEffect`,
          findings
        );
      }
    }

    // 2. DEPENDENCY INJECTION (HILT)

    // Manual factories (should use @Inject)
    const factoryPattern = /object\s+\w+Factory|class\s+\w+Factory/g;
    while ((match = factoryPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "android.di.manual_factory",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: Manual factory detected - use Hilt @Inject constructor instead`,
        findings
      );
    }

    // Missing @Inject constructor
    const viewModelPattern = /class\s+(\w+ViewModel)\s*\([^)]*\)/g;
    while ((match = viewModelPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const constructorBlock = content.substring(match.index - 50, match.index);
      if (!constructorBlock.includes('@Inject')) {
        pushFinding(
          "android.di.missing_inject",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: ViewModel '${match[1]}' without @Inject - use Hilt constructor injection`,
          findings
        );
      }
    }

    // 3. COROUTINES

    // GlobalScope usage (should use viewModelScope/lifecycleScope)
    if (content.includes('GlobalScope')) {
      const lineNumber = content.indexOf('GlobalScope') ? content.substring(0, content.indexOf('GlobalScope')).split('\n').length : 1;
      pushFinding(
        "android.coroutines.global_scope",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: GlobalScope detected - use viewModelScope or lifecycleScope for automatic cancellation`,
        findings
      );
    }

    // Blocking calls in Main dispatcher
    const blockingCallsPattern = /Dispatchers\.Main[^}]*\b(Thread\.sleep|\.get\(\)|\.await\(\))/g;
    while ((match = blockingCallsPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "android.coroutines.blocking_on_main",
        "critical",
        sf,
        sf,
        `Line ${lineNumber}: Blocking call on Main dispatcher - move to Dispatchers.IO`,
        findings
      );
    }

    // Missing withContext for dispatcher switch
    const suspendFunctionPattern = /suspend\s+fun\s+\w+[^{]*\{[^}]*\b(database|api|file|network)\b/g;
    while ((match = suspendFunctionPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const functionBlock = content.substring(match.index, match.index + 300);
      if (!functionBlock.includes('withContext')) {
        pushFinding(
          "android.coroutines.missing_withcontext",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Suspend function with I/O operations - use withContext(Dispatchers.IO)`,
          findings
        );
      }
    }

    // 4. FLOW

    // LiveData in new code (should use Flow/StateFlow)
    if (content.includes('LiveData') && !filePath.includes('legacy') && !filePath.includes('migration')) {
      const lineNumber = content.indexOf('LiveData') ? content.substring(0, content.indexOf('LiveData')).split('\n').length : 1;
      pushFinding(
        "android.flow.livedata_in_new_code",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: LiveData in new code - prefer Flow/StateFlow for reactive streams`,
        findings
      );
    }

    // Flow without proper collection
    const flowPattern = /:\s*Flow</g;
    while ((match = flowPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const varName = content.split('\n')[lineNumber - 1].match(/val\s+(\w+)/)?.[1];
      if (varName) {
        const usagePattern = new RegExp(`${varName}\\.collect`);
        if (!usagePattern.test(content)) {
          pushFinding(
            "android.flow.uncollected_flow",
            "medium",
            sf,
            sf,
            `Line ${lineNumber}: Flow '${varName}' defined but never collected`,
            findings
          );
        }
      }
    }

    // 5. ROOM DATABASE

    // Raw SQL queries (should use @Query)
    const rawSqlPattern = /database\.execSQL|rawQuery\(/g;
    while ((match = rawSqlPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      pushFinding(
        "android.room.raw_sql",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: Raw SQL query - use Room @Query annotation for type safety`,
        findings
      );
    }

    // DAO without suspend functions
    if (content.includes('@Dao')) {
      const daoBlock = content.substring(content.indexOf('@Dao'));
      const hasSuspend = daoBlock.includes('suspend fun');
      if (!hasSuspend && daoBlock.includes('@Insert')) {
        const lineNumber = content.indexOf('@Dao') ? content.substring(0, content.indexOf('@Dao')).split('\n').length : 1;
        pushFinding(
          "android.room.dao_not_suspend",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: DAO operations should be suspend functions for async execution`,
          findings
        );
      }
    }

    // 6. STATE MANAGEMENT

    // Mutable state without StateFlow
    const mutableStatePattern = /var\s+\w+\s*=\s*mutableListOf|var\s+\w+\s*=\s*mutableMapOf/g;
    while ((match = mutableStatePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const classContext = content.substring(0, match.index);
      if (classContext.includes('ViewModel')) {
        pushFinding(
          "android.state.mutable_without_stateflow",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Mutable state in ViewModel - use StateFlow for observable state`,
          findings
        );
      }
    }

    // Direct state mutation (not using copy())
    const directMutationPattern = /\w+\.\w+\s*=\s*/g;
    let mutationCount = 0;
    while ((match = directMutationPattern.exec(content)) !== null && mutationCount < 3) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNumber - 1];
      if (lineText.includes('state.') && !lineText.includes('copy(') && !lineText.includes('_state')) {
        pushFinding(
          "android.state.direct_mutation",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Direct state mutation - use data class .copy() for immutability`,
          findings
        );
        mutationCount++;
      }
    }

    // 7. NETWORKING (RETROFIT)

    // Synchronous network calls
    const retrofitCallPattern = /@GET|@POST|@PUT|@DELETE|@PATCH/g;
    while ((match = retrofitCallPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const nextLines = content.split('\n').slice(lineNumber, lineNumber + 5).join('\n');
      if (!nextLines.includes('suspend') && !nextLines.includes('Call<')) {
        pushFinding(
          "android.networking.sync_call",
          "high",
          sf,
          sf,
          `Line ${lineNumber}: Retrofit endpoint should be suspend function for async execution`,
          findings
        );
      }
    }

    // Missing interceptors for auth
    if (content.includes('Retrofit.Builder()') && !content.includes('addInterceptor')) {
      const lineNumber = content.indexOf('Retrofit.Builder') ? content.substring(0, content.indexOf('Retrofit.Builder')).split('\n').length : 1;
      pushFinding(
        "android.networking.missing_interceptor",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: Retrofit without interceptors - add for auth tokens, logging`,
        findings
      );
    }

    // 8. SECURITY

    // SharedPreferences for sensitive data
    if (content.includes('SharedPreferences') && (content.includes('password') || content.includes('token') || content.includes('secret'))) {
      const lineNumber = content.indexOf('SharedPreferences') ? content.substring(0, content.indexOf('SharedPreferences')).split('\n').length : 1;
      if (!content.includes('EncryptedSharedPreferences')) {
        pushFinding(
          "android.security.shared_prefs_sensitive",
          "critical",
          sf,
          sf,
          `Line ${lineNumber}: Sensitive data in SharedPreferences - use EncryptedSharedPreferences`,
          findings
        );
      }
    }

    // Hardcoded API keys
    const apiKeyPattern = /api[_-]?key\s*=\s*"[^"]+"|BuildConfig\.\w*API\w*KEY\w*\s*=\s*"[^"]+"/gi;
    while ((match = apiKeyPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      if (!content.includes('local.properties') && !content.includes('secrets-gradle-plugin')) {
        pushFinding(
          "android.security.hardcoded_api_key",
          "critical",
          sf,
          sf,
          `Line ${lineNumber}: Hardcoded API key - use secrets-gradle-plugin or BuildConfig`,
          findings
        );
      }
    }

    // 9. COMPOSE PERFORMANCE

    // RecyclerView (should use LazyColumn)
    if (content.includes('RecyclerView') && !filePath.includes('legacy')) {
      const lineNumber = content.indexOf('RecyclerView') ? content.substring(0, content.indexOf('RecyclerView')).split('\n').length : 1;
      pushFinding(
        "android.compose.recyclerview",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: RecyclerView in new code - use LazyColumn/LazyRow in Compose`,
        findings
      );
    }

    // Missing remember for expensive calculations
    const composablePattern = /@Composable[^{]*\{[^}]*\b(filter|map|sortedBy|groupBy)\b/g;
    while ((match = composablePattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const block = content.substring(match.index, match.index + 200);
      if (!block.includes('remember') && !block.includes('derivedStateOf')) {
        pushFinding(
          "android.compose.missing_remember",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Expensive calculation in Composable - wrap in remember or derivedStateOf`,
          findings
        );
      }
    }

    // 10. ARCHITECTURE

    // God Activities (>500 lines)
    const activityPattern = /class\s+(\w+Activity)\s*:/g;
    while ((match = activityPattern.exec(content)) !== null) {
      const className = match[1];
      const classStart = match.index;
      const classEnd = content.indexOf('\n}', classStart);
      if (classEnd > -1) {
        const lines = content.substring(classStart, classEnd).split('\n').length;
        if (lines > 500) {
          pushFinding(
            "android.architecture.god_activity",
            "high",
            sf,
            sf,
            `${className} has ${lines} lines - use Single Activity + Composables pattern`,
            findings
          );
        }
      }
    }

    // Business logic in Activity/Composable
    if (content.includes('Activity') || content.includes('@Composable')) {
      const businessLogicPatterns = ['repository.', 'database.', 'api.', 'Retrofit'];
      businessLogicPatterns.forEach(pattern => {
        if (content.includes(pattern)) {
          const lineNumber = content.indexOf(pattern) ? content.substring(0, content.indexOf(pattern)).split('\n').length : 1;
          const contextBlock = content.substring(0, match ? match.index : 0);
          if (!contextBlock.includes('ViewModel') && !contextBlock.includes('UseCase')) {
            pushFinding(
              "android.architecture.business_logic_in_ui",
              "high",
              sf,
              sf,
              `Line ${lineNumber}: Business logic in UI layer - move to ViewModel or UseCase`,
              findings
            );
          }
        }
      });
    }

    // 11. TESTING

    // Missing tests for ViewModels
    if (content.includes('ViewModel') && !filePath.includes('Test') && !filePath.includes('Fake')) {
      const className = content.match(/class\s+(\w+ViewModel)/)?.[1];
      if (className) {
        pushFinding(
          "android.testing.missing_viewmodel_tests",
          "medium",
          sf,
          sf,
          `ViewModel '${className}' - ensure test file exists with JUnit5`,
          findings
        );
      }
    }

    // 12. LOCALIZATION

    // Hardcoded strings (should use strings.xml)
    const hardcodedStringPattern = /Text\s*\(\s*text\s*=\s*"[^"]{5,}"\s*\)|text\s*=\s*"[^"]+"/g;
    let hardcodedCount = 0;
    while ((match = hardcodedStringPattern.exec(content)) !== null && hardcodedCount < 5) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const stringContent = match[0];
      if (!stringContent.includes('stringResource') && !stringContent.match(/"(OK|Cancel|Error)"/)) {
        pushFinding(
          "android.i18n.hardcoded_string",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Hardcoded string - use stringResource(R.string.xxx)`,
          findings
        );
        hardcodedCount++;
      }
    }

    // left/right instead of start/end
    if (content.includes('Modifier.padding') && (content.includes('paddingLeft') || content.includes('paddingRight'))) {
      const lineNumber = content.indexOf('paddingLeft') || content.indexOf('paddingRight') ?
        content.substring(0, content.indexOf('paddingLeft') || content.indexOf('paddingRight')).split('\n').length : 1;
      pushFinding(
        "android.i18n.left_right_padding",
        "medium",
        sf,
        sf,
        `Line ${lineNumber}: Using left/right padding - use start/end for RTL support`,
        findings
      );
    }

    // 13. ACCESSIBILITY

    // Missing contentDescription
    if (content.includes('Image(') && !content.includes('contentDescription')) {
      const imagePattern = /Image\s*\(/g;
      let imageCount = 0;
      while ((match = imagePattern.exec(content)) !== null && imageCount < 3) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const nextLines = content.split('\n').slice(lineNumber - 1, lineNumber + 3).join('\n');
        if (!nextLines.includes('contentDescription')) {
          pushFinding(
            "android.accessibility.missing_content_description",
            "medium",
            sf,
            sf,
            `Line ${lineNumber}: Image without contentDescription - add for TalkBack support`,
            findings
          );
          imageCount++;
        }
      }
    }

    // Touch targets <48dp
    const modifierPattern = /Modifier\.size\s*\(\s*(\d+)\.dp\s*\)/g;
    while ((match = modifierPattern.exec(content)) !== null) {
      const size = parseInt(match[1]);
      if (size < 48) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "android.accessibility.touch_target_small",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Touch target ${size}dp - minimum 48dp for accessibility`,
          findings
        );
      }
    }

    // 14. CODE ORGANIZATION

    // Files >500 lines
    const lineCount = content.split('\n').length;
    if (lineCount > 500 && !filePath.includes('Generated')) {
      pushFinding(
        "android.organization.file_too_large",
        "medium",
        sf,
        sf,
        `File has ${lineCount} lines - split into smaller files (max 500)`,
        findings
      );
    }

    // 15. ANTI-PATTERNS

    // AsyncTask (deprecated)
    if (content.includes('AsyncTask')) {
      const lineNumber = content.indexOf('AsyncTask') ? content.substring(0, content.indexOf('AsyncTask')).split('\n').length : 1;
      pushFinding(
        "android.antipattern.async_task",
        "high",
        sf,
        sf,
        `Line ${lineNumber}: AsyncTask is deprecated - use Kotlin Coroutines`,
        findings
      );
    }

    // RxJava in new code
    if (content.includes('Observable<') || content.includes('Single<') || content.includes('Flowable<')) {
      if (!filePath.includes('legacy') && !filePath.includes('migration')) {
        const lineNumber = content.indexOf('Observable') || content.indexOf('Single') || content.indexOf('Flowable') ?
          content.substring(0, content.indexOf('Observable') || content.indexOf('Single') || content.indexOf('Flowable')).split('\n').length : 1;
        pushFinding(
          "android.antipattern.rxjava",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: RxJava in new code - use Kotlin Flow instead`,
          findings
        );
      }
    }

    // Context leaks (Activity reference in long-lived object)
    const contextLeakPattern = /class\s+\w+\s*\([^)]*context:\s*Context\s*\)/g;
    while ((match = contextLeakPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const classBlock = content.substring(match.index, match.index + 100);
      if (classBlock.includes('@Singleton') || classBlock.includes('object ')) {
        pushFinding(
          "android.memory.context_leak",
          "critical",
          sf,
          sf,
          `Line ${lineNumber}: Context reference in Singleton - use ApplicationContext to avoid leaks`,
          findings
        );
      }
    }

    // 16. LOGGING

    // Log.d/Log.e without BuildConfig check
    const logPattern = /Log\.[dewi]\s*\(/g;
    while ((match = logPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const surroundingLines = content.split('\n').slice(Math.max(0, lineNumber - 3), lineNumber + 2).join('\n');
      if (!surroundingLines.includes('BuildConfig.DEBUG') && !surroundingLines.includes('Timber')) {
        pushFinding(
          "android.logging.production_logs",
          "medium",
          sf,
          sf,
          `Line ${lineNumber}: Log in production - wrap with if (BuildConfig.DEBUG) or use Timber`,
          findings
        );
      }
    }

    // 17. SEALED CLASSES

    // Missing sealed class for states
    if (content.includes('State') && content.includes('data class') && !content.includes('sealed')) {
      const stateClassPattern = /data\s+class\s+(\w*State)\s*\(/g;
      while ((match = stateClassPattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        pushFinding(
          "android.architecture.missing_sealed_state",
          "low",
          sf,
          sf,
          `Line ${lineNumber}: State class '${match[1]}' - consider sealed class for Loading/Success/Error states`,
          findings
        );
      }
    }

    // 139. Java detection (NO Java in new code)
    const hasJavaFile = filePath.endsWith('.java');
    if (hasJavaFile && !filePath.includes('build/') && !filePath.includes('generated/')) {
      pushFinding(
        "android.kotlin.java_detected",
        "critical",
        sf,
        sf,
        'Java file detected - use Kotlin 100% for new code (NO Java in new code)',
        findings
      );
    }

    // 140. Extension functions usage
    if (!content.includes('fun ') || (!content.includes('fun String.') && !content.includes('fun Int.') && !content.includes('fun List.'))) {
      if ((content.match(/fun\s+\w+/g) || []).length > 10 && !filePath.includes('ViewModel')) {
        pushFinding(
          "android.kotlin.missing_extensions",
          "low",
          sf,
          sf,
          'File with many functions - consider extension functions for better organization',
          findings
        );
      }
    }

    // 141. Scope functions (let, run, apply, also, with)
    const hasScopeFunctions = content.includes('.let {') || content.includes('.run {') || content.includes('.apply {');
    const hasNullChecks = (content.match(/if\s*\(\s*\w+\s*!=\s*null\s*\)/g) || []).length;
    if (hasNullChecks > 3 && !hasScopeFunctions) {
      pushFinding(
        "android.kotlin.missing_scope_functions",
        "medium",
        sf,
        sf,
        `${hasNullChecks} null checks without scope functions - use let, run, apply for cleaner code`,
        findings
      );
    }

    // 142. Data classes for DTOs
    if ((content.includes('Response') || content.includes('Request') || content.includes('DTO')) &&
      content.includes('class') && !content.includes('data class')) {
      pushFinding(
        "android.kotlin.missing_data_class",
        "high",
        sf,
        sf,
        'Response/Request/DTO without data class - use data class for DTOs and models',
        findings
      );
    }

    // 143. XML layouts (NO XML in new code)
    const hasXMLLayout = filePath.includes('/res/layout/') && filePath.endsWith('.xml');
    if (hasXMLLayout && !filePath.includes('navigation.xml')) {
      pushFinding(
        "android.compose.xml_layout_detected",
        "high",
        sf,
        sf,
        'XML layout detected - use Jetpack Compose 100% for new UI code',
        findings
      );
    }

    // 144. @Composable functions
    if (content.includes('@Composable') && !content.includes('fun ')) {
      pushFinding(
        "android.compose.composable_not_function",
        "critical",
        sf,
        sf,
        '@Composable must be a function - Composable functions pattern',
        findings
      );
    }

    // 145. State hoisting in Compose
    if (content.includes('@Composable') && content.includes('var ') && content.includes('mutableStateOf')) {
      if (!content.includes('remember') && !content.includes('rememberSaveable')) {
        pushFinding(
          "android.compose.missing_remember",
          "high",
          sf,
          sf,
          'mutableStateOf without remember - state will be lost on recomposition',
          findings
        );
      }
    }

    // 146. rememberSaveable for process death
    if (content.includes('remember {') && content.includes('mutableStateOf') && !content.includes('rememberSaveable')) {
      if (filePath.includes('Screen') || filePath.includes('Activity')) {
        pushFinding(
          "android.compose.use_remembersaveable",
          "medium",
          sf,
          sf,
          'Screen-level state with remember - use rememberSaveable to survive process death',
          findings
        );
      }
    }

    // 147. LaunchedEffect for side effects
    if (content.includes('@Composable') && (content.includes('viewModel') || content.includes('repository'))) {
      if (content.includes('.collect') && !content.includes('LaunchedEffect')) {
        pushFinding(
          "android.compose.missing_launched_effect",
          "high",
          sf,
          sf,
          'Flow.collect in Composable without LaunchedEffect - use LaunchedEffect for side effects with lifecycle',
          findings
        );
      }
    }

    // 148. DisposableEffect for cleanup
    if (content.includes('@Composable') && (content.includes('Observer') || content.includes('Listener') || content.includes('register'))) {
      if (!content.includes('DisposableEffect')) {
        pushFinding(
          "android.compose.missing_disposable_effect",
          "high",
          sf,
          sf,
          'Resource registration without DisposableEffect - implement cleanup when Composable leaves composition',
          findings
        );
      }
    }

    // 149. Modifier order (padding before background)
    if (content.includes('Modifier') && content.includes('.background(') && content.includes('.padding(')) {
      const modifierChainPattern = /\.background\([^)]+\)\.padding\(/g;
      if (modifierChainPattern.test(content)) {
        pushFinding(
          "android.compose.wrong_modifier_order",
          "medium",
          sf,
          sf,
          'Modifier.background().padding() - wrong order, use .padding().background() (padding before background)',
          findings
        );
      }
    }

    // 150. @Preview for development
    if (content.includes('@Composable') && !content.includes('@Preview') && !filePath.includes('ViewModel')) {
      const composableCount = (content.match(/@Composable/g) || []).length;
      if (composableCount > 0 && composableCount < 5) {
        pushFinding(
          "android.compose.missing_preview",
          "low",
          sf,
          sf,
          'Composable without @Preview - add @Preview for development visualization',
          findings
        );
      }
    }

    // 151. Material 3 components
    if (content.includes('import androidx.compose.material.') && !content.includes('material3')) {
      pushFinding(
        "android.material.use_material3",
        "medium",
        sf,
        sf,
        'Using Material 2 components - migrate to Material 3 (androidx.compose.material3)',
        findings
      );
    }

    // 152. Dark theme support
    if (content.includes('@Composable') && content.includes('Color(') && !content.includes('isSystemInDarkTheme')) {
      if ((content.match(/Color\(0x/g) || []).length > 3) {
        pushFinding(
          "android.material.missing_dark_theme",
          "medium",
          sf,
          sf,
          'Hardcoded colors without dark theme support - use isSystemInDarkTheme() for adaptive theming',
          findings
        );
      }
    }

    // 153. Adaptive layouts (WindowSizeClass)
    if (content.includes('@Composable') && (content.includes('Column') || content.includes('Row')) &&
      !content.includes('WindowSizeClass') && lineCount > 100) {
      pushFinding(
        "android.material.missing_adaptive_layout",
        "low",
        sf,
        sf,
        'Complex layout without WindowSizeClass - implement responsive design for tablets',
        findings
      );
    }

    // 154. Single Activity pattern
    if (content.includes('class') && content.includes('Activity') && !content.includes('MainActivity')) {
      const activityPattern = /class\s+(\w+Activity)\s*:/g;
      const activities = [];
      while ((match = activityPattern.exec(content)) !== null) {
        if (match[1] !== 'MainActivity') {
          activities.push(match[1]);
        }
      }
      if (activities.length > 0) {
        pushFinding(
          "android.architecture.multiple_activities",
          "medium",
          sf,
          sf,
          `Multiple Activities detected (${activities.join(', ')}) - use Single Activity + Composables pattern`,
          findings
        );
      }
    }

    // 155. Navigation Compose
    if (content.includes('NavHost') && !content.includes('androidx.navigation.compose')) {
      pushFinding(
        "android.navigation.use_compose_navigation",
        "high",
        sf,
        sf,
        'NavHost without Compose Navigation - use androidx.navigation:navigation-compose',
        findings
      );
    }

    // 156. StateFlow over LiveData
    if (content.includes('ViewModel') && content.includes('LiveData') && !content.includes('StateFlow')) {
      pushFinding(
        "android.architecture.use_stateflow",
        "high",
        sf,
        sf,
        'ViewModel using LiveData - migrate to StateFlow for Kotlin Flow support',
        findings
      );
    }

    // 157. Hilt annotations
    if (filePath.includes('ViewModel') && !content.includes('@HiltViewModel') && content.includes('ViewModel()')) {
      pushFinding(
        "android.di.missing_hilt_viewmodel",
        "high",
        sf,
        sf,
        'ViewModel without @HiltViewModel - use Hilt for dependency injection',
        findings
      );
    }

    // 158. @Inject constructor
    if (content.includes('class') && (content.includes('Repository') || content.includes('Service')) &&
      !content.includes('@Inject') && content.includes('constructor')) {
      pushFinding(
        "android.di.missing_inject",
        "high",
        sf,
        sf,
        'Repository/Service constructor without @Inject - use constructor injection with Hilt',
        findings
      );
    }

    // 159. @Module + @InstallIn
    if (content.includes('@Module') && !content.includes('@InstallIn')) {
      pushFinding(
        "android.di.missing_installin",
        "critical",
        sf,
        sf,
        '@Module without @InstallIn - specify component scope (SingletonComponent, ViewModelComponent, etc.)',
        findings
      );
    }

    // 160. viewModelScope usage
    if (content.includes('ViewModel') && content.includes('launch {') && !content.includes('viewModelScope')) {
      pushFinding(
        "android.coroutines.use_viewmodelscope",
        "high",
        sf,
        sf,
        'ViewModel launch without viewModelScope - use viewModelScope for automatic cancellation',
        findings
      );
    }

    // 161. Dispatchers.IO for network/disk
    if (content.includes('suspend fun') && (content.includes('Room') || content.includes('Retrofit') || content.includes('File'))) {
      if (!content.includes('Dispatchers.IO') && !content.includes('withContext')) {
        pushFinding(
          "android.coroutines.missing_io_dispatcher",
          "medium",
          sf,
          sf,
          'Network/Disk operations without Dispatchers.IO - use appropriate dispatcher',
          findings
        );
      }
    }

    // 162. supervisorScope for error isolation
    if (content.includes('async {') && !content.includes('supervisorScope') && (content.match(/async\s*\{/g) || []).length > 2) {
      pushFinding(
        "android.coroutines.use_supervisor_scope",
        "medium",
        sf,
        sf,
        'Multiple async without supervisorScope - errors will cancel all jobs, use supervisorScope',
        findings
      );
    }

    // 163. Retrofit suspend functions
    if (content.includes('interface') && content.includes('@GET') && !content.includes('suspend fun')) {
      pushFinding(
        "android.networking.retrofit_not_suspend",
        "high",
        sf,
        sf,
        'Retrofit API without suspend functions - use suspend for coroutine support',
        findings
      );
    }

    // 164. OkHttp interceptors
    if (content.includes('Retrofit') && content.includes('Builder') && !content.includes('Interceptor')) {
      pushFinding(
        "android.networking.missing_interceptors",
        "medium",
        sf,
        sf,
        'Retrofit without interceptors - add logging/auth interceptors for debugging and authentication',
        findings
      );
    }

    // 165. Moshi over Gson
    if (content.includes('Gson') && !content.includes('Moshi')) {
      pushFinding(
        "android.networking.prefer_moshi",
        "low",
        sf,
        sf,
        'Using Gson - prefer Moshi for better Kotlin support and performance',
        findings
      );
    }

    // 166. Certificate pinning
    if (content.includes('OkHttpClient') && content.includes('https') && !content.includes('CertificatePinner')) {
      if (content.includes('production') || content.includes('release')) {
        pushFinding(
          "android.networking.missing_cert_pinning",
          "critical",
          sf,
          sf,
          'Production network without certificate pinning - implement SSL pinning for security',
          findings
        );
      }
    }

    // 167. Room suspend functions in DAO
    if (content.includes('@Dao') && content.includes('fun ') && !content.includes('suspend fun')) {
      pushFinding(
        "android.persistence.dao_not_suspend",
        "high",
        sf,
        sf,
        '@Dao methods without suspend - use suspend functions for coroutine support',
        findings
      );
    }

    // 168. Flow<T> for observables
    if (content.includes('@Dao') && content.includes('@Query') && !content.includes('Flow<')) {
      const queryCount = (content.match(/@Query/g) || []).length;
      if (queryCount > 0) {
        pushFinding(
          "android.persistence.use_flow_queries",
          "medium",
          sf,
          sf,
          'Room queries without Flow - use Flow<T> for observable queries',
          findings
        );
      }
    }

    // 169. @TypeConverter for custom types
    if (content.includes('@Entity') && (content.includes('Date') || content.includes('List<') || content.includes('Map<'))) {
      if (!content.includes('@TypeConverter')) {
        pushFinding(
          "android.persistence.missing_type_converter",
          "high",
          sf,
          sf,
          'Entity with complex types (Date, List, Map) without @TypeConverter',
          findings
        );
      }
    }

    // 170. @Transaction for multi-query operations
    if (content.includes('@Dao') && (content.match(/@Query|@Insert|@Update|@Delete/g) || []).length > 2) {
      if (!content.includes('@Transaction')) {
        pushFinding(
          "android.persistence.missing_transaction",
          "medium",
          sf,
          sf,
          'DAO with multiple operations - use @Transaction for atomic operations',
          findings
        );
      }
    }

    // 171. Immutable state (data class + copy())
    if (filePath.includes('ViewModel') && content.includes('data class') && content.includes('State')) {
      if (content.includes('var ') && !content.includes('private set')) {
        pushFinding(
          "android.architecture.mutable_state",
          "high",
          sf,
          sf,
          'Mutable state in ViewModel - use immutable data class with copy() pattern',
          findings
        );
      }
    }

    // 172. Single source of truth
    if (content.includes('ViewModel') && (content.match(/StateFlow|LiveData/g) || []).length > 5) {
      pushFinding(
        "android.architecture.too_many_state_sources",
        "medium",
        sf,
        sf,
        'ViewModel with many state sources - consolidate into single UiState sealed class',
        findings
      );
    }

    // 173. Coil for image loading
    if (content.includes('Glide') && content.includes('@Composable')) {
      pushFinding(
        "android.images.use_coil",
        "low",
        sf,
        sf,
        'Using Glide in Compose - prefer Coil for Jetpack Compose integration',
        findings
      );
    }

    // 174. JUnit5 over JUnit4
    if (filePath.includes('Test.kt') && content.includes('import org.junit.Test') && !content.includes('jupiter')) {
      pushFinding(
        "android.testing.use_junit5",
        "medium",
        sf,
        sf,
        'Using JUnit4 - migrate to JUnit5 (Jupiter) for modern testing features',
        findings
      );
    }

    // 175. MockK for Kotlin
    if (filePath.includes('Test.kt') && content.includes('mock') && !content.includes('MockK') && !content.includes('mockk')) {
      pushFinding(
        "android.testing.use_mockk",
        "medium",
        sf,
        sf,
        'Mocking without MockK - use MockK for Kotlin-first mocking',
        findings
      );
    }

    // 176. Turbine for Flow testing
    if (filePath.includes('Test.kt') && content.includes('Flow<') && !content.includes('turbine')) {
      pushFinding(
        "android.testing.use_turbine",
        "low",
        sf,
        sf,
        'Testing Flows without Turbine - use Turbine for Flow testing',
        findings
      );
    }

    // 177. Truth for assertions
    if (filePath.includes('Test.kt') && content.includes('assert') && !content.includes('assertThat')) {
      pushFinding(
        "android.testing.use_truth",
        "low",
        sf,
        sf,
        'Using JUnit assertions - consider Truth library for more readable assertions',
        findings
      );
    }

    // 178. runTest for coroutines
    if (filePath.includes('Test.kt') && content.includes('suspend fun') && !content.includes('runTest')) {
      pushFinding(
        "android.testing.use_runtest",
        "high",
        sf,
        sf,
        'Testing suspend functions without runTest - use runTest for coroutine testing',
        findings
      );
    }

    // 179. EncryptedSharedPreferences
    if (content.includes('SharedPreferences') && !content.includes('Encrypted') &&
      (content.includes('token') || content.includes('password') || content.includes('secret'))) {
      pushFinding(
        "android.security.use_encrypted_prefs",
        "critical",
        sf,
        sf,
        'Sensitive data in SharedPreferences - use EncryptedSharedPreferences for security',
        findings
      );
    }

    // 180. ProGuard/R8 configuration
    if (filePath.includes('build.gradle') && content.includes('release') && !content.includes('minifyEnabled true')) {
      pushFinding(
        "android.security.missing_proguard",
        "high",
        sf,
        sf,
        'Release build without ProGuard/R8 - enable code obfuscation for security',
        findings
      );
    }

    // 181. LazyColumn for lists
    if (content.includes('Column') && content.includes('items(') && !content.includes('LazyColumn')) {
      pushFinding(
        "android.performance.use_lazy_column",
        "high",
        sf,
        sf,
        'Column with items() - use LazyColumn for virtualized lists',
        findings
      );
    }

    // 182. Paging 3 for large datasets
    if (content.includes('LazyColumn') && content.includes('items(') && !content.includes('Paging')) {
      if ((content.match(/items\(/g) || []).length > 0 && content.includes('repository')) {
        pushFinding(
          "android.performance.use_paging",
          "medium",
          sf,
          sf,
          'LazyColumn with repository data - consider Paging 3 for large datasets',
          findings
        );
      }
    }

    // 183. Baseline Profiles
    if (filePath.includes('build.gradle') && content.includes('compose') && !content.includes('baselineProfile')) {
      pushFinding(
        "android.performance.missing_baseline_profile",
        "low",
        sf,
        sf,
        'Compose app without Baseline Profiles - add for startup optimization',
        findings
      );
    }

    // 184. @Stable/@Immutable annotations
    if (content.includes('data class') && content.includes('@Composable') && !content.includes('@Stable') && !content.includes('@Immutable')) {
      if ((content.match(/data\s+class/g) || []).length > 2) {
        pushFinding(
          "android.compose_perf.missing_stability",
          "high",
          sf,
          sf,
          'Data classes in Composable without @Stable/@Immutable - causes unnecessary recompositions',
          findings
        );
      }
    }

    // 185. Immutable collections
    if (content.includes('StateFlow<List<') || content.includes('State<List<')) {
      if (!content.includes('kotlinx.collections.immutable')) {
        pushFinding(
          "android.compose_perf.use_immutable_collections",
          "medium",
          sf,
          sf,
          'State with List - use ImmutableList from kotlinx.collections.immutable for stability',
          findings
        );
      }
    }

    // 186. TalkBack support
    if (content.includes('@Composable') && (content.includes('Image') || content.includes('Icon')) &&
      !content.includes('contentDescription')) {
      const imageCount = (content.match(/Image\(|Icon\(/g) || []).length;
      if (imageCount > 2) {
        pushFinding(
          "android.accessibility.missing_content_description",
          "high",
          sf,
          sf,
          `${imageCount} images/icons without contentDescription - add for TalkBack accessibility`,
          findings
        );
      }
    }

    // 187. Touch targets (48dp minimum)
    if (content.includes('Modifier') && content.includes('.size(') && !content.includes('.minimumInteractiveComponentSize()')) {
      const sizePattern = /\.size\((\d+)\.dp\)/g;
      while ((match = sizePattern.exec(content)) !== null) {
        const size = parseInt(match[1]);
        if (size < 48) {
          pushFinding(
            "android.accessibility.small_touch_target",
            "medium",
            sf,
            sf,
            `Touch target ${size}dp < 48dp minimum - increase size for accessibility`,
            findings
          );
        }
      }
    }

    // 188. strings.xml for i18n
    if (content.includes('Text(') && (content.match(/Text\("[^"]{15,}"\)/g) || []).length > 3) {
      if (!content.includes('stringResource') && !filePath.includes('Preview')) {
        pushFinding(
          "android.localization.hardcoded_strings",
          "medium",
          sf,
          sf,
          'Hardcoded strings in Text - use stringResource(R.string.xxx) for internationalization',
          findings
        );
      }
    }

    // 189. Kotlin DSL for Gradle
    if (filePath.endsWith('build.gradle') && !filePath.endsWith('.kts')) {
      pushFinding(
        "android.gradle.use_kotlin_dsl",
        "low",
        sf,
        sf,
        'Groovy Gradle script - migrate to Kotlin DSL (build.gradle.kts) for type safety',
        findings
      );
    }

    // 190. Version catalogs
    if (filePath.includes('build.gradle') && content.includes('implementation') && !content.includes('libs.')) {
      const depCount = (content.match(/implementation\s*\(/g) || []).length;
      if (depCount > 5) {
        pushFinding(
          "android.gradle.use_version_catalogs",
          "low",
          sf,
          sf,
          `${depCount} dependencies without version catalog - use libs.versions.toml for centralized management`,
          findings
        );
      }
    }

  });

  // ═══════════════════════════════════════════════════════════════
  // SOLID PRINCIPLES ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();
    if (platformOf(filePath) !== "android") return;
    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    const solidAnalyzer = new AndroidSOLIDAnalyzer();
    solidAnalyzer.analyze(sf, findings, pushFinding);
  });

  // ═══════════════════════════════════════════════════════════════
  // FORBIDDEN LITERALS ANALYSIS (null/undefined, magic numbers, type casts)
  // ═══════════════════════════════════════════════════════════════
  project.getSourceFiles().forEach((sf) => {
    const filePath = sf.getFilePath();
    if (platformOf(filePath) !== "android") return;
    if (/\/ast-[^/]+\.js$/.test(filePath)) return;

    const forbiddenLiteralsAnalyzer = new AndroidForbiddenLiteralsAnalyzer();
    forbiddenLiteralsAnalyzer.analyze(sf, findings, pushFinding);
  });

  // ═══════════════════════════════════════════════════════════════
  // RUN CUSTOM DETEKT RULES (188 Android-specific rules)
  // ═══════════════════════════════════════════════════════════════
  try {
    const kotlinFiles = project.getSourceFiles()
      .map(sf => sf.getFilePath())
      .filter(f => platformOf(f) === "android" && (f.endsWith('.kt') || f.endsWith('.kts')));

    if (kotlinFiles.length > 0) {
      const detektFindings = runDetektAnalysis(kotlinFiles);

      // Add detekt findings to our findings array
      for (const finding of detektFindings) {
        findings.push({
          rule_id: finding.rule_id,
          severity: finding.severity,
          file: finding.file,
          line: finding.line,
          column: finding.column,
          message: finding.message,
          category: finding.category || 'detekt',
          debt: finding.debt || '10min'
        });
      }
    }
  } catch (error) {
    console.error('Error running detekt analysis:', error.message);
  }
}

module.exports = {
  runAndroidIntelligence,
};
