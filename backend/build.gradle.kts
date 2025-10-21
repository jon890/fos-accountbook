plugins {
    id("java")
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

group = "com.bifos"
version = "1.0-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_21

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters (Bundle 사용)
    implementation(libs.bundles.spring.boot.starters)
    
    // Database
    runtimeOnly(libs.mysql.connector.j)
    implementation(libs.bundles.flyway)
    
    // SQL Logging (DataSource Proxy)
    implementation(libs.p6spy.spring.boot.starter)
    
    // JWT (Bundle 사용)
    implementation(libs.jjwt.api)
    runtimeOnly(libs.bundles.jwt)
    
    // OpenAPI (Swagger)
    implementation(libs.springdoc.openapi.starter.webmvc.ui)
    
    // Lombok
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    
    // Test (Bundle 사용)
    testImplementation(libs.bundles.testing)
    testRuntimeOnly(libs.junit.platform.launcher)
    testRuntimeOnly(libs.h2.database)
}

tasks.test {
    useJUnitPlatform()
}

// Disable plain jar (only create executable boot jar)
tasks.jar {
    enabled = false
}