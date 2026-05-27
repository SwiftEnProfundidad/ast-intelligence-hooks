import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findKotlinConcreteDependencyDipMatch,
  findKotlinInterfaceSegregationMatch,
  findKotlinLiskovSubstitutionMatch,
  findKotlinOpenClosedWhenMatch,
  findKotlinPresentationSrpMatch,
  hasAndroidAsyncTaskUsage,
  hasAndroidCustomSingletonObjectUsage,
  hasAndroidHiltInjectionWithoutEntryPointUsage,
  hasAndroidLegacyFingerprintApiUsage,
  hasKotlinCoroutineTryCatchUsage,
  hasKotlinDispatcherMainBoundaryLeakUsage,
  hasKotlinGlobalScopeUsage,
  hasKotlinGodActivityUsage,
  hasKotlinHardcodedBackgroundDispatcherUsage,
  hasKotlinApplicationOnCreateHeavyInitializationUsage,
  hasKotlinIncompleteMaterialThemeUsage,
  hasKotlinJUnit4Usage,
  hasKotlinHardcodedUiStringUsage,
  collectKotlinHardcodedUiStringLines,
  hasKotlinImperativeNavigationUsage,
  hasKotlinLaunchedEffectBusyLoopUsage,
  hasKotlinLiveDataStateExposureUsage,
  hasKotlinLifecycleScopeUsage,
  hasKotlinLegacyBottomNavigationUsage,
  hasKotlinComposableObjectCreationWithoutRememberUsage,
  hasKotlinComposableStateCreationWithoutRememberUsage,
  hasKotlinForceUnwrapUsage,
  hasKotlinFontScaleDisabledUsage,
  hasKotlinProductionMockUsage,
  hasKotlinNonLazyScrollableCollectionUsage,
  hasKotlinProductionLoggingUsage,
  hasKotlinSharedPreferencesUsage,
  hasKotlinSharedFlowUsedAsStateUsage,
  hasKotlinUnstableLaunchedEffectKeyUsage,
  hasKotlinViewModelFlowWithoutStateInUsage,
  hasKotlinWithContextUsage,
  hasKotlinManualCoroutineScopeInViewModelUsage,
  hasKotlinMissingContentDescriptionUsage,
  hasKotlinModifierBackgroundBeforePaddingUsage,
  hasKotlinRunBlockingUsage,
  hasKotlinSupervisorScopeUsage,
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

test('hasAndroidAsyncTaskUsage detecta AsyncTask legacy en Kotlin y Java', () => {
  const kotlinSource = `
class LegacySyncTask : AsyncTask<Unit, Unit, Unit>() {
  override fun doInBackground(vararg params: Unit) = Unit
}
`;
  const javaSource = `
class LegacySyncTask extends android.os.AsyncTask<Void, Void, Void> {
}
`;
  const executorSource = `
fun executeLegacy(task: Runnable) {
  AsyncTask.THREAD_POOL_EXECUTOR.execute(task)
}
`;
  assert.equal(hasAndroidAsyncTaskUsage(kotlinSource), true);
  assert.equal(hasAndroidAsyncTaskUsage(javaSource), true);
  assert.equal(hasAndroidAsyncTaskUsage(executorSource), true);
});

test('hasAndroidAsyncTaskUsage ignora imports, comentarios y strings', () => {
  const source = `
import android.os.AsyncTask
// class LegacySyncTask : AsyncTask<Unit, Unit, Unit>()
val sample = "AsyncTask.THREAD_POOL_EXECUTOR"
class ModernSyncTask {
  suspend fun execute() = coroutineScope { }
}
`;
  assert.equal(hasAndroidAsyncTaskUsage(source), false);
});

test('hasKotlinGodActivityUsage detecta Activity con UI, red y persistencia mezcladas', () => {
  const source = `
class CheckoutActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { CheckoutScreen() }
  }

  fun loadRemoteCheckout() {
    OkHttpClient().newCall(request).execute()
  }

  fun cacheCheckoutState() {
    getSharedPreferences("checkout", MODE_PRIVATE).edit().apply()
  }
}
`;
  assert.equal(hasKotlinGodActivityUsage(source), true);
});

test('hasKotlinGodActivityUsage permite Activity entrypoint delgada', () => {
  const source = `
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { AppRoot() }
  }
}
`;
  assert.equal(hasKotlinGodActivityUsage(source), false);
});

