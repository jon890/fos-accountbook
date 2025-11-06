package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.UserProfile;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 사용자 프로필 Repository
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    /**
     * 사용자 UUID로 프로필 조회
     */
    Optional<UserProfile> findByUserUuid(CustomUuid userUuid);

    /**
     * 사용자 UUID로 프로필 존재 여부 확인
     */
    boolean existsByUserUuid(CustomUuid userUuid);
}

