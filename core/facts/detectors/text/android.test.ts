import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasAndroidAndroidEntryPointUsage,
  hasAndroidComposableFunctionUsage,
  hasAndroidArgumentsUsage,
  hasAndroidCoroutineCallbackUsage,
  hasAndroidGodActivityUsage,
  hasAndroidStateFlowUsage,
  hasAndroidSingleSourceOfTruthUsage,
  hasAndroidSharedFlowUsage,
  hasAndroidFlowBuilderUsage,
  hasAndroidFlowCollectUsage,
  hasAndroidCollectAsStateUsage,
  hasAndroidRememberUsage,
  hasAndroidDerivedStateOfUsage,
  hasAndroidLaunchedEffectUsage,
  hasAndroidLaunchedEffectKeysUsage,
  hasAndroidDisposableEffectUsage,
  hasAndroidPreviewUsage,
  hasAndroidAdaptiveLayoutsUsage,
  hasAndroidExistingStructureUsage,
  hasAndroidThemeUsage,
  hasAndroidDarkThemeUsage,
  hasAndroidAccessibilityUsage,
  hasAndroidContentDescriptionUsage,
  hasAndroidTalkBackUsage,
  hasAndroidTextScalingUsage,
  hasAndroidTouchTargetsUsage,
  hasAndroidRecompositionUsage,
  hasAndroidUiStateUsage,
  hasAndroidStateHoistingUsage,
  hasAndroidRepositoryPatternUsage,
  hasAndroidOrdersRepUsage,
  hasAndroidUseCaseUsage,
  hasAndroidViewModelUsage,
  hasAndroidViewModelScopeUsage,
  hasAndroidSupervisorScopeUsage,
  hasAndroidAppStartupUsage,
  hasAndroidAnalyticsUsage,
  findAndroidProfilerMatch,
  hasAndroidProfilerUsage,
  hasAndroidBaselineProfilesUsage,
  hasAndroidSkipRecompositionUsage,
  hasAndroidStabilityUsage,
  findKotlinConcreteDependencyDipMatch,
  findKotlinInterfaceSegregationMatch,
  findKotlinLiskovSubstitutionMatch,
  findKotlinOpenClosedWhenMatch,
  findKotlinPresentationSrpMatch,
  hasAndroidAsyncTaskUsage,
  hasAndroidFindViewByIdUsage,
  hasAndroidHiltAndroidAppUsage,
  hasAndroidHiltDependencyUsage,
  hasAndroidWorkManagerDependencyUsage,
  hasAndroidWorkManagerBackgroundTaskUsage,
  hasAndroidHiltFrameworkUsage,
  hasAndroidInjectConstructorUsage,
  hasAndroidJavaSourceCode,
  hasAndroidDispatcherUsage,
  hasAndroidCoroutineTryCatchUsage,
  hasAndroidHardcodedStringUsage,
  hasAndroidBuildConfigConstantUsage,
  findAndroidStringsXmlMatch,
  findAndroidStringFormattingMatch,
  hasAndroidStringsXmlUsage,
  hasAndroidStringFormattingUsage,
  findAndroidPluralsXmlMatch,
  hasAndroidPluralsXmlUsage,
  hasAndroidNoConsoleLogUsage,
  hasAndroidTimberUsage,
  hasAndroidModuleInstallInUsage,
  hasAndroidBindsUsage,
  hasAndroidProvidesUsage,
  hasAndroidRxJavaUsage,
  hasAndroidSingletonUsage,
  hasAndroidInstrumentedTestUsage,
  hasAndroidAaaPatternUsage,
  hasAndroidGivenWhenThenUsage,
  hasAndroidJvmUnitTestUsage,
  hasAndroidVersionCatalogUsage,
  hasAndroidDaoSuspendFunctionsUsage,
  hasAndroidTransactionUsage,
  hasAndroidSuspendFunctionsApiServiceUsage,
  hasAndroidSuspendFunctionsAsyncUsage,
  hasAndroidAsyncAwaitParallelismUsage,
  hasAndroidSingleActivityComposeShellUsage,
  hasAndroidWithContextUsage,
  hasAndroidViewModelScopedUsage,
  findAndroidComposableFunctionMatch,
  findAndroidArgumentsMatch,
  findAndroidCoroutineCallbackMatch,
  findAndroidGodActivityMatch,
  findAndroidDaoSuspendFunctionsMatch,
  findAndroidSuspendFunctionsApiServiceMatch,
  findAndroidSuspendFunctionsAsyncMatch,
  findAndroidAsyncAwaitParallelismMatch,
  findAndroidStateFlowMatch,
  findAndroidSingleSourceOfTruthMatch,
  findAndroidSharedFlowMatch,
  findAndroidFlowBuilderMatch,
  findAndroidFlowCollectMatch,
  findAndroidCollectAsStateMatch,
  findAndroidRememberMatch,
  findAndroidDerivedStateOfMatch,
  findAndroidLaunchedEffectMatch,
  findAndroidLaunchedEffectKeysMatch,
  findAndroidDisposableEffectMatch,
  findAndroidPreviewMatch,
  findAndroidAdaptiveLayoutsMatch,
  findAndroidExistingStructureMatch,
  findAndroidThemeMatch,
  findAndroidDarkThemeMatch,
  findAndroidAccessibilityMatch,
  findAndroidContentDescriptionMatch,
  findAndroidTalkBackMatch,
  findAndroidTextScalingMatch,
  findAndroidTouchTargetsMatch,
  findAndroidRecompositionMatch,
  findAndroidUiStateMatch,
  findAndroidStateHoistingMatch,
  findAndroidRepositoryPatternMatch,
  findAndroidOrdersRepMatch,
  findAndroidUseCaseMatch,
  findAndroidViewModelMatch,
  findAndroidViewModelScopeMatch,
  findAndroidSupervisorScopeMatch,
  findAndroidAppStartupMatch,
  findAndroidAnalyticsMatch,
  findAndroidBaselineProfilesMatch,
  findAndroidSkipRecompositionMatch,
  findAndroidStabilityMatch,
  findAndroidInstrumentedTestMatch,
  findAndroidAaaPatternMatch,
  findAndroidGivenWhenThenMatch,
  findAndroidJvmUnitTestMatch,
  findAndroidVersionCatalogMatch,
  findAndroidWorkManagerDependencyMatch,
  findAndroidWorkManagerBackgroundTaskMatch,
  findAndroidSingleActivityComposeShellMatch,
  findAndroidTransactionMatch,
  hasKotlinForceUnwrapUsage,
  hasKotlinGlobalScopeUsage,
  hasKotlinRunBlockingUsage,
  hasKotlinThreadSleepCall,
} from './android';

test('hasKotlinThreadSleepCall detecta Thread.sleep en codigo Kotlin real', () => {
  const source = `
fun waitForRetry() {
  Thread.sleep(250)
}
`;
  assert.equal(hasKotlinThreadSleepCall(source), true);
});

test('hasKotlinThreadSleepCall ignora coincidencias en comentarios y strings', () => {
  const source = `
// Thread.sleep(500)
val debug = "Thread.sleep(500)"
`;
  assert.equal(hasKotlinThreadSleepCall(source), false);
});

test('hasKotlinGlobalScopeUsage detecta launch y async sobre GlobalScope', () => {
  const launchSource = `
fun loadData() {
  GlobalScope.launch {
    println("ok")
  }
}
`;
  const asyncSource = `
fun loadAsync() {
  GlobalScope.async {
    42
  }
}
`;
  assert.equal(hasKotlinGlobalScopeUsage(launchSource), true);
  assert.equal(hasKotlinGlobalScopeUsage(asyncSource), true);
});

test('hasKotlinGlobalScopeUsage descarta metodos no bloqueados por la regla', () => {
  const source = `
fun cancelScope() {
  GlobalScope.cancel()
}
`;
  assert.equal(hasKotlinGlobalScopeUsage(source), false);
});

test('hasKotlinRunBlockingUsage detecta runBlocking con llaves y con generics', () => {
  const bracesSource = `
fun main() {
  runBlocking {
    println("done")
  }
}
`;
  const genericSource = `
fun main() {
  runBlocking<Unit> {
    println("done")
  }
}
`;
  assert.equal(hasKotlinRunBlockingUsage(bracesSource), true);
  assert.equal(hasKotlinRunBlockingUsage(genericSource), true);
});

test('hasKotlinRunBlockingUsage ignora comentarios y nombres parciales', () => {
  const commentedSource = `
// runBlocking { println("debug") }
val sample = "runBlocking { println(\\"debug\\") }"
`;
  const partialSource = `
fun main() {
  myrunBlocking {
    println("done")
  }
}
`;
  assert.equal(hasKotlinRunBlockingUsage(commentedSource), false);
  assert.equal(hasKotlinRunBlockingUsage(partialSource), false);
});

test('findAndroidCoroutineCallbackMatch devuelve payload semantico para callbacks Android', () => {
  const source = `
fun loadRemoteData() {
  service.enqueue()
  task.addOnSuccessListener { }
  task.addOnCompleteListener { }
}
`;

  const match = findAndroidCoroutineCallbackMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'call',
    name: 'enqueue',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'addOnSuccessListener', lines: [4] },
    { kind: 'call', name: 'addOnCompleteListener', lines: [5] },
  ]);
  assert.match(match.why, /callback/i);
  assert.match(match.impact, /callback|error|cancel/i);
  assert.match(match.expected_fix, /coroutines|Flow|suspend/i);
});

test('hasAndroidCoroutineCallbackUsage ignora comentarios, strings y llamadas no callback', () => {
  const source = `
// service.enqueue()
val sample = "addOnSuccessListener()"
fun loadRemoteData() {
  loadCoroutine()
}
`;

  assert.equal(hasAndroidCoroutineCallbackUsage(source), false);
});

test('findAndroidStateFlowMatch devuelve payload semantico para StateFlow en ViewModel', () => {
  const source = `
class CatalogViewModel : ViewModel() {
  private val _uiState = MutableStateFlow(CatalogUiState())
  val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()
}
`;

  const match = findAndroidStateFlowMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogViewModel',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'MutableStateFlow', lines: [3] },
    { kind: 'property', name: 'StateFlow', lines: [4] },
    { kind: 'call', name: 'asStateFlow', lines: [4] },
  ]);
  assert.match(match.why, /StateFlow/i);
  assert.match(match.impact, /estado|UI|Compose/i);
  assert.match(match.expected_fix, /MutableStateFlow|StateFlow|ViewModel/i);
});

test('findAndroidSingleSourceOfTruthMatch devuelve payload semantico para Single source of truth en ViewModel', () => {
  const source = `
class CatalogViewModel : ViewModel() {
  private val _uiState = MutableStateFlow(CatalogUiState())
  val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()
}
`;

  const match = findAndroidSingleSourceOfTruthMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogViewModel',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'MutableStateFlow', lines: [3] },
    { kind: 'property', name: 'StateFlow', lines: [4] },
    { kind: 'call', name: 'asStateFlow', lines: [4] },
  ]);
  assert.match(match.why, /fuente de verdad|single source/i);
  assert.match(match.impact, /estado|UI|ViewModel/i);
  assert.match(match.expected_fix, /MutableStateFlow|StateFlow|ViewModel/i);
});

