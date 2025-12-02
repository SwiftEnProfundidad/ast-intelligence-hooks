# Android AST Rules Coverage - rulesandroid.mdc Compliance

## 📊 Coverage Analysis

### ✅ Implemented (Current ast-android.js)
1. ✅ Empty catch blocks - HIGH
2. ✅ Generic Exception catch - MEDIUM
3. ✅ Force unwrap (!!) - HIGH
4. ✅ Any without type guards - HIGH
5. ✅ Hardcoded secrets - CRITICAL
6. ✅ Java files detection - CRITICAL
7. ✅ XML layouts detection - CRITICAL

### 🚧 To Implement (From rulesandroid.mdc)

#### Kotlin 100% (Lines 71-80)
- [x] Java files → Kotlin only
- [ ] Callbacks → Coroutines
- [ ] RxJava → Flow
- [ ] Missing sealed classes for states
- [ ] Data classes for DTOs
- [ ] Extension functions opportunities

#### Jetpack Compose (Lines 82-93)
- [x] XML layouts → Compose
- [ ] findViewById usage (should use Compose)
- [ ] Missing @Composable annotation
- [ ] State hoisting violations
- [ ] Missing remember/rememberSaveable
- [ ] Side effects without LaunchedEffect
- [ ] Modifier order incorrect

#### Dependency Injection (Lines 141-150)
- [ ] Singletons → Hilt
- [ ] Manual factories → @Inject
- [ ] Missing @HiltAndroidApp
- [ ] Missing @AndroidEntryPoint
- [ ] Missing @Module/@InstallIn

#### Coroutines (Lines 152-160)
- [ ] Blocking calls in Main dispatcher
- [ ] Missing suspend functions for async ops
- [ ] GlobalScope usage (should use viewModelScope)
- [ ] Missing withContext for dispatcher switch
- [ ] try-catch in coroutines without proper handling

#### Flow (Lines 162-169)
- [ ] LiveData → Flow/StateFlow
- [ ] Missing stateIn for hot flows
- [ ] Flow without proper collection
- [ ] Missing catch operator

#### Networking (Lines 171-179)
- [ ] Missing Retrofit for REST
- [ ] Synchronous network calls
- [ ] Missing interceptors
- [ ] No error handling in API calls
- [ ] Missing SSL pinning

#### Room (Lines 181-189)
- [ ] Raw SQL queries (should use @Query)
- [ ] Missing @Dao for database access
- [ ] DAO without suspend functions
- [ ] Missing Flow<T> for observable queries
- [ ] Missing migrations

#### State Management (Lines 191-197)
- [ ] Mutable state without StateFlow
- [ ] Missing UiState sealed class pattern
- [ ] Direct state mutation (not using copy())
- [ ] Business logic in Composables

#### Testing (Lines 216-232)
- [ ] Missing tests for ViewModels
- [ ] Test coverage <80%
- [ ] Missing JUnit5 tests
- [ ] Mocking in production code

#### Security (Lines 234-241)
- [ ] SharedPreferences for sensitive data → EncryptedSharedPreferences
- [ ] Missing ProGuard/R8 in release
- [ ] Hardcoded API keys

#### Performance (Lines 243-258)
- [ ] RecyclerView → LazyColumn
- [ ] Missing Paging 3 for large lists
- [ ] Expensive operations on Main thread
- [ ] Missing remember for expensive calculations
- [ ] Non-immutable collections

#### Accessibility (Lines 260-266)
- [ ] Missing contentDescription
- [ ] Touch targets <48dp
- [ ] Missing semantics in Compose

#### Localization (Lines 268-274)
- [ ] Hardcoded strings → strings.xml
- [ ] left/right instead of start/end
- [ ] Missing plural resources

#### Anti-patterns (Lines 314-324)
- [x] Java code
- [x] XML layouts
- [x] Force unwrapping (!!)
- [ ] Context leaks (Activity references in long-lived objects)
- [ ] God Activities (>500 lines)
- [ ] Hardcoded strings
- [ ] AsyncTask usage
- [ ] RxJava in new code
- [ ] findViewById usage

### Target: 50 Rules Total
**Current:** 7 rules (14% coverage)
**Goal:** 50 rules (100% coverage)