test('hasKotlinApplicationOnCreateHeavyInitializationUsage detecta inicializacion pesada en Application.onCreate', () => {
  const source = `
class RuralGoApplication : Application() {
  override fun onCreate() {
    super.onCreate()
    FirebaseApp.initializeApp(this)
    WorkManager.initialize(this, configuration)
    Room.databaseBuilder(this, AppDatabase::class.java, "app.db").build()
  }
}
`;
  assert.equal(hasKotlinApplicationOnCreateHeavyInitializationUsage(source), true);
});

test('hasKotlinApplicationOnCreateHeavyInitializationUsage permite Application delgada e Initializer dedicado', () => {
  const thinApplication = `
class RuralGoApplication : Application() {
  override fun onCreate() {
    super.onCreate()
  }
}
`;
  const startupInitializer = `
class AnalyticsInitializer : Initializer<FirebaseApp> {
  override fun create(context: Context): FirebaseApp {
    return FirebaseApp.initializeApp(context)!!
  }
}
`;
  assert.equal(hasKotlinApplicationOnCreateHeavyInitializationUsage(thinApplication), false);
  assert.equal(hasKotlinApplicationOnCreateHeavyInitializationUsage(startupInitializer), false);
});

test('hasKotlinNonLazyScrollableCollectionUsage detecta Column scrollable con iteracion de coleccion', () => {
  const source = `
@Composable
fun OrdersScreen(orders: List<Order>) {
  Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
    orders.forEach { order ->
      Text(order.name)
    }
  }
}
`;
  assert.equal(hasKotlinNonLazyScrollableCollectionUsage(source), true);
});

test('hasKotlinNonLazyScrollableCollectionUsage permite LazyColumn y Column estatica', () => {
  const lazySource = `
@Composable
fun OrdersScreen(orders: List<Order>) {
  LazyColumn {
    items(orders) { order -> Text(order.name) }
  }
}
`;
  const staticSource = `
@Composable
fun EmptyState() {
  Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
    Text("One")
    Text("Two")
  }
}
`;
  assert.equal(hasKotlinNonLazyScrollableCollectionUsage(lazySource), false);
  assert.equal(hasKotlinNonLazyScrollableCollectionUsage(staticSource), false);
});

test('hasKotlinUnstableLaunchedEffectKeyUsage detecta claves constantes o ausentes', () => {
  const unitSource = `
@Composable
fun OrdersScreen(viewModel: OrdersViewModel) {
  LaunchedEffect(Unit) { viewModel.load() }
}
`;
  const trueSource = `
@Composable
fun OrdersScreen(viewModel: OrdersViewModel) {
  LaunchedEffect(true) { viewModel.load() }
}
`;
  const emptySource = `
@Composable
fun OrdersScreen(viewModel: OrdersViewModel) {
  LaunchedEffect() { viewModel.load() }
}
`;
  assert.equal(hasKotlinUnstableLaunchedEffectKeyUsage(unitSource), true);
  assert.equal(hasKotlinUnstableLaunchedEffectKeyUsage(trueSource), true);
  assert.equal(hasKotlinUnstableLaunchedEffectKeyUsage(emptySource), true);
});

test('hasKotlinUnstableLaunchedEffectKeyUsage permite claves de estado estables e ignora comentarios', () => {
  const source = `
// LaunchedEffect(Unit) { debug() }
val sample = "LaunchedEffect(true) { debug() }"
@Composable
fun OrdersScreen(orderId: String, viewModel: OrdersViewModel) {
  LaunchedEffect(orderId) { viewModel.load(orderId) }
}
`;
  assert.equal(hasKotlinUnstableLaunchedEffectKeyUsage(source), false);
});

test('hasKotlinLaunchedEffectBusyLoopUsage detecta bucle no cooperativo dentro de LaunchedEffect', () => {
  const source = `
@Composable
fun SyncPulse(viewModel: SyncViewModel) {
  LaunchedEffect(viewModel.sessionId) {
    while (true) {
      viewModel.poll()
    }
  }
}
`;
  assert.equal(hasKotlinLaunchedEffectBusyLoopUsage(source), true);
});