test('findAndroidSharedFlowMatch devuelve payload semantico para SharedFlow de eventos', () => {
  const source = `
class CatalogViewModel : ViewModel() {
  private val _events = MutableSharedFlow<UiEvent>()
  val events: SharedFlow<UiEvent> = _events.asSharedFlow()

  fun onRetry() {
    _events.tryEmit(UiEvent.Retry)
  }
}
`;

  const match = findAndroidSharedFlowMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'call',
    name: 'MutableSharedFlow',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'SharedFlow', lines: [4] },
    { kind: 'call', name: 'asSharedFlow', lines: [4] },
    { kind: 'call', name: 'tryEmit', lines: [7] },
  ]);
  assert.match(match.why, /SharedFlow/i);
  assert.match(match.impact, /evento|stream|callback/i);
  assert.match(match.expected_fix, /MutableSharedFlow|SharedFlow|tryEmit/i);
});

test('findAndroidFlowBuilderMatch devuelve payload semantico para builders de Flow', () => {
  const source = `
fun observeCatalog(): Flow<List<Int>> = flow {
  emit(listOf(1))
}

val flowValues = flowOf(1, 2, 3)
val stream = listOf(4, 5).asFlow()
`;

  const match = findAndroidFlowBuilderMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'call',
    name: 'flow { emit() }',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'flowOf', lines: [6] },
    { kind: 'call', name: 'asFlow', lines: [7] },
  ]);
  assert.match(match.why, /Flow/i);
  assert.match(match.impact, /stream|declarative|test/i);
  assert.match(match.expected_fix, /flow \{ emit|flowOf|asFlow/i);
});

test('findAndroidFlowCollectMatch devuelve payload semantico para terminal operator collect', () => {
  const source = `
fun observeCatalog(scope: CoroutineScope, flow: Flow<List<Int>>) {
  flow.collect { items -> render(items) }
  flow.collectLatest { items -> renderLatest(items) }
  flow.launchIn(scope)
}
`;

  const match = findAndroidFlowCollectMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'call',
    name: 'collect',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'collectLatest', lines: [4] },
    { kind: 'call', name: 'launchIn', lines: [5] },
  ]);
  assert.match(match.why, /consume|Flow/i);
  assert.match(match.impact, /consumidor|terminal|observa/i);
  assert.match(match.expected_fix, /collect|collectLatest|launchIn/i);
});

test('findAndroidCollectAsStateMatch devuelve payload semantico para Compose collectAsState', () => {
  const source = `
@Composable fun CatalogScreen(viewModel: CatalogViewModel) {
  val state by viewModel.uiState.collectAsState()
  val lifecycleState by viewModel.uiState.collectAsStateWithLifecycle()
}
`;

  const match = findAndroidCollectAsStateMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun CatalogScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'collectAsState', lines: [3] },
    { kind: 'call', name: 'collectAsStateWithLifecycle', lines: [4] },
  ]);
  assert.match(match.why, /collectAsState|Compose/i);
  assert.match(match.impact, /UI|estado|Flow/i);
  assert.match(match.expected_fix, /collectAsState|collectAsStateWithLifecycle/i);
});

test('findAndroidUiStateMatch devuelve payload semantico para sealed class UiState', () => {
  const source = `
sealed class CatalogUiState {
  data object Loading : CatalogUiState()
  data class Success(val items: List<String>) : CatalogUiState()
  data class Error(val message: String) : CatalogUiState()
}
`;

  const match = findAndroidUiStateMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogUiState',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'Loading', lines: [3] },
    { kind: 'member', name: 'Success', lines: [4] },
    { kind: 'member', name: 'Error', lines: [5] },
  ]);
  assert.match(match.why, /UiState|Loading|Success|Error/i);
  assert.match(match.impact, /estado|UI|tipado|cerrado/i);
  assert.match(match.expected_fix, /sealed class|Loading|Success|Error/i);
});

test('findAndroidStateHoistingMatch devuelve payload semantico para composable con estado local', () => {
  const source = `
@Composable fun CounterScreen() {
  var count by rememberSaveable { mutableStateOf(0) }
}
`;

  const match = findAndroidStateHoistingMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun CounterScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'rememberSaveable', lines: [3] },
    { kind: 'call', name: 'mutableStateOf', lines: [3] },
  ]);
  assert.match(match.why, /estado/i);
  assert.match(match.impact, /fuente|composable|UI/i);
  assert.match(match.expected_fix, /eleva|ViewModel|callbacks/i);
});

test('hasAndroidUiStateUsage detecta UiState sealed class completa y descarta estados incompletos', () => {
  const source = `
sealed class CatalogUiState {
  data object Loading : CatalogUiState()
  data class Success(val items: List<String>) : CatalogUiState()
  data class Error(val message: String) : CatalogUiState()
}
`;

  assert.equal(hasAndroidUiStateUsage(source), true);
  assert.equal(
    hasAndroidUiStateUsage(`
sealed class CatalogUiState {
  data object Loading : CatalogUiState()
  data class Success(val items: List<String>) : CatalogUiState()
}
`),
    false
  );
});

test('findAndroidUseCaseMatch devuelve payload semantico para UseCase Android', () => {
  const source = `
class CatalogUseCase(
  private val catalogRepository: CatalogRepository,
) {
  suspend operator fun invoke(): List<String> {
    return catalogRepository.loadCatalog()
  }
}
`;

  const match = findAndroidUseCaseMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogUseCase',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'use case dependency', lines: [3] },
    { kind: 'member', name: 'use case operation', lines: [5] },
  ]);
  assert.match(match.why, /UseCase|l[oó]gica de negocio/i);
  assert.match(match.impact, /testear|reutilizar|ViewModel/i);
  assert.match(match.expected_fix, /UseCase|operaci[oó]n|dependencias/i);
});

test('findAndroidRepositoryPatternMatch devuelve payload semantico para Repository Android', () => {
  const source = `
class CatalogRepository @Inject constructor(
  private val api: CatalogApi,
  private val catalogDataSource: CatalogDataSource,
) {
  suspend fun loadCatalog(): List<String> {
    return api.loadCatalog()
  }

  fun saveCatalog(items: List<String>) {
    catalogDataSource.save(items)
  }
}
`;

  const match = findAndroidRepositoryPatternMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogRepository',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'repository dependency', lines: [3, 4] },
    { kind: 'member', name: 'repository operation', lines: [6, 10] },
  ]);
  assert.match(match.why, /repository|acceso a datos/i);
  assert.match(match.impact, /contrato|persistencia|red/i);
  assert.match(match.expected_fix, /Repository|fachada|dependencias/i);
  assert.equal(hasAndroidRepositoryPatternUsage(source), true);
});

test('findAndroidOrdersRepMatch devuelve payload semantico para OrdersRep Android', () => {
  const source = `
class OrdersRep @Inject constructor(
  private val remoteDataSource: OrdersRemoteDataSource,
) {
  suspend fun loadOrders(): List<String> {
    return remoteDataSource.loadOrders()
  }
}
`;

  const match = findAndroidOrdersRepMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'OrdersRep',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'repository dependency', lines: [3] },
    { kind: 'member', name: 'repository operation', lines: [5] },
  ]);
  assert.match(match.why, /OrdersRep|pedidos|acceso a datos/i);
  assert.match(match.impact, /pedidos|contrato|red/i);
  assert.match(match.expected_fix, /OrdersRep|fachada|dependencias/i);
  assert.equal(hasAndroidOrdersRepUsage(source), true);
});

test('hasAndroidUseCaseUsage detecta UseCase real y descarta clases sin operacion publica', () => {
  const source = `
class CatalogUseCase(
  private val catalogRepository: CatalogRepository,
) {
  private fun helper() {}
}
`;

  assert.equal(hasAndroidUseCaseUsage(source), false);
  assert.equal(
    hasAndroidUseCaseUsage(`
class CatalogUseCase(
  private val catalogRepository: CatalogRepository,
) {
  suspend operator fun invoke(): List<String> {
    return catalogRepository.loadCatalog()
  }
}
`),
    true
  );
});

test('hasAndroidRepositoryPatternUsage detecta Repository real y descarta helpers sin acceso a datos', () => {
  const source = `
class CatalogHelper {
  fun build() {}
}
`;

  assert.equal(hasAndroidRepositoryPatternUsage(source), false);
  assert.equal(
    hasAndroidRepositoryPatternUsage(`
interface CatalogRepository {
  suspend fun loadCatalog(): List<String>
}
`),
    true
  );
});

test('hasAndroidOrdersRepUsage detecta OrdersRep real y descarta helpers sin repositorio', () => {
  const source = `
class OrdersRepHelper {
  fun build() {}
}
`;

  assert.equal(hasAndroidOrdersRepUsage(source), false);
  assert.equal(
    hasAndroidOrdersRepUsage(`
class OrdersRep @Inject constructor(
  private val remoteDataSource: OrdersRemoteDataSource,
) {
  suspend fun loadOrders(): List<String> = remoteDataSource.loadOrders()
}
`),
    true
  );
});

test('findAndroidViewModelMatch devuelve payload semantico para ViewModel AndroidX', () => {
  const source = `
class CatalogViewModel : ViewModel()
`;

  const match = findAndroidViewModelMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogViewModel',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'androidx.lifecycle.ViewModel', lines: [2] },
  ]);
  assert.match(match.why, /ViewModel/i);
  assert.match(match.impact, /configuraci[oó]n|estado|ViewModel/i);
  assert.match(match.expected_fix, /ViewModel|estado|configuraci[oó]n/i);
});

test('hasAndroidStateFlowUsage ignora comentarios, strings y ViewModels sin estado observable', () => {
  const source = `
// MutableStateFlow(value)
val sample = "StateFlow"
class CatalogViewModel : ViewModel() {
  fun load() {}
}
`;

  assert.equal(hasAndroidStateFlowUsage(source), false);
});

test('hasAndroidSingleSourceOfTruthUsage detecta ViewModel con estado de fuente unica y descarta helpers sin estado', () => {
  const source = `
class CatalogHelper {
  fun load() {}
}
`;

  assert.equal(hasAndroidSingleSourceOfTruthUsage(source), false);
  assert.equal(
    hasAndroidSingleSourceOfTruthUsage(`
class CatalogViewModel : ViewModel() {
  private val _uiState = MutableStateFlow(CatalogUiState())
  val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()
}
`),
    true
  );
});

test('hasAndroidSharedFlowUsage ignora comentarios, strings y ViewModels sin eventos', () => {
  const source = `
// MutableSharedFlow(value)
val sample = "SharedFlow"
class CatalogViewModel : ViewModel() {
  fun load() {}
}
`;

  assert.equal(hasAndroidSharedFlowUsage(source), false);
});

