package com.bifos.accountbook.presentation.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 가족 접근 권한을 검증하는 애노테이션
 *
 * <p>메서드 실행 전에 사용자가 해당 가족의 멤버인지 자동으로 확인합니다.
 * 권한이 없으면 BusinessException(NOT_FAMILY_MEMBER)을 발생시킵니다.</p>
 *
 * <h3>사용 예시</h3>
 * <pre>
 * {@code
 * @ValidateFamilyAccess
 * public ExpenseResponse createExpense(CustomUuid userUuid, String familyUuid, CreateExpenseRequest request) {
 *   // familyUuid 파라미터가 자동으로 권한 검증됨
 * }
 * }
 * </pre>
 *
 * <h3>파라미터 이름 규칙</h3>
 * <ul>
 *   <li><b>userUuid</b>: 사용자 UUID (CustomUuid 타입, 필수)</li>
 *   <li><b>familyUuid</b>: 가족 UUID (String 타입, 필수)</li>
 * </ul>
 *
 * @see com.bifos.accountbook.application.aspect.FamilyAccessAspect
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidateFamilyAccess {
  // 기본적으로 "familyUuid" 파라미터를 찾아서 검증
  // 추후 확장 가능: @ValidateFamilyAccess(paramName = "customFamilyUuid")
}