test('hasKotlinLaunchedEffectBusyLoopUsage permite bucles cooperativos e ignora comentarios y strings', () => {
  const source = `
// LaunchedEffect(Unit) { while (true) { poll() } }
val sample = "LaunchedEffect(Unit) { while (isActive) { poll() } }"
@Composable
fun SyncPulse(viewModel: SyncViewModel) {
  LaunchedEffect(viewModel.sessionId) {
    while (isActive) {
      viewModel.poll()
      delay(1000)
    }
  }
}
`;
  assert.equal(hasKotlinLaunchedEffectBusyLoopUsage(source), false);
});

test('hasKotlinProductionLoggingUsage detecta logs directos de produccion', () => {
  const source = `
class CheckoutRepository {
  fun load() {
    println("loading")
    System.out.println("debug")
    Log.d("Checkout", "loading")
    Timber.e(error)
  }
}
`;
  assert.equal(hasKotlinProductionLoggingUsage(source), true);
});

test('hasKotlinProductionLoggingUsage permite imports, comentarios, strings y logs guardados por debug', () => {
  const source = `
import android.util.Log
// Log.d("Checkout", "debug")
val sample = "println(\\"debug\\")"
class CheckoutRepository {
  fun load() {
    if (BuildConfig.DEBUG) Timber.d("loading")
  }
}
`;
  assert.equal(hasKotlinProductionLoggingUsage(source), false);
});

test('hasKotlinModifierBackgroundBeforePaddingUsage detecta background antes de padding', () => {
  const source = `
@Composable
fun CheckoutCard() {
  Box(
    modifier = Modifier
      .fillMaxWidth()
      .background(Color.Red)
      .padding(16.dp)
  )
}
`;
  assert.equal(hasKotlinModifierBackgroundBeforePaddingUsage(source), true);
});

test('hasKotlinModifierBackgroundBeforePaddingUsage permite padding antes de background e ignora comentarios', () => {
  const source = `
// Modifier.background(Color.Red).padding(16.dp)
val sample = "Modifier.background(Color.Red).padding(16.dp)"
@Composable
fun CheckoutCard() {
  Box(
    modifier = Modifier
      .padding(16.dp)
      .background(Color.Red)
  )
}
`;
  assert.equal(hasKotlinModifierBackgroundBeforePaddingUsage(source), false);
});

test('hasKotlinMissingContentDescriptionUsage detecta Image e Icon sin contentDescription', () => {
  const source = `
@Composable
fun CheckoutIcon() {
  Image(painter = painterResource(R.drawable.checkout), modifier = Modifier.size(24.dp))
  Icon(Icons.Default.Warning, tint = Color.Red)
}
`;
  assert.equal(hasKotlinMissingContentDescriptionUsage(source), true);
});

test('hasKotlinMissingContentDescriptionUsage permite contentDescription explicita e ignora comentarios', () => {
  const source = `
// Image(painter = painterResource(R.drawable.checkout))
val sample = "Icon(Icons.Default.Warning)"
@Composable
fun CheckoutIcon() {
  Image(
    painter = painterResource(R.drawable.checkout),
    contentDescription = stringResource(R.string.checkout_icon)
  )
  Icon(
    imageVector = Icons.Default.Warning,
    contentDescription = null
  )
}
`;
  assert.equal(hasKotlinMissingContentDescriptionUsage(source), false);
});

test('hasKotlinFontScaleDisabledUsage detecta desactivacion del fontScale del sistema', () => {
  const source = `
@Composable
fun FixedTextScale(content: @Composable () -> Unit) {
  val density = LocalDensity.current
  CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale = 1f)) {
    content()
  }
}
`;
  assert.equal(hasKotlinFontScaleDisabledUsage(source), true);
});

test('hasKotlinFontScaleDisabledUsage permite LocalDensity sin forzar fontScale e ignora comentarios', () => {
  const source = `
// Density(density.density, fontScale = 1f)
val sample = "fontScale = 1f"
@Composable
fun ScalableText(content: @Composable () -> Unit) {
  val density = LocalDensity.current
  CompositionLocalProvider(LocalDensity provides density) {
    content()
  }
}
`;
  assert.equal(hasKotlinFontScaleDisabledUsage(source), false);
});

test('hasKotlinIncompleteMaterialThemeUsage detecta MaterialTheme incompleto', () => {
  const source = `
@Composable
fun AppTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = AppColorScheme,
    content = content
  )
}
`;
  assert.equal(hasKotlinIncompleteMaterialThemeUsage(source), true);
});

