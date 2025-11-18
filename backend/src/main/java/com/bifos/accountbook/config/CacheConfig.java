package com.bifos.accountbook.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
   * - 최대 크기: 500개 (메모리 절약을 위해 1000 → 500으로 감소)
   * - 통계 활성화: 캐시 히트율 모니터링 (프로덕션에서 비활성화 가능)
   */
  @Bean
  public CacheManager cacheManager() {
    CaffeineCacheManager cacheManager = new CaffeineCacheManager(CATEGORIES_CACHE);

    cacheManager.setCaffeine(Caffeine.newBuilder()
                                     // TTL: 1시간 (카테고리는 자주 변경되지 않으므로 긴 TTL 설정)
                                     .expireAfterWrite(1, TimeUnit.HOURS)

                                     // 최대 크기: 500개 (메모리 절약을 위해 감소)
                                     // 가족 수 * 카테고리 수를 고려하여 충분한 크기 유지
                                     .maximumSize(500)

                                     // 통계 활성화 (캐시 히트율 모니터링)
                                     // 프로덕션에서 메모리 절약이 필요하면 비활성화 가능
                                     .recordStats()

                                     // 제거 리스너: 캐시 항목이 제거될 때 로그 출력
                                     // 프로덕션에서는 로그 레벨이 WARN이므로 실제로는 출력되지 않음
                                     .removalListener((key, value, cause) ->
                                                          log.debug("Cache eviction - key: {}, cause: {}", key, cause))
    );

    log.info("Caffeine CacheManager initialized with cache: {} (max size: 500)", CATEGORIES_CACHE);

    return cacheManager;
  }
}

