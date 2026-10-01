import org.gradle.api.tasks.PathSensitivity

plugins {
    id("java")
    id("checkstyle")
    alias(libs.plugins.spotless)
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
    implementation(libs.flyway.mysql)

    // SQL Logging (DataSource Proxy)
    implementation(libs.p6spy.spring.boot.starter)

    // JWT (Bundle 사용)
    implementation(libs.jjwt.api)
    runtimeOnly(libs.bundles.jwt)

    // OpenAPI (Swagger)
    implementation(libs.springdoc.openapi.starter.webmvc.ui)

    // Cache
    implementation(libs.caffeine)

    // Lombok
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    testCompileOnly(libs.lombok)
    testAnnotationProcessor(libs.lombok)

    // QueryDSL
    implementation("${libs.querydsl.jpa.get()}:jakarta")
    annotationProcessor("${libs.querydsl.apt.get()}:jakarta")
    annotationProcessor(libs.spring.boot.starter.data.jpa)

    // Jackson
    implementation(libs.jackson.module.parameter.names)
    implementation(libs.jackson.datatype.jsr310)

    // Test (Bundle 사용)
    testImplementation(libs.bundles.spring.test)
    testImplementation(libs.archunit)
    testRuntimeOnly(libs.junit.platform.launcher)
    testRuntimeOnly(libs.h2.database)
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

/**
 * ArchUnit 기준 파일의 생성·갱신은 Gradle 속성으로만 명시적으로 켠다.
 * 기본 설정은 archunit.properties 에서 읽으며, 이 속성은 최초 기준 생성 때만 쓴다.
 */
val archunitFreezeProperties = listOf(
    "archunit.freeze.refreeze",
    "archunit.freeze.store.default.allowStoreCreation",
    "archunit.freeze.store.default.allowStoreUpdate",
)

tasks.withType<Test>().configureEach {
    useJUnitPlatform()

    archunitFreezeProperties.forEach { name ->
        providers.gradleProperty(name).orNull?.let { systemProperty(name, it) }
    }

    inputs.files(fileTree("config/archunit/store"))
        .withPropertyName("archunitStore")
        .withPathSensitivity(PathSensitivity.RELATIVE)
}

tasks.register<Test>("archTest") {
    group = "verification"
    description = "ArchUnit 구조 규칙만 검사한다."
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath
    useJUnitPlatform {
        includeTags("architecture")
    }
}

tasks.register("qualityCheck") {
    group = "verification"
    description = "포맷, Checkstyle, ArchUnit 검사를 함께 실행한다."
    dependsOn("spotlessCheck", "checkstyleMain", "checkstyleTest", "archTest")
}

spotless {
    java {
        target("src/main/java/**/*.java", "src/test/java/**/*.java")
        googleJavaFormat(libs.versions.google.java.format.get())
        trimTrailingWhitespace()
        endWithNewline()
    }
}

// Checkstyle 설정 (Google Java Style)
checkstyle {
    toolVersion = "10.12.5"
    configFile = file("${rootDir}/config/checkstyle/google_checks.xml")
    isIgnoreFailures = false
    maxWarnings = 0
}

tasks.withType<Checkstyle> {
    // Generated 파일 제외 (QueryDSL Q클래스 등)
    exclude("**/generated/**", "**/build/generated/**", "**/Q*.java")

    reports {
        xml.required.set(false)
        html.required.set(true)
    }
}

// checkstyleMain은 compile 이후에만 실행
tasks.named("checkstyleMain") {
    mustRunAfter(tasks.named("compileJava"))
    mustRunAfter(tasks.named("compileTestJava"))
}

// Disable plain jar (only create executable boot jar)
tasks.jar {
    enabled = false
}
