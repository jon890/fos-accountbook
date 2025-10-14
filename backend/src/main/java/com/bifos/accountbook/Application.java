package com.bifos.accountbook;

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
}
