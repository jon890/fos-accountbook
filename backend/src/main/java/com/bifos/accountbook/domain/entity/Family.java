package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "families")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Family {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private CustomUuid uuid;

    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 월 예산
     * 0은 예산 미설정 상태를 의미합니다.
     */
    @Column(name = "monthly_budget", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal monthlyBudget = BigDecimal.ZERO;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 가족 상태
     * FamilyStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FamilyStatus status = FamilyStatus.ACTIVE;

    @OneToMany(mappedBy = "family", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FamilyMember> members = new ArrayList<>();

    // JPA 연관관계 제거 (categories, expenses)
    // categories, expenses는 UUID로만 참조하고 필요 시 Service 계층에서 조회
    // 장점:
    // 1. N+1 문제 원천 차단
    // 2. 명확한 책임 분리
    // 3. 캐시 활용 최적화

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = CustomUuid.generate();
        }
        // createdAt, updatedAt은 JPA Auditing이 자동 관리
    }

    // ========== 비즈니스 메서드 ==========

    /**
     * 가족 이름 변경
     */
    public void updateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("가족 이름은 필수입니다");
        }
        this.name = name;
    }

    /**
     * 월 예산 변경
     */
    public void updateMonthlyBudget(BigDecimal monthlyBudget) {
        if (monthlyBudget == null || monthlyBudget.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("월 예산은 0 이상이어야 합니다");
        }
        this.monthlyBudget = monthlyBudget;
    }

    /**
     * 가족 삭제 (Soft Delete)
     */
    public void delete() {
        this.status = FamilyStatus.DELETED;
    }
}