test('hasAndroidFlowBuilderUsage ignora comentarios, strings y archivos sin builders de Flow', () => {
  const source = `
// flow { emit(1) }
val sample = "flowOf(1, 2, 3)"
fun load() {
  val value = listOf(1, 2, 3)
}
`;

  assert.equal(hasAndroidFlowBuilderUsage(source), false);
});

test('hasAndroidFlowCollectUsage ignora comentarios, strings y archivos sin terminal operators de Flow', () => {
  const source = `
// flow.collect { }
val sample = "collectLatest"
fun render() {
  println("no flow collection here")
}
`;

  assert.equal(hasAndroidFlowCollectUsage(source), false);
});

test('hasAndroidCollectAsStateUsage ignora comentarios, strings y archivos sin collectAsState', () => {
  const source = `
// collectAsState()
val sample = "collectAsStateWithLifecycle"
fun render() {
  println("no compose state collection here")
}
`;

  assert.equal(hasAndroidCollectAsStateUsage(source), false);
});

test('findAndroidRememberMatch devuelve payload semantico para remember en Compose', () => {
  const source = `
@Composable fun ChartScreen() {
  val formatter = remember { java.text.DecimalFormat("#.##") }
}
`;

  const match = findAndroidRememberMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun ChartScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [{ kind: 'call', name: 'remember', lines: [3] }]);
  assert.match(match.why, /remember|recrear/i);
  assert.match(match.impact, /estables|recomponer/i);
  assert.match(match.expected_fix, /remember|memoizar/i);
});

test('hasAndroidRememberUsage ignora comentarios, strings y rememberSaveable', () => {
  const source = `
// remember { }
val sample = "remember { }"
@Composable fun Sample() {
  val state = rememberSaveable { 1 }
}
`;

  assert.equal(hasAndroidRememberUsage(source), false);
});

test('findAndroidDerivedStateOfMatch devuelve payload semantico para derivedStateOf en Compose', () => {
  const source = `
@Composable fun SearchScreen(query: String) {
  val hasQuery by derivedStateOf { query.isNotBlank() }
}
`;

  const match = findAndroidDerivedStateOfMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun SearchScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [{ kind: 'call', name: 'derivedStateOf', lines: [3] }]);
  assert.match(match.why, /derivedStateOf|caro/i);
  assert.match(match.impact, /recomput|estado/i);
  assert.match(match.expected_fix, /derivedStateOf|derivar/i);
});

test('hasAndroidDerivedStateOfUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidDerivedStateOfUsage(`
// derivedStateOf { }
val sample = "derivedStateOf"
@Composable fun Sample() {
  Text("ok")
}
`),
    false
  );
});

test('findAndroidLaunchedEffectMatch devuelve payload semantico para LaunchedEffect en Compose', () => {
  const source = `
@Composable fun Screen(viewModel: ScreenViewModel) {
  LaunchedEffect(viewModel.userId) {
    viewModel.refresh()
  }
}
`;

  const match = findAndroidLaunchedEffectMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun Screen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [{ kind: 'call', name: 'LaunchedEffect', lines: [3] }]);
  assert.match(match.why, /LaunchedEffect|lifecycle/i);
  assert.match(match.impact, /cancelado|relanzado|composición/i);
  assert.match(match.expected_fix, /LaunchedEffect|lifecycle|claves/i);
});

test('hasAndroidLaunchedEffectUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidLaunchedEffectUsage(`\n// LaunchedEffect(Unit)\nval sample = "LaunchedEffect(Unit)"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidLaunchedEffectKeysMatch devuelve payload semantico para LaunchedEffect keys en Compose', () => {
  const source = `
@Composable fun Screen(viewModel: ScreenViewModel) {
  LaunchedEffect(viewModel.userId, viewModel.refreshTrigger) {
    viewModel.refresh()
  }
}
`;

  const match = findAndroidLaunchedEffectKeysMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun Screen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [{ kind: 'call', name: 'LaunchedEffect keys', lines: [3] }]);
  assert.match(match.why, /LaunchedEffect|keys|relanza/i);
  assert.match(match.impact, /keys|relanzado|input/i);
  assert.match(match.expected_fix, /claves|LaunchedEffect|relanzar/i);
});

test('hasAndroidLaunchedEffectKeysUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidLaunchedEffectKeysUsage(`\n// LaunchedEffect(viewModel.userId)\nval sample = "LaunchedEffect(viewModel.userId)"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidDisposableEffectMatch devuelve payload semantico para DisposableEffect en Compose', () => {
  const source = `
@Composable fun Screen() {
  DisposableEffect(Unit) {
    onDispose { }
  }
}
`;

  const match = findAndroidDisposableEffectMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun Screen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [{ kind: 'call', name: 'DisposableEffect', lines: [3] }]);
  assert.match(match.why, /DisposableEffect|limpiar|composición/i);
  assert.match(match.impact, /libera|recursos|Compose/i);
  assert.match(match.expected_fix, /DisposableEffect|limpiar|lifecycle/i);
});

test('hasAndroidDisposableEffectUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidDisposableEffectUsage(`\n// DisposableEffect(Unit)\nval sample = "DisposableEffect(Unit)"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidPreviewMatch devuelve payload semantico para @Preview en Compose', () => {
  const source = `
data class PreviewUiState(val label: String)
@Preview(showBackground = true)
@Composable fun PreviewCounter(state: PreviewUiState) {
  Text(text = state.label)
}
`;

  const match = findAndroidPreviewMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun PreviewCounter',
    lines: [4],
  });
  assert.deepEqual(match.related_nodes, [{ kind: 'call', name: '@Preview', lines: [3] }]);
  assert.match(match.why, /Preview|UI|app/i);
  assert.match(match.impact, /renderizar|Android Studio|Compose/i);
  assert.match(match.expected_fix, /Preview|composable|UI/i);
});

test('hasAndroidPreviewUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidPreviewUsage(`\n// @Preview(showBackground = true)\nval sample = "@Preview(showBackground = true)"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidAdaptiveLayoutsMatch devuelve payload semantico para WindowSizeClass en Compose', () => {
  const source = `
fun ResponsiveScreen(activity: Activity) {
  val windowSizeClass = calculateWindowSizeClass(activity)
  when (windowSizeClass.widthSizeClass) {
    WindowWidthSizeClass.Compact -> Unit
    WindowWidthSizeClass.Medium -> Unit
    WindowWidthSizeClass.Expanded -> Unit
  }
}
`;

  const match = findAndroidAdaptiveLayoutsMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'call',
    name: 'calculateWindowSizeClass',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'WindowWidthSizeClass', lines: [5, 6, 7] },
  ]);
  assert.match(match.why, /WindowSizeClass|adaptive|responsive/i);
  assert.match(match.impact, /layout|pantallas|responsive/i);
  assert.match(match.expected_fix, /calculateWindowSizeClass|WindowWidthSizeClass/i);
});

test('hasAndroidAdaptiveLayoutsUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidAdaptiveLayoutsUsage(`\n// calculateWindowSizeClass(activity)\nval sample = "WindowWidthSizeClass.Compact"\nfun render() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidExistingStructureMatch devuelve payload semantico para interfaces y modules Android', () => {
  const source = `
interface SessionContract {
  fun load(): String
}

@Module
@InstallIn(SingletonComponent::class)
object SessionModule {
  @Provides
  fun provideSessionContract(): SessionContract = RealSessionContract()
}
`;

  const match = findAndroidExistingStructureMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'interface declaration: SessionContract',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'module annotation', lines: [6] },
    { kind: 'member', name: 'module annotation', lines: [7] },
  ]);
  assert.match(match.why, /estructura existente|interfaces|módulos/i);
  assert.match(match.impact, /dependenc|gradle|di/i);
  assert.match(match.expected_fix, /módulos|interfaces|Gradle/i);
});

test('findAndroidExistingStructureMatch devuelve payload semantico para dependencies Gradle', () => {
  const source = `
plugins {
  id("com.android.application")
  kotlin("android")
}

dependencies {
  implementation(libs.androidx.core.ktx)
  api(libs.core.domain)
}
`;

  const match = findAndroidExistingStructureMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'dependencies block',
    lines: [7],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'dependency declaration', lines: [8] },
    { kind: 'member', name: 'dependency declaration', lines: [9] },
  ]);
  assert.match(match.why, /Gradle|dependenc/i);
  assert.match(match.impact, /módulos|dependencias|Gradle/i);
  assert.match(match.expected_fix, /dependencies|catálogo|Gradle/i);
});

test('hasAndroidExistingStructureUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidExistingStructureUsage(`\n// interface SessionRepository\nval sample = "dependencies { implementation(\\"foo\\") }"\n`),
    false
  );
});

test('findAndroidThemeMatch devuelve payload semantico para theme Material 3 en Compose', () => {
  const source = `
@Composable
fun AppTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = darkColorScheme(),
    typography = AppTypography,
    shapes = AppShapes,
    content = content
  )
}
`;

  const match = findAndroidThemeMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun AppTheme',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'MaterialTheme', lines: [4] },
    { kind: 'property', name: 'colorScheme', lines: [5] },
    { kind: 'property', name: 'typography', lines: [6] },
    { kind: 'property', name: 'shapes', lines: [7] },
  ]);
  assert.match(match.why, /tema|MaterialTheme|colorScheme/i);
  assert.match(match.impact, /coherencia|escalabilidad|UI/i);
  assert.match(match.expected_fix, /tema|colorScheme|typography|shapes/i);
});

test('hasAndroidThemeUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidThemeUsage(`\n// MaterialTheme(colorScheme = darkColorScheme())\nval sample = "MaterialTheme(colorScheme = darkColorScheme())"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidDarkThemeMatch devuelve payload semantico para soporte de tema oscuro', () => {
  const source = `
@Composable
fun AppTheme(content: @Composable () -> Unit) {
  val darkTheme = isSystemInDarkTheme()
  val colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme()
  MaterialTheme(
    colorScheme = colorScheme,
    typography = AppTypography,
    shapes = AppShapes,
    content = content
  )
}
`;

  const match = findAndroidDarkThemeMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun AppTheme',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'isSystemInDarkTheme', lines: [4] },
    { kind: 'call', name: 'darkColorScheme', lines: [5] },
    { kind: 'call', name: 'lightColorScheme', lines: [5] },
    { kind: 'call', name: 'MaterialTheme', lines: [6] },
  ]);
  assert.match(match.why, /tema oscuro|isSystemInDarkTheme/i);
  assert.match(match.impact, /tema oscuro|UI|sistema/i);
  assert.match(match.expected_fix, /isSystemInDarkTheme|darkColorScheme|lightColorScheme/i);
});

test('hasAndroidDarkThemeUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidDarkThemeUsage(`\n// isSystemInDarkTheme()\nval sample = "darkColorScheme()"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidAccessibilityMatch devuelve payload semantico para accesibilidad Compose', () => {
  const source = `
@Composable fun AccessibleIconScreen() {
  Icon(
    imageVector = Icons.Default.Settings,
    contentDescription = "Ajustes"
  )
  Box(modifier = Modifier.semantics { contentDescription = "Pantalla de ajustes" })
}
`;

  const match = findAndroidAccessibilityMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun AccessibleIconScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'contentDescription', lines: [5] },
    { kind: 'call', name: 'semantics', lines: [7] },
  ]);
  assert.match(match.why, /contentDescription|semantics|accesibilidad/i);
  assert.match(match.impact, /accesible|lectores de pantalla/i);
  assert.match(match.expected_fix, /contentDescription|semantics/i);
});

test('hasAndroidAccessibilityUsage ignora comentarios, strings y accesibilidad implícita', () => {
  const source = `
// contentDescription = "debug"
val sample = "Modifier.semantics { }"
@Composable fun Sample() {
  Text("ok")
}
`;

  assert.equal(hasAndroidAccessibilityUsage(source), false);
});

test('findAndroidTalkBackMatch devuelve payload semantico para TalkBack en Compose', () => {
  const source = `
@Composable fun AccessibleIconScreen() {
  Box(modifier = Modifier.semantics { })
}
`;

  const match = findAndroidTalkBackMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun AccessibleIconScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'semantics', lines: [3] },
  ]);
  assert.match(match.why, /TalkBack|accesibilidad|screen reader/i);
  assert.match(match.impact, /lectores de pantalla|tecnolog/i);
  assert.match(match.expected_fix, /TalkBack|contentDescription|semantics/i);
});

test('hasAndroidTalkBackUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidTalkBackUsage(`\n// TalkBack\nval sample = "contentDescription = ignored"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidTextScalingMatch devuelve payload semantico para text scaling en Compose', () => {
  const source = `
@Composable fun ScaledTextScreen() {
  val fontScale = LocalDensity.current.fontScale
  Text(
    text = "Hola",
    fontSize = 16.sp
  )
}
`;

  const match = findAndroidTextScalingMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun ScaledTextScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'fontScale', lines: [3] },
    { kind: 'property', name: 'fontSize', lines: [6] },
  ]);
  assert.match(match.why, /font scaling|fontScale|sp/i);
  assert.match(match.impact, /legibilidad|texto|acces/i);
  assert.match(match.expected_fix, /fontScale|sp|TextUnit\.Sp/i);
});

test('hasAndroidTextScalingUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidTextScalingUsage(`\n// fontScale\nval sample = "fontSize = 16.sp"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidTouchTargetsMatch devuelve payload semantico para touch targets en Compose', () => {
  const source = `
@Composable fun TouchTargetButton() {
  IconButton(
    onClick = {},
    modifier = Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)
  ) {
    Icon(imageVector = Icons.Default.Settings, contentDescription = "Ajustes")
  }
}
`;

  const match = findAndroidTouchTargetsMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun TouchTargetButton',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'sizeIn48dp', lines: [5] },
  ]);
  assert.match(match.why, /touch targets|48dp|interact/i);
  assert.match(match.impact, /toque|interactiv|precisi/i);
  assert.match(match.expected_fix, /minimumInteractiveComponentSize|sizeIn|minWidth|minHeight/i);
});

test('hasAndroidTouchTargetsUsage ignora comentarios, strings y tamanos inferiores a 48dp', () => {
  const source = `
// sizeIn(minWidth = 48.dp, minHeight = 48.dp)
val sample = "minimumInteractiveComponentSize()"
@Composable fun Sample() {
  IconButton(
    onClick = {},
    modifier = Modifier.sizeIn(minWidth = 24.dp, minHeight = 24.dp)
  ) {
    Icon(imageVector = Icons.Default.Settings, contentDescription = "Ajustes")
  }
}
`;

  assert.equal(hasAndroidTouchTargetsUsage(source), false);
});

test('findAndroidContentDescriptionMatch devuelve payload semantico para contentDescription en Compose', () => {
  const source = `
@Composable fun SettingsButton() {
  Icon(
    imageVector = Icons.Default.Settings,
    contentDescription = "Ajustes"
  )
}
`;

  const match = findAndroidContentDescriptionMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun SettingsButton',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'contentDescription', lines: [5] },
  ]);
  assert.match(match.why, /contentDescription|imágenes|botones/i);
  assert.match(match.impact, /lectores de pantalla|tecnolog/i);
  assert.match(match.expected_fix, /contentDescription|accesible/i);
});

test('hasAndroidContentDescriptionUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidContentDescriptionUsage(`\n// contentDescription = "debug"\nval sample = "contentDescription = ignored"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('findAndroidRecompositionMatch devuelve payload semantico para recomposition idempotente', () => {
  const source = `
@Composable fun CounterScreen(viewModel: CounterViewModel) {
  println("recompose")
  viewModel.counter.value = viewModel.counter.value + 1
}
`;

  const match = findAndroidRecompositionMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Composable fun CounterScreen',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'println', lines: [3] },
    { kind: 'call', name: 'state mutation', lines: [4] },
  ]);
  assert.match(match.why, /idempotencia|recompos/i);
  assert.match(match.impact, /repetir|mutaciones|side effects/i);
  assert.match(match.expected_fix, /idempotencia|side effects|ViewModel/i);
});

test('hasAndroidRecompositionUsage ignora comentarios y strings', () => {
  assert.equal(
    hasAndroidRecompositionUsage(`\n// println("recompose")\nval sample = "Log.d(\\\"x\\\")"\n@Composable fun Sample() {\n  Text("ok")\n}\n`),
    false
  );
});

test('hasAndroidStateHoistingUsage detecta composables con estado local y descarta files sin estado', () => {
  const source = `
@Composable fun CounterScreen() {
  var count by rememberSaveable { mutableStateOf(0) }
}

@Composable fun StaticScreen() {
  Text("hello")
}
`;

  assert.equal(hasAndroidStateHoistingUsage(source), true);
  assert.equal(
    hasAndroidStateHoistingUsage(`
@Composable fun StaticScreen() {
  Text("hello")
}
`),
    false
  );
});

test('hasAndroidViewModelUsage detecta ViewModel real y descarta clases no relacionadas', () => {
  const source = `
class CatalogViewModel : ViewModel()
class CatalogPresenter
`;

  assert.equal(hasAndroidViewModelUsage(source), true);
});

test('findAndroidSuspendFunctionsApiServiceMatch devuelve payload semantico para API service con suspend fun', () => {
  const source = `
interface CatalogApiService {
  suspend fun fetchCatalog(): List<String>

  suspend fun fetchFeaturedCatalog(): List<String>
}
`;

  const match = findAndroidSuspendFunctionsApiServiceMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogApiService',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'API service: CatalogApiService', lines: [2] },
    { kind: 'member', name: 'suspend fun fetchCatalog', lines: [3] },
    { kind: 'member', name: 'suspend fun fetchFeaturedCatalog', lines: [5] },
  ]);
  assert.match(match.why, /API/i);
  assert.match(match.impact, /API lineal|callbacks/i);
  assert.match(match.expected_fix, /suspend functions|coroutine/i);
});

test('hasAndroidSuspendFunctionsApiServiceUsage ignora comentarios y servicios no API', () => {
  const source = `
// suspend fun fake()
val sample = "CatalogApiService"

interface CatalogRepository {
  fun fetchCatalog()
}
`;

  assert.equal(hasAndroidSuspendFunctionsApiServiceUsage(source), false);
});

test('findAndroidSuspendFunctionsAsyncMatch devuelve payload semantico para suspend fun async en clases generales', () => {
  const source = `
class DashboardRepository {
  suspend fun loadDashboard(): String = "ok"

  suspend fun refreshDashboard(): String = "ok"
}
`;

  const match = findAndroidSuspendFunctionsAsyncMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'DashboardRepository',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'DashboardRepository', lines: [2] },
    { kind: 'member', name: 'suspend fun loadDashboard', lines: [3] },
    { kind: 'member', name: 'suspend fun refreshDashboard', lines: [5] },
  ]);
  assert.match(match.why, /suspend functions/i);
  assert.match(match.impact, /lineal|componer/i);
  assert.match(match.expected_fix, /async|suspend functions/i);
});

test('hasAndroidSuspendFunctionsAsyncUsage ignora comentarios y excluye services y daos', () => {
  const source = `
// suspend fun fake()
val sample = "suspend fun load"

interface CatalogApiService {
  suspend fun fetchCatalog(): List<String>
}

@Dao
interface CatalogDao {
  @Query("SELECT * FROM catalog")
  suspend fun loadCatalog(): List<String>
}

class DashboardRepository {
  suspend fun loadDashboard(): String = "ok"
}
`;

  assert.equal(hasAndroidSuspendFunctionsAsyncUsage(source), true);
  assert.equal(
    hasAndroidSuspendFunctionsAsyncUsage(`
// suspend fun fake()
val sample = "suspend fun load"

interface CatalogApiService {
  suspend fun fetchCatalog(): List<String>
}

@Dao
interface CatalogDao {
  @Query("SELECT * FROM catalog")
  suspend fun loadCatalog(): List<String>
}
`),
    false
  );
});

test('findAndroidAsyncAwaitParallelismMatch devuelve payload semantico para async/await en paralelismo', () => {
  const source = `
class ReportCoordinator {
  suspend fun buildReport(): String = coroutineScope {
    val summary = async { "summary" }
    val details = async(Dispatchers.IO) { "details" }
    summary.await()
    details.await()
    "report"
  }
}
`;

  const match = findAndroidAsyncAwaitParallelismMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'ReportCoordinator',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'ReportCoordinator', lines: [2] },
    { kind: 'call', name: 'async', lines: [4, 5] },
    { kind: 'call', name: 'await', lines: [6, 7] },
  ]);
  assert.match(match.why, /async\/await/i);
  assert.match(match.impact, /paralelo|parallel|await/i);
  assert.match(match.expected_fix, /coroutineScope|parallel/i);
});

test('hasAndroidAsyncAwaitParallelismUsage ignora comentarios y excluye services y daos', () => {
  const source = `
// async { fake() }
val sample = "await()"

interface CatalogApiService {
  suspend fun fetchCatalog(): List<String>
}

@Dao
interface CatalogDao {
  @Query("SELECT * FROM catalog")
  suspend fun loadCatalog(): List<String>
}

class ReportCoordinator {
  suspend fun buildReport(): String = coroutineScope {
    val summary = async { "summary" }
    summary.await()
    "report"
  }
}
`;

  assert.equal(hasAndroidAsyncAwaitParallelismUsage(source), true);
  assert.equal(
    hasAndroidAsyncAwaitParallelismUsage(`
// async { fake() }
val sample = "await()"

interface CatalogApiService {
  suspend fun fetchCatalog(): List<String>
}

@Dao
interface CatalogDao {
  @Query("SELECT * FROM catalog")
  suspend fun loadCatalog(): List<String>
}
`),
    false
  );
});

