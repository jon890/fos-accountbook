package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.presentation.dto.ApiSuccessResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping
public class HealthCheckController {

    @GetMapping("/health")
    public ResponseEntity<ApiSuccessResponse<HealthStatus>> healthCheck() {
        HealthStatus status = new HealthStatus(
                "UP",
                "FOS Accountbook Backend API",
                "1.0.0",
                LocalDateTime.now()
        );

        return ResponseEntity.ok(ApiSuccessResponse.of(status));
    }

    @Getter
    @AllArgsConstructor
    public static class HealthStatus {
        private String status;
        private String service;
        private String version;
        private LocalDateTime timestamp;
    }
}

