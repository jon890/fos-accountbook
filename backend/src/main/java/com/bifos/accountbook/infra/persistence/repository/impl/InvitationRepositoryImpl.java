package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.Invitation;
import com.bifos.accountbook.domain.repository.InvitationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.infra.persistence.repository.jpa.InvitationJpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * InvitationRepository 구현체
 * JpaRepository를 내부적으로 사용하여 도메인 인터페이스 구현
 */
@Repository
@RequiredArgsConstructor
public class InvitationRepositoryImpl implements InvitationRepository {

  private final InvitationJpaRepository jpaRepository;

  @Override
  public Invitation save(Invitation invitation) {
    return jpaRepository.save(invitation);
  }

  @Override
  public Optional<Invitation> findByToken(String token) {
    return jpaRepository.findByToken(token);
  }

  @Override
  public Optional<Invitation> findByUuid(CustomUuid uuid) {
    return jpaRepository.findByUuid(uuid);
  }

  @Override
  public List<Invitation> findActiveByFamilyUuid(CustomUuid familyUuid, LocalDateTime now) {
    return jpaRepository.findActiveByFamilyUuid(familyUuid, now);
  }

  @Override
  public Optional<Invitation> findValidByToken(String token, LocalDateTime now) {
    return jpaRepository.findValidByToken(token, now);
  }

  @Override
  public void delete(Invitation invitation) {
    jpaRepository.delete(invitation);
  }
}
