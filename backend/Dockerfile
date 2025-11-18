# Multi-stage build for Spring Boot application

# Stage 1: Build
FROM gradle:9.0-jdk21-alpine AS builder

WORKDIR /app

# Copy gradle config files (including Version Catalog)
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle

# Download dependencies (this layer will be cached)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src ./src

# Build the application (skip tests and checkstyle for faster builds)
# assemble: compile + package (no test, no checkstyle)
RUN gradle clean assemble --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built jar from builder stage (only boot jar will be created)
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/v1/health || exit 1

# Run the application
# JVM 옵션:
# -XX:MaxRAMPercentage=75.0: 컨테이너 메모리의 75% 사용 (OOM 방지를 위한 여유 공간 확보)
# -XX:MaxGCPauseMillis=200: GC 일시정지 시간 목표 (200ms, G1GC 기본값 사용)
# -XX:+UseStringDeduplication: 문자열 중복 제거로 메모리 절약
# -Xlog:gc+stringdedup=debug: 문자열 중복 제거 통계 출력 (Java 9+ 통합 로깅 프레임워크 사용)
# 참고:
# - Railway는 실제 사용한 메모리만 과금하므로, MaxRAMPercentage는 OOM 방지 목적
# - Java 21부터 UseContainerSupport는 기본 활성화되어 명시 불필요 (Java 10+ 기본값)
# - PrintStringDeduplicationStatistics는 Java 9+에서 제거됨, Xlog 옵션 사용
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:MaxGCPauseMillis=200", \
  "-XX:+UseStringDeduplication", \
  "-Xlog:gc+stringdedup=debug", \
  "-jar", \
  "app.jar"]

