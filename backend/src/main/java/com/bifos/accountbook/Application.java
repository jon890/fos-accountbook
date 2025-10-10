package com.bifos.accountbook;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Slf4j
@SpringBootApplication
@EnableJpaAuditing
@RequiredArgsConstructor
public class Application {

    private final Environment env;

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @PostConstruct
    public void logDatabaseConfig() {
        log.info("=================================================");
        log.info("DATABASE CONFIGURATION (Railway Debug)");
        log.info("=================================================");
        log.info("Active Profile: {}", String.join(", ", env.getActiveProfiles()));
        log.info("MYSQLHOST: {}", env.getProperty("MYSQLHOST"));
        log.info("MYSQLPORT: {}", env.getProperty("MYSQLPORT"));
        log.info("MYSQLDATABASE: {}", env.getProperty("MYSQLDATABASE"));
        log.info("MYSQLUSER: {}", env.getProperty("MYSQLUSER"));
        log.info("MYSQLPASSWORD: {}", env.getProperty("MYSQLPASSWORD") != null ? "***SET***" : "null");
        log.info("Computed Datasource URL: {}", env.getProperty("spring.datasource.url"));
        log.info("Datasource Username: {}", env.getProperty("spring.datasource.username"));
        log.info("=================================================");
    }
}

