package com.bifos.accountbook;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Slf4j
@SpringBootApplication
@EnableJpaAuditing
@ConfigurationPropertiesScan
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
        log.info("SPRING_DATASOURCE_URL: {}", env.getProperty("SPRING_DATASOURCE_URL"));
        log.info("SPRING_DATASOURCE_USERNAME: {}", env.getProperty("SPRING_DATASOURCE_USERNAME"));
        log.info("SPRING_DATASOURCE_PASSWORD: {}", env.getProperty("SPRING_DATASOURCE_PASSWORD") != null ? "***SET***" : "null");
        log.info("Resolved Datasource URL: {}", env.getProperty("spring.datasource.url"));
        log.info("Resolved Datasource Username: {}", env.getProperty("spring.datasource.username"));
        log.info("=================================================");
    }
}

