package com.bifos.accountbook.presentation.resolver;

import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.presentation.annotation.LoginUser;
import com.bifos.accountbook.presentation.dto.LoginUserDto;

import lombok.extern.slf4j.Slf4j;

/**
 * @LoginUser 애노테이션이 붙은 파라미터에 로그인한 사용자 정보를 주입하는 ArgumentResolver
 * 
 *            SecurityContext에서 Authentication 객체를 가져와 principal(userUuid)을
 *            추출합니다.
 */
@Slf4j
@Component
public class LoginUserArgumentResolver implements HandlerMethodArgumentResolver {

    /**
     * 이 resolver가 해당 파라미터를 처리할 수 있는지 판단
     * 
     * @LoginUser 애노테이션이 있고, 타입이 LoginUserDto인 경우 true 반환
     */
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        boolean hasLoginUserAnnotation = parameter.hasParameterAnnotation(LoginUser.class);
        boolean isLoginUserDtoType = LoginUserDto.class.isAssignableFrom(parameter.getParameterType());

        return hasLoginUserAnnotation && isLoginUserDtoType;
    }

    /**
     * 실제로 파라미터에 주입할 객체를 생성
     * SecurityContext에서 인증된 사용자의 UUID를 추출하여 LoginUserDto로 반환
     */
    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            log.warn("Authentication is null in SecurityContext");
            throw new IllegalStateException("인증 정보가 없습니다");
        }

        // NextAuthTokenFilter에서 설정한 principal(userUuid)을 가져옴
        Object principal = authentication.getPrincipal();

        if (principal == null || !(principal instanceof String)) {
            log.warn("Principal is not a String: {}", principal);
            throw new IllegalStateException("인증 정보가 올바르지 않습니다");
        }

        String userUuidString = (String) principal;
        log.debug("Resolved userUuid from authentication: {}", userUuidString);

        // CustomUuid로 변환하여 LoginUserDto 생성
        return new LoginUserDto(CustomUuid.from(userUuidString));
    }
}
