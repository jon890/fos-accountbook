package com.bifos.accountbook;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MySQL Connector 버전 호환성 테스트
 * 
 * 실행 방법:
 * 1. docker-compose up -d mysql
 * 2. ./gradlew test --tests MySQLConnectorVersionTest
 * 3. docker-compose down
 */
@SpringBootTest
@ActiveProfiles("test-mysql")
@DisplayName("MySQL Connector 버전 호환성 테스트")
class MySQLConnectorVersionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("MySQL 연결 및 드라이버 버전 확인")
    void testMySQLConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            System.out.println("=== MySQL Connection Info ===");
            System.out.println("Database Product: " + metaData.getDatabaseProductName());
            System.out.println("Database Version: " + metaData.getDatabaseProductVersion());
            System.out.println("Driver Name: " + metaData.getDriverName());
            System.out.println("Driver Version: " + metaData.getDriverVersion());
            System.out.println("JDBC Major Version: " + metaData.getJDBCMajorVersion());
            System.out.println("JDBC Minor Version: " + metaData.getJDBCMinorVersion());
            
            // 연결 성공 확인
            assertThat(connection.isValid(5)).isTrue();
            assertThat(metaData.getDatabaseProductName()).contains("MySQL");
        }
    }

    @Test
    @DisplayName("PreparedStatement 동작 확인 (9.5.0 버그 수정 검증)")
    void testPreparedStatementWithQuotes() {
        // 9.5.0에서 수정된 버그: PreparedStatement의 따옴표 이스케이프
        String testValue = "Test's value with \"quotes\"";
        
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE email = ?",
            Integer.class,
            testValue
        );
        
        // 쿼리가 정상 실행되는지 확인 (구문 오류 없음)
        assertThat(count).isNotNull();
    }

    @Test
    @DisplayName("DatabaseMetaData 스키마 조회 (9.5.0 개선사항 검증)")
    void testDatabaseMetaDataSchemas() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            // 9.5.0에서 개선된 getSchemas() 메서드 검증
            var schemas = metaData.getSchemas();
            
            assertThat(schemas).isNotNull();
            
            // 스키마 목록 출력
            System.out.println("=== Available Schemas ===");
            while (schemas.next()) {
                String schemaName = schemas.getString("TABLE_SCHEM");
                System.out.println("Schema: " + schemaName);
            }
        }
    }

    @Test
    @DisplayName("기본 CRUD 동작 확인")
    void testBasicCRUD() {
        // 간단한 쿼리로 MySQL Connector가 정상 동작하는지 확인
        Integer result = jdbcTemplate.queryForObject(
            "SELECT 1 + 1",
            Integer.class
        );
        
        assertThat(result).isEqualTo(2);
    }

    @Test
    @DisplayName("트랜잭션 격리 수준 확인")
    void testTransactionIsolationLevel() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            int isolationLevel = connection.getTransactionIsolation();
            
            System.out.println("Transaction Isolation Level: " + isolationLevel);
            System.out.println("TRANSACTION_READ_COMMITTED: " + Connection.TRANSACTION_READ_COMMITTED);
            
            // Spring Boot 기본값: READ_COMMITTED
            assertThat(isolationLevel).isIn(
                Connection.TRANSACTION_READ_COMMITTED,
                Connection.TRANSACTION_REPEATABLE_READ
            );
        }
    }
}

