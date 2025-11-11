package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "invitations", indexes = {
        @Index(name = "idx_token", columnList = "token"),
        @Index(name = "idx_family_uuid", columnList = "family_uuid")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private CustomUuid uuid;

    @Column(name = "family_uuid", nullable = false, length = 36)
    private CustomUuid familyUuid;

    @Column(name = "inviter_user_uuid", nullable = false, length = 36)
    private CustomUuid inviterUserUuid;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inviter_user_uuid", referencedColumnName = "uuid", insertable = false, updatable = false)
    private User inviter;

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = CustomUuid.generate();
        }
        // createdAt은 JPA Auditing이 자동 관리
    }

    // ========== 비즈니스 메서드 ==========

    /**
     * 초대 수락
     */
    public void accept() {
        if (!"PENDING".equals(this.status)) {
            throw new IllegalStateException("수락할 수 없는 초대 상태입니다");
        }
        if (LocalDateTime.now().isAfter(this.expiresAt)) {
            throw new IllegalStateException("만료된 초대입니다");
        }
        this.status = "ACCEPTED";
    }

    /**
     * 초대 만료 여부 확인
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    /**
     * 초대 수락 가능 여부 확인
     */
    public boolean canAccept() {
        return "PENDING".equals(this.status) && !isExpired();
    }
}
