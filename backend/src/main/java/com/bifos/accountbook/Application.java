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
        log.info("--- JWT & Auth ---");
        log.info("AUTH_SECRET: {}", env.getProperty("AUTH_SECRET"));
        log.info("jwt.secret: {}", env.getProperty("jwt.secret"));
        log.info("nextauth.secret: {}", env.getProperty("nextauth.secret") != null ? "***SET***" : "❌ NOT SET");

        // CORS Configuration
        log.info("--- CORS ---");
        log.info("CORS Allowed Origins: {}", env.getProperty("cors.allowed-origins"));
    }
}