test('hasKotlinIncompleteMaterialThemeUsage permite MaterialTheme con colorScheme typography y shapes', () => {
  const source = `
// MaterialTheme(colorScheme = AppColorScheme)
val sample = "MaterialTheme(colorScheme = AppColorScheme)"
@Composable
fun AppTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = AppColorScheme,
    typography = AppTypography,
    shapes = AppShapes,
    content = content
  )
}
`;
  assert.equal(hasKotlinIncompleteMaterialThemeUsage(source), false);
});

test('hasKotlinLegacyBottomNavigationUsage detecta BottomNavigation legacy de Material 2', () => {
  const source = `
@Composable
fun LegacyBottomBar() {
  BottomNavigation {
    BottomNavigationItem(selected = true, onClick = {}, icon = { Text("Home") })
  }
}
`;
  assert.equal(hasKotlinLegacyBottomNavigationUsage(source), true);
});

test('hasKotlinLegacyBottomNavigationUsage permite NavigationBar Material 3 e ignora comentarios', () => {
  const source = `
// BottomNavigation { }
val sample = "BottomNavigationItem(selected = true)"
@Composable
fun ModernBottomBar() {
  NavigationBar {
    NavigationBarItem(selected = true, onClick = {}, icon = { Text("Home") })
  }
}
`;
  assert.equal(hasKotlinLegacyBottomNavigationUsage(source), false);
});

test('hasKotlinImperativeNavigationUsage detecta navegacion imperative legacy', () => {
  const source = `
class CheckoutActivity : ComponentActivity() {
  fun openOrder() {
    startActivity(Intent(this, OrderActivity::class.java))
    supportFragmentManager.beginTransaction().replace(R.id.container, OrderFragment()).commit()
  }
}
`;
  assert.equal(hasKotlinImperativeNavigationUsage(source), true);
});

test('hasKotlinImperativeNavigationUsage permite Navigation Compose e ignora comentarios y strings', () => {
  const source = `
// startActivity(Intent(this, LegacyActivity::class.java))
val sample = "supportFragmentManager.beginTransaction()"
@Composable
fun AppNav() {
  val navController = rememberNavController()
  NavHost(navController = navController, startDestination = "home") { }
}
`;
  assert.equal(hasKotlinImperativeNavigationUsage(source), false);
});

test('hasKotlinComposableObjectCreationWithoutRememberUsage detecta objetos recreados en Composable', () => {
  const source = `
@Composable
fun PriceLabel(value: BigDecimal) {
  val formatter = DecimalFormat("#.00")
  Text(formatter.format(value))
}
`;
  assert.equal(hasKotlinComposableObjectCreationWithoutRememberUsage(source), true);
});

test('hasKotlinComposableObjectCreationWithoutRememberUsage permite remember e ignora codigo no Composable', () => {
  const source = `
fun buildFormatter() {
  val formatter = DecimalFormat("#.00")
}

@Composable
fun PriceLabel(value: BigDecimal) {
  val formatter = remember { DecimalFormat("#.00") }
  Text(formatter.format(value))
}
`;
  assert.equal(hasKotlinComposableObjectCreationWithoutRememberUsage(source), false);
});

test('hasKotlinComposableStateCreationWithoutRememberUsage detecta estado creado sin remember', () => {
  const source = `
@Composable
fun SearchBox() {
  val query = mutableStateOf("")
  val filtered = derivedStateOf { query.value.trim() }
  Text(filtered.value)
}
`;
  assert.equal(hasKotlinComposableStateCreationWithoutRememberUsage(source), true);
});

test('hasKotlinComposableStateCreationWithoutRememberUsage permite remember e ignora codigo no Composable', () => {
  const source = `
fun buildState() {
  val query = mutableStateOf("")
}

@Composable
fun SearchBox() {
  val query = remember { mutableStateOf("") }
  val filtered = remember { derivedStateOf { query.value.trim() } }
  Text(filtered.value)
}
`;
  assert.equal(hasKotlinComposableStateCreationWithoutRememberUsage(source), false);
});

test('hasKotlinForceUnwrapUsage detecta force unwrap Kotlin', () => {
  const source = `
class CheckoutState {
  fun title(value: String?) = value!!.trim()
}
`;
  assert.equal(hasKotlinForceUnwrapUsage(source), true);
});

test('hasKotlinForceUnwrapUsage ignora comentarios, strings y operadores no unwrap', () => {
  const source = `
// value!!.trim()
val sample = "value!!.trim()"
class CheckoutState {
  fun same(left: String, right: String) = left !== right
  fun different(left: String, right: String) = left != right
}
`;
  assert.equal(hasKotlinForceUnwrapUsage(source), false);
});

