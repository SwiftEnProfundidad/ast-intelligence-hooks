// ═══════════════════════════════════════════════════════════════
// RuralGO Custom Detekt Rules - SOLID + Clean Architecture
// ═══════════════════════════════════════════════════════════════

plugins {
    kotlin("jvm") version "1.9.21"
    id("maven-publish")
    id("io.gitlab.arturbosch.detekt") version "1.23.4"
}

group = "com.ruralgo.lint"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // Detekt API
    compileOnly("io.gitlab.arturbosch.detekt:detekt-api:1.23.4")
    
    // Kotlin Compiler (for PSI analysis)
    implementation("org.jetbrains.kotlin:kotlin-compiler-embeddable:1.9.21")
    
    // Testing
    testImplementation("io.gitlab.arturbosch.detekt:detekt-test:1.23.4")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("junit:junit:4.13.2")
}

tasks.test {
    useJUnitPlatform()
}

tasks.jar {
    archiveBaseName.set("ruralgo-detekt-rules")
    
    // Include dependencies in JAR (fat jar)
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
    
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

kotlin {
    jvmToolchain(17)
}

// ═══════════════════════════════════════════════════════════════
// Detekt Configuration (Gradle 9 compatible)
// ═══════════════════════════════════════════════════════════════
detekt {
    buildUponDefaultConfig = true
    allRules = false
    config.setFrom(files("$projectDir/detekt.yml"))
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    reports {
        html.required.set(true)
        xml.required.set(false)
        txt.required.set(false)
        sarif.required.set(false)
        md.required.set(false)
        
        html.outputLocation.set(file("build/reports/detekt/detekt.html"))
    }
}

dependencies {
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:1.23.4")
}

