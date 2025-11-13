package com.bifos.accountbook.application.aspect;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.application.service.FamilyValidationService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

/**
 * 가족 접근 권한 검증 AOP
 *
 * <p>{@link ValidateFamilyAccess} 애노테이션이 붙은 메서드 실행 전에
 * 사용자의 가족 접근 권한을 자동으로 검증합니다.</p>
 *
 * <h3>검증 로직</h3>
 * <ol>
 *   <li>메서드 파라미터에서 <b>userUuid</b>와 <b>familyUuid</b>를 추출</li>
 *   <li>FamilyValidationService를 통해 권한 확인</li>
 *   <li>권한이 없으면 BusinessException 발생</li>
 * </ol>
 *
 * <h3>파라미터 요구사항</h3>
 * <ul>
 *   <li><b>userUuid</b>: CustomUuid 타입 (필수)</li>
 *   <li><b>familyUuid</b>: String 타입 (필수)</li>
 * </ul>
 *
 * @see ValidateFamilyAccess
 * @see FamilyValidationService
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class FamilyAccessAspect {

  private final FamilyValidationService familyValidationService;

  /**
   * @ValidateFamilyAccess 애노테이션이 붙은 메서드 실행 전에 권한 검증
   *
   * @param joinPoint 메서드 실행 지점
   * @throws BusinessException 권한이 없거나 필수 파라미터가 없는 경우
   */
  @Before("@annotation(validateFamilyAccess)")
  public void validateFamilyAccess(JoinPoint joinPoint, ValidateFamilyAccess validateFamilyAccess) throws BusinessException {
    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
    Method method = signature.getMethod();
    Object[] args = joinPoint.getArgs();
    Parameter[] parameters = method.getParameters();

    // 1. userUuid 파라미터 찾기
    CustomUuid userUuid = null;
    for (int i = 0; i < parameters.length; i++) {
      if ("userUuid".equals(parameters[i].getName())
          && parameters[i].getType().equals(CustomUuid.class)) {
        userUuid = (CustomUuid) args[i];
        break;
      }
    }

    if (userUuid == null) {
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                                  "@ValidateFamilyAccess: 'userUuid' 파라미터(CustomUuid)가 필요합니다")
          .addParameter("method", method.getName());
    }

    // 2. familyUuid 파라미터 찾기
    String familyUuidStr = null;
    for (int i = 0; i < parameters.length; i++) {
      if ("familyUuid".equals(parameters[i].getName())
          && parameters[i].getType().equals(String.class)) {
        familyUuidStr = (String) args[i];
        break;
      }
    }

    if (familyUuidStr == null) {
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                                  "@ValidateFamilyAccess: 'familyUuid' 파라미터(String)가 필요합니다")
          .addParameter("method", method.getName());
    }

    // 3. 권한 검증
    CustomUuid familyUuid = CustomUuid.from(familyUuidStr);
    familyValidationService.validateFamilyAccess(userUuid, familyUuid);
  }
}