test('hasKotlinLiveDataStateExposureUsage detecta LiveData y MutableLiveData como estado observable legacy', () => {
  const source = `
class OrdersViewModel : ViewModel() {
  private val mutableState = MutableLiveData<OrdersUiState>()
  val state: LiveData<OrdersUiState> = mutableState
}
`;
  assert.equal(hasKotlinLiveDataStateExposureUsage(source), true);
});

test('hasKotlinLiveDataStateExposureUsage ignora imports, comentarios y strings', () => {
  const source = `
import androidx.lifecycle.LiveData
// val state = MutableLiveData<OrdersUiState>()
val sample = "LiveData<OrdersUiState>"
class OrdersViewModel : ViewModel() {
  val state: StateFlow<OrdersUiState> = MutableStateFlow(OrdersUiState())
}
`;
  assert.equal(hasKotlinLiveDataStateExposureUsage(source), false);
});

test('hasKotlinViewModelFlowWithoutStateInUsage detecta Flow expuesto desde ViewModel sin stateIn', () => {
  const source = `
class OrdersViewModel : ViewModel() {
  val state: Flow<OrdersUiState> = repository.observeOrders().map { OrdersUiState(it) }
}
`;
  assert.equal(hasKotlinViewModelFlowWithoutStateInUsage(source), true);
});

test('hasKotlinViewModelFlowWithoutStateInUsage permite stateIn e ignora imports, comentarios y strings', () => {
  const source = `
import kotlinx.coroutines.flow.Flow
// val state: Flow<OrdersUiState> = repository.observeOrders()
val sample = "val state: Flow<OrdersUiState>"
class OrdersViewModel : ViewModel() {
  val state: StateFlow<OrdersUiState> = repository.observeOrders()
    .map { OrdersUiState(it) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), OrdersUiState())
}
`;
  assert.equal(hasKotlinViewModelFlowWithoutStateInUsage(source), false);
});

test('hasKotlinSharedFlowUsedAsStateUsage detecta SharedFlow usado como estado de ViewModel', () => {
  const source = `
class OrdersViewModel : ViewModel() {
  val uiState: SharedFlow<OrdersUiState> = MutableSharedFlow()
  private val _screenState: MutableSharedFlow<CheckoutState> = MutableSharedFlow()
}
`;
  assert.equal(hasKotlinSharedFlowUsedAsStateUsage(source), true);
});

test('hasKotlinSharedFlowUsedAsStateUsage permite SharedFlow de eventos y StateFlow de estado', () => {
  const source = `
import kotlinx.coroutines.flow.SharedFlow
// val uiState: SharedFlow<OrdersUiState> = MutableSharedFlow()
val sample = "val state: SharedFlow<OrdersUiState>"
class OrdersViewModel : ViewModel() {
  val uiState: StateFlow<OrdersUiState> = MutableStateFlow(OrdersUiState())
  val events: SharedFlow<OrdersEvent> = MutableSharedFlow()
}
`;
  assert.equal(hasKotlinSharedFlowUsedAsStateUsage(source), false);
});

test('hasKotlinManualCoroutineScopeInViewModelUsage detecta CoroutineScope manual dentro de ViewModel', () => {
  const source = `
class OrdersViewModel : ViewModel() {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
}
`;
  assert.equal(hasKotlinManualCoroutineScopeInViewModelUsage(source), true);
});

test('hasKotlinManualCoroutineScopeInViewModelUsage ignora imports, comentarios y uso fuera de ViewModel', () => {
  const source = `
import kotlinx.coroutines.CoroutineScope
// private val scope = CoroutineScope(SupervisorJob())
val sample = "CoroutineScope(SupervisorJob())"
class OrdersWorker {
  private val scope = CoroutineScope(SupervisorJob())
}
class OrdersViewModel : ViewModel() {
  fun load() {
    viewModelScope.launch { }
  }
}
`;
  assert.equal(hasKotlinManualCoroutineScopeInViewModelUsage(source), false);
});

test('hasKotlinDispatcherMainBoundaryLeakUsage detecta Dispatchers.Main como dispatcher UI explícito', () => {
  const source = `
class SyncOrdersUseCase {
  suspend fun execute() = withContext(Dispatchers.Main) { }
}
`;
  assert.equal(hasKotlinDispatcherMainBoundaryLeakUsage(source), true);
});

