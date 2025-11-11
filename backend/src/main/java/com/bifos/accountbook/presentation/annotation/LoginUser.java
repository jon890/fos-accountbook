package com.bifos.accountbook.presentation.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 로그인한 사용자 정보를 주입받기 위한 애노테이션
 * 컨트롤러 메서드의 파라미터에 사용하여 인증된 사용자의 UUID를 받을 수 있습니다.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface LoginUser {
}