test('findAndroidDaoSuspendFunctionsMatch devuelve payload semantico para DAO con suspend fun', () => {
  const source = `
@Dao
interface CatalogDao {
  @Query("SELECT * FROM catalog")
  suspend fun loadCatalog(): List<String>

  @Insert
  suspend fun saveCatalog(items: List<String>)
}
`;

  const match = findAndroidDaoSuspendFunctionsMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'CatalogDao',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: '@Dao', lines: [2] },
    { kind: 'member', name: 'suspend fun loadCatalog', lines: [5] },
    { kind: 'member', name: 'suspend fun saveCatalog', lines: [8] },
  ]);
  assert.match(match.why, /DAO/i);
  assert.match(match.impact, /persistencia|coroutines|Room/i);
  assert.match(match.expected_fix, /DAO|suspend functions|repositor/i);
});

test('findAndroidTransactionMatch devuelve payload semantico para DAO con @Transaction', () => {
  const source = `
@Dao
interface OrderDao {
  @Transaction
  fun loadOrderGraph(): Order

  @Transaction
  fun saveOrder()
}
`;

  const match = findAndroidTransactionMatch(source);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'OrderDao',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: '@Dao', lines: [2] },
    { kind: 'member', name: '@Transaction fun loadOrderGraph', lines: [4, 5] },
    { kind: 'member', name: '@Transaction fun saveOrder', lines: [7, 8] },
  ]);
  assert.deepEqual(match?.lines, [2, 3, 4, 5, 7, 8]);
});

test('hasAndroidDaoSuspendFunctionsUsage ignora comentarios y DAOs sin suspend fun', () => {
  const source = `
// @Dao
interface CatalogDao {
  fun loadCatalog()
}
`;

  assert.equal(hasAndroidDaoSuspendFunctionsUsage(source), false);
});

test('hasAndroidTransactionUsage detecta transacciones en DAO y descarta comentarios', () => {
  const source = `
// @Transaction
@Dao
interface OrderDao {
  @Transaction
  fun loadOrderGraph(): Order
}
`;

  assert.equal(hasAndroidTransactionUsage(source), true);
  assert.equal(
    hasAndroidTransactionUsage(`
// @Transaction
// fun shouldNotTrigger()
`),
    false
  );
});

test('hasKotlinForceUnwrapUsage detecta operador !! en codigo Kotlin real', () => {
  const source = `
fun renderName(user: User?) {
  val name = user!!.name
  println(name)
}
`;
  assert.equal(hasKotlinForceUnwrapUsage(source), true);
});

test('hasKotlinForceUnwrapUsage ignora comentarios, strings y operador !=', () => {
  const source = `
// val name = user!!.name
val debug = "user!!.name"
fun isDifferent(left: String?, right: String?) = left != right
`;
  assert.equal(hasKotlinForceUnwrapUsage(source), false);
});

test('hasAndroidJavaSourceCode detecta codigo Java real', () => {
  const source = `
package com.acme.orders;

public class OrdersActivity {
}
`;
  assert.equal(hasAndroidJavaSourceCode(source), true);
});

test('hasAndroidJavaSourceCode ignora menciones Java en comentarios y strings', () => {
  const source = `
// public class OrdersActivity {}
val sample = "class OrdersActivity"
`;
  assert.equal(hasAndroidJavaSourceCode(source), false);
});

test('hasAndroidHiltDependencyUsage detecta dependencia Hilt real en Gradle', () => {
  const source = `
dependencies {
  implementation("com.google.dagger:hilt-android:2.51.1")
  kapt("com.google.dagger:hilt-compiler:2.51.1")
}
`;
  assert.equal(hasAndroidHiltDependencyUsage(source), true);
});

test('hasAndroidHiltDependencyUsage ignora comentarios y dependencias no Hilt', () => {
  const source = `
// implementation("com.google.dagger:hilt-android:2.51.1")
implementation("com.squareup.retrofit2:retrofit:2.11.0")
`;
  assert.equal(hasAndroidHiltDependencyUsage(source), false);
});

test('findAndroidWorkManagerDependencyMatch devuelve payload semantico para WorkManager en Gradle', () => {
  const source = `
dependencies {
  implementation("androidx.work:work-runtime-ktx:2.9.1")
}
`;

  const match = findAndroidWorkManagerDependencyMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'WorkManager dependency',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'androidx.work:work-runtime-ktx', lines: [3] },
  ]);
  assert.match(match.why, /WorkManager/i);
  assert.match(match.impact, /background|background tasks|background/i);
  assert.match(match.expected_fix, /work-runtime-ktx|WorkManager/i);
});

test('hasAndroidWorkManagerDependencyUsage detecta dependencia WorkManager real en Gradle y descarta dependencias no relacionadas', () => {
  assert.equal(
    hasAndroidWorkManagerDependencyUsage(`
dependencies {
  implementation("androidx.work:work-runtime-ktx:2.9.1")
}
`),
    true
  );
  assert.equal(
    hasAndroidWorkManagerDependencyUsage(`
dependencies {
  implementation("androidx.room:room-ktx:2.6.1")
}
`),
    false
  );
});

test('findAndroidVersionCatalogMatch devuelve payload semantico para libs.versions.toml', () => {
  const source = `
[versions]
kotlin = "1.9.24"
androidx-core = "1.13.1"

[libraries]
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "androidx-core" }
androidx-lifecycle-runtime-ktx = { module = "androidx.lifecycle:lifecycle-runtime-ktx", version.ref = "androidx-core" }
`;

  const match = findAndroidVersionCatalogMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'libs.versions.toml',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'versions section', lines: [2] },
    { kind: 'member', name: 'version alias: kotlin', lines: [3] },
    { kind: 'member', name: 'version alias: androidx-core', lines: [4] },
    { kind: 'member', name: 'libraries section', lines: [6] },
    { kind: 'member', name: 'library alias: androidx-core-ktx', lines: [7] },
    {
      kind: 'member',
      name: 'library alias: androidx-lifecycle-runtime-ktx',
      lines: [8],
    },
  ]);
  assert.match(match.why, /version catalog|libs\.versions\.toml/i);
  assert.match(match.impact, /centralizados|accessors/i);
  assert.match(match.expected_fix, /libs\.versions\.toml|catalogo/i);
});

test('hasAndroidVersionCatalogUsage detecta version catalog real y descarta toml incompleto', () => {
  const source = `
[versions]
kotlin = "1.9.24"

[libraries]
androidx-core-ktx = { module = "androidx.core:core-ktx", version.ref = "kotlin" }
`;

  assert.equal(hasAndroidVersionCatalogUsage(source), true);
  assert.equal(
    hasAndroidVersionCatalogUsage(`
[versions]
kotlin = "1.9.24"
`),
    false
  );
});

test('findAndroidAaaPatternMatch devuelve payload semantico para AAA en tests Android', () => {
  const source = `
class OrderTest {
  @Test
  fun savesOrder() {
    // Arrange
    val repository = FakeRepository()
    // Act
    val result = repository.save()
    // Assert
    assertTrue(result)
  }
}
`;

  const match = findAndroidAaaPatternMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Test fun savesOrder',
    lines: [4],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'AAA marker', lines: [5] },
    { kind: 'member', name: 'AAA marker', lines: [7] },
    { kind: 'member', name: 'AAA marker', lines: [9] },
  ]);
  assert.match(match.why, /AAA|Arrange|Act|Assert/i);
  assert.match(match.impact, /intenci[oó]n|separaci[oó]n/i);
  assert.match(match.expected_fix, /Arrange|Act|Assert/i);
});

test('hasAndroidAaaPatternUsage detecta AAA real y descarta tests sin estructura', () => {
  assert.equal(
    hasAndroidAaaPatternUsage(`
class OrderTest {
  @Test
  fun savesOrder() {
    // Arrange
    val repository = FakeRepository()
    // Act
    val result = repository.save()
    // Assert
    assertTrue(result)
  }
}
`),
    true
  );
  assert.equal(
    hasAndroidAaaPatternUsage(`
class OrderTest {
  @Test
  fun savesOrder() {
    val repository = FakeRepository()
    val result = repository.save()
    assertTrue(result)
  }
}
`),
    false
  );
});

test('findAndroidGivenWhenThenMatch devuelve payload semantico para BDD en tests Android', () => {
  const source = `
class OrderTest {
  @Test
  fun savesOrder() {
    // Given
    val repository = FakeRepository()
    // When
    val result = repository.save()
    // Then
    assertTrue(result)
  }
}
`;

  const match = findAndroidGivenWhenThenMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Test fun savesOrder',
    lines: [4],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'BDD marker', lines: [5] },
    { kind: 'member', name: 'BDD marker', lines: [7] },
    { kind: 'member', name: 'BDD marker', lines: [9] },
  ]);
  assert.match(match.why, /Given-When-Then|BDD/i);
  assert.match(match.impact, /comportamiento|lenguaje de producto/i);
  assert.match(match.expected_fix, /Given|When|Then/i);
});

test('hasAndroidGivenWhenThenUsage detecta BDD real y descarta tests sin estructura', () => {
  assert.equal(
    hasAndroidGivenWhenThenUsage(`
class OrderTest {
  @Test
  fun savesOrder() {
    // Given
    val repository = FakeRepository()
    // When
    val result = repository.save()
    // Then
    assertTrue(result)
  }
}
`),
    true
  );
  assert.equal(
    hasAndroidGivenWhenThenUsage(`
class OrderTest {
  @Test
  fun savesOrder() {
    val repository = FakeRepository()
    val result = repository.save()
    assertTrue(result)
  }
}
`),
    false
  );
});

test('findAndroidJvmUnitTestMatch devuelve payload semantico para unit tests JVM en test/', () => {
  const source = `
class CatalogRepositoryTest {
  @Test
  fun loadsCatalog() {
    assertTrue(true)
  }
}
`;

  const match = findAndroidJvmUnitTestMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: '@Test fun loadsCatalog',
    lines: [4],
  });
  assert.deepEqual(match.related_nodes, []);
  assert.match(match.why, /test\/|JVM/i);
  assert.match(match.impact, /rápidas|androidTest/i);
  assert.match(match.expected_fix, /src\/test|androidTest/i);
});

test('hasAndroidJvmUnitTestUsage detecta unit tests JVM reales y descarta fuentes no test', () => {
  assert.equal(
    hasAndroidJvmUnitTestUsage(`
class CatalogRepositoryTest {
  @Test
  fun loadsCatalog() {
    assertTrue(true)
  }
}
`),
    true
  );
  assert.equal(
    hasAndroidJvmUnitTestUsage(`
class CatalogRepository {
  fun loadsCatalog() {
    assertTrue(true)
  }
}
`),
    false
  );
});

test('findAndroidWorkManagerBackgroundTaskMatch devuelve payload semantico para Worker de WorkManager', () => {
  const source = `
class SyncWorker(
  appContext: Context,
  workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
  override suspend fun doWork(): Result {
    return Result.success()
  }
}
`;

  const match = findAndroidWorkManagerBackgroundTaskMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'SyncWorker',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'CoroutineWorker', lines: [2] },
    { kind: 'call', name: 'doWork', lines: [6] },
  ]);
  assert.match(match.why, /WorkManager|WorkManager/i);
  assert.match(match.impact, /background|Worker/i);
  assert.match(match.expected_fix, /Worker|CoroutineWorker|ListenableWorker/i);
});