test('hasKotlinDispatcherMainBoundaryLeakUsage ignora imports, comentarios y strings', () => {
  const source = `
import kotlinx.coroutines.Dispatchers
// withContext(Dispatchers.Main) { }
val sample = "Dispatchers.Main"
class SyncOrdersUseCase {
  suspend fun execute() = withContext(Dispatchers.IO) { }
}
`;
  assert.equal(hasKotlinDispatcherMainBoundaryLeakUsage(source), false);
});

test('hasKotlinHardcodedBackgroundDispatcherUsage detecta Dispatchers.IO y Dispatchers.Default', () => {
  const ioSource = `
class SyncOrdersUseCase {
  suspend fun execute() = withContext(Dispatchers.IO) { }
}
`;
  const defaultSource = `
class BuildCatalogIndexUseCase {
  suspend fun execute() = withContext(Dispatchers.Default) { }
}
`;
  assert.equal(hasKotlinHardcodedBackgroundDispatcherUsage(ioSource), true);
  assert.equal(hasKotlinHardcodedBackgroundDispatcherUsage(defaultSource), true);
});

test('hasKotlinHardcodedBackgroundDispatcherUsage ignora imports, comentarios, strings y Main', () => {
  const source = `
import kotlinx.coroutines.Dispatchers
// withContext(Dispatchers.IO) { }
val sample = "Dispatchers.Default"
class SyncOrdersUseCase {
  suspend fun execute() = withContext(Dispatchers.Main) { }
}
`;
  assert.equal(hasKotlinHardcodedBackgroundDispatcherUsage(source), false);
});

test('hasKotlinWithContextUsage detecta withContext con dispatcher y con generics', () => {
  const dispatcherSource = `
class SyncOrdersUseCase {
  suspend fun execute() = withContext(Dispatchers.IO) { syncRemote() }
}
`;
  const genericSource = `
class SyncOrdersUseCase {
  suspend fun execute() = withContext<Unit>(dispatcher) { syncRemote() }
}
`;
  assert.equal(hasKotlinWithContextUsage(dispatcherSource), true);
  assert.equal(hasKotlinWithContextUsage(genericSource), true);
});

test('hasKotlinWithContextUsage ignora imports, comentarios, strings y nombres parciales', () => {
  const source = `
import kotlinx.coroutines.withContext
// withContext(Dispatchers.IO) { }
val sample = "withContext(Dispatchers.Default)"
class SyncOrdersUseCase {
  suspend fun execute() = customWithContext(dispatcher) { syncRemote() }
}
`;
  assert.equal(hasKotlinWithContextUsage(source), false);
});

test('hasKotlinLifecycleScopeUsage detecta lifecycleScope con llamadas encadenadas', () => {
  const source = `
class SyncOrdersUseCase {
  fun execute() {
    lifecycleScope.launch { syncRemote() }
  }
}
`;
  assert.equal(hasKotlinLifecycleScopeUsage(source), true);
});

test('hasKotlinLifecycleScopeUsage ignora imports, comentarios, strings y nombres parciales', () => {
  const source = `
import androidx.lifecycle.lifecycleScope
// lifecycleScope.launch { syncRemote() }
val sample = "lifecycleScope.launch { syncRemote() }"
class SyncOrdersUseCase {
  fun execute() {
    customLifecycleScope.launch { syncRemote() }
  }
}
`;
  assert.equal(hasKotlinLifecycleScopeUsage(source), false);
});

test('hasKotlinSharedPreferencesUsage detecta SharedPreferences y getSharedPreferences', () => {
  const typeSource = `
class PreferencesStore(private val preferences: SharedPreferences) {
  fun read() = preferences.getString("token", null)
}
`;
  const callSource = `
class PreferencesStore(private val context: Context) {
  fun read() = context.getSharedPreferences("user", Context.MODE_PRIVATE)
}
`;
  assert.equal(hasKotlinSharedPreferencesUsage(typeSource), true);
  assert.equal(hasKotlinSharedPreferencesUsage(callSource), true);
});

test('hasKotlinSharedPreferencesUsage ignora imports, comentarios, strings y nombres parciales', () => {
  const source = `
import android.content.SharedPreferences
// val preferences: SharedPreferences = legacy()
val sample = "getSharedPreferences(\"user\")"
class PreferencesStore {
  fun read() = customSharedPreferencesProvider()
}
`;
  assert.equal(hasKotlinSharedPreferencesUsage(source), false);
});

