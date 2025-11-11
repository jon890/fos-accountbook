package com.bifos.accountbook.infra.persistence.repository.impl;

import com.bifos.accountbook.domain.entity.QCategory;
import com.bifos.accountbook.domain.entity.QExpense;
import com.bifos.accountbook.domain.entity.QIncome;
import com.bifos.accountbook.domain.repository.DashboardRepository;
import com.bifos.accountbook.domain.repository.projection.CategoryExpenseProjection;
import com.bifos.accountbook.domain.value.CategoryStatus;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.ExpenseStatus;
import com.bifos.accountbook.domain.value.IncomeStatus;
import com.bifos.accountbook.infra.persistence.repository.projection.CategoryExpenseProjectionImpl;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 대시보드 통계 Repository 구현체
 * - QueryDSL 기반으로 복잡한 통계 쿼리 실행
 * - 타입 안전한 쿼리 작성
 * - 동적 조건 처리
 */
@Repository
@RequiredArgsConstructor
public class DashboardRepositoryImpl implements DashboardRepository {

    private final JPAQueryFactory queryFactory;

    /**
     * 카테고리별 지출 통계 조회 (QueryDSL)
     * - LEFT JOIN으로 카테고리 정보 결합
     * - GROUP BY로 카테고리별 집계
     * - SUM, COUNT 집계 함수 사용
     * - 동적 조건 처리 (BooleanExpression)
     */
    @Override
    public List<CategoryExpenseProjection> getCategoryExpenseStats(
            CustomUuid familyUuid,
            CustomUuid categoryUuid,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        QExpense expense = QExpense.expense;
        QCategory category = QCategory.category;

        // QueryDSL로 카테고리별 통계 조회 (Tuple 사용)
        List<Tuple> tuples = queryFactory
                .select(
                        expense.categoryUuid,
                        category.name,
                        category.icon,
                        category.color,
                        expense.amount.sum(),
                        expense.id.count()
                )
                .from(expense)
                .leftJoin(category)
                .on(expense.categoryUuid.eq(category.uuid)
                        .and(category.status.eq(CategoryStatus.ACTIVE)))
                .where(
                        expense.familyUuid.eq(familyUuid),
                        expense.status.eq(ExpenseStatus.ACTIVE),
                        categoryUuidEq(expense, categoryUuid),
                        dateGoe(expense, startDate),
                        dateLoe(expense, endDate)
                )
                .groupBy(expense.categoryUuid, category.name, category.icon, category.color)
                .orderBy(expense.amount.sum().desc())
                .fetch();

        // Tuple을 Projection 객체로 변환
        return tuples.stream()
                .map(tuple -> {
                    CustomUuid catUuid = tuple.get(expense.categoryUuid);
                    String catName = tuple.get(category.name);
                    String catIcon = tuple.get(category.icon);
                    String catColor = tuple.get(category.color);
                    BigDecimal totalAmt = tuple.get(expense.amount.sum());
                    Long cnt = tuple.get(expense.id.count());

                    return new CategoryExpenseProjectionImpl(
                            catUuid != null ? catUuid.getValue() : "UNKNOWN",
                            catName != null ? catName : "미분류",
                            catIcon != null ? catIcon : "❓",
                            catColor != null ? catColor : "#999999",
                            totalAmt != null ? totalAmt : BigDecimal.ZERO,
                            cnt != null ? cnt : 0L
                    );
                })
                .map(impl -> (CategoryExpenseProjection) impl)
                .toList();
    }

    /**
     * 전체 지출 합계 조회 (QueryDSL)
     * - SUM 집계 함수 사용
     * - 동적 조건 처리
     * - COALESCE로 null 처리
     */
    @Override
    public BigDecimal getTotalExpenseAmount(
            CustomUuid familyUuid,
            CustomUuid categoryUuid,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        QExpense expense = QExpense.expense;

        BigDecimal result = queryFactory
                .select(expense.amount.sum().coalesce(BigDecimal.ZERO))
                .from(expense)
                .where(
                        expense.familyUuid.eq(familyUuid),
                        expense.status.eq(ExpenseStatus.ACTIVE),
                        categoryUuidEq(expense, categoryUuid),
                        dateGoe(expense, startDate),
                        dateLoe(expense, endDate)
                )
                .fetchOne();

        return result != null ? result : BigDecimal.ZERO;
    }

    // ===== 동적 쿼리 조건 메서드 =====

    /**
     * 카테고리 UUID 동적 조건
     * null이면 조건 미적용 (전체 카테고리)
     */
    private BooleanExpression categoryUuidEq(QExpense expense, CustomUuid categoryUuid) {
        return categoryUuid != null ? expense.categoryUuid.eq(categoryUuid) : null;
    }

    /**
     * 시작 날짜 동적 조건 (>= startDate)
     * null이면 조건 미적용
     */
    private BooleanExpression dateGoe(QExpense expense, LocalDateTime startDate) {
        return startDate != null ? expense.date.goe(startDate) : null;
    }

    /**
     * 종료 날짜 동적 조건 (<= endDate)
     * null이면 조건 미적용
     */
    private BooleanExpression dateLoe(QExpense expense, LocalDateTime endDate) {
        return endDate != null ? expense.date.loe(endDate) : null;
    }

    /**
     * 특정 월의 지출 합계 조회 (QueryDSL)
     * - YEAR(date), MONTH(date) 조건 사용
     * - ACTIVE 상태만 집계
     */
    @Override
    public BigDecimal getMonthlyExpenseAmount(
            CustomUuid familyUuid,
            int year,
            int month) {

        QExpense expense = QExpense.expense;

        BigDecimal result = queryFactory
                .select(expense.amount.sum().coalesce(BigDecimal.ZERO))
                .from(expense)
                .where(
                        expense.familyUuid.eq(familyUuid),
                        expense.status.eq(ExpenseStatus.ACTIVE),
                        expense.date.year().eq(year),
                        expense.date.month().eq(month)
                )
                .fetchOne();

        return result != null ? result : BigDecimal.ZERO;
    }

    /**
     * 특정 월의 수입 합계 조회 (QueryDSL)
     * - YEAR(date), MONTH(date) 조건 사용
     * - ACTIVE 상태만 집계
     */
    @Override
    public BigDecimal getMonthlyIncomeAmount(
            CustomUuid familyUuid,
            int year,
            int month) {

        QIncome income = QIncome.income;

        BigDecimal result = queryFactory
                .select(income.amount.sum().coalesce(BigDecimal.ZERO))
                .from(income)
                .where(
                        income.familyUuid.eq(familyUuid),
                        income.status.eq(IncomeStatus.ACTIVE),
                        income.date.year().eq(year),
                        income.date.month().eq(month)
                )
                .fetchOne();

        return result != null ? result : BigDecimal.ZERO;
    }
}

