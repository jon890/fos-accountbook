# Multi-stage build for Spring Boot application

# Stage 1: Build
FROM gradle:8.14-jdk21-alpine AS builder

WORKDIR /app

# Copy gradle config files (including Version Catalog)
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle

# Download dependencies (this layer will be cached)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN gradle clean build -x test --no-daemon

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
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", \
  "app.jar"]

