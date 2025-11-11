package com.bifos.accountbook.application.service;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyStatus;
import com.bifos.accountbook.domain.value.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * BudgetAlertService 단위 테스트
 * 비즈니스 로직만 검증합니다 (비동기 처리 없음).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("예산 알림 서비스 단위 테스트")
class BudgetAlertServiceUnitTest {

    @Mock
    private FamilyRepository familyRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private BudgetAlertService budgetAlertService;

    private CustomUuid familyUuid;
    private Family family;
    private LocalDateTime now;

    @BeforeEach
    void setUp() {
        familyUuid = CustomUuid.generate();
        now = LocalDateTime.now();

        family = Family.builder()
                .uuid(familyUuid)
                .name("테스트 가족")
                .monthlyBudget(new BigDecimal("1000000.00"))
                .status(FamilyStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("예산의 55%를 사용하면 50% 초과 알림이 생성된다")
    void shouldCreateNotification_When50PercentExceeded() {
        // Given
        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.of(family));
        when(expenseRepository.sumAmountByFamilyUuidAndDateBetween(
                eq(familyUuid), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("550000.00"));
        when(notificationRepository.existsByFamilyUuidAndTypeAndYearMonth(
                eq(familyUuid), eq(NotificationType.BUDGET_50_EXCEEDED), any(String.class)))
                .thenReturn(false);

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.BUDGET_50_EXCEEDED);
        assertThat(saved.getFamilyUuid()).isEqualTo(familyUuid);
        assertThat(saved.getIsRead()).isFalse();
        assertThat(saved.getTitle()).contains("50%");
    }

    @Test
    @DisplayName("예산의 85%를 사용하면 80% 초과 알림이 생성된다")
    void shouldCreateNotification_When80PercentExceeded() {
        // Given
        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.of(family));
        when(expenseRepository.sumAmountByFamilyUuidAndDateBetween(
                eq(familyUuid), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("850000.00"));
        when(notificationRepository.existsByFamilyUuidAndTypeAndYearMonth(
                eq(familyUuid), eq(NotificationType.BUDGET_80_EXCEEDED), any(String.class)))
                .thenReturn(false);

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.BUDGET_80_EXCEEDED);
        assertThat(saved.getTitle()).contains("80%");
    }

    @Test
    @DisplayName("예산의 105%를 사용하면 100% 초과 알림이 생성된다")
    void shouldCreateNotification_When100PercentExceeded() {
        // Given
        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.of(family));
        when(expenseRepository.sumAmountByFamilyUuidAndDateBetween(
                eq(familyUuid), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("1050000.00"));
        when(notificationRepository.existsByFamilyUuidAndTypeAndYearMonth(
                eq(familyUuid), eq(NotificationType.BUDGET_100_EXCEEDED), any(String.class)))
                .thenReturn(false);

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.BUDGET_100_EXCEEDED);
        assertThat(saved.getTitle()).contains("100%");
    }

    @Test
    @DisplayName("예산의 40%만 사용하면 알림이 생성되지 않는다")
    void shouldNotCreateNotification_WhenUnder50Percent() {
        // Given
        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.of(family));
        when(expenseRepository.sumAmountByFamilyUuidAndDateBetween(
                eq(familyUuid), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("400000.00"));

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("같은 월에 동일한 타입의 알림이 이미 있으면 생성하지 않는다")
    void shouldNotCreateDuplicateNotification() {
        // Given
        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.of(family));
        when(expenseRepository.sumAmountByFamilyUuidAndDateBetween(
                eq(familyUuid), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new BigDecimal("550000.00"));
        when(notificationRepository.existsByFamilyUuidAndTypeAndYearMonth(
                eq(familyUuid), eq(NotificationType.BUDGET_50_EXCEEDED), any(String.class)))
                .thenReturn(true); // 이미 존재

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("예산이 0이면 알림이 생성되지 않는다")
    void shouldNotCreateNotification_WhenBudgetIsZero() {
        // Given
        Family noBudgetFamily = Family.builder()
                .uuid(familyUuid)
                .name("예산 미설정 가족")
                .monthlyBudget(BigDecimal.ZERO)
                .status(FamilyStatus.ACTIVE)
                .build();

        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.of(noBudgetFamily));

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        verify(expenseRepository, never()).sumAmountByFamilyUuidAndDateBetween(any(), any(), any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("가족이 존재하지 않으면 알림이 생성되지 않는다")
    void shouldNotCreateNotification_WhenFamilyNotFound() {
        // Given
        when(familyRepository.findActiveByUuid(familyUuid)).thenReturn(Optional.empty());

        // When
        budgetAlertService.checkAndCreateBudgetAlert(familyUuid, now);

        // Then
        verify(expenseRepository, never()).sumAmountByFamilyUuidAndDateBetween(any(), any(), any());
        verify(notificationRepository, never()).save(any());
    }
}

