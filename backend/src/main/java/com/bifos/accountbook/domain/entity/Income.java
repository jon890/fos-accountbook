package com.bifos.accountbook.domain.entity;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.IncomeStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "incomes", indexes = {
        @Index(name = "idx_family_uuid_date", columnList = "family_uuid,date"),
        @Index(name = "idx_category_uuid", columnList = "category_uuid")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private CustomUuid uuid;

    @Column(name = "family_uuid", nullable = false, length = 36)
    private CustomUuid familyUuid;

    @Column(name = "category_uuid", nullable = false, length = 36)
    private CustomUuid categoryUuid;

    @Column(name = "user_uuid", nullable = false, length = 36)
    private CustomUuid userUuid;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime date = LocalDateTime.now();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 수입 상태
     * IncomeStatusConverter가 자동으로 코드값으로 변환하여 DB에 저장합니다.
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IncomeStatus status = IncomeStatus.ACTIVE;

    // JPA 연관관계 제거
    // category, family, user는 UUID로만 참조하고 필요 시 Service 계층에서 조회
    // 장점:
    // 1. N+1 문제 원천 차단
    // 2. 카테고리는 CategoryService의 캐시 활용
    // 3. 명확한 책임 분리

    @PrePersist
    public void prePersist() {
        if (uuid == null) {
            uuid = CustomUuid.generate();
        }
        if (date == null) {
            date = LocalDateTime.now();
        }
        // createdAt, updatedAt은 JPA Auditing이 자동 관리
    }

    // ========== 비즈니스 메서드 ==========

    /**
     * 수입 정보 수정
     */
    public void update(CustomUuid categoryUuid, BigDecimal amount, String description, LocalDateTime date) {
        if (categoryUuid != null) {
            this.categoryUuid = categoryUuid;
        }
        if (amount != null) {
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("금액은 0보다 커야 합니다");
            }
            this.amount = amount;
        }
        if (description != null) {
            this.description = description;
        }
        if (date != null) {
            this.date = date;
        }
    }

    /**
     * 수입 삭제 (Soft Delete)
     */
    public void delete() {
        this.status = IncomeStatus.DELETED;
    }
}

