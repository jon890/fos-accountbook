plugins {
    id("java")
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

// QueryDSL 설정
val querydslDir = "build/generated/querydsl"

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
    testCompileOnly(libs.lombok)
    testAnnotationProcessor(libs.lombok)
    
    // QueryDSL
    implementation("${libs.querydsl.jpa.get()}:jakarta")
    annotationProcessor("${libs.querydsl.apt.get()}:jakarta")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")
    
    // Test (Bundle 사용)
    testImplementation(libs.bundles.testing)
    testRuntimeOnly(libs.junit.platform.launcher)
    testRuntimeOnly(libs.h2.database)
    
    // Awaitility for async testing
    testImplementation("org.awaitility:awaitility:4.2.0")
}

// QueryDSL 컴파일 설정
tasks.withType<JavaCompile> {
    options.generatedSourceOutputDirectory.set(file(querydslDir))
}

// QueryDSL 소스 디렉토리 추가
sourceSets {
    main {
        java {
            srcDirs(querydslDir)
        }
    }
}

// clean 시 generated 디렉토리 삭제
tasks.clean {
    delete(querydslDir)
}

tasks.test {
    useJUnitPlatform()
}

// Disable plain jar (only create executable boot jar)
tasks.jar {
    enabled = false
}