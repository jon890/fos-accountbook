package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.CategoryJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * CategoryRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
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

    @Override
    public List<Category> findAllByFamilyUuid(CustomUuid familyUuid) {
        return jpaRepository.findAllByFamilyUuid(familyUuid);
    }

    @Override
    public Optional<Category> findByFamilyUuidAndName(CustomUuid familyUuid, String name) {
        return jpaRepository.findByFamilyUuidAndName(familyUuid, name);
    }
}