test('hasKotlinJUnit4Usage detecta imports y anotaciones JUnit4 en tests Kotlin Android', () => {
  const importSource = `
import org.junit.Test
import org.junit.Assert

class OrdersViewModelTest {
  @Test
  fun loadsOrders() {
    Assert.assertEquals(1, 1)
  }
}
`;
  const runnerSource = `
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OrdersInstrumentedTest
`;

  assert.equal(hasKotlinJUnit4Usage(importSource), true);
  assert.equal(hasKotlinJUnit4Usage(runnerSource), true);
});

test('hasKotlinJUnit4Usage ignora JUnit5, comentarios y strings', () => {
  const source = `
import org.junit.jupiter.api.Test
// import org.junit.Test
val sample = "Assert.assertEquals(1, 1)"

class OrdersViewModelTest {
  @Test
  fun loadsOrders() {
    assertEquals(1, 1)
  }
}
`;
  assert.equal(hasKotlinJUnit4Usage(source), false);
});

test('hasKotlinProductionMockUsage detecta mocks y spies en Kotlin Android production', () => {
  const mockkSource = `
class OrdersRepositoryFactory {
  fun create(): OrdersRepository = mockk(relaxed = true)
}
`;
  const mockitoSource = `
class OrdersRepositoryFactory {
  private val api = Mockito.mock(OrdersApi::class.java)
}
`;
  const annotationSource = `
class OrdersRepositoryFactory {
  @Spy
  lateinit var repository: OrdersRepository
}
`;

  assert.equal(hasKotlinProductionMockUsage(mockkSource), true);
  assert.equal(hasKotlinProductionMockUsage(mockitoSource), true);
  assert.equal(hasKotlinProductionMockUsage(annotationSource), true);
});

test('hasKotlinProductionMockUsage ignora imports, comentarios, strings y nombres parciales', () => {
  const source = `
import io.mockk.mockk
import org.mockito.Mockito
// val api = mockk<OrdersApi>()
val sample = "Mockito.mock(OrdersApi::class.java)"
class OrdersRepositoryFactory {
  fun create() = mockkitoFactory()
}
`;
  assert.equal(hasKotlinProductionMockUsage(source), false);
});

test('hasKotlinHardcodedUiStringUsage detecta textos UI hardcodeados en Compose', () => {
  const source = `
@Composable
fun CheckoutHeader() {
  Text("Comprar ahora")
  Icon(
    imageVector = Icons.Default.Warning,
    contentDescription = "Aviso"
  )
}
`;
  assert.equal(hasKotlinHardcodedUiStringUsage(source), true);
  assert.deepEqual(collectKotlinHardcodedUiStringLines(source), [4, 7]);
});

test('hasKotlinHardcodedUiStringUsage ignora imports, comentarios y strings localizados', () => {
  const source = `
import androidx.compose.material3.Text
// Text("Debug")
val sample = "Text(\\"Debug\\")"
@Composable
fun CheckoutHeader() {
  Text(stringResource(R.string.checkout_title))
  Icon(
    imageVector = Icons.Default.Warning,
    contentDescription = stringResource(R.string.warning)
  )
}
`;
  assert.equal(hasKotlinHardcodedUiStringUsage(source), false);
  assert.deepEqual(collectKotlinHardcodedUiStringLines(source), []);
});

test('hasKotlinSupervisorScopeUsage detecta supervisorScope con parentesis y llaves', () => {
  const parenthesesSource = `
class SyncOrdersUseCase {
  suspend fun execute() = supervisorScope {
    launch { syncRemote() }
  }
}
`;
  const genericSource = `
class SyncOrdersUseCase {
  suspend fun execute() = supervisorScope<Unit> {
    launch { syncRemote() }
  }
}
`;
  assert.equal(hasKotlinSupervisorScopeUsage(parenthesesSource), true);
  assert.equal(hasKotlinSupervisorScopeUsage(genericSource), true);
});

test('hasKotlinSupervisorScopeUsage ignora imports, comentarios, strings y nombres parciales', () => {
  const source = `
import kotlinx.coroutines.supervisorScope
// supervisorScope { launch { } }
val sample = "supervisorScope { launch { } }"
class SyncOrdersUseCase {
  suspend fun execute() = customSupervisorScope { }
}
`;
  assert.equal(hasKotlinSupervisorScopeUsage(source), false);
});