test('hasAndroidWorkManagerBackgroundTaskUsage detecta Worker real y descarta clases no relacionadas', () => {
  assert.equal(
    hasAndroidWorkManagerBackgroundTaskUsage(`
class SyncWorker(
  appContext: Context,
  workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
  override suspend fun doWork(): Result {
    return Result.success()
  }
}
`),
    true
  );
  assert.equal(
    hasAndroidWorkManagerBackgroundTaskUsage(`
class SyncManager(
  appContext: Context,
  workerParams: WorkerParameters,
) {
  fun doWork(): Result = Result.success()
}
`),
    false
  );
});

test('findAndroidInstrumentedTestMatch devuelve payload semantico para androidTest instrumentado', () => {
  const source = `
@RunWith(AndroidJUnit4::class)
class CatalogInstrumentedTest {
  @Test fun launchesActivity() {
    ActivityScenario.launch(MainActivity::class.java)
    InstrumentationRegistry.getInstrumentation()
    onView(withId(R.id.title)).check(matches(isDisplayed()))
  }
}
`;

  const match = findAndroidInstrumentedTestMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'androidTest/',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'androidTest marker', lines: [2] },
    { kind: 'member', name: 'androidTest marker', lines: [5] },
    { kind: 'member', name: 'androidTest marker', lines: [6] },
    { kind: 'member', name: 'androidTest marker', lines: [7] },
  ]);
  assert.match(match.why, /androidTest|instrumentad/i);
  assert.match(match.impact, /dispositivo|emulador|UI/i);
  assert.match(match.expected_fix, /AndroidJUnit4|ActivityScenario|Espresso/i);
});

test('hasAndroidInstrumentedTestUsage detecta androidTest real y descarta fuentes no instrumentadas', () => {
  assert.equal(
    hasAndroidInstrumentedTestUsage(`
@RunWith(AndroidJUnit4::class)
class CatalogInstrumentedTest {
  @Test fun launchesActivity() {
    ActivityScenario.launch(MainActivity::class.java)
  }
}
`),
    true
  );
  assert.equal(
    hasAndroidInstrumentedTestUsage(`
class CatalogUnitTest {
  @Test fun launchesActivity() {
    assertTrue(true)
  }
}
`),
    false
  );
});

test('hasAndroidHiltFrameworkUsage detecta anotaciones y referencias Hilt reales', () => {
  const source = `
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class App : Application()
`;
  assert.equal(hasAndroidHiltFrameworkUsage(source), true);
});

test('hasAndroidHiltFrameworkUsage ignora comentarios y strings', () => {
  const source = `
// @HiltAndroidApp
val sample = "dagger.hilt.android"
`;
  assert.equal(hasAndroidHiltFrameworkUsage(source), false);
});

test('hasAndroidHiltAndroidAppUsage detecta Application Hilt real', () => {
  const source = `
@HiltAndroidApp
class App : Application()
`;
  assert.equal(hasAndroidHiltAndroidAppUsage(source), true);
});

test('hasAndroidAndroidEntryPointUsage detecta Activity o Fragment EntryPoint real', () => {
  const source = `
@AndroidEntryPoint
class HomeActivity : AppCompatActivity()
`;
  assert.equal(hasAndroidAndroidEntryPointUsage(source), true);
});

test('hasAndroidInjectConstructorUsage detecta constructor injection real', () => {
  const source = `
class HomeViewModel @Inject constructor(
  private val repository: HomeRepository
)
`;
  assert.equal(hasAndroidInjectConstructorUsage(source), true);
});

test('hasAndroidModuleInstallInUsage detecta Module + InstallIn reales', () => {
  const source = `
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule
`;
  assert.equal(hasAndroidModuleInstallInUsage(source), true);
});

test('hasAndroidBindsUsage detecta Binds real con Module + InstallIn', () => {
  const source = `
@Module
@InstallIn(SingletonComponent::class)
abstract class NetworkModule {
  @Binds
  abstract fun bindRepository(impl: RepositoryImpl): Repository
}
`;
  assert.equal(hasAndroidBindsUsage(source), true);
});

test('hasAndroidBindsUsage ignora comentarios y fuentes sin Module + InstallIn', () => {
  const source = `
// @Binds abstract fun bindRepository(impl: RepositoryImpl): Repository
@Provides
fun provideRepository(): Repository = RepositoryImpl()
`;
  assert.equal(hasAndroidBindsUsage(source), false);
});

test('hasAndroidProvidesUsage detecta Provides real con Module + InstallIn', () => {
  const source = `
@Module
@InstallIn(SingletonComponent::class)
abstract class NetworkModule {
  @Provides
  fun provideRepository(): Repository = RepositoryImpl()
}
`;
  assert.equal(hasAndroidProvidesUsage(source), true);
});

test('hasAndroidProvidesUsage ignora comentarios y fuentes sin Module + InstallIn', () => {
  const source = `
// @Provides fun provideRepository(): Repository = RepositoryImpl()
fun provideRepository(): Repository = RepositoryImpl()
`;
  assert.equal(hasAndroidProvidesUsage(source), false);
});

test('hasAndroidViewModelScopedUsage detecta ViewModelScoped real', () => {
  const source = `
@ViewModelScoped
class HomeRepository @Inject constructor()
`;
  assert.equal(hasAndroidViewModelScopedUsage(source), true);
});

test('findAndroidViewModelScopeMatch detecta viewModelScope real en codigo Android', () => {
  const source = `
class HomeViewModel : ViewModel() {
  fun load() {
    viewModelScope.launch {
      refresh()
    }
  }
}
`;
  const match = findAndroidViewModelScopeMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'viewModelScope');
  assert.equal(hasAndroidViewModelScopeUsage(source), true);
});

test('findAndroidViewModelScopeMatch ignora comentarios, strings y nombres parciales', () => {
  const source = `
// viewModelScope.launch { }
val sample = "viewModelScope"
val viewModelScoped = false
`;
  assert.equal(findAndroidViewModelScopeMatch(source), undefined);
  assert.equal(hasAndroidViewModelScopeUsage(source), false);
});

test('findAndroidAppStartupMatch detecta Initializer real en codigo Android', () => {
  const source = `
class FeatureInitializer : Initializer<Unit> {
  override fun create(context: Context) {
    return Unit
  }

  override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
`;
  const match = findAndroidAppStartupMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'FeatureInitializer');
  assert.equal(hasAndroidAppStartupUsage(source), true);
});

test('findAndroidAppStartupMatch ignora comentarios, strings y clases sin Initializer', () => {
  const source = `
// class FeatureInitializer : Initializer<Unit> {}
val sample = "Initializer<Unit>"
class FeatureInitializerHelper
`;
  assert.equal(findAndroidAppStartupMatch(source), undefined);
  assert.equal(hasAndroidAppStartupUsage(source), false);
});

test('findAndroidAnalyticsMatch detecta tracking real de analytics en codigo Android', () => {
  const source = `
import com.google.firebase.analytics.FirebaseAnalytics

class PurchaseAnalytics(private val firebaseAnalytics: FirebaseAnalytics) {
  fun trackPurchase(eventName: String) {
    firebaseAnalytics.trackEvent(eventName)
  }
}
`;
  const match = findAndroidAnalyticsMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'PurchaseAnalytics');
  assert.equal(hasAndroidAnalyticsUsage(source), true);
});

test('findAndroidAnalyticsMatch ignora comentarios, strings y clases sin tracking', () => {
  const source = `
// firebaseAnalytics.logEvent("purchase")
val sample = "trackEvent(\"purchase\")"
class PurchaseLogger {
  fun log() = Unit
}
`;
  assert.equal(findAndroidAnalyticsMatch(source), undefined);
  assert.equal(hasAndroidAnalyticsUsage(source), false);
});

test('findAndroidProfilerMatch detecta profiling real de Android en codigo de produccion', () => {
  const source = `
import android.os.Debug

class CheckoutProfiler {
  fun traceStartup() {
    Debug.startMethodTracing()
    Debug.stopMethodTracing()
  }
}
`;
  const match = findAndroidProfilerMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'CheckoutProfiler');
  assert.equal(hasAndroidProfilerUsage(source), true);
});

test('findAndroidProfilerMatch ignora comentarios, strings y clases sin profiling', () => {
  const source = `
// Trace.beginSection("startup")
val sample = "startMethodTracing"
class CheckoutLogger {
  fun log() = Unit
}
`;
  assert.equal(findAndroidProfilerMatch(source), undefined);
  assert.equal(hasAndroidProfilerUsage(source), false);
});

test('findAndroidBaselineProfilesMatch detecta BaselineProfileRule real en androidTest', () => {
  const source = `
import androidx.benchmark.macro.junit4.BaselineProfileRule

class StartupBaselineProfileTest {
  @get:Rule
  val baselineProfileRule = BaselineProfileRule()

  @Test
  fun generateBaselineProfile() {
    baselineProfileRule.collect(
      packageName = "com.acme.app"
    ) {
      startActivityAndWait()
    }
  }
}
`;
  const match = findAndroidBaselineProfilesMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'BaselineProfileRule');
  assert.equal(hasAndroidBaselineProfilesUsage(source), true);
});

test('findAndroidBaselineProfilesMatch ignora comentarios, strings y referencias parciales', () => {
  const source = `
// BaselineProfileRule()
val sample = "BaselineProfileRule.collect(packageName = \\"com.acme.app\\")"
fun render() {
  val collect = "collect()"
}
`;
  assert.equal(findAndroidBaselineProfilesMatch(source), undefined);
  assert.equal(hasAndroidBaselineProfilesUsage(source), false);
});

test('findAndroidSkipRecompositionMatch detecta composables con parametros estables o inmutables', () => {
  const source = `
import androidx.compose.runtime.Composable
import kotlinx.collections.immutable.ImmutableList

@Composable
fun Feed(items: ImmutableList<FeedItem>, state: FeedUiState) {
  Text(text = state.title)
}
`;
  const match = findAndroidSkipRecompositionMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, '@Composable fun Feed');
  assert.equal(hasAndroidSkipRecompositionUsage(source), true);
});

test('findAndroidSkipRecompositionMatch ignora composables sin parametros estables o inmutables', () => {
  const source = `
@Composable
fun Feed(items: List<FeedItem>, state: FeedUiState) {
  Text(text = state.title)
}
`;
  assert.equal(findAndroidSkipRecompositionMatch(source), undefined);
  assert.equal(hasAndroidSkipRecompositionUsage(source), false);
});

test('findAndroidStabilityMatch detecta composables con tipos @Stable o @Immutable', () => {
  const source = `
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.Stable

@Stable
class PlaybackState(val isPlaying: Boolean)

@Immutable
data class FeedUiState(val title: String)

@Composable
fun Feed(state: FeedUiState, playback: PlaybackState) {
  Text(text = state.title)
}
`;
  const match = findAndroidStabilityMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, '@Composable fun Feed');
  assert.equal(hasAndroidStabilityUsage(source), true);
});

