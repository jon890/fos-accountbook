package com.bifos.accountbook.category.infra;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class CategoryTypeMigrationTest {

  @Test
  void classifiesCategoriesCreatesIncomeDefaultsAndMovesActiveFamilyIncomeHistory() {
    DataSource dataSource =
        new DriverManagerDataSource(
            "jdbc:h2:mem:category-type-migration;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");

    org.springframework.jdbc.core.JdbcTemplate jdbc =
        new org.springframework.jdbc.core.JdbcTemplate(dataSource);
    createPreMigrationSchema(jdbc);
    insertFamily(jdbc, "active-family", "ACTIVE");
    insertFamily(jdbc, "deleted-family", "DELETED");
    insertUser(jdbc);

    insertCategory(jdbc, "expense", "active-family", "식비", false);
    insertCategory(jdbc, "income-only", "active-family", "급여", false);
    insertCategory(jdbc, "mixed", "active-family", "공용", false);
    insertCategory(jdbc, "uncategorized", "active-family", "이름 변경됨", true);
    insertCategory(jdbc, "recurring-ref", "active-family", "반복 참조", false);
    insertCategory(jdbc, "deleted-family-expense", "deleted-family", "삭제 가족 지출", false);
    insertCategory(jdbc, "existing-income-default", "active-family", "기타 수입", false);

    insertIncome(jdbc, "income-only", "active-family", "ACTIVE");
    insertIncome(jdbc, "mixed", "active-family", "ACTIVE");
    insertIncome(jdbc, "expense", "active-family", "DELETED");
    insertIncome(jdbc, "uncategorized", "active-family", "ACTIVE");
    insertIncome(jdbc, "recurring-ref", "active-family", "ACTIVE");
    insertIncome(jdbc, "existing-income-default", "active-family", "ACTIVE");
    insertIncome(jdbc, "deleted-family-expense", "deleted-family", "ACTIVE");
    insertExpense(jdbc, "expense", "active-family");
    insertExpense(jdbc, "mixed", "active-family");
    insertRecurringExpense(jdbc, "recurring-ref", "active-family");
    jdbc.update("UPDATE categories SET status = 'DELETED' WHERE uuid = 'expense'");

    Flyway.configure()
        .dataSource(dataSource)
        .locations("classpath:db/migration")
        .baselineOnMigrate(true)
        .baselineVersion("20260930.1400")
        .load()
        .migrate();

    assertThat(typeOf(jdbc, "income-only")).isEqualTo("INCOME");
    assertThat(typeOf(jdbc, "expense")).isEqualTo("EXPENSE");
    assertThat(typeOf(jdbc, "mixed")).isEqualTo("EXPENSE");
    assertThat(typeOf(jdbc, "uncategorized")).isEqualTo("EXPENSE");
    assertThat(typeOf(jdbc, "recurring-ref")).isEqualTo("EXPENSE");
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE family_uuid = 'active-family' AND type = 'INCOME' AND status = 'ACTIVE' AND name IN ('급여', '부수입', '용돈', '기타 수입')",
                Integer.class))
        .isEqualTo(4);
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE family_uuid = 'active-family' AND type = 'INCOME' AND status = 'ACTIVE' AND is_default = TRUE",
                Integer.class))
        .isEqualTo(1);

    String incomeDefaultUuid =
        jdbc.queryForObject(
            "SELECT uuid FROM categories WHERE family_uuid = 'active-family' AND name = '기타 수입' AND type = 'INCOME' AND is_default = TRUE",
            String.class);
    assertThat(incomeCategories(jdbc, "active-family"))
        .containsExactlyInAnyOrder(
            incomeDefaultUuid,
            incomeDefaultUuid,
            incomeDefaultUuid,
            incomeDefaultUuid,
            incomeDefaultUuid,
            "income-only");
    assertThat(incomeCategories(jdbc, "deleted-family")).containsOnly("deleted-family-expense");
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE family_uuid = 'deleted-family' AND type = 'INCOME' AND is_default = TRUE",
                Integer.class))
        .isZero();
  }

  private void insertFamily(
      org.springframework.jdbc.core.JdbcTemplate jdbc, String uuid, String status) {
    jdbc.update(
        "INSERT INTO families (uuid, name, monthly_budget, status, created_at, updated_at) VALUES (?, ?, 0, ?, NOW(), NOW())",
        uuid,
        uuid,
        status);
  }

  /** H2가 기존 V3 migration의 복합 ALTER TABLE 문법을 지원하지 않아, 직전 운영 스키마를 직접 구성한다. */
  private void createPreMigrationSchema(org.springframework.jdbc.core.JdbcTemplate jdbc) {
    jdbc.execute(
        "CREATE TABLE families (id BIGINT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, "
            + "name VARCHAR(100) NOT NULL, monthly_budget DECIMAL(15, 2) NOT NULL, status VARCHAR(20) NOT NULL, "
            + "created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL)");
    jdbc.execute(
        "CREATE TABLE users (id BIGINT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, "
            + "provider VARCHAR(50) NOT NULL, provider_id VARCHAR(255) NOT NULL, name VARCHAR(255), "
            + "email VARCHAR(255) NOT NULL, createdAt DATETIME(3) NOT NULL, updatedAt DATETIME(3) NOT NULL, "
            + "status VARCHAR(20) NOT NULL)");
    jdbc.execute(
        "CREATE TABLE categories (id BIGINT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, "
            + "family_uuid VARCHAR(36) NOT NULL, name VARCHAR(50) NOT NULL, color VARCHAR(50), icon VARCHAR(50), "
            + "status VARCHAR(20) NOT NULL, is_default BOOLEAN NOT NULL, exclude_from_budget BOOLEAN NOT NULL, "
            + "created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL)");
    jdbc.execute(
        "CREATE TABLE incomes (id BIGINT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, "
            + "family_uuid VARCHAR(36) NOT NULL, category_uuid VARCHAR(36) NOT NULL, user_uuid VARCHAR(36) NOT NULL, "
            + "amount DECIMAL(15, 2) NOT NULL, date DATETIME(3) NOT NULL, status VARCHAR(20) NOT NULL, "
            + "created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL)");
    jdbc.execute(
        "CREATE TABLE expenses (id BIGINT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, "
            + "family_uuid VARCHAR(36) NOT NULL, category_uuid VARCHAR(36) NOT NULL, user_uuid VARCHAR(36) NOT NULL, "
            + "amount DECIMAL(15, 2) NOT NULL, date DATETIME(3) NOT NULL, status VARCHAR(20) NOT NULL, "
            + "exclude_from_budget BOOLEAN NOT NULL, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL)");
    jdbc.execute(
        "CREATE TABLE recurring_expenses (id BIGINT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL UNIQUE, "
            + "family_uuid VARCHAR(36) NOT NULL, category_uuid VARCHAR(36) NOT NULL, user_uuid VARCHAR(36) NOT NULL, "
            + "name VARCHAR(100) NOT NULL, amount DECIMAL(12, 2) NOT NULL, day_of_month TINYINT NOT NULL, "
            + "status VARCHAR(20) NOT NULL, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL)");
  }

  private void insertUser(org.springframework.jdbc.core.JdbcTemplate jdbc) {
    jdbc.update(
        "INSERT INTO users (uuid, provider, provider_id, name, email, createdAt, updatedAt, status) VALUES ('migration-user', 'test', 'migration-user', 'Migration User', 'migration@example.com', NOW(), NOW(), 'ACTIVE')");
  }

  private void insertCategory(
      org.springframework.jdbc.core.JdbcTemplate jdbc,
      String uuid,
      String familyUuid,
      String name,
      boolean isDefault) {
    jdbc.update(
        "INSERT INTO categories (uuid, family_uuid, name, color, icon, status, is_default, exclude_from_budget, created_at, updated_at) VALUES (?, ?, ?, '#6366f1', '🏷️', 'ACTIVE', ?, FALSE, NOW(), NOW())",
        uuid,
        familyUuid,
        name,
        isDefault);
  }

  private void insertIncome(
      org.springframework.jdbc.core.JdbcTemplate jdbc,
      String categoryUuid,
      String familyUuid,
      String status) {
    jdbc.update(
        "INSERT INTO incomes (uuid, family_uuid, category_uuid, user_uuid, amount, date, status, created_at, updated_at) VALUES (RANDOM_UUID(), ?, ?, 'migration-user', 1000, NOW(), ?, NOW(), NOW())",
        familyUuid,
        categoryUuid,
        status);
  }

  private void insertExpense(
      org.springframework.jdbc.core.JdbcTemplate jdbc, String categoryUuid, String familyUuid) {
    jdbc.update(
        "INSERT INTO expenses (uuid, family_uuid, category_uuid, user_uuid, amount, date, status, exclude_from_budget, created_at, updated_at) VALUES (RANDOM_UUID(), ?, ?, 'migration-user', 1000, NOW(), 'ACTIVE', FALSE, NOW(), NOW())",
        familyUuid,
        categoryUuid);
  }

  private void insertRecurringExpense(
      org.springframework.jdbc.core.JdbcTemplate jdbc, String categoryUuid, String familyUuid) {
    jdbc.update(
        "INSERT INTO recurring_expenses (uuid, family_uuid, category_uuid, user_uuid, name, amount, day_of_month, status, created_at, updated_at) VALUES (RANDOM_UUID(), ?, ?, 'migration-user', '매달 결제', 1000, 1, 'ACTIVE', NOW(), NOW())",
        familyUuid,
        categoryUuid);
  }

  private String typeOf(org.springframework.jdbc.core.JdbcTemplate jdbc, String uuid) {
    return jdbc.queryForObject("SELECT type FROM categories WHERE uuid = ?", String.class, uuid);
  }

  private java.util.List<String> incomeCategories(
      org.springframework.jdbc.core.JdbcTemplate jdbc, String familyUuid) {
    return jdbc.queryForList(
        "SELECT category_uuid FROM incomes WHERE family_uuid = ? ORDER BY category_uuid",
        String.class,
        familyUuid);
  }
}
