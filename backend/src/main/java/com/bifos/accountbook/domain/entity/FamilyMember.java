package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "family_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"family_uuid", "user_uuid"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamilyMember {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(name = "family_uuid", nullable = false, length = 36)
  private CustomUuid familyUuid;

  @Column(name = "user_uuid", nullable = false, length = 36)
  private CustomUuid userUuid;

  @Column(nullable = false, length = 20)
  @Builder.Default
  private String role = "member";

  @Column(name = "joined_at", nullable = false)
  @Builder.Default
  private LocalDateTime joinedAt = LocalDateTime.now();

  /**
   * 가족 구성원 상태
   * FamilyMemberStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
   */
  @Column(nullable = false, length = 20)
  @Builder.Default
  private FamilyMemberStatus status = FamilyMemberStatus.ACTIVE;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "family_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
  private Family family;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
  private User user;

  @PrePersist
  public void prePersist() {
    if (uuid == null) {
      uuid = CustomUuid.generate();
    }
  }
}
