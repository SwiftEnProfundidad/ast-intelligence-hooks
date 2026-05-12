import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findKotlinConcreteDependencyDipMatch,
  findKotlinInterfaceSegregationMatch,
  findKotlinLiskovSubstitutionMatch,
  findKotlinOpenClosedWhenMatch,
  findKotlinPresentationSrpMatch,
  hasKotlinCoroutineTryCatchUsage,
  hasKotlinDispatcherMainBoundaryLeakUsage,
  hasKotlinGlobalScopeUsage,
  hasKotlinHardcodedBackgroundDispatcherUsage,
  hasKotlinLiveDataStateExposureUsage,
  hasKotlinLifecycleScopeUsage,
  hasKotlinWithContextUsage,
  hasKotlinManualCoroutineScopeInViewModelUsage,
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