test('findAndroidStabilityMatch ignora composables sin tipos estables o inmutables', () => {
  const source = `
@Composable
fun Feed(state: FeedUiState, playback: PlaybackState) {
  Text(text = state.title)
}

data class FeedUiState(val title: String)
class PlaybackState(val isPlaying: Boolean)
`;
  assert.equal(findAndroidStabilityMatch(source), undefined);
  assert.equal(hasAndroidStabilityUsage(source), false);
});

test('findAndroidComposableFunctionMatch detecta composable real en codigo Android', () => {
  const source = `
@Composable
fun HomeScreen() {
  Box(modifier = Modifier)
}
`;
  const match = findAndroidComposableFunctionMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, '@Composable fun HomeScreen');
  assert.deepEqual(match?.lines, [3]);
  assert.equal(hasAndroidComposableFunctionUsage(source), true);
});

test('findAndroidComposableFunctionMatch ignora comentarios y strings', () => {
  const source = `
// @Composable fun HomeScreen() {}
val sample = "@Composable fun HomeScreen()"
`;
  assert.equal(findAndroidComposableFunctionMatch(source), undefined);
  assert.equal(hasAndroidComposableFunctionUsage(source), false);
});

test('findAndroidArgumentsMatch devuelve payload semantico para argumentos entre pantallas', () => {
  const source = `
import androidx.lifecycle.SavedStateHandle

class OrderDetailViewModel(
  private val navController: NavController,
  savedStateHandle: SavedStateHandle,
) : ViewModel() {
  val orderId = checkNotNull(savedStateHandle["orderId"])

  fun openOtherScreen(route: String) {
    navController.navigate(route)
  }
}
`;
  const match = findAndroidArgumentsMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'OrderDetailViewModel');
  assert.equal(hasAndroidArgumentsUsage(source), true);
});

test('findAndroidArgumentsMatch ignora navigate sin argumentos y comentarios', () => {
  const source = `
// NavHost(navController = navController, startDestination = "orders") {}
class OrderDetailViewModel : ViewModel() {
  fun openDetails(navController: NavController) {
    navController.navigate("orders")
  }
}
`;
  assert.equal(findAndroidArgumentsMatch(source), undefined);
  assert.equal(hasAndroidArgumentsUsage(source), false);
});

test('findAndroidSingleActivityComposeShellMatch detecta Activity shell con Compose', () => {
  const source = `
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      NavHost(navController = rememberNavController(), startDestination = homeRoute()) { }
    }
  }
}
`;
  const match = findAndroidSingleActivityComposeShellMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'MainActivity');
  assert.equal(hasAndroidSingleActivityComposeShellUsage(source), true);
});

test('findAndroidSingleActivityComposeShellMatch ignora Activities sin Compose shell', () => {
  const source = `
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
  }
}
`;
  assert.equal(findAndroidSingleActivityComposeShellMatch(source), undefined);
  assert.equal(hasAndroidSingleActivityComposeShellUsage(source), false);
});

test('findAndroidGodActivityMatch detecta God Activity que mezcla shell Compose y composables', () => {
  const source = `
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      HomeScreen()
    }
  }
}

@Composable
fun HomeScreen() {
  Box(modifier = Modifier)
}
`;
  const match = findAndroidGodActivityMatch(source);
  assert.ok(match);
  assert.equal(match?.primary_node.name, 'MainActivity');
  assert.equal(hasAndroidGodActivityUsage(source), true);
});

test('findAndroidGodActivityMatch ignora Activity shell pura', () => {
  const source = `
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      NavHost(navController = rememberNavController(), startDestination = homeRoute()) { }
    }
  }
}
`;
  assert.equal(findAndroidGodActivityMatch(source), undefined);
  assert.equal(hasAndroidGodActivityUsage(source), false);
});

test('hasAndroidAsyncTaskUsage detecta AsyncTask real en codigo Android', () => {
  const source = `
import android.os.AsyncTask

class LoadDataTask : AsyncTask<Unit, Unit, String>() {
  override fun doInBackground(vararg params: Unit): String = "ok"
}
`;
  assert.equal(hasAndroidAsyncTaskUsage(source), true);
});

test('hasAndroidAsyncTaskUsage ignora comentarios, strings y nombres parciales', () => {
  const source = `
// AsyncTask should be removed
val sample = "AsyncTask"
class AsyncTaskRunner
`;
  assert.equal(hasAndroidAsyncTaskUsage(source), false);
});

test('hasAndroidFindViewByIdUsage detecta findViewById real en codigo Android', () => {
  const source = `
class HomeActivity : AppCompatActivity() {
  fun render() {
    val title = findViewById<TextView>(R.id.title)
  }
}
`;
  assert.equal(hasAndroidFindViewByIdUsage(source), true);
});

test('hasAndroidFindViewByIdUsage ignora comentarios, strings y nombres parciales', () => {
  const source = `
// findViewById<TextView>(R.id.title)
val sample = "findViewById"
class FindViewByIdHelper
`;
  assert.equal(hasAndroidFindViewByIdUsage(source), false);
});

test('hasAndroidRxJavaUsage detecta RxJava real en codigo Android', () => {
  const source = `
import io.reactivex.rxjava3.core.Observable

class HomeRepository {
  fun load() = Observable.just("ok")
}
`;
  assert.equal(hasAndroidRxJavaUsage(source), true);
});

test('hasAndroidRxJavaUsage ignora comentarios, strings y nombres parciales', () => {
  const source = `
// Observable.just("ok")
val sample = "RxJava"
class ObservableHelper
`;
  assert.equal(hasAndroidRxJavaUsage(source), false);
});

test('hasAndroidDispatcherUsage detecta Dispatchers reales en codigo Android', () => {
  const source = `
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

suspend fun load() = withContext(Dispatchers.IO) {
  "ok"
}
`;
  assert.equal(hasAndroidDispatcherUsage(source), true);
});

test('hasAndroidDispatcherUsage ignora comentarios, strings y nombres parciales', () => {
  const source = `
// withContext(Dispatchers.IO)
val sample = "Dispatchers.Main"
class DispatchersHelper
`;
  assert.equal(hasAndroidDispatcherUsage(source), false);
});

test('hasAndroidWithContextUsage detecta withContext real en codigo Android', () => {
  const source = `
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

suspend fun load() = withContext(Dispatchers.IO) {
  "ok"
}
`;
  assert.equal(hasAndroidWithContextUsage(source), true);
});

test('hasAndroidWithContextUsage ignora comentarios, strings y nombres parciales', () => {
  const source = `
// withContext(Dispatchers.IO)
val sample = "withContext"
class WithContextHelper
`;
  assert.equal(hasAndroidWithContextUsage(source), false);
});

test('hasAndroidCoroutineTryCatchUsage detecta try-catch real en codigo coroutine Android', () => {
  const source = `
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

suspend fun load() {
  try {
    withContext(Dispatchers.IO) { }
  } catch (e: Exception) {
    throw e
  }
}
`;
  assert.equal(hasAndroidCoroutineTryCatchUsage(source), true);
});

test('findAndroidSupervisorScopeMatch detecta supervisorScope real en codigo coroutine Android', () => {
  const source = `
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

suspend fun load() = supervisorScope {
  val summary = async { loadSummary() }
  launch { refreshCache() }
  summary.await()
}
`;

  const match = findAndroidSupervisorScopeMatch(source);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'supervisorScope',
    lines: [5],
  });
  assert.equal(hasAndroidSupervisorScopeUsage(source), true);
});

test('findAndroidSupervisorScopeMatch ignora comentarios, strings y nombres parciales', () => {
  const source = `
// supervisorScope { launch { } }
val sample = "supervisorScope"
class SupervisorScopeHelper
`;

  assert.equal(findAndroidSupervisorScopeMatch(source), undefined);
  assert.equal(hasAndroidSupervisorScopeUsage(source), false);
});

test('hasAndroidCoroutineTryCatchUsage ignora comentarios, strings y codigo no coroutine', () => {
  const source = `
// try { withContext(Dispatchers.IO) } catch (e: Exception) {}
val sample = "try catch"
fun notCoroutine() {
  try {
    println("ok")
  } catch (e: Exception) {
    println(e)
  }
}
`;
  assert.equal(hasAndroidCoroutineTryCatchUsage(source), false);
});

test('hasAndroidNoConsoleLogUsage detecta logs reales en codigo Android y permite debug guards', () => {
  const source = `
fun render() {
  Log.d("visible in production")
  if (BuildConfig.DEBUG) Log.d("visible in debug only")
  if (BuildConfig.DEBUG) {
    Log.d("Tag", "debug only")
  }
}
`;
  assert.equal(hasAndroidNoConsoleLogUsage(source), true);
});

test('hasAndroidNoConsoleLogUsage ignora comentarios, strings y logs protegidos por BuildConfig.DEBUG', () => {
  const source = `
// Log.d("debug")
val sample = "Log.e(\\"Tag\\", \\"debug\\")"
fun render() {
  if (BuildConfig.DEBUG) Log.d("debug only")
  if (BuildConfig.DEBUG) {
    Log.e("Tag", "debug only")
  }
}
  `;
  assert.equal(hasAndroidNoConsoleLogUsage(source), false);
});

test('hasAndroidTimberUsage detecta Timber real en codigo Android y permite debug guards', () => {
  const source = `
import timber.log.Timber

fun render() {
  Timber.d("visible in production")
  if (BuildConfig.DEBUG) Timber.d("visible in debug only")
}
`;
  assert.equal(hasAndroidTimberUsage(source), true);
});

test('hasAndroidTimberUsage ignora comentarios, strings y logs protegidos por BuildConfig.DEBUG', () => {
  const source = `
// Timber.d("debug")
val sample = "Timber.e(\\"Tag\\", \\"debug\\")"
fun render() {
  if (BuildConfig.DEBUG) Timber.d("debug only")
}
  `;
  assert.equal(hasAndroidTimberUsage(source), false);
});

test('hasAndroidBuildConfigConstantUsage detecta constantes BuildConfig reales en codigo Android', () => {
  const source = `
fun versionName(): String {
  return BuildConfig.VERSION_NAME
}
`;
  assert.equal(hasAndroidBuildConfigConstantUsage(source), true);
});

test('hasAndroidBuildConfigConstantUsage ignora comentarios, strings y BuildConfig.DEBUG', () => {
  const source = `
// BuildConfig.VERSION_NAME
val sample = "BuildConfig.BUILD_TYPE"
fun render() {
  if (BuildConfig.DEBUG) {
    Timber.d("debug only")
  }
}
`;
  assert.equal(hasAndroidBuildConfigConstantUsage(source), false);
});

test('hasAndroidHardcodedStringUsage detecta strings hardcodeadas en codigo Android', () => {
  const source = `
fun render() {
  val title = "Hola mundo"
}
`;
  assert.equal(hasAndroidHardcodedStringUsage(source), true);
});

