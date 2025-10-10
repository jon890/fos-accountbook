package com.bifos.accountbook;

import com.bifos.accountbook.application.service.*;
import com.bifos.accountbook.domain.repository.*;
import com.bifos.accountbook.infra.security.JwtTokenProvider;
import com.bifos.accountbook.presentation.controller.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Spring Bean 로딩 테스트
 * 
 * 모든 주요 Bean들이 정상적으로 로드되고 의존성 주입이 올바르게 되는지 확인합니다.
 */
@SpringBootTest
@ActiveProfiles("test")
class BeanLoadingTest {

    // Controllers
    @Autowired(required = false)
    private AuthController authController;

    @Autowired(required = false)
    private FamilyController familyController;

    @Autowired(required = false)
    private CategoryController categoryController;

    @Autowired(required = false)
    private ExpenseController expenseController;

    @Autowired(required = false)
    private InvitationController invitationController;

    // Services
    @Autowired(required = false)
    private AuthService authService;

    @Autowired(required = false)
    private FamilyService familyService;

    @Autowired(required = false)
    private CategoryService categoryService;

    @Autowired(required = false)
    private ExpenseService expenseService;

    @Autowired(required = false)
    private InvitationService invitationService;

    // Repositories
    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private FamilyRepository familyRepository;

    @Autowired(required = false)
    private FamilyMemberRepository familyMemberRepository;

    @Autowired(required = false)
    private CategoryRepository categoryRepository;

    @Autowired(required = false)
    private ExpenseRepository expenseRepository;

    @Autowired(required = false)
    private InvitationRepository invitationRepository;

    // Security
    @Autowired(required = false)
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("모든 Controller Bean이 로드되어야 한다")
    void testControllerBeansLoaded() {
        assertThat(authController).isNotNull();
        assertThat(familyController).isNotNull();
        assertThat(categoryController).isNotNull();
        assertThat(expenseController).isNotNull();
        assertThat(invitationController).isNotNull();
    }

    @Test
    @DisplayName("모든 Service Bean이 로드되어야 한다")
    void testServiceBeansLoaded() {
        assertThat(authService).isNotNull();
        assertThat(familyService).isNotNull();
        assertThat(categoryService).isNotNull();
        assertThat(expenseService).isNotNull();
        assertThat(invitationService).isNotNull();
    }

    @Test
    @DisplayName("모든 Repository Bean이 로드되어야 한다")
    void testRepositoryBeansLoaded() {
        assertThat(userRepository).isNotNull();
        assertThat(familyRepository).isNotNull();
        assertThat(familyMemberRepository).isNotNull();
        assertThat(categoryRepository).isNotNull();
        assertThat(expenseRepository).isNotNull();
        assertThat(invitationRepository).isNotNull();
    }

    @Test
    @DisplayName("Security 관련 Bean이 로드되어야 한다")
    void testSecurityBeansLoaded() {
        assertThat(jwtTokenProvider).isNotNull();
    }
}

