package com.bifos.accountbook.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 캐시 설정
 * 
 * Caffeine을 사용한 애플리케이션 레벨 캐싱 설정
 * 자주 조회되지만 변경이 적은 데이터(카테고리)에 대한 성능 최적화
 */
@Slf4j
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 캐시 이름 상수
     */
    public static final String CATEGORIES_CACHE = "categories";

    /**
     * Caffeine 기반 CacheManager 설정
     * 
     * 캐시 전략:
     * - TTL: 1시간 (expireAfterWrite)
     * - 최대 크기: 1000개 (familyUuid별 캐시)
     * - 통계 활성화: 캐시 히트율 모니터링
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(CATEGORIES_CACHE);
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
                // TTL: 1시간 (카테고리는 자주 변경되지 않으므로 긴 TTL 설정)
                .expireAfterWrite(1, TimeUnit.HOURS)
                
                // 최대 크기: 1000개 (가족 수 * 카테고리 수를 고려)
                .maximumSize(1000)
                
                // 통계 활성화 (캐시 히트율 모니터링)
                .recordStats()
                
                // 제거 리스너: 캐시 항목이 제거될 때 로그 출력
                .removalListener((key, value, cause) -> 
                    log.debug("Cache eviction - key: {}, cause: {}", key, cause))
        );

        log.info("Caffeine CacheManager initialized with cache: {}", CATEGORIES_CACHE);
        
        return cacheManager;
    }
}

