package com.bifos.accountbook.domain.repository;

import com.bifos.accountbook.domain.entity.Invitation;
import com.bifos.accountbook.domain.value.CustomUuid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 초대 Repository 인터페이스
 * JPA에 의존하지 않는 순수 도메인 레이어 인터페이스
 */
public interface InvitationRepository {

  /**
   * 초대 저장
   */
  Invitation save(Invitation invitation);

  /**
   * 토큰으로 초대 조회
   */
  Optional<Invitation> findByToken(String token);

  /**
   * UUID로 초대 조회
   */
  Optional<Invitation> findByUuid(CustomUuid uuid);

  /**
   * 가족 UUID로 활성 초대 목록 조회
   */
  List<Invitation> findActiveByFamilyUuid(CustomUuid familyUuid, LocalDateTime now);

  /**
   * 토큰으로 유효한 초대 조회
   */
  Optional<Invitation> findValidByToken(String token, LocalDateTime now);

  /**
   * 초대 삭제
   */
  void delete(Invitation invitation);
}
