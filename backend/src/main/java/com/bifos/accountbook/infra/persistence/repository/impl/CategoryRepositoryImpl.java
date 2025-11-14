package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.config.CacheConfig;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.CategoryJpaRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

/**
 * CategoryRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 * <p>
 * Repository 레벨에서 Entity를 캐싱하여:
 * - Service 레이어에서 유연하게 DTO 변환 가능
 * - 다양한 응답 형태로 재사용 가능
 * - 캐시 전략을 데이터 접근 레이어에 집중
 */
@Repository
@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryRepository {

  private final CategoryJpaRepository jpaRepository;

  @Override
  public Category save(Category category) {
    return jpaRepository.save(category);
  }

  @Override
  public Optional<Category> findByUuid(CustomUuid uuid) {
    return jpaRepository.findByUuid(uuid);
  }

  @Override
  public Optional<Category> findActiveByUuid(CustomUuid uuid) {
    return jpaRepository.findActiveByUuid(uuid);
  }

  /**
   * 가족의 모든 활성 카테고리 조회 (캐싱)
   * <p>
   * 캐싱 전략:
   * - 캐시 이름: categories
   * - 캐시 키: familyUuid.value
   * - TTL: 1시간 (CacheConfig에서 설정)
   * <p>
   * Entity를 캐싱하여 Service 레이어에서 다양한 형태로 변환 가능
   */
  @Override
  @Cacheable(value = CacheConfig.CATEGORIES_CACHE, key = "#familyUuid.value")
  public List<Category> findAllByFamilyUuid(CustomUuid familyUuid) {
    return jpaRepository.findAllByFamilyUuid(familyUuid);
  }

  @Override
  public Optional<Category> findByFamilyUuidAndName(CustomUuid familyUuid, String name) {
    return jpaRepository.findByFamilyUuidAndName(familyUuid, name);
  }

  @Override
  public int countByFamilyUuid(CustomUuid familyUuid) {
    return jpaRepository.countByFamilyUuid(familyUuid);
  }
}

