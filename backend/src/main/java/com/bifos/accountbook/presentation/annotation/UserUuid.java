package com.bifos.accountbook.presentation.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 사용자 UUID 파라미터를 표시하는 애노테이션
 *
 * <p>{@link ValidateFamilyAccess} 애노테이션이 붙은 메서드에서
 * 사용자 UUID 파라미터를 명시적으로 표시하기 위해 사용합니다.</p>
 *
 * <h3>사용 예시</h3>
 * <pre>
 * {@code
 * @ValidateFamilyAccess
 * public ExpenseResponse createExpense(@UserUuid CustomUuid userId, @FamilyUuid CustomUuid familyId, ...) {
 *   // 파라미터 이름이 달라도 정상 작동
 * }
 * }
 * </pre>
 *
 * @see ValidateFamilyAccess
 * @see FamilyUuid
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface UserUuid {
}

