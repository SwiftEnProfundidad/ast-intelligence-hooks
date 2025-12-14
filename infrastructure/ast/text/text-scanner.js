const fs = require('fs');
const path = require('path');
const { pushFileFinding, platformOf } = require(path.join(__dirname, '../ast-core'));

function walk(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|dist|\.next|\.turbo|build|out|coverage|\.git/.test(p)) continue;
      walk(p, acc);
    } else {
      acc.push(p);
    }
  }
}

function runTextScanner(root, findings) {
  const files = [];
  let iosAnchorFile = null;
  let iosHasBiometric = false;
  let iosHasJailbreakCheck = false;
  let iosHasVoiceOverRef = false;
  let iosHasStringsDict = false;
  let iosHasRtlSupport = false;
  let iosHasPinningIndicator = false;
  let iosHasNetworkingUsage = false;
  let iosHasPreviewProvider = false;
  let iosHasPreviewMultiple = false;
  let iosPreviewHasDark = false;
  let iosPreviewHasLight = false;
  let iosHasCoreAnimationRef = false;
  let iosHasAnimationUsage = false;
  let iosHasMemoryWarningObserver = false;
  let iosHasAnyExtension = false;
  let iosHasExtensionsFolder = false;
  let iosPublicApiFound = false;
  let iosPublicApiDocsFound = false;
  let iosTaskCount = 0;
  let iosTaskGroupFound = false;
  let iosHasFastfile = false;
  let iosCiHasXcodeTests = false;
  let iosHasDomainFolder = false;
  let iosHasApplicationFolder = false;
  let iosHasInfrastructureFolder = false;
  let iosHasPresentationFolder = false;
  walk(root, files);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.kt', '.kts', '.swift', '.java', '.xml', '.plist', '.stringsdict', '.yml', '.yaml'].includes(ext)) continue;
    let content = '';
    try { 
      content = fs.readFileSync(file, 'utf-8'); 
    } catch (error) {
      continue;
    }
    const plat = platformOf(file) || (ext === '.swift' ? 'ios' : (ext === '.kt' || ext === '.kts' || ext === '.java' || ext === '.xml') ? 'android' : (ext === '.plist' && path.basename(file).toLowerCase().includes('info')) ? 'ios' : (ext === '.stringsdict' ? 'ios' : (ext === '.yml' || ext === '.yaml') ? 'ios' : 'other'));

    if (plat === 'android') {
      if (ext === '.xml' && /<layout|<LinearLayout|<RelativeLayout|<ConstraintLayout/.test(content)) {
        pushFileFinding('android.xml_layouts', 'critical', file, 1, 1, 'XML layout detected - prefer Compose for new UI', findings);
      }
      if (/findViewById\(/.test(content)) {
        pushFileFinding('android.findviewbyid', 'high', file, 1, 1, 'findViewById usage detected', findings);
      }
      if (/AsyncTask\b/.test(content)) {
        pushFileFinding('android.asynctask', 'high', file, 1, 1, 'AsyncTask usage detected', findings);
      }
      if (/!!/.test(content)) {
        pushFileFinding('android.force_unwrapping', 'critical', file, 1, 1, 'Force unwrapping detected', findings);
      }
      if (/class\s+\w+\s*:\s*Application\b/.test(content) && !/@HiltAndroidApp\b/.test(content)) {
        pushFileFinding('android.di.missing_hilt_app', 'high', file, 1, 1, 'Application without @HiltAndroidApp', findings);
      }
      if (/(class\s+\w+\s*:\s*\w*Activity\b|class\s+\w+\s*:\s*\w*Fragment\b)/.test(content) && !/@AndroidEntryPoint\b/.test(content)) {
        pushFileFinding('android.di.missing_android_entry_point', 'high', file, 1, 1, 'Activity/Fragment without @AndroidEntryPoint', findings);
      }
      if (/@Module\b/.test(content) && !/@InstallIn\b/.test(content)) {
        pushFileFinding('android.di.missing_module_install_in', 'medium', file, 1, 1, 'Hilt @Module without @InstallIn', findings);
      }
      if (/@Module\b/.test(content) && !/@Provides\b/.test(content)) {
        pushFileFinding('android.di.missing_provides', 'medium', file, 1, 1, 'Hilt @Module without @Provides methods', findings);
      }
      if (/@Module\b/.test(content) && /abstract\s+class\b/.test(content) && !/@Binds\b/.test(content)) {
        pushFileFinding('android.di.missing_binds', 'medium', file, 1, 1, 'Abstract Hilt module without @Binds', findings);
      }
      if (/@Provides\b/.test(content) && !/@Singleton\b/.test(content)) {
        pushFileFinding('android.di.missing_singleton', 'low', file, 1, 1, 'Provider without @Singleton where appropriate', findings);
      }
      if (/@Provides\b/.test(content) && /ViewModel\b/.test(content) && !/@ViewModelScoped\b/.test(content)) {
        pushFileFinding('android.di.missing_viewmodel_scoped', 'low', file, 1, 1, 'ViewModel provider without @ViewModelScoped', findings);
      }
      if (/(class\s+\w+ViewModel\b)/.test(content) && !/StateFlow\b|SharedFlow\b/.test(content)) {
        pushFileFinding('android.architecture.missing_stateflow', 'medium', file, 1, 1, 'ViewModel without StateFlow/SharedFlow', findings);
      }
      if (/(class\s+\w+\s*:\s*\w*Activity\b|class\s+\w+\s*:\s*\w*Fragment\b)/.test(content) && !/ViewModel\b/.test(content)) {
        pushFileFinding('android.architecture.missing_mvvm', 'medium', file, 1, 1, 'UI component without ViewModel reference', findings);
      }
      if (/(setContent\s*\(|NavController\b)/.test(content) && !/NavHost\b/.test(content)) {
        pushFileFinding('android.architecture.missing_navigation', 'low', file, 1, 1, 'Compose setup without Navigation/NavHost', findings);
      }
      if (/(class\s+\w+Repository\b|class\s+\w+Service\b)/.test(content) && /constructor\s*\(/.test(content) && !/@Inject\s+constructor\b/.test(content)) {
        pushFileFinding('android.di.missing_inject_constructor', 'medium', file, 1, 1, 'Repository/Service without @Inject constructor', findings);
      }
      if (/interface\s+\w+\s*\{[\s\S]*(@GET|@POST|@PUT|@DELETE)\b/.test(content) && !/suspend\s+fun\s+/m.test(content)) {
        pushFileFinding('android.networking.missing_suspend', 'high', file, 1, 1, 'Retrofit interface methods without suspend', findings);
      }
      if (/OkHttpClient\.Builder\(\)/.test(content) && !/addInterceptor\(/.test(content)) {
        pushFileFinding('android.networking.missing_interceptors', 'medium', file, 1, 1, 'OkHttpClient without interceptors', findings);
      }
      if (/(enqueue\(|execute\()/.test(content) && !/try\s*\{/.test(content)) {
        pushFileFinding('android.networking.missing_error_handling', 'medium', file, 1, 1, 'Network call without try/catch', findings);
      }
      if (/OkHttpClient\.Builder\([\s\S]*\)\s*\.build\(\)/.test(content) && !/certificatePinner\(/.test(content)) {
        pushFileFinding('android.networking.missing_certificate_pinning', 'low', file, 1, 1, 'Missing certificate pinning on OkHttpClient', findings);
      }
      if (/class\s+\w+ViewModel\b/.test(content) && !/viewModelScope\b/.test(content)) {
        pushFileFinding('android.coroutines.missing_viewmodel_scope', 'medium', file, 1, 1, 'ViewModel without viewModelScope', findings);
      }
      if (/(class\s+\w+\s*:\s*\w*Activity\b|class\s+\w+\s*:\s*\w*Fragment\b)/.test(content) && !/lifecycleScope\b/.test(content)) {
        pushFileFinding('android.coroutines.missing_lifecycle_scope', 'medium', file, 1, 1, 'Activity/Fragment without lifecycleScope', findings);
      }
      if (/(launch\s*\{|async\s*\()/m.test(content) && !/try\s*\{/.test(content)) {
        pushFileFinding('android.coroutines.missing_try_catch', 'medium', file, 1, 1, 'Coroutine without try/catch handling', findings);
      }
      if (/async\s*\(/.test(content) && !/supervisorScope\s*\{/.test(content)) {
        pushFileFinding('android.coroutines.missing_supervisor_scope', 'low', file, 1, 1, 'Async used without supervisorScope', findings);
      }
      if (/class\s+\w+ViewModel\b/.test(content) && !/SharedFlow\b|MutableSharedFlow\b/.test(content)) {
        pushFileFinding('android.flow.missing_sharedflow', 'low', file, 1, 1, 'ViewModel without SharedFlow for events', findings);
      }
      if (/Flow<[^>]+>/.test(content) && !/(\.map\(|\.filter\(|combine\(|flatMapLatest\(|catch\()/ .test(content)) {
        pushFileFinding('android.flow.missing_operators', 'low', file, 1, 1, 'Flow used without operators', findings);
      }
      if (/@Composable\b/.test(content) && /StateFlow\b/.test(content) && !/collectAsState\b/.test(content)) {
        pushFileFinding('android.flow.missing_collect_as_state', 'medium', file, 1, 1, 'StateFlow in Compose without collectAsState', findings);
      }
      if (/interface\s+\w+Dao\b/.test(content) && !/@Dao\b/.test(content)) {
        pushFileFinding('android.room.missing_dao', 'medium', file, 1, 1, 'DAO interface without @Dao', findings);
      }
      if (/@Query\s*\([\s\S]*\)\s*\n\s*fun\s+\w+\s*\([^)]*\)\s*:\s*(?!Flow<)/m.test(content)) {
        pushFileFinding('android.room.missing_flow', 'medium', file, 1, 1, 'Room query without Flow return type', findings);
      }
      if (/class\s+\w+\s*:\s*RoomDatabase\b/.test(content) && !/@Database\b/.test(content)) {
        pushFileFinding('android.room.missing_database', 'medium', file, 1, 1, 'Room database class without @Database', findings);
      }
      if (/(RAW_QUERY|execSQL\(|SELECT\s+.+FROM\s+)/i.test(content)) {
        pushFileFinding('android.room.raw_sql', 'high', file, 1, 1, 'Raw SQL detected', findings);
      }
      if (/class\s+\w+Database\b/.test(content) && /@Database\b/.test(content) && !/@TypeConverters\b/.test(content)) {
        pushFileFinding('android.room.missing_typeconverter', 'medium', file, 1, 1, 'Room Database without @TypeConverters', findings);
      }
      if (/@Database\s*\([\s\S]*version\s*=\s*(\d+)/.test(content) && !/Migration\b/.test(content)) {
        pushFileFinding('android.room.missing_migrations', 'medium', file, 1, 1, 'Room Database with version but no Migration found', findings);
      }
      if (/@Dao\b/.test(content) && !/@Transaction\b/.test(content)) {
        pushFileFinding('android.room.missing_transaction', 'low', file, 1, 1, 'DAO without @Transaction annotations (multi-query safety)', findings);
      }
      if (/Flow<[^>]+>/.test(content) && !/stateIn\s*\(/.test(content)) {
        pushFileFinding('android.flow.missing_state_in', 'low', file, 1, 1, 'Flow without stateIn conversion where appropriate', findings);
      }
      if (path.basename(file) === 'AndroidManifest.xml' && !/android:networkSecurityConfig=/.test(content)) {
        pushFileFinding('android.networking.missing_network_security_config', 'high', file, 1, 1, 'AndroidManifest without networkSecurityConfig', findings);
      }

      // NUEVAS REGLAS ANDROID (implementando las 60 pendientes)

      // Architecture
      if (/class\s+\w+Activity\b/.test(content) && content.split(/class\s+\w+Activity\b/).length > 3) {
        pushFileFinding('android.architecture.multiple_activities', 'medium', file, 1, 1, 'Multiple Activities detected - prefer Single Activity + Composables', findings);
      }
      if (/interface\s+\w+Repository\b/.test(content)) {
        // Good - has repository interface
      } else if (/class\s+\w+Repository\b/.test(content) && !/:\s*\w+Repository/.test(content)) {
        pushFileFinding('android.architecture.missing_repository', 'medium', file, 1, 1, 'Repository class without interface - implement repository pattern', findings);
      }
      if (/class\s+\w+ViewModel\b/.test(content) && !/(class\s+\w+UseCase\b|fun\s+\w+UseCase\()/m.test(content)) {
        pushFileFinding('android.architecture.missing_use_cases', 'low', file, 1, 1, 'ViewModel without use cases - encapsulate business logic', findings);
      }
      if (!/domain\/|data\/|presentation\//i.test(file)) {
        pushFileFinding('android.architecture.missing_clean_layers', 'info', file, 1, 1, 'File not in Clean Architecture layers (domain/data/presentation)', findings);
      }

      // Clean Architecture layers
      if (file.includes('/domain/') && /(import\s+androidx\.|import\s+android\.)/.test(content)) {
        pushFileFinding('android.clean.domain_layer', 'high', file, 1, 1, 'Domain layer with Android framework dependencies - must be pure Kotlin', findings);
      }
      if (file.includes('/data/') && !/(interface\s+\w+Repository\b|class\s+\w+RepositoryImpl\b|@Dao\b)/.test(content)) {
        pushFileFinding('android.clean.data_layer', 'low', file, 1, 1, 'Data layer file without Repository implementation or DAO', findings);
      }
      if (file.includes('/presentation/') && !/(@Composable\b|class\s+\w+ViewModel\b|@HiltViewModel\b)/.test(content)) {
        pushFileFinding('android.clean.presentation_layer', 'low', file, 1, 1, 'Presentation layer without Composables or ViewModels', findings);
      }
      if (file.includes('/presentation/') && /(import\s+com\.example\.\w+\.domain\.\w+\.repository)/.test(content)) {
        pushFileFinding('android.clean.dependency_direction', 'medium', file, 1, 1, 'Presentation importing domain repository directly - use repository interface', findings);
      }

      // DI
      if (!/@HiltAndroidApp\b/.test(content) && /class\s+\w+Application\b/.test(content)) {
        pushFileFinding('android.di.missing_hilt', 'high', file, 1, 1, 'Application class without @HiltAndroidApp', findings);
      }

      // Coroutines
      if (/suspend\s+fun\s+\w+\s*\([^)]*\)\s*\{[\s\S]{0,500}\}/.test(content) && !/Dispatchers\.(IO|Default|Main)/.test(content)) {
        pushFileFinding('android.coroutines.missing_dispatchers', 'medium', file, 1, 1, 'Suspend function without explicit Dispatcher', findings);
      }
      if (/Dispatchers\.(IO|Default)\b/.test(content) && !/withContext\s*\(/.test(content)) {
        pushFileFinding('android.coroutines.missing_withcontext', 'low', file, 1, 1, 'Dispatcher used without withContext for switching', findings);
      }
      if (/launch\s*\{[\s\S]{0,300}\}/.test(content) && !/async\s*\{/.test(content) && /\n[\s\S]{100,}/.test(content)) {
        pushFileFinding('android.coroutines.missing_async_await', 'low', file, 1, 1, 'Consider async/await for parallel operations', findings);
      }
      if (/completion:\s*\(|callback:\s*\(/.test(content) && /suspend\s+fun\s+/.test(content)) {
        pushFileFinding('android.coroutines.callbacks_instead_coroutines', 'medium', file, 1, 1, 'Using callbacks with suspend functions - prefer coroutines', findings);
      }

      // Flow
      if (/flow\s*\{/.test(content)) {
        // Good - using flow builders
      } else if (/Flow<[^>]+>/.test(content) && !/flowOf\(|asFlow\(\)/.test(content)) {
        pushFileFinding('android.flow.missing_flow_builders', 'low', file, 1, 1, 'Flow type without flow builders (flow{}, flowOf(), asFlow())', findings);
      }
      if (/\.collect\s*\{/.test(content)) {
        // Good - consuming flow
      } else if (/Flow<[^>]+>/.test(content) && !/\.collect/.test(content)) {
        pushFileFinding('android.flow.missing_collect', 'medium', file, 1, 1, 'Flow declared but never collected', findings);
      }
      if (/Flow<[^>]+>/.test(content) && !/\.catch\s*\{/.test(content)) {
        pushFileFinding('android.flow.missing_error_handling', 'medium', file, 1, 1, 'Flow without .catch() error handling', findings);
      }
      if (/RxJava|Observable<|Flowable<|Single</.test(content)) {
        pushFileFinding('android.flow.rxjava_instead_flow', 'medium', file, 1, 1, 'RxJava detected - migrate to Kotlin Flow', findings);
      }

      // Networking
      if (/(Retrofit\.Builder\(|interface\s+\w+Api\b)/.test(content)) {
        // Good - using Retrofit
      } else if (/https?:\/\//.test(content) && !/Retrofit|OkHttp/.test(content)) {
        pushFileFinding('android.networking.missing_retrofit', 'high', file, 1, 1, 'HTTP URLs without Retrofit/OkHttp', findings);
      }
      if (/Retrofit\.Builder\(\)/.test(content) && !/OkHttpClient\(/.test(content)) {
        pushFileFinding('android.networking.missing_okhttp', 'medium', file, 1, 1, 'Retrofit without OkHttpClient configuration', findings);
      }
      if (/Retrofit\.Builder\(\)/.test(content) && !/MoshiConverterFactory|GsonConverterFactory/.test(content)) {
        pushFileFinding('android.networking.missing_moshi_gson', 'medium', file, 1, 1, 'Retrofit without Moshi/Gson converter', findings);
      }
      if (/Retrofit\.Builder\(\)/.test(content) && !/retryOnConnectionFailure|Interceptor/.test(content)) {
        pushFileFinding('android.networking.missing_retry_logic', 'low', file, 1, 1, 'Retrofit without retry logic', findings);
      }
      if (/BiometricPrompt\b/.test(content)) {
        // Good
      } else if (/(password|auth|login)/.test(content.toLowerCase()) && !/BiometricPrompt/.test(content)) {
        pushFileFinding('android.networking.missing_biometric_auth', 'low', file, 1, 1, 'Auth without BiometricPrompt API consideration', findings);
      }

      // Room
      if (/@Entity\b/.test(content)) {
        // Good
      } else if (/class\s+\w+(Entity|Model)\b/.test(content) && file.includes('/data/')) {
        pushFileFinding('android.room.missing_room', 'medium', file, 1, 1, 'Data entity without @Entity annotation', findings);
      }
      if (/@Entity\b/.test(content) && !/@Index\(/.test(content) && /@ColumnInfo\b/.test(content)) {
        pushFileFinding('android.room.missing_indices', 'low', file, 1, 1, 'Room Entity without @Index on queried columns', findings);
      }
      if (/@Entity\b/.test(content) && !/@Relation\(|@Embedded\b/.test(content) && /@ColumnInfo.*id/.test(content)) {
        pushFileFinding('android.room.missing_relations', 'low', file, 1, 1, 'Room Entity with foreign keys but no @Relation/@Embedded', findings);
      }
      if (/@Query\([^)]{200,}\)/.test(content)) {
        pushFileFinding('android.room.performance_issues', 'medium', file, 1, 1, 'Complex Room query - optimize with indices', findings);
      }

      // State Management
      if (/@Composable\b/.test(content) && !/ViewModel\b/.test(content) && /var\s+\w+\s*=/.test(content)) {
        pushFileFinding('android.state.missing_viewmodel', 'medium', file, 1, 1, 'Composable with var state without ViewModel', findings);
      }
      if (/class\s+\w+ViewModel\b/.test(content) && !/StateFlow\b|MutableStateFlow\b/.test(content)) {
        pushFileFinding('android.state.missing_stateflow', 'medium', file, 1, 1, 'ViewModel without StateFlow for state', findings);
      }
      if (/class\s+\w+ViewModel\b/.test(content) && !/sealed\s+(class|interface)\s+\w*UiState\b/.test(content)) {
        pushFileFinding('android.state.missing_uistate_sealed', 'low', file, 1, 1, 'ViewModel without UiState sealed class (Loading, Success, Error)', findings);
      }
      if (/@Composable\b/.test(content) && /StateFlow\b/.test(content) && !/collectAsState\b/.test(content)) {
        pushFileFinding('android.state.missing_single_source', 'medium', file, 1, 1, 'StateFlow not collected in Composable - ViewModel should be source of truth', findings);
      }
      if (/var\s+\w+State\s*=\s*mutableListOf|var\s+\w+\s*=\s*mutableMapOf/.test(content) && !/data\s+class\b/.test(content)) {
        pushFileFinding('android.state.missing_immutable_state', 'medium', file, 1, 1, 'Mutable collections as state - use data class + copy()', findings);
      }
      if (/@Composable\b/.test(content) && /var\s+/.test(content) && !/remember\s*\{/.test(content)) {
        pushFileFinding('android.state.missing_state_hoisting', 'medium', file, 1, 1, 'State not hoisted in Composable', findings);
      }
      if (/class\s+\w+ViewModel\b[\s\S]{0,500}SavedStateHandle\b/.test(content)) {
        // Good - using SavedStateHandle
      } else if (/class\s+\w+ViewModel\b/.test(content) && !/SavedStateHandle/.test(content)) {
        pushFileFinding('android.state.missing_savedstate', 'low', file, 1, 1, 'ViewModel without SavedStateHandle for process death', findings);
      }
      if (/(var\s+\w+\s*=.*StateFlow|val\s+\w+\s*=.*MutableStateFlow)/.test(content) && content.split(/StateFlow/).length > 3) {
        pushFileFinding('android.state.multiple_sources', 'low', file, 1, 1, 'Multiple StateFlows - consider single source of truth', findings);
      }

      // Navigation
      if (/@Composable\b/.test(content) && /NavHost\b/.test(content)) {
        // Good
      } else if (/@Composable\b/.test(content) && /Screen\b/.test(content) && !/NavHost|NavController/.test(content)) {
        pushFileFinding('android.navigation.missing_compose_navigation', 'medium', file, 1, 1, 'Composable screens without Navigation Compose', findings);
      }
      if (/NavController\b/.test(content) && !/NavHost\b/.test(content)) {
        pushFileFinding('android.navigation.missing_navhost', 'medium', file, 1, 1, 'NavController without NavHost container', findings);
      }
      if (/NavHost\b/.test(content) && !/rememberNavController\(\)/.test(content)) {
        pushFileFinding('android.navigation.missing_navcontroller', 'medium', file, 1, 1, 'NavHost without NavController', findings);
      }
      if (/NavHost\b/.test(content) && !/route\s*=\s*["']/.test(content)) {
        pushFileFinding('android.navigation.missing_routes', 'medium', file, 1, 1, 'NavHost without route strings', findings);
      }
      if (/navigate\s*\(["'][^"']+["']\)/.test(content) && !/arguments\s*=/.test(content) && /\{/.test(content)) {
        pushFileFinding('android.navigation.missing_arguments', 'low', file, 1, 1, 'Navigation without arguments for passing data', findings);
      }
      if (/NavHost\b/.test(content) && !/deepLinks\s*=/.test(content)) {
        pushFileFinding('android.navigation.missing_deep_links', 'low', file, 1, 1, 'Navigation without deep links support', findings);
      }
      if (/@Composable\b/.test(content) && /BottomNavigation\b|NavigationBar\b/.test(content)) {
        // Good
      } else if (/@Composable\b/.test(content) && /Scaffold\b/.test(content) && !/BottomNavigation|NavigationBar/.test(content)) {
        pushFileFinding('android.navigation.missing_bottom_navigation', 'info', file, 1, 1, 'Scaffold without bottom navigation consideration', findings);
      }
      if (/navigate\s*\([^)]{100,}\)/.test(content)) {
        pushFileFinding('android.navigation.complex_navigation', 'low', file, 1, 1, 'Complex navigation logic - consider navigation component architecture', findings);
      }

      // Image Loading
      if (/Image\s*\(/.test(content) && !/Coil|AsyncImage|rememberImagePainter/.test(content)) {
        pushFileFinding('android.images.missing_coil', 'medium', file, 1, 1, 'Image loading without Coil async loader', findings);
      }
      if (/Glide\.with\(/.test(content)) {
        // Alternative is OK
      } else if (/ImageView\b/.test(content) && !/Coil|Glide/.test(content)) {
        pushFileFinding('android.images.missing_glide', 'low', file, 1, 1, 'ImageView without Coil/Glide - consider async loading', findings);
      }
      if (/AsyncImage\b|rememberImagePainter\b/.test(content) && !/\.diskCachePolicy|\.memoryCachePolicy/.test(content)) {
        pushFileFinding('android.images.missing_cache', 'low', file, 1, 1, 'Image loading without explicit cache policy', findings);
      }
      if (/AsyncImage\b/.test(content) && !/transformations\s*=/.test(content)) {
        pushFileFinding('android.images.missing_transformations', 'info', file, 1, 1, 'Consider image transformations (resize, crop, blur)', findings);
      }
      if (/AsyncImage\b/.test(content) && !/placeholder\s*=/.test(content)) {
        pushFileFinding('android.images.missing_placeholders', 'low', file, 1, 1, 'AsyncImage without placeholder while loading', findings);
      }
      if (/AsyncImage\b/.test(content) && !/error\s*=/.test(content)) {
        pushFileFinding('android.images.missing_error_handling', 'medium', file, 1, 1, 'AsyncImage without error fallback image', findings);
      }
      if (/ImageView\b/.test(content) && /setImageResource\(R\.drawable\./.test(content)) {
        pushFileFinding('android.images.raw_image_views', 'low', file, 1, 1, 'Raw ImageView.setImageResource - consider Coil for consistency', findings);
      }

      // Testing
      if (file.includes('Test.kt') && !/@Test\b/.test(content)) {
        pushFileFinding('android.testing.missing_junit5', 'medium', file, 1, 1, 'Test file without @Test annotations', findings);
      }
      if (file.includes('Test.kt') && !/mockk|MockK/.test(content) && /mock|Mock/.test(content)) {
        pushFileFinding('android.testing.missing_mockk', 'low', file, 1, 1, 'Mocking without MockK - use MockK for Kotlin', findings);
      }
      if (file.includes('Test.kt') && /Flow<[^>]+>/.test(content) && !/turbine|test\(\)/.test(content)) {
        pushFileFinding('android.testing.missing_turbine', 'low', file, 1, 1, 'Testing Flows without Turbine library', findings);
      }
      if (file.includes('Test.kt') && /@Composable\b/.test(content) && !/composeTestRule|createComposeRule/.test(content)) {
        pushFileFinding('android.testing.missing_compose_ui_test', 'medium', file, 1, 1, 'Testing Composables without Compose UI Test', findings);
      }
      if (file.includes('Test.kt') && /Fragment\b/.test(content) && !/Espresso|onView\(/.test(content)) {
        pushFileFinding('android.testing.missing_espresso', 'medium', file, 1, 1, 'Fragment testing without Espresso', findings);
      }
      if (file.includes('Test.kt') && /android\./.test(content) && !/Robolectric|@RunWith\(AndroidJUnit4/.test(content)) {
        pushFileFinding('android.testing.missing_robolectric', 'low', file, 1, 1, 'Android framework testing without Robolectric', findings);
      }
      if (file.includes('Test.kt') && /assert/.test(content) && !/Truth|assertThat\(/.test(content)) {
        pushFileFinding('android.testing.missing_truth', 'info', file, 1, 1, 'Assertions without Truth library - consider for readability', findings);
      }
      if (file.includes('Test.kt') && /launch\s*\{|async\s*\{/.test(content) && !/runTest\s*\{|TestDispatcher/.test(content)) {
        pushFileFinding('android.testing.missing_coroutines_test', 'medium', file, 1, 1, 'Testing coroutines without runTest/TestDispatcher', findings);
      }
      if (file.includes('Test.kt') && !/(\/\/ Arrange|\/\/ Act|\/\/ Assert)/.test(content) && /@Test\b/.test(content)) {
        pushFileFinding('android.testing.missing_aaa_pattern', 'info', file, 1, 1, 'Test without AAA pattern comments (Arrange-Act-Assert)', findings);
      }
      if (file.includes('Test.kt') && !/(\/\/ Given|\/\/ When|\/\/ Then)/.test(content) && /@Test\b/.test(content)) {
        pushFileFinding('android.testing.missing_given_when_then', 'info', file, 1, 1, 'Test without Given-When-Then BDD style', findings);
      }

      // Security
      if (/SharedPreferences\b/.test(content) && !/EncryptedSharedPreferences/.test(content) && /(password|token|key|secret)/.test(content.toLowerCase())) {
        pushFileFinding('android.security.missing_encrypted_prefs', 'critical', file, 1, 1, 'Sensitive data in SharedPreferences - use EncryptedSharedPreferences', findings);
      }
      if (/(SecretKey|KeyGenerator)\b/.test(content) && !/KeyStore/.test(content)) {
        pushFileFinding('android.security.missing_keystore', 'high', file, 1, 1, 'Cryptographic keys without Android KeyStore', findings);
      }
      if (/package\s+com\.\w+/.test(content) && !/SafetyNet|PlayIntegrity/.test(content) && file.includes('MainActivity')) {
        pushFileFinding('android.security.missing_safetynet', 'low', file, 1, 1, 'Consider SafetyNet/Play Integrity for device verification', findings);
      }
      if (/class\s+\w+Application\b/.test(content) && !/RootBeer|isDeviceRooted/.test(content)) {
        pushFileFinding('android.security.missing_root_detection', 'low', file, 1, 1, 'Application without root detection', findings);
      }
      if (path.basename(file) === 'build.gradle.kts' && !/proguard|r8/.test(content.toLowerCase())) {
        pushFileFinding('android.security.missing_proguard_r8', 'medium', file, 1, 1, 'Release build without ProGuard/R8 obfuscation', findings);
      }
      if (/BiometricPrompt\b/.test(content)) {
        // Good
      } else if (/BiometricManager\b/.test(content)) {
        // Alternative OK
      } else if (/(password|auth|login)/.test(content.toLowerCase()) && file.includes('Activity')) {
        pushFileFinding('android.security.missing_biometric_auth', 'medium', file, 1, 1, 'Auth screen without BiometricPrompt consideration', findings);
      }

      // Performance
      if (/@Composable\b/.test(content) && /List\(|ArrayList\(/.test(content) && !/LazyColumn|LazyRow/.test(content) && content.length > 500) {
        pushFileFinding('android.performance.missing_lazycolumn', 'high', file, 1, 1, 'Large list without LazyColumn/LazyRow virtualization', findings);
      }
      if (/@Dao\b/.test(content) && /@Query\b/.test(content) && !/PagingSource|@androidx\.paging/.test(content) && /LIMIT\s+\d{3,}/.test(content)) {
        pushFileFinding('android.performance.missing_paging', 'medium', file, 1, 1, 'Large dataset query without Paging 3', findings);
      }
      if (/(OneTimeWorkRequest|PeriodicWorkRequest)\b/.test(content)) {
        // Good
      } else if (/(doInBackground|AsyncTask|Thread\(|Runnable)/.test(content)) {
        pushFileFinding('android.performance.missing_workmanager', 'medium', file, 1, 1, 'Background work without WorkManager', findings);
      }
      if (path.basename(file) === 'build.gradle.kts' && !/baselineProfile/.test(content)) {
        pushFileFinding('android.performance.missing_baseline_profiles', 'info', file, 1, 1, 'Consider Baseline Profiles for app startup optimization', findings);
      }
      if (/class\s+\w+Application\b/.test(content) && !/androidx\.startup/.test(content) && /initialize/.test(content)) {
        pushFileFinding('android.performance.missing_app_startup', 'low', file, 1, 1, 'App initialization without androidx.startup for lazy init', findings);
      }
      if (path.basename(file) === 'build.gradle.kts' && !/debugImplementation.*leakcanary/.test(content)) {
        pushFileFinding('android.performance.missing_leakcanary', 'low', file, 1, 1, 'Debug build without LeakCanary for memory leak detection', findings);
      }
      if (/@Composable\b/.test(content) && !/remember\s*\{/.test(content) && /\w+\s*\(.*\)\s*\{[\s\S]{50,}\}/.test(content)) {
        pushFileFinding('android.performance.missing_remember', 'medium', file, 1, 1, 'Composable recreating objects - use remember{}', findings);
      }
      if (/@Composable\b/.test(content) && /\.filter\(|\.map\(/.test(content) && !/derivedStateOf\s*\{/.test(content)) {
        pushFileFinding('android.performance.derived_state_missing', 'low', file, 1, 1, 'Expensive calculations without derivedStateOf', findings);
      }
      if (/LaunchedEffect\s*\([^)]*\)/.test(content) && !/LaunchedEffect\s*\(.*,.*\)/.test(content)) {
        pushFileFinding('android.performance.launched_effect_keys', 'low', file, 1, 1, 'LaunchedEffect without keys - may re-launch unnecessarily', findings);
      }

      // Accessibility
      if (ext === '.xml' && /<ImageView|<ImageButton/.test(content) && !/android:contentDescription=/.test(content)) {
        pushFileFinding('android.accessibility.missing_contentdescription', 'high', file, 1, 1, 'ImageView/ImageButton without contentDescription for TalkBack', findings);
      }
      if (/@Composable\b/.test(content) && /Image\s*\(/.test(content) && !/contentDescription\s*=/.test(content)) {
        pushFileFinding('android.accessibility.missing_semantics', 'high', file, 1, 1, 'Compose Image without contentDescription', findings);
      }
      if (ext === '.xml' && /(Button|ImageButton|clickable="true")/.test(content) && /layout_width="[^"]*"/.test(content)) {
        const widthMatch = content.match(/layout_width="(\d+)dp"/);
        if (widthMatch && parseInt(widthMatch[1]) < 48) {
          pushFileFinding('android.accessibility.missing_touch_targets', 'medium', file, 1, 1, `Touch target <48dp (found ${widthMatch[1]}dp) - minimum 48dp required`, findings);
        }
      }
      if (/@Composable\b/.test(content) && /textSize\s*=\s*\d+\.sp/.test(content) && !/with\(LocalDensity\.current\)/.test(content)) {
        pushFileFinding('android.accessibility.missing_text_scaling', 'medium', file, 1, 1, 'Fixed text size without density/scaling support', findings);
      }

      // Localization
      if (ext === '.kt' && /Text\s*\(["'][^"']+["']\)/.test(content) && !/@Composable\b/.test(content)) {
        pushFileFinding('android.i18n.hardcoded_strings', 'medium', file, 1, 1, 'Hardcoded strings - use stringResource()', findings);
      }
      if (ext === '.xml' && /<string\s+name=/.test(content) && !/<plurals\s+name=/.test(content) && file.includes('values/')) {
        pushFileFinding('android.i18n.missing_quantity_strings', 'low', file, 1, 1, 'strings.xml without plurals - consider for countable items', findings);
      }
      if (ext === '.xml' && /(android:layout_marginLeft|android:layout_marginRight)/.test(content)) {
        pushFileFinding('android.i18n.missing_rtl_support', 'medium', file, 1, 1, 'Using marginLeft/marginRight instead of marginStart/marginEnd - breaks RTL', findings);
      }
      if (/@Composable\b/.test(content) && /Text\s*\([^)]*\$/.test(content) && !/stringResource\(/.test(content)) {
        pushFileFinding('android.i18n.missing_string_formatting', 'medium', file, 1, 1, 'String interpolation without stringResource() formatting', findings);
      }
      if (/SimpleDateFormat\(/.test(content) && !/Locale\./.test(content)) {
        pushFileFinding('android.i18n.missing_dateformat', 'medium', file, 1, 1, 'SimpleDateFormat without Locale - use DateTimeFormatter', findings);
      }
      if (/String\.format\([^)]*\d/.test(content) && !/Locale\./.test(content)) {
        pushFileFinding('android.i18n.missing_numberformat', 'medium', file, 1, 1, 'Number formatting without Locale - use NumberFormat', findings);
      }

      // Gradle
      if (path.basename(file) === 'build.gradle' && ext === '') {
        pushFileFinding('android.gradle.missing_kotlin_dsl', 'low', file, 1, 1, 'Using Groovy build.gradle - prefer Kotlin DSL (build.gradle.kts)', findings);
      }
      if (path.basename(file) === 'build.gradle.kts' && !/libs\.versions\.toml/.test(content) && /implementation\(/.test(content)) {
        pushFileFinding('android.gradle.missing_version_catalogs', 'low', file, 1, 1, 'Dependencies without version catalog (libs.versions.toml)', findings);
      }
      if (path.basename(file) === 'build.gradle.kts' && /buildTypes\s*\{/.test(content) && content.split(/buildTypes/).length < 3) {
        pushFileFinding('android.gradle.missing_build_types', 'info', file, 1, 1, 'Only one build type - consider debug/release/staging', findings);
      }

      // Logging
      if (/Log\.(d|i|w|e)\(/.test(content) && !/Timber/.test(content)) {
        pushFileFinding('android.logging.missing_timber', 'low', file, 1, 1, 'Using Log directly - prefer Timber for logging', findings);
      }
      if (/Timber\.(d|i)\(/.test(content) && !/if\s*\(BuildConfig\.DEBUG\)/.test(content)) {
        pushFileFinding('android.logging.debug_in_production', 'medium', file, 1, 1, 'Debug logs without BuildConfig.DEBUG check', findings);
      }
      if (/Log\.(d|i|w|e)\([^)]*password|token|secret/.test(content.toLowerCase())) {
        pushFileFinding('android.logging.sensitive_data', 'critical', file, 1, 1, 'Logging sensitive data (password/token)', findings);
      }

      // Configuration
      if (path.basename(file) === 'build.gradle.kts' && /buildConfigField/.test(content)) {
        // Good - using BuildConfig
      } else if (/const\s+val\s+API_KEY\s*=\s*["']/.test(content)) {
        pushFileFinding('android.config.hardcoded_config', 'high', file, 1, 1, 'API keys hardcoded - use BuildConfig or gradle.properties', findings);
      }

      // Anti-patterns
      if (/object\s+\w+(Repository|Manager|Helper)\b/.test(content)) {
        pushFileFinding('android.antipattern.singleton', 'high', file, 1, 1, 'Singleton object detected - use Hilt DI instead', findings);
      }
      if (/class\s+\w+Activity\b[\s\S]{0,2000}fun\s+/.test(content) && content.split(/fun\s+\w+\s*\(/).length > 30) {
        pushFileFinding('android.antipattern.god_activity', 'high', file, 1, 1, 'God Activity with 30+ methods - break down into ViewModels', findings);
      }
      if (/findViewById\s*</.test(content)) {
        pushFileFinding('android.antipattern.findviewbyid', 'medium', file, 1, 1, 'Using findViewById - use View Binding or Compose', findings);
      }
      if (/AsyncTask\b/.test(content)) {
        pushFileFinding('android.antipattern.asynctask', 'high', file, 1, 1, 'AsyncTask is deprecated - use Coroutines', findings);
      }
      if (/Handler\(\)\.post/.test(content) && !/@SuppressLint\("HandlerLeak"\)/.test(content)) {
        pushFileFinding('android.antipattern.handler_leak', 'high', file, 1, 1, 'Handler without weak reference - potential memory leak', findings);
      }
    }

    if (plat === 'ios') {
      if (ext === '.swift' && !iosAnchorFile) iosAnchorFile = file;
      if (ext === '.stringsdict') iosHasStringsDict = true;
      if (file.split(path.sep).some(seg => /^Extensions$/i.test(seg))) iosHasExtensionsFolder = true;
      if (file.split(path.sep).some(seg => /^Domain$/i.test(seg))) iosHasDomainFolder = true;
      if (file.split(path.sep).some(seg => /^Application$/i.test(seg))) iosHasApplicationFolder = true;
      if (file.split(path.sep).some(seg => /^Infrastructure$/i.test(seg))) iosHasInfrastructureFolder = true;
      if (file.split(path.sep).some(seg => /^Presentation$/i.test(seg))) iosHasPresentationFolder = true;
      if (path.basename(file) === 'Fastfile') iosHasFastfile = true;
      if ((ext === '.yml' || ext === '.yaml') && /xcodebuild\s+test|fastlane\s+scan/.test(content)) iosCiHasXcodeTests = true;
      if (/\bextension\s+[A-Za-z_][A-Za-z0-9_]*\s*\{/.test(content)) iosHasAnyExtension = true;
      if (/\bpublic\s+(class|struct|enum|protocol|func|var)\b/.test(content)) iosPublicApiFound = true;
      if (/^\s*\/\/\/[^\n]*\n\s*public\s+(class|struct|enum|protocol|func|var)\b/m.test(content)) iosPublicApiDocsFound = true;
      // Swift Package Manager heuristics from Package.swift
      if (path.basename(file) === 'Package.swift') {
        const targetCount = (content.match(/target\s*\(/g) || []).length + (content.match(/\.target\(/g) || []).length;
        if (targetCount < 2) {
          pushFileFinding('ios.spm.modular_architecture', 'low', file, 1, 1, 'Package.swift without multiple targets (weak modular architecture)', findings);
        }
        if (!/Swinject|Needle|Resolver|Factory\b/.test(content)) {
          pushFileFinding('ios.spm.dependency_injection', 'low', file, 1, 1, 'No DI library hint found in Package.swift', findings);
        }
      }
      if (/storyboard|\.xib\b|\.nib\b/i.test(content)) {
        pushFileFinding('ios.storyboards', 'high', file, 1, 1, 'Storyboard/XIB usage detected', findings);
      }
      if (/completion:\s*\(/.test(content)) {
        pushFileFinding('ios.completion_handlers', 'medium', file, 1, 1, 'Completion handler usage detected', findings);
      }
      if (/import UIKit\b/.test(content) && /import SwiftUI\b/.test(content)) {
        pushFileFinding('ios.uikit_unnecessary', 'low', file, 1, 1, 'UIKit and SwiftUI imported together', findings);
      }
      if (/\bDispatchQueue\./.test(content)) {
        pushFileFinding('ios.dispatchqueue_old', 'low', file, 1, 1, 'DispatchQueue usage detected (prefer async/await)', findings);
      }
      // UIKit ViewModel delegation heuristic
      if (/class\s+[A-Za-z0-9_]+ViewController\b/.test(content) && /(URLSession|Alamofire|NSPersistentContainer|NSManagedObjectContext)/.test(content)) {
        pushFileFinding('ios.uikit.viewmodel_delegation', 'medium', file, 1, 1, 'ViewController contains data/network logic (delegate to ViewModel)', findings);
      }
      if (/[A-Za-z0-9_]\s*!\b/.test(content) && !/@IBOutlet\b/.test(content)) {
        pushFileFinding('ios.force_unwrapping', 'high', file, 1, 1, 'Force unwrapping detected', findings);
      }
      if (/\[[ ]*(weak|unowned)[ ]+self[ ]*\]/.test(content) === false && /self\./.test(content) && /\{[^\n]*in/.test(content)) {
        pushFileFinding('ios.weak_self', 'medium', file, 1, 1, 'Closure referencing self without [weak self]', findings);
      }
      if (/\[\s*unowned\s+self\s*\]/.test(content)) {
        pushFileFinding('ios.unowned_self_missing', 'medium', file, 1, 1, 'unowned self used where weak may be safer', findings);
      }
      if (/self\./.test(content) && /\{[^\n]*in/.test(content) && !/\[[^\]]+\]/.test(content)) {
        pushFileFinding('ios.capture_lists_missing', 'low', file, 1, 1, 'Closure without capture list', findings);
      }
      if (/\bclass\s+\w+\s*\{/.test(content) && !/\bdeinit\b/.test(content)) {
        pushFileFinding('ios.deinit_missing', 'low', file, 1, 1, 'Class without deinit', findings);
      }
      if (/\bif\s+[A-Za-z_][A-Za-z0-9_]*\s*!=\s*nil\s*\{/.test(content)) {
        pushFileFinding('ios.optionals.optional_binding', 'medium', file, 1, 1, 'Optional check != nil (prefer optional binding)', findings);
      }
      if (/:\s*Any\b|\bas\s*Any\b/.test(content)) {
        pushFileFinding('ios.optionals.type_safety', 'medium', file, 1, 1, 'Usage of Any reduces type safety', findings);
      }
      if (/\.sink\s*\(/.test(content) && !/receiveCompletion\s*:\s*/.test(content)) {
        pushFileFinding('ios.combine.error_handling', 'medium', file, 1, 1, 'Combine sink without receiveCompletion handler', findings);
      }
      if (/\.sink\s*\(|\.assign\s*\(/.test(content) && !/store\s*\(in\s*:\s*/.test(content)) {
        pushFileFinding('ios.combine.memory_management', 'medium', file, 1, 1, 'Combine subscription without store(in:)', findings);
      }
      if (/\bTask\s*\{/.test(content) && !/withTaskCancellationHandler\s*\(/.test(content)) {
        pushFileFinding('ios.concurrency.task_cancellation', 'low', file, 1, 1, 'Task without cancellation handling', findings);
      }
      iosTaskCount += (content.match(/\bTask\s*\{/g) || []).length;
      if (/withTaskGroup\(|\bTaskGroup\b/.test(content)) iosTaskGroupFound = true;
      if (/(UIImage\s*\(named:|Image\(\s*\"[^\"]+\")/.test(content) && !/resize|resizable|scaledTo/.test(content)) {
        pushFileFinding('ios.performance.image_optimization', 'medium', file, 1, 1, 'Image usage without explicit optimization (resizable/resize/scaledTo)', findings);
      }
      if (/(sleep\(|usleep\(|Thread\.sleep|CFRunLoopRunInMode)/.test(content)) {
        pushFileFinding('ios.performance.blocking_main_thread', 'high', file, 1, 1, 'Potential main-thread blocking call detected', findings);
      }
      // Memory: delegate strong reference can cause leaks
      if (/\b(var|let)\s+\w*delegate\w*\s*:\s*[A-Za-z_][A-Za-z0-9_]*Delegate\??/.test(content) && !/\bweak\s+var\s+\w*delegate/.test(content)) {
        pushFileFinding('ios.memory.leaks', 'medium', file, 1, 1, 'Delegate property not weak (potential retain cycle)', findings);
      }
      // Optionals: missing optional chaining
      if (/if\s+([A-Za-z_]\w*)\s*!=\s*nil\s*\{[\s\S]{0,120}?\1!\./.test(content)) {
        pushFileFinding('ios.optionals.missing_optional_chaining', 'medium', file, 1, 1, 'Use optional chaining instead of if != nil and force unwrap', findings);
      }
      // Optionals: missing nil coalescing
      if (/([A-Za-z_]\w*)\s*!=\s*nil\s*\?\s*\1!\s*:\s*[^\n;]+/.test(content)) {
        pushFileFinding('ios.optionals.missing_nil_coalescing', 'medium', file, 1, 1, 'Prefer ?? over ternary with force unwrap', findings);
      }
      if (/Text\(\s*\"[^\"]+\"\s*\)/.test(content) && !/NSLocalizedString|\.localized/.test(content)) {
        pushFileFinding('ios.i18n.hardcoded_strings', 'medium', file, 1, 1, 'Hardcoded string in Text() without localization', findings);
      }
      if (/Date\(/.test(content) && !/DateFormatter/.test(content)) {
        pushFileFinding('ios.i18n.missing_date_formatter', 'medium', file, 1, 1, 'Date rendered without DateFormatter', findings);
      }
      if (/(String\s*\(\s*format\s*:\s*\".*%[0-9]*[fd].*\"|NumberFormatter)/.test(content) === false && /%[0-9]*[fd]/.test(content)) {
        pushFileFinding('ios.i18n.missing_number_formatter', 'medium', file, 1, 1, 'Numeric formatting without NumberFormatter', findings);
      }
      if (/(Data\([^)]*contentsOf|write\(to\:)/.test(content) && !/FileManager\.default/.test(content)) {
        pushFileFinding('ios.persistence.missing_filemanager', 'medium', file, 1, 1, 'File operations without FileManager usage', findings);
      }
      // Core Data migrations
      if (/(NSPersistentContainer|NSPersistentStoreCoordinator)/.test(content) && !/NSMigratePersistentStoresAutomaticallyOption|NSInferMappingModelAutomaticallyOption/.test(content)) {
        pushFileFinding('ios.persistence.migration', 'medium', file, 1, 1, 'Core Data without automatic migration options', findings);
      }
      // Core Data performance
      if (/NSFetchRequest\s*<[^>]+>/.test(content) && !/fetchBatchSize|predicate\s*=/.test(content)) {
        pushFileFinding('ios.persistence.performance', 'low', file, 1, 1, 'NSFetchRequest without predicate/batch size hints', findings);
      }
      // Security: ATS in Info.plist
      if (path.extname(file).toLowerCase() === '.plist' && /NSAppTransportSecurity/.test(content)) {
        if (/NSAllowsArbitraryLoads\s*<true\/>/.test(content)) {
          pushFileFinding('ios.security.missing_ats', 'high', file, 1, 'ATS allows arbitrary loads - enable HTTPS by default', findings);
        }
      }
      // Security: SSL pinning heuristic
      if (/URLSession\b|Alamofire\b/.test(content)) iosHasNetworkingUsage = true;
      if (/URLSession\b/.test(content) && !/SecTrust|evaluateServerTrust|pinned|certificate/i.test(content)) {
        pushFileFinding('ios.security.missing_ssl_pinning', 'high', file, 1, 1, 'Networking without SSL pinning indicators', findings);
      }
      if (/ServerTrustManager|pinnedCertificates|SecTrustEvaluate|SecPolicyCreateSSL|evaluators\s*:\s*\[|AFServerTrustPolicy/.test(content)) iosHasPinningIndicator = true;
      // Security: Keychain for sensitive values
      if (/UserDefaults\.standard\.(set|setValue)\([^,]+,\s*forKey\s*:\s*\"(password|token|secret|apiKey)/i.test(content)) {
        pushFileFinding('ios.security.missing_keychain', 'high', file, 1, 1, 'Sensitive data in UserDefaults - use Keychain', findings);
      }
      // Security: Secure Enclave token for keys
      if (/(SecItemAdd|SecItemUpdate|SecKeyCreateRandomKey)\(/.test(content) && !/kSecAttrTokenIDSecureEnclave/.test(content)) {
        pushFileFinding('ios.security.missing_secure_enclave', 'high', file, 1, 1, 'Keychain/SecKey usage without Secure Enclave token', findings);
      }
      // Security: Biometric capability presence (LAContext)
      if (/\bLAContext\b|evaluatePolicy\(/.test(content)) {
        iosHasBiometric = true;
      }
      // Security: Jailbreak detection heuristics presence
      if (/(Cydia|Substrate|DYLD_INSERT_LIBRARIES|jailbreak|apt\.saurik|MobileSubstrate|libsubstitute|cydia:\/\/)/i.test(content)) {
        iosHasJailbreakCheck = true;
      }
      if (/UIAccessibility\.isVoiceOverRunning|UIAccessibilityPostNotification|accessibilityVoiceOver/.test(content)) iosHasVoiceOverRef = true;
      if (/semanticContentAttribute\s*=\s*\.forceRightToLeft|UISemanticContentAttribute\.(forceRightToLeft|playback)/.test(content)) iosHasRtlSupport = true;
      if (/struct\s+\w+_Previews\s*:\s*PreviewProvider|:\s*PreviewProvider\b/.test(content)) iosHasPreviewProvider = true;
      if (/\.previewDevice\(/.test(content)) iosHasPreviewMultiple = true;
      if (/\.preferredColorScheme\(\.dark\)/.test(content)) iosPreviewHasDark = true;
      if (/\.preferredColorScheme\(\.light\)/.test(content)) iosPreviewHasLight = true;
      if (/import\s+QuartzCore\b|CABasicAnimation|CASpringAnimation|CAKeyframeAnimation|UIViewPropertyAnimator/.test(content)) iosHasCoreAnimationRef = true;
      if (/withAnimation\(|\.animation\(/.test(content)) iosHasAnimationUsage = true;
      // UI Testing: XCUITest usage and accessibility ids
      if (/class\s+\w+UITests\b/.test(content) && !/XCUIApplication\(\)/.test(content)) {
        pushFileFinding('ios.uitesting.missing_xcuitest', 'medium', file, 1, 1, 'UI tests missing XCUIApplication usage', findings);
      }
      if (/class\s+\w+UITests\b/.test(content) && /app\.(buttons|staticTexts|textFields|images)/.test(content) && !/accessibilityIdentifier/.test(content)) {
        pushFileFinding('ios.uitesting.missing_accessibility', 'medium', file, 1, 1, 'UI tests querying elements without accessibility identifiers', findings);
      }
      if (/class\s+\w+UITests\b/.test(content)) {
        const tapCount = (content.match(/\.tap\(\)/g) || []).length;
        if (/(sleep\(|usleep\(|Thread\.sleep)/.test(content)) {
          pushFileFinding('ios.ui_testing.flaky_tests', 'medium', file, 1, 1, 'UITest contains sleep calls leading to flakiness', findings);
        }
        if (tapCount >= 20) {
          pushFileFinding('ios.ui_testing.test_recording', 'low', file, 1, 1, 'UITest looks like recording artifact (excessive .tap())', findings);
        }
      }
      // Accessibility: labels, dynamic type, reduce motion
      if ((/Image\(/.test(content) || /Button\(/.test(content) || /TextField\(/.test(content)) && !/\.accessibilityLabel\(/.test(content)) {
        pushFileFinding('ios.accessibility.missing_labels', 'medium', file, 1, 1, 'UI elements without accessibilityLabel', findings);
      }
      if ((/Image\(/.test(content) || /Button\(/.test(content) || /TextField\(/.test(content)) && !/\.accessibilityAddTraits\(/.test(content)) {
        pushFileFinding('ios.accessibility.missing_traits', 'low', file, 1, 1, 'UI elements without accessibilityAddTraits', findings);
      }
      if (/\.font\(\.system\(size\s*:\s*\d+/.test(content)) {
        pushFileFinding('ios.accessibility.missing_dynamic_type', 'low', file, 1, 1, 'Fixed font size without Dynamic Type considerations', findings);
      }
      if (/\.animation\(/.test(content) && !/accessibilityReduceMotion|UIAccessibility\.isReduceMotionEnabled/.test(content)) {
        pushFileFinding('ios.accessibility.missing_reduce_motion', 'low', file, 1, 1, 'Animations without reduce motion handling', findings);
      }
      if (/GeometryReader\s*\{/.test(content)) {
        pushFileFinding('ios.swiftui.geometryreader_moderation', 'low', file, 1, 1, 'GeometryReader usage detected (use with moderation)', findings);
      }
      // Memory pressure handling
      if (/NotificationCenter\.default\.addObserver\([\s\S]*didReceiveMemoryWarning/.test(content) || /UIApplication\.didReceiveMemoryWarningNotification/.test(content)) {
        iosHasMemoryWarningObserver = true;
      }
      // Performance: cell reuse patterns
      if (/(UITableView|UICollectionView)/.test(content) && !/dequeueReusable(Cell|SupplementaryView)/.test(content)) {
        pushFileFinding('ios.performance.cell_reuse', 'medium', file, 1, 1, 'Collection/Table view usage without dequeueReusable*', findings);
      }
      // Performance: memoization heuristics (heavy ops inside SwiftUI body)
      if (/var\s+body\s*:\s*some\s+View[\s\S]*\{[\s\S]*\}/m.test(content) && /(Data\([^)]*contentsOf|JSONSerialization|Date\(\)|UUID\(\)|FileManager\.default)/.test(content)) {
        pushFileFinding('ios.performance.missing_memoization', 'low', file, 1, 1, 'Potential heavy operation inside SwiftUI body without memoization', findings);
      }
      // Performance: deep view hierarchy heuristic
      const vStackCount = (content.match(/\bVStack\s*\(/g) || []).length + (content.match(/\bHStack\s*\(/g) || []).length + (content.match(/\bZStack\s*\(/g) || []).length;
      if (vStackCount > 20) {
        pushFileFinding('ios.performance.view_hierarchy', 'low', file, 1, 1, 'Large number of nested stacks detected (consider simplifying hierarchy)', findings);
      }
      // Performance: energy impact heuristics
      if (/CADisplayLink\s*\(/.test(content) || /CADisplayLink\.(add|init)/.test(content)) {
        pushFileFinding('ios.performance.energy_impact', 'low', file, 1, 1, 'CADisplayLink usage may impact energy', findings);
      }
      if (/Timer\.(scheduledTimer|publish)\([^)]*timeInterval\s*:\s*0\.(0?[0-4])/m.test(content)) {
        pushFileFinding('ios.performance.energy_impact', 'low', file, 1, 1, 'High-frequency timer detected (< 0.05s)', findings);
      }
      if (/\.repeatForever\(/.test(content)) {
        pushFileFinding('ios.performance.energy_impact', 'low', file, 1, 1, 'Infinite animation repeat may impact energy', findings);
      }
      if (/while\s*\(\s*true\s*\)/.test(content)) {
        pushFileFinding('ios.performance.energy_impact', 'medium', file, 1, 1, 'Potential infinite loop detected', findings);
      }
      // Accessibility: keyboard navigation and focus management
      if (!/\.focusable\(|UIKeyCommand\b/.test(content)) {
        if (/(Button\(|TextField\(|List\(|ScrollView\()/.test(content)) {
          pushFileFinding('ios.accessibility.keyboard_navigation', 'low', file, 1, 1, 'Interactive elements without keyboard navigation hints', findings);
        }
      }
      if (!/\.focused\(|becomeFirstResponder\(\)/.test(content) && /(TextField\(|UITextField\b)/.test(content)) {
        pushFileFinding('ios.accessibility.focus_management', 'low', file, 1, 1, 'Input elements without explicit focus management', findings);
      }
      // Value Types: class where struct likely fits
      if (/\bclass\s+([A-Z][A-Za-z0-9_]*)\s*\{/.test(content) && !/:\s*[A-Za-z0-9_]+/.test(content) && !/(UIView|UIViewController|CALayer|NSObject)/.test(content)) {
        pushFileFinding('ios.values.reference_types_when_value', 'low', file, 1, 1, 'Class without inheritance – consider struct for value semantics', findings);
        pushFileFinding('ios.values.classes_instead_structs', 'low', file, 1, 1, 'Class without inheritance – prefer struct', findings);
      }
      // Value Types: struct mutability heuristic
      if (/\bstruct\s+[A-Z][A-Za-z0-9_]*\b/.test(content)) {
        const varCount = (content.match(/\bvar\b/g) || []).length;
        const letCount = (content.match(/\blet\b/g) || []).length;
        if (varCount > letCount + 3) {
          pushFileFinding('ios.values.mutability', 'low', file, 1, 1, 'Struct with excessive mutable properties (prefer let)', findings);
        }
      }
      // Memory: zombies heuristics (observers not removed)
      if (/NotificationCenter\.default\.addObserver\(/.test(content) && !/NotificationCenter\.default\.removeObserver\(/.test(content)) {
        pushFileFinding('ios.memory.zombies', 'medium', file, 1, 1, 'Observer added without corresponding removeObserver', findings);
      }
      if (/addObserver\([^)]*forKeyPath\s*:\s*"[^"]+"/.test(content) && !/removeObserver\(/.test(content)) {
        pushFileFinding('ios.memory.zombies', 'medium', file, 1, 1, 'KVO addObserver without removeObserver', findings);
      }
      // Memory: large allocations heuristics
      if (/Data\(count\s*:\s*(\d{7,})\)/.test(content) || /Array\(repeating\s*:\s*[^,]+,\s*count\s*:\s*(\d{6,})\)/.test(content)) {
        pushFileFinding('ios.memory.allocations', 'low', file, 1, 1, 'Large in-memory allocation detected', findings);
      }
      // i18n: locale aware formatting
      if (/(DateFormatter|NumberFormatter)\(\)/.test(content) && !/\.locale\s*=\s*Locale\b/.test(content)) {
        pushFileFinding('ios.i18n.locale_aware', 'low', file, 1, 1, 'Formatter without explicit Locale configured', findings);
      }
    }
  }
  if (iosAnchorFile) {
    if (!iosHasBiometric) {
      pushFileFinding('ios.security.missing_biometric', 'high', iosAnchorFile, 1, 1, 'LocalAuthentication (LAContext) not detected in project', findings);
    }
    if (!iosHasJailbreakCheck) {
      pushFileFinding('ios.security.missing_jailbreak_detection', 'medium', iosAnchorFile, 1, 1, 'No jailbreak detection heuristics detected in project', findings);
    }
    if (!iosHasVoiceOverRef) {
      pushFileFinding('ios.accessibility.missing_voiceover', 'low', iosAnchorFile, 1, 1, 'No VoiceOver usage detected in project', findings);
    }
    if (!iosHasStringsDict) {
      pushFileFinding('ios.i18n.missing_stringsdict', 'medium', iosAnchorFile, 1, 1, 'No .stringsdict files detected in project', findings);
    }
    if (!iosHasRtlSupport) {
      pushFileFinding('ios.i18n.missing_rtl', 'low', iosAnchorFile, 1, 1, 'No RTL semanticContentAttribute usage detected', findings);
    }
    if (iosHasNetworkingUsage && !iosHasPinningIndicator) {
      pushFileFinding('ios.security.certificate_pinning', 'critical', iosAnchorFile, 1, 1, 'Networking used without explicit certificate pinning configuration', findings);
    }
    if (!iosHasPreviewProvider) {
      pushFileFinding('ios.swiftui.preview_provider', 'low', iosAnchorFile, 1, 1, 'No PreviewProvider found in project', findings);
    }
    if (!(iosHasPreviewMultiple || (iosPreviewHasDark && iosPreviewHasLight))) {
      pushFileFinding('ios.swiftui.preview_multiple_devices', 'low', iosAnchorFile, 1, 1, 'No multiple device/theme previews detected', findings);
    }
    if (iosHasAnimationUsage && !iosHasCoreAnimationRef) {
      pushFileFinding('ios.performance.core_animation', 'low', iosAnchorFile, 1, 1, 'Animations used without Core Animation/Animator references', findings);
    }
    if (!iosHasMemoryWarningObserver) {
      pushFileFinding('ios.memory.memory_pressure', 'low', iosAnchorFile, 1, 1, 'No memory pressure handling (didReceiveMemoryWarning) detected', findings);
    }
    if (!iosHasAnyExtension) {
      pushFileFinding('ios.pop.missing_extensions', 'low', iosAnchorFile, 1, 1, 'No Swift extensions detected across project', findings);
    }
    if (!iosHasExtensionsFolder) {
      pushFileFinding('ios.organization.grouping', 'low', iosAnchorFile, 1, 1, 'No Extensions folder detected for logical grouping', findings);
    }
    if (iosPublicApiFound && !iosPublicApiDocsFound) {
      pushFileFinding('ios.organization.documentation', 'low', iosAnchorFile, 1, 1, 'Public APIs without minimal doc comments (///)', findings);
    }
    if (iosTaskCount > 3 && !iosTaskGroupFound) {
      pushFileFinding('ios.concurrency.structured_concurrency', 'low', iosAnchorFile, 1, 1, 'Multiple Task blocks without TaskGroup usage', findings);
    }
    if (!iosHasFastfile) {
      pushFileFinding('ios.cicd.code_signing', 'low', iosAnchorFile, 1, 1, 'Fastfile not found; code signing automation likely missing', findings);
    }
    if (!iosCiHasXcodeTests) {
      pushFileFinding('ios.cicd.test_automation', 'low', iosAnchorFile, 1, 1, 'CI pipeline without xcodebuild test/fastlane scan', findings);
    }
    if (!(iosHasDomainFolder && iosHasApplicationFolder && iosHasInfrastructureFolder && iosHasPresentationFolder)) {
      pushFileFinding('ios.arch.clean_architecture', 'low', iosAnchorFile, 1, 1, 'Clean Architecture folders (Domain/Application/Infrastructure/Presentation) not fully present', findings);
    }
    const iosSwiftFiles = files.filter(f => f.endsWith('.swift'));
    const iosAnyAnimation = iosSwiftFiles.some(f => f.includes('Animation') || f.includes('transition'));
    const iosEnergyHeuristics = iosSwiftFiles.some(f => f.includes('Timer') || f.includes('Location'));
    if (iosAnyAnimation || iosEnergyHeuristics) {
      pushFileFinding('ios.performance.instruments', 'low', iosAnchorFile, 1, 1, 'Consider Instruments profiling for performance/energy hotspots', findings);
    }
  }

  // ============================================
  // ANDROID - COMPOSE PERFORMANCE (8 reglas)
  // ============================================
  const hasKotlinFiles = files.some(f => f.endsWith('.kt'));
  if (hasKotlinFiles) {
    const androidAnchorFile = files.find(f => f.endsWith('.kt')) || files[0];

    // Concatenate all Kotlin content for global checks
    const kotlinFiles = files.filter(f => f.endsWith('.kt'));
    const allContent = kotlinFiles.map(f => {
      try { return fs.readFileSync(f, 'utf8'); } catch (error) { return ''; }
    }).join('\n');

    // 1. @Stable/@Immutable annotations
    const hasStableAnnotation = /import\s+androidx\.compose\.runtime\.Stable|@Stable/.test(allContent);
    const hasImmutableAnnotation = /import\s+androidx\.compose\.runtime\.Immutable|@Immutable/.test(allContent);
    const hasComplexDataClasses = /data\s+class\s+\w+.*\{[\s\S]{100,}?\}/.test(allContent);

    if (hasComplexDataClasses && !hasStableAnnotation && !hasImmutableAnnotation) {
      pushFileFinding('android.compose_perf.missing_stable_annotation', 'high', androidAnchorFile, 1, 1,
        'Data classes complejas sin @Stable/@Immutable causan re-compositions innecesarias', findings);
    }

    // 2. remember optimization
    const hasComposable = /@Composable/.test(allContent);
    const hasRemember = /remember\s*\{/.test(allContent);
    const hasComplexCalculations = /\.map\s*\{|\.filter\s*\{|\.reduce\s*\{/.test(allContent);

    if (hasComposable && hasComplexCalculations && !hasRemember) {
      pushFileFinding('android.compose_perf.missing_remember', 'high', androidAnchorFile, 1, 1,
        'Cálculos complejos en Composable sin remember{} causan recálculos en cada recomposition', findings);
    }

    // 3. derivedStateOf usage
    const hasDerivedStateOf = /derivedStateOf\s*\{/.test(allContent);
    const hasExpensiveComputations = allContent.split('\n').some(line =>
      (line.includes('.sortedBy') || line.includes('.groupBy')) &&
      line.includes('val ') &&
      !line.includes('remember')
    );

    if (hasExpensiveComputations && !hasDerivedStateOf) {
      pushFileFinding('android.compose_perf.missing_derived_state', 'high', androidAnchorFile, 1, 1,
        'Cálculos costosos (sortedBy, groupBy) sin derivedStateOf. Solo recalcular cuando cambien inputs', findings);
    }

    // 4. LaunchedEffect keys
    const launchedEffectMatches = allContent.match(/LaunchedEffect\([^)]*\)/g) || [];
    const launchedEffectWithoutKey = launchedEffectMatches.filter(le =>
      le === 'LaunchedEffect(true)' || le === 'LaunchedEffect(Unit)'
    );

    if (launchedEffectWithoutKey.length > 0) {
      pushFileFinding('android.compose_perf.launched_effect_keys', 'medium', androidAnchorFile, 1, 1,
        `${launchedEffectWithoutKey.length} LaunchedEffect sin keys apropiadas. Usar keys para controlar cuándo se relanza`, findings);
    }

    // 5. kotlinx.collections.immutable
    const hasImmutableCollections = /import\s+kotlinx\.collections\.immutable/.test(allContent);
    const hasListStateFlow = /StateFlow<List<|MutableStateFlow<List</.test(allContent);

    if (hasListStateFlow && !hasImmutableCollections) {
      pushFileFinding('android.compose_perf.missing_immutable_collections', 'medium', androidAnchorFile, 1, 1,
        'StateFlow<List<T>> sin kotlinx.collections.immutable puede causar re-renders innecesarios', findings);
    }

    // 6. Skip recomposition - parámetros inmutables
    const composableFunctions = allContent.match(/@Composable[\s\S]*?fun\s+\w+\([^)]*\)/g) || [];
    const mutableParams = composableFunctions.filter(func =>
      func.includes('var ') || (func.includes(': MutableList') || func.includes(': ArrayList'))
    );

    if (mutableParams.length > 0) {
      pushFileFinding('android.compose_perf.skip_recomposition', 'high', androidAnchorFile, 1, 1,
        `${mutableParams.length} Composables con parámetros mutables causan re-renders. Usar parámetros inmutables`, findings);
    }

    // 7. @Stable/@Immutable en data classes
    const dataClassesUsedInComposables = allContent.match(/data\s+class\s+(\w+)/g) || [];

    if (dataClassesUsedInComposables.length > 5 && !hasStableAnnotation) {
      pushFileFinding('android.compose_perf.missing_composable_stability', 'medium', androidAnchorFile, 1, 1,
        `${dataClassesUsedInComposables.length} data classes sin @Stable annotation. Marcar para estabilidad`, findings);
    }

    // 8. Unstable parameters detection
    const functionsWithClosureParams = composableFunctions.filter(func =>
      func.includes('() ->') || func.includes('(') && func.includes(') ->')
    );

    if (functionsWithClosureParams.length > 3) {
      pushFileFinding('android.compose_perf.unstable_parameters', 'medium', androidAnchorFile, 1, 1,
        `${functionsWithClosureParams.length} Composables con closures como parámetros (inestables). Considerar remember o stable wrappers`, findings);
    }

    // ============================================
    // ANDROID - MULTI-MODULE (7 reglas)
    // ============================================
    const hasSettingsGradle = files.some(f => f.endsWith('settings.gradle.kts') || f.endsWith('settings.gradle'));
    const settingsContent = hasSettingsGradle ?
      fs.readFileSync(files.find(f => f.endsWith('settings.gradle.kts') || f.endsWith('settings.gradle')), 'utf-8') : '';

    const featureModules = (settingsContent.match(/include\(":feature:\w+"\)/g) || []).length;
    const coreModules = (settingsContent.match(/include\(":core:\w+"\)/g) || []).length;
    const hasAppModule = /include\(":app"\)/.test(settingsContent);

    // 1. Feature modules
    if (hasSettingsGradle && featureModules === 0 && files.filter(f => f.endsWith('.kt')).length > 100) {
      pushFileFinding('android.multimodule.missing_feature_modules', 'medium', androidAnchorFile, 1, 1,
        'Proyecto grande sin feature modules. Modularizar en :feature:orders, :feature:users, etc.', findings);
    }

    // 2. Core modules
    if (hasSettingsGradle && coreModules === 0 && featureModules > 0) {
      pushFileFinding('android.multimodule.missing_core_modules', 'medium', androidAnchorFile, 1, 1,
        'Feature modules sin core modules. Crear :core:network, :core:database, :core:ui', findings);
    }

    // 3. App module
    if (hasSettingsGradle && !hasAppModule && featureModules > 0) {
      pushFileFinding('android.multimodule.missing_app_module', 'high', androidAnchorFile, 1, 1,
        ':app module faltante. Debe orquestar todos los feature modules', findings);
    }

    // 4. Wrong dependencies (Feature → Feature)
    const buildGradleFiles = files.filter(f => f.endsWith('build.gradle.kts') || f.endsWith('build.gradle'));
    buildGradleFiles.forEach(buildFile => {
      const buildContent = fs.readFileSync(buildFile, 'utf-8');

      if (buildFile.includes('feature/') && buildContent.includes('project(":feature:')) {
        pushFileFinding('android.multimodule.wrong_dependencies', 'high', buildFile, 1, 1,
          'Feature module depende de otro Feature. Extraer código compartido a :core', findings);
      }
    });

    // 5. Dynamic features
    if (hasSettingsGradle && !settingsContent.includes('dynamicFeatures')) {
      pushFileFinding('android.multimodule.missing_dynamic_features', 'low', androidAnchorFile, 1, 1,
        'Sin dynamic features. Considerar para app bundles grandes (>150MB)', findings);
    }

    // 6. Shared code violations
    const sharedFolders = files.filter(f => f.includes('/shared/') || f.includes('/common/'));
    if (sharedFolders.length > 10 && coreModules === 0) {
      pushFileFinding('android.multimodule.shared_code', 'medium', androidAnchorFile, 1, 1,
        'Código en /shared o /common sin modularización. Migrar a :core modules', findings);
    }

    // 7. API modules
    const hasApiFolder = files.some(f => f.includes('/api/'));
    if (hasApiFolder && !settingsContent.includes(':api')) {
      pushFileFinding('android.multimodule.missing_api_modules', 'low', androidAnchorFile, 1, 1,
        'Código API sin módulo separado. Crear :api module para exposed APIs', findings);
    }

    // ============================================
    // ANDROID - CI/CD (7 reglas)
    // ============================================
    const hasGitHubActions = files.some(f => f.includes('.github/workflows'));
    const hasGradleTasks = /task\s+\w+|tasks\.register/.test(allContent);
    const hasLintConfig = files.some(f => f.endsWith('lint.xml'));
    const hasDetekt = /detekt\s*\{|id\("io\.gitlab\.arturbosch\.detekt"\)/.test(allContent);

    // 1. GitHub Actions
    if (!hasGitHubActions) {
      pushFileFinding('android.cicd.missing_github_actions', 'medium', androidAnchorFile, 1, 1,
        'Proyecto sin GitHub Actions. Automatizar CI/CD con workflows', findings);
    }

    // 2. Gradle tasks
    if (!hasGradleTasks && buildGradleFiles.length > 0) {
      pushFileFinding('android.cicd.missing_gradle_tasks', 'low', androidAnchorFile, 1, 1,
        'Sin custom Gradle tasks. Crear tasks para assembleDebug, test, etc.', findings);
    }

    // 3. Lint configuration
    if (!hasLintConfig) {
      pushFileFinding('android.cicd.missing_lint', 'medium', androidAnchorFile, 1, 1,
        'Sin lint.xml configuration. Lint warnings deben tratarse como errores', findings);
    }

    // 4. Detekt
    if (!hasDetekt && files.filter(f => f.endsWith('.kt')).length > 20) {
      pushFileFinding('android.cicd.missing_detekt', 'medium', androidAnchorFile, 1, 1,
        'Sin Detekt para static analysis de Kotlin. Añadir para detectar code smells', findings);
    }

    // 5. Firebase App Distribution
    const hasFastlane = files.some(f => f.includes('fastlane/Fastfile'));
    if (hasFastlane) {
      const fastlaneContent = fs.readFileSync(files.find(f => f.includes('fastlane/Fastfile')), 'utf-8');

      if (!fastlaneContent.includes('firebase_app_distribution')) {
        pushFileFinding('android.cicd.missing_firebase_distribution', 'low', androidAnchorFile, 1, 1,
          'Fastlane sin Firebase App Distribution. Útil para beta testing', findings);
      }
    }

    // 6. Play Console
    if (hasFastlane) {
      const fastlaneContent = fs.readFileSync(files.find(f => f.includes('fastlane/Fastfile')), 'utf-8');

      if (!fastlaneContent.includes('upload_to_play_store') && !fastlaneContent.includes('supply')) {
        pushFileFinding('android.cicd.missing_play_console', 'low', androidAnchorFile, 1, 1,
          'Fastlane sin deployment automático a Play Console', findings);
      }
    }

    // 7. Automated testing
    if (hasGitHubActions) {
      const workflowFiles = files.filter(f => f.includes('.github/workflows') && f.endsWith('.yml'));
      let hasTestsInWorkflow = false;

      workflowFiles.forEach(wf => {
        const wfContent = fs.readFileSync(wf, 'utf-8');
        if (wfContent.includes('./gradlew test') || wfContent.includes('./gradlew check')) {
          hasTestsInWorkflow = true;
        }
      });

      if (!hasTestsInWorkflow) {
        pushFileFinding('android.cicd.missing_automated_testing', 'high', androidAnchorFile, 1, 1,
          'GitHub Actions sin tests automatizados. Añadir ./gradlew test a workflow', findings);
      }
    }

    // ============================================
    // ANDROID - JETPACK LIBRARIES (10 reglas)
    // ============================================
    const gradleFiles = buildGradleFiles.map(f => {
      try {
        return { path: f, content: fs.readFileSync(f, 'utf-8') };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const allGradleContent = gradleFiles.map(g => g.content).join('\n');

    // 1-8. Dependencias Jetpack
    const jetpackDeps = {
      'lifecycle-viewmodel-ktx': 'android.jetpack.missing_viewmodel',
      'navigation-compose': 'android.jetpack.missing_navigation',
      'room-ktx': 'android.jetpack.missing_room',
      'work-runtime-ktx': 'android.jetpack.missing_workmanager',
      'paging-compose': 'android.jetpack.missing_paging',
      'datastore-preferences': 'android.jetpack.missing_datastore',
      'hilt-android': 'android.jetpack.missing_hilt',
      'compose-bom': 'android.jetpack.missing_compose_bom'
    };

    Object.entries(jetpackDeps).forEach(([dep, ruleId]) => {
      if (!allGradleContent.includes(dep) && files.filter(f => f.endsWith('.kt')).length > 20) {
        const depName = dep.replace(/-/g, ' ');
        pushFileFinding(ruleId, 'medium', androidAnchorFile, 1, 1,
          `Dependencia ${depName} no encontrada en build.gradle. Añadir para funcionalidad Jetpack`, findings);
      }
    });

    // 9. Outdated versions
    const versionMatches = allGradleContent.match(/androidx\.\w+:\w+:(\d+\.\d+\.\d+)/g) || [];
    const oldVersions = versionMatches.filter(v => {
      const version = v.match(/(\d+\.\d+\.\d+)/)?.[1];
      return version && parseFloat(version) < 1.0;
    });

    if (oldVersions.length > 3) {
      pushFileFinding('android.jetpack.outdated_versions', 'medium', androidAnchorFile, 1, 1,
        `${oldVersions.length} dependencias Jetpack desactualizadas. Actualizar a versiones recientes`, findings);
    }

    // 10. Compose compiler
    if (hasComposable && !allGradleContent.includes('androidx.compose.compiler:compiler')) {
      pushFileFinding('android.jetpack.missing_compose_compiler', 'low', androidAnchorFile, 1, 1,
        'Compose sin compiler reports. Añadir para métricas de estabilidad', findings);
    }

    // ============================================
    // ANDROID - RURALGO ESPECÍFICO (8 reglas)
    // ============================================
    const hasOrdersModule = files.some(f => f.includes('/orders/') || f.includes('OrdersRepository'));
    const hasUsersModule = files.some(f => f.includes('/users/') || f.includes('UsersRepository'));

    // 1. DTO codegen
    const hasDTOs = files.some(f => f.includes('/dto/') || f.includes('Dto.kt'));
    const hasCodegen = files.some(f => f.includes('openapi') || f.includes('swagger-codegen'));

    if (hasDTOs && !hasCodegen && files.length > 50) {
      pushFileFinding('android.rural.dto_codegen', 'medium', androidAnchorFile, 1, 1,
        'DTOs manuales sin codegen. Considerar generar desde TypeScript backend con quicktype/OpenAPI', findings);
    }

    // 2. Repository pattern
    if (hasOrdersModule || hasUsersModule) {
      const hasRepositoryInterface = /interface\s+\w+Repository/.test(allContent);
      const hasRepositoryImpl = /class\s+\w+Repository.*:\s*\w+Repository/.test(allContent);

      if (!hasRepositoryInterface || !hasRepositoryImpl) {
        pushFileFinding('android.rural.repository_pattern', 'high', androidAnchorFile, 1, 1,
          'Falta Repository pattern (interface + implementación). Implementar para abstracción de datos', findings);
      }
    }

    // 3. Use Cases
    const hasUseCases = files.some(f => f.includes('UseCase.kt') || /class\s+\w+UseCase/.test(allContent));

    if ((hasOrdersModule || hasUsersModule) && !hasUseCases) {
      pushFileFinding('android.rural.use_cases', 'high', androidAnchorFile, 1, 1,
        'Falta Use Cases (CreateOrderUseCase, UpdateOrderStatusUseCase). Encapsular lógica de negocio', findings);
    }

    // 4. ViewModels específicos
    const hasViewModels = /class\s+\w+ViewModel.*:\s*ViewModel/.test(allContent);
    const hasSpecificViewModels =
      /OrdersListViewModel|OrderDetailViewModel|UsersViewModel/.test(allContent);

    if (hasOrdersModule && !hasSpecificViewModels) {
      pushFileFinding('android.rural.viewmodels', 'medium', androidAnchorFile, 1, 1,
        'Falta ViewModels específicos (OrdersListViewModel, OrderDetailViewModel)', findings);
    }

    // 5. Hilt DI en toda la app
    const hasHiltApp = /@HiltAndroidApp/.test(allContent);
    const hasHiltModules = /@Module/.test(allContent) && /@InstallIn/.test(allContent);

    if (files.filter(f => f.endsWith('.kt')).length > 50 && (!hasHiltApp || !hasHiltModules)) {
      pushFileFinding('android.rural.hilt_di', 'high', androidAnchorFile, 1, 1,
        'Hilt DI no implementado en toda la app. Usar Hilt para dependency injection completo', findings);
    }

    // 6. 100% Jetpack Compose
    const hasXMLLayouts = files.some(f => f.endsWith('.xml') && f.includes('/layout/'));

    if (hasXMLLayouts && hasComposable) {
      pushFileFinding('android.rural.compose_ui', 'medium', androidAnchorFile, 1, 1,
        'Mix de XML layouts y Compose. Migrar 100% a Jetpack Compose', findings);
    }

    // 7. Offline-first con Room
    const hasRoom = /@Entity|@Dao|@Database/.test(allContent);
    const hasNetworkCalls = /Retrofit|OkHttp|URLConnection/.test(allContent);

    if (hasNetworkCalls && !hasRoom) {
      pushFileFinding('android.rural.offline_first', 'medium', androidAnchorFile, 1, 1,
        'Network calls sin Room. Implementar offline-first con cache local', findings);
    }

    // 8. Material 3 theme
    const hasMaterial3 = /import\s+androidx\.compose\.material3/.test(allContent);
    const hasTheme = /\w+Theme\s*\{/.test(allContent);
    const hasDarkTheme = /isSystemInDarkTheme|darkColorScheme/.test(allContent);

    if (hasComposable && (!hasMaterial3 || !hasTheme || !hasDarkTheme)) {
      pushFileFinding('android.rural.material3_theme', 'medium', androidAnchorFile, 1, 1,
        'Falta Material 3 theme completo con dark mode. Implementar desde día 1', findings);
    }
  }
}

module.exports = { runTextScanner };
