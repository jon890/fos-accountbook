package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.income.CreateIncomeRequest;
import com.bifos.accountbook.application.dto.income.IncomeResponse;
import com.bifos.accountbook.application.dto.income.UpdateIncomeRequest;
import com.bifos.accountbook.common.DatabaseCleanupExtension;
import com.bifos.accountbook.common.TestUserHolder;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith({DatabaseCleanupExtension.class, TestUserHolder.class})
@DisplayName("IncomeController 통합 테스트")
class IncomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private UserRepository userRepository;

    private TestUserHolder testUserHolder;
    private Family testFamily;
    private Category testCategory;

    @BeforeEach
    void setUp(TestUserHolder testUserHolder) {
        // Extension을 파라미터로 주입받음
        this.testUserHolder = testUserHolder;
        
        // 테스트 사용자는 TestUserHolder가 자동으로 생성
        User testUser = testUserHolder.getUser();

        // 테스트 가족 생성
        testFamily = Family.builder()
                .name("Test Family")
                .build();
        testFamily = familyRepository.save(testFamily);

        // 가족 구성원 추가
        FamilyMember familyMember = FamilyMember.builder()
                .familyUuid(testFamily.getUuid())
                .userUuid(testUser.getUuid())
                .role("owner")
                .build();
        familyMemberRepository.save(familyMember);

        // 테스트 카테고리 생성
        testCategory = Category.builder()
                .familyUuid(testFamily.getUuid())
                .name("급여")
                .color("#00FF00")
                .icon("💰")
                .build();
        testCategory = categoryRepository.save(testCategory);
    }

    @Test
    @DisplayName("수입 생성 - 성공")
    void createIncome_Success() throws Exception {
        // Given
        CreateIncomeRequest request = CreateIncomeRequest.builder()
                .categoryUuid(testCategory.getUuid().getValue())
                .amount(BigDecimal.valueOf(3000000))
                .description("월급")
                .date(LocalDateTime.now())
                .build();

        // When & Then
        mockMvc.perform(post("/api/v1/families/{familyUuid}/incomes", testFamily.getUuid().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("수입이 등록되었습니다"))
                .andExpect(jsonPath("$.data.amount").value(3000000))
                .andExpect(jsonPath("$.data.description").value("월급"))
                .andExpect(jsonPath("$.data.uuid").exists());

        // 데이터베이스 검증
        User testUser = testUserHolder.getUser();
        assertThat(incomeRepository.findAllByFamilyUuid(testFamily.getUuid(),
                org.springframework.data.domain.PageRequest.of(0, 10)).getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("수입 목록 조회 - 성공")
    void getFamilyIncomes_Success() throws Exception {
        // Given
        User testUser = testUserHolder.getUser();
        
        Income income1 = Income.builder()
                .familyUuid(testFamily.getUuid())
                .categoryUuid(testCategory.getUuid())
                .userUuid(testUser.getUuid())
                .amount(BigDecimal.valueOf(3000000))
                .description("월급")
                .date(LocalDateTime.now())
                .build();
        incomeRepository.save(income1);

        Income income2 = Income.builder()
                .familyUuid(testFamily.getUuid())
                .categoryUuid(testCategory.getUuid())
                .userUuid(testUser.getUuid())
                .amount(BigDecimal.valueOf(500000))
                .description("보너스")
                .date(LocalDateTime.now().minusDays(1))
                .build();
        incomeRepository.save(income2);

        // When & Then
        mockMvc.perform(get("/api/v1/families/{familyUuid}/incomes", testFamily.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[0].description").value("월급"))
                .andExpect(jsonPath("$.data.items[1].description").value("보너스"));
    }

    @Test
    @DisplayName("수입 목록 조회 - 페이징")
    void getFamilyIncomes_WithPaging() throws Exception {
        // Given
        User testUser = testUserHolder.getUser();
        
        for (int i = 0; i < 25; i++) {
            Income income = Income.builder()
                    .familyUuid(testFamily.getUuid())
                    .categoryUuid(testCategory.getUuid())
                    .userUuid(testUser.getUuid())
                    .amount(BigDecimal.valueOf(100000 * (i + 1)))
                    .description("수입 " + (i + 1))
                    .date(LocalDateTime.now().minusDays(i))
                    .build();
            incomeRepository.save(income);
        }

        // When & Then
        mockMvc.perform(get("/api/v1/families/{familyUuid}/incomes", testFamily.getUuid().getValue())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(10)))
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.totalPages").value(3))
                .andExpect(jsonPath("$.data.currentPage").value(0));
    }

    @Test
    @DisplayName("수입 상세 조회 - 성공")
    void getIncome_Success() throws Exception {
        // Given
        User testUser = testUserHolder.getUser();
        
        Income income = Income.builder()
                .familyUuid(testFamily.getUuid())
                .categoryUuid(testCategory.getUuid())
                .userUuid(testUser.getUuid())
                .amount(BigDecimal.valueOf(3000000))
                .description("월급")
                .date(LocalDateTime.now())
                .build();
        income = incomeRepository.save(income);

        // When & Then
        mockMvc.perform(get("/api/v1/families/{familyUuid}/incomes/{incomeUuid}",
                        testFamily.getUuid().getValue(),
                        income.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.uuid").value(income.getUuid().getValue()))
                .andExpect(jsonPath("$.data.amount").value(3000000))
                .andExpect(jsonPath("$.data.description").value("월급"));
    }

    @Test
    @DisplayName("수입 수정 - 성공")
    void updateIncome_Success() throws Exception {
        // Given
        User testUser = testUserHolder.getUser();
        
        Income income = Income.builder()
                .familyUuid(testFamily.getUuid())
                .categoryUuid(testCategory.getUuid())
                .userUuid(testUser.getUuid())
                .amount(BigDecimal.valueOf(3000000))
                .description("월급")
                .date(LocalDateTime.now())
                .build();
        income = incomeRepository.save(income);

        UpdateIncomeRequest request = UpdateIncomeRequest.builder()
                .amount(BigDecimal.valueOf(3500000))
                .description("월급 (인상)")
                .build();

        // When & Then
        mockMvc.perform(put("/api/v1/families/{familyUuid}/incomes/{incomeUuid}",
                        testFamily.getUuid().getValue(),
                        income.getUuid().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("수입이 수정되었습니다"))
                .andExpect(jsonPath("$.data.amount").value(3500000))
                .andExpect(jsonPath("$.data.description").value("월급 (인상)"));

        // 데이터베이스 검증
        Income updatedIncome = incomeRepository.findByUuid(income.getUuid()).orElseThrow();
        assertThat(updatedIncome.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(3500000));
        assertThat(updatedIncome.getDescription()).isEqualTo("월급 (인상)");
    }

    @Test
    @DisplayName("수입 삭제 - 성공")
    void deleteIncome_Success() throws Exception {
        // Given
        User testUser = testUserHolder.getUser();
        
        Income income = Income.builder()
                .familyUuid(testFamily.getUuid())
                .categoryUuid(testCategory.getUuid())
                .userUuid(testUser.getUuid())
                .amount(BigDecimal.valueOf(3000000))
                .description("월급")
                .date(LocalDateTime.now())
                .build();
        income = incomeRepository.save(income);

        // When & Then
        mockMvc.perform(delete("/api/v1/families/{familyUuid}/incomes/{incomeUuid}",
                        testFamily.getUuid().getValue(),
                        income.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("수입이 삭제되었습니다"));

        // 데이터베이스 검증 - Soft Delete이므로 조회되지 않아야 함
        assertThat(incomeRepository.findActiveByUuid(income.getUuid())).isEmpty();
    }

    @Test
    @DisplayName("권한 없는 사용자 - 수입 조회 실패")
    void getFamilyIncomes_UnauthorizedUser() throws Exception {
        // Given
        User unauthorizedUser = User.builder()
                .provider("google")
                .providerId("unauthorized-user")
                .email("unauthorized@example.com")
                .name("Unauthorized User")
                .build();
        unauthorizedUser = userRepository.save(unauthorizedUser);

        // SecurityContext에 권한 없는 사용자 설정
        UsernamePasswordAuthenticationToken unauthorizedAuth = 
            new UsernamePasswordAuthenticationToken(unauthorizedUser.getUuid().getValue(), null, null);
        SecurityContextHolder.getContext().setAuthentication(unauthorizedAuth);

        // When & Then
        mockMvc.perform(get("/api/v1/families/{familyUuid}/incomes", testFamily.getUuid().getValue()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("F003")); // NOT_FAMILY_MEMBER
    }
}

