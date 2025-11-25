package com.ruralgo.lint.memory

import io.gitlab.arturbosch.detekt.api.*
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.resolve.BindingContext

class ContextLeakDetector(config: Config = Config.empty) : Rule(config) {
    override val issue = Issue(
        id = "ContextLeakDetector",
        severity = Severity.Defect,
        description = "Context stored in long-lived objects causes memory leaks",
        debt = Debt.TWENTY_MINS
    )
    
    override fun visitClass(klass: KtClass) {
        super.visitClass(klass)
        
        val className = klass.name ?: return
        
        val isLongLived = className.contains("Manager") ||
                         className.contains("Repository") ||
                         className.contains("Service") ||
                         className.contains("Helper") ||
                         className.contains("Singleton") ||
                         klass.annotationEntries.any { it.shortName?.asString() == "Singleton" }
        
        if (!isLongLived) return
        
        klass.getProperties().forEach { property ->
            val typeReference = property.typeReference?.text ?: ""
            
            val isContextType = typeReference == "Context" ||
                               typeReference == "Activity" ||
                               typeReference == "Fragment" ||
                               typeReference == "View" ||
                               typeReference.contains("Context")
            
            if (isContextType) {
                val hasWeakReference = property.text.contains("WeakReference")
                val isApplicationContext = property.text.contains("applicationContext") ||
                                          property.text.contains("Application")
                
                if (!hasWeakReference && !isApplicationContext) {
                    report(
                        CodeSmell(
                            issue,
                            Entity.from(property),
                            """
                            🚨 CRITICAL: Context Leak in Long-Lived Object
                            
                            Class: $className
                            Property: ${property.name}
                            Type: $typeReference
                            
                            Android Memory Leak - Context Reference:
                            
                            CONSEQUENCES:
                            ❌ Activity not garbage collected
                            ❌ Full UI hierarchy retained in memory
                            ❌ OutOfMemoryError crashes
                            ❌ 10-100MB leak PER Activity instance
                            ❌ App slowdown over time
                            ❌ Background process killed by Android
                            
                            WHY IT'S DANGEROUS:
                            
                            Scenario (BAD):
                            ```kotlin
                            // ❌ CRITICAL LEAK
                            @Singleton
                            class DataManager @Inject constructor(
                                private val context: Context  // ❌ Activity leaked!
                            ) {
                                fun doSomething() {
                                    context.getString(R.string.app_name)
                                }
                            }
                            
                            // What happens:
                            // 1. User opens Activity → DataManager gets Activity context
                            // 2. User closes Activity
                            // 3. Activity tries to be GC'd
                            // 4. BUT DataManager (Singleton) holds reference
                            // 5. Activity + full View hierarchy LEAKED
                            // 6. User opens Activity again → ANOTHER leak
                            // 7. Repeat 10 times → 500MB+ leaked
                            // 8. OutOfMemoryError → CRASH
                            ```
                            
                            SOLUTION 1 (Use Application Context):
                            ```kotlin
                            @Singleton
                            class DataManager @Inject constructor(
                                @ApplicationContext  // ✅ Safe - app-scoped
                                private val context: Context
                            ) {
                                fun doSomething() {
                                    context.getString(R.string.app_name)  // ✅ OK
                                }
                            }
                            
                            // Hilt module:
                            @Module
                            @InstallIn(SingletonComponent::class)
                            object AppModule {
                                @Provides
                                @ApplicationContext
                                fun provideContext(@ApplicationContext context: Context) = context
                            }
                            ```
                            
                            SOLUTION 2 (WeakReference):
                            ```kotlin
                            class MyHelper {
                                private var contextRef: WeakReference<Context>? = null
                                
                                fun initialize(context: Context) {
                                    contextRef = WeakReference(context)
                                }
                                
                                fun doSomething() {
                                    contextRef?.get()?.let { context ->
                                        context.getString(R.string.app_name)
                                    } ?: run {
                                        // Context was GC'd, handle gracefully
                                    }
                                }
                            }
                            ```
                            
                            SOLUTION 3 (Scoped Correctly):
                            ```kotlin
                            // Don't use @Singleton for Activity-scoped
                            @ActivityScoped  // ✅ Correct scope
                            class ActivityHelper @Inject constructor(
                                private val activity: Activity
                            ) {
                                // Dies with Activity
                            }
                            ```
                            
                            CONTEXT TYPES AND SAFETY:
                            
                            ✅ SAFE (App-scoped):
                            - Application context
                            - @ApplicationContext (Hilt)
                            - applicationContext property
                            
                            ❌ UNSAFE (Activity-scoped):
                            - Activity
                            - Fragment
                            - View
                            - Activity.getBaseContext()
                            - ContextWrapper wrapping Activity
                            
                            ⚠️ CONDITIONAL:
                            - Service (OK if @Singleton service)
                            - BroadcastReceiver (OK if static)
                            
                            DETECTION TOOLS:
                            ```bash
                            # LeakCanary (development)
                            dependencies {
                                debugImplementation 'com.squareup.leakcanary:leakcanary-android:2.12'
                            }
                            
                            # Android Studio Profiler
                            // Heap dump → Find retained Activities
                            ```
                            
                            REAL-WORLD EXAMPLE:
                            
                            Bad (Leaks 50MB per Activity):
                            ```kotlin
                            object ImageCache {  // ❌ Object = Singleton
                                private var context: Context? = null
                                
                                fun init(context: Context) {
                                    this.context = context  // LEAK!
                                }
                                
                                fun loadImage(resId: Int): Bitmap? {
                                    return BitmapFactory.decodeResource(
                                        context?.resources,
                                        resId
                                    )
                                }
                            }
                            ```
                            
                            Good (No leak):
                            ```kotlin
                            @Singleton
                            class ImageCache @Inject constructor(
                                @ApplicationContext private val context: Context  // ✅
                            ) {
                                fun loadImage(resId: Int): Bitmap? {
                                    return BitmapFactory.decodeResource(
                                        context.resources,
                                        resId
                                    )
                                }
                            }
                            ```
                            
                            TESTING:
                            ```kotlin
                            @Test
                            fun testNoContextLeak() {
                                val activity = WeakReference(
                                    Robolectric.buildActivity(MainActivity::class.java).get()
                                )
                                
                                val manager = DataManager(activity.get()!!)
                                
                                // Simulate Activity destroy
                                activity.get()?.finish()
                                Runtime.getRuntime().gc()
                                Thread.sleep(100)
                                
                                assertNull("Activity leaked!", activity.get())
                            }
                            ```
                            
                            LIFECYCLE AWARENESS:
                            ```kotlin
                            class MyObserver(context: Context) : DefaultLifecycleObserver {
                                private var contextRef = WeakReference(context)
                                
                                override fun onDestroy(owner: LifecycleOwner) {
                                    contextRef.clear()
                                    contextRef = null
                                }
                            }
                            ```
                            
                            Android Best Practices:
                            "Never store Activity context in static/singleton.
                             Use Application context or proper scoping."
                            
                            This is a CRITICAL memory leak.
                            Fix IMMEDIATELY before production.
                            """.trimIndent()
                        )
                    )
                }
            }
        }
    }
}

