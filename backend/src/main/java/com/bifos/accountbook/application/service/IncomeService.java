package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.income.CreateIncomeRequest;
import com.bifos.accountbook.application.dto.income.IncomeResponse;
import com.bifos.accountbook.application.dto.income.IncomeSearchRequest;
import com.bifos.accountbook.application.dto.income.UpdateIncomeRequest;
import com.bifos.accountbook.common.exception.BusinessException;
import com.bifos.accountbook.common.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Income;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.IncomeRepository;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.IncomeStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FamilyValidationService familyValidationService;

    /**
     * 수입 생성
     */
    @Transactional
    public IncomeResponse createIncome(CustomUuid userUuid, String familyUuid, CreateIncomeRequest request) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);
        CustomUuid categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());

        // 사용자 확인
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                        .addParameter("userUuid", userUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

        // 카테고리 확인
        Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                        .addParameter("categoryUuid", categoryCustomUuid.toString()));

        if (!category.getFamilyUuid().equals(familyCustomUuid)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "해당 가족의 카테고리가 아닙니다")
                    .addParameter("categoryFamilyUuid", category.getFamilyUuid().toString())
                    .addParameter("requestFamilyUuid", familyCustomUuid.toString());
        }

        // 수입 생성
        Income income = Income.builder()
                .familyUuid(familyCustomUuid)
                .categoryUuid(categoryCustomUuid)
                .userUuid(user.getUuid())
                .amount(request.getAmount())
                .description(request.getDescription())
                .date(request.getDate() != null ? request.getDate() : LocalDateTime.now())
                .build();

        income = incomeRepository.save(income);
        
        // 카테고리 정보와 함께 반환하기 위해 다시 조회
        income.setCategory(category);
        
        log.info("Created income: {} in family: {} by user: {}", income.getUuid(), familyUuid, userUuid);

        return IncomeResponse.from(income);
    }

    /**
     * 가족의 수입 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<IncomeResponse> getFamilyIncomes(CustomUuid userUuid, String familyUuid, int page, int size) {
        IncomeSearchRequest searchRequest = IncomeSearchRequest.builder()
                .page(page)
                .size(size)
                .build();
        return getFamilyIncomes(userUuid, familyUuid, searchRequest);
    }

    /**
     * 가족의 수입 목록 조회 (페이징 + 필터링)
     */
    @Transactional(readOnly = true)
    public Page<IncomeResponse> getFamilyIncomes(
            CustomUuid userUuid,
            String familyUuid,
            IncomeSearchRequest searchRequest) {
        CustomUuid familyCustomUuid = CustomUuid.from(familyUuid);

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, familyCustomUuid);

        // 페이징 설정
        Pageable pageable = PageRequest.of(
                searchRequest.getPage(),
                searchRequest.getSize(),
                Sort.by(Sort.Direction.DESC, "date"));

        // 필터링이 있으면 필터링 메서드 사용, 없으면 기본 메서드 사용
        Page<Income> incomes;
        CustomUuid categoryUuid = searchRequest.getCategoryUuid() != null ?
                CustomUuid.from(searchRequest.getCategoryUuid()) : null;

        if (categoryUuid != null || searchRequest.getStartDate() != null || searchRequest.getEndDate() != null) {
            incomes = incomeRepository.findByFamilyUuidWithFilters(
                    familyCustomUuid, categoryUuid,
                    searchRequest.getStartDate(), searchRequest.getEndDate(), pageable);
        } else {
            incomes = incomeRepository.findAllByFamilyUuid(familyCustomUuid, pageable);
        }

        return incomes.map(IncomeResponse::from);
    }

    /**
     * 수입 상세 조회
     */
    @Transactional(readOnly = true)
    public IncomeResponse getIncome(CustomUuid userUuid, String incomeUuid) {
        CustomUuid incomeCustomUuid = CustomUuid.from(incomeUuid);

        Income income = incomeRepository.findActiveByUuid(incomeCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.INCOME_NOT_FOUND)
                        .addParameter("incomeUuid", incomeCustomUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, income.getFamilyUuid());

        return IncomeResponse.from(income);
    }

    /**
     * 수입 수정
     */
    @Transactional
    public IncomeResponse updateIncome(CustomUuid userUuid, String incomeUuid, UpdateIncomeRequest request) {
        CustomUuid incomeCustomUuid = CustomUuid.from(incomeUuid);

        Income income = incomeRepository.findActiveByUuid(incomeCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.INCOME_NOT_FOUND)
                        .addParameter("incomeUuid", incomeCustomUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, income.getFamilyUuid());

        // 카테고리 변경
        if (request.getCategoryUuid() != null) {
            CustomUuid categoryCustomUuid = CustomUuid.from(request.getCategoryUuid());
            Category category = categoryRepository.findActiveByUuid(categoryCustomUuid)
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND)
                            .addParameter("categoryUuid", categoryCustomUuid.toString()));

            if (!category.getFamilyUuid().equals(income.getFamilyUuid())) {
                throw new BusinessException(ErrorCode.ACCESS_DENIED, "해당 가족의 카테고리가 아닙니다")
                        .addParameter("categoryFamilyUuid", category.getFamilyUuid().toString())
                        .addParameter("incomeFamilyUuid", income.getFamilyUuid().toString());
            }

            income.setCategoryUuid(categoryCustomUuid);
        }

        // 금액 변경
        if (request.getAmount() != null) {
            income.setAmount(request.getAmount());
        }

        // 설명 변경
        if (request.getDescription() != null) {
            income.setDescription(request.getDescription());
        }

        // 날짜 변경
        if (request.getDate() != null) {
            income.setDate(request.getDate());
        }

        // 더티 체킹으로 자동 업데이트
        log.info("Updated income: {} by user: {}", incomeUuid, userUuid);

        return IncomeResponse.from(income);
    }

    /**
     * 수입 삭제 (Soft Delete)
     */
    @Transactional
    public void deleteIncome(CustomUuid userUuid, String incomeUuid) {
        CustomUuid incomeCustomUuid = CustomUuid.from(incomeUuid);

        Income income = incomeRepository.findActiveByUuid(incomeCustomUuid)
                .orElseThrow(() -> new BusinessException(ErrorCode.INCOME_NOT_FOUND)
                        .addParameter("incomeUuid", incomeCustomUuid.toString()));

        // 권한 확인
        familyValidationService.validateFamilyAccess(userUuid, income.getFamilyUuid());

        income.setStatus(IncomeStatus.DELETED);
        // 더티 체킹으로 자동 업데이트

        log.info("Deleted income: {} by user: {}", incomeUuid, userUuid);
    }
}

