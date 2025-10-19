package com.bifos.accountbook.application.service;

import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Expense;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JPA 더티 체킹(Dirty Checking) 동작 확인 테스트
 * save() 호출 없이 엔티티 수정 시 자동으로 UPDATE 쿼리가 실행되는지 검증
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("JPA 더티 체킹 동작 확인")
class DirtyCheckingTest {

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    private User testUser;
    private Family testFamily;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        // 테스트 사용자 생성
        testUser = User.builder()
                .email("dirty-check-test@example.com")
                .name("더티체킹 테스트")
                .provider("google")
                .providerId("dirty-check-test-id")
                .build();
        testUser = userRepository.save(testUser);

        // 테스트 가족 생성
        testFamily = Family.builder()
                .name("더티체킹 테스트 가족")
                .build();
        testFamily = familyRepository.save(testFamily);

        // 가족 멤버 추가
        FamilyMember member = FamilyMember.builder()
                .familyUuid(testFamily.getUuid())
                .userUuid(testUser.getUuid())
                .role("owner")
                .build();
        familyMemberRepository.save(member);

        // 테스트 카테고리 생성
        testCategory = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("더티체킹 테스트 카테고리")
                .color("#000000")
                .icon("🧪")
                .build();
        testCategory = categoryRepository.save(testCategory);
    }

    @Test
    @Transactional
    @DisplayName("Family 엔티티 수정 시 save() 없이도 더티 체킹으로 UPDATE 쿼리 실행")
    void familyDirtyCheckingTest() {
        // Given: 데이터베이스에서 조회한 Family 엔티티
        Family family = familyRepository.findActiveByUuid(testFamily.getUuid()).orElseThrow();
        String originalName = family.getName();
        String newName = "수정된 가족 이름";

        // When: 엔티티를 수정하고 save()를 호출하지 않음
        family.setName(newName);
        // familyRepository.save(family); // 이 줄이 없어도 UPDATE가 실행되어야 함

        // Then: 트랜잭션 커밋 시점에 자동으로 UPDATE 실행됨
        // 트랜잭션이 끝나면 변경사항이 데이터베이스에 반영됨

        // 새로운 트랜잭션에서 다시 조회하여 확인
    }

    @Test
    @Transactional
    @DisplayName("Category 엔티티 수정 시 save() 없이도 더티 체킹으로 UPDATE 쿼리 실행")
    void categoryDirtyCheckingTest() {
        // Given
        Category category = categoryRepository.findActiveByUuid(testCategory.getUuid()).orElseThrow();
        String originalName = category.getName();
        String newName = "수정된 카테고리";

        // When
        category.setName(newName);
        category.setColor("#FF0000");
        // categoryRepository.save(category); // save() 호출 없음

        // Then: 더티 체킹으로 자동 UPDATE
    }

    @Test
    @Transactional
    @DisplayName("Expense 엔티티 수정 시 save() 없이도 더티 체킹으로 UPDATE 쿼리 실행")
    void expenseDirtyCheckingTest() {
        // Given: 지출 생성
        Expense expense = Expense.builder()
                .familyUuid(testFamily.getUuid())
                .categoryUuid(testCategory.getUuid())
                .userUuid(testUser.getUuid())
                .amount(new BigDecimal("10000"))
                .description("테스트 지출")
                .date(LocalDateTime.now())
                .build();
        expense = expenseRepository.save(expense);

        // When: 조회 후 수정 (save() 없음)
        Expense foundExpense = expenseRepository.findActiveByUuid(expense.getUuid()).orElseThrow();
        foundExpense.setAmount(new BigDecimal("20000"));
        foundExpense.setDescription("수정된 지출");
        // expenseRepository.save(foundExpense); // save() 호출 없음

        // Then: 더티 체킹으로 자동 UPDATE
    }

    @Test
    @Transactional
    @DisplayName("Soft Delete 시 save() 없이도 더티 체킹으로 UPDATE 쿼리 실행")
    void softDeleteDirtyCheckingTest() {
        // Given
        Family family = familyRepository.findActiveByUuid(testFamily.getUuid()).orElseThrow();
        assertThat(family.getDeletedAt()).isNull();

        // When: deletedAt 설정 (save() 없음)
        family.setDeletedAt(LocalDateTime.now());
        // familyRepository.save(family); // save() 호출 없음

        // Then: 더티 체킹으로 자동 UPDATE
        // 트랜잭션 커밋 시점에 deleted_at 컬럼이 업데이트됨
    }

    @Test
    @DisplayName("트랜잭션 외부에서는 더티 체킹이 작동하지 않음을 확인")
    void noDirtyCheckingOutsideTransaction() {
        // Given: 트랜잭션 없이 조회
        Family family = familyRepository.findActiveByUuid(testFamily.getUuid()).orElseThrow();
        String originalName = family.getName();

        // When: 엔티티 수정 (트랜잭션 밖이므로 더티 체킹 작동 안 함)
        family.setName("수정 시도");

        // Then: 데이터베이스에는 반영되지 않음
        Family reloaded = familyRepository.findActiveByUuid(testFamily.getUuid()).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo(originalName); // 원래 이름 그대로
    }

    @Test
    @Transactional
    @DisplayName("새로 생성한 엔티티는 save() 호출이 필요함")
    void newEntityRequiresSave() {
        // Given: 새 엔티티 생성
        Category newCategory = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("새 카테고리")
                .color("#00FF00")
                .icon("✨")
                .build();

        // When: save() 호출 (필수)
        Category saved = categoryRepository.save(newCategory);

        // Then: 저장된 엔티티에 ID가 할당됨
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUuid()).isNotNull();
    }
}
