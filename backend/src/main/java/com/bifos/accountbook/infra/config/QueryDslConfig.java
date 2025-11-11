package com.bifos.accountbook.infra.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * QueryDSL 설정
 * JPAQueryFactory를 Bean으로 등록하여 QueryDSL 쿼리 작성 지원
 */
@Configuration
@RequiredArgsConstructor
public class QueryDslConfig {

    @PersistenceContext
    private final EntityManager entityManager;

    /**
     * JPAQueryFactory 빈 등록
     * - 타입 안전한 쿼리 작성 지원
     * - 컴파일 타임 쿼리 검증
     * - IDE 자동완성 지원
     */
    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }
}

