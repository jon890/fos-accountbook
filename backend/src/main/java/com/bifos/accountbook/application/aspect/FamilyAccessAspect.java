package com.bifos.accountbook.application.aspect;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.application.service.FamilyValidationService;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.FamilyUuid;
import com.bifos.accountbook.presentation.annotation.UserUuid;
import com.bifos.accountbook.presentation.annotation.ValidateFamilyAccess;
import java.lang.annotation.Annotation;
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
 *   <li><b>사용자 UUID</b>: CustomUuid 타입 (필수)
 *     <ul>
 *       <li>권장: {@link UserUuid @UserUuid} 애노테이션 사용</li>
 *       <li>하위 호환: 파라미터 이름이 "userUuid"인 경우 자동 인식</li>
 *     </ul>
 *   </li>
 *   <li><b>가족 UUID</b>: CustomUuid 타입 (필수)
 *     <ul>
 *       <li>권장: {@link FamilyUuid @FamilyUuid} 애노테이션 사용</li>
 *       <li>하위 호환: 파라미터 이름이 "familyUuid"인 경우 자동 인식</li>
 *     </ul>
 *   </li>
 * </ul>
 *
 * @see ValidateFamilyAccess
 * @see UserUuid
 * @see FamilyUuid
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

    // 파라미터 추출: 한 번의 루프로 두 파라미터 모두 찾기
    // 1순위: 애노테이션 기반 추출 (@UserUuid, @FamilyUuid)
    // 2순위: 파라미터 이름 기반 추출 (하위 호환성)
    CustomUuid userUuid = null;
    CustomUuid familyUuid = null;

    for (int i = 0; i < parameters.length; i++) {
      Parameter param = parameters[i];
      if (!param.getType().equals(CustomUuid.class)) {
        continue;
      }

      // 애노테이션 확인
      Annotation[] annotations = param.getAnnotations();
      boolean hasUserUuidAnnotation = false;
      boolean hasFamilyUuidAnnotation = false;

      for (Annotation annotation : annotations) {
        if (annotation.annotationType().equals(UserUuid.class)) {
          hasUserUuidAnnotation = true;
        } else if (annotation.annotationType().equals(FamilyUuid.class)) {
          hasFamilyUuidAnnotation = true;
        }
      }

      // 애노테이션 기반 추출 (우선순위 높음)
      // 중복 애노테이션 감지: 이미 값이 있으면 예외 발생
      if (hasUserUuidAnnotation) {
        if (userUuid != null) {
          throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                                      "@ValidateFamilyAccess: @UserUuid 애노테이션이 여러 파라미터에 중복 사용되었습니다")
              .addParameter("method", method.getName());
        }
        userUuid = (CustomUuid) args[i];
      } else if (hasFamilyUuidAnnotation) {
        if (familyUuid != null) {
          throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                                      "@ValidateFamilyAccess: @FamilyUuid 애노테이션이 여러 파라미터에 중복 사용되었습니다")
              .addParameter("method", method.getName());
        }
        familyUuid = (CustomUuid) args[i];
      } else {
        // 애노테이션이 없으면 파라미터 이름으로 추출 (하위 호환성)
        String paramName = param.getName();
        if ("userUuid".equals(paramName) && userUuid == null) {
          userUuid = (CustomUuid) args[i];
        } else if ("familyUuid".equals(paramName) && familyUuid == null) {
          familyUuid = (CustomUuid) args[i];
        }
      }

      // 두 파라미터를 모두 찾으면 루프 종료
      if (userUuid != null && familyUuid != null) {
        break;
      }
    }

    // 필수 파라미터 검증
    if (userUuid == null) {
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                                  "@ValidateFamilyAccess: 'userUuid' 파라미터(CustomUuid)가 필요합니다")
          .addParameter("method", method.getName());
    }

    if (familyUuid == null) {
      throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                                  "@ValidateFamilyAccess: 'familyUuid' 파라미터(CustomUuid)가 필요합니다")
          .addParameter("method", method.getName());
    }

    // 권한 검증
    familyValidationService.validateFamilyAccess(userUuid, familyUuid);
  }
}