test('hasAndroidHardcodedStringUsage ignora comentarios y referencias a resources', () => {
  const source = `
// "Hola mundo"
fun render() {
  val title = R.string.app_name
}
`;
  assert.equal(hasAndroidHardcodedStringUsage(source), false);
});

test('findAndroidStringsXmlMatch devuelve payload semantico para strings.xml localizado', () => {
  const source = `
<resources>
  <string name="app_name">Mi App</string>
  <string-array name="welcome_steps">
    <item>Bienvenido</item>
  </string-array>
</resources>
`;

  const match = findAndroidStringsXmlMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'strings.xml',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'string', lines: [3] },
    { kind: 'property', name: 'string-array', lines: [4] },
  ]);
  assert.match(match.why, /strings\.xml|localiz/i);
  assert.match(match.impact, /internacionalizaci[oó]n|mantenimiento/i);
  assert.match(match.expected_fix, /values-\\*\/strings\.xml|R\.string/i);
});

test('hasAndroidStringsXmlUsage ignora comentarios y XML incompleto', () => {
  const source = `
<!-- <string name="debug">Hola</string> -->
<resources>
  <!-- strings xml placeholder -->
</resources>
`;

  assert.equal(hasAndroidStringsXmlUsage(source), false);
});

test('findAndroidStringFormattingMatch devuelve payload semantico para strings.xml con placeholders posicionales', () => {
  const source = `
<resources>
  <string name="order_summary">Hola %1$s, total %2$d</string>
  <string name="app_name">Mi App</string>
</resources>
`;

  const match = findAndroidStringFormattingMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'strings.xml',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'formatted string', lines: [3] },
  ]);
  assert.match(match.why, /placeholders|argumentos|idiomas/i);
  assert.match(match.impact, /locale|traducci[oó]n|argumentos/i);
  assert.match(match.expected_fix, /%1\$s|%2\$d|strings\.xml/i);
});

test('findAndroidStringFormattingMatch ignora strings sin placeholders posicionales', () => {
  const source = `
<resources>
  <string name="order_summary">Hola mundo</string>
</resources>
`;

  assert.equal(findAndroidStringFormattingMatch(source), undefined);
  assert.equal(hasAndroidStringFormattingUsage(source), false);
});

test('findAndroidPluralsXmlMatch devuelve payload semantico para plurals.xml localizado', () => {
  const source = `
<resources>
  <plurals name="notification_count">
    <item quantity="one">1 notificación</item>
    <item quantity="other">%d notificaciones</item>
  </plurals>
</resources>
`;

  const match = findAndroidPluralsXmlMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'plurals.xml',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'plurals', lines: [3] },
    { kind: 'property', name: 'plural item', lines: [4] },
  ]);
  assert.match(match.why, /plurals\.xml|plural/i);
  assert.match(match.impact, /plural|idioma|cantidad/i);
  assert.match(match.expected_fix, /plurals|quantity|R\.plurals/i);
});

test('hasAndroidPluralsXmlUsage ignora comentarios y XML incompleto', () => {
  const source = `
<!-- <plurals name="debug_count"> -->
<resources>
  <item quantity="one">1 notificación</item>
</resources>
`;

  assert.equal(hasAndroidPluralsXmlUsage(source), false);
});

test('hasAndroidSingletonUsage detecta object declarations y companion singleton holders', () => {
  const source = `
object SessionManager {
  fun refresh() {}
}

class HomeRepository private constructor() {
  companion object {
    @Volatile private var INSTANCE: HomeRepository? = null

    fun getInstance(): HomeRepository {
      return INSTANCE ?: HomeRepository()
    }
  }
}
`;
  assert.equal(hasAndroidSingletonUsage(source), true);
});

test('hasAndroidSingletonUsage ignora anonymous objects y companion objects inocuos', () => {
  const source = `
val listener = object : Runnable {
  override fun run() {}
}

@Module
object NetworkModule {
  fun provideClient(): String = "ok"
}

class Themes {
  companion object {
    const val DEFAULT = "dark"
  }
}
`;
  assert.equal(hasAndroidSingletonUsage(source), false);
});

test('findKotlinPresentationSrpMatch devuelve payload semantico para SRP-Android en presentation', () => {
  const source = `
import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.navigation.NavController
import okhttp3.OkHttpClient
import okhttp3.Request

class PumukiSrpAndroidCanaryViewModel(
  private val navController: NavController,
) : ViewModel() {
  fun restoreSessionSnapshot() {}

  suspend fun fetchRemoteCatalog() {
    val client = OkHttpClient()
    client.newCall(
      Request.Builder()
        .url("https://example.com/catalog.json")
        .build()
    )
  }

  fun cacheLastStore(preferences: SharedPreferences, storeId: String) {
    preferences.edit().putString("last-store-id", storeId).apply()
  }

  fun openStoreMap() {
    navController.navigate("store-map")
  }
}
`;

  const match = findKotlinPresentationSrpMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiSrpAndroidCanaryViewModel',
    lines: [8],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [11] },
    { kind: 'call', name: 'remote networking', lines: [14] },
    { kind: 'call', name: 'local persistence', lines: [22] },
    { kind: 'member', name: 'navigation flow', lines: [27] },
  ]);
  assert.match(match.why, /SRP/i);
  assert.match(match.impact, /múltiples razones de cambio/i);
  assert.match(match.expected_fix, /casos de uso|coordinadores/i);
});

test('findKotlinConcreteDependencyDipMatch devuelve payload semantico para DIP-Android en application', () => {
  const source = `
import android.content.SharedPreferences
import okhttp3.OkHttpClient
import okhttp3.Request

class PumukiDipAndroidCanaryUseCase(
  private val preferences: SharedPreferences,
) {
  private val client: OkHttpClient = OkHttpClient()

  suspend fun execute() {
    val request = Request.Builder()
      .url("https://example.com/catalog.json")
      .build()

    client.newCall(request)
    preferences.edit().putLong("last-sync", 1L).apply()
  }
}
`;

  const match = findKotlinConcreteDependencyDipMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiDipAndroidCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'concrete dependency: SharedPreferences', lines: [7] },
    { kind: 'property', name: 'concrete dependency: OkHttpClient', lines: [9] },
    { kind: 'call', name: 'OkHttpClient()', lines: [9] },
  ]);
  assert.match(match.why, /DIP/i);
  assert.match(match.impact, /infraestructura|alto nivel|coste de sustituir/i);
  assert.match(match.expected_fix, /puertos|abstracciones|gateways/i);
});

test('findKotlinOpenClosedWhenMatch devuelve payload semantico para OCP-Android en application', () => {
  const source = `
enum class PumukiOcpAndroidCanaryChannel {
  GroceryPickup,
  HomeDelivery,
}

class PumukiOcpAndroidCanaryUseCase {
  fun resolve(channel: PumukiOcpAndroidCanaryChannel): String {
    return when (channel) {
      PumukiOcpAndroidCanaryChannel.GroceryPickup -> "pickup"
      PumukiOcpAndroidCanaryChannel.HomeDelivery -> "delivery"
    }
  }
}
`;

  const match = findKotlinOpenClosedWhenMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiOcpAndroidCanaryUseCase',
    lines: [7],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [9] },
    { kind: 'member', name: 'branch GroceryPickup', lines: [10] },
    { kind: 'member', name: 'branch HomeDelivery', lines: [11] },
  ]);
  assert.match(match.why, /OCP/i);
  assert.match(match.impact, /nuevo caso|modificar/i);
  assert.match(match.expected_fix, /estrategia|interfaz|registry/i);
});

test('findKotlinInterfaceSegregationMatch devuelve payload semantico para ISP-Android en application', () => {
  const source = `
interface PumukiIspAndroidCanarySessionPort {
  suspend fun restoreSession()
  suspend fun persistSessionID(id: String)
  suspend fun clearSession()
  suspend fun refreshToken(): String
}

class PumukiIspAndroidCanaryUseCase(
  private val sessionPort: PumukiIspAndroidCanarySessionPort,
) {
  suspend fun execute() {
    sessionPort.restoreSession()
  }
}
`;

  const match = findKotlinInterfaceSegregationMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiIspAndroidCanaryUseCase',
    lines: [9],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'fat interface: PumukiIspAndroidCanarySessionPort', lines: [2] },
    { kind: 'call', name: 'used member: restoreSession', lines: [13] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [4] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [5] },
  ]);
  assert.match(match.why, /ISP/i);
  assert.match(match.impact, /contrato demasiado ancho|cambios ajenos/i);
  assert.match(match.expected_fix, /interfaces pequeñas|puerto mínimo/i);
});

test('detectores SOLID Android no convierten tamaño o cardinalidad en violacion', () => {
  const presentationWithoutMixedResponsibilities = `
class CatalogViewModel {
  fun restoreSessionSnapshot() {}
  fun refreshSessionToken() {}
  fun resumeSessionIfNeeded() {}
  fun signOut() {}
}
`;
  const dipWithPortOnly = `
interface CatalogFetching {
  suspend fun fetchCatalog(): List<String>
}

class CatalogUseCase(
  private val catalog: CatalogFetching,
)
`;
  const cohesiveInterface = `
interface CatalogReading {
  suspend fun fetchCatalog(): List<String>
  suspend fun loadCachedCatalog(): List<String>
  suspend fun readCatalogVersion(): String
  suspend fun getFeaturedCatalog(): List<String>
}

class CatalogUseCase(
  private val catalog: CatalogReading,
) {
  suspend fun execute() {
    catalog.fetchCatalog()
  }
}
`;

  assert.equal(findKotlinPresentationSrpMatch(presentationWithoutMixedResponsibilities), undefined);
  assert.equal(findKotlinConcreteDependencyDipMatch(dipWithPortOnly), undefined);
  assert.equal(findKotlinInterfaceSegregationMatch(cohesiveInterface), undefined);
});

test('findKotlinLiskovSubstitutionMatch devuelve payload semantico para LSP-Android en application', () => {
  const source = `
interface PumukiLspAndroidCanaryDiscountPolicy {
  fun apply(amount: Double): Double
}

class PumukiLspAndroidCanaryStandardDiscountPolicy : PumukiLspAndroidCanaryDiscountPolicy {
  override fun apply(amount: Double): Double {
    return amount * 0.9
  }
}

class PumukiLspAndroidCanaryPremiumDiscountPolicy : PumukiLspAndroidCanaryDiscountPolicy {
  override fun apply(amount: Double): Double {
    require(amount >= 100.0)
    error("premium-only")
  }
}
`;

  const match = findKotlinLiskovSubstitutionMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiLspAndroidCanaryPremiumDiscountPolicy',
    lines: [12],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspAndroidCanaryDiscountPolicy', lines: [2] },
    { kind: 'member', name: 'safe substitute: PumukiLspAndroidCanaryStandardDiscountPolicy', lines: [6] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [14] },
    { kind: 'call', name: 'error', lines: [15] },
  ]);
  assert.match(match.why, /LSP/i);
  assert.match(match.impact, /sustituci|regresion|crash/i);
  assert.match(match.expected_fix, /contrato base|estrategia|subtipo/i);
});
