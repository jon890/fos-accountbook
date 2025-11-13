package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.UserStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private CustomUuid uuid;

  @Column(nullable = false, length = 50)
  private String provider; // OAuth provider (google, kakao, etc.)

  @Column(name = "provider_id", nullable = false, length = 255)
  private String providerId; // OAuth provider account ID

  @Column(length = 255)
  private String name;

  @Column(nullable = false, length = 255)
  private String email;

  // Auth.js Prisma Adapter가 camelCase 컬럼명을 사용하므로 통일
  @Column(name = "emailVerified")
  private LocalDateTime emailVerified;

  @Column(length = 500)
  private String image;

  @CreatedDate
  @Column(name = "createdAt", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updatedAt", nullable = false)
  private LocalDateTime updatedAt;

  /**
   * 사용자 상태
   * ACTIVE: 활성, DELETED: 삭제됨
   * UserStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
   */
  @Column(nullable = false, length = 20)
  @Builder.Default
  private UserStatus status = UserStatus.ACTIVE;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<FamilyMember> familyMembers = new ArrayList<>();

  @PrePersist
  public void prePersist() {
    if (uuid == null) {
      uuid = CustomUuid.generate();
    }
    // createdAt, updatedAt은 JPA Auditing이 자동 관리
  }
}
