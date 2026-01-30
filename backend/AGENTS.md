# GEMINI Project Context: FOS Accountbook Backend

## 1. Project Overview
**FOS Accountbook Backend** is a Spring Boot-based RESTful API server for a family-oriented expense tracking application. It allows users to manage expenses, incomes, and categories within family groups.

## 2. Technology Stack
- **Language**: Java 21
- **Framework**: Spring Boot 4.0.1
- **Build Tool**: Gradle 9.2 (using Version Catalogs `libs.versions.toml`)
- **Database**: MySQL 9.5.0 (Prod/Local), H2 (Test)
- **ORM**: Spring Data JPA + QueryDSL 5.1.0
- **Security**: Spring Security + JWT (jjwt 0.13.0)
- **Migration**: Flyway
- **Documentation**: SpringDoc OpenAPI 2.8.14 (Swagger UI)
- **Infrastructure**: Docker Compose

## 3. Architecture & Project Structure
The project follows a strict **Layered Architecture**:

### Layer Definitions
- **Presentation (`src/main/java/.../presentation`)**: REST API Controllers, Request/Response DTOs.
- **Application (`src/main/java/.../application`)**: Business logic (Services), Domain Event Listeners, Aspects.
- **Domain (`src/main/java/.../domain`)**: Core business entities, Repository interfaces, Value objects.
- **Infrastructure (`src/main/java/.../infra`)**: Implementation details (Persistence, Security config, External APIs).

### Directory Map
```
src/main/java/com/bifos/accountbook/
├── presentation/   # API Endpoints
├── application/    # Business Logic
├── domain/         # Entities & Interfaces
├── infra/          # Configurations & Impl
└── utils/          # Shared Utilities
```

## 4. Key Features
- **Authentication**: JWT-based login/signup, Google/Kakao integration support (via NextAuth compatibility tables).
- **Family Management**: Create families, invite members via UUID links.
- **Expense/Income Tracking**: CRUD operations for financial records with category classification.
- **Budgeting**: (Planned) Budget alerts and monitoring.
- **Notifications**: System notifications for invitations and updates.

## 5. Setup & Execution

### Prerequisites
- JDK 21
- Docker & Docker Compose

### Local Development
1.  **Start Database**:
    ```bash
    docker-compose -f docker/compose.yml up -d
    ```
2.  **Run Application**:
    ```bash
    ./gradlew bootRun --args='--spring.profiles.active=local'
    ```
3.  **API Documentation**: Access Swagger UI at `http://localhost:8080/swagger-ui/index.html`

### Testing
- Run all tests:
    ```bash
    ./gradlew test
    ```

## 6. Development Standards & Conventions
- **Code Style**: Google Java Style (enforced via Checkstyle).
- **Naming Conventions**:
    - Classes: `CamelCase`
    - Methods/Variables: `camelCase`
    - DB Tables/Columns: `snake_case`
- **DTOs**: Immutable using Lombok (`@Getter`, `@Builder`).
- **Commits**: Follow conventional commits (e.g., `feat:`, `fix:`, `docs:`).
- **Testing**: Unit tests for logic, Integration tests (`@SpringBootTest`) for flows.

### Comments Strategy
- **Express intent through naming**: Use readable variable/method names instead of comments
- **Minimize comments**: Only add comments for complex logic that's hard to understand from code alone
- **Avoid obvious comments**: Don't use comments like "// Given", "// When", "// Then"
- **No TODO/Future work**: Don't leave "TODO" or "future implementation" comments in code. Suggest via conversation instead

## 7. Important Configuration Files
- `build.gradle.kts`: Main build script.
- `gradle/libs.versions.toml`: Dependency version catalog.
- `src/main/resources/application.yml`: Core app configuration.
- `src/main/resources/db/migration/`: Flyway SQL migration scripts.