test('hasKotlinCoroutineTryCatchUsage detecta try-catch dentro de contexto coroutine', () => {
  const suspendSource = `
class SyncOrdersUseCase {
  suspend fun execute() {
    try {
      syncRemote()
    } catch (error: IOException) {
      recover(error)
    }
  }
}
`;
  const launchSource = `
class SyncOrdersUseCase {
  fun execute() {
    launch {
      try {
        syncRemote()
      } catch (error: IOException) {
        recover(error)
      }
    }
  }
}
`;
  assert.equal(hasKotlinCoroutineTryCatchUsage(suspendSource), true);
  assert.equal(hasKotlinCoroutineTryCatchUsage(launchSource), true);
});

test('hasKotlinCoroutineTryCatchUsage ignora imports, comentarios, strings y try-catch no coroutine', () => {
  const source = `
import kotlin.runCatching
// suspend fun execute() { try { syncRemote() } catch (error: IOException) { recover(error) } }
val sample = "try { syncRemote() } catch (error: IOException) { recover(error) }"
class SyncOrdersUseCase {
  fun execute() {
    try {
      syncRemote()
    } catch (error: IOException) {
      recover(error)
    }
  }
}
`;
  assert.equal(hasKotlinCoroutineTryCatchUsage(source), false);
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

test('hasAndroidLegacyFingerprintApiUsage detecta APIs biométricas legacy y preserva BiometricPrompt', () => {
  const legacyManager = `
import android.hardware.fingerprint.FingerprintManager

class LegacyBiometricAuth(private val fingerprintManager: FingerprintManager) {
  fun authenticate(callback: FingerprintManager.AuthenticationCallback) {
    fingerprintManager.authenticate(null, null, 0, callback, null)
  }
}
`;
  const legacyCompat = `
class LegacyCompatAuth(private val fingerprintManager: FingerprintManagerCompat) {
  fun authenticate(callback: FingerprintManagerCompat.AuthenticationCallback) {
    fingerprintManager.authenticate(null, 0, null, callback, null)
  }
}
`;
  const modern = `
import androidx.biometric.BiometricPrompt

class ModernBiometricAuth(private val biometricPrompt: BiometricPrompt) {
  fun authenticate(promptInfo: BiometricPrompt.PromptInfo) {
    biometricPrompt.authenticate(promptInfo)
  }
}
// FingerprintManager should not match inside comments
val sample = "FingerprintManagerCompat"
`;

  assert.equal(hasAndroidLegacyFingerprintApiUsage(legacyManager), true);
  assert.equal(hasAndroidLegacyFingerprintApiUsage(legacyCompat), true);
  assert.equal(hasAndroidLegacyFingerprintApiUsage(modern), false);
});

test('hasAndroidCustomSingletonObjectUsage detecta singletons Kotlin propios y preserva objetos seguros', () => {
  const singletonSource = `
object CheckoutRepository {
  fun loadCheckout() = Unit
}

object SessionManager {
  fun clear() = Unit
}
`;
  const safeSource = `
object CheckoutRoute {
  const val PATH = "checkout"
}

@Module
@InstallIn(SingletonComponent::class)
object CheckoutModule {
  @Provides
  fun provideRepository(): CheckoutRepository = CheckoutRepository()
}
`;

  assert.equal(hasAndroidCustomSingletonObjectUsage(singletonSource), true);
  assert.equal(hasAndroidCustomSingletonObjectUsage(safeSource), false);
});

test('hasAndroidHiltInjectionWithoutEntryPointUsage detecta Activity o Fragment con inyección Hilt sin AndroidEntryPoint', () => {
  const missingEntryPoint = `
class CheckoutActivity : AppCompatActivity() {
  @Inject lateinit var analytics: CheckoutAnalytics
}

class StoresFragment : Fragment() {
  @Inject lateinit var repository: StoresRepository
}
`;
  const validEntryPoint = `
@AndroidEntryPoint
class CheckoutActivity : AppCompatActivity() {
  @Inject lateinit var analytics: CheckoutAnalytics
}

class CheckoutViewModel @Inject constructor(
  private val repository: CheckoutRepository
) : ViewModel()
`;

  assert.equal(hasAndroidHiltInjectionWithoutEntryPointUsage(missingEntryPoint), true);
  assert.equal(hasAndroidHiltInjectionWithoutEntryPointUsage(validEntryPoint), false);
});
