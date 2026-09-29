package com.bifos.accountbook.user.domain.repository;

import com.bifos.accountbook.user.domain.entity.UserProfile;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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

