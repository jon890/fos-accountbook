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

    @OneToMany(mappedBy = "family", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Income> incomes = new ArrayList<>();

    @OneToMany(mappedBy = "family", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Expense> expenses = new ArrayList<>();

    /**
     * JPA 연관관계 정책:
     * - Income/Expense: @OneToMany 사용 (ORM의 장점 활용, 편의 메서드 제공)
     * - Category: 연관관계 없음 (CategoryService 캐시 활용)
     * 
     * Category만 캐시를 위해 연관관계를 끊었습니다.
     * Income/Expense는 Family와 강한 관계이므로 JPA 연관관계를 사용합니다.
     */

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

    // ========== 연관관계 편의 메서드 ==========

    /**
     * 수입 추가 (연관관계 편의 메서드)
     * 테스트에서 편리하게 데이터를 생성할 수 있습니다.
     * 
     * @param amount 수입 금액
     * @param categoryUuid 카테고리 UUID
     * @param userUuid 사용자 UUID
     * @return 생성된 Income 엔티티
     */
    public Income addIncome(BigDecimal amount, CustomUuid categoryUuid, CustomUuid userUuid) {
        return addIncome(amount, categoryUuid, userUuid, null, LocalDateTime.now());
    }

    /**
     * 수입 추가 (연관관계 편의 메서드 - 전체 파라미터)
     * 
     * @param amount 수입 금액
     * @param categoryUuid 카테고리 UUID
     * @param userUuid 사용자 UUID
     * @param description 설명
     * @param date 수입 날짜
     * @return 생성된 Income 엔티티
     */
    public Income addIncome(BigDecimal amount, CustomUuid categoryUuid, CustomUuid userUuid, 
                           String description, LocalDateTime date) {
        Income income = Income.builder()
                .family(this)
                .categoryUuid(categoryUuid)
                .userUuid(userUuid)
                .amount(amount)
                .description(description)
                .date(date)
                .build();
        this.incomes.add(income);
        return income;
    }

    /**
     * 지출 추가 (연관관계 편의 메서드)
     * 테스트에서 편리하게 데이터를 생성할 수 있습니다.
     * 
     * @param amount 지출 금액
     * @param categoryUuid 카테고리 UUID
     * @param userUuid 사용자 UUID
     * @return 생성된 Expense 엔티티
     */
    public Expense addExpense(BigDecimal amount, CustomUuid categoryUuid, CustomUuid userUuid) {
        return addExpense(amount, categoryUuid, userUuid, null, LocalDateTime.now());
    }

    /**
     * 지출 추가 (연관관계 편의 메서드 - 전체 파라미터)
     * 
     * @param amount 지출 금액
     * @param categoryUuid 카테고리 UUID
     * @param userUuid 사용자 UUID
     * @param description 설명
     * @param date 지출 날짜
     * @return 생성된 Expense 엔티티
     */
    public Expense addExpense(BigDecimal amount, CustomUuid categoryUuid, CustomUuid userUuid,
                             String description, LocalDateTime date) {
        Expense expense = Expense.builder()
                .family(this)
                .categoryUuid(categoryUuid)
                .userUuid(userUuid)
                .amount(amount)
                .description(description)
                .date(date)
                .build();
        this.expenses.add(expense);
        return expense;
    }
}
